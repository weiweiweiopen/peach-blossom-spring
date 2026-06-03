import {
  type CSSProperties,
  type FormEvent,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import extraPersonaData from "../../data/extra-personas.json";
import personaData from "../../data/personas.json";
// @ts-ignore Vite raw prompt import for the in-game schema editor.
import bridgeWriterSystemPrompt from "../prompts/pbs-bridge-writer-system.md?raw";
import { BottomToolbar } from "./components/BottomToolbar.js";
import { DebugView } from "./components/DebugView.js";
import { EditActionBar } from "./components/EditActionBar.js";
import { MigrationNotice } from "./components/MigrationNotice.js";
import {
  type PlayerProfile,
  PlayerSetup,
  type StartMode,
} from "./components/PlayerSetup.js";
import { RetroBootScreen } from "./components/RetroBootScreen.js";
import { RpgDialogue } from "./components/RpgDialogue.js";
import { SettingsModal } from "./components/SettingsModal.js";
import { Tooltip } from "./components/Tooltip.js";
import { Modal } from "./components/ui/Modal.js";
import { ZOOM_MAX, ZOOM_MIN } from "./constants.js";
import { useEditorActions } from "./hooks/useEditorActions.js";
import { useEditorKeyboard } from "./hooks/useEditorKeyboard.js";
import { useExtensionMessages } from "./hooks/useExtensionMessages.js";
import {
  applyDocumentLocale,
  type LanguageCode,
  readStoredLanguage,
  supportedLanguages,
  t,
  writeStoredLanguage,
} from "./i18n.js";
import {
  createPresence,
  encounterIdForPlayers,
  getOrCreatePlayerId,
  type MultiplayerChatMessage,
  type MultiplayerConfig,
  type MultiplayerPresence,
  MultiplayerPresenceClient,
  readMultiplayerConfig,
} from "./multiplayerPresence.js";
import { OfficeCanvas } from "./office/components/OfficeCanvas.js";
import { askCampfire, searchMemory } from "./localMemoryApi.js";
import { askDeepSeekPbsQuestionSuggestions } from "./deepseekClient.js";
import { EditorState } from "./office/editor/editorState.js";
import { EditorToolbar } from "./office/editor/EditorToolbar.js";
import { OfficeState } from "./office/engine/officeState.js";
import { isRotatable } from "./office/layout/furnitureCatalog.js";
import { findPath, isWalkable } from "./office/layout/tileMap.js";
import { getCharacterSprites } from "./office/sprites/index.js";
import { Direction, EditTool, type OfficeLayout, type SpriteData, TILE_SIZE } from "./office/types.js";
import { getPersonaNpcAppearance } from "./personaNpcAppearance.js";
import {
  appearanceToSpriteData,
  generateQuestionPet,
} from "./pets/generateQuestionPet.js";
import { type PetDispatch, petStore, tagsFromText } from "./pets/petStore.js";
import { QuestionPetPreview } from "./pets/QuestionPetPreview.js";
import { chooseThrongletExpression } from "./pets/throngletAssets.js";
import { createThrongletWaDirectionalAnimations, resolvePetRoleSlug } from "./pets/throngletWaSprites.js";
import { isBrowserRuntime } from "./runtime.js";
import {
  applyPlayerNpcDialogue,
  applyPlayerThrongletResponse,
  createInitialSnapshot,
  createThronglet,
  type NpcKnowledgeContext,
  tickSimulation,
} from "./simulation/engine.js";
import { scorePromptResonance } from "./simulation/resonance.js";
import {
  type PetDialogueHistoryEntry,
  readPetDialogueHistory,
} from "./simulation/storage.js";
import type { SimSnapshot, Thronglet } from "./simulation/types.js";
import { vscode } from "./vscodeApi.js";
import { getWikiLinksForInterviewee } from "./wikiLinks.js";
import type { WikiSearchResult } from "./wikiSearch.js";
import {
  emptyQuestionQuality,
  scoreQuestionTraversal,
  type QuestionQuality,
} from "./traversal/questionQuality.js";
import {
  COMPACT_EDITOR_CAMPFIRE_TILE,
  compactEditorNpcPlacements,
  NEXT_ROOM_GRID_SIZE,
  NEXT_ROOM_MAP_PADDING,
  nextTinyRoomNpcPlacements,
} from "./world/peachBlossomWorld.js";

interface Persona {
  id: string;
  name: string;
  role: string;
  intro: string;
  responses: Record<string, string>;
}

const personas = [
  ...(personaData.personas as Persona[]),
  ...(extraPersonaData.personas as Persona[]),
];

const topicLabels: Record<string, string> = {
  nomadic: "Nomadic research",
  camp: "Hacker camp",
  independent: "Independent research",
  artScience: "Science art project",
  funding: "How to use funding",
  exchange: "International exchange",
  sustainability: "Open community sustainability",
};

type QaPanel = "computer" | "npc" | "pet" | "zine" | "language" | "hud";

function readEditorModeParam(): boolean {
  if (typeof window === "undefined") return false;
  if (!import.meta.env.DEV) return false;
  return new URLSearchParams(window.location.search).get("editor") === "1";
}

function readQaUiParams(): { enabled: boolean; language: LanguageCode | null; panel: QaPanel } {
  if (typeof window === "undefined") return { enabled: false, language: null, panel: "computer" };
  const params = new URLSearchParams(window.location.search);
  const enabled = params.get("qa-ui") === "1";
  const languageParam = params.get("qa-lang") as LanguageCode | null;
  const panelParam = params.get("qa-panel") as QaPanel | null;
  const language = languageParam && supportedLanguages.some((item) => item.code === languageParam) ? languageParam : null;
  const panel = panelParam && ["computer", "npc", "pet", "zine", "language", "hud"].includes(panelParam) ? panelParam : "computer";
  return { enabled, language, panel };
}

function qaPlayerProfile(language: LanguageCode): PlayerProfile {
  return {
    name: language === "zh-TW" ? "小貓 PBS QA" : "PBS QA Cat",
    palette: 1,
    avatarTitle: "Tamagotchi agent",
    currentRole: "Interface tester",
    mission: "Compare multilingual UI scale without breaking buttons.",
    constraints: "Keep emoji controls fixed.",
    skills: "screenshots, layout, visual QA",
    question: "Which part of Peach Blossom Spring should this interface test?",
    intentMode: "why",
    personalArchive: "Visual QA fixture",
    petSeed: "qa-ui-pet",
  };
}

const PLAYER_ID = 0;
const CONVERSATION_CLOSE_DISTANCE_TILES = 2;
const CAMPFIRE_INTERACTION_RADIUS_TILES = 1;
const PLAYER_SPRINT_SPEED_MULTIPLIER = 2.17;
const PET_WINDOWS_ENABLED = true;
const CENTRAL_COMPUTER_TILE = {
  col: NEXT_ROOM_MAP_PADDING + Math.floor(NEXT_ROOM_GRID_SIZE / 2),
  row: NEXT_ROOM_MAP_PADDING + Math.floor(NEXT_ROOM_GRID_SIZE / 2),
};
const CENTRAL_COMPUTER_FOOTPRINT = { w: 4, h: 4 };
// English canonical name: The Multi-Minds Self Campfire.
const CAMPFIRE_FURNITURE_TYPES = new Set([
  "MULTI_MIND_CAMPFIRE_1",
  "MULTI_MIND_CAMPFIRE_2",
  "MULTI_MIND_CAMPFIRE_3",
  "MULTI_MIND_CAMPFIRE_4",
  "MULTI_MIND_CAMPFIRE_5",
  "MULTI_MIND_CAMPFIRE_6",
  "MULTI_MIND_CAMPFIRE_7",
  "MULTI_MIND_CAMPFIRE_8",
  "MULTI_MIND_CAMPFIRE_9",
  "MULTI_MIND_CAMPFIRE_10",
  "MULTI_MIND_CAMPFIRE_11",
  "MULTI_MIND_CAMPFIRE_12",
]);

function campfireBoundsFromLayout(layout: OfficeLayout) {
  const campfire = layout.furniture.find((item) => CAMPFIRE_FURNITURE_TYPES.has(item.type));
  if (!campfire) {
    return { ...CENTRAL_COMPUTER_TILE, ...CENTRAL_COMPUTER_FOOTPRINT };
  }
  return {
    col: campfire.col,
    row: campfire.row,
    w: CENTRAL_COMPUTER_FOOTPRINT.w,
    h: CENTRAL_COMPUTER_FOOTPRINT.h,
  };
}

function campfireStoneBoundsFromLayout(layout: OfficeLayout) {
  const bounds = campfireBoundsFromLayout(layout);
  return { col: bounds.col, row: bounds.row + bounds.h - 1, w: bounds.w, h: 1 };
}
const MULTIPLAYER_PROXIMITY_DISTANCE_TILES = 3;
const MULTIPLAYER_REENCOUNTER_RESET_TILES = 3;
const MULTIPLAYER_STALE_TIMEOUT_MS = 12000;
const COMMUNITY_NEWS_LINKS = [
  {
    title: "NGM Zine Library",
    url: "https://arai-eek.github.io/zine-library/",
    description: "Non-Governmental Matters community zine library.",
  },
  {
    title: "I.N.S.E.C.T summer camp",
    url: "https://designandposthumanism.org/2022/09/26/i-n-s-e-c-t-summercamp-ome-newcastle-uk/",
    description: "Community summer camp notes and references.",
  },
  {
    title: "arai-eek GitHub",
    url: "https://github.com/arai-eek",
    description: "arai-eek project repositories and community code.",
  },
  {
    title: "Parang CNX Instagram",
    url: "https://www.instagram.com/parang_cnx?igsh=OHRxZjN3aGs0ZGg5",
    description: "Parang CNX updates and community posts on Instagram.",
  },
];

const COMMUNITY_MAP_URL =
  "https://umap.openstreetmap.fr/en/map/non-governmental-matters_862535?scaleControl=false&miniMap=false&scrollWheelZoom=true&zoomControl=true&editinosmControl=false&moreControl=false&searchControl=null&tilelayersControl=null&embedControl=null&datalayersControl=true&onLoadPanel=none&captionBar=false";

const WUKIR_BANDCAMP_ALBUM_URL =
  "https://wukirsuryadi.bandcamp.com/album/institutionalized-ritual";
const WUKIR_BANDCAMP_PLAYER_URL = WUKIR_BANDCAMP_ALBUM_URL;
const TAMAGOTCHI_AGENT_PROMPT = "PBS Tamagotchi companion";
const COMMUNITY_QUERY_PROMPTS: Record<LanguageCode, string[]> = {
  "zh-TW": [
    "我想找藝術表現和生物倫理議題結合的案例，PBS 可以從哪些社群維基開始找？",
    "我要在哪裡找到這些獨立科技藝術營和社群？",
    "為什麼黑客營或獨立藝術營裡常常出現 DIY synth、聲音工具和臨時工作坊？",
    "有沒有電子織品、soft circuit 或 wearable electronics 從教學走向產品/作品的案例？",
    "什麼是獨立藝術營，它和一般展覽、學校課程或科技工作坊有什麼不同？",
    "為什麼 camp 可以作為替代教育形式，而不只是短期活動？",
    "NGM 連到的社群如何把失敗筆記、材料清單和教學步驟變成可重用的公共知識？",
    "低成本工具、DIY 顯微鏡、手作電子和生物實驗如何支持藝術與科學之間的合作？",
    "如果完全不認識 Hackteria、SGMK、KOBAKANT，PBS 可以怎麼帶我看懂它們的關係？",
    "我想做一份給新手看的小誌：哪些維基頁能介紹 NGM 的國際網絡、材料實驗和社群背景？",
  ],
  en: [
    "I want cases where artistic expression meets bioethics; which community wiki paths can PBS start from?",
    "Where can I find these independent technology-art camps and communities?",
    "Why do hacker camps and independent art camps so often include DIY synths, sound tools, or temporary workshops?",
    "Are there examples where e-textiles, soft circuits, or wearable electronics become products, artworks, or teaching kits?",
    "What is an independent art camp, and how is it different from an exhibition, school course, or tech workshop?",
    "Why can a camp work as alternative education instead of just a short event?",
    "How do NGM-related communities turn failure notes, material lists, and teaching steps into reusable public knowledge?",
    "How do low-cost tools, DIY microscopy, handmade electronics, and wet experiments support art-science collaboration?",
    "If I know nothing about Hackteria, SGMK, or KOBAKANT, how can PBS explain how these communities are connected?",
    "Which wiki pages could become a beginner zine about NGM's international network, material experiments, and community background?",
  ],
  id: [
    "Saya ingin mencari contoh seni yang bertemu isu bioetika; jalur wiki komunitas mana yang bisa dibuka PBS?",
    "Di mana saya bisa menemukan camp dan komunitas seni-teknologi independen seperti ini?",
    "Mengapa camp hacker atau camp seni independen sering berisi synth DIY, alat suara, dan workshop sementara?",
    "Apakah ada contoh e-textile, soft circuit, atau wearable electronics yang menjadi produk, karya, atau kit belajar?",
    "Apa itu camp seni independen, dan apa bedanya dengan pameran, kelas sekolah, atau workshop teknologi?",
    "Mengapa camp bisa menjadi pendidikan alternatif, bukan hanya acara singkat?",
    "Bagaimana komunitas yang terkait NGM mengubah catatan gagal, daftar material, dan langkah mengajar menjadi pengetahuan publik?",
    "Bagaimana alat murah, mikroskop DIY, elektronik buatan tangan, dan wet experiment mendukung kerja sama seni-sains?",
    "Jika saya belum mengenal Hackteria, SGMK, atau KOBAKANT, bagaimana PBS menjelaskan hubungan antar komunitas ini?",
    "Halaman wiki mana yang cocok menjadi zine pemula tentang jaringan internasional NGM dan eksperimen material?",
  ],
  de: [
    "Ich suche Beispiele, in denen Kunst und Bioethik zusammentreffen; welche Community-Wiki-Wege kann PBS öffnen?",
    "Wo finde ich solche unabhängigen Technologie-Kunst-Camps und Communities?",
    "Warum enthalten Hacker-Camps oder unabhängige Kunst-Camps so oft DIY-Synths, Klangwerkzeuge und temporäre Workshops?",
    "Gibt es Beispiele, in denen E-Textiles, Soft Circuits oder Wearables zu Produkten, Kunstwerken oder Lernkits werden?",
    "Was ist ein unabhängiges Kunst-Camp, und wie unterscheidet es sich von Ausstellung, Schulklasse oder Technik-Workshop?",
    "Warum kann ein Camp als alternative Bildung funktionieren und nicht nur als kurzes Event?",
    "Wie machen NGM-nahe Communities Fehlernotizen, Materiallisten und Lehrschritte zu wiederverwendbarem öffentlichem Wissen?",
    "Wie unterstützen Low-Cost-Tools, DIY-Mikroskopie, handgemachte Elektronik und Wet Experiments Kunst-Wissenschaft-Kollaboration?",
    "Wenn ich Hackteria, SGMK und KOBAKANT nicht kenne, wie kann PBS ihre Beziehungen erklären?",
    "Welche Wiki-Seiten ergeben ein Anfänger-Zine über NGMs internationales Netzwerk, Materialexperimente und Community-Hintergrund?",
  ],
  ja: [
    "芸術表現と生命倫理が交わる事例を探したい。PBS はどのコミュニティ wiki から案内できる？",
    "こうした独立系テクノロジー・アート camp やコミュニティはどこで見つけられる？",
    "ハッカーキャンプや独立アートキャンプに DIY シンセ、音の道具、臨時ワークショップがよくあるのはなぜ？",
    "電子テキスタイル、soft circuit、wearable electronics が製品・作品・教材になる例はある？",
    "独立アートキャンプとは何で、展示、学校授業、技術ワークショップとどう違う？",
    "なぜ camp は短期イベントではなく代替教育になりうる？",
    "NGM に関わるコミュニティは失敗記録、素材リスト、教える手順をどう公共知に変える？",
    "低コスト工具、DIY 顕微鏡、手作り電子工作、wet experiment は芸術と科学の協働をどう支える？",
    "Hackteria、SGMK、KOBAKANT を知らない人に、PBS はそれぞれの関係をどう説明できる？",
    "NGM の国際ネットワーク、素材実験、コミュニティ背景を新手向け zine にするならどの wiki ページがよい？",
  ],
  th: [
    "ฉันอยากหาเคสที่ศิลปะเชื่อมกับ bioethics; PBS ควรเริ่มจากเส้นทาง wiki ชุมชนไหน?",
    "ฉันจะหา independent technology-art camps และชุมชนแบบนี้ได้ที่ไหน?",
    "ทำไม hacker camp หรือ independent art camp มักมี DIY synth เครื่องมือเสียง และเวิร์กช็อปชั่วคราว?",
    "มีตัวอย่าง e-textile, soft circuit หรือ wearable electronics ที่กลายเป็นสินค้า งานศิลปะ หรือชุดเรียนรู้ไหม?",
    "independent art camp คืออะไร และต่างจากนิทรรศการ ห้องเรียน หรือเวิร์กช็อปเทคโนโลยีอย่างไร?",
    "ทำไม camp จึงเป็น alternative education ได้ ไม่ใช่แค่อีเวนต์สั้นๆ?",
    "ชุมชนที่เกี่ยวกับ NGM เปลี่ยนบันทึกความล้มเหลว รายการวัสดุ และขั้นตอนสอนเป็นความรู้สาธารณะอย่างไร?",
    "เครื่องมือราคาถูก DIY microscopy งานอิเล็กทรอนิกส์ทำมือ และ wet experiment สนับสนุน art-science collaboration อย่างไร?",
    "ถ้าฉันไม่รู้จัก Hackteria, SGMK หรือ KOBAKANT เลย PBS จะอธิบายความเชื่อมโยงอย่างไร?",
    "หน้า wiki ไหนเหมาะทำ zine สำหรับมือใหม่เรื่องเครือข่ายนานาชาติ NGM การทดลองวัสดุ และภูมิหลังชุมชน?",
  ],
};

const QUESTION_SUGGESTION_LOADING_COPY: Record<LanguageCode, string> = {
  "zh-TW": " DeepSeek 正在找更適合新手的問題…",
  en: " DeepSeek is finding better beginner questions…",
  id: " DeepSeek sedang mencari pertanyaan pemula yang lebih baik…",
  de: " DeepSeek sucht bessere Einstiegsfragen…",
  ja: " DeepSeek が初心者向けの質問を探しています…",
  th: " DeepSeek กำลังหาคำถามสำหรับผู้เริ่มต้น…",
};

type PlayMode = "camp" | "expedition";
type AppMode = "interactive" | "dispatch_observer";

interface PetBoardResponse {
  id: string;
  petId: string;
  author?: string;
  text: string;
  createdAt: number;
}

type SplitPanel =
  | { kind: "dialogue.openWiki"; persona: Persona }
  | { kind: "wukirBandcamp" }
  | { kind: "communityLinks" }
  | { kind: "externalLink"; title: string; url: string; description?: string }
  | {
      kind: "finalDocument";
      title: string;
      url: string;
      description?: string;
      language?: LanguageCode;
      query?: string;
      seed?: string;
      petRole?: string;
      isGenerating?: boolean;
      error?: string;
      lowRelevance?: boolean;
    }
  | { kind: "archivePdf" }
  | { kind: "archiveMap" }
  | { kind: "schema" }
  | { kind: "sources" };

type EncounterPanel = {
  partner: MultiplayerPresence;
  encounterId: string;
};
const ExpeditionPanel = lazy(() =>
  import("./components/ExpeditionPanel.js").then((module) => ({
    default: module.ExpeditionPanel,
  })),
);
function splitPanelTitle(panel: SplitPanel, language: LanguageCode): string {
  if (panel.kind === "dialogue.openWiki") return panel.persona.name;
  if (panel.kind === "wukirBandcamp") return "Institutionalized Ritual";
  if (panel.kind === "communityLinks") return t(language, "archive.newsTitle");
  if (panel.kind === "externalLink") return panel.title;
  if (panel.kind === "finalDocument") return panel.title;
  if (panel.kind === "archivePdf") return t(language, "archive.pdfTitle");
  if (panel.kind === "archiveMap") return t(language, "archive.mapTitle");
  if (panel.kind === "schema") return SCHEMA_CONTROL_COPY[language].title;
  if (panel.kind === "sources") return "來源";
  return "PBS 共享記憶";
}

function splitPanelKicker(panel: SplitPanel, language: LanguageCode): string {
  if (panel.kind === "dialogue.openWiki") return "WORLD WIKI";
  if (panel.kind === "wukirBandcamp") return "Wukir Suryadi · Bandcamp";
  if (panel.kind === "communityLinks") return t(language, "archive.communityPortals");
  if (panel.kind === "externalLink") {
    return t(language, "archive.embeddedLink");
  }
  if (panel.kind === "finalDocument") return "WORLD WIKI: association page";
  if (panel.kind === "schema" || panel.kind === "sources") return "🍑";
  return "🍑";
}

const SCHEMA_CONTROL_COPY: Record<LanguageCode, {
  title: string;
  introTitle: string;
  intro: string[];
  contributionTitle: string;
  contributions: string[];
  controlsTitle: string;
  controlsIntro: string;
  labels: Record<string, string>;
  defaults: Record<string, string>;
  actions: string[];
}> = {
  "zh-TW": {
    title: "PBS 共享記憶",
    introTitle: "桃花源作為記憶基礎設施",
    intro: [
      "小型文化組織與獨立藝術網絡依賴關鍵人物、短期補助、臨時工作坊、非正式通訊與個人記憶運作；知識散落在訪談、wiki、雲端文件、展覽紀錄、工作坊材料、社群媒體與口述經驗中，平台或合作一斷裂，脈絡就容易消失。",
      "Non-Governmental Matters 已把電子織品、Hackteria、跨國科技藝術營隊、獨立教育、資金模式與文化差異整理成第一層田野材料。桃花源把這些材料轉成 AI 時代的知識保存問題：文化組織需要能保存、分類、召回、比較、修正與再使用知識的認知系統。",
      "目前的遊戲流程是：玩家在桃花源中探索，和 NPC 訪談記憶對話，向 PBS Computer 提出 LLM Wiki 問題，再把 public source packet 與已提升 wiki memory 的閱讀路徑生成為可閱讀、可列印、可追溯的小誌。問題 lint 由 shared memory traversal 產生，提示問題目前有多少具體度、證據準備與跨系統潛力。",
    ],
    contributionTitle: "預期貢獻",
    contributions: [
      "把 AI 理解為文化仿真機：不是保存單一過去，而是把語言、圖像、風格、資料與勞動痕跡壓縮成可被呼叫的幽靈機器或迴圈。",
      "提出 LLM Wiki 作為小型文化組織記憶基礎設施的設計方法。",
      "把文化幽靈與媒介考古轉化為 AI 知識保存的實作問題。",
      "提出統合 public source packet、大型語言模型與 wiki promotion 的人機協作文化記憶治理框架。",
    ],
    controlsTitle: "遊戲內檢索控制原型",
    controlsIntro: "這些控制項示意玩家未來如何在遊戲內調整會影響檢索、小誌與 lint 的參數，不必重新部署網站。",
    labels: { query: "問題改寫 prompt", writer: "研討型寫作 prompt", schema: "Schema focus", family: "Source priority", depth: "Retrieval depth", evidence: "Evidence threshold", tone: "Language / tone", output: "Output includes" },
    defaults: { query: "把玩家問題改寫成可查證的 PBS LLM Wiki 研究問題；保留模糊性，但補上文化網絡、材料、方法與組織脈絡。", writer: "像研討會短文：釐清問題、提出證據、反例、限制與未來研究方向，不填模板。", schema: "public source packet, promoted wiki memory, wikilink paths, lint maturity", output: "article, reading links, prose trace, lint signals, caveats" },
    actions: ["預覽檢索包", "生成測試小誌", "保存本機 preset"],
  },
  en: {
    title: "PBS shared memory",
    introTitle: "Peach Blossom Spring as memory infrastructure",
    intro: [
      "Small cultural organizations and independent art networks often run on key people, short grants, temporary workshops, informal communication, and personal memory. Their knowledge is scattered across interviews, wikis, cloud folders, grant files, exhibition records, workshop materials, social media, and oral accounts; when platforms, people, or funding disappear, context disappears with them.",
      "Non-Governmental Matters already turns electronic textiles, Hackteria, transnational art-tech camps, independent education, funding models, and cultural difference into first-layer field material. Peach Blossom Spring reframes those materials as an AI-era knowledge-preservation problem: these organizations need a cognitive system for preserving, classifying, recalling, comparing, correcting, and reusing knowledge.",
      "The current game flow is: explore Peach Blossom Spring, speak with NPC interview memories, ask PBS Computer / LLM Wiki questions, and generate printable zines from a public source packet plus promoted wiki memory. Question lint is produced by shared memory traversal, showing specificity, evidence readiness, and cross-system potential.",
    ],
    contributionTitle: "Expected contributions",
    contributions: ["AI as cultural emulator: a ghost machine or loop that compresses past language, images, styles, data, and traces of labor into something callable.", "LLM Wiki as memory infrastructure for small cultural organizations.", "Cultural ghosts and media archaeology become practical AI knowledge-preservation problems.", "Public source packets, LLMs, and wiki promotion become a human-machine governance framework for cultural memory."],
    controlsTitle: "In-game retrieval control prototype",
    controlsIntro: "These controls show how players could tune retrieval, zine writing, and lint behavior inside the game without redeploying the site.",
    labels: { query: "Query rewrite prompt", writer: "Seminar writing prompt", schema: "Schema focus", family: "Source priority", depth: "Retrieval depth", evidence: "Evidence threshold", tone: "Language / tone", output: "Output includes" },
    defaults: { query: "Rewrite the player question into an evidence-checkable PBS LLM Wiki research question; keep ambiguity but add cultural network, material, method, and organizational context.", writer: "Write like a seminar note: clarify the question, evidence, counter-evidence, limits, and future research direction; do not fill a template.", schema: "public source packet, promoted wiki memory, wikilink paths, lint maturity", output: "article, reading links, prose trace, lint signals, caveats" },
    actions: ["Preview packet", "Generate test zine", "Save local preset"],
  },
  id: {
    title: "Memori bersama PBS",
    introTitle: "Peach Blossom Spring sebagai infrastruktur memori",
    intro: ["Organisasi budaya kecil dan jaringan seni independen sering bergantung pada orang kunci, hibah singkat, lokakarya sementara, komunikasi informal, dan memori pribadi. Pengetahuan tersebar di wawancara, wiki, folder cloud, dokumen hibah, arsip pameran, bahan lokakarya, media sosial, dan cerita lisan.", "Non-Governmental Matters telah menjadi bahan lapangan awal tentang tekstil elektronik, Hackteria, camp seni-teknologi lintas negara, pendidikan independen, model pendanaan, dan perbedaan budaya. Peach Blossom Spring mengubahnya menjadi persoalan pelestarian pengetahuan pada era AI.", "Alur sekarang: jelajahi Peach Blossom Spring, bicara dengan memori wawancara NPC, ajukan pertanyaan ke PBS Computer / LLM Wiki, lalu buat zine dari public source packet dan promoted wiki memory. Question lint berasal dari traversal shared memory: seberapa spesifik pertanyaan, seberapa siap buktinya, dan seberapa besar potensi lintas sistemnya."],
    contributionTitle: "Kontribusi yang diharapkan",
    contributions: ["AI sebagai emulator budaya: mesin hantu atau loop yang memadatkan bahasa, gambar, gaya, data, dan jejak kerja masa lalu.", "LLM Wiki sebagai infrastruktur memori untuk organisasi budaya kecil.", "Hantu budaya dan arkeologi media menjadi masalah praktik pelestarian pengetahuan AI.", "Public source packet, LLM, dan wiki promotion menjadi kerangka tata kelola memori budaya manusia-mesin."],
    controlsTitle: "Prototipe kontrol retrieval dalam game",
    controlsIntro: "Kontrol ini menunjukkan bagaimana pemain dapat mengatur retrieval, penulisan zine, dan lint tanpa deploy ulang.",
    labels: { query: "Prompt tulis ulang query", writer: "Prompt tulisan seminar", schema: "Fokus schema", family: "Prioritas sumber", depth: "Kedalaman retrieval", evidence: "Ambang bukti", tone: "Bahasa / nada", output: "Output mencakup" },
    defaults: { query: "Ubah pertanyaan pemain menjadi pertanyaan riset PBS LLM Wiki yang bisa diperiksa bukti.", writer: "Tulis seperti catatan seminar: pertanyaan, bukti, sanggahan, batas, dan arah riset masa depan.", schema: "public source packet, promoted wiki memory, wikilink paths, lint maturity", output: "artikel, tautan bacaan, trace prosa, sinyal lint, caveat" },
    actions: ["Pratinjau paket", "Buat zine tes", "Simpan preset lokal"],
  },
  de: {
    title: "LLM-Wiki Kontrollraum",
    introTitle: "Peach Blossom Spring als Gedächtnis-Infrastruktur",
    intro: ["Kleine Kulturorganisationen und unabhängige Kunstnetzwerke arbeiten oft über Schlüsselpersonen, kurze Förderungen, temporäre Workshops, informelle Kommunikation und persönliches Gedächtnis. Wissen liegt verstreut in Interviews, Wikis, Cloud-Ordnern, Förderakten, Ausstellungsdokumenten, Workshopmaterial, Social Media und mündlichen Erzählungen.", "Non-Governmental Matters bildet bereits Feldmaterial zu E-Textiles, Hackteria, transnationalen Kunst-Technik-Camps, unabhängiger Bildung, Finanzierungsmodellen und kulturellen Differenzen. Peach Blossom Spring macht daraus eine Frage von Wissensbewahrung im KI-Zeitalter.", "Aktueller Ablauf: Peach Blossom Spring erkunden, mit NPC-Interviewgedächtnissen sprechen, PBS Computer / LLM Wiki befragen und Zines aus public source packet und promoted wiki memory erzeugen. Question lint entsteht aus Shared-Memory-Traversal: Spezifik, Evidenzbereitschaft und systemübergreifendes Potenzial."],
    contributionTitle: "Erwartete Beiträge",
    contributions: ["KI als kultureller Emulator: eine Geistermaschine oder Schleife, die vergangene Sprache, Bilder, Stile, Daten und Arbeitsspuren aufrufbar verdichtet.", "LLM Wiki als Gedächtnis-Infrastruktur für kleine Kulturorganisationen.", "Kulturelle Geister und Medienarchäologie werden praktische KI-Wissensbewahrungsfragen.", "Public source packet, LLMs und wiki promotion bilden ein Mensch-Maschine-Governance-Framework für kulturelles Gedächtnis."],
    controlsTitle: "In-game Retrieval-Kontrollprototyp",
    controlsIntro: "Diese Regler zeigen, wie Spieler Retrieval, Zine-Schreiben und Lint im Spiel anpassen könnten, ohne neu zu deployen.",
    labels: { query: "Query-Rewrite-Prompt", writer: "Seminar-Schreibprompt", schema: "Schema-Fokus", family: "Quellenpriorität", depth: "Retrieval-Tiefe", evidence: "Evidenzschwelle", tone: "Sprache / Ton", output: "Output enthält" },
    defaults: { query: "Forme die Spielerfrage in eine überprüfbare PBS LLM Wiki Forschungsfrage um.", writer: "Schreibe wie eine Seminarnotiz: Frage, Evidenz, Gegenbelege, Grenzen und Forschungsrichtung.", schema: "public source packet, promoted wiki memory, wikilink paths, lint maturity", output: "Artikel, Leselinks, Prosa-Trace, Lint-Signale, Caveats" },
    actions: ["Paket prüfen", "Test-Zine", "Preset speichern"],
  },
  ja: {
    title: "PBS 共有記憶",
    introTitle: "記憶基盤としての桃花源",
    intro: ["小さな文化組織や独立したアートネットワークは、キーパーソン、短期助成、一時的なワークショップ、非公式な連絡、個人の記憶に支えられている。知識はインタビュー、wiki、クラウド、助成書類、展示記録、ワークショップ資料、SNS、口述経験に散らばる。", "Non-Governmental Matters は、電子テキスタイル、Hackteria、国際的なアート・テックキャンプ、独立教育、資金モデル、文化差を第一層のフィールド資料にしている。桃花源はそれを AI 時代の知識保存問題として扱う。", "現在の流れは、桃花源を探索し、NPC のインタビュー記憶と話し、PBS Computer / LLM Wiki に問いを投げ、public source packet と promoted wiki memory から小誌をつくること。Question lint は shared memory traversal から生まれ、具体性・証拠準備・横断可能性を示す。"],
    contributionTitle: "期待される貢献",
    contributions: ["AI を文化エミュレーター、過去の言語・画像・様式・データ・労働痕跡を呼び出せる幽霊機械またはループとして捉える。", "小さな文化組織の記憶基盤として LLM Wiki を提案する。", "文化の幽霊とメディア考古学を AI 知識保存の実践問題に変える。", "public source packet、LLM、wiki promotion による人間機械協働の文化記憶ガバナンスを示す。"],
    controlsTitle: "ゲーム内検索コントロール試作",
    controlsIntro: "再デプロイせず、ゲーム内で検索・小誌生成・lint を調整するための試作 UI。",
    labels: { query: "問いの書き換え prompt", writer: "研究会風の執筆 prompt", schema: "Schema focus", family: "Source priority", depth: "Retrieval depth", evidence: "Evidence threshold", tone: "Language / tone", output: "Output includes" },
    defaults: { query: "プレイヤーの問いを、証拠で確認できる PBS LLM Wiki の研究質問に書き換える。", writer: "研究会メモのように、問い、証拠、反証、限界、次の研究方向を書く。", schema: "public source packet, promoted wiki memory, wikilink paths, lint maturity", output: "article, reading links, prose trace, lint signals, caveats" },
    actions: ["検索包をプレビュー", "テスト小誌", "preset 保存"],
  },
  th: {
    title: "ความจำร่วม PBS",
    introTitle: "Peach Blossom Spring ในฐานะโครงสร้างความจำ",
    intro: ["องค์กรวัฒนธรรมขนาดเล็กและเครือข่ายศิลปะอิสระมักพึ่งคนสำคัญ ทุนระยะสั้น เวิร์กช็อปชั่วคราว การสื่อสารไม่เป็นทางการ และความทรงจำส่วนบุคคล ความรู้กระจายอยู่ในสัมภาษณ์ wiki โฟลเดอร์คลาวด์ เอกสารทุน บันทึกนิทรรศการ สื่อเวิร์กช็อป โซเชียลมีเดีย และประสบการณ์เล่าปากต่อปาก", "Non-Governmental Matters เป็นวัสดุภาคสนามชั้นแรกเกี่ยวกับ e-textiles, Hackteria, ค่ายศิลปะ-เทคโนโลยีข้ามชาติ การศึกษาอิสระ โมเดลทุน และความต่างทางวัฒนธรรม Peach Blossom Spring แปลงสิ่งเหล่านี้เป็นปัญหาการเก็บรักษาความรู้ในยุค AI", "ลูปปัจจุบันคือ สำรวจ Peach Blossom Spring คุยกับความทรงจำสัมภาษณ์ของ NPC ถาม PBS Computer / LLM Wiki แล้วสร้างซีนที่เปิดเส้นทางข้าม public source packet และ promoted wiki memory ส่วน question lint มาจาก shared memory traversal และบอกความเฉพาะ ความพร้อมของหลักฐาน และศักยภาพข้ามระบบ"],
    contributionTitle: "ผลงานที่คาดหวัง",
    contributions: ["AI เป็น emulator ทางวัฒนธรรม: เครื่องผีหรือ loop ที่บีบอัดภาษา ภาพ สไตล์ ข้อมูล และร่องรอยแรงงานในอดีตให้เรียกใช้ได้", "LLM Wiki เป็นโครงสร้างความจำสำหรับองค์กรวัฒนธรรมขนาดเล็ก", "ผีทางวัฒนธรรมและโบราณคดีสื่อกลายเป็นโจทย์ปฏิบัติของการเก็บรักษาความรู้ด้วย AI", "public source packets, LLM และ wiki เป็นกรอบ governance ความทรงจำวัฒนธรรมแบบคน-เครื่อง"],
    controlsTitle: "ต้นแบบควบคุม retrieval ในเกม",
    controlsIntro: "คอนโทรลเหล่านี้แสดงวิธีปรับ retrieval, การเขียนซีน และ lint ในเกมโดยไม่ต้อง deploy ใหม่",
    labels: { query: "Query rewrite prompt", writer: "Seminar writing prompt", schema: "Schema focus", family: "Source priority", depth: "Retrieval depth", evidence: "Evidence threshold", tone: "Language / tone", output: "Output includes" },
    defaults: { query: "เขียนคำถามผู้เล่นใหม่ให้เป็นคำถามวิจัย PBS LLM Wiki ที่ตรวจสอบด้วยหลักฐานได้", writer: "เขียนเหมือนโน้ตสัมมนา: คำถาม หลักฐาน ข้อโต้แย้ง ข้อจำกัด และทิศทางวิจัยต่อไป", schema: "public source packet, promoted wiki memory, wikilink paths, lint maturity", output: "article, reading links, prose trace, lint signals, caveats" },
    actions: ["Preview packet", "Generate test zine", "Save preset"],
  },
};

const DEFAULT_SOURCE_URL_TEXT = "https://howtogetwhatyouwant.at, https://www.hackteria.org/wiki/Main_Page, https://wiki.sgmk-ssam.ch/wiki/Main_Page";

function SourceUrlEditor({ compact = false }: { compact?: boolean }) {
  const [sourcesText, setSourcesText] = useState(() => {
    try {
      return window.localStorage.getItem("pbs:sources:url-list:v1") ?? DEFAULT_SOURCE_URL_TEXT;
    } catch {
      return DEFAULT_SOURCE_URL_TEXT;
    }
  });
  const [saved, setSaved] = useState(false);
  const saveSources = async () => {
    const urls = sourcesText.split(",").map((url) => url.trim()).filter(Boolean);
    try {
      window.localStorage.setItem("pbs:sources:url-list:v1", urls.join(", "));
      if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.hostname === "::1") {
        await fetch("/api/sources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls }),
        }).catch(() => undefined);
      }
    } finally {
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    }
  };
  return (
    <section className="schema-control-prototype schema-editorial-prompt-editor">
      <h3>搜尋 sources URL</h3>
      <p>目前來源預設是 Hackteria、HOW TO GET WHAT YOU WANT / KOBAKANT、SGMK。雲端版只能儲存這個欄位文字，不會即時 crawl 新 URL；要真的搜尋新來源，需在本機 server 儲存後重新 crawl / export index / build / deploy。</p>
      <textarea value={sourcesText} onChange={(event) => setSourcesText(event.target.value)} rows={compact ? 5 : 8} spellCheck={false} />
      <div className="schema-control-actions">
        <button type="button" onClick={() => void saveSources()}>儲存來源</button>
        {saved && <span className="schema-save-status">已儲存</span>}
      </div>
    </section>
  );
}

function SourcesControlRoom() {
  return (
    <div className="world-wiki-content world-about-content schema-control-room">
      <section className="schema-intro-card schema-hero-card">
        <p className="schema-kicker">來源</p>
        <h1>Source URLs</h1>
        <p>這是 PBS 共享記憶控制頁裡同一個 sources URL 編輯器的獨立入口。</p>
      </section>
      <SourceUrlEditor />
    </div>
  );
}

function SchemaControlRoom({ language }: { language: LanguageCode }) {
  const copy = SCHEMA_CONTROL_COPY[language];
  const promptStorageKey = "pbs:association-writer-system-prompt:v1";
  const [editorialPromptDraft, setEditorialPromptDraft] = useState(() => {
    try {
      return window.localStorage.getItem(promptStorageKey) || bridgeWriterSystemPrompt;
    } catch {
      return bridgeWriterSystemPrompt;
    }
  });
  const [promptSaved, setPromptSaved] = useState(false);
  const saveEditorialPrompt = () => {
    try {
      window.localStorage.setItem(promptStorageKey, editorialPromptDraft);
      setPromptSaved(true);
      window.setTimeout(() => setPromptSaved(false), 1800);
    } catch {
      setPromptSaved(false);
    }
  };
  return (
    <div className="world-wiki-content world-about-content schema-control-room">
      <section className="schema-intro-card schema-hero-card">
        <p className="schema-kicker">{copy.title}</p>
        <h3>{copy.introTitle}</h3>
        {copy.intro.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </section>

      <section className="schema-control-prototype">
        <h3>{copy.controlsTitle}</h3>
        <p>{copy.controlsIntro}</p>
        <ul>
          <li>目前實際接線的是 sources URL、local memory source-first search、NPC persona/transcript 回答、以及小誌 writer prompt。</li>
          <li>traversal 長度、depth、threshold 那些滑桿先不顯示，因為目前沒有接到真正的檢索參數；之後接線再放回來。</li>
          <li>小誌 writer 使用下方可編輯 prompt；儲存後下一次生成立即套用。</li>
        </ul>
      </section>

      <SourceUrlEditor compact />

      <section className="schema-control-prototype schema-editorial-prompt-editor">
        <h3>PBS 共享記憶 writer prompt</h3>
        <p>編輯本機小誌 editorial writer prompt；儲存後下一次小誌生成會立即套用。</p>
        <textarea value={editorialPromptDraft} onChange={(event) => setEditorialPromptDraft(event.target.value)} spellCheck={false} />
        <div className="schema-control-actions">
          <button type="button" onClick={saveEditorialPrompt}>儲存 prompt</button>
          {promptSaved && <span className="schema-save-status">已儲存，下一次生成生效</span>}
        </div>
      </section>
    </div>
  );
}

function AssociationLoadingPage({ language, progress }: { language: LanguageCode; progress?: string }) {
  void language;
  return (
    <div className="world-association-loading boot-loading-screen" role="status" aria-live="polite">
      <div className="boot-loading-card pbs-frame F3 pbs-frame-f3">
        <p className="boot-loading-title">Association</p>
        <p key={progress ?? "loading"} className="boot-loading-copy association-stage-pop">{progress ?? "Loading..."}</p>
        <span className="boot-loading-dots" aria-hidden="true" />
      </div>
    </div>
  );
}

function associationErrorCopy(language: LanguageCode): { title: string; retry: string } {
  const copy: Record<LanguageCode, { title: string; retry: string }> = {
    "zh-TW": { title: "小誌生成失敗。", retry: "重試" },
    en: { title: "Wiki zine failed.", retry: "Retry" },
    id: { title: "Zine wiki gagal.", retry: "Coba lagi" },
    de: { title: "Wiki-Zine fehlgeschlagen.", retry: "Erneut versuchen" },
    ja: { title: "Wiki小誌の生成に失敗しました。", retry: "再試行" },
    th: { title: "สร้างซีนวิกิไม่สำเร็จ", retry: "ลองอีกครั้ง" },
  };
  return copy[language];
}

function safeDebugText(value: unknown, max = 500): string {
  return String(value ?? "")
    .replace(/sk-[A-Za-z0-9_-]+/g, "sk-***")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer ***")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function classifyAssociationError(message: string): string {
  if (/low_relevance_zine|insufficient_evidence_zine|LowRelevanceZineError|not enough relevant|沒有找到足夠的證據/i.test(message)) return "low_relevance_zine";
  if (/http_error\s*(\d+)|DeepSeek proxy failed\s*(\d+)/i.test(message)) {
    const match = message.match(/http_error\s*(\d+)|DeepSeek proxy failed\s*(\d+)/i);
    return `http_error ${match?.[1] ?? match?.[2] ?? "unknown"}`;
  }
  if (/AbortError|timed out|timeout/i.test(message)) return "AbortError / timeout";
  if (/JSON parse failed|parseable JSON|JSON\.parse/i.test(message)) return "JSON parse failed";
  if (/public safety gate|public artifact|forbidden|unsupported|validation/i.test(message)) return "public_validation_error";
  return "unknown_error";
}

function isLowRelevanceAssociationError(message: string): boolean {
  return classifyAssociationError(message) === "low_relevance_zine";
}

function readZineTraceDebug(): { errorClass: string; errorMessage: string; calls: string; forbidden: string; pages: string } | null {
  try {
    const trace = JSON.parse(localStorage.getItem("pbs:last-zine-click-trace") || "null") as any;
    if (!trace) return null;
    const calls = Array.isArray(trace.deepSeek?.calls) ? trace.deepSeek.calls : [];
    const callSummary = calls.map((call: any, index: number) => {
      const status = call.status ?? "unknown";
      const http = call.httpStatus ?? "n/a";
      const duration = call.durationMs ?? "n/a";
      const klass = call.errorClass ?? "none";
      return `#${index + 1} ${status} HTTP ${http} ${duration}ms ${klass}`;
    }).join("; ") || "no DeepSeek calls recorded";
    const forbidden = trace.publicValidation?.forbiddenTermsFound?.join(", ") || "none";
    const pages = `matched ${trace.matchedPages?.length ?? 0}, linked ${trace.linkedPages?.length ?? 0}, deep-read ${trace.deepReadPages?.length ?? 0}`;
    return {
      errorClass: safeDebugText(trace.errorClass ?? classifyAssociationError(trace.errorMessage ?? ""), 140),
      errorMessage: safeDebugText(trace.errorMessage ?? "", 500),
      calls: safeDebugText(callSummary, 500),
      forbidden: safeDebugText(forbidden, 240),
      pages: safeDebugText(pages, 120),
    };
  } catch {
    return null;
  }
}

function AssociationErrorPage({ message, language, onRetry }: { message: string; language: LanguageCode; onRetry?: () => void }) {
  const copy = associationErrorCopy(language);
  const traceDebug = readZineTraceDebug();
  const errorType = classifyAssociationError(message || traceDebug?.errorMessage || traceDebug?.errorClass || "");
  return (
    <div className="world-association-error" role="alert">
      <strong>{copy.title}</strong>
      <p>{safeDebugText(message, 500)}</p>
      <div className="world-association-error-debug">
        <p><strong>Error type:</strong> {errorType}</p>
        {traceDebug && (
          <>
            <p><strong>Trace errorClass:</strong> {traceDebug.errorClass}</p>
            {traceDebug.errorMessage && <p><strong>Trace message:</strong> {traceDebug.errorMessage}</p>}
            <p><strong>DeepSeek calls:</strong> {traceDebug.calls}</p>
            <p><strong>Forbidden terms:</strong> {traceDebug.forbidden}</p>
            <p><strong>Pages:</strong> {traceDebug.pages}</p>
          </>
        )}
      </div>
      {onRetry && (
        <button className="pbs-game-button" type="button" onClick={onRetry}>{copy.retry}</button>
      )}
    </div>
  );
}

function AssociationLowRelevancePage({ language, query, onRetry }: { language: LanguageCode; query?: string; onRetry?: () => void }) {
  const copy = associationErrorCopy(language);
  const lines: Record<LanguageCode, string[]> = {
    "zh-TW": [
      "沒有找到足夠的證據支持這個結論。電子雞先不裝訂，避免把鬆散頁面寫成錯誤論點。",
      "這個問題和現在的維基火路還沒有接上，電子雞想先幫你換一個更靠近材料的問法。",
      "目前的維基和這個問題沒有足夠多的相關性，電子雞先把小誌鍋蓋蓋起來。",
      "這條問題小徑暫時太霧了，電子雞需要更多頁面線索才敢裝訂成小誌。",
    ],
    en: [
      "Not enough evidence was found to support that conclusion. The pet is keeping the zine unbound instead of turning loose pages into a false claim.",
      "This question has not found enough warm wiki paths yet. The pet wants a more material-facing question.",
      "The wiki does not have enough relevant traces for this question right now, so the pet is keeping the zine unbound.",
      "This path is too foggy for a zine. The pet needs more page clues first.",
    ],
    id: ["Jejak wiki untuk pertanyaan ini belum cukup kuat. Pet ingin pertanyaan yang lebih dekat dengan bahan."],
    de: ["Zu dieser Frage gibt es noch zu wenige passende Wiki-Spuren. Das Pet braucht eine materialnaehere Frage."],
    ja: ["この問いにつながる wiki の道がまだ足りません。ペットは、もう少し材料に近い問いを待っています。"],
    th: ["เส้นทาง wiki สำหรับคำถามนี้ยังไม่พอ pet อยากได้คำถามที่ใกล้วัสดุมากกว่านี้"],
  };
  const options = lines[language];
  const index = Math.abs(Array.from(query ?? "pbs").reduce((sum, char) => sum + char.charCodeAt(0), 0)) % options.length;
  return (
    <div className="world-association-low-relevance" role="status" aria-live="polite">
      <div className="world-association-low-relevance-pet">
        <QuestionPetPreview question={query || "low relevance zine"} size={5} socialSignals={{ stress: 92, energy: 18, curiosity: 35 }} currentAction="rest" />
      </div>
      <div className="world-association-low-relevance-bubble">
        <p>{options[index]}</p>
      </div>
      {onRetry && <button className="pbs-game-button" type="button" onClick={onRetry}>{copy.retry}</button>}
    </div>
  );
}

function DialoguePixelAvatar({ sprite, label }: { sprite: SpriteData; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="bg-bg/80 border border-border p-2"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${(sprite[0]?.length ?? 1).toString()}, 3px)`,
          gridAutoRows: "3px",
        }}
        aria-label={label}
      >
        {sprite.flatMap((row, rowIndex) =>
          row.map((color, colIndex) => (
            <span
              key={`${rowIndex.toString()}-${colIndex.toString()}`}
              style={{ backgroundColor: color || "transparent" }}
            />
          )),
        )}
      </div>
      <span className="max-w-[110px] truncate text-xs text-text-muted">{label}</span>
    </div>
  );
}

function PlayerDialogueAvatar({ palette, label }: { palette: number; label: string }) {
  const [frame, setFrame] = useState(0);
  const sprite = useMemo(() => getCharacterSprites(palette, 0).walk[Direction.DOWN][frame % 4], [frame, palette]);
  useEffect(() => {
    const id = window.setInterval(() => setFrame((current) => current + 1), 120);
    return () => window.clearInterval(id);
  }, []);
  return <DialoguePixelAvatar sprite={sprite} label={label} />;
}

function shuffleCopy<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function ComputerDialogueAvatar({ label }: { label: string }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setFrame((current) => current + 1), 90);
    return () => window.clearInterval(id);
  }, []);
  const src = `${import.meta.env.BASE_URL}assets/furniture/MULTI_MIND_CAMPFIRE/MULTI_MIND_CAMPFIRE_${(frame % 12) + 1}.png`;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="rpg-dialogue-avatar-frame rpg-dialogue-avatar-frame--campfire border border-border bg-bg/80 p-2 flex items-center justify-center overflow-hidden" aria-hidden="true">
        <img
          src={src}
          alt=""
          className="block max-w-none object-contain"
          style={{ imageRendering: "pixelated", width: 184, height: 184 }}
        />
      </div>
      <span className="max-w-[110px] truncate text-xs text-text-muted">{label}</span>
    </div>
  );
}

const PBS_COMPUTER_COPY: Record<LanguageCode, { name: string; kicker: string; subtitle: string; playerSpeaker: string; intro: string; fail: string; failError: string; needQuestion: string; sourceTitle: string; sourceLinks: string; noLinks: string; suggestions: string; placeholder: string; suggest: string; zine: string; thinking: string }> = {
  "zh-TW": {
    name: "多重心智自我火燄",
    kicker: "LLM WIKI 營火",
    subtitle: "聯想 / 共享火光終端",
    playerSpeaker: "你",
    intro: "我是多重心智的火燄。圍著火問社群、方法、材料或組織問題，我會短答、列出可點頁面，並每次給你一個使用 PBS 的小 tip。",
    fail: "LLM 回答暫時失敗；先列出本地 wiki 搜尋結果，你可以直接點開查閱。",
    failError: "營火暫時無法回答。",
    needQuestion: "請先輸入一個想探索的桃花源社群問題。",
    sourceTitle: "Wiki 搜尋結果 / 真實連結",
    sourceLinks: "相關連結",
    noLinks: "這次沒有找到可直接連結的 wiki 頁。",
    suggestions: "選一個給新手的入口問題，讓 PBS 帶你認識 NGM、材料實驗、營隊與國際社群網絡：",
    placeholder: "問：想找藝術/生物倫理、DIY synth、電子織品、獨立藝術營或替代教育案例嗎？",
    suggest: "建議一個問題",
    zine: "維基小書",
    thinking: "火正在聽木柴裡的共同記憶...",
  },
  en: {
    name: "The Multi-Minds Self Campfire",
    kicker: "LLM Wiki Campfire",
    subtitle: "Association / shared-fire terminal",
    playerSpeaker: "You",
    intro: "I am the Flame of Many Minds. Ask around the fire about a community, method, material, or organization; I answer briefly, list real pages below, and give one small PBS tip each time.",
    fail: "The LLM answer failed for now; here are the local wiki search results you can open directly.",
    failError: "The campfire failed to answer.",
    needQuestion: "Enter a Peach Blossom Spring community question first.",
    sourceTitle: "Wiki search results / real links",
    sourceLinks: "Source links",
    noLinks: "No directly linkable wiki pages were found this time.",
    suggestions: "Pick a beginner-friendly host question about NGM, material experiments, camps, and international community networks:",
    placeholder: "Ask about art/bioethics, DIY synths, e-textiles, independent art camps, or alternative education…",
    suggest: "Suggest a question",
    zine: "Wiki zine",
    thinking: "The fire is listening through the shared memory...",
  },
  id: {
    name: "Api Diri Banyak Pikiran",
    kicker: "Api Unggun Wiki LLM",
    subtitle: "Asosiasi / terminal api bersama",
    playerSpeaker: "Kamu",
    intro: "Saya Api Banyak Pikiran. Bertanyalah di sekitar api tentang komunitas, metode, material, atau organisasi; saya menjawab singkat dari memori bersama dan menampilkan halaman nyata di bawah.",
    fail: "Jawaban LLM sementara gagal; ini hasil pencarian wiki lokal yang bisa dibuka langsung.",
    failError: "Api unggun gagal menjawab.",
    needQuestion: "Masukkan dulu pertanyaan komunitas Peach Blossom Spring.",
    sourceTitle: "Hasil pencarian wiki / tautan nyata",
    sourceLinks: "Tautan sumber",
    noLinks: "Tidak ada halaman wiki yang bisa ditautkan langsung kali ini.",
    suggestions: "Pilih pertanyaan pengantar tentang NGM, eksperimen material, camp, dan jaringan komunitas internasional:",
    placeholder: "Tanya tentang seni/bioetika, synth DIY, e-textile, camp seni independen, atau pendidikan alternatif…",
    suggest: "Sarankan pertanyaan",
    zine: "Zine wiki",
    thinking: "Api mendengar memori bersama...",
  },
  de: {
    name: "Das Viel-Geist-Selbst-Lagerfeuer",
    kicker: "LLM-Wiki-Lagerfeuer",
    subtitle: "Assoziations- / geteiltes-Feuer-Terminal",
    playerSpeaker: "Du",
    intro: "Ich bin die Flamme vieler Geister. Frag am Feuer nach Community, Methode, Material oder Organisation; ich antworte kurz aus dem geteilten Gedaechtnis und liste echte Seiten unten auf.",
    fail: "Die LLM-Antwort ist gerade fehlgeschlagen; hier sind lokale Wiki-Suchergebnisse zum Öffnen.",
    failError: "Das Lagerfeuer konnte nicht antworten.",
    needQuestion: "Gib zuerst eine Frage zur Peach-Blossom-Spring-Community ein.",
    sourceTitle: "Wiki-Suchergebnisse / echte Links",
    sourceLinks: "Quellenlinks",
    noLinks: "Diesmal wurden keine direkt verlinkbaren Wiki-Seiten gefunden.",
    suggestions: "Wähle eine Einstiegsfrage zu NGM, Materialexperimenten, Camps und internationalen Community-Netzwerken:",
    placeholder: "Frage nach Kunst/Bioethik, DIY-Synths, E-Textiles, unabhängigen Kunst-Camps oder alternativer Bildung…",
    suggest: "Frage vorschlagen",
    zine: "Wiki-Zine",
    thinking: "Das Feuer lauscht dem geteilten Gedaechtnis...",
  },
  ja: {
    name: "多重の心の自己の火",
    kicker: "LLM Wiki の火",
    subtitle: "連想 / 共有の火の端末",
    playerSpeaker: "あなた",
    intro: "私は多重の心の火です。火を囲んでコミュニティ、方法、素材、組織について質問してください。共有記憶から短く答え、下に実在するページを並べます。",
    fail: "LLM の回答に失敗しました。まず開けるローカル wiki 検索結果を表示します。",
    failError: "火は回答できませんでした。",
    needQuestion: "先に Peach Blossom Spring のコミュニティ質問を入力してください。",
    sourceTitle: "Wiki 検索結果 / 実在リンク",
    sourceLinks: "関連リンク",
    noLinks: "今回は直接開ける wiki ページが見つかりませんでした。",
    suggestions: "NGM、素材実験、camp、国際コミュニティネットワークを知るための入口質問を選んでください：",
    placeholder: "芸術/生命倫理、DIY シンセ、電子テキスタイル、独立アートキャンプ、代替教育について聞く…",
    suggest: "質問を提案",
    zine: "Wiki 小誌",
    thinking: "火が共有記憶を聞いています...",
  },
  th: {
    name: "กองไฟตัวตนหลายจิตใจ",
    kicker: "กองไฟ Wiki ของ LLM",
    subtitle: "การเชื่อมโยง / ปลายทางไฟร่วม",
    playerSpeaker: "คุณ",
    intro: "ฉันคือเปลวไฟแห่งหลายจิตใจ ถามรอบกองไฟเรื่องชุมชน วิธี วัสดุ หรือองค์กรได้ ฉันจะตอบสั้นจากความทรงจำร่วมและแสดงหน้าจริงด้านล่าง",
    fail: "คำตอบจาก LLM ล้มเหลวชั่วคราว ต่อไปนี้คือผลค้นหา wiki ในเครื่องที่เปิดดูได้ทันที",
    failError: "กองไฟตอบไม่ได้ในตอนนี้",
    needQuestion: "กรุณาใส่คำถามเกี่ยวกับชุมชน Peach Blossom Spring ก่อน",
    sourceTitle: "ผลค้นหา wiki / ลิงก์จริง",
    sourceLinks: "ลิงก์แหล่งที่มา",
    noLinks: "ครั้งนี้ไม่พบหน้า wiki ที่เปิดลิงก์ได้โดยตรง",
    suggestions: "เลือกคำถามเริ่มต้นเกี่ยวกับ NGM การทดลองวัสดุ camp และเครือข่ายชุมชนนานาชาติ:",
    placeholder: "ถามเรื่องศิลปะ/bioethics, DIY synth, e-textile, independent art camp หรือ alternative education…",
    suggest: "เสนอคำถาม",
    zine: "ซีน wiki",
    thinking: "ไฟกำลังฟังความทรงจำร่วม...",
  },
};

const PET_HUD_COPY: Record<LanguageCode, { agent: string; note: string; recent: string; action: Record<string, string>; score: Record<string, string> }> = {
  "zh-TW": { agent: "Tamagotchi agent", note: "「PBS Tamagotchi agent」在桃花源裡閃了一下，像剛學會聽人的小生物。", recent: "最近問題紀錄", action: { wander: "閒晃", visitRiver: "去河邊", joinThrong: "加入群聚", reflect: "反思", hibernate: "休眠" }, score: { interaction: "互動", wisdom: "智慧", community: "社群", resource: "資源", skill: "技能", care: "照護" } },
  en: { agent: "Tamagotchi agent", note: "The PBS Tamagotchi agent flickers through Peach Blossom Spring like a small creature learning to listen.", recent: "recent question history", action: { wander: "wander", visitRiver: "visit river", joinThrong: "join throng", reflect: "reflect", hibernate: "hibernate" }, score: { interaction: "interaction", wisdom: "wisdom", community: "community", resource: "resource", skill: "skill", care: "care" } },
  id: { agent: "Agen Tamagotchi", note: "Agen Tamagotchi PBS berkelip di Peach Blossom Spring seperti makhluk kecil yang belajar mendengar.", recent: "riwayat pertanyaan terbaru", action: { wander: "berkeliling", visitRiver: "ke sungai", joinThrong: "bergabung", reflect: "merenung", hibernate: "hibernasi" }, score: { interaction: "interaksi", wisdom: "kebijaksanaan", community: "komunitas", resource: "sumber daya", skill: "keterampilan", care: "perawatan" } },
  de: { agent: "Tamagotchi-Agent", note: "Der PBS Tamagotchi-Agent flackert durch Peach Blossom Spring wie ein kleines Wesen, das Zuhören lernt.", recent: "letzte Fragen", action: { wander: "wandern", visitRiver: "zum Fluss", joinThrong: "anschließen", reflect: "nachdenken", hibernate: "ruhen" }, score: { interaction: "Interaktion", wisdom: "Weisheit", community: "Community", resource: "Ressource", skill: "Fähigkeit", care: "Fürsorge" } },
  ja: { agent: "たまごっちエージェント", note: "PBS たまごっちエージェントは、人の話を聞き始めた小さな生き物のように桃花源をちらりと横切ります。", recent: "最近の質問履歴", action: { wander: "散歩", visitRiver: "川へ行く", joinThrong: "群れに入る", reflect: "考える", hibernate: "休む" }, score: { interaction: "交流", wisdom: "知恵", community: "共同体", resource: "資源", skill: "技能", care: "ケア" } },
  th: { agent: "ตัวแทน Tamagotchi", note: "ตัวแทน PBS Tamagotchi กะพริบผ่าน Peach Blossom Spring เหมือนสิ่งมีชีวิตเล็กๆ ที่กำลังเรียนรู้การฟัง", recent: "ประวัติคำถามล่าสุด", action: { wander: "เดินเล่น", visitRiver: "ไปแม่น้ำ", joinThrong: "เข้ากลุ่ม", reflect: "ไตร่ตรอง", hibernate: "พัก" }, score: { interaction: "ปฏิสัมพันธ์", wisdom: "ปัญญา", community: "ชุมชน", resource: "ทรัพยากร", skill: "ทักษะ", care: "การดูแล" } },
};

const CAMPFIRE_BROADCASTS: Record<LanguageCode, string[]> = {
  "zh-TW": [
    "你的憤怒、快樂與好奇，可能也在別人的心智裡燃燒。",
    "多重心智不是比喻而已；它是跨訪談觀點同步出的共享自我。",
    "希臘人替共享原型建廟；PBS 把多個訪談觀點編成可查詢的火堆。",
  ],
  en: [
    "Your anger, joy, and curiosity may also burn in other minds.",
    "A multi-mind self is a shared pattern synchronized across people.",
    "The Greeks built temples for shared archetypes; PBS builds an index around many interview minds.",
  ],
  id: [
    "Marah, gembira, dan ingin tahumu mungkin juga menyala di pikiran lain.",
    "Diri banyak-pikiran adalah pola bersama yang diselaraskan antarorang.",
    "PBS membuat indeks di sekitar banyak pikiran wawancara, seperti api yang bisa ditanyai.",
  ],
  de: [
    "Dein Aerger, deine Freude und Neugier koennen auch in anderen Koepfen brennen.",
    "Ein Viel-Geist-Selbst ist ein gemeinsames Muster, das sich zwischen Menschen synchronisiert.",
    "PBS baut einen fragbaren Feuerkreis um viele Interview-Geister.",
  ],
  ja: [
    "あなたの怒り、喜び、好奇心は、他の心にも燃えているかもしれない。",
    "多重心智の自己は、人々のあいだで同期する共有パターンです。",
    "PBS は複数のインタビューの心を囲む、質問できる火のインデックスを作ります。",
  ],
  th: [
    "ความโกรธ ความสุข และความสงสัยของคุณอาจลุกอยู่ในใจคนอื่นด้วย",
    "ตัวตนหลายจิตใจคือรูปแบบร่วมที่ประสานกันข้ามผู้คน",
    "PBS สร้างดัชนีรอบจิตใจจากหลายบทสัมภาษณ์ เหมือนกองไฟที่ถามได้",
  ],
};

const THOUGHT_GAP_BROADCASTS: Record<LanguageCode, string[]> = {
  "zh-TW": [
    "思想缺口：SGMK 的 DIY 電子合成器頁面很多，但還缺少把套件、聲音與工作坊組織連起來的概念頁。",
    "思想缺口：材料實作已經長出來了，照護、維修與失敗紀錄還需要被編成可比較的問題。",
    "思想缺口：小誌可以引用頁面，但 wiki 還需要更清楚標出哪些關係只是猜想、哪些已有證據。",
  ],
  en: [
    "THOUGHT GAP: SGMK has many DIY electronics pages, but still needs a concept page linking kits, sound, and workshop organization.",
    "THOUGHT GAP: Material practice is visible; care, maintenance, and failure notes still need better comparative questions.",
    "THOUGHT GAP: The zine can cite pages, but the wiki should mark which relations are evidence and which are still hypotheses.",
  ],
  id: ["THOUGHT GAP: praktik material terlihat, tetapi catatan perawatan, pemeliharaan, dan kegagalan perlu jadi pertanyaan pembanding."],
  de: ["THOUGHT GAP: Materialpraxis ist sichtbar; Sorge, Wartung und Fehlernotizen brauchen noch vergleichbare Fragen."],
  ja: ["THOUGHT GAP: 素材実践は見えていますが、ケア、保守、失敗記録を比較できる問いにする必要があります。"],
  th: ["THOUGHT GAP: เห็นการปฏิบัติด้านวัสดุแล้ว แต่ care การซ่อมบำรุง และบันทึกความล้มเหลวยังต้องกลายเป็นคำถามเปรียบเทียบ"],
};

const PET_LINT_GAP_INBOX_KEY = "pbs:pet:lint-gap-inbox";

interface PetLintGapItem {
  id: string;
  text: string;
  language: LanguageCode;
  createdAt: string;
  source: "thought-gap-broadcast" | "zine-feedback";
}

function readPetLintGapInbox(): PetLintGapItem[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(PET_LINT_GAP_INBOX_KEY) || "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is PetLintGapItem =>
      Boolean(item) &&
      typeof item === "object" &&
      typeof (item as PetLintGapItem).id === "string" &&
      typeof (item as PetLintGapItem).text === "string",
    );
  } catch {
    return [];
  }
}

function writePetLintGapInbox(items: PetLintGapItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PET_LINT_GAP_INBOX_KEY, JSON.stringify(items.slice(0, 24)));
}

const PET_LINT_GAP_COPY: Record<LanguageCode, { title: string; empty: string }> = {
  "zh-TW": { title: "知識漏洞", empty: "還沒有累積的 lint / 思想缺口。" },
  en: { title: "Knowledge gaps", empty: "No accumulated lint or thought gaps yet." },
  id: { title: "Celah pengetahuan", empty: "Belum ada lint atau celah pikiran yang terkumpul." },
  de: { title: "Wissensluecken", empty: "Noch keine gesammelten Lint- oder Gedankenluecken." },
  ja: { title: "知識の穴", empty: "蓄積された lint / 思考の穴はまだありません。" },
  th: { title: "ช่องว่างความรู้", empty: "ยังไม่มี lint หรือช่องว่างความคิดที่สะสมไว้" },
};

const PET_RUNAWAY_NOTICE: Record<LanguageCode, string> = {
  "zh-TW": "你的問題電子雞看了你一眼，然後用不合理的速度拋下你。",
  en: "Your question pet looks at you once, then abandons you at unreasonable speed.",
  id: "Pet pertanyaanmu menatapmu sekali, lalu meninggalkanmu dengan kecepatan tidak masuk akal.",
  de: "Dein Fragen-Pet sieht dich einmal an und laesst dich dann mit unvernünftiger Geschwindigkeit zurück.",
  ja: "問いのペットは一度あなたを見てから、ありえない速さで置き去りにします。",
  th: "สัตว์เลี้ยงคำถามมองคุณครั้งหนึ่ง แล้วทิ้งคุณไปด้วยความเร็วที่ไม่สมเหตุสมผล",
};

const ZINE_REPAIR_COPY: Record<LanguageCode, { feedback: string; received: string }> = {
  "zh-TW": { feedback: "小誌 feedback", received: "已收到排修資訊，正在重生小誌。" },
  en: { feedback: "Zine feedback", received: "Repair notes received. Regenerating the zine." },
  id: { feedback: "Umpan balik zine", received: "Catatan perbaikan diterima. Zine sedang dibuat ulang." },
  de: { feedback: "Zine-Feedback", received: "Reparaturnotizen empfangen. Das Zine wird neu erzeugt." },
  ja: { feedback: "Zine フィードバック", received: "修正メモを受け取りました。小誌を再生成しています。" },
  th: { feedback: "ฟีดแบ็กซีน", received: "ได้รับโน้ตซ่อมแล้ว กำลังสร้างซีนใหม่" },
};

function petLintGapTitle(language: LanguageCode): string {
  return PET_LINT_GAP_COPY[language].title;
}

function petActionLabel(language: LanguageCode, action: string): string {
  return PET_HUD_COPY[language].action[action] ?? action;
}

function questionLintCopy(language: LanguageCode) {
  const copy: Record<LanguageCode, { title: string; specificity: string; evidence: string; bridge: string; next: string; revise: string }> = {
    "zh-TW": { title: "問題 lint / traversal 品質", specificity: "具體度", evidence: "證據準備", bridge: "跨系統潛力", next: "下一步", revise: "等待 shared memory traversal。" },
    en: { title: "Question lint / traversal quality", specificity: "specificity", evidence: "evidence readiness", bridge: "cross-system potential", next: "next", revise: "Waiting for shared memory traversal." },
    id: { title: "Lint pertanyaan / kualitas traversal", specificity: "spesifik", evidence: "kesiapan bukti", bridge: "potensi lintas sistem", next: "lanjut", revise: "Menunggu traversal shared memory." },
    de: { title: "Fragen-Lint / Traversal-Qualitaet", specificity: "Spezifik", evidence: "Evidenz bereit", bridge: "System-Bruecke", next: "weiter", revise: "Warte auf Shared-Memory-Traversal." },
    ja: { title: "問い lint / traversal 品質", specificity: "具体性", evidence: "証拠準備", bridge: "横断可能性", next: "次", revise: "shared memory traversal を待っています。" },
    th: { title: "lint คำถาม / traversal quality", specificity: "ความเฉพาะ", evidence: "หลักฐาน", bridge: "ข้ามระบบ", next: "ถัดไป", revise: "กำลังรอ shared memory traversal" },
  };
  return copy[language];
}

function questionLintForQuality(quality: QuestionQuality, language: LanguageCode) {
  const copy = questionLintCopy(language);
  return {
    title: copy.title,
    specificity: quality.specificity,
    evidence: quality.evidenceReadiness,
    bridge: quality.crossSystemPotential,
    next: quality.caveats[0] ?? copy.revise,
  };
}

function questionLintScoreEntries(lint: ReturnType<typeof questionLintForQuality>, language: LanguageCode) {
  const copy = questionLintCopy(language);
  return [
    [copy.specificity, lint.specificity],
    [copy.evidence, lint.evidence],
    [copy.bridge, lint.bridge],
  ] as const;
}

function traversalMonitorCopy(language: LanguageCode) {
  const copy: Record<LanguageCode, { title: string; idle: string; status: string; pages: string; families: string; topPages: string; caveat: string; question: string }> = {
    "zh-TW": { title: "玩家問題 traversal 健檢", idle: "尚未檢查玩家問題。請先向營火、NPC 或小誌提出問題。", status: "狀態", pages: "命中頁面", families: "來源系統", topPages: "可讀路徑", caveat: "健檢提示", question: "目前問題" },
    en: { title: "Player-question traversal monitor", idle: "No player question checked yet. Ask the campfire, an NPC, or a zine first.", status: "status", pages: "pages", families: "source systems", topPages: "reading route", caveat: "monitor note", question: "current question" },
    id: { title: "Monitor traversal pertanyaan", idle: "Belum ada pertanyaan pemain yang diperiksa.", status: "status", pages: "halaman", families: "sistem sumber", topPages: "rute baca", caveat: "catatan", question: "pertanyaan" },
    de: { title: "Traversal-Monitor fuer Spielerfragen", idle: "Noch keine Spielerfrage geprueft.", status: "Status", pages: "Seiten", families: "Quellsysteme", topPages: "Leseroute", caveat: "Hinweis", question: "aktuelle Frage" },
    ja: { title: "プレイヤー質問 traversal monitor", idle: "まだ質問を検査していません。", status: "状態", pages: "ページ", families: "ソース系", topPages: "読む経路", caveat: "メモ", question: "現在の問い" },
    th: { title: "monitor traversal คำถามผู้เล่น", idle: "ยังไม่ได้ตรวจคำถามผู้เล่น", status: "สถานะ", pages: "หน้า", families: "ระบบแหล่งที่มา", topPages: "เส้นทางอ่าน", caveat: "หมายเหตุ", question: "คำถามปัจจุบัน" },
  };
  return copy[language];
}

function petTerrainStateCopy(language: LanguageCode) {
  const copy: Record<LanguageCode, { title: string; evidence: string; relation: string; contradiction: string; missingNode: string; pending: string; active: string; clear: string }> = {
    "zh-TW": { title: "地形狀態", evidence: "證據", relation: "關係", contradiction: "矛盾", missingNode: "缺節點", pending: "待查", active: "活躍", clear: "穩定" },
    en: { title: "Terrain state", evidence: "Evidence", relation: "Relation", contradiction: "Contradiction", missingNode: "Missing node", pending: "pending", active: "active", clear: "stable" },
    id: { title: "Status medan", evidence: "Bukti", relation: "Relasi", contradiction: "Kontradiksi", missingNode: "Node hilang", pending: "tertunda", active: "aktif", clear: "stabil" },
    de: { title: "Terrain-Status", evidence: "Evidenz", relation: "Beziehung", contradiction: "Widerspruch", missingNode: "Fehlender Knoten", pending: "offen", active: "aktiv", clear: "stabil" },
    ja: { title: "地形状態", evidence: "証拠", relation: "関係", contradiction: "矛盾", missingNode: "欠落ノード", pending: "確認待ち", active: "稼働", clear: "安定" },
    th: { title: "สถานะภูมิประเทศ", evidence: "หลักฐาน", relation: "ความสัมพันธ์", contradiction: "ขัดแย้ง", missingNode: "node ที่ขาด", pending: "รอตรวจ", active: "ทำงาน", clear: "เสถียร" },
  };
  return copy[language];
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function petTerrainIndicators(snapshot: SimSnapshot, inbox: PetLintGapItem[], quality: QuestionQuality) {
  const inboxText = inbox.map((item) => item.text).join("\n");
  const contradictionHits = (inboxText.match(/矛盾|反證|猜想|誤導|unsupported|misleading|hypoth|contradict|failure|失敗/gi) ?? []).length;
  const missingHits = (inboxText.match(/缺|不足|需要|missing|gap|lack|node|節點/gi) ?? []).length;
  const evidence = clampPercent(quality.evidenceReadiness + Math.min(8, snapshot.a2aExchanges.length));
  const relation = clampPercent(quality.crossSystemPotential + Math.min(8, snapshot.throngs.length * 2));
  const contradiction = clampPercent(contradictionHits * 18 + snapshot.events.filter((event) => /contradict|fail|lint|gap|矛盾|失敗|缺/i.test(event.text ?? "")).length * 8);
  const missingNode = clampPercent(inbox.length * 11 + missingHits * 8);
  return { evidence, relation, contradiction, missingNode };
}

function CentralComputerDialogue({
  language,
  playerName,
  playerPalette,
  onClose,
  onOpenAssociationZine,
  onQuestionSubmitted,
}: {
  language: LanguageCode;
  playerName: string;
  playerPalette: number;
  onClose: () => void;
  onOpenAssociationZine: (query?: string) => void;
  onQuestionSubmitted?: (query: string) => void;
}) {
  type ComputerMessage = { speaker: string; text: string; links?: WikiSearchResult[] };
  const [draft, setDraft] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState("");
  const [showSuggestedQuestions, setShowSuggestedQuestions] = useState(false);
  const logRef = useRef<HTMLDivElement | null>(null);
  const copy = PBS_COMPUTER_COPY[language];
  const fallbackSuggestedQuestions = useMemo(() => shuffleCopy(COMMUNITY_QUERY_PROMPTS[language]).slice(0, 9), [language]);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(fallbackSuggestedQuestions);
  const [isSuggestingQuestions, setIsSuggestingQuestions] = useState(false);
  const [messages, setMessages] = useState<ComputerMessage[]>(() => [
    {
      speaker: copy.name,
      text: copy.intro,
    },
  ]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    setSuggestedQuestions(fallbackSuggestedQuestions);
  }, [fallbackSuggestedQuestions]);

  useEffect(() => {
    if (!showSuggestedQuestions) return;
    let cancelled = false;
    setIsSuggestingQuestions(true);
    void askDeepSeekPbsQuestionSuggestions({
      preferredLanguage: language,
      seedQuestions: fallbackSuggestedQuestions,
    }).then((questions) => {
      if (!cancelled && questions.length) setSuggestedQuestions(questions.slice(0, 9));
    }).catch(() => {
      if (!cancelled) setSuggestedQuestions(fallbackSuggestedQuestions);
    }).finally(() => {
      if (!cancelled) setIsSuggestingQuestions(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fallbackSuggestedQuestions, language, showSuggestedQuestions]);

  useEffect(() => {
    const log = logRef.current;
    if (!log) return;
    log.scrollTop = log.scrollHeight;
  }, [isThinking, messages]);

  async function askComputer(prompt: string): Promise<void> {
    const trimmed = prompt.trim();
    if (!trimmed || isThinking) return;
    setDraft("");
    setError("");
    setIsThinking(true);
    setMessages((current) => [...current, { speaker: copy.playerSpeaker, text: trimmed }]);
    onQuestionSubmitted?.(trimmed);
    try {
      const reply = await askCampfire(trimmed, language);
      setMessages((current) => [...current, { speaker: copy.name, text: reply.answer, links: reply.links }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "PBS memory API is unavailable.");
      setMessages((current) => [...current, {
        speaker: copy.name,
        text: "PBS memory API is unavailable. Cloud mode needs the PBS memory Worker URL; local full-memory mode needs scripts/pbs_game_server.py. Static snapshot fallback is disabled so the game will not pretend missing evidence is real memory.",
        links: [],
      }]);
    } finally {
      setIsThinking(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void askComputer(draft);
  }

  function handleOpenZine(): void {
    const query = draft.trim();
    if (!query || isThinking) {
      setError(copy.needQuestion);
      return;
    }
    onQuestionSubmitted?.(query);
    onOpenAssociationZine(query);
  }

  return (
    <div className="rpg-dialogue-overlay absolute inset-0 z-50 flex items-center justify-center bg-black/35 px-8 py-8 pointer-events-none" data-no-mobile-drag="true">
      <section className="rpg-dialogue-panel pbs-frame F2 pbs-frame-f2 pixel-panel pointer-events-auto w-[min(1040px,84vw)] h-[72vh] min-w-[min(720px,calc(100vw-24px))] px-14 py-12 text-text shadow-pixel flex flex-col" data-language={language}>
        <div className="rpg-dialogue-header flex items-start justify-between gap-8 mb-5">
          <div className="rpg-dialogue-title flex items-start gap-6">
            <div className="rpg-dialogue-avatars flex gap-4">
              <PlayerDialogueAvatar palette={playerPalette} label={playerName} />
              <ComputerDialogueAvatar label={copy.name} />
            </div>
            <div>
              <p className="rpg-dialogue-kicker pbs-frame-kicker text-lg uppercase tracking-wide text-accent-bright m-0" data-ui-part="caption">{copy.kicker}</p>
              <h2 className="rpg-dialogue-name pbs-frame-title text-2xl leading-none mt-2" data-ui-part="title">{copy.name}</h2>
              <p className="rpg-dialogue-role pbs-frame-subtitle text-xl text-text-muted mt-2" data-ui-part="subtitle">{copy.subtitle}</p>
            </div>
          </div>
          <button className="rpg-dialogue-x pbs-frame-action" data-ui-control="window-action" type="button" onClick={onClose}>X</button>
        </div>
        <div className="rpg-dialogue-main flex-1 min-h-0 flex gap-6 mb-6">
          <div ref={logRef} className="rpg-dialogue-log pbs-frame-body rpg-message-scroll flex-1 overflow-auto bg-bg/70 border border-border px-10 py-9 text-xl" data-ui-part="body">
            {messages.map((message, index) => (
              <div key={`${message.speaker}-${index.toString()}`} className="rpg-dialogue-message text-xl leading-relaxed mb-6 last:mb-0" data-ui-part="body">
                <p className="m-0">
                  <span className="text-accent-bright">{message.speaker}: </span>
                  {message.text}
                </p>
                {message.links && (
                  <details className="rpg-dialogue-source-links" aria-label={copy.sourceTitle}>
                    <summary>{copy.sourceLinks} ({message.links.length})</summary>
                    {message.links.length > 0 ? (
                      <div className="rpg-dialogue-source-link-list">
                        {message.links.slice(0, 8).map((link, linkIndex) => (
                          <a key={`${link.url}-${linkIndex.toString()}`} href={link.url} target="_blank" rel="noreferrer">
                            <span>[{linkIndex + 1}] {link.title}</span>
                            <em>{link.sourceFamily}</em>
                          </a>
                        ))}
                      </div>
                    ) : <p className="m-0 text-text-muted">{copy.noLinks}</p>}
                  </details>
                )}
              </div>
            ))}
            {isThinking && <p className="rpg-dialogue-thinking text-base text-text-muted" data-ui-part="body">{copy.thinking}</p>}
          </div>
        </div>
        {showSuggestedQuestions && (
          <div className="rpg-dialogue-actions rpg-dialogue-question-drawer flex flex-wrap items-start gap-3 mb-5">
            <p className="w-full m-0 text-base text-text-muted" data-ui-part="caption">{copy.suggestions}{isSuggestingQuestions ? QUESTION_SUGGESTION_LOADING_COPY[language] : ""}</p>
            {suggestedQuestions.map((question) => (
              <button key={question} className="rpg-dialogue-chip pbs-game-button" data-ui-control="text-button" data-ui-part="button-label" type="button" onClick={() => { setDraft(question); setShowSuggestedQuestions(false); }}>{question}</button>
            ))}
          </div>
        )}
        <form onSubmit={handleSubmit} className="rpg-dialogue-form flex gap-4" data-ui-footer="zine" autoComplete="off">
          <input
            type="text"
            className="rpg-dialogue-input flex-1 bg-bg border-2 border-border px-7 py-6 text-xl text-text outline-none focus:border-accent-bright"
            data-ui-part="field"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            name="pbs-campfire-question"
            inputMode="text"
            enterKeyHint="send"
            autoComplete="new-password"
            aria-autocomplete="none"
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
            autoCorrect="off"
            autoCapitalize="sentences"
            spellCheck={false}
            placeholder={copy.placeholder}
          />
          <button
            className="rpg-dialogue-question-toggle rpg-dialogue-chip pbs-game-button"
            data-ui-control="icon-button"
            type="button"
            onClick={() => setShowSuggestedQuestions((open) => !open)}
            aria-label={copy.suggest}
            title={copy.suggest}
          >
            🔍
          </button>
          <button className="rpg-dialogue-submit pbs-game-button pbs-game-button--bubble disabled:opacity-50" data-ui-control="icon-button" type="submit" disabled={isThinking} aria-busy={isThinking} aria-label={t(language, "dialogue.talkButton")} title={t(language, "dialogue.talkButton")}>💬</button>
          <button className="rpg-dialogue-chip pbs-game-button pbs-game-button--bubble" data-ui-control="icon-button" type="button" disabled={isThinking || !draft.trim()} onClick={handleOpenZine} aria-label={copy.zine} title={copy.zine}>📚</button>
        </form>
        {error && <p className="text-sm text-red-300 mt-3">{safeDebugText(error, 180)}</p>}
      </section>
    </div>
  );
}

function waitForNextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

async function importAssociationGenerator() {
  try {
    return await import("./association/browserAssociationGenerator.js");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error ?? "");
    if (/Importing a module script failed|Failed to fetch dynamically imported module|Loading chunk/i.test(message)) {
      await new Promise((resolve) => window.setTimeout(resolve, 800));
      return import("./association/browserAssociationGenerator.js");
    }
    throw error;
  }
}

function attachZineIframeControls(iframe: HTMLIFrameElement): void {
  const doc = iframe.contentDocument;
  if (!doc) return;
  if (window.matchMedia("(max-width: 700px), (pointer: coarse)").matches && !doc.getElementById("pbs-mobile-zine-readable")) {
    const style = doc.createElement("style");
    style.id = "pbs-mobile-zine-readable";
    style.textContent = `
      html, body { margin: 0 !important; width: 100% !important; overflow-x: hidden !important; }
      .association-html { width: 100% !important; max-width: none !important; min-width: 0 !important; padding: 16px !important; box-sizing: border-box !important; }
      .association-html--pbs-reset, .association-html--soft-commons, .association-html--aino-grid, .dd-reset-hero, .dd-reset-sections, .dd-reset-protocol, .dd-soft-body, .dd-aino-grid, .dd-aino-footer { display: block !important; grid-template-columns: none !important; }
      .dd-reset-card, .dd-reset-opening, .dd-reset-protocol, .dd-soft-card, .dd-aino-card, section, article { margin: 0 0 10px !important; padding: 12px !important; max-width: none !important; box-sizing: border-box !important; }
      h1 { font-size: 34px !important; line-height: 1.04 !important; }
      h2 { font-size: 22px !important; line-height: 1.12 !important; }
      p, li { font-size: 16px !important; line-height: 1.42 !important; }
    `;
    doc.head.appendChild(style);
  }
  const pressButton = (button: HTMLElement, pressed: boolean) => {
    button.style.transform = pressed ? "translate(3px, 3px)" : "";
    button.style.boxShadow = pressed ? "1px 1px 0 #000" : "4px 4px 0 #000";
  };
  doc.querySelectorAll<HTMLElement>(".pbs-zine-button").forEach((button) => {
    button.style.pointerEvents = "auto";
    button.addEventListener("pointerdown", () => pressButton(button, true));
    button.addEventListener("pointerup", () => pressButton(button, false));
    button.addEventListener("pointerleave", () => pressButton(button, false));
  });
  doc.querySelectorAll<HTMLElement>("[data-pbs-zine-feedback]").forEach((button) => {
    button.addEventListener("click", () => {
      button.setAttribute("aria-pressed", "true");
      pressButton(button, true);
    });
  });
  doc.querySelectorAll<HTMLButtonElement>("[data-pbs-zine-pdf]").forEach((button) => {
    button.addEventListener("click", () => {
      const originalTitle = button.getAttribute("title") || "Print / Save PDF";
      button.setAttribute("aria-busy", "true");
      button.setAttribute("title", "Opening print dialog");
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      window.setTimeout(() => {
        button.setAttribute("title", originalTitle);
        button.removeAttribute("aria-busy");
      }, 1200);
    });
  });
}

interface ZineRepairPayload {
  usefulParts?: string;
  uselessParts?: string;
  repairInstruction?: string;
  zineTitle?: string;
  language?: LanguageCode;
  template?: string;
  timestamp?: number;
}

function readLastZineTrace(): Record<string, any> | null {
  try {
    const parsed = JSON.parse(localStorage.getItem("pbs:last-zine-click-trace") || "null");
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function buildZineRepairReport(payload: ZineRepairPayload, panel: Extract<SplitPanel, { kind: "finalDocument" }> | null) {
  const trace = readLastZineTrace();
  const createdAt = new Date().toISOString();
  const id = `zine-repair-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const repairInstruction = payload.repairInstruction?.trim() || "";
  const uselessParts = payload.uselessParts?.trim() || "";
  const usefulParts = payload.usefulParts?.trim() || "";
  const feedbackText = `${usefulParts}\n${uselessParts}\n${repairInstruction}`;
  const reviewActions = [
    /source|citation|evidence|證據|引用|來源/i.test(feedbackText) ? "source-needed" : null,
    /misleading|unsupported|guess|hallucinat|誤導|沒有根據|猜/i.test(feedbackText) ? "unsupported-synthesis" : null,
    /question|ask|問題|提問/i.test(feedbackText) ? "question-reframe" : null,
    /wiki|note|concept|compiled|概念|筆記/i.test(feedbackText) ? "compiled-note-gap" : null,
  ].filter((item): item is string => Boolean(item));
  return {
    id,
    reportKind: "zine-repair-feedback",
    createdAt,
    zineTitle: payload.zineTitle || panel?.title || trace?.generatedArticle?.title || "PBS zine",
    query: panel?.query || trace?.query || panel?.seed || "",
    language: payload.language || panel?.language || trace?.language || "zh-TW",
    template: payload.template || "01-pbs-reset-title-kinetic.html",
    originalRequestId: trace?.requestId ?? null,
    usefulParts,
    uselessParts,
    repairInstruction,
    evidenceSnapshot: {
      allowedSourceFamilies: trace?.allowedSourceFamilies ?? [],
      searchTermsUsed: trace?.searchTermsUsed ?? [],
      matchedPages: trace?.matchedPages ?? [],
      deepReadPages: trace?.deepReadPages ?? [],
      followedWikilinks: trace?.followedWikilinks ?? [],
      publicValidation: trace?.publicValidation ?? null,
    },
    suggestedVaultActions: [
      ...(reviewActions.length > 0 ? reviewActions : ["promote-to-wiki-draft"]),
      "Review whether uselessParts indicate unsupported synthesis, weak promoted wiki memory, or missing sourceRefs.",
      "If a useful relation is evidence-bound, consider promoting it into a reviewed Wiki note instead of raw Sources.",
      "If the repair names missing evidence, add a Review gap artifact before mutating source or compiled Wiki pages.",
    ],
    vaultReviewRouting: {
      inbox: "obsidian-vault/Review/zine-feedback-inbox",
      questionCandidates: "obsidian-vault/Review/question-candidates",
      compiledNoteDrafts: "obsidian-vault/Review/compiled-note-drafts",
      actions: reviewActions.length > 0 ? reviewActions : ["promote-to-wiki-draft"],
      publicWritePolicy: "download-or-localStorage-only",
    },
  };
}

function downloadZineRepairReport(report: Record<string, unknown>): void {
  const blob = new Blob([`${JSON.stringify(report, null, 2)}\n`], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${typeof report.id === "string" ? report.id : "zine-repair-report"}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function ExternalLinkEmbed({ link, language, onRetry, progress }: { link: Extract<SplitPanel, { kind: "externalLink" | "finalDocument" }>; language: LanguageCode; onRetry?: () => void; progress?: string }) {
  const isFinalDocument = link.kind === "finalDocument";
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  return (
    <div className={`world-split-embed ${isFinalDocument ? "world-split-final-document" : ""}`}>
      {link.description && (
        <p className="world-split-embed-description">{link.description}</p>
      )}
      {isFinalDocument && link.isGenerating ? (
        <AssociationLoadingPage language={language} progress={progress} />
      ) : isFinalDocument && link.lowRelevance ? (
        <AssociationLowRelevancePage language={language} query={link.query || link.seed} onRetry={onRetry} />
      ) : isFinalDocument && link.error ? (
        <AssociationErrorPage message={link.error} language={language} onRetry={onRetry} />
      ) : link.url ? (
        <iframe
          key={link.url}
          title={link.title}
          src={link.url}
          ref={iframeRef}
          className="world-split-iframe"
          loading="eager"
          referrerPolicy="no-referrer-when-downgrade"
          sandbox={isFinalDocument ? "allow-scripts allow-same-origin allow-downloads allow-popups allow-popups-to-escape-sandbox allow-modals" : undefined}
          onLoad={() => {
            if (isFinalDocument && iframeRef.current) attachZineIframeControls(iframeRef.current);
          }}
        />
      ) : isFinalDocument ? (
        <AssociationLoadingPage language={language} />
      ) : (
        <div className="world-split-loading">Generating zine...</div>
      )}
    </div>
  );
}

function WukirBandcampEmbed() {
  return (
    <div className="world-split-embed wukir-bandcamp-panel">
      <div className="wukir-bandcamp-fallback">
        <strong>Institutionalized Ritual</strong>
        <span>Wukir Suryadi</span>
        <span>External Bandcamp preview unavailable</span>
        <a href={WUKIR_BANDCAMP_ALBUM_URL} target="_blank" rel="noreferrer">
          Open on Bandcamp
        </a>
      </div>
      <div className="wukir-bandcamp-frame" aria-label="Wukir Suryadi Bandcamp player">
        <iframe
          title="Bandcamp player: Wukir Suryadi - Institutionalized Ritual"
          src={WUKIR_BANDCAMP_PLAYER_URL}
          loading="lazy"
          allow="autoplay; encrypted-media"
          referrerPolicy="no-referrer-when-downgrade"
          seamless
        />
      </div>
    </div>
  );
}

function petResponsesKey(petId: string): string {
  return `pbs:pet:${petId}:responses`;
}

function readPetBoardResponses(petId: string): PetBoardResponse[] {
  try {
    const raw = localStorage.getItem(petResponsesKey(petId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry): entry is PetBoardResponse => {
        if (!entry || typeof entry !== "object") return false;
        const response = entry as Partial<PetBoardResponse>;
        return (
          typeof response.id === "string" &&
          typeof response.petId === "string" &&
          typeof response.text === "string" &&
          typeof response.createdAt === "number"
        );
      })
      .filter((entry) => entry.petId === petId && entry.text.trim().length > 0)
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

function writePetBoardResponses(
  petId: string,
  responses: PetBoardResponse[],
): void {
  localStorage.setItem(petResponsesKey(petId), JSON.stringify(responses));
}

function makePetBoardResponse(
  petId: string,
  text: string,
  author?: string,
): PetBoardResponse {
  return {
    id: `response-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
    petId,
    author,
    text,
    createdAt: Date.now(),
  };
}

function findNearestApproachableTile(
  officeState: OfficeState,
  preferredCol: number,
  preferredRow: number,
  occupied = new Set<string>(),
): { col: number; row: number } {
  const canStand = (col: number, row: number) => {
    if (occupied.has(`${col},${row}`)) return false;
    if (!isWalkable(col, row, officeState.tileMap, officeState.blockedTiles))
      return false;
    const neighbors = [
      { col: col + 1, row },
      { col: col - 1, row },
      { col, row: row + 1 },
      { col, row: row - 1 },
    ];
    return neighbors.some((tile) =>
      isWalkable(
        tile.col,
        tile.row,
        officeState.tileMap,
        officeState.blockedTiles,
      ),
    );
  };

  if (canStand(preferredCol, preferredRow))
    return { col: preferredCol, row: preferredRow };

  for (let radius = 1; radius <= 8; radius++) {
    for (let dRow = -radius; dRow <= radius; dRow++) {
      for (let dCol = -radius; dCol <= radius; dCol++) {
        if (Math.abs(dCol) !== radius && Math.abs(dRow) !== radius) continue;
        const col = preferredCol + dCol;
        const row = preferredRow + dRow;
        if (canStand(col, row)) return { col, row };
      }
    }
  }

  return (
    officeState.walkableTiles.find((tile) => canStand(tile.col, tile.row)) ?? {
      col: 1,
      row: 1,
    }
  );
}

function findNearestNpcApproachTile(
  officeState: OfficeState,
  playerCol: number,
  playerRow: number,
  npcCol: number,
  npcRow: number,
  occupied = new Set<string>(),
): { col: number; row: number } | null {
  const candidates = [
    { col: npcCol, row: npcRow + 1 },
    { col: npcCol - 1, row: npcRow },
    { col: npcCol + 1, row: npcRow },
    { col: npcCol, row: npcRow - 1 },
  ]
    .filter((tile) => !occupied.has(`${tile.col},${tile.row}`))
    .filter((tile) => isWalkable(tile.col, tile.row, officeState.tileMap, officeState.blockedTiles))
    .map((tile) => ({
      ...tile,
      path: findPath(playerCol, playerRow, tile.col, tile.row, officeState.tileMap, officeState.blockedTiles),
      distance: Math.abs(tile.col - playerCol) + Math.abs(tile.row - playerRow),
    }))
    .filter((tile) => tile.path.length > 0 || (tile.col === playerCol && tile.row === playerRow))
    .sort((a, b) => a.path.length - b.path.length || a.distance - b.distance);
  return candidates[0] ? { col: candidates[0].col, row: candidates[0].row } : null;
}

function findShortNpcStep(
  officeState: OfficeState,
  startCol: number,
  startRow: number,
  occupied: Set<string>,
): { col: number; row: number } | null {
  const candidates: Array<{ col: number; row: number; score: number }> = [];
  for (let dRow = -4; dRow <= 4; dRow++) {
    for (let dCol = -4; dCol <= 4; dCol++) {
      const distance = Math.abs(dCol) + Math.abs(dRow);
      if (distance < 1 || distance > 4) continue;
      const col = startCol + dCol;
      const row = startRow + dRow;
      const tile = findNearestApproachableTile(officeState, col, row, occupied);
      const key = `${tile.col},${tile.row}`;
      if (occupied.has(key)) continue;
      candidates.push({ ...tile, score: distance + Math.random() });
    }
  }
  candidates.sort((a, b) => a.score - b.score);
  return candidates[0] ?? null;
}
function configuredWorkerChatApiUrl(): string {
  return document
    .querySelector('meta[name="pbs-chat-api"], meta[name="sow-chat-api"]')
    ?.getAttribute("content")
    ?.trim() || "https://solar-oracle-deepseek-proxy.dontmarryme.workers.dev/chat";
}

async function createCloudPetPersona(profile: PlayerProfile): Promise<string | null> {
  const url = configuredWorkerChatApiUrl();
  if (!url) return null;
  const role = profile.avatarTitle ?? "Tamagotchi agent";
  const system = [
    "你是桃花源遊戲的 Tamagotchi agent 人格設計器。只輸出一段繁體中文 persona，不要 JSON，不要 markdown。",
    "人格必須像好奇、挑剔、會照看公共文字品質的小夥伴，但不要說出任何系統功能名稱。",
    "不要把電子雞設定成玩家問題的解答器；PBS Computer 才是 LLM wiki query 入口。",
  ].join("\n");
  const user = `玩家名字：${profile.name}\n寵物類型：${role}\n請輸出 3 句以內的 Tamagotchi agent persona。`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "chat",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.82,
      max_tokens: 260,
    }),
  });
  if (!response.ok) throw new Error(`pet persona proxy failed ${response.status}`);
  const data = await response.json() as { content?: string; choices?: Array<{ message?: { content?: string } }> };
  return (data.content ?? data.choices?.[0]?.message?.content ?? "").trim() || null;
}

function remoteCharacterId(playerId: string): number {
  let hash = 0;
  for (let index = 0; index < playerId.length; index++) {
    hash = (hash * 31 + playerId.charCodeAt(index)) | 0;
  }
  return -1000000 - Math.abs(hash % 900000);
}

function remotePalette(playerId: string, avatar: string): number {
  const value = `${playerId}:${avatar}`;
  let hash = 0;
  for (let index = 0; index < value.length; index++) {
    hash = (hash + value.charCodeAt(index)) % 6;
  }
  return hash;
}

function readSavedPlayerDefaults(): PlayerProfile | null {
  try {
    const raw = localStorage.getItem("peach_player_profile");
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<PlayerProfile>;
    return {
      name: saved.name ?? "",
      palette: saved.palette ?? 0,
      avatarTitle: saved.avatarTitle,
      currentRole: saved.currentRole ?? "Wandering researcher",
      mission: saved.mission ?? "Find an idea worth developing with others",
      constraints: saved.constraints ?? "",
      skills: saved.skills ?? "",
      question: saved.question ?? saved.mission ?? "",
      intentMode: saved.intentMode ?? "why",
      personalArchive: saved.personalArchive ?? saved.constraints ?? "",
      petSeed: saved.petSeed,
    };
  } catch {
    return null;
  }
}

// Game state lives outside React — updated imperatively by message handlers
const officeStateRef = { current: null as OfficeState | null };
const editorState = new EditorState();

function getOfficeState(): OfficeState {
  if (!officeStateRef.current) {
    officeStateRef.current = new OfficeState();
  }
  return officeStateRef.current;
}

function App() {
  const qaUi = useMemo(() => readQaUiParams(), []);
  // Browser runtime (dev or static dist): start React immediately, then load
  // heavy mock assets in the background and dispatch after listeners exist.
  useEffect(() => {
    if (isBrowserRuntime) {
      void import("./browserMock.js")
        .then(async ({ dispatchMockMessages, initBrowserMock }) => {
          await initBrowserMock();
          dispatchMockMessages();
        })
        .catch((error: unknown) => {
          console.error("[BrowserMock] Failed to initialize", error);
        });
    }
  }, []);

  const editor = useEditorActions(getOfficeState, editorState);

  const isEditDirty = useCallback(
    () => editor.isEditMode && editor.isDirty,
    [editor.isEditMode, editor.isDirty],
  );

  const {
    agents,
    selectedAgent,
    agentTools,
    agentStatuses,
    subagentTools,
    layoutReady,
    layoutWasReset,
    loadedAssets,
    workspaceFolders,
    externalAssetDirectories,
    watchAllSessions,
    setWatchAllSessions,
    alwaysShowLabels,
    hooksEnabled,
    setHooksEnabled,
    hooksInfoShown,
  } = useExtensionMessages(
    getOfficeState,
    editor.setLastSavedLayout,
    isEditDirty,
  );

  // Show migration notice once layout reset is detected
  const [migrationNoticeDismissed, setMigrationNoticeDismissed] =
    useState(false);
  const showMigrationNotice = layoutWasReset && !migrationNoticeDismissed;

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHooksInfoOpen, setIsHooksInfoOpen] = useState(false);
  const [hooksTooltipDismissed, setHooksTooltipDismissed] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [editorEntryEnabled] = useState(readEditorModeParam);
  const [alwaysShowOverlay, setAlwaysShowOverlay] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(() =>
    qaUi.language ?? readStoredLanguage(),
  );
  const [hasStarted, setHasStarted] = useState(qaUi.enabled || editorEntryEnabled);
  const [isPostBootLoading, setIsPostBootLoading] = useState(false);
  const postBootLoadingTimerRef = useRef<number | null>(null);
  const [playerDefaults, setPlayerDefaults] = useState<PlayerProfile | null>(
    () => readSavedPlayerDefaults(),
  );
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(
    () => qaUi.enabled || editorEntryEnabled ? qaPlayerProfile(qaUi.language ?? readStoredLanguage()) : null,
  );
  const [multiplayerConfig] = useState<MultiplayerConfig | null>(() =>
    readMultiplayerConfig(),
  );
  const [multiplayerStatus, setMultiplayerStatus] = useState("idle");
  const [remotePresences, setRemotePresences] = useState<
    Map<string, MultiplayerPresence>
  >(() => new Map());
  const [nearbyNpcId, setNearbyNpcId] = useState<number | null>(null);
  const [videoEncounter, setVideoEncounter] = useState<MultiplayerPresence | null>(
    null,
  );
  const [dismissedVideoEncounterId, setDismissedVideoEncounterId] = useState<string | null>(
    null,
  );
  const multiplayerClientRef = useRef<MultiplayerPresenceClient | null>(null);
  const chatLogRef = useRef<HTMLDivElement | null>(null);
  const [encounterPanel, setEncounterPanel] = useState<EncounterPanel | null>(null);
  const [chatMessages, setChatMessages] = useState<MultiplayerChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState("");
  const [activeDialogueId, setActiveDialogueId] = useState<number | null>(null);
  const [isComputerDialogueOpen, setIsComputerDialogueOpen] = useState(false);
  const [dismissedAutoComputer, setDismissedAutoComputer] = useState(false);
  const [pendingComputerOpen, setPendingComputerOpen] = useState(false);
  const [archiveMenuOpen, setArchiveMenuOpen] = useState(false);
  const [terrainEditorEnabled, setTerrainEditorEnabled] = useState(editorEntryEnabled);
  const [playerMoveTick, setPlayerMoveTick] = useState(0);
  const [worldInitialized, setWorldInitialized] = useState(false);
  const [promptAnchor, setPromptAnchor] = useState<{
    npcId: number;
    col: number;
    row: number;
  } | null>(null);
  const [showMobileControls, setShowMobileControls] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>("camp");
  const [appMode, setAppMode] = useState<AppMode>("interactive");
  const [dispatchedPets, setDispatchedPets] = useState<PetDispatch[]>(() => {
    petStore.clearLocalDemo();
    return [];
  });
  const [selectedDispatchPet, setSelectedDispatchPet] =
    useState<PetDispatch | null>(null);
  const [selectedNpcInfo, setSelectedNpcInfo] = useState<Persona | null>(null);
  const [mobileRulesOpen, setMobileRulesOpen] = useState(false);
  const [worldNotice, setWorldNotice] = useState<string | null>(null);
  const [petLintGapInbox, setPetLintGapInbox] = useState<PetLintGapItem[]>(readPetLintGapInbox);
  const [simSnapshot, setSimSnapshot] = useState<SimSnapshot | null>(null);
  const [isQuestionSimMinimized, setIsQuestionSimMinimized] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Thronglet | null>(null);
  const [petResponse, setPetResponse] = useState("");
  const [petDialogueHistory] = useState<PetDialogueHistoryEntry[]>(() => readPetDialogueHistory());
  const [petBoardResponses, setPetBoardResponses] = useState<
    PetBoardResponse[]
  >([]);
  const [questionQuality, setQuestionQuality] = useState<QuestionQuality>(emptyQuestionQuality);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [splitPanel, setSplitPanel] = useState<SplitPanel | null>(null);
  const [associationProgress, setAssociationProgress] = useState("Loading...");
  const [splitPanelAnchor, setSplitPanelAnchor] = useState<
    { kind: "npc"; id: number } | null
  >(null);
  const [isSplitExpanded, setIsSplitExpanded] = useState(false);
  const [abaoBubble, setAbaoBubble] = useState<{
    text: string;
    nonce: number;
  } | null>(null);
  const petRunawayDoneRef = useRef<string | null>(null);
  const qaUiBootstrappedRef = useRef(false);
  const wikiGenerationInFlightRef = useRef(false);
  const wikiGenerationRequestRef = useRef<string | null>(null);
  const finalDocumentObjectUrlsRef = useRef<Set<string>>(new Set());
  const questionQualityRequestRef = useRef(0);

  const activeDispatchPets = useMemo(
    () => dispatchedPets.filter((pet) => pet.status === "active"),
    [dispatchedPets],
  );

  const archiveSummary = useMemo(
    () => ({
      total: dispatchedPets.length,
      active: dispatchedPets.filter((pet) => pet.status === "active").length,
      hibernating: dispatchedPets.filter((pet) => pet.status === "hibernating")
        .length,
      archived: dispatchedPets.filter((pet) => pet.status === "archived")
        .length,
      notes: dispatchedPets.reduce(
        (sum, pet) =>
          sum +
          (pet.ownerId === petStore.getOwnerId() ? pet.interactions.length : 0),
        0,
      ),
    }),
    [dispatchedPets],
  );

  useEffect(() => {
    return () => {
      for (const url of finalDocumentObjectUrlsRef.current) URL.revokeObjectURL(url);
      finalDocumentObjectUrlsRef.current.clear();
    };
  }, []);

  // Sync alwaysShowOverlay from persisted settings
  useEffect(() => {
    setAlwaysShowOverlay(alwaysShowLabels);
  }, [alwaysShowLabels]);

  const handleToggleDebugMode = useCallback(
    () => {
      if (editorEntryEnabled) return;
      setIsDebugMode((prev) => !prev);
    },
    [editorEntryEnabled],
  );
  const handleToggleAlwaysShowOverlay = useCallback(() => {
    setAlwaysShowOverlay((prev) => {
      const newVal = !prev;
      vscode.postMessage({ type: "setAlwaysShowLabels", enabled: newVal });
      return newVal;
    });
  }, []);

  const handleSelectAgent = useCallback((id: number) => {
    vscode.postMessage({ type: "focusAgent", id });
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const abaoLines = useMemo(
    () =>
      t(selectedLanguage, "abao.lines")
        .split("|")
        .map((line) => line.trim())
        .filter(Boolean),
    [selectedLanguage],
  );

  const showAbaoBubble = useCallback(() => {
    const text =
      abaoLines[Math.floor(Math.random() * abaoLines.length)] ?? "haha";
    const nonce = Date.now();
    setAbaoBubble({ text, nonce });
    window.setTimeout(
      () => {
        setAbaoBubble((current) => (current?.nonce === nonce ? null : current));
      },
      2600 + Math.floor(Math.random() * 1400),
    );
  }, [abaoLines]);

  const [editorTickForKeyboard, setEditorTickForKeyboard] = useState(0);
  useEditorKeyboard(
    editor.isEditMode,
    editorState,
    editor.handleDeleteSelected,
    editor.handleRotateSelected,
    editor.handleToggleState,
    editor.handleUndo,
    editor.handleRedo,
    useCallback(() => setEditorTickForKeyboard((n) => n + 1), []),
    editor.handleToggleEditMode,
  );

  const officeState = getOfficeState();

  const handleClick = useCallback(
    (agentId: number) => {
      const dispatchIndex = agentId - 20000;
      if (dispatchIndex >= 0) {
        const pet = activeDispatchPets[dispatchIndex] ?? null;
        if (pet) {
          setSelectedDispatchPet(pet);
          setSelectedPet(null);
          setSelectedNpcInfo(null);
          return;
        }
      }
      const pet =
        simSnapshot?.thronglets.find((item) => item.characterId === agentId) ??
        null;
      if (pet && appMode === "interactive") {
        setSelectedPet(pet);
        setSelectedDispatchPet(null);
        return;
      }
      const persona = personas[agentId - 1] ?? null;
      if (appMode === "interactive" && persona?.id === "abao") {
        showAbaoBubble();
        return;
      }
      if (appMode === "interactive" && persona) {
        const player = officeState.characters.get(PLAYER_ID);
        const npc = officeState.characters.get(agentId);
        const distance = player && npc
          ? Math.abs(npc.tileCol - player.tileCol) + Math.abs(npc.tileRow - player.tileRow)
          : Number.POSITIVE_INFINITY;
        if (distance > CONVERSATION_CLOSE_DISTANCE_TILES) {
          const occupied = new Set(
            Array.from(officeState.characters.values())
              .filter((ch) => ch.id !== PLAYER_ID)
              .map((ch) => `${ch.tileCol},${ch.tileRow}`),
          );
          const approachTile = player && npc
            ? findNearestNpcApproachTile(officeState, player.tileCol, player.tileRow, npc.tileCol, npc.tileRow, occupied)
            : null;
          if (approachTile) {
            officeState.selectedAgentId = null;
            officeState.cameraFollowId = PLAYER_ID;
            officeState.walkToTile(PLAYER_ID, approachTile.col, approachTile.row);
            setPlayerMoveTick((tick) => tick + 1);
          }
          return;
        }
        setSelectedPet(null);
        setSelectedDispatchPet(null);
        setSelectedNpcInfo(null);
        setActiveDialogueId(agentId);
        return;
      }
      if (appMode === "dispatch_observer" && persona) {
        setSelectedNpcInfo(persona);
        setSelectedDispatchPet(null);
        return;
      }
      const os = getOfficeState();
      const meta = os.subagentMeta.get(agentId);
      const focusId = meta ? meta.parentAgentId : agentId;
      vscode.postMessage({ type: "focusAgent", id: focusId });
    },
    [activeDispatchPets, appMode, officeState, showAbaoBubble, simSnapshot],
  );

  const personaByAgentId = useMemo(
    () => new Map(personas.map((persona, index) => [index + 1, persona])),
    [],
  );
  const activeDialoguePersona = activeDialogueId
    ? (personaByAgentId.get(activeDialogueId) ?? null)
    : null;
  const activeDialogueCharacter = activeDialogueId
    ? (officeState.characters.get(activeDialogueId) ?? null)
    : null;
  const abaoAgentId =
    personas.findIndex((persona) => persona.id === "abao") + 1;
  const isNearAbao = nearbyNpcId === abaoAgentId;
  const isSplitOpen = splitPanel !== null;

  const selectedPetBoardId = selectedDispatchPet?.id ?? selectedPet?.id ?? null;

  useEffect(() => {
    if (!selectedPetBoardId) {
      setPetBoardResponses([]);
      setPetResponse("");
      return;
    }
    setPetBoardResponses(readPetBoardResponses(selectedPetBoardId));
    setPetResponse("");
  }, [selectedPetBoardId]);

  const handlePostPetBoardResponse = useCallback(
    (petId: string) => {
      const text = petResponse.trim();
      if (!text) return;
      const next = [
        makePetBoardResponse(petId, text, playerProfile?.name || undefined),
        ...readPetBoardResponses(petId),
      ];
      writePetBoardResponses(petId, next);
      setPetBoardResponses(next);
      setPetResponse("");
      if (selectedPet?.id === petId) {
        setSimSnapshot((current) =>
          current
            ? applyPlayerThrongletResponse(current, petId, text)
            : current,
        );
      }
    },
    [petResponse, playerProfile?.name, selectedPet?.id],
  );

  const evaluateSharedMemoryLint = useCallback(async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed) return;
    const requestId = questionQualityRequestRef.current + 1;
    questionQualityRequestRef.current = requestId;
    setQuestionQuality({
      ...emptyQuestionQuality,
      question: trimmed,
      evaluatedAt: Date.now(),
      status: 'estimating',
      caveats: ['shared memory traversal 檢查中。'],
    });
    try {
      const results = await searchMemory(trimmed, 12);
      if (questionQualityRequestRef.current !== requestId) return;
      setQuestionQuality(scoreQuestionTraversal(trimmed, results));
    } catch (error) {
      if (questionQualityRequestRef.current !== requestId) return;
      setQuestionQuality({
        ...emptyQuestionQuality,
        question: trimmed,
        evaluatedAt: Date.now(),
        status: 'error',
        caveats: [error instanceof Error ? error.message : 'shared memory lint unavailable.'],
      });
    }
  }, []);

  useEffect(() => {
    writeStoredLanguage(selectedLanguage);
    applyDocumentLocale(selectedLanguage);
  }, [selectedLanguage]);

  useEffect(() => {
    if (!qaUi.enabled || qaUiBootstrappedRef.current || !layoutReady) return;
    qaUiBootstrappedRef.current = true;
    const profile = qaPlayerProfile(selectedLanguage);
    const pet = createThronglet(
      TAMAGOTCHI_AGENT_PROMPT,
      profile.name,
      "qa-ui",
      10000,
      profile.petSeed,
      PET_HUD_COPY[selectedLanguage].agent,
      {
        intentMode: profile.intentMode,
        petRole: profile.avatarTitle,
        skills: profile.skills,
        personalArchive: profile.personalArchive,
      },
    );
    const npcContexts = personas.map((persona, index) => ({
      id: `npc-${persona.id}`,
      characterId: index + 1,
      name: persona.name,
      personaId: persona.id,
      text: `${persona.role} ${persona.intro} ${Object.values(persona.responses).join(" ")}`,
    }));
    const snapshot = createInitialSnapshot([pet], npcContexts);
    setHasStarted(true);
    setIsPostBootLoading(false);
    setPlayerDefaults(profile);
    setPlayerProfile(profile);
    setAppMode("interactive");
    setPlayMode("camp");
    setSimSnapshot(snapshot);
    setSelectedPet(null);
    setSelectedDispatchPet(null);
    setIsComputerDialogueOpen(false);
    setActiveDialogueId(null);
    setSplitPanel(null);
    setLanguageMenuOpen(false);

    if (qaUi.panel === "computer") setIsComputerDialogueOpen(true);
    if (qaUi.panel === "npc") setActiveDialogueId(1);
    if (qaUi.panel === "pet") setSelectedPet(pet);
    if (qaUi.panel === "language") {
      setIsComputerDialogueOpen(true);
      setLanguageMenuOpen(true);
    }
    if (qaUi.panel === "zine") {
      setSplitPanel({
        kind: "finalDocument",
        title: "Sorgearbeit in offene Communities: Eine unsichtbare Infrastruktur / Community kitchens and technical experiments",
        url: "",
        language: selectedLanguage,
        query: profile.question,
        isGenerating: true,
      });
    }
  }, [layoutReady, qaUi.enabled, qaUi.panel, selectedLanguage]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(pointer: coarse), (max-width: 900px)",
    );
    const sync = () => {
      setShowMobileControls(mediaQuery.matches);
    };
    sync();
    mediaQuery.addEventListener("change", sync);
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    return () => {
      mediaQuery.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
    };
  }, []);

  const findNearbyNpc = useCallback((): number | null => {
    const player = officeState.characters.get(PLAYER_ID);
    if (!player) return null;
    let nearest: { id: number; dist: number } | null = null;
    for (const id of personas.map((_persona, index) => index + 1)) {
      const npc = officeState.characters.get(id);
      if (!npc) continue;
      const dist =
        Math.abs(npc.tileCol - player.tileCol) +
        Math.abs(npc.tileRow - player.tileRow);
      if (dist <= 2 && (!nearest || dist < nearest.dist)) {
        nearest = { id, dist };
      }
    }
    return nearest?.id ?? null;
  }, [officeState]);

  const isPlayerNearCentralComputer = useCallback((): boolean => {
    const player = officeState.characters.get(PLAYER_ID);
    if (!player) return false;
    const bounds = editorEntryEnabled
      ? { col: COMPACT_EDITOR_CAMPFIRE_TILE.col, row: COMPACT_EDITOR_CAMPFIRE_TILE.row + CENTRAL_COMPUTER_FOOTPRINT.h - 1, w: CENTRAL_COMPUTER_FOOTPRINT.w, h: 1 }
      : campfireStoneBoundsFromLayout(officeState.getLayout());
    const nearestCol = Math.max(bounds.col, Math.min(bounds.col + bounds.w - 1, player.tileCol));
    const nearestRow = Math.max(bounds.row, Math.min(bounds.row + bounds.h - 1, player.tileRow));
    const dist = Math.abs(player.tileCol - nearestCol) + Math.abs(player.tileRow - nearestRow);
    return dist <= CAMPFIRE_INTERACTION_RADIUS_TILES;
  }, [editorEntryEnabled, officeState]);

  const isCentralComputerTile = useCallback((col: number, row: number): boolean => {
    const bounds = editorEntryEnabled
      ? { col: COMPACT_EDITOR_CAMPFIRE_TILE.col, row: COMPACT_EDITOR_CAMPFIRE_TILE.row + CENTRAL_COMPUTER_FOOTPRINT.h - 1, w: CENTRAL_COMPUTER_FOOTPRINT.w, h: 1 }
      : campfireStoneBoundsFromLayout(officeState.getLayout());
    return (
      col >= bounds.col &&
      col < bounds.col + bounds.w &&
      row >= bounds.row &&
      row < bounds.row + bounds.h
    );
  }, [editorEntryEnabled, officeState]);

  const getPlayerDistanceFromCharacter = useCallback(
    (characterId: number): number => {
      const player = officeState.characters.get(PLAYER_ID);
      const character = officeState.characters.get(characterId);
      if (!player || !character) return Number.POSITIVE_INFINITY;
      return (
        Math.abs(character.tileCol - player.tileCol) +
        Math.abs(character.tileRow - player.tileRow)
      );
    },
    [officeState],
  );

  useEffect(() => {
    if (!layoutReady || !playerProfile) return;
    if (!worldInitialized) {
      setWorldInitialized(true);
    }
    if (appMode === "interactive" && !editorEntryEnabled) {
      officeState.addPlayer(
        PLAYER_ID,
        playerProfile.palette,
        playerProfile.name,
      );
      officeState.cameraFollowId = PLAYER_ID;
    } else {
      officeState.characters.delete(PLAYER_ID);
      officeState.cameraFollowId = null;
    }
  }, [appMode, editorEntryEnabled, layoutReady, officeState, playerProfile, worldInitialized]);

  const applyRemotePresence = useCallback(
    (presence: MultiplayerPresence, localPlayerId: string) => {
      if (presence.playerId === localPlayerId) return;
      const id = remoteCharacterId(presence.playerId);
      officeState.addOrUpdateRemotePlayer(
        id,
        remotePalette(presence.playerId, presence.avatar),
        presence.displayName,
        presence.x,
        presence.y,
      );
    },
    [officeState],
  );

  useEffect(() => {
    if (!multiplayerConfig || !layoutReady || !playerProfile || appMode !== "interactive") {
      setRemotePresences(new Map());
      setVideoEncounter(null);
      setDismissedVideoEncounterId(null);
      setEncounterPanel(null);
      officeState.clearRemotePlayers();
      setMultiplayerStatus(multiplayerConfig ? "waiting" : "disabled");
      return;
    }

    const localPlayerId = getOrCreatePlayerId();
    const localPresence = () => {
      const player = officeState.characters.get(PLAYER_ID);
      return createPresence(
        multiplayerConfig,
        localPlayerId,
        playerProfile.name,
        playerProfile.avatarTitle ?? `palette-${playerProfile.palette}`,
        player ? { col: player.tileCol, row: player.tileRow } : { col: 1, row: 1 },
      );
    };

    const client = new MultiplayerPresenceClient(multiplayerConfig, localPresence(), {
      onSnapshot: (players) => {
        setRemotePresences((current) => {
          const next = new Map(current);
          for (const presence of players) {
            if (presence.playerId === localPlayerId) continue;
            next.set(presence.playerId, presence);
            applyRemotePresence(presence, localPlayerId);
          }
          return next;
        });
        console.info("[PBS multiplayer] room snapshot", multiplayerConfig.room, players.length);
      },
      onPresence: (presence) => {
        if (presence.playerId === localPlayerId) return;
        applyRemotePresence(presence, localPlayerId);
        setRemotePresences((current) => {
          const next = new Map(current);
          next.set(presence.playerId, presence);
          return next;
        });
        console.info("[PBS multiplayer] presence", presence.displayName, presence.x, presence.y);
      },
      onLeave: (playerId) => {
        officeState.removeRemotePlayer(remoteCharacterId(playerId));
        setRemotePresences((current) => {
          const next = new Map(current);
          next.delete(playerId);
          return next;
        });
      },
      onStatus: setMultiplayerStatus,
      onChatMessage: (message) => {
        setChatMessages((current) => {
          if (current.some((item) => item.id === message.id)) return current;
          return [...current.slice(-80), message];
        });
      },
    });

    multiplayerClientRef.current = client;
    client.connect();
    let lastSent = localPresence();
    let lastSentAt = 0;
    const interval = window.setInterval(() => {
      const nextPresence = localPresence();
      const now = Date.now();
      const moved = nextPresence.x !== lastSent.x || nextPresence.y !== lastSent.y;
      if (moved || now - lastSentAt > 5000) {
        client.updatePresence(nextPresence);
        lastSent = nextPresence;
        lastSentAt = now;
      }
    }, 750);
    const staleInterval = window.setInterval(() => {
      const now = Date.now();
      setRemotePresences((current) => {
        const next = new Map(current);
        for (const [playerId, presence] of current) {
          if (now - presence.lastActive <= MULTIPLAYER_STALE_TIMEOUT_MS) continue;
          officeState.removeRemotePlayer(remoteCharacterId(playerId));
          next.delete(playerId);
        }
        return next;
      });
    }, 2000);

    return () => {
      window.clearInterval(interval);
      window.clearInterval(staleInterval);
      if (multiplayerClientRef.current === client) multiplayerClientRef.current = null;
      client.close();
      officeState.clearRemotePlayers();
    };
  }, [
    appMode,
    applyRemotePresence,
    layoutReady,
    multiplayerConfig,
    officeState,
    playerProfile,
  ]);

  useEffect(() => {
    if (!multiplayerConfig || !playerProfile || appMode !== "interactive") {
      setVideoEncounter(null);
      return;
    }
    const player = officeState.characters.get(PLAYER_ID);
    if (!player) return;

    if (encounterPanel) {
      const partner = remotePresences.get(encounterPanel.partner.playerId);
      const distance = partner ? Math.hypot(player.tileCol - partner.x, player.tileRow - partner.y) : Number.POSITIVE_INFINITY;
      if (distance > MULTIPLAYER_PROXIMITY_DISTANCE_TILES) {
        setDismissedVideoEncounterId(encounterPanel.partner.playerId);
        setEncounterPanel(null);
      }
      setVideoEncounter(null);
      return;
    }

    if (dismissedVideoEncounterId) {
      const dismissed = remotePresences.get(dismissedVideoEncounterId);
      const distance = dismissed ? Math.hypot(player.tileCol - dismissed.x, player.tileRow - dismissed.y) : Number.POSITIVE_INFINITY;
      if (distance > MULTIPLAYER_REENCOUNTER_RESET_TILES) {
        setDismissedVideoEncounterId(null);
      } else {
        setVideoEncounter(null);
        return;
      }
    }

    let nearest: MultiplayerPresence | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const presence of remotePresences.values()) {
      const distance = Math.hypot(player.tileCol - presence.x, player.tileRow - presence.y);
      if (distance <= MULTIPLAYER_PROXIMITY_DISTANCE_TILES && distance < nearestDistance) {
        nearest = presence;
        nearestDistance = distance;
      }
    }
    setVideoEncounter(nearest);
  }, [
    appMode,
    dismissedVideoEncounterId,
    encounterPanel,
    multiplayerConfig,
    officeState,
    playerMoveTick,
    playerProfile,
    remotePresences,
  ]);

  const openEncounterPanel = useCallback(
    (partner: MultiplayerPresence) => {
      if (!multiplayerConfig) return;
      const localPlayerId = getOrCreatePlayerId();
      setEncounterPanel({
        partner,
        encounterId: encounterIdForPlayers(multiplayerConfig.room, localPlayerId, partner.playerId),
      });
      setVideoEncounter(null);
    },
    [multiplayerConfig],
  );

  useEffect(() => {
    if (!videoEncounter || encounterPanel) return;
    openEncounterPanel(videoEncounter);
  }, [encounterPanel, openEncounterPanel, videoEncounter]);

  const sendChatMessage = useCallback(() => {
    if (!multiplayerConfig || !playerProfile || !encounterPanel) return;
    const text = chatDraft.trim();
    if (!text) return;
    const senderId = getOrCreatePlayerId();
    const message: MultiplayerChatMessage = {
      id: `${senderId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      room: multiplayerConfig.room,
      encounterId: encounterPanel.encounterId,
      senderId,
      senderName: playerProfile.name,
      text,
      timestamp: Date.now(),
    };
    multiplayerClientRef.current?.sendChatMessage(message);
    setChatMessages((current) => [...current.slice(-80), message]);
    setChatDraft("");
  }, [chatDraft, encounterPanel, multiplayerConfig, playerProfile]);

  useEffect(() => {
    if (!encounterPanel) return;
    const log = chatLogRef.current;
    if (!log) return;
    log.scrollTo({ top: log.scrollHeight, behavior: "smooth" });
  }, [chatMessages, encounterPanel]);

  // 60 Hz render tick: forces React overlays (name tags, "Press Space" prompt,
  // archive-tree highlight, etc.) to recompute from the latest character.x/y
  // and panRef each frame, so they don't lag behind the canvas.
  useEffect(() => {
    if (!layoutReady || !playerProfile) return;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      setPlayerMoveTick((t) => (t + 1) | 0);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [layoutReady, playerProfile]);

  useEffect(() => {
    if (!layoutReady || appMode !== "interactive") return;
    if (editorEntryEnabled) {
      personas.forEach((_persona, index) => {
        officeState.characters.delete(index + 1);
      });
      return;
    }
    const placements = editorEntryEnabled ? compactEditorNpcPlacements : nextTinyRoomNpcPlacements;
    const personaById = new Map(
      personas.map((persona, index) => [persona.id, index + 1]),
    );
    const occupied = new Set<string>();
    for (const placement of placements) {
      const agentId = personaById.get(placement.personaId);
      if (!agentId) continue;
      if (!officeState.characters.has(agentId)) {
        const persona = personas[agentId - 1];
        const appearance = getPersonaNpcAppearance(persona?.id ?? "", agentId - 1);
        officeState.addAgent(agentId, appearance.palette, appearance.hueShift, undefined, true, persona?.name ?? `NPC ${agentId}`);
      }
      const ch = officeState.characters.get(agentId);
      if (!ch) continue;
      const appearance = getPersonaNpcAppearance(placement.personaId, agentId - 1);
      ch.palette = appearance.palette;
      ch.hueShift = appearance.hueShift;
      const resolvedPlacement = findNearestApproachableTile(
        officeState,
        placement.col,
        placement.row,
        occupied,
      );
      occupied.add(`${resolvedPlacement.col},${resolvedPlacement.row}`);
      ch.tileCol = resolvedPlacement.col;
      ch.tileRow = resolvedPlacement.row;
      ch.x = resolvedPlacement.col * TILE_SIZE + TILE_SIZE / 2;
      ch.y = resolvedPlacement.row * TILE_SIZE + TILE_SIZE / 2;
      ch.path = [];
      ch.moveProgress = 0;
      ch.wanderTimer = 2 + (agentId % 5);
      ch.seatId = null;
    }
  }, [appMode, editorEntryEnabled, layoutReady, officeState]);

  useEffect(() => {
    if (!layoutReady || !playerProfile || appMode !== "interactive") return;
    const interval = window.setInterval(() => {
      if (activeDialogueIdRef.current !== null) return;
      const occupied = new Set<string>();
      for (const ch of officeState.characters.values()) {
        if (ch.path.length === 0) occupied.add(`${ch.tileCol},${ch.tileRow}`);
      }
      const shuffled = personas
        .map((_persona, index) => index + 1)
        .filter((id) => officeState.characters.has(id))
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      for (const id of shuffled) {
        const ch = officeState.characters.get(id);
        if (!ch || ch.path.length > 0 || ch.matrixEffect || ch.isPlayer)
          continue;
        if (nearbyNpcIdRef.current === id) continue;
        if (Math.random() > 0.58) continue;
        const target = findShortNpcStep(
          officeState,
          ch.tileCol,
          ch.tileRow,
          occupied,
        );
        if (target && officeState.walkToTile(id, target.col, target.row)) {
          occupied.delete(`${ch.tileCol},${ch.tileRow}`);
          occupied.add(`${target.col},${target.row}`);
        }
      }
    }, 3600);
    return () => window.clearInterval(interval);
  }, [appMode, layoutReady, officeState, playerProfile]);

  useEffect(() => {
    if (
      !layoutReady ||
      !playerProfile ||
      appMode !== "interactive" ||
      !simSnapshot
    )
      return;
    simSnapshot.thronglets.forEach((pet, index) => {
      const character = officeState.characters.get(pet.characterId);
      const label = t(selectedLanguage, "pet.questionPet");
      const roleSlug = resolvePetRoleSlug(pet.appearance.bodyType, pet.appearance.seed);
      const animation = createThrongletWaDirectionalAnimations(chooseThrongletExpression(pet.state, pet.currentAction), roleSlug);
      if (character) {
        character.folderName = label;
        character.spriteAnimationsByDirection = animation;
        character.spriteAnimation = undefined;
        character.spriteOverride = animation[character.dir]?.[0] ?? appearanceToSpriteData(pet.appearance);
        character.imageSpriteAnimation = undefined;
      } else {
        officeState.addQuestionPet(
          pet.characterId,
          label,
          appearanceToSpriteData(pet.appearance),
          3 + (index % 3),
          7,
        );
        const added = officeState.characters.get(pet.characterId);
        if (added) {
          added.spriteAnimationsByDirection = animation;
          added.spriteOverride = animation[added.dir]?.[0] ?? appearanceToSpriteData(pet.appearance);
        }
      }
    });
  }, [
    appMode,
    layoutReady,
    officeState,
    playerProfile,
    selectedLanguage,
    simSnapshot,
  ]);

  useEffect(() => {
    if (
      !layoutReady ||
      !playerProfile ||
      appMode !== "interactive" ||
      !simSnapshot
    )
      return;
    const runawayKey = `${playerProfile.petSeed ?? TAMAGOTCHI_AGENT_PROMPT}-${simSnapshot.thronglets.map((pet) => pet.id).join("|")}`;
    if (petRunawayDoneRef.current === runawayKey) return;
    petRunawayDoneRef.current = runawayKey;
    const timeout = window.setTimeout(() => {
      simSnapshot.thronglets.forEach((pet, index) => {
        const ch = officeState.characters.get(pet.characterId);
        if (!ch) return;
        ch.moveSpeedMultiplier = 4.2;
        void officeState.walkToTile(pet.characterId, 7 - (index % 3), 7);
      });
      setWorldNotice(PET_RUNAWAY_NOTICE[selectedLanguage]);
      window.setTimeout(() => setWorldNotice(null), 5000);
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [
    appMode,
    layoutReady,
    officeState,
    playerProfile,
    selectedLanguage,
    simSnapshot,
  ]);

  useEffect(() => {
    if (
      !layoutReady ||
      !playerProfile ||
      appMode !== "interactive" ||
      !simSnapshot
    )
      return;
    const interval = window.setInterval(() => {
      setSimSnapshot((current) => {
        if (!current) return current;
        const contexts = Object.fromEntries(
          current.thronglets.map((pet) => [
            pet.id,
            personas
              .map((persona) => `${persona.role} ${persona.intro}`)
              .join(" "),
          ]),
        );
        const npcKnowledgeContexts: Record<string, NpcKnowledgeContext> = Object.fromEntries(
          personas.map((persona) => {
            const links = getWikiLinksForInterviewee(persona.id).links;
            return [
              `npc-${persona.id}`,
              {
                personaId: persona.id,
                name: persona.name,
                role: persona.role,
                intro: persona.intro,
                links,
              },
            ];
          }),
        );
        const next = tickSimulation(current, contexts, npcKnowledgeContexts);
        for (const pet of next.thronglets) {
          const ch = officeState.characters.get(pet.characterId);
          if (!ch || ch.path.length > 0) continue;
          const targets =
            pet.currentAction === "visitRiver" || pet.state.energy < 35
              ? [
                  { col: 20, row: 16 },
                  { col: 45, row: 12 },
                ]
              : pet.currentAction === "joinThrong" || pet.state.groupBond > 50
                ? [{ col: 43, row: 31 }]
                : pet.currentAction === "reflect" || pet.state.solitude > 60
                  ? [
                      { col: 14, row: 51 },
                      { col: 53, row: 50 },
                    ]
                  : [
                      {
                        col:
                          ch.tileCol + ((next.tick + pet.characterId) % 3) - 1,
                        row:
                          ch.tileRow +
                          (((next.tick + pet.characterId) >> 1) % 3) -
                          1,
                      },
                    ];
          const target = targets[next.tick % targets.length];
          officeState.walkToTile(pet.characterId, target.col, target.row);
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [appMode, layoutReady, officeState, playerProfile, simSnapshot]);

  useEffect(() => {
    if (!layoutReady || !playerProfile || appMode !== "interactive") return;
    const interval = window.setInterval(() => {
      const player = officeState.characters.get(PLAYER_ID);
      const nearbyId = findNearbyNpc();
      setNearbyNpcId(nearbyId);
      setPromptAnchor((prev) => {
        if (!nearbyId) return null;
        if (prev && prev.npcId === nearbyId) return prev;
        const npc = officeState.characters.get(nearbyId);
        if (!npc) return null;
        return { npcId: nearbyId, col: npc.tileCol, row: npc.tileRow };
      });
      if (player && nearbyId) {
        officeState.faceCharacterToward(
          nearbyId,
          player.tileCol,
          player.tileRow,
        );
      }
    }, 250);
    return () => window.clearInterval(interval);
  }, [appMode, findNearbyNpc, layoutReady, officeState, playerProfile]);

  useEffect(() => {
    if (!layoutReady || !playerProfile || appMode !== "interactive") return;
    const interval = window.setInterval(() => {
      if (!qaUi.enabled && activeDialogueIdRef.current !== null) {
        const distance = getPlayerDistanceFromCharacter(
          activeDialogueIdRef.current,
        );
        if (distance > CONVERSATION_CLOSE_DISTANCE_TILES) {
          setActiveDialogueId(null);
        }
      }

      if (!qaUi.enabled && computerDialogueOpenRef.current && !isPlayerNearCentralComputer()) {
        setIsComputerDialogueOpen(false);
      }

      if (dismissedAutoComputer && !isPlayerNearCentralComputer()) {
        setDismissedAutoComputer(false);
      }

      if (pendingComputerOpen && !computerDialogueOpenRef.current && isPlayerNearCentralComputer()) {
        setPendingComputerOpen(false);
        setIsComputerDialogueOpen(true);
      }

      if (!dismissedAutoComputer && !pendingComputerOpen && !computerDialogueOpenRef.current && activeDialogueIdRef.current === null && !splitPanel && !videoEncounter && !encounterPanel && isPlayerNearCentralComputer()) {
        setIsComputerDialogueOpen(true);
      }

      setSplitPanel((current) => {
        if (!current || !splitPanelAnchor) return current;
        const awayFromNpc =
          !qaUi.enabled &&
          splitPanelAnchor.kind === "npc" &&
          getPlayerDistanceFromCharacter(splitPanelAnchor.id) >
            CONVERSATION_CLOSE_DISTANCE_TILES;
        if (awayFromNpc) {
          setIsSplitExpanded(false);
          setSplitPanelAnchor(null);
          return null;
        }
        return current;
      });
    }, 250);
    return () => window.clearInterval(interval);
  }, [
    appMode,
    dismissedAutoComputer,
    getPlayerDistanceFromCharacter,
    isPlayerNearCentralComputer,
    layoutReady,
    officeState,
    pendingComputerOpen,
    playerProfile,
    qaUi.enabled,
    splitPanel,
    splitPanelAnchor,
    videoEncounter,
    encounterPanel,
  ]);

  const nearbyNpcIdRef = useRef<number | null>(null);
  const activeDialogueIdRef = useRef<number | null>(null);
  const computerDialogueOpenRef = useRef(false);
  const latestA2ANoticeIdRef = useRef<string | null>(null);
  const worldNoticeTimerRef = useRef<number | null>(null);
  useEffect(() => {
    nearbyNpcIdRef.current = nearbyNpcId;
  }, [nearbyNpcId]);
  useEffect(() => {
    activeDialogueIdRef.current = activeDialogueId;
  }, [activeDialogueId]);
  useEffect(() => {
    computerDialogueOpenRef.current = isComputerDialogueOpen;
  }, [isComputerDialogueOpen]);

  useEffect(() => {
    if (!simSnapshot || appMode !== "interactive") return;
    const exchange = simSnapshot.a2aExchanges[0];
    if (!exchange || latestA2ANoticeIdRef.current === exchange.id) return;
    latestA2ANoticeIdRef.current = exchange.id;

    const pet = simSnapshot.thronglets.find((item) => item.id === exchange.petId);
    const target = simSnapshot.entities.find((item) => item.id === exchange.targetId);
    const petCharacter = pet ? officeState.characters.get(pet.characterId) : null;
    const npcCharacter = target ? officeState.characters.get(target.characterId) : null;
    if (petCharacter && npcCharacter) {
      const occupied = new Set(Array.from(officeState.characters.values()).map((ch) => `${ch.tileCol},${ch.tileRow}`));
      occupied.delete(`${petCharacter.tileCol},${petCharacter.tileRow}`);
      const approachTile = findNearestApproachableTile(officeState, npcCharacter.tileCol + 1, npcCharacter.tileRow, occupied);
      void officeState.walkToTile(petCharacter.id, approachTile.col, approachTile.row);
      officeState.faceCharacterToward(petCharacter.id, npcCharacter.tileCol, npcCharacter.tileRow);
      officeState.faceCharacterToward(npcCharacter.id, petCharacter.tileCol, petCharacter.tileRow);
    }

    if (worldNoticeTimerRef.current !== null) {
      window.clearTimeout(worldNoticeTimerRef.current);
    }
    setWorldNotice(exchange.summary);
    worldNoticeTimerRef.current = window.setTimeout(() => {
      setWorldNotice(null);
      worldNoticeTimerRef.current = null;
    }, 5200);
  }, [appMode, officeState, simSnapshot]);

  useEffect(() => {
    if (!layoutReady || !playerProfile || appMode !== "interactive") return;
    let index = 0;
    const interval = window.setInterval(() => {
      if (isComputerDialogueOpen || activeDialogueIdRef.current !== null || splitPanel) return;
      const lines = CAMPFIRE_BROADCASTS[selectedLanguage] ?? CAMPFIRE_BROADCASTS.en;
      const thoughtLines = THOUGHT_GAP_BROADCASTS[selectedLanguage] ?? THOUGHT_GAP_BROADCASTS.en;
      const isThoughtGap = true;
      const notice = thoughtLines[index % thoughtLines.length] || lines[index % lines.length];
      setWorldNotice(notice);
      if (isThoughtGap) {
        setPetLintGapInbox((current) => {
          const alreadyStored = current.some((item) => item.text === notice);
          if (alreadyStored) return current;
          const next = [
            {
              id: `thought-gap-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
              text: notice,
              language: selectedLanguage,
              createdAt: new Date().toISOString(),
              source: "thought-gap-broadcast" as const,
            },
            ...current,
          ].slice(0, 24);
          writePetLintGapInbox(next);
          return next;
        });
      }
      index += 1;
      if (worldNoticeTimerRef.current !== null) window.clearTimeout(worldNoticeTimerRef.current);
      worldNoticeTimerRef.current = window.setTimeout(() => {
        setWorldNotice(null);
        worldNoticeTimerRef.current = null;
      }, 5000);
    }, 60000);
    return () => window.clearInterval(interval);
  }, [appMode, isComputerDialogueOpen, layoutReady, playerProfile, selectedLanguage, splitPanel]);

  useEffect(() => {
    if (!layoutReady || !playerProfile || appMode !== "interactive") return;

    // Continuous smooth movement: track held keys, advance via rAF, do not rely on OS key-repeat.
    const heldKeys = new Set<"up" | "down" | "left" | "right">();
    let isSprint = false;
    let sprintHeld = false;
    let raf = 0;
    let nextRepeatAt = 0;

    const dirOf = (
      event: KeyboardEvent,
    ): "up" | "down" | "left" | "right" | null => {
      const k = event.key.toLowerCase();
      if (event.key === "ArrowUp" || k === "w") return "up";
      if (event.key === "ArrowDown" || k === "s") return "down";
      if (event.key === "ArrowLeft" || k === "a") return "left";
      if (event.key === "ArrowRight" || k === "d") return "right";
      return null;
    };

    const stepOnce = (dir: "up" | "down" | "left" | "right"): boolean => {
      if (dir === "up") return officeState.movePlayerBy(PLAYER_ID, 0, -1);
      if (dir === "down") return officeState.movePlayerBy(PLAYER_ID, 0, 1);
      if (dir === "left") return officeState.movePlayerBy(PLAYER_ID, -1, 0);
      return officeState.movePlayerBy(PLAYER_ID, 1, 0);
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);
      // Re-apply speed multiplier every frame so sprint actually takes effect during the whole hold.
      isSprint = sprintHeld;
      officeState.setPlayerSpeedMultiplier(PLAYER_ID, isSprint ? PLAYER_SPRINT_SPEED_MULTIPLIER : 1);

      const ch = officeState.characters.get(PLAYER_ID);
      if (!ch) return;
      // Only push another tile when the queue is short, so direction changes feel responsive.
      const targetMaxQueue = 1;
      if (ch.path.length > targetMaxQueue) return;
      if (heldKeys.size === 0) return;
      const now = performance.now();
      if (now < nextRepeatAt) return;

      // Vertical first, then horizontal (no diagonals).
      let dir: "up" | "down" | "left" | "right" | null = null;
      if (heldKeys.has("up")) dir = "up";
      else if (heldKeys.has("down")) dir = "down";
      else if (heldKeys.has("left")) dir = "left";
      else if (heldKeys.has("right")) dir = "right";
      if (!dir) return;

      const moved = stepOnce(dir);
      if (moved) {
        setPlayerMoveTick((t) => t + 1);
        nextRepeatAt = now + (isSprint ? 24 : 70);
      }
    };
    raf = requestAnimationFrame(tick);

    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return;

      if (event.key === "Shift" || event.key === "Control") {
        sprintHeld = true;
      }

      if (event.key === "Escape") {
        if (computerDialogueOpenRef.current) setDismissedAutoComputer(true);
        setActiveDialogueId(null);
        setIsComputerDialogueOpen(false);
        setPendingComputerOpen(false);
        return;
      }
      if (event.code === "Space") {
        if (
          activeDialogueIdRef.current === null &&
          !computerDialogueOpenRef.current &&
          isPlayerNearCentralComputer()
        ) {
          event.preventDefault();
          setIsComputerDialogueOpen(true);
          return;
        }
        if (
          activeDialogueIdRef.current === null &&
          !computerDialogueOpenRef.current &&
          nearbyNpcIdRef.current !== null
        ) {
          event.preventDefault();
          officeState.selectedAgentId = nearbyNpcIdRef.current;
          setActiveDialogueId(nearbyNpcIdRef.current);
        }
        return;
      }
      const dir = dirOf(event);
      if (dir) {
        event.preventDefault();
        const fresh = !heldKeys.has(dir);
        heldKeys.add(dir);
        if (fresh) {
          // Immediate one-tile push for tap responsiveness.
          officeState.setPlayerSpeedMultiplier(PLAYER_ID, sprintHeld ? PLAYER_SPRINT_SPEED_MULTIPLIER : 1);
          if (stepOnce(dir)) {
            setPlayerMoveTick((t) => t + 1);
            nextRepeatAt = performance.now() + (sprintHeld ? 24 : 70);
          }
        }
      }
    }

    function onKeyUp(event: KeyboardEvent) {
      if (event.key === "Shift" || event.key === "Control") {
        sprintHeld = false;
        isSprint = false;
      }
      const dir = dirOf(event);
      if (dir) heldKeys.delete(dir);
      if (heldKeys.size === 0) {
        nextRepeatAt = 0;
      }
    }

    function onWindowBlur() {
      heldKeys.clear();
      isSprint = false;
      sprintHeld = false;
      nextRepeatAt = 0;
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onWindowBlur);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onWindowBlur);
    };
  }, [appMode, isPlayerNearCentralComputer, layoutReady, officeState, playerProfile]);

  const handleMobileMapTap = useCallback(
    (col: number, row: number) => {
      if (playerProfile && appMode === "interactive" && isCentralComputerTile(col, row)) {
        officeState.cameraFollowId = PLAYER_ID;
        if (isPlayerNearCentralComputer()) {
          setPendingComputerOpen(false);
          setIsComputerDialogueOpen(true);
          return;
        }
        const occupied = new Set(
          Array.from(officeState.characters.values())
            .filter((ch) => ch.id !== PLAYER_ID)
            .map((ch) => `${ch.tileCol},${ch.tileRow}`),
        );
        const computerTile = editorEntryEnabled
          ? { col: COMPACT_EDITOR_CAMPFIRE_TILE.col, row: COMPACT_EDITOR_CAMPFIRE_TILE.row + CENTRAL_COMPUTER_FOOTPRINT.h - 1, w: CENTRAL_COMPUTER_FOOTPRINT.w, h: 1 }
          : campfireStoneBoundsFromLayout(officeState.getLayout());
        const approachTile = findNearestApproachableTile(
          officeState,
          computerTile.col + Math.floor(computerTile.w / 2),
          computerTile.row + computerTile.h,
          occupied,
        );
        const moved = officeState.walkToTile(PLAYER_ID, approachTile.col, approachTile.row);
        setPendingComputerOpen(true);
        if (moved) setPlayerMoveTick((tick) => tick + 1);
        return;
      }
      setPendingComputerOpen(false);
      officeState.cameraFollowId = PLAYER_ID;
      const moved = officeState.walkToTile(PLAYER_ID, col, row);
      if (moved) {
        setPlayerMoveTick((tick) => tick + 1);
      }
    },
    [appMode, editorEntryEnabled, isCentralComputerTile, isPlayerNearCentralComputer, officeState, playerProfile],
  );

  const handlePlayerStart = useCallback(
    (profile: PlayerProfile, mode: StartMode) => {
      const pet = createThronglet(
        TAMAGOTCHI_AGENT_PROMPT,
        profile.name,
        PLAYER_ID,
        10000,
        profile.petSeed,
        t(selectedLanguage, "pet.questionPet"),
        {
          intentMode: profile.intentMode,
          petRole: profile.avatarTitle,
          skills: profile.skills,
          personalArchive: "",
        },
      );
      const npcContexts = personas.map((persona, index) => ({
        id: `npc-${persona.id}`,
        characterId: index + 1,
        name: persona.name,
        personaId: persona.id,
        text: `${persona.role} ${persona.intro} ${Object.values(persona.responses).join(" ")}`,
      }));
      setSimSnapshot(createInitialSnapshot([pet], npcContexts));
      void createCloudPetPersona(profile)
        .then((personaText) => {
          if (!personaText) return;
          setSimSnapshot((current) => current
            ? {
                ...current,
                thronglets: current.thronglets.map((item) => item.id === pet.id
                  ? {
                      ...item,
                      personaJson: item.personaJson
                        ? {
                            ...item.personaJson,
                            voice: personaText,
                            growthLog: [personaText, ...(item.personaJson.growthLog ?? [])].slice(0, 24),
                          }
                        : item.personaJson,
                    }
                  : item),
              }
            : current,
          );
        })
        .catch((error) => console.warn("Question pet persona creation failed", error));
      setPlayerDefaults(profile);
      setPlayerProfile(profile);
      setAppMode(mode);
      setPlayMode("camp");
      setSelectedDispatchPet(null);

      try {
        localStorage.setItem("peach_player_profile", JSON.stringify(profile));
        const created = petStore.createDispatch({
          ownerName: profile.name,
          displayName: t(selectedLanguage, "pet.questionPet"),
          question: TAMAGOTCHI_AGENT_PROMPT,
          skill: [
            "source care",
            "public language care",
            "overclaiming check",
            `petRole:${profile.avatarTitle ?? "Tamagotchi agent"}`,
            profile.skills ?? "",
          ].filter(Boolean).join("\n\n"),
          seed: profile.petSeed ?? `${Date.now()}`,
          isMobile: showMobileControls,
        });
        setDispatchedPets(petStore.listPets());
        if (mode === "dispatch_observer") {
          setSelectedDispatchPet(created);
        }
      } catch (error) {
        console.warn("Question pet dispatch storage failed", error);
      }
    },
    [selectedLanguage, showMobileControls],
  );

  const handleLanguageChange = useCallback((language: LanguageCode) => {
    setSelectedLanguage(language);
    setLanguageMenuOpen(false);
  }, []);

  useEffect(() => {
    if (!layoutReady || !playerProfile) return;
    const maxVisibleDispatchCharacters = 40;
    for (let index = activeDispatchPets.length; index < maxVisibleDispatchCharacters; index += 1) {
      officeState.characters.delete(20000 + index);
    }
    activeDispatchPets.forEach((pet, index) => {
      const id = 20000 + index;
      const label = t(selectedLanguage, "pet.questionPet");
      const character = officeState.characters.get(id);
      if (character) {
        character.folderName = label;
        const existingAppearance = generateQuestionPet(pet.question, pet.seed);
        const roleSlug = resolvePetRoleSlug(existingAppearance.bodyType, existingAppearance.seed);
        const animation = createThrongletWaDirectionalAnimations(chooseThrongletExpression(pet.stats), roleSlug);
        character.spriteAnimationsByDirection = animation;
        character.spriteAnimation = undefined;
        character.spriteOverride = animation[character.dir]?.[0] ?? appearanceToSpriteData(existingAppearance);
        character.imageSpriteAnimation = undefined;
        return;
      }
      const appearance = generateQuestionPet(pet.question, pet.seed);
      const roleSlug = resolvePetRoleSlug(appearance.bodyType, appearance.seed);
      const animation = createThrongletWaDirectionalAnimations(chooseThrongletExpression(pet.stats), roleSlug);
      officeState.addQuestionPet(
        id,
        label,
        appearanceToSpriteData(appearance),
        Math.round(pet.worldPosition.x),
        Math.round(pet.worldPosition.y),
      );
      const added = officeState.characters.get(id);
      if (added) {
        added.spriteAnimationsByDirection = animation;
        added.spriteOverride = animation[added.dir]?.[0] ?? appearanceToSpriteData(appearance);
      }
    });
  }, [
    activeDispatchPets,
    layoutReady,
    officeState,
    playerProfile,
    selectedLanguage,
  ]);

  useEffect(() => {
    if (!playerProfile || activeDispatchPets.length === 0) return;
    const interval = window.setInterval(() => {
      const pets = petStore.listPets();
      const active = pets.filter((pet) => pet.status === "active");
      const avg = (key: keyof PetDispatch["stats"]) =>
        active.length
          ? active.reduce((sum, pet) => sum + pet.stats[key], 0) / active.length
          : 0;
      if (
        active.length >= 12 &&
        avg("social") > 60 &&
        avg("learning") > 60 &&
        avg("tension") < 70
      ) {
        setWorldNotice(t(selectedLanguage, "pet.worldResonanceEvent"));
        active.slice(0, 4).forEach((pet) =>
          petStore.addInteraction(pet.id, {
            actorType: "system",
            message: t(selectedLanguage, "pet.worldResonanceEvent"),
            tags: ["world-resonance"],
            deltaStats: { social: 2, learning: 2 },
          }),
        );
      } else {
        const clustered = active
          .filter((pet) => pet.stats.social > 50)
          .slice(0, 3);
        if (
          clustered.length >= 3 &&
          clustered.some((pet) =>
            tagsFromText(pet.question).some((tag) =>
              tagsFromText(clustered[0].question).includes(tag),
            ),
          )
        ) {
          setWorldNotice(t(selectedLanguage, "pet.smallCircleEvent"));
          clustered.forEach((pet) =>
            petStore.addInteraction(pet.id, {
              actorType: "system",
              message: t(selectedLanguage, "pet.smallCircleEvent"),
              tags: ["small-circle"],
              deltaStats: { learning: 5 },
            }),
          );
        }
      }
      setDispatchedPets(petStore.listPets());
      window.setTimeout(() => setWorldNotice(null), 5000);
    }, 6000);
    return () => window.clearInterval(interval);
  }, [activeDispatchPets.length, playerProfile, selectedLanguage]);

  function handleCloseWorld() {
    setPlayerProfile(null);
    setActiveDialogueId(null);
    setSplitPanel(null);
    setIsSplitExpanded(false);
    setPendingComputerOpen(false);
    setSelectedPet(null);
    setSelectedDispatchPet(null);
    setSelectedNpcInfo(null);
    officeState.characters.delete(PLAYER_ID);
    officeState.cameraFollowId = null;
    setDispatchedPets(petStore.listPets());
  }

  function handleClearArchive() {
    petStore.clearLocalDemo();
    setDispatchedPets([]);
  }

  // Force dependency on editorTickForKeyboard to propagate keyboard-triggered re-renders
  void editorTickForKeyboard;

  const isNearCentralComputer = playerProfile && appMode === "interactive" ? isPlayerNearCentralComputer() : false;

  const promptPosition = (() => {
    if (!promptAnchor || !containerRef.current) return null;
    const npc = officeState.characters.get(promptAnchor.npcId);
    if (!npc) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const layout = officeState.getLayout();
    const mapW = layout.cols * TILE_SIZE * editor.zoom;
    const mapH = layout.rows * TILE_SIZE * editor.zoom;
    const canvasW = rect.width * dpr;
    const canvasH = rect.height * dpr;
    const deviceOffsetX =
      Math.floor((canvasW - mapW) / 2) + Math.round(editor.panRef.current.x);
    const deviceOffsetY =
      Math.floor((canvasH - mapH) / 2) + Math.round(editor.panRef.current.y);
    return {
      left: (deviceOffsetX + npc.x * editor.zoom) / dpr,
      top: (deviceOffsetY + (npc.y - 24) * editor.zoom) / dpr,
    };
  })();

  const computerPromptPosition = (() => {
    if (!isNearCentralComputer || !containerRef.current) return null;
    const computerTile = editorEntryEnabled
      ? { col: COMPACT_EDITOR_CAMPFIRE_TILE.col, row: COMPACT_EDITOR_CAMPFIRE_TILE.row + CENTRAL_COMPUTER_FOOTPRINT.h - 1, w: CENTRAL_COMPUTER_FOOTPRINT.w, h: 1 }
      : campfireStoneBoundsFromLayout(officeState.getLayout());
    const rect = containerRef.current.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const layout = officeState.getLayout();
    const mapW = layout.cols * TILE_SIZE * editor.zoom;
    const mapH = layout.rows * TILE_SIZE * editor.zoom;
    const canvasW = rect.width * dpr;
    const canvasH = rect.height * dpr;
    const deviceOffsetX = Math.floor((canvasW - mapW) / 2) + Math.round(editor.panRef.current.x);
    const deviceOffsetY = Math.floor((canvasH - mapH) / 2) + Math.round(editor.panRef.current.y);
    return {
      left: (deviceOffsetX + ((computerTile.col + computerTile.w / 2) * TILE_SIZE) * editor.zoom) / dpr,
      top: (deviceOffsetY + (computerTile.row * TILE_SIZE - 18) * editor.zoom) / dpr,
    };
  })();

  const nameTags = (() => {
    if (!containerRef.current)
      return [] as Array<{
        id: number;
        name: string;
        left: number;
        top: number;
        isQuestionPet: boolean;
        zoomScale: number;
        offsetX?: number;
        offsetY?: number;
      }>;
    const rect = containerRef.current.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const layout = officeState.getLayout();
    const mapW = layout.cols * TILE_SIZE * editor.zoom;
    const mapH = layout.rows * TILE_SIZE * editor.zoom;
    const canvasW = rect.width * dpr;
    const canvasH = rect.height * dpr;
    const deviceOffsetX =
      Math.floor((canvasW - mapW) / 2) + Math.round(editor.panRef.current.x);
    const deviceOffsetY =
      Math.floor((canvasH - mapH) / 2) + Math.round(editor.panRef.current.y);
    const rawTags = Array.from(officeState.characters.values())
      .filter((ch) => ch.folderName)
      .map((ch) => ({
        id: ch.id,
        name: ch.folderName ?? "",
        left: (deviceOffsetX + ch.x * editor.zoom) / dpr,
        top: (deviceOffsetY + (ch.y - 34) * editor.zoom) / dpr,
        isQuestionPet: Boolean(ch.isQuestionPet),
        zoomScale: Math.max(0.12, Math.min(0.62, (editor.zoom / 5) * 0.58)),
      }));
    const placed: Array<{ x: number; y: number; w: number; h: number }> = [];
    const gap = 4;
    const estimateWidth = (name: string, scale: number) => Math.min(220, Math.max(54, name.length * 9 + 30)) * scale;
    const estimateHeight = (scale: number) => 30 * scale;
    return rawTags
      .sort((a, b) => a.top - b.top || a.left - b.left)
      .map((tag) => {
        const w = estimateWidth(tag.name, tag.zoomScale);
        const h = estimateHeight(tag.zoomScale);
        const lanes = [
          { x: 0, y: 0 },
          { x: 0, y: -(h + gap) },
          { x: 0, y: h + gap },
          { x: -(w * 0.58 + gap), y: 0 },
          { x: w * 0.58 + gap, y: 0 },
          { x: -(w * 0.58 + gap), y: -(h + gap) },
          { x: w * 0.58 + gap, y: -(h + gap) },
          { x: -(w * 0.58 + gap), y: h + gap },
          { x: w * 0.58 + gap, y: h + gap },
          { x: 0, y: -2 * (h + gap) },
          { x: 0, y: 2 * (h + gap) },
        ];
        const pick = lanes.find((lane) => {
          const rect = { x: tag.left + lane.x - w / 2, y: tag.top + lane.y - h, w, h };
          return !placed.some((other) => rect.x < other.x + other.w + gap && rect.x + rect.w + gap > other.x && rect.y < other.y + other.h + gap && rect.y + rect.h + gap > other.y);
        }) ?? lanes[lanes.length - 1];
        placed.push({ x: tag.left + pick.x - w / 2, y: tag.top + pick.y - h, w, h });
        return { ...tag, offsetX: pick.x, offsetY: pick.y };
      });
  })();

  // Show "Press R to rotate" hint when a rotatable item is selected or being placed
  const showRotateHint =
    terrainEditorEnabled && editor.isEditMode &&
    (() => {
      if (editorState.selectedFurnitureUid) {
        const item = officeState
          .getLayout()
          .furniture.find((f) => f.uid === editorState.selectedFurnitureUid);
        if (item && isRotatable(item.type)) return true;
      }
      if (
        editorState.activeTool === EditTool.FURNITURE_PLACE &&
        isRotatable(editorState.selectedFurnitureType)
      ) {
        return true;
      }
      return false;
    })();

  const shouldShowMobileStatsBar =
    Boolean(playerProfile) &&
    showMobileControls &&
    appMode === "interactive" &&
    !isSplitOpen &&
    !activeDialoguePersona &&
    !isComputerDialogueOpen &&
    !selectedDispatchPet &&
    !selectedPet &&
    !selectedNpcInfo &&
    !mobileRulesOpen;

  const closeSplitPanel = useCallback(() => {
    setSplitPanel(null);
    setSplitPanelAnchor(null);
    setIsSplitExpanded(false);
  }, []);

  async function openAssociationZineSplit(request: {
    query: string;
    seed?: string;
    petRole?: string;
    writingStyle?: string;
    repairInstruction?: string;
    repairUsefulParts?: string;
    repairUselessParts?: string;
    language: LanguageCode;
    anchorId?: number;
  }): Promise<void> {
    const requestKey = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const loadingTitle = "Association";
    const query = request.query || request.seed || "";
    if (query.trim()) void evaluateSharedMemoryLint(query);
    if (splitPanel?.kind === "finalDocument" && splitPanel.url) {
      URL.revokeObjectURL(splitPanel.url);
      finalDocumentObjectUrlsRef.current.delete(splitPanel.url);
    }
    setAssociationProgress("Association...");
    setSplitPanel({
      kind: "finalDocument",
      title: loadingTitle,
      url: "",
      language: request.language,
      query,
      seed: request.seed ?? query,
      petRole: request.petRole,
      isGenerating: true,
    });
    setSplitPanelAnchor(request.anchorId === undefined ? null : { kind: "npc", id: request.anchorId });
    setIsSplitExpanded(true);
    wikiGenerationInFlightRef.current = true;
    wikiGenerationRequestRef.current = requestKey;
    try {
      await waitForNextPaint();
      if (wikiGenerationRequestRef.current !== requestKey) return;
      const { generateBrowserAssociationZine } = await importAssociationGenerator();
      const result = await generateBrowserAssociationZine(query, request.language, (message) => {
        setAssociationProgress(message);
      }, {
        writingStyle: request.writingStyle,
        repairInstruction: request.repairInstruction,
        repairUsefulParts: request.repairUsefulParts,
        repairUselessParts: request.repairUselessParts,
      });
      if (wikiGenerationRequestRef.current !== requestKey) return;
      const url = URL.createObjectURL(new Blob([result.html], { type: "text/html;charset=utf-8" }));
      finalDocumentObjectUrlsRef.current.add(url);
      setSplitPanel({
        kind: "finalDocument",
        title: result.title,
        url,
        language: request.language,
        query,
        seed: request.seed ?? query,
        petRole: request.petRole,
      });
      setSplitPanelAnchor(request.anchorId === undefined ? null : { kind: "npc", id: request.anchorId });
      setIsSplitExpanded(true);
    } catch (error) {
      if (wikiGenerationRequestRef.current !== requestKey) return;
      console.error("NPC wiki zine generation failed", error);
      const message = error instanceof Error ? error.message : String(error ?? associationErrorCopy(request.language).title);
      const lowRelevance = isLowRelevanceAssociationError(message);
      setWorldNotice(lowRelevance ? "" : associationErrorCopy(request.language).title);
      setSplitPanel({
        kind: "finalDocument",
        title: loadingTitle,
        url: "",
        language: request.language,
        query,
        seed: request.seed ?? query,
        petRole: request.petRole,
        lowRelevance,
        error: message,
      });
      setSplitPanelAnchor(request.anchorId === undefined ? null : { kind: "npc", id: request.anchorId });
      setIsSplitExpanded(true);
    } finally {
      if (wikiGenerationRequestRef.current === requestKey) {
        wikiGenerationInFlightRef.current = false;
        wikiGenerationRequestRef.current = null;
      }
    }
  }

  useEffect(() => {
    const handleZineRepairRequest = (event: MessageEvent) => {
      const data = event.data as { type?: string; payload?: ZineRepairPayload } | null;
      if (!data || data.type !== "pbs:zine-repair-request" || !data.payload) return;
      const panel = splitPanel?.kind === "finalDocument" ? splitPanel : null;
      const report = buildZineRepairReport(data.payload, panel);
      const repairLanguage = supportedLanguages.some((entry) => entry.code === report.language)
        ? report.language as LanguageCode
        : selectedLanguage;
      try {
        const history = JSON.parse(localStorage.getItem("pbs:zine-repair-reports") || "[]") as unknown;
        const next = Array.isArray(history) ? [...history, report].slice(-50) : [report];
        localStorage.setItem("pbs:zine-repair-reports", JSON.stringify(next));
      } catch (error) {
        console.warn("PBS zine repair local history unavailable", error);
      }
      setPetLintGapInbox((current) => {
        const text = report.repairInstruction || report.uselessParts || report.query;
        if (typeof text !== "string" || !text.trim()) return current;
        const next = [
          {
            id: `zine-feedback-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
            text: `${ZINE_REPAIR_COPY[selectedLanguage].feedback}: ${text.trim()}`,
            language: repairLanguage,
            createdAt: new Date().toISOString(),
            source: "zine-feedback" as const,
          },
          ...current,
        ].slice(0, 24);
        writePetLintGapInbox(next);
        return next;
      });
      void fetch("/api/zine-repair-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
      }).then((response) => {
        if (!response.ok) downloadZineRepairReport(report);
      }).catch(() => {
        downloadZineRepairReport(report);
      });
      const query = report.query || panel?.query || panel?.seed || "";
      if (!query) return;
      setWorldNotice(ZINE_REPAIR_COPY[repairLanguage].received);
      void openAssociationZineSplit({
        query: String(query),
        seed: panel?.seed || String(query),
        petRole: panel?.petRole,
        language: repairLanguage,
        repairInstruction: report.repairInstruction as string,
        repairUsefulParts: report.usefulParts as string,
        repairUselessParts: report.uselessParts as string,
      });
    };
    window.addEventListener("message", handleZineRepairRequest);
    return () => window.removeEventListener("message", handleZineRepairRequest);
  }, [selectedLanguage, splitPanel]);

  const handleBootStart = useCallback(() => {
    setHasStarted(true);
    setIsPostBootLoading(true);
    if (postBootLoadingTimerRef.current !== null) {
      window.clearTimeout(postBootLoadingTimerRef.current);
    }
    postBootLoadingTimerRef.current = window.setTimeout(() => {
      setIsPostBootLoading(false);
      postBootLoadingTimerRef.current = null;
    }, 900);
  }, []);

  useEffect(() => {
    return () => {
      if (postBootLoadingTimerRef.current !== null) {
        window.clearTimeout(postBootLoadingTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!selectedPet || !simSnapshot) return;
    const latestPet = simSnapshot.thronglets.find((pet) => pet.id === selectedPet.id);
    if (!latestPet) {
      setSelectedPet(null);
      return;
    }
    if (latestPet !== selectedPet) setSelectedPet(latestPet);
  }, [selectedPet, simSnapshot]);

  useEffect(() => {
    if (!selectedDispatchPet) return;
    const latestPet = activeDispatchPets.find((pet) => pet.id === selectedDispatchPet.id);
    if (latestPet && latestPet !== selectedDispatchPet) setSelectedDispatchPet(latestPet);
  }, [activeDispatchPets, selectedDispatchPet]);

  if (!hasStarted) {
    return <RetroBootScreen onStart={handleBootStart} language={selectedLanguage} onLanguageChange={handleLanguageChange} />;
  }


  if (!layoutReady || isPostBootLoading) {
    return (
      <div className="boot-loading-screen" role="status" aria-live="polite">
        <div className="boot-loading-card pbs-frame F3 pbs-frame-f3">
          <p className="boot-loading-title">Peach Blossom Spring</p>
          <p className="boot-loading-copy">Loading Peach Blossom Spring...</p>
          <span className="boot-loading-dots" aria-hidden="true" />
        </div>
      </div>
    );
  }


  const activeEncounterMessages = encounterPanel
    ? chatMessages.filter((message) => message.encounterId === encounterPanel.encounterId)
    : [];
  const localMultiplayerPlayerId = multiplayerConfig ? getOrCreatePlayerId() : "";
  const isEncounterUiOpen = Boolean(videoEncounter || encounterPanel);
  const localizedPetLintGapInbox = petLintGapInbox.filter((item) => item.language === selectedLanguage);
  const terrainState = simSnapshot ? petTerrainIndicators(simSnapshot, localizedPetLintGapInbox, questionQuality) : null;
  const terrainCopy = petTerrainStateCopy(selectedLanguage);
  const petLintGapCopy = PET_LINT_GAP_COPY[selectedLanguage];
  const questionLintHud = questionLintForQuality(questionQuality, selectedLanguage);

  return (
    <div
      ref={containerRef}
      className={`game-world-layer pbs-interaction-root w-full h-full relative overflow-hidden ${isSplitOpen ? "world-split-active" : ""} ${isSplitExpanded ? "world-split-expanded" : ""}`}
      data-modal-layer={activeDialoguePersona || splitPanel || isEncounterUiOpen ? "open" : "closed"}
      data-encounter-layer={isEncounterUiOpen ? "open" : "closed"}
      data-language={selectedLanguage}
      style={{
        touchAction:
          showMobileControls && appMode === "interactive" && !isSplitOpen
            ? "none"
            : undefined,
      }}
    >
      {playerProfile && (
        <div className="pbs-world-map-layer">
          <OfficeCanvas
            officeState={officeState}
            onClick={handleClick}
            isEditMode={editor.isEditMode}
            editorState={editorState}
            onEditorTileAction={editor.handleEditorTileAction}
            onEditorEraseAction={editor.handleEditorEraseAction}
            onEditorSelectionChange={editor.handleEditorSelectionChange}
            onDeleteSelected={editor.handleDeleteSelected}
            onRotateSelected={editor.handleRotateSelected}
            onDragMove={editor.handleDragMove}
            onMobileMapTap={handleMobileMapTap}
            interactiveFurnitureTypes={CAMPFIRE_FURNITURE_TYPES}
            mobileTapToMove={
              showMobileControls && appMode === "interactive" && !activeDialoguePersona
            }
            editorTick={editor.editorTick}
            zoom={editor.zoom}
            onZoomChange={editor.handleZoomChange}
            panRef={editor.panRef}
          />
        </div>
      )}

      {playerProfile && !(terrainEditorEnabled && editor.isEditMode) && <div className="floating-ui-layer" data-no-mobile-drag="true">
        <div className="global-archive-menu">
          <button
            className="global-archive-trigger"
            type="button"
            aria-label={t(selectedLanguage, "archive.title")}
            aria-expanded={archiveMenuOpen}
            onClick={() => setArchiveMenuOpen((open) => !open)}
          >
            <span className="global-archive-peach pbs-emoji-control" aria-hidden="true">
              🍑
            </span>
          </button>
        </div>
        <div className="global-language-menu">
          <button
            className="global-language-trigger"
            type="button"
            aria-label={t(selectedLanguage, "language.menuLabel")}
            aria-expanded={languageMenuOpen}
            onClick={() => setLanguageMenuOpen((open) => !open)}
          >
            <span className="global-language-globe pbs-emoji-control" aria-hidden="true">
              🌏
            </span>
          </button>
          {languageMenuOpen && (
            <div className="global-language-options" role="menu">
              {supportedLanguages.map((entry) => (
                <button
                  key={entry.code}
                  className={entry.code === selectedLanguage ? "is-active" : ""}
                  type="button"
                  role="menuitem"
                  onClick={() => handleLanguageChange(entry.code)}
                >
                  <span lang={entry.code}>{entry.nativeName}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>}

      <div className="hud-ui-layer" data-no-mobile-drag="true">
        {playerProfile && appMode === "dispatch_observer" && (
          <button
            className="observer-close pbs-frame-action"
            type="button"
            onClick={handleCloseWorld}
            aria-label={t(selectedLanguage, "common.close")}
          >
            X
          </button>
        )}

        {playerProfile &&
          (appMode === "interactive" || appMode === "dispatch_observer") && (
            <div className="map-zoom-controls" aria-label="Map zoom controls">
              <button
                type="button"
                onClick={() =>
                  editor.handleZoomChange(
                    Math.min(ZOOM_MAX, editor.zoom + 0.25),
                  )
                }
                disabled={editor.zoom >= ZOOM_MAX}
                aria-label={t(selectedLanguage, "hud.zoomIn")}
                title={`${t(selectedLanguage, "hud.zoomIn")} (${editor.zoom.toFixed(2)}×)`}
              >
                +
              </button>
              <button
                type="button"
                onClick={() =>
                  editor.handleZoomChange(
                    Math.max(ZOOM_MIN, editor.zoom - 0.25),
                  )
                }
                disabled={editor.zoom <= ZOOM_MIN}
                aria-label={t(selectedLanguage, "hud.zoomOut")}
                title={`${t(selectedLanguage, "hud.zoomOut")} (${editor.zoom.toFixed(2)}×)`}
              >
                −
              </button>
            </div>
          )}
      </div>

      {!isDebugMode ? (
        <>
          {/* Vignette overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "var(--vignette)" }}
          />

          {editor.isEditMode && editor.isDirty && (
            <EditActionBar editor={editor} editorState={editorState} />
          )}

          {terrainEditorEnabled && (
            <BottomToolbar
              isEditMode={editor.isEditMode}
              onOpenClaude={editor.handleOpenClaude}
              onToggleEditMode={() => {
                setIsSettingsOpen(false);
                editor.handleToggleEditMode();
              }}
              isSettingsOpen={isSettingsOpen}
              onToggleSettings={() => setIsSettingsOpen((open) => !open)}
              workspaceFolders={workspaceFolders}
            />
          )}

          {playerProfile &&
            playMode === "expedition" &&
            !activeDialoguePersona && (
              <Suspense
                fallback={
                  <div className="absolute inset-0 z-47 flex items-center justify-center bg-black/35 px-6 py-5 text-text">
                    {t(selectedLanguage, "hud.loadingExpedition")}
                  </div>
                }
              >
                <ExpeditionPanel
                  avatar={playerProfile}
                  personas={personas}
                  isOpen
                  language={selectedLanguage}
                  onClose={() => setPlayMode("camp")}
                />
              </Suspense>
            )}

          {showRotateHint && (
            <div
              className="absolute left-1/2 -translate-x-1/2 z-11 bg-accent-bright text-white text-sm py-3 px-8 rounded-none border-2 border-accent shadow-pixel pointer-events-none whitespace-nowrap"
              style={{ top: editor.isDirty ? 64 : 8 }}
            >
              {t(selectedLanguage, "home.rotateHint")}
            </div>
          )}

          {editor.isEditMode &&
            (() => {
              const selUid = editorState.selectedFurnitureUid;
              const selColor = selUid
                ? (officeState
                    .getLayout()
                    .furniture.find((f) => f.uid === selUid)?.color ?? null)
                : null;
              return (
                <EditorToolbar
                  activeTool={editorState.activeTool}
                  selectedTileType={editorState.selectedTileType}
                  selectedFurnitureType={editorState.selectedFurnitureType}
                  selectedFurnitureUid={selUid}
                  selectedFurnitureColor={selColor}
                  floorColor={editorState.floorColor}
                  wallColor={editorState.wallColor}
                  selectedWallSet={editorState.selectedWallSet}
                  onToolChange={editor.handleToolChange}
                  onTileTypeChange={editor.handleTileTypeChange}
                  onFloorColorChange={editor.handleFloorColorChange}
                  onWallColorChange={editor.handleWallColorChange}
                  onWallSetChange={editor.handleWallSetChange}
                  onSelectedFurnitureColorChange={
                    editor.handleSelectedFurnitureColorChange
                  }
                  onFurnitureTypeChange={editor.handleFurnitureTypeChange}
                  showMapSize={terrainEditorEnabled}
                  mapCols={officeState.getLayout().cols}
                  mapRows={officeState.getLayout().rows}
                  onResizeMap={editor.handleResizeLayout}
                  loadedAssets={loadedAssets}
                />
              );
            })()}

          {appMode === "interactive" &&
            !editorEntryEnabled &&
            isNearCentralComputer &&
            computerPromptPosition &&
            !activeDialoguePersona &&
            !isComputerDialogueOpen &&
            !isEncounterUiOpen && (
              <button
                className="absolute z-44 -translate-x-1/2 -translate-y-full text-center pointer-events-auto npc-name-tag mobile-talk-prompt mobile-talk-prompt--compact"
                style={{
                  left: computerPromptPosition.left,
                  top: computerPromptPosition.top,
                  background: "#fff",
                }}
                type="button"
                onClick={() => setIsComputerDialogueOpen(true)}
              >
                <p>{t(selectedLanguage, "hud.pressToTalk")}</p>
              </button>
            )}

          {!editorEntryEnabled && !(terrainEditorEnabled && editor.isEditMode) && !isEncounterUiOpen && !activeDialoguePersona && !isComputerDialogueOpen && !splitPanel && nameTags.map((tag) => {
            const isNearbyTalkTarget =
              appMode === "interactive" &&
              tag.id === nearbyNpcId &&
              tag.id !== abaoAgentId &&
              !tag.isQuestionPet;
            return (
            <div
              key={tag.id}
              className={`npc-name-tag absolute -translate-x-1/2 -translate-y-full px-4 py-2 rounded-full border border-black bg-white text-black text-base ${
                "pointer-events-auto cursor-pointer"
              } ${isNearbyTalkTarget ? "mobile-talk-prompt mobile-talk-prompt--compact" : ""}`}
              style={{
                left: tag.left,
                top: tag.top,
                "--npc-tag-offset-x": `${tag.offsetX ?? 0}px`,
                "--npc-tag-offset-y": `${tag.offsetY ?? 0}px`,
                "--npc-tag-scale": tag.zoomScale,
              } as CSSProperties}
              onClick={
                (event) => {
                  event.stopPropagation();
                  if (tag.isQuestionPet || tag.id === abaoAgentId) {
                    handleClick(tag.id);
                    return;
                  }
                  if (isNearbyTalkTarget) {
                    officeState.selectedAgentId = tag.id;
                    setActiveDialogueId(tag.id);
                    return;
                  }
                  officeState.selectedAgentId = tag.id;
                }
              }
            >
              {isNearbyTalkTarget ? t(selectedLanguage, "hud.pressToTalk") : tag.name}
            </div>
          );})}

          {appMode === "interactive" &&
            !editorEntryEnabled &&
            isNearAbao &&
            abaoBubble &&
            promptPosition &&
            !activeDialoguePersona &&
            !isEncounterUiOpen && (
              <div
                className="abao-speech-bubble"
                style={{
                  left: promptPosition.left,
                  top: promptPosition.top - 78,
                }}
                data-no-mobile-drag="true"
              >
                {abaoBubble.text}
              </div>
            )}

          {appMode === "interactive" &&
            archiveMenuOpen &&
            !activeDialoguePersona &&
            !splitPanel &&
            (
              <section
                className="archive-tree-menu global-menu-options pbs-frame F1 pbs-frame-f1 pixel-panel"
                data-no-mobile-drag="true"
              >
                <p className="archive-tree-kicker pbs-frame-kicker">
                  🍑
                </p>
                <div className="archive-tree-options">
                  <button
                    className="pbs-frame-button"
                    type="button"
                    onClick={() => {
                      setSplitPanel({ kind: "schema" });
                      setSplitPanelAnchor(null);
                      setIsSplitExpanded(false);
                      setArchiveMenuOpen(false);
                    }}
                  >
                    1. schema
                  </button>
                  <button
                    className="pbs-frame-button"
                    type="button"
                    onClick={() => {
                      setSplitPanel({ kind: "sources" });
                      setSplitPanelAnchor(null);
                      setIsSplitExpanded(false);
                      setArchiveMenuOpen(false);
                    }}
                  >
                    2. 來源
                  </button>
                  <button
                    className="pbs-frame-button"
                    type="button"
                    onClick={() => {
                      setTerrainEditorEnabled(true);
                      if (!editor.isEditMode) editor.handleToggleEditMode();
                      setSplitPanel(null);
                      setArchiveMenuOpen(false);
                    }}
                  >
                    3. 編輯地形
                  </button>
                  <button
                    className="pbs-frame-button"
                    type="button"
                    onClick={() => {
                      setSplitPanel({ kind: "archivePdf" });
                      setSplitPanelAnchor(null);
                      setIsSplitExpanded(false);
                      setArchiveMenuOpen(false);
                    }}
                  >
                    4. NGM archive
                  </button>
                  <button
                    className="pbs-frame-button"
                    type="button"
                    onClick={() => {
                      setSplitPanel({ kind: "archiveMap" });
                      setSplitPanelAnchor(null);
                      setIsSplitExpanded(false);
                      setArchiveMenuOpen(false);
                    }}
                  >
                    5. NGM map
                  </button>
                </div>
              </section>
            )}

          {appMode === "interactive" &&
            activeDialoguePersona &&
            activeDialogueCharacter &&
            playerProfile && (
              <Suspense
                fallback={
                  <div className="absolute inset-x-0 bottom-0 z-50 pixel-panel mx-auto mb-6 w-fit px-6 py-5 text-text shadow-pixel">
                    Loading dialogue...
                  </div>
                }
              >
                <RpgDialogue
                  persona={activeDialoguePersona}
                  player={playerProfile}
                  npcAvatar={{
                    palette: activeDialogueCharacter.palette,
                    hueShift: activeDialogueCharacter.hueShift,
                  }}
                  topicLabels={topicLabels}
                  language={selectedLanguage}
                  onClose={() => {
                    setActiveDialogueId(null);
                  }}
                  onOpenMusic={
                    activeDialoguePersona.id === "wukir-suryadi"
                      ? () => {
                          setSplitPanel({ kind: "wukirBandcamp" });
                          setSplitPanelAnchor({
                            kind: "npc",
                            id: activeDialogueCharacter.id,
                          });
                          setIsSplitExpanded(true);
                        }
                      : undefined
                  }
                  onSimEvent={(prompt) => {
                    void evaluateSharedMemoryLint(prompt);
                    const personaText = `${activeDialoguePersona.role} ${activeDialoguePersona.intro} ${Object.values(activeDialoguePersona.responses).join(" ")}`;
                    const resonance = scorePromptResonance(
                      TAMAGOTCHI_AGENT_PROMPT,
                      personaText,
                    );
                    setSimSnapshot((current) =>
                      current
                        ? applyPlayerNpcDialogue(
                            current,
                            `npc-${activeDialoguePersona.id}`,
                            prompt,
                            resonance,
                          )
                        : current,
                    );
                  }}
                  onOpenAssociationZine={(query, writingStyle) => {
                    void openAssociationZineSplit({
                      query,
                      petRole: activeDialoguePersona.name,
                      writingStyle,
                      language: selectedLanguage,
                      anchorId: activeDialogueCharacter.id,
                    });
                  }}
                />
              </Suspense>
            )}

          {appMode === "interactive" && isComputerDialogueOpen && playerProfile && (
            <CentralComputerDialogue
              language={selectedLanguage}
              playerName={playerProfile.name}
              playerPalette={playerProfile.palette}
              onClose={() => {
                setDismissedAutoComputer(true);
                setPendingComputerOpen(false);
                setIsComputerDialogueOpen(false);
              }}
              onOpenAssociationZine={(query) => {
                const trimmed = query?.trim() ?? "";
                if (!trimmed) return;
                void openAssociationZineSplit({
                  query: trimmed,
                  petRole: undefined,
                  language: selectedLanguage,
                });
              }}
              onQuestionSubmitted={(query) => void evaluateSharedMemoryLint(query)}
            />
          )}

          {worldNotice && (
            <div className={`world-resonance-notice ${/思想缺口|THOUGHT GAP/i.test(worldNotice) ? "world-resonance-notice--thought-gap" : ""}`}>{worldNotice}</div>
          )}

          {simSnapshot &&
            PET_WINDOWS_ENABLED &&
            playerProfile &&
            appMode === "interactive" &&
            !editorEntryEnabled &&
            !(terrainEditorEnabled && editor.isEditMode) &&
            !isSplitOpen && (
              <section
                className={`question-status-panel ${isQuestionSimMinimized ? "question-status-panel-compact" : "rpg-message-frame px-7 py-6"} absolute right-12 bottom-12 z-43 w-[min(430px,calc(100vw-24px))] ${
                  isQuestionSimMinimized
                    ? "question-status-panel-minimized"
                    : "max-h-[46vh] overflow-auto"
                }`}
                data-no-mobile-drag="true"
              >
                <div className="question-status-header flex items-center justify-between gap-4 mb-4">
                  <h2 className="text-lg">
                    <span aria-hidden="true">🐣 </span>
                    {t(selectedLanguage, "hud.questionPetSim")}
                  </h2>
                  <div className="question-status-actions">
                    <span className="text-base">
                      {t(selectedLanguage, "hud.tick")} {simSnapshot.tick}
                    </span>
                    <button
                      type="button"
                      aria-label={
                        isQuestionSimMinimized
                          ? "Restore Question Pet SIM"
                          : "Minimize Question Pet SIM"
                      }
                      onClick={() =>
                        setIsQuestionSimMinimized((minimized) => !minimized)
                      }
                    >
                      {isQuestionSimMinimized ? "↗" : "—"}
                    </button>
                  </div>
                </div>
                {isQuestionSimMinimized && (
                  <div className="question-status-compact" aria-label="Question Pet compact status">
                    <div className="question-status-compact-scoregrid" aria-label="Question Pet scores">
                      {questionLintScoreEntries(questionLintHud, selectedLanguage).map(([label, value]) => (
                        <p key={label}>
                          <span>{label}</span>
                          <strong>{value.toFixed(0)}</strong>
                        </p>
                      ))}
                    </div>
                    <article className="question-status-compact-lint" aria-label={petLintGapTitle(selectedLanguage)}>
                      <strong>{petLintGapTitle(selectedLanguage)}</strong>
                      <p>
                        {localizedPetLintGapInbox[0]?.text ?? petLintGapCopy.empty}
                      </p>
                    </article>
                  </div>
                )}
                {!isQuestionSimMinimized && (
                  <>
                    {simSnapshot.thronglets.map((pet) => (
                        <button
                          key={pet.id}
                          className="w-full text-left border-2 border-[var(--palette-blue)] bg-[var(--palette-cream)] px-4 py-4 mb-4 text-[var(--palette-ink)]"
                          type="button"
                          onClick={() => {
                            setIsQuestionSimMinimized(false);
                            setSelectedPet(null);
                          }}
                        >
                          <div className="flex gap-4 items-center">
                            <QuestionPetPreview
                              question={PET_HUD_COPY[selectedLanguage].agent}
                              appearance={pet.appearance}
                              size={4}
                              socialSignals={pet.state}
                              currentAction={pet.currentAction}
                            />
                            <span className="text-base leading-snug">
                              {PET_HUD_COPY[selectedLanguage].agent}
                            </span>
                          </div>
                          <p className="text-sm mt-3">{petActionLabel(selectedLanguage, pet.currentAction)}</p>
                        </button>
                      ))}
                    {terrainState && (
                      <div className="pet-terrain-state" aria-label={terrainCopy.title}>
                        <div className="pet-terrain-state-header">
                          <strong>{terrainCopy.title}</strong>
                          <span>{terrainState.missingNode > 0 || terrainState.contradiction > 0 ? terrainCopy.pending : terrainCopy.clear}</span>
                        </div>
                        <div className="pet-terrain-state-grid">
                          <div className="pet-terrain-state-item" data-state={terrainState.evidence >= 60 ? "active" : "pending"}>
                            <span>{terrainCopy.evidence}</span>
                            <strong>{terrainState.evidence}</strong>
                          </div>
                          <div className="pet-terrain-state-item" data-state={terrainState.relation >= 60 ? "active" : "pending"}>
                            <span>{terrainCopy.relation}</span>
                            <strong>{terrainState.relation}</strong>
                          </div>
                          <div className="pet-terrain-state-item" data-state={terrainState.contradiction > 0 ? "pending" : "clear"}>
                            <span>{terrainCopy.contradiction}</span>
                            <strong>{terrainState.contradiction}</strong>
                          </div>
                          <div className="pet-terrain-state-item" data-state={terrainState.missingNode > 0 ? "pending" : "clear"}>
                            <span>{terrainCopy.missingNode}</span>
                            <strong>{terrainState.missingNode}</strong>
                          </div>
                        </div>
                      </div>
                    )}
                    <article className="traversal-monitor-card" aria-label={traversalMonitorCopy(selectedLanguage).title} data-status={questionQuality.status}>
                      {(() => {
                        const monitor = traversalMonitorCopy(selectedLanguage);
                        return (
                          <>
                            <div className="traversal-monitor-header">
                              <strong>{monitor.title}</strong>
                              <span>{monitor.status}: {questionQuality.status}</span>
                            </div>
                            {questionQuality.question ? (
                              <>
                                <p className="traversal-monitor-question"><span>{monitor.question}</span>{questionQuality.question}</p>
                                <div className="question-lint-grid traversal-monitor-scores">
                                  {questionLintScoreEntries(questionLintHud, selectedLanguage).map(([label, value]) => (
                                    <span key={label}>{label}: {value.toFixed(0)}</span>
                                  ))}
                                </div>
                                <div className="traversal-monitor-meta">
                                  <span>{monitor.pages}: {questionQuality.pageCount}</span>
                                  <span>{monitor.families}: {questionQuality.sourceFamilies.length ? questionQuality.sourceFamilies.join(" / ") : "—"}</span>
                                </div>
                                {questionQuality.topPages.length > 0 && (
                                  <div className="traversal-monitor-route">
                                    <strong>{monitor.topPages}</strong>
                                    {questionQuality.topPages.slice(0, 3).map((page, index) => (
                                      page.url ? (
                                        <a key={`${page.title}-${index.toString()}`} href={page.url} target="_blank" rel="noreferrer">[{index + 1}] {page.title}</a>
                                      ) : (
                                        <span key={`${page.title}-${index.toString()}`}>[{index + 1}] {page.title}</span>
                                      )
                                    ))}
                                  </div>
                                )}
                                <p className="traversal-monitor-caveat"><span>{monitor.caveat}</span>{questionQuality.caveats[0] ?? questionLintHud.next}</p>
                              </>
                            ) : (
                              <p className="traversal-monitor-caveat">{monitor.idle}</p>
                            )}
                          </>
                        );
                      })()}
                    </article>
                    <div className="pet-gap-inbox" aria-label={petLintGapTitle(selectedLanguage)}>
                      <div className="pet-gap-inbox-header">
                        <strong>{petLintGapTitle(selectedLanguage)}</strong>
                        <span>{localizedPetLintGapInbox.length}</span>
                      </div>
                      {localizedPetLintGapInbox.length === 0 ? (
                        <p>{petLintGapCopy.empty}</p>
                      ) : (
                        localizedPetLintGapInbox.slice(0, 4).map((gap) => (
                          <article key={gap.id} className="pet-gap-inbox-item">
                            <p>{gap.text}</p>
                            <time dateTime={gap.createdAt}>{new Date(gap.createdAt).toLocaleString()}</time>
                          </article>
                        ))
                      )}
                    </div>
                    {petDialogueHistory.length > 0 && (
                      <div className="text-sm leading-snug border-t border-[var(--palette-blue)] pt-3 mt-3">
                        <strong>🐣 {PET_HUD_COPY[selectedLanguage].recent}</strong>
                        {petDialogueHistory.slice(-3).reverse().map((entry) => (
                          <p key={entry.id} className="mt-2">{entry.question}: {entry.message}</p>
                        ))}
                      </div>
                    )}
                    {simSnapshot.thoughts.map((thought, index) => (
                      <p
                        key={`${thought}-${index}`}
                        className="text-sm leading-snug border-t border-[var(--palette-blue)] pt-3 mt-3"
                      >
                        {thought}
                      </p>
                    ))}
                    {simSnapshot.events
                      .filter((event) => event.type !== "thronglet_interaction")
                      .slice(0, 3)
                      .map((event) => (
                        <p key={event.id} className="text-sm opacity-80 mt-2">
                          {event.text}
                        </p>
                      ))}
                  </>
                )}
              </section>
            )}

          {!(terrainEditorEnabled && editor.isEditMode) && ((PET_WINDOWS_ENABLED && selectedDispatchPet) || selectedNpcInfo) && (
            <section
              className="question-response-panel info-card pbs-frame F2 pbs-frame-f2 rpg-message-frame absolute right-12 bottom-12 z-51 w-[min(520px,calc(100vw-24px))] px-8 py-7"
              data-no-mobile-drag="true"
            >
              <button
                className="question-response-close pbs-frame-action"
                type="button"
                onClick={() => {
                  setSelectedDispatchPet(null);
                  setSelectedNpcInfo(null);
                }}
              >
                X
              </button>
              {PET_WINDOWS_ENABLED && selectedDispatchPet
                ? (() => {
                    const appearance = generateQuestionPet(
                      selectedDispatchPet.question,
                      selectedDispatchPet.seed,
                    );
                    return (
                      <>
                        <div className="pet-detail-header">
                          <QuestionPetPreview
                            question={selectedDispatchPet.question}
                            appearance={appearance}
                            size={4}
                            socialSignals={selectedDispatchPet.stats}
                          />
                          <div>
                            <p className="type-caption pet-detail-kicker">
                              {selectedDispatchPet.status}
                            </p>
                            <h2 className="type-heading">
                              {t(selectedLanguage, "pet.questionPet")}
                            </h2>
                            <p className="type-label">
                              {t(selectedLanguage, "pet.skill")}:{" "}
                              {selectedDispatchPet.skill || "—"}
                            </p>
                          </div>
                        </div>
                        <div className="pet-detail-section">
                          <p className="type-label pet-detail-kicker">
                            {t(selectedLanguage, "pet.originalQuestionPurpose")}
                          </p>
                          <p className="type-body-large">
                            {selectedDispatchPet.question}
                          </p>
                        </div>
                        <div className="pet-detail-section">
                          <h3 className="type-subheading">
                            {t(selectedLanguage, "pet.responses")}
                          </h3>
                          <textarea
                            className="field-note-input pet-response-input w-full min-h-[92px] px-4 py-3"
                            value={petResponse}
                            onChange={(event) =>
                              setPetResponse(event.target.value)
                            }
                            placeholder={t(
                              selectedLanguage,
                              "pet.shareIdeaPlaceholder",
                            )}
                            maxLength={800}
                          />
                          <button
                            className="mt-3 mode-primary px-5 py-3 type-label"
                            type="button"
                            onClick={() =>
                              handlePostPetBoardResponse(selectedDispatchPet.id)
                            }
                          >
                            {t(selectedLanguage, "pet.postResponse")}
                          </button>
                          <div className="pet-response-list">
                            {petBoardResponses.length === 0 ? (
                              <p className="type-caption pet-response-empty">
                                {t(selectedLanguage, "pet.noResponsesYet")}
                              </p>
                            ) : (
                              petBoardResponses.map((response) => (
                                <article
                                  key={response.id}
                                  className="pet-response-item"
                                >
                                  <div className="type-micro pet-response-meta">
                                    {response.author && (
                                      <span>{response.author}</span>
                                    )}
                                    <time
                                      dateTime={new Date(
                                        response.createdAt,
                                      ).toISOString()}
                                    >
                                      {new Date(
                                        response.createdAt,
                                      ).toLocaleString()}
                                    </time>
                                  </div>
                                  <p className="type-body">{response.text}</p>
                                </article>
                              ))
                            )}
                          </div>
                        </div>
                        <p className="type-caption mt-4 opacity-80">
                          {t(selectedLanguage, "pet.localOnlyNotice")}
                        </p>
                      </>
                    );
                  })()
                : selectedNpcInfo && (
                    <>
                      <p className="text-sm">
                        {t(selectedLanguage, "sim.npcLabel")}
                      </p>
                      <h2 className="text-lg mb-3">{selectedNpcInfo.name}</h2>
                      <p className="text-sm mb-3">{selectedNpcInfo.role}</p>
                      <p className="text-base leading-snug">
                        {selectedNpcInfo.intro}
                      </p>
                      {appMode === "dispatch_observer" && (
                        <p className="text-sm mt-4">
                          {t(selectedLanguage, "sim.observerMode")} ·{" "}
                          {t(selectedLanguage, "pet.localOnlyNotice")}
                        </p>
                      )}
                    </>
                  )}
            </section>
          )}

          {PET_WINDOWS_ENABLED && shouldShowMobileStatsBar && (
            <button
              className="mobile-stats-bar"
              type="button"
              onClick={() => setMobileRulesOpen(true)}
              data-no-mobile-drag="true"
            >
              <span>🐣 {PET_HUD_COPY[selectedLanguage].agent}</span>
              <span>{t(selectedLanguage, "hud.tick")} {simSnapshot?.tick ?? 0}</span>
              {questionLintScoreEntries(questionLintHud, selectedLanguage).map(([label, value]) => (
                <span key={label}>{label} {value.toFixed(0)}</span>
              ))}
              {terrainState && <span>{terrainCopy.evidence} {terrainState.evidence}</span>}
              <span>{petLintGapTitle(selectedLanguage)} {localizedPetLintGapInbox.length}</span>
            </button>
          )}

          {mobileRulesOpen && (
            <section className="mobile-rules-drawer" data-no-mobile-drag="true">
              <button
                className="float-right text-xl pbs-frame-action"
                type="button"
                onClick={() => setMobileRulesOpen(false)}
              >
                X
              </button>
              <h2 className="text-lg mb-3">
                <span aria-hidden="true">🐣 </span>
                {t(selectedLanguage, "hud.questionPetSim")}
              </h2>
              <p className="text-sm mb-3">{PET_HUD_COPY[selectedLanguage].note}</p>
              {simSnapshot && !(terrainEditorEnabled && editor.isEditMode) && (
                <div className="question-status-compact mobile-question-status-compact" aria-label="Question Pet mobile status">
                  <div className="question-status-compact-scoregrid" aria-label="Question Pet scores">
                    {questionLintScoreEntries(questionLintHud, selectedLanguage).map(([label, value]) => (
                      <p key={label}>
                        <span>{label}</span>
                        <strong>{value.toFixed(0)}</strong>
                      </p>
                    ))}
                  </div>
                  {terrainState && (
                    <div className="pet-terrain-state" aria-label={terrainCopy.title}>
                      <div className="pet-terrain-state-header">
                        <strong>{terrainCopy.title}</strong>
                        <span>{terrainState.missingNode > 0 || terrainState.contradiction > 0 ? terrainCopy.pending : terrainCopy.clear}</span>
                      </div>
                      <div className="pet-terrain-state-grid">
                        <div className="pet-terrain-state-item" data-state={terrainState.evidence >= 60 ? "active" : "pending"}>
                          <span>{terrainCopy.evidence}</span>
                          <strong>{terrainState.evidence}</strong>
                        </div>
                        <div className="pet-terrain-state-item" data-state={terrainState.relation >= 60 ? "active" : "pending"}>
                          <span>{terrainCopy.relation}</span>
                          <strong>{terrainState.relation}</strong>
                        </div>
                        <div className="pet-terrain-state-item" data-state={terrainState.contradiction > 0 ? "pending" : "clear"}>
                          <span>{terrainCopy.contradiction}</span>
                          <strong>{terrainState.contradiction}</strong>
                        </div>
                        <div className="pet-terrain-state-item" data-state={terrainState.missingNode > 0 ? "pending" : "clear"}>
                          <span>{terrainCopy.missingNode}</span>
                          <strong>{terrainState.missingNode}</strong>
                        </div>
                      </div>
                    </div>
                  )}
                  <article className="question-status-compact-lint" aria-label={petLintGapTitle(selectedLanguage)}>
                    <strong>{petLintGapTitle(selectedLanguage)}</strong>
                    <p>{localizedPetLintGapInbox[0]?.text ?? petLintGapCopy.empty}</p>
                  </article>
                </div>
              )}
            </section>
          )}



        </>
      ) : (
        <DebugView
          agents={agents}
          selectedAgent={selectedAgent}
          agentTools={agentTools}
          agentStatuses={agentStatuses}
          subagentTools={subagentTools}
          onSelectAgent={handleSelectAgent}
        />
      )}

      {splitPanel && (
        <aside
          className={`world-split-panel rpg-message-frame ${isSplitExpanded ? "is-expanded" : ""} ${splitPanel.kind === "finalDocument" ? "world-split-panel--zine" : ""} ${splitPanel.kind === "wukirBandcamp" ? "world-split-panel--wukir" : ""}`}
          data-no-mobile-drag="true"
        >
          {(() => {
            const splitPanelLanguage = splitPanel.kind === "finalDocument" && splitPanel.language ? splitPanel.language : selectedLanguage;
            const retryAssociationZine = splitPanel.kind === "finalDocument" && (splitPanel.query || splitPanel.seed)
              ? () => void openAssociationZineSplit({
                  query: splitPanel.query ?? splitPanel.seed ?? "",
                  seed: splitPanel.seed,
                  petRole: splitPanel.petRole,
                  language: splitPanelLanguage,
                  anchorId: splitPanelAnchor?.kind === "npc" ? splitPanelAnchor.id : undefined,
                })
              : undefined;
            return <>
          <div className="world-split-toolbar">
            <div>
              <p>{splitPanelKicker(splitPanel, splitPanelLanguage)}</p>
              <h2>{splitPanelTitle(splitPanel, splitPanelLanguage)}</h2>
            </div>
            <div className="world-split-actions">
              <button
                className="world-split-expand pbs-frame-action"
                type="button"
                onClick={() => setIsSplitExpanded((expanded) => !expanded)}
                aria-label={isSplitExpanded ? "Minimize zine review" : "Maximize zine review"}
                title={isSplitExpanded ? "Minimize" : "Maximize"}
              >
                {isSplitExpanded ? "↙" : "⤢"}
              </button>
              <button className="world-split-close pbs-frame-action" type="button" onClick={closeSplitPanel}>
                X
              </button>
            </div>
          </div>
          <div className="world-split-content">
            {splitPanel.kind === "dialogue.openWiki" ? (
              <div className="world-wiki-content">
                <p className="world-wiki-role">{splitPanel.persona.role}</p>
                <p className="world-wiki-intro">
                  {splitPanel.persona.intro}
                </p>
              </div>
            ) : splitPanel.kind === "wukirBandcamp" ? (
              <WukirBandcampEmbed />
            ) : splitPanel.kind === "communityLinks" ? (
              <div className="world-wiki-content">
                {COMMUNITY_NEWS_LINKS.map((link) => (
                  <button
                    key={link.url}
                    type="button"
                    onClick={() => {
                      setSplitPanel({
                        kind: "externalLink",
                        title: link.title,
                        url: link.url,
                        description: link.description,
                      });
                      setIsSplitExpanded(false);
                    }}
                  >
                    <strong>{link.title}</strong>
                    <span>{link.description}</span>
                  </button>
                ))}
              </div>
            ) : splitPanel.kind === "externalLink" || splitPanel.kind === "finalDocument" ? (
              <ExternalLinkEmbed link={splitPanel} language={splitPanelLanguage} onRetry={retryAssociationZine} progress={associationProgress} />
            ) : splitPanel.kind === "schema" ? (
              <SchemaControlRoom language={selectedLanguage} />
            ) : splitPanel.kind === "sources" ? (
              <SourcesControlRoom />
            ) : splitPanel.kind === "archivePdf" ? (
              <iframe
                title="NGM PDF embedded ebook"
                src="https://archive.org/embed/ngm_20230328"
                allowFullScreen
                className="world-split-iframe"
              />
            ) : (
              <iframe
                title="NGM community map"
                src={COMMUNITY_MAP_URL}
                className="world-split-iframe"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            )}
          </div>
            </>;
          })()}
        </aside>
      )}

      {/* Hooks first-run tooltip */}
      {playerProfile && !hooksInfoShown && !hooksTooltipDismissed && (
        <Tooltip
          title="Instant Detection Active"
          position="top-right"
          onDismiss={() => {
            setHooksTooltipDismissed(true);
            vscode.postMessage({ type: "setHooksInfoShown" });
          }}
        >
          <span className="text-sm text-text leading-none">
            Wander 桃花源 and talk with nearby personas.{" "}
            <span
              className="text-accent cursor-pointer underline"
              onClick={() => {
                setIsHooksInfoOpen(true);
                setHooksTooltipDismissed(true);
                vscode.postMessage({ type: "setHooksInfoShown" });
              }}
            >
              View more
            </span>
          </span>
        </Tooltip>
      )}

      {/* Hooks info modal */}
      {playerProfile && (
        <Modal
          isOpen={isHooksInfoOpen}
          onClose={() => setIsHooksInfoOpen(false)}
          title="Peach Blossom Spring"
          zIndex={52}
        >
          <div
            className="text-base text-text px-10"
            style={{ lineHeight: 1.4 }}
          >
            <p className="mb-8">
              This world is now a WorkAdventure-style Peach Blossom Spring map:
            </p>
            <ul className="mb-8 pl-18 list-disc m-0">
              <li className="text-sm mb-2">
                Wander through a tiny LCD river, peach grove, archive tree, and
                story circle
              </li>
              <li className="text-sm mb-2">
                Approach a persona and press Space to talk
              </li>
              <li className="text-sm mb-2">
                Visit the archive tree for the full index and portal links
              </li>
            </ul>
            <p className="mb-12 text-text-muted">
              Pixel Agents remains visual inspiration for lively characters,
              while the world direction is now Peach Blossom Spring / 桃花源.
            </p>
            <div className="text-center">
              <button
                onClick={() => setIsHooksInfoOpen(false)}
                className="py-4 px-20 text-lg bg-accent text-white border-2 border-accent rounded-none cursor-pointer shadow-pixel"
              >
                Got it
              </button>
            </div>
            <p className="mt-8 text-xs text-text-muted text-center">
              To disable, go to Settings {">"} Instant Detection
            </p>
          </div>
        </Modal>
      )}

      {playerProfile && multiplayerConfig && (
        <div className="multiplayer-status-pill" data-status={multiplayerStatus}>
          MP {multiplayerStatus} · {multiplayerConfig.room}
        </div>
      )}

      {playerProfile && multiplayerConfig && encounterPanel && (
        <div className="pbs-encounter-panel" role="dialog" aria-modal="false" aria-labelledby="pbs-encounter-title">
          <div className="pbs-encounter-panel-header">
            <div>
              <p className="pbs-encounter-kicker">Multiplayer</p>
              <h2 id="pbs-encounter-title">{encounterPanel.partner.displayName}</h2>
            </div>
            <button
              type="button"
              className="pbs-encounter-close pbs-frame-action"
              aria-label="Close encounter panel"
              onClick={() => {
                setDismissedVideoEncounterId(encounterPanel.partner.playerId);
                setEncounterPanel(null);
              }}
            >
              X
            </button>
          </div>
          <div className="pbs-chat-panel">
            <div className="pbs-chat-log" ref={chatLogRef} aria-live="polite">
              {activeEncounterMessages.length === 0 ? (
                <p className="pbs-chat-empty">還沒有訊息。</p>
              ) : (
                activeEncounterMessages.map((message) => {
                  const isLocal = message.senderId === localMultiplayerPlayerId;
                  return (
                    <div
                      key={message.id}
                      className={`pbs-chat-message ${isLocal ? "is-local" : "is-remote"}`}
                      aria-label={isLocal ? "你的訊息" : `${message.senderName} 的訊息`}
                    >
                      <span>{message.text}</span>
                    </div>
                  );
                })
              )}
            </div>
            <form
              className="pbs-chat-form"
              onSubmit={(event) => {
                event.preventDefault();
                sendChatMessage();
              }}
            >
              <input
                type="text"
                value={chatDraft}
                onChange={(event) => setChatDraft(event.target.value)}
                maxLength={500}
                placeholder="輸入訊息..."
              />
              <button type="submit">送出</button>
            </form>
          </div>
        </div>
      )}

      {playerProfile && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          isDebugMode={isDebugMode}
          onToggleDebugMode={handleToggleDebugMode}
          alwaysShowOverlay={alwaysShowOverlay}
          onToggleAlwaysShowOverlay={handleToggleAlwaysShowOverlay}
          externalAssetDirectories={externalAssetDirectories}
          watchAllSessions={watchAllSessions}
          onToggleWatchAllSessions={() => {
            const newVal = !watchAllSessions;
            setWatchAllSessions(newVal);
            vscode.postMessage({
              type: "setWatchAllSessions",
              enabled: newVal,
            });
          }}
          hooksEnabled={hooksEnabled}
          onToggleHooksEnabled={() => {
            const newVal = !hooksEnabled;
            setHooksEnabled(newVal);
            vscode.postMessage({ type: "setHooksEnabled", enabled: newVal });
          }}
          editorMode={terrainEditorEnabled}
        />
      )}

      {showMigrationNotice && (
        <MigrationNotice onDismiss={() => setMigrationNoticeDismissed(true)} />
      )}

      {!playerProfile && (
        <PlayerSetup
          language={selectedLanguage}
          defaultProfile={playerDefaults}
          onStart={handlePlayerStart}
          archiveSummary={archiveSummary}
          recentPets={dispatchedPets}
          onClearArchive={handleClearArchive}
        />
      )}
    </div>
  );
}

export default App;
