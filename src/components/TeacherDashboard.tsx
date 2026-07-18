import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, BookOpen, Award, Megaphone, Calendar, Users,
  CheckSquare, LogOut, CheckCircle2, ChevronRight, Info,
  Trash2, Send, Clock, Sparkles, Settings, Edit, Check, Library, Video, Presentation, Globe,
  Mail as MailLucide, Copy
} from "lucide-react";
import {
  UserProfile, ClassCommunity, Lesson, TaskItem,
  TaskSubmission, Announcement, ClassEvent,
  Mail, AppNotification
} from "../types";
import { Language, Theme, getTranslation } from "../translations";
import { InteractiveCalendar } from "./InteractiveCalendar";
import { SettingsTab } from "./SettingsTab";
import { NavbarControls } from "./NavbarControls";
import { NotificationBell, StreakBadge } from "./HeaderExtras";
import { MailPanel } from "./MailPanel";
import { getClassColors } from "../utils/colorHelper";

interface TeacherDashboardProps {
  currentTeacher: UserProfile;
  classes: ClassCommunity[];
  lessons: Lesson[];
  tasks: TaskItem[];
  announcements: Announcement[];
  events: ClassEvent[];
  submissions: TaskSubmission[];
  allStudents: UserProfile[];
  allTeachers: UserProfile[];
  mails: Mail[];
  notifications: AppNotification[];
  onLogOut: () => void;
  onCreateClass: (name: string, code: string, description: string, color?: string) => Promise<string | null>;
  onSendMail: (toId: string, subject: string, body: string) => Promise<string | null>;
  onMarkMailRead: (mailId: string) => void;
  onMarkNotificationsRead: () => void;
  onCreateLesson: (lesson: Omit<Lesson, "id" | "publishedAt">) => void;
  onUpdateLesson: (id: string, updatedFields: Partial<Lesson>) => void;
  onDeleteLesson: (id: string) => void;
  onCreateTask: (task: Omit<TaskItem, "id">) => void;
  onAddAnnouncement: (ann: Omit<Announcement, "id" | "publishedAt">) => void;
  onAddEvent: (evt: Omit<ClassEvent, "id">) => void;
  onGradeSubmission: (submissionId: string, scoreXpEarned: number, feedback: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (th: Theme) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  currentTeacher,
  classes,
  lessons,
  tasks,
  announcements,
  events,
  submissions,
  allStudents,
  allTeachers,
  mails,
  notifications,
  onLogOut,
  onCreateClass,
  onSendMail,
  onMarkMailRead,
  onMarkNotificationsRead,
  onCreateLesson,
  onUpdateLesson,
  onDeleteLesson,
  onCreateTask,
  onAddAnnouncement,
  onAddEvent,
  onGradeSubmission,
  language,
  setLanguage,
  theme,
  setTheme
}) => {
  const t = getTranslation(language);

  // Parser function to split "Class 2B - German" into grade ("Class 2B") and subject ("German")
  const getGradeAndSubject = (name: string) => {
    if (name.includes(" - ")) {
      const parts = name.split(" - ");
      return { grade: parts[0].trim(), subject: parts[1].trim() };
    }
    return { grade: name.trim(), subject: "General" };
  };

  // Selection States
  const [activeClass, setActiveClass] = useState<ClassCommunity | null>(classes[0] || null);
  const [activeSection, setActiveSection] = useState<"lobby" | "lessons" | "tasks" | "grade" | "events" | "announcements" | "calendar" | "mail" | "settings">("lobby");

  useEffect(() => {
    if (classes.length > 0) {
      if (!activeClass || !classes.some(c => c.id === activeClass.id)) {
        setActiveClass(classes[0]);
      }
    } else {
      setActiveClass(null);
    }
  }, [classes]);

  const classesByGrade: Record<string, ClassCommunity[]> = {};
  classes.forEach((cl) => {
    const { grade } = getGradeAndSubject(cl.name);
    if (!classesByGrade[grade]) {
      classesByGrade[grade] = [];
    }
    classesByGrade[grade].push(cl);
  });

  const grades = Object.keys(classesByGrade);
  const activeGrade = activeClass ? getGradeAndSubject(activeClass.name).grade : (grades[0] || "");
  const activeGradeClasses = classesByGrade[activeGrade] || [];

  // Creation Forms State toggles
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [newClassGrade, setNewClassGrade] = useState("Class 2B");
  const [newClassSubject, setNewClassSubject] = useState("");
  const [newClassCode, setNewClassCode] = useState("");
  const [newClassDesc, setNewClassDesc] = useState("");
  const [newClassColor, setNewClassColor] = useState("indigo");

  // Create Lesson states
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [lessonPptUrl, setLessonPptUrl] = useState("");
  const [lessonWebUrl, setLessonWebUrl] = useState("");
  const [lessonWebUrlTitle, setLessonWebUrlTitle] = useState("");
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  // Create Task states
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskXp, setTaskXp] = useState(100);
  const [taskDueDate, setTaskDueDate] = useState("2026-07-30");
  const [taskType, setTaskType] = useState<"text" | "dragdrop">("text");

  // Create Announcement states
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");

  // Create Event states
  const [evtTitle, setEvtTitle] = useState("");
  const [evtDesc, setEvtDesc] = useState("");
  const [evtDate, setEvtDate] = useState("2026-07-20");
  const [evtTime, setEvtTime] = useState("12:00");

  // Grading states
  const [selectedSub, setSelectedSub] = useState<TaskSubmission | null>(null);
  const [gradeXp, setGradeXp] = useState(100);
  const [gradeFeedback, setGradeFeedback] = useState("");

  // Toast notifications state
  const [notification, setNotification] = useState<{ message: string } | null>(null);
  const showNotification = (message: string) => {
    setNotification({ message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Create-class error + submitting state
  const [createClassError, setCreateClassError] = useState<string | null>(null);
  const [creatingClass, setCreatingClass] = useState(false);

  const unreadMailCount = mails.filter(m => m.toId === currentTeacher.id && !m.read).length;

  // Submit Handlers
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassGrade.trim() || !newClassSubject.trim() || !newClassCode.trim() || creatingClass) return;
    const finalClassName = `${newClassGrade.trim()} - ${newClassSubject.trim()}`;
    const codeUpper = newClassCode.trim().toUpperCase();
    setCreatingClass(true);
    setCreateClassError(null);
    const err = await onCreateClass(finalClassName, codeUpper, newClassDesc.trim(), newClassColor);
    setCreatingClass(false);
    if (err) {
      setCreateClassError(err);
      return;
    }
    setNewClassGrade("Class 2B");
    setNewClassSubject("");
    setNewClassCode("");
    setNewClassDesc("");
    setNewClassColor("indigo");
    setShowCreateClass(false);
    showNotification(`${t.classCodeTaken} ${codeUpper}`);
  };

  const handleCreateLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClass || !lessonTitle.trim() || !lessonContent.trim()) return;

    const lessonData = {
      classId: activeClass.id,
      title: lessonTitle.trim(),
      content: lessonContent.trim(),
      videoUrl: lessonVideoUrl.trim() || undefined,
      pptUrl: lessonPptUrl.trim() || undefined,
      webUrl: lessonWebUrl.trim() || undefined,
      webUrlTitle: (lessonWebUrl.trim() && lessonWebUrlTitle.trim()) ? lessonWebUrlTitle.trim() : undefined
    };

    if (editingLessonId) {
      onUpdateLesson(editingLessonId, lessonData);
      showNotification(t.lessonUpdated);
    } else {
      onCreateLesson(lessonData);
      showNotification(t.lessonPublished);
    }

    setLessonTitle("");
    setLessonContent("");
    setLessonVideoUrl("");
    setLessonPptUrl("");
    setLessonWebUrl("");
    setLessonWebUrlTitle("");
    setEditingLessonId(null);
  };

  const handleStartEditLesson = (lesson: Lesson) => {
    setLessonTitle(lesson.title);
    setLessonContent(lesson.content);
    setLessonVideoUrl(lesson.videoUrl || "");
    setLessonPptUrl(lesson.pptUrl || "");
    setLessonWebUrl(lesson.webUrl || "");
    setLessonWebUrlTitle(lesson.webUrlTitle || "");
    setEditingLessonId(lesson.id);
    setActiveSection("lessons");
  };

  const handleCancelEditLesson = () => {
    setLessonTitle("");
    setLessonContent("");
    setLessonVideoUrl("");
    setLessonPptUrl("");
    setLessonWebUrl("");
    setLessonWebUrlTitle("");
    setEditingLessonId(null);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClass || !taskTitle.trim() || !taskDesc.trim()) return;

    if (taskType === "dragdrop") {
      // Create a predefined standard Matching Game task
      onCreateTask({
        classId: activeClass.id,
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        rewardXp: taskXp,
        dueDate: taskDueDate,
        type: "dragdrop",
        dragItems: ["HTML", "CSS", "JavaScript"],
        dropZones: ["Structures Document Skeleton", "Defines Layout & Colors", "Implements Live Interactivity"],
        correctPairing: {
          "CSS": "Defines Layout & Colors",
          "HTML": "Structures Document Skeleton",
          "JavaScript": "Implements Live Interactivity"
        }
      });
    } else {
      onCreateTask({
        classId: activeClass.id,
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        rewardXp: taskXp,
        dueDate: taskDueDate,
        type: "text"
      });
    }

    setTaskTitle("");
    setTaskDesc("");
    setTaskXp(100);
    showNotification(t.assignmentPublished);
  };

  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClass || !annTitle.trim() || !annContent.trim()) return;
    onAddAnnouncement({
      classId: activeClass.id,
      title: annTitle.trim(),
      content: annContent.trim(),
      authorName: currentTeacher.name
    });
    setAnnTitle("");
    setAnnContent("");
    showNotification(t.announcementPosted);
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClass || !evtTitle.trim()) return;
    onAddEvent({
      classId: activeClass.id,
      title: evtTitle.trim(),
      description: evtDesc.trim(),
      date: evtDate,
      time: evtTime
    });
    setEvtTitle("");
    setEvtDesc("");
    showNotification(t.eventScheduled);
  };

  const handleGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    onGradeSubmission(selectedSub.id, gradeXp, gradeFeedback.trim());
    setSelectedSub(null);
    setGradeFeedback("");
    showNotification(t.submissionGraded);
  };

  // Filter lists based on selected class
  const classLessons = lessons.filter(l => l.classId === activeClass?.id);
  const classTasks = tasks.filter(t => t.classId === activeClass?.id);
  const classAnnouncements = announcements.filter(a => a.classId === activeClass?.id);
  const classEvents = events.filter(e => e.classId === activeClass?.id);
  const classSubmissions = submissions.filter(s => classTasks.some(t => t.id === s.taskId));
  const classStudents = allStudents.filter(s => activeClass?.studentIds?.includes(s.id) ?? false);

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

      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-white dark:bg-[#130f26] border-b border-slate-200 dark:border-[#241c49]/80 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-600 text-white rounded-xl shadow-md">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-50">insyte</h1>
            <p className="text-slate-400 text-[10px] uppercase font-mono tracking-widest font-bold">{t.teacherPortal}</p>
          </div>
        </div>

        {/* Selected Classroom Picker (Grade & Subject Subcategories) */}
        <div className="flex items-center gap-3">
          {grades.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#1a1532]/60 p-1.5 rounded-xl border border-slate-200 dark:border-[#2d2553]/50">
              {/* Grade Selector (e.g. Class 2B) */}
              <div className="flex items-center gap-1">
                {grades.map((grade) => {
                  const isActive = activeGrade === grade;
                  return (
                    <button
                      key={grade}
                      onClick={() => {
                        const firstCl = classesByGrade[grade]?.[0];
                        if (firstCl) {
                          setActiveClass(firstCl);
                          setSelectedSub(null);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-violet-600 text-white shadow-xs"
                          : "text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-[#251e44]/50"
                      }`}
                    >
                      {grade}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            onClick={() => setShowCreateClass(true)}
            className="p-2 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 border border-violet-100 dark:border-violet-900 rounded-xl hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-all cursor-pointer"
            title={t.createClass}
          >
            <Plus className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Teacher Profile & Logout */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-[#1c1836] border border-slate-200/60 dark:border-[#2d2553]/50 rounded-xl px-3 py-1.5">
            <img
              src={currentTeacher.avatar}
              alt={currentTeacher.name}
              className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 p-0.5 border border-violet-200 dark:border-violet-800"
            />
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100">{currentTeacher.name}</div>
              <div className="text-[9px] text-violet-600 dark:text-violet-400 font-bold uppercase tracking-wider font-mono">
                {currentTeacher.rank}
              </div>
            </div>
          </div>

          {/* Daily streak + notifications */}
          <StreakBadge streak={currentTeacher.streak} label={t.streakLabel} />
          <NotificationBell
            notifications={notifications}
            onMarkAllRead={onMarkNotificationsRead}
            emptyLabel={t.noNotifications}
            title={t.notificationsTitle}
            markReadLabel={t.markAllRead}
          />

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

      {/* Main Content Body */}
      {activeClass ? (
        <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-73px)]">
          
          {/* Workspace Rails */}
          <aside className="w-full md:w-64 bg-white dark:bg-[#130f26] border-r border-slate-200 dark:border-[#241c49]/80 p-4 flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible shrink-0">
            <button
              onClick={() => { setActiveSection("lobby"); setSelectedSub(null); }}
              className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeSection === "lobby" 
                  ? "bg-slate-100 dark:bg-[#1c1836] text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-[#2d2553]/50 shadow-xs" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1c1836]/40 hover:text-slate-800 dark:hover:text-slate-200 border border-transparent"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>{t.roster}</span>
            </button>

            <button
              onClick={() => { setActiveSection("lessons"); setSelectedSub(null); }}
              className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeSection === "lessons" 
                  ? "bg-slate-100 dark:bg-[#1c1836] text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-[#2d2553]/50 shadow-xs" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1c1836]/40 hover:text-slate-800 dark:hover:text-slate-200 border border-transparent"
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>{t.createLesson}</span>
            </button>

            <button
              onClick={() => { setActiveSection("tasks"); setSelectedSub(null); }}
              className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeSection === "tasks" 
                  ? "bg-slate-100 dark:bg-[#1c1836] text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-[#2d2553]/50 shadow-xs" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1c1836]/40 hover:text-slate-800 dark:hover:text-slate-200 border border-transparent"
              }`}
            >
              <Award className="h-4 w-4" />
              <span>{t.postAssignment}</span>
            </button>

            <button
              onClick={() => { setActiveSection("grade"); setSelectedSub(null); }}
              className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all relative ${
                activeSection === "grade" 
                  ? "bg-slate-100 dark:bg-[#1c1836] text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-[#2d2553]/50 shadow-xs" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1c1836]/40 hover:text-slate-800 dark:hover:text-slate-200 border border-transparent"
              }`}
            >
              <CheckSquare className="h-4 w-4" />
              <span>{t.gradeHomework}</span>
              {classSubmissions.filter(s => !s.isGraded).length > 0 && (
                <span className="absolute top-3 right-3 bg-red-500 text-white font-mono font-bold text-[8px] h-4 w-4 rounded-full flex items-center justify-center">
                  {classSubmissions.filter(s => !s.isGraded).length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveSection("events"); setSelectedSub(null); }}
              className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeSection === "events" 
                  ? "bg-slate-100 dark:bg-[#1c1836] text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-[#2d2553]/50 shadow-xs" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1c1836]/40 hover:text-slate-800 dark:hover:text-slate-200 border border-transparent"
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>{t.scheduleEvent}</span>
            </button>

            <button
              onClick={() => { setActiveSection("announcements"); setSelectedSub(null); }}
              className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeSection === "announcements" 
                  ? "bg-slate-100 dark:bg-[#1c1836] text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-[#2d2553]/50 shadow-xs" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1c1836]/40 hover:text-slate-800 dark:hover:text-slate-200 border border-transparent"
              }`}
            >
              <Megaphone className="h-4 w-4" />
              <span>{t.announcements}</span>
            </button>

            <button
              onClick={() => { setActiveSection("calendar"); setSelectedSub(null); }}
              className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeSection === "calendar" 
                  ? "bg-slate-100 dark:bg-[#1c1836] text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-[#2d2553]/50 shadow-xs" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1c1836]/40 hover:text-slate-800 dark:hover:text-slate-200 border border-transparent"
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>{t.calendar}</span>
            </button>

            <button
              onClick={() => { setActiveSection("mail"); setSelectedSub(null); }}
              className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeSection === "mail"
                  ? "bg-slate-100 dark:bg-[#1c1836] text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-[#2d2553]/50 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1c1836]/40 hover:text-slate-800 dark:hover:text-slate-200 border border-transparent"
              }`}
            >
              <MailLucide className="h-4 w-4" />
              <span>{t.mailTab}</span>
              {unreadMailCount > 0 && (
                <span className="ml-auto min-w-4.5 h-4.5 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadMailCount}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveSection("settings"); setSelectedSub(null); }}
              className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeSection === "settings" 
                  ? "bg-slate-100 dark:bg-[#1c1836] text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-[#2d2553]/50 shadow-xs" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1c1836]/40 hover:text-slate-800 dark:hover:text-slate-200 border border-transparent"
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>{t.settings}</span>
            </button>
          </aside>

          {/* Active Workspace View */}
          <main className="flex-1 bg-slate-50/50 dark:bg-slate-900/50 p-6 overflow-y-auto">

            
            {/* STUDENT ROSTER VIEW */}
            {activeSection === "lobby" && (
              <div className="space-y-6">
                <div className="p-5 bg-white dark:bg-[#130f26] border border-slate-200 dark:border-[#241c49]/80 rounded-2xl">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 font-display">{t.roster} — {activeClass.name}</h2>
                      <p className="text-slate-400 text-xs mt-1">{t.rosterSubtitle}</p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(activeClass.code);
                        showNotification(`${t.classCodeTaken} ${activeClass.code}`);
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-500/20 rounded-xl cursor-pointer hover:bg-violet-100 dark:hover:bg-violet-950/50 transition-all"
                      title={t.shareCodeHint}
                    >
                      <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wider">{t.classCode}</span>
                      <span className="font-mono font-extrabold text-sm text-violet-700 dark:text-violet-300 tracking-widest">{activeClass.code}</span>
                      <Copy className="h-3.5 w-3.5 text-violet-400" />
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classStudents.map((stud) => (
                      <div key={stud.id} className="p-4 bg-slate-50 dark:bg-[#1c1836] border border-slate-100 dark:border-[#2b244c]/60 rounded-xl flex items-center gap-3">
                        <img
                          src={stud.avatar}
                          alt={stud.name}
                          className="w-10 h-10 rounded-full bg-white dark:bg-[#1c1836] p-0.5 border border-slate-200 dark:border-[#2b244c]"
                        />
                        <div>
                          <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">{stud.name}</h4>
                          <p className="text-[10px] text-slate-400 font-semibold">{stud.email}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-350 px-1.5 py-0.5 rounded-md font-mono text-[9px] font-bold">
                              {t.level} {stud.level}
                            </span>
                            <span className="text-amber-500 font-bold font-mono text-[10px]">{stud.xp} XP</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* CREATE & MANAGE LESSONS VIEW */}
            {activeSection === "lessons" && (
              <div className="space-y-6">
                {/* Subject Classroom Picker */}
                {activeGradeClasses.length > 0 && (
                  <div className="bg-white dark:bg-[#130f26] border border-slate-200 dark:border-[#241c49]/80 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-left">
                      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">{t.selectSubject}</h3>
                      <p className="text-[10px] text-slate-400 font-semibold">{t.filterLessonsBySubject}</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#1a1532]/60 p-1.5 rounded-xl border border-slate-200 dark:border-[#2d2553]/50 overflow-x-auto">
                      {activeGradeClasses.map((cl) => {
                        const { subject } = getGradeAndSubject(cl.name);
                        const isSelected = activeClass?.id === cl.id;
                        const clColors = getClassColors(cl.color);
                        return (
                          <button
                            key={cl.id}
                            onClick={() => {
                              setActiveClass(cl);
                              setSelectedSub(null);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? `bg-white dark:bg-[#1c1836] ${clColors.text} shadow-xs border ${clColors.border}`
                                : `text-slate-600 dark:text-slate-350 ${clColors.textHover}`
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${clColors.bgSolid} ${isSelected ? "animate-pulse" : "opacity-60"}`} />
                            {subject}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Form column (Left) */}
                <div className="lg:col-span-7 bg-white dark:bg-[#130f26] border border-slate-200 dark:border-[#241c49]/80 p-6 rounded-2xl shadow-xs h-fit">
                  <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 font-display mb-1 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-violet-600 dark:text-violet-450" /> 
                    {editingLessonId ? t.editLessonGuide : t.publishClassLesson}
                  </h2>
                  <p className="text-slate-400 text-xs mb-6">
                    {editingLessonId ? t.editLessonSubtitle : t.publishLessonSubtitle}
                  </p>

                  <form onSubmit={handleCreateLesson} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t.lessonTitle}</label>
                      <input
                        type="text"
                        required
                        placeholder={t.lessonTitlePlaceholder}
                        value={lessonTitle}
                        onChange={(e) => setLessonTitle(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-xl focus:outline-hidden text-xs text-slate-700 dark:text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t.lessonContent}</label>
                      <textarea
                        required
                        rows={8}
                        placeholder={t.lessonContentPlaceholder}
                        value={lessonContent}
                        onChange={(e) => setLessonContent(e.target.value)}
                        className="w-full p-4 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-xl focus:outline-hidden text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-mono"
                      />
                    </div>

                    {/* MULTIMEDIA UPLOAD OPTIONS */}
                    <div className="p-4 bg-slate-50 dark:bg-[#181432] rounded-xl border border-slate-200 dark:border-[#251e44] space-y-3">
                      <span className="text-[10px] font-bold text-violet-600 dark:text-violet-450 uppercase tracking-wider block">
                        {t.interactiveMediaEmbeds}
                      </span>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 mb-1">{t.youtubeVideoUrl}</label>
                          <input
                            type="url"
                            placeholder="e.g., https://www.youtube.com/embed/..."
                            value={lessonVideoUrl}
                            onChange={(e) => setLessonVideoUrl(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-lg focus:outline-hidden text-[11px] text-slate-700 dark:text-slate-200"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 mb-1">{t.powerpointUrl}</label>
                          <input
                            type="url"
                            placeholder="e.g., https://docs.google.com/presentation/..."
                            value={lessonPptUrl}
                            onChange={(e) => setLessonPptUrl(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-lg focus:outline-hidden text-[11px] text-slate-700 dark:text-slate-200"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 mb-1">{t.externalWebUrl}</label>
                          <input
                            type="url"
                            placeholder="e.g., https://eyes.nasa.gov"
                            value={lessonWebUrl}
                            onChange={(e) => setLessonWebUrl(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-lg focus:outline-hidden text-[11px] text-slate-700 dark:text-slate-200"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 mb-1">{t.webLinkLabel}</label>
                          <input
                            type="text"
                            placeholder={t.webLinkLabelPlaceholder}
                            value={lessonWebUrlTitle}
                            onChange={(e) => setLessonWebUrlTitle(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-lg focus:outline-hidden text-[11px] text-slate-700 dark:text-slate-200"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        {editingLessonId ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {editingLessonId ? t.saveChanges : t.publishLesson}
                      </button>

                      {editingLessonId && (
                        <button
                          type="button"
                          onClick={handleCancelEditLesson}
                          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#201b44] dark:hover:bg-[#2c265c] text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                        >
                          {t.cancelEdit}
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Lessons list column (Right) */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  <div className="bg-white dark:bg-[#130f26] border border-slate-200 dark:border-[#241c49]/80 p-5 rounded-2xl shadow-xs">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-display mb-1 flex items-center gap-2">
                      <Library className="h-4.5 w-4.5 text-violet-500" /> {t.currentlyPublished} ({classLessons.length})
                    </h3>
                    <p className="text-slate-400 text-[11px] mb-4">{t.manageLessonsDesc} {activeClass.name}.</p>

                    {classLessons.length === 0 ? (
                      <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-[#2c2452]/40 rounded-xl">
                        <BookOpen className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 font-semibold">{t.noLessonsYet}</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                        {classLessons.map((les) => (
                          <div 
                            key={les.id}
                            className={`p-4 rounded-xl border transition-all ${
                              editingLessonId === les.id
                                ? "bg-violet-50/50 dark:bg-violet-950/20 border-violet-500/50 dark:border-violet-500/40"
                                : "bg-slate-50 hover:bg-slate-100/70 dark:bg-[#1a1538]/50 dark:hover:bg-[#211b47]/70 border-slate-200/60 dark:border-[#2c2452]/40"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 leading-tight">
                                  {les.title}
                                </h4>
                                <p className="text-[9px] text-slate-400 mt-1 font-semibold">
                                  {t.publishedLabel} {new Date(les.publishedAt).toLocaleDateString()}
                                </p>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => handleStartEditLesson(les)}
                                  className="p-1.5 text-slate-500 hover:text-violet-600 hover:bg-violet-50 dark:text-slate-400 dark:hover:text-violet-450 dark:hover:bg-violet-950/40 rounded-lg transition-colors cursor-pointer"
                                  title={t.editLesson}
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(t.deleteLessonConfirm)) {
                                      onDeleteLesson(les.id);
                                      showNotification(t.lessonDeleted);
                                      if (editingLessonId === les.id) {
                                        handleCancelEditLesson();
                                      }
                                    }
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                  title={t.deleteLesson}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* EXCERPT */}
                            <p className="text-slate-400 dark:text-slate-350 text-[10px] mt-2 line-clamp-2 leading-relaxed">
                              {les.content.replace(/[#*`_-]/g, "")}
                            </p>

                            {/* ATTACHMENTS BADGES */}
                            {(les.videoUrl || les.pptUrl || les.webUrl) && (
                              <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-slate-200/40 dark:border-[#2c2452]/30">
                                {les.videoUrl && (
                                  <span className="flex items-center gap-1 bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded-md text-[9px] font-bold">
                                    <Video className="h-2.5 w-2.5" /> {t.video}
                                  </span>
                                )}
                                {les.pptUrl && (
                                  <span className="flex items-center gap-1 bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-md text-[9px] font-bold">
                                    <Presentation className="h-2.5 w-2.5" /> {t.slides}
                                  </span>
                                )}
                                {les.webUrl && (
                                  <span className="flex items-center gap-1 bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-md text-[9px] font-bold">
                                    <Globe className="h-2.5 w-2.5" /> {les.webUrlTitle || t.webLink}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              </div>
            )}

            {/* POST HOMEWORK ASSIGNMENT VIEW */}
            {activeSection === "tasks" && (
              <div className="space-y-6">
                {/* Subject Classroom Picker */}
                {activeGradeClasses.length > 0 && (
                  <div className="bg-white dark:bg-[#130f26] border border-slate-200 dark:border-[#241c49]/80 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-left">
                      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">{t.selectSubject}</h3>
                      <p className="text-[10px] text-slate-400 font-semibold">{t.filterAssignmentsBySubject}</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#1a1532]/60 p-1.5 rounded-xl border border-slate-200 dark:border-[#2d2553]/50 overflow-x-auto">
                      {activeGradeClasses.map((cl) => {
                        const { subject } = getGradeAndSubject(cl.name);
                        const isSelected = activeClass?.id === cl.id;
                        const clColors = getClassColors(cl.color);
                        return (
                          <button
                            key={cl.id}
                            onClick={() => {
                              setActiveClass(cl);
                              setSelectedSub(null);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? `bg-white dark:bg-[#1c1836] ${clColors.text} shadow-xs border ${clColors.border}`
                                : `text-slate-600 dark:text-slate-350 ${clColors.textHover}`
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${clColors.bgSolid} ${isSelected ? "animate-pulse" : "opacity-60"}`} />
                            {subject}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="max-w-3xl bg-white dark:bg-[#130f26] border border-slate-200 dark:border-[#241c49]/80 p-6 rounded-2xl shadow-xs">
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 font-display mb-1 flex items-center gap-2">
                  <Award className="h-5 w-5 text-violet-600 dark:text-violet-450" /> {t.publishHomeworkTask}
                </h2>
                <p className="text-slate-400 text-xs mb-6">{t.publishTaskSubtitle}</p>

                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t.taskTitle}</label>
                      <input
                        type="text"
                        required
                        placeholder={t.assignmentTitlePlaceholder}
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-xl focus:outline-hidden text-xs text-slate-700 dark:text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t.challengeType}</label>
                      <select
                        value={taskType}
                        onChange={(e) => setTaskType(e.target.value as "text" | "dragdrop")}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-xl focus:outline-hidden text-xs text-slate-700 dark:text-slate-200 font-semibold"
                      >
                        <option value="text">{t.essay}</option>
                        <option value="dragdrop">{t.interactiveMatcherGame}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t.taskDescription}</label>
                    <textarea
                      required
                      rows={4}
                      placeholder={t.taskDescriptionPlaceholder}
                      value={taskDesc}
                      onChange={(e) => setTaskDesc(e.target.value)}
                      className="w-full p-4 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-xl focus:outline-hidden text-xs text-slate-700 dark:text-slate-200 leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t.xpReward}</label>
                      <input
                        type="number"
                        required
                        min={10}
                        max={1000}
                        value={taskXp}
                        onChange={(e) => setTaskXp(Number(e.target.value))}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-xl focus:outline-hidden text-xs text-slate-700 dark:text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t.dueDate}</label>
                      <input
                        type="date"
                        required
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-xl focus:outline-hidden text-xs text-slate-700 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  {taskType === "dragdrop" && (
                    <div className="p-4 bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/60 rounded-2xl flex items-center gap-3">
                      <Sparkles className="h-5 w-5 text-violet-600 shrink-0" />
                      <p className="text-[11px] text-violet-700 dark:text-violet-300 leading-relaxed">
                        <strong>{t.previewMatchingTitle}</strong> {t.previewMatchingBody1} <em>['HTML', 'CSS', 'JavaScript']</em> {t.previewMatchingBody2} <em>['Document Skeleton', 'Layout & Colors', 'Live Interactivity']</em> {t.previewMatchingBody3}
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl shadow-md shadow-violet-100 dark:shadow-none transition-all cursor-pointer"
                  >
                    {t.publishAssignment}
                  </button>
                </form>
              </div>
              </div>
            )}

            {/* GRADE HOMEWORK SUBMISSIONS VIEW */}
            {activeSection === "grade" && (
              <div className="space-y-6">
                {/* Subject Classroom Picker */}
                {activeGradeClasses.length > 0 && (
                  <div className="bg-white dark:bg-[#130f26] border border-slate-200 dark:border-[#241c49]/80 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-left">
                      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">{t.selectSubject}</h3>
                      <p className="text-[10px] text-slate-400 font-semibold">{t.filterSubmissionsBySubject}</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#1a1532]/60 p-1.5 rounded-xl border border-slate-200 dark:border-[#2d2553]/50 overflow-x-auto">
                      {activeGradeClasses.map((cl) => {
                        const { subject } = getGradeAndSubject(cl.name);
                        const isSelected = activeClass?.id === cl.id;
                        const clColors = getClassColors(cl.color);
                        return (
                          <button
                            key={cl.id}
                            onClick={() => {
                              setActiveClass(cl);
                              setSelectedSub(null);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? `bg-white dark:bg-[#1c1836] ${clColors.text} shadow-xs border ${clColors.border}`
                                : `text-slate-600 dark:text-slate-350 ${clColors.textHover}`
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${clColors.bgSolid} ${isSelected ? "animate-pulse" : "opacity-60"}`} />
                            {subject}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {!selectedSub ? (
                  <div className="bg-white dark:bg-[#130f26] border border-slate-200 dark:border-[#241c49]/80 rounded-2xl p-5 shadow-xs">
                    <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 font-display">{t.studentSubmissions}</h2>
                    <p className="text-slate-400 text-xs mt-1">{t.gradeSubtitle}</p>

                    <div className="mt-4 space-y-3">
                      {classSubmissions.length > 0 ? (
                        classSubmissions.map((sub) => {
                          const task = tasks.find(t => t.id === sub.taskId);
                          return (
                            <div 
                              key={sub.id}
                              className="p-4 bg-slate-50 dark:bg-[#1c1836] border border-slate-100 dark:border-[#2b244c]/60 hover:border-slate-200 dark:hover:border-indigo-500/50 rounded-xl flex items-center justify-between transition-all cursor-pointer"
                              onClick={() => {
                                setSelectedSub(sub);
                                setGradeXp(task?.rewardXp || 100);
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <img
                                  src={sub.studentAvatar}
                                  alt={sub.studentName}
                                  className="w-9 h-9 rounded-full bg-white dark:bg-[#1c1836] p-0.5 border border-slate-200 dark:border-[#2b244c]"
                                />
                                <div className="text-left">
                                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">{sub.studentName}</h4>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{t.taskLabel} {sub.taskTitle}</p>
                                </div>
                              </div>

                              <div className="text-right">
                                {sub.isGraded ? (
                                  <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border border-emerald-100 dark:border-[#2d2553]/50 font-bold text-[10px] px-2.5 py-1 rounded-lg">
                                    {t.graded} (+{sub.scoreXpEarned} XP)
                                  </span>
                                ) : (
                                  <span className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-450 border border-amber-100 dark:border-[#2d2553]/50 font-bold text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1">
                                    {t.needsReview}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-slate-400 text-xs text-center py-6">{t.noSubmissionsFound}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-[#130f26] border border-slate-200 dark:border-[#241c49]/80 rounded-2xl p-6 shadow-sm"
                  >
                    <button
                      onClick={() => setSelectedSub(null)}
                      className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100 transition-colors mb-6 font-semibold cursor-pointer"
                    >
                      ← {t.backToSubmissions}
                    </button>

                    <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 font-display">
                      {t.gradeSubmissionFor} {selectedSub.studentName}
                    </h2>
                    <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                      {t.assignmentLabel} {selectedSub.taskTitle}
                    </span>

                    <div className="my-6 p-4 bg-slate-50 dark:bg-[#1c1836] border border-slate-100 dark:border-[#2b244c]/60 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">{t.submittedContent}</span>
                      <p className="text-slate-750 dark:text-slate-200 text-xs leading-relaxed whitespace-pre-wrap font-mono">
                        {selectedSub.content.startsWith("{") ? (
                          // Renders nicely if matching cards JSON format
                          Object.entries(JSON.parse(selectedSub.content)).map(([key, val]) => (
                            <div key={key} className="py-1">
                              <strong>{key}:</strong> {val as string} ✅
                            </div>
                          ))
                        ) : (
                          selectedSub.content
                        )}
                      </p>
                    </div>

                    {selectedSub.isGraded ? (
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-850 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 rounded-xl text-xs space-y-1">
                        <div className="font-bold">✓ {t.approvedGraded}</div>
                        <div>{t.xpAwarded} {selectedSub.scoreXpEarned} XP</div>
                        {selectedSub.feedback && <div>{t.feedbackGiven} "{selectedSub.feedback}"</div>}
                      </div>
                    ) : (
                      <form onSubmit={handleGradeSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t.awardXpPoints}</label>
                            <input
                              type="number"
                              required
                              value={gradeXp}
                              onChange={(e) => setGradeXp(Number(e.target.value))}
                              className="w-full px-4 py-2 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-xl focus:outline-hidden text-xs text-slate-700 dark:text-slate-200"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t.teacherFeedback}</label>
                          <textarea
                            rows={3}
                            placeholder={t.feedbackPlaceholder}
                            value={gradeFeedback}
                            onChange={(e) => setGradeFeedback(e.target.value)}
                            className="w-full p-4 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-xl focus:outline-hidden text-xs text-slate-700 dark:text-slate-200"
                          />
                        </div>

                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="h-4 w-4" /> {t.approveAwardXp}
                        </button>
                      </form>
                    )}
                  </motion.div>
                )}
              </div>
            )}

            {/* SCHEDULE CALENDAR EVENT VIEW */}
            {activeSection === "events" && (
              <div className="max-w-3xl bg-white dark:bg-[#130f26] border border-slate-200 dark:border-[#241c49]/80 p-6 rounded-2xl shadow-xs">
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 font-display mb-1 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-violet-600 dark:text-violet-450" /> {t.scheduleClassEvent}
                </h2>
                <p className="text-slate-400 text-xs mb-6">{t.scheduleEventSubtitle}</p>

                <form onSubmit={handleAddEvent} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t.eventTitle}</label>
                    <input
                      type="text"
                      required
                      placeholder={t.eventTitlePlaceholder}
                      value={evtTitle}
                      onChange={(e) => setEvtTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-xl focus:outline-hidden text-xs text-slate-700 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t.eventDescription}</label>
                    <input
                      type="text"
                      placeholder={t.eventDescPlaceholder}
                      value={evtDesc}
                      onChange={(e) => setEvtDesc(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-xl focus:outline-hidden text-xs text-slate-700 dark:text-slate-200"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t.date}</label>
                      <input
                        type="date"
                        required
                        value={evtDate}
                        onChange={(e) => setEvtDate(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-xl focus:outline-hidden text-xs text-slate-700 dark:text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t.time}</label>
                      <input
                        type="time"
                        required
                        value={evtTime}
                        onChange={(e) => setEvtTime(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-xl focus:outline-hidden text-xs text-slate-700 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl shadow-md shadow-violet-100 dark:shadow-none transition-all cursor-pointer"
                  >
                    {t.scheduleEvent}
                  </button>
                </form>
              </div>
            )}

            {/* BROADCAST ANNOUNCEMENTS VIEW */}
            {activeSection === "announcements" && (
              <div className="max-w-3xl bg-white dark:bg-[#130f26] border border-slate-200 dark:border-[#241c49]/80 p-6 rounded-2xl shadow-xs">
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 font-display mb-1 flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-violet-600 dark:text-violet-450" /> {t.broadcastAnnouncement}
                </h2>
                <p className="text-slate-400 text-xs mb-6">{t.announcementSubtitle}</p>

                <form onSubmit={handleAddAnnouncement} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t.announcementTitle}</label>
                    <input
                      type="text"
                      required
                      placeholder={t.announcementTitlePlaceholder}
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-xl focus:outline-hidden text-xs text-slate-700 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t.messageContent}</label>
                    <textarea
                      required
                      rows={5}
                      placeholder={t.messageContentPlaceholder}
                      value={annContent}
                      onChange={(e) => setAnnContent(e.target.value)}
                      className="w-full p-4 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-xl focus:outline-hidden text-xs text-slate-700 dark:text-slate-200 leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl shadow-md shadow-violet-100 dark:shadow-none transition-all cursor-pointer"
                  >
                    {t.broadcastNews}
                  </button>
                </form>
              </div>
            )}

            {/* CALENDAR VIEW */}
            {activeSection === "calendar" && (
              <InteractiveCalendar 
                classes={classes}
                tasks={classTasks}
                events={classEvents}
                submissions={submissions}
                language={language}
              />
            )}

            {/* MAIL VIEW */}
            {activeSection === "mail" && (
              <MailPanel
                currentUser={currentTeacher}
                mails={mails}
                contacts={[
                  ...allStudents.filter(s =>
                    classes.some(c => c.teacherId === currentTeacher.id && c.studentIds.includes(s.id))
                  ),
                  ...allTeachers.filter(te => te.id !== currentTeacher.id)
                ]}
                onSendMail={onSendMail}
                onMarkMailRead={onMarkMailRead}
                language={language}
              />
            )}

            {/* SETTINGS VIEW */}
            {activeSection === "settings" && (
              <SettingsTab
                language={language}
                user={currentTeacher}
                userRole="teacher"
                onLogOut={onLogOut}
              />
            )}

          </main>


        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-[#0b081a] min-h-[50vh]">
          <div className="p-4 bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 rounded-2xl mb-4 animate-pulse">
            <Users className="h-8 w-8" />
          </div>
          <p className="text-slate-700 dark:text-slate-300 font-bold text-sm">{t.noActiveClassroom}</p>
          <p className="text-slate-400 text-xs mt-1 max-w-xs">{t.noClassroomDesc}</p>
          <button
            onClick={() => setShowCreateClass(true)}
            className="mt-5 inline-flex items-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            <Plus className="h-4 w-4" /> {t.createClassCommunity}
          </button>
        </div>
      )}

      {/* CREATE CLASS DIALOG POPUP */}
      {showCreateClass && (
        <div className="fixed inset-0 z-50 bg-[#06040f]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#130f26] border border-slate-200 dark:border-[#241c49]/80 rounded-2xl p-6 shadow-xl relative">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm font-display mb-1">{t.createClassCommunity}</h3>
            <p className="text-slate-400 text-[11px] mb-4">{t.createClassSubtitle}</p>

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t.classGrade}</label>
                  <input
                    type="text"
                    required
                    placeholder={t.classGradePlaceholder}
                    value={newClassGrade}
                    onChange={(e) => setNewClassGrade(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-xl focus:outline-hidden text-xs dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t.subject}</label>
                  <input
                    type="text"
                    required
                    placeholder={t.subjectPlaceholder}
                    value={newClassSubject}
                    onChange={(e) => setNewClassSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-xl focus:outline-hidden text-xs dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t.classCode}</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder={t.classCodePlaceholder}
                    value={newClassCode}
                    onChange={(e) => setNewClassCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-xl focus:outline-hidden text-xs dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t.themeColor}</label>
                  <div className="flex items-center gap-1.5 h-[34px]">
                    {[
                      { key: "emerald", bg: "bg-emerald-500", ring: "ring-emerald-400" },
                      { key: "violet", bg: "bg-violet-500", ring: "ring-violet-400" },
                      { key: "amber", bg: "bg-amber-500", ring: "ring-amber-400" },
                      { key: "blue", bg: "bg-blue-500", ring: "ring-blue-400" },
                      { key: "indigo", bg: "bg-indigo-500", ring: "ring-indigo-400" }
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setNewClassColor(item.key)}
                        className={`w-6 h-6 rounded-full ${item.bg} transition-all cursor-pointer ${
                          newClassColor === item.key 
                            ? `ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#130f26] ${item.ring} scale-110` 
                            : "opacity-75 hover:opacity-100"
                        }`}
                        title={item.key}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t.shortDescription}</label>
                <input
                  type="text"
                  placeholder={t.shortDescPlaceholder}
                  value={newClassDesc}
                  onChange={(e) => setNewClassDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-xl focus:outline-hidden text-xs dark:text-slate-200"
                />
              </div>

              {createClassError && (
                <p className="text-red-500 text-xs font-semibold">{createClassError}</p>
              )}

              <p className="text-[10px] text-slate-400">{t.shareCodeHint}</p>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreateClass(false); setCreateClassError(null); }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  {t.createClassroom}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
