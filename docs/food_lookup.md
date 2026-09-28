# Food lookup

`backend/app/food_lookup.py` exposes synchronous `fetch_product(barcode)` and
returns `barcode`, `name`, `calories`, `sodium_mg`, `sugar_g`, and `raw_response`.
Numbers are Decimal values rounded half up to two places, matching PostgreSQL
numeric columns. Barcode input is a string of 8–14 ASCII digits; leading zeroes
are preserved. No API key or additional dependency is needed.

Live mode (`DEMO_MODE=false`) checks `scanned_products`, requests
`https://world.openfoodfacts.org/api/v2/product/{barcode}.json` on a miss using
httpx with a 10-second timeout, validates the response, and commits a cache row.
Failed lookups never create successful rows. The unique barcode index and
PostgreSQL `ON CONFLICT DO NOTHING` handle concurrent inserts. Cache persistence
uses its own short transaction; it does not commit a caller's meal transaction.

Normalization uses OFF's normalized `energy-kcal_100g`, `sodium_100g`, and
`sugars_100g`. Sodium grams are multiplied by 1000; energy kJ can be divided by
4.184 when kcal are unavailable. Per-100g energy takes precedence over serving
energy. OFF's label-entry `*_unit` does not change the units of normalized keys.
See [Open Food Facts API documentation](https://openfoodfacts.github.io/openfoodfacts-server/api/ref-v2/).

Serving-only data requires explicit gram mass such as `25 g` or `1 bar (25 g)`;
values are multiplied by `100 / serving_grams`. Bare serving quantities, counts,
cups, ranges and ml are rejected. Explicit volume-based data and ml serving
labels are rejected because no density conversion is implemented. Missing,
negative, non-finite, malformed or out-of-storage-range required values produce
`PRODUCT_DATA_INVALID`; explicit zero is valid. Product names must be present.

Errors use the existing `ApiError` and HTTP error envelope:

| Code | HTTP |
| --- | --- |
| VALIDATION_ERROR | 422 |
| PRODUCT_NOT_FOUND | 404 |
| PRODUCT_DATA_INVALID | 422 |
| FOOD_LOOKUP_TIMEOUT | 504 |
| FOOD_LOOKUP_FAILED | 502 |
| DATABASE_ERROR | 503 |

## Offline demo

`DEMO_MODE=true` reads `backend/demo_products.json` by barcode. It does not use
the network or database cache, so previously cached live data cannot affect it.
Demo data uses the same OFF-shaped response and normalization function. It is
not inserted into the live lookup cache during lookup. The scan route stores a
demo product when it creates the meal log, and reuses that barcode on the next
scan. A stored row with different nutrition returns `PRODUCT_CACHE_CONFLICT`.

Typed dish names are not part of this lookup. `app/dishes.py` resolves
`spaghetti` and `adobo` from `backend/dishes.json` whether or not `DEMO_MODE`
is on. See [scan.md](scan.md).

| Barcode | Product | kcal/100g | Sodium mg/100g | Sugar g/100g |
| --- | --- | ---: | ---: | ---: |
| 2000000000015 | Demo Plain Oats | 100 | 50 | 2 |
| 2000000000022 | Demo Sweet Snack | 250 | 100 | 40 |
| 2000000000039 | Demo Salty Crackers | 300 | 2200 | 5 |

For the seeded hypertension dependent these are intended to exercise safe,
warning (sugar 40 / 45.53), and danger (sodium) classifications in the scan endpoint.
They are synthetic demo foods, not claims about real products. The salty item
also includes structured `en:milk` allergen data. Lookup itself does not classify
risk or create meals or alerts. The [scan route](scan.md) orchestrates those steps.

## Verification

From `backend`, with the virtual environment active and PostgreSQL running:

```powershell
pytest -q tests/test_food_lookup.py
pytest -q
```

HTTP is mocked in every automated lookup test. Tests cover successful caching,
cache hits, not-found responses, timeout/transport errors, malformed JSON,
missing/invalid nutrition, unit conversion, serving interpretation and demo mode.

Live verification on 2026-09-23 succeeded for `3017620422003` (Nutella): 539.00 kcal,
42.80 mg sodium, 56.30 g sugar per 100g. This was a separate manual request, not
part of the automated tests; external product data can change.
