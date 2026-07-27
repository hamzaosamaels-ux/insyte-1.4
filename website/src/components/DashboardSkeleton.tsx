import React from "react";

// Placeholder shell shown while the portal data loads. Mirrors the dashboard
// layout (header, sidebar, cards) so the page doesn't jump when data arrives.
const shimmer = "animate-pulse bg-slate-200 dark:bg-[#1c1836]";

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b081a]">
      {/* Header */}
      <header className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 dark:border-[#241c49]/80 bg-white dark:bg-[#130f26]">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${shimmer}`} />
          <div className={`w-24 h-4 rounded ${shimmer}`} />
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-16 h-8 rounded-xl ${shimmer}`} />
          <div className={`w-9 h-9 rounded-full ${shimmer}`} />
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col gap-2 w-64 p-4 border-r border-slate-200 dark:border-[#241c49]/80 bg-white dark:bg-[#130f26]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`w-full h-10 rounded-xl ${shimmer}`} />
          ))}
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 space-y-6">
          <div className={`w-full h-28 rounded-2xl ${shimmer}`} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`h-32 rounded-2xl ${shimmer}`} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};
