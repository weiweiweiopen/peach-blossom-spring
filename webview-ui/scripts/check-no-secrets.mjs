import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd(), '..');
const targets = [
  path.join(process.cwd(), 'src'),
  path.join(root, 'data'),
  path.join(root, 'docs'),
  path.join(root, '.gitignore'),
  path.join(root, 'package.json'),
  path.join(process.cwd(), 'package.json'),
  path.join(process.cwd(), '.env.example'),
  path.join(process.cwd(), 'API_KEYS.md'),
];

const ignoreNames = new Set(['node_modules', 'dist', '.git']);
const suspiciousPatterns = [
  /sk-[A-Za-z0-9]{16,}/g,
  /DEEPSEEK_API_KEY\s*=\s*sk-/g,
];

function walk(entry, out = []) {
  if (!fs.existsSync(entry)) return out;
  const stat = fs.statSync(entry);
  if (stat.isFile()) {
    out.push(entry);
    return out;
  }
  for (const name of fs.readdirSync(entry)) {
    if (ignoreNames.has(name) || name === '.env.local') continue;
    const full = path.join(entry, name);
    const rel = path.relative(root, full).replace(/\\/g, '/');
    if (/\.env\..+\.local$/.test(name) || rel.endsWith('/.env.local')) continue;
    walk(full, out);
  }
  return out;
}

const files = targets.flatMap((target) => walk(target));
const findings = [];

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  for (const pattern of suspiciousPatterns) {
    const matches = text.match(pattern);
    if (matches?.length) {
      findings.push({ file: path.relative(root, file), pattern: pattern.toString(), count: matches.length });
    }
  }
}

if (findings.length > 0) {
  console.error('Potential secrets detected:');
  for (const finding of findings) {
    console.error(`- ${finding.file}: ${finding.pattern} (${finding.count})`);
  }
  process.exit(1);
}

console.log('No hardcoded secrets detected.');
