"""Small steps used by the scan route; writes never commit independently."""
from decimal import Decimal, InvalidOperation

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from app.errors import ApiError
from app.food_lookup import nutrition_number, prepared_basis_is_100g, serving_grams, validate_barcode
from app.ml.predict import CONFLICT_THRESHOLD
from app.targets import daily_carbohydrate_g, daily_protein_g, daily_saturated_fat_g
from app.models import Alert, MealLog, ScannedProduct
from app.schemas import ScanOutput


def require_dietary_profile(dependent):
    if dependent.dietary_profile is None:
        raise ApiError(409, 'DIETARY_PROFILE_MISSING', 'The dependent needs a dietary profile before scanning.')


def validate_scan_input(barcode, dependent):
    barcode = validate_barcode(barcode)
    require_dietary_profile(dependent)
    return barcode


def calculate_product_percentages(product, profile) -> dict[str, float]:
    percentages = {}
    for nutrient, target, key in (
        ('sodium_mg', 'daily_sodium_mg', 'sodium_pct'),
        ('sugar_g', 'daily_sugar_g', 'sugar_pct'),
        ('calories', 'daily_calories', 'calorie_pct'),
    ):
        try:
            value, daily = Decimal(str(product[nutrient])), Decimal(str(getattr(profile, target)))
            if not value.is_finite() or value < 0:
                raise ValueError
            if not daily.is_finite() or daily <= 0:
                raise ApiError(409, 'DIETARY_PROFILE_INVALID', 'Daily targets must be positive and finite.')
            percentages[key] = float(value / daily)
        except (KeyError, InvalidOperation, ValueError, TypeError) as exc:
            raise ApiError(422, 'PRODUCT_DATA_INVALID', 'Required product nutrition is invalid.') from exc
    return percentages


def check_allergy_match(allergies, raw_response) -> int:
    """Match structured OFF allergen tags/field, never free-text ingredients.

    Missing allergen declarations mean no *recorded* match, not allergy safety.
    Language prefixes are removed; substring matching is intentionally avoided.
    """
    product = raw_response.get('product', {})
    if not isinstance(product, dict):
        raise ApiError(422, 'PRODUCT_DATA_INVALID', 'Product allergen data is invalid.')
    tags = product.get('allergens_tags')
    if tags is None:
        tags = product.get('allergens', '')
    if isinstance(tags, str):
        tags = tags.split(',')
    if not isinstance(tags, list) or any(not isinstance(tag, str) for tag in tags):
        raise ApiError(422, 'PRODUCT_DATA_INVALID', 'Product allergen data is invalid.')
    wanted = {value.strip().lower().split(':', 1)[-1].strip() for value in allergies}
    present = {value.strip().lower().split(':', 1)[-1].strip() for value in tags}
    return int(bool((wanted & present) - {''}))


def has_condition(conditions, name: str) -> bool:
    return name in {value.strip().lower() for value in conditions}


def has_high_cholesterol(conditions) -> bool:
    return has_condition(conditions, 'high cholesterol')


def _nutrient_grams(raw_response, key: str, label: str) -> Decimal:
    """Grams per 100 g. Missing values are not zero.

    An absent per-100 g key may use the matching prepared per-100 g key when
    Open Food Facts says that prepared basis is 100 g.
    """
    product = raw_response.get('product') if isinstance(raw_response, dict) else None
    nutrients = product.get('nutriments') if isinstance(product, dict) else None
    value = nutrients.get(key) if isinstance(nutrients, dict) else None
    if value is None and isinstance(nutrients, dict) and key.endswith('_100g') and prepared_basis_is_100g(product):
        value = nutrients.get(key[:-len('_100g')] + '_prepared_100g')
    if value is None:
        raise ApiError(422, 'PRODUCT_DATA_INVALID', f'{label} per 100 g is missing or invalid.')
    try:
        return nutrition_number(value)
    except ApiError as exc:
        raise ApiError(422, 'PRODUCT_DATA_INVALID', f'{label} per 100 g is missing or invalid.') from exc


def saturated_fat_per_100g(raw_response) -> Decimal:
    return _nutrient_grams(raw_response, 'saturated-fat_100g', 'Saturated fat')


def saturated_fat_percentage(raw_response, profile) -> float:
    return float(saturated_fat_per_100g(raw_response) / daily_saturated_fat_g(profile.daily_calories))


def carbohydrate_per_100g(raw_response) -> Decimal:
    return _nutrient_grams(raw_response, 'carbohydrates_100g', 'Carbohydrate')


def carbohydrate_percentage(raw_response, profile) -> float:
    return float(carbohydrate_per_100g(raw_response) / daily_carbohydrate_g(profile.daily_calories))


def require_protein_per_100g(raw_response) -> Decimal:
    """Kidney disease requires a protein value. Missing values are not zero."""
    return _nutrient_grams(raw_response, 'proteins_100g', 'Protein')


def protein_percentage(raw_response, weight_kg) -> float:
    """Protein per 100 g divided by the 1.3 g/kg adult ceiling."""
    return float(require_protein_per_100g(raw_response) / daily_protein_g(weight_kg))


def reported_grams(grams, percentage) -> float | None:
    """Expose per-100 g grams only after that nutrient crosses the conflict line."""
    if grams is None or percentage is None or percentage <= CONFLICT_THRESHOLD:
        return None
    return float(grams)


def check_condition_conflict(conditions, percentages, saturated_fat_pct=None, carbohydrate_pct=None,
                             protein_pct=None) -> int:
    """Condition rules above half of the matching daily target."""
    normalized = {value.strip().lower() for value in conditions}
    cholesterol = (has_high_cholesterol(normalized)
                   and saturated_fat_pct is not None
                   and saturated_fat_pct > CONFLICT_THRESHOLD)
    carbohydrate = ('diabetic' in normalized
                    and carbohydrate_pct is not None
                    and carbohydrate_pct > CONFLICT_THRESHOLD)
    protein = ('kidney disease' in normalized
               and protein_pct is not None
               and protein_pct > CONFLICT_THRESHOLD)
    return int(('hypertension' in normalized and percentages['sodium_pct'] > CONFLICT_THRESHOLD)
               or ('diabetic' in normalized and percentages['sugar_pct'] > CONFLICT_THRESHOLD)
               or cholesterol or carbohydrate or protein)


def age_band_for(age) -> str:
    return 'child' if age < 12 else 'elderly' if age > 65 else 'adult'


def store_scan_product(session, product) -> ScannedProduct:
    """Link live cached products, or insert offline demo products atomically.

    Never overwrite a product already referenced by historical meals. Refuse a
    conflicting demo/cache record instead of storing a result against other data.
    """
    session.execute(insert(ScannedProduct).values(**product)
                    .on_conflict_do_nothing(index_elements=['barcode']))
    cached = session.scalar(select(ScannedProduct).where(ScannedProduct.barcode == product['barcode']))
    if any(getattr(cached, key) != product[key] for key in
           ('name', 'calories', 'sodium_mg', 'sugar_g', 'raw_response')):
        raise ApiError(409, 'PRODUCT_CACHE_CONFLICT', 'Cached product differs from lookup data.')
    return cached


def optional_serving_grams(raw_response) -> float | None:
    """Prefill only an explicit gram serving. Milliliters and missing sizes stay blank."""
    product = raw_response.get('product') if isinstance(raw_response, dict) else None
    if not isinstance(product, dict):
        return None
    try:
        return float(serving_grams(product))
    except ApiError:
        return None


def create_meal_log(session, dependent_id, product_id, prediction) -> MealLog:
    meal = MealLog(dependent_id=dependent_id, scanned_product_id=product_id,
                   risk_label=prediction['risk_label'], risk_reasons=prediction['reasons'],
                   eaten=False, grams_eaten=None)
    session.add(meal)
    session.flush()
    return meal


def create_alert_if_needed(session, meal) -> Alert | None:
    if meal.risk_label == 'safe':
        return None
    alert = Alert(dependent_id=meal.dependent_id, meal_log_id=meal.id,
                  message=' '.join(meal.risk_reasons), status='active')
    session.add(alert)
    session.flush()
    return alert


def return_scan_result(product, percentages, prediction, meal, alert,
                       saturated_fat_g=None, carbohydrate_g=None, protein_g=None) -> ScanOutput:
    # Validate and copy response before committing; no lazy DB reads afterwards.
    return ScanOutput(**prediction,
                      product={key: product[key] for key in
                               ('barcode', 'name', 'calories', 'sodium_mg', 'sugar_g')},
                      percentages=percentages, meal_log_id=meal.id,
                      alert_id=alert.id if alert else None,
                      saturated_fat_g=saturated_fat_g, carbohydrate_g=carbohydrate_g,
                      protein_g=protein_g,
                      serving_grams=optional_serving_grams(product.get('raw_response')))
