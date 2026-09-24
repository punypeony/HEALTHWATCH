# Diagrams

These diagrams follow the current routes, models, and scan functions. The decision tree text and measured accuracy are in [ARCHITECTURE.md](ARCHITECTURE.md) and [MODEL_EVALUATION.md](MODEL_EVALUATION.md).

## 1. Use case

The caregiver is the only actor. Register and login are public. Every later case sends the JWT, and the API ignores any caregiver id sent by the phone.

```mermaid
flowchart TD
  caregiver[Caregiver]
  caregiver --> registerLogin[Register / Login]
  caregiver --> manageDependents[Manage Dependents]
  caregiver --> scanFood[Scan Food]
  caregiver --> viewHistory[View History]
  caregiver --> viewAlerts[View Alerts]
  caregiver --> acknowledgeAlerts[Acknowledge Alerts]
  caregiver --> weeklySummary[View Weekly Summary]
```

Register is `POST /auth/register`. Login is `POST /auth/login`. Manage dependents is list, create, update, and delete under `/dependents`. Scan food is the camera or the manual barcode on the Scan tab. History, alerts, acknowledge, and the weekly summary are the other three tabs plus `PATCH /alerts/{id}`.

## 2. Activity

`POST /dependents/{id}/scan` runs the steps below. An allergy match, or a condition conflict above the 0.5 sodium or sugar threshold, assigns `danger` and does not call the tree. Any other case calls the loaded decision tree. `warning` and `danger` insert an alert. `safe` does not.

```mermaid
flowchart TD
  scanned[Barcode scanned or typed]
  scanned --> validate[Validate barcode and dietary profile]
  validate --> fetchProduct[Fetch product]
  fetchProduct --> percentages[Calculate percentages]
  percentages --> checks[Check allergies and conditions]
  checks --> hardRule{Allergy match or condition conflict over 0.5?}
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

Ownership is checked before lookup. Demo mode stops at the demo file. Live mode uses the `scanned_products` cache before Open Food Facts.

```mermaid
sequenceDiagram
  participant Mobile
  participant FastAPI
  participant FoodLookup as Food Lookup
  participant Source as Open Food Facts or Demo Data
  participant Classifier as Risk Classifier
  participant PostgreSQL

  Mobile->>FastAPI: POST /dependents/{id}/scan with JWT
  FastAPI->>PostgreSQL: Load dependent owned by the token
  PostgreSQL-->>FastAPI: Dependent and dietary profile
  FastAPI->>FoodLookup: fetch_product(barcode)
  alt DEMO_MODE true
    FoodLookup->>Source: Read demo_products.json
  else Cached barcode
    FoodLookup->>PostgreSQL: Read scanned_products
    PostgreSQL-->>FoodLookup: Cached product
  else Cache miss
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

The phone and FastAPI are separate processes. PostgreSQL is the `postgres:16` service in `docker-compose.yml`. The decision tree file is on the same machine as FastAPI and is loaded into that process. Open Food Facts is called only when `DEMO_MODE` is not `true`.

```mermaid
flowchart TD
  expo[Expo Mobile]
  api[FastAPI]
  db[PostgreSQL]
  off[Open Food Facts]
  expo --> api
  api --> db
  api --> off
```
