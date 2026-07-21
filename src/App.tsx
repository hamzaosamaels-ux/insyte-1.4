import React, { useState, useEffect, useRef } from "react";
import { UserProfile, ClassCommunity, Lesson, TaskItem, TaskSubmission, Announcement, ChatMessage, ClassEvent, Mail, AppNotification } from "./types";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { Landing } from "./components/Landing";
import { AppIntro } from "./components/AppIntro";
import { StudentDashboard } from "./components/StudentDashboard";
import { TeacherDashboard } from "./components/TeacherDashboard";
import { DashboardSkeleton } from "./components/DashboardSkeleton";
import { Language, Theme, getTranslation } from "./translations";
import { api, authHeaders, getToken, setToken, clearToken, API_BASE } from "./api";
import { login as sharedLogIn } from "@insyte/shared/auth";

export default function App() {
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

  const [isLoading, setIsLoading] = useState(true);
  // Hydrate the signed-in user synchronously from localStorage so a page
  // refresh never flashes the login screen or drops the session.
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem("insyte_currentUser");
      return saved ? (JSON.parse(saved) as UserProfile) : null;
    } catch {
      return null;
    }
  });
  const [authError, setAuthError] = useState<string | null>(null);
  // Returning visitors (any stored token) skip the marketing landing page
  const [showAuth, setShowAuth] = useState<boolean>(() => Boolean(getToken()));

  // Theme & Language Settings State
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem("insyte_language") as Language) || "en";
  });
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem("insyte_theme") as Theme | null;
    if (saved) return saved;
    // First visit: follow the device's system setting
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("insyte_language", lang);
  };

  const setTheme = (th: Theme) => {
    setThemeState(th);
    localStorage.setItem("insyte_theme", th);
  };

  // Sync RTL Direction and Lang Code
  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  // Sync Dark Class on body / root
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Overlay full (private) submissions onto the public status-only list
  const mergeSubmissions = (fullOnes: TaskSubmission[]) => {
    setSubmissions(prev => {
      const byId = new Map(prev.map(s => [s.id, s]));
      for (const s of fullOnes) byId.set(s.id, s);
      return Array.from(byId.values());
    });
  };

  // Pull the signed-in user's private data: profile, mailbox, notifications,
  // and the full submissions they may read. Authenticated by session token.
  const loadMe = () => {
    if (!getToken()) return Promise.resolve();
    return fetch(api("/api/me"), { headers: authHeaders() })
      .then((res) => {
        if (res.status === 401) {
          // Token expired or server restarted (flat-file sessions don't persist
          // across redeploys). Sign out cleanly instead of looping.
          clearToken();
          setCurrentUser(null);
          throw new Error("session expired");
        }
        if (!res.ok) throw new Error("me fetch failed");
        return res.json();
      })
      .then((data) => {
        if (!data || !getToken()) return; // ignore if logged out meanwhile
        setCurrentUser(data.user);
        setMails(data.myMails || []);
        maybeNotify(data.myNotifications || []);
        setNotifications(data.myNotifications || []);
        mergeSubmissions(data.mySubmissions || []);
      })
      .catch((err) => console.error("Failed to load private user data:", err));
  };

  // Fire an OS/browser notification for genuinely-new items. The first load
  // just records existing ids so we don't alert for the whole backlog.
  const seenNotifIds = useRef<Set<string> | null>(null);
  const maybeNotify = (incoming: AppNotification[]) => {
    if (seenNotifIds.current === null) {
      seenNotifIds.current = new Set(incoming.map(n => n.id));
      return;
    }
    if (typeof Notification === "undefined" || Notification.permission !== "granted") {
      for (const n of incoming) seenNotifIds.current.add(n.id);
      return;
    }
    for (const n of incoming) {
      if (!seenNotifIds.current.has(n.id)) {
        seenNotifIds.current.add(n.id);
        try { new Notification(`insyte — ${n.title}`, { body: n.body }); } catch { /* ignore */ }
      }
    }
  };

  // Pull the shared (public) portal state: classes, lessons, tasks, chat, etc.
  const refreshPublic = (initial = false) => {
    return fetch(api("/api/data"))
      .then((res) => {
        if (!res.ok) throw new Error("Server responded with an error code");
        return res.json();
      })
      .then((data) => {
        setStudents(data.students || []);
        setTeachers(data.teachers || []);
        setClasses(data.classes || []);
        setLessons(data.lessons || []);
        setTasks(data.tasks || []);
        setAnnouncements(data.announcements || []);
        setChatMessages(data.chatMessages || []);
        setEvents(data.events || []);
        // Public submissions are status-only; keep any full ones already merged
        mergeSubmissions(data.submissions || []);
        if (initial) {
          setIsLoading(false);
          if (getToken()) loadMe();
        }
      })
      .catch((err) => {
        console.error("Failed to load portal data from backend database:", err);
        if (initial) setIsLoading(false);
      });
  };

  // Initial load
  useEffect(() => {
    refreshPublic(true);
  }, []);

  // Near-realtime: refresh shared state every 4s while signed in, so chat
  // messages and announcements from other users appear within a few seconds.
  // Pauses when the tab is hidden to save battery and requests.
  useEffect(() => {
    if (!currentUser) return;
    const tick = () => { if (!document.hidden) refreshPublic(); };
    const id = setInterval(tick, 4000);
    return () => clearInterval(id);
  }, [currentUser?.id]);

  // Refresh mailbox + notifications every 30s while signed in
  useEffect(() => {
    if (!currentUser) return;
    const id = setInterval(() => { if (!document.hidden) loadMe(); }, 30000);
    return () => clearInterval(id);
  }, [currentUser?.id]);

  // Synchronize currentUser back to localStorage on change
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("insyte_currentUser", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("insyte_currentUser");
    }
  }, [currentUser]);

  // Logout: clear the local session and tell the server to drop the token
  const handleLogOut = () => {
    fetch(api("/api/logout"), { method: "POST", headers: authHeaders() }).catch(() => {});
    clearToken();
    setCurrentUser(null);
  };

  // Sign up: create a brand new student or teacher account with a password
  const handleSignUp = (name: string, email: string, role: "student" | "teacher", password: string) => {
    setAuthError(null);
    fetch(api("/api/signup"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, role, password })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Sign up failed.");
        setToken(data.token);
        setStudents(data.allStudents);
        setTeachers(data.allTeachers);
        setCurrentUser(data.user);
        loadMe();
      })
      .catch((err) => setAuthError(err.message));
  };

  // Log in with email + password
  const handleLogIn = (email: string, password: string) => {
    setAuthError(null);
    sharedLogIn(API_BASE, email, password)
      .then((data) => {
        setToken(data.token);
        setStudents(data.allStudents);
        setTeachers(data.allTeachers);
        setCurrentUser(data.user);
        loadMe();
      })
      .catch((err) => setAuthError(err.message));
  };

  // Join a class community with its code (students enroll, teachers co-teach)
  const handleJoinClass = (code: string): Promise<string | null> => {
    if (!currentUser) return Promise.resolve("Not signed in.");
    return fetch(api("/api/classes/join"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Both keys: stale backends only know studentId; new ones prefer userId
      body: JSON.stringify({ userId: currentUser.id, studentId: currentUser.id, code })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) return data.error || "Could not join class.";
        setStudents(data.allStudents);
        if (data.allTeachers) setTeachers(data.allTeachers);
        setClasses(data.allClasses);
        setCurrentUser(data.user || data.student);
        return null;
      })
      .catch(() => "Connection error. Try again.");
  };

  // Teacher resets a student's password (told to the student in person)
  const handleResetStudentPassword = (studentId: string, newPassword: string): Promise<string | null> => {
    return fetch(api("/api/students/reset-password"), {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({ studentId, newPassword })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) return data.error || "Could not reset password.";
        return null;
      })
      .catch(() => "Connection error. Try again.");
  };

  // Classroom Peer Chat Broadcaster
  const handleSendMessage = (classId: string, text: string) => {
    if (!currentUser) return;
    const payload = {
      classId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      senderAvatar: currentUser.avatar,
      text
    };

    fetch(api("/api/classroom-chat"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then((res) => res.json())
      .then((data) => {
        setChatMessages(data.allChatMessages);
      })
      .catch((err) => console.error("Error sending chat message:", err));
  };

  // Award study XP points and calculate level ups
  const handleAddXp = (xpAmount: number) => {
    if (!currentUser || currentUser.role !== "student") return;

    fetch(api("/api/students/add-xp"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: currentUser.id, xpAmount })
    })
      .then((res) => res.json())
      .then((data) => {
        setStudents(data.allStudents);
        setCurrentUser(data.student);
      })
      .catch((err) => console.error("Error rewarding study XP:", err));
  };

  // Leave a class (unenroll the current student)
  const handleLeaveClass = (classId: string) => {
    if (!currentUser || currentUser.role !== "student") return;

    fetch(api("/api/students/leave-class"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: currentUser.id, classId })
    })
      .then((res) => res.json())
      .then((data) => {
        setStudents(data.allStudents);
        setClasses(data.allClasses);
        setCurrentUser(data.student);
      })
      .catch((err) => console.error("Error leaving class:", err));
  };

  // Submit student homework task
  const handleSubmitTask = (sub: Omit<TaskSubmission, "id" | "submittedAt">) => {
    fetch(api("/api/submissions"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub)
    })
      .then((res) => res.json())
      .then((data) => {
        mergeSubmissions(data.mySubmissions || []);
      })
      .catch((err) => console.error("Error submitting homework assignment:", err));
  };

  // 1. Create Classroom Community
  const handleCreateClass = (name: string, code: string, description: string, color?: string): Promise<string | null> => {
    if (!currentUser || currentUser.role !== "teacher") return Promise.resolve("Not a teacher.");
    return fetch(api("/api/classes"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        code,
        description,
        teacherId: currentUser.id,
        teacherName: currentUser.name,
        color: color || "indigo"
      })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) return data.error || "Could not create class.";
        setClasses(data.allClasses);
        setTeachers(data.allTeachers);
        if (data.allStudents) setStudents(data.allStudents);
        const freshTeacher = data.allTeachers.find((t: UserProfile) => t.id === currentUser.id);
        // Public lists omit email; keep the one from the signed-in session
        if (freshTeacher) setCurrentUser({ ...freshTeacher, email: currentUser.email });
        return null;
      })
      .catch(() => "Connection error. Try again.");
  };

  // 2. Publish Class Lesson
  const handleCreateLesson = (les: Omit<Lesson, "id" | "publishedAt">) => {
    fetch(api("/api/lessons"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(les)
    })
      .then((res) => res.json())
      .then((newLesson) => {
        setLessons((prev) => [newLesson, ...prev]);
      })
      .catch((err) => console.error("Error publishing lesson:", err));
  };

  const handleUpdateLesson = (id: string, updatedFields: Partial<Lesson>) => {
    fetch(api(`/api/lessons/${id}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedFields)
    })
      .then((res) => res.json())
      .then((updatedLesson) => {
        setLessons((prev) => prev.map((l) => (l.id === id ? updatedLesson : l)));
      })
      .catch((err) => console.error("Error updating lesson:", err));
  };

  const handleDeleteLesson = (id: string) => {
    fetch(api(`/api/lessons/${id}`), {
      method: "DELETE"
    })
      .then((res) => res.json())
      .then(() => {
        setLessons((prev) => prev.filter((l) => l.id !== id));
      })
      .catch((err) => console.error("Error deleting lesson:", err));
  };

  // 3. Post Homework Assignment
  const handleCreateTask = (task: Omit<TaskItem, "id">) => {
    fetch(api("/api/tasks"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task)
    })
      .then((res) => res.json())
      .then((data) => {
        setTasks((prev) => [data.task, ...prev]);
      })
      .catch((err) => console.error("Error posting task:", err));
  };

  // 4. Broadcast Class Announcement
  const handleAddAnnouncement = (ann: Omit<Announcement, "id" | "publishedAt">) => {
    fetch(api("/api/announcements"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ann)
    })
      .then((res) => res.json())
      .then((data) => {
        setAnnouncements((prev) => [data.announcement, ...prev]);
      })
      .catch((err) => console.error("Error creating announcement:", err));
  };

  // 5. Schedule Calendar Event
  const handleAddEvent = (evt: Omit<ClassEvent, "id">) => {
    fetch(api("/api/events"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(evt)
    })
      .then((res) => res.json())
      .then((newEvt) => {
        setEvents((prev) => [...prev, newEvt]);
      })
      .catch((err) => console.error("Error scheduling event:", err));
  };

  // 6. Grade Homework Task Submission
  const handleGradeSubmission = (submissionId: string, scoreXp: number, feedback: string) => {
    fetch(api("/api/submissions/grade"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId, scoreXp, feedback })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.submission) mergeSubmissions([data.submission]);
        setStudents(data.allStudents);
      })
      .catch((err) => console.error("Error grading submission:", err));
  };

  // 6b. Teacher manually adjusts a student's XP (+/-). Reuses the add-xp endpoint.
  const handleAdjustStudentXp = (studentId: string, xpAmount: number) => {
    fetch(api("/api/students/add-xp"), {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({ studentId, xpAmount })
    })
      .then((res) => res.json())
      .then((data) => { if (data.allStudents) setStudents(data.allStudents); })
      .catch((err) => console.error("Error adjusting XP:", err));
  };

  // 7. Send an in-app mail (sender is the token holder)
  const handleSendMail = (toId: string, subject: string, body: string): Promise<string | null> => {
    if (!currentUser) return Promise.resolve("Not logged in.");
    return fetch(api("/api/mail"), {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({ toId, subject, body })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) return data.error || "Could not send mail.";
        setMails(data.myMails);
        return null;
      })
      .catch(() => "Connection error. Try again.");
  };

  // 8. Mark a mail read
  const handleMarkMailRead = (mailId: string) => {
    if (!currentUser) return;
    fetch(api("/api/mail/read"), {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({ mailId })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.myMails) setMails(data.myMails);
      })
      .catch((err) => console.error("Error marking mail read:", err));
  };

  // 9. Mark all my notifications read
  const handleMarkNotificationsRead = () => {
    if (!currentUser) return;
    fetch(api("/api/notifications/read"), {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({})
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.myNotifications) setNotifications(data.myNotifications);
      })
      .catch((err) => console.error("Error marking notifications read:", err));
  };

  // 10. Upload a profile photo (data URL). Returns an error string or null.
  const handleUpdateAvatar = (dataUrl: string): Promise<string | null> => {
    if (!currentUser) return Promise.resolve("Not logged in.");
    return fetch(api("/api/profile/avatar"), {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({ avatar: dataUrl })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) return data.error || "Could not update photo.";
        setCurrentUser(data.user);
        setStudents(data.allStudents);
        setTeachers(data.allTeachers);
        return null;
      })
      .catch(() => "Connection error. Try again.");
  };

  // Skeleton shell while portal data loads — keeps the layout stable
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // First visit: phones get app-style onboarding slides, desktop gets the
  // marketing landing. Returning users (had a token) go straight to auth.
  if (!currentUser) {
    if (!showAuth) {
      if (window.matchMedia("(max-width: 767px)").matches) {
        return <AppIntro language={language} onGetStarted={() => setShowAuth(true)} />;
      }
      return (
        <Landing
          language={language}
          setLanguage={setLanguage}
          onGetStarted={() => setShowAuth(true)}
          onLogIn={() => setShowAuth(true)}
        />
      );
    }
    return (
      <WelcomeScreen
        onSignUp={handleSignUp}
        onLogIn={handleLogIn}
        authError={authError}
        language={language}
      />
    );
  }

  const myNotifications = notifications.filter(n => n.userId === currentUser.id);
  const myMails = mails.filter(m => m.toId === currentUser.id || m.fromId === currentUser.id);

  // Student Workspace
  if (currentUser.role === "student") {
    return (
      <StudentDashboard
        currentStudent={currentUser}
        classes={classes}
        lessons={lessons}
        tasks={tasks}
        announcements={announcements}
        chatMessages={chatMessages}
        events={events}
        submissions={submissions}
        allStudents={students}
        allTeachers={teachers}
        mails={myMails}
        notifications={myNotifications}
        onLogOut={handleLogOut}
        onSendMessage={handleSendMessage}
        onAddXp={handleAddXp}
        onSubmitTask={handleSubmitTask}
        onLeaveClass={handleLeaveClass}
        onJoinClass={handleJoinClass}
        onSendMail={handleSendMail}
        onMarkMailRead={handleMarkMailRead}
        onMarkNotificationsRead={handleMarkNotificationsRead}
        onUpdateAvatar={handleUpdateAvatar}
        language={language}
        setLanguage={setLanguage}
        theme={theme}
        setTheme={setTheme}
      />
    );
  }

  // Teacher Workspace — classes this teacher owns or joined as co-teacher
  const teacherClasses = classes.filter(
    c => c.teacherId === currentUser.id || (currentUser.joinedClasses ?? []).includes(c.id)
  );

  return (
    <TeacherDashboard
      currentTeacher={currentUser}
      classes={teacherClasses}
      lessons={lessons}
      tasks={tasks}
      announcements={announcements}
      events={events}
      submissions={submissions}
      allStudents={students}
      allTeachers={teachers}
      mails={myMails}
      notifications={myNotifications}
      onLogOut={handleLogOut}
      onCreateClass={handleCreateClass}
      onJoinClass={handleJoinClass}
      onResetStudentPassword={handleResetStudentPassword}
      onCreateLesson={handleCreateLesson}
      onUpdateLesson={handleUpdateLesson}
      onDeleteLesson={handleDeleteLesson}
      onCreateTask={handleCreateTask}
      onAddAnnouncement={handleAddAnnouncement}
      onAddEvent={handleAddEvent}
      onGradeSubmission={handleGradeSubmission}
      onAdjustStudentXp={handleAdjustStudentXp}
      onSendMail={handleSendMail}
      onMarkMailRead={handleMarkMailRead}
      onMarkNotificationsRead={handleMarkNotificationsRead}
        onUpdateAvatar={handleUpdateAvatar}
      language={language}
      setLanguage={setLanguage}
      theme={theme}
      setTheme={setTheme}
    />
  );
}
