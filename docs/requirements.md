# Requirements

These rows name behavior that the current code implements. Diagrams are in [DIAGRAMS.md](DIAGRAMS.md). The running design is in [ARCHITECTURE.md](ARCHITECTURE.md).

## Functional

| Requirement | Implementation | File |
| --- | --- | --- |
| Caregiver registers with name, email, and password | `POST /auth/register` stores a hash and returns the user. It does not return a token. | `backend/app/routes.py`, `backend/app/auth.py`, `mobile/src/screens/RegisterScreen.tsx` |
| Caregiver logs in | `POST /auth/login` checks the hash and returns a JWT whose `sub` is the user id. | `backend/app/auth.py`, `mobile/src/screens/LoginScreen.tsx` |
| Caregiver logs out | The stored token is deleted and in-memory session state is cleared. | `mobile/src/auth/SessionContext.tsx`, `mobile/src/auth/tokenStorage.ts` |
| Passwords are not stored in plaintext | PBKDF2-SHA256, 600,000 iterations. | `backend/app/passwords.py` |
| List, add, edit, and delete only the signed-in caregiver's dependents | List filters `caregiver_id`. Other routes call `owned_dependent`. A foreign or missing id returns the same 403. The phone screens list, add, and edit. `DELETE /dependents/{id}` is implemented on the API. | `backend/app/routes.py`, `backend/app/dependents.py`, `mobile/src/screens/DependentsScreen.tsx` |
| Dependent fields are name, age, height, weight, sex, allergies, and conditions | Create and patch schemas accept those fields. Daily targets are not accepted from the client. | `backend/app/schemas.py`, `mobile/src/screens/DependentFormScreen.tsx` |
| Daily sodium, sugar, and calorie targets are computed | Mifflin-St Jeor, activity multiplier `1.2`, then child or elderly factors, then hypertension (−30% sodium) and diabetic (−50% sugar). Targets stay positive. | `backend/app/targets.py`, `backend/app/models.py` |
| One current dietary profile per dependent | `dietary_profiles.dependent_id` is unique. A flush hook creates or updates that row. | `backend/app/models.py` |
| Scan a barcode, type one, or type a dish name | Camera scan with permission, cooldown, and loading, plus manual barcode and dish fields. All call `POST /dependents/{id}/scan`. Accepted dish names are `spaghetti` and `adobo`. | `mobile/src/screens/ScannerScreen.tsx`, `backend/app/routes.py`, `backend/app/dishes.py` |
| Barcode must be 8–14 digits | Pydantic `ScanInput` and `validate_barcode`. | `backend/app/schemas.py`, `backend/app/food_lookup.py` |
| Product lookup uses Open Food Facts or demo data | `DEMO_MODE=false` calls the v2 product URL. `DEMO_MODE=true` reads `backend/demo_products.json` and stays offline. | `backend/app/food_lookup.py` |
| Successful live lookups are cached | Cache hit returns `scanned_products`. A miss fetches, inserts, and returns that row. | `backend/app/food_lookup.py`, `backend/app/models.py` |
| Nutrition is per 100 g and missing values are not treated as zero | Calories, sodium, and sugar are required finite numbers. Invalid payloads return `PRODUCT_DATA_INVALID`. | `backend/app/food_lookup.py`, `backend/app/scan.py` |
| Percent of daily target | `sodium_pct`, `sugar_pct`, and `calorie_pct` are nutrient per 100 g divided by the profile target. | `backend/app/scan.py` |
| Allergy match | Lowercased profile allergies compared with structured allergen tags. A match forces `danger`. | `backend/app/scan.py`, `backend/app/ml/predict.py` |
| Condition conflict | Forces `danger` above half the matching target: hypertension and sodium, diabetic and sugar, diabetic and carbohydrate, high cholesterol and saturated fat, kidney disease at age 12 or older and protein. A missing value fails the scan only when that condition is checked. Fiber is not a rule. | `backend/app/scan.py`, `backend/app/ml/predict.py` |
| Remaining scans use the local decision tree | `predict_risk` calls the joblib tree only when the hard rules do not apply. | `backend/app/ml/predict.py`, `backend/ml/risk_model.pkl` |
| Meal log is stored | Every successful scan inserts `meal_logs` with `safe`, `warning`, or `danger`, JSON reasons, `eaten` false, and `grams_eaten` null. | `backend/app/scan.py` |
| Confirm an amount eaten | `PATCH /meals/{id}` sets `eaten` true and stores grams greater than zero. | `backend/app/routes.py`, `mobile/src/screens/ScannerScreen.tsx` |
| Daily intake | Sums eaten meals for one `Asia/Manila` date, scaled from per-100 g values. Calories, sodium, and sugar always appear. Carbohydrate, saturated fat, and protein appear only for the matching condition. | `backend/app/intake.py`, `mobile/src/screens/IntakeScreen.tsx` |
| Alert for warning or danger | `create_alert_if_needed` inserts an `active` alert. Safe scans leave `alert_id` null. | `backend/app/scan.py` |
| Scan response shape | Label, product, percentages, reasons, `meal_log_id`, and `alert_id`. | `backend/app/scan.py`, `backend/app/schemas.py` |
| View history | `GET /dependents/{id}/meals`, newest first. | `backend/app/routes.py`, `mobile/src/screens/HistoryScreen.tsx` |
| View alerts | `GET /dependents/{id}/alerts` includes product name and risk label. | `backend/app/routes.py`, `mobile/src/screens/AlertsScreen.tsx` |
| Acknowledge an alert | `PATCH /alerts/{id}` accepts only `acknowledged`. Repeating that status is allowed. | `backend/app/routes.py`, `backend/app/schemas.py` |
| Weekly summary from stored meals | Last 7 days: total, safe, warning, danger, most common reason, and a templated sentence. One `summaries` row per dependent and window start. | `backend/app/summary.py`, `mobile/src/screens/SummaryScreen.tsx` |
| Dependent tabs | After a dependent is selected: Scan, History, Alerts, Summary, and Intake. Home returns to the dependents list. | `mobile/src/navigation/DependentTabs.tsx` |

## Non-functional

| Requirement | Implementation | File |
| --- | --- | --- |
| Python FastAPI backend | Application, CORS, lifespan model load, and `/health`. | `backend/app/main.py` |
| PostgreSQL through SQLAlchemy | Engine, session, and `check_database_connection`. Docker image `postgres:16`. | `backend/app/database.py`, `docker-compose.yml` |
| JWT bearer authentication | Protected dependencies read the bearer token. Missing or invalid tokens return 401. | `backend/app/auth.py` |
| Ownership | Dependents, meals, alerts, scans, and summaries are limited to the JWT caregiver. | `backend/app/dependents.py` |
| Standard API error body | `{"error":{"code","message"}}` for validation, HTTP, database, and unexpected failures. | `backend/app/errors.py` |
| Scan writes are one transaction | Product reference, meal, and alert commit together. A database error rolls back and returns `DATABASE_ERROR`. | `backend/app/routes.py` |
| Local decision tree, not a remote model | Loaded with joblib at startup. Invalid or missing model returns `MODEL_UNAVAILABLE` when the tree is needed. | `backend/app/ml/predict.py` |
| Reproducible training artifacts | Generator, trainer, CSV, pickle, feature order, readable tree, and evaluator are committed. Reported test accuracy is 92.90%. | `backend/ml/`, `docs/MODEL_EVALUATION.md` |
| Expo TypeScript client | Screens, navigation, and API types are TypeScript. Shared colors, type, and spacing are in `mobile/src/theme/`. | `mobile/src/` |
| Loading, empty, and error states | API screens use `ScreenStatus`, including retry. | `mobile/src/components/ScreenStatus.tsx` |
| Offline course demo | `DEMO_MODE=true` serves only `backend/demo_products.json`. | `backend/app/food_lookup.py`, `backend/demo_products.json` |
