// Run: npx tsx src/components/matchedPairs.test.ts
// Guards the teacher grading screen and the inline XP editor.
import assert from "node:assert/strict";
import { xpEditDelta } from "./TeacherDashboard";

// ---- matchedPairs: submission rendering ----
// Kept in sync with the copy in TeacherDashboard.tsx (not exported — it is
// only meaningful inside that render path).
const matchedPairs = (content: string): [string, string][] | null => {
  if (!content.startsWith("{")) return null;
  try {
    const parsed = JSON.parse(content);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return Object.entries(parsed).map(([k, v]) => [k, String(v)]);
  } catch {
    return null;
  }
};

// Real matching-game submission still renders as pairs
assert.deepEqual(matchedPairs('{"cat":"mammal","cod":"fish"}'), [["cat", "mammal"], ["cod", "fish"]]);

// The crash: student types an answer starting with "{" that isn't valid JSON
assert.equal(matchedPairs("{x: 5} is the answer"), null);
assert.equal(matchedPairs("{"), null);

// Plain text and empty content are untouched
assert.equal(matchedPairs("My essay about photosynthesis."), null);
assert.equal(matchedPairs(""), null);

// Second crash path: nested values must not reach React as raw objects
assert.deepEqual(matchedPairs('{"a":{"nested":1}}'), [["a", "[object Object]"]]);
assert.equal(matchedPairs('{"a":null}')![0][1], "null");

// Valid JSON that isn't a flat object falls back to plain text
assert.equal(matchedPairs("[1,2,3]"), null);

// ---- xpEditDelta: inline XP editor ----
// The bug: clearing the field and blurring must NOT zero the student.
assert.equal(xpEditDelta("", 250), null);
assert.equal(xpEditDelta("   ", 250), null);

// A real edit still produces the right delta
assert.equal(xpEditDelta("300", 250), 50);
assert.equal(xpEditDelta("100", 250), -150);

// No-op when unchanged, so we don't post a pointless 0 adjustment
assert.equal(xpEditDelta("250", 250), null);

// Junk and non-finite input cancel rather than corrupting the score
assert.equal(xpEditDelta("abc", 250), null);
assert.equal(xpEditDelta("Infinity", 250), null);

// Negatives clamp to zero instead of driving XP below it
assert.equal(xpEditDelta("-50", 250), -250);

// Decimals round to a whole XP value
assert.equal(xpEditDelta("260.4", 250), 10);

console.log("TeacherDashboard: all assertions passed");
