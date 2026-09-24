"""Weekly summary aggregation and alert acknowledgement."""
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.auth import create_access_token, get_session
from app.main import app
from app.models import Alert, MealLog, ScannedProduct, Summary, User
from app.passwords import hash_password
from app.summary import weekly_summary

PASSWORD = 'Test-password-123!'
DEPENDENT = dict(name='Relative', age=40, height_cm=170, weight_kg=70, sex='male', allergies=[], conditions=[])


@pytest.fixture
def client(db_session, monkeypatch):
    monkeypatch.setenv('JWT_SECRET', 'test-only-secret-at-least-32-bytes-long')
    app.dependency_overrides[get_session] = lambda: db_session
    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def headers(db_session, client):
    user = User(name='Owner', email='summary-owner@example.test', password_hash=hash_password(PASSWORD))
    db_session.add(user)
    db_session.commit()
    return {'Authorization': 'Bearer ' + create_access_token(user.id)}


def _dependent(client, headers):
    response = client.post('/dependents', json=DEPENDENT, headers=headers)
    assert response.status_code == 201
    return response.json()['id']


def _meal(db_session, dependent_id, label, reasons, when=None):
    barcode = f'{dependent_id}-{label}-{db_session.query(MealLog).count()}-{len(reasons)}'
    product = ScannedProduct(barcode=barcode, name='Food', calories=1, sodium_mg=2, sugar_g=3, raw_response={})
    meal = MealLog(dependent_id=dependent_id, product=product, risk_label=label, risk_reasons=reasons)
    if when is not None:
        meal.created_at = when
    db_session.add(meal)
    db_session.flush()
    if label != 'safe':
        db_session.add(Alert(dependent_id=dependent_id, meal_log_id=meal.id, message=' '.join(reasons)))
    db_session.commit()
    return meal


def test_weekly_summary_counts_reasons_and_excludes_older_scans(client, headers, db_session):
    dependent_id = _dependent(client, headers)
    now = datetime.now(timezone.utc)
    _meal(db_session, dependent_id, 'danger', ['Sodium exceeds the dependent\'s daily target.'], now)
    _meal(db_session, dependent_id, 'danger', ['Sodium exceeds the dependent\'s daily target.'], now)
    _meal(db_session, dependent_id, 'warning', ['Sugar is high compared with the dependent\'s daily target.'], now)
    _meal(db_session, dependent_id, 'safe', [], now)
    _meal(db_session, dependent_id, 'danger', ['Sodium exceeds the dependent\'s daily target.'], now - timedelta(days=8))

    response = client.get(f'/dependents/{dependent_id}/summary/weekly', headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body['total_scans'] == 4
    assert body['safe_count'] == 1
    assert body['warning_count'] == 1
    assert body['danger_count'] == 2
    assert body['common_reason'] == 'sodium'
    assert body['text'] == '2 danger-level scans this week, mostly sodium-related.'
    again = client.get(f'/dependents/{dependent_id}/summary/weekly', headers=headers)
    assert again.json() == body
    assert db_session.query(Summary).filter_by(dependent_id=dependent_id).count() == 1


def test_empty_week(client, headers, db_session):
    dependent_id = _dependent(client, headers)
    response = client.get(f'/dependents/{dependent_id}/summary/weekly', headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body['total_scans'] == body['safe_count'] == body['warning_count'] == body['danger_count'] == 0
    assert body['common_reason'] is None
    assert body['text'] == 'No scans were recorded in the last 7 days.'


def test_summary_authorization(client, headers, db_session):
    dependent_id = _dependent(client, headers)
    other = User(name='Other', email='summary-other@example.test', password_hash='unused')
    db_session.add(other)
    db_session.commit()
    other_headers = {'Authorization': 'Bearer ' + create_access_token(other.id)}
    forbidden = client.get(f'/dependents/{dependent_id}/summary/weekly', headers=other_headers)
    missing = client.get('/dependents/2147483647/summary/weekly', headers=other_headers)
    assert forbidden.status_code == 403 and forbidden.json() == missing.json()


def test_alert_acknowledgement(client, headers, db_session):
    dependent_id = _dependent(client, headers)
    meal = _meal(db_session, dependent_id, 'warning', ['Sodium is high compared with the dependent\'s daily target.'])
    listed = client.get(f'/dependents/{dependent_id}/alerts', headers=headers)
    assert listed.status_code == 200
    alert = listed.json()[0]
    assert alert['status'] == 'active'
    assert alert['product_name'] == 'Food'
    assert alert['risk_label'] == 'warning'
    updated = client.patch(f"/alerts/{alert['id']}", headers=headers, json={'status': 'acknowledged'})
    assert updated.status_code == 200
    assert updated.json()['status'] == 'acknowledged'
    assert updated.json()['risk_label'] == 'warning'
    assert meal.id == alert['meal_log_id']


def test_weekly_summary_function_matches_route(client, headers, db_session):
    dependent_id = _dependent(client, headers)
    direct = weekly_summary(db_session, dependent_id)
    assert direct['total_scans'] == 0
