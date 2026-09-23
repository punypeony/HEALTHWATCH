"""Evaluate the saved local model on the same held-out 20% split."""
import hashlib
import json

import joblib

if __package__:
    from .train_risk_model import (DATA_PATH, ML_DIR, FEATURE_ORDER, MIN_ACCURACY,
                                  load_training_data, split_dataset, evaluate_model, format_evaluation)
else:
    from train_risk_model import (DATA_PATH, ML_DIR, FEATURE_ORDER, MIN_ACCURACY,
                                 load_training_data, split_dataset, evaluate_model, format_evaluation)


def evaluate_saved_model() -> dict:
    metadata = json.loads((ML_DIR / 'evaluation.json').read_text(encoding='utf-8'))
    if hashlib.sha256(DATA_PATH.read_bytes()).hexdigest() != metadata['dataset_sha256']:
        raise ValueError('Dataset changed since training; retrain before evaluating.')
    order = json.loads((ML_DIR / 'feature_order.json').read_text(encoding='utf-8'))
    if order != FEATURE_ORDER:
        raise ValueError('Saved feature order does not match the encoder.')
    # Only load the trusted repository artifact; pickle is not safe for uploads.
    model = joblib.load(ML_DIR / 'risk_model.pkl')
    if list(model.feature_names_in_) != order or model.get_depth() > 5:
        raise ValueError('Saved model does not match the training contract.')
    _, x_test, _, y_test = split_dataset(load_training_data())
    return evaluate_model(model, x_test, y_test)


if __name__ == '__main__':
    result = evaluate_saved_model()
    print(format_evaluation(result))
    if result['accuracy'] < MIN_ACCURACY:
        raise SystemExit('Accuracy below the required 90%.')
