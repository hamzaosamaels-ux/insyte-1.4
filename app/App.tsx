import "./global.css";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { login } from "@insyte/shared/auth";
import type { UserProfile } from "@insyte/shared/types";
import { API_BASE } from "./src/config";
import { nativeStorage } from "./src/storage";

// Proof-of-concept slice: does the shared package (types + api + auth +
// storage contract) work end-to-end against the real, deployed backend?
// One screen, no navigation library, no other dashboards ported yet.
export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await login(API_BASE, email.trim(), password);
      await nativeStorage.setToken(data.token);
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Log in failed.");
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950 px-8">
        <StatusBar style="light" />
        <Text className="text-2xl font-display text-white mb-2">Logged in as</Text>
        <Text className="text-3xl font-bold text-indigo-400">{user.name}</Text>
        <Pressable
          onPress={async () => {
            await nativeStorage.clearToken();
            setUser(null);
          }}
          className="mt-8 px-6 py-3 rounded-2xl bg-slate-800"
        >
          <Text className="text-slate-200 font-bold">Log out</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-slate-950"
    >
      <StatusBar style="light" />
      <View className="flex-1 justify-center px-8">
        <Text className="text-4xl font-display font-extrabold text-center mb-1 text-indigo-400">
          insyte
        </Text>
        <Text className="text-slate-400 text-center mb-8">Log in to continue</Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email address"
          placeholderTextColor="#64748b"
          autoCapitalize="none"
          keyboardType="email-address"
          className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3.5 text-white mb-3"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor="#64748b"
          secureTextEntry
          className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3.5 text-white mb-4"
        />

        {error && <Text className="text-red-400 text-center mb-4">{error}</Text>}

        <Pressable
          onPress={onSubmit}
          disabled={loading || !email || !password}
          className="bg-indigo-600 rounded-xl py-3.5 items-center disabled:opacity-50"
        >
          <Text className="text-white font-bold">{loading ? "Logging in..." : "Log in"}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
