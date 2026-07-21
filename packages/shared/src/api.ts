// Platform-neutral API helpers. No localStorage, no import.meta — each
// platform (web, native) supplies its own baseUrl and its own token storage.
export function createApi(baseUrl: string) {
  const api = (path: string) => `${baseUrl}${path}`;

  function authHeaders(token: string | null, json = false): Record<string, string> {
    const h: Record<string, string> = {};
    if (json) h["Content-Type"] = "application/json";
    if (token) h["X-Auth-Token"] = token;
    return h;
  }

  return { api, authHeaders };
}
