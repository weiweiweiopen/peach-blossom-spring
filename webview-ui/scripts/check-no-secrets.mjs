import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = path.resolve(import.meta.dirname, '..', '..');
const scanTargets = [
  path.join(repoRoot, 'webview-ui', 'src'),
  path.join(repoRoot, 'data'),
  path.join(repoRoot, 'docs'),
];
const rootFiles = [
  path.join(repoRoot, '.gitignore'),
  path.join(repoRoot, 'package.json'),
  path.join(repoRoot, 'webview-ui', 'package.json'),
  path.join(repoRoot, 'webview-ui', 'API_KEYS.md'),
  path.join(repoRoot, 'webview-ui', '.env.example'),
];
const ignoredDirNames = new Set(['node_modules', 'dist', '.git']);
const ignoredFileNames = new Set(['.env.local']);
const textExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.md', '.txt', '.yml', '.yaml', '.html', '.css', '.scss', '.env', '.example']);
const suspiciousPatterns = [
  /sk-[A-Za-z0-9]{16,}/g,
  /DEEPSEEK_API_KEY\s*=\s*sk-[A-Za-z0-9]+/g,
  /VITE_DEEPSEEK_API_KEY\s*=\s*sk-[A-Za-z0-9]+/g,
];

function shouldIgnore(filePath) {
  const base = path.basename(filePath);
  if (ignoredFileNames.has(base)) return true;
  if (base.endsWith('.local')) return true;
  return false;
}

function shouldReadFile(filePath) {
  return textExtensions.has(path.extname(filePath).toLowerCase()) || rootFiles.includes(filePath);
}

function collectFiles(targetPath, results) {
  if (!fs.existsSync(targetPath) || shouldIgnore(targetPath)) return;
  const stat = fs.statSync(targetPath);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(targetPath, { withFileTypes: true })) {
      if (ignoredDirNames.has(entry.name)) continue;
      collectFiles(path.join(targetPath, entry.name), results);
    }
    return;
  }
  if (shouldReadFile(targetPath)) results.push(targetPath);
}

const files = [];
for (const target of scanTargets) collectFiles(target, files);
for (const file of rootFiles) {
  if (fs.existsSync(file) && !shouldIgnore(file)) files.push(file);
}

const findings = [];
for (const filePath of files) {
  const text = fs.readFileSync(filePath, 'utf8');
  for (const pattern of suspiciousPatterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      findings.push({ filePath, match: match[0] });
    }
  }
}

if (findings.length > 0) {
  console.error('Suspicious secret-like strings found:');
  for (const finding of findings) {
    console.error(`- ${path.relative(repoRoot, finding.filePath)}: ${finding.match}`);
  }
  process.exit(1);
}

console.log(`Secret scan passed across ${files.length.toString()} files.`);
