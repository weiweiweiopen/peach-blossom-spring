import assert from 'node:assert/strict';
import { test } from 'node:test';
import path from 'node:path';
import { buildSourceCorpus } from '../scripts/source-corpus.js';
import { retrievePassages, validateStatements, type EvidencePacket } from '../src/evidence/sourceCorpus.js';
import { answerFromPacket, hasConsistentOutputLanguage, writeSupportedStatements, type ModelCall } from '../src/evidence/pagesEvidence.js';
import { renderEvidencePublication } from '../src/association/evidencePublication.js';
import { sanitizeNpcTextForUi } from '../src/privacy.js';
import { localizedNpcRole } from '../src/npcRoles.js';

const corpus = buildSourceCorpus(path.resolve(import.meta.dirname, '../..'));
const cases = [
  ['蜂箱感測器', /Open Source Beehives/],
  ['蜂巢感測', /Open Source Beehives/],
  ['蜜蜂 sensor', /Open Source Beehives/],
  ['Open Source Beehives sensors', /Open Source Beehives/],
  ['Jonathan Minchin Open Source Beehives', /Open Source Beehives/],
  ['beehive temperature', /Open Source Beehives/],
  ['beehives infrared humidity', /Open Source Beehives/],
  ['巣箱 センサー', /Open Source Beehives/],
  ['ミツバチ センサー', /Open Source Beehives/],
  ['ผึ้ง เซนเซอร์', /Open Source Beehives/],
  ['Bienenstock Sensoren', /Open Source Beehives/],
  ['sarang lebah sensor', /Open Source Beehives/],
  ['Fluffy MIDI', /Fluffy MIDI/],
  ['Playing with electronic textiles', /Playing with electronic textiles/],
  ['Nano Doctor Blade', /Nano Doctor Blade/],
  ['Nano Doctor Blade 駐村', /Nano Doctor Blade/],
  ['Constanza Piña THE HEART IS AN OSCILLATOR', /THE HEART IS AN OSCILLATOR/],
  ['SGMK Archive HOME MADE', /Archive HOME MADE/],
  ['SGMK Hacker-in-Residence', /Hacker-in-Residence/],
  ['Kitchenlab Bioplastic', /Kitchenlab|Main Page/],
] as const;
for (const [query, title] of cases) test(`real-corpus retrieval: ${query}`, () => {
  const results = retrievePassages(corpus, query);
  assert.ok(results.length, `No passages for ${query}`);
  assert.match(results[0].title, title);
  for (const passage of results) {
    const source = corpus.documents.find((item) => item.id === passage.sourceId)!;
    assert.equal(source.body.slice(passage.start, passage.end).trim(), passage.text);
    assert.equal(passage.hash, source.hash);
  }
});

test('all public original documents are versioned; snippets do not replace bodies', () => {
  assert.ok(corpus.documents.length >= 300);
  assert.match(corpus.version, /^[a-f0-9]{64}$/);
  assert.ok(corpus.documents.find((item) => /Open Source Beehives/.test(item.title))!.body.length > 5000);
});
test('beehive query never admits music or textile-only distractors', () => {
  assert.ok(retrievePassages(corpus, '蜂箱感測器').every((item) => /bee/i.test(item.title + item.text)));
});
test('unknown question does not receive source-quality or persona-only matches', () => {
  assert.deepEqual(retrievePassages(corpus, 'quasar-zzzz-no-such-material'), []);
  assert.deepEqual(retrievePassages(corpus, '請問火星量子蜂王引擎'), []);
});
const packet: EvidencePacket = { id: 'test-evidence', query: '蜂箱感測器', corpusVersion: corpus.version, passages: retrievePassages(corpus, '蜂箱感測器') };
const passage = packet.passages.find((item) => item.text.includes('Alpha Kit'))!;
const statement = { text: '原文將 Alpha Kit 描述為開發中的套件，規劃包含音訊、溫度、紅外線與濕度感測器。', passageId: passage.id,
  quote: 'The first Alpha Kit is being developed with audio, temperature, infrared, and humidity sensors.', kind: 'fact' as const };

test('no evidence skips both paid model calls', async () => {
  let calls = 0;
  const result = await answerFromPacket({ ...packet, passages: [] }, 'ja', '', async () => { calls++; throw new Error('must_not_call'); });
  assert.equal(result.status, 'no_evidence'); assert.equal(calls, 0); assert.match(result.answer, /原文/);
});
test('out-of-range citation and fabricated quotation are rejected', () => {
  assert.throws(() => validateStatements([{ ...statement, passageId: 'invented' }], packet), /unsupported_quote/);
  assert.throws(() => validateStatements([{ ...statement, quote: 'a made up quotation which is not in the source' }], packet), /unsupported_quote/);
});
test('independent review can reject a claim even with a genuine quotation', async () => {
  let calls = 0;
  const model: ModelCall = async () => ++calls === 1 ? { statements: [{ ...statement, text: '全部感測器現在均已完成。' }] } : { supported: false, languageCorrect: true };
  const result = await answerFromPacket(packet, 'zh-TW', '', model);
  assert.equal(calls, 2); assert.equal(result.status, 'unverified'); assert.doesNotMatch(result.answer, /均已完成/);
});
test('wrong-language review fails closed, without canned replacement facts', async () => {
  let calls = 0;
  await assert.rejects(writeSupportedStatements(packet, 'th', '', async () => ++calls === 1 ? { statements: [statement] } : { supported: true, languageCorrect: false }), /wrong_output_language|unsupported_claim/);
});
test('deployed Japanese/Chinese mixed-language failure is rejected even if a model would approve it', () => {
  assert.equal(hasConsistentOutputLanguage('原文當時描述、同プロジェクトはセンサーキットを開発中だった。', 'ja'), false);
  assert.equal(hasConsistentOutputLanguage('原文では、当時センサーキットを開発中だったと記されています。', 'ja'), true);
  assert.equal(hasConsistentOutputLanguage('原文當時描述 ชุดอุปกรณ์อยู่ระหว่างการพัฒนา', 'th'), false);
  assert.equal(hasConsistentOutputLanguage('ต้นฉบับระบุว่าชุดอุปกรณ์อยู่ระหว่างการพัฒนา', 'th'), true);
});
test('interview testimony is never promoted to independently verified fact', () => {
  const testimony = { ...packet, passages: [{ ...passage, kind: 'testimony' as const }] };
  assert.throws(() => validateStatements([statement], testimony), /testimony_is_not_fact/);
});
test('UI preserves citations and explicit missing evidence instead of replacing the answer', () => {
  const text = '原文仍描述為開發中。[1] 這份資料不足以支持目前已完成的說法。[2]';
  assert.equal(sanitizeNpcTextForUi(text, 'zh-TW'), text);
});
test('NPC role labels follow Japanese and Thai rather than leaking the English UI description', () => {
  assert.match(localizedNpcRole('andreas-siagian', 'ja', 'Lifepatch / local commons organizer'), /地域/);
  assert.match(localizedNpcRole('jonathan-minchin', 'th', 'Green Fablab / ecological field commons'), /นิเวศ/);
});
test('missing model provenance tag is derived from the cited passage before independent review', async () => {
  let calls = 0;
  const { kind: _kind, ...withoutKind } = statement;
  const claims = await writeSupportedStatements(packet, 'zh-TW', '', async () => ++calls === 1 ? { statements: [withoutKind] } : { supported: true, languageCorrect: true });
  assert.equal(claims[0].kind, 'fact'); assert.equal(calls, 2);
});
test('publication preserves facts, original quotations and HTML escaping', () => {
  const html = renderEvidencePublication({ id: 'test', query: '<img src=x onerror=alert(1)>', language: 'zh-TW', createdAt: '2026-10-28', packet,
    sections: [{ title: '蜂箱感測器', statements: [statement] }] });
  assert.ok(html.includes(statement.text)); assert.ok(html.includes(statement.quote));
  assert.ok(html.includes(`href="#reading-1"`)); assert.ok(html.includes('id="reading-1"'));
  assert.ok(html.includes('&lt;img')); assert.ok(!html.includes('<img src=x'));
  assert.ok(!html.includes('257mm')); assert.ok(!html.includes('fallbackSection'));
});
