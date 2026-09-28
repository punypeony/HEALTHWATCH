"""Daily intake from meals the caregiver marked eaten, scaled by grams eaten."""
from datetime import date
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy import Date, cast, func, select
from sqlalchemy.orm import Session, selectinload

from app.errors import ApiError
from app.models import MealLog
from app.scan import carbohydrate_per_100g, require_protein_per_100g, saturated_fat_per_100g, has_condition
from app.targets import daily_carbohydrate_g, daily_protein_g, daily_saturated_fat_g

# Philippine local day. The weekly summary stays on UTC.
INTAKE_TIMEZONE = 'Asia/Manila'
HUNDRED = Decimal(100)


def local_today(session: Session) -> date:
    return session.scalar(select(cast(func.timezone(INTAKE_TIMEZONE, func.now()), Date)))


def intake_date(session: Session, requested: date | None) -> date:
    return local_today(session) if requested is None else requested


def scale_per_100g(per_100g: Decimal, grams_eaten: Decimal) -> Decimal:
    return per_100g * grams_eaten / HUNDRED


def _amount(value: Decimal) -> float:
    return float(value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))


def _percentage(consumed: Decimal, limit: Decimal) -> float:
    return _amount(consumed / limit * 100)


def _calorie_row(consumed: Decimal, target: Decimal, incomplete: bool) -> dict:
    if incomplete:
        return {'consumed': None, 'target': _amount(target), 'remaining': None,
                'percentage': None, 'exceeded': None, 'incomplete': True}
    rounded = consumed.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    return {
        'consumed': float(rounded),
        'target': _amount(target),
        'remaining': float(max(target - rounded, Decimal(0))),
        'percentage': _percentage(rounded, target),
        'exceeded': rounded > target,
    }


def _limit_row(consumed: Decimal, limit: Decimal, incomplete: bool) -> dict:
    if incomplete:
        return {'consumed': None, 'limit': _amount(limit), 'percentage': None,
                'exceeded': None, 'incomplete': True}
    rounded = consumed.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    return {
        'consumed': float(rounded),
        'limit': _amount(limit),
        'percentage': _percentage(rounded, limit),
        'exceeded': rounded > limit,
    }


def _applicable(dependent) -> dict[str, Decimal]:
    profile = dependent.dietary_profile
    if profile is None:
        raise ApiError(409, 'DIETARY_PROFILE_MISSING', 'The dependent needs a dietary profile before scanning.')
    limits = {
        'calories': Decimal(str(profile.daily_calories)),
        'sodium': Decimal(str(profile.daily_sodium_mg)),
        'sugar': Decimal(str(profile.daily_sugar_g)),
    }
    if has_condition(profile.conditions, 'diabetic'):
        limits['carbohydrates'] = daily_carbohydrate_g(profile.daily_calories)
    if has_condition(profile.conditions, 'high cholesterol'):
        limits['saturated_fat'] = daily_saturated_fat_g(profile.daily_calories)
    if has_condition(profile.conditions, 'kidney disease') and dependent.age >= 12:
        limits['protein'] = daily_protein_g(dependent.weight_kg)
    return limits


def _meal_amount(meal: MealLog, nutrient: str) -> Decimal:
    product = meal.product
    grams = Decimal(str(meal.grams_eaten))
    if nutrient == 'calories':
        return scale_per_100g(Decimal(str(product.calories)), grams)
    if nutrient == 'sodium':
        return scale_per_100g(Decimal(str(product.sodium_mg)), grams)
    if nutrient == 'sugar':
        return scale_per_100g(Decimal(str(product.sugar_g)), grams)
    raw = product.raw_response
    if nutrient == 'carbohydrates':
        return scale_per_100g(carbohydrate_per_100g(raw), grams)
    if nutrient == 'saturated_fat':
        return scale_per_100g(saturated_fat_per_100g(raw), grams)
    if nutrient == 'protein':
        return scale_per_100g(require_protein_per_100g(raw), grams)
    raise ValueError(nutrient)


def daily_intake(session: Session, dependent, requested: date | None) -> dict:
    """Sum eaten meals for one Philippine local date. Missing nutrients stay missing."""
    day = intake_date(session, requested)
    limits = _applicable(dependent)
    totals = {nutrient: Decimal(0) for nutrient in limits}
    incomplete = set()
    meals = session.scalars(
        select(MealLog).where(
            MealLog.dependent_id == dependent.id,
            MealLog.eaten.is_(True),
            MealLog.grams_eaten > 0,
            cast(func.timezone(INTAKE_TIMEZONE, MealLog.created_at), Date) == day,
        ).options(selectinload(MealLog.product))
    ).all()
    for meal in meals:
        for nutrient in limits:
            if nutrient in incomplete:
                continue
            try:
                totals[nutrient] += _meal_amount(meal, nutrient)
            except ApiError:
                incomplete.add(nutrient)
    nutrients = {}
    for nutrient, limit in limits.items():
        if nutrient == 'calories':
            nutrients[nutrient] = _calorie_row(totals[nutrient], limit, nutrient in incomplete)
        else:
            nutrients[nutrient] = _limit_row(totals[nutrient], limit, nutrient in incomplete)
    return {'dependent_id': dependent.id, 'date': day, 'nutrients': nutrients}
