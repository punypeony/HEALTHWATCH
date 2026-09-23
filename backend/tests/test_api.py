"""Real PostgreSQL tests for auth, ownership and public API contracts."""
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import jwt
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from app.auth import (JWT_AUDIENCE, JWT_ISSUER, authenticate_user, create_access_token,
                      decode_access_token, get_current_user, get_session, jwt_secret, register_user)
from app.dependents import create_dependent, owned_alert, owned_dependent, save_dependent, update_dependent
from app.errors import ApiError
from app.main import app
from app.models import Alert, Dependent, MealLog, ScannedProduct, User
from app.passwords import hash_password, verify_password
from app.schemas import DependentCreate, DependentPatch, LoginInput, RegisterInput
from fastapi.security import HTTPAuthorizationCredentials

PASSWORD = 'Test-password-123!'
DEPENDENT = dict(name=' Relative ', age=40, height_cm=170, weight_kg=70, sex='male',
                 allergies=[' Milk ', 'MILK'], conditions=[' Hypertension '])


@pytest.fixture
def client(db_session, monkeypatch):
    monkeypatch.setenv('JWT_SECRET', 'test-only-secret-at-least-32-bytes-long')
    app.dependency_overrides[get_session] = lambda: db_session
    with TestClient(app, raise_server_exceptions=False) as client:
        yield client
    app.dependency_overrides.clear()


@pytest.fixture
def owner(db_session):
    user = User(name='Owner', email='owner@example.test', password_hash=hash_password(PASSWORD))
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture
def headers(client, owner):
    return {'Authorization': 'Bearer ' + create_access_token(owner.id)}


@pytest.fixture
def record(client, headers):
    response = client.post('/dependents', json=DEPENDENT, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def assert_error(response, status, code):
    assert response.status_code == status, response.text
    body = response.json()
    assert set(body) == {'error'}
    assert set(body['error']) == {'code', 'message'}
    assert body['error']['code'] == code
    assert isinstance(body['error']['message'], str)


def test_registration_and_duplicate(client, db_session):
    payload = dict(name=' Caregiver ', email=' TEST@Example.test ', password=PASSWORD)
    response = client.post('/auth/register', json=payload)
    assert response.status_code == 201, response.text
    assert response.json()['email'] == 'test@example.test'
    assert response.json()['name'] == 'Caregiver'
    assert 'password_hash' not in response.json() and 'password' not in response.json()
    user = db_session.scalar(select(User).where(User.email == 'test@example.test'))
    assert user.password_hash != PASSWORD and verify_password(PASSWORD, user.password_hash)
    assert_error(client.post('/auth/register', json=payload), 409, 'DUPLICATE_EMAIL')


def test_login_and_authenticated_list(client, owner):
    response = client.post('/auth/login', json=dict(email='OWNER@example.test', password=PASSWORD))
    assert response.status_code == 200
    token = response.json()['access_token']
    assert response.json()['token_type'] == 'bearer'
    assert decode_access_token(token) == owner.id
    assert client.get('/dependents', headers={'Authorization': 'Bearer ' + token}).json() == []


@pytest.mark.parametrize('email,password', [('owner@example.test', 'wrong'), ('missing@example.test', PASSWORD)])
def test_invalid_credentials(client, owner, email, password):
    assert_error(client.post('/auth/login', json=dict(email=email, password=password)), 401, 'INVALID_CREDENTIALS')


@pytest.mark.parametrize('method,path,payload', [
    ('get', '/dependents', None), ('post', '/dependents', DEPENDENT),
    ('get', '/dependents/1', None), ('patch', '/dependents/1', {'name': 'New'}),
    ('delete', '/dependents/1', None), ('get', '/dependents/1/meals', None),
    ('get', '/dependents/1/alerts', None), ('patch', '/alerts/1', {'status': 'acknowledged'}),
    ('post', '/dependents/1/scan', {}),
])
def test_all_routes_require_authentication(client, method, path, payload):
    response = client.request(method, path, json=payload)
    assert_error(response, 401, 'UNAUTHORIZED')
    assert response.headers['www-authenticate'] == 'Bearer'


@pytest.mark.parametrize('case', ['malformed', 'tampered', 'expired', 'wrong-algorithm', 'missing-exp',
                                  'wrong-audience', 'wrong-issuer', 'bad-sub', 'huge-sub', 'deleted-user', 'future'])
def test_invalid_tokens(client, owner, case):
    now = datetime.now(timezone.utc)
    claims = dict(sub=str(owner.id), exp=now + timedelta(hours=1), iat=now,
                  iss=JWT_ISSUER, aud=JWT_AUDIENCE)
    algorithm, key = 'HS256', jwt_secret()
    if case == 'expired': claims['exp'] = now - timedelta(seconds=1)
    if case == 'missing-exp': del claims['exp']
    if case == 'wrong-audience': claims['aud'] = 'other'
    if case == 'wrong-issuer': claims['iss'] = 'other'
    if case == 'bad-sub': claims['sub'] = 'not-an-id'
    if case == 'huge-sub': claims['sub'] = '9' * 30
    if case == 'deleted-user': claims['sub'] = '2147483647'
    if case == 'future': claims['iat'] = now + timedelta(hours=1)
    if case == 'wrong-algorithm': algorithm = 'HS384'
    if case == 'tampered': key = 'different-secret-that-is-at-least-32-bytes'
    token = 'not.a.jwt' if case == 'malformed' else jwt.encode(claims, key, algorithm=algorithm)
    assert_error(client.get('/dependents', headers={'Authorization': 'Bearer ' + token}), 401, 'UNAUTHORIZED')


def test_dependent_crud_and_targets(client, headers, record, db_session, owner):
    assert record['name'] == 'Relative'
    profile = record['dietary_profile']
    assert profile['allergies'] == ['milk'] and profile['conditions'] == ['hypertension']
    assert profile['daily_sodium_mg'] == 1400
    assert db_session.get(Dependent, record['id']).caregiver_id == owner.id
    path = f"/dependents/{record['id']}"
    assert client.get(path, headers=headers).json() == record
    assert client.get('/dependents', headers=headers).json() == [record]
    response = client.patch(path, headers=headers, json={'weight_kg': 80, 'conditions': ['DIABETIC']})
    assert response.status_code == 200, response.text
    changed = response.json()['dietary_profile']
    assert changed['id'] == profile['id']
    assert changed['daily_sodium_mg'] == 2000
    assert changed['daily_calories'] != profile['daily_calories']
    assert changed['daily_sugar_g'] < profile['daily_sugar_g']
    assert client.get(path + '/meals', headers=headers).json() == []
    assert client.get(path + '/alerts', headers=headers).json() == []
    assert_error(client.post(path + '/scan', headers=headers, json={'barcode': '123'}), 422, 'VALIDATION_ERROR')
    assert client.delete(path, headers=headers).status_code == 204
    assert client.get('/dependents', headers=headers).json() == []
    assert_error(client.get(path, headers=headers), 403, 'FORBIDDEN')


@pytest.mark.parametrize('field,value', [
    ('name', ''), ('name', '  '), ('age', -1), ('age', 121), ('age', True), ('age', 1.5),
    ('height_cm', 0), ('weight_kg', -1), ('height_cm', 'NaN'), ('weight_kg', 'Infinity'),
    ('height_cm', 170.123), ('sex', 'unknown'), ('conditions', ['']), ('allergies', [123]),
    ('caregiver_id', 1), ('daily_calories', 2000), ('daily_sodium_mg', 1), ('daily_sugar_g', 1),
    ('dietary_profile', {'daily_calories': 123}),
])
def test_create_validation_and_mass_assignment(client, headers, field, value):
    payload = {**DEPENDENT, field: value}
    assert_error(client.post('/dependents', headers=headers, json=payload), 422, 'VALIDATION_ERROR')


@pytest.mark.parametrize('payload', [{'age': None}, {'conditions': None}, {'caregiver_id': 2},
                                     {'daily_calories': 1}, {'name': ''}, {'age': 120, 'height_cm': 1, 'weight_kg': 1}])
def test_patch_validation_and_rollback(client, headers, record, payload):
    path = f"/dependents/{record['id']}"
    assert_error(client.patch(path, headers=headers, json=payload), 422, 'VALIDATION_ERROR')
    assert client.get(path, headers=headers).json() == record


@pytest.mark.parametrize('method,suffix,payload', [
    ('get', '', None), ('patch', '', {'name': 'Stolen'}), ('delete', '', None),
    ('get', '/meals', None), ('get', '/alerts', None), ('post', '/scan', {'barcode': '12345678'}),
])
def test_ownership_indistinguishable_from_missing(client, db_session, record, method, suffix, payload):
    other = User(name='Other', email='other@example.test', password_hash='unused')
    db_session.add(other)
    db_session.commit()
    other_headers = {'Authorization': 'Bearer ' + create_access_token(other.id)}
    forbidden = client.request(method, f"/dependents/{record['id']}{suffix}", headers=other_headers, json=payload)
    missing = client.request(method, f'/dependents/2147483647{suffix}', headers=other_headers, json=payload)
    assert_error(forbidden, 403, 'FORBIDDEN')
    assert missing.status_code == 403 and forbidden.json() == missing.json()
    assert client.get('/dependents', headers=other_headers).json() == []


def test_meals_alerts_and_acknowledgement_ownership(client, headers, record, db_session):
    dependent = db_session.get(Dependent, record['id'])
    product = ScannedProduct(barcode='auth-test', name='Food', calories=1, sodium_mg=2, sugar_g=3, raw_response={})
    meal = MealLog(dependent=dependent, product=product, risk_label='warning', risk_reasons=['High sodium'])
    alert = Alert(dependent=dependent, meal_log=meal, message='High sodium')
    other = User(name='Other', email='other@example.test', password_hash='unused')
    db_session.add_all([alert, other])
    db_session.commit()
    assert client.get(f"/dependents/{record['id']}/meals", headers=headers).json()[0]['id'] == meal.id
    assert client.get(f"/dependents/{record['id']}/alerts", headers=headers).json()[0]['status'] == 'active'
    other_headers = {'Authorization': 'Bearer ' + create_access_token(other.id)}
    forbidden = client.patch(f'/alerts/{alert.id}', headers=other_headers, json={'status': 'acknowledged'})
    missing = client.patch('/alerts/2147483647', headers=other_headers, json={'status': 'acknowledged'})
    assert_error(forbidden, 403, 'FORBIDDEN')
    assert forbidden.json() == missing.json()
    assert alert.status == 'active'
    for _ in range(2):
        response = client.patch(f'/alerts/{alert.id}', headers=headers, json={'status': 'acknowledged'})
        assert response.status_code == 200 and response.json()['status'] == 'acknowledged'
    assert_error(client.patch(f'/alerts/{alert.id}', headers=headers, json={'status': 'active'}), 422, 'VALIDATION_ERROR')
    assert owned_alert(db_session, alert.id, dependent.caregiver_id) is alert
    with pytest.raises(ApiError):
        owned_alert(db_session, alert.id, other.id)


def test_framework_errors_have_standard_envelope(client):
    assert_error(client.get('/missing'), 404, 'NOT_FOUND')
    assert_error(client.put('/auth/login'), 405, 'METHOD_NOT_ALLOWED')
    assert_error(client.post('/auth/login', content='{', headers={'Content-Type': 'application/json'}), 422, 'VALIDATION_ERROR')
    with patch('app.routes.authenticate_user', side_effect=SQLAlchemyError('private database detail')):
        response = client.post('/auth/login', json=dict(email='x@example.test', password=PASSWORD))
        assert_error(response, 503, 'DATABASE_ERROR')
        assert 'private' not in response.text
    with patch('app.routes.authenticate_user', side_effect=RuntimeError('private internal detail')):
        response = client.post('/auth/login', json=dict(email='x@example.test', password=PASSWORD))
        assert_error(response, 500, 'INTERNAL_ERROR')
        assert 'private' not in response.text


def test_service_functions_directly(client, db_session):
    data = RegisterInput(name='Direct', email='direct@example.test', password=PASSWORD)
    user = register_user(db_session, data)
    assert authenticate_user(db_session, LoginInput(email=data.email, password=PASSWORD)) is user
    with pytest.raises(ApiError): register_user(db_session, data)
    token = create_access_token(user.id)
    assert decode_access_token(token) == user.id
    assert get_current_user(db_session, HTTPAuthorizationCredentials(scheme='Bearer', credentials=token)) is user
    dep = create_dependent(db_session, user.id, DependentCreate(**DEPENDENT))
    assert owned_dependent(db_session, dep.id, user.id) is dep
    assert update_dependent(db_session, dep, DependentPatch(age=60)).age == 60
    assert save_dependent(db_session, dep) is dep
    with pytest.raises(ApiError): owned_dependent(db_session, dep.id, user.id + 1)


def test_password_verification_rejects_invalid_values():
    encoded = hash_password(PASSWORD)
    assert verify_password(PASSWORD, encoded)
    assert not verify_password('wrong', encoded)
    assert not verify_password(PASSWORD, 'malformed')
    assert not verify_password(PASSWORD, 'unknown$600000$00$00')


def test_missing_jwt_secret_fails_closed(client, owner, monkeypatch):
    monkeypatch.delenv('JWT_SECRET')
    assert_error(client.post('/auth/login', json=dict(email=owner.email, password=PASSWORD)), 503, 'CONFIGURATION_ERROR')


@pytest.mark.parametrize('payload', [
    dict(name=' ', email='valid@example.test', password=PASSWORD),
    dict(name='Name', email='invalid', password=PASSWORD),
    dict(name='Name', email='valid@example.test', password='short'),
    dict(name='Name', email='valid@example.test', password=PASSWORD, caregiver_id=123),
])
def test_registration_validation(client, payload):
    assert_error(client.post('/auth/register', json=payload), 422, 'VALIDATION_ERROR')


@pytest.mark.parametrize('authorization', ['Basic dGVzdDp0ZXN0', 'Bearer', 'Bearer garbage'])
def test_bad_authorization_headers(client, authorization):
    assert_error(client.get('/dependents', headers={'Authorization': authorization}), 401, 'UNAUTHORIZED')


def test_seeded_caregiver_can_login(client, db_session):
    from seed import seed_demo, DEMO_EMAIL, DEMO_PASSWORD
    user = seed_demo(db_session)
    db_session.commit()
    response = client.post('/auth/login', json={'email': DEMO_EMAIL, 'password': DEMO_PASSWORD})
    assert response.status_code == 200
    assert decode_access_token(response.json()['access_token']) == user.id


def test_request_session_uses_configured_engine(test_database):
    from app import database
    generator = get_session()
    session = next(generator)
    assert session.bind is database.engine
    generator.close()
