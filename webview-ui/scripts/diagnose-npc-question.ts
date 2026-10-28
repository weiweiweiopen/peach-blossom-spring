/** Opt-in diagnostic; uses the actual corpus, interview and paid model proxy. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { buildSourceCorpus } from './source-corpus.js';
import { answerNpcQuestion } from '../src/evidence/npcConversation.js';

const root = path.resolve(import.meta.dirname, '../..');
const question = process.argv[2] || '你怎麼把 DIY biology、bioart 和工作坊做成 Hackteria 的社群方法？';
const corpus = buildSourceCorpus(root);
const realFetch = globalThis.fetch;
globalThis.document = { baseURI: 'https://weiweiweiopen.github.io/peach-blossom-spring/', querySelector: () => ({ getAttribute: () => 'https://pbs-deepseek-proxy.dontmarryme.workers.dev/chat' }) } as unknown as Document;
globalThis.fetch = (input, init) => String(input).endsWith('source-corpus.json')
  ? Promise.resolve(new Response(JSON.stringify(corpus), { status: 200 }))
  : realFetch(input, { ...init, headers: { ...init?.headers, Origin: 'https://weiweiweiopen.github.io' } });
const result = await answerNpcQuestion({ question, npcName: 'campers', preferredLanguage: 'zh-TW',
  persona: { id: 'marc-dusseiller', role: 'Hackteria / nomadic workshopologist', intro: 'This camper persona values dense improvisation, low-cost open hardware, friendship, and failure as pedagogy.' },
  transcript: readFileSync(path.join(root, 'docs/transcripts_zh/marc-dusseiller.md'), 'utf8'),
  transcriptUrl: 'https://github.com/weiweiweiopen/peach-blossom-spring/blob/main/docs/transcripts_zh/marc-dusseiller.md' });
console.log(JSON.stringify({ question, status: result.status, answer: result.answer,
  plan: result.evidencePacket?.retrieval?.plan,
  passages: result.evidencePacket?.passages.map(({ id, title, kind, path, start }) => ({ id, title, kind, path, start })),
  calls: result.record?.modelTrace.map(({ stage, error, output, durationMs }) => ({ stage, durationMs, error, output })) }, null, 2));
if (result.status !== 'verified') process.exitCode = 1;
