"""HTTP endpoints for accounts and caregiver-owned resources."""
from typing import Annotated

from fastapi import APIRouter, Path, Response
from sqlalchemy import select

from app.auth import (CurrentUser, DbSession, authenticate_user, create_access_token, register_user)
from app.dependents import create_dependent, owned_alert, owned_dependent, update_dependent
from app.food_lookup import fetch_product
from app.ml.predict import predict_risk
from app.scan import (validate_scan_input, calculate_product_percentages, check_allergy_match,
                      check_condition_conflict, age_band_for, store_scan_product, create_meal_log,
                      create_alert_if_needed, return_scan_result)
from app.models import Alert, Dependent, MealLog
from app.schemas import (AlertOutput, AlertPatch, DependentCreate, DependentOutput,
                         DependentPatch, LoginInput, MealOutput, RegisterInput, TokenOutput, UserOutput,
                         ScanInput, ScanOutput)

router = APIRouter()
RecordId = Annotated[int, Path(ge=1, le=2147483647)]


@router.post('/auth/register', response_model=UserOutput, status_code=201)
def register(data: RegisterInput, session: DbSession):
    return register_user(session, data)


@router.post('/auth/login', response_model=TokenOutput)
def login(data: LoginInput, session: DbSession):
    user = authenticate_user(session, data)
    return TokenOutput(access_token=create_access_token(user.id))


@router.get('/dependents', response_model=list[DependentOutput])
def list_dependents(session: DbSession, user: CurrentUser):
    return session.scalars(select(Dependent).where(Dependent.caregiver_id == user.id).order_by(Dependent.id)).all()


@router.post('/dependents', response_model=DependentOutput, status_code=201)
def add_dependent(data: DependentCreate, session: DbSession, user: CurrentUser):
    return create_dependent(session, user.id, data)


@router.get('/dependents/{id}', response_model=DependentOutput)
def get_dependent(id: RecordId, session: DbSession, user: CurrentUser):
    return owned_dependent(session, id, user.id)


@router.patch('/dependents/{id}', response_model=DependentOutput)
def patch_dependent(id: RecordId, data: DependentPatch, session: DbSession, user: CurrentUser):
    return update_dependent(session, owned_dependent(session, id, user.id), data)


@router.delete('/dependents/{id}', status_code=204)
def delete_dependent(id: RecordId, session: DbSession, user: CurrentUser):
    session.delete(owned_dependent(session, id, user.id))
    session.commit()
    return Response(status_code=204)


@router.get('/dependents/{id}/meals', response_model=list[MealOutput])
def list_meals(id: RecordId, session: DbSession, user: CurrentUser):
    owned_dependent(session, id, user.id)
    return session.scalars(select(MealLog).where(MealLog.dependent_id == id)
                           .order_by(MealLog.created_at.desc(), MealLog.id.desc())).all()


@router.get('/dependents/{id}/alerts', response_model=list[AlertOutput])
def list_alerts(id: RecordId, session: DbSession, user: CurrentUser):
    owned_dependent(session, id, user.id)
    return session.scalars(select(Alert).where(Alert.dependent_id == id)
                           .order_by(Alert.created_at.desc(), Alert.id.desc())).all()


@router.patch('/alerts/{id}', response_model=AlertOutput)
def acknowledge_alert(id: RecordId, data: AlertPatch, session: DbSession, user: CurrentUser):
    alert = owned_alert(session, id, user.id)
    alert.status = data.status
    session.commit()
    session.refresh(alert)
    return alert


@router.post('/dependents/{id}/scan', response_model=ScanOutput)
def scan_product(id: RecordId, data: ScanInput, session: DbSession, user: CurrentUser):
    dependent = owned_dependent(session, id, user.id)
    barcode = validate_scan_input(data.barcode, dependent)
    product = fetch_product(barcode)
    profile = dependent.dietary_profile
    percentages = calculate_product_percentages(product, profile)
    allergy = check_allergy_match(profile.allergies, product['raw_response'])
    conflict = check_condition_conflict(profile.conditions, percentages)
    prediction = predict_risk(**percentages, has_allergy_match=allergy,
                              has_condition_conflict=conflict, age_band=age_band_for(dependent.age))
    # Auth/ownership reads already began this session's transaction. All scan
    # writes share its single commit; a failed flush/commit rolls back every write.
    try:
        stored_product = store_scan_product(session, product)
        meal = create_meal_log(session, dependent.id, stored_product.id, prediction)
        alert = create_alert_if_needed(session, meal)
        result = return_scan_result(product, percentages, prediction, meal, alert)
        session.commit()
    except Exception:
        session.rollback()
        raise
    return result
