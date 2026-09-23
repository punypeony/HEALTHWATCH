import json

import joblib
import pandas as pd
import pytest
from sklearn.tree import DecisionTreeClassifier, export_text

from ml import train_risk_model as training
from ml.evaluate import evaluate_saved_model


def test_one_hot_order_is_stable_for_single_age_and_reordered_columns():
    data = training.load_training_data()
    for age in training.AGE_BANDS:
        features = data.loc[data.age_band == age, training.FEATURES].iloc[:2]
        encoded = training.encode_features(features[features.columns[::-1]])
        assert list(encoded.columns) == training.FEATURE_ORDER
        assert encoded[f'age_band_{age}'].eq(1).all()
        assert encoded.filter(like='age_band_').sum(axis=1).eq(1).all()
        assert 'risk_label' not in encoded


@pytest.mark.parametrize('column,value', [
    ('age_band', 'unknown'), ('sodium_pct', -0.1), ('calorie_pct', float('inf')),
    ('sugar_pct', float('nan')), ('has_allergy_match', 2),
])
def test_invalid_features_are_rejected(column, value):
    features = training.load_training_data()[training.FEATURES].iloc[:1].copy()
    features[column] = value
    with pytest.raises(ValueError):
        training.encode_features(features)


def test_dataset_validation_rejects_bad_rows(tmp_path):
    data = training.load_training_data()
    path = tmp_path / 'bad.csv'
    data.iloc[:-1].to_csv(path, index=False)
    with pytest.raises(ValueError, match='5000'):
        training.load_training_data(path)
    data.loc[1] = data.loc[0]
    data.to_csv(path, index=False)
    with pytest.raises(ValueError, match='Duplicate'):
        training.load_training_data(path)


def test_split_is_stratified_reproducible_and_disjoint():
    data = training.load_training_data()
    split = training.split_dataset(data)
    x_train, x_test, y_train, y_test = split
    assert len(x_train) == len(y_train) == 4000
    assert len(x_test) == len(y_test) == 1000
    assert set(x_train.index).isdisjoint(x_test.index)
    assert set(x_train.index) | set(x_test.index) == set(data.index)
    for label in training.LABELS:
        assert abs((y_test == label).sum() - (data.risk_label == label).sum() * 0.2) <= 1
    for first, second in zip(split, training.split_dataset(data)):
        assert first.equals(second)


def test_training_artifacts_and_accuracy_are_reproducible(tmp_path):
    x_train, x_test, y_train, y_test = training.split_dataset(training.load_training_data())
    first = training.train_model(x_train, y_train)
    second = training.train_model(x_train, y_train)
    assert isinstance(first, DecisionTreeClassifier)
    assert first.get_depth() <= 5
    assert first.get_params()['max_depth'] == 5
    assert first.get_params()['class_weight'] == 'balanced'
    assert first.get_params()['random_state'] == 42
    assert (first.predict(x_test) == second.predict(x_test)).all()
    metrics = training.evaluate_model(first, x_test, y_test)
    assert metrics['accuracy'] >= 0.90
    assert sum(map(sum, metrics['confusion_matrix'])) == 1000
    assert all({'precision', 'recall', 'f1-score', 'support'} <=
               metrics['classification_report'][label].keys() for label in training.LABELS)
    text = training.format_evaluation(metrics)
    assert 'Accuracy:' in text and 'Confusion matrix' in text
    for name, model in [('first', first), ('second', second)]:
        training.save_artifacts(model, metrics, tmp_path / name)
    for filename in ('risk_model.pkl', 'feature_order.json', 'tree_readable.txt', 'evaluation.json', 'evaluation.txt'):
        expected = (tmp_path / 'first' / filename).read_bytes()
        assert expected == (tmp_path / 'second' / filename).read_bytes()
        assert expected == (training.ML_DIR / filename).read_bytes()
    loaded = joblib.load(tmp_path / 'first' / 'risk_model.pkl')
    assert (loaded.predict(x_test) == first.predict(x_test)).all()
    order = json.loads((tmp_path / 'first' / 'feature_order.json').read_text())
    assert list(loaded.feature_names_in_) == order == training.FEATURE_ORDER
    assert (tmp_path / 'first' / 'tree_readable.txt').read_text() == export_text(first, feature_names=order, decimals=6)
    assert evaluate_saved_model() == metrics


def test_failed_accuracy_does_not_write_artifacts(tmp_path):
    with pytest.raises(ValueError, match='below 90%'):
        training.save_artifacts(None, {'accuracy': 0.89}, tmp_path / 'failed')
    assert not (tmp_path / 'failed').exists()
