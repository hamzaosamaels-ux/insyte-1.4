// Central API base — production frontend lives on Vercel, backend on Railway.
// Every fetch must go through api() or writes silently hit the wrong host.
import { createApi } from "@insyte/shared/api";

export const API_BASE = import.meta.env.PROD
  ? "https://insyte-14-production.up.railway.app"
  : "";

const { api, authHeaders: sharedAuthHeaders } = createApi(API_BASE);
export { api };

const TOKEN_KEY = "insyte_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// Headers for an authenticated request. Spread into a fetch's headers.
export function authHeaders(json = false): Record<string, string> {
  return sharedAuthHeaders(getToken(), json);
}
