# File structure

Source layout of this repository. `node_modules/`, `.venv/`, `__pycache__/`, `.pytest_cache/`, `.expo/`, and `.git/` are omitted.

```text
HEALTHWATCH/
├── backend/
│   ├── app/
│   │   ├── ml/
│   │   │   ├── __init__.py
│   │   │   └── predict.py
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── database.py
│   │   ├── dependents.py
│   │   ├── dishes.py
│   │   ├── errors.py
│   │   ├── food_lookup.py
│   │   ├── intake.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── passwords.py
│   │   ├── routes.py
│   │   ├── scan.py
│   │   ├── schemas.py
│   │   ├── summary.py
│   │   └── targets.py
│   ├── ml/
│   │   ├── evaluate.py
│   │   ├── evaluation.json
│   │   ├── evaluation.txt
│   │   ├── feature_order.json
│   │   ├── generate_training_data.py
│   │   ├── README.md
│   │   ├── risk_model.pkl
│   │   ├── train_risk_model.py
│   │   ├── training_data.csv
│   │   └── tree_readable.txt
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_api.py
│   │   ├── test_database.py
│   │   ├── test_failure_paths.py
│   │   ├── test_food_lookup.py
│   │   ├── test_health.py
│   │   ├── test_intake.py
│   │   ├── test_models.py
│   │   ├── test_predict.py
│   │   ├── test_registration_input.py
│   │   ├── test_risk_training.py
│   │   ├── test_scan.py
│   │   ├── test_summary.py
│   │   ├── test_targets.py
│   │   └── test_training_data.py
│   ├── .env
│   ├── .env.example
│   ├── demo_products.json
│   ├── dishes.json
│   ├── init_db.py
│   ├── pytest.ini
│   ├── requirements.txt
│   └── seed.py
├── docker/
│   └── postgres/
│       └── init.sql
├── docs/
│   ├── api.md
│   ├── ARCHITECTURE.md
│   ├── CCSFEN1L - Project Documentation Draft.md
│   ├── code-mapping.md
│   ├── database.md
│   ├── defect-log.md
│   ├── DEFECTS.md
│   ├── DEMO_SCRIPT.md
│   ├── demo-script.md
│   ├── diagrams.md
│   ├── file-structure.md
│   ├── food_lookup.md
│   ├── MODEL_EVALUATION.md
│   ├── requirements.md
│   └── scan.md
├── mobile/
│   ├── .claude/
│   │   └── settings.json
│   ├── assets/
│   │   ├── android-icon-background.png
│   │   ├── android-icon-foreground.png
│   │   ├── android-icon-monochrome.png
│   │   ├── favicon.png
│   │   ├── icon.png
│   │   └── splash-icon.png
│   ├── src/
│   │   ├── auth/
│   │   │   ├── accessToken.ts
│   │   │   ├── SessionContext.tsx
│   │   │   └── tokenStorage.ts
│   │   ├── components/
│   │   │   ├── ActionBar.tsx
│   │   │   ├── AlertCard.tsx
│   │   │   ├── AlertStatus.tsx
│   │   │   ├── AppHeader.tsx
│   │   │   ├── AuthLayout.tsx
│   │   │   ├── AuthSwitch.tsx
│   │   │   ├── BottomFade.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── DependentCard.tsx
│   │   │   ├── DependentIdentity.tsx
│   │   │   ├── DesignIcon.tsx
│   │   │   ├── Field.tsx
│   │   │   ├── HistoryCard.tsx
│   │   │   ├── IntakeCard.tsx
│   │   │   ├── NavigationBar.tsx
│   │   │   ├── NutritionTile.tsx
│   │   │   ├── OverlayInsets.tsx
│   │   │   ├── OverviewCard.tsx
│   │   │   ├── ProfileAvatar.tsx
│   │   │   ├── QueryRefreshNotice.tsx
│   │   │   ├── ResultCard.tsx
│   │   │   ├── RiskBadge.tsx
│   │   │   ├── ScannerEntry.tsx
│   │   │   ├── Screen.tsx
│   │   │   └── ScreenStatus.tsx
│   │   ├── hooks/
│   │   │   ├── useFocusedQuery.ts
│   │   │   ├── useHealthCheck.ts
│   │   │   └── useProfilePhoto.ts
│   │   ├── navigation/
│   │   │   ├── AppNavigator.tsx
│   │   │   ├── AuthNavigator.tsx
│   │   │   ├── DependentTabs.tsx
│   │   │   ├── HealthTabBar.tsx
│   │   │   └── RootNavigator.tsx
│   │   ├── screens/
│   │   │   ├── AlertsScreen.tsx
│   │   │   ├── DependentFormScreen.tsx
│   │   │   ├── DependentsScreen.tsx
│   │   │   ├── HealthCheckScreen.tsx
│   │   │   ├── HistoryScreen.tsx
│   │   │   ├── IntakeScreen.tsx
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   ├── ScannerScreen.tsx
│   │   │   └── SummaryScreen.tsx
│   │   ├── theme/
│   │   │   ├── colors.ts
│   │   │   ├── screen.ts
│   │   │   ├── spacing.ts
│   │   │   ├── typography.ts
│   │   │   └── wallpaper.ts
│   │   ├── utils/
│   │   │   ├── apiBaseUrl.ts
│   │   │   ├── errors.ts
│   │   │   ├── format.ts
│   │   │   ├── profilePhoto.ts
│   │   │   └── queryCache.ts
│   │   ├── api.ts
│   │   └── types.ts
│   ├── .env.local
│   ├── .gitignore
│   ├── AGENTS.md
│   ├── app.json
│   ├── App.tsx
│   ├── CLAUDE.md
│   ├── index.ts
│   ├── LICENSE
│   ├── package.json
│   ├── package-lock.json
│   └── tsconfig.json
├── .gitattributes
├── .gitignore
├── AGENTS.md
├── docker-compose.yml
├── HealthWatch.txt
└── README.md
```

`backend/.env` and `mobile/.env.local` are local configuration. They are not part of the shared source layout.
