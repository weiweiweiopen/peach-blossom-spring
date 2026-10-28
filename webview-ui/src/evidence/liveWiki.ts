import { normalizeText, retrievePassages, type EvidencePacket, type Passage, type SourceDocument } from './sourceCorpus.js';

export { asksForCurrentInformation } from './sourceCorpus.js';

const pages = new Map<string, { expires: number; promise: Promise<SourceDocument> }>();
async function readLiveWikiSource(passage: Passage): Promise<SourceDocument> {
  const article = new URL(passage.url);
  if (article.hostname !== 'www.hackteria.org' || !article.pathname.startsWith('/wiki/')) throw new Error('no_live_reader_for_source');
  const title = decodeURIComponent(article.pathname.slice('/wiki/'.length)).replace(/_/g, ' ');
  const key = `${article.origin}/${title}`;
  const existing = pages.get(key);
  if (existing && existing.expires > Date.now()) return existing.promise;
  const promise = (async () => {
    const api = new URL('/wiki/api.php', article.origin);
    api.search = new URLSearchParams({ action: 'parse', page: title, prop: 'text|revid', redirects: '1', format: 'json', origin: '*' }).toString();
    const response = await fetch(api, { signal: AbortSignal.timeout(12000), cache: 'no-cache' });
    if (!response.ok) throw new Error('live_source_unavailable');
    const result = await response.json() as { parse?: { title: string; pageid: number; revid: number; text: { '*': string } } };
    const parsed = result.parse;
    if (!parsed?.revid || typeof parsed.text?.['*'] !== 'string') throw new Error('invalid_live_source');
    const dom = new DOMParser().parseFromString(parsed.text['*'], 'text/html');
    dom.querySelectorAll('script,style,nav,.toc,.mw-editsection').forEach((element) => element.remove());
    dom.querySelectorAll('p,div,li,tr,td,th,h1,h2,h3,h4,h5,br').forEach((element) => element.appendChild(dom.createTextNode(' ')));
    const body = normalizeText(dom.body.textContent ?? '');
    if (body.length < 80) throw new Error('empty_live_source');
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body));
    const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
    article.search = new URLSearchParams({ oldid: String(parsed.revid) }).toString();
    return { id: `live-hackteria-${parsed.pageid}-${parsed.revid}`, title: parsed.title, url: article.href,
      path: `Sources/Live/hackteria/${parsed.pageid}/${parsed.revid}`, family: 'hackteria', hash, body, capturedAt: new Date().toISOString() };
  })();
  pages.set(key, { expires: Date.now() + 5 * 60000, promise });
  if (pages.size > 12) pages.delete(pages.keys().next().value!);
  try { return await promise; } catch (error) { pages.delete(key); throw error; }
}

/** Refresh only already relevant public origins. Failure retains dated archive evidence. */
export async function refreshCurrentEvidence(packet: EvidencePacket): Promise<EvidencePacket> {
  const selected = [...new Map(packet.passages.filter((passage) => passage.kind === 'source' && /^https:\/\/www\.hackteria\.org\/wiki\//.test(passage.url))
    .map((passage) => [passage.sourceId, passage])).values()].slice(0, 2);
  if (!selected.length) return packet;
  const results = await Promise.allSettled(selected.map(readLiveWikiSource));
  const documents = results.flatMap((result) => result.status === 'fulfilled' ? [result.value] : []);
  if (!documents.length) return packet;
  const refreshedSources = new Set(selected.filter((_, index) => results[index].status === 'fulfilled').map((passage) => passage.sourceId));
  const livePassages = retrievePassages({ version: packet.corpusVersion, documents }, packet.query).map((passage) => ({ ...passage, readAt: new Date().toISOString() }));
  return { ...packet, liveChecked: true, passages: [...livePassages, ...packet.passages.filter((passage) => !refreshedSources.has(passage.sourceId))].slice(0, 6) };
}
