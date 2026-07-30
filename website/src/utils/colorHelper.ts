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
    case "rose":
    case "red":
      return {
        text: "text-rose-600 dark:text-rose-400",
        bg: "bg-rose-50/70 dark:bg-rose-950/25",
        border: "border-rose-200 dark:border-rose-900/40",
        bgSolid: "bg-rose-500",
        textHover: "hover:text-rose-600 dark:hover:text-rose-400",
        ring: "ring-rose-500 dark:ring-rose-400",
        badge: "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30",
        gradient: "from-rose-500 to-pink-600",
        bannerBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
        lightBorder: "border-rose-100 dark:border-rose-950/40"
      };
    case "cyan":
      return {
        text: "text-cyan-600 dark:text-cyan-400",
        bg: "bg-cyan-50/70 dark:bg-cyan-950/25",
        border: "border-cyan-200 dark:border-cyan-900/40",
        bgSolid: "bg-cyan-500",
        textHover: "hover:text-cyan-600 dark:hover:text-cyan-400",
        ring: "ring-cyan-500 dark:ring-cyan-400",
        badge: "bg-cyan-50 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-400 border border-cyan-100 dark:border-cyan-900/30",
        gradient: "from-cyan-500 to-blue-600",
        bannerBg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
        lightBorder: "border-cyan-100 dark:border-cyan-950/40"
      };
    case "teal":
      return {
        text: "text-teal-600 dark:text-teal-400",
        bg: "bg-teal-50/70 dark:bg-teal-950/25",
        border: "border-teal-200 dark:border-teal-900/40",
        bgSolid: "bg-teal-500",
        textHover: "hover:text-teal-600 dark:hover:text-teal-400",
        ring: "ring-teal-500 dark:ring-teal-400",
        badge: "bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400 border border-teal-100 dark:border-teal-900/30",
        gradient: "from-teal-500 to-emerald-600",
        bannerBg: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
        lightBorder: "border-teal-100 dark:border-teal-950/40"
      };
    case "fuchsia":
      return {
        text: "text-fuchsia-600 dark:text-fuchsia-400",
        bg: "bg-fuchsia-50/70 dark:bg-fuchsia-950/25",
        border: "border-fuchsia-200 dark:border-fuchsia-900/40",
        bgSolid: "bg-fuchsia-500",
        textHover: "hover:text-fuchsia-600 dark:hover:text-fuchsia-400",
        ring: "ring-fuchsia-500 dark:ring-fuchsia-400",
        badge: "bg-fuchsia-50 dark:bg-fuchsia-950/20 text-fuchsia-700 dark:text-fuchsia-400 border border-fuchsia-100 dark:border-fuchsia-900/30",
        gradient: "from-fuchsia-500 to-purple-600",
        bannerBg: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400",
        lightBorder: "border-fuchsia-100 dark:border-fuchsia-950/40"
      };
    case "lime":
      return {
        text: "text-lime-600 dark:text-lime-400",
        bg: "bg-lime-50/70 dark:bg-lime-950/25",
        border: "border-lime-200 dark:border-lime-900/40",
        bgSolid: "bg-lime-500",
        textHover: "hover:text-lime-600 dark:hover:text-lime-400",
        ring: "ring-lime-500 dark:ring-lime-400",
        badge: "bg-lime-50 dark:bg-lime-950/20 text-lime-700 dark:text-lime-400 border border-lime-100 dark:border-lime-900/30",
        gradient: "from-lime-500 to-green-600",
        bannerBg: "bg-lime-500/10 text-lime-600 dark:text-lime-400",
        lightBorder: "border-lime-100 dark:border-lime-950/40"
      };
    case "sky":
      return {
        text: "text-sky-600 dark:text-sky-400",
        bg: "bg-sky-50/70 dark:bg-sky-950/25",
        border: "border-sky-200 dark:border-sky-900/40",
        bgSolid: "bg-sky-500",
        textHover: "hover:text-sky-600 dark:hover:text-sky-400",
        ring: "ring-sky-500 dark:ring-sky-400",
        badge: "bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 border border-sky-100 dark:border-sky-900/30",
        gradient: "from-sky-500 to-cyan-600",
        bannerBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
        lightBorder: "border-sky-100 dark:border-sky-950/40"
      };
    case "pink":
      return {
        text: "text-pink-600 dark:text-pink-400",
        bg: "bg-pink-50/70 dark:bg-pink-950/25",
        border: "border-pink-200 dark:border-pink-900/40",
        bgSolid: "bg-pink-500",
        textHover: "hover:text-pink-600 dark:hover:text-pink-400",
        ring: "ring-pink-500 dark:ring-pink-400",
        badge: "bg-pink-50 dark:bg-pink-950/20 text-pink-700 dark:text-pink-400 border border-pink-100 dark:border-pink-900/30",
        gradient: "from-pink-500 to-rose-600",
        bannerBg: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
        lightBorder: "border-pink-100 dark:border-pink-950/40"
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
