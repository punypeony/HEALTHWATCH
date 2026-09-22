import { useCallback, useEffect, useState } from "react";

import { ApiError, getHealth } from "../api";
import type { HealthResponse } from "../types";

type HealthState =
  | { status: "loading" }
  | { status: "success"; data: HealthResponse }
  | { status: "error"; message: string };

export function useHealthCheck(): HealthState & { retry: () => void } {
  const [state, setState] = useState<HealthState>({ status: "loading" });
  const [requestId, setRequestId] = useState(0);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    setRequestId((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    getHealth()
      .then((data) => {
        if (!cancelled) {
          setState({ status: "success", data });
        }
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        const message =
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : "Unable to reach the backend.";
        setState({ status: "error", message });
      });

    return () => {
      cancelled = true;
    };
  }, [requestId]);

  return { ...state, retry };
}
