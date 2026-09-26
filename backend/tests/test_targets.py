from decimal import Decimal
import pytest
from app.targets import compute_daily_targets, daily_protein_g


def test_adult_equation_and_condition_adjustments():
    assert compute_daily_targets(40, 170, 70, 'male', []) == {
        'daily_calories': Decimal('1881.00'), 'daily_sodium_mg': Decimal('2000.00'),
        'daily_sugar_g': Decimal('47.03')}
    targets = compute_daily_targets(40, 170, 70, 'female', [' HYPERTENSION ', 'DIABETIC'])
    assert targets == {'daily_calories': Decimal('1681.80'),
                       'daily_sodium_mg': Decimal('1400.00'), 'daily_sugar_g': Decimal('21.02')}


@pytest.mark.parametrize('age,sodium', [(0, 1600), (11, 1600), (12, 2000), (65, 2000), (66, 1500), (120, 1500)])
def test_age_boundaries(age, sodium):
    targets = compute_daily_targets(age, 170, 70, 'male', [])
    bmr = Decimal('1767.5') - 5 * age
    factor = Decimal('0.8') if age < 12 else Decimal(2200) / 2600 if age > 65 else 1
    assert targets['daily_calories'] == (bmr * Decimal('1.2') * factor).quantize(Decimal('0.01'))
    assert targets['daily_sodium_mg'] == sodium
    assert all(value > 0 for value in targets.values())


@pytest.mark.parametrize('kwargs', [dict(age=-1), dict(age=121), dict(age=2.5), dict(age=True),
    dict(height_cm=0), dict(weight_kg=-1), dict(weight_kg='NaN'), dict(height_cm='Infinity'),
    dict(height_cm='invalid'), dict(sex='unknown'), dict(age=120, height_cm=1, weight_kg=1)])
def test_invalid_inputs(kwargs):
    values = dict(age=40, height_cm=170, weight_kg=70, sex='male', conditions=[])
    values.update(kwargs)
    with pytest.raises(ValueError):
        compute_daily_targets(**values)


@pytest.mark.parametrize('age,height,weight,sex,conditions,expected', [
    (40, 170, 70, 'male', [], ('2000.00', '47.03', '1881.00')),
    (40, 170, 70, 'male', ['Hypertension'], ('1400.00', '47.03', '1881.00')),
    (10, 140, 35, 'female', ['Diabetic'], ('1600.00', '12.17', '973.44')),
    (70, 170, 70, 'male', [], ('1500.00', '35.98', '1439.31')),
    (70, 170, 70, 'female', [], ('1500.00', '30.04', '1201.44')),
], ids=['adult', 'hypertensive-adult', 'diabetic-child', 'elderly-male', 'elderly-female'])
def test_required_scenarios_are_positive_and_deterministic(age, height, weight, sex, conditions, expected):
    args = (age, height, weight, sex, conditions)
    result = compute_daily_targets(*args)
    assert result == dict(zip(('daily_sodium_mg', 'daily_sugar_g', 'daily_calories'), map(Decimal, expected)))
    assert all(value > 0 for value in result.values())
    assert compute_daily_targets(*args) == result
    assert compute_daily_targets(age, height, weight, sex, [c.lower() for c in conditions]) == result


def test_condition_reductions_against_same_person_without_conditions():
    adult = compute_daily_targets(40, 170, 70, 'male', [])
    hypertensive = compute_daily_targets(40, 170, 70, 'male', ['hypertension'])
    assert hypertensive['daily_sodium_mg'] == adult['daily_sodium_mg'] * Decimal('0.70')
    assert hypertensive['daily_calories'] == adult['daily_calories']
    child = compute_daily_targets(10, 140, 35, 'female', [])
    diabetic = compute_daily_targets(10, 140, 35, 'female', ['diabetic'])
    assert diabetic['daily_sugar_g'] == child['daily_sugar_g'] / 2
    assert diabetic['daily_calories'] == child['daily_calories']
    assert diabetic['daily_sodium_mg'] == child['daily_sodium_mg']


def test_daily_protein_uses_kdigo_ceiling():
    assert daily_protein_g(70) == Decimal('91.0')
    assert daily_protein_g(Decimal('70')) == Decimal('1.3') * 70
    with pytest.raises(ValueError):
        daily_protein_g(0)
