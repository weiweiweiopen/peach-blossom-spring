import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const css = readFileSync(join(root, "src", "index.css"), "utf8");
const uiSystem = readFileSync(join(root, "src", "ui-system.css"), "utf8");
const main = readFileSync(join(root, "src", "main.tsx"), "utf8");
const app = readFileSync(join(root, "src", "App.tsx"), "utf8");
const feedback = readFileSync(join(root, "src", "daydream", "associationFeedback.ts"), "utf8");
const generator = readFileSync(join(root, "src", "daydream", "browserAssociationGenerator.ts"), "utf8");
const template = readFileSync(join(root, "src", "daydream", "officialTemplateRenderer.ts"), "utf8");
const rpgDialogue = readFileSync(join(root, "src", "components", "RpgDialogue.tsx"), "utf8");

const checks = [
  ["Chinese print zine scale is language-scoped", /html\[lang="zh-Hant"\].*\.lead[\s\S]*font-size:\s*11pt/.test(generator)],
  ["feedback prompt is writable", /<textarea[^>]+data-pbs-zine-comment/.test(feedback)],
  ["feedback stores comment", /comment\s*=\s*document\.querySelector\("\[data-pbs-zine-comment\]"\)/.test(feedback)],
  ["Japanese talk bubble is capped", /data-language="ja"\] \.mobile-talk-prompt[\s\S]*font-size:\s*clamp\(16px,\s*1\.45vw,\s*21px\)/.test(css)],
  ["Thai talk bubble line-height is bounded", /data-language="th"\] \.mobile-talk-prompt[\s\S]*line-height:\s*1\.48/.test(css)],
  ["Japanese dialogue title is capped", /rpg-dialogue-panel\[data-language="ja"\][\s\S]*--dialogue-title-size:\s*clamp\(24px,\s*2\.25vw,\s*32px\)/.test(css)],
  ["Thai dialogue controls are capped", /rpg-dialogue-panel\[data-language="th"\][\s\S]*--dialogue-control-size:\s*clamp\(16px,\s*1\.28vw,\s*18px\)/.test(css)],
  ["Japanese UI uses native font override", /data-language="ja"\] \.rpg-dialogue-panel[\s\S]*Hiragino Sans/.test(css)],
  ["Japanese chips have final hard cap", /data-language="ja"\] \.rpg-dialogue-panel \.rpg-dialogue-chip[\s\S]*font-size:\s*clamp\(14px,\s*1\.05vw,\s*18px\)/.test(css)],
  ["Japanese loading copy is capped", /data-language="ja"\] \.world-split-panel--zine \.boot-loading-copy[\s\S]*font-size:\s*clamp\(16px,\s*1\.7vw,\s*24px\)/.test(css)],
  ["parent PDF handler keeps emoji text", !/button\.textContent\s*=\s*"開啟列印/.test(app)],
  ["PBS Computer intro is localized", /PBS_COMPUTER_COPY[\s\S]*ja:\s*{[\s\S]*私は PBS LLM wiki/.test(app)],
  ["Pet HUD copy is localized", /PET_HUD_COPY[\s\S]*ja:\s*{[\s\S]*たまごっちエージェント/.test(app)],
  ["Emoji dialogue controls are fixed square", /rpg-dialogue-question-toggle\.pbs-game-button[\s\S]*width:\s*64px[\s\S]*font-size:\s*30px/.test(css)],
  ["Japanese zine toolbar is capped", /world-split-panel--zine \.world-split-toolbar h2[\s\S]*font-size:\s*clamp\(18px,\s*1\.6vw,\s*26px\)/.test(css)],
  ["Screen zine body is enlarged", /\.page \.body, \.page \.refs \{ font-size:clamp\(20px,2\.15vw,28px\)/.test(template)],
  ["Japanese PBS Computer body is capped", /data-language="ja"\] \.rpg-dialogue-panel \.rpg-dialogue-message[\s\S]*font-size:\s*clamp\(18px,\s*1\.25vw,\s*24px\)/.test(css)],
  ["Mobile dialogue copy is capped to input scale", /--mobile-dialogue-input-size:\s*20px[\s\S]*--mobile-dialogue-copy-size:\s*20px[\s\S]*\.rpg-dialogue-message[\s\S]*font-size:\s*var\(--mobile-dialogue-copy-size\)/.test(css)],
  ["Mobile dialogue suggestion text is capped", /\.rpg-dialogue-actions p[\s\S]*font-size:\s*var\(--mobile-dialogue-meta-size\)/.test(css)],
  ["Mobile emoji controls remain 64px square", /@media \(max-width:\s*900px\), \(pointer:\s*coarse\)[\s\S]*rpg-dialogue-question-toggle\.pbs-game-button[\s\S]*width:\s*64px[\s\S]*height:\s*64px[\s\S]*font-size:\s*30px/.test(css)],
  ["PBS Computer submit keeps emoji while busy", /aria-busy=\{isThinking\}[\s\S]*>💬<\/button>/.test(app)],
  ["NPC submit keeps emoji while busy", /aria-busy=\{isLoading\}[\s\S]*>\s*💬\s*<\/button>/.test(rpgDialogue)],
  ["Wukir music button is localized", /const copy:\s*Record<LanguageCode, string>[\s\S]*en:\s*"🎧 Listen to Wukir's music"[\s\S]*th:\s*'🎧 ฟังเพลงของ Wukir'/.test(rpgDialogue)],
  ["PBS Computer copy covers all languages", /PBS_COMPUTER_COPY[\s\S]*"zh-TW":[\s\S]*en:[\s\S]*id:[\s\S]*de:[\s\S]*ja:[\s\S]*th:/.test(app)],
  ["UI system contract loads after legacy CSS", /import '\.\/index\.css';\s*import '\.\/ui-system\.css';/.test(main)],
  ["UI system defines centralized type slots", /--ui-type-title:\s*30px[\s\S]*--ui-type-body:\s*18px[\s\S]*--ui-type-field:\s*18px/.test(uiSystem)],
  ["UI system defines fixed icon recipe", /--ui-icon-button-size:\s*64px[\s\S]*--ui-icon-button-glyph:\s*30px[\s\S]*\[data-ui-control="icon-button"\][\s\S]*width:\s*var\(--ui-icon-button-size\)[\s\S]*font-size:\s*var\(--ui-icon-button-glyph\)/.test(uiSystem)],
  ["PBS Computer uses zine footer recipe", /className="rpg-dialogue-form flex gap-4" data-ui-footer="zine"/.test(app)],
  ["PBS Computer controls are contract-marked", /data-ui-control="icon-button"[\s\S]*aria-label=\{copy\.suggest\}[\s\S]*data-ui-control="icon-button"[\s\S]*>💬<\/button>[\s\S]*data-ui-control="icon-button"[\s\S]*>📚<\/button>/.test(app)],
  ["NPC controls are contract-marked", /data-ui-control="icon-button"[\s\S]*aria-label=\{t\(language, 'dialogue\.askQuestion'\)\}[\s\S]*data-ui-control="icon-button"[\s\S]*>\s*💬\s*<\/button>/.test(rpgDialogue)],
  ["Dialogue text parts are contract-marked", /data-ui-part="title"[\s\S]*data-ui-part="subtitle"[\s\S]*data-ui-part="body"[\s\S]*data-ui-part="field"/.test(app) && /data-ui-part="title"[\s\S]*data-ui-part="subtitle"[\s\S]*data-ui-part="body"[\s\S]*data-ui-part="field"/.test(rpgDialogue)],
  ["Generated zine renders public reading materials", /en:\s*{[\s\S]*title:\s*"Reading materials"[\s\S]*function renderReadingMaterialsSection[\s\S]*class="page pbs-reading-materials"[\s\S]*articleFragment\}\$\{readingMaterials\}\$\{renderAssociationFeedbackSection/.test(generator)],
  ["Reading materials avoid backend labels", !/title:\s*"(?:Sources|Debug|Workflow|Source cards|Trace)"|title:\s*"來源列表"|class="page pbs-readable-trace"/.test(generator)],
  ["Reading material descriptions strip public guard labels", /function cleanReadingMaterialDescription[\s\S]*\(\?:Source\|Excerpt\|Content\)[\s\S]*return \/\\b\(\?:Source\|Excerpt\|Content\|No plaintext extract returned\|Imported\|internal links\\\/categories\)\\b\/i\.test\(cleaned\)[\s\S]*\? ""/.test(generator)],
];

const failures = checks.filter(([, ok]) => !ok).map(([name]) => name);
if (failures.length) {
  console.error("Visual layout guard failures:");
  failures.forEach((name) => console.error(`- ${name}`));
  process.exit(1);
}

console.log(`Visual layout guards passed (${checks.length} checks).`);
