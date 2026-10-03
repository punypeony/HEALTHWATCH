import { getAccessToken, notifyUnauthorized } from "./auth/accessToken";
import { invalidateQueries } from "./utils/queryCache";
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
  timeoutMs?: number;
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
  const requestToken = getAccessToken();
  if (useAuth) {
    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? ((options.method ?? "GET") === "GET" ? 15_000 : undefined);
  const timeout = timeoutMs == null
    ? undefined
    : setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      if (response.status === 401 && useAuth && requestToken === getAccessToken()) {
        notifyUnauthorized();
      }
      throw await parseError(response);
    }

    if (useAuth && options.method && options.method !== "GET" && requestToken === getAccessToken()) {
      invalidateQueries();
    }
    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new ApiError(0, "NETWORK_TIMEOUT", `The server at ${getApiBaseUrl()} did not respond in time. Check that the backend is running and your phone is on the same Wi-Fi, then try again.`);
    }
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, "NETWORK_ERROR", `Unable to reach the server at ${getApiBaseUrl()}.`);
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
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

export function getCurrentUser(): Promise<User> {
  return request<User>("/auth/me");
}

export function login(input: LoginRequest): Promise<TokenResponse> {
  return request<TokenResponse>("/auth/login", {
    method: "POST",
    body: input,
    auth: false,
    timeoutMs: 10_000,
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

export function deleteDependent(id: number): Promise<void> {
  return request<void>(`/dependents/${id}`, { method: "DELETE" });
}

export function listMeals(dependentId: number): Promise<MealLog[]> {
  return request<MealLog[]>(`/dependents/${dependentId}/meals`);
}

export function deleteMeal(mealId: number): Promise<void> {
  return request<void>(`/meals/${mealId}`, { method: "DELETE" });
}

export function deleteMeals(dependentId: number): Promise<void> {
  return request<void>(`/dependents/${dependentId}/meals`, { method: "DELETE" });
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
