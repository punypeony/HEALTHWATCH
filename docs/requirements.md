# Functional and non-functional requirements

These requirements describe the implementation in this repository.

## Functional

- A caregiver can register and log in with email and password. The API returns a JWT. Registration does not log the caregiver in.
- The caregiver can log out on the phone. The token is removed from device storage.
- A caregiver can list, add, and edit only their own dependents. Daily calorie, sodium, and sugar targets are computed by the backend from age, height, weight, sex, and conditions. The caregiver does not type those targets.
- Allergies are stored as labels. Diabetic and hypertension are recorded conditions.
- The caregiver can scan a barcode or type one. The backend looks up the product, compares calories, sodium, and sugar per 100 g with the dependent's targets, checks structured allergens and condition conflicts, and classifies the food as `safe`, `warning`, or `danger`.
- A warning or danger scan stores an active alert. A safe scan does not.
- The caregiver can view meal history, view alerts, and acknowledge an alert. Acknowledging again is allowed.
- `GET /dependents/{id}/summary/weekly` counts the last 7 days of meal logs and returns a short templated sentence. The sentence is ordinary Python text, not a language model.
- With `DEMO_MODE=true`, lookup uses `backend/demo_products.json` and does not call Open Food Facts.

## Non-functional

- The API is Python FastAPI. The database is PostgreSQL through SQLAlchemy. Passwords are salted PBKDF2-SHA256 hashes. Protected routes use the caregiver id from the JWT.
- API errors use `{"error":{"code":"...","message":"..."}}`.
- The risk model is a local scikit-learn decision tree loaded with joblib. It is not a remote model and not TensorFlow.
- Nutrition used for classification is calories, sodium, and sugar. Other label nutrients are not scored.
- The mobile app is Expo and TypeScript with React Navigation. Placeholder styling is intentional until a final visual design is provided.
- The committed evaluation on the training machine reports 92.90% test accuracy.
