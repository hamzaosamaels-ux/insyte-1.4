// React Native's own dev/prod flag — no import.meta (that's Vite-only).
// Proof slice points at the real deployed backend either way: hitting a
// local dev server from a physical device/Expo Go needs LAN-IP addressing,
// which adds networking noise that doesn't help prove the shared-code path.
export const API_BASE = "https://insyte-14-production-a1bc1d5a.up.railway.app";
