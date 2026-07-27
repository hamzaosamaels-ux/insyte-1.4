import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GraduationCap, BookOpen, Award, MailCheck } from "lucide-react-native";
import { router } from "expo-router";
import { useAuth, VerificationRequiredError } from "../../src/context/AuthContext";
import { useLanguage } from "../../src/context/LanguageContext";

type Mode = "login" | "signup";

export default function Welcome() {
  const { login, signup, resendVerification } = useAuth();
  const { t } = useLanguage();

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set right after signup, or after a login attempt hits the verification
  // gate — same as web's WelcomeScreen, one state covers both entry points.
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim() || !password) return;
    if (mode === "signup" && !name.trim()) return;
    if (mode === "signup" && password.length < 6) {
      setError(t.passwordTooShort);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const result = await signup(name.trim(), email.trim(), role, password);
        setPendingEmail(result.email);
        if (result.emailWarning) setError(result.emailWarning);
      } else {
        await login(email.trim(), password);
        // AuthContext's currentUser is now set — root layout's redirect takes over.
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
      if (err instanceof VerificationRequiredError) setPendingEmail(err.email || email.trim());
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!pendingEmail || resending) return;
    setResending(true);
    setResendMessage(null);
    try {
      const message = await resendVerification(pendingEmail);
      setResendMessage(message);
    } catch (err) {
      setResendMessage(err instanceof Error ? err.message : "Could not resend.");
    } finally {
      setResending(false);
    }
  };

  if (pendingEmail) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950 p-6">
        <View className="w-full max-w-sm items-center">
          <View className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl mb-4">
            <MailCheck size={28} color="#818cf8" />
          </View>
          <Text className="text-base font-bold text-slate-100 font-display text-center mb-1.5">
            {t.verifyCheckInboxTitle}
          </Text>
          <Text className="text-xs text-slate-300 text-center leading-relaxed mb-1">
            {t.verifyCheckInboxDesc.replace("{email}", pendingEmail)}
          </Text>
          {error && <Text className="text-xs text-amber-400 text-center mt-2">{error}</Text>}
          {resendMessage && <Text className="text-xs text-indigo-300 text-center mt-3">{resendMessage}</Text>}
          <View className="flex-row items-center justify-center gap-3 mt-5">
            <Pressable
              onPress={handleResend}
              disabled={resending}
              className="px-4 py-2.5 bg-indigo-600 active:bg-indigo-500 rounded-xl disabled:opacity-60"
            >
              <Text className="text-white text-xs font-bold">
                {resending ? t.verifyResending : t.verifyResendButton}
              </Text>
            </Pressable>
            <Pressable onPress={() => setPendingEmail(null)}>
              <Text className="text-xs text-slate-400 font-medium">{t.verifyUseDifferentEmail}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-950"
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Ambient glows, mirroring web's radial background treatment */}
      <View pointerEvents="none" className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-indigo-500/20" />
      <View pointerEvents="none" className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-violet-600/20" />

      <View className="w-full max-w-sm self-center">
        <View className="items-center mb-6">
          <LinearGradient
            colors={["#6366f1", "#7c3aed"]}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={{ padding: 16, borderRadius: 20, marginBottom: 16 }}
          >
            <GraduationCap size={40} color="#ffffff" />
          </LinearGradient>
          <Text className="text-4xl font-extrabold text-white font-display text-center tracking-tight">insyte</Text>
        </View>
        <Text className="text-slate-200 text-sm text-center leading-relaxed mb-8">{t.welcomeTagline}</Text>

        <View className="flex-row items-center gap-1.5 bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50 mb-6">
          <Pressable
            onPress={() => setMode("login")}
            className={`flex-1 py-2.5 rounded-lg items-center ${mode === "login" ? "bg-indigo-600" : ""}`}
          >
            <Text className={`text-xs font-bold ${mode === "login" ? "text-white" : "text-slate-300"}`}>{t.logIn}</Text>
          </Pressable>
          <Pressable
            onPress={() => setMode("signup")}
            className={`flex-1 py-2.5 rounded-lg items-center ${mode === "signup" ? "bg-violet-600" : ""}`}
          >
            <Text className={`text-xs font-bold ${mode === "signup" ? "text-white" : "text-slate-300"}`}>{t.signUp}</Text>
          </Pressable>
        </View>

        {mode === "signup" && (
          <View className="flex-row gap-2.5 mb-3.5">
            <Pressable
              onPress={() => setRole("student")}
              className={`flex-1 p-3 rounded-xl border items-center ${role === "student" ? "border-indigo-500 bg-indigo-950/40" : "border-slate-700 bg-slate-800/30"}`}
            >
              <BookOpen size={20} color={role === "student" ? "#818cf8" : "#94a3b8"} />
              <Text className={`text-xs font-bold mt-1.5 ${role === "student" ? "text-indigo-200" : "text-slate-300"}`}>{t.studentRole}</Text>
            </Pressable>
            <Pressable
              onPress={() => setRole("teacher")}
              className={`flex-1 p-3 rounded-xl border items-center ${role === "teacher" ? "border-violet-500 bg-violet-950/40" : "border-slate-700 bg-slate-800/30"}`}
            >
              <Award size={20} color={role === "teacher" ? "#a78bfa" : "#94a3b8"} />
              <Text className={`text-xs font-bold mt-1.5 ${role === "teacher" ? "text-violet-200" : "text-slate-300"}`}>{t.teacherRole}</Text>
            </Pressable>
          </View>
        )}

        {mode === "signup" && (
          <View className="mb-3.5">
            <Text className="text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">{t.name}</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t.namePlaceholder}
              placeholderTextColor="#64748b"
              autoCapitalize="words"
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white"
            />
          </View>
        )}

        <View className="mb-3.5">
          <Text className="text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">{t.email}</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={t.emailPlaceholder}
            placeholderTextColor="#64748b"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white"
          />
        </View>

        <View className="mb-1.5">
          <Text className="text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">{t.password}</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={mode === "signup" ? t.passwordCreatePlaceholder : t.passwordPlaceholder}
            placeholderTextColor="#64748b"
            secureTextEntry
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white"
          />
          {mode === "login" && (
            <Pressable onPress={() => router.push("/(auth)/forgot-password")} className="mt-1.5">
              <Text className="text-[11px] text-indigo-400 font-medium">{t.forgotPasswordLink}</Text>
            </Pressable>
          )}
        </View>

        {error && <Text className="text-xs text-red-400 mt-3">{error}</Text>}

        {/* One consistent high-contrast gradient CTA for both modes, matching
            the web app's own login/signup button treatment. */}
        <Pressable onPress={handleSubmit} disabled={submitting} className="mt-5 active:opacity-90 disabled:opacity-60">
          <LinearGradient
            colors={["#4f46e5", "#7c3aed"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ paddingVertical: 15, borderRadius: 14, alignItems: "center" }}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-sm font-bold">
                {mode === "signup" ? t.createAccount : t.logIn}
              </Text>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </ScrollView>
  );
}
