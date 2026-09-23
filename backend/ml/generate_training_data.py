"""Reproducible synthetic examples of the project's risk rules.

Ratios mean product nutrition per 100g / dependent daily target (0.8 = 80%).
The mixture below is a teaching-data assumption, not a measured food population.
Features are sampled first; labels are never assigned to meet class quotas.
Age remains categorical for one-hot encoding during later training.
"""
import csv
import random
from collections import Counter
from pathlib import Path

RANDOM_STATE = 42
SAMPLE_COUNT = 5000
NOISE_COUNT = 250  # Exactly 5%; replacements always differ from the rule label.
LABELS = ('safe', 'warning', 'danger')
AGE_BANDS = ('child', 'adult', 'elderly')
RATIO_COLUMNS = ('sodium_pct', 'sugar_pct', 'calorie_pct')
COLUMNS = (*RATIO_COLUMNS, 'has_allergy_match', 'has_condition_conflict',
           'age_band', 'risk_label')
OUTPUT_PATH = Path(__file__).resolve().with_name('training_data.csv')


def sample_ratio(rng: random.Random) -> float:
    """80% low-skew beta draws, 18% elevated, 2% extreme triangular draws."""
    component = rng.random()
    if component < 0.80:
        value = 0.02 + 0.65 * rng.betavariate(2, 5)
    elif component < 0.98:
        value = rng.triangular(0.65, 1.35, 0.90)
    else:
        value = rng.triangular(1.35, 2.0, 1.50)
    # Label the stored precision, avoiding discrepancies after CSV serialization.
    return round(value, 6)


def sample_calorie_ratio(rng: random.Random) -> float:
    """Per-100g calories usually contribute less than a full daily energy target.

    Use 96% low-skew draws and 4% elevated draws, retaining calorie-only risk
    cases. These are synthetic assumptions, not empirical nutrition estimates.
    """
    if rng.random() < 0.96:
        value = 0.02 + 0.65 * rng.betavariate(2, 5)
    else:
        value = rng.triangular(0.65, 2.0, 0.90)
    return round(value, 6)


def rule_label(row: dict) -> str:
    """Apply the specified deterministic rules in priority order."""
    if row['has_allergy_match'] == 1:
        return 'danger'
    if row['has_condition_conflict'] == 1 and (
        row['sodium_pct'] > 0.5 or row['sugar_pct'] > 0.5
    ):
        return 'danger'
    maximum = max(row[column] for column in RATIO_COLUMNS)
    if maximum >= 1.0:
        return 'danger'
    if maximum >= 0.8:
        return 'warning'
    return 'safe'


def generate_rows(random_state: int = RANDOM_STATE, *, add_noise: bool = True) -> list[dict]:
    """Generate all features and rule labels before any noise is introduced."""
    rng = random.Random(random_state)
    rows = []
    for _ in range(SAMPLE_COUNT):
        row = dict(sodium_pct=sample_ratio(rng), sugar_pct=sample_ratio(rng),
                   calorie_pct=sample_calorie_ratio(rng))
        row.update(
            has_allergy_match=int(rng.random() < 0.06),
            has_condition_conflict=int(rng.random() < 0.18),
            age_band=rng.choices(AGE_BANDS, weights=(0.25, 0.50, 0.25))[0],
        )
        row['risk_label'] = rule_label(row)
        rows.append(row)

    if add_noise:
        for index in rng.sample(range(SAMPLE_COUNT), NOISE_COUNT):
            original = rows[index]['risk_label']
            rows[index]['risk_label'] = rng.choice([label for label in LABELS if label != original])
    return rows


def write_dataset(rows: list[dict], path: Path = OUTPUT_PATH) -> None:
    """Validate class balance before replacing the CSV, with stable line endings."""
    counts = Counter(row['risk_label'] for row in rows)
    if len(rows) != SAMPLE_COUNT or any(counts[label] < SAMPLE_COUNT * 0.10 for label in LABELS):
        raise ValueError('Expected 5000 rows with every class >=10%; adjust feature sampling, not labels.')
    with path.open('w', encoding='utf-8', newline='') as output:
        writer = csv.DictWriter(output, fieldnames=COLUMNS, lineterminator='\n')
        writer.writeheader()
        writer.writerows(rows)


def print_class_balance(rows: list[dict]) -> None:
    counts = Counter(row['risk_label'] for row in rows)
    print(f'Total samples: {len(rows)}')
    for label in LABELS:
        print(f'{label}: {counts[label]} ({counts[label] / len(rows):.2%})')


if __name__ == '__main__':
    dataset = generate_rows()
    print_class_balance(dataset)
    write_dataset(dataset)
    print(f'Saved: {OUTPUT_PATH}')
