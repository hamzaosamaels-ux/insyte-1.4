import type { SetStateAction } from "react";

// Resolve a list-state update, ignoring anything that isn't an array.
//
// App's write handlers each refresh a list straight from the response
// (data.allStudents, data.allClasses, ...). An error response — a 403 "you do
// not teach this class", a 409, a 400 — carries none of those fields, so the
// undefined landed in state and the next render died on `.filter`, taking the
// whole screen down. Keeping the last good list means a rejected request can
// no longer blank the UI.
export function nextList<T>(prev: T[], next: SetStateAction<T[]> | undefined): T[] {
  const resolved = typeof next === "function"
    ? (next as (p: T[]) => T[] | undefined)(prev)
    : next;
  return Array.isArray(resolved) ? resolved : prev;
}
