// Mirrors the web app's src/api.ts, adapted for AsyncStorage instead of
// localStorage. Every authenticated screen should import from here, not
// call fetch()/createApi() directly.
import { createApi } from "@insyte/shared/api";
import { API_BASE } from "./config";
import { nativeStorage } from "./storage";

const { api, authHeaders: sharedAuthHeaders } = createApi(API_BASE);
export { api };

export async function authHeaders(json = false): Promise<Record<string, string>> {
  const token = await nativeStorage.getToken();
  return sharedAuthHeaders(token, json);
}
