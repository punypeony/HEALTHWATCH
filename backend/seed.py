"""Idempotent development seed. Run from backend: python seed.py."""
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import SessionLocal, create_tables
from app.models import Alert, Dependent, DietaryProfile, MealLog, ScannedProduct, User
from app.passwords import hash_password

DEMO_EMAIL = 'demo@foodmonitor.local'
DEMO_PASSWORD = 'DemoCaregiver123!'
DEMO_DEPENDENTS = (
    dict(name='Demo Hypertension', age=60, height_cm=170, weight_kg=75, sex='male', condition='hypertension'),
    dict(name='Demo Diabetes', age=55, height_cm=160, weight_kg=65, sex='female', condition='diabetic'),
)


def seed_demo(session: Session) -> User:
    """Add missing demo records; preserve existing user data and password.

    The caller owns the transaction. ORM profile maintenance uses the same
    compute_daily_targets function as every normal application model write.
    """
    caregiver = session.scalar(select(User).where(User.email == DEMO_EMAIL))
    if caregiver is None:
        caregiver = User(name='Demo Caregiver', email=DEMO_EMAIL,
                         password_hash=hash_password(DEMO_PASSWORD))
        session.add(caregiver)
        session.flush()
    for details in DEMO_DEPENDENTS:
        dependent = session.scalar(select(Dependent).where(
            Dependent.caregiver_id == caregiver.id, Dependent.name == details['name']))
        if dependent is None:
            fields = {key: value for key, value in details.items() if key != 'condition'}
            dependent = Dependent(caregiver=caregiver, **fields)
            dependent.dietary_profile = DietaryProfile(allergies=[], conditions=[details['condition']])
            session.add(dependent)
    session.flush()
    _seed_demo_meals(session, caregiver)
    return caregiver


def _seed_demo_meals(session: Session, caregiver: User) -> None:
    """Three recent danger scans so the weekly summary has stable numbers."""
    dependent = session.scalar(select(Dependent).where(
        Dependent.caregiver_id == caregiver.id, Dependent.name == 'Demo Hypertension'))
    if dependent is None or session.scalar(select(func.count()).select_from(MealLog).where(MealLog.dependent_id == dependent.id)):
        return
    product = session.scalar(select(ScannedProduct).where(ScannedProduct.barcode == '2000000000039'))
    if product is None:
        product = ScannedProduct(barcode='2000000000039', name='Demo Salty Crackers', calories=300, sodium_mg=2200, sugar_g=5, raw_response={})
        session.add(product)
        session.flush()
    reason = 'Sodium exceeds the dependent\'s daily target.'
    for _ in range(3):
        meal = MealLog(dependent_id=dependent.id, scanned_product_id=product.id, risk_label='danger', risk_reasons=[reason])
        session.add(meal)
        session.flush()
        session.add(Alert(dependent_id=dependent.id, meal_log_id=meal.id, message=reason, status='active'))


if __name__ == '__main__':
    create_tables()
    with SessionLocal.begin() as session:
        seed_demo(session)
    print('Demo seed ready: one caregiver and two dependents (existing records preserved).')
