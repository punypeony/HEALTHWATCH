"""Evaluate the saved local model on the same held-out 20% split."""
import hashlib
import json
from pathlib import Path

import joblib

if __package__:
    from .train_risk_model import (DATA_PATH, ML_DIR, FEATURE_ORDER, LABELS, MIN_ACCURACY, RANDOM_STATE,
                                  load_training_data, split_dataset, evaluate_model, format_evaluation)
else:
    from train_risk_model import (DATA_PATH, ML_DIR, FEATURE_ORDER, LABELS, MIN_ACCURACY, RANDOM_STATE,
                                 load_training_data, split_dataset, evaluate_model, format_evaluation)

REPORT_PATH = ML_DIR.parents[1] / 'docs' / 'MODEL_EVALUATION.md'


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


def write_model_evaluation(metrics: dict, model, data, path: Path = REPORT_PATH) -> None:
    """Write the report from this process's measurements. Do not invent figures."""
    counts = data.risk_label.value_counts()
    matrix_header = '| True \\ Predicted | ' + ' | '.join(LABELS) + ' |'
    matrix_rows = '\n'.join(
        '| ' + label + ' | ' + ' | '.join(str(count) for count in row) + ' |'
        for label, row in zip(LABELS, metrics['confusion_matrix'])
    )
    report_rows = '\n'.join(
        f"| {label} | {stats['precision']:.4f} | {stats['recall']:.4f} | "
        f"{stats['f1-score']:.4f} | {int(stats['support'])} |"
        for label in LABELS
        for stats in [metrics['classification_report'][label]]
    )
    importances = '\n'.join(
        f'| {name} | {importance:.6f} |'
        for name, importance in zip(model.feature_names_in_, model.feature_importances_)
    )
    tree = (ML_DIR / 'tree_readable.txt').read_text(encoding='utf-8').rstrip()
    params = model.get_params()
    test_samples = sum(sum(row) for row in metrics['confusion_matrix'])
    document = f"""# Model evaluation

This report was written by `backend/ml/evaluate.py` from the committed decision tree and `backend/ml/training_data.csv`. Figures below are that run's measurements.

## 1. Dataset

- Samples: {len(data)}
- Features: {', '.join(FEATURE_ORDER)}
- Classes: {', '.join(LABELS)}
- Class counts: {', '.join(f'{label} {int(counts[label])}' for label in LABELS)}

## 2. Accuracy

Test accuracy: {metrics['accuracy']:.4f} ({metrics['accuracy']:.2%}) on the held-out 20% split ({test_samples} samples).

## 3. Confusion matrix

Rows are the true label. Columns are the predicted label, in the order safe, warning, danger.

{matrix_header}
| --- | ---: | ---: | ---: |
{matrix_rows}

## 4. Classification report

| Class | Precision | Recall | F1 | Support |
| --- | ---: | ---: | ---: | ---: |
{report_rows}

## 5. Feature importance

Values are `model.feature_importances_` on the loaded tree, in `feature_names_in_` order.

| Feature | Importance |
| --- | ---: |
{importances}

## 6. Tree

Contents of `backend/ml/tree_readable.txt`:

```text
{tree}
```

## 7. Reproducibility

- Random seed: {RANDOM_STATE}
- Split: 80% train / 20% test, stratified by `risk_label`, `train_test_split(..., random_state={RANDOM_STATE})`
- Model: `DecisionTreeClassifier(max_depth={params['max_depth']}, class_weight={params['class_weight']!r}, random_state={params['random_state']})`
- Preprocessing: nutrition ratios and the two binary flags are used as numbers. `age_band` is one-hot encoded to `age_band_child`, `age_band_adult`, and `age_band_elderly` with a fixed category list. No scaling and no statistics fitted on the labels are used. The same encoder runs for training, the test split, and API inference.
"""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(document, encoding='utf-8', newline='\n')


if __name__ == '__main__':
    loaded = joblib.load(ML_DIR / 'risk_model.pkl')
    dataset = load_training_data()
    result = evaluate_saved_model()
    print(format_evaluation(result))
    write_model_evaluation(result, loaded, dataset)
    print(f'Wrote {REPORT_PATH}')
    if result['accuracy'] < MIN_ACCURACY:
        raise SystemExit('Accuracy below the required 90%.')
