import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth, VerifyLinkError } from "../../src/context/AuthContext";
import { useLanguage } from "../../src/context/LanguageContext";

type State = "checking" | "success" | "expired" | "invalid" | "error";

export default function Verify() {
  // Deep link: insyte://verify?token=xxx (from the emailed link)
  const { token } = useLocalSearchParams<{ token?: string }>();
  const { verifyEmail } = useAuth();
  const { t } = useLanguage();
  const [state, setState] = useState<State>("checking");

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    verifyEmail(token)
      .then(() => setState("success")) // AuthContext's redirect takes over from here
      .catch((err) => {
        if (err instanceof VerifyLinkError) setState(err.expired ? "expired" : "invalid");
        else setState("error");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (state === "checking" || state === "success") {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <ActivityIndicator color="#818cf8" />
        <Text className="text-slate-300 text-xs mt-3">{t.verifyChecking}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-slate-950 p-6">
      <View className="max-w-sm items-center">
        <Text className="text-sm font-bold text-slate-100 text-center mb-1.5">
          {state === "expired" ? t.verifyExpiredTitle : t.verifyInvalidTitle}
        </Text>
        <Text className="text-xs text-slate-300 text-center leading-relaxed mb-5">
          {state === "expired" ? t.verifyExpiredDesc : t.verifyInvalidDesc}
        </Text>
        <Pressable
          onPress={() => router.replace("/(auth)/welcome")}
          className="px-4 py-2.5 bg-indigo-600 active:bg-indigo-500 rounded-xl"
        >
          <Text className="text-white text-xs font-bold">{t.verifyGoToLogin}</Text>
        </Pressable>
      </View>
    </View>
  );
}
