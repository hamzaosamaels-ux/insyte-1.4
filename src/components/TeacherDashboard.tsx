import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, BookOpen, Award, Megaphone, Calendar, Users, 
  CheckSquare, LogOut, CheckCircle2, ChevronRight, Info,
  Trash2, Send, Clock, Sparkles, Settings, Edit, Check, Library, Video, Presentation, Globe
} from "lucide-react";
import { 
  UserProfile, ClassCommunity, Lesson, TaskItem, 
  TaskSubmission, Announcement, ClassEvent 
} from "../types";
import { Language, Theme, getTranslation } from "../translations";
import { InteractiveCalendar } from "./InteractiveCalendar";
import { SettingsTab } from "./SettingsTab";
import { NavbarControls } from "./NavbarControls";
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
  onLogOut: () => void;
  onCreateClass: (name: string, code: string, description: string, color?: string) => void;
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
  onLogOut,
  onCreateClass,
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
  const [activeSection, setActiveSection] = useState<"lobby" | "lessons" | "tasks" | "grade" | "events" | "announcements" | "calendar" | "settings">("lobby");

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

  // Submit Handlers
  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassGrade.trim() || !newClassSubject.trim() || !newClassCode.trim()) return;
    const finalClassName = `${newClassGrade.trim()} - ${newClassSubject.trim()}`;
    onCreateClass(finalClassName, newClassCode.trim().toUpperCase(), newClassDesc.trim(), newClassColor);
    setNewClassGrade("Class 2B");
    setNewClassSubject("");
    setNewClassCode("");
    setNewClassDesc("");
    setNewClassColor("indigo");
    setShowCreateClass(false);
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
      showNotification("Lesson updated successfully!");
    } else {
      onCreateLesson(lessonData);
      showNotification("New lesson published successfully!");
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
    showNotification("New homework assignment published!");
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
    showNotification("Announcement posted to the class board!");
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
    showNotification("Event scheduled successfully!");
  };

  const handleGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    onGradeSubmission(selectedSub.id, gradeXp, gradeFeedback.trim());
    setSelectedSub(null);
    setGradeFeedback("");
    showNotification("Submission graded and study XP rewarded to student!");
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
            title="Create Class"
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
                  <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 font-display">Student Roster — {activeClass.name}</h2>
                  <p className="text-slate-400 text-xs mt-1">Review enrolled student ranks, current levels, and overall XP points standings.</p>
                  
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
                              Level {stud.level}
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
                      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Select Subject</h3>
                      <p className="text-[10px] text-slate-400 font-semibold">Filter lessons by subject</p>
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
                    {editingLessonId ? "Edit Lesson Guide" : "Publish Class Lesson"}
                  </h2>
                  <p className="text-slate-400 text-xs mb-6">
                    {editingLessonId ? "Modify lesson details, markdown, and embedded materials." : "Write comprehensive lecture guides. Markdown formatting is supported."}
                  </p>

                  <form onSubmit={handleCreateLesson} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Lesson Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., 3. Advanced DOM Selectors"
                        value={lessonTitle}
                        onChange={(e) => setLessonTitle(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-xl focus:outline-hidden text-xs text-slate-700 dark:text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Lesson Content</label>
                      <textarea
                        required
                        rows={8}
                        placeholder="Enter the lesson guide text here..."
                        value={lessonContent}
                        onChange={(e) => setLessonContent(e.target.value)}
                        className="w-full p-4 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-xl focus:outline-hidden text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-mono"
                      />
                    </div>

                    {/* MULTIMEDIA UPLOAD OPTIONS */}
                    <div className="p-4 bg-slate-50 dark:bg-[#181432] rounded-xl border border-slate-200 dark:border-[#251e44] space-y-3">
                      <span className="text-[10px] font-bold text-violet-600 dark:text-violet-450 uppercase tracking-wider block">
                        Interactive Media & Web Link Embeds
                      </span>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 mb-1">YouTube Video Embed URL</label>
                          <input
                            type="url"
                            placeholder="e.g., https://www.youtube.com/embed/..."
                            value={lessonVideoUrl}
                            onChange={(e) => setLessonVideoUrl(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-lg focus:outline-hidden text-[11px] text-slate-700 dark:text-slate-200"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 mb-1">PowerPoint/Slides Embed URL</label>
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
                          <label className="block text-[10px] font-semibold text-slate-400 mb-1">External Web Link URL</label>
                          <input
                            type="url"
                            placeholder="e.g., https://eyes.nasa.gov"
                            value={lessonWebUrl}
                            onChange={(e) => setLessonWebUrl(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-lg focus:outline-hidden text-[11px] text-slate-700 dark:text-slate-200"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 mb-1">Web Link Friendly Label</label>
                          <input
                            type="text"
                            placeholder="e.g., NASA Interactive Map"
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
                        {editingLessonId ? "Save Changes" : "Publish Lesson"}
                      </button>

                      {editingLessonId && (
                        <button
                          type="button"
                          onClick={handleCancelEditLesson}
                          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#201b44] dark:hover:bg-[#2c265c] text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Lessons list column (Right) */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  <div className="bg-white dark:bg-[#130f26] border border-slate-200 dark:border-[#241c49]/80 p-5 rounded-2xl shadow-xs">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-display mb-1 flex items-center gap-2">
                      <Library className="h-4.5 w-4.5 text-violet-500" /> Currently Published ({classLessons.length})
                    </h3>
                    <p className="text-slate-400 text-[11px] mb-4">View, edit, and delete existing lesson study guides for {activeClass.name}.</p>

                    {classLessons.length === 0 ? (
                      <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-[#2c2452]/40 rounded-xl">
                        <BookOpen className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 font-semibold">No published lessons yet for this class.</p>
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
                                  Published {new Date(les.publishedAt).toLocaleDateString()}
                                </p>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => handleStartEditLesson(les)}
                                  className="p-1.5 text-slate-500 hover:text-violet-600 hover:bg-violet-50 dark:text-slate-400 dark:hover:text-violet-450 dark:hover:bg-violet-950/40 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Lesson"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm("Are you sure you want to delete this lesson? This action cannot be undone.")) {
                                      onDeleteLesson(les.id);
                                      showNotification("Lesson deleted successfully!");
                                      if (editingLessonId === les.id) {
                                        handleCancelEditLesson();
                                      }
                                    }
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Lesson"
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
                                    <Video className="h-2.5 w-2.5" /> Video
                                  </span>
                                )}
                                {les.pptUrl && (
                                  <span className="flex items-center gap-1 bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-md text-[9px] font-bold">
                                    <Presentation className="h-2.5 w-2.5" /> Slides
                                  </span>
                                )}
                                {les.webUrl && (
                                  <span className="flex items-center gap-1 bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-md text-[9px] font-bold">
                                    <Globe className="h-2.5 w-2.5" /> {les.webUrlTitle || "Web Link"}
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
                      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Select Subject</h3>
                      <p className="text-[10px] text-slate-400 font-semibold">Filter assignments by subject</p>
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
                  <Award className="h-5 w-5 text-violet-600 dark:text-violet-450" /> Publish Homework Task
                </h2>
                <p className="text-slate-400 text-xs mb-6">Create written essays or interactive matching tasks for students to earn study XP.</p>

                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Assignment Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. JS Function Creator"
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-xl focus:outline-hidden text-xs text-slate-700 dark:text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Challenge Type</label>
                      <select
                        value={taskType}
                        onChange={(e) => setTaskType(e.target.value as "text" | "dragdrop")}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-xl focus:outline-hidden text-xs text-slate-700 dark:text-slate-200 font-semibold"
                      >
                        <option value="text">Written Essay Submission</option>
                        <option value="dragdrop">Interactive Technology Matcher Game</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Task Description</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Detail the instructions or essay prompt clearly..."
                      value={taskDesc}
                      onChange={(e) => setTaskDesc(e.target.value)}
                      className="w-full p-4 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-xl focus:outline-hidden text-xs text-slate-700 dark:text-slate-200 leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">XP Reward Amount</label>
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
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Due Date</label>
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
                        <strong>Preview matching elements:</strong> Selecting matching option sets up drag cards for elements: <em>['HTML', 'CSS', 'JavaScript']</em> targeting core roles <em>['Document Skeleton', 'Layout & Colors', 'Live Interactivity']</em> automatically.
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl shadow-md shadow-violet-100 dark:shadow-none transition-all cursor-pointer"
                  >
                    Publish Assignment
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
                      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Select Subject</h3>
                      <p className="text-[10px] text-slate-400 font-semibold">Filter student submissions by subject</p>
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
                    <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 font-display">Student Submissions</h2>
                    <p className="text-slate-400 text-xs mt-1">Review student answers and grant final score XP points.</p>

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
                                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Task: {sub.taskTitle}</p>
                                </div>
                              </div>

                              <div className="text-right">
                                {sub.isGraded ? (
                                  <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border border-emerald-100 dark:border-[#2d2553]/50 font-bold text-[10px] px-2.5 py-1 rounded-lg">
                                    Graded (+{sub.scoreXpEarned} XP)
                                  </span>
                                ) : (
                                  <span className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-450 border border-amber-100 dark:border-[#2d2553]/50 font-bold text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1">
                                    Needs Review
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-slate-400 text-xs text-center py-6">No student homework submissions found.</p>
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
                      ← Back to Submissions
                    </button>

                    <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 font-display">
                      Grade Submission for {selectedSub.studentName}
                    </h2>
                    <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                      Assignment: {selectedSub.taskTitle}
                    </span>

                    <div className="my-6 p-4 bg-slate-50 dark:bg-[#1c1836] border border-slate-100 dark:border-[#2b244c]/60 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Submitted Content</span>
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
                        <div className="font-bold">✓ Approved & Graded</div>
                        <div>XP Points Awarded: {selectedSub.scoreXpEarned} XP</div>
                        {selectedSub.feedback && <div>Feedback given: "{selectedSub.feedback}"</div>}
                      </div>
                    ) : (
                      <form onSubmit={handleGradeSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Award XP Points</label>
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
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Teacher Feedback</label>
                          <textarea
                            rows={3}
                            placeholder="Provide constructive feedback for the student..."
                            value={gradeFeedback}
                            onChange={(e) => setGradeFeedback(e.target.value)}
                            className="w-full p-4 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-xl focus:outline-hidden text-xs text-slate-700 dark:text-slate-200"
                          />
                        </div>

                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="h-4 w-4" /> Approve & Award XP
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
                  <Calendar className="h-5 w-5 text-violet-600 dark:text-violet-450" /> Schedule Class Event
                </h2>
                <p className="text-slate-400 text-xs mb-6">Add deadlines, live sessions, or virtual study gatherings to the calendar.</p>

                <form onSubmit={handleAddEvent} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Event Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Midterm Coding Review Session"
                      value={evtTitle}
                      onChange={(e) => setEvtTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-xl focus:outline-hidden text-xs text-slate-700 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Event Description</label>
                    <input
                      type="text"
                      placeholder="Short details regarding context or meeting links..."
                      value={evtDesc}
                      onChange={(e) => setEvtDesc(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-xl focus:outline-hidden text-xs text-slate-700 dark:text-slate-200"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date</label>
                      <input
                        type="date"
                        required
                        value={evtDate}
                        onChange={(e) => setEvtDate(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-xl focus:outline-hidden text-xs text-slate-700 dark:text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Time</label>
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
                    Schedule Event
                  </button>
                </form>
              </div>
            )}

            {/* BROADCAST ANNOUNCEMENTS VIEW */}
            {activeSection === "announcements" && (
              <div className="max-w-3xl bg-white dark:bg-[#130f26] border border-slate-200 dark:border-[#241c49]/80 p-6 rounded-2xl shadow-xs">
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 font-display mb-1 flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-violet-600 dark:text-violet-450" /> Broadcast Class Announcement
                </h2>
                <p className="text-slate-400 text-xs mb-6">Send class bulletins, guidelines, or urgent alert updates directly to students' dashboards.</p>

                <form onSubmit={handleAddAnnouncement} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Announcement Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Locker Avatars Now Customisable"
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-xl focus:outline-hidden text-xs text-slate-700 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Message Content</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Write your news message here..."
                      value={annContent}
                      onChange={(e) => setAnnContent(e.target.value)}
                      className="w-full p-4 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-xl focus:outline-hidden text-xs text-slate-700 dark:text-slate-200 leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl shadow-md shadow-violet-100 dark:shadow-none transition-all cursor-pointer"
                  >
                    Broadcast News
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
          <p className="text-slate-700 dark:text-slate-300 font-bold text-sm">No Active Classroom Selected</p>
          <p className="text-slate-400 text-xs mt-1 max-w-xs">Create or select a classroom channel from the top navigation bar to begin coaching.</p>
        </div>
      )}

      {/* CREATE CLASS DIALOG POPUP */}
      {showCreateClass && (
        <div className="fixed inset-0 z-50 bg-[#06040f]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#130f26] border border-slate-200 dark:border-[#241c49]/80 rounded-2xl p-6 shadow-xl relative">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm font-display mb-1">Create Class Community</h3>
            <p className="text-slate-400 text-[11px] mb-4">Establish a new classroom community, peer chats, calendars, and assignments.</p>

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Class/Grade</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Class 2B"
                    value={newClassGrade}
                    onChange={(e) => setNewClassGrade(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-xl focus:outline-hidden text-xs dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. German"
                    value={newClassSubject}
                    onChange={(e) => setNewClassSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-xl focus:outline-hidden text-xs dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Class Code</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="e.g. SPACE404"
                    value={newClassCode}
                    onChange={(e) => setNewClassCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-xl focus:outline-hidden text-xs dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Theme Color</label>
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
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Short Description</label>
                <input
                  type="text"
                  placeholder="Summarize subject content in 1-2 sentences..."
                  value={newClassDesc}
                  onChange={(e) => setNewClassDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-xl focus:outline-hidden text-xs dark:text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateClass(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Create Classroom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
