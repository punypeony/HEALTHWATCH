# Food Consumption Health Monitoring System

Caregiver-facing Expo app and FastAPI backend for monitoring food consumption of dependent relatives. This repository currently contains the initial project scaffold.

The backend now includes authentication and caregiver-owned dependent management.
See [API usage and PowerShell login example](docs/api.md) for endpoint contracts,
JWT setup, ownership rules, and errors. The [scan endpoint](docs/scan.md) classifies
products and stores meal logs and warning/danger alerts atomically.

The [food lookup module](docs/food_lookup.md) supports Open Food Facts, PostgreSQL
caching, and deterministic offline demo barcodes used by scanning.

## 1. Start PostgreSQL

From the repository root:

```bash
docker compose up -d
```

PostgreSQL 16 listens on `localhost:5432`. Databases:

- `food_monitor`
- `food_monitor_test`

Username and password: `postgres` / `postgres`.

If PowerShell cannot find `docker` after installing Docker Desktop, open a new
terminal. For a per-user installation, this session-only PATH update also works:

```powershell
$env:Path += ";$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin"
docker compose up -d
docker compose ps
```

The test database is created on the volume's first initialization. `docker compose
down` preserves the databases in the persistent volume.

## 2. Create the Python virtual environment

```bash
cd backend
python -m venv .venv
```

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

macOS / Linux:

```bash
source .venv/bin/activate
```

Copy environment variables:

```bash
copy .env.example .env
```

On macOS / Linux use `cp .env.example .env`.

## 3. Install backend dependencies

With the virtual environment activated:

```bash
pip install -r requirements.txt
```

Create the PostgreSQL tables and demo records from `backend`:

```bash
python init_db.py
python seed.py
```

Both commands can be repeated. The seed uses the shared backend target calculation
and stores a salted password hash. See [database documentation](docs/database.md)
for demo credentials, the ER diagram, constraints, and calculation assumptions.
Table creation does not migrate existing tables.

## 4. Start FastAPI

From `backend` with the virtual environment activated:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Check health:

```bash
curl http://127.0.0.1:8000/health
```

Expected:

```json
{"status":"ok"}
```

## 5. Install mobile dependencies

From the repository root:

```bash
cd mobile
npm install
```

## 6. Start Expo

From `mobile`:

```bash
npx expo start
```

The app opens on Log in. Register creates an account and returns to Log in. A stored session skips Log in until Log out. Override the API URL when needed:

```powershell
# Physical device on the same Wi-Fi: replace with your computer's LAN IPv4 address.
$env:EXPO_PUBLIC_API_URL = "http://192.168.1.10:8000"
npx expo start
```

Set the variable before starting Expo, then open the QR code in a compatible Expo
Go app. Keep FastAPI running and allow port 8000 through the Windows firewall on
your private network if prompted. Android emulators use `http://10.0.2.2:8000` by
default; iOS Simulator uses `http://127.0.0.1:8000`. Web dependencies are not included
in this native scaffold. The scanner currently displays raw barcodes only; food
lookup and risk classification belong to later prompts.

## 7. Run backend tests

From `backend` with the virtual environment activated and PostgreSQL running:

```bash
pytest
```

Integration tests use `TEST_DATABASE_URL`, including a real PostgreSQL query;
the unavailable-database response is also tested.

Typecheck the mobile app from `mobile`:

```bash
npx tsc --noEmit
```
