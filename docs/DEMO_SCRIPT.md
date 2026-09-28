# Demo script

About five minutes. The phone shows the API result. It does not invent a risk label.

Use **Demo Hypertension** for every scan. That profile is male, 60 years, 170 cm, 75 kg, with hypertension and no allergies. Computed targets are **1821.00 kcal**, **1400.00 mg sodium**, and **45.53 g sugar**. Demo Diabetes uses different targets, so the same barcodes would not match this script.

## Before the room

From the repository root:

```text
cd backend
.\.venv\Scripts\Activate.ps1
python seed.py --reset-demo
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

`backend/.env` must contain `DEMO_MODE=true` before uvicorn starts. Restart uvicorn after changing it. Open Food Facts is not called.

`python seed.py --reset-demo` deletes only the demo caregiver's dependents, their meals, alerts, and summaries, and demo barcodes that no other meal still uses. It restores the login below. Other accounts stay. `python seed.py` without the flag only adds missing demo records.

On the phone, `mobile/.env.local` must point at this computer, then start Expo with a clean bundle:

```text
cd mobile
npx expo start -c
```

## 1. Start

Show the API log and the Expo app. Login screen is enough.

## 2. Login

Email `demo@foodmonitor.local`

Password `DemoCaregiver123!`

## 3. Open the dependent

Open **Demo Hypertension**. History, Alerts, and Summary are empty until the scans below.

To show a newly added person instead, add a male dependent, age 60, height 170, weight 75, hypertension checked, and no allergies. The barcodes below are calculated for that profile.

## 4. Computed targets

Open the dependent for editing. The screen shows:

`Current daily targets: 1821.00 kcal, 1400.00 mg sodium, 45.53 g sugar.`

Those numbers come from the backend. They are not typed in.

## 5. Scan safe

Barcode `2000000000015`

Product: Demo Plain Oats. Per 100 g: 100 kcal, 50 mg sodium, 2 g sugar.

Expected risk: **safe**

Expected reason: `The nutrition classifier assigned a safe risk label for this product.`

Expected alert: none. `alert_id` is empty.

## 6. Scan warning

Barcode `2000000000022`

Product: Demo Sweet Snack. Per 100 g: 250 kcal, 100 mg sodium, 40 g sugar.

Expected risk: **warning**

Expected reason: `Sugar is high compared with the dependent's daily target.`

Sugar is about 88% of the daily target, below the danger cutoff, and sodium is too low to conflict with hypertension. The decision tree assigns warning.

Expected alert: one active alert with that sentence.

## 7. Scan danger

Barcode `2000000000039`

Product: Demo Salty Crackers. Per 100 g: 300 kcal, 2200 mg sodium, 5 g sugar.

Expected risk: **danger**

Expected reasons:

- `Sodium exceeds the dependent's daily target.`
- `Sodium conflicts with the recorded hypertension condition.`

Sodium is above the daily target and above half of it, and the dependent has hypertension. That condition rule forces danger before the decision tree runs. The reason names sodium and hypertension.

Expected alert: one active alert containing both sentences.

## 8. Alerts

Open **Alerts**. Two active alerts: the sweet snack and the crackers. The oats scan is absent. Acknowledge the crackers alert. It stays acknowledged.

## 9. History

Open **History**. Three rows, newest first: Demo Salty Crackers danger, Demo Sweet Snack warning, Demo Plain Oats safe.

## 10. Weekly summary

Open **Summary**. After only these three scans the text is:

`1 danger-level scan this week, mostly sodium-related.`

Counts: 3 total, 1 safe, 1 warning, 1 danger.

## 11. Optional: dish name and intake

These steps are outside the three-barcode demo. They do not change Demo Hypertension.

On Scan, open manual entry and look up `spaghetti`. The product name is Pasta, spaghetti. The same percentage, allergy, condition, and decision-tree steps run. `adobo` is Pork adobo, cnd. Demo Hypertension does not have high cholesterol, so adobo's missing saturated fat does not reject the scan. Any other typed name is not found.

After a result, Eaten asks for grams and Confirm sends `PATCH /meals/{id}`. Intake then includes that meal for today's Philippine date. Scans that were not confirmed stay in History and in the weekly summary, and stay out of Intake.
