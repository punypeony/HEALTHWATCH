# Food Consumption Health Monitoring System

Caregiver-facing Expo app and FastAPI backend for monitoring food consumption of dependent relatives. This repository currently contains the initial project scaffold.

## 1. Start PostgreSQL

From the repository root:

```bash
docker compose up -d
```

PostgreSQL 16 listens on `localhost:5432`. Databases:

- `food_monitor`
- `food_monitor_test`

Username and password: `postgres` / `postgres`.

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

The Health screen calls `GET /health`. Override the API URL when needed:

```bash
# Physical device on the same network
npx expo start
```

Then set `EXPO_PUBLIC_API_URL` (for example `http://192.168.1.10:8000`) before starting Expo. Android emulators use `http://10.0.2.2:8000` by default. iOS Simulator and Expo web use `http://127.0.0.1:8000`.

## 7. Run backend tests

From `backend` with the virtual environment activated and PostgreSQL running:

```bash
pytest
```

Typecheck the mobile app from `mobile`:

```bash
npx tsc --noEmit
```
