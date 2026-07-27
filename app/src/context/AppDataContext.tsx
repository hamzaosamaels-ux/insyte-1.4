import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import type {
  UserProfile, ClassCommunity, Lesson, TaskItem, TaskSubmission,
  Announcement, ChatMessage, ClassEvent, Mail, AppNotification
} from "@insyte/shared/types";
import { api, authHeaders } from "../api";
import { useAuth } from "./AuthContext";

interface AppDataContextValue {
  students: UserProfile[];
  teachers: UserProfile[];
  classes: ClassCommunity[];
  lessons: Lesson[];
  tasks: TaskItem[];
  announcements: Announcement[];
  chatMessages: ChatMessage[];
  events: ClassEvent[];
  submissions: TaskSubmission[];
  mails: Mail[];
  notifications: AppNotification[];
  loading: boolean;
  refresh: () => Promise<void>;
  // Mutations needed by Phase 2 screens. Each returns an error string, or null on success.
  createClass: (name: string, code: string, description: string, color?: string) => Promise<string | null>;
  joinClass: (code: string) => Promise<string | null>;
  adjustStudentXp: (studentId: string, xpAmount: number) => Promise<string | null>;
  leaveClass: (classId: string) => Promise<string | null>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, setCurrentUser } = useAuth();

  const [students, setStudents] = useState<UserProfile[]>([]);
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [classes, setClasses] = useState<ClassCommunity[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [events, setEvents] = useState<ClassEvent[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [mails, setMails] = useState<Mail[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Overlay full (private) submissions onto the public status-only list
  const mergeSubmissions = useCallback((fullOnes: TaskSubmission[]) => {
    setSubmissions(prev => {
      const byId = new Map(prev.map(s => [s.id, s]));
      for (const s of fullOnes) byId.set(s.id, s);
      return Array.from(byId.values());
    });
  }, []);

  const refreshPublic = useCallback(async () => {
    try {
      const res = await fetch(api("/api/data"), { headers: await authHeaders() });
      // 503 = server still loading its store; keep what we have and retry later
      if (!res.ok) return;
      const data = await res.json();
      setStudents(data.students || []);
      setTeachers(data.teachers || []);
      setClasses(data.classes || []);
      setLessons(data.lessons || []);
      setTasks(data.tasks || []);
      setAnnouncements(data.announcements || []);
      setChatMessages(data.chatMessages || []);
      setEvents(data.events || []);
      mergeSubmissions(data.submissions || []);
    } catch {
      // Offline / transient — keep the last good state rather than blanking the UI
    }
  }, [mergeSubmissions]);

  const loadMe = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(api("/api/me"), { headers: await authHeaders() });
      if (!res.ok) return; // 401 handling lives in AuthContext; don't duplicate it here
      const data = await res.json();
      setCurrentUser(data.user);
      setMails(data.myMails || []);
      setNotifications(data.myNotifications || []);
      mergeSubmissions(data.mySubmissions || []);
    } catch {
      // ignore transient failures
    }
  }, [currentUser, setCurrentUser, mergeSubmissions]);

  const refresh = useCallback(async () => {
    await Promise.all([refreshPublic(), loadMe()]);
  }, [refreshPublic, loadMe]);

  // Initial load once signed in
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    refresh().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  // Near-realtime polling, but only while signed in AND the app is in the
  // foreground — web gates this on document.hidden; AppState is the native
  // equivalent. Polling in the background would drain battery for nothing.
  const appState = useRef<AppStateStatus>(AppState.currentState);
  useEffect(() => {
    if (!currentUser) return;

    const sub = AppState.addEventListener("change", (next) => {
      const cameToForeground = appState.current.match(/inactive|background/) && next === "active";
      appState.current = next;
      if (cameToForeground) refresh(); // catch up immediately on resume
    });

    const publicTimer = setInterval(() => {
      if (AppState.currentState === "active") refreshPublic();
    }, 4000);
    const privateTimer = setInterval(() => {
      if (AppState.currentState === "active") loadMe();
    }, 30000);

    return () => {
      sub.remove();
      clearInterval(publicTimer);
      clearInterval(privateTimer);
    };
  }, [currentUser, refresh, refreshPublic, loadMe]);

  const createClass = async (name: string, code: string, description: string, color?: string): Promise<string | null> => {
    if (!currentUser || currentUser.role !== "teacher") return "Not a teacher.";
    try {
      const res = await fetch(api("/api/classes"), {
        method: "POST",
        headers: await authHeaders(true),
        body: JSON.stringify({
          name, code, description,
          teacherId: currentUser.id,
          teacherName: currentUser.name,
          color: color || "indigo"
        })
      });
      const data = await res.json();
      if (!res.ok) return data.error || "Could not create class.";
      setClasses(data.allClasses || []);
      setTeachers(data.allTeachers || []);
      if (data.allStudents) setStudents(data.allStudents);
      const fresh = (data.allTeachers || []).find((t: UserProfile) => t.id === currentUser.id);
      // Public lists omit email; keep the one from the signed-in session
      if (fresh) setCurrentUser({ ...fresh, email: currentUser.email });
      return null;
    } catch {
      return "Connection error. Try again.";
    }
  };

  const joinClass = async (code: string): Promise<string | null> => {
    if (!currentUser) return "Not signed in.";
    try {
      const res = await fetch(api("/api/classes/join"), {
        method: "POST",
        headers: await authHeaders(true),
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      if (!res.ok) return data.error || "Could not join class.";
      if (data.allStudents) setStudents(data.allStudents);
      if (data.allTeachers) setTeachers(data.allTeachers);
      if (data.allClasses) setClasses(data.allClasses);
      const updated = data.user || data.student;
      if (updated) setCurrentUser({ ...updated, email: updated.email ?? currentUser.email });
      return null;
    } catch {
      return "Connection error. Try again.";
    }
  };

  const adjustStudentXp = async (studentId: string, xpAmount: number): Promise<string | null> => {
    try {
      const res = await fetch(api("/api/students/add-xp"), {
        method: "POST",
        headers: await authHeaders(true),
        body: JSON.stringify({ studentId, xpAmount })
      });
      const data = await res.json();
      if (!res.ok) return data.error || "Could not adjust XP.";
      if (data.allStudents) setStudents(data.allStudents);
      return null;
    } catch {
      return "Connection error. Try again.";
    }
  };

  const leaveClass = async (classId: string): Promise<string | null> => {
    if (!currentUser) return "Not signed in.";
    try {
      const res = await fetch(api("/api/students/leave-class"), {
        method: "POST",
        headers: await authHeaders(true),
        body: JSON.stringify({ studentId: currentUser.id, classId })
      });
      const data = await res.json();
      if (!res.ok) return data.error || "Could not leave class.";
      if (data.allStudents) setStudents(data.allStudents);
      if (data.allClasses) setClasses(data.allClasses);
      if (data.student) setCurrentUser({ ...data.student, email: data.student.email ?? currentUser.email });
      return null;
    } catch {
      return "Connection error. Try again.";
    }
  };

  return (
    <AppDataContext.Provider
      value={{
        students, teachers, classes, lessons, tasks, announcements,
        chatMessages, events, submissions, mails, notifications, loading,
        refresh, createClass, joinClass, adjustStudentXp, leaveClass
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
