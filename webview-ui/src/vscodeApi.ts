import { isBrowserRuntime } from './runtime';
import type { OfficeLayout } from './office/types.js';

declare function acquireVsCodeApi(): { postMessage(msg: unknown): void };

const BROWSER_EDITOR_LAYOUT_KEY = 'pbs:editor-layout:v1';

function saveLayoutFallback(layout: OfficeLayout): void {
  window.localStorage.setItem(BROWSER_EDITOR_LAYOUT_KEY, JSON.stringify(layout));
}

async function saveBrowserLayout(layout: OfficeLayout): Promise<void> {
  if (!import.meta.env.DEV) {
    saveLayoutFallback(layout);
    return;
  }
  try {
    const response = await fetch('/api/editor-layout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(layout),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status.toString()}`);
    }
    console.log('[Editor] Saved layout to webview-ui/public/assets/pbs-editor-layout.json');
    window.localStorage.removeItem(BROWSER_EDITOR_LAYOUT_KEY);
  } catch (error) {
    saveLayoutFallback(layout);
    console.log('[Editor] Saved layout to localStorage fallback', error);
  }
}

function handleBrowserPostMessage(msg: unknown): void {
  console.log('[vscode.postMessage]', msg);
  if (!msg || typeof msg !== 'object') return;
  const payload = msg as { type?: string; layout?: OfficeLayout; persistToFile?: boolean };
  if (payload.type === 'saveLayout' && payload.layout) {
    if (payload.persistToFile) {
      void saveBrowserLayout(payload.layout);
    } else {
      saveLayoutFallback(payload.layout);
    }
  }
}

export const vscode: { postMessage(msg: unknown): void } = isBrowserRuntime
  ? { postMessage: handleBrowserPostMessage }
  : (acquireVsCodeApi() as { postMessage(msg: unknown): void });

export { BROWSER_EDITOR_LAYOUT_KEY };
