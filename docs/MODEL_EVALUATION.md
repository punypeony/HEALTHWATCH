# Model evaluation

This report was written by `backend/ml/evaluate.py` from the committed decision tree and `backend/ml/training_data.csv`. Figures below are that run's measurements.

## 1. Dataset

- Samples: 5000
- Features: sodium_pct, sugar_pct, calorie_pct, has_allergy_match, has_condition_conflict, age_band_child, age_band_adult, age_band_elderly
- Classes: safe, warning, danger
- Class counts: safe 2949, warning 675, danger 1376

## 2. Accuracy

Test accuracy: 0.9290 (92.90%) on the held-out 20% split (1000 samples).

## 3. Confusion matrix

Rows are the true label. Columns are the predicted label, in the order safe, warning, danger.

| True \ Predicted | safe | warning | danger |
| --- | ---: | ---: | ---: |
| safe | 577 | 5 | 8 |
| warning | 20 | 105 | 10 |
| danger | 19 | 9 | 247 |

## 4. Classification report

| Class | Precision | Recall | F1 | Support |
| --- | ---: | ---: | ---: | ---: |
| safe | 0.9367 | 0.9780 | 0.9569 | 590 |
| warning | 0.8824 | 0.7778 | 0.8268 | 135 |
| danger | 0.9321 | 0.8982 | 0.9148 | 275 |

## 5. Feature importance

Values are `model.feature_importances_` on the loaded tree, in `feature_names_in_` order.

| Feature | Importance |
| --- | ---: |
| sodium_pct | 0.383179 |
| sugar_pct | 0.307580 |
| calorie_pct | 0.074067 |
| has_allergy_match | 0.128135 |
| has_condition_conflict | 0.106484 |
| age_band_child | 0.000000 |
| age_band_adult | 0.000000 |
| age_band_elderly | 0.000554 |

## 6. Tree

Contents of `backend/ml/tree_readable.txt`:

```text
|--- sugar_pct <= 0.999739
|   |--- sugar_pct <= 0.801483
|   |   |--- sodium_pct <= 0.798984
|   |   |   |--- has_allergy_match <= 0.500000
|   |   |   |   |--- calorie_pct <= 0.795199
|   |   |   |   |   |--- class: safe
|   |   |   |   |--- calorie_pct >  0.795199
|   |   |   |   |   |--- class: danger
|   |   |   |--- has_allergy_match >  0.500000
|   |   |   |   |--- sodium_pct <= 0.113659
|   |   |   |   |   |--- class: danger
|   |   |   |   |--- sodium_pct >  0.113659
|   |   |   |   |   |--- class: danger
|   |   |--- sodium_pct >  0.798984
|   |   |   |--- sodium_pct <= 0.999934
|   |   |   |   |--- has_condition_conflict <= 0.500000
|   |   |   |   |   |--- class: warning
|   |   |   |   |--- has_condition_conflict >  0.500000
|   |   |   |   |   |--- class: danger
|   |   |   |--- sodium_pct >  0.999934
|   |   |   |   |--- calorie_pct <= 0.049550
|   |   |   |   |   |--- class: danger
|   |   |   |   |--- calorie_pct >  0.049550
|   |   |   |   |   |--- class: danger
|   |--- sugar_pct >  0.801483
|   |   |--- has_condition_conflict <= 0.500000
|   |   |   |--- sodium_pct <= 0.998619
|   |   |   |   |--- has_allergy_match <= 0.500000
|   |   |   |   |   |--- class: warning
|   |   |   |   |--- has_allergy_match >  0.500000
|   |   |   |   |   |--- class: danger
|   |   |   |--- sodium_pct >  0.998619
|   |   |   |   |--- class: danger
|   |   |--- has_condition_conflict >  0.500000
|   |   |   |--- calorie_pct <= 0.388379
|   |   |   |   |--- class: danger
|   |   |   |--- calorie_pct >  0.388379
|   |   |   |   |--- sugar_pct <= 0.814132
|   |   |   |   |   |--- class: safe
|   |   |   |   |--- sugar_pct >  0.814132
|   |   |   |   |   |--- class: danger
|--- sugar_pct >  0.999739
|   |--- calorie_pct <= 0.230860
|   |   |--- calorie_pct <= 0.230312
|   |   |   |--- calorie_pct <= 0.073477
|   |   |   |   |--- calorie_pct <= 0.070176
|   |   |   |   |   |--- class: danger
|   |   |   |   |--- calorie_pct >  0.070176
|   |   |   |   |   |--- class: warning
|   |   |   |--- calorie_pct >  0.073477
|   |   |   |   |--- calorie_pct <= 0.143067
|   |   |   |   |   |--- class: danger
|   |   |   |   |--- calorie_pct >  0.143067
|   |   |   |   |   |--- class: danger
|   |   |--- calorie_pct >  0.230312
|   |   |   |--- class: warning
|   |--- calorie_pct >  0.230860
|   |   |--- sodium_pct <= 0.100991
|   |   |   |--- sodium_pct <= 0.099046
|   |   |   |   |--- sugar_pct <= 1.264913
|   |   |   |   |   |--- class: danger
|   |   |   |   |--- sugar_pct >  1.264913
|   |   |   |   |   |--- class: danger
|   |   |   |--- sodium_pct >  0.099046
|   |   |   |   |--- class: safe
|   |   |--- sodium_pct >  0.100991
|   |   |   |--- sugar_pct <= 1.010805
|   |   |   |   |--- age_band_elderly <= 0.500000
|   |   |   |   |   |--- class: danger
|   |   |   |   |--- age_band_elderly >  0.500000
|   |   |   |   |   |--- class: safe
|   |   |   |--- sugar_pct >  1.010805
|   |   |   |   |--- class: danger
```

## 7. Reproducibility

- Random seed: 42
- Split: 80% train / 20% test, stratified by `risk_label`, `train_test_split(..., random_state=42)`
- Model: `DecisionTreeClassifier(max_depth=5, class_weight='balanced', random_state=42)`
- Preprocessing: nutrition ratios and the two binary flags are used as numbers. `age_band` is one-hot encoded to `age_band_child`, `age_band_adult`, and `age_band_elderly` with a fixed category list. No scaling and no statistics fitted on the labels are used. The same encoder runs for training, the test split, and API inference.
