import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(new URL('../..', import.meta.url).pathname);
const sourcePath = path.join(repoRoot, 'webview-ui/src/generated/pbsLocalMemory.json');
const outPath = path.join(repoRoot, 'pbs-engine-worker/seed.sql');
const data = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const items = Array.isArray(data.items) ? data.items : [];

function sql(value) {
  return String(value ?? '').replace(/'/g, "''");
}

const lines = [
  '.read schema.sql',
  'BEGIN TRANSACTION;',
];
for (const item of items) {
  lines.push(`INSERT INTO memory (title, body, path, source_family, url) VALUES ('${sql(item.title)}', '${sql(item.description)}', '${sql(item.path)}', '${sql(item.sourceFamily)}', '${sql(item.url)}');`);
}
lines.push('COMMIT;');
fs.writeFileSync(outPath, `${lines.join('\n')}\n`);
console.log(`Wrote ${outPath} with ${items.length} rows`);
