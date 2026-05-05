import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';

import {
  clearStoredDeepSeekApiKey,
  hasStoredDeepSeekApiKey,
  maskApiKeyForDebug,
  readStoredDeepSeekApiKey,
  writeStoredDeepSeekApiKey,
} from '../src/apiKeyStorage.ts';

function createStorage() {
  const map = new Map<string, string>();
  return {
    getItem(key: string) {
      return map.has(key) ? map.get(key) ?? null : null;
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
    removeItem(key: string) {
      map.delete(key);
    },
    clear() {
      map.clear();
    },
  };
}

beforeEach(() => {
  Object.assign(globalThis, {
    localStorage: createStorage(),
    sessionStorage: createStorage(),
  });
});

test('writes and reads DeepSeek API keys from local storage aliases', () => {
  writeStoredDeepSeekApiKey('sk-test-key-1234567890abcd');

  assert.equal(hasStoredDeepSeekApiKey(), true);
  assert.equal(readStoredDeepSeekApiKey(), 'sk-test-key-1234567890abcd');
});

test('clears stored DeepSeek API keys across aliases', () => {
  writeStoredDeepSeekApiKey('sk-test-key-1234567890abcd');
  clearStoredDeepSeekApiKey();

  assert.equal(hasStoredDeepSeekApiKey(), false);
  assert.equal(readStoredDeepSeekApiKey(), '');
});

test('masks API keys without exposing the full value', () => {
  assert.equal(maskApiKeyForDebug('sk-test-key-1234567890abcd'), 'sk-...abcd');
});
