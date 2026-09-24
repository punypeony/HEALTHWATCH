"""Idempotent development seed. Run from backend:

    python seed.py
    python seed.py --reset-demo

`--reset-demo` deletes only the demo caregiver's dependents and demo barcodes that
no other meal still references, then recreates the demo account. Other users stay.
"""
import argparse

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import SessionLocal, create_tables
from app.models import Dependent, DietaryProfile, MealLog, ScannedProduct, User
from app.passwords import hash_password

DEMO_EMAIL = 'demo@foodmonitor.local'
DEMO_PASSWORD = 'DemoCaregiver123!'
DEMO_BARCODES = ('2000000000015', '2000000000022', '2000000000039')
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


def reset_demo(session: Session) -> User:
    """Replace demo-account state only. Other caregivers and their meals stay.

    Demo product rows are removed only when no remaining meal log points at them.
    The known demo password is restored so the classroom login works.
    """
    caregiver = session.scalar(select(User).where(User.email == DEMO_EMAIL))
    if caregiver is not None:
        for dependent in list(caregiver.dependents):
            session.delete(dependent)
        caregiver.name = 'Demo Caregiver'
        caregiver.password_hash = hash_password(DEMO_PASSWORD)
        session.flush()
    for barcode in DEMO_BARCODES:
        product = session.scalar(select(ScannedProduct).where(ScannedProduct.barcode == barcode))
        if product is None:
            continue
        referenced = session.scalar(select(func.count()).select_from(MealLog).where(
            MealLog.scanned_product_id == product.id))
        if not referenced:
            session.delete(product)
    session.flush()
    return seed_demo(session)


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description='Seed or reset the demo caregiver only.')
    parser.add_argument('--reset-demo', action='store_true',
                        help='Delete the demo caregiver dependents and unused demo products, then recreate them.')
    args = parser.parse_args(argv)
    create_tables()
    with SessionLocal.begin() as session:
        if args.reset_demo:
            reset_demo(session)
            print('Demo account reset. Other users were not deleted.')
        else:
            seed_demo(session)
            print('Demo seed ready: one caregiver and two dependents (existing records preserved).')
    print(f'Login: {DEMO_EMAIL} / {DEMO_PASSWORD}')


if __name__ == '__main__':
    main()
