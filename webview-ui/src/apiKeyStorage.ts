const DEEPSEEK_API_KEY_STORAGE_KEYS = [
  'peach_deepseek_api_key',
  'deepseek_api_key',
  'deepseek_api',
  'deepseekApiKey',
  'deepseek-api-key',
  'DEEPSEEK_API_KEY',
  'VITE_DEEPSEEK_API_KEY',
  'pbs_deepseek_api_key',
  'solar_oracle_walkman_api_key',
  'solar_oracle_api_key',
];

function readEnvDeepSeekApiKey(): string {
  const viteEnv = (import.meta as ImportMeta & { env?: { VITE_DEEPSEEK_API_KEY?: string } }).env;
  return viteEnv?.VITE_DEEPSEEK_API_KEY?.trim() ?? '';
}

export function readStoredDeepSeekApiKey(): string {
  try {
    for (const key of DEEPSEEK_API_KEY_STORAGE_KEYS) {
      const stored = localStorage.getItem(key)?.trim();
      if (stored) return stored;
      const sessionStored = sessionStorage.getItem(key)?.trim();
      if (sessionStored) return sessionStored;
    }

    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const trimmedRaw = raw.trim();
      if (/^sk-[A-Za-z0-9]{16,}$/.test(trimmedRaw)) {
        return trimmedRaw;
      }

      try {
        const parsed = JSON.parse(trimmedRaw) as Record<string, unknown>;
        for (const candidateKey of ['apiKey', 'deepseekApiKey', 'deepseek_api_key']) {
          const candidate = parsed[candidateKey];
          if (typeof candidate === 'string' && /^sk-[A-Za-z0-9]{16,}$/.test(candidate.trim())) {
            return candidate.trim();
          }
        }
      } catch {
        // Ignore non-JSON values.
      }
    }
  } catch {
    return '';
  }
  return '';
}

export function hasStoredDeepSeekApiKey(): boolean {
  return readStoredDeepSeekApiKey().length > 0;
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
    // Ignore storage failures so dialogue can still continue with the in-memory key.
  }
}

export function clearStoredDeepSeekApiKey(): void {
  try {
    for (const key of DEEPSEEK_API_KEY_STORAGE_KEYS) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
  } catch {
    // Ignore storage failures so dialogue state does not crash.
  }
}

export function maskApiKeyForDebug(apiKey: string): string {
  const trimmed = apiKey.trim();
  if (!trimmed) return '';
  if (trimmed.length <= 6) return '***';
  return `sk-...${trimmed.slice(-4)}`;
}

export function getInitialDeepSeekApiKey(): string {
  const stored = readStoredDeepSeekApiKey();
  if (stored) return stored;
  return readEnvDeepSeekApiKey();
}
