# Authentication and dependent API

Run `pip install -r requirements.txt` in the backend virtual environment to install
PyJWT (the approved JWT dependency), then `python init_db.py`. Restart FastAPI to
load the new routes. Interactive endpoint schemas are at `http://127.0.0.1:8000/docs`.

## Authentication

- `POST /auth/register`: JSON `{ "name": "Caregiver", "email": "caregiver@example.com", "password": "ExamplePassword123!" }`.
  Returns HTTP 201 with `id`, `name`, `email`, `created_at`. No password/hash is returned.
- `POST /auth/login`: JSON `{ "email": "caregiver@example.com", "password": "ExamplePassword123!" }`.
  Returns `{ "access_token": "...", "token_type": "bearer" }`.
- Set `Authorization: Bearer <access_token>` on all protected requests. Swagger's
  Authorize button accepts the token. Registration does not automatically log in.

Names are trimmed and cannot be empty. Emails are trimmed, lowercased, and checked
for a basic local@domain.suffix shape; this is not email-delivery verification.
Registration passwords are 8–1024 characters and are never trimmed. Passwords use
the existing randomly salted PBKDF2-SHA256 format with 600,000 iterations; seeded
accounts remain compatible. Unknown emails and wrong passwords return the same
401 `INVALID_CREDENTIALS` response.

Tokens use HS256, last one hour, and contain caregiver ID in the string `sub`
claim. Verification requires a valid signature, expiration, issued-at, issuer
`food-monitor`, and audience `food-monitor-mobile`. The caregiver must still
exist in PostgreSQL. There are no refresh-token or logout-revocation endpoints
in this prompt. See [PyJWT verification documentation](https://pyjwt.readthedocs.io/en/stable/usage.html).

`JWT_SECRET` comes from the environment or backend `.env`. Missing/blank secrets
fail with 503 `CONFIGURATION_ERROR`. The committed example secret is for local
setup only. Generate a private secret before sharing a deployment:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Put that value in the ignored `backend/.env` as `JWT_SECRET=...`, then restart
FastAPI. Changing the secret invalidates existing tokens. Use HTTPS outside
local development.

## Protected routes

| Method | Path | Result |
| --- | --- | --- |
| GET | `/dependents` | Own dependents, ordered by ID; `[]` if none |
| POST | `/dependents` | Creates dependent and computed profile; HTTP 201 |
| GET | `/dependents/{id}` | One owned dependent with nested `dietary_profile` |
| PATCH | `/dependents/{id}` | Updates submitted fields and recomputes existing profile |
| DELETE | `/dependents/{id}` | Deletes owned dependent and its owned records; HTTP 204, no body |
| GET | `/dependents/{id}/meals` | Stored meal logs, newest first; `[]` if none. Calories, sodium, and sugar stay per 100 g. `grams_eaten` is null until the meal is marked eaten. History scales those three nutrients by `grams_eaten / 100` when it is set. `image_url` is the saved Open Food Facts front photo, or null |
| DELETE | `/dependents/{id}/meals` | Deletes every meal for that owned dependent. Alerts for those meals are removed by the meal foreign key. Cached products stay. HTTP 204, no body |
| DELETE | `/meals/{id}` | Deletes that owned meal. Its alert is removed by the meal foreign key. The cached product stays. HTTP 204, no body |
| GET | `/dependents/{id}/alerts` | Stored active/acknowledged alerts, newest first; `[]` if none |
| PATCH | `/alerts/{id}` | Accepts only `{ "status": "acknowledged" }`; repeat acknowledgement is safe |
| GET | `/dependents/{id}/summary/weekly` | Last 7 days of meal logs: counts, common reason, and one templated summary |
| GET | `/dependents/{id}/daily-intake` | Eaten meals for one `Asia/Manila` date. Optional `date=YYYY-MM-DD`; omitted means today |
| PATCH | `/meals/{id}` | Body `{ "grams_eaten": 80 }`. Marks that owned meal eaten. Grams must be greater than zero. When the scan included `serving_grams`, the app sends servings times that weight, rounded half up to two decimals |
| POST | `/dependents/{id}/scan` | Classify a barcode or a typed dish and save its meal log and optional alert; see [scan contract](scan.md) |

Create body:

```json
{
  "name": "Relative",
  "age": 60,
  "height_cm": 170,
  "weight_kg": 75,
  "sex": "male",
  "allergies": ["Milk"],
  "conditions": ["Hypertension"]
}
```

Age is a JSON integer 0–120. Height/weight must be finite positive values fitting
PostgreSQL `numeric(7,2)` (at most two decimal places). Sex is `male` or `female`.
Allergy/condition labels are trimmed, lowercased, deduplicated, and cannot be blank.
Both arrays default to empty on creation. A dependent may be saved with no
conditions. The phone form offers Diabetic, Hypertension, High cholesterol, and
Kidney disease. PATCH preserves omitted fields and rejects explicit nulls; send
`[]` to clear allergies/conditions.

Daily intake returns calories, sodium, and sugar for every dependent. Carbohydrate
is added for `diabetic`, saturated fat for `high cholesterol`, and protein for
`kidney disease` at age 12 or older. Each nutrient reports consumed amount, limit
or target, percentage, and whether the total exceeded the limit. Amounts are
scaled from per-100 g values by `grams_eaten`. A meal that is not marked eaten
is excluded. If a counted meal is missing a required nutrient, that nutrient is
`incomplete` instead of being treated as zero. The date is the Philippine local
day, not the UTC window used by the weekly summary.

`caregiver_id`, all target fields, and other unknown fields are rejected with 422.
Ownership always comes from the verified token. Normal ORM writes invoke the
shared target computation and retain the profile ID; impossible measurements
that produce non-positive targets return 422 and roll back the write.

## Errors and ownership privacy

Every application/framework error uses:

```json
{"error":{"code":"ERROR_CODE","message":"Human-readable message"}}
```

Validation errors are 422 `VALIDATION_ERROR`; duplicate emails are 409
`DUPLICATE_EMAIL`; absent/invalid bearer tokens are 401 `UNAUTHORIZED`. Other
standard codes include `NOT_FOUND`, `METHOD_NOT_ALLOWED`, `DATABASE_ERROR`,
`INTERNAL_ERROR`, and scan/lookup errors documented in [scanning](scan.md). Raw SQL, submitted credentials and
internal exception details are not returned.

Both an unowned and a nonexistent **valid record ID** return the identical 403
`FORBIDDEN` body. This satisfies the required 403 ownership behavior without
revealing which unrelated IDs exist. Invalid ID syntax/range returns 422;
unknown URL routes return 404.

## PowerShell smoke test

With FastAPI and PostgreSQL running (and `python seed.py` run once):

```powershell
$base = 'http://127.0.0.1:8000'
$body = @{ email = 'demo@foodmonitor.local'; password = 'DemoCaregiver123!' } | ConvertTo-Json
$login = Invoke-RestMethod "$base/auth/login" -Method Post -ContentType 'application/json' -Body $body
$headers = @{ Authorization = "Bearer $($login.access_token)" }
Invoke-RestMethod "$base/dependents" -Headers $headers
```

Run `pytest -q` from `backend` for registration, login, token validation, CRUD,
rollback, ownership privacy, alerts, and existing schema/target tests. Tests use
the dedicated PostgreSQL test database and roll back their records.

Implementation: `app/auth.py` handles JWT/accounts and request sessions;
`app/passwords.py` handles password verification; `app/schemas.py` defines input
allowlists/output models; `app/dependents.py` handles owned-resource operations;
`app/routes.py` orchestrates HTTP endpoints; `app/errors.py` handles shared errors.
