"""Inference order, safety overrides, encoding and startup-only loading."""
from unittest.mock import Mock, patch

import pytest
from fastapi.testclient import TestClient

from app.errors import ApiError
from app.main import app
from app.ml import predict


def test_startup_loads_artifacts_once_and_predictions_do_not_reload(monkeypatch):
    monkeypatch.setattr(predict, '_model', None)
    monkeypatch.setattr(predict, '_feature_order', None)
    with patch.object(predict.joblib, 'load', wraps=predict.joblib.load) as load:
        with TestClient(app):
            predict.load_model()
            for _ in range(2):
                assert predict.predict_risk(.1, .1, .1, 0, 0, 'adult')['risk_label'] == 'safe'
        with TestClient(app):
            assert load.call_count == 1


def test_startup_rejects_incompatible_artifacts(monkeypatch):
    monkeypatch.setattr(predict, '_model', None)
    with patch.object(predict.joblib, 'load', return_value=object()):
        with pytest.raises(RuntimeError, match='incompatible'):
            with TestClient(app):
                pass
    assert predict._model is None


@pytest.mark.parametrize('ratios,allergy,conflict', [
    ((.1, .1, .1), 1, 0), ((.6, .1, .1), 0, 1), ((.1, .6, .1), 0, 1),
])
def test_hard_rules_never_call_tree(monkeypatch, ratios, allergy, conflict):
    model = Mock()
    model.predict.return_value = ['safe']
    monkeypatch.setattr(predict, '_model', model)
    assert predict.predict_risk(*ratios, allergy, conflict, 'adult')['risk_label'] == 'danger'
    model.predict.assert_not_called()


def test_carbohydrate_conflict_skips_tree(monkeypatch):
    model = Mock()
    model.predict.return_value = ['safe']
    monkeypatch.setattr(predict, '_model', model)
    result = predict.predict_risk(.1, .1, .1, 0, 1, 'adult', carbohydrate_pct=0.85, conditions=['diabetic'])
    assert result['risk_label'] == 'danger'
    assert 'Carbohydrate conflicts with the recorded diabetic condition.' in result['reasons']
    assert 'The product conflicts with a recorded dietary condition.' not in result['reasons']
    assert any(reason.startswith('Carbohydrate') for reason in result['reasons'])
    model.predict.assert_not_called()


def test_cholesterol_conflict_skips_tree(monkeypatch):
    model = Mock()
    model.predict.return_value = ['safe']
    monkeypatch.setattr(predict, '_model', model)
    result = predict.predict_risk(.1, .1, .1, 0, 1, 'adult', saturated_fat_pct=0.85,
                                  conditions=['high cholesterol'])
    assert result['risk_label'] == 'danger'
    assert 'Saturated fat conflicts with the recorded high cholesterol condition.' in result['reasons']
    assert 'The product conflicts with a recorded dietary condition.' not in result['reasons']
    assert any(reason.startswith('Saturated fat') for reason in result['reasons'])
    model.predict.assert_not_called()


@pytest.mark.parametrize('band', predict.AGE_BANDS)
def test_exact_saved_order_and_condition_boundary(monkeypatch, band):
    model = Mock()
    model.predict.return_value = ['warning']
    order = list(reversed(predict.FEATURES))
    monkeypatch.setattr(predict, '_model', model)
    monkeypatch.setattr(predict, '_feature_order', order)
    result = predict.predict_risk(.5, .5, 3, 0, 1, band)
    frame = model.predict.call_args.args[0]
    assert list(frame.columns) == order
    assert frame.iloc[0][f'age_band_{band}'] == 1
    assert sum(frame.iloc[0][f'age_band_{b}'] for b in predict.AGE_BANDS) == 1
    assert result['risk_label'] == 'warning'  # Otherwise use tree, even beyond training range.


def test_deterministic_threshold_reasons():
    assert predict.risk_reasons(1, .8, 1, 1, 1) == [
        "Sodium exceeds the dependent's daily target.",
        "Sugar is high compared with the dependent's daily target.",
        "Calories exceed the dependent's daily target.",
        'The product contains an ingredient associated with a recorded allergy.',
    ]
    assert predict.risk_reasons(.8, 1, .8, 0, 0) == [
        "Sodium is high compared with the dependent's daily target.",
        "Sugar exceeds the dependent's daily target.",
        "Calories are high compared with the dependent's daily target.",
    ]


def test_each_condition_sentence_names_only_its_rule():
    generic = 'The product conflicts with a recorded dietary condition.'
    sodium = predict.risk_reasons(0.6, 0.6, 0.1, 0, 1, conditions=['hypertension'])
    assert sodium == ['Sodium conflicts with the recorded hypertension condition.']
    sugar = predict.risk_reasons(0.6, 0.6, 0.1, 0, 1, conditions=['diabetic'])
    assert sugar == ['Sugar conflicts with the recorded diabetic condition.']
    carbohydrate = predict.risk_reasons(0.6, 0.1, 0.1, 0, 1, carbohydrate_pct=0.6, conditions=['diabetic'])
    assert carbohydrate == ['Carbohydrate conflicts with the recorded diabetic condition.']
    fat = predict.risk_reasons(0.6, 0.6, 0.1, 0, 1, saturated_fat_pct=0.6, conditions=['high cholesterol'])
    assert fat == ['Saturated fat conflicts with the recorded high cholesterol condition.']
    protein = predict.risk_reasons(0.1, 0.1, 0.1, 0, 1, protein_pct=0.85, conditions=['kidney disease'])
    assert "Protein is high compared with the dependent's daily target." in protein
    assert 'Protein conflicts with the recorded kidney disease condition.' in protein
    assert predict.PROTEIN_LIMIT_REASON in protein
    exceeds = predict.risk_reasons(0.1, 0.1, 0.1, 0, 1, protein_pct=1, conditions=['kidney disease'])
    assert "Protein exceeds the dependent's daily target." in exceeds
    for reasons in (sodium, sugar, carbohydrate, fat, protein, exceeds):
        assert generic not in reasons


@pytest.mark.parametrize('args', [(-1, 0, 0, 0, 0, 'adult'),
    (float('nan'), 0, 0, 0, 0, 'adult'), (float('inf'), 0, 0, 0, 0, 'adult'),
    (0, 0, 0, 2, 0, 'adult'), (0, 0, 0, 0, 0, 'unknown')])
def test_invalid_prediction_inputs(args):
    with pytest.raises(ApiError) as exc:
        predict.predict_risk(*args)
    assert exc.value.code == 'VALIDATION_ERROR'


def test_unloaded_model_and_invalid_prediction(monkeypatch):
    monkeypatch.setattr(predict, '_model', None)
    with pytest.raises(ApiError, match='not loaded'):
        predict.predict_risk(.1, .1, .1, 0, 0, 'adult')
    model = Mock()
    model.predict.return_value = ['invalid']
    monkeypatch.setattr(predict, '_model', model)
    monkeypatch.setattr(predict, '_feature_order', list(predict.FEATURES))
    with pytest.raises(ApiError, match='invalid label'):
        predict.predict_risk(.1, .1, .1, 0, 0, 'adult')
