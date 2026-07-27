import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { useAuth } from "../context/AuthContext";

// Reacts to auth state changing while already on a screen (login success,
// email-verify success, password-reset success, logout) — index.tsx alone
// only redirects on cold navigation TO it, not on state changes elsewhere.
export function RootNavigator() {
  const { currentUser, booting } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Let index.tsx's own onboarding-vs-welcome check fully own the very
    // first navigation decision — this effect only reacts to auth state
    // changing AFTER we've already landed somewhere real (a login success
    // while on an (auth) screen, or a logout while on a dashboard screen).
    if (booting || !segments[0]) return;
    const inAuthGroup = segments[0] === "(auth)";

    if (currentUser && inAuthGroup) {
      router.replace(currentUser.role === "teacher" ? "/(teacher)/lobby" : "/(student)/dashboard");
    } else if (!currentUser && !inAuthGroup) {
      router.replace("/(auth)/welcome");
    }
  }, [currentUser, booting, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(student)" />
      <Stack.Screen name="(teacher)" />
    </Stack>
  );
}
