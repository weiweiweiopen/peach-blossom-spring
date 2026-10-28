import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';
import { buildSourceCorpus } from '../scripts/source-corpus.js';
import { answerFromPacket } from '../src/evidence/pagesEvidence.js';
import { citationSources, exportAnswerJson, exportAnswerMarkdown, type ResearchItem } from '../src/evidence/answerRecord.js';
import { queryPlan, retrievePassages, type EvidencePacket, type RetrievalTrace } from '../src/evidence/sourceCorpus.js';
import { validateResearch } from '../src/evidence/researchAnswer.js';
import { renderEvidencePublication } from '../src/association/evidencePublication.js';

const corpus = buildSourceCorpus(path.resolve(import.meta.dirname, '../..'), '0123456789abcdef0123456789abcdef01234567');
const question = '怎麼製做導電縫線、織品的觸控螢幕？';
const retrieval: RetrievalTrace = { plan: queryPlan(question), candidates: [] };
const packet: EvidencePacket = { id: 'research-packet', query: question, corpusVersion: corpus.version, sourceRevision: corpus.revision,
  passages: retrievePassages(corpus, question, 8, retrieval), retrieval };
const original = packet.passages.find((passage) => passage.text.includes('teensy40_fastTouch_midi.ino'))!;
const quote = 'For Teensy 4.0, we used teensy40_fastTouch_midi.ino example sketch.';
const text = '原文在 Teensy 4.0 使用 teensy40_fastTouch_midi.ino 範例程式。';
const draft = { sections: [
  { title: '先確認目標', kind: 'answer', items: [{ id: 'a1', role: 'fact', text, supports: [{ passageId: original.id, quote }] }] },
  { title: '限制', kind: 'limits', items: [{ id: 'g1', role: 'gap', text: '目前選到的資料沒有證明這是可顯示影像的螢幕。', supports: [] }] },
] };

test('real screenshot question retrieves functional sources, code, pins and excludes unrelated member biographies', () => {
  assert.equal(retrieval.plan.intent, 'how_to');
  assert.ok(retrieval.plan.topics.includes('touch_input')); assert.ok(retrieval.plan.topics.includes('conductive_material'));
  assert.ok(retrieval.plan.requestedCapabilities.includes('image_display'));
  assert.ok(packet.passages.some((passage) => passage.text.includes('TeensyTouch')));
  assert.ok(packet.passages.some((passage) => /pins 5,7,9/i.test(passage.text)));
  assert.ok(packet.passages.some((passage) => /Fast Touch/i.test(passage.text)));
  assert.ok(packet.passages.every((passage) => passage.title !== 'members'));
  assert.ok(retrieval.candidates.some((candidate) => candidate.title === 'members' && candidate.decision === 'rejected'));
});
for (const query of ['How do I make a conductive fabric touch interface?', '導電糸と布のタッチセンサーの作り方', 'วิธีทำเซนเซอร์สัมผัสจากผ้าและด้ายนำไฟฟ้า', 'Bagaimana membuat sensor sentuh kain dengan benang konduktif?', 'Wie baue ich einen Berührungssensor aus Stoff und leitfähigem Faden?']) {
  test(`multilingual conductive textile query: ${query}`, () => {
    const passages = retrievePassages(corpus, query, 8);
    assert.equal(queryPlan(query).intent, 'how_to');
    assert.ok(passages.some((passage) => passage.text.includes('TeensyTouch')));
    assert.ok(passages.every((passage) => passage.title !== 'members'));
  });
}
test('research claims require exact source support, gap labels and unique item IDs', () => {
  assert.equal(validateResearch(draft, packet, 'zh-TW').sections.length, 2);
  assert.throws(() => validateResearch({ sections: [{ ...draft.sections[0], items: [{ ...draft.sections[0].items[0], supports: [] }] }] }, packet, 'zh-TW'), /without_support/);
  assert.throws(() => validateResearch({ sections: [{ ...draft.sections[0], items: [{ ...draft.sections[0].items[0], supports: [{ passageId: original.id, quote: 'a quote invented by an AI model' }] }] }] }, packet, 'zh-TW'), /unsupported_quote/);
  assert.throws(() => validateResearch({ sections: [{ ...draft.sections[0], items: [{ ...draft.sections[0].items[0], text: '我在訪談裡說，Teensy 4.0 使用這個範例。' }] }] }, packet, 'zh-TW'), /false_interview_attribution/);
});
test('one answer exports its actual model inputs, outputs, source snapshots, paths, quotations and rejected candidates', async () => {
  let calls = 0;
  const result = await answerFromPacket(packet, 'zh-TW', '', async (_system, input) => {
    calls++;
    if (calls === 1) { assert.equal(JSON.parse(input).interpretation.intent, 'how_to'); return draft; }
    return { supported: true, languageCorrect: true, issues: [] };
  });
  assert.equal(result.status, 'verified'); assert.ok(result.record?.research?.verified); assert.equal(result.record.sources.length, 1);
  assert.equal(result.record.sources[0].quotations[0].quote, quote);
  assert.equal(result.links.length, 1); assert.ok(!result.links[0].description);
  assert.equal(result.record.modelTrace.length, 2);
  const json = JSON.parse(exportAnswerJson(result.record));
  assert.equal(json.question, question); assert.equal(json.evidencePacket.id, packet.id);
  assert.equal(json.research.sections[1].items[0].role, 'gap');
  assert.ok(json.evidencePacket.retrieval.candidates.some((candidate: { title: string; decision: string }) => candidate.title === 'members' && candidate.decision === 'rejected'));
  assert.ok(json.sourceSnapshots[0].repositoryUrl.includes('0123456789abcdef0123456789abcdef01234567'));
  assert.equal(json.sourceSnapshots[0].linkStatus, 'not_checked');
  assert.ok(json.evidencePacket.passages.some((passage: { links: string[] }) => passage.links.includes('https://github.com/KOBAKANT/TeensyTouch')));
  const markdown = exportAnswerMarkdown(result.record);
  assert.ok(markdown.includes(question)); assert.ok(markdown.includes(quote)); assert.ok(markdown.includes('Sources/Raw/htgwyw/9812-playing-with-electronic-textiles.md'));
  assert.ok(markdown.includes('AI handoff')); assert.ok(markdown.includes('Complete machine-readable research record'));
  const publication = renderEvidencePublication({ id: 'test-zine', query: question, language: 'zh-TW', createdAt: '2026-10-28', packet, sections: [], answerRecord: result.record });
  assert.ok(publication.includes(text)); assert.ok(publication.includes('資料缺口')); assert.ok(publication.includes(quote));
});
test('multiple passages from one source produce one numbered citation with separate quotations', () => {
  const [a, b] = packet.passages.filter((passage) => passage.sourceId === original.sourceId);
  const items: ResearchItem[] = [{ id: 'a', role: 'fact', text, supports: [{ passageId: a.id, quote: a.text.slice(0, 40) }] },
    { id: 'b', role: 'fact', text, supports: [{ passageId: b.id, quote: b.text.slice(0, 40) }] }];
  const sources = citationSources(packet, items);
  assert.equal(sources.length, 1); assert.equal(sources[0].passages.length, 2); assert.equal(sources[0].quotations.length, 2);
});
