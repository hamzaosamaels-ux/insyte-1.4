// Central API base — production frontend lives on Vercel, backend on Railway.
// Every fetch must go through api() or writes silently hit the wrong host.
export const API_BASE = import.meta.env.PROD
  ? "https://insyte-14-production.up.railway.app"
  : "";

export const api = (path: string) => `${API_BASE}${path}`;

const TOKEN_KEY = "insyte_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// Headers for an authenticated request. Spread into a fetch's headers.
export function authHeaders(json = false): Record<string, string> {
  const h: Record<string, string> = {};
  if (json) h["Content-Type"] = "application/json";
  const t = getToken();
  if (t) h["X-Auth-Token"] = t;
  return h;
}
