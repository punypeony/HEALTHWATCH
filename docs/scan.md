# Food scans

`POST /dependents/{id}/scan` requires a caregiver JWT bearer token and JSON:

```json
{"barcode":"2000000000015"}
```

or exactly one dish name:

```json
{"dish_name":"spaghetti"}
```

A barcode must contain 8–14 ASCII digits. A dish name is trimmed and matched
without regard to case. The body must contain one of those fields, not both,
and not neither. Extra fields are rejected. Ownership is checked before food
lookup; nonexistent and unowned IDs return identical 403 responses. A missing
dietary profile returns 409 `DIETARY_PROFILE_MISSING`.

## Processing and storage

`app/routes.py` orchestrates validation, lookup, percentages, allergy/condition
checks, prediction, product storage, meal creation, optional alert creation and
response construction. Helpers are in `app/scan.py`; inference is in
`app/ml/predict.py`. A typed name is resolved by `app/dishes.py` and then uses
the same later steps. Allergen matching uses `product.allergens_tags` (or the
structured comma-separated `allergens` field), lowercases tokens and removes
language prefixes. Missing declarations mean no recorded match, not confirmation
that a food contains no allergens. Ingredients prose is not interpreted.

Ratios are nutrition **per 100g** divided by the dependent's daily targets:
sodium mg/sodium target, sugar g/sugar target, kcal/calorie target. A ratio of
0.85 means 85% of the daily target in 100g, not in an arbitrary serving.

Hard rules run before the decision tree. An allergy match is always danger.
These condition checks also force danger when the matching per-100 g value is
above half of its daily target:

| Recorded condition | Nutrient | Daily target |
| --- | --- | --- |
| hypertension | sodium | the stored sodium target |
| diabetic | sugar | the stored sugar target |
| diabetic | carbohydrate | `0.65 * daily calories / 4` |
| high cholesterol | saturated fat | `0.10 * daily calories / 9` |
| kidney disease, age 12 or older | protein | `1.3 * weight kg` |

A nutrient is read only when its condition is checked. If that box is off, a
missing value does not fail the scan and is not stored as zero. If the box is
on and the value is missing, not a number, or negative, the scan returns
`PRODUCT_DATA_INVALID`. Fiber is never a danger rule. Kidney disease under age
12 still requires a numeric protein value, but it does not force danger.
KDIGO does not restrict protein in children. There is no dialysis flag.

The decision tree still uses only sodium, sugar, calories, the allergy flag,
the condition-conflict flag, and age band. It was not retrained for the extra
nutrients. Deterministic sentences name the rule that fired. The tree is not
introspected. When no threshold reason applies, the response states the
classifier's label without inventing a nutrition explanation.

FastAPI lifespan loads and validates the trusted local model and feature order
once per process. Requests reuse them. Missing/incompatible artifacts prevent
startup; restart the backend to load a newly trained model. The model is an
imperfect synthetic-data classifier, not clinical validation; nutrition-only
predictions can differ from the training label rules.

A new meal starts with `eaten` false and `grams_eaten` null. The caregiver can
later send `PATCH /meals/{id}` with `grams_eaten` greater than zero. That marks
the meal eaten. Daily intake uses those rows only.

Meal logs and alerts use one commit and roll back together on any write failure.
Safe scans have no alert; warning/danger scans create an active alert. Successful
live lookup caching uses its existing independent transaction, so a cached
product may remain after a scan fails, but no partial meal/alert remains. Offline
demo products are inserted in the scan transaction. Unique barcodes reuse the
same product row; conflicting stored demo data returns 409
`PRODUCT_CACHE_CONFLICT` rather than overwriting historical product data.

## Successful response (HTTP 200)

```json
{
  "risk_label": "warning",
  "product": {"barcode": "123456789", "name": "Example Food", "calories": 250, "sodium_mg": 1700, "sugar_g": 12},
  "percentages": {"sodium_pct": 0.85, "sugar_pct": 0.24, "calorie_pct": 0.125},
  "reasons": ["Sodium is high compared with the dependent's daily target."],
  "meal_log_id": 15,
  "alert_id": 8
}
```

`alert_id` is null for safe scans. `saturated_fat_g`, `carbohydrate_g`, and
`protein_g` are included only when that nutrient was checked and its percentage
is above 0.5. They are omitted otherwise. Errors retain the standard
`error.code` and `error.message` envelope. Lookup failures preserve
`PRODUCT_NOT_FOUND`, `PRODUCT_DATA_INVALID`, `FOOD_LOOKUP_TIMEOUT`, or
`FOOD_LOOKUP_FAILED`; DB failures return 503 `DATABASE_ERROR`.

## Typed dishes

`spaghetti` and `adobo` come from `backend/dishes.json`, copied from the FNRI
food composition library. Values are per 100 g. The request does not call Open
Food Facts and does not read `DEMO_MODE`. Any other name returns
`PRODUCT_NOT_FOUND`.

| Name | FNRI row | kcal | Sodium mg | Sugar g | Saturated fat g |
| --- | --- | ---: | ---: | ---: | --- |
| spaghetti | Pasta, spaghetti | 361 | 6 | 2.7 | 0.2 |
| adobo | Pork adobo, cnd | 277 | 254 | 0.1 | missing |

Adobo has no saturated fat. A high-cholesterol dependent who submits `adobo`
receives `PRODUCT_DATA_INVALID`. A dependent without that condition is still
classified from calories, sodium, and sugar. Neither row contains carbohydrate
or protein, so diabetic or kidney-disease dependents also receive
`PRODUCT_DATA_INVALID` for these names. Those values are not invented.

## Try it in PowerShell

Start PostgreSQL and FastAPI using the root README. Set `DEMO_MODE=true` in the
backend `.env` and restart FastAPI. From `backend`, run `python seed.py` once.
Then:

```powershell
$base = 'http://127.0.0.1:8000'
$credentials = @{email='demo@foodmonitor.local'; password='DemoCaregiver123!'} | ConvertTo-Json
$login = Invoke-RestMethod "$base/auth/login" -Method Post -ContentType 'application/json' -Body $credentials
$headers = @{Authorization="Bearer $($login.access_token)"}
$dependents = Invoke-RestMethod "$base/dependents" -Headers $headers
$dependent = $dependents | Where-Object { $_.dietary_profile.conditions -contains 'hypertension' } | Select-Object -First 1
$id = $dependent.id
# Expected for the seeded hypertension dependent: safe, warning, danger.
foreach ($barcode in @('2000000000015', '2000000000022', '2000000000039')) {
    $body = @{barcode=$barcode} | ConvertTo-Json
    Invoke-RestMethod "$base/dependents/$id/scan" -Method Post -Headers $headers -ContentType 'application/json' -Body $body | ConvertTo-Json -Depth 5
}
Invoke-RestMethod "$base/dependents/$id/meals" -Headers $headers
Invoke-RestMethod "$base/dependents/$id/alerts" -Headers $headers
```

Each successful request adds a meal, even if the product was already cached.
From `backend` with the virtual environment active, run `pytest -q`. Scan tests
use PostgreSQL test transactions, mock lookup, and test offline demo operation,
startup-only loading, safety priority, ownership, validation and atomic rollback.
