# Synthetic training data

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

Each nutrient is sampled independently from a nonuniform mixture:

- 80%: `0.02 + 0.65 * Beta(2, 5)` for mostly small contributions.
- 18%: triangular distribution from 0.65 to 1.35 with mode 0.90.
- 2%: triangular distribution from 1.35 to 2.00 with mode 1.50.

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
label; runtime hard safety overrides remain a separate later requirement.

No labels are assigned to enforce class quotas. A balance check refuses to write
if any final class is below 10%; sampling assumptions must be adjusted in that
case. Seed 42 passes without regeneration or label fabrication:

| Class | Count | Percentage |
| --- | ---: | ---: |
| safe | 2530 | 50.60% |
| warning | 854 | 17.08% |
| danger | 1616 | 32.32% |

Reproducibility was checked by running the generator twice and comparing CSV
SHA-256 hashes: `67C46E3D35D95865788946ADDB4B67116FFF1B5026866445E633A4573858833B`.
Tests also compare the generated CSV with the repository artifact, verify 250
changed labels, rule boundaries, unique feature rows, and coverage of every age
band, flag, and nutrient range. No model training is implemented in this step.
