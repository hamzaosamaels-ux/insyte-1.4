// Central API base — production frontend lives on Vercel, backend on Railway.
// Every fetch must go through api() or writes silently hit the wrong host.
export const API_BASE = import.meta.env.PROD
  ? "https://insyte-14-production.up.railway.app"
  : "";

export const api = (path: string) => `${API_BASE}${path}`;
