import AsyncStorage from "@react-native-async-storage/async-storage";
import type { TokenStorage } from "@insyte/shared/storage";

const TOKEN_KEY = "insyte_token";

export const nativeStorage: TokenStorage = {
  getToken: () => AsyncStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => AsyncStorage.setItem(TOKEN_KEY, token),
  clearToken: () => AsyncStorage.removeItem(TOKEN_KEY)
};
