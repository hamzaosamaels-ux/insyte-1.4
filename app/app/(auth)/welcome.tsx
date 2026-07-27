import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Animated, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GraduationCap, BookOpen, Award, MailCheck, KeyRound, LogIn, Sparkles, AlertCircle } from "lucide-react-native";
import { router } from "expo-router";
import { useAuth, VerificationRequiredError } from "../../src/context/AuthContext";
import { useLanguage } from "../../src/context/LanguageContext";

type Mode = "login" | "signup";

// Mirrors the web WelcomeScreen's staggered entry (logo scales in, then the
// title and tagline slide up) using RN's Animated instead of Framer Motion.
function useEntryAnimation() {
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(20)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    Animated.parallel([
      Animated.timing(logoScale, { toValue: 1, duration: 500, easing: ease, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 500, easing: ease, useNativeDriver: true }),
      Animated.timing(titleY, { toValue: 0, duration: 500, delay: 100, easing: ease, useNativeDriver: true }),
      Animated.timing(titleOpacity, { toValue: 1, duration: 500, delay: 100, easing: ease, useNativeDriver: true }),
      Animated.timing(taglineY, { toValue: 0, duration: 500, delay: 200, easing: ease, useNativeDriver: true }),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 500, delay: 200, easing: ease, useNativeDriver: true })
    ]).start();
  }, []);

  return { logoScale, logoOpacity, titleY, titleOpacity, taglineY, taglineOpacity };
}

export default function Welcome() {
  const { login, signup, resendVerification, forgotPassword } = useAuth();
  const { t } = useLanguage();
  const anim = useEntryAnimation();

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  // Web keeps forgot-password inline in this same card rather than a separate
  // route, so the native version does too — one less navigation jump.
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSending, setForgotSending] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

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
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
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
      setResendMessage(await resendVerification(pendingEmail));
    } catch (err) {
      setResendMessage(err instanceof Error ? err.message : "Could not resend.");
    } finally {
      setResending(false);
    }
  };

  const handleForgotSubmit = async () => {
    if (!forgotEmail.trim() || forgotSending) return;
    setForgotSending(true);
    setForgotMessage(null);
    try {
      setForgotMessage(await forgotPassword(forgotEmail.trim()));
    } catch (err) {
      setForgotMessage(err instanceof Error ? err.message : "Could not send reset link.");
    } finally {
      setForgotSending(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white";
  const labelClass = "text-xs font-medium text-slate-300 uppercase tracking-wider mb-1";

  return (
    <View className="flex-1 bg-slate-950">
      {/* Ambient glows, matching web's decorative background */}
      <View pointerEvents="none" className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10" />
      <View pointerEvents="none" className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-violet-600/10" />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* The card web wraps everything in */}
        <View className="w-full max-w-md self-center bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
          {/* Branding */}
          <View className="items-center mb-8">
            <Animated.View style={{ opacity: anim.logoOpacity, transform: [{ scale: anim.logoScale }] }}>
              <LinearGradient
                colors={["#6366f1", "#7c3aed"]}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
                style={{ padding: 16, borderRadius: 16, marginBottom: 16 }}
              >
                <GraduationCap size={40} color="#ffffff" />
              </LinearGradient>
            </Animated.View>
            {/* Animation lives on a wrapping Animated.View, not on
                Animated.Text — NativeWind's className is dropped entirely on
                animated text components, which silently reverts them to the
                14px system font. */}
            <Animated.View style={{ opacity: anim.titleOpacity, transform: [{ translateY: anim.titleY }] }}>
              <Text className="text-4xl font-extrabold tracking-tight font-display text-indigo-300">
                insyte
              </Text>
            </Animated.View>
            <Animated.View style={{ opacity: anim.taglineOpacity, transform: [{ translateY: anim.taglineY }] }}>
              <Text className="text-slate-200 mt-2 text-[15px] font-medium leading-snug text-center">
                {t.welcomeTagline}
              </Text>
            </Animated.View>
          </View>

          {pendingEmail ? (
            <View className="items-center">
              <View className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl mb-4">
                <MailCheck size={28} color="#818cf8" />
              </View>
              <Text className="text-sm font-bold text-slate-100 mb-1.5">{t.verifyCheckInboxTitle}</Text>
              <Text className="text-xs text-slate-300 leading-relaxed text-center mb-1">
                {t.verifyCheckInboxDesc.replace("{email}", pendingEmail)}
              </Text>
              {error && <Text className="text-xs text-amber-400 mt-2 text-center">{error}</Text>}
              {resendMessage && <Text className="text-xs text-indigo-300 mt-3 text-center">{resendMessage}</Text>}
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
                <Pressable onPress={() => { setPendingEmail(null); setError(null); }}>
                  <Text className="text-xs text-slate-400 font-medium">{t.verifyUseDifferentEmail}</Text>
                </Pressable>
              </View>
            </View>
          ) : forgotMode ? (
            <View>
              <View className="items-center mb-5">
                <View className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl mb-4">
                  <KeyRound size={28} color="#818cf8" />
                </View>
                <Text className="text-sm font-bold text-slate-100 mb-1.5">{t.forgotPasswordTitle}</Text>
                <Text className="text-xs text-slate-300 leading-relaxed text-center">{t.forgotPasswordDesc}</Text>
              </View>
              <TextInput
                value={forgotEmail}
                onChangeText={setForgotEmail}
                placeholder={t.emailPlaceholder}
                placeholderTextColor="#64748b"
                autoCapitalize="none"
                keyboardType="email-address"
                className={inputClass}
              />
              {forgotMessage && <Text className="text-xs text-indigo-300 mt-3">{forgotMessage}</Text>}
              <Pressable onPress={handleForgotSubmit} disabled={forgotSending} className="mt-3 active:opacity-90 disabled:opacity-60">
                <LinearGradient
                  colors={["#4f46e5", "#7c3aed"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 13, borderRadius: 12, alignItems: "center" }}
                >
                  <Text className="text-white text-sm font-bold">
                    {forgotSending ? t.verifyResending : t.forgotPasswordSendButton}
                  </Text>
                </LinearGradient>
              </Pressable>
              <Pressable
                onPress={() => { setForgotMode(false); setForgotMessage(null); setForgotEmail(""); }}
                className="mt-4 items-center"
              >
                <Text className="text-xs text-slate-400 font-medium">{t.verifyGoToLogin}</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* Mode switch */}
              <View className="flex-row items-center gap-1.5 bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50 mb-6">
                <Pressable
                  onPress={() => setMode("login")}
                  className={`flex-1 flex-row items-center justify-center gap-2 px-4 py-2.5 rounded-lg ${mode === "login" ? "bg-indigo-600" : ""}`}
                >
                  <LogIn size={14} color={mode === "login" ? "#ffffff" : "#cbd5e1"} />
                  <Text className={`text-xs font-bold ${mode === "login" ? "text-white" : "text-slate-300"}`}>{t.logIn}</Text>
                </Pressable>
                <Pressable
                  onPress={() => setMode("signup")}
                  className={`flex-1 flex-row items-center justify-center gap-2 px-4 py-2.5 rounded-lg ${mode === "signup" ? "bg-violet-600" : ""}`}
                >
                  <Sparkles size={14} color={mode === "signup" ? "#ffffff" : "#cbd5e1"} />
                  <Text className={`text-xs font-bold ${mode === "signup" ? "text-white" : "text-slate-300"}`}>{t.signUp}</Text>
                </Pressable>
              </View>

              {mode === "signup" && (
                <>
                  {/* Role cards — left-aligned with descriptions, like web */}
                  <View className="flex-row gap-3 mb-3">
                    <Pressable
                      onPress={() => setRole("student")}
                      className={`flex-1 p-4 rounded-2xl border ${role === "student" ? "bg-indigo-950/40 border-indigo-500/60" : "bg-slate-800/50 border-slate-700/50"}`}
                    >
                      <BookOpen size={20} color={role === "student" ? "#818cf8" : "#94a3b8"} />
                      <Text className={`font-bold text-sm mt-2 ${role === "student" ? "text-indigo-200" : "text-slate-300"}`}>
                        {t.studentRole}
                      </Text>
                      <Text className="text-slate-400 text-[11px] mt-0.5">{t.studentEntryDesc}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setRole("teacher")}
                      className={`flex-1 p-4 rounded-2xl border ${role === "teacher" ? "bg-violet-950/40 border-violet-500/60" : "bg-slate-800/50 border-slate-700/50"}`}
                    >
                      <Award size={20} color={role === "teacher" ? "#a78bfa" : "#94a3b8"} />
                      <Text className={`font-bold text-sm mt-2 ${role === "teacher" ? "text-violet-200" : "text-slate-300"}`}>
                        {t.teacherRole}
                      </Text>
                      <Text className="text-slate-400 text-[11px] mt-0.5">{t.teacherPortalDesc}</Text>
                    </Pressable>
                  </View>

                  <View className="mb-3">
                    <Text className={labelClass}>{t.name}</Text>
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder={t.namePlaceholder}
                      placeholderTextColor="#64748b"
                      autoCapitalize="words"
                      className={inputClass}
                    />
                  </View>
                </>
              )}

              <View className="mb-3">
                <Text className={labelClass}>{t.email}</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t.emailPlaceholder}
                  placeholderTextColor="#64748b"
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  className={inputClass}
                />
              </View>

              <View className="mb-1">
                <Text className={labelClass}>{t.password}</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder={mode === "signup" ? t.passwordCreatePlaceholder : t.passwordPlaceholder}
                  placeholderTextColor="#64748b"
                  secureTextEntry
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  className={inputClass}
                />
                {mode === "login" && (
                  <Pressable onPress={() => { setForgotMode(true); setForgotEmail(email); }} className="mt-1.5">
                    <Text className="text-[11px] text-indigo-400 font-medium">{t.forgotPasswordLink}</Text>
                  </Pressable>
                )}
              </View>

              {error && (
                <View className="flex-row items-center gap-2 px-4 py-3 mt-3 bg-red-950/40 border border-red-500/30 rounded-xl">
                  <AlertCircle size={16} color="#fca5a5" />
                  <Text className="text-red-300 text-xs flex-1">{error}</Text>
                </View>
              )}

              <Pressable onPress={handleSubmit} disabled={submitting} className="mt-3 active:opacity-90 disabled:opacity-60">
                <LinearGradient
                  colors={["#4f46e5", "#7c3aed"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 15, borderRadius: 12, alignItems: "center" }}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white text-sm font-bold">
                      {mode === "signup" ? `${t.createAccount} →` : `${t.logIn} →`}
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>

              <View className="flex-row justify-center items-center gap-1 mt-4">
                <Text className="text-slate-400 text-[11px]">
                  {mode === "login" ? t.noAccountYet : t.alreadyHaveAccount}
                </Text>
                <Pressable onPress={() => setMode(mode === "login" ? "signup" : "login")}>
                  <Text className="text-indigo-400 text-[11px] font-medium">
                    {mode === "login" ? t.signUp : t.logIn}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
