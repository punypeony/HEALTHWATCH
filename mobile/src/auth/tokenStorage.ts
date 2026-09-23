import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEY = "food_monitor_access_token";

type WebStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

function webStorage(): WebStorage | null {
  if (Platform.OS !== "web") {
    return null;
  }
  const storage = (globalThis as { localStorage?: WebStorage }).localStorage;
  return storage ?? null;
}

export async function readStoredToken(): Promise<string | null> {
  const web = webStorage();
  if (web) {
    return web.getItem(TOKEN_KEY);
  }
  if (!(await SecureStore.isAvailableAsync())) {
    return null;
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function writeStoredToken(token: string): Promise<void> {
  const web = webStorage();
  if (web) {
    web.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  const web = webStorage();
  if (web) {
    web.removeItem(TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
