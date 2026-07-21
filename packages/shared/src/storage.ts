// Token storage contract. Web wraps localStorage (sync but exposed as
// Promises here); native wraps AsyncStorage (genuinely async). Neither
// implementation lives in this package — each platform supplies its own,
// since the native one depends on @react-native-async-storage/async-storage,
// a dependency that must never leak into platform-neutral shared code.
export interface TokenStorage {
  getToken(): Promise<string | null>;
  setToken(token: string): Promise<void>;
  clearToken(): Promise<void>;
}
