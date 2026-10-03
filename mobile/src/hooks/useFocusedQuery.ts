import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";

import { errorMessage } from "../utils/errors";
import { readQuery, refreshQuery, subscribeQuery } from "../utils/queryCache";

export type LoadState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: T };

export function useFocusedQuery<T>(key: string, load: () => Promise<T>): LoadState<T> & {
  retry: () => void; refreshing: boolean; refreshError?: string;
} {
  const [, rerender] = useState(0);
  const retry = useCallback(() => { void refreshQuery(key, load); }, [key, load]);
  useFocusEffect(useCallback(() => {
    const unsubscribe = subscribeQuery(key, event => {
      rerender(value => value + 1);
      if (event === "invalidate") retry();
    });
    retry();
    return unsubscribe;
  }, [key, retry]));
  const snapshot = readQuery<T>(key);
  const message = snapshot.error ? errorMessage(snapshot.error) : undefined;
  const state: LoadState<T> = snapshot.hasData
    ? { status: "success", data: snapshot.data as T }
    : message ? { status: "error", message } : { status: "loading" };
  return { ...state, retry, refreshing: snapshot.refreshing, refreshError: snapshot.hasData ? message : undefined };
}
