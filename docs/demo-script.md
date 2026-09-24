# Demo script

Use this when showing the offline course demo. Set `DEMO_MODE=true` in `backend/.env` and restart FastAPI. The phone must be able to reach the API address shown on the login screen.

1. Log in as `demo@foodmonitor.local` / `DemoCaregiver123!`.
2. Open **Demo Hypertension**.
3. On Scan, enter these barcodes one at a time. Each result comes from the backend.

| Barcode | Product | What to point out |
| --- | --- | --- |
| `2000000000015` | Demo Plain Oats | A lower-risk result |
| `2000000000022` | Demo Sweet Snack | Sugar is high for the targets |
| `2000000000039` | Demo Salty Crackers | Sodium and the milk allergen can force danger |

4. Open **Alerts**. Warning and danger scans appear as active. Acknowledge one alert and show that it is visually distinct from the active alerts.
5. Open **History**. The same scans are listed with their risk labels.
6. Open **Summary**. The counts and sentence cover the last 7 days, including the three seeded danger scans for this dependent when those rows are still inside the window. The sentence is a template, not a generated essay.

If live Open Food Facts products should be scanned instead, set `DEMO_MODE=false`, restart the API, and use a barcode that has a name plus calories, sodium, and sugar per 100 g. The three demo barcodes above are not looked up from Open Food Facts in that mode.
