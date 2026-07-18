import React, { useState, useEffect } from "react";
import { UserProfile, ClassCommunity, Lesson, TaskItem, TaskSubmission, Announcement, ChatMessage, ClassEvent } from "./types";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { StudentDashboard } from "./components/StudentDashboard";
import { TeacherDashboard } from "./components/TeacherDashboard";
import { Language, Theme, getTranslation } from "./translations";

export default function App() {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [teacher, setTeacher] = useState<UserProfile | null>(null);
  const [classes, setClasses] = useState<ClassCommunity[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [events, setEvents] = useState<ClassEvent[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

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

  // Sync entire state from full Express Backend DB on startup
  useEffect(() => {
  fetch("https://insyte-14-production.up.railway.app/api/data")
      .then((res) => {
        if (!res.ok) throw new Error("Server responded with an error code");
        return res.json();
      })
      .then((data) => {
        setStudents(data.students);
        setTeacher(data.teacher);
        setClasses(data.classes);
        setLessons(data.lessons);
        setTasks(data.tasks);
        setAnnouncements(data.announcements);
        setChatMessages(data.chatMessages);
        setEvents(data.events);
        setSubmissions(data.submissions);
        setIsLoading(false);

        // Restore active user session if previously logged in
        const savedUser = localStorage.getItem("insyte_currentUser");
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          // Retrieve the freshest version from the synced backend state
          const fresh = parsed.role === "teacher" 
            ? data.teacher 
            : data.students.find((s: any) => s.id === parsed.id);
          if (fresh) {
            setCurrentUser(fresh);
          } else {
            setCurrentUser(parsed);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load portal data from backend database:", err);
        setIsLoading(false);
      });
  }, []);

  // Synchronize currentUser back to localStorage on change
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("insyte_currentUser", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("insyte_currentUser");
    }
  }, [currentUser]);

  // Handle Login select profile
  const handleSelectProfile = (profile: UserProfile) => {
    setCurrentUser(profile);
  };

  // Logout session
  const handleLogOut = () => {
    setCurrentUser(null);
  };

  // Register brand new student profile on the backend
  const handleCreateStudent = (name: string, email: string) => {
    setIsLoading(true);
    fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email })
    })
      .then((res) => res.json())
      .then((data) => {
        setStudents(data.allStudents);
        setClasses(data.allClasses);
        setCurrentUser(data.student);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error creating student:", err);
        setIsLoading(false);
      });
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

    fetch("/api/classroom-chat", {
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

    fetch("/api/students/add-xp", {
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

    fetch("/api/students/leave-class", {
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
    fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub)
    })
      .then((res) => res.json())
      .then((data) => {
        setSubmissions(data.allSubmissions);
      })
      .catch((err) => console.error("Error submitting homework assignment:", err));
  };

  // 1. Create Classroom Community
  const handleCreateClass = (name: string, code: string, description: string, color?: string) => {
    if (!teacher) return;
    fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        code,
        description,
        teacherId: teacher.id,
        teacherName: teacher.name,
        color: color || "indigo"
      })
    })
      .then((res) => res.json())
      .then((data) => {
        setClasses(data.allClasses);
        setStudents(data.allStudents);
      })
      .catch((err) => console.error("Error establishing new classroom:", err));
  };

  // 2. Publish Class Lesson
  const handleCreateLesson = (les: Omit<Lesson, "id" | "publishedAt">) => {
    fetch("/api/lessons", {
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
    fetch(`/api/lessons/${id}`, {
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
    fetch(`/api/lessons/${id}`, {
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
    fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task)
    })
      .then((res) => res.json())
      .then((newTask) => {
        setTasks((prev) => [newTask, ...prev]);
      })
      .catch((err) => console.error("Error posting task:", err));
  };

  // 4. Broadcast Class Announcement
  const handleAddAnnouncement = (ann: Omit<Announcement, "id" | "publishedAt">) => {
    fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ann)
    })
      .then((res) => res.json())
      .then((newAnn) => {
        setAnnouncements((prev) => [newAnn, ...prev]);
      })
      .catch((err) => console.error("Error creating announcement:", err));
  };

  // 5. Schedule Calendar Event
  const handleAddEvent = (evt: Omit<ClassEvent, "id">) => {
    fetch("/api/events", {
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
    fetch("/api/submissions/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId, scoreXp, feedback })
    })
      .then((res) => res.json())
      .then((data) => {
        setSubmissions(data.allSubmissions);
        setStudents(data.allStudents);
        
        // If the student graded is currently logged in, sync their local UI profile
        if (currentUser && currentUser.id === data.studentId) {
          const freshStud = data.allStudents.find((s: any) => s.id === currentUser.id);
          if (freshStud) setCurrentUser(freshStud);
        }
      })
      .catch((err) => console.error("Error grading submission:", err));
  };

  // Portal Database Hydration Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="relative flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl border-4 border-violet-500/20 border-t-violet-500 animate-spin"></div>
          <div className="absolute font-display font-extrabold text-violet-400 text-sm">IN</div>
        </div>
        <h2 className="text-white font-bold font-display text-base tracking-tight">{getTranslation(language).syncing}</h2>
        <p className="text-slate-400 text-xs max-w-xs mt-2 leading-relaxed">
          {getTranslation(language).syncingDesc}
        </p>
      </div>
    );
  }

  // Welcome / Register Screen
  if (!currentUser) {
    return (
      <WelcomeScreen 
        students={students}
        teacher={teacher || {
          id: "teacher-1",
          name: "Prof. Hamza",
          email: "hamza@insyte.edu",
          role: "teacher",
          avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Hamza",
          xp: 0,
          level: 10,
          rank: "Master Educator",
          joinedClasses: ["class-1", "class-2"]
        }}
        onSelectProfile={handleSelectProfile}
        onCreateStudent={handleCreateStudent}
        language={language}
      />
    );
  }

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
        onLogOut={handleLogOut}
        onSendMessage={handleSendMessage}
        onAddXp={handleAddXp}
        onSubmitTask={handleSubmitTask}
        onLeaveClass={handleLeaveClass}
        language={language}
        setLanguage={setLanguage}
        theme={theme}
        setTheme={setTheme}
      />
    );
  }

  // Teacher Workspace
  return (
    <TeacherDashboard 
      currentTeacher={currentUser}
      classes={classes}
      lessons={lessons}
      tasks={tasks}
      announcements={announcements}
      events={events}
      submissions={submissions}
      allStudents={students}
      onLogOut={handleLogOut}
      onCreateClass={handleCreateClass}
      onCreateLesson={handleCreateLesson}
      onUpdateLesson={handleUpdateLesson}
      onDeleteLesson={handleDeleteLesson}
      onCreateTask={handleCreateTask}
      onAddAnnouncement={handleAddAnnouncement}
      onAddEvent={handleAddEvent}
      onGradeSubmission={handleGradeSubmission}
      language={language}
      setLanguage={setLanguage}
      theme={theme}
      setTheme={setTheme}
    />
  );
}
