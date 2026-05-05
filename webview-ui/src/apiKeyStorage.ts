const DEEPSEEK_API_KEY_STORAGE_KEYS = [
  'peach_deepseek_api_key',
  'deepseek_api_key',
  'pbs_deepseek_api_key',
  'solar_oracle_walkman_api_key',
  'solar_oracle_api_key',
];

export function readStoredDeepSeekApiKey(): string {
  try {
    for (const key of DEEPSEEK_API_KEY_STORAGE_KEYS) {
      const stored = localStorage.getItem(key)?.trim();
      if (stored) return stored;
      const sessionStored = sessionStorage.getItem(key)?.trim();
      if (sessionStored) return sessionStored;
    }
    return '';
  } catch {
    return '';
  }
}

export function writeStoredDeepSeekApiKey(apiKey: string): void {
  const trimmed = apiKey.trim();
  if (!trimmed) return;
  try {
    for (const key of DEEPSEEK_API_KEY_STORAGE_KEYS) {
      localStorage.setItem(key, trimmed);
      sessionStorage.setItem(key, trimmed);
    }
  } catch {
    // Ignore storage failures so the current dialogue can still use the in-memory key.
  }
}

export function clearStoredDeepSeekApiKey(): void {
  try {
    for (const key of DEEPSEEK_API_KEY_STORAGE_KEYS) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
  } catch {
    // Ignore storage failures so the current dialogue can still continue in memory.
  }
}

export function getInitialDeepSeekApiKey(): string {
  const stored = readStoredDeepSeekApiKey();
  if (stored) return stored;
  return import.meta.env.VITE_DEEPSEEK_API_KEY?.trim() ?? '';
}
