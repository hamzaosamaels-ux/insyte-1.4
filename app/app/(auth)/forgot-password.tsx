import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { useLanguage } from "../../src/context/LanguageContext";

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim() || sending) return;
    setSending(true);
    setMessage(null);
    try {
      const msg = await forgotPassword(email.trim());
      setMessage(msg);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not send reset link.");
    } finally {
      setSending(false);
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-slate-950 p-6">
      <View className="w-full max-w-sm">
        <Text className="text-base font-bold text-slate-100 font-display text-center mb-1.5">
          {t.forgotPasswordTitle}
        </Text>
        <Text className="text-xs text-slate-300 text-center leading-relaxed mb-6">
          {t.forgotPasswordDesc}
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder={t.emailPlaceholder}
          placeholderTextColor="#64748b"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white mb-3"
        />
        {message && <Text className="text-xs text-indigo-300 text-center mb-3">{message}</Text>}
        <Pressable
          onPress={handleSubmit}
          disabled={sending}
          className="py-3 rounded-xl items-center bg-indigo-600 active:bg-indigo-500 disabled:opacity-60"
        >
          {sending ? <ActivityIndicator color="#fff" /> : (
            <Text className="text-white text-sm font-bold">{t.forgotPasswordSendButton}</Text>
          )}
        </Pressable>
        <Pressable onPress={() => router.back()} className="mt-4 items-center">
          <Text className="text-xs text-slate-400 font-medium">{t.verifyGoToLogin}</Text>
        </Pressable>
      </View>
    </View>
  );
}
