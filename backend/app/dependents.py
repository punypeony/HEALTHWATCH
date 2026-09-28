"""Small dependent operations; route handlers orchestrate these functions."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.errors import ApiError
from app.models import Alert, Dependent, DietaryProfile, MealLog
from app.schemas import DependentCreate, DependentPatch


def owned_dependent(session: Session, dependent_id: int, caregiver_id: int) -> Dependent:
    dependent = session.scalar(select(Dependent).where(
        Dependent.id == dependent_id, Dependent.caregiver_id == caregiver_id))
    if dependent is None:
        raise ApiError(403, 'FORBIDDEN', 'Access to this resource is forbidden.')
    return dependent


def owned_meal(session: Session, meal_id: int, caregiver_id: int) -> MealLog:
    meal = session.scalar(select(MealLog).join(Dependent).where(
        MealLog.id == meal_id, Dependent.caregiver_id == caregiver_id))
    if meal is None:
        raise ApiError(403, 'FORBIDDEN', 'Access to this resource is forbidden.')
    return meal


def owned_alert(session: Session, alert_id: int, caregiver_id: int) -> Alert:
    alert = session.scalar(select(Alert).join(Dependent).where(
        Alert.id == alert_id, Dependent.caregiver_id == caregiver_id))
    if alert is None:
        raise ApiError(403, 'FORBIDDEN', 'Access to this resource is forbidden.')
    return alert


def save_dependent(session: Session, dependent: Dependent) -> Dependent:
    try:
        # before_flush computes all daily targets and preserves the profile ID.
        session.commit()
    except ValueError as exc:
        session.rollback()
        raise ApiError(422, 'VALIDATION_ERROR', str(exc)) from exc
    session.refresh(dependent)
    return dependent


def create_dependent(session: Session, caregiver_id: int, data: DependentCreate) -> Dependent:
    values = data.model_dump()
    profile = DietaryProfile(allergies=values.pop('allergies'), conditions=values.pop('conditions'))
    dependent = Dependent(caregiver_id=caregiver_id, dietary_profile=profile, **values)
    session.add(dependent)
    return save_dependent(session, dependent)


def update_dependent(session: Session, dependent: Dependent, data: DependentPatch) -> Dependent:
    for field, value in data.model_dump(exclude_unset=True).items():
        target = dependent.dietary_profile if field in {'allergies', 'conditions'} else dependent
        setattr(target, field, value)
    return save_dependent(session, dependent)
