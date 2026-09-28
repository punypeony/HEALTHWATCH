export type HealthResponse = {
  status: "ok";
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
  };
};

export type Sex = "male" | "female";
export type RiskLabel = "safe" | "warning" | "danger";
export type AlertStatus = "active" | "acknowledged";

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type User = {
  id: number;
  name: string;
  email: string;
  created_at: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: "bearer";
};

export type DependentInput = {
  name: string;
  age: number;
  height_cm: number;
  weight_kg: number;
  sex: Sex;
  allergies: string[];
  conditions: string[];
};

export type DietaryProfile = {
  id: number;
  allergies: string[];
  conditions: string[];
  daily_sodium_mg: number;
  daily_sugar_g: number;
  daily_calories: number;
};

export type Dependent = {
  id: number;
  name: string;
  age: number;
  height_cm: number;
  weight_kg: number;
  sex: Sex;
  created_at: string;
  updated_at: string;
  dietary_profile: DietaryProfile;
};

export type MealLog = {
  id: number;
  dependent_id: number;
  scanned_product_id: number;
  risk_label: RiskLabel;
  risk_reasons: string[];
  created_at: string;
};

export type Alert = {
  id: number;
  dependent_id: number;
  meal_log_id: number;
  message: string;
  status: AlertStatus;
  created_at: string;
  product_name: string;
  risk_label: RiskLabel;
};

export type WeeklySummary = {
  total_scans: number;
  safe_count: number;
  warning_count: number;
  danger_count: number;
  common_reason: string | null;
  text: string;
};

export type ScanProduct = {
  barcode: string;
  name: string;
  calories: number;
  sodium_mg: number;
  sugar_g: number;
};

export type ScanPercentages = {
  sodium_pct: number;
  sugar_pct: number;
  calorie_pct: number;
};

export type ScanResult = {
  risk_label: RiskLabel;
  product: ScanProduct;
  percentages: ScanPercentages;
  reasons: string[];
  meal_log_id: number;
  alert_id: number | null;
  saturated_fat_g?: number | null;
  carbohydrate_g?: number | null;
  protein_g?: number | null;
  serving_grams?: number | null;
};

export type IntakeNutrient = {
  consumed: number | null;
  percentage: number | null;
  exceeded: boolean | null;
  incomplete?: boolean;
  target?: number;
  remaining?: number | null;
  limit?: number;
};

export type DailyIntake = {
  dependent_id: number;
  date: string;
  nutrients: Record<string, IntakeNutrient>;
};

export type AuthStackParamList = {
  Login: { registeredEmail?: string } | undefined;
  Register: undefined;
};

export type AppStackParamList = {
  Dependents: undefined;
  DependentForm: { dependentId?: number } | undefined;
  Dependent: { dependentId: number; dependentName: string };
};

export type DependentTabParamList = {
  Scan: { dependentId: number };
  History: { dependentId: number };
  Alerts: { dependentId: number };
  Summary: { dependentId: number };
  Intake: { dependentId: number };
};
