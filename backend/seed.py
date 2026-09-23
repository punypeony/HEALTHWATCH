"""Idempotent development seed. Run from backend: python seed.py."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import SessionLocal, create_tables
from app.models import Dependent, DietaryProfile, User
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
    return caregiver


if __name__ == '__main__':
    create_tables()
    with SessionLocal.begin() as session:
        seed_demo(session)
    print('Demo seed ready: one caregiver and two dependents (existing records preserved).')
