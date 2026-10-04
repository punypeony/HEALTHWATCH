"""Daily intake counts only meals marked eaten, scaled by grams eaten."""
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
from zoneinfo import ZoneInfo

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.auth import create_access_token, get_session
from app.main import app
from app.models import Alert, Dependent, MealLog, ScannedProduct, User
from app.intake import scale_per_100g
from app.scan import optional_serving_grams
from app.targets import daily_carbohydrate_g, daily_protein_g, daily_saturated_fat_g

MANILA = ZoneInfo('Asia/Manila')
BARCODE = '4567890123456'


def manila_noon(offset_days=0) -> datetime:
    day = (datetime.now(MANILA) + timedelta(days=offset_days)).date()
    return datetime(day.year, day.month, day.day, 12, tzinfo=MANILA)


@pytest.fixture
def client(db_session, monkeypatch):
    monkeypatch.setenv('JWT_SECRET', 'intake-test-secret-at-least-32-bytes')
    app.dependency_overrides[get_session] = lambda: db_session
    try:
        with TestClient(app, raise_server_exceptions=False) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()


@pytest.fixture
def dependent(db_session):
    user = User(name='Caregiver', email='intake@example.test', password_hash='unused')
    dep = Dependent(caregiver=user, name='Relative', age=40, height_cm=170, weight_kg=70, sex='male')
    db_session.add(dep)
    db_session.commit()
    return dep


@pytest.fixture
def headers(dependent):
    return {'Authorization': 'Bearer ' + create_access_token(dependent.caregiver_id)}


@pytest.fixture
def product():
    return dict(barcode=BARCODE, name='Measured Food', calories=Decimal('350'),
                sodium_mg=Decimal('200'), sugar_g=Decimal('10'),
                raw_response={'product': {'allergens_tags': [], 'serving_size': '80 g'}})


@pytest.fixture(autouse=True)
def lookup(monkeypatch, product):
    from unittest.mock import Mock
    from app import routes
    mock = Mock(return_value=product)
    monkeypatch.setattr(routes, 'fetch_product', mock)
    return mock


def intake(client, headers, dependent_id, day=None):
    path = f'/dependents/{dependent_id}/daily-intake'
    if day is not None:
        path += f'?date={day}'
    response = client.get(path, headers=headers)
    assert response.status_code == 200, response.text
    return response.json()


def scan(client, headers, dependent_id, barcode=BARCODE):
    response = client.post(f'/dependents/{dependent_id}/scan', headers=headers, json={'barcode': barcode})
    assert response.status_code == 200, response.text
    return response.json()


def eat(client, headers, meal_id, grams):
    return client.patch(f'/meals/{meal_id}', headers=headers, json={'grams_eaten': grams})


def test_scan_without_eaten_adds_nothing(client, headers, dependent, db_session):
    body = scan(client, headers, dependent.id)
    assert body['risk_label'] in ('safe', 'warning', 'danger')
    assert 'serving_grams' in body and body['serving_grams'] == 80
    meal = db_session.get(MealLog, body['meal_log_id'])
    assert meal.eaten is False and meal.grams_eaten is None
    report = intake(client, headers, dependent.id)
    assert report['date'] == datetime.now(MANILA).date().isoformat()
    assert set(report['nutrients']) == {'calories', 'sodium', 'sugar'}
    assert report['nutrients']['calories']['consumed'] == 0
    assert report['nutrients']['sodium']['consumed'] == 0
    assert 'fat' not in report['nutrients'] and 'fiber' not in report['nutrients']
    assert 'total_fat' not in report['nutrients']


def test_eaten_grams_scale_and_sum(client, headers, dependent, db_session, product, lookup):
    first = scan(client, headers, dependent.id)
    saved = eat(client, headers, first['meal_log_id'], 100)
    assert saved.status_code == 200, saved.text
    assert saved.json()['eaten'] is True
    assert saved.json()['grams_eaten'] == 100
    assert saved.json()['risk_label'] == first['risk_label']
    report = intake(client, headers, dependent.id)
    assert report['nutrients']['calories']['consumed'] == 350
    assert report['nutrients']['sodium']['consumed'] == 200
    assert report['nutrients']['sugar']['consumed'] == 10
    assert report['nutrients']['calories']['exceeded'] is False
    assert report['nutrients']['calories']['remaining'] == pytest.approx(
        float(dependent.dietary_profile.daily_calories) - 350)
    assert 'limit' not in report['nutrients']['calories']
    assert 'target' not in report['nutrients']['sodium']

    product['barcode'] = '5678901234567'
    lookup.return_value = product
    second = scan(client, headers, dependent.id, product['barcode'])
    half = eat(client, headers, second['meal_log_id'], 50)
    assert half.status_code == 200
    summed = intake(client, headers, dependent.id)
    assert summed['nutrients']['calories']['consumed'] == 525
    assert summed['nutrients']['sodium']['consumed'] == 300

    product['barcode'] = '6789012345678'
    lookup.return_value = product
    skipped = scan(client, headers, dependent.id, product['barcode'])
    assert db_session.get(MealLog, skipped['meal_log_id']).eaten is False
    assert intake(client, headers, dependent.id)['nutrients']['calories']['consumed'] == 525


def test_missing_grams_does_not_mark_eaten(client, headers, dependent, db_session):
    body = scan(client, headers, dependent.id)
    for payload in ({}, {'grams_eaten': 0}, {'grams_eaten': -5}):
        rejected = client.patch(f"/meals/{body['meal_log_id']}", headers=headers, json=payload)
        assert rejected.status_code == 422
        assert set(rejected.json()['error']) == {'code', 'message'}
    meal = db_session.get(MealLog, body['meal_log_id'])
    assert meal.eaten is False and meal.grams_eaten is None
    assert intake(client, headers, dependent.id)['nutrients']['calories']['consumed'] == 0


def test_other_days_and_dependents_stay_separate(client, headers, dependent, db_session):
    body = scan(client, headers, dependent.id)
    assert eat(client, headers, body['meal_log_id'], 100).status_code == 200
    meal = db_session.get(MealLog, body['meal_log_id'])
    meal.created_at = manila_noon(-1)
    db_session.commit()
    assert intake(client, headers, dependent.id)['nutrients']['calories']['consumed'] == 0
    yesterday = manila_noon(-1).date().isoformat()
    assert intake(client, headers, dependent.id, yesterday)['nutrients']['calories']['consumed'] == 350

    other = User(name='Other', email='intake-other@example.test', password_hash='unused')
    other_dep = Dependent(caregiver=other, name='Other Relative', age=30, height_cm=160,
                          weight_kg=60, sex='female')
    db_session.add(other_dep)
    db_session.commit()
    other_headers = {'Authorization': 'Bearer ' + create_access_token(other.id)}
    forbidden = client.get(f'/dependents/{dependent.id}/daily-intake', headers=other_headers)
    assert forbidden.status_code == 403
    assert set(forbidden.json()['error']) == {'code', 'message'}
    foreign_meal = client.patch(f"/meals/{body['meal_log_id']}", headers=other_headers, json={'grams_eaten': 20})
    assert foreign_meal.status_code == 403
    assert intake(client, other_headers, other_dep.id)['nutrients']['calories']['consumed'] == 0
    assert set(intake(client, other_headers, other_dep.id)['nutrients']) == {'calories', 'sodium', 'sugar'}


def test_condition_limits_and_missing_values(client, headers, dependent, db_session, product, lookup):
    profile = dependent.dietary_profile
    profile.conditions = ['diabetic', 'high cholesterol', 'kidney disease']
    db_session.commit()
    product['raw_response'] = {'product': {'allergens_tags': [], 'nutriments': {
        'carbohydrates_100g': 40, 'saturated-fat_100g': 5, 'proteins_100g': 20,
        'fat_100g': 18, 'fiber_100g': 4}}}
    lookup.return_value = product
    body = scan(client, headers, dependent.id)
    assert eat(client, headers, body['meal_log_id'], 50).status_code == 200
    report = intake(client, headers, dependent.id)
    assert set(report['nutrients']) == {
        'calories', 'sodium', 'sugar', 'carbohydrates', 'saturated_fat', 'protein'}
    assert report['nutrients']['carbohydrates']['consumed'] == 20
    carb_limit = daily_carbohydrate_g(profile.daily_calories)
    assert report['nutrients']['carbohydrates']['limit'] == float(
        carb_limit.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
    assert report['nutrients']['saturated_fat']['consumed'] == 2.5
    fat_limit = daily_saturated_fat_g(profile.daily_calories)
    assert report['nutrients']['saturated_fat']['limit'] == float(
        fat_limit.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
    assert report['nutrients']['protein']['consumed'] == 10
    protein_limit = daily_protein_g(dependent.weight_kg)
    assert report['nutrients']['protein']['limit'] == float(
        protein_limit.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
    assert 'remaining' not in report['nutrients']['protein']
    assert 'fat' not in report['nutrients'] and 'fiber' not in report['nutrients']

    stored = ScannedProduct(barcode='7890123456785', name='No Carbohydrate', calories=100,
                            sodium_mg=10, sugar_g=1, raw_response={'product': {'nutriments': {}}})
    gap = MealLog(dependent_id=dependent.id, product=stored, risk_label='safe', risk_reasons=['ok'],
                  eaten=True, grams_eaten=Decimal('40'), created_at=manila_noon())
    db_session.add(gap)
    db_session.commit()
    incomplete = intake(client, headers, dependent.id)
    assert incomplete['nutrients']['carbohydrates']['incomplete'] is True
    assert incomplete['nutrients']['carbohydrates']['consumed'] is None
    assert incomplete['nutrients']['calories']['consumed'] == 215
    assert incomplete['nutrients']['saturated_fat']['incomplete'] is True
    assert incomplete['nutrients']['protein']['incomplete'] is True

    dependent.age = 11
    db_session.commit()
    child = intake(client, headers, dependent.id)
    assert 'protein' not in child['nutrients']
    assert 'carbohydrates' in child['nutrients']


def test_danger_can_be_marked_eaten_without_changing_the_risk(client, headers, dependent, db_session, product):
    profile = dependent.dietary_profile
    profile.conditions = ['hypertension']
    db_session.commit()
    product['sodium_mg'] = profile.daily_sodium_mg
    body = scan(client, headers, dependent.id)
    assert body['risk_label'] == 'danger'
    alert_id = body['alert_id']
    saved = eat(client, headers, body['meal_log_id'], 40)
    assert saved.status_code == 200
    assert saved.json()['risk_label'] == 'danger'
    meal = db_session.get(MealLog, body['meal_log_id'])
    alert = db_session.get(Alert, alert_id)
    assert meal.risk_label == 'danger' and meal.risk_reasons == body['reasons']
    assert alert.status == 'active' and alert.meal_log_id == meal.id
    assert intake(client, headers, dependent.id)['nutrients']['sodium']['consumed'] == pytest.approx(
        float(profile.daily_sodium_mg) * 0.4)


def test_history_scales_eaten_grams_and_keeps_uneaten_per_100g(client, headers, dependent, db_session):
    scaled = scale_per_100g(Decimal('400'), Decimal('82.50')).quantize(Decimal('0.01'))
    assert scaled == Decimal('330.00')
    product = ScannedProduct(barcode='hist-400', name='Food', calories=400, sodium_mg=200,
                             sugar_g=10, raw_response={})
    meal = MealLog(dependent_id=dependent.id, product=product, risk_label='safe', risk_reasons=['ok'])
    db_session.add(meal)
    db_session.commit()
    body = client.get(f'/dependents/{dependent.id}/meals', headers=headers).json()[0]
    assert body['calories'] == 400 and body['sodium_mg'] == 200 and body['sugar_g'] == 10
    assert body['grams_eaten'] is None
    assert 'carbohydrate_g' not in body and 'saturated_fat_g' not in body and 'protein_g' not in body


def test_history_shows_condition_nutrients_from_the_cached_product(client, headers, dependent, db_session):
    dependent.dietary_profile.conditions = ['diabetic', 'high cholesterol', 'kidney disease']
    product = ScannedProduct(
        barcode='hist-conditions', name='Food', calories=400, sodium_mg=200, sugar_g=10,
        raw_response={'product': {'nutriments': {
            'carbohydrates_100g': 20, 'saturated-fat_100g': 3, 'proteins_100g': 8, 'fiber_100g': 4,
        }}},
    )
    db_session.add(MealLog(dependent_id=dependent.id, product=product, risk_label='safe', risk_reasons=['ok']))
    db_session.commit()
    body = client.get(f'/dependents/{dependent.id}/meals', headers=headers).json()[0]
    assert body['carbohydrate_g'] == 20
    assert body['saturated_fat_g'] == 3
    assert body['protein_g'] == 8
    assert 'fiber_g' not in body
    dependent.dietary_profile.conditions = ['hypertension']
    db_session.commit()
    plain = client.get(f'/dependents/{dependent.id}/meals', headers=headers).json()[0]
    assert 'carbohydrate_g' not in plain and 'saturated_fat_g' not in plain and 'protein_g' not in plain


def test_serving_prefill_rejects_milliliters():
    assert optional_serving_grams({'product': {'serving_size': '80 g'}}) == 80
    assert optional_serving_grams({'product': {'serving_size': '250 ml'}}) is None
    assert optional_serving_grams({'product': {}}) is None


def test_demo_scan_still_classifies_without_extra_nutrients(client, db_session, monkeypatch):
    from seed import seed_demo
    from app.food_lookup import fetch_product
    from app import routes
    monkeypatch.setenv('DEMO_MODE', 'true')
    monkeypatch.setattr(routes, 'fetch_product', fetch_product)
    caregiver = seed_demo(db_session)
    db_session.commit()
    dependent = next(dep for dep in caregiver.dependents if dep.name == 'Demo Hypertension')
    headers = {'Authorization': 'Bearer ' + create_access_token(caregiver.id)}
    body = scan(client, headers, dependent.id, '2000000000015')
    assert body['risk_label'] == 'safe'
    assert 'carbohydrate_g' not in body and 'protein_g' not in body and 'saturated_fat_g' not in body
    report = intake(client, headers, dependent.id)
    assert set(report['nutrients']) == {'calories', 'sodium', 'sugar'}
    assert report['nutrients']['calories']['consumed'] == 0
