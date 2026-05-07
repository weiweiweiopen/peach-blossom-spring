import { locales, supportedLanguages } from '../src/i18n/index.ts';

function flatten(value, prefix = '', output = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Invalid locale subtree at ${prefix || '<root>'}`);
  }
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof child === 'string') {
      output[path] = child;
    } else if (child && typeof child === 'object' && !Array.isArray(child)) {
      flatten(child, path, output);
    } else {
      throw new Error(`Invalid translation value at ${path}: ${String(child)}`);
    }
  }
  return output;
}

const [baseLanguage] = supportedLanguages;
const baseCode = baseLanguage.code;
const base = flatten(locales[baseCode]);
const baseKeys = Object.keys(base).sort();
let hasFailure = false;

for (const { code } of supportedLanguages) {
  const current = flatten(locales[code]);
  const currentKeys = Object.keys(current).sort();
  const missing = baseKeys.filter((key) => !(key in current));
  const extra = currentKeys.filter((key) => !(key in base));
  const empty = currentKeys.filter((key) => current[key].trim().length === 0);
  const invalid = currentKeys.filter((key) => current[key] === undefined || current[key] === null);

  if (missing.length || extra.length || empty.length || invalid.length) {
    hasFailure = true;
    console.error(`\n[i18n] ${code} failed:`);
    if (missing.length) console.error(`  Missing keys: ${missing.join(', ')}`);
    if (extra.length) console.error(`  Extra keys: ${extra.join(', ')}`);
    if (empty.length) console.error(`  Empty strings: ${empty.join(', ')}`);
    if (invalid.length) console.error(`  Invalid values: ${invalid.join(', ')}`);
  }
}

if (hasFailure) {
  process.exitCode = 1;
} else {
  console.log(`[i18n] ${supportedLanguages.length} locales match ${baseKeys.length} keys with no empty values.`);
}
