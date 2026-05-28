import { useState } from 'react';

import { isSoundEnabled, setSoundEnabled } from '../notificationSound.js';
import { isBrowserRuntime } from '../runtime.js';
import { vscode } from '../vscodeApi.js';
import { Button } from './ui/Button.js';
import { Checkbox } from './ui/Checkbox.js';
import { MenuItem } from './ui/MenuItem.js';
import { Modal } from './ui/Modal.js';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDebugMode: boolean;
  onToggleDebugMode: () => void;
  alwaysShowOverlay: boolean;
  onToggleAlwaysShowOverlay: () => void;
  externalAssetDirectories: string[];
  watchAllSessions: boolean;
  onToggleWatchAllSessions: () => void;
  hooksEnabled: boolean;
  onToggleHooksEnabled: () => void;
  editorMode?: boolean;
}

export function SettingsModal({
  isOpen,
  onClose,
  isDebugMode,
  onToggleDebugMode,
  alwaysShowOverlay,
  onToggleAlwaysShowOverlay,
  externalAssetDirectories,
  watchAllSessions,
  onToggleWatchAllSessions,
  hooksEnabled,
  onToggleHooksEnabled,
  editorMode = false,
}: SettingsModalProps) {
  const [soundLocal, setSoundLocal] = useState(isSoundEnabled);
  const hideExtensionOnly = isBrowserRuntime || editorMode;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      {!hideExtensionOnly && (
        <>
          <MenuItem
            onClick={() => {
              vscode.postMessage({ type: 'openSessionsFolder' });
              onClose();
            }}
          >
            Open Sessions Folder
          </MenuItem>
          <MenuItem
            onClick={() => {
              vscode.postMessage({ type: 'exportLayout' });
              onClose();
            }}
          >
            Export Layout
          </MenuItem>
          <MenuItem
            onClick={() => {
              vscode.postMessage({ type: 'importLayout' });
              onClose();
            }}
          >
            Import Layout
          </MenuItem>
          <MenuItem
            onClick={() => {
              vscode.postMessage({ type: 'addExternalAssetDirectory' });
              onClose();
            }}
          >
            Add Asset Directory
          </MenuItem>
        </>
      )}
      {hideExtensionOnly && (
        <div className="px-10 py-4 text-xs text-text-muted">
          Browser editor mode saves layouts locally in this browser. Extension-only session and asset-directory commands are hidden here.
        </div>
      )}
      {!hideExtensionOnly && externalAssetDirectories.map((dir) => (
        <div key={dir} className="flex items-center justify-between py-4 px-10 gap-8">
          <span
            className="text-xs text-text-muted overflow-hidden text-ellipsis whitespace-nowrap"
            title={dir}
          >
            {dir.split(/[/\\]/).pop() ?? dir}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => vscode.postMessage({ type: 'removeExternalAssetDirectory', path: dir })}
            className="shrink-0"
          >
            x
          </Button>
        </div>
      ))}
      <Checkbox
        label="Sound Notifications"
        checked={soundLocal}
        onChange={() => {
          const newVal = !isSoundEnabled();
          setSoundEnabled(newVal);
          setSoundLocal(newVal);
          vscode.postMessage({ type: 'setSoundEnabled', enabled: newVal });
        }}
      />
      {!hideExtensionOnly && (
        <>
          <Checkbox
            label="Watch All Sessions"
            checked={watchAllSessions}
            onChange={onToggleWatchAllSessions}
          />
          <Checkbox
            label="Instant Detection (Hooks)"
            checked={hooksEnabled}
            onChange={onToggleHooksEnabled}
          />
        </>
      )}
      <Checkbox
        label="Always Show Labels"
        checked={alwaysShowOverlay}
        onChange={onToggleAlwaysShowOverlay}
      />
      {!editorMode && <Checkbox label="Debug View" checked={isDebugMode} onChange={onToggleDebugMode} />}
    </Modal>
  );
}
