# Diagrams

These diagrams follow the current routes, models, and scan functions. The decision tree text and measured accuracy are in [ARCHITECTURE.md](ARCHITECTURE.md) and [MODEL_EVALUATION.md](MODEL_EVALUATION.md).

## 1. Use case

The caregiver is the only actor. Register and login are public. Every later case sends the JWT, and the API ignores any caregiver id sent by the phone.

```mermaid
flowchart TD
  caregiver[Caregiver]
  caregiver --> registerLogin[Register / Login]
  caregiver --> manageDependents[Manage Dependents]
  caregiver --> scanFood[Scan Food or Typed Dish]
  caregiver --> viewHistory[View History]
  caregiver --> viewAlerts[View Alerts]
  caregiver --> acknowledgeAlerts[Acknowledge Alerts]
  caregiver --> weeklySummary[View Weekly Summary]
  caregiver --> confirmEaten[Confirm grams eaten]
  caregiver --> dailyIntake[View Daily Intake]
  caregiver --> deleteHistory[Delete one scan or clear history]
```

Register is `POST /auth/register`. Login is `POST /auth/login`. `GET /auth/me` returns the signed-in caregiver. Manage dependents is list, create, update, and delete under `/dependents`. Scan food is the camera, a manual barcode, or the dish names `spaghetti` and `adobo`. The floating pill is Home, Overview, Scan, Intake, and Alerts. Overview opens History. Acknowledge, the weekly summary, and daily intake stay on those screens. `PATCH /alerts/{id}` acknowledges an alert. `PATCH /meals/{id}` records grams eaten. **Updated:** when the scan included `serving_grams`, the phone sends servings times that weight. `DELETE /meals/{id}` deletes one owned meal. `DELETE /dependents/{id}/meals` deletes every meal for that dependent. Alerts for those meals are removed by the database. Cached products stay. The new use case is **Delete one scan or clear history**.

## 2. Activity

`POST /dependents/{id}/scan` runs the steps below. An allergy match, or a condition conflict above half the matching target, assigns `danger` and does not let the tree override that label. The conflict can be hypertension and sodium, diabetic and sugar, diabetic and carbohydrate, high cholesterol and saturated fat, or kidney disease at age 12 or older and protein. Any other case calls the loaded decision tree. `warning` and `danger` insert an alert. `safe` does not. The meal starts uneaten.

```mermaid
flowchart TD
  scanned[Barcode, or spaghetti or adobo]
  scanned --> validate[Validate the one lookup and the dietary profile]
  validate --> fetchProduct[Fetch barcode product or local dish]
  fetchProduct --> percentages[Calculate percentages]
  percentages --> checks[Check allergies and conditions]
  checks --> hardRule{Allergy match or condition conflict over half the target?}
  hardRule -->|yes| dangerLabel[Label danger]
  hardRule -->|no| decisionTree[Decision tree prediction]
  dangerLabel --> mealLog[Save meal log]
  decisionTree --> mealLog
  mealLog --> alert{Warning or danger?}
  alert -->|yes| createAlert[Create alert]
  alert -->|no| noAlert[Leave alert empty]
  createAlert --> result[Return result]
  noAlert --> result
```

Validation, lookup, nutrition, and prediction failures return the standard error body and do not insert a meal log.

## 3. Sequence

Ownership is checked before lookup. A dish name reads `dishes.json` and skips Open Food Facts. For a barcode, demo mode stops at the demo file. Live mode uses the `scanned_products` cache before Open Food Facts.

```mermaid
sequenceDiagram
  participant Mobile
  participant FastAPI
  participant FoodLookup as Food Lookup
  participant Source as Open Food Facts, Demo Data, or Dishes
  participant Classifier as Risk Classifier
  participant PostgreSQL

  Mobile->>FastAPI: POST /dependents/{id}/scan with JWT
  FastAPI->>PostgreSQL: Load dependent owned by the token
  PostgreSQL-->>FastAPI: Dependent and dietary profile
  alt dish name
    FastAPI->>FoodLookup: resolve_dish
    FoodLookup->>Source: Read dishes.json
  else DEMO_MODE true
    FastAPI->>FoodLookup: fetch_product(barcode)
    FoodLookup->>Source: Read demo_products.json
  else Cached barcode
    FastAPI->>FoodLookup: fetch_product(barcode)
    FoodLookup->>PostgreSQL: Read scanned_products
    PostgreSQL-->>FoodLookup: Cached product
  else Cache miss
    FastAPI->>FoodLookup: fetch_product(barcode)
    FoodLookup->>Source: GET Open Food Facts product JSON
    Source-->>FoodLookup: Product payload
    FoodLookup->>PostgreSQL: Insert scanned_products
  end
  FoodLookup-->>FastAPI: Name, calories, sodium, sugar, raw response
  FastAPI->>FastAPI: Percentages, allergy match, condition conflict
  FastAPI->>Classifier: predict_risk
  Classifier-->>FastAPI: safe, warning, or danger, plus reasons
  FastAPI->>PostgreSQL: Insert meal log and alert when needed
  PostgreSQL-->>FastAPI: meal_log_id and optional alert_id
  FastAPI-->>Mobile: Scan result JSON
```

## 4. Entity relationship

Taken from `backend/app/models.py`. A dependent has one dietary profile (`dependent_id` is unique). Meal logs reference a scanned product and cannot outlive their dependent. An alert's `(meal_log_id, dependent_id)` must match that meal log. One summary row exists per dependent and `week_start`.

```mermaid
erDiagram
  users ||--o{ dependents : caregiver_id
  dependents ||--|| dietary_profiles : dependent_id
  dependents ||--o{ meal_logs : dependent_id
  dependents ||--o{ alerts : dependent_id
  dependents ||--o{ summaries : dependent_id
  scanned_products ||--o{ meal_logs : scanned_product_id
  meal_logs ||--o{ alerts : meal_log_id

  users {
    int id PK
    text name
    text email UK
    text password_hash
    timestamptz created_at
  }
  dependents {
    int id PK
    int caregiver_id FK
    text name
    int age
    numeric height_cm
    numeric weight_kg
    text sex
    timestamptz created_at
    timestamptz updated_at
  }
  dietary_profiles {
    int id PK
    int dependent_id FK
    text_array allergies
    text_array conditions
    numeric daily_sodium_mg
    numeric daily_sugar_g
    numeric daily_calories
    timestamptz created_at
    timestamptz updated_at
  }
  scanned_products {
    int id PK
    text barcode UK
    text name
    numeric calories
    numeric sodium_mg
    numeric sugar_g
    jsonb raw_response
    timestamptz fetched_at
  }
  meal_logs {
    int id PK
    int dependent_id FK
    int scanned_product_id FK
    text risk_label
    jsonb risk_reasons
    boolean eaten
    numeric grams_eaten
    timestamptz created_at
  }
  alerts {
    int id PK
    int dependent_id FK
    int meal_log_id FK
    text message
    text status
    timestamptz created_at
  }
  summaries {
    int id PK
    int dependent_id FK
    date week_start
    text text
    timestamptz created_at
  }
```

Check constraints limit age to 0–120, sex to `male` or `female`, risk labels to `safe`, `warning`, or `danger`, and alert status to `active` or `acknowledged`. Daily targets and body measurements must be positive. Cached nutrition must be zero or greater.

## 5. Deployment

The phone and FastAPI are separate processes. PostgreSQL is the `postgres:16` service in `docker-compose.yml`. The decision tree file is on the same machine as FastAPI and is loaded into that process. Open Food Facts is called only for a barcode when `DEMO_MODE` is not `true`. Typed dishes stay in `backend/dishes.json`.

```mermaid
flowchart TD
  expo[Expo Mobile]
  api[FastAPI]
  db[PostgreSQL]
  off[Open Food Facts]
  dishes[dishes.json]
  demo[demo_products.json]
  model[risk_model.pkl]
  expo --> api
  api --> db
  api --> off
  api --> dishes
  api --> demo
  api --> model
```

Open Food Facts is used only for a live barcode. `dishes.json` and `demo_products.json` stay on disk. The decision tree is loaded into the FastAPI process.

## 6. Class

These are the SQLAlchemy models in `backend/app/models.py`. Request and response shapes live in `backend/app/schemas.py` and are not separate stored classes. A flush hook on the session computes the three stored targets. It is not a method of `DietaryProfile`.

```mermaid
classDiagram
  class User {
    +int id
    +string name
    +string email
    +string password_hash
    +datetime created_at
  }
  class Dependent {
    +int id
    +int caregiver_id
    +string name
    +int age
    +decimal height_cm
    +decimal weight_kg
    +string sex
    +datetime created_at
    +datetime updated_at
  }
  class DietaryProfile {
    +int id
    +int dependent_id
    +string[] allergies
    +string[] conditions
    +decimal daily_sodium_mg
    +decimal daily_sugar_g
    +decimal daily_calories
    +datetime created_at
    +datetime updated_at
  }
  class ScannedProduct {
    +int id
    +string barcode
    +string name
    +decimal calories
    +decimal sodium_mg
    +decimal sugar_g
    +json raw_response
    +datetime fetched_at
  }
  class MealLog {
    +int id
    +int dependent_id
    +int scanned_product_id
    +string risk_label
    +json risk_reasons
    +bool eaten
    +decimal grams_eaten
    +datetime created_at
  }
  class Alert {
    +int id
    +int dependent_id
    +int meal_log_id
    +string message
    +string status
    +datetime created_at
  }
  class Summary {
    +int id
    +int dependent_id
    +date week_start
    +string text
    +datetime created_at
  }
  User "1" --> "*" Dependent : owns
  Dependent "1" --> "1" DietaryProfile : current profile
  Dependent "1" --> "*" MealLog : records
  Dependent "1" --> "*" Alert : receives
  Dependent "1" --> "*" Summary : summarizes
  ScannedProduct "1" --> "*" MealLog : referenced by
  MealLog "1" --> "*" Alert : causes
```

`User.email` and `ScannedProduct.barcode` are unique. `DietaryProfile.dependent_id` is unique. `Summary` is unique on dependent and `week_start`. Saturated fat, carbohydrate, and protein are not fields. They are read from `raw_response` when a condition needs them.

## 7. State

A meal and an alert are the two records with a status that changes after they are created.

```mermaid
stateDiagram-v2
  [*] --> Uneaten : scan is saved
  Uneaten --> Eaten : caregiver confirms grams greater than zero
  Eaten --> [*]
```

Uneaten means `eaten` is false and `grams_eaten` is null. Eaten means `eaten` is true and `grams_eaten` is greater than zero. The API does not change an eaten meal back.

```mermaid
stateDiagram-v2
  [*] --> Active : warning or danger scan
  Active --> Acknowledged : caregiver acknowledges
  Acknowledged --> Acknowledged : acknowledge again
```

A safe scan does not create an alert. Acknowledgement does not delete the row.

## 8. Component

```mermaid
flowchart LR
  phone[Expo mobile app]
  api[FastAPI app]
  db[(PostgreSQL)]
  tree[Local decision tree]
  dishes[dishes.json]
  demo[demo_products.json]
  off[Open Food Facts]
  phone -->|HTTPS JSON and JWT| api
  api --> db
  api --> tree
  api --> dishes
  api --> demo
  api -->|barcode when demo mode is off| off
```

The phone does not open the database, the model file, or Open Food Facts. FastAPI is the only component that does.
