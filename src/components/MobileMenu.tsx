import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X } from "lucide-react";

// A hamburger button (mobile only) that opens a slide-in drawer holding the
// header controls and nav, so the top bar isn't cramped on phones.
export const MobileMenu: React.FC<{ children: React.ReactNode; title?: string }> = ({
  children,
  title = "Menu"
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="p-2.5 bg-white dark:bg-[#1c1836] border border-slate-200 dark:border-[#2d2553]/50 rounded-xl text-slate-600 dark:text-slate-300 cursor-pointer"
      >
        <Menu className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.22 }}
              className="fixed top-0 end-0 z-50 h-full w-72 max-w-[85vw] bg-white dark:bg-[#130f26] border-s border-slate-200 dark:border-[#241c49] shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-[#241c49]">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100 font-display">{title}</span>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {/* Close the drawer when any control inside is tapped */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" onClick={() => setOpen(false)}>
                {children}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
