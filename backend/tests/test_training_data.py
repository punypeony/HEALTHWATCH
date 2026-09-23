import csv
import random
from collections import Counter

import pytest

from ml.generate_training_data import (
    COLUMNS, OUTPUT_PATH, RATIO_COLUMNS, generate_rows, print_class_balance,
    rule_label, sample_ratio, write_dataset,
)


@pytest.mark.parametrize('sodium,sugar,calories,allergy,condition,expected', [
    (0.1, 0.1, 0.1, 1, 0, 'danger'),
    (0.500001, 0.1, 0.1, 0, 1, 'danger'),
    (0.1, 0.500001, 0.1, 0, 1, 'danger'),
    (0.5, 0.5, 0.5, 0, 1, 'safe'),
    (0.1, 0.1, 0.7, 0, 1, 'safe'),
    (0.799999, 0.1, 0.1, 0, 0, 'safe'),
    (0.8, 0.1, 0.1, 0, 0, 'warning'),
    (0.1, 0.8, 0.1, 0, 0, 'warning'),
    (0.1, 0.1, 0.8, 0, 0, 'warning'),
    (0.999999, 0.1, 0.1, 0, 0, 'warning'),
    (1.0, 0.1, 0.1, 0, 0, 'danger'),
    (0.1, 1.0, 0.1, 0, 0, 'danger'),
    (0.1, 0.1, 1.0, 0, 0, 'danger'),
])
def test_rule_priority_and_boundaries(sodium, sugar, calories, allergy, condition, expected):
    row = dict(zip(RATIO_COLUMNS, (sodium, sugar, calories)))
    row.update(has_allergy_match=allergy, has_condition_conflict=condition)
    assert rule_label(row) == expected


def test_dataset_shape_balance_and_coverage():
    rows = generate_rows()
    assert len(rows) == 5000
    assert all(tuple(row) == COLUMNS for row in rows)
    assert all(count >= 500 for count in Counter(row['risk_label'] for row in rows).values())
    assert {row['risk_label'] for row in rows} == {'safe', 'warning', 'danger'}
    for column in RATIO_COLUMNS:
        values = [row[column] for row in rows]
        assert all(0 <= value <= 2 for value in values)
        assert sum(0.05 <= value <= 0.6 for value in values) > 2500
        assert all(sum(low <= value < high for value in values) > 50
                   for low, high in [(0, 0.2), (0.2, 0.6), (0.8, 2.01)])
    for band in ('child', 'adult', 'elderly'):
        group = [row for row in rows if row['age_band'] == band]
        assert len(group) > 500
        assert {row['risk_label'] for row in group} == {'safe', 'warning', 'danger'}
        for flag in ('has_allergy_match', 'has_condition_conflict'):
            assert {row[flag] for row in group} == {0, 1}


def test_noise_is_applied_after_rules_to_exactly_five_percent():
    clean = generate_rows(add_noise=False)
    noisy = generate_rows()
    assert all(row['risk_label'] == rule_label(row) for row in clean)
    assert sum(a['risk_label'] != b['risk_label'] for a, b in zip(clean, noisy)) == 250
    assert all(tuple(a[key] for key in COLUMNS[:-1]) == tuple(b[key] for key in COLUMNS[:-1])
               for a, b in zip(clean, noisy))
    features = [tuple(row[key] for key in COLUMNS[:-1]) for row in clean]
    assert len(set(features)) == len(features)
    assert min(Counter(row['risk_label'] for row in clean).values()) >= 500


def test_reproducible_csv_matches_checked_in_data(tmp_path, capsys):
    first, second = tmp_path / 'first.csv', tmp_path / 'second.csv'
    rows = generate_rows()
    write_dataset(rows, first)
    write_dataset(generate_rows(), second)
    assert first.read_bytes() == second.read_bytes() == OUTPUT_PATH.read_bytes()
    with first.open(newline='') as source:
        assert len(list(csv.DictReader(source))) == 5000
    assert generate_rows(random_state=43) != rows
    print_class_balance(rows)
    output = capsys.readouterr().out
    assert 'Total samples: 5000' in output
    assert all(label + ':' in output for label in ('safe', 'warning', 'danger'))


def test_bad_balance_is_rejected_before_writing(tmp_path):
    rows = generate_rows()
    for row in rows:
        row['risk_label'] = 'safe'
    path = tmp_path / 'invalid.csv'
    with pytest.raises(ValueError, match='adjust feature sampling'):
        write_dataset(rows, path)
    assert not path.exists()


def test_sampler_reproducibility():
    first, second = random.Random(42), random.Random(42)
    assert [sample_ratio(first) for _ in range(100)] == [sample_ratio(second) for _ in range(100)]
