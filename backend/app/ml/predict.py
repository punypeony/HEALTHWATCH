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


def risk_reasons(sodium_pct, sugar_pct, calorie_pct, has_allergy_match,
                 has_condition_conflict) -> list[str]:
    """Describe input facts, independently of tree internals."""
    reasons = []
    for name, value, verb in (('Sodium', sodium_pct, 'exceeds'),
                              ('Sugar', sugar_pct, 'exceeds'),
                              ('Calories', calorie_pct, 'exceed')):
        if value >= 1:
            reasons.append(f"{name} {verb} the dependent's daily target.")
        elif value >= 0.8:
            be = 'are' if name == 'Calories' else 'is'
            reasons.append(f"{name} {be} high compared with the dependent's daily target.")
    if has_allergy_match:
        reasons.append('The product contains an ingredient associated with a recorded allergy.')
    if has_condition_conflict:
        reasons.append('The product conflicts with a recorded dietary condition.')
    return reasons


def predict_risk(sodium_pct, sugar_pct, calorie_pct, has_allergy_match,
                 has_condition_conflict, age_band) -> dict:
    values = (sodium_pct, sugar_pct, calorie_pct)
    if (any(isinstance(value, bool) or not isinstance(value, (int, float))
            or not math.isfinite(value) or value < 0 for value in values)
            or has_allergy_match not in (0, 1) or has_condition_conflict not in (0, 1)
            or age_band not in AGE_BANDS):
        raise ApiError(422, 'VALIDATION_ERROR', 'Risk prediction inputs are invalid.')
    reasons = risk_reasons(*values, has_allergy_match, has_condition_conflict)
    # Hard safety rules take priority, even if the tree would predict safe.
    if has_allergy_match:
        label = 'danger'
    elif has_condition_conflict and (sodium_pct > CONFLICT_THRESHOLD
                                    or sugar_pct > CONFLICT_THRESHOLD):
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
