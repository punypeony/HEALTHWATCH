# [AGENTS.md](http://AGENTS.md)

# FOOD CONSUMPTION HEALTH MONITORING SYSTEM

A caregiver-facing mobile application for monitoring food consumption of dependent relatives.

This is an **Intro to Software Engineering course project** with a **1-week development deadline**.

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

This is a one-week Software Engineering course project.

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
- created_at

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

The product contains an ingredient associated with a recorded allergy.

The product conflicts with a recorded dietary condition.
```

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

Do not rewrite working backend logic merely to change the visual design.