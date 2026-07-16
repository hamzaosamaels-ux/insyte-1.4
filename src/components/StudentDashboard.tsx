import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, Award, MessageSquare, Calendar, Sparkles, Send, 
  ChevronRight, Trophy, Bell, Clock, LogOut, CheckCircle2,
  List, ShieldAlert, ArrowLeft, RefreshCw, Star, Info, Settings,
  Video, Presentation, Globe, ExternalLink, Search
} from "lucide-react";
import { 
  UserProfile, ClassCommunity, Lesson, TaskItem, 
  TaskSubmission, Announcement, ChatMessage, ClassEvent 
} from "../types";
import { Language, Theme, getTranslation } from "../translations";
import { InteractiveCalendar } from "./InteractiveCalendar";
import { SettingsTab } from "./SettingsTab";
import { NavbarControls } from "./NavbarControls";
import { getClassColors } from "../utils/colorHelper";

interface StudentDashboardProps {
  currentStudent: UserProfile;
  classes: ClassCommunity[];
  lessons: Lesson[];
  tasks: TaskItem[];
  announcements: Announcement[];
  chatMessages: ChatMessage[];
  events: ClassEvent[];
  submissions: TaskSubmission[];
  allStudents: UserProfile[];
  onLogOut: () => void;
  onSendMessage: (classId: string, text: string) => void;
  onAddXp: (xpAmount: number) => void;
  onSubmitTask: (submission: Omit<TaskSubmission, "id" | "submittedAt">) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (th: Theme) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentStudent,
  classes,
  lessons,
  tasks,
  announcements,
  chatMessages,
  events,
  submissions,
  allStudents,
  onLogOut,
  onSendMessage,
  onAddXp,
  onSubmitTask,
  language,
  setLanguage,
  theme,
  setTheme
}) => {
  const t = getTranslation(language);

  const getYoutubeEmbedUrl = (url?: string) => {
    if (!url) return "";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return url;
  };

  // Toast notifications state
  const [notification, setNotification] = useState<{ message: string; type: "success" | "info" } | null>(null);

  const showNotification = (message: string, type: "success" | "info" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Navigation & View States
  const studentClasses = classes.filter(c => currentStudent?.joinedClasses?.includes(c.id) ?? false);
  const [activeClass, setActiveClass] = useState<ClassCommunity | null>(studentClasses[0] || null);

  const getGradeAndSubject = (name: string) => {
    if (name.includes(" - ")) {
      const parts = name.split(" - ");
      return { grade: parts[0].trim(), subject: parts[1].trim() };
    }
    return { grade: name.trim(), subject: "General" };
  };

  const classesByGrade: Record<string, ClassCommunity[]> = {};
  studentClasses.forEach(cl => {
    const { grade } = getGradeAndSubject(cl.name);
    if (!classesByGrade[grade]) {
      classesByGrade[grade] = [];
    }
    classesByGrade[grade].push(cl);
  });

  const grades = Object.keys(classesByGrade);
  const activeGrade = activeClass ? getGradeAndSubject(activeClass.name).grade : (grades[0] || "");
  const activeGradeClasses = classesByGrade[activeGrade] || [];

  const activeColors = getClassColors(activeClass?.color);
  const [activeTab, setActiveTab] = useState<"dashboard" | "lessons" | "tasks" | "chat" | "ai" | "calendar" | "settings">("dashboard");

  // Subview Details States
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  // Search query states
  const [lessonSearch, setLessonSearch] = useState("");
  const [taskSearch, setTaskSearch] = useState("");
  const [announcementSearch, setAnnouncementSearch] = useState("");

  // Homework submission input state
  const [homeworkText, setHomeworkText] = useState("");
  const [submittingTask, setSubmittingTask] = useState(false);

  // Drag and Drop Matcher State
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [matchedPairings, setMatchedPairings] = useState<Record<string, string>>({}); // Target -> DraggedItem
  const [dragDropFeedback, setDragDropFeedback] = useState<{ success?: boolean; text: string } | null>(null);

  // Chat message input state
  const [chatInput, setChatInput] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // AI Tutor state
  const [aiChat, setAiChat] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    { 
      role: "assistant", 
      text: `Hi **${currentStudent.name}**! I am your **Insyte AI Tutor**. Ask me anything about your lessons, pending assignments, or studying strategies. I'm connected to your class progress!` 
    }
  ]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const aiBottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll to chat bottoms
  useEffect(() => {
    if (activeTab === "chat") {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (activeTab === "ai") {
      aiBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeTab, chatMessages, aiChat]);

  // Handle Drag and Drop Matcher
  const handleDragStart = (item: string) => {
    setDraggedItem(item);
  };

  const handleDrop = (zone: string) => {
    if (!draggedItem || !selectedTask?.correctPairing) return;
    
    // Set matching pairing
    setMatchedPairings(prev => ({
      ...prev,
      [zone]: draggedItem
    }));
    setDraggedItem(null);
  };

  const handleResetDragDrop = () => {
    setMatchedPairings({});
    setDragDropFeedback(null);
  };

  const handleCheckDragDrop = () => {
    if (!selectedTask || !selectedTask.correctPairing) return;
    
    const targets = selectedTask.dropZones || [];
    let allCorrect = true;
    
    for (const target of targets) {
      // Find what item was dropped into this target
      const droppedItem = matchedPairings[target];
      // Check correct pairing
      const expectedItem = Object.keys(selectedTask.correctPairing).find(
        key => selectedTask.correctPairing?.[key] === target
      );
      
      if (droppedItem !== expectedItem) {
        allCorrect = false;
        break;
      }
    }

    if (allCorrect) {
      setDragDropFeedback({
        success: true,
        text: `Awesome! You paired all components perfectly and earned +${selectedTask.rewardXp} XP!`
      });
      
      // Submit submission
      onSubmitTask({
        taskId: selectedTask.id,
        taskTitle: selectedTask.title,
        studentId: currentStudent.id,
        studentName: currentStudent.name,
        studentAvatar: currentStudent.avatar,
        content: JSON.stringify(matchedPairings),
        isGraded: true,
        scoreXpEarned: selectedTask.rewardXp
      });
      onAddXp(selectedTask.rewardXp);
    } else {
      setDragDropFeedback({
        success: false,
        text: "Hmm, that's not quite right. Match carefully and try again!"
      });
    }
  };

  // Submit Text Homework Task
  const handleTextHomeworkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !homeworkText.trim()) return;

    setSubmittingTask(true);
    
    setTimeout(() => {
      onSubmitTask({
        taskId: selectedTask.id,
        taskTitle: selectedTask.title,
        studentId: currentStudent.id,
        studentName: currentStudent.name,
        studentAvatar: currentStudent.avatar,
        content: homeworkText.trim(),
        isGraded: false // Teacher needs to grade text submissions
      });

      setHomeworkText("");
      setSubmittingTask(false);
      setSelectedTask(null);
      // Let student know they submitted
      showNotification("Homework submitted successfully! Prof. Hamza will review and award up to " + selectedTask.rewardXp + " XP.");
    }, 800);
  };

  // Chat message send
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClass || !chatInput.trim()) return;
    onSendMessage(activeClass.id, chatInput.trim());
    setChatInput("");
  };

  // Ask AI Study Buddy
  const handleAskAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || aiLoading) return;

    const userMessage = aiInput.trim();
    setAiInput("");
    setAiChat(prev => [...prev, { role: "user", text: userMessage }]);
    setAiLoading(true);

    // Formulate a student profile-context prompt for Gemini
    const currentClassLessons = lessons.filter(l => l.classId === activeClass?.id);
    const currentClassTasks = tasks.filter(t => t.classId === activeClass?.id);
    const openTasks = currentClassTasks.filter(t => !submissions.some(s => s.taskId === t.id && s.studentId === currentStudent.id));

    const systemPrompt = `You are **Insyte AI**, a helpful study tutor for an educational platform called Insyte.
You help students with studies, tasks, lessons, and motivate them.

**Current Student Context:**
- Student Name: ${currentStudent.name}
- Level: ${currentStudent.level}
- XP Points: ${currentStudent.xp}
- Rank: ${currentStudent.rank}
${activeClass ? `- Current Subject: ${activeClass.name}` : ''}
- Enrolled Lessons: ${currentClassLessons.map(l => l.title).join(", ") || 'None'}
- Open/Pending Homework: ${openTasks.map(t => `${t.title} (Reward: ${t.rewardXp} XP)`).join(", ") || 'None'}

**Tone and Rules:**
1. Be exceptionally friendly, encouraging, and clear.
2. If the student asks about lessons, refer specifically to their lessons listed in context.
3. If asked about ranks or XP, mention their actual level/rank and motivate them to complete pending tasks to scale higher.
4. Keep answers readable. Use bold text and short, scannable bullet points.
5. Do NOT mention that you are an AI model. Be the tutor.
6. Use emojis sparingly and warmly.`;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...aiChat, { role: "user", text: userMessage }].map(m => ({
            role: m.role,
            text: m.text
          })),
          systemPrompt
        })
      });

      const data = await response.json();
      if (response.ok) {
        setAiChat(prev => [...prev, { role: "assistant", text: data.text }]);
      } else {
        setAiChat(prev => [...prev, { 
          role: "assistant", 
          text: `⚠️ **Error**: ${data.error || "Failed to contact study assistant."}` 
        }]);
      }
    } catch (err: any) {
      setAiChat(prev => [...prev, { 
        role: "assistant", 
        text: `⚠️ **Connection Error**: Please make sure your dev server and internet are working properly.` 
      }]);
    } finally {
      setAiLoading(false);
    }
  };

  // Helper variables for filtered arrays
  const classLessons = lessons.filter(l => l.classId === activeClass?.id);
  const classTasks = tasks.filter(t => t.classId === activeClass?.id);
  const classAnnouncements = announcements.filter(a => a.classId === activeClass?.id);
  const classMessages = chatMessages.filter(m => m.classId === activeClass?.id);
  const classEvents = events.filter(e => e.classId === activeClass?.id);

  // Leaderboard logic: Sort all students in class by XP
  const classStudents = allStudents
    .filter(s => activeClass?.studentIds?.includes(s.id) ?? false)
    .sort((a, b) => b.xp - a.xp);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b081a] text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 right-6 z-50 max-w-sm bg-slate-900/95 dark:bg-[#1c1836]/95 backdrop-blur-md border border-slate-700/50 dark:border-indigo-500/30 px-4 py-3.5 rounded-2xl text-white text-xs font-semibold shadow-2xl flex items-center gap-3"
          >
            <div className="p-1 bg-emerald-500/15 text-emerald-400 rounded-lg">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upper Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white dark:bg-[#130f26] border-b border-slate-200 dark:border-[#241c49]/80 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500 text-white rounded-xl shadow-md">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-50">insyte</h1>
            <p className="text-slate-400 text-[10px] uppercase font-mono tracking-widest font-bold">{t.studentCenter}</p>
          </div>
        </div>

        {/* Class Tabs (Grade Selector visible regardless of active tab) */}
        {grades.length > 0 && (
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#1c1836]/60 p-1.5 rounded-xl border border-slate-200 dark:border-[#2d2553]/50">
            {grades.map((grade) => {
              const isActive = activeGrade === grade;
              return (
                <button
                  key={grade}
                  onClick={() => {
                    const firstCl = classesByGrade[grade]?.[0];
                    if (firstCl) {
                      setActiveClass(firstCl);
                      setSelectedLesson(null);
                      setSelectedTask(null);
                      handleResetDragDrop();
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-[#251e44]/50"
                  }`}
                >
                  {grade}
                </button>
              );
            })}
          </div>
        )}

        {/* Current User Profiler */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-[#1c1836] border border-slate-200/60 dark:border-[#2d2553]/50 rounded-xl px-3 py-1.5">
            <img 
              src={currentStudent.avatar} 
              alt={currentStudent.name} 
              className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 p-0.5"
            />
            <div className="text-center hidden sm:block">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100">{currentStudent.name}</div>
              <div className="text-[9px] text-amber-500 font-bold uppercase tracking-wider font-mono">
                {t.level} {currentStudent.level} • {currentStudent.xp} XP
              </div>
            </div>
          </div>

          {/* Language & Theme controls (moved from Settings page) */}
          <NavbarControls
            language={language}
            setLanguage={setLanguage}
            theme={theme}
            setTheme={setTheme}
          />

          <button
            onClick={onLogOut}
            className="p-2.5 bg-white dark:bg-[#1c1836] border border-slate-200 dark:border-[#2d2553]/50 hover:bg-slate-50 dark:hover:bg-[#282154] text-slate-500 dark:text-slate-400 hover:text-red-500 rounded-xl transition-all"
            title={t.logout}
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      {activeClass ? (
        <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-73px)]">
          
          {/* Workspace Tabs Side Rail */}
          <aside className="w-full md:w-64 bg-white dark:bg-[#130f26] border-r border-slate-200 dark:border-[#241c49]/80 p-4 flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible shrink-0">
            <button
              onClick={() => { setActiveTab("dashboard"); setSelectedLesson(null); setSelectedTask(null); }}
              className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === "dashboard" 
                  ? "bg-slate-100 dark:bg-[#1c1836] text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-[#2d2553]/50 shadow-xs" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1c1836]/40 hover:text-slate-800 dark:hover:text-slate-200 border border-transparent"
              }`}
            >
              <Trophy className="h-4 w-4" />
              <span>{t.lobby}</span>
            </button>

            <div>
              <button
                onClick={() => { setActiveTab("lessons"); setSelectedLesson(null); setSelectedTask(null); }}
                className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "lessons"
                    ? "bg-slate-100 dark:bg-[#1c1836] text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-[#2d2553]/50 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1c1836]/40 hover:text-slate-800 dark:hover:text-slate-200 border border-transparent"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                <span>{t.lessons}</span>
                {activeGradeClasses.length > 0 && (
                  <ChevronRight className={`h-3.5 w-3.5 ml-auto transition-transform ${activeTab === "lessons" ? "rotate-90" : ""}`} />
                )}
              </button>
              {activeTab === "lessons" && activeGradeClasses.length > 0 && (
                <div className="mt-1 ms-4 ps-3 border-s border-slate-200 dark:border-[#2d2553]/60 flex flex-col gap-1">
                  {activeGradeClasses.map((cl) => {
                    const { subject } = getGradeAndSubject(cl.name);
                    const isSelected = activeClass?.id === cl.id;
                    const clColors = getClassColors(cl.color);
                    return (
                      <button
                        key={cl.id}
                        onClick={() => { setActiveClass(cl); setSelectedLesson(null); setSelectedTask(null); handleResetDragDrop(); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? `bg-white dark:bg-[#1c1836] ${clColors.text} shadow-xs border ${clColors.border}`
                            : `text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1c1836]/40 border border-transparent`
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${clColors.bgSolid} ${isSelected ? "animate-pulse" : "opacity-60"}`} />
                        {subject}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <button
                onClick={() => { setActiveTab("tasks"); setSelectedLesson(null); setSelectedTask(null); }}
                className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "tasks"
                    ? "bg-slate-100 dark:bg-[#1c1836] text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-[#2d2553]/50 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1c1836]/40 hover:text-slate-800 dark:hover:text-slate-200 border border-transparent"
                }`}
              >
                <Award className="h-4 w-4" />
                <span>{t.assignments}</span>
                {activeGradeClasses.length > 0 && (
                  <ChevronRight className={`h-3.5 w-3.5 ml-auto transition-transform ${activeTab === "tasks" ? "rotate-90" : ""}`} />
                )}
              </button>
              {activeTab === "tasks" && activeGradeClasses.length > 0 && (
                <div className="mt-1 ms-4 ps-3 border-s border-slate-200 dark:border-[#2d2553]/60 flex flex-col gap-1">
                  {activeGradeClasses.map((cl) => {
                    const { subject } = getGradeAndSubject(cl.name);
                    const isSelected = activeClass?.id === cl.id;
                    const clColors = getClassColors(cl.color);
                    return (
                      <button
                        key={cl.id}
                        onClick={() => { setActiveClass(cl); setSelectedLesson(null); setSelectedTask(null); handleResetDragDrop(); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? `bg-white dark:bg-[#1c1836] ${clColors.text} shadow-xs border ${clColors.border}`
                            : `text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1c1836]/40 border border-transparent`
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${clColors.bgSolid} ${isSelected ? "animate-pulse" : "opacity-60"}`} />
                        {subject}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={() => { setActiveTab("chat"); setSelectedLesson(null); setSelectedTask(null); }}
              className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === "chat" 
                  ? "bg-slate-100 dark:bg-[#1c1836] text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-[#2d2553]/50 shadow-xs" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1c1836]/40 hover:text-slate-800 dark:hover:text-slate-200 border border-transparent"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>{t.peerDiscuss}</span>
            </button>

            <button
              onClick={() => { setActiveTab("ai"); setSelectedLesson(null); setSelectedTask(null); }}
              className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all relative ${
                activeTab === "ai" 
                  ? "bg-slate-100 dark:bg-[#1c1836] text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-[#2d2553]/50 shadow-xs" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1c1836]/40 hover:text-slate-800 dark:hover:text-slate-200 border border-transparent"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>{t.aiTutor}</span>
              <span className={`absolute top-1 right-2 w-2 h-2 rounded-full bg-indigo-500 animate-ping`} />
            </button>

            <button
              onClick={() => { setActiveTab("calendar"); setSelectedLesson(null); setSelectedTask(null); }}
              className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === "calendar" 
                  ? "bg-slate-100 dark:bg-[#1c1836] text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-[#2d2553]/50 shadow-xs" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1c1836]/40 hover:text-slate-800 dark:hover:text-slate-200 border border-transparent"
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>{t.calendar}</span>
            </button>

            <button
              onClick={() => { setActiveTab("settings"); setSelectedLesson(null); setSelectedTask(null); }}
              className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === "settings" 
                  ? "bg-slate-100 dark:bg-[#1c1836] text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-[#2d2553]/50 shadow-xs" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1c1836]/40 hover:text-slate-800 dark:hover:text-slate-200 border border-transparent"
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>{t.settings}</span>
            </button>
          </aside>

          {/* Active View Panel */}
          <main className="flex-1 bg-slate-50/50 dark:bg-slate-900/50 p-6 overflow-y-auto">

            
            {/* LOBBY TAB */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                
                {/* Classroom Headline Banner */}
                <div className="p-6 bg-radial from-slate-900 to-slate-950 text-white rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
                  <div className="absolute top-[-30%] right-[-10%] w-60 h-60 bg-indigo-500/10 rounded-full blur-[80px]" />
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono">Enrolled Classroom</span>
                      <h2 className="text-2xl font-extrabold font-display mt-1">{activeClass.name}</h2>
                      <p className="text-slate-400 text-xs mt-2 max-w-xl leading-relaxed">{activeClass.description}</p>
                    </div>

                    {/* XP Progress Circular Metric */}
                    <div className="flex items-center gap-4 bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl w-fit">
                      <div className="relative w-12 h-12 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="24" cy="24" r="20" fill="transparent" stroke="#334155" strokeWidth="4" />
                          <circle 
                            cx="24" 
                            cy="24" 
                            r="20" 
                            fill="transparent" 
                            stroke="#6366F1" 
                            strokeWidth="4" 
                            strokeDasharray="125.6"
                            strokeDashoffset={125.6 - (125.6 * (currentStudent.xp % 1000)) / 1000}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute font-mono font-bold text-xs text-indigo-400">
                          Lvl{currentStudent.level}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200">Alex's Standing</div>
                        <div className="text-[11px] text-amber-400 font-semibold mt-0.5">{currentStudent.xp} Total XP</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dashboard Grid Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column: Alerts & Schedules */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* Notice Board */}
                    <div className="bg-white dark:bg-[#18142c] border border-slate-200 dark:border-[#2b244c] rounded-2xl p-5 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <h3 className="text-sm font-bold font-display text-slate-800 dark:text-indigo-100 flex items-center gap-2">
                          <Bell className="h-4.5 w-4.5 text-indigo-500" /> Prof's Announcements
                        </h3>
                        
                        {/* Announcement Search Bar */}
                        <div className="relative w-full sm:w-64">
                          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search announcements..."
                            value={announcementSearch}
                            onChange={(e) => setAnnouncementSearch(e.target.value)}
                            className="w-full pl-8 pr-7 py-1.5 bg-slate-50 dark:bg-[#1c1836] border border-slate-100 dark:border-[#2b244c] focus:border-indigo-500 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-hidden"
                          />
                          {announcementSearch && (
                            <button 
                              onClick={() => setAnnouncementSearch("")}
                              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-semibold cursor-pointer"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>

                      {(() => {
                        const filteredAnnouncements = classAnnouncements.filter(ann => 
                          ann.title.toLowerCase().includes(announcementSearch.toLowerCase()) || 
                          ann.content.toLowerCase().includes(announcementSearch.toLowerCase())
                        );

                        return filteredAnnouncements.length > 0 ? (
                          <div className="space-y-4">
                            {filteredAnnouncements.map((ann) => (
                              <div key={ann.id} className="p-4 bg-slate-50 dark:bg-[#201b3a] border border-slate-100 dark:border-[#2d2553]/50 rounded-xl relative">
                                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                  {ann.title}
                                </h4>
                                <p className="text-slate-600 dark:text-slate-300 text-xs mt-1.5 leading-relaxed">{ann.content}</p>
                                <div className="text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-3 text-right">
                                  Posted by {ann.authorName} • {new Date(ann.publishedAt).toLocaleDateString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-400 text-xs text-center py-4">
                            {announcementSearch ? "No announcements match your search." : "No recent announcements in this class."}
                          </p>
                        );
                      })()}
                    </div>

                    {/* Class Schedule Calendar */}
                    <div className="bg-white dark:bg-[#18142c] border border-slate-200 dark:border-[#2b244c] rounded-2xl p-5 shadow-xs">
                      <h3 className="text-sm font-bold font-display text-slate-800 dark:text-indigo-100 flex items-center gap-2 mb-4">
                        <Calendar className="h-4.5 w-4.5 text-indigo-500" /> Classroom Calendar
                      </h3>
                      {classEvents.length > 0 ? (
                        <div className="space-y-3">
                          {classEvents.map((evt) => (
                            <div key={evt.id} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-[#201b3a] hover:bg-slate-100/50 dark:hover:bg-[#282154] rounded-xl transition-all border border-slate-100 dark:border-[#2d2553]/50">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 rounded-lg">
                                  <Clock className="h-4 w-4" />
                                </div>
                                <div className="text-left">
                                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">{evt.title}</h4>
                                  <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5">{evt.description}</p>
                                </div>
                              </div>
                              <div className="text-right text-[10px] font-mono text-indigo-600 dark:text-indigo-300 font-semibold bg-indigo-50 dark:bg-indigo-950/40 px-2 py-1 rounded-md">
                                {evt.date} • {evt.time}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 text-xs text-center py-4">No scheduled events found.</p>
                      )}
                    </div>

                  </div>

                  {/* Right Column: Class Leaderboard */}
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-[#18142c] border border-slate-200 dark:border-[#2b244c] rounded-2xl p-5 shadow-xs">
                      <h3 className="text-sm font-bold font-display text-slate-800 dark:text-indigo-100 flex items-center gap-2 mb-4">
                        <Trophy className="h-4.5 w-4.5 text-amber-500" /> Classroom Leaderboard
                      </h3>

                      <div className="space-y-2.5">
                        {classStudents.map((stud, idx) => {
                          const isSelf = stud.id === currentStudent.id;
                          return (
                            <div 
                              key={stud.id}
                              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                isSelf 
                                  ? "bg-indigo-50/50 dark:bg-[#1c1836] border-indigo-200 dark:border-indigo-800/40 shadow-xs" 
                                  : "bg-slate-50/50 dark:bg-[#201b3a] border-slate-100 dark:border-[#2d2553]/50 hover:bg-slate-50 dark:hover:bg-[#282154]"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {/* Rank Numbers styled */}
                                <div className="w-6 text-center font-mono font-black text-xs text-slate-400">
                                  {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}`}
                                </div>
                                <img
                                  src={stud.avatar}
                                  alt={stud.name}
                                  className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 p-0.5 border border-slate-200 dark:border-slate-600"
                                />
                                <div className="text-left">
                                  <div className={`text-xs font-bold ${isSelf ? "text-indigo-600 dark:text-indigo-400" : "text-slate-800 dark:text-slate-200"}`}>
                                    {stud.name} {isSelf && "(You)"}
                                  </div>
                                  <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wide font-mono mt-0.5">
                                    {stud.rank}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right font-mono text-xs font-bold text-slate-700 dark:text-[#ece9f6] bg-white dark:bg-[#1c1836] border border-slate-200/50 dark:border-[#2d2553]/50 px-2.5 py-1 rounded-lg">
                                {stud.xp} XP
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* LESSONS READER TAB */}
            {activeTab === "lessons" && (() => {
              const filteredLessons = classLessons.filter(l => 
                l.title.toLowerCase().includes(lessonSearch.toLowerCase()) || 
                l.content.toLowerCase().includes(lessonSearch.toLowerCase())
              );
              return (
                <div>
                  {!selectedLesson ? (
                    <div className="space-y-4">
                      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                        <div>
                          <h2 className="text-lg font-bold font-display text-slate-800 dark:text-indigo-100 mb-0.5">Lessons & Reading Guides</h2>
                          <p className="text-slate-400 text-xs">Review digital lecture materials and complete interactive embeds to earn XP.</p>
                        </div>
                        <span className="bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-mono font-semibold self-start md:self-center">
                          {filteredLessons.length} available
                        </span>
                      </div>

                      {/* Lesson Search Bar */}
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search lessons by title or content..."
                          value={lessonSearch}
                          onChange={(e) => setLessonSearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#18142c] border border-slate-200 dark:border-[#2b244c] focus:border-indigo-500 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-hidden"
                        />
                        {lessonSearch && (
                          <button 
                            onClick={() => setLessonSearch("")}
                            className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {filteredLessons.length === 0 ? (
                        <div className="py-12 text-center bg-white dark:bg-[#18142c] border border-slate-200 dark:border-[#2b244c] rounded-2xl">
                          <BookOpen className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                          <p className="text-xs text-slate-400 font-semibold">No lessons match your search criteria.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filteredLessons.map((les) => (
                        <div 
                          key={les.id}
                          className="bg-white dark:bg-[#18142c] border border-slate-200 dark:border-[#2b244c] p-5 rounded-2xl hover:border-indigo-400/60 shadow-xs cursor-pointer transition-all flex flex-col justify-between group"
                          onClick={() => setSelectedLesson(les)}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 px-2.5 py-1 rounded-md text-[9px] font-mono font-bold uppercase tracking-wide">
                                Module Reading
                              </span>
                              <div className="flex gap-1.5">
                                {les.videoUrl && (
                                  <span className="p-1 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded" title="Includes Video Lecture">
                                    <Video className="h-3 w-3" />
                                  </span>
                                )}
                                {les.pptUrl && (
                                  <span className="p-1 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded" title="Includes Lecture Slides">
                                    <Presentation className="h-3 w-3" />
                                  </span>
                                )}
                                {les.webUrl && (
                                  <span className="p-1 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded" title="Includes External Website">
                                    <Globe className="h-3 w-3" />
                                  </span>
                                )}
                              </div>
                            </div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-3 group-hover:text-indigo-500 transition-colors">{les.title}</h3>
                            <p className="text-slate-400 dark:text-slate-400 text-xs mt-1.5 leading-relaxed line-clamp-3">
                              {les.content.replace(/[#*`_-]/g, '')}
                            </p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#251e40] flex items-center justify-between text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                            <span>Open Lesson Guide</span>
                            <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      ))}
                        </div>
                      )}
                    </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-[#18142c] border border-slate-200 dark:border-[#2b244c] rounded-3xl p-6 md:p-8 shadow-sm space-y-6"
                  >
                    <button
                      onClick={() => setSelectedLesson(null)}
                      className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors font-semibold"
                    >
                      <ArrowLeft className="h-4 w-4" /> Back to Lessons list
                    </button>

                    <div>
                      <h2 className="text-2xl font-bold font-display text-slate-800 dark:text-slate-100 pb-2">
                        {selectedLesson.title}
                      </h2>
                      <span className="text-[10px] text-slate-400 font-semibold font-mono">
                        PUBLISHED {new Date(selectedLesson.publishedAt).toLocaleDateString()} BY {activeClass?.teacherName || "Class Instructor"}
                      </span>
                    </div>

                    <div className="prose max-w-none text-slate-700 dark:text-slate-300 text-sm leading-relaxed space-y-4 whitespace-pre-wrap border-t border-slate-100 dark:border-[#251e40] pt-4">
                      {selectedLesson.content}
                    </div>

                    {/* DETAILED INTERACTIVE MEDIA SECTION */}
                    {(selectedLesson.videoUrl || selectedLesson.pptUrl || selectedLesson.webUrl) && (
                      <div className="border-t border-slate-200/50 dark:border-[#2c2452]/40 pt-6 space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Interactive Lesson Media
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* VIDEO PLAYER */}
                          {selectedLesson.videoUrl && (
                            <div className="bg-slate-50 dark:bg-[#110d26] border border-slate-200 dark:border-[#2b244c] rounded-2xl p-4 shadow-inner flex flex-col justify-between">
                              <div>
                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2">
                                  <Video className="h-3.5 w-3.5 animate-pulse" /> Video Lecture Demonstration
                                </span>
                                <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-[#2b244c]">
                                  <iframe
                                    src={getYoutubeEmbedUrl(selectedLesson.videoUrl)}
                                    title="Video Lecture"
                                    className="absolute inset-0 w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* POWERPOINT / SLIDES SLIDESHOW */}
                          {selectedLesson.pptUrl && (
                            <div className="bg-slate-50 dark:bg-[#110d26] border border-slate-200 dark:border-[#2b244c] rounded-2xl p-4 shadow-inner flex flex-col justify-between">
                              <div>
                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">
                                  <Presentation className="h-3.5 w-3.5" /> Embedded PowerPoint Slides
                                </span>
                                <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-[#2b244c] bg-[#1c1836]">
                                  <iframe
                                    src={selectedLesson.pptUrl}
                                    title="Lesson Slides Presentation"
                                    className="absolute inset-0 w-full h-full"
                                    allowFullScreen
                                  />
                                </div>
                              </div>
                              <p className="text-[9px] text-slate-400 mt-2 font-mono text-center">Use slide controls to navigate the presentation deck.</p>
                            </div>
                          )}

                          {/* CORE WEBSITE RESOURCE */}
                          {selectedLesson.webUrl && (
                            <div className="bg-slate-50 dark:bg-[#110d26] border border-slate-200 dark:border-[#2b244c] rounded-2xl p-4 shadow-inner col-span-1 md:col-span-2">
                              <span className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">
                                <Globe className="h-3.5 w-3.5" /> Lesson Sandbox & Web Resource
                              </span>
                              
                              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white dark:bg-[#1c1836] rounded-xl border border-slate-200 dark:border-[#2b244c]">
                                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400">
                                  <Globe className="h-6 w-6" />
                                </div>
                                <div className="flex-1 text-center sm:text-left min-w-0">
                                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">
                                    {selectedLesson.webUrlTitle || "Interactive Study Lab Resource"}
                                  </h4>
                                  <p className="text-[10px] text-slate-400 dark:text-slate-450 font-semibold truncate mt-0.5">
                                    {selectedLesson.webUrl}
                                  </p>
                                </div>
                                <a
                                  href={selectedLesson.webUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
                                >
                                  Launch Interactive Sandbox <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-[#251e40] flex justify-between items-center bg-slate-50 dark:bg-[#201b3a] -mx-6 -mb-6 p-6 rounded-b-3xl">
                      <span className="text-xs text-slate-400">
                        Published by {activeClass?.teacherName || "Class Instructor"}
                      </span>
                      <button
                        onClick={() => {
                          onAddXp(25);
                          showNotification("Awesome job reading! Earned +25 Study XP!");
                          setSelectedLesson(null);
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-100 flex items-center gap-1.5 transition-all"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Mark as Read (+25 XP)
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
              );
            })()}

            {/* ASSIGNMENTS TAB */}
            {activeTab === "tasks" && (() => {
              const filteredTasks = classTasks.filter(t => 
                t.title.toLowerCase().includes(taskSearch.toLowerCase()) || 
                t.description.toLowerCase().includes(taskSearch.toLowerCase())
              );
              return (
                <div>
                  {!selectedTask ? (
                    <div className="space-y-4">
                      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                        <h2 className="text-lg font-bold font-display text-slate-800 dark:text-indigo-100 mb-2">Pending Assignments</h2>
                        <span className="bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-mono font-semibold self-start md:self-center">
                          {filteredTasks.length} available
                        </span>
                      </div>

                      {/* Assignment Search Bar */}
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search assignments by title or instructions..."
                          value={taskSearch}
                          onChange={(e) => setTaskSearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#18142c] border border-slate-200 dark:border-[#2b244c] focus:border-indigo-500 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-hidden"
                        />
                        {taskSearch && (
                          <button 
                            onClick={() => setTaskSearch("")}
                            className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {filteredTasks.length === 0 ? (
                        <div className="py-12 text-center bg-white dark:bg-[#18142c] border border-slate-200 dark:border-[#2b244c] rounded-2xl">
                          <Award className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                          <p className="text-xs text-slate-400 font-semibold">No assignments match your search criteria.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filteredTasks.map((task) => {
                        // Check if already completed
                        const submission = submissions.find(s => s.taskId === task.id && s.studentId === currentStudent.id);
                        
                        return (
                          <div 
                            key={task.id}
                            className={`p-5 rounded-2xl border transition-all ${
                              submission 
                                ? "bg-emerald-50/40 border-emerald-100 hover:border-emerald-200" 
                                : "bg-white dark:bg-[#18142c] border-slate-200 dark:border-[#2b244c] hover:border-indigo-400 dark:hover:border-indigo-500"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase ${
                                task.type === 'dragdrop' ? "bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-300" : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300"
                              }`}>
                                {task.type === 'dragdrop' ? 'Matching Game' : 'Written Essay'}
                              </span>
                              <span className="text-amber-500 font-bold text-xs font-mono flex items-center gap-0.5">
                                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" /> +{task.rewardXp} XP
                              </span>
                            </div>

                            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-3">{task.title}</h3>
                            <p className="text-slate-400 dark:text-slate-400 text-xs mt-1.5 leading-relaxed line-clamp-2">{task.description}</p>
                            
                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#251e40] flex items-center justify-between text-xs">
                              <span className="text-slate-400 dark:text-slate-500 font-mono font-semibold">
                                Due: {task.dueDate}
                              </span>
                              
                              {submission ? (
                                <div className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Handed In
                                </div>
                              ) : (
                                <button
                                  onClick={() => setSelectedTask(task)}
                                  className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                                >
                                  Complete Homework →
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                        </div>
                      )}
                    </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-[#18142c] border border-slate-200 dark:border-[#2b244c] rounded-3xl p-6 md:p-8 shadow-sm"
                  >
                    <button
                      onClick={() => { setSelectedTask(null); handleResetDragDrop(); }}
                      className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors mb-6 font-semibold"
                    >
                      <ArrowLeft className="h-4 w-4" /> Back to Homework list
                    </button>

                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-[#251e40] pb-4 mb-6">
                      <div>
                        <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-md text-[9px] font-mono font-bold uppercase">
                          Active Assignment
                        </span>
                        <h2 className="text-xl font-bold font-display text-slate-800 dark:text-slate-100 mt-2">{selectedTask.title}</h2>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-600 dark:text-amber-400 font-mono font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" /> Reward: {selectedTask.rewardXp} XP
                      </div>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed mb-6 bg-slate-50 dark:bg-[#201b3a] p-4 border border-slate-100 dark:border-[#2d2553]/50 rounded-xl">
                      <strong>Assignment Prompt:</strong> {selectedTask.description}
                    </p>

                    {/* DRAG AND DROP MATCHING CHALLENGE TYPE */}
                    {selectedTask.type === 'dragdrop' && (
                      <div className="space-y-6">
                        <div className="p-4 bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/40 rounded-2xl flex items-center gap-3">
                          <Info className="h-5 w-5 text-violet-500 shrink-0" />
                          <p className="text-[11px] text-violet-700 dark:text-violet-300 leading-relaxed">
                            <strong>Interactive Mode:</strong> Drag each technology block from the list and drop them into their matching target role category underneath. Check pairings when complete.
                          </p>
                        </div>

                        {/* Drag Items source blocks */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Technology Elements</span>
                          <div className="flex flex-wrap gap-3">
                            {(selectedTask.dragItems || []).map((dragVal) => {
                              // If already matched, we hide or styled as disabled
                              const isMatched = Object.values(matchedPairings).includes(dragVal);
                              return (
                                <div
                                  key={dragVal}
                                  draggable={!isMatched}
                                  onDragStart={() => handleDragStart(dragVal)}
                                  className={`px-4 py-2.5 rounded-xl font-bold text-xs border transition-all select-none shadow-xs ${
                                    isMatched 
                                      ? "bg-slate-100 dark:bg-[#1c1836]/60 border-slate-200 dark:border-[#251e40] text-slate-400 dark:text-slate-600 cursor-not-allowed" 
                                      : "bg-white dark:bg-[#1c1836] border-slate-200 dark:border-[#2b244c] text-slate-800 dark:text-slate-100 hover:border-indigo-400 hover:shadow-indigo-50 cursor-grab active:cursor-grabbing"
                                  }`}
                                >
                                  {dragVal}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Drop Zones container targets */}
                        <div className="space-y-3">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Target Role Categories</span>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {(selectedTask.dropZones || []).map((zoneVal) => {
                              const pairedVal = matchedPairings[zoneVal];
                              return (
                                <div
                                  key={zoneVal}
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={() => handleDrop(zoneVal)}
                                  className={`p-5 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center gap-3 min-h-[120px] transition-all ${
                                    pairedVal 
                                      ? "bg-indigo-50/30 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-500/30" 
                                      : "bg-slate-50 dark:bg-[#201b3a] border-slate-200 dark:border-[#2b244c] hover:bg-slate-100/50 dark:hover:bg-[#282154] hover:border-slate-300 dark:hover:border-indigo-500/30"
                                  }`}
                                >
                                  <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium max-w-[150px]">
                                    {zoneVal}
                                  </span>
                                  {pairedVal ? (
                                    <div className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold text-xs shadow-xs animate-bounce">
                                      {pairedVal}
                                    </div>
                                  ) : (
                                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono font-bold tracking-wider uppercase">
                                      Drop element here
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Actions feedback section */}
                        {dragDropFeedback && (
                          <div className={`p-4 rounded-xl border text-xs font-bold ${
                            dragDropFeedback.success 
                              ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400" 
                              : "bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400"
                          }`}>
                            {dragDropFeedback.text}
                          </div>
                        )}

                        <div className="flex gap-3">
                          <button
                            onClick={handleCheckDragDrop}
                            disabled={Object.keys(matchedPairings).length < (selectedTask.dropZones || []).length || dragDropFeedback?.success}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 text-white font-bold text-xs rounded-xl shadow-md disabled:shadow-none transition-all cursor-pointer"
                          >
                            Check Match Answers
                          </button>
                          <button
                            onClick={handleResetDragDrop}
                            className="px-4 py-2 bg-white dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] hover:bg-slate-50 dark:hover:bg-[#282154] text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl transition-all"
                          >
                            Reset Matching Board
                          </button>
                        </div>
                      </div>
                    )}

                    {/* WRITTEN ESSAY/TEXT ANSWER SUBMISSION TYPE */}
                    {selectedTask.type === 'text' && (
                      <form onSubmit={handleTextHomeworkSubmit} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Your Homework Answer
                          </label>
                          <textarea
                            required
                            rows={6}
                            placeholder="Type or paste your complete assignment solution here..."
                            value={homeworkText}
                            onChange={(e) => setHomeworkText(e.target.value)}
                            className="w-full p-4 bg-slate-50 dark:bg-[#201b3a] border border-slate-200 dark:border-[#2d2553]/50 focus:border-indigo-500 rounded-2xl focus:outline-hidden text-slate-700 dark:text-slate-200 text-sm leading-relaxed"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={submittingTask || !homeworkText.trim()}
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                        >
                          {submittingTask ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" /> Handing in...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4" /> Hand In Assignment (+{selectedTask.rewardXp} XP max)
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </motion.div>
                )}
              </div>
              );
            })()}

            {/* PEER DISCUSS CHAT ROOM TAB */}
            {activeTab === "chat" && (
              <div className="bg-white dark:bg-[#18142c] border border-slate-200 dark:border-[#2b244c] rounded-3xl flex flex-col h-[calc(100vh-160px)]">
                
                {/* Chat header channel summary */}
                <div className="p-4 border-b border-slate-100 dark:border-[#251e40] flex items-center justify-between bg-slate-50/50 dark:bg-[#201b3a]/50 rounded-t-3xl">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <div>
                      <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200">#{activeClass.code}-community-chat</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Discussions, peer support, and classroom greetings</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 font-mono">{classStudents.length} Active Peers</span>
                </div>

                {/* Message display thread */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  {classMessages.map((msg) => {
                    const isSelf = msg.senderId === currentStudent.id;
                    const isTeacher = msg.senderRole === 'teacher';
                    return (
                      <div 
                        key={msg.id}
                        className={`flex gap-3 max-w-xl ${isSelf ? "ml-auto flex-row-reverse text-right" : "mr-auto text-left"}`}
                      >
                        <img
                          src={msg.senderAvatar}
                          alt={msg.senderName}
                          className="w-8 h-8 rounded-full bg-slate-100 shrink-0 border border-slate-200"
                        />
                        <div>
                          <div className={`text-[10px] text-slate-400 flex items-center gap-1.5 ${isSelf ? "justify-end" : "justify-start"}`}>
                            <span className="font-bold">{msg.senderName}</span>
                            {isTeacher && (
                              <span className="bg-violet-100 text-violet-700 px-1.5 py-0.2 rounded-md font-bold text-[8px] uppercase">
                                Teacher
                              </span>
                            )}
                            <span className="font-mono text-[8px]">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className={`p-3 rounded-2xl text-xs leading-relaxed mt-1 inline-block ${
                            isSelf 
                              ? "bg-indigo-600 text-white rounded-tr-none" 
                              : isTeacher 
                                ? "bg-violet-50 dark:bg-violet-950/30 text-violet-800 dark:text-violet-300 border border-violet-100 dark:border-violet-900/40 rounded-tl-none"
                                : "bg-slate-100 dark:bg-[#201b3a] text-slate-800 dark:text-slate-200 rounded-tl-none"
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatBottomRef} />
                </div>

                {/* Chat message inputs */}
                <form onSubmit={handleSendChat} className="p-4 border-t border-slate-100 dark:border-[#251e40] bg-slate-50/50 dark:bg-[#201b3a]/50 rounded-b-3xl flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder={`Message #${activeClass.code}-community-chat...`}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-white dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-indigo-500 rounded-xl focus:outline-hidden text-xs text-slate-700 dark:text-slate-200"
                  />
                  <button
                    type="submit"
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md shadow-indigo-100 transition-all flex items-center justify-center cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>

              </div>
            )}

            {/* STUDY BUDDY AI CHAT TAB */}
            {activeTab === "ai" && (
              <div className="bg-white dark:bg-[#18142c] border border-slate-200 dark:border-[#2b244c] rounded-3xl flex flex-col h-[calc(100vh-160px)] shadow-xs">
                
                {/* AI banner */}
                <div className="p-4 border-b border-slate-100 dark:border-[#251e40] flex items-center justify-between bg-gradient-to-r from-indigo-50/80 dark:from-indigo-950/20 to-violet-50/80 dark:to-violet-950/20 rounded-t-3xl">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-gradient-to-tr from-indigo-500 to-violet-600 text-white rounded-lg shadow-sm">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-indigo-900 dark:text-indigo-100">Insyte AI Tutor</h3>
                      <p className="text-[10px] text-indigo-700 dark:text-indigo-300 mt-0.5">Personalized study feedback, homework coaching, and math check-ups</p>
                    </div>
                  </div>
                  <span className="bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                    Gemini 3.5-flash
                  </span>
                </div>

                {/* AI chat thread view */}
                <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-slate-50/20">
                  {aiChat.map((msg, idx) => {
                    const isAi = msg.role === "assistant";
                    return (
                      <div 
                        key={idx}
                        className={`flex gap-3.5 max-w-2xl ${isAi ? "mr-auto text-left" : "ml-auto flex-row-reverse text-right"}`}
                      >
                        <div className={`w-8.5 h-8.5 rounded-full flex items-center justify-center border shrink-0 ${
                          isAi 
                            ? "bg-gradient-to-tr from-indigo-500 to-violet-600 text-white border-indigo-200" 
                            : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600"
                        }`}>
                          {isAi ? <Sparkles className="h-4.5 w-4.5" /> : currentStudent.name[0]}
                        </div>
                        <div>
                          <div className={`text-[9px] text-slate-400 flex items-center gap-1.5 font-mono mb-1 ${isAi ? "justify-start" : "justify-end"}`}>
                            <span>{isAi ? "INSYTE AI TUTOR" : currentStudent.name.toUpperCase()}</span>
                          </div>

                          <div className={`p-4 rounded-2xl text-xs leading-relaxed inline-block ${
                            isAi 
                              ? "bg-white dark:bg-[#201b3a] text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-[#2d2553]/50 rounded-tl-none shadow-xs whitespace-pre-wrap" 
                              : "bg-indigo-600 text-white rounded-tr-none shadow-xs text-left"
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* AI Generating Animation */}
                  {aiLoading && (
                    <div className="flex gap-3.5 max-w-2xl mr-auto text-left">
                      <div className="w-8.5 h-8.5 rounded-full flex items-center justify-center bg-gradient-to-tr from-indigo-500 to-violet-600 text-white border border-indigo-200">
                        <Sparkles className="h-4.5 w-4.5 animate-spin" />
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-400 font-mono mb-1">INSYTE AI TUTOR</div>
                        <div className="p-4 bg-white dark:bg-[#201b3a] text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-[#2d2553]/50 rounded-2xl rounded-tl-none shadow-xs flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={aiBottomRef} />
                </div>

                {/* AI input form submission */}
                <form onSubmit={handleAskAi} className="p-4 border-t border-slate-100 dark:border-[#251e40] bg-slate-50/50 dark:bg-[#201b3a]/50 rounded-b-3xl flex gap-2">
                  <input
                    type="text"
                    required
                    disabled={aiLoading}
                    placeholder="Ask study buddy: 'How does HTML structure work?' or 'Review my open homework'"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-white dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-indigo-500 rounded-xl focus:outline-hidden text-xs text-slate-700 dark:text-slate-200 disabled:bg-slate-100 dark:disabled:bg-[#1c1836]/40"
                  />
                  <button
                    type="submit"
                    disabled={aiLoading || !aiInput.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:bg-slate-200 text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer font-bold text-xs"
                  >
                    <Send className="h-4 w-4" />
                    <span>Ask AI</span>
                  </button>
                </form>

              </div>
            )}

            {/* CALENDAR TAB */}
            {activeTab === "calendar" && (
              <InteractiveCalendar 
                classes={classes}
                tasks={tasks}
                events={events}
                submissions={submissions}
                currentStudentId={currentStudent.id}
                language={language}
              />
            )}

            {/* SETTINGS TAB */}
            {activeTab === "settings" && (
              <SettingsTab
                language={language}
                user={currentStudent}
                userRole="student"
                onLogOut={onLogOut}
              />
            )}

          </main>


        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center p-6">
          <div>
            <ShieldAlert className="h-10 w-10 text-slate-400 mx-auto" />
            <h3 className="font-bold text-slate-700 mt-3 text-sm">Not Enrolled</h3>
            <p className="text-slate-400 text-xs mt-1">You are not enrolled in any classes yet.</p>
          </div>
        </div>
      )}

    </div>
  );
};
