# [AGENTS.md](http://AGENTS.md)

# FOOD CONSUMPTION HEALTH MONITORING SYSTEM

A caregiver-facing mobile application for monitoring food consumption of dependent relatives.

This is an **Intro to Software Engineering course project** with a **3-week development deadline**. **Updated:** the development period is three weeks, not one week.

The system allows a caregiver to manage dependent relatives. Each dependent has a dietary profile with computed daily nutrition targets. The caregiver can scan a food barcode, retrieve its nutrition information, and have a locally trained Decision Tree classify the food as `safe`, `warning`, or `danger` based on the dependent's targets, allergies, and conditions.

---

# 1. CORE TECHNOLOGY STACK

## Mobile

- Expo
- React Native
- TypeScript
- React Navigation
- Expo camera/barcode functionality

## Backend

- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- psycopg[binary]
- Pydantic
- httpx
- python-dotenv

## Machine Learning

- scikit-learn
- pandas
- joblib
- Decision Tree Classifier

## Testing

- pytest

## External Food Data

Open Food Facts API:

```text
https://world.openfoodfacts.org/api/v2/product/{barcode}.json
```

No API key is required.

---

# 2. NON-NEGOTIABLE TECHNOLOGY RULES

Backend must be Python.

Database must be PostgreSQL through SQLAlchemy.

Do NOT use:

- MongoDB
- Supabase
- Firebase
- MySQL
- SQLite as the application database
- Redis
- an LLM API
- OpenAI API
- Gemini API
- remote AI inference APIs
- another ML platform

The risk classifier is a locally trained scikit-learn Decision Tree loaded with joblib.

The model must run locally in the FastAPI backend.

Do not replace the Decision Tree with another model without explicit approval.

Do not add dependencies without asking first.

Prefer simple implementations that every team member can explain.

---

# 3. PROJECT SCOPE

This is a **three-week** Software Engineering course project. **Updated:** the development period is three weeks, not one week.

Do not add features that are not required.*

Do NOT add:

- AI chatbots
- LLM features
- nutrition coaching
- social features
- payment systems
- push notifications
- wearable integrations
- background tracking
- maps
- recommendation engines
- complicated analytics
- admin dashboards
- microservices
- Kubernetes
- Redis
- Celery
- unnecessary state-management libraries
- unnecessary UI component libraries

If a feature is not in the requirements, do not add it just because it seems useful.

If a major architectural decision is unclear, ask before proceeding.

---

# 4. CORE SYSTEM TRANSACTION

The primary transaction is:

```text
Input
  ↓
Validation
  ↓
Processing
  ↓
Database Update
  ↓
Confirmation / Output
```

For food scanning:

```text
Barcode scanned
  ↓
Validate barcode
  ↓
Open Food Facts / Demo Data lookup
  ↓
Calculate nutrition percentages
  ↓
Check allergies
  ↓
Check dietary conditions
  ↓
Decision Tree prediction
  ↓
Create meal log
  ↓
Create alert if warning/danger
  ↓
Return result to mobile app
```

A typed dish name is an additional input. It uses the same percentage, allergy, condition, decision-tree, meal-log, and alert steps. The dish table is specified in section 32. It does not replace barcode scanning.

This flow must be clearly visible in the code.

Do not hide the entire transaction inside one large function.

The endpoint should primarily orchestrate separate business-logic functions.

---

# 5. REQUIRED SCAN FUNCTION BOUNDARIES

The scan implementation should use separate functions conceptually equivalent to:

```text
validate_scan_input()
fetch_product()
calculate_product_percentages()
check_allergy_match()
check_condition_conflict()
predict_risk()
create_meal_log()
create_alert_if_needed()
return_scan_result()
```

Do not put all business logic directly inside the FastAPI route handler.

---

# 6. ERROR FORMAT

All backend API errors must use exactly:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

Do not introduce inconsistent error response formats.

Possible codes include:

```text
VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
INVALID_CREDENTIALS
DUPLICATE_EMAIL
PRODUCT_NOT_FOUND
PRODUCT_DATA_INVALID
FOOD_LOOKUP_TIMEOUT
DATABASE_ERROR
```

Use clear codes appropriate to the actual failure.

---

# 7. AUTHENTICATION

Use JWT bearer authentication.

Passwords must be securely hashed.

Never store plaintext passwords.

The JWT must contain the authenticated caregiver's user ID.

Protected requests use:

```text
Authorization: Bearer <token>
```

Never trust a caregiver ID supplied by the mobile client for authorization.

The backend must determine the caregiver identity from the authenticated JWT.

A caregiver can only access their own dependents.

---

# 8. DATABASE

Use PostgreSQL through SQLAlchemy.

Required models:

```text
users
dependents
dietary_profiles
scanned_products
meal_logs
alerts
summaries
```

## users

- id
- name
- email
- password_hash
- created_at

Email must be unique.

## dependents

- id
- caregiver_id
- name
- age
- height_cm
- weight_kg
- sex
- created_at
- updated_at

## dietary_profiles

- id
- dependent_id
- allergies
- conditions
- daily_sodium_mg
- daily_sugar_g
- daily_calories
- created_at
- updated_at

A dependent has exactly one current dietary profile.

Daily targets are computed by backend logic.

They are never entered manually by the caregiver.

## scanned_products

- id
- barcode
- name
- calories
- sodium_mg
- sugar_g
- raw_response
- fetched_at

Use JSONB for raw_response.

## meal_logs

- id
- dependent_id
- scanned_product_id
- risk_label
- risk_reasons
- eaten
- grams_eaten
- created_at

`eaten` starts false and `grams_eaten` stays null until the caregiver confirms an amount. Daily intake sums only meals with `eaten` true and `grams_eaten` greater than zero, scaled from per-100 g values. The weekly summary still counts every scan.

Risk labels:

```text
safe
warning
danger
```

## alerts

- id
- dependent_id
- meal_log_id
- message
- status
- created_at

Statuses:

```text
active
acknowledged
```

## summaries

- id
- dependent_id
- week_start
- text
- created_at

Use:

- timestamptz
- numeric
- jsonb
- PostgreSQL text arrays

where appropriate.

Add appropriate foreign keys, indexes, and CHECK constraints.

---

# 9. DAILY TARGETS

Implement:

```text
compute_daily_targets(
    age,
    height_cm,
    weight_kg,
    sex,
    conditions
)
```

Return:

```text
daily_sodium_mg
daily_sugar_g
daily_calories
```

Use the Mifflin-St Jeor equation.

Male:

```text
BMR = 10W + 6.25H - 5A + 5
```

Female:

```text
BMR = 10W + 6.25H - 5A - 161
```

Use a documented activity multiplier to obtain the project's baseline daily calorie target.

Keep the multiplier as a named constant.

## Sodium

Baseline:

```text
2000 mg/day
```

If the conditions contain:

```text
hypertension
```

reduce sodium target by 30%.

## Sugar

Free sugar target is:

```text
10% of daily calories / 4
```

If conditions contain:

```text
diabetic
```

reduce the resulting sugar target by 50%.

## Age bands

```text
child   = age < 12
adult   = 12 <= age <= 65
elderly = age > 65
```

The project requires calorie and sodium adjustments for child and elderly age bands.

Use documented nutrition-reference values.

The exact adjustment factors must be defined as named constants and documented in code with the source used.

Do not invent undocumented medical recommendations.

Targets must never be zero or negative.

Normalize condition strings to lowercase before checking them.

---

# 10. FOOD DATA

Use Open Food Facts.

Canonical nutrition representation is **per 100g**:

```text
calories = kcal per 100g
sodium_mg = mg per 100g
sugar_g = g per 100g
```

Calculate:

```text
sodium_pct = sodium_mg_per_100g / daily_sodium_mg

sugar_pct = sugar_g_per_100g / daily_sugar_g

calorie_pct = calories_kcal_per_100g / daily_calories
```

These percentages represent the contribution of 100g of the product relative to the dependent's daily target.

Do not silently convert missing nutritional values into zero.

If reliable nutrition data cannot be determined, return a controlled error.

---

# 11. DEMO MODE

The backend supports:

```env
DEMO_MODE=true
```

When enabled, food lookups must use:

```text
backend/demo_products.json
```

instead of Open Food Facts.

Demo mode must work completely offline.

Demo products must use deterministic barcodes and expected results.

---

# 12. FOOD LOOKUP CACHE

Successful food lookups must be cached in `scanned_products`.

Flow:

```text
barcode
  ↓
check database cache
  ↓
cached?
 ├── yes → return cached product
 └── no → Open Food Facts
             ↓
          save product
             ↓
          return product
```

Do not repeatedly call Open Food Facts for the same successfully cached barcode.

---

# 13. ALLERGY MATCHING

Normalize dependent allergies and product allergen strings to lowercase.

Example:

```text
dependent allergy:
milk
```

and:

```text
product allergens:
en:milk,en:soy
```

must produce:

```text
has_allergy_match = 1
```

Use structured allergen information from Open Food Facts.

Do not use an LLM to interpret allergies.

---

# 14. MACHINE LEARNING

The risk classifier is a locally trained:

```text
sklearn.tree.DecisionTreeClassifier
```

The model must be:

- trained locally
- reproducible
- committed to the repository
- loaded locally by FastAPI

Required committed artifacts:

```text
backend/ml/generate_training_data.py
backend/ml/train_risk_model.py
backend/ml/training_data.csv
backend/ml/risk_model.pkl
backend/ml/feature_order.json
backend/ml/tree_readable.txt
backend/ml/evaluate.py
```

Training uses:

```text
5000 synthetic rows
80/20 train/test split
stratified by risk_label
random_state=42
max_depth=5
class_weight="balanced"
```

Test accuracy target:

```text
>= 90%
```

If accuracy is below 90%, inspect the data generation and preprocessing.

Do not simply increase tree depth to force higher accuracy.

---

# 15. ML LABEL RULES

Synthetic labels must initially follow:

```text
1. has_allergy_match == 1
   → danger

2. has_condition_conflict == 1 AND
   (sodium_pct > 0.5 OR sugar_pct > 0.5)
   → danger

3. max(sodium_pct, sugar_pct, calorie_pct) >= 1.0
   → danger

4. max(sodium_pct, sugar_pct, calorie_pct) >= 0.8
   → warning

5. otherwise
   → safe
```

Approximately 5% of labels may then receive random noise.

The generator must use random_state=42.

The training dataset must contain meaningful examples across:

- sodium levels
- sugar levels
- calorie levels
- allergy matches
- condition conflicts
- child/adult/elderly groups

No class should be below 10%.

Do not fabricate labels purely to achieve class balance.

---

# 16. RISK DECISION PRIORITY

Hard safety conditions must not be overridden by the Decision Tree.

Priority:

```text
allergy match
    ↓
danger

condition conflict + defined threshold
    ↓
danger

otherwise
    ↓
Decision Tree prediction
```

The Decision Tree handles the remaining nutritional risk classification.

`high cholesterol` is an additional hard condition. Its saturated-fat rule is specified in section 32. It does not change the decision tree, and it does not change the sodium, sugar, or calorie targets above.

---

# 17. RISK REASONS

Reasons must be human-readable and deterministic.

Examples:

```text
Sodium exceeds the dependent's daily target.

Sodium is high compared with the dependent's daily target.

Sugar exceeds the dependent's daily target.

Sugar is high compared with the dependent's daily target.

Calories exceed the dependent's daily target.

Protein exceeds the dependent's daily target.

Protein is high compared with the dependent's daily target.

The product contains an ingredient associated with a recorded allergy.

Sodium conflicts with the recorded hypertension condition.

Sugar conflicts with the recorded diabetic condition.

Carbohydrate conflicts with the recorded diabetic condition.

Saturated fat conflicts with the recorded high cholesterol condition.

Protein conflicts with the recorded kidney disease condition.

This protein check uses the non-dialysis adult limit of 1.3 g per kg of body weight per day.
```

Each conflict sentence is added only for the rule that fired. A new scan does not use one generic condition sentence.

Do not attempt to introspect the Decision Tree at request time to generate reasons.

---

# 18. TESTING

Every backend business-logic function must have at least one direct pytest test.

Trivial framework declarations and model definitions do not require individual unit tests, but their behavior should be covered through integration tests where appropriate.

Test:

- authentication
- validation
- ownership
- target computation
- food lookup
- caching
- scan transaction
- allergy matching
- condition conflicts
- model prediction
- meal logs
- alerts
- weekly summaries
- failure paths

Do not delete tests to make the suite pass.

---

# 19. MOBILE ARCHITECTURE

Keep the mobile project organized.

Prefer a structure similar to:

```text
mobile/
  src/
    api.ts
    types.ts
    navigation/
    screens/
    components/
    hooks/
    theme/
    utils/
```

Do not put the entire application into `App.tsx`.

Use TypeScript throughout.

Keep API types separate from visual components.

---

# 20. MOBILE STATE

Keep state management simple.

Prefer:

- React state
- React hooks
- Context only when genuinely needed

Do not add Redux, Zustand, MobX, or another state-management library without approval.

---

# 21. TEMPORARY MOBILE UI

The final UI/UX design has NOT been finalized.

Until the final UI prompt is provided:

- use simple placeholder styling
- prioritize functionality
- prioritize navigation
- prioritize API integration
- prioritize forms
- prioritize scanner functionality
- prioritize loading/error/empty states
- do not create a custom visual design system
- do not spend significant time on visual polish

Keep components structured so they can be restyled later.

The final UI will be implemented in a separate final prompt after the visual reference is provided.

---

# 22. REQUIRED MOBILE FLOW

The application must support:

```text
Login/Register
    ↓
Dependents
    ↓
Select Dependent
    ↓
Scan
    ↓
History
    ↓
Alerts
    ↓
Summary
```

Each dependent has:

```text
Scan
History
Alerts
Summary
```

---

# 23. MOBILE SCANNER

The scanner must:

- request camera permission
- detect a barcode
- prevent duplicate rapid scans
- show loading state
- call the backend
- display the actual backend result

Provide manual barcode entry as a fallback.

Also provide a text field for a dish name. The only accepted names are in section 32.

Do not fake scanner results.

---

# 24. API RESPONSE CONTRACT

Successful scan responses should follow this structure:

```json
{
  "risk_label": "warning",
  "product": {
    "barcode": "123456789",
    "name": "Example Food",
    "calories": 250,
    "sodium_mg": 650,
    "sugar_g": 12
  },
  "percentages": {
    "sodium_pct": 0.65,
    "sugar_pct": 0.24,
    "calorie_pct": 0.12
  },
  "reasons": [
    "Sodium is high compared with the dependent's daily target."
  ],
  "meal_log_id": 15,
  "alert_id": 8
}
```

`alert_id` is null when no alert is created.

`saturated_fat_g`, `carbohydrate_g`, and `protein_g` are included only when that nutrient was checked for the dependent and is above half of its daily target. They are omitted otherwise.

---

# 25. MOBILE ERROR/LOADING STATES

Every API-driven screen must have appropriate:

- loading state
- success state
- empty state
- error state
- retry action

Do not leave blank screens when an API request fails.

---

# 26. WEEKLY SUMMARY

Weekly summaries must be generated from actual database statistics.

Do NOT use an LLM.

Calculate:

- total scans
- safe count
- warning count
- danger count
- common alert reasons

Generate a short template-based summary.

Example:

```text
3 danger-level scans this week, mostly sodium-related.
```

---

# 27. DOCUMENTATION

Documentation must describe the actual implementation.

Do not document features that do not exist.

Required documentation includes:

- use case diagram
- activity diagram
- scan sequence diagram
- ER diagram
- deployment diagram
- ML evaluation
- Decision Tree
- functional requirements
- non-functional requirements
- code-file mapping
- defect log
- demo script

Use Mermaid for diagrams where practical.

---

# 28. REQUIREMENT DISCIPLINE

Do not silently reinterpret, remove, weaken, or replace explicit requirements.

If requirements conflict:

1. Identify the conflict.
2. Prefer the more specific requirement.
3. Ask before making a major architectural change.

Do not silently substitute:

- databases
- ML models
- APIs
- authentication systems
- frameworks
- architecture

Do not claim a feature is complete unless its acceptance criteria are satisfied.

---

# 29. DEPENDENCY DISCIPLINE

Do not add dependencies without asking first.

Before adding a dependency, determine whether the feature can be implemented using:

- the standard library
- an already-installed dependency
- existing Expo/React Native functionality

Only add a new dependency when necessary and approved.

---

# 30. DEFINITION OF DONE

## Backend

- FastAPI starts
- PostgreSQL starts through Docker
- `/health` checks database connectivity
- authentication works
- caregiver ownership is enforced
- dependents can be created/updated/deleted
- targets are automatically calculated
- Open Food Facts lookup works
- DEMO_MODE works offline
- Decision Tree loads
- scan transaction works
- meal logs are stored
- alerts are stored
- weekly summaries work
- API errors use the standard format

## Machine Learning

- training data committed
- training script committed
- model committed
- feature order committed
- readable tree committed
- evaluation script committed
- evaluation report generated
- accuracy >= 90%
- training reproducible

## Mobile

- register works
- login works
- dependents list works
- add/edit dependent works
- dependent navigation works
- barcode scanning works
- manual barcode entry works
- scan result works
- history works
- alerts work
- alert acknowledgement works
- weekly summary works
- loading/error/empty states work

## Testing

Backend:

```text
pytest
```

Mobile:

```text
npx tsc --noEmit
```

The final project must have:

- zero failing backend tests
- zero TypeScript errors

## Demo

The complete demo flow must work:

```text
Login
→ Select dependent
→ Scan safe item
→ Scan warning item
→ Scan danger item
→ Show alert
→ Show history
→ Show weekly summary
```

The demo must work offline using DEMO_MODE.

---

# 31. FINAL UI PROMPT

The final visual design will be provided later as a separate prompt.

Until that prompt is provided, do not treat placeholder UI as the final design.

When the final UI prompt is provided, its visual reference becomes the source of truth for:

- colors
- typography
- spacing
- layout
- components
- navigation appearance
- icons
- cards
- buttons
- scanner screen
- result screen
- history
- alerts
- summary
- loading states
- error states
- empty states

The final UI redesign must preserve all existing backend and mobile functionality.

---

# 32. HIGH CHOLESTEROL AND TYPED DISHES

These additions are required. They do not replace barcode scanning, Open Food Facts, demo mode, or the local decision tree.

## High cholesterol

`high cholesterol` is an optional condition, stored lowercase like `hypertension` and `diabetic`.

A dependent may still have no allergies and no conditions.

When the dependent does not have high cholesterol:

- Do not read fat or saturated fat.
- Do not fail a scan because those values are missing.
- Classify with calories, sodium, and sugar only, plus allergies and the existing condition rules.

When the dependent has high cholesterol:

- Read saturated fat in grams per 100 g.
- Open Food Facts field: `nutriments.saturated-fat_100g`.
- Total fat (`fat_100g`) may be shown when present. It is not the danger rule.
- If saturated fat is missing, not a number, or negative, return `PRODUCT_DATA_INVALID`. Do not store zero.
- Daily saturated-fat target, as a named constant documented in code:

```text
WHO: less than 10% of daily energy from saturated fat.
grams = 0.10 * daily_calories / 9
```

Fat is 9 kcal per gram.

- If saturated fat per 100 g is above half of that daily target, force `danger` before the decision tree. Use the existing 0.5 conflict threshold.
- An allergy match still takes priority.
- Reasons stay deterministic. When saturated fat is above half the daily target, include "Saturated fat conflicts with the recorded high cholesterol condition." Keep a saturated-fat high or exceeds sentence at 80% and 100%, in the same style as the sodium and sugar reasons.

Do not add fat as a decision-tree feature. Do not retrain or replace `backend/ml/risk_model.pkl`.

The dependent form must offer these checkboxes: Diabetic, Hypertension, High cholesterol, and Kidney disease. A dependent may still be saved with none of them checked.

Fiber does not get a checkbox. There is no cited maximum, and a high-fiber food must not be forced to danger.

## Carbohydrates, protein, and fiber

Read a nutrient only when its condition is checked. If that box is unchecked, a missing value must not fail the scan and must not be stored as zero. If the box is checked and the value is missing, not a number, or negative, return `PRODUCT_DATA_INVALID`.

Do not add carbohydrates, fiber, or protein as decision-tree features. Do not retrain or replace `backend/ml/risk_model.pkl`.

### Carbohydrates

The existing Diabetic checkbox gates total carbohydrate in addition to the existing sugar rule.

- Open Food Facts field: `nutriments.carbohydrates_100g`, grams per 100 g.
- Read it only when `diabetic` is present.
- Daily carbohydrate target, as a named constant documented in code. Acceptable macronutrient distribution range: carbohydrate is 45–65% of calories. Use the upper end, 65%, at 4 kcal per gram:

```text
grams = 0.65 * daily_calories / 4
```

- If carbohydrate per 100 g is above half of that daily amount, force `danger` before the decision tree. Use the existing 0.5 conflict threshold. Include "Carbohydrate conflicts with the recorded diabetic condition."
- The existing diabetic sugar rule stays. When sugar is above half the daily sugar target, include "Sugar conflicts with the recorded diabetic condition."

### Protein

The Kidney disease checkbox is the only condition that reads protein.

- Open Food Facts field: `nutriments.proteins_100g`, grams per 100 g.
- Read it only when `kidney disease` is present.
- If protein is missing, not a number, or negative, return `PRODUCT_DATA_INVALID`. Do not store zero.
- Daily protein ceiling, as a named constant documented in code. KDIGO 2024 Practice Point 3.3.1.1: avoid high protein intake above 1.3 g/kg body weight/day in adults with CKD at risk of progression. This is the high-intake ceiling, not the 0.8 g/kg/day recommended intake.

```text
grams = 1.3 * weight_kg
```

- For age 12 or older, if protein per 100 g is above half of that daily amount, force `danger` before the decision tree. Use the existing 0.5 conflict threshold. Include "Protein conflicts with the recorded kidney disease condition." and "This protein check uses the non-dialysis adult limit of 1.3 g per kg of body weight per day."
- For age under 12, still require a valid protein value when the checkbox is on, but do not force danger and do not add a protein conflict sentence. KDIGO says not to restrict protein in children.
- There is no dialysis flag and no stage. Do not average guideline numbers.
- An allergy match still takes priority.

The scan response keeps calories, sodium, and sugar. It also includes `saturated_fat_g`, `carbohydrate_g`, or `protein_g` only when that nutrient was checked and its percentage is above 0.5. Those fields are omitted otherwise. They are not stored as database columns. When sodium is above half the hypertension target, include "Sodium conflicts with the recorded hypertension condition."

### Fiber

- Open Food Facts field: `nutriments.fiber_100g`.
- Do not read fiber for a danger rule.
- A missing fiber value must not crash a scan.

## Typed dishes

The caregiver may type a dish name instead of a barcode. Match the name case-insensitively after trimming spaces. Do not use a language model to interpret it.

Resolve only these two rows, copied from the FNRI food composition library (`https://i.fnri.dost.gov.ph/fct/library/search_item`). Values are per 100 g edible portion. Do not scrape that site at request time. Do not call Open Food Facts for a typed name.

`spaghetti` is FNRI "Pasta, spaghetti":

```text
calories 361
sodium_mg 6
sugar_g 2.7
fat_g 1.1
saturated_fat_g 0.2
```

`adobo` is FNRI "Pork adobo, cnd":

```text
calories 277
sodium_mg 254
sugar_g 0.1
fat_g 24.8
saturated_fat_g missing
```

The dash in the FNRI saturated-fat field means missing. Do not store zero. A high-cholesterol dependent who submits `adobo` receives `PRODUCT_DATA_INVALID`. A dependent without that condition can still be classified from calories, sodium, and sugar.

Any other typed name returns `PRODUCT_NOT_FOUND`.

Commit the two rows in a local file. Then run the existing percentage, allergy, condition, prediction, meal-log, and alert steps.

## Unchanged demo

On Demo Hypertension, these barcodes stay:

```text
2000000000015 safe
2000000000022 warning
2000000000039 danger
```

Do not add `high cholesterol`, `diabetic`, or `kidney disease` to Demo Hypertension or Demo Diabetes. Do not add image recognition or a remote inference API.

Do not rewrite working backend logic merely to change the visual design.

## 33. DEPENDENT PROFILE PHOTOS

The user approved `expo-image-picker` and `expo-file-system` for dependent profile photos. This is a specific exception to the dependency approval rule; other new dependencies still require approval.

- Tapping the dependent card profile icon opens the image library.
- Accept JPEG images only (`.jpg` or `.jpeg`), at most 5 MB (5 * 1024 * 1024 bytes). Validate actual file size and JPEG signature before saving; do not trust the filename alone.
- Save photos in the app's local document storage on the phone. Photos do not upload to the backend or sync between devices.
- Cancellation or invalid selections must preserve the previous photo and show a clear error for invalid files.
