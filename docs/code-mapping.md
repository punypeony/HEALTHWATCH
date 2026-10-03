# Code file mapping

| Path | Role |
| --- | --- |
| `backend/app/main.py` | FastAPI app, error handlers, model load on startup |
| `backend/app/routes.py` | **Updated:** auth, dependents, meals, meal delete, alerts, daily intake, weekly summary, scan |
| `backend/app/auth.py` | Registration, login, JWT |
| `backend/app/passwords.py` | Password hashing |
| `backend/app/dependents.py` | Owned dependent and alert operations, target recompute |
| `backend/app/targets.py` | Daily calorie, sodium, and sugar targets, plus condition limits for carbohydrate, saturated fat, and protein |
| `backend/app/food_lookup.py` | Open Food Facts, demo file, and product cache |
| `backend/app/dishes.py` | Local spaghetti and adobo lookup |
| `backend/dishes.json` | FNRI values for those two dishes |
| `backend/app/scan.py` | Scan steps: validate, percentages, allergy, condition, meal, alert |
| `backend/app/intake.py` | Daily intake from eaten meals |
| `backend/app/summary.py` | Last-7-days SQL counts and templated summary |
| `backend/app/ml/predict.py` | Load the decision tree and apply hard safety rules |
| `backend/app/models.py` | SQLAlchemy tables |
| `backend/app/schemas.py` | Request and response models |
| `backend/app/errors.py` | Shared error JSON |
| `backend/ml/generate_training_data.py` | Synthetic training rows |
| `backend/ml/train_risk_model.py` | Train and save the tree |
| `backend/ml/evaluate.py` | Evaluation script |
| `backend/ml/risk_model.pkl` | Committed model |
| `backend/ml/tree_readable.txt` | Text form of the tree |
| `backend/seed.py` | Demo caregiver, two dependents, and three danger scans |
| `mobile/App.tsx` | Navigation and session providers |
| `mobile/src/api.ts` | HTTP client and JWT header |
| `mobile/src/auth/SessionContext.tsx` | Login, logout, stored session |
| `mobile/src/screens/LoginScreen.tsx` | Login |
| `mobile/src/screens/RegisterScreen.tsx` | Registration |
| `mobile/src/screens/DependentsScreen.tsx` | Dependent list |
| `mobile/src/screens/DependentFormScreen.tsx` | Add and edit dependent |
| `mobile/src/screens/ScannerScreen.tsx` | **Updated:** camera scan, manual barcode, dish name, result, warning or danger prompt, servings or grams, daily-limit prompt |
| `mobile/src/screens/HistoryScreen.tsx` | **Updated:** meal history, delete one scan, clear this dependent's scans |
| `mobile/src/screens/AlertsScreen.tsx` | Alerts and acknowledgement |
| `mobile/src/screens/SummaryScreen.tsx` | Weekly counts and sentence |
| `mobile/src/screens/IntakeScreen.tsx` | Daily intake |
| `mobile/src/navigation/DependentTabs.tsx` | **Updated:** Scan, History, Alerts, Summary, and Intake on the default tab bar |
| `mobile/src/theme/` | Colors, type, and spacing used by the screens |
