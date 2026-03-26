export const theme = {
  primary: "#2563EB",
  secondary: "#7C3AED",
  accent: "#EC4899",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  success: "#22C55E",
  warning: "#F59E0B",
};

export const categoryColors = {
  "Schools & Yeshivas": "from-sky-500 to-blue-600",
  "Chessed & Volunteering": "from-emerald-500 to-green-600",
  "Travel": "from-cyan-500 to-teal-500",
  "Careers & Networking": "from-indigo-500 to-violet-600",
  "Learning & Torah": "from-amber-400 to-orange-500",
  "Social & Events": "from-pink-500 to-rose-500",
  "Programs & Youth": "from-purple-500 to-fuchsia-500",
  "Sports & Fitness": "from-lime-500 to-green-500",
  "Food & Lifestyle": "from-red-400 to-orange-500",
  "Local Communities": "from-blue-500 to-indigo-500",
};

// ─── Inline style objects ─────────────────────────────────────────────────────

/** Primary gradient: blue → purple. Apply as style={{ ...gradientStyle }} */
export const gradientStyle = {
  background: "linear-gradient(135deg, #2563EB, #7C3AED)",
};

/** Accent gradient: purple → pink. */
export const accentGradientStyle = {
  background: "linear-gradient(135deg, #7C3AED, #EC4899)",
};

// ─── Tailwind className helpers ───────────────────────────────────────────────

/**
 * CTA / primary button
 * Usage: <button className={btnPrimary}>Label</button>
 */
export const btnPrimary =
  "inline-flex items-center justify-center rounded-full text-white text-[13px] font-bold px-4 py-2 transition-opacity hover:opacity-90 active:scale-[0.97]";
// Pair with style={gradientStyle}

/**
 * Secondary / outline button
 */
export const btnSecondary =
  "inline-flex items-center justify-center rounded-full text-blue-600 bg-blue-50 border border-blue-200 text-[13px] font-semibold px-4 py-2 hover:bg-blue-100 transition-colors active:scale-[0.97]";

/**
 * Active tab pill (use with style={gradientStyle})
 */
export const tabActive =
  "flex-shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-semibold text-white shadow-sm whitespace-nowrap";

/**
 * Inactive tab pill
 */
export const tabInactive =
  "flex-shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-semibold bg-white text-slate-600 border border-slate-200 hover:border-blue-200 hover:text-blue-600 whitespace-nowrap transition-colors";

/**
 * Badge — blue tint (small count pill, status tag, etc.)
 */
export const badgeBlue =
  "inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600";

/**
 * Badge — purple tint (prompts, communities)
 */
export const badgePurple =
  "inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600";

/**
 * Badge — green (success, going, active)
 */
export const badgeGreen =
  "inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600";

/**
 * Badge — orange (warnings, tomorrow, soon)
 */
export const badgeOrange =
  "inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600";

/**
 * Prompt card wrapper
 * Usage: <div className={promptCard}>...</div>
 */
export const promptCard =
  "w-full rounded-2xl p-4 text-left";
export const promptCardStyle = {
  background: "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)",
  border: "1px solid #DDD6FE",
  boxShadow: "0 2px 12px rgba(124,58,237,0.08)",
};

/**
 * Section card wrapper (white card with soft shadow)
 */
export const sectionCard =
  "bg-white rounded-2xl border border-slate-100 overflow-hidden";
export const sectionCardStyle = {
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
};