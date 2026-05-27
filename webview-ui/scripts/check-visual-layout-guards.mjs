import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const css = readFileSync(join(root, "src", "index.css"), "utf8");
const uiSystem = readFileSync(join(root, "src", "ui-system.css"), "utf8");
const main = readFileSync(join(root, "src", "main.tsx"), "utf8");
const app = readFileSync(join(root, "src", "App.tsx"), "utf8");
const bottomToolbar = readFileSync(join(root, "src", "components", "BottomToolbar.tsx"), "utf8");
const browserMock = readFileSync(join(root, "src", "browserMock.ts"), "utf8");
const editorToolbar = readFileSync(join(root, "src", "office", "editor", "EditorToolbar.tsx"), "utf8");
const editorActions = readFileSync(join(root, "src", "office", "editor", "editorActions.ts"), "utf8");
const useEditorActions = readFileSync(join(root, "src", "hooks", "useEditorActions.ts"), "utf8");
const officeCanvas = readFileSync(join(root, "src", "office", "components", "OfficeCanvas.tsx"), "utf8");
const officeState = readFileSync(join(root, "src", "office", "engine", "officeState.ts"), "utf8");
const peachWorld = readFileSync(join(root, "src", "world", "peachBlossomWorld.ts"), "utf8");
const campfireManifest = readFileSync(join(root, "public", "assets", "furniture", "MULTI_MIND_CAMPFIRE", "manifest.json"), "utf8");
const furnitureCatalog = readFileSync(join(root, "src", "office", "layout", "furnitureCatalog.ts"), "utf8");
const layoutSerializer = readFileSync(join(root, "src", "office", "layout", "layoutSerializer.ts"), "utf8");
const feedback = readFileSync(join(root, "src", "daydream", "associationFeedback.ts"), "utf8");
const generator = readFileSync(join(root, "src", "daydream", "browserAssociationGenerator.ts"), "utf8");
const template = readFileSync(join(root, "src", "daydream", "officialTemplateRenderer.ts"), "utf8");
const rpgDialogue = readFileSync(join(root, "src", "components", "RpgDialogue.tsx"), "utf8");
const editorialPrompt = readFileSync(join(root, "prompts", "association-editorial-system.md"), "utf8");

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
  ["Campfire wiki intro is localized", /PBS_COMPUTER_COPY[\s\S]*ja:\s*{[\s\S]*火が共有記憶/.test(app)],
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
  ["Generated zine renders public reading materials", /en:\s*{[\s\S]*title:\s*"Reading materials"[\s\S]*function renderReadingMaterialsSection[\s\S]*class="page pbs-reading-materials"[\s\S]*articleFragment\}\$\{readingMaterials\}\$\{workflowTrace\}\$\{renderAssociationFeedbackSection/.test(generator)],
  ["Reading materials avoid duplicate open buttons", !/copy\.open|打開頁面|Open page|background:#fcf46b;box-shadow:2px 2px 0 #111/.test(generator)],
  ["Generated zine trace is prose cards, not raw JSON", /function renderWorkflowTraceSection[\s\S]*traceCard\(copy\.cards\[0\][\s\S]*copy\.intro/.test(generator) && !/function renderWorkflowTraceSection[\s\S]*JSON\.stringify\(trace, null, 2\)[\s\S]*<pre/.test(generator)],
  ["Generated zine trace is multilingual", /function traceCopy[\s\S]*"zh-TW"[\s\S]*en:[\s\S]*id:[\s\S]*de:[\s\S]*ja:[\s\S]*th:[\s\S]*เส้นทางการค้นคืน/.test(generator)],
  ["Thai zine title keeps grapheme shaping", /language === "th"[\s\S]*\[\\u0E00-\\u0E7F\][\s\S]*return escapeHtml\(title\)/.test(template)],
  ["Association loading title avoids Loading ellipsis", /const loadingTitle = "Association"/.test(app) && /boot-loading-title">Association/.test(app)],
  ["Zine toolbar preserves close button with long titles", /world-split-toolbar > div:first-child[\s\S]*min-width:\s*0/.test(css) && /world-split-actions[\s\S]*flex:\s*0 0 auto/.test(css) && /world-split-panel--zine \.world-split-toolbar h2[\s\S]*text-overflow:\s*ellipsis/.test(css) && /Sorgearbeit in offene Communities/.test(app)],
  ["Zine template labels are multilingual", /function templateCopy[\s\S]*Klangkarte[\s\S]*音の地図[\s\S]*แผนที่เสียง[\s\S]*copy\.map[\s\S]*copy\.sequence[\s\S]*copy\.closing/.test(template)],
  ["Zine body auto-links known page names", /function linkKnownPageNames[\s\S]*entryNoteCards\(\)[\s\S]*workflow\.step1\.evidenceCards[\s\S]*target="_blank"/.test(generator) && /linkKnownPageNames\(fragment, workflow\)/.test(generator)],
  ["Reading material descriptions strip public guard labels", /function cleanReadingMaterialDescription[\s\S]*\(\?:Source\|Excerpt\|Content\)[\s\S]*return \/\\b\(\?:Source\|Excerpt\|Content\|No plaintext extract returned\|Imported\|internal links\\\/categories\)\\b\/i\.test\(cleaned\)[\s\S]*\? ""/.test(generator)],
  ["Schema control room is multilingual", /SCHEMA_CONTROL_COPY:\s*Record<LanguageCode[\s\S]*"zh-TW"[\s\S]*en:[\s\S]*id:[\s\S]*de:[\s\S]*ja:[\s\S]*th:/.test(app)],
  ["Schema current flow avoids obsolete Why wording", !/玩家以 Why\?|current game flow[^`]*Why\?/i.test(app)],
  ["UI system uses per-language font stacks", /data-language="zh-TW"[\s\S]*PingFang TC[\s\S]*data-language="ja"[\s\S]*Hiragino Sans[\s\S]*data-language="th"[\s\S]*Noto Sans Thai/.test(uiSystem)],
  ["Dialogue field height is fixed to icon buttons", /rpg-dialogue-input\[data-ui-part="field"\][\s\S]*height:\s*var\(--ui-icon-button-size\)[\s\S]*max-height:\s*var\(--ui-icon-button-size\)/.test(uiSystem)],
  ["Question Pet exposes lint maturity", /function questionLintSignals[\s\S]*question-lint-card/.test(app)],
  ["Zine prompt requires seminar-style argument", /research-seminar zine[\s\S]*future research direction/.test(generator) && /support.*counter-evidence|反例/.test(editorialPrompt + generator)],
  ["Layout editor entry is URL gated", /function readEditorModeParam\(\)[\s\S]*get\("editor"\) === "1"/.test(app) && /\{editorEntryEnabled && \([\s\S]*<BottomToolbar/.test(app)],
  ["Layout editor uses original toolbar handlers", /<BottomToolbar[\s\S]*isEditMode=\{editor\.isEditMode\}[\s\S]*editor\.handleToggleEditMode\(\)[\s\S]*workspaceFolders=\{workspaceFolders\}/.test(app)],
  ["Layout editor toolbar floats above game HUD", /pbs-editor-toolbar/.test(bottomToolbar) && /\.pbs-editor-toolbar[\s\S]*position:\s*fixed[\s\S]*z-index:\s*10000/.test(css)],
  ["Editor mode suppresses PBS HUDs", /playerProfile && !editorEntryEnabled && <div className="floating-ui-layer"/.test(app) && /!editorEntryEnabled && !isEncounterUiOpen[\s\S]*nameTags\.map/.test(app) && /appMode === "interactive" &&[\s\S]*!editorEntryEnabled &&[\s\S]*!isSplitOpen/.test(app) && /!editorEntryEnabled && selectedPet/.test(app)],
  ["Editor mode uses compact 40x40 layout", /COMPACT_EDITOR_MAP_SIZE = 40/.test(peachWorld) && /function createCompactEditorLayout[\s\S]*const cols = COMPACT_EDITOR_MAP_SIZE[\s\S]*const rows = COMPACT_EDITOR_MAP_SIZE/.test(peachWorld) && /params\.get\('editor'\) === '1'[\s\S]*createCompactEditorLayout\(\)/.test(browserMock)],
  ["Editor compact room keeps only house and campfire furniture", /addFurniture\(furniture, 'CRAFTPIX_EXTERIOR_TEMPLE_HOUSE'/.test(peachWorld) && /addFurniture\(furniture, 'MULTI_MIND_CAMPFIRE_1', COMPACT_EDITOR_CAMPFIRE_TILE\.col/.test(peachWorld) && !/function createCompactEditorLayout[\s\S]*CRAFTPIX_INTERIOR_21/.test(peachWorld)],
  ["Campfire is animated collidable 4x4 wiki entry", /MULTI_MIND_CAMPFIRE_6/.test(campfireManifest) && /"footprintW": 4/.test(campfireManifest) && /"footprintH": 4/.test(campfireManifest) && /CAMPFIRE_DIALOGUE_NAME/.test(app) && /interactiveFurnitureTypes/.test(officeCanvas) && /getAnimationFrames\(item\.type\)/.test(officeState)],
  ["CraftPix large assets receive background collision rows", /function normalizedBackgroundTiles[\s\S]*asset\.id\.startsWith\('CRAFTPIX_'\)[\s\S]*asset\.footprintH - 1/.test(furnitureCatalog) && /let zY = \(item\.row \+ entry\.footprintH\) \* TILE_SIZE/.test(layoutSerializer)],
  ["Editor mode exposes safe Map Size control", /showMapSize=\{editorEntryEnabled\}/.test(app) && /Map Size/.test(editorToolbar) && /onResizeMap/.test(editorToolbar) && /function resizeLayout[\s\S]*Resize would cut off/.test(editorActions) && /handleResizeLayout[\s\S]*os\.characters\.values/.test(useEditorActions)],
  ["Editor mode bypasses player setup", /useState\(qaUi\.enabled \|\| editorEntryEnabled\)/.test(app) && /qaUi\.enabled \|\| editorEntryEnabled \? qaPlayerProfile/.test(app)],
];

const failures = checks.filter(([, ok]) => !ok).map(([name]) => name);
if (failures.length) {
  console.error("Visual layout guard failures:");
  failures.forEach((name) => console.error(`- ${name}`));
  process.exit(1);
}

console.log(`Visual layout guards passed (${checks.length} checks).`);
