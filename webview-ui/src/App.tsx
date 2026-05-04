import { useCallback, useEffect, useRef, useState } from 'react';

import { toMajorMinor } from './changelogData.js';
import { ChangelogModal } from './components/ChangelogModal.js';
import { DebugView } from './components/DebugView.js';
import { EditActionBar } from './components/EditActionBar.js';
import { MigrationNotice } from './components/MigrationNotice.js';
import { PlayerSetup, type PlayerProfile } from './components/PlayerSetup.js';
import { RpgDialogue } from './components/RpgDialogue.js';
import { SettingsModal } from './components/SettingsModal.js';
import { Tooltip } from './components/Tooltip.js';
import { Modal } from './components/ui/Modal.js';
import { VersionIndicator } from './components/VersionIndicator.js';
import { useEditorActions } from './hooks/useEditorActions.js';
import { useEditorKeyboard } from './hooks/useEditorKeyboard.js';
import { useExtensionMessages } from './hooks/useExtensionMessages.js';
import { OfficeCanvas } from './office/components/OfficeCanvas.js';
import { EditorState } from './office/editor/editorState.js';
import { EditorToolbar } from './office/editor/EditorToolbar.js';
import { OfficeState } from './office/engine/officeState.js';
import { isRotatable } from './office/layout/furnitureCatalog.js';
import { EditTool, TILE_SIZE } from './office/types.js';
import { isBrowserRuntime } from './runtime.js';
import { vscode } from './vscodeApi.js';
import personaData from '../../data/personas.json';

interface Persona {
  id: string;
  name: string;
  role: string;
  intro: string;
  responses: Record<string, string>;
}

const personas = personaData.personas as Persona[];

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
const TREE_TILE = { col: 4, row: 4 };

function readPlayerProfile(): PlayerProfile | null {
  try {
    const raw = localStorage.getItem('peach_player_profile');
    return raw ? (JSON.parse(raw) as PlayerProfile) : null;
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
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(() =>
    readPlayerProfile(),
  );
  const [nearbyNpcId, setNearbyNpcId] = useState<number | null>(null);
  const [activeDialogueId, setActiveDialogueId] = useState<number | null>(null);
  const [isNearTree, setIsNearTree] = useState(false);
  const [, setPlayerMoveTick] = useState(0);

  const currentMajorMinor = toMajorMinor(extensionVersion);

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
    // If clicked agent is a sub-agent, focus the parent's terminal instead
    const os = getOfficeState();
    const meta = os.subagentMeta.get(agentId);
    const focusId = meta ? meta.parentAgentId : agentId;
    vscode.postMessage({ type: 'focusAgent', id: focusId });
  }, []);

  const officeState = getOfficeState();
  const nearbyPersona = nearbyNpcId ? personas[nearbyNpcId - 1] : null;
  const activeDialoguePersona = activeDialogueId ? personas[activeDialogueId - 1] : null;

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
    officeState.addPlayer(PLAYER_ID, playerProfile.palette, playerProfile.name);
    officeState.cameraFollowId = PLAYER_ID;
  }, [layoutReady, officeState, playerProfile]);

  useEffect(() => {
    if (!layoutReady || !playerProfile) return;
    const interval = window.setInterval(() => {
      const player = officeState.characters.get(PLAYER_ID);
      const nearbyId = findNearbyNpc();
      setNearbyNpcId(nearbyId);
      if (player && nearbyId) {
        officeState.faceCharacterToward(nearbyId, player.tileCol, player.tileRow);
      }
      const nearTree = player
        ? Math.abs(player.tileCol - TREE_TILE.col) + Math.abs(player.tileRow - TREE_TILE.row) <= 2
        : false;
      setIsNearTree(nearTree);
    }, 250);
    return () => window.clearInterval(interval);
  }, [findNearbyNpc, layoutReady, officeState, playerProfile]);

  useEffect(() => {
    if (!layoutReady || !playerProfile) return;

    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
      if (activeDialogueId !== null && event.key !== 'Escape') return;

      let moved = false;
      if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') {
        moved = officeState.movePlayerBy(PLAYER_ID, 0, -1);
      } else if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') {
        moved = officeState.movePlayerBy(PLAYER_ID, 0, 1);
      } else if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
        moved = officeState.movePlayerBy(PLAYER_ID, -1, 0);
      } else if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
        moved = officeState.movePlayerBy(PLAYER_ID, 1, 0);
      } else if (event.key === 'Escape') {
        setActiveDialogueId(null);
      } else if (event.code === 'Space') {
        if (nearbyNpcId !== null) {
          event.preventDefault();
          officeState.selectedAgentId = nearbyNpcId;
          setActiveDialogueId(nearbyNpcId);
        }
        return;
      }

      if (moved) {
        event.preventDefault();
        setPlayerMoveTick((tick) => tick + 1);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDialogueId, layoutReady, nearbyNpcId, officeState, playerProfile]);

  const handlePlayerStart = useCallback((profile: PlayerProfile) => {
    localStorage.setItem('peach_player_profile', JSON.stringify(profile));
    setPlayerProfile(profile);
  }, []);

  // Force dependency on editorTickForKeyboard to propagate keyboard-triggered re-renders
  void editorTickForKeyboard;

  const promptPosition = (() => {
    if (!nearbyNpcId || !containerRef.current) return null;
    const ch = officeState.characters.get(nearbyNpcId);
    if (!ch) return null;
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
      left: (deviceOffsetX + ch.x * editor.zoom) / dpr,
      top: (deviceOffsetY + (ch.y - 34) * editor.zoom) / dpr,
    };
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

  if (!layoutReady) {
    return <div className="w-full h-full flex items-center justify-center ">Loading...</div>;
  }

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
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

          {nearbyPersona && !activeDialoguePersona && promptPosition && (
            <div
              className="absolute z-44 -translate-x-1/2 -translate-y-full pixel-panel px-8 py-5 text-center text-text pointer-events-none"
              style={{ left: promptPosition.left, top: promptPosition.top, opacity: 0.5 }}
            >
              <p className="text-sm leading-snug">{nearbyPersona.name}: 想聊聊嗎？</p>
              <p className="text-xs text-accent-bright mt-2">按 Space 交談</p>
            </div>
          )}

          {isNearTree && !activeDialoguePersona && (
            <section className="absolute right-12 top-12 z-43 w-[min(420px,calc(100vw-24px))] max-h-[calc(100vh-96px)] overflow-auto pixel-panel px-12 py-10 text-text shadow-pixel">
              <p className="text-xs uppercase tracking-wide text-accent-bright mb-3">
                Big tree archive
              </p>
              <h1 className="text-2xl leading-none mb-3">NGM persona index</h1>
              <p className="text-sm text-text-muted mb-8">
                這棵大樹保存 14 位獨立社群組織者的 persona 設定。離開大樹後介面會收起。
              </p>
              <div className="flex flex-col gap-6">
                {personas.map((persona) => (
                  <details key={persona.id} className="border border-border bg-bg/70 px-7 py-5">
                    <summary className="cursor-pointer text-sm text-accent-bright">
                      {persona.name} / {persona.role}
                    </summary>
                    <p className="mt-5 text-sm leading-snug text-text-muted">{persona.intro}</p>
                    <div className="mt-5 flex flex-col gap-3">
                      {Object.entries(persona.responses).map(([topic, answer]) => (
                        <p key={topic} className="text-xs leading-snug text-text-muted">
                          <span className="text-accent-bright">{topicLabels[topic] ?? topic}: </span>
                          {answer}
                        </p>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}

          {activeDialoguePersona && playerProfile && (
            <RpgDialogue
              persona={activeDialoguePersona}
              player={playerProfile}
              onClose={() => setActiveDialogueId(null)}
            />
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
      {!hooksInfoShown && !hooksTooltipDismissed && (
        <Tooltip
          title="Instant Detection Active"
          position="top-right"
          onDismiss={() => {
            setHooksTooltipDismissed(true);
            vscode.postMessage({ type: 'setHooksInfoShown' });
          }}
        >
          <span className="text-sm text-text leading-none">
            Your agents now respond in real-time.{' '}
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
      <Modal
        isOpen={isHooksInfoOpen}
        onClose={() => setIsHooksInfoOpen(false)}
        title="Instant Detection is ON"
        zIndex={52}
      >
        <div className="text-base text-text px-10" style={{ lineHeight: 1.4 }}>
          <p className="mb-8">Your Pixel Agents office now reacts in real-time:</p>
          <ul className="mb-8 pl-18 list-disc m-0">
            <li className="text-sm mb-2">Permission prompts appear instantly</li>
            <li className="text-sm mb-2">Turn completions detected the moment they happen</li>
            <li className="text-sm mb-2">Sound notifications play immediately</li>
          </ul>
          <p className="mb-12 text-text-muted">
            This works through Claude Code Hooks, small event listeners that notify Pixel Agents
            whenever something happens in your Claude sessions.
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

      <VersionIndicator
        currentVersion={extensionVersion}
        lastSeenVersion={lastSeenVersion}
        onDismiss={handleWhatsNewDismiss}
        onOpenChangelog={handleOpenChangelog}
      />

      <ChangelogModal
        isOpen={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
        currentVersion={extensionVersion}
      />

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

      {showMigrationNotice && (
        <MigrationNotice onDismiss={() => setMigrationNoticeDismissed(true)} />
      )}

      {!playerProfile && <PlayerSetup onStart={handlePlayerStart} />}
    </div>
  );
}

export default App;
