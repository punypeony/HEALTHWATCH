"""Scan steps and atomic transactions against the real PostgreSQL test DB."""
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import Mock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, func, select
from sqlalchemy.exc import SQLAlchemyError

from app import routes, scan
from app.auth import create_access_token, get_session
from app.errors import ApiError
from app.main import app
from app.models import Alert, Dependent, DietaryProfile, MealLog, ScannedProduct, User

BARCODE = '9876543210123'


@pytest.fixture
def client(db_session, monkeypatch):
    monkeypatch.setenv('JWT_SECRET', 'scan-test-secret-at-least-32-bytes-long')
    app.dependency_overrides[get_session] = lambda: db_session
    try:
        with TestClient(app, raise_server_exceptions=False) as client:
            yield client
    finally:
        app.dependency_overrides.clear()


@pytest.fixture
def dependent(db_session):
    user = User(name='Scanner', email='scanner@example.test', password_hash='unused')
    dep = Dependent(caregiver=user, name='Relative', age=40, height_cm=170,
                    weight_kg=70, sex='male')
    db_session.add(dep)
    db_session.commit()
    return dep


@pytest.fixture
def headers(client, dependent):
    return {'Authorization': 'Bearer ' + create_access_token(dependent.caregiver_id)}


@pytest.fixture
def product():
    return dict(barcode=BARCODE, name='Test food', calories=Decimal('100'),
                sodium_mg=Decimal('100'), sugar_g=Decimal('2'),
                raw_response={'product': {'allergens_tags': []}})


@pytest.fixture(autouse=True)
def lookup(monkeypatch, product):
    mock = Mock(return_value=product)
    monkeypatch.setattr(routes, 'fetch_product', mock)
    # An accidental network call should fail rather than depend on internet.
    monkeypatch.setattr('httpx.get', Mock(side_effect=AssertionError('Unexpected network')))
    return mock


@pytest.mark.parametrize('case,label', [
    ('safe', 'safe'), ('warning', 'warning'), ('allergy', 'danger'),
    ('hypertension', 'danger'), ('diabetic', 'danger'), ('sodium', 'danger'),
    ('sugar', 'danger'), ('calories', 'danger'),
])
def test_scan_results_and_persistence(client, headers, dependent, db_session, product, case, label):
    profile = dependent.dietary_profile
    if case in ('hypertension', 'diabetic'):
        profile.conditions = [case]
        db_session.commit()
    if case == 'diabetic':
        product['raw_response']['product']['nutriments'] = {'carbohydrates_100g': 1}
    if case == 'allergy':
        profile.allergies = ['Milk']
        db_session.commit()
        product['raw_response']['product']['allergens_tags'] = ['en:MILK', 'en:soy']
    if case in ('warning', 'sodium', 'hypertension'):
        factor = {'warning': '.85', 'sodium': '1.2', 'hypertension': '.6'}[case]
        product['sodium_mg'] = profile.daily_sodium_mg * Decimal(factor)
    if case in ('sugar', 'diabetic'):
        factor = '1.2' if case == 'sugar' else '.6'
        product['sugar_g'] = (profile.daily_sugar_g * Decimal(factor)).quantize(Decimal('.01'))
    if case == 'calories':
        product['calories'] = profile.daily_calories * Decimal('1.2')
    response = client.post(f'/dependents/{dependent.id}/scan', headers=headers, json={'barcode': BARCODE})
    assert response.status_code == 200, response.text
    data = response.json()
    assert set(data) == {'risk_label', 'product', 'percentages', 'reasons', 'meal_log_id', 'alert_id'}
    assert data['risk_label'] == label
    assert data['percentages']['sodium_pct'] == pytest.approx(float(product['sodium_mg'] / profile.daily_sodium_mg))
    assert data['product']['barcode'] == BARCODE and data['reasons']
    meal = db_session.get(MealLog, data['meal_log_id'])
    assert meal.dependent_id == dependent.id and meal.risk_label == label
    assert meal.risk_reasons == data['reasons']
    assert meal.product.barcode == BARCODE
    if label == 'safe':
        assert data['alert_id'] is None
        assert db_session.scalar(select(func.count()).select_from(Alert)) == 0
    else:
        alert = db_session.get(Alert, data['alert_id'])
        assert alert.meal_log_id == meal.id and alert.dependent_id == dependent.id
        assert alert.status == 'active' and alert.message == ' '.join(data['reasons'])
    assert client.get(f'/dependents/{dependent.id}/meals', headers=headers).json()[0]['id'] == meal.id


@pytest.mark.parametrize('status,code', [(404, 'PRODUCT_NOT_FOUND'), (504, 'FOOD_LOOKUP_TIMEOUT'),
                                        (502, 'FOOD_LOOKUP_FAILED'), (422, 'PRODUCT_DATA_INVALID')])
def test_lookup_failures_write_nothing(client, headers, dependent, db_session, lookup, status, code):
    lookup.side_effect = ApiError(status, code, 'Lookup failed.')
    response = client.post(f'/dependents/{dependent.id}/scan', headers=headers, json={'barcode': BARCODE})
    assert response.status_code == status
    assert response.json() == {'error': {'code': code, 'message': 'Lookup failed.'}}
    assert db_session.scalar(select(func.count()).select_from(MealLog)) == 0
    assert db_session.scalar(select(func.count()).select_from(Alert)) == 0


def test_missing_profile(client, headers, dependent, db_session, lookup):
    db_session.execute(delete(DietaryProfile).where(DietaryProfile.dependent_id == dependent.id))
    db_session.commit()
    response = client.post(f'/dependents/{dependent.id}/scan', headers=headers, json={'barcode': BARCODE})
    assert response.status_code == 409
    assert response.json()['error']['code'] == 'DIETARY_PROFILE_MISSING'
    lookup.assert_not_called()


def test_ownership_checked_before_lookup(client, headers, dependent, db_session, lookup):
    other = User(name='Other', email='scan-other@example.test', password_hash='unused')
    db_session.add(other)
    db_session.commit()
    foreign_headers = {'Authorization': 'Bearer ' + create_access_token(other.id)}
    responses = [client.post(f'/dependents/{id}/scan', headers=foreign_headers,
                            json={'barcode': BARCODE}) for id in (dependent.id, 2147483647)]
    assert all(response.status_code == 403 for response in responses)
    assert responses[0].json() == responses[1].json()
    assert client.post(f'/dependents/{dependent.id}/scan', json={'barcode': BARCODE}).status_code == 401
    lookup.assert_not_called()


@pytest.mark.parametrize('payload', [{}, {'barcode': 12345678}, {'barcode': '123'},
    {'barcode': '1234567x'}, {'barcode': BARCODE, 'caregiver_id': 1}])
def test_scan_input_validation(client, headers, dependent, lookup, payload):
    response = client.post(f'/dependents/{dependent.id}/scan', headers=headers, json=payload)
    assert response.status_code == 422
    assert response.json()['error']['code'] == 'VALIDATION_ERROR'
    lookup.assert_not_called()


@pytest.mark.parametrize('failure', ['alert', 'commit'])
def test_atomic_rollback(client, headers, dependent, db_session, product, failure):
    product['sodium_mg'] = Decimal('1700')  # warning, requires an alert
    if failure == 'alert':
        target, method = routes, 'create_alert_if_needed'
    else:
        target, method = db_session, 'commit'
    with patch.object(target, method, side_effect=SQLAlchemyError('private failure')):
        response = client.post(f'/dependents/{dependent.id}/scan', headers=headers, json={'barcode': BARCODE})
    assert response.status_code == 503, response.text
    assert response.json()['error']['code'] == 'DATABASE_ERROR'
    for model in (MealLog, Alert, ScannedProduct):
        assert db_session.scalar(select(func.count()).select_from(model)) == 0


def test_scan_steps_directly(db_session, dependent, product):
    assert scan.validate_scan_input(BARCODE, dependent) == BARCODE
    percentages = scan.calculate_product_percentages(product, dependent.dietary_profile)
    assert percentages['sodium_pct'] == .05
    stored = scan.store_scan_product(db_session, product)
    assert scan.store_scan_product(db_session, product).id == stored.id
    safe = {'risk_label': 'safe', 'reasons': ['Classifier result.']}
    meal = scan.create_meal_log(db_session, dependent.id, stored.id, safe)
    assert scan.create_alert_if_needed(db_session, meal) is None
    assert scan.return_scan_result(product, percentages, safe, meal, None).alert_id is None
    danger = {'risk_label': 'danger', 'reasons': ['High sodium.']}
    meal = scan.create_meal_log(db_session, dependent.id, stored.id, danger)
    alert = scan.create_alert_if_needed(db_session, meal)
    assert scan.return_scan_result(product, percentages, danger, meal, alert).alert_id == alert.id
    with pytest.raises(ApiError):
        scan.store_scan_product(db_session, {**product, 'sugar_g': 10})


@pytest.mark.parametrize('tags,expected', [(['EN:Milk', 'en:soy'], 1),
    ('en:milk,en:soy', 1), (['en:milk-chocolate'], 0), ([], 0)])
def test_structured_allergy_matching(tags, expected):
    assert scan.check_allergy_match([' MILK '], {'product': {'allergens_tags': tags}}) == expected
    assert scan.check_allergy_match(['milk'], {'product': {'allergens': 'en:milk,en:soy'}}) == 1
    assert scan.check_allergy_match(['milk'], {'product': {'ingredients_text': 'milk'}}) == 0


@pytest.mark.parametrize('condition,sodium,sugar,expected', [
    ('Hypertension', .6, .1, 1), ('diabetic', .1, .6, 1),
    ('hypertension', .1, .6, 0), ('diabetic', .6, .1, 0),
    ('hypertension', .5, .1, 0), ('diabetic', .1, .5, 0), ('other', 1, 1, 0)])
def test_condition_thresholds(condition, sodium, sugar, expected):
    assert scan.check_condition_conflict([condition], {'sodium_pct': sodium, 'sugar_pct': sugar}) == expected


def test_high_cholesterol_uses_saturated_fat_threshold():
    percentages = {'sodium_pct': 0.1, 'sugar_pct': 0.1}
    assert scan.check_condition_conflict(['High Cholesterol'], percentages, 0.6) == 1
    assert scan.check_condition_conflict(['high cholesterol'], percentages, 0.5) == 0
    assert scan.check_condition_conflict([], percentages, 0.9) == 0


def test_prepared_per_100g_supplies_condition_nutrients():
    raw = {'product': {'nutrition_data_prepared_per': '100g', 'nutriments': {
        'saturated-fat_prepared_100g': 20, 'carbohydrates_prepared_100g': 200,
        'proteins_prepared_100g': 8.75, 'vitamin-a_prepared_100g': 0, 'fiber_prepared_100g': 4}}}
    percentages = {'sodium_pct': 0.1, 'sugar_pct': 0.1}
    profile = SimpleNamespace(daily_calories=2000)
    assert scan.saturated_fat_per_100g(raw) == Decimal('20')
    assert scan.carbohydrate_per_100g(raw) == Decimal('200')
    assert scan.require_protein_per_100g(raw) == Decimal('8.75')
    assert scan.check_condition_conflict(
        ['high cholesterol'], percentages, scan.saturated_fat_percentage(raw, profile)) == 1
    assert scan.check_condition_conflict(
        ['diabetic'], percentages, carbohydrate_pct=scan.carbohydrate_percentage(raw, profile)) == 1
    assert scan.check_condition_conflict(['kidney disease'], percentages) == 0


def test_recorded_per_100g_wins_over_prepared_condition_nutrients():
    raw = {'product': {'nutrition_data_prepared_per': '100g', 'nutriments': {
        'saturated-fat_100g': 1, 'saturated-fat_prepared_100g': 10,
        'carbohydrates_100g': 2, 'carbohydrates_prepared_100g': 62.5,
        'proteins_100g': 3, 'proteins_prepared_100g': 8.75}}}
    assert scan.saturated_fat_per_100g(raw) == Decimal('1')
    assert scan.carbohydrate_per_100g(raw) == Decimal('2')
    assert scan.require_protein_per_100g(raw) == Decimal('3')


@pytest.mark.parametrize('basis', ['100ml', '100 ml'])
def test_prepared_condition_milliliters_are_not_grams(basis):
    raw = {'product': {'nutrition_data_prepared_per': basis, 'nutriments': {
        'saturated-fat_prepared_100g': 10, 'carbohydrates_prepared_100g': 62.5,
        'proteins_prepared_100g': 8.75}}}
    for reader, label in ((scan.saturated_fat_per_100g, 'Saturated fat'),
                          (scan.carbohydrate_per_100g, 'Carbohydrate'),
                          (scan.require_protein_per_100g, 'Protein')):
        with pytest.raises(ApiError) as error:
            reader(raw)
        assert error.value.code == 'PRODUCT_DATA_INVALID'
        assert error.value.message == f'{label} per 100 g is missing or invalid.'


def test_missing_prepared_condition_nutrient_is_not_zero():
    raw = {'product': {'nutrition_data_prepared_per': '100g', 'nutriments': {}}}
    with pytest.raises(ApiError) as error:
        scan.require_protein_per_100g(raw)
    assert error.value.code == 'PRODUCT_DATA_INVALID'
    assert error.value.message == 'Protein per 100 g is missing or invalid.'


def test_missing_saturated_fat_is_not_zero():
    with pytest.raises(ApiError) as error:
        scan.saturated_fat_per_100g({'product': {'nutriments': {}}})
    assert error.value.code == 'PRODUCT_DATA_INVALID'
    with pytest.raises(ApiError):
        scan.saturated_fat_per_100g({'product': {'nutriments': {'saturated-fat_100g': -1}}})


@pytest.mark.parametrize('age,band', [(0, 'child'), (11, 'child'), (12, 'adult'),
                                    (65, 'adult'), (66, 'elderly'), (120, 'elderly')])
def test_age_bands(age, band):
    assert scan.age_band_for(age) == band


def test_step_validation(product):
    with pytest.raises(ApiError):
        scan.validate_scan_input('bad', SimpleNamespace(dietary_profile=None))
    with pytest.raises(ApiError):
        scan.validate_scan_input(BARCODE, SimpleNamespace(dietary_profile=None))
    with pytest.raises(ApiError):
        scan.check_allergy_match(['milk'], {'product': {'allergens_tags': [123]}})
    profile = SimpleNamespace(daily_sodium_mg=0, daily_sugar_g=1, daily_calories=1)
    with pytest.raises(ApiError):
        scan.calculate_product_percentages(product, profile)
    profile.daily_sodium_mg = 2000
    with pytest.raises(ApiError):
        scan.calculate_product_percentages({**product, 'sodium_mg': None}, profile)


def test_demo_scan_offline(client, headers, dependent, monkeypatch, db_session):
    from app.food_lookup import fetch_product
    monkeypatch.setenv('DEMO_MODE', 'true')
    monkeypatch.setattr(routes, 'fetch_product', fetch_product)
    for _ in range(2):
        response = client.post(f'/dependents/{dependent.id}/scan', headers=headers,
                               json={'barcode': '2000000000015'})
        assert response.status_code == 200, response.text
        assert response.json()['risk_label'] == 'safe'
    assert db_session.scalar(select(func.count()).select_from(ScannedProduct)) == 1
    assert db_session.scalar(select(func.count()).select_from(MealLog)) == 2


def test_classroom_demo_barcodes_stay_offline(client, db_session, monkeypatch):
    from seed import DEMO_EMAIL, seed_demo
    from app.food_lookup import fetch_product
    monkeypatch.setenv('DEMO_MODE', 'true')
    monkeypatch.setattr(routes, 'fetch_product', fetch_product)
    caregiver = seed_demo(db_session)
    db_session.commit()
    dependent = next(dep for dep in caregiver.dependents if dep.name == 'Demo Hypertension')
    headers = {'Authorization': 'Bearer ' + create_access_token(caregiver.id)}
    expected = {
        '2000000000015': ('safe', None),
        '2000000000022': ('warning', "Sugar is high compared with the dependent's daily target."),
        '2000000000039': ('danger', 'Sodium conflicts with the recorded hypertension condition.'),
    }
    for barcode, (label, reason) in expected.items():
        response = client.post(f'/dependents/{dependent.id}/scan', headers=headers, json={'barcode': barcode})
        assert response.status_code == 200, response.text
        body = response.json()
        assert body['risk_label'] == label
        assert body['product']['barcode'] == barcode
        if label == 'safe':
            assert body['alert_id'] is None
        else:
            assert body['alert_id'] is not None
            assert reason in body['reasons']
            assert 'The product conflicts with a recorded dietary condition.' not in body['reasons']
        if barcode == '2000000000039':
            assert "Sodium exceeds the dependent's daily target." in body['reasons']
            assert 'saturated_fat_g' not in body and 'carbohydrate_g' not in body and 'protein_g' not in body
    meals = client.get(f'/dependents/{dependent.id}/meals', headers=headers)
    alerts = client.get(f'/dependents/{dependent.id}/alerts', headers=headers)
    summary = client.get(f'/dependents/{dependent.id}/summary/weekly', headers=headers)
    assert meals.status_code == alerts.status_code == summary.status_code == 200
    assert [meal['risk_label'] for meal in meals.json()] == ['danger', 'warning', 'safe']
    assert len(alerts.json()) == 2
    assert summary.json()['danger_count'] == 1
    assert summary.json()['common_reason'] == 'sodium'
    assert summary.json()['text'] == '1 danger-level scan this week, mostly sodium-related.'
    assert db_session.scalar(select(User.email).where(User.email == DEMO_EMAIL)) == DEMO_EMAIL


def test_no_cholesterol_scan_ignores_missing_fat(client, headers, dependent):
    response = client.post(f'/dependents/{dependent.id}/scan', headers=headers, json={'barcode': BARCODE})
    assert response.status_code == 200, response.text
    assert response.json()['risk_label'] in ('safe', 'warning', 'danger')


def test_high_cholesterol_danger_and_missing_fat(client, headers, dependent, db_session, product, lookup):
    from app.targets import daily_saturated_fat_g
    profile = dependent.dietary_profile
    profile.conditions = ['high cholesterol']
    db_session.commit()
    missing = client.post(f'/dependents/{dependent.id}/scan', headers=headers, json={'barcode': BARCODE})
    assert missing.status_code == 422
    assert missing.json()['error']['code'] == 'PRODUCT_DATA_INVALID'
    assert set(missing.json()['error']) == {'code', 'message'}
    assert db_session.scalar(select(func.count()).select_from(MealLog)) == 0
    grams = float(daily_saturated_fat_g(profile.daily_calories) * Decimal('0.85'))
    product['raw_response'] = {'product': {'nutriments': {'saturated-fat_100g': grams}, 'allergens_tags': []}}
    lookup.return_value = product
    found = client.post(f'/dependents/{dependent.id}/scan', headers=headers, json={'barcode': BARCODE})
    assert found.status_code == 200, found.text
    body = found.json()
    assert body['risk_label'] == 'danger'
    assert 'Saturated fat conflicts with the recorded high cholesterol condition.' in body['reasons']
    assert 'The product conflicts with a recorded dietary condition.' not in body['reasons']
    assert any(reason.startswith('Saturated fat') for reason in body['reasons'])
    assert body['saturated_fat_g'] == pytest.approx(grams)
    assert 'carbohydrate_g' not in body and 'protein_g' not in body
    assert body['alert_id'] is not None
    half = float(daily_saturated_fat_g(profile.daily_calories) * Decimal('0.5'))
    product['barcode'] = '4444444444444'
    product['raw_response'] = {'product': {'nutriments': {'saturated-fat_100g': half}, 'allergens_tags': []}}
    lookup.return_value = product
    borderline = client.post(f'/dependents/{dependent.id}/scan', headers=headers, json={'barcode': product['barcode']})
    assert borderline.status_code == 200, borderline.text
    assert 'saturated_fat_g' not in borderline.json()
    assert 'Saturated fat conflicts with the recorded high cholesterol condition.' not in borderline.json()['reasons']


def test_carbohydrate_and_protein_rules(client, headers, dependent, db_session, product, lookup):
    from app.targets import daily_carbohydrate_g
    profile = dependent.dietary_profile
    plain = client.post(f'/dependents/{dependent.id}/scan', headers=headers, json={'barcode': BARCODE})
    assert plain.status_code == 200, plain.text

    profile.conditions = ['diabetic']
    db_session.commit()
    missing_carb = client.post(f'/dependents/{dependent.id}/scan', headers=headers, json={'barcode': BARCODE})
    assert missing_carb.status_code == 422
    assert missing_carb.json()['error']['code'] == 'PRODUCT_DATA_INVALID'
    assert set(missing_carb.json()['error']) == {'code', 'message'}
    assert db_session.scalar(select(func.count()).select_from(MealLog)) == 1

    grams = float(daily_carbohydrate_g(profile.daily_calories) * Decimal('0.85'))
    product['barcode'] = '1111111111116'
    product['raw_response'] = {'product': {'nutriments': {'carbohydrates_100g': grams}, 'allergens_tags': []}}
    product['sugar_g'] = Decimal('1')
    lookup.return_value = product
    danger = client.post(f'/dependents/{dependent.id}/scan', headers=headers, json={'barcode': product['barcode']})
    assert danger.status_code == 200, danger.text
    body = danger.json()
    assert body['risk_label'] == 'danger'
    assert 'Carbohydrate conflicts with the recorded diabetic condition.' in body['reasons']
    assert 'The product conflicts with a recorded dietary condition.' not in body['reasons']
    assert any(reason.startswith('Carbohydrate') for reason in body['reasons'])
    assert body['carbohydrate_g'] == pytest.approx(grams)
    assert 'saturated_fat_g' not in body and 'protein_g' not in body

    profile.conditions = ['kidney disease']
    db_session.commit()
    product['barcode'] = '2222222222222'
    product['raw_response'] = {'product': {'nutriments': {}, 'allergens_tags': []}}
    missing_protein = client.post(f'/dependents/{dependent.id}/scan', headers=headers, json={'barcode': product['barcode']})
    assert missing_protein.status_code == 422
    assert missing_protein.json()['error']['code'] == 'PRODUCT_DATA_INVALID'
    meals_after_missing = db_session.scalar(select(func.count()).select_from(MealLog))

    product['barcode'] = '3333333333338'
    product['raw_response'] = {'product': {'nutriments': {'proteins_100g': 30}, 'allergens_tags': []}}
    product['calories'] = Decimal('50')
    product['sodium_mg'] = Decimal('10')
    product['sugar_g'] = Decimal('1')
    present = client.post(f'/dependents/{dependent.id}/scan', headers=headers, json={'barcode': product['barcode']})
    assert present.status_code == 200, present.text
    assert present.json()['risk_label'] != 'danger'
    assert not any('protein' in reason.lower() for reason in present.json()['reasons'])
    assert 'protein_g' not in present.json()
    assert db_session.scalar(select(func.count()).select_from(MealLog)) == meals_after_missing + 1


def test_adult_protein_limit_and_child_exception(client, headers, dependent, db_session, product, lookup):
    from app.ml.predict import PROTEIN_LIMIT_REASON
    from app.targets import daily_protein_g
    profile = dependent.dietary_profile
    ignored = client.post(f'/dependents/{dependent.id}/scan', headers=headers, json={'barcode': BARCODE})
    assert ignored.status_code == 200, ignored.text
    assert 'protein_g' not in ignored.json()
    assert not any('protein' in reason.lower() for reason in ignored.json()['reasons'])

    profile.conditions = ['kidney disease']
    db_session.commit()
    product['barcode'] = '5555555555557'
    product['raw_response'] = {'product': {'nutriments': {}, 'allergens_tags': []}}
    lookup.return_value = product
    meals_before = db_session.scalar(select(func.count()).select_from(MealLog))
    missing = client.post(f'/dependents/{dependent.id}/scan', headers=headers, json={'barcode': product['barcode']})
    assert missing.status_code == 422
    assert missing.json()['error']['code'] == 'PRODUCT_DATA_INVALID'
    assert db_session.scalar(select(func.count()).select_from(MealLog)) == meals_before

    daily = daily_protein_g(dependent.weight_kg)
    product['barcode'] = '6666666666660'
    product['calories'] = Decimal('50')
    product['sodium_mg'] = Decimal('10')
    product['sugar_g'] = Decimal('1')
    product['raw_response'] = {'product': {'nutriments': {'proteins_100g': float(daily / 2)}, 'allergens_tags': []}}
    half = client.post(f'/dependents/{dependent.id}/scan', headers=headers, json={'barcode': product['barcode']})
    assert half.status_code == 200, half.text
    assert half.json()['risk_label'] != 'danger'
    assert 'protein_g' not in half.json()
    assert 'Protein conflicts with the recorded kidney disease condition.' not in half.json()['reasons']

    above = float(daily * Decimal('0.6'))
    product['barcode'] = '7777777777777'
    product['raw_response'] = {'product': {'nutriments': {'proteins_100g': above}, 'allergens_tags': []}}
    danger = client.post(f'/dependents/{dependent.id}/scan', headers=headers, json={'barcode': product['barcode']})
    assert danger.status_code == 200, danger.text
    body = danger.json()
    assert body['risk_label'] == 'danger'
    assert 'Protein conflicts with the recorded kidney disease condition.' in body['reasons']
    assert PROTEIN_LIMIT_REASON in body['reasons']
    assert 'The product conflicts with a recorded dietary condition.' not in body['reasons']
    assert body['protein_g'] == pytest.approx(above)
    assert 'saturated_fat_g' not in body and 'carbohydrate_g' not in body

    dependent.age = 11
    db_session.commit()
    product['barcode'] = '8888888888884'
    product['raw_response'] = {'product': {'nutriments': {'proteins_100g': float(daily)}, 'allergens_tags': []}}
    child = client.post(f'/dependents/{dependent.id}/scan', headers=headers, json={'barcode': product['barcode']})
    assert child.status_code == 200, child.text
    child_body = child.json()
    assert child_body['risk_label'] != 'danger'
    assert 'protein_g' not in child_body
    assert 'Protein conflicts with the recorded kidney disease condition.' not in child_body['reasons']
    assert PROTEIN_LIMIT_REASON not in child_body['reasons']
    assert scan.check_condition_conflict(
        ['kidney disease'], {'sodium_pct': 0.1, 'sugar_pct': 0.1}, protein_pct=0.6) == 1
    assert scan.check_condition_conflict(
        ['kidney disease'], {'sodium_pct': 0.1, 'sugar_pct': 0.1}, protein_pct=0.5) == 0
    assert scan.reported_grams(Decimal('60'), 0.6) == 60
    assert scan.reported_grams(Decimal('45.5'), 0.5) is None
