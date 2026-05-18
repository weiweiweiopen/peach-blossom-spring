import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const repoRoot = resolve(dirname(new URL(import.meta.url).pathname), '..', '..');
const vaultRoot = join(repoRoot, 'obsidian-vault');
const exportDir = join(vaultRoot, 'daydream-export');
const cacheDir = join(exportDir, 'deep-cache');
mkdirSync(cacheDir, { recursive: true });

const args = new Set(process.argv.slice(2));
const fetchExternal = args.has('--fetch');
const maxFetch = Number(process.argv.find((arg) => arg.startsWith('--max-fetch='))?.split('=')[1] ?? 0);

const sourceCardsExport = JSON.parse(readFileSync(join(exportDir, 'sourceCards.json'), 'utf8'));
const categoryGraphExport = JSON.parse(readFileSync(join(exportDir, 'categoryGraph.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(join(exportDir, 'corpusManifest.json'), 'utf8'));
const cards = sourceCardsExport.cards ?? [];
const edges = categoryGraphExport.edges ?? [];
const cardById = new Map(cards.map((card) => [card.id, card]));
const cardByPath = new Map(cards.filter((card) => card.path).map((card) => [normalize(card.path), card]));
const cardByUrl = new Map(cards.filter((card) => card.url).map((card) => [normalize(card.url), card]));
const newCards = [];
const newEdges = [];
let fetched = 0;
let fetchAttempts = 0;
let urlRefs = 0;
let pdfRefs = 0;
let footnoteRefs = 0;
let referenceRefs = 0;

for (const card of cards) {
  const mdPath = card.path ? join(vaultRoot, card.path) : undefined;
  if (!mdPath || !existsSync(mdPath)) continue;
  const markdown = readFileSync(mdPath, 'utf8');
  const parsed = parseMarkdownReferences(markdown, mdPath);

  card.outgoingLinks = unique([...(card.outgoingLinks ?? []), ...parsed.wikiLinks, ...parsed.markdownLinks.map((link) => link.href)]);
  card.attachments = unique(parsed.attachments.map((link) => link.href));
  card.footnotes = unique(parsed.footnotes.map((note) => note.text));
  card.references = unique(parsed.references.map((ref) => ref.href ?? ref.text));

  for (const link of parsed.allLinks) {
    const relation = link.kind === 'attachment' ? 'has_attachment' : link.kind === 'reference' ? 'cites_reference' : 'outgoing_link';
    const targetCard = resolveExistingCard(link.href);
    if (targetCard) {
      newEdges.push(edge(relation, card.id, targetCard.id, 3));
      continue;
    }
    if (!isExternalOrAttachment(link.href)) continue;
    const shouldFetch = fetchExternal && (maxFetch <= 0 || fetchAttempts < maxFetch);
    if (shouldFetch) fetchAttempts += 1;
    const generated = await makeReferenceCard(link, card, shouldFetch);
    if (generated.fetched) fetched += 1;
    if (!cardById.has(generated.card.id)) {
      cardById.set(generated.card.id, generated.card);
      newCards.push(generated.card);
    }
    newEdges.push(edge(relation, card.id, generated.card.id, relation === 'has_attachment' ? 5 : 4));
    if (/\.pdf($|[?#])/i.test(link.href)) pdfRefs += 1;
    else urlRefs += 1;
  }

  for (const note of parsed.footnotes) {
    footnoteRefs += 1;
    const footnoteCard = makeInlineTextCard('footnote', note.text, card, note.label);
    if (!cardById.has(footnoteCard.id)) {
      cardById.set(footnoteCard.id, footnoteCard);
      newCards.push(footnoteCard);
    }
    newEdges.push(edge('has_footnote', card.id, footnoteCard.id, 3));
  }
  for (const ref of parsed.references.filter((item) => !item.href)) {
    referenceRefs += 1;
    const refCard = makeInlineTextCard('reference', ref.text, card, 'reference');
    if (!cardById.has(refCard.id)) {
      cardById.set(refCard.id, refCard);
      newCards.push(refCard);
    }
    newEdges.push(edge('cites_reference', card.id, refCard.id, 3));
  }
}

const enrichedCards = [...cards, ...newCards];
const enrichedEdges = dedupeEdges([...edges, ...newEdges]);
const enrichedManifest = {
  ...manifest,
  enrichedAt: new Date().toISOString(),
  enrichment: {
    source: 'scripts/enrich-daydream-corpus.mjs',
    parsedMarkdownCards: cards.length,
    generatedCards: newCards.length,
    generatedEdges: newEdges.length,
    fetchedExternalTexts: fetched,
    fetchAttempts,
    urlRefs,
    pdfRefs,
    footnoteRefs,
    referenceRefs,
    fetchExternal,
    maxFetch,
  },
  counts: {
    ...(manifest.counts ?? {}),
    sourceCards: enrichedCards.length,
    graphEdges: enrichedEdges.length,
    deepGeneratedCards: newCards.length,
    deepGeneratedEdges: newEdges.length,
  },
};

writeFileSync(join(exportDir, 'sourceCards.enriched.json'), JSON.stringify({ cards: enrichedCards }, null, 2));
writeFileSync(join(exportDir, 'categoryGraph.enriched.json'), JSON.stringify({ edges: enrichedEdges }, null, 2));
writeFileSync(join(exportDir, 'corpusManifest.enriched.json'), JSON.stringify(enrichedManifest, null, 2));
console.log(JSON.stringify(enrichedManifest.enrichment, null, 2));

function parseMarkdownReferences(markdown, mdPath) {
  const wikiLinks = [...markdown.matchAll(/!?\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/g)].map((m) => m[1].trim());
  const markdownLinks = [...markdown.matchAll(/!?\[([^\]]*)\]\(([^)]+)\)/g)].map((m) => ({ text: m[1].trim(), href: cleanHref(m[2]), kind: 'link' }));
  const bareLinks = [...markdown.matchAll(/https?:\/\/[^\s)\]>'"]+/g)].map((m) => ({ text: '', href: cleanHref(m[0]), kind: 'link' }));
  const attachments = [...markdownLinks, ...bareLinks]
    .filter((link) => isAttachment(link.href))
    .map((link) => ({ ...link, kind: 'attachment' }));
  const footnotes = [...markdown.matchAll(/^\[\^([^\]]+)\]:\s*(.+(?:\n(?: {2,}|\t).+)*)/gm)]
    .map((m) => ({ label: m[1], text: normalizeWhitespace(m[2]) }));
  const references = extractReferenceSection(markdown)
    .map((text) => {
      const href = text.match(/https?:\/\/[^\s)\]>'"]+/)?.[0];
      return { text: normalizeWhitespace(text), href: href ? cleanHref(href) : undefined, kind: 'reference' };
    });
  const allLinks = uniqueLinks([
    ...markdownLinks,
    ...bareLinks,
    ...attachments,
    ...references.filter((ref) => ref.href).map((ref) => ({ text: ref.text, href: ref.href, kind: 'reference' })),
  ]).map((link) => ({ ...link, href: absolutizeLink(link.href, mdPath) }));
  return { wikiLinks, markdownLinks, attachments, footnotes, references, allLinks };
}

function extractReferenceSection(markdown) {
  const lines = markdown.split(/\r?\n/);
  const results = [];
  let inSection = false;
  for (const line of lines) {
    if (/^#{1,4}\s*(references|reference|bibliography|footnotes|notes|參考|引用|註腳)\b/i.test(line.trim())) {
      inSection = true;
      continue;
    }
    if (inSection && /^#{1,4}\s+/.test(line)) break;
    if (inSection && /\S/.test(line)) results.push(line.replace(/^[-*\d.\s]+/, '').trim());
  }
  return results.slice(0, 24);
}

async function makeReferenceCard(link, parent, shouldFetch) {
  const id = `deep:${hash(link.href)}`;
  const fetched = shouldFetch ? await extractExternalText(link.href) : undefined;
  const title = link.text || titleFromHref(link.href);
  const excerpt = fetched?.text
    ? `${title} Source: ${link.href} Deep extract: ${fetched.text}`
    : `${title} Source: ${link.href} Deep reference discovered from ${parent.title}.`;
  return {
    fetched: Boolean(fetched?.text),
    card: {
      id,
      title,
      excerpt: trim(excerpt, 2600),
      keywords: keywordsFrom(`${title} ${excerpt}`),
      categories: ['Deep reference'],
      tags: ['deep-reference', isAttachment(link.href) ? 'attachment' : 'external-link'],
      outgoingLinks: [],
      source: 'deep-reference',
      url: /^https?:/i.test(link.href) ? link.href : undefined,
      path: /^https?:/i.test(link.href) ? undefined : link.href,
      sourceCategories: ['Deep reference'],
      semanticLayer: isAttachment(link.href) ? 'attachments' : 'references',
      semanticTopics: [{ layer: 'references', score: 1, topic: isAttachment(link.href) ? 'Attachment text' : 'External reference text' }],
    },
  };
}

function makeInlineTextCard(kind, text, parent, label) {
  const id = `deep:${kind}:${hash(`${parent.id}:${label}:${text}`)}`;
  const title = `${parent.title} — ${kind} ${label}`;
  const excerpt = `${title}. ${text}`;
  return {
    id,
    title,
    excerpt: trim(excerpt, 1800),
    keywords: keywordsFrom(excerpt),
    categories: [`Deep ${kind}`],
    tags: ['deep-reference', kind],
    outgoingLinks: [],
    source: 'deep-reference',
    sourceCategories: [`Deep ${kind}`],
    semanticLayer: kind,
    semanticTopics: [{ layer: kind, score: 1, topic: kind === 'footnote' ? 'Footnote text' : 'Reference text' }],
  };
}

async function extractExternalText(href) {
  const cacheKey = hash(href);
  const cachePath = join(cacheDir, `${cacheKey}.txt`);
  if (existsSync(cachePath)) return { text: readFileSync(cachePath, 'utf8') };
  try {
    if (!/^https?:/i.test(href)) return extractLocalAttachment(href);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    return await fetch(href, { signal: controller.signal, redirect: 'follow' })
      .then(async (res) => {
        clearTimeout(timeout);
        if (!res.ok) return undefined;
        const type = res.headers.get('content-type') ?? '';
        if (/pdf/i.test(type) || /\.pdf($|[?#])/i.test(href)) {
          const buf = Buffer.from(await res.arrayBuffer());
          const pdfPath = join(cacheDir, `${cacheKey}.pdf`);
          writeFileSync(pdfPath, buf);
          const text = extractPdfText(pdfPath);
          if (text) writeFileSync(cachePath, text);
          return text ? { text } : undefined;
        }
        const html = await res.text();
        const text = htmlToText(html);
        if (text) writeFileSync(cachePath, text);
        return text ? { text } : undefined;
      })
      .catch(() => undefined);
  } catch {
    return undefined;
  }
}

function extractLocalAttachment(href) {
  const localPath = resolve(vaultRoot, href.replace(/^app:\/\//, ''));
  if (/\.pdf$/i.test(localPath) && existsSync(localPath)) {
    const text = extractPdfText(localPath);
    return text ? { text } : undefined;
  }
  if (existsSync(localPath) && /\.(md|txt)$/i.test(localPath)) return { text: trim(readFileSync(localPath, 'utf8'), 2600) };
  return undefined;
}

function extractPdfText(pdfPath) {
  try {
    return trim(execFileSync('pdftotext', [pdfPath, '-'], { encoding: 'utf8', timeout: 10000 }), 2600);
  } catch {
    return undefined;
  }
}

function htmlToText(html) {
  return trim(html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' '), 2600);
}

function resolveExistingCard(href) {
  return cardByUrl.get(normalize(href)) || cardByPath.get(normalize(href)) || cardByPath.get(normalize(href.replace(/^.*\/Sources\//, 'Sources/')));
}
function isExternalOrAttachment(href) { return /^https?:/i.test(href) || isAttachment(href); }
function isAttachment(href) { return /\.(pdf|docx?|pptx?|xlsx?|txt|md)($|[?#])/i.test(href); }
function absolutizeLink(href, mdPath) { return /^https?:/i.test(href) ? href : normalize(resolve(dirname(mdPath), href)); }
function cleanHref(href) { return href.trim().replace(/^<|>$/g, '').replace(/[.,;]+$/g, ''); }
function normalize(value) { return value.toLowerCase().replace(/_/g, ' ').replace(/\.(md|html?)$/u, '').replace(/\s*\[[^\]]+\]$/u, '').replace(/^sources\//u, '').replace(/[?&#].*$/u, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim(); }
function normalizeWhitespace(text) { return text.replace(/\s+/g, ' ').trim(); }
function titleFromHref(href) { try { const u = new URL(href); return decodeURIComponent(basename(u.pathname) || u.hostname).replace(/[-_]+/g, ' '); } catch { return basename(href).replace(/[-_]+/g, ' '); } }
function keywordsFrom(text) { const stop = new Set(['the','and','with','from','that','this','for','are','was','were','http','https','source']); const words = text.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}-]{2,}/gu) ?? []; const counts = new Map(); for (const w of words) if (!stop.has(w)) counts.set(w, (counts.get(w) ?? 0) + 1); return [...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,18).map(([w])=>w); }
function unique(values) { return [...new Set(values.filter(Boolean))]; }
function uniqueLinks(links) {
  const priority = { attachment: 3, reference: 2, link: 1 };
  const chosen = new Map();
  for (const link of links) {
    if (!link.href) continue;
    const current = chosen.get(link.href);
    if (!current || (priority[link.kind] ?? 0) > (priority[current.kind] ?? 0)) chosen.set(link.href, link);
  }
  return [...chosen.values()];
}
function edge(relation, source, target, weight) { return { relation, source, target, weight }; }
function dedupeEdges(items) { const seen = new Set(); return items.filter((item) => { const key = `${item.relation}\t${item.source}\t${item.target}`; if (seen.has(key)) return false; seen.add(key); return true; }); }
function hash(value) { return createHash('sha1').update(value).digest('hex').slice(0, 12); }
function trim(text, max) { return normalizeWhitespace(text).slice(0, max); }
