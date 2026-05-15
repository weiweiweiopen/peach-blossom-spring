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
import { EditTool, TILE_SIZE } from "./office/types.js";
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
import type { FinalDocument, SimSnapshot, Thronglet } from "./simulation/types.js";
import { vscode } from "./vscodeApi.js";
import { getWikiLinksForInterviewee } from "./wikiLinks.js";
import {
  createNextTinyRoomLayout,
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

const PLAYER_ID = 0;
const CONVERSATION_CLOSE_DISTANCE_TILES = 4;
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
  | { kind: "archivePdf" }
  | { kind: "archiveMap" };

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
  if (panel.kind === "archivePdf") return t(language, "archive.pdfTitle");
  return t(language, "archive.mapTitle");
}

function splitPanelKicker(panel: SplitPanel, language: LanguageCode): string {
  if (panel.kind === "dialogue.openWiki") return "World Wiki";
  if (panel.kind === "wukirBandcamp") return "Wukir Suryadi · Bandcamp";
  if (panel.kind === "communityLinks") return t(language, "archive.communityPortals");
  if (panel.kind === "externalLink") {
    return t(language, "archive.embeddedLink");
  }
  return t(language, "archive.tree");
}

function ExternalLinkEmbed({ link }: { link: Extract<SplitPanel, { kind: "externalLink" }> }) {
  return (
    <div className="world-split-embed">
      {link.description && (
        <p className="world-split-embed-description">{link.description}</p>
      )}
      <iframe
        key={link.url}
        title={link.title}
        src={link.url}
        className="world-split-iframe"
        loading="eager"
        referrerPolicy="no-referrer-when-downgrade"
      />
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

function renderFinalDocumentText(document: FinalDocument, paragraph: string) {
  const referencesByAnchor = new Map(
    document.references.map((reference) => [reference.anchorText || reference.label, reference]),
  );
  const parts = paragraph.split(/(\[\[[^\]]+\]\])/g).filter(Boolean);
  return parts.map((part, index) => {
    const match = /^\[\[([^\]]+)\]\]$/.exec(part);
    if (!match) return part;
    const anchor = match[1];
    const reference = referencesByAnchor.get(anchor);
    if (!reference) return anchor;
    return (
      <a key={`${anchor}-${index}`} href={reference.url} target="_blank" rel="noreferrer">
        {anchor}
      </a>
    );
  });
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
    readStoredLanguage(),
  );
  const [hasStarted, setHasStarted] = useState(false);
  const [isPostBootLoading, setIsPostBootLoading] = useState(false);
  const postBootLoadingTimerRef = useRef<number | null>(null);
  const [playerDefaults, setPlayerDefaults] = useState<PlayerProfile | null>(
    () => readSavedPlayerDefaults(),
  );
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(
    null,
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
  const [dispatchedPets, setDispatchedPets] = useState<PetDispatch[]>(() =>
    petStore.listPets(),
  );
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
  const [petBoardResponses, setPetBoardResponses] = useState<
    PetBoardResponse[]
  >([]);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [splitPanel, setSplitPanel] = useState<SplitPanel | null>(null);
  const [splitPanelAnchor, setSplitPanelAnchor] = useState<
    { kind: "npc"; id: number } | null
  >(null);
  const [isSplitExpanded, setIsSplitExpanded] = useState(false);
  const [abaoBubble, setAbaoBubble] = useState<{
    text: string;
    nonce: number;
  } | null>(null);
  const petRunawayDoneRef = useRef<string | null>(null);
  const seenFinalDocumentIdsRef = useRef<Set<string>>(new Set());

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
    for (const id of agents) {
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
  }, [agents, officeState]);

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
    if (!layoutReady || agents.length === 0) return;
    const personaById = new Map(
      personas.map((persona, index) => [persona.id, index + 1]),
    );
    const occupied = new Set<string>();
    for (const placement of nextTinyRoomNpcPlacements) {
      const agentId = personaById.get(placement.personaId);
      if (!agentId || !agents.includes(agentId)) continue;
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
  }, [agents, layoutReady, officeState]);

  useEffect(() => {
    if (!layoutReady || !playerProfile || appMode !== "interactive") return;
    const interval = window.setInterval(() => {
      if (activeDialogueIdRef.current !== null) return;
      const occupied = new Set<string>();
      for (const ch of officeState.characters.values()) {
        if (ch.path.length === 0) occupied.add(`${ch.tileCol},${ch.tileRow}`);
      }
      const shuffled = agents
        .filter((id) => id !== PLAYER_ID && personas[id - 1])
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
  }, [agents, appMode, layoutReady, officeState, playerProfile]);

  useEffect(() => {
    if (
      !layoutReady ||
      !playerProfile ||
      appMode !== "interactive" ||
      !simSnapshot
    )
      return;
    const completedPetIds = new Set(simSnapshot.finalDocuments.map((document) => document.petId));
    simSnapshot.thronglets.forEach((pet, index) => {
      const character = officeState.characters.get(pet.characterId);
      if (completedPetIds.has(pet.id)) {
        if (character?.isQuestionPet) officeState.characters.delete(pet.characterId);
        return;
      }
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
    const runawayKey = `${playerProfile.petSeed ?? playerProfile.question}-${simSnapshot.thronglets.map((pet) => pet.id).join("|")}`;
    if (petRunawayDoneRef.current === runawayKey) return;
    petRunawayDoneRef.current = runawayKey;
    const timeout = window.setTimeout(() => {
      const completedPetIds = new Set(simSnapshot.finalDocuments.map((document) => document.petId));
      simSnapshot.thronglets.forEach((pet, index) => {
        if (completedPetIds.has(pet.id)) return;
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
        const completedPetIds = new Set(next.finalDocuments.map((document) => document.petId));
        for (const pet of next.thronglets) {
          if (completedPetIds.has(pet.id)) {
            const ch = officeState.characters.get(pet.characterId);
            if (ch?.isQuestionPet) officeState.characters.delete(pet.characterId);
            continue;
          }
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
    }, 1800);
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
      if (activeDialogueIdRef.current !== null) {
        const distance = getPlayerDistanceFromCharacter(
          activeDialogueIdRef.current,
        );
        if (distance > CONVERSATION_CLOSE_DISTANCE_TILES) {
          setActiveDialogueId(null);
        }
      }

      setSplitPanel((current) => {
        if (!current || !splitPanelAnchor) return current;
        const awayFromNpc =
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
    layoutReady,
    officeState,
    playerProfile,
    splitPanelAnchor,
  ]);

  const nearbyNpcIdRef = useRef<number | null>(null);
  const activeDialogueIdRef = useRef<number | null>(null);
  const latestA2ANoticeIdRef = useRef<string | null>(null);
  const worldNoticeTimerRef = useRef<number | null>(null);
  useEffect(() => {
    nearbyNpcIdRef.current = nearbyNpcId;
  }, [nearbyNpcId]);
  useEffect(() => {
    activeDialogueIdRef.current = activeDialogueId;
  }, [activeDialogueId]);

  useEffect(() => {
    if (!simSnapshot || appMode !== "interactive") return;
    const exchange = simSnapshot.a2aExchanges[0];
    if (!exchange || latestA2ANoticeIdRef.current === exchange.id) return;
    latestA2ANoticeIdRef.current = exchange.id;
    if (worldNoticeTimerRef.current !== null) {
      window.clearTimeout(worldNoticeTimerRef.current);
    }
    setWorldNotice(`A2A: ${exchange.summary}`);
    worldNoticeTimerRef.current = window.setTimeout(() => {
      setWorldNotice(null);
      worldNoticeTimerRef.current = null;
    }, 3600);
  }, [appMode, simSnapshot]);

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
        return;
      }
      if (event.code === "Space") {
        if (
          activeDialogueIdRef.current === null &&
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
  }, [appMode, layoutReady, officeState, playerProfile]);

  const handleMobileMapTap = useCallback(
    (col: number, row: number) => {
      const moved = officeState.walkToTile(PLAYER_ID, col, row);
      if (moved) {
        setPlayerMoveTick((tick) => tick + 1);
      }
    },
    [officeState],
  );

  const handlePlayerStart = useCallback(
    (profile: PlayerProfile, mode: StartMode) => {
      const pet = createThronglet(
        profile.question || profile.mission,
        profile.name,
        PLAYER_ID,
        10000,
        profile.petSeed,
        t(selectedLanguage, "pet.questionPet"),
        {
          intentMode: profile.intentMode,
          petRole: profile.avatarTitle,
          skills: profile.skills,
          personalArchive: profile.personalArchive ?? profile.constraints,
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
          question: profile.question || profile.mission,
          skill: [
            `intent:${profile.intentMode ?? "why"}`,
            `petRole:${profile.avatarTitle ?? "question pet"}`,
            profile.skills ?? "",
            profile.personalArchive ?? profile.constraints ?? "",
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
    !selectedDispatchPet &&
    !selectedPet &&
    !selectedNpcInfo &&
    !mobileRulesOpen;

  const closeSplitPanel = useCallback(() => {
    setSplitPanel(null);
    setSplitPanelAnchor(null);
    setIsSplitExpanded(false);
  }, []);

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
    if (!simSnapshot) return;
    const seen = seenFinalDocumentIdsRef.current;
    const newest = simSnapshot.finalDocuments.find((document) => !seen.has(document.id));
    for (const document of simSnapshot.finalDocuments) seen.add(document.id);
    if (!newest) return;
    const pet = simSnapshot.thronglets.find((item) => item.id === newest.petId);
    if (!pet) return;
    setSelectedPet(pet);
    setSelectedDispatchPet(null);
    setSelectedNpcInfo(null);
    setIsSelectedPetPanelExpanded(true);
  }, [simSnapshot]);

  useEffect(() => {
    if (!selectedDispatchPet) return;
    const latestPet = activeDispatchPets.find((pet) => pet.id === selectedDispatchPet.id);
    if (latestPet && latestPet !== selectedDispatchPet) setSelectedDispatchPet(latestPet);
  }, [activeDispatchPets, selectedDispatchPet]);

  if (!hasStarted) {
    return <RetroBootScreen onStart={handleBootStart} />;
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
  const selectedPetFinalDocument = selectedPet
    ? (simSnapshot?.finalDocuments.find((document) => document.petId === selectedPet.id) ?? null)
    : null;
  const finalDocumentReviewLog = selectedPetFinalDocument
    ? [
        ...(selectedPetFinalDocument.reviewLog ?? []).slice(0, 6),
        ...petBoardResponses.slice(0, 2).map((response) => ({
          tick: simSnapshot?.tick ?? selectedPetFinalDocument.tick,
          speaker: response.author ?? "player",
          text: response.text,
          source: "player" as const,
        })),
      ]
    : [];

  function closeSelectedPetPanel(): void {
    if (selectedPetFinalDocument && selectedPet) {
      officeState.characters.delete(selectedPet.characterId);
      setSimSnapshot((current) => {
        if (!current) return current;
        const nextThronglets = current.thronglets.filter((pet) => pet.id !== selectedPet.id);
        const nextDocuments = current.finalDocuments.filter((document) => document.petId !== selectedPet.id);
        if (nextThronglets.length === 0 && nextDocuments.length === 0) return null;
        return {
          ...current,
          thronglets: nextThronglets,
          finalDocuments: nextDocuments,
          a2aExchanges: current.a2aExchanges.filter((exchange) => exchange.petId !== selectedPet.id),
          throngs: current.throngs.filter((throng) => !throng.memberIds.includes(selectedPet.id)),
        };
      });
    }
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

      <div className="floating-ui-layer" data-no-mobile-drag="true">
        <button
          className="global-archive-trigger"
          type="button"
          aria-label={t(selectedLanguage, "archive.title")}
          aria-expanded={archiveMenuOpen}
          onClick={() => setArchiveMenuOpen((open) => !open)}
        >
          <span className="global-archive-peach" aria-hidden="true">
            🍑
          </span>
        </button>
        <div className="global-language-menu">
          <button
            className="global-language-trigger"
            type="button"
            aria-label={t(selectedLanguage, "language.menuLabel")}
            aria-expanded={languageMenuOpen}
            onClick={() => setLanguageMenuOpen((open) => !open)}
          >
            <span className="global-language-globe" aria-hidden="true">
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
                  {entry.nativeName}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="hud-ui-layer" data-no-mobile-drag="true">
        {playerProfile && appMode === "dispatch_observer" && (
          <button
            className="observer-close"
            type="button"
            onClick={handleCloseWorld}
            aria-label={t(selectedLanguage, "common.close")}
          >
            ×
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

          {!isEncounterUiOpen && !activeDialoguePersona && !splitPanel && nameTags.map((tag) => (
            <div
              key={tag.id}
              className={`npc-name-tag absolute -translate-x-1/2 -translate-y-full px-4 py-2 rounded-full border border-black bg-white text-black text-base ${
                tag.isQuestionPet || tag.id === abaoAgentId
                  ? "pointer-events-auto cursor-pointer"
                  : "pointer-events-none"
              }`}
              style={{
                left: tag.left,
                top: tag.top,
                "--npc-tag-scale": tag.zoomScale,
              } as CSSProperties}
              onClick={
                tag.isQuestionPet || tag.id === abaoAgentId
                  ? (event) => {
                      event.stopPropagation();
                      handleClick(tag.id);
                    }
                  : undefined
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
                className="archive-tree-menu pbs-frame F1 pbs-frame-f1 pixel-panel"
                data-no-mobile-drag="true"
              >
                <button
                  className="archive-tree-close pbs-frame-action"
                  type="button"
                  onClick={() => setArchiveMenuOpen(false)}
                  aria-label={t(selectedLanguage, "common.close")}
                >
                  ×
                </button>
                <p className="archive-tree-kicker pbs-frame-kicker">
                  {t(selectedLanguage, "archive.tree")}
                </p>
                <h1 className="pbs-frame-title">{t(selectedLanguage, "archive.title")}</h1>
                <div className="archive-tree-options">
                  <button
                    className="pbs-frame-button"
                    type="button"
                    onClick={() => {
                      setSplitPanel({ kind: "communityLinks" });
                      setSplitPanelAnchor(null);
                      setIsSplitExpanded(false);
                      setArchiveMenuOpen(false);
                    }}
                  >
                    1. {t(selectedLanguage, "archive.newsTitle")}
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
                  onOpenWiki={() => {
                    setSplitPanel({
                      kind: "dialogue.openWiki",
                      persona: activeDialoguePersona,
                    });
                    setSplitPanelAnchor({
                      kind: "npc",
                      id: activeDialogueCharacter.id,
                    });
                    setIsSplitExpanded(false);
                  }}
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
                      playerProfile.question || playerProfile.mission,
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

          {worldNotice && (
            <div className="world-resonance-notice">{worldNotice}</div>
          )}

          {simSnapshot &&
            playerProfile &&
            appMode === "interactive" &&
            !isSplitOpen && (
              <section
                className={`question-status-panel rpg-message-frame absolute left-12 bottom-12 z-43 w-[min(430px,calc(100vw-24px))] px-7 py-6 ${
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
                        {key}: {value.toFixed(1)}
                      </p>
                    ))}
                  </div>
                )}
                {!isQuestionSimMinimized && (
                  <>
                    {simSnapshot.thronglets
                      .filter((pet) => !simSnapshot.finalDocuments.some((document) => document.petId === pet.id))
                      .map((pet) => (
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
                              {pet.question.text}
                            </span>
                          </div>
                          <p className="text-sm mt-3">
                            {pet.currentAction} / {t(selectedLanguage, "pet.energy")}
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
                          {key}: {value.toFixed(1)}
                        </p>
                      ))}
                    </div>
                    {simSnapshot.throngs.map((throng) => (
                      <p key={throng.id} className="text-sm mb-2">
                        THRONG: {throng.topic} ({throng.memberIds.length})
                      </p>
                    ))}
                    {simSnapshot.a2aExchanges[0] && (
                      <p className="text-sm leading-snug border-t border-[var(--palette-blue)] pt-3 mt-3">
                        A2A: {simSnapshot.a2aExchanges[0].summary}
                      </p>
                    )}
                    {simSnapshot.finalDocuments.map((document) => (
                      <button
                        key={document.id}
                        className="w-full text-left border-2 border-black bg-white px-3 py-3 mt-3 text-sm"
                        type="button"
                        onClick={() => {
                          const pet = simSnapshot.thronglets.find((item) => item.id === document.petId);
                          if (pet) setSelectedPet(pet);
                        }}
                      >
                        最終文件已生成: {document.title}
                      </button>
                    ))}
                    {simSnapshot.thoughts.map((thought, index) => (
                      <p
                        key={`${thought}-${index}`}
                        className="text-sm leading-snug border-t border-[var(--palette-blue)] pt-3 mt-3"
                      >
                        {thought}
                      </p>
                    ))}
                    {simSnapshot.events.slice(0, 4).map((event) => (
                      <p key={event.id} className="text-sm opacity-80 mt-2">
                        {event.type}: {event.text}
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
                ×
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
                className="float-right text-xl"
                type="button"
                onClick={() => setMobileRulesOpen(false)}
              >
                ×
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
              } ${selectedPetFinalDocument ? "final-document-window" : ""}`}
              data-no-mobile-drag="true"
            >
              <div className="question-response-window-actions">
                {!selectedPetFinalDocument && (
                  <button
                    className="question-response-expand pbs-frame-action"
                    type="button"
                    onClick={() => setIsSelectedPetPanelExpanded((expanded) => !expanded)}
                    aria-label={isSelectedPetPanelExpanded ? "Minimize pet panel" : "Maximize pet panel"}
                  >
                    {isSelectedPetPanelExpanded ? "↙" : "⤢"}
                  </button>
                )}
                <button
                  className="question-response-close pbs-frame-action"
                  type="button"
                  onClick={closeSelectedPetPanel}
                  aria-label={t(selectedLanguage, "common.close")}
                >
                  ×
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
                    {selectedPet.currentAction}
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
                <p className="type-label pet-detail-kicker">
                  {t(selectedLanguage, "pet.originalQuestionPurpose")}
                </p>
                <p className="type-body-large">{selectedPet.question.text}</p>
              </div>
              <div className="pet-detail-section">
                <h3 className="type-subheading">Local pet RAG chat</h3>
                <form className="rpg-dialogue-form flex gap-3" onSubmit={handlePetLocalChat}>
                  <input
                    className="rpg-dialogue-input flex-1 bg-bg border-2 border-border px-4 py-3 text-base text-text outline-none focus:border-accent-bright"
                    value={petChatDraft}
                    onChange={(event) => setPetChatDraft(event.target.value)}
                    placeholder="Ask this pet using its memory, materials, and A2A evidence"
                  />
                  <button className="pbs-frame-button" type="submit">
                    Ask
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
                        <p className="type-caption mt-2">No evidence retrieved yet.</p>
                      )}
                    </article>
                  </div>
                )}
              </div>
              {!selectedPetFinalDocument && (
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
              )}
              {selectedPetFinalDocument && (
                <div className="pet-detail-section final-document-panel">
                  <p className="type-label pet-detail-kicker">Final document / {selectedPetFinalDocument.modeLabel ?? selectedPetFinalDocument.mode}</p>
                  <h3 className="type-subheading">{selectedPetFinalDocument.title}</h3>
                  <div className="final-document-body">
                    {selectedPetFinalDocument.body.split("\n\n").map((paragraph) => (
                      <p key={paragraph} className="type-body">
                        {renderFinalDocumentText(selectedPetFinalDocument, paragraph)}
                      </p>
                    ))}
                  </div>
                  <details className="final-document-log">
                    <summary>Conversation log preview ({finalDocumentReviewLog.length})</summary>
                    {finalDocumentReviewLog.map((entry, index) => (
                      <article key={`${entry.source}-${entry.tick}-${index}`}>
                        <p className="final-document-log-meta">
                          tick {entry.tick} · {entry.speaker}{"target" in entry && entry.target ? ` → ${entry.target}` : ""} · {entry.source}
                        </p>
                        <p>{entry.text}</p>
                      </article>
                    ))}
                  </details>
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
          className={`world-split-panel rpg-message-frame ${isSplitExpanded ? "is-expanded" : ""}`}
          data-no-mobile-drag="true"
        >
          <div className="world-split-toolbar">
            <div>
              <p>{splitPanelKicker(splitPanel, selectedLanguage)}</p>
              <h2>{splitPanelTitle(splitPanel, selectedLanguage)}</h2>
            </div>
            <div className="world-split-actions">
              <button
                type="button"
                onClick={() => setIsSplitExpanded((expanded) => !expanded)}
              >
                {isSplitExpanded ? "↙" : "⤢"}
              </button>
              <button type="button" onClick={closeSplitPanel}>
                ✕
              </button>
            </div>
          </div>
          <div className="world-split-content">
            {splitPanel.kind === "dialogue.openWiki" ? (
              (() => {
                const wiki = getWikiLinksForInterviewee(splitPanel.persona.id);
                return (
                  <div className="world-wiki-content">
                    <p className="world-wiki-role">{splitPanel.persona.role}</p>
                    <p className="world-wiki-intro">
                      {splitPanel.persona.intro}
                    </p>
                    {wiki.links.length === 0 ? (
                      <p>{t(selectedLanguage, "archive.noWikiLinks")}</p>
                    ) : (
                      wiki.links.map((link) => (
                        <button
                          key={`${link.title}-${link.url}`}
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
                      ))
                    )}
                  </div>
                );
              })()
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
            ) : splitPanel.kind === "externalLink" ? (
              <ExternalLinkEmbed link={splitPanel} />
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
              className="pbs-encounter-close"
              aria-label="Close encounter panel"
              onClick={() => {
                setDismissedVideoEncounterId(encounterPanel.partner.playerId);
                setEncounterPanel(null);
              }}
            >
              ×
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
