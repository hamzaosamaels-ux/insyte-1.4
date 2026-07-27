import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { useLanguage } from "../../src/context/LanguageContext";

export default function ResetPassword() {
  // Deep link: insyte://reset-password?token=xxx (from the emailed link)
  const { token } = useLocalSearchParams<{ token?: string }>();
  const { resetPassword } = useAuth();
  const { t } = useLanguage();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!token) {
      setError("Missing reset token — open the link from your email again.");
      return;
    }
    if (password.length < 6) {
      setError(t.passwordTooShort);
      return;
    }
    if (password !== confirm) {
      setError(t.resetPasswordMismatch);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      // AuthContext's currentUser is now set — root layout's redirect takes over.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-slate-950 p-6">
      <View className="w-full max-w-sm">
        <Text className="text-base font-bold text-slate-100 font-display text-center mb-1.5">
          {t.resetPasswordTitle}
        </Text>
        <Text className="text-xs text-slate-300 text-center leading-relaxed mb-6">
          {t.resetPasswordDesc}
        </Text>

        <Text className="text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">{t.resetNewPassword}</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder={t.passwordCreatePlaceholder}
          placeholderTextColor="#64748b"
          secureTextEntry
          autoComplete="new-password"
          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white mb-3"
        />
        <Text className="text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">{t.resetConfirmPassword}</Text>
        <TextInput
          value={confirm}
          onChangeText={setConfirm}
          placeholder={t.passwordCreatePlaceholder}
          placeholderTextColor="#64748b"
          secureTextEntry
          autoComplete="new-password"
          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white mb-3"
        />

        {error && <Text className="text-xs text-red-400 mb-3">{error}</Text>}

        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          className="py-3.5 rounded-xl items-center bg-indigo-600 active:bg-indigo-500 disabled:opacity-60"
        >
          {submitting ? <ActivityIndicator color="#fff" /> : (
            <Text className="text-white text-sm font-bold">{t.resetSubmitButton}</Text>
          )}
        </Pressable>
        <Pressable onPress={() => router.replace("/(auth)/welcome")} className="mt-4 items-center">
          <Text className="text-xs text-slate-400 font-medium">{t.verifyGoToLogin}</Text>
        </Pressable>
      </View>
    </View>
  );
}
