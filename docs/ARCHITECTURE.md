# Architecture

This describes the code in the repository. There is no chatbot, recommendation engine, push notification service, or remote model API.

## Runtime pieces

The phone app is Expo, React Native, and TypeScript. Navigation is React Navigation with one stack for login and register, then a stack for the dependent list, add and edit, and one dependent. That dependent screen uses a floating pill: Home, Overview, a raised Scan button, Intake, and Alerts. Home returns to the dependents list. Overview opens the weekly summary. A button on that screen opens History. The header shows Health in `#02542D` and Watch in `#00ACF3`. A profile icon on that header shows the caregiver name and Log out.

The phone calls FastAPI over HTTP. `mobile/src/api.ts` attaches `Authorization: Bearer <token>` from device storage (`expo-secure-store` on iOS and Android, `localStorage` on web). The API base URL is `EXPO_PUBLIC_API_URL`, or `http://10.0.2.2:8000` on Android emulators, otherwise `http://127.0.0.1:8000`.

FastAPI (`backend/app/main.py`) loads `backend/ml/risk_model.pkl` once at startup. Routes in `backend/app/routes.py` call separate functions for auth, dependents, food lookup, scan steps, prediction, and weekly summary. The caregiver id comes from the JWT `sub` claim. A client-supplied caregiver id is not used for authorization.

PostgreSQL 16 runs from `docker-compose.yml` (database `food_monitor`, user `postgres`). SQLAlchemy models are in `backend/app/models.py`. `/health` runs a database check and returns `{"status":"ok"}`, or `503` with the standard error body if PostgreSQL is down.

Food data has three sources:

- A typed dish name resolves only `spaghetti` and `adobo` from `backend/dishes.json`. This path ignores `DEMO_MODE` and does not call Open Food Facts.
- `DEMO_MODE=true` reads barcode lookups from `backend/demo_products.json` and does not call the network or the product cache.
- `DEMO_MODE=false` checks `scanned_products` by barcode, then requests `https://world.openfoodfacts.org/api/v2/product/{barcode}.json`. A successful lookup is inserted into `scanned_products`.

Nutrition used by the classifier is per 100 g: calories (kcal), sodium (mg), and sugar (g). Missing or non-finite values are rejected. Volume-only (`ml`) nutrition is not accepted. Saturated fat, carbohydrate, and protein are read only for the condition that needs them. They are not classifier features.

## Scan transaction

`POST /dependents/{id}/scan` in `backend/app/routes.py` does the following, in order:

1. `owned_dependent` confirms the dependent belongs to the JWT caregiver.
2. The body is exactly one of an 8–14 digit barcode or a dish name. A barcode calls `validate_scan_input` and `fetch_product`. A dish name calls `resolve_dish`.
3. `calculate_product_percentages` divides calories, sodium, and sugar by the dependent's stored daily targets.
4. `check_allergy_match` compares lowercase allergy labels with structured allergen tags.
5. Condition nutrients are read only when that condition is recorded. `check_condition_conflict` sets a conflict when any of these is above 0.5 of its target: hypertension and sodium, diabetic and sugar, diabetic and carbohydrate, high cholesterol and saturated fat, or kidney disease at age 12 or older and protein.
6. `predict_risk` applies hard rules before the tree: an allergy match is `danger`; a condition conflict is `danger`; otherwise the loaded decision tree predicts `safe`, `warning`, or `danger`.
7. One database transaction stores the product reference, the meal log (`eaten` false), and an alert when the label is `warning` or `danger`. A failed commit rolls the writes back.
8. The response includes the label, product, percentages, reasons, `meal_log_id`, and `alert_id` (`null` when no alert is created). Saturated fat, carbohydrate, or protein grams are included only when that nutrient was checked and is above half its target.

Reasons are fixed sentences in `backend/app/ml/predict.py`. The tree is not inspected at request time.

## Accounts and dependents

Register (`POST /auth/register`) stores a PBKDF2-SHA256 password hash and does not return a token. The phone sends the caregiver's name. If `name` is omitted, the stored name is `Caregiver`. Login (`POST /auth/login`) returns a JWT (HS256, issuer `food-monitor`, audience `food-monitor-mobile`, one hour). `GET /auth/me` returns the signed-in user. The phone uses that name in the profile menu.

Creating or updating a dependent writes one `dietary_profiles` row. `compute_daily_targets` in `backend/app/targets.py` sets sodium, sugar, and calories from age, height, weight, sex, and conditions. The caregiver does not enter those three numbers. A `before_flush` hook recomputes them and rejects deleting the profile while the dependent remains.

## Weekly summary and daily intake

`GET /dependents/{id}/summary/weekly` counts that dependent's meal logs from the last 7 UTC days, including scans the caregiver has not marked as eaten. It finds the most common stored reason text and writes one templated sentence. The row is upserted in `summaries` for that dependent and window start. The text is ordinary Python, not a language model.

`GET /dependents/{id}/daily-intake` is separate. It sums meals with `eaten` true and `grams_eaten` greater than zero for one `Asia/Manila` date, scaled from per-100 g values. `PATCH /meals/{id}` is what marks a meal eaten.

**Updated:** History lists the same meal logs. Calories, sodium, and sugar stay per 100 g in the response. When `grams_eaten` is greater than zero, the History screen shows each of those three nutrients scaled by `grams_eaten / 100`, rounded half up to two decimals. When it is null, History shows the per-100 g values. `DELETE /meals/{id}` removes one owned meal. `DELETE /dependents/{id}/meals` removes every meal for that owned dependent. The alert foreign key removes the alerts for those meals. Cached products stay.

**Updated:** On the scan result, Eaten opens the amount field immediately when the label is safe. A warning or danger label asks Eat anyway or Cancel first. Cancel does not mark the meal eaten. When the scan included `serving_grams`, the amount is a serving count and the app stores servings times that weight. Otherwise the caregiver enters grams. Confirm then compares that amount with today's intake. If a checked nutrient is already over its target, or this amount would put it over, a Daily limit popup offers Eat anyway or Cancel. Eat anyway sends the same PATCH. The risk label stays the 100 g classification.

## Decision tree

The classifier is `sklearn.tree.DecisionTreeClassifier` (`max_depth=5`, `class_weight="balanced"`, `random_state=42`), saved with joblib and loaded in-process. Training uses 5000 synthetic rows and an 80/20 stratified split. Measured accuracy, the confusion matrix, and feature importances are in [MODEL_EVALUATION.md](MODEL_EVALUATION.md).

Features, in `backend/ml/feature_order.json`: `sodium_pct`, `sugar_pct`, `calorie_pct`, `has_allergy_match`, `has_condition_conflict`, `age_band_child`, `age_band_adult`, `age_band_elderly`.

The export below is the committed file `backend/ml/tree_readable.txt`. Hard safety rules in `predict_risk` still override this tree. Those rules now include carbohydrate, saturated fat, and adult protein when the matching condition is recorded. The tree file itself was not replaced.

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

## Errors

Handlers in `backend/app/errors.py` return:

```json
{ "error": { "code": "ERROR_CODE", "message": "Human-readable message" } }
```

`/health` success is the exception: it returns `{"status":"ok"}`.
