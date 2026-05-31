import { isBrowserRuntime } from './runtime';
import type { OfficeLayout } from './office/types.js';

declare function acquireVsCodeApi(): { postMessage(msg: unknown): void };

const BROWSER_EDITOR_LAYOUT_KEY = 'pbs:editor-layout:v1';

function safeLayoutFilename(filename?: string): string {
  const raw = (filename ?? '').trim() || 'pbs-map.json';
  const base = raw.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/^-+|-+$/g, '');
  return (base || 'pbs-map').endsWith('.json') ? (base || 'pbs-map.json') : `${base || 'pbs-map'}.json`;
}

function downloadLayout(layout: OfficeLayout, filename?: string): void {
  const blob = new Blob([`${JSON.stringify(layout, null, 2)}\n`], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeLayoutFilename(filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function saveLayoutFallback(layout: OfficeLayout): void {
  window.localStorage.setItem(BROWSER_EDITOR_LAYOUT_KEY, JSON.stringify(layout));
}

async function saveBrowserLayout(layout: OfficeLayout, filename?: string): Promise<void> {
  if (!import.meta.env.DEV) {
    saveLayoutFallback(layout);
    downloadLayout(layout, filename);
    return;
  }
  try {
    const response = await fetch('/api/editor-layout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: safeLayoutFilename(filename), layout }),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status.toString()}`);
    }
    console.log(`[Editor] Saved layout to webview-ui/public/assets/${safeLayoutFilename(filename)}`);
    window.localStorage.removeItem(BROWSER_EDITOR_LAYOUT_KEY);
  } catch (error) {
    saveLayoutFallback(layout);
    downloadLayout(layout, filename);
    console.log('[Editor] Saved layout to localStorage fallback', error);
  }
}

function handleBrowserPostMessage(msg: unknown): void {
  console.log('[vscode.postMessage]', msg);
  if (!msg || typeof msg !== 'object') return;
  const payload = msg as { type?: string; layout?: OfficeLayout; persistToFile?: boolean; filename?: string };
  if (payload.type === 'saveLayout' && payload.layout) {
    if (payload.persistToFile) {
      void saveBrowserLayout(payload.layout, payload.filename);
    } else {
      saveLayoutFallback(payload.layout);
    }
  }
}

export const vscode: { postMessage(msg: unknown): void } = isBrowserRuntime
  ? { postMessage: handleBrowserPostMessage }
  : (acquireVsCodeApi() as { postMessage(msg: unknown): void });

export { BROWSER_EDITOR_LAYOUT_KEY };
