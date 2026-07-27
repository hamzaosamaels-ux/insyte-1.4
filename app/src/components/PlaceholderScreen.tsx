import React from "react";
import { View, Text } from "react-native";

// Phase 0 proof-of-done artifact: every real screen exists as a route,
// rendering just its name, before any real content gets built in later phases.
export function PlaceholderScreen({ name }: { name: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-[#0b081a]">
      <Text className="text-slate-800 dark:text-slate-100 font-display text-base font-bold">
        {name}
      </Text>
    </View>
  );
}
