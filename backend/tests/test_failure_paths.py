"""Failure paths through the HTTP API, not replaced route results."""
from copy import deepcopy
from unittest.mock import Mock, patch

import httpx
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, func, select
from sqlalchemy.exc import SQLAlchemyError

from app import food_lookup as lookup
from app.auth import create_access_token, get_session
from app.main import app
from app.ml import predict
from app.models import Alert, Dependent, DietaryProfile, MealLog, ScannedProduct, User

BARCODE = '3017620422003'
PAYLOAD = {'status': 1, 'product': {
    'product_name': 'Failure Path Food', 'allergens_tags': [],
    'nutriments': {'energy-kcal_100g': 100, 'sodium_100g': 0.1, 'sugars_100g': 2},
}}
DEPENDENT = dict(name='Relative', age=40, height_cm=170, weight_kg=70, sex='male', allergies=[], conditions=[])


def assert_error(response, status, code):
    assert response.status_code == status
    body = response.json()
    assert set(body) == {'error'}
    assert set(body['error']) == {'code', 'message'}
    assert body['error']['code'] == code
    assert isinstance(body['error']['message'], str) and body['error']['message']


@pytest.fixture
def client(db_session, monkeypatch):
    monkeypatch.setenv('JWT_SECRET', 'failure-path-secret-at-least-32-bytes')
    monkeypatch.setenv('DEMO_MODE', 'false')
    app.dependency_overrides[get_session] = lambda: db_session
    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def headers(db_session, client):
    user = User(name='Owner', email='failure-owner@example.test', password_hash='unused')
    db_session.add(user)
    db_session.commit()
    return {'Authorization': 'Bearer ' + create_access_token(user.id)}, user


@pytest.fixture
def dependent_id(client, headers):
    response = client.post('/dependents', json=DEPENDENT, headers=headers[0])
    assert response.status_code == 201
    return response.json()['id']


@pytest.fixture
def network(monkeypatch, db_session):
    """Stop live HTTP. Cache writes stay inside the test transaction."""
    connection = db_session.connection()
    real_session = lookup.Session
    monkeypatch.setattr(lookup, 'Session', lambda engine: real_session(
        bind=connection, join_transaction_mode='create_savepoint'))
    mock = Mock(side_effect=AssertionError('Unmocked network request'))
    monkeypatch.setattr(lookup.httpx, 'get', mock)
    return mock


def reply(payload=PAYLOAD, status=200):
    return httpx.Response(status, json=payload, request=httpx.Request('GET', 'https://example.test'))


def test_open_food_facts_timeout(client, headers, dependent_id, network, db_session):
    network.side_effect = httpx.ReadTimeout('timed out')
    response = client.post(f'/dependents/{dependent_id}/scan', headers=headers[0], json={'barcode': BARCODE})
    assert_error(response, 504, 'FOOD_LOOKUP_TIMEOUT')
    assert db_session.scalar(select(func.count()).select_from(MealLog)) == 0


def test_product_not_found(client, headers, dependent_id, network):
    network.side_effect = None
    network.return_value = reply({'status': 0, 'product': None})
    response = client.post(f'/dependents/{dependent_id}/scan', headers=headers[0], json={'barcode': BARCODE})
    assert_error(response, 404, 'PRODUCT_NOT_FOUND')


def test_malformed_food_response(client, headers, dependent_id, network):
    network.side_effect = None
    network.return_value = httpx.Response(200, text='<html>nope</html>', request=httpx.Request('GET', 'https://example.test'))
    response = client.post(f'/dependents/{dependent_id}/scan', headers=headers[0], json={'barcode': BARCODE})
    assert_error(response, 422, 'PRODUCT_DATA_INVALID')


def test_missing_nutrition_data(client, headers, dependent_id, network):
    payload = deepcopy(PAYLOAD)
    del payload['product']['nutriments']['sugars_100g']
    network.side_effect = None
    network.return_value = reply(payload)
    response = client.post(f'/dependents/{dependent_id}/scan', headers=headers[0], json={'barcode': BARCODE})
    assert_error(response, 422, 'PRODUCT_DATA_INVALID')


def test_unauthorized_dependent_access(client, headers, dependent_id, db_session):
    other = User(name='Other', email='failure-other@example.test', password_hash='unused')
    db_session.add(other)
    db_session.commit()
    other_headers = {'Authorization': 'Bearer ' + create_access_token(other.id)}
    forbidden = client.get(f'/dependents/{dependent_id}', headers=other_headers)
    missing = client.get('/dependents/2147483647', headers=other_headers)
    assert_error(forbidden, 403, 'FORBIDDEN')
    assert forbidden.json() == missing.json()


def test_unauthorized_alert_access(client, headers, dependent_id, db_session):
    dependent = db_session.get(Dependent, dependent_id)
    product = ScannedProduct(barcode='failure-alert', name='Food', calories=1, sodium_mg=1, sugar_g=1, raw_response={})
    meal = MealLog(dependent=dependent, product=product, risk_label='warning', risk_reasons=['Sodium is high.'])
    alert = Alert(dependent=dependent, meal_log=meal, message='Sodium is high.')
    other = User(name='Other', email='failure-alert-other@example.test', password_hash='unused')
    db_session.add_all([alert, other])
    db_session.commit()
    other_headers = {'Authorization': 'Bearer ' + create_access_token(other.id)}
    forbidden = client.patch(f'/alerts/{alert.id}', headers=other_headers, json={'status': 'acknowledged'})
    assert_error(forbidden, 403, 'FORBIDDEN')
    assert alert.status == 'active'


def test_missing_and_invalid_jwt(client, dependent_id):
    missing = client.get(f'/dependents/{dependent_id}')
    invalid = client.get(f'/dependents/{dependent_id}', headers={'Authorization': 'Bearer not-a-token'})
    assert_error(missing, 401, 'UNAUTHORIZED')
    assert_error(invalid, 401, 'UNAUTHORIZED')


def test_missing_dietary_profile(client, headers, dependent_id, db_session, network):
    db_session.execute(delete(DietaryProfile).where(DietaryProfile.dependent_id == dependent_id))
    db_session.commit()
    response = client.post(f'/dependents/{dependent_id}/scan', headers=headers[0], json={'barcode': BARCODE})
    assert_error(response, 409, 'DIETARY_PROFILE_MISSING')
    network.assert_not_called()


def test_failed_scan_transaction(client, headers, dependent_id, network, db_session):
    network.side_effect = None
    network.return_value = reply()
    with patch.object(db_session, 'commit', side_effect=SQLAlchemyError('private failure')):
        response = client.post(f'/dependents/{dependent_id}/scan', headers=headers[0], json={'barcode': BARCODE})
    assert_error(response, 503, 'DATABASE_ERROR')
    assert 'private' not in response.text
    assert db_session.scalar(select(func.count()).select_from(MealLog)) == 0


def test_invalid_dependent_is_rejected(client, headers):
    payload = {**DEPENDENT, 'age': -1}
    response = client.post('/dependents', headers=headers[0], json=payload)
    assert_error(response, 422, 'VALIDATION_ERROR')
    bad_id = client.get('/dependents/0', headers=headers[0])
    assert_error(bad_id, 422, 'VALIDATION_ERROR')


def test_invalid_barcode(client, headers, dependent_id, network):
    response = client.post(f'/dependents/{dependent_id}/scan', headers=headers[0], json={'barcode': '12abc'})
    assert_error(response, 422, 'VALIDATION_ERROR')
    network.assert_not_called()


def test_food_lookup_failure_on_scan(client, headers, dependent_id, network, db_session):
    network.side_effect = httpx.ConnectError('down')
    response = client.post(f'/dependents/{dependent_id}/scan', headers=headers[0], json={'barcode': BARCODE})
    assert_error(response, 502, 'FOOD_LOOKUP_FAILED')
    assert db_session.scalar(select(func.count()).select_from(Alert)) == 0


def test_model_prediction_failure(client, headers, dependent_id, network, db_session, monkeypatch):
    network.side_effect = None
    network.return_value = reply()
    monkeypatch.setattr(predict, '_model', None)
    response = client.post(f'/dependents/{dependent_id}/scan', headers=headers[0], json={'barcode': BARCODE})
    assert_error(response, 503, 'MODEL_UNAVAILABLE')
    assert db_session.scalar(select(func.count()).select_from(MealLog)) == 0
