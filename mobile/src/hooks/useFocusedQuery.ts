import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";

import { errorMessage } from "../utils/errors";

export type LoadState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: T };

export function useFocusedQuery<T>(load: () => Promise<T>): LoadState<T> & { retry: () => void } {
  const [state, setState] = useState<LoadState<T>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setState({ status: "loading" });

      load()
        .then((data) => {
          if (!cancelled) {
            setState({ status: "success", data });
          }
        })
        .catch((error: unknown) => {
          if (!cancelled) {
            setState({ status: "error", message: errorMessage(error) });
          }
        });

      return () => {
        cancelled = true;
      };
    }, [attempt, load]),
  );

  return { ...state, retry };
}
