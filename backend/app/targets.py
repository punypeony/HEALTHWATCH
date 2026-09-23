"""Shared, deterministic course-project targets; not clinical prescriptions.

Mifflin-St Jeor is an adult equation; applying it to children is a course
requirement, not a validated pediatric assessment. Age factors below are explicit
project approximations derived from reference energy values, not published
multipliers for this equation. See docs/database.md for limitations.
"""
from collections.abc import Sequence
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

ACTIVITY_MULTIPLIER = Decimal('1.2')  # Project sedentary baseline assumption.
BASE_SODIUM_MG = Decimal('2000')
# NHLBI Table 5-1: sedentary girls 9-13 upper value 1600 vs women 19-30
# upper value 2000. Course uses this representative ratio for its child band.
# https://www.nhlbi.nih.gov/sites/default/files/publications/12-7486.pdf
CHILD_CALORIE_FACTOR = Decimal('0.8')
CHILD_SODIUM_FACTOR = CHILD_CALORIE_FACTOR
# WHO: children's sodium is scaled down with energy requirements.
# https://www.who.int/news-room/fact-sheets/detail/sodium-reduction
# NIA inactive older women: 1600; inactive older men: 2000-2200.
# Ratios to NHLBI young adult upper values (2000 female, 2600 male).
# https://order.nia.nih.gov/sites/default/files/2019-10/Healthy-Eating-2019-update-508.pdf
ELDERLY_CALORIE_FACTORS = {'female': Decimal('1600') / 2000,
                           'male': Decimal('2200') / 2600}
# AHA optimal sodium goal 1500 mg for most adults. The course adopts this
# stricter reference for its elderly band: 1500 / baseline 2000 = 0.75.
# https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/sodium/how-much-sodium-should-i-eat-per-day
ELDERLY_SODIUM_FACTOR = Decimal('0.75')
HYPERTENSION_FACTOR = Decimal('0.7')
DIABETIC_FACTOR = Decimal('0.5')
FREE_SUGAR_ENERGY_FRACTION = Decimal('0.10')
SUGAR_KCAL_PER_GRAM = Decimal('4')


def compute_daily_targets(
    age: int,
    height_cm: Decimal | float | int,
    weight_kg: Decimal | float | int,
    sex: str,
    conditions: Sequence[str],
) -> dict[str, Decimal]:
    """Return daily mg sodium, g free sugar, and kcal as positive Decimals.

    Apply activity, then age adjustments, then condition reductions. Round only
    final targets (half up, two decimal places). Invalid physical inputs raise
    ValueError rather than silently substituting a minimum calorie allowance.
    """
    if isinstance(age, bool) or not isinstance(age, int) or not 0 <= age <= 120:
        raise ValueError('Age must be a whole number between 0 and 120.')
    sex = sex.strip().lower()
    if sex not in {'male', 'female'}:
        raise ValueError('Sex must be male or female for the target equation.')
    try:
        height, weight = Decimal(str(height_cm)), Decimal(str(weight_kg))
    except InvalidOperation as exc:
        raise ValueError('Height and weight must be positive finite numbers.') from exc
    if any(not v.is_finite() or v <= 0 for v in (height, weight)):
        raise ValueError('Height and weight must be positive finite numbers.')
    normalized = {value.strip().lower() for value in conditions}
    bmr = 10 * weight + Decimal('6.25') * height - 5 * age
    bmr += 5 if sex == 'male' else -161
    calories = bmr * ACTIVITY_MULTIPLIER
    sodium = BASE_SODIUM_MG
    if age < 12:
        calories *= CHILD_CALORIE_FACTOR
        sodium *= CHILD_SODIUM_FACTOR
    elif age > 65:
        calories *= ELDERLY_CALORIE_FACTORS[sex]
        sodium *= ELDERLY_SODIUM_FACTOR
    if 'hypertension' in normalized:
        sodium *= HYPERTENSION_FACTOR
    sugar = calories * FREE_SUGAR_ENERGY_FRACTION / SUGAR_KCAL_PER_GRAM
    if 'diabetic' in normalized:
        sugar *= DIABETIC_FACTOR
    targets = {key: value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
               for key, value in [('daily_sodium_mg', sodium),
                                  ('daily_sugar_g', sugar), ('daily_calories', calories)]}
    if any(value <= 0 for value in targets.values()):
        raise ValueError('Physical measurements produce non-positive targets.')
    return targets
