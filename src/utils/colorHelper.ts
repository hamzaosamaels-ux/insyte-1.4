export function getClassColors(color?: string) {
  switch (color) {
    case "emerald":
      return {
        text: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-50/70 dark:bg-emerald-950/25",
        border: "border-emerald-200 dark:border-emerald-900/40",
        bgSolid: "bg-emerald-500",
        textHover: "hover:text-emerald-600 dark:hover:text-emerald-400",
        ring: "ring-emerald-500 dark:ring-emerald-400",
        badge: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30",
        gradient: "from-emerald-500 to-teal-600",
        bannerBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        lightBorder: "border-emerald-100 dark:border-emerald-950/40"
      };
    case "violet":
    case "purple":
      return {
        text: "text-violet-600 dark:text-violet-400",
        bg: "bg-violet-50/70 dark:bg-violet-950/25",
        border: "border-violet-200 dark:border-violet-900/40",
        bgSolid: "bg-violet-500",
        textHover: "hover:text-violet-600 dark:hover:text-violet-400",
        ring: "ring-violet-500 dark:ring-violet-400",
        badge: "bg-violet-50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-400 border border-violet-100 dark:border-violet-900/30",
        gradient: "from-violet-500 to-fuchsia-600",
        bannerBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
        lightBorder: "border-violet-100 dark:border-violet-950/40"
      };
    case "amber":
    case "orange":
      return {
        text: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-50/70 dark:bg-amber-950/25",
        border: "border-amber-200 dark:border-amber-900/40",
        bgSolid: "bg-amber-500",
        textHover: "hover:text-amber-600 dark:hover:text-amber-400",
        ring: "ring-amber-500 dark:ring-amber-400",
        badge: "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30",
        gradient: "from-amber-500 to-orange-600",
        bannerBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        lightBorder: "border-amber-100 dark:border-amber-950/40"
      };
    case "blue":
      return {
        text: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-50/70 dark:bg-blue-950/25",
        border: "border-blue-200 dark:border-blue-900/40",
        bgSolid: "bg-blue-500",
        textHover: "hover:text-blue-600 dark:hover:text-blue-400",
        ring: "ring-blue-500 dark:ring-blue-400",
        badge: "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30",
        gradient: "from-blue-500 to-indigo-600",
        bannerBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
        lightBorder: "border-blue-100 dark:border-blue-950/40"
      };
    default:
      return {
        text: "text-indigo-600 dark:text-indigo-400",
        bg: "bg-indigo-50/70 dark:bg-indigo-950/25",
        border: "border-indigo-200 dark:border-indigo-900/40",
        bgSolid: "bg-indigo-500",
        textHover: "hover:text-indigo-600 dark:hover:text-indigo-400",
        ring: "ring-indigo-500 dark:ring-indigo-400",
        badge: "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30",
        gradient: "from-indigo-500 to-purple-600",
        bannerBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
        lightBorder: "border-indigo-100 dark:border-indigo-950/40"
      };
  }
}
