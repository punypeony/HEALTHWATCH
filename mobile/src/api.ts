import { getApiBaseUrl } from "./utils/apiBaseUrl";
import type { ApiErrorBody, HealthResponse } from "./types";

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

async function parseError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    if (body?.error?.code && body?.error?.message) {
      return new ApiError(response.status, body.error.code, body.error.message);
    }
  } catch {
    // Fall through to a generic error when the body is not JSON.
  }

  return new ApiError(
    response.status,
    "UNKNOWN_ERROR",
    `Request failed with status ${response.status}.`,
  );
}

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${getApiBaseUrl()}/health`);
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as HealthResponse;
}
