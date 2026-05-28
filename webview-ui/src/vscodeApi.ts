import { isBrowserRuntime } from './runtime';
import type { OfficeLayout } from './office/types.js';

declare function acquireVsCodeApi(): { postMessage(msg: unknown): void };

const BROWSER_EDITOR_LAYOUT_KEY = 'pbs:editor-layout:v1';

function handleBrowserPostMessage(msg: unknown): void {
  console.log('[vscode.postMessage]', msg);
  if (!msg || typeof msg !== 'object') return;
  const payload = msg as { type?: string; layout?: OfficeLayout };
  if (payload.type === 'saveLayout' && payload.layout) {
    window.localStorage.setItem(BROWSER_EDITOR_LAYOUT_KEY, JSON.stringify(payload.layout));
  }
}

export const vscode: { postMessage(msg: unknown): void } = isBrowserRuntime
  ? { postMessage: handleBrowserPostMessage }
  : (acquireVsCodeApi() as { postMessage(msg: unknown): void });

export { BROWSER_EDITOR_LAYOUT_KEY };
