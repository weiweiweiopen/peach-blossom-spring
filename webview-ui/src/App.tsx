import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import extraPersonaData from '../../data/extra-personas.json';
import personaData from '../../data/personas.json';
import { toMajorMinor } from './changelogData.js';
import { ChangelogModal } from './components/ChangelogModal.js';
import { DebugView } from './components/DebugView.js';
import { EditActionBar } from './components/EditActionBar.js';
import { MigrationNotice } from './components/MigrationNotice.js';
import { type PlayerProfile, PlayerSetup, type StartMode } from './components/PlayerSetup.js';
import { SettingsModal } from './components/SettingsModal.js';
import { Tooltip } from './components/Tooltip.js';
import { Modal } from './components/ui/Modal.js';
import { VersionIndicator } from './components/VersionIndicator.js';
import { useEditorActions } from './hooks/useEditorActions.js';
import { useEditorKeyboard } from './hooks/useEditorKeyboard.js';
import { useExtensionMessages } from './hooks/useExtensionMessages.js';
import { type LanguageCode, readStoredLanguage, supportedLanguages, t, writeStoredLanguage } from './i18n.js';
import { OfficeCanvas } from './office/components/OfficeCanvas.js';
import { EditorState } from './office/editor/editorState.js';
import { EditorToolbar } from './office/editor/EditorToolbar.js';
import { OfficeState } from './office/engine/officeState.js';
import { isRotatable } from './office/layout/furnitureCatalog.js';
import { EditTool, TILE_SIZE } from './office/types.js';
import { appearanceToSpriteData, generateQuestionPet } from './pets/generateQuestionPet.js';
import { type PetDispatch, petStore, tagsFromText } from './pets/petStore.js';
import { QuestionPetPreview } from './pets/QuestionPetPreview.js';
import { isBrowserRuntime } from './runtime.js';
import { applyPlayerNpcDialogue, applyPlayerThrongletResponse, createInitialSnapshot, createThronglet, tickSimulation } from './simulation/engine.js';
import { scorePromptResonance } from './simulation/resonance.js';
import type { SimSnapshot, Thronglet } from './simulation/types.js';
import { shouldEnableVideoEncounter } from './videoEncounter.js';
import { vscode } from './vscodeApi.js';
import {
  createTamagotchiPeachForestLayout,
  isInZone,
  tamagotchiNpcPlacements,
  tamagotchiPeachForestZones,
} from './world/peachBlossomWorld.js';

interface Persona {
  id: string;
  name: string;
  role: string;
  intro: string;
  responses: Record<string, string>;
}

const personas = [...(personaData.personas as Persona[]), ...(extraPersonaData.personas as Persona[])];

const topicLabels: Record<string, string> = {
  nomadic: 'Nomadic research',
  camp: 'Hacker camp',
  independent: 'Independent research',
  artScience: 'Science art project',
  funding: 'How to use funding',
  exchange: 'International exchange',
  sustainability: 'Open community sustainability',
};

const PLAYER_ID = 0;
const MOBILE_THUMB_GUIDE_CENTER_LEFT_PX = 96;
const MOBILE_THUMB_GUIDE_BOTTOM_PX = 72;
const MOBILE_THUMB_GUIDE_DIAMETER_PX = 168;
const archiveTreeZone = tamagotchiPeachForestZones.find((zone) => zone.kind === 'archiveTree') ?? null;
type PlayMode = 'camp' | 'expedition';
type AppMode = 'interactive' | 'dispatch_observer';
const ExpeditionPanel = lazy(() =>
  import('./components/ExpeditionPanel.js').then((module) => ({ default: module.ExpeditionPanel })),
);
const RpgDialogue = lazy(() =>
  import('./components/RpgDialogue.js').then((module) => ({ default: module.RpgDialogue })),
);

function trimToFiftyChars(text: string): string {
  return text.length > 50 ? `${text.slice(0, 50)}...` : text;
}

function languageLabel(language: LanguageCode, zh: string, en: string): string {
  return language === 'zh-TW' ? zh : en;
}

function readSavedPlayerDefaults(): PlayerProfile | null {
  try {
    const raw = localStorage.getItem('peach_player_profile');
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<PlayerProfile>;
    return {
      name: saved.name ?? '',
      palette: saved.palette ?? 0,
      avatarTitle: saved.avatarTitle,
      currentRole: saved.currentRole ?? 'Wandering researcher',
      mission: saved.mission ?? 'Find an idea worth developing with others',
      constraints: saved.constraints ?? '',
      skills: saved.skills ?? '',
      question: saved.question ?? saved.mission ?? '',
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
  // Browser runtime (dev or static dist): dispatch mock messages after the
  // useExtensionMessages listener has been registered.
  useEffect(() => {
    if (isBrowserRuntime) {
      void import('./browserMock.js').then(({ dispatchMockMessages }) => dispatchMockMessages());
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
    lastSeenVersion,
    extensionVersion,
    watchAllSessions,
    setWatchAllSessions,
    alwaysShowLabels,
    hooksEnabled,
    setHooksEnabled,
    hooksInfoShown,
  } = useExtensionMessages(getOfficeState, editor.setLastSavedLayout, isEditDirty);

  // Show migration notice once layout reset is detected
  const [migrationNoticeDismissed, setMigrationNoticeDismissed] = useState(false);
  const showMigrationNotice = layoutWasReset && !migrationNoticeDismissed;

  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHooksInfoOpen, setIsHooksInfoOpen] = useState(false);
  const [hooksTooltipDismissed, setHooksTooltipDismissed] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [alwaysShowOverlay, setAlwaysShowOverlay] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(() => readStoredLanguage());
  const [playerDefaults, setPlayerDefaults] = useState<PlayerProfile | null>(() => readSavedPlayerDefaults());
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null);
  const [nearbyNpcId, setNearbyNpcId] = useState<number | null>(null);
  const [activeDialogueId, setActiveDialogueId] = useState<number | null>(null);
  const [isNearTree, setIsNearTree] = useState(false);
  const [, setPlayerMoveTick] = useState(0);
  const [worldInitialized, setWorldInitialized] = useState(false);
  const [promptAnchor, setPromptAnchor] = useState<{ npcId: number; col: number; row: number } | null>(null);
  const [showMobileControls, setShowMobileControls] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>('camp');
  const [appMode, setAppMode] = useState<AppMode>('interactive');
  const [dispatchedPets, setDispatchedPets] = useState<PetDispatch[]>(() => petStore.listPets());
  const [selectedDispatchPet, setSelectedDispatchPet] = useState<PetDispatch | null>(null);
  const [selectedNpcInfo, setSelectedNpcInfo] = useState<Persona | null>(null);
  const [mobileRulesOpen, setMobileRulesOpen] = useState(false);
  const [worldNotice, setWorldNotice] = useState<string | null>(null);
  const [simSnapshot, setSimSnapshot] = useState<SimSnapshot | null>(null);
  const [selectedPet, setSelectedPet] = useState<Thronglet | null>(null);
  const [petResponse, setPetResponse] = useState('');

  const currentMajorMinor = toMajorMinor(extensionVersion);
  const activeDispatchPets = useMemo(() => dispatchedPets.filter((pet) => pet.status === 'active'), [dispatchedPets]);
  const archiveSummary = useMemo(() => ({
    total: dispatchedPets.length,
    active: dispatchedPets.filter((pet) => pet.status === 'active').length,
    hibernating: dispatchedPets.filter((pet) => pet.status === 'hibernating').length,
    archived: dispatchedPets.filter((pet) => pet.status === 'archived').length,
    notes: dispatchedPets.reduce((sum, pet) => sum + (pet.ownerId === petStore.getOwnerId() ? pet.interactions.length : 0), 0),
  }), [dispatchedPets]);

  const handleWhatsNewDismiss = useCallback(() => {
    vscode.postMessage({ type: 'setLastSeenVersion', version: currentMajorMinor });
  }, [currentMajorMinor]);

  const handleOpenChangelog = useCallback(() => {
    setIsChangelogOpen(true);
    vscode.postMessage({ type: 'setLastSeenVersion', version: currentMajorMinor });
  }, [currentMajorMinor]);

  // Sync alwaysShowOverlay from persisted settings
  useEffect(() => {
    setAlwaysShowOverlay(alwaysShowLabels);
  }, [alwaysShowLabels]);

  const handleToggleDebugMode = useCallback(() => setIsDebugMode((prev) => !prev), []);
  const handleToggleAlwaysShowOverlay = useCallback(() => {
    setAlwaysShowOverlay((prev) => {
      const newVal = !prev;
      vscode.postMessage({ type: 'setAlwaysShowLabels', enabled: newVal });
      return newVal;
    });
  }, []);

  const handleSelectAgent = useCallback((id: number) => {
    vscode.postMessage({ type: 'focusAgent', id });
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const mobileDragRef = useRef({ pointerId: null as number | null, clientX: 0, clientY: 0, raf: 0, nextAt: 0 });
  const getMobileControlCenter = useCallback(() => ({
    x: MOBILE_THUMB_GUIDE_CENTER_LEFT_PX,
    y: window.innerHeight - MOBILE_THUMB_GUIDE_BOTTOM_PX - MOBILE_THUMB_GUIDE_DIAMETER_PX / 2,
  }), []);

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

  const handleClick = useCallback((agentId: number) => {
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
    const pet = simSnapshot?.thronglets.find((item) => item.characterId === agentId) ?? null;
    if (pet && appMode === 'interactive') {
      setSelectedPet(pet);
      setSelectedDispatchPet(null);
      return;
    }
    const persona = personas[agentId - 1] ?? null;
    if (appMode === 'dispatch_observer' && persona) {
      setSelectedNpcInfo(persona);
      setSelectedDispatchPet(null);
      return;
    }
    const os = getOfficeState();
    const meta = os.subagentMeta.get(agentId);
    const focusId = meta ? meta.parentAgentId : agentId;
    vscode.postMessage({ type: 'focusAgent', id: focusId });
  }, [activeDispatchPets, appMode, simSnapshot]);

  const officeState = getOfficeState();
  const personaByAgentId = useMemo(
    () => new Map(personas.map((persona, index) => [index + 1, persona])),
    [],
  );
  const nearbyPersona = nearbyNpcId ? personaByAgentId.get(nearbyNpcId) ?? null : null;
  const activeDialoguePersona = activeDialogueId ? personaByAgentId.get(activeDialogueId) ?? null : null;
  const activeDialogueCharacter = activeDialogueId ? officeState.characters.get(activeDialogueId) ?? null : null;
  const abaoAgentId = personas.findIndex((persona) => persona.id === 'abao') + 1;
  const isNearAbao = nearbyNpcId === abaoAgentId;

  useEffect(() => {
    writeStoredLanguage(selectedLanguage);
  }, [selectedLanguage]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(pointer: coarse), (max-width: 900px)');
    const sync = () => {
      setShowMobileControls(mediaQuery.matches);
    };
    sync();
    mediaQuery.addEventListener('change', sync);
    window.addEventListener('resize', sync);
    window.addEventListener('orientationchange', sync);
    return () => {
      mediaQuery.removeEventListener('change', sync);
      window.removeEventListener('resize', sync);
      window.removeEventListener('orientationchange', sync);
    };
  }, []);

  const findNearbyNpc = useCallback((): number | null => {
    const player = officeState.characters.get(PLAYER_ID);
    if (!player) return null;
    let nearest: { id: number; dist: number } | null = null;
    for (const id of agents) {
      const npc = officeState.characters.get(id);
      if (!npc) continue;
      const dist = Math.abs(npc.tileCol - player.tileCol) + Math.abs(npc.tileRow - player.tileRow);
      if (dist <= 2 && (!nearest || dist < nearest.dist)) {
        nearest = { id, dist };
      }
    }
    return nearest?.id ?? null;
  }, [agents, officeState]);

  useEffect(() => {
    if (!layoutReady || !playerProfile) return;
    if (!worldInitialized) {
      officeState.rebuildFromLayout(createTamagotchiPeachForestLayout());
      setWorldInitialized(true);
    }
    if (appMode === 'interactive') {
      officeState.addPlayer(PLAYER_ID, playerProfile.palette, playerProfile.name);
      officeState.cameraFollowId = PLAYER_ID;
    } else {
      officeState.characters.delete(PLAYER_ID);
      officeState.cameraFollowId = null;
    }
  }, [appMode, layoutReady, officeState, playerProfile, worldInitialized]);

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
    const personaById = new Map(personas.map((persona, index) => [persona.id, index + 1]));
    for (const placement of tamagotchiNpcPlacements) {
      const agentId = personaById.get(placement.personaId);
      if (!agentId || !agents.includes(agentId)) continue;
      const ch = officeState.characters.get(agentId);
      if (!ch) continue;
      ch.tileCol = placement.col;
      ch.tileRow = placement.row;
      ch.x = placement.col * TILE_SIZE + TILE_SIZE / 2;
      ch.y = placement.row * TILE_SIZE + TILE_SIZE / 2;
      ch.path = [];
      ch.moveProgress = 0;
      ch.wanderTimer = 2 + (agentId % 5);
      ch.seatId = null;
      ch.hueShift = (25 + agentId * 23) % 120;
    }
  }, [agents, layoutReady, officeState]);

  useEffect(() => {
    if (!layoutReady || !playerProfile || appMode !== 'interactive' || !simSnapshot) return;
    simSnapshot.thronglets.forEach((pet, index) => {
      if (!officeState.characters.has(pet.characterId)) {
        officeState.addQuestionPet(pet.characterId, languageLabel(selectedLanguage, '問題電子雞', 'Question Pet'), appearanceToSpriteData(pet.appearance), 34 + index, 34);
      }
    });
  }, [appMode, layoutReady, officeState, playerProfile, selectedLanguage, simSnapshot]);

  useEffect(() => {
    if (!layoutReady || !playerProfile || appMode !== 'interactive' || !simSnapshot) return;
    const interval = window.setInterval(() => {
      setSimSnapshot((current) => {
        if (!current) return current;
        const contexts = Object.fromEntries(current.thronglets.map((pet) => [pet.id, personas.map((persona) => `${persona.role} ${persona.intro}`).join(' ')]));
        const next = tickSimulation(current, contexts);
        for (const pet of next.thronglets) {
          const ch = officeState.characters.get(pet.characterId);
          if (!ch || ch.path.length > 0) continue;
          const targets = pet.currentAction === 'visitRiver' || pet.state.energy < 35
            ? [{ col: 20, row: 16 }, { col: 45, row: 12 }]
            : pet.currentAction === 'joinThrong' || pet.state.groupBond > 50
              ? [{ col: 43, row: 31 }]
              : pet.currentAction === 'reflect' || pet.state.solitude > 60
                ? [{ col: 14, row: 51 }, { col: 53, row: 50 }]
                : [{ col: ch.tileCol + ((next.tick + pet.characterId) % 3) - 1, row: ch.tileRow + (((next.tick + pet.characterId) >> 1) % 3) - 1 }];
          const target = targets[next.tick % targets.length];
          officeState.walkToTile(pet.characterId, target.col, target.row);
        }
        return next;
      });
    }, 1800);
    return () => window.clearInterval(interval);
  }, [appMode, layoutReady, officeState, playerProfile, simSnapshot]);

  useEffect(() => {
    if (!layoutReady || !playerProfile || appMode !== 'interactive') return;
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
        officeState.faceCharacterToward(nearbyId, player.tileCol, player.tileRow);
      }
      const nearTree =
        !!player && !!archiveTreeZone && isInZone(player.tileCol, player.tileRow, archiveTreeZone, 1);
      setIsNearTree(nearTree);
    }, 250);
    return () => window.clearInterval(interval);
  }, [appMode, findNearbyNpc, layoutReady, officeState, playerProfile]);

  const nearbyNpcIdRef = useRef<number | null>(null);
  const activeDialogueIdRef = useRef<number | null>(null);
  useEffect(() => {
    nearbyNpcIdRef.current = nearbyNpcId;
  }, [nearbyNpcId]);
  useEffect(() => {
    activeDialogueIdRef.current = activeDialogueId;
  }, [activeDialogueId]);

  useEffect(() => {
    if (!layoutReady || !playerProfile || appMode !== 'interactive') return;

    // Continuous smooth movement: track held keys, advance via rAF, do not rely on OS key-repeat.
    const heldKeys = new Set<'up' | 'down' | 'left' | 'right'>();
    let isSprint = false;
    let sprintHeld = false;
    let raf = 0;
    let nextRepeatAt = 0;

    const dirOf = (event: KeyboardEvent): 'up' | 'down' | 'left' | 'right' | null => {
      const k = event.key.toLowerCase();
      if (event.key === 'ArrowUp' || k === 'w') return 'up';
      if (event.key === 'ArrowDown' || k === 's') return 'down';
      if (event.key === 'ArrowLeft' || k === 'a') return 'left';
      if (event.key === 'ArrowRight' || k === 'd') return 'right';
      return null;
    };

    const stepOnce = (dir: 'up' | 'down' | 'left' | 'right'): boolean => {
      if (dir === 'up') return officeState.movePlayerBy(PLAYER_ID, 0, -1);
      if (dir === 'down') return officeState.movePlayerBy(PLAYER_ID, 0, 1);
      if (dir === 'left') return officeState.movePlayerBy(PLAYER_ID, -1, 0);
      return officeState.movePlayerBy(PLAYER_ID, 1, 0);
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (activeDialogueIdRef.current !== null) {
        heldKeys.clear();
        return;
      }
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
      let dir: 'up' | 'down' | 'left' | 'right' | null = null;
      if (heldKeys.has('up')) dir = 'up';
      else if (heldKeys.has('down')) dir = 'down';
      else if (heldKeys.has('left')) dir = 'left';
      else if (heldKeys.has('right')) dir = 'right';
      if (!dir) return;

      const moved = stepOnce(dir);
      if (moved) {
        setPlayerMoveTick((t) => t + 1);
        nextRepeatAt = now + (isSprint ? 60 : 170);
      }
    };
    raf = requestAnimationFrame(tick);

    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;

      if (event.key === 'Shift' || event.key === 'Control') {
        sprintHeld = true;
      }

      if (event.key === 'Escape') {
        setActiveDialogueId(null);
        return;
      }
      if (event.code === 'Space') {
        if (activeDialogueIdRef.current === null && nearbyNpcIdRef.current !== null) {
          event.preventDefault();
          officeState.selectedAgentId = nearbyNpcIdRef.current;
          setActiveDialogueId(nearbyNpcIdRef.current);
        }
        return;
      }
      if (activeDialogueIdRef.current !== null) return;

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
            nextRepeatAt = performance.now() + 190;
          }
        }
      }
    }

    function onKeyUp(event: KeyboardEvent) {
      if (event.key === 'Shift' || event.key === 'Control') {
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

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onWindowBlur);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onWindowBlur);
    };
  }, [appMode, layoutReady, officeState, playerProfile]);

  const handleMoveCommand = useCallback(
    (dCol: number, dRow: number, sprint = false) => {
      officeState.setPlayerSpeedMultiplier(PLAYER_ID, sprint ? 3.1 : 1);
      const moved = officeState.movePlayerBy(PLAYER_ID, dCol, dRow);
      if (moved) {
        setPlayerMoveTick((tick) => tick + 1);
      }
      return moved;
    },
    [officeState],
  );

  const stepTowardMobilePointer = useCallback(() => {
    const drag = mobileDragRef.current;
    drag.raf = requestAnimationFrame(stepTowardMobilePointer);
    if (drag.pointerId === null || activeDialogueIdRef.current !== null) return;
    const now = performance.now();
    if (now < drag.nextAt) return;
    const controlCenter = getMobileControlCenter();
    const dx = drag.clientX - controlCenter.x;
    const dy = drag.clientY - controlCenter.y;
    if (Math.hypot(dx, dy) < 24) return;
    const moved = Math.abs(dx) > Math.abs(dy)
      ? handleMoveCommand(dx > 0 ? 1 : -1, 0)
      : handleMoveCommand(0, dy > 0 ? 1 : -1);
    if (moved) {
      drag.nextAt = now + 90;
    }
  }, [getMobileControlCenter, handleMoveCommand]);

  const handleMobilePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!showMobileControls || !playerProfile || appMode !== 'interactive' || activeDialogueIdRef.current !== null) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('button, input, textarea, a, select, [data-no-mobile-drag="true"]')) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      mobileDragRef.current.pointerId = event.pointerId;
      mobileDragRef.current.clientX = event.clientX;
      mobileDragRef.current.clientY = event.clientY;
      mobileDragRef.current.nextAt = 0;
      if (!mobileDragRef.current.raf) {
        mobileDragRef.current.raf = requestAnimationFrame(stepTowardMobilePointer);
      }
    },
    [appMode, playerProfile, showMobileControls, stepTowardMobilePointer],
  );

  const handleMobilePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (mobileDragRef.current.pointerId !== event.pointerId) return;
    mobileDragRef.current.clientX = event.clientX;
    mobileDragRef.current.clientY = event.clientY;
  }, []);

  const stopMobilePointer = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (mobileDragRef.current.pointerId !== event.pointerId) return;
    mobileDragRef.current.pointerId = null;
    mobileDragRef.current.nextAt = 0;
  }, []);

  useEffect(() => {
    const drag = mobileDragRef.current;
    return () => {
      if (drag.raf) cancelAnimationFrame(drag.raf);
    };
  }, []);

  const handlePlayerStart = useCallback((profile: PlayerProfile, mode: StartMode) => {
    localStorage.setItem('peach_player_profile', JSON.stringify(profile));
    const created = petStore.createDispatch({
      ownerName: profile.name,
      displayName: profile.name ? `${profile.name} / question pet` : undefined,
      question: profile.question || profile.mission,
      skill: profile.skills,
      seed: profile.petSeed ?? `${Date.now()}`,
      isMobile: showMobileControls,
    });
    const allPets = petStore.listPets();
    setDispatchedPets(allPets);
    const pet = createThronglet(profile.question || profile.mission, profile.name, PLAYER_ID, 10000);
    const npcContexts = personas.map((persona, index) => ({ id: `npc-${persona.id}`, characterId: index + 1, name: persona.name, text: `${persona.role} ${persona.intro} ${Object.values(persona.responses).join(' ')}` }));
    setSimSnapshot(createInitialSnapshot([pet], npcContexts));
    setPlayerDefaults(profile);
    setPlayerProfile(profile);
    setAppMode(mode);
    setPlayMode('camp');
    setSelectedDispatchPet(created);
  }, [showMobileControls]);

  const handleLanguageChange = useCallback((language: LanguageCode) => {
    setSelectedLanguage(language);
  }, []);

  useEffect(() => {
    if (!layoutReady || !playerProfile) return;
    activeDispatchPets.forEach((pet, index) => {
      const id = 20000 + index;
      if (officeState.characters.has(id)) return;
      const appearance = generateQuestionPet(pet.question, pet.seed);
      officeState.addQuestionPet(id, pet.displayName ?? languageLabel(selectedLanguage, '問題電子雞', 'Question Pet'), appearanceToSpriteData(appearance), Math.round(pet.worldPosition.x), Math.round(pet.worldPosition.y));
    });
  }, [activeDispatchPets, layoutReady, officeState, playerProfile, selectedLanguage]);

  useEffect(() => {
    if (!playerProfile || activeDispatchPets.length === 0) return;
    const interval = window.setInterval(() => {
      const pets = petStore.listPets();
      const active = pets.filter((pet) => pet.status === 'active');
      const avg = (key: keyof PetDispatch['stats']) => active.length ? active.reduce((sum, pet) => sum + pet.stats[key], 0) / active.length : 0;
      if (active.length >= 12 && avg('social') > 60 && avg('learning') > 60 && avg('tension') < 70) {
        setWorldNotice(t(selectedLanguage, 'worldResonanceEvent'));
        active.slice(0, 4).forEach((pet) => petStore.addInteraction(pet.id, { actorType: 'system', message: t(selectedLanguage, 'worldResonanceEvent'), tags: ['world-resonance'], deltaStats: { social: 2, learning: 2 } }));
      } else {
        const clustered = active.filter((pet) => pet.stats.social > 50).slice(0, 3);
        if (clustered.length >= 3 && clustered.some((pet) => tagsFromText(pet.question).some((tag) => tagsFromText(clustered[0].question).includes(tag)))) {
          setWorldNotice(t(selectedLanguage, 'smallCircleEvent'));
          clustered.forEach((pet) => petStore.addInteraction(pet.id, { actorType: 'system', message: t(selectedLanguage, 'smallCircleEvent'), tags: ['small-circle'], deltaStats: { learning: 5 } }));
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
    const deviceOffsetX = Math.floor((canvasW - mapW) / 2) + Math.round(editor.panRef.current.x);
    const deviceOffsetY = Math.floor((canvasH - mapH) / 2) + Math.round(editor.panRef.current.y);
    return {
      left: (deviceOffsetX + npc.x * editor.zoom) / dpr,
      top: (deviceOffsetY + (npc.y - 24) * editor.zoom) / dpr,
    };
  })();

  const nameTags = (() => {
    if (!containerRef.current) return [] as Array<{ id: number; name: string; left: number; top: number }>;
    const rect = containerRef.current.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const layout = officeState.getLayout();
    const mapW = layout.cols * TILE_SIZE * editor.zoom;
    const mapH = layout.rows * TILE_SIZE * editor.zoom;
    const canvasW = rect.width * dpr;
    const canvasH = rect.height * dpr;
    const deviceOffsetX = Math.floor((canvasW - mapW) / 2) + Math.round(editor.panRef.current.x);
    const deviceOffsetY = Math.floor((canvasH - mapH) / 2) + Math.round(editor.panRef.current.y);
    return Array.from(officeState.characters.values())
      .filter((ch) => ch.folderName)
      .map((ch) => ({
        id: ch.id,
        name: ch.folderName ?? '',
        left: (deviceOffsetX + ch.x * editor.zoom) / dpr,
        top: (deviceOffsetY + (ch.y - 30) * editor.zoom) / dpr,
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
    appMode === 'interactive' &&
    !activeDialoguePersona &&
    !selectedDispatchPet &&
    !selectedPet &&
    !selectedNpcInfo &&
    !mobileRulesOpen;

  if (!layoutReady) {
    return <div className="w-full h-full flex items-center justify-center ">Loading...</div>;
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden"
      style={{ touchAction: showMobileControls && appMode === 'interactive' ? 'none' : undefined }}
      onPointerDown={handleMobilePointerDown}
      onPointerMove={handleMobilePointerMove}
      onPointerUp={stopMobilePointer}
      onPointerCancel={stopMobilePointer}
    >
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
        editorTick={editor.editorTick}
        zoom={editor.zoom}
        onZoomChange={editor.handleZoomChange}
        panRef={editor.panRef}
      />

      <label className="global-language-select" data-no-mobile-drag="true">
        <span>{t(selectedLanguage, 'languageLabel')}</span>
        <select value={selectedLanguage} onChange={(event) => handleLanguageChange(event.target.value as LanguageCode)}>
          {supportedLanguages.map((entry) => <option key={entry.code} value={entry.code}>{entry.label}</option>)}
        </select>
      </label>

      {playerProfile && appMode === 'dispatch_observer' && (
        <button className="observer-close" type="button" onClick={handleCloseWorld} aria-label={t(selectedLanguage, 'close')}>×</button>
      )}

      {playerProfile && appMode === 'dispatch_observer' && (
        <div className="observer-zoom" data-no-mobile-drag="true">
          <button type="button" onClick={() => editor.handleZoomChange(Math.min(4, editor.zoom + 0.25))} aria-label={t(selectedLanguage, 'zoomIn')}>+</button>
          <button type="button" onClick={() => editor.handleZoomChange(Math.max(0.55, editor.zoom - 0.25))} aria-label={t(selectedLanguage, 'zoomOut')}>−</button>
        </div>
      )}

      {!isDebugMode ? (
        <>
          {/* Vignette overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'var(--vignette)' }}
          />

          {editor.isEditMode && editor.isDirty && (
            <EditActionBar editor={editor} editorState={editorState} />
          )}

          {playerProfile && playMode === 'expedition' && !activeDialoguePersona && (
            <Suspense fallback={<div className="absolute inset-0 z-47 flex items-center justify-center bg-black/35 px-6 py-5 text-text">Loading expedition...</div>}>
              <ExpeditionPanel
                avatar={playerProfile}
                personas={personas}
                isOpen
                language={selectedLanguage}
                onClose={() => setPlayMode('camp')}
              />
            </Suspense>
          )}

          {showRotateHint && (
            <div
              className="absolute left-1/2 -translate-x-1/2 z-11 bg-accent-bright text-white text-sm py-3 px-8 rounded-none border-2 border-accent shadow-pixel pointer-events-none whitespace-nowrap"
              style={{ top: editor.isDirty ? 64 : 8 }}
            >
              Rotate (R)
            </div>
          )}

          {editor.isEditMode &&
            (() => {
              const selUid = editorState.selectedFurnitureUid;
              const selColor = selUid
                ? (officeState.getLayout().furniture.find((f) => f.uid === selUid)?.color ?? null)
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
                  onSelectedFurnitureColorChange={editor.handleSelectedFurnitureColorChange}
                  onFurnitureTypeChange={editor.handleFurnitureTypeChange}
                  loadedAssets={loadedAssets}
                />
              );
            })()}

          {appMode === 'interactive' && nearbyPersona && !activeDialoguePersona && promptPosition && (
            <button
              className="absolute z-44 -translate-x-1/2 -translate-y-full px-5 py-4 text-center pointer-events-auto rounded-[10px] border-2 border-border mobile-talk-prompt"
              style={{
                left: promptPosition.left,
                top: promptPosition.top,
                background: 'rgba(24, 24, 40, 0.58)',
                backdropFilter: 'blur(1px)',
              }}
              type="button"
              onClick={() => {
                officeState.selectedAgentId = nearbyNpcId;
                setActiveDialogueId(nearbyNpcId);
              }}
            >
              <p className="text-lg leading-snug text-text">{nearbyPersona.name}</p>
              <p className="text-base text-text mt-1">{trimToFiftyChars(nearbyPersona.intro)}</p>
              <p className="text-base text-accent-bright mt-2">{t(selectedLanguage, 'pressSpaceToTalk')}</p>
            </button>
          )}

          {nameTags.map((tag) => (
            <div
              key={tag.id}
              className="absolute z-42 -translate-x-1/2 -translate-y-full px-4 py-2 rounded-full border border-black bg-white text-black text-base pointer-events-none"
              style={{ left: tag.left, top: tag.top }}
            >
              {tag.name}
            </div>
          ))}

          {shouldEnableVideoEncounter() && <></>}

          {appMode === 'interactive' && isNearAbao && playerProfile && !activeDialoguePersona && (
            <div className="absolute inset-x-0 bottom-0 h-[34vh] z-44 border-t-2 border-black bg-white text-black backdrop-blur-[1px] flex items-center justify-center">
              <div className="text-center px-10 max-w-[960px]">
                <p className="text-lg text-black mb-3">{t(selectedLanguage, 'abaoEncounterTitle')}</p>
                <div className="flex items-center justify-center gap-10 mb-4">
                  <div className="pixel-panel px-8 py-6 min-w-[220px]">
                    <p className="text-sm text-text-muted mb-2">{playerProfile.name}</p>
                    <p className="text-2xl">Traveler</p>
                  </div>
                  <div className="pixel-panel px-8 py-6 min-w-[220px]">
                    <p className="text-sm text-text-muted mb-2">ABao</p>
                    <p className="text-2xl">Storyteller</p>
                  </div>
                </div>
                <p className="text-base text-black">{t(selectedLanguage, 'abaoEncounterHint')}</p>
              </div>
            </div>
          )}

          {appMode === 'interactive' && isNearTree && !activeDialoguePersona && (
            <section className="absolute right-12 top-12 z-43 w-[min(920px,calc(100vw-24px))] max-h-[calc(100vh-96px)] overflow-auto pixel-panel px-12 py-10 text-text shadow-pixel">
              <p className="text-xs uppercase tracking-wide text-accent-bright mb-3">{t(selectedLanguage, 'archiveTree')}</p>
              <h1 className="text-2xl leading-none mb-3">{t(selectedLanguage, 'archiveTitle')}</h1>
              <p className="text-sm text-text-muted mb-8">{t(selectedLanguage, 'archiveDescription')}</p>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="border border-border bg-bg/70 px-7 py-5">
                  <h2 className="text-lg text-accent-bright mb-4">{t(selectedLanguage, 'archivePdfTitle')}</h2>
                  <iframe
                    title="NGM PDF embedded ebook"
                    src="https://archive.org/embed/ngm_20230328"
                    width="560"
                    height="384"
                    frameBorder="0"
                    allowFullScreen
                    className="w-full min-h-[384px] bg-white border border-border"
                  />
                </div>
                <div className="border border-border bg-bg/70 px-7 py-5">
                  <h2 className="text-lg text-accent-bright mb-4">{t(selectedLanguage, 'archiveMapTitle')}</h2>
                  <iframe
                    title="NGM community map"
                    src="http://u.osmfr.org/m/862535/"
                    className="w-full min-h-[384px] bg-white border border-border"
                  />
                  <a
                    href="http://u.osmfr.org/m/862535/"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-block text-sm text-accent-bright hover:text-text"
                  >
                    http://u.osmfr.org/m/862535/
                  </a>
                </div>
              </div>
            </section>
          )}

          {appMode === 'interactive' && activeDialoguePersona && activeDialogueCharacter && playerProfile && (
            <Suspense fallback={<div className="absolute inset-x-0 bottom-0 z-50 pixel-panel mx-auto mb-6 w-fit px-6 py-5 text-text shadow-pixel">Loading dialogue...</div>}>
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
                onSimEvent={(prompt) => {
                  const personaText = `${activeDialoguePersona.role} ${activeDialoguePersona.intro} ${Object.values(activeDialoguePersona.responses).join(' ')}`;
                  const resonance = scorePromptResonance(playerProfile.question || playerProfile.mission, personaText);
                  setSimSnapshot((current) => current ? applyPlayerNpcDialogue(current, `npc-${activeDialoguePersona.id}`, prompt, resonance) : current);
                }}
              />
            </Suspense>
          )}

          {simSnapshot && playerProfile && appMode === 'interactive' && (
            <section className="question-status-panel absolute left-12 bottom-12 z-43 w-[min(430px,calc(100vw-24px))] max-h-[46vh] overflow-auto px-7 py-6" data-no-mobile-drag="true">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-lg">問題電子雞 SIM</h2>
                <span className="text-base">tick {simSnapshot.tick}</span>
              </div>
              {simSnapshot.thronglets.map((pet) => (
                <button key={pet.id} className="w-full text-left border-2 border-[var(--palette-blue)] bg-[var(--palette-cream)] px-4 py-4 mb-4 text-[var(--palette-ink)]" type="button" onClick={() => setSelectedPet(pet)}>
                  <div className="flex gap-4 items-center"><QuestionPetPreview question={pet.question.text} appearance={pet.appearance} size={4} /><span className="text-base leading-snug">{pet.question.text}</span></div>
                  <p className="text-sm mt-3">{pet.currentAction} / energy {pet.state.energy.toFixed(0)} stress {pet.state.stress.toFixed(0)} bond {pet.state.groupBond.toFixed(0)}</p>
                </button>
              ))}
              <div className="grid grid-cols-2 gap-2 text-sm mb-4">{Object.entries(simSnapshot.scores).map(([key, value]) => <p key={key}>{key}: {value.toFixed(1)}</p>)}</div>
              {simSnapshot.throngs.map((throng) => <p key={throng.id} className="text-sm mb-2">THRONG: {throng.topic} ({throng.memberIds.length})</p>)}
              {simSnapshot.thoughts.map((thought, index) => <p key={`${thought}-${index}`} className="text-sm leading-snug border-t border-[var(--palette-blue)] pt-3 mt-3">{thought}</p>)}
              {simSnapshot.events.slice(0, 4).map((event) => <p key={event.id} className="text-sm opacity-80 mt-2">{event.type}: {event.text}</p>)}
            </section>
          )}



          {worldNotice && <div className="world-resonance-notice">{worldNotice}</div>}

          {(selectedDispatchPet || selectedNpcInfo) && (
            <section className="question-response-panel info-card absolute right-12 bottom-12 z-51 w-[min(520px,calc(100vw-24px))] px-8 py-7" data-no-mobile-drag="true">
              <button className="float-right text-xl" type="button" onClick={() => { setSelectedDispatchPet(null); setSelectedNpcInfo(null); }}>×</button>
              {selectedDispatchPet ? (() => {
                const appearance = generateQuestionPet(selectedDispatchPet.question, selectedDispatchPet.seed);
                return (
                  <>
                    <div className="flex gap-5 items-start mb-5"><QuestionPetPreview question={selectedDispatchPet.question} appearance={appearance} size={6} /><div><p className="text-sm">{selectedDispatchPet.displayName}</p><h2 className="text-lg leading-snug">{selectedDispatchPet.question}</h2></div></div>
                    <p className="text-sm mb-2">{t(selectedLanguage, 'skill')}: {selectedDispatchPet.skill || '—'}</p>
                    <p className="text-sm mb-2">{t(selectedLanguage, 'status')}: {selectedDispatchPet.status}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-4">{Object.entries(selectedDispatchPet.stats).map(([key, value]) => <p key={key}>{key}: {value}</p>)}</div>
                    <p className="text-sm mb-2">{t(selectedLanguage, 'fieldNotes')}</p>
                    {(selectedDispatchPet.interactions ?? []).slice(0, 5).map((note) => <p key={note.id} className="text-sm border-t border-[var(--tama-ink)] py-2">{note.actorType}: {note.message} {note.tags?.join(', ')}</p>)}
                    {appMode === 'interactive' && <><textarea className="field-note-input w-full min-h-[86px] px-4 py-3" value={petResponse} onChange={(event) => setPetResponse(event.target.value)} placeholder={t(selectedLanguage, 'fieldNotePlaceholder')} maxLength={180} /><button className="mt-3 mode-primary px-5 py-3" type="button" onClick={() => { const response = petResponse.trim(); if (!response) return; petStore.addInteraction(selectedDispatchPet.id, { actorType: 'player', actorId: playerProfile?.name, message: response, tags: ['field-note'], deltaStats: { social: 4, learning: 2, tension: -1 } }); setPetResponse(''); setDispatchedPets(petStore.listPets()); setSelectedDispatchPet(petStore.listPets().find((pet) => pet.id === selectedDispatchPet.id) ?? null); }}>{t(selectedLanguage, 'sendFieldNote')}</button></>}
                    <p className="text-sm mt-4 opacity-80">{t(selectedLanguage, 'localOnlyNotice')}</p>
                  </>
                );
              })() : selectedNpcInfo && (
                <>
                  <p className="text-sm">NPC</p>
                  <h2 className="text-lg mb-3">{selectedNpcInfo.name}</h2>
                  <p className="text-sm mb-3">{selectedNpcInfo.role}</p>
                  <p className="text-base leading-snug">{selectedNpcInfo.intro}</p>
                  {appMode === 'dispatch_observer' && <p className="text-sm mt-4">{t(selectedLanguage, 'observerMode')} · {t(selectedLanguage, 'localOnlyNotice')}</p>}
                </>
              )}
            </section>
          )}

          {shouldShowMobileStatsBar && (
            <button className="mobile-stats-bar" type="button" onClick={() => setMobileRulesOpen(true)} data-no-mobile-drag="true">
              <span>🐣 {archiveSummary.active}</span><span>💬 {archiveSummary.notes}</span><span>S {Math.round(activeDispatchPets.reduce((sum, pet) => sum + pet.stats.social, 0) / Math.max(1, activeDispatchPets.length))}</span><span>L {Math.round(activeDispatchPets.reduce((sum, pet) => sum + pet.stats.learning, 0) / Math.max(1, activeDispatchPets.length))}</span><span>T {Math.round(activeDispatchPets.reduce((sum, pet) => sum + pet.stats.tension, 0) / Math.max(1, activeDispatchPets.length))}</span><span>R {simSnapshot?.tick ?? 0}</span>
            </button>
          )}

          {mobileRulesOpen && (
            <section className="mobile-rules-drawer" data-no-mobile-drag="true">
              <button className="float-right text-xl" type="button" onClick={() => setMobileRulesOpen(false)}>×</button>
              <h2 className="text-lg mb-3">{t(selectedLanguage, 'dispatchArchive')}</h2>
              <p className="text-sm mb-2">{t(selectedLanguage, 'active')}: {archiveSummary.active} · {t(selectedLanguage, 'hibernating')}: {archiveSummary.hibernating} · {t(selectedLanguage, 'archived')}: {archiveSummary.archived}</p>
              <p className="text-sm">{t(selectedLanguage, 'localOnlyNotice')}</p>
            </section>
          )}

          {selectedPet && (
            <section className="question-response-panel absolute right-12 bottom-12 z-51 w-[min(520px,calc(100vw-24px))] px-8 py-7" data-no-mobile-drag="true">
              <button className="float-right text-xl" type="button" onClick={() => setSelectedPet(null)}>x</button>
              <div className="flex gap-5 items-start mb-5"><QuestionPetPreview question={selectedPet.question.text} appearance={selectedPet.appearance} size={6} /><div><p className="text-sm">originating question</p><h2 className="text-lg leading-snug">{selectedPet.question.text}</h2></div></div>
              <textarea className="w-full min-h-[110px] bg-[var(--palette-cream)] border-4 border-[var(--palette-blue)] text-[var(--palette-ink)] px-4 py-4 text-lg" value={petResponse} onChange={(event) => setPetResponse(event.target.value)} placeholder={selectedLanguage === 'zh-TW' ? '回應這隻問題電子雞...' : 'Respond to this question pet...'} />
              <button className="mt-4 bg-[var(--palette-pink)] border-4 border-[var(--palette-blue)] text-[var(--palette-ink)] px-6 py-4 text-lg" type="button" onClick={() => {
                const response = petResponse.trim();
                if (!response) return;
                setSimSnapshot((current) => current ? applyPlayerThrongletResponse(current, selectedPet.id, response) : current);
                setPetResponse('');
                setSelectedPet(null);
              }}>{selectedLanguage === 'zh-TW' ? '送出回應' : 'Send Response'}</button>
            </section>
          )}

          {showMobileControls && playerProfile && appMode === 'interactive' && !activeDialoguePersona && (
            <div
              className="mobile-thumb-guide absolute z-46 pointer-events-none -translate-x-1/2 text-center"
              style={{
                left: `calc(${MOBILE_THUMB_GUIDE_CENTER_LEFT_PX}px + env(safe-area-inset-left))`,
                bottom: `calc(${MOBILE_THUMB_GUIDE_BOTTOM_PX}px + env(safe-area-inset-bottom))`,
              }}
            >
              <div className="mx-auto h-42 w-42 rounded-full border border-white/20 bg-black/20" />
            </div>
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

      {/* Hooks first-run tooltip */}
      {playerProfile && !hooksInfoShown && !hooksTooltipDismissed && (
        <Tooltip
          title="Instant Detection Active"
          position="top-right"
          onDismiss={() => {
            setHooksTooltipDismissed(true);
            vscode.postMessage({ type: 'setHooksInfoShown' });
          }}
        >
          <span className="text-sm text-text leading-none">
            Wander 桃花源 and talk with nearby personas.{' '}
            <span
              className="text-accent cursor-pointer underline"
              onClick={() => {
                setIsHooksInfoOpen(true);
                setHooksTooltipDismissed(true);
                vscode.postMessage({ type: 'setHooksInfoShown' });
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
          <div className="text-base text-text px-10" style={{ lineHeight: 1.4 }}>
            <p className="mb-8">This world is now a WorkAdventure-style Peach Blossom Spring map:</p>
            <ul className="mb-8 pl-18 list-disc m-0">
              <li className="text-sm mb-2">Wander through a tiny LCD river, peach grove, archive tree, and story circle</li>
              <li className="text-sm mb-2">Approach a persona and press Space to talk</li>
              <li className="text-sm mb-2">Visit the archive tree for the full index and portal links</li>
            </ul>
            <p className="mb-12 text-text-muted">
              Pixel Agents remains visual inspiration for lively characters, while the world direction is
              now Peach Blossom Spring / 桃花源.
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
              To disable, go to Settings {'>'} Instant Detection
            </p>
          </div>
        </Modal>
      )}

      {playerProfile && !showMobileControls && (
        <VersionIndicator
          currentVersion={extensionVersion}
          lastSeenVersion={lastSeenVersion}
          onDismiss={handleWhatsNewDismiss}
          onOpenChangelog={handleOpenChangelog}
        />
      )}

      {playerProfile && (
        <ChangelogModal
          isOpen={isChangelogOpen}
          onClose={() => setIsChangelogOpen(false)}
          currentVersion={extensionVersion}
        />
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
            vscode.postMessage({ type: 'setWatchAllSessions', enabled: newVal });
          }}
          hooksEnabled={hooksEnabled}
          onToggleHooksEnabled={() => {
            const newVal = !hooksEnabled;
            setHooksEnabled(newVal);
            vscode.postMessage({ type: 'setHooksEnabled', enabled: newVal });
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
