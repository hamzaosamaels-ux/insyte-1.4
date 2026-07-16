import React, { useState } from "react";
import { motion } from "motion/react";
import { GraduationCap, Award, BookOpen, Sparkles, UserCheck, ShieldAlert } from "lucide-react";
import { UserProfile } from "../types";
import { getTranslation, Language } from "../translations";

interface WelcomeScreenProps {
  students: UserProfile[];
  teacher: UserProfile;
  onSelectProfile: (profile: UserProfile) => void;
  onCreateStudent: (name: string, email: string) => void;
  language: Language;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  students,
  teacher,
  onSelectProfile,
  onCreateStudent,
  language,
}) => {
  const t = getTranslation(language);
  const [roleMode, setRoleMode] = useState<"choose" | "student" | "teacher" | "register">("choose");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName.trim() || !registerEmail.trim()) return;
    onCreateStudent(registerName.trim(), registerEmail.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-slate-900 via-slate-950 to-black text-white p-6 overflow-hidden relative">
      {/* Decorative background ambient glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-2xl bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        
        {/* Header Branding */}
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex p-4 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-2xl mb-4 shadow-lg shadow-indigo-500/20"
          >
            <GraduationCap className="h-10 w-10 text-white" />
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-4xl font-extrabold tracking-tight font-display bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-300 bg-clip-text text-transparent"
          >
            insyte
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-slate-400 mt-2 text-sm max-w-md mx-auto"
          >
            {t.welcomeTagline}
          </motion.p>
        </div>

        {/* Dynamic Mode Forms */}
        {roleMode === "choose" && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6"
          >
            <button
              onClick={() => setRoleMode("student")}
              className="group p-6 rounded-2xl bg-slate-800/50 hover:bg-indigo-950/30 border border-slate-700/50 hover:border-indigo-500/50 text-left transition-all duration-300 shadow-sm"
            >
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl w-fit group-hover:bg-indigo-500/20 group-hover:text-indigo-300 transition-colors">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg text-slate-100 mt-4 group-hover:text-indigo-200 transition-colors">{t.studentEntry}</h3>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                {t.studentEntryDesc}
              </p>
            </button>

            <button
              onClick={() => setRoleMode("teacher")}
              className="group p-6 rounded-2xl bg-slate-800/50 hover:bg-violet-950/30 border border-slate-700/50 hover:border-violet-500/50 text-left transition-all duration-300 shadow-sm"
            >
              <div className="p-3 bg-violet-500/10 text-violet-400 rounded-xl w-fit group-hover:bg-violet-500/20 group-hover:text-violet-300 transition-colors">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg text-slate-100 mt-4 group-hover:text-violet-200 transition-colors">{t.teacherPortal}</h3>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                {t.teacherPortalDesc}
              </p>
            </button>
          </motion.div>
        )}

        {roleMode === "student" && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center mb-2 border-b border-slate-800 pb-2">
              <h3 className="text-lg font-medium text-indigo-400 flex items-center gap-2">
                <UserCheck className="h-5 w-5" /> {t.selectStudentProfile}
              </h3>
              <button
                onClick={() => setRoleMode("choose")}
                className="text-xs text-slate-400 hover:text-indigo-400 transition-colors"
              >
                ← {t.back}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
              {students.map((student) => (
                <button
                  key={student.id}
                  onClick={() => onSelectProfile(student)}
                  className="flex items-center gap-3 p-4 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/40 hover:border-indigo-500/40 rounded-xl text-left transition-all group"
                >
                  <img
                    src={student.avatar}
                    alt={student.name}
                    className="w-10 h-10 rounded-full bg-slate-700/50 p-1 border border-slate-600 group-hover:border-indigo-400 transition-colors"
                  />
                  <div>
                    <div className="font-medium text-sm group-hover:text-indigo-200 transition-colors">
                      {student.name}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span className="bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 rounded-md font-mono">
                        {t.lvl} {student.level}
                      </span>
                      <span>•</span>
                      <span className="text-amber-400 font-medium font-mono">{student.xp} XP</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs">
              <span className="text-slate-400">{t.notOnRoster}</span>
              <button
                onClick={() => setRoleMode("register")}
                className="text-indigo-400 font-medium hover:underline flex items-center gap-1"
              >
                <Sparkles className="h-3 w-3" /> {t.enrollNewStudent}
              </button>
            </div>
          </motion.div>
        )}

        {roleMode === "teacher" && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center mb-2 border-b border-slate-800 pb-2">
              <h3 className="text-lg font-medium text-violet-400 flex items-center gap-2">
                <UserCheck className="h-5 w-5" /> {t.enterAsTeacher}
              </h3>
              <button
                onClick={() => setRoleMode("choose")}
                className="text-xs text-slate-400 hover:text-indigo-400 transition-colors"
              >
                ← {t.back}
              </button>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed">
              {t.teacherEntryPre} <strong>{teacher.name}</strong>{t.teacherEntryPost}
            </p>

            <button
              onClick={() => onSelectProfile(teacher)}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border border-violet-500/30 rounded-xl transition-all shadow-md shadow-violet-950/20"
            >
              <div className="flex items-center gap-3">
                <img
                  src={teacher.avatar}
                  alt={teacher.name}
                  className="w-12 h-12 rounded-full bg-slate-800 p-1 border border-violet-300"
                />
                <div className="text-left">
                  <div className="font-bold text-sm text-white">{teacher.name}</div>
                  <div className="text-[10px] text-violet-200 uppercase tracking-wider font-mono">{teacher.rank}</div>
                </div>
              </div>
              <span className="text-xs text-white bg-white/10 px-3 py-1 rounded-full border border-white/15">
                {t.launchPortal} →
              </span>
            </button>
          </motion.div>
        )}

        {roleMode === "register" && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center mb-2 border-b border-slate-800 pb-2">
              <h3 className="text-lg font-medium text-indigo-400 flex items-center gap-2">
                <Sparkles className="h-5 w-5" /> {t.enrollStudentAccount}
              </h3>
              <button
                onClick={() => setRoleMode("student")}
                className="text-xs text-slate-400 hover:text-indigo-400 transition-colors"
              >
                ← {t.back}
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{t.name}</label>
                <input
                  type="text"
                  required
                  placeholder={t.namePlaceholder}
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-indigo-500 rounded-xl focus:outline-hidden text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{t.email}</label>
                <input
                  type="email"
                  required
                  placeholder={t.emailPlaceholder}
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-indigo-500 rounded-xl focus:outline-hidden text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 font-medium rounded-xl text-sm transition-all text-white shadow-lg shadow-indigo-950/40"
              >
                {t.enrollJoin} →
              </button>
            </form>
          </motion.div>
        )}

      </div>
    </div>
  );
};
