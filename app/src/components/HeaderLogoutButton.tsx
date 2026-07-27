import React from "react";
import { Pressable, Text } from "react-native";
import { useAuth } from "../context/AuthContext";

// Phase 1 scope: a real, working logout so the full auth cycle (login ->
// see a real screen -> logout -> back to welcome) is actually testable.
// A confirm dialog / nicer placement is dashboard-polish, later phases.
export function HeaderLogoutButton() {
  const { logout } = useAuth();
  return (
    <Pressable onPress={() => logout()} className="px-3 py-1.5 mr-2">
      <Text className="text-indigo-500 text-xs font-bold">Log out</Text>
    </Pressable>
  );
}
