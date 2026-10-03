import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { getCurrentUser, login as loginRequest } from "../api";
import { setAccessToken, setUnauthorizedHandler } from "./accessToken";
import { clearStoredToken, readStoredToken, writeStoredToken } from "./tokenStorage";

type SessionStatus = "loading" | "anonymous" | "authenticated";

type SessionValue = {
  status: SessionStatus;
  caregiverName: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [caregiverName, setCaregiverName] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      setCaregiverName(user.name);
    } catch {
      setCaregiverName(null);
    }
  }, []);

  const logout = useCallback(async () => {
    setAccessToken(null);
    setCaregiverName(null);
    setStatus("anonymous");
    try {
      await clearStoredToken();
    } catch {
      // The in-memory session is already cleared.
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void logout();
    });
    return () => {
      setUnauthorizedHandler(null);
    };
  }, [logout]);

  useEffect(() => {
    let cancelled = false;

    readStoredToken()
      .then((token) => {
        if (cancelled) {
          return;
        }
        if (token) {
          setAccessToken(token);
          setStatus("authenticated");
          void loadProfile();
          return;
        }
        setAccessToken(null);
        setStatus("anonymous");
      })
      .catch(() => {
        if (!cancelled) {
          setAccessToken(null);
          setStatus("anonymous");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loadProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginRequest({ email, password });
    await writeStoredToken(result.access_token);
    setAccessToken(result.access_token);
    setStatus("authenticated");
    await loadProfile();
  }, [loadProfile]);

  const value = useMemo(
    () => ({ status, caregiverName, login, logout }),
    [status, caregiverName, login, logout],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error("useSession must be used within SessionProvider.");
  }
  return value;
}
