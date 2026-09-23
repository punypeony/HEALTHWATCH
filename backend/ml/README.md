# Synthetic training data and risk model

From the repository root:

```powershell
backend/.venv/Scripts/python backend/ml/generate_training_data.py
```

From `backend` with the virtual environment active:

```powershell
python ml/generate_training_data.py
pytest -q tests/test_training_data.py
```

The output is always `backend/ml/training_data.csv`, independent of the working
directory. It contains exactly 5000 data rows, plus the header, in the requested
column order. Ratios represent per-100g product nutrition divided by a dependent's
daily target; they are fractions, so 0.8 means 80%, not 0.8%.

Sodium and sugar are sampled independently from a nonuniform mixture:

- 80%: `0.02 + 0.65 * Beta(2, 5)` for mostly small contributions.
- 18%: triangular distribution from 0.65 to 1.35 with mode 0.90.
- 2%: triangular distribution from 1.35 to 2.00 with mode 1.50.

Calories use 96% `0.02 + 0.65 * Beta(2, 5)` and 4% triangular draws from
0.65 to 2.00 with mode 0.90. Per-100g calorie contributions usually occupy a
smaller fraction of a full daily target than sodium/sugar; the high tail remains
for stress cases. The final dataset includes 176 calorie ratios >=0.8.

These are documented teaching-data assumptions, not measured food-population
statistics or medical evidence. Elevated examples deliberately provide coverage
around the warning and danger thresholds. Features are rounded to six decimal
places before labeling. Allergy and condition flags have independent probabilities
of 6% and 18%. Age bands are sampled with weights child/adult/elderly = 25/50/25;
age does not directly determine labels and stays categorical for later one-hot
encoding.

The generator uses a local `random.Random(42)`. It first computes every clean
label using the required priority rules. Then exactly 250 distinct rows (5%)
receive a randomly selected different label. Noise may change even an allergy
label; runtime hard safety overrides in `app/ml/predict.py` prevent allergy and
threshold-qualified condition conflicts from being classified below danger.

No labels are assigned to enforce class quotas. A balance check refuses to write
if any final class is below 10%; sampling assumptions must be adjusted in that
case. Seed 42 passes without regeneration or label fabrication:

| Class | Count | Percentage |
| --- | ---: | ---: |
| safe | 2949 | 58.98% |
| warning | 675 | 13.50% |
| danger | 1376 | 27.52% |

Reproducibility was checked by running the generator twice and comparing CSV
SHA-256 hashes: `ac77ed6219d98bac96c50edb272c590a764a929ca49fbe0c61bf0e6c639c271d`.
Tests also compare the generated CSV with the repository artifact, verify 250
changed labels, rule boundaries, unique feature rows, and coverage of every age
band, flag, and nutrient range.

## Train and evaluate

From `backend` with the virtual environment active:

```powershell
python ml/train_risk_model.py
python ml/evaluate.py
pytest -q tests/test_training_data.py tests/test_risk_training.py
```

Training uses the CSV as saved; it never regenerates data or changes labels.
It splits raw rows into 4000 training and 1000 testing examples, stratified by
`risk_label` with `random_state=42`. Fixed one-hot encoding produces:

```text
sodium_pct
sugar_pct
calorie_pct
has_allergy_match
has_condition_conflict
age_band_child
age_band_adult
age_band_elderly
```

The bare `DecisionTreeClassifier(max_depth=5, class_weight="balanced",
random_state=42)` is fitted only on the 4000 training rows. The saved model is
not refitted on the test set. Runtime `app/ml/predict.py` constructs the same
one-hot columns in the saved order, rejecting unknown age bands. Unlike training
validation, runtime accepts nonnegative ratios above 2 (real products can exceed
twice a daily target). No target labels enter prediction features.

Artifacts: `risk_model.pkl` (joblib), `feature_order.json`, `tree_readable.txt`
(full tree via `export_text`, thresholds shown to six decimals), `evaluation.txt`
and `evaluation.json` (metrics, dataset hash, split settings, library versions).
`evaluate.py` loads the saved model and repeats the held-out evaluation; a changed
dataset hash fails instead of silently reporting metrics for different data.
Loading pickle/joblib is only appropriate for trusted local artifacts.

The final accuracy is **92.90%**, with confusion matrix order safe/warning/danger:

```text
           predicted
true       safe warning danger
safe        577       5      8
warning      20     105     10
danger       19       9    247
```

Full precision, recall, F1 and support are in `evaluation.txt`. Warning recall
is 77.78%; overall accuracy does not mean every rule is perfectly learned.
The application applies allergy and condition safety overrides before using the
tree. Other cases use its prediction, including its imperfections near thresholds.

## Dataset investigation and limitations

The original dataset (20% elevated/extreme draws independently for every nutrient)
scored 85.2% with the exact requested model. Inspection of the exported tree showed
that independent high calorie/sodium/sugar ratios exhausted the five-level budget
before many allergy/condition cases could be split. One-hot encoding and the split
were correct; neither labels nor age encoding were used to leak the answer.

The calorie sampling assumption was revised as documented above; sodium/sugar
sampling, flag probabilities, rule priority and exactly 250 noisy labels were
retained. Before evaluating the revised holdout, training-only five-fold accuracy
was 91.0%, 91.125%, 93.25%, 93.125%, and 91.125%. No depth increase, split-seed
search, noise removal or rule-generated feature was used. The original holdout
informed the sampling investigation, so 92.9% is a development acceptance result
on the revised synthetic distribution, not an independent clinical validation.

Tests retrain twice and compare new artifact bytes. Against the committed model,
they compare every tree node/value, parameters, feature order, classes and all
dataset predictions; pickle memo-table bytes can differ after runtime loading.
Text artifacts are compared byte-for-byte. Reproduce with the environment recorded in
`evaluation.json` (Python 3.14.7, scikit-learn 1.9.1, pandas 3.0.6, joblib 1.6.0).
Library/version changes may change tree serialization and require retraining;
no dependencies were added by this training step.
