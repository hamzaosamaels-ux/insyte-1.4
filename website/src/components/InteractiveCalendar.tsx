import React, { useState } from "react";
import { TaskItem, ClassEvent, TaskSubmission, ClassCommunity } from "../types";
import { getTranslation, Language } from "../translations";
import { Calendar as CalendarIcon, Clock, Award, CheckCircle2, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { getClassColors } from "../utils/colorHelper";

interface InteractiveCalendarProps {
  classes?: ClassCommunity[];
  tasks: TaskItem[];
  events: ClassEvent[];
  submissions?: TaskSubmission[];
  currentStudentId?: string;
  language: Language;
}

export const InteractiveCalendar: React.FC<InteractiveCalendarProps> = ({
  classes = [],
  tasks,
  events,
  submissions = [],
  currentStudentId,
  language
}) => {
  const t = getTranslation(language);

  // Default to July 2026 as per local workspace time context
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(6); // 6 is July (0-indexed)

  // Current day string formatted as YYYY-MM-DD
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Local state for the selected calendar day
  const [selectedDateStr, setSelectedDateStr] = useState<string>(`2026-07-14`);

  const monthNamesEn = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const monthNamesAr = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];

  const monthName = language === "ar" ? monthNamesAr[currentMonth] : monthNamesEn[currentMonth];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  // Create grid cells
  const cells: Array<{ dateStr: string; dayNum: number; isCurrentMonth: boolean }> = [];

  // Previous month padding cells
  const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const prevMonthVal = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevMonthDays = new Date(prevMonthYear, prevMonthVal + 1, 0).getDate();

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const mStr = String(prevMonthVal + 1).padStart(2, "0");
    const dStr = String(day).padStart(2, "0");
    cells.push({
      dateStr: `${prevMonthYear}-${mStr}-${dStr}`,
      dayNum: day,
      isCurrentMonth: false
    });
  }

  // Current month cells
  for (let i = 1; i <= daysInMonth; i++) {
    const mStr = String(currentMonth + 1).padStart(2, "0");
    const dStr = String(i).padStart(2, "0");
    cells.push({
      dateStr: `${currentYear}-${mStr}-${dStr}`,
      dayNum: i,
      isCurrentMonth: true
    });
  }

  // Next month padding cells
  const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  const nextMonthVal = currentMonth === 11 ? 0 : currentMonth + 1;
  const totalCells = Math.ceil(cells.length / 7) * 7;
  const nextMonthPadding = totalCells - cells.length;

  for (let i = 1; i <= nextMonthPadding; i++) {
    const mStr = String(nextMonthVal + 1).padStart(2, "0");
    const dStr = String(i).padStart(2, "0");
    cells.push({
      dateStr: `${nextMonthYear}-${mStr}-${dStr}`,
      dayNum: i,
      isCurrentMonth: false
    });
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Filter tasks & events for a specific day string (YYYY-MM-DD)
  const getTasksForDay = (dateStr: string) => {
    return tasks.filter(t => {
      // Normalize dates to match YYYY-MM-DD formatting precisely
      try {
        const d1 = new Date(t.dueDate).toISOString().split("T")[0];
        const d2 = new Date(dateStr).toISOString().split("T")[0];
        return d1 === d2;
      } catch {
        return t.dueDate === dateStr;
      }
    });
  };

  const getEventsForDay = (dateStr: string) => {
    return events.filter(e => {
      try {
        const d1 = new Date(e.date).toISOString().split("T")[0];
        const d2 = new Date(dateStr).toISOString().split("T")[0];
        return d1 === d2;
      } catch {
        return e.date === dateStr;
      }
    });
  };

  // Get active lists for the SELECTED date
  const selectedDayTasks = getTasksForDay(selectedDateStr);
  const selectedDayEvents = getEventsForDay(selectedDateStr);

  const weekdays = [t.sun, t.mon, t.tue, t.wed, t.thu, t.fri, t.sat];

  // Helper to render formatted date nicely in localized form
  const formatSelectedDate = (dateStr: string) => {
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return dateStr;
    const options: Intl.DateTimeFormatOptions = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    return dateObj.toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", options);
  };

  return (
    <div className="space-y-6">
      {/* Calendar Tab Heading */}
      <div className="bg-white dark:bg-[#130f26] border border-slate-200 dark:border-[#241c49]/80 p-5 rounded-2xl">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 font-display flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-indigo-500" />
          {t.calendarTitle}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
          {t.calendarDesc}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Full Month Grid */}
        <div className="lg:col-span-2 bg-white dark:bg-[#130f26] border border-slate-200 dark:border-[#241c49]/80 p-6 rounded-2xl shadow-xs">
          {/* Calendar Header with Navigation */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <span>{monthName}</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">{currentYear}</span>
            </h3>
            <div className="flex gap-1.5">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2d2553]/50 rounded-lg hover:bg-slate-100 dark:hover:bg-[#282154] text-slate-600 dark:text-slate-200 transition-colors cursor-pointer"
                title={t.prevMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2d2553]/50 rounded-lg hover:bg-slate-100 dark:hover:bg-[#282154] text-slate-600 dark:text-slate-200 transition-colors cursor-pointer"
                title={t.nextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Weekdays indicator bar */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2 border-b border-slate-100 dark:border-[#251e40] pb-2">
            {weekdays.map((day, idx) => (
              <span key={idx} className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid cells */}
          <div className="grid grid-cols-7 gap-2">
            {cells.map((cell, idx) => {
              const dayTasks = getTasksForDay(cell.dateStr);
              const dayEvents = getEventsForDay(cell.dateStr);
              const hasTasks = dayTasks.length > 0;
              const hasEvents = dayEvents.length > 0;
              const isSelected = selectedDateStr === cell.dateStr;
              const isToday = cell.dateStr === todayStr;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  className={`relative p-3.5 rounded-xl border flex flex-col items-center justify-between min-h-[58px] transition-all cursor-pointer group ${
                    !cell.isCurrentMonth
                      ? "bg-slate-50/50 dark:bg-[#130f26]/40 border-slate-100 dark:border-slate-800/20 text-slate-300 dark:text-slate-650"
                      : "bg-white dark:bg-[#1c1836] border-slate-200 dark:border-[#2b244c] text-slate-800 dark:text-slate-200 hover:border-indigo-400 dark:hover:border-indigo-500"
                  } ${
                    isSelected
                      ? "ring-2 ring-indigo-500 border-transparent dark:ring-indigo-400 dark:bg-indigo-950/25"
                      : ""
                  } ${
                    isToday
                      ? "bg-amber-50/50 dark:bg-amber-950/25 border-amber-300 dark:border-amber-600/50"
                      : ""
                  }`}
                >
                  {/* Day Number Label */}
                  <span className={`text-xs font-mono font-bold ${
                    isSelected 
                      ? "text-indigo-600 dark:text-indigo-400 font-extrabold" 
                      : isToday 
                        ? "text-amber-600 dark:text-amber-400" 
                        : ""
                  }`}>
                    {cell.dayNum}
                  </span>

                  {/* Dot Notification Indicators */}
                  <div className="flex flex-wrap gap-1 justify-center mt-1.5 h-1.5">
                    {dayTasks.map(task => {
                      const cl = classes?.find(c => c.id === task.classId);
                      const clColors = getClassColors(cl?.color);
                      return (
                        <span 
                          key={task.id} 
                          className={`w-1.5 h-1.5 rounded-full ${clColors.bgSolid} animate-pulse`} 
                          title={`${task.title} (${cl?.code || ""})`} 
                        />
                      );
                    })}
                    {dayEvents.map(evt => {
                      const cl = classes?.find(c => c.id === evt.classId);
                      const clColors = getClassColors(cl?.color);
                      return (
                        <span 
                          key={evt.id} 
                          className={`w-1.5 h-1.5 rounded-full ${clColors.bgSolid}`} 
                          title={`${evt.title} (${cl?.code || ""})`} 
                        />
                      );
                    })}
                  </div>

                  {/* Tiny counter on hover */}
                  {(hasTasks || hasEvents) && (
                    <span className="absolute -top-1 -right-1 bg-slate-900 text-white font-mono text-[7px] font-bold px-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      {dayTasks.length + dayEvents.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Day Activities detail pane */}
        <div className="bg-white dark:bg-[#130f26] border border-slate-200 dark:border-[#241c49]/80 p-6 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 dark:border-[#241c49]/80 pb-3 mb-4">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
                {formatSelectedDate(selectedDateStr) === selectedDateStr ? t.calendarMonth : "Day Details"}
              </span>
              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 mt-1">
                {formatSelectedDate(selectedDateStr)}
              </h4>
            </div>

            {/* List entries */}
            {selectedDayTasks.length === 0 && selectedDayEvents.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <AlertCircle className="h-8 w-8 text-slate-300 dark:text-slate-650 mx-auto" />
                <p className="text-slate-400 dark:text-slate-550 text-xs leading-relaxed max-w-[200px] mx-auto">
                  {t.noActivities}
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {/* Assignments List */}
                {selectedDayTasks.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider font-mono">
                      {t.assignmentsDue} ({selectedDayTasks.length})
                    </h5>
                    {selectedDayTasks.map((task) => {
                      // Check if completed
                      const completed = submissions.some(s => s.taskId === task.id && s.studentId === currentStudentId);
                      const cl = classes?.find(c => c.id === task.classId);
                      const clColors = getClassColors(cl?.color);
                      return (
                        <div key={task.id} className={`p-3 ${clColors.bg} border ${clColors.border} rounded-xl space-y-1.5 text-left`}>
                          <div className="flex items-start justify-between">
                            <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                              {task.title}
                            </span>
                            <span className={`font-bold text-[10px] font-mono shrink-0 flex items-center ${clColors.text}`}>
                              +{task.rewardXp} XP
                            </span>
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 text-[10px] line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                          <div className={`flex items-center justify-between pt-1 border-t ${clColors.lightBorder} text-[9px]`}>
                            <span className="text-slate-400 capitalize">{task.type === "dragdrop" ? t.dragDrop : t.essay}</span>
                            {completed ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                                <CheckCircle2 className="h-3 w-3" /> {t.handedIn}
                              </span>
                            ) : (
                              <span className={`${clColors.text} font-semibold`}>{t.due}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Class Events List */}
                {selectedDayEvents.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-bold text-purple-500 uppercase tracking-wider font-mono">
                      {t.scheduledEvents} ({selectedDayEvents.length})
                    </h5>
                    {selectedDayEvents.map((evt) => {
                      const cl = classes?.find(c => c.id === evt.classId);
                      const clColors = getClassColors(cl?.color);
                      return (
                        <div key={evt.id} className={`p-3 ${clColors.bg} border ${clColors.border} rounded-xl space-y-1 text-left`}>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                              {evt.title}
                            </span>
                            <span className={`${clColors.text} text-[9px] font-mono flex items-center gap-0.5`}>
                              <Clock className="h-3 w-3" /> {evt.time}
                            </span>
                          </div>
                          <p className="text-slate-550 dark:text-slate-350 text-[10px] leading-relaxed">
                            {evt.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-400 dark:text-slate-550 border-t border-slate-100 dark:border-[#241c49]/80 pt-3 mt-4 flex flex-wrap gap-x-4 gap-y-1">
            {classes?.map(cl => {
              const clColors = getClassColors(cl.color);
              return (
                <div key={cl.id} className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${clColors.bgSolid}`} />
                  <span className="font-medium text-slate-500 dark:text-slate-400">{cl.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
