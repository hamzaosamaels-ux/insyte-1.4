import { Drawer } from "expo-router/drawer";

export default function TeacherLayout() {
  return (
    <Drawer screenOptions={{ headerShown: true }}>
      <Drawer.Screen name="lobby" options={{ title: "Roster & Lobby" }} />
      <Drawer.Screen name="lessons" options={{ title: "Lessons" }} />
      <Drawer.Screen name="tasks" options={{ title: "Tasks & Quizzes" }} />
      <Drawer.Screen name="grade" options={{ title: "Grading" }} />
      <Drawer.Screen name="events" options={{ title: "Schedule Event" }} />
      <Drawer.Screen name="announcements" options={{ title: "Announcements" }} />
      <Drawer.Screen name="chat" options={{ title: "Classroom Chat" }} />
      <Drawer.Screen name="library" options={{ title: "Library" }} />
      <Drawer.Screen name="calendar" options={{ title: "Calendar" }} />
      <Drawer.Screen name="mail" options={{ title: "Mail" }} />
      <Drawer.Screen name="settings" options={{ title: "Settings" }} />
    </Drawer>
  );
}
