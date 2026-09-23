"""Small steps used by the scan route; writes never commit independently."""
from decimal import Decimal, InvalidOperation

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from app.errors import ApiError
from app.food_lookup import validate_barcode
from app.ml.predict import CONFLICT_THRESHOLD
from app.models import Alert, MealLog, ScannedProduct
from app.schemas import ScanOutput


def validate_scan_input(barcode, dependent):
    barcode = validate_barcode(barcode)
    if dependent.dietary_profile is None:
        raise ApiError(409, 'DIETARY_PROFILE_MISSING', 'The dependent needs a dietary profile before scanning.')
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


def check_condition_conflict(conditions, percentages) -> int:
    """Project rule: hypertension/sodium or diabetic/sugar above 50% per 100g."""
    conditions = {value.strip().lower() for value in conditions}
    return int(('hypertension' in conditions and percentages['sodium_pct'] > CONFLICT_THRESHOLD)
               or ('diabetic' in conditions and percentages['sugar_pct'] > CONFLICT_THRESHOLD))


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


def create_meal_log(session, dependent_id, product_id, prediction) -> MealLog:
    meal = MealLog(dependent_id=dependent_id, scanned_product_id=product_id,
                   risk_label=prediction['risk_label'], risk_reasons=prediction['reasons'])
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


def return_scan_result(product, percentages, prediction, meal, alert) -> ScanOutput:
    # Validate and copy response before committing; no lazy DB reads afterwards.
    return ScanOutput(**prediction,
                      product={key: product[key] for key in
                               ('barcode', 'name', 'calories', 'sodium_mg', 'sugar_g')},
                      percentages=percentages, meal_log_id=meal.id,
                      alert_id=alert.id if alert else None)
