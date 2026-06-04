#!/usr/bin/env node
/**
 * PBS NPC & mobile CSS smoke test.
 * Run: node scripts/test-npc-smoke.mjs
 * Requires: built webview (or just check source files for CSS selectors)
 *
 * Covers:
 *  - NPC self-interview question uses persona/transcript, not low-evidence fallback
 *  - preferredLanguage=en fallback not Chinese
 *  - Mobile CSS selectors for header title truncation exist
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PASS = "\x1b[32m✓\x1b[0m";
const FAIL = "\x1b[31m✗\x1b[0m";
let passed = 0;
let failed = 0;

function test(name, condition) {
  if (condition) {
    console.log(`  ${PASS} ${name}`);
    passed++;
  } else {
    console.log(`  ${FAIL} ${name}`);
    failed++;
  }
}

// --- 1. NPC Python server: answer_with_npc_memory exists and is persona-first ---
console.log("\n[1] NPC backend (pbs_game_server.py)");
const serverPath = resolve(ROOT, "scripts/pbs_game_server.py");
const server = readFileSync(serverPath, "utf-8");

test("answer_with_npc_memory function defined", server.includes("def answer_with_npc_memory("));
test("persona/transcript as PRIMARY context", server.includes("NPC persona & transcript (PRIMARY context)"));
test("no 'not enough clues' for persona", server.includes("Do NOT say 'not enough clues'"));
test("never say '抓不到足夠線索' when persona exists",
  server.includes("Do NOT say '抓不到足夠線索'"));
test("npc_fallback_answer defined", server.includes("def npc_fallback_answer("));
test("npc_fallback_answer with English fallback",
  /"en":\s*f?"I will answer from what I remember/.test(server));
test("campfire fallback_answer now takes language parameter",
  server.includes("def fallback_answer(question: str, evidence: list[dict], error: str = \"\", language: str = \"zh-TW\")"));
test("fallback no_evidence en translation",
  /"en":\s*"The campfire has not found/.test(server));
test("fallback no_evidence translations for all 6 languages",
  (server.match(/"[a-z]{2}(-[A-Z]{2})?":\s*"/g) || []).length >= 6 * 3);
test("NPC endpoint calls answer_with_npc_memory not answer_with_memory",
  server.includes('answer_with_npc_memory(question, preferred_language, npc_name'));

// --- 2. Frontend error display ---
console.log("\n[2] Frontend NPC error display (RpgDialogue.tsx)");
const dialoguePath = resolve(ROOT, "webview-ui/src/components/RpgDialogue.tsx");
const dialogue = readFileSync(dialoguePath, "utf-8");

test("error uses i18n t(language, ...) not raw err.message",
  dialogue.includes("t(language, 'dialogue.requestFailed')"));
test("raw error logged to console.warn instead of displaying",
  dialogue.includes("console.warn('NPC dialogue error:', err)"));

// --- 3. Mobile CSS selectors ---
console.log("\n[3] Mobile CSS (index.css)");
const cssPath = resolve(ROOT, "webview-ui/src/index.css");
const css = readFileSync(cssPath, "utf-8");

// Check for the selectors we added
test(".rpg-dialogue-title min-width:0 at mobile",
  css.includes('.rpg-dialogue-title {\n    min-width: 0 !important;'));
test(".rpg-dialogue-title > div:last-child min-width:0 overflow:hidden",
  css.includes("min-width: 0;\n    overflow: hidden;"));
test(".rpg-dialogue-name text-overflow:ellipsis",
  css.includes("text-overflow: ellipsis;\n    white-space: nowrap;\n    max-width: 100%;"));
test(".rpg-dialogue-role text-overflow:ellipsis",
  css.includes("text-overflow: ellipsis;\n    white-space: nowrap;\n    max-width: 100%;"));

// --- 4. NPC default questions are host-style ---
console.log("\n[4] NPC default questions (RpgDialogue.tsx)");
const npcIds = ['abao', 'andreas-siagian', 'anastassia-pistofidou', 'christian-dils', 'giulia-tomasello', 'jonathan-minchin', 'marc-dusseiller', 'mika-satomi', 'rully-shabara', 'ryu-oyama', 'stephanie-pan', 'stelio-manousakis', 'svenja-keune', 'ted-hung', 'tincuta-heinzel', 'wukir-suryadi'];
test(`npcGuideProfiles has all 16 NPCs (${npcIds.length})`,
  npcIds.every((id) => dialogue.includes(`'${id}'`) || dialogue.includes(`${id}:`) || dialogue.includes(`${id} `)));
test("npcGuideProfiles has opener entries for all NPCs",
  (dialogue.match(/opener:\s*\{/g) || []).length >= 16);
test("each npc has 6-language questions",
  (dialogue.match(/questions:\s*\{/g) || []).length >= 16);
test("personaQuestionSeeds exists for fallback",
  dialogue.includes("personaQuestionSeeds"));
test("communityQuestionSeed generates host-style questions",
  dialogue.includes("communityQuestionSeed"));

// --- Summary ---
console.log(`\n\x1b[1mResults: ${passed} passed, ${failed} failed, ${passed + failed} total\x1b[0m\n`);
process.exit(failed > 0 ? 1 : 0);
