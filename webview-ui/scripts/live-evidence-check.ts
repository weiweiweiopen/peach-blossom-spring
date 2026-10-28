/** Opt-in real-model smoke. Not part of the offline test command. */
import assert from 'node:assert/strict';
import path from 'node:path';
import { buildSourceCorpus } from './source-corpus.js';
import { retrievePassages, type EvidencePacket } from '../src/evidence/sourceCorpus.js';
import { answerFromPacket, callPublicationModel } from '../src/evidence/pagesEvidence.js';
import type { LanguageCode } from '../src/i18n.js';

const originalFetch = globalThis.fetch;
globalThis.fetch = (input, init) => originalFetch(input, { ...init, headers: { ...init?.headers, Origin: 'https://weiweiweiopen.github.io' } });
globalThis.document = { querySelector: () => ({ getAttribute: () => 'https://pbs-deepseek-proxy.dontmarryme.workers.dev/chat' }) } as unknown as Document;
const corpus = buildSourceCorpus(path.resolve(import.meta.dirname, '../..'));
const cases: Array<[string, LanguageCode]> = [['蜂箱感測器', 'zh-TW'], ['Playing with electronic textiles', 'en'], ['蜂箱感測器', 'ja'], ['蜂箱感測器', 'th']];
for (const [query, language] of cases.filter(([, code]) => !process.argv[2] || process.argv[2] === code)) {
  const packet: EvidencePacket = { id: crypto.randomUUID(), query, corpusVersion: corpus.version, passages: retrievePassages(corpus, query) };
  const result = await answerFromPacket(packet, language, '', async (system, user) => {
    const value = await callPublicationModel(system, user);
    if (process.env.PBS_DEBUG_MODEL === '1') console.log('Model JSON:', JSON.stringify(value));
    return value;
  });
  console.log(JSON.stringify({ query, language, status: result.status, answer: result.answer, titles: result.links.map((link) => link.title) }, null, 2));
  assert.equal(result.status, 'verified', 'Real-model answer did not pass review');
}
