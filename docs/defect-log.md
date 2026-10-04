# Defect log

| ID | Status | What happened | What was done |
| --- | --- | --- | --- |
| D1 | Fixed | Windows PostgreSQL 18 was already listening on port 5432, so Docker's `postgres` password was rejected. | The local PostgreSQL 18 service was stopped and Docker Postgres was bound to 5432. |
| D2 | Open | A phone could not reach the API when `EXPO_PUBLIC_API_URL` still pointed at an old address, or when the Wi-Fi firewall profile did not match the allow rule for port 8000. | The mobile env file must use this computer's current Wi-Fi address, and Expo must be restarted with `npx expo start -c`. |
| D3 | Fixed | `DEMO_MODE=true` made every barcode that is not in `demo_products.json` return product not found, including foods listed on Open Food Facts. | Local `backend/.env` was set to `DEMO_MODE=false` for live lookup. The offline course demo still requires `DEMO_MODE=true` and an API restart. |
| D4 | Fixed | The first weekly-summary reason query produced a SQL cartesian product and the request returned 503. | Reasons are counted with one `jsonb_array_elements_text` SQL statement. |
| D5 | Fixed | `tests/test_risk_training.py` compared newly written evaluation files with the committed files. Those committed files record Python 3.14.7. This machine's backend virtual environment is Python 3.11. | The reproducibility check still requires identical metrics and artifacts. It no longer treats the recorded Python version string as part of that comparison. |
