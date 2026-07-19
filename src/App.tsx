import React, { useState, useEffect } from "react";
import { UserProfile, ClassCommunity, Lesson, TaskItem, TaskSubmission, Announcement, ChatMessage, ClassEvent, Mail, AppNotification } from "./types";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { StudentDashboard } from "./components/StudentDashboard";
import { TeacherDashboard } from "./components/TeacherDashboard";
import { DashboardSkeleton } from "./components/DashboardSkeleton";
import { Language, Theme, getTranslation } from "./translations";
import { api, authHeaders, getToken, setToken, clearToken } from "./api";

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

  // Theme & Language Settings State
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem("insyte_language") as Language) || "en";
  });
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem("insyte_theme") as Theme) || "light";
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
        setNotifications(data.myNotifications || []);
        mergeSubmissions(data.mySubmissions || []);
      })
      .catch((err) => console.error("Failed to load private user data:", err));
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
    fetch(api("/api/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Log in failed.");
        setToken(data.token);
        setStudents(data.allStudents);
        setTeachers(data.allTeachers);
        setCurrentUser(data.user);
        loadMe();
      })
      .catch((err) => setAuthError(err.message));
  };

  // Join a class community with its code
  const handleJoinClass = (code: string): Promise<string | null> => {
    if (!currentUser || currentUser.role !== "student") return Promise.resolve("Not a student.");
    return fetch(api("/api/classes/join"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: currentUser.id, code })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) return data.error || "Could not join class.";
        setStudents(data.allStudents);
        setClasses(data.allClasses);
        setCurrentUser(data.student);
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

  // Skeleton shell while portal data loads — keeps the layout stable
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Welcome / Auth Screen
  if (!currentUser) {
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
        language={language}
        setLanguage={setLanguage}
        theme={theme}
        setTheme={setTheme}
      />
    );
  }

  // Teacher Workspace — only this teacher's classes
  const teacherClasses = classes.filter(c => c.teacherId === currentUser.id);

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
      onCreateLesson={handleCreateLesson}
      onUpdateLesson={handleUpdateLesson}
      onDeleteLesson={handleDeleteLesson}
      onCreateTask={handleCreateTask}
      onAddAnnouncement={handleAddAnnouncement}
      onAddEvent={handleAddEvent}
      onGradeSubmission={handleGradeSubmission}
      onSendMail={handleSendMail}
      onMarkMailRead={handleMarkMailRead}
      onMarkNotificationsRead={handleMarkNotificationsRead}
      language={language}
      setLanguage={setLanguage}
      theme={theme}
      setTheme={setTheme}
    />
  );
}
