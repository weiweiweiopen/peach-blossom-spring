import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { normalizeText, type SourceCorpus, type SourceDocument } from '../src/evidence/sourceCorpus.js';

export function buildSourceCorpus(repoRoot: string, revision = process.env.GITHUB_SHA || 'main'): SourceCorpus {
  const root = path.join(repoRoot, 'Sources/Raw');
  const documents: SourceDocument[] = [];
  function visit(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(filename);
      else if (entry.isFile() && entry.name.endsWith('.md')) {
        const raw = readFileSync(filename, 'utf8');
        const frontmatter = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
        const field = (key: string) => frontmatter?.[1].match(new RegExp(`^${key}:\\s*(.*?)\\s*$`, 'm'))?.[1].replace(/^['"]|['"]$/g, '') ?? '';
        const url = field('url');
        if (!/^https?:\/\//i.test(url)) continue;
        const body = normalizeText(raw.slice(frontmatter?.[0].length ?? 0).replace(/^Source:\s*https?:\/\/\S+\s*$/gm, ''));
        if (body.length < 80 || /dissertation writing services|essay writing service/i.test(body)) continue;
        const hash = createHash('sha256').update(raw).digest('hex');
        documents.push({
          id: `src-${hash.slice(0, 20)}`, title: field('title') || entry.name.replace(/\.md$/, ''),
          url, path: path.relative(repoRoot, filename).split(path.sep).join('/'),
          family: field('sourceFamily') || path.basename(directory), hash,
          capturedAt: field('fetched') || null, body,
        });
      }
    }
  }
  visit(root);
  return { version: createHash('sha256').update(documents.map((item) => `${item.path}:${item.hash}`).join('\n')).digest('hex'), documents, revision };
}
