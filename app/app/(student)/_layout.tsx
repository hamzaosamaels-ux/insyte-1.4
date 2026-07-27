import { Drawer } from "expo-router/drawer";

export default function StudentLayout() {
  return (
    <Drawer screenOptions={{ headerShown: true }}>
      <Drawer.Screen name="dashboard" options={{ title: "Dashboard" }} />
      <Drawer.Screen name="lessons" options={{ title: "Lessons" }} />
      <Drawer.Screen name="tasks" options={{ title: "Assignments" }} />
      <Drawer.Screen name="chat" options={{ title: "Peer Discuss" }} />
      <Drawer.Screen name="ai" options={{ title: "AI Study Buddy" }} />
      <Drawer.Screen name="library" options={{ title: "Library" }} />
      <Drawer.Screen name="calendar" options={{ title: "Calendar" }} />
      <Drawer.Screen name="mail" options={{ title: "Mail" }} />
      <Drawer.Screen name="settings" options={{ title: "Settings" }} />
    </Drawer>
  );
}
