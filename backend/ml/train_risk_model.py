"""Train and evaluate the required shallow Decision Tree without test leakage."""
import hashlib
import json
import platform
from pathlib import Path

import joblib
import pandas as pd
import sklearn
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier, export_text

ML_DIR = Path(__file__).resolve().parent
DATA_PATH = ML_DIR / 'training_data.csv'
RANDOM_STATE = 42
MIN_ACCURACY = 0.90
LABELS = ['safe', 'warning', 'danger']
AGE_BANDS = ['child', 'adult', 'elderly']
NUMERIC_FEATURES = ['sodium_pct', 'sugar_pct', 'calorie_pct',
                    'has_allergy_match', 'has_condition_conflict']
FEATURES = NUMERIC_FEATURES + ['age_band']
FEATURE_ORDER = NUMERIC_FEATURES + [f'age_band_{band}' for band in AGE_BANDS]


def load_training_data(path: Path = DATA_PATH) -> pd.DataFrame:
    data = pd.read_csv(path)
    if list(data.columns) != FEATURES + ['risk_label'] or len(data) != 5000:
        raise ValueError('Expected exactly 5000 rows with the specified training columns.')
    if data.isna().any().any():
        raise ValueError('Training data must not contain missing values.')
    encode_features(data[FEATURES])  # Validate values before splitting.
    if not data.risk_label.isin(LABELS).all():
        raise ValueError('Unknown risk label.')
    if any((data.risk_label == label).mean() < 0.10 for label in LABELS):
        raise ValueError('Every risk class must contain at least 10% of samples.')
    if data.duplicated(subset=FEATURES).any():
        raise ValueError('Duplicate feature rows could leak across train and test sets.')
    return data


def encode_features(features: pd.DataFrame) -> pd.DataFrame:
    """Fixed one-hot categories work identically for training, test and inference.

    No label-dependent transformations, scaling or fitted statistics are used.
    Unknown age bands fail rather than silently becoming an all-zero vector.
    """
    if set(features.columns) != set(FEATURES):
        raise ValueError('Expected only the six input features.')
    numeric = features[NUMERIC_FEATURES].apply(pd.to_numeric, errors='raise')
    if not numeric.iloc[:, :3].apply(lambda column: column.between(0, 2)).all().all():
        raise ValueError('Nutrition fractions must be finite and between 0 and 2.')
    if not numeric.iloc[:, 3:].isin([0, 1]).all().all():
        raise ValueError('Risk flags must be binary.')
    if not features.age_band.isin(AGE_BANDS).all():
        raise ValueError('Unknown age band.')
    encoded = numeric.copy()
    for band in AGE_BANDS:
        encoded[f'age_band_{band}'] = (features.age_band == band).astype(int)
    return encoded[FEATURE_ORDER].astype(float)


def split_dataset(data: pd.DataFrame):
    train, test = train_test_split(data, test_size=0.20,
                                  stratify=data.risk_label, random_state=RANDOM_STATE)
    return (encode_features(train[FEATURES]), encode_features(test[FEATURES]),
            train.risk_label, test.risk_label)


def train_model(x_train: pd.DataFrame, y_train: pd.Series) -> DecisionTreeClassifier:
    model = DecisionTreeClassifier(max_depth=5, class_weight='balanced', random_state=42)
    return model.fit(x_train, y_train)


def evaluate_model(model: DecisionTreeClassifier, x_test: pd.DataFrame, y_test: pd.Series) -> dict:
    predictions = model.predict(x_test)
    return {
        'accuracy': float(accuracy_score(y_test, predictions)),
        'labels': LABELS,
        'confusion_matrix': confusion_matrix(y_test, predictions, labels=LABELS).tolist(),
        'classification_report': classification_report(
            y_test, predictions, labels=LABELS, output_dict=True, zero_division=0),
        'report_text': classification_report(
            y_test, predictions, labels=LABELS, digits=4, zero_division=0),
    }


def format_evaluation(metrics: dict) -> str:
    matrix = '\n'.join(' '.join(f'{count:5d}' for count in row)
                       for row in metrics['confusion_matrix'])
    return (f"Accuracy: {metrics['accuracy']:.2%}\n"
            'Confusion matrix (rows=true, columns=predicted; safe, warning, danger):\n'
            f"{matrix}\n\n{metrics['report_text']}")


def save_artifacts(model, metrics: dict, output_dir: Path = ML_DIR, data_path: Path = DATA_PATH) -> None:
    if metrics['accuracy'] < MIN_ACCURACY:
        raise ValueError('Accuracy below 90%. Inspect sampling/encoding/training; do not increase depth.')
    if model.get_depth() > 5 or list(model.feature_names_in_) != FEATURE_ORDER:
        raise ValueError('Model depth or feature order violates the training contract.')
    output_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, output_dir / 'risk_model.pkl')
    (output_dir / 'feature_order.json').write_text(
        json.dumps(FEATURE_ORDER, indent=2) + '\n', encoding='utf-8', newline='\n')
    (output_dir / 'tree_readable.txt').write_text(
        export_text(model, feature_names=FEATURE_ORDER, decimals=6), encoding='utf-8', newline='\n')
    metadata = {
        'dataset_sha256': hashlib.sha256(data_path.read_bytes()).hexdigest(),
        'python': platform.python_version(), 'scikit_learn': sklearn.__version__,
        'pandas': pd.__version__, 'joblib': joblib.__version__,
        'random_state': RANDOM_STATE, 'train_samples': 4000, 'test_samples': 1000,
        'max_depth': 5, 'class_weight': 'balanced', **metrics,
    }
    (output_dir / 'evaluation.json').write_text(
        json.dumps(metadata, indent=2) + '\n', encoding='utf-8', newline='\n')
    (output_dir / 'evaluation.txt').write_text(format_evaluation(metrics), encoding='utf-8', newline='\n')


def main() -> None:
    data = load_training_data()
    x_train, x_test, y_train, y_test = split_dataset(data)
    model = train_model(x_train, y_train)
    metrics = evaluate_model(model, x_test, y_test)
    print(format_evaluation(metrics))
    save_artifacts(model, metrics)
    print(f'Saved model artifacts to {ML_DIR}')


if __name__ == '__main__':
    main()
