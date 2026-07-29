// Run: npx tsx src/utils/nextList.test.ts
// Guards every list in App state against an error response blanking it.
import assert from "node:assert/strict";
import { nextList } from "./nextList";

const good = [{ id: "a" }, { id: "b" }];

// A successful response replaces the list
assert.deepEqual(nextList(good, [{ id: "c" }]), [{ id: "c" }]);
assert.deepEqual(nextList(good, []), []);

// The crash: a 403/409/400 body has no allStudents field, so the handler
// passes undefined. Keep the last good list rather than blanking it.
assert.deepEqual(nextList(good, undefined), good);

// Same for any other non-array the server might hand back
assert.deepEqual(nextList(good, null as never), good);
assert.deepEqual(nextList(good, { error: "You do not teach this class." } as never), good);

// Updater form still works (mergeSubmissions relies on it)
assert.deepEqual(nextList(good, (prev) => [...prev, { id: "c" }]), [...good, { id: "c" }]);

// ...and an updater that returns nothing is ignored too
assert.deepEqual(nextList(good, (() => undefined) as never), good);

console.log("nextList: all assertions passed");
