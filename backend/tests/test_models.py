from datetime import date
from decimal import Decimal
import hashlib

import pytest
from sqlalchemy import func, insert, select, update
from sqlalchemy.exc import IntegrityError

from app.models import User, Dependent, DietaryProfile, ScannedProduct, MealLog, Alert, Summary
from app.passwords import hash_password
from app.targets import compute_daily_targets
from seed import seed_demo, DEMO_EMAIL, DEMO_PASSWORD


@pytest.fixture
def dependent(db_session):
    owner = User(name='Test', email='schema-test@example.test', password_hash='test-only')
    child = Dependent(caregiver=owner, name='Relative', age=40, height_cm=170,
                      weight_kg=70, sex='male')
    db_session.add(child)
    db_session.flush()
    return child


def test_all_models_relationships_and_postgres_types(db_session, dependent):
    profile = dependent.dietary_profile
    profile.allergies.append('Milk')
    profile.conditions.append('Hypertension')
    product = ScannedProduct(barcode='0012345678901', name='Food', calories=100,
                             sodium_mg=200, sugar_g=3, raw_response={'allergens': ['en:milk']})
    meal = MealLog(dependent=dependent, product=product, risk_label='warning',
                   risk_reasons=['Sodium is high.'])
    alert = Alert(dependent=dependent, meal_log=meal, message='Sodium is high.')
    summary = Summary(dependent=dependent, week_start=date(2026, 9, 21), text='One warning.')
    db_session.add_all([alert, summary])
    db_session.flush()
    ids = dependent.id, profile.id, product.id, meal.id, alert.id, summary.id
    db_session.expire_all()
    assert dependent.caregiver.dependents == [dependent]
    assert dependent.dietary_profile.id == ids[1]
    assert profile.allergies == ['milk'] and profile.conditions == ['hypertension']
    assert profile.daily_sodium_mg == Decimal('1400.00')
    assert isinstance(product.calories, Decimal)
    assert product.raw_response == {'allergens': ['en:milk']}
    assert meal.risk_reasons == ['Sodium is high.']
    assert dependent.meal_logs == [meal] and product.meal_logs == [meal]
    assert meal.alerts == dependent.alerts == [alert]
    assert dependent.summaries == [summary]
    assert alert.status == 'active'
    assert dependent.created_at.utcoffset() is not None
    assert dependent.updated_at.utcoffset() is not None
    assert product.fetched_at.utcoffset() is not None
    db_session.delete(dependent)
    db_session.flush()
    for model in (Dependent, DietaryProfile, MealLog, Alert, Summary):
        assert db_session.scalar(select(func.count()).select_from(model)) == 0
    assert db_session.get(ScannedProduct, product.id) is product


def test_profile_updates_in_place_and_targets_cannot_be_supplied(db_session, dependent):
    profile_id = dependent.dietary_profile.id
    dependent.weight_kg = 80
    dependent.dietary_profile.conditions.append(' DIABETIC ')
    dependent.dietary_profile.daily_calories = 999
    db_session.flush()
    db_session.expire_all()
    assert dependent.dietary_profile.id == profile_id
    expected = compute_daily_targets(40, 170, 80, 'male', ['diabetic'])
    for field, value in expected.items():
        assert getattr(dependent.dietary_profile, field) == value
    assert db_session.scalar(select(func.count()).select_from(DietaryProfile)) == 1


@pytest.mark.parametrize('model,field,value', [
    (Dependent, 'age', -1), (Dependent, 'age', 121),
    (Dependent, 'height_cm', 0), (Dependent, 'weight_kg', -1),
    (Dependent, 'sex', 'invalid'),
    (DietaryProfile, 'daily_sodium_mg', 0),
    (DietaryProfile, 'daily_sugar_g', -1),
    (DietaryProfile, 'daily_calories', 0),
])
def test_database_checks_reject_invalid_values(db_session, dependent, model, field, value):
    # Core writes deliberately bypass calculation to test PostgreSQL CHECKs.
    with pytest.raises(IntegrityError) as error, db_session.begin_nested():
        db_session.execute(update(model.__table__).values({field: value}))
    assert error.value.orig.sqlstate == '23514'


def test_unique_profile_and_email(db_session, dependent):
    with pytest.raises(IntegrityError), db_session.begin_nested():
        db_session.execute(insert(DietaryProfile.__table__).values(
            dependent_id=dependent.id, daily_sodium_mg=2000, daily_sugar_g=50, daily_calories=2000))
    with pytest.raises(IntegrityError), db_session.begin_nested():
        db_session.execute(insert(User.__table__).values(
            name='Duplicate', email=dependent.caregiver.email, password_hash='test'))


@pytest.mark.parametrize('table,values', [
    (Dependent.__table__, dict(caregiver_id=-1, name='Orphan', age=30, height_cm=170, weight_kg=70, sex='male')),
    (DietaryProfile.__table__, dict(dependent_id=-1, daily_sodium_mg=2000, daily_sugar_g=50, daily_calories=2000)),
    (MealLog.__table__, dict(dependent_id=-1, scanned_product_id=-1, risk_label='safe', risk_reasons=[])),
    (Alert.__table__, dict(dependent_id=-1, meal_log_id=-1, message='Orphan')),
    (Summary.__table__, dict(dependent_id=-1, week_start=date(2026, 9, 21), text='Orphan')),
])
def test_foreign_keys(db_session, table, values):
    with pytest.raises(IntegrityError) as error, db_session.begin_nested():
        db_session.execute(insert(table).values(**values))
    assert error.value.orig.sqlstate == '23503'


def test_risk_status_and_alert_ownership_constraints(db_session, dependent):
    product = ScannedProduct(barcode='123', name='Food', calories=1, sodium_mg=1, sugar_g=1, raw_response={})
    meal = MealLog(dependent=dependent, product=product, risk_label='safe', risk_reasons=[])
    alert = Alert(dependent=dependent, meal_log=meal, message='Test')
    other = Dependent(caregiver=dependent.caregiver, name='Other', age=30, height_cm=160, weight_kg=60, sex='female')
    db_session.add_all([alert, other])
    db_session.flush()
    for table, values in [(MealLog.__table__, {'risk_label': 'unknown'}),
                          (Alert.__table__, {'status': 'unknown'}),
                          (Alert.__table__, {'dependent_id': other.id})]:
        with pytest.raises(IntegrityError), db_session.begin_nested():
            db_session.execute(update(table).values(**values))
    with pytest.raises(IntegrityError), db_session.begin_nested():
        db_session.execute(insert(ScannedProduct.__table__).values(
            barcode='123', name='Duplicate', calories=1, sodium_mg=1, sugar_g=1, raw_response={}))


def test_required_profile_cannot_be_deleted_alone(db_session, dependent):
    db_session.delete(dependent.dietary_profile)
    with pytest.raises(ValueError, match='required dietary profile'):
        db_session.flush()


def test_dependent_delete_cascades(db_session, dependent):
    db_session.delete(dependent)
    db_session.flush()
    assert db_session.scalar(select(func.count()).select_from(DietaryProfile)) == 0
    assert db_session.scalar(select(func.count()).select_from(User)) == 1


def test_seed_is_idempotent_across_commits(db_session):
    user = seed_demo(db_session)
    db_session.commit()
    ids = sorted((dep.id, dep.dietary_profile.id) for dep in user.dependents)
    password_hash = user.password_hash
    seed_demo(db_session)
    db_session.commit()
    db_session.expire_all()
    assert db_session.scalar(select(func.count()).select_from(User).where(User.email == DEMO_EMAIL)) == 1
    assert len(user.dependents) == 2
    assert sorted((dep.id, dep.dietary_profile.id) for dep in user.dependents) == ids
    assert user.password_hash == password_hash and user.password_hash != DEMO_PASSWORD
    for dep in user.dependents:
        expected = compute_daily_targets(dep.age, dep.height_cm, dep.weight_kg, dep.sex, dep.dietary_profile.conditions)
        for field, value in expected.items():
            assert getattr(dep.dietary_profile, field) == value
    low_sodium, low_sugar = sorted(user.dependents, key=lambda dep: dep.name, reverse=True)
    assert low_sodium.dietary_profile.daily_sodium_mg == 1400
    assert low_sugar.dietary_profile.daily_sugar_g < low_sugar.dietary_profile.daily_calories / 40


def test_password_hash_is_salted_and_verifiable():
    encoded = hash_password('example')
    algorithm, iterations, salt, digest = encoded.split('$')
    assert algorithm == 'pbkdf2_sha256'
    assert hashlib.pbkdf2_hmac('sha256', b'example', bytes.fromhex(salt), int(iterations)).hex() == digest
    assert hash_password('example') != encoded


@pytest.mark.parametrize('field,value', [
    ('age', 70), ('height_cm', 180), ('weight_kg', 80), ('sex', 'female'),
])
def test_each_physical_change_recomputes_existing_profile(db_session, dependent, field, value):
    profile_id = dependent.dietary_profile.id
    old_calories = dependent.dietary_profile.daily_calories
    setattr(dependent, field, value)
    db_session.commit()
    db_session.expire_all()
    profile = dependent.dietary_profile
    assert profile.id == profile_id
    assert profile.daily_calories != old_calories
    expected = compute_daily_targets(dependent.age, dependent.height_cm,
                                     dependent.weight_kg, dependent.sex, profile.conditions)
    assert all(getattr(profile, key) == value for key, value in expected.items())


def test_condition_only_update_and_removal_recompute_profile(db_session, dependent):
    profile = dependent.dietary_profile
    profile_id = profile.id
    original_sugar = profile.daily_sugar_g
    profile.conditions = ['Hypertension', 'Diabetic']
    db_session.commit()
    db_session.expire_all()
    assert profile.daily_sodium_mg == 1400
    assert profile.daily_sugar_g < original_sugar
    profile.conditions.clear()
    db_session.commit()
    db_session.expire_all()
    assert profile.id == profile_id
    assert profile.daily_sodium_mg == 2000
    assert profile.daily_sugar_g == original_sugar
