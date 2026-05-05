const DEEPSEEK_API_KEY_STORAGE_KEY = 'peach_deepseek_api_key';

export function readStoredDeepSeekApiKey(): string {
  try {
    return localStorage.getItem(DEEPSEEK_API_KEY_STORAGE_KEY)?.trim() ?? '';
  } catch {
    return '';
  }
}

export function writeStoredDeepSeekApiKey(apiKey: string): void {
  const trimmed = apiKey.trim();
  if (!trimmed) return;
  try {
    localStorage.setItem(DEEPSEEK_API_KEY_STORAGE_KEY, trimmed);
  } catch {
    // Ignore storage failures so the current dialogue can still use the in-memory key.
  }
}

export function getInitialDeepSeekApiKey(): string {
  const stored = readStoredDeepSeekApiKey();
  if (stored) return stored;

  const seeded = import.meta.env.VITE_DEEPSEEK_API_KEY?.trim() ?? '';
  if (seeded) writeStoredDeepSeekApiKey(seeded);
  return seeded;
}
