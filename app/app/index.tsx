import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../src/context/AuthContext";

const ONBOARDED_KEY = "insyte_has_onboarded";

export default function Index() {
  const { currentUser, booting } = useAuth();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDED_KEY).then((v) => setOnboarded(v === "1"));
  }, []);

  if (booting || onboarded === null) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <ActivityIndicator color="#818cf8" />
      </View>
    );
  }

  if (currentUser) {
    return <Redirect href={currentUser.role === "teacher" ? "/(teacher)/lobby" : "/(student)/dashboard"} />;
  }

  return <Redirect href={onboarded ? "/(auth)/welcome" : "/(auth)/onboarding"} />;
}
