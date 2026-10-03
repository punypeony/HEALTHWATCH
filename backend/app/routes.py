"""HTTP endpoints for accounts and caregiver-owned resources."""
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Path, Query, Response
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.auth import (CurrentUser, DbSession, authenticate_user, create_access_token, register_user)
from app.dependents import create_dependent, owned_alert, owned_dependent, owned_meal, update_dependent
from app.dishes import resolve_dish
from app.intake import daily_intake
from app.food_lookup import fetch_product
from app.ml.predict import predict_risk
from app.scan import (validate_scan_input, require_dietary_profile, calculate_product_percentages, check_allergy_match,
                      check_condition_conflict, has_high_cholesterol, has_condition,
                      saturated_fat_per_100g, saturated_fat_percentage, carbohydrate_per_100g,
                      carbohydrate_percentage, require_protein_per_100g, protein_percentage,
                      reported_grams, age_band_for, store_scan_product, create_meal_log,
                      create_alert_if_needed, return_scan_result)
from app.models import Alert, Dependent, MealLog
from app.schemas import (AlertOutput, AlertPatch, DailyIntakeOutput, DependentCreate, DependentOutput,
                         DependentPatch, LoginInput, MealEatenInput, MealEatenOutput, MealOutput,
                         RegisterInput, TokenOutput, UserOutput, ScanInput, ScanOutput, WeeklySummaryOutput)
from app.summary import weekly_summary

router = APIRouter()
RecordId = Annotated[int, Path(ge=1, le=2147483647)]


@router.post('/auth/register', response_model=UserOutput, status_code=201)
def register(data: RegisterInput, session: DbSession):
    return register_user(session, data)


@router.post('/auth/login', response_model=TokenOutput)
def login(data: LoginInput, session: DbSession):
    user = authenticate_user(session, data)
    return TokenOutput(access_token=create_access_token(user.id))


@router.get('/auth/me', response_model=UserOutput)
def current_user(user: CurrentUser):
    return user


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
                           .options(selectinload(MealLog.product))
                           .order_by(MealLog.created_at.desc(), MealLog.id.desc())).all()


@router.delete('/dependents/{id}/meals', status_code=204)
def delete_meals(id: RecordId, session: DbSession, user: CurrentUser):
    owned_dependent(session, id, user.id)
    meals = session.scalars(select(MealLog).where(MealLog.dependent_id == id)).all()
    for meal in meals:
        session.delete(meal)
    session.commit()
    return Response(status_code=204)


@router.get('/dependents/{id}/alerts', response_model=list[AlertOutput])
def list_alerts(id: RecordId, session: DbSession, user: CurrentUser):
    owned_dependent(session, id, user.id)
    return session.scalars(
        select(Alert).where(Alert.dependent_id == id)
        .options(selectinload(Alert.meal_log).selectinload(MealLog.product))
        .order_by(Alert.created_at.desc(), Alert.id.desc())
    ).all()


@router.patch('/alerts/{id}', response_model=AlertOutput)
def acknowledge_alert(id: RecordId, data: AlertPatch, session: DbSession, user: CurrentUser):
    alert = owned_alert(session, id, user.id)
    alert.status = data.status
    session.commit()
    session.refresh(alert)
    _ = alert.meal_log.product
    return alert


@router.get('/dependents/{id}/daily-intake', response_model=DailyIntakeOutput)
def get_daily_intake(id: RecordId, session: DbSession, user: CurrentUser,
                     intake_date: Annotated[date | None, Query(alias='date')] = None):
    dependent = owned_dependent(session, id, user.id)
    return daily_intake(session, dependent, intake_date)


@router.delete('/meals/{id}', status_code=204)
def delete_meal(id: RecordId, session: DbSession, user: CurrentUser):
    session.delete(owned_meal(session, id, user.id))
    session.commit()
    return Response(status_code=204)


@router.patch('/meals/{id}', response_model=MealEatenOutput)
def mark_meal_eaten(id: RecordId, data: MealEatenInput, session: DbSession, user: CurrentUser):
    meal = owned_meal(session, id, user.id)
    meal.eaten = True
    meal.grams_eaten = data.grams_eaten
    session.commit()
    session.refresh(meal)
    return meal


@router.get('/dependents/{id}/summary/weekly', response_model=WeeklySummaryOutput)
def get_weekly_summary(id: RecordId, session: DbSession, user: CurrentUser):
    owned_dependent(session, id, user.id)
    result = weekly_summary(session, id)
    session.commit()
    return result


@router.post('/dependents/{id}/scan', response_model=ScanOutput)
def scan_product(id: RecordId, data: ScanInput, session: DbSession, user: CurrentUser):
    dependent = owned_dependent(session, id, user.id)
    if data.dish_name is not None:
        require_dietary_profile(dependent)
        product = resolve_dish(data.dish_name)
    else:
        barcode = validate_scan_input(data.barcode, dependent)
        product = fetch_product(barcode)
    profile = dependent.dietary_profile
    percentages = calculate_product_percentages(product, profile)
    raw = product['raw_response']
    protein_grams = None
    protein_pct = None
    if has_condition(profile.conditions, 'kidney disease'):
        protein_grams = require_protein_per_100g(raw)
        if dependent.age >= 12:
            protein_pct = protein_percentage(raw, dependent.weight_kg)
    saturated_fat_grams = saturated_fat_per_100g(raw) if has_high_cholesterol(profile.conditions) else None
    saturated_fat_pct = (saturated_fat_percentage(raw, profile)
                         if saturated_fat_grams is not None else None)
    carbohydrate_grams = (carbohydrate_per_100g(raw)
                          if has_condition(profile.conditions, 'diabetic') else None)
    carbohydrate_pct = (carbohydrate_percentage(raw, profile)
                        if carbohydrate_grams is not None else None)
    allergy = check_allergy_match(profile.allergies, raw)
    conflict = check_condition_conflict(profile.conditions, percentages, saturated_fat_pct,
                                        carbohydrate_pct, protein_pct)
    prediction = predict_risk(**percentages, has_allergy_match=allergy,
                              has_condition_conflict=conflict, age_band=age_band_for(dependent.age),
                              saturated_fat_pct=saturated_fat_pct, carbohydrate_pct=carbohydrate_pct,
                              protein_pct=protein_pct, conditions=profile.conditions)
    # Auth/ownership reads already began this session's transaction. All scan
    # writes share its single commit; a failed flush/commit rolls back every write.
    try:
        stored_product = store_scan_product(session, product)
        meal = create_meal_log(session, dependent.id, stored_product.id, prediction)
        alert = create_alert_if_needed(session, meal)
        result = return_scan_result(
            product, percentages, prediction, meal, alert,
            allergies=profile.allergies,
            saturated_fat_g=reported_grams(saturated_fat_grams, saturated_fat_pct),
            carbohydrate_g=reported_grams(carbohydrate_grams, carbohydrate_pct),
            protein_g=reported_grams(protein_grams, protein_pct))
        session.commit()
    except Exception:
        session.rollback()
        raise
    return result
