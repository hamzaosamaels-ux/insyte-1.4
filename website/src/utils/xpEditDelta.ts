// XP delta for an inline edit, or null to leave the student untouched.
// Number("") is 0, not NaN — so a blank field must be rejected explicitly,
// otherwise clearing the box and clicking away reads as "set XP to 0".
//
// Lives in utils rather than the dashboard component so the test can import it
// without dragging in React and Vite-only `import.meta.env`.
export const xpEditDelta = (draft: string, currentXp: number): number | null => {
  const raw = draft.trim();
  if (raw === "") return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return null;
  const newXp = Math.max(0, Math.round(parsed));
  return newXp === currentXp ? null : newXp - currentXp;
};
