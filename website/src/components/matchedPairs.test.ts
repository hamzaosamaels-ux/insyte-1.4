// Run: npx tsx src/components/matchedPairs.test.ts
// Guards the teacher grading screen against crashing on student-typed content.
import assert from "node:assert/strict";

// Keep in sync with the copy in TeacherDashboard.tsx.
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

console.log("matchedPairs: all assertions passed");
