"""Startup-loaded Decision Tree and deterministic safety checks/reasons."""
import json
import math
from pathlib import Path

import joblib
import pandas as pd
from sklearn.tree import DecisionTreeClassifier

from app.errors import ApiError

ARTIFACT_DIR = Path(__file__).resolve().parents[2] / 'ml'
AGE_BANDS = ('child', 'adult', 'elderly')
FEATURES = ('sodium_pct', 'sugar_pct', 'calorie_pct', 'has_allergy_match',
            'has_condition_conflict', *(f'age_band_{band}' for band in AGE_BANDS))
CONFLICT_THRESHOLD = 0.5
_model = None
_feature_order = None


def load_model() -> None:
    """Called by application lifespan, once per process; fail startup if invalid."""
    global _model, _feature_order
    if _model is not None:
        return
    # Only load trusted, repository-owned joblib artifacts (pickle executes code).
    order = json.loads((ARTIFACT_DIR / 'feature_order.json').read_text(encoding='utf-8'))
    model = joblib.load(ARTIFACT_DIR / 'risk_model.pkl')
    if (not isinstance(order, list) or len(order) != len(FEATURES)
            or set(order) != set(FEATURES)
            or not isinstance(model, DecisionTreeClassifier)
            or list(model.feature_names_in_) != order
            or set(model.classes_) != {'safe', 'warning', 'danger'}):
        raise RuntimeError('Risk model and feature order are incompatible.')
    _feature_order, _model = order, model


def _nutrient_reason(name, value) -> str | None:
    if value >= 1:
        verb = 'exceed' if name == 'Calories' else 'exceeds'
        return f"{name} {verb} the dependent's daily target."
    if value >= 0.8:
        be = 'are' if name == 'Calories' else 'is'
        return f"{name} {be} high compared with the dependent's daily target."
    return None


PROTEIN_LIMIT_REASON = (
    'This protein check uses the non-dialysis adult limit of 1.3 g per kg of body weight per day.'
)


def _conflict_reasons(conditions, sodium_pct, sugar_pct, saturated_fat_pct, carbohydrate_pct, protein_pct) -> list[str]:
    """One sentence per rule that fired. The generic condition sentence is not used."""
    normalized = {str(value).strip().lower() for value in conditions or ()}
    reasons = []
    if 'hypertension' in normalized and sodium_pct > CONFLICT_THRESHOLD:
        reasons.append('Sodium conflicts with the recorded hypertension condition.')
    if 'diabetic' in normalized and sugar_pct > CONFLICT_THRESHOLD:
        reasons.append('Sugar conflicts with the recorded diabetic condition.')
    if 'diabetic' in normalized and carbohydrate_pct is not None and carbohydrate_pct > CONFLICT_THRESHOLD:
        reasons.append('Carbohydrate conflicts with the recorded diabetic condition.')
    if ('high cholesterol' in normalized and saturated_fat_pct is not None
            and saturated_fat_pct > CONFLICT_THRESHOLD):
        reasons.append('Saturated fat conflicts with the recorded high cholesterol condition.')
    if 'kidney disease' in normalized and protein_pct is not None and protein_pct > CONFLICT_THRESHOLD:
        reasons.append('Protein conflicts with the recorded kidney disease condition.')
        reasons.append(PROTEIN_LIMIT_REASON)
    return reasons


def risk_reasons(sodium_pct, sugar_pct, calorie_pct, has_allergy_match,
                 has_condition_conflict, saturated_fat_pct=None, carbohydrate_pct=None,
                 protein_pct=None, conditions=()) -> list[str]:
    """Describe input facts, independently of tree internals."""
    reasons = []
    for name, value in (('Sodium', sodium_pct), ('Sugar', sugar_pct), ('Calories', calorie_pct)):
        reason = _nutrient_reason(name, value)
        if reason:
            reasons.append(reason)
    for name, value in (('Saturated fat', saturated_fat_pct), ('Carbohydrate', carbohydrate_pct),
                        ('Protein', protein_pct)):
        if value is None:
            continue
        reason = _nutrient_reason(name, value)
        if reason:
            reasons.append(reason)
    if has_allergy_match:
        reasons.append('The product contains an ingredient associated with a recorded allergy.')
    reasons.extend(_conflict_reasons(
        conditions, sodium_pct, sugar_pct, saturated_fat_pct, carbohydrate_pct, protein_pct))
    return reasons


def _optional_pct(value) -> bool:
    return value is None or (
        not isinstance(value, bool) and isinstance(value, (int, float))
        and math.isfinite(value) and value >= 0)


def predict_risk(sodium_pct, sugar_pct, calorie_pct, has_allergy_match,
                 has_condition_conflict, age_band, saturated_fat_pct=None,
                 carbohydrate_pct=None, protein_pct=None, conditions=()) -> dict:
    values = (sodium_pct, sugar_pct, calorie_pct)
    if (any(isinstance(value, bool) or not isinstance(value, (int, float))
            or not math.isfinite(value) or value < 0 for value in values)
            or has_allergy_match not in (0, 1) or has_condition_conflict not in (0, 1)
            or age_band not in AGE_BANDS
            or not _optional_pct(saturated_fat_pct) or not _optional_pct(carbohydrate_pct)
            or not _optional_pct(protein_pct)):
        raise ApiError(422, 'VALIDATION_ERROR', 'Risk prediction inputs are invalid.')
    reasons = risk_reasons(*values, has_allergy_match, has_condition_conflict,
                           saturated_fat_pct, carbohydrate_pct, protein_pct, conditions)
    fat_conflict = saturated_fat_pct is not None and saturated_fat_pct > CONFLICT_THRESHOLD
    carb_conflict = carbohydrate_pct is not None and carbohydrate_pct > CONFLICT_THRESHOLD
    protein_conflict = protein_pct is not None and protein_pct > CONFLICT_THRESHOLD
    # Hard safety rules take priority, even if the tree would predict safe.
    if has_allergy_match:
        label = 'danger'
    elif has_condition_conflict and (sodium_pct > CONFLICT_THRESHOLD
                                    or sugar_pct > CONFLICT_THRESHOLD
                                    or fat_conflict or carb_conflict or protein_conflict):
        label = 'danger'
    else:
        if _model is None:
            raise ApiError(503, 'MODEL_UNAVAILABLE', 'Risk model is not loaded.')
        features = dict(zip(FEATURES[:5], (*values, has_allergy_match, has_condition_conflict)))
        features.update({f'age_band_{band}': int(age_band == band) for band in AGE_BANDS})
        # Preserve the exact saved training order; no disk reads per prediction.
        frame = pd.DataFrame([features], columns=_feature_order)
        label = str(_model.predict(frame)[0])
        if label not in ('safe', 'warning', 'danger'):
            raise ApiError(503, 'MODEL_UNAVAILABLE', 'Risk model returned an invalid label.')
    if not reasons:
        # Do not imply medical safety or invent a threshold explanation.
        reasons = [f'The nutrition classifier assigned a {label} risk label for this product.']
    return {'risk_label': label, 'reasons': reasons}
