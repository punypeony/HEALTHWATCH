import { getAccessToken, notifyUnauthorized } from "./auth/accessToken";
import type {
  Alert,
  ApiErrorBody,
  Dependent,
  DependentInput,
  HealthResponse,
  LoginRequest,
  MealLog,
  RegisterRequest,
  ScanResult,
  TokenResponse,
  User,
  DailyIntake,
  WeeklySummary,
} from "./types";
import { getApiBaseUrl } from "./utils/apiBaseUrl";

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

type Method = "GET" | "POST" | "PATCH" | "DELETE";

type RequestOptions = {
  method?: Method;
  body?: unknown;
  auth?: boolean;
};

async function parseError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    if (body?.error?.code && body?.error?.message) {
      return new ApiError(response.status, body.error.code, body.error.message);
    }
  } catch {
    // Fall through when the body is not the expected error envelope.
  }

  return new ApiError(
    response.status,
    "UNKNOWN_ERROR",
    `Request failed with status ${response.status}.`,
  );
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const useAuth = options.auth !== false;
  if (useAuth) {
    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", `Unable to reach the server at ${getApiBaseUrl()}.`);
  }

  if (!response.ok) {
    if (response.status === 401 && useAuth) {
      notifyUnauthorized();
    }
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/health", { auth: false });
}

export function register(input: RegisterRequest): Promise<User> {
  return request<User>("/auth/register", {
    method: "POST",
    body: input,
    auth: false,
  });
}

export function login(input: LoginRequest): Promise<TokenResponse> {
  return request<TokenResponse>("/auth/login", {
    method: "POST",
    body: input,
    auth: false,
  });
}

export function listDependents(): Promise<Dependent[]> {
  return request<Dependent[]>("/dependents");
}

export function getDependent(id: number): Promise<Dependent> {
  return request<Dependent>(`/dependents/${id}`);
}

export function createDependent(input: DependentInput): Promise<Dependent> {
  return request<Dependent>("/dependents", { method: "POST", body: input });
}

export function updateDependent(id: number, input: DependentInput): Promise<Dependent> {
  return request<Dependent>(`/dependents/${id}`, { method: "PATCH", body: input });
}

export function listMeals(dependentId: number): Promise<MealLog[]> {
  return request<MealLog[]>(`/dependents/${dependentId}/meals`);
}

export function listAlerts(dependentId: number): Promise<Alert[]> {
  return request<Alert[]>(`/dependents/${dependentId}/alerts`);
}

export function acknowledgeAlert(id: number): Promise<Alert> {
  return request<Alert>(`/alerts/${id}`, {
    method: "PATCH",
    body: { status: "acknowledged" },
  });
}

export function getWeeklySummary(dependentId: number): Promise<WeeklySummary> {
  return request<WeeklySummary>(`/dependents/${dependentId}/summary/weekly`);
}

export function getDailyIntake(dependentId: number): Promise<DailyIntake> {
  return request<DailyIntake>(`/dependents/${dependentId}/daily-intake`);
}

export function markMealEaten(mealId: number, gramsEaten: number): Promise<void> {
  return request(`/meals/${mealId}`, {
    method: "PATCH",
    body: { grams_eaten: gramsEaten },
  });
}

export function scanDependent(
  dependentId: number,
  lookup: { barcode: string } | { dish_name: string },
): Promise<ScanResult> {
  return request<ScanResult>(`/dependents/${dependentId}/scan`, {
    method: "POST",
    body: lookup,
  });
}
