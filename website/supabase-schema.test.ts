// Run: npx tsx supabase-schema.test.ts
//
// Catches the single most expensive recurring bug in this project: code and
// schema.sql drifting apart. Three separate times a field was added to the
// mapping functions while schema.sql was left behind (readLessons, then
// reset_token/issued_at, then quiz_questions + the quiz task type). Each time
// the write silently failed inside a background .catch, so the app looked
// healthy while new data lived only in memory until a restart dropped it.
//
// verifySchema() covers the other half at runtime (schema.sql vs the LIVE
// database, i.e. "did anyone actually run the ALTERs"). This covers the half a
// developer controls: code vs schema.sql, before it can ever ship.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { EXPECTED_COLUMNS } from "./supabase-store";

// package.json is "type": "module", so __dirname doesn't exist here.
const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const sql = fs.readFileSync(path.join(here, "supabase", "schema.sql"), "utf8");

// Columns schema.sql defines for a table: those inside its CREATE TABLE block,
// plus any added later via ALTER TABLE ... ADD COLUMN (how existing databases
// receive new fields).
function columnsInSchema(table: string): Set<string> {
  const found = new Set<string>();

  const create = new RegExp(
    `create table if not exists public\\.${table}\\s*\\(([\\s\\S]*?)\\n\\);`,
    "i"
  ).exec(sql);
  assert.ok(create, `schema.sql has no CREATE TABLE for "${table}"`);

  for (const rawLine of create[1].split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("--")) continue;
    // Skip table-level constraints, which aren't column definitions
    if (/^(primary key|foreign key|unique|check|constraint)\b/i.test(line)) continue;
    const name = line.split(/\s+/)[0];
    if (name) found.add(name.replace(/,$/, ""));
  }

  const alter = new RegExp(
    `alter table public\\.${table} add column if not exists (\\w+)`,
    "gi"
  );
  for (const m of sql.matchAll(alter)) found.add(m[1]);

  return found;
}

let checked = 0;
for (const [table, expected] of Object.entries(EXPECTED_COLUMNS)) {
  const actual = columnsInSchema(table);
  const missing = expected.filter(c => !actual.has(c));
  assert.deepEqual(
    missing,
    [],
    `Table "${table}": the code writes ${missing.map(c => `"${c}"`).join(", ")} ` +
    `but schema.sql never defines it. Add the column to the CREATE TABLE block ` +
    `AND an "alter table public.${table} add column if not exists ..." line so ` +
    `existing databases pick it up — then run it in the Supabase SQL editor.`
  );
  checked += expected.length;
}

// A CHECK constraint that doesn't know about a valid value rejects the whole
// row. That's exactly how every quiz task silently failed to save.
const taskTypes = /check \(type in \(([^)]*)\)\)/i.exec(sql);
assert.ok(taskTypes, "tasks.type should keep a CHECK constraint listing valid types");
for (const type of ["text", "dragdrop", "quiz"]) {
  assert.ok(
    taskTypes[1].includes(`'${type}'`),
    `tasks.type CHECK rejects "${type}", so saving a ${type} task fails and the ` +
    `task is lost on the next restart`
  );
}

console.log(`schema drift: OK (${checked} columns across ${Object.keys(EXPECTED_COLUMNS).length} tables, task types verified)`);
