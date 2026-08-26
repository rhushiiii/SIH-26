import { DEFAULT_API_BASE_URL } from "@/lib/constants";

const MOCK_KEY = "drishti.useMockApi";
const BASE_KEY = "drishti.apiBaseUrl";

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(BASE_KEY);
    if (stored) return stored.replace(/\/$/, "");
  }
  const fromEnv = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return (fromEnv || DEFAULT_API_BASE_URL).replace(/\/$/, "");
}

export function getUseMockApi(): boolean {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(MOCK_KEY);
    if (stored === "true") return true;
    if (stored === "false") return false;
  }
  const fromEnv = import.meta.env.VITE_USE_MOCK_API as string | undefined;
  return fromEnv !== "false";
}

export function setUseMockApi(value: boolean) {
  window.localStorage.setItem(MOCK_KEY, String(value));
}

export function setApiBaseUrl(value: string) {
  window.localStorage.setItem(BASE_KEY, value.replace(/\/$/, ""));
}
