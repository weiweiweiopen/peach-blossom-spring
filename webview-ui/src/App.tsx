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
import { DebugView } from "./components/DebugView.js";
import { askDeepSeekPbsComputer } from "./deepseekClient.js";
import { generateBrowserAssociationZine } from "./daydream/browserAssociationGenerator.js";
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
import { type LocalChatReply,localPetChat } from "./localChatbot.js";
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
import { EditorState } from "./office/editor/editorState.js";
import { EditorToolbar } from "./office/editor/EditorToolbar.js";
import { OfficeState } from "./office/engine/officeState.js";
import { isRotatable } from "./office/layout/furnitureCatalog.js";
import { isWalkable } from "./office/layout/tileMap.js";
import { getCharacterSprites } from "./office/sprites/index.js";
import { Direction, EditTool, type SpriteData, TILE_SIZE } from "./office/types.js";
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
  appendPetDialogueHistory,
  readPetDialogueHistory,
  type PetDialogueHistoryEntry,
} from "./simulation/storage.js";
import type { SimSnapshot, Thronglet } from "./simulation/types.js";
import { vscode } from "./vscodeApi.js";
import { searchWikiPages, type WikiSearchResult } from "./wikiSearch.js";
import { getWikiLinksForInterviewee } from "./wikiLinks.js";
import {
  createNextTinyRoomLayout,
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
const CONVERSATION_CLOSE_DISTANCE_TILES = 4;
const CENTRAL_COMPUTER_TILE = {
  col: NEXT_ROOM_MAP_PADDING + Math.floor(NEXT_ROOM_GRID_SIZE / 2),
  row: NEXT_ROOM_MAP_PADDING + Math.floor(NEXT_ROOM_GRID_SIZE / 2),
};
const MULTIPLAYER_PROXIMITY_DISTANCE_TILES = 3;
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
const TAMAGOTCHI_AGENT_PROMPT = "PBS Tamagotchi agent";
const COMMUNITY_QUERY_PROMPTS: Record<LanguageCode, string[]> = {
  "zh-TW": [
    "非營利組織如何維持長期運作？",
    "為什麼黑客營常出現合成器？",
    "社群裡有哪些替代教育實驗？",
    "開源社群如何處理照護勞動？",
    "藝術科技社群怎麼面對經費壓力？",
    "DIY 工作坊如何變成公共知識？",
    "社群廚房和技術實驗有什麼關係？",
    "獨立研究者如何互相支持？",
    "黑客空間如何保存失敗經驗？",
    "聲音作品如何連到社群組織？",
    "開放科學如何避免變成宣傳？",
    "營隊如何建立臨時共同體？",
    "最近 wiki 裡有哪些新的 news 或更新？",
  ],
  en: [
    "How do non-profit communities survive long term?",
    "Why do synthesizers appear in hacker camps?",
    "What alternative education experiments appear here?",
    "How do open communities handle care work?",
    "How do art-tech communities handle funding pressure?",
    "How does a DIY workshop become public knowledge?",
    "How are community kitchens related to technical experiments?",
    "How do independent researchers support one another?",
    "How do hackerspaces preserve failed experiments?",
    "How can sound work connect to community organizing?",
    "How can open science avoid becoming publicity?",
    "How do camps create temporary commons?",
    "What new news or updates appear in the wiki?",
  ],
  id: [
    "Bagaimana komunitas nirlaba bertahan dalam jangka panjang?",
    "Mengapa synthesizer sering muncul di hacker camp?",
    "Eksperimen pendidikan alternatif apa yang muncul di sini?",
    "Bagaimana komunitas open source menangani kerja perawatan?",
    "Bagaimana komunitas seni-teknologi menghadapi tekanan dana?",
    "Bagaimana lokakarya DIY menjadi pengetahuan publik?",
    "Apa hubungan dapur komunitas dan eksperimen teknis?",
    "Bagaimana peneliti independen saling mendukung?",
    "Bagaimana hackerspace menyimpan pengalaman gagal?",
    "Bagaimana karya suara terhubung dengan pengorganisasian komunitas?",
    "Bagaimana open science menghindari menjadi promosi?",
    "Bagaimana camp membangun commons sementara?",
    "News atau pembaruan baru apa yang muncul di wiki?",
  ],
  de: [
    "Wie bleiben Non-Profit-Communities langfristig tragfähig?",
    "Warum tauchen Synthesizer so oft in Hacker-Camps auf?",
    "Welche alternativen Bildungsversuche gibt es hier?",
    "Wie gehen offene Communities mit Sorgearbeit um?",
    "Wie reagieren Kunst-Technik-Communities auf Finanzierungsdruck?",
    "Wie wird ein DIY-Workshop zu öffentlichem Wissen?",
    "Was verbindet Community-Küchen mit technischen Experimenten?",
    "Wie unterstützen sich unabhängige Forschende gegenseitig?",
    "Wie bewahren Hackerspaces gescheiterte Experimente auf?",
    "Wie verbinden sich Klangarbeiten mit Community-Organisation?",
    "Wie vermeidet Open Science, reine Werbung zu werden?",
    "Wie erzeugen Camps temporäre Commons?",
    "Welche neuen News oder Updates erscheinen im Wiki?",
  ],
  ja: [
    "非営利コミュニティはどう長く続くの？",
    "なぜハッカーキャンプにシンセサイザーがよく出てくるの？",
    "ここにはどんな代替教育の実験がある？",
    "オープンなコミュニティはケア労働をどう扱う？",
    "アートと技術のコミュニティは資金圧力にどう向き合う？",
    "DIY ワークショップはどう公共知になる？",
    "コミュニティキッチンと技術実験はどう関係する？",
    "独立研究者はどう支え合う？",
    "ハッカースペースは失敗経験をどう保存する？",
    "音の作品はコミュニティ組織とどうつながる？",
    "オープンサイエンスはどう宣伝化を避ける？",
    "キャンプはどう一時的なコモンズを作る？",
    "wiki にはどんな新しい news や更新がある？",
  ],
  th: [
    "ชุมชนไม่แสวงกำไรอยู่ต่อระยะยาวได้อย่างไร?",
    "ทำไมซินธิไซเซอร์จึงพบได้บ่อยในแฮกเกอร์แคมป์?",
    "มีการทดลองการศึกษาทางเลือกแบบใดที่นี่?",
    "ชุมชนโอเพนซอร์สดูแลงาน care work อย่างไร?",
    "ชุมชนศิลปะ-เทคโนโลยีรับมือแรงกดดันเรื่องทุนอย่างไร?",
    "เวิร์กช็อป DIY กลายเป็นความรู้สาธารณะได้อย่างไร?",
    "ครัวชุมชนเกี่ยวข้องกับการทดลองทางเทคนิคอย่างไร?",
    "นักวิจัยอิสระสนับสนุนกันอย่างไร?",
    "แฮกเกอร์สเปซเก็บประสบการณ์ล้มเหลวอย่างไร?",
    "งานเสียงเชื่อมกับการจัดตั้งชุมชนอย่างไร?",
    "open science จะไม่กลายเป็นประชาสัมพันธ์ได้อย่างไร?",
    "แคมป์สร้าง commons ชั่วคราวได้อย่างไร?",
    "มี news หรืออัปเดตใหม่อะไรใน wiki?",
  ],
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
    }
  | { kind: "archivePdf" }
  | { kind: "archiveMap" }
  | { kind: "schema" };

type EncounterPanel = {
  partner: MultiplayerPresence;
  encounterId: string;
};
const ExpeditionPanel = lazy(() =>
  import("./components/ExpeditionPanel.js").then((module) => ({
    default: module.ExpeditionPanel,
  })),
);
function trimToFiftyChars(text: string): string {
  return text.length > 50 ? `${text.slice(0, 50)}...` : text;
}

function splitPanelTitle(panel: SplitPanel, language: LanguageCode): string {
  if (panel.kind === "dialogue.openWiki") return panel.persona.name;
  if (panel.kind === "wukirBandcamp") return "Institutionalized Ritual";
  if (panel.kind === "communityLinks") return t(language, "archive.newsTitle");
  if (panel.kind === "externalLink") return panel.title;
  if (panel.kind === "finalDocument") return panel.title;
  if (panel.kind === "archivePdf") return t(language, "archive.pdfTitle");
  if (panel.kind === "archiveMap") return t(language, "archive.mapTitle");
  return "LLM Wiki control room";
}

function splitPanelKicker(panel: SplitPanel, language: LanguageCode): string {
  if (panel.kind === "dialogue.openWiki") return "WORLD WIKI";
  if (panel.kind === "wukirBandcamp") return "Wukir Suryadi · Bandcamp";
  if (panel.kind === "communityLinks") return t(language, "archive.communityPortals");
  if (panel.kind === "externalLink") {
    return t(language, "archive.embeddedLink");
  }
  if (panel.kind === "finalDocument") return "WORLD WIKI: association page";
  if (panel.kind === "schema") return "🍑";
  return "🍑";
}

function SchemaControlRoom({ language }: { language: LanguageCode }) {
  void language;
  return (
    <div className="world-wiki-content world-about-content schema-control-room">
      <section className="schema-intro-card">
        <h3>Peach Blossom Spring / LLM Wiki</h3>
        <p>
          小型文化組織與獨立藝術網絡通常依賴少數關鍵人物、短期補助、臨時工作坊、非正式通訊與個人記憶運作。它們的知識散落於訪談、wiki、Google Drive、補助文件、展覽紀錄、工作坊材料、社群媒體、Medium 文章與口述經驗之中；一旦人物離開、平台失效、合作斷裂或資金中止，脈絡就容易消失。
        </p>
        <p>
          <em>Non-Governmental Matters</em> 已為電子織品網絡、Hackteria、跨國科技藝術營隊、獨立教育系統、資金模式與文化差異建立訪談和地圖。這個遊戲把第一層田野材料轉化為 AI 時代的知識保存問題：文化組織缺少的不只是資料庫，而是一種能讓自身知識被保存、分類、召回、比較、修正與再使用的認知系統。
        </p>
        <p>
          玩家以 Why? 進入桃花源，向 NPC 詢問訪談記憶、向中央電腦提出 wiki 問題，並把檢索路徑生成為可閱讀、可列印、可追溯的小誌。名字借用「桃花源」作為失而復得的路徑隱喻：遊戲不是保存單一過去，而是讓散落材料在一次次提問、回憶、檢索與再生成中重新出現。
        </p>
      </section>

      <section className="schema-intro-card schema-contribution-card">
        <h3>預期貢獻</h3>
        <ul>
          <li>把 AI 理解為文化仿真機：不是保存某個單一過去，而是把大量過去的語言、圖像、風格、資料與勞動痕跡壓縮成可被呼叫的幽靈機器或迴圈。</li>
          <li>提出 LLM Wiki 作為小型文化組織記憶基礎設施的設計方法。</li>
          <li>把文化幽靈與媒介考古從理論問題轉化為 AI 知識保存的實作問題。</li>
          <li>提出一套統合語義層、大型語言模型、維基的人機協作文化記憶治理框架。</li>
        </ul>
      </section>

      <section className="schema-control-prototype">
        <h3>In-game Retrieval Controls</h3>
        <p>這裡是介面原型：玩家不需要重新部署 GitHub，就能在遊戲內調整會影響檢索和小誌生成的參數。</p>
        <div className="schema-control-grid">
          <label>
            Query rewrite prompt
            <textarea defaultValue="把玩家問題改寫成 PBS LLM Wiki 可檢索的研究問題；保留原始意圖，補上可查證的文化網絡、材料、方法與組織脈絡。" />
          </label>
          <label>
            Editorial writer prompt
            <textarea defaultValue="生成一篇像小誌的公共短文：先提出問題，再連接田野材料、方法、限制與下一步；保留完整檢索 trace 給讀者查核。" />
          </label>
          <label>
            Schema focus
            <textarea defaultValue="semantic layers, entity layers, source families, wikilink traversal, seeds, sourceCards, depth metrics, public validation" />
          </label>
          <label>
            Source families
            <select defaultValue="all">
              <option value="all">Hackteria + SGMK + Fabricademy + KOBAKANT</option>
              <option value="hackteria">Hackteria first</option>
              <option value="textile">Electronic textiles first</option>
              <option value="wiki">PBS Wiki entry notes first</option>
            </select>
          </label>
          <label>
            Retrieval depth
            <input type="range" min="1" max="4" defaultValue="2" />
          </label>
          <label>
            Evidence threshold
            <input type="range" min="1" max="10" defaultValue="6" />
          </label>
          <label>
            Language / tone
            <select defaultValue="zine">
              <option value="zine">public zine voice</option>
              <option value="research">research memo</option>
              <option value="workshop">workshop handout</option>
            </select>
          </label>
          <label>
            Output includes
            <textarea defaultValue="article, reading links, full sourceCards, seeds, traversal path, prompt summary, validation report" />
          </label>
        </div>
        <div className="schema-control-actions">
          <button type="button">Preview retrieval packet</button>
          <button type="button">Generate test zine</button>
          <button type="button">Save local preset</button>
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
        <p className="boot-loading-title">Peach Blossom Spring</p>
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
  if (/http_error\s*(\d+)|DeepSeek proxy failed\s*(\d+)/i.test(message)) {
    const match = message.match(/http_error\s*(\d+)|DeepSeek proxy failed\s*(\d+)/i);
    return `http_error ${match?.[1] ?? match?.[2] ?? "unknown"}`;
  }
  if (/AbortError|timed out|timeout/i.test(message)) return "AbortError / timeout";
  if (/JSON parse failed|parseable JSON|JSON\.parse/i.test(message)) return "JSON parse failed";
  if (/public safety gate|public artifact|forbidden|unsupported|validation/i.test(message)) return "public_validation_error";
  return "unknown_error";
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

function computerSprite(frame: number): SpriteData {
  const palette = ["#fffaf0", "#fcf46b", "#7dd7bf", "#e8b7ff", "#4fcbd1", "#111"];
  return Array.from({ length: 32 }, (_row, y) =>
    Array.from({ length: 16 }, (_col, x) => {
      const signal = Math.imul(x + 17, 37) ^ Math.imul(y + 11, 53) ^ Math.imul(frame + 3, 97);
      const wave = (x * 3 + y * 5 + frame * 7) % palette.length;
      return palette[Math.abs(signal + wave) % palette.length];
    }),
  );
}

function ComputerDialogueAvatar() {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setFrame((current) => current + 1), 90);
    return () => window.clearInterval(id);
  }, []);
  return <DialoguePixelAvatar sprite={computerSprite(frame)} label="PBS Computer" />;
}

const PBS_COMPUTER_COPY: Record<LanguageCode, { intro: string; fail: string; needQuestion: string; sourceTitle: string; noLinks: string; suggestions: string; placeholder: string; suggest: string; zine: string; thinking: string }> = {
  "zh-TW": {
    intro: "我是 PBS LLM wiki 搜尋端。問一個社群、方法、材料或組織問題，我會用桃花源共享記憶回答，並在下方列出可點開的真實頁面。",
    fail: "LLM 回答暫時失敗；先列出本地 wiki 搜尋結果，你可以直接點開查閱。",
    needQuestion: "請先輸入一個想探索的桃花源社群問題。",
    sourceTitle: "Wiki 搜尋結果 / 真實連結",
    noLinks: "這次沒有找到可直接連結的 wiki 頁。",
    suggestions: "問我一個關於你想探索桃花源社群哪一部分的問題：",
    placeholder: "問：你想探索桃花源社群的哪一部分？",
    suggest: "建議一個問題",
    zine: "維基小書",
    thinking: "PBS Computer 正在思考...",
  },
  en: {
    intro: "I am the PBS LLM wiki search dock. Ask about a community, method, material, or organization question; I answer from shared memory and list real pages below.",
    fail: "The LLM answer failed for now; here are the local wiki search results you can open directly.",
    needQuestion: "Enter a Peach Blossom Spring community question first.",
    sourceTitle: "Wiki search results / real links",
    noLinks: "No directly linkable wiki pages were found this time.",
    suggestions: "Pick a question about the part of Peach Blossom Spring you want to explore:",
    placeholder: "Ask: which part of the Peach Blossom Spring community do you want to explore?",
    suggest: "Suggest a question",
    zine: "Wiki zine",
    thinking: "PBS Computer is thinking...",
  },
  id: {
    intro: "Saya terminal pencarian wiki PBS LLM. Tanyakan komunitas, metode, material, atau organisasi; saya menjawab dari memori bersama dan menampilkan halaman nyata di bawah.",
    fail: "Jawaban LLM sementara gagal; ini hasil pencarian wiki lokal yang bisa dibuka langsung.",
    needQuestion: "Masukkan dulu pertanyaan komunitas Peach Blossom Spring.",
    sourceTitle: "Hasil pencarian wiki / tautan nyata",
    noLinks: "Tidak ada halaman wiki yang bisa ditautkan langsung kali ini.",
    suggestions: "Pilih pertanyaan tentang bagian Peach Blossom Spring yang ingin kamu jelajahi:",
    placeholder: "Tanya: bagian mana dari komunitas Peach Blossom Spring yang ingin kamu jelajahi?",
    suggest: "Sarankan pertanyaan",
    zine: "Zine wiki",
    thinking: "PBS Computer sedang berpikir...",
  },
  de: {
    intro: "Ich bin das PBS LLM Wiki-Suchdock. Frag nach Community, Methode, Material oder Organisation; ich antworte aus dem geteilten Gedächtnis und liste echte Seiten unten auf.",
    fail: "Die LLM-Antwort ist gerade fehlgeschlagen; hier sind lokale Wiki-Suchergebnisse zum Öffnen.",
    needQuestion: "Gib zuerst eine Frage zur Peach-Blossom-Spring-Community ein.",
    sourceTitle: "Wiki-Suchergebnisse / echte Links",
    noLinks: "Diesmal wurden keine direkt verlinkbaren Wiki-Seiten gefunden.",
    suggestions: "Wähle eine Frage zu dem Teil von Peach Blossom Spring, den du erkunden willst:",
    placeholder: "Frage: welchen Teil der Peach-Blossom-Spring-Community willst du erkunden?",
    suggest: "Frage vorschlagen",
    zine: "Wiki-Zine",
    thinking: "PBS Computer denkt nach...",
  },
  ja: {
    intro: "私は PBS LLM wiki の検索端末です。コミュニティ、方法、素材、組織について質問してください。共有記憶から答え、下に実在するページを並べます。",
    fail: "LLM の回答に失敗しました。まず開けるローカル wiki 検索結果を表示します。",
    needQuestion: "先に Peach Blossom Spring のコミュニティ質問を入力してください。",
    sourceTitle: "Wiki 検索結果 / 実在リンク",
    noLinks: "今回は直接開ける wiki ページが見つかりませんでした。",
    suggestions: "Peach Blossom Spring のどの部分を探索するか質問を選んでください：",
    placeholder: "質問：Peach Blossom Spring のどの部分を探索しますか？",
    suggest: "質問を提案",
    zine: "Wiki 小誌",
    thinking: "PBS Computer が考えています...",
  },
  th: {
    intro: "ฉันคือแท่นค้นหา PBS LLM wiki ถามเรื่องชุมชน วิธี วัสดุ หรือองค์กรได้ ฉันจะตอบจากความทรงจำร่วมและแสดงหน้าจริงด้านล่าง",
    fail: "คำตอบจาก LLM ล้มเหลวชั่วคราว ต่อไปนี้คือผลค้นหา wiki ในเครื่องที่เปิดดูได้ทันที",
    needQuestion: "กรุณาใส่คำถามเกี่ยวกับชุมชน Peach Blossom Spring ก่อน",
    sourceTitle: "ผลค้นหา wiki / ลิงก์จริง",
    noLinks: "ครั้งนี้ไม่พบหน้า wiki ที่เปิดลิงก์ได้โดยตรง",
    suggestions: "เลือกคำถามเกี่ยวกับส่วนของ Peach Blossom Spring ที่อยากสำรวจ:",
    placeholder: "ถาม: อยากสำรวจส่วนไหนของชุมชน Peach Blossom Spring?",
    suggest: "เสนอคำถาม",
    zine: "ซีน wiki",
    thinking: "PBS Computer กำลังคิด...",
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

const PET_LOCAL_CHAT_COPY: Record<LanguageCode, { title: string; placeholder: string; ask: string; noEvidence: string }> = {
  "zh-TW": { title: "本地電子雞 RAG 對話", placeholder: "用牠的記憶、材料與 A2A 證據問這隻電子雞", ask: "詢問", noEvidence: "尚未取得證據。" },
  en: { title: "Local pet RAG chat", placeholder: "Ask this pet using its memory, materials, and A2A evidence", ask: "Ask", noEvidence: "No evidence retrieved yet." },
  id: { title: "Obrolan RAG pet lokal", placeholder: "Tanya pet ini memakai memori, material, dan bukti A2A", ask: "Tanya", noEvidence: "Belum ada bukti yang diambil." },
  de: { title: "Lokaler Pet-RAG-Chat", placeholder: "Frag dieses Pet mit Gedächtnis, Material und A2A-Belegen", ask: "Fragen", noEvidence: "Noch keine Belege abgerufen." },
  ja: { title: "ローカル電子ペット RAG 会話", placeholder: "記憶・素材・A2A 証拠を使ってこのペットに聞く", ask: "聞く", noEvidence: "まだ証拠は取得されていません。" },
  th: { title: "แชต RAG สัตว์เลี้ยงในเครื่อง", placeholder: "ถามสัตว์เลี้ยงนี้ด้วยความจำ วัสดุ และหลักฐาน A2A", ask: "ถาม", noEvidence: "ยังไม่มีหลักฐานที่ดึงมา" },
};

function petActionLabel(language: LanguageCode, action: string): string {
  return PET_HUD_COPY[language].action[action] ?? action;
}

function petScoreLabel(language: LanguageCode, key: string): string {
  return PET_HUD_COPY[language].score[key] ?? key;
}

function CentralComputerDialogue({
  language,
  playerName,
  playerPalette,
  onClose,
  onOpenAssociationZine,
}: {
  language: LanguageCode;
  playerName: string;
  playerPalette: number;
  onClose: () => void;
  onOpenAssociationZine: (query?: string) => void;
}) {
  type ComputerMessage = { speaker: string; text: string; links?: WikiSearchResult[] };
  const [draft, setDraft] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState("");
  const [showSuggestedQuestions, setShowSuggestedQuestions] = useState(false);
  const copy = PBS_COMPUTER_COPY[language];
  const suggestedQuestions = useMemo(() => {
    const shuffled = [...COMMUNITY_QUERY_PROMPTS[language]].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 2);
  }, [language]);
  const [messages, setMessages] = useState<ComputerMessage[]>(() => [
    {
      speaker: "PBS Computer",
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

  function sharedMemoryContextFor(results: WikiSearchResult[]): string {
    return results
      .map((item, index) => `${index + 1}. ${item.title} [${item.sourceFamily}] ${item.description ?? ""} ${item.url ?? ""}`.trim())
      .join("\n");
  }

  async function askComputer(prompt: string): Promise<void> {
    const trimmed = prompt.trim();
    if (!trimmed || isThinking) return;
    const wikiResults = searchWikiPages(trimmed, undefined, 6);
    setDraft("");
    setError("");
    setIsThinking(true);
    setMessages((current) => [...current, { speaker: "You", text: trimmed }]);
    try {
      const reply = await askDeepSeekPbsComputer({
        question: trimmed,
        preferredLanguage: language,
        sharedMemoryContext: sharedMemoryContextFor(wikiResults),
      });
      setMessages((current) => [...current, { speaker: "PBS Computer", text: reply, links: wikiResults }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "PBS Computer failed to answer.");
      setMessages((current) => [...current, {
        speaker: "PBS Computer",
        text: copy.fail,
        links: wikiResults,
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
    onOpenAssociationZine(query);
  }

  return (
    <div className="rpg-dialogue-overlay absolute inset-0 z-50 flex items-center justify-center bg-black/35 px-8 py-8 pointer-events-none" data-no-mobile-drag="true">
      <section className="rpg-dialogue-panel pbs-frame F2 pbs-frame-f2 pixel-panel pointer-events-auto w-[min(1040px,84vw)] h-[72vh] min-w-[min(720px,calc(100vw-24px))] px-14 py-12 text-text shadow-pixel flex flex-col" data-language={language}>
        <div className="rpg-dialogue-header flex items-start justify-between gap-8 mb-5">
          <div className="rpg-dialogue-title flex items-start gap-6">
            <div className="rpg-dialogue-avatars flex gap-4">
              <PlayerDialogueAvatar palette={playerPalette} label={playerName} />
              <ComputerDialogueAvatar />
            </div>
            <div>
              <p className="rpg-dialogue-kicker pbs-frame-kicker text-lg uppercase tracking-wide text-accent-bright m-0" data-ui-part="caption">LLM WIKI DOCK</p>
              <h2 className="rpg-dialogue-name pbs-frame-title text-2xl leading-none mt-2" data-ui-part="title">PBS Computer</h2>
              <p className="rpg-dialogue-role pbs-frame-subtitle text-xl text-text-muted mt-2" data-ui-part="subtitle">Association / 聯想 docking terminal</p>
            </div>
          </div>
          <button className="rpg-dialogue-x pbs-frame-action" data-ui-control="window-action" type="button" onClick={onClose}>X</button>
        </div>
        <div className="rpg-dialogue-main flex-1 min-h-0 flex gap-6 mb-6">
          <div className="rpg-dialogue-log pbs-frame-body rpg-message-scroll flex-1 overflow-auto bg-bg/70 border border-border px-10 py-9 text-xl" data-ui-part="body">
            {messages.map((message, index) => (
              <div key={`${message.speaker}-${index.toString()}`} className="rpg-dialogue-message text-xl leading-relaxed mb-6 last:mb-0" data-ui-part="body">
                <p className="m-0">
                  <span className="text-accent-bright">{message.speaker}: </span>
                  {message.text}
                </p>
                {message.links && (
                  <div className="pbs-computer-source-panel mt-3 border border-border bg-bg/60 px-4 py-3 text-base leading-snug" data-ui-part="caption">
                    <p className="m-0 mb-2 text-text-muted">{copy.sourceTitle}</p>
                    {message.links.length > 0 ? <ol className="pbs-computer-source-list m-0 pl-7">
                    {message.links.map((link, linkIndex) => (
                      <li key={link.url} className="mb-2">
                        <a href={link.url} target="_blank" rel="noreferrer" className="underline decoration-2 underline-offset-4">
                          [{linkIndex + 1}] {link.title}
                        </a>
                        <span className="text-text-muted"> {link.sourceFamily}</span>
                        {link.description ? <p className="m-0 text-text-muted">{link.description}</p> : null}
                        <p className="m-0 break-all text-[0.85em] text-text-muted">{link.url}</p>
                      </li>
                    ))}
                    </ol> : <p className="m-0 text-text-muted">{copy.noLinks}</p>}
                  </div>
                )}
              </div>
            ))}
            {isThinking && <p className="rpg-dialogue-thinking text-base text-text-muted" data-ui-part="body">{copy.thinking}</p>}
          </div>
        </div>
        {showSuggestedQuestions && (
          <div className="rpg-dialogue-actions flex flex-wrap items-start gap-3 mb-5">
            <p className="w-full m-0 text-base text-text-muted" data-ui-part="caption">{copy.suggestions}</p>
            {suggestedQuestions.map((question) => (
              <button key={question} className="rpg-dialogue-chip pbs-game-button" data-ui-control="text-button" data-ui-part="button-label" type="button" onClick={() => { setDraft(question); setShowSuggestedQuestions(false); }}>{question}</button>
            ))}
          </div>
        )}
        <form onSubmit={handleSubmit} className="rpg-dialogue-form flex gap-4" data-ui-footer="zine">
          <input
            type="text"
            className="rpg-dialogue-input flex-1 bg-bg border-2 border-border px-7 py-6 text-xl text-text outline-none focus:border-accent-bright"
            data-ui-part="field"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            autoComplete="off"
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

function attachZineIframeControls(iframe: HTMLIFrameElement): void {
  const doc = iframe.contentDocument;
  if (!doc) return;
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

function findShortNpcStep(
  officeState: OfficeState,
  startCol: number,
  startRow: number,
  occupied: Set<string>,
): { col: number; row: number } | null {
  const candidates: Array<{ col: number; row: number; score: number }> = [];
  for (let dRow = -3; dRow <= 3; dRow++) {
    for (let dCol = -3; dCol <= 3; dCol++) {
      const distance = Math.abs(dCol) + Math.abs(dRow);
      if (distance < 1 || distance > 3) continue;
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
  const [alwaysShowOverlay, setAlwaysShowOverlay] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(() =>
    qaUi.language ?? readStoredLanguage(),
  );
  const [hasStarted, setHasStarted] = useState(qaUi.enabled);
  const [isPostBootLoading, setIsPostBootLoading] = useState(false);
  const postBootLoadingTimerRef = useRef<number | null>(null);
  const [playerDefaults, setPlayerDefaults] = useState<PlayerProfile | null>(
    () => readSavedPlayerDefaults(),
  );
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(
    () => qaUi.enabled ? qaPlayerProfile(qaUi.language ?? readStoredLanguage()) : null,
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
  const [pendingComputerOpen, setPendingComputerOpen] = useState(false);
  const [archiveMenuOpen, setArchiveMenuOpen] = useState(false);
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
  const [simSnapshot, setSimSnapshot] = useState<SimSnapshot | null>(null);
  const [isQuestionSimMinimized, setIsQuestionSimMinimized] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Thronglet | null>(null);
  const [isSelectedPetPanelExpanded, setIsSelectedPetPanelExpanded] = useState(false);
  const [petResponse, setPetResponse] = useState("");
  const [petChatDraft, setPetChatDraft] = useState("");
  const [petChatReply, setPetChatReply] = useState<LocalChatReply | null>(null);
  const [petDialogueHistory, setPetDialogueHistory] = useState<PetDialogueHistoryEntry[]>(() => readPetDialogueHistory());
  const [petBoardResponses, setPetBoardResponses] = useState<
    PetBoardResponse[]
  >([]);
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
    () => setIsDebugMode((prev) => !prev),
    [],
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
            Array.from(officeState.characters.values()).map((ch) => `${ch.tileCol},${ch.tileRow}`),
          );
          const approachTile = npc
            ? findNearestApproachableTile(officeState, npc.tileCol, npc.tileRow, occupied)
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
  const nearbyPersona = nearbyNpcId
    ? (personaByAgentId.get(nearbyNpcId) ?? null)
    : null;
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
        title: "QA zine loading",
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
    const dist = Math.abs(player.tileCol - CENTRAL_COMPUTER_TILE.col) + Math.abs(player.tileRow - CENTRAL_COMPUTER_TILE.row);
    return dist <= 2;
  }, [officeState]);

  const isCentralComputerTile = useCallback((col: number, row: number): boolean => {
    return Math.abs(col - CENTRAL_COMPUTER_TILE.col) + Math.abs(row - CENTRAL_COMPUTER_TILE.row) <= 2;
  }, []);

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
      officeState.rebuildFromLayout(createNextTinyRoomLayout());
      setWorldInitialized(true);
    }
    if (appMode === "interactive") {
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
  }, [appMode, layoutReady, officeState, playerProfile, worldInitialized]);

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

    let nearest: MultiplayerPresence | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const presence of remotePresences.values()) {
      if (presence.playerId === dismissedVideoEncounterId) continue;
      const distance = Math.hypot(player.tileCol - presence.x, player.tileRow - presence.y);
      if (distance <= MULTIPLAYER_PROXIMITY_DISTANCE_TILES && distance < nearestDistance) {
        nearest = presence;
        nearestDistance = distance;
      }
    }
    if (!nearest) setDismissedVideoEncounterId(null);
    setVideoEncounter(nearest);
  }, [
    appMode,
    dismissedVideoEncounterId,
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
    const personaById = new Map(
      personas.map((persona, index) => [persona.id, index + 1]),
    );
    const occupied = new Set<string>();
    for (const placement of nextTinyRoomNpcPlacements) {
      const agentId = personaById.get(placement.personaId);
      if (!agentId) continue;
      if (!officeState.characters.has(agentId)) {
        const persona = personas[agentId - 1];
        officeState.addAgent(agentId, (agentId - 1) % 6, (25 + agentId * 23) % 120, undefined, true, persona?.name ?? `NPC ${agentId}`);
      }
      const ch = officeState.characters.get(agentId);
      if (!ch) continue;
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
      ch.hueShift = (25 + agentId * 23) % 120;
    }
  }, [appMode, layoutReady, officeState]);

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
        .slice(0, 2);
      for (const id of shuffled) {
        const ch = officeState.characters.get(id);
        if (!ch || ch.path.length > 0 || ch.matrixEffect || ch.isPlayer)
          continue;
        if (nearbyNpcIdRef.current === id) continue;
        if (Math.random() > 0.45) continue;
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
    }, 4200);
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
      setWorldNotice(
        selectedLanguage === "zh-TW"
          ? "你的問題電子雞看了你一眼，然後用不合理的速度拋下你。"
          : "Your question pet looks at you once, then abandons you at unreasonable speed.",
      );
      window.setTimeout(() => setWorldNotice(null), 3600);
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
    }, 450);
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

      if (pendingComputerOpen && !computerDialogueOpenRef.current && isPlayerNearCentralComputer()) {
        setPendingComputerOpen(false);
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
    getPlayerDistanceFromCharacter,
    isPlayerNearCentralComputer,
    layoutReady,
    officeState,
    pendingComputerOpen,
    playerProfile,
    qaUi.enabled,
    splitPanelAnchor,
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
      officeState.setPlayerSpeedMultiplier(PLAYER_ID, isSprint ? 3.1 : 1);

      const ch = officeState.characters.get(PLAYER_ID);
      if (!ch) return;
      // Only push another tile when the queue is short, so direction changes feel responsive.
      const targetMaxQueue = isSprint ? 1 : 0;
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
        nextRepeatAt = now + (isSprint ? 24 : 170);
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
          officeState.setPlayerSpeedMultiplier(PLAYER_ID, sprintHeld ? 3.1 : 1);
          if (stepOnce(dir)) {
            setPlayerMoveTick((t) => t + 1);
            nextRepeatAt = performance.now() + (sprintHeld ? 24 : 190);
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
        const approachTile = findNearestApproachableTile(
          officeState,
          CENTRAL_COMPUTER_TILE.col,
          CENTRAL_COMPUTER_TILE.row + 1,
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
    [appMode, isCentralComputerTile, isPlayerNearCentralComputer, officeState, playerProfile],
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
      window.setTimeout(() => setWorldNotice(null), 3600);
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
    const dpr = window.devicePixelRatio || 1;
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
    const rect = containerRef.current.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const layout = officeState.getLayout();
    const mapW = layout.cols * TILE_SIZE * editor.zoom;
    const mapH = layout.rows * TILE_SIZE * editor.zoom;
    const canvasW = rect.width * dpr;
    const canvasH = rect.height * dpr;
    const deviceOffsetX = Math.floor((canvasW - mapW) / 2) + Math.round(editor.panRef.current.x);
    const deviceOffsetY = Math.floor((canvasH - mapH) / 2) + Math.round(editor.panRef.current.y);
    return {
      left: (deviceOffsetX + (CENTRAL_COMPUTER_TILE.col * TILE_SIZE + TILE_SIZE / 2) * editor.zoom) / dpr,
      top: (deviceOffsetY + (CENTRAL_COMPUTER_TILE.row * TILE_SIZE - 18) * editor.zoom) / dpr,
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
      }>;
    const rect = containerRef.current.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const layout = officeState.getLayout();
    const mapW = layout.cols * TILE_SIZE * editor.zoom;
    const mapH = layout.rows * TILE_SIZE * editor.zoom;
    const canvasW = rect.width * dpr;
    const canvasH = rect.height * dpr;
    const deviceOffsetX =
      Math.floor((canvasW - mapW) / 2) + Math.round(editor.panRef.current.x);
    const deviceOffsetY =
      Math.floor((canvasH - mapH) / 2) + Math.round(editor.panRef.current.y);
    return Array.from(officeState.characters.values())
      .filter((ch) => ch.folderName)
      .map((ch) => ({
        id: ch.id,
        name: ch.folderName ?? "",
        left: (deviceOffsetX + ch.x * editor.zoom) / dpr,
        top: (deviceOffsetY + (ch.y - 34) * editor.zoom) / dpr,
        isQuestionPet: Boolean(ch.isQuestionPet),
        zoomScale: Math.max(0.48, Math.min(1, editor.zoom / 5)),
      }));
  })();

  // Show "Press R to rotate" hint when a rotatable item is selected or being placed
  const showRotateHint =
    editor.isEditMode &&
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
    language: LanguageCode;
    anchorId?: number;
  }): Promise<void> {
    const requestKey = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const loadingTitle = "Loading...";
    const query = request.query || request.seed || "";
    setAssociationProgress("解析 wiki query");
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
      const result = await generateBrowserAssociationZine(query, request.language, (message) => {
        setAssociationProgress(message);
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
      setWorldNotice(associationErrorCopy(request.language).title);
      setSplitPanel({
        kind: "finalDocument",
        title: loadingTitle,
        url: "",
        language: request.language,
        query,
        seed: request.seed ?? query,
        petRole: request.petRole,
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
  function closeSelectedPetPanel(): void {
    setSelectedPet(null);
    setIsSelectedPetPanelExpanded(false);
    setPetChatDraft("");
    setPetChatReply(null);
  }

  function handlePetLocalChat(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const message = petChatDraft.trim();
    if (!message || !selectedPet || !simSnapshot) return;
    const reply = localPetChat({
      message,
      pet: selectedPet,
      exchanges: simSnapshot.a2aExchanges,
      tick: simSnapshot.tick,
    });
    setPetChatDraft("");
    setPetChatReply(reply);
    setPetDialogueHistory(appendPetDialogueHistory({
      petId: selectedPet.id,
      questionId: selectedPet.question.id,
      question: selectedPet.question.text,
      message,
      reply: reply.reply,
    }));
    if (!reply.memoryEvent) return;
    setSimSnapshot((current) => {
      if (!current) return current;
      const thronglets = current.thronglets.map((pet) =>
        pet.id === selectedPet.id
          ? { ...pet, memory: [reply.memoryEvent!, ...pet.memory].slice(0, 16) }
          : pet,
      );
      const updatedPet = thronglets.find((pet) => pet.id === selectedPet.id);
      if (updatedPet) setSelectedPet(updatedPet);
      return { ...current, thronglets };
    });
  }

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

      {playerProfile && <div className="floating-ui-layer" data-no-mobile-drag="true">
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
                  loadedAssets={loadedAssets}
                />
              );
            })()}

          {appMode === "interactive" &&
            nearbyPersona &&
            nearbyNpcId !== abaoAgentId &&
            !activeDialoguePersona &&
            !isComputerDialogueOpen &&
            promptPosition && (
              <button
                className="absolute z-44 -translate-x-1/2 -translate-y-full px-5 py-4 text-center pointer-events-auto rounded-[10px] border-2 border-border mobile-talk-prompt"
                style={{
                  left: promptPosition.left,
                  top: promptPosition.top,
                  background: "rgba(24, 24, 40, 0.58)",
                  backdropFilter: "blur(1px)",
                }}
                type="button"
                onClick={() => {
                  if (nearbyNpcId === abaoAgentId) {
                    showAbaoBubble();
                    return;
                  }
                  officeState.selectedAgentId = nearbyNpcId;
                  setActiveDialogueId(nearbyNpcId);
                }}
              >
                <p className="text-lg leading-snug text-text">
                  {nearbyPersona.name}
                </p>
                <p className="text-base text-text mt-1">
                  {trimToFiftyChars(nearbyPersona.intro)}
                </p>
                <p className="text-base text-accent-bright mt-2">
                  {t(selectedLanguage, "hud.pressToTalk")}
                </p>
              </button>
            )}

          {appMode === "interactive" &&
            isNearCentralComputer &&
            computerPromptPosition &&
            !activeDialoguePersona &&
            !isComputerDialogueOpen &&
            !isEncounterUiOpen && (
              <button
                className="absolute z-44 -translate-x-1/2 -translate-y-full px-5 py-4 text-center pointer-events-auto rounded-[10px] border-2 border-border mobile-talk-prompt"
                style={{
                  left: computerPromptPosition.left,
                  top: computerPromptPosition.top,
                  background: "rgba(24, 24, 40, 0.62)",
                  backdropFilter: "blur(1px)",
                }}
                type="button"
                onClick={() => setIsComputerDialogueOpen(true)}
              >
                <p className="text-lg leading-snug text-text">PBS Computer</p>
                <p className="text-base text-text mt-1">LLM wiki / 聯想</p>
                <p className="text-base text-accent-bright mt-2">{t(selectedLanguage, "hud.pressToTalk")}</p>
              </button>
            )}

          {!isEncounterUiOpen && !activeDialoguePersona && !isComputerDialogueOpen && !splitPanel && nameTags.map((tag) => (
            <div
              key={tag.id}
              className={`npc-name-tag absolute -translate-x-1/2 -translate-y-full px-4 py-2 rounded-full border border-black bg-white text-black text-base ${
                "pointer-events-auto cursor-pointer"
              }`}
              style={{
                left: tag.left,
                top: tag.top,
                "--npc-tag-scale": tag.zoomScale,
              } as CSSProperties}
              onClick={
                (event) => {
                  event.stopPropagation();
                  if (tag.isQuestionPet || tag.id === abaoAgentId) {
                    handleClick(tag.id);
                    return;
                  }
                  officeState.selectedAgentId = tag.id;
                }
              }
            >
              {tag.name}
            </div>
          ))}

          {appMode === "interactive" &&
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
                      setSplitPanel({ kind: "archivePdf" });
                      setSplitPanelAnchor(null);
                      setIsSplitExpanded(false);
                      setArchiveMenuOpen(false);
                    }}
                  >
                    2. {t(selectedLanguage, "archive.ebookButton")}
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
                    3. {t(selectedLanguage, "archive.mapButton")}
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
                  onClose={() => setActiveDialogueId(null)}
                  onOpenMusic={
                    activeDialoguePersona.id === "wukir-suryadi"
                      ? () => {
                          setSplitPanel({ kind: "wukirBandcamp" });
                          setSplitPanelAnchor({
                            kind: "npc",
                            id: activeDialogueCharacter.id,
                          });
                          setIsSplitExpanded(false);
                        }
                      : undefined
                  }
                  onSimEvent={(prompt) => {
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
                />
              </Suspense>
            )}

          {appMode === "interactive" && isComputerDialogueOpen && playerProfile && (
            <CentralComputerDialogue
              language={selectedLanguage}
              playerName={playerProfile.name}
              playerPalette={playerProfile.palette}
              onClose={() => {
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
            />
          )}

          {worldNotice && (
            <div className="world-resonance-notice">{worldNotice}</div>
          )}

          {simSnapshot &&
            playerProfile &&
            appMode === "interactive" &&
            !isSplitOpen && (
              <section
                className={`question-status-panel rpg-message-frame absolute right-12 bottom-12 z-43 w-[min(430px,calc(100vw-24px))] px-7 py-6 ${
                  isQuestionSimMinimized
                    ? "question-status-panel-minimized"
                    : "max-h-[46vh] overflow-auto"
                }`}
                data-no-mobile-drag="true"
              >
                <div className="question-status-header flex items-center justify-between gap-4 mb-4">
                  <h2 className="text-lg">
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
                  <div className="question-status-compact grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(simSnapshot.scores).map(([key, value]) => (
                      <p key={key}>
                        {petScoreLabel(selectedLanguage, key)}: {value.toFixed(1)}
                      </p>
                    ))}
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
                            setSelectedPet(pet);
                            setPetChatReply(null);
                            setPetChatDraft("");
                          }}
                        >
                          <div className="flex gap-4 items-center">
                            <QuestionPetPreview
                              question={pet.question.text}
                              appearance={pet.appearance}
                              size={4}
                              socialSignals={pet.state}
                              currentAction={pet.currentAction}
                            />
                            <span className="text-base leading-snug">
                              {PET_HUD_COPY[selectedLanguage].agent}
                            </span>
                          </div>
                          <p className="text-sm mt-3">
                            {petActionLabel(selectedLanguage, pet.currentAction)} / {t(selectedLanguage, "pet.energy")}
                            {" "}
                            {pet.state.energy.toFixed(0)} {" "}
                            {t(selectedLanguage, "pet.stress")}
                            {" "}
                            {pet.state.stress.toFixed(0)} {" "}
                            {t(selectedLanguage, "pet.bond")}
                            {" "}
                            {pet.state.groupBond.toFixed(0)}
                          </p>
                        </button>
                      ))}
                    <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                      {Object.entries(simSnapshot.scores).map(([key, value]) => (
                        <p key={key}>
                          {petScoreLabel(selectedLanguage, key)}: {value.toFixed(1)}
                        </p>
                      ))}
                    </div>
                    {simSnapshot.throngs.map((throng) => (
                      <p key={throng.id} className="text-sm mb-2">
                        THRONG: {throng.topic} ({throng.memberIds.length})
                      </p>
                    ))}
                    {simSnapshot.a2aExchanges[0] && (
                      <div className="text-sm leading-snug border-t border-[var(--palette-blue)] pt-3 mt-3">
                        <strong>🐣💬 {simSnapshot.a2aExchanges[0].targetLabel}</strong>
                        {simSnapshot.a2aExchanges[0].turns.slice(0, 4).map((turn) => (
                          <p key={turn.id} className="mt-2">{turn.text}</p>
                        ))}
                      </div>
                    )}
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

          {(selectedDispatchPet || selectedNpcInfo) && (
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
              {selectedDispatchPet
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

          {shouldShowMobileStatsBar && (
            <button
              className="mobile-stats-bar"
              type="button"
              onClick={() => setMobileRulesOpen(true)}
              data-no-mobile-drag="true"
            >
              <span>🐣 {archiveSummary.active}</span>
              <span>💬 {archiveSummary.notes}</span>
              <span>
                S{" "}
                {Math.round(
                  activeDispatchPets.reduce(
                    (sum, pet) => sum + pet.stats.social,
                    0,
                  ) / Math.max(1, activeDispatchPets.length),
                )}
              </span>
              <span>
                L{" "}
                {Math.round(
                  activeDispatchPets.reduce(
                    (sum, pet) => sum + pet.stats.learning,
                    0,
                  ) / Math.max(1, activeDispatchPets.length),
                )}
              </span>
              <span>
                T{" "}
                {Math.round(
                  activeDispatchPets.reduce(
                    (sum, pet) => sum + pet.stats.tension,
                    0,
                  ) / Math.max(1, activeDispatchPets.length),
                )}
              </span>
              <span>R {simSnapshot?.tick ?? 0}</span>
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
                {t(selectedLanguage, "pet.dispatchArchive")}
              </h2>
              <p className="text-sm mb-2">
                {t(selectedLanguage, "pet.active")}: {archiveSummary.active} ·{" "}
                {t(selectedLanguage, "pet.hibernating")}:{" "}
                {archiveSummary.hibernating} · {t(selectedLanguage, "pet.archived")}
                : {archiveSummary.archived}
              </p>
              <p className="text-sm">
                {t(selectedLanguage, "pet.localOnlyNotice")}
              </p>
            </section>
          )}

          {selectedPet && (
            <section
              className={`question-response-panel pbs-frame F2 pbs-frame-f2 rpg-message-frame absolute right-12 bottom-12 z-51 w-[min(520px,calc(100vw-24px))] px-8 py-7 ${
                isSelectedPetPanelExpanded ? "question-response-panel-expanded" : ""
              }`}
              data-no-mobile-drag="true"
            >
              <div className="question-response-window-actions">
                <button
                  className="question-response-expand pbs-frame-action"
                  type="button"
                  onClick={() => setIsSelectedPetPanelExpanded((expanded) => !expanded)}
                  aria-label={isSelectedPetPanelExpanded ? "Minimize pet panel" : "Maximize pet panel"}
                >
                  {isSelectedPetPanelExpanded ? "↙" : "⤢"}
                </button>
                <button
                  className="question-response-close pbs-frame-action"
                  type="button"
                  onClick={closeSelectedPetPanel}
                  aria-label={t(selectedLanguage, "common.close")}
                >
                  X
                </button>
              </div>
              <div className="pet-detail-header">
                <QuestionPetPreview
                  question={selectedPet.question.text}
                  appearance={selectedPet.appearance}
                  size={4}
                  socialSignals={selectedPet.state}
                  currentAction={selectedPet.currentAction}
                />
                <div>
                  <p className="type-caption pet-detail-kicker">
                    {petActionLabel(selectedLanguage, selectedPet.currentAction)}
                  </p>
                  <h2 className="type-heading">
                    {t(selectedLanguage, "pet.questionPet")}
                  </h2>
                  <p className="type-label">
                    {t(selectedLanguage, "pet.status")}: {selectedPet.kind}
                  </p>
                </div>
              </div>
              <div className="pet-detail-section">
                  <p className="type-label pet-detail-kicker">{PET_HUD_COPY[selectedLanguage].agent}</p>
                  <p className="type-body-large">{PET_HUD_COPY[selectedLanguage].note}</p>
              </div>
              <div className="pet-detail-section">
                <h3 className="type-subheading">{PET_LOCAL_CHAT_COPY[selectedLanguage].title}</h3>
                <form className="rpg-dialogue-form flex gap-3" onSubmit={handlePetLocalChat}>
                  <input
                    className="rpg-dialogue-input flex-1 bg-bg border-2 border-border px-4 py-3 text-base text-text outline-none focus:border-accent-bright"
                    value={petChatDraft}
                    onChange={(event) => setPetChatDraft(event.target.value)}
                    placeholder={PET_LOCAL_CHAT_COPY[selectedLanguage].placeholder}
                  />
                  <button className="pbs-frame-button" type="submit">
                    {PET_LOCAL_CHAT_COPY[selectedLanguage].ask}
                  </button>
                </form>
                {petChatReply && (
                  <div className="pet-response-list mt-3">
                    <article className="pet-response-item">
                      <p className="type-body">{petChatReply.reply}</p>
                      {petChatReply.evidence.length ? (
                        <ul className="type-caption mt-2 pl-4 list-disc">
                          {petChatReply.evidence.map((item) => (
                            <li key={item.id}>{item.label}: {item.text}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="type-caption mt-2">{PET_LOCAL_CHAT_COPY[selectedLanguage].noEvidence}</p>
                      )}
                    </article>
                  </div>
                )}
                {petDialogueHistory.filter((entry) => entry.petId === selectedPet.id).length > 0 && (
                  <div className="pet-response-list mt-3">
                    {petDialogueHistory.filter((entry) => entry.petId === selectedPet.id).slice(-4).reverse().map((entry) => (
                      <article className="pet-response-item" key={entry.id}>
                        <p className="type-caption">{new Date(entry.createdAt).toLocaleString()}</p>
                        <p className="type-body">{entry.message}</p>
                        {entry.reply && <p className="type-caption mt-2">{entry.reply}</p>}
                      </article>
                    ))}
                  </div>
                )}
              </div>
              <div className="pet-detail-section pet-response-compose-section">
                  <h3 className="type-subheading">
                    {t(selectedLanguage, "pet.responses")}
                  </h3>
                  <p className="type-body pet-response-empty">
                    電子雞正在尋找 NPC 與 wiki/community 養分；此處不提供回覆輸入控制。
                  </p>
                  {petBoardResponses.length > 0 && (
                    <div className="pet-response-list">
                      {petBoardResponses.map((response) => (
                        <article key={response.id} className="pet-response-item">
                          <div className="type-micro pet-response-meta">
                            {response.author && <span>{response.author}</span>}
                            <time dateTime={new Date(response.createdAt).toISOString()}>
                              {new Date(response.createdAt).toLocaleString()}
                            </time>
                          </div>
                          <p className="type-body">{response.text}</p>
                        </article>
                      ))}
                    </div>
                  )}
              </div>
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
          className={`world-split-panel rpg-message-frame ${isSplitExpanded ? "is-expanded" : ""} ${splitPanel.kind === "finalDocument" ? "world-split-panel--zine" : ""}`}
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
              {splitPanel.kind !== "finalDocument" && (
                <button
                  className="world-split-expand pbs-frame-action"
                  type="button"
                  onClick={() => setIsSplitExpanded((expanded) => !expanded)}
                >
                  {isSplitExpanded ? "↙" : "⤢"}
                </button>
              )}
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

      {playerProfile && multiplayerConfig && videoEncounter && !encounterPanel && (
        <div className="video-encounter-card pbs-encounter-card" role="dialog" aria-live="polite">
          <p>你遇見 {videoEncounter.displayName}</p>
          <div className="video-encounter-actions pbs-encounter-actions">
            <button type="button" onClick={() => openEncounterPanel(videoEncounter)}>
              文字交談
            </button>
            <button
              type="button"
              onClick={() => {
                setDismissedVideoEncounterId(videoEncounter.playerId);
                setVideoEncounter(null);
              }}
            >
              Not now
            </button>
          </div>
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
