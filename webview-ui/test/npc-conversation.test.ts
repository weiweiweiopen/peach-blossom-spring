import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import personas from '../../data/personas.json';
import { localizedNpcRole } from '../src/npcRoles.js';
import { answerNpcQuestion, npcIntent } from '../src/evidence/npcConversation.js';
import { asksForCurrentInformation } from '../src/evidence/liveWiki.js';
import { buildSourceCorpus } from '../scripts/source-corpus.js';
import { normalizeText, queryPlan, retrieveInterviewPassages, retrievePassages, type EvidencePacket, type SourceDocument } from '../src/evidence/sourceCorpus.js';
import type { LanguageCode } from '../src/i18n.js';

const corpus = buildSourceCorpus(path.resolve(import.meta.dirname, '../..'));
const languages: LanguageCode[] = ['zh-TW', 'en', 'id', 'de', 'ja', 'th'];
const who: Record<LanguageCode, string> = { 'zh-TW': '你是誰', en: 'Who are you?', id: 'Siapa kamu?', de: 'Wer bist du?', ja: 'あなたは誰ですか？', th: 'คุณเป็นใคร' };
const marc = personas.personas.find((persona) => persona.id === 'marc-dusseiller')!;

test('screenshot community-method question is not classified as electronics assembly and retrieves the real character interview', () => {
  const question = '你怎麼把 DIY biology、bioart 和工作坊做成 Hackteria 的社群方法？';
  assert.equal(queryPlan(question).intent, 'explain');
  const body = normalizeText(readFileSync(path.resolve(import.meta.dirname, '../../docs/transcripts_zh/marc-dusseiller.md'), 'utf8'));
  const document: SourceDocument = { id: 'marc-interview', title: 'NGM interview', body, family: 'interview', path: 'docs/transcripts_zh/marc-dusseiller.md', hash: 'test', url: 'https://example.org/interview', capturedAt: null };
  const matches = retrieveInterviewPassages(document, question);
  assert.ok(matches.length >= 2);
  assert.ok(matches.some((passage) => /維基|工作坊|HackteriaLab/.test(passage.text)));
  assert.ok(matches.every((passage) => passage.kind === 'testimony' && body.slice(passage.start, passage.end).trim() === passage.text));
  assert.equal(queryPlan('怎麼製做導電縫線、織品的觸控螢幕？').intent, 'how_to');
});

test('screenshot regression: identity uses the selected role without retrieval or a model', async () => {
  for (const persona of personas.personas) for (const language of languages) {
    let calls = 0;
    const role = localizedNpcRole(persona.id, language, persona.role);
    const result = await answerNpcQuestion({ question: who[language], npcName: 'campers', preferredLanguage: language, persona: { ...persona, displayRole: role } }, {
      getPacket: async () => { calls++; throw new Error('identity_must_not_search'); },
      model: async () => { calls++; throw new Error('identity_must_not_call_model'); },
    });
    assert.equal(calls, 0); assert.equal(result.status, 'character');
    assert.ok(result.answer.includes(role)); assert.equal(result.evidence.length, 0);
  }
});
test('identity, greeting and help never swallow a factual activity question', () => {
  assert.equal(npcIntent('你是誰'), 'identity');
  assert.equal(npcIntent('可以告訴我你是個什麼樣的藝術家嗎？'), 'identity');
  assert.equal(npcIntent('你好'), 'greeting');
  assert.equal(npcIntent('你好，現在泰國有什麼活動？'), 'research');
  assert.equal(npcIntent('你知道現在泰國有什麼活動嗎？'), 'research');
  assert.equal(npcIntent('你覺得我應該怎麼開始做工作坊？'), 'reflection');
});
for (const question of ['現在泰國有什麼活動', 'What events are happening in Thailand now?', 'タイで今どんなイベントがありますか', 'ตอนนี้ประเทศไทยมีกิจกรรมอะไรบ้าง']) {
  test(`screenshot activity retrieval: ${question}`, () => {
    assert.equal(asksForCurrentInformation(question), true);
    const passages = retrievePassages(corpus, question);
    assert.ok(passages.length > 0); assert.match(passages[0].title, /CoLabs Chiang Mai|CNX OpenLab/);
    assert.ok(passages.every((passage) => !/Hacker-in-Residence Programme/.test(passage.title)), 'Swiss residencies must not pad the Thai event answer');
  });
}
test('city specificity is preserved instead of treating Bangkok and Chiang Mai as synonyms', () => {
  const passages = retrievePassages(corpus, '現在曼谷有什麼活動');
  assert.ok(passages.every((passage) => /bangkok|曼谷|กรุงเทพ/i.test(passage.text)));
});
test('current activity replies retain dates and never claim an archive is a current calendar', async () => {
  const packet: EvidencePacket = { id: 'thai-events', query: '現在泰國有什麼活動', corpusVersion: corpus.version, passages: retrievePassages(corpus, '現在泰國有什麼活動'), currentRequest: true, answeredAt: '2026-10-28T00:00:00Z' };
  const passage = packet.passages[0];
  let count = 0;
  const result = await answerNpcQuestion({ question: packet.query, npcName: 'campers', persona: marc, preferredLanguage: 'zh-TW' }, {
    getPacket: async () => packet,
    model: async (system, user) => {
      count++;
      if (count === 1) {
        assert.match(system, /2026-10-28/); assert.match(system, /NOT event dates/);
        return { statements: [{ text: '我找到清邁 CoLabs 的相關活動紀錄，實際場次仍要依原文日期核對。', quote: passage.text.slice(0, 150), passageId: passage.id, kind: 'fact' }] };
      }
      assert.ok(JSON.parse(user).question.includes('泰國'));
      return { supported: true, languageCorrect: true };
    },
  });
  assert.equal(result.status, 'verified'); assert.match(result.answer, /沒有核實目前|還沒有核實目前/);
  assert.ok(result.links.length); assert.doesNotMatch(result.answer, /找不到足以回答/);
});
test('a missing interview is reported specifically, not invented from a character profile', async () => {
  let calls = 0;
  const result = await answerNpcQuestion({ question: '你在訪談裡說了什麼？', npcName: 'campers', preferredLanguage: 'zh-TW', persona: marc, transcript: 'Transcript pending — user will provide later' }, {
    model: async () => { calls++; throw new Error('must_not_call'); },
  });
  assert.equal(calls, 0); assert.equal(result.status, 'no_evidence'); assert.match(result.answer, /訪談逐字稿目前還沒收錄/);
});
test('opinion/advice dialogue keeps the selected character and checks for invented facts', async () => {
  let calls = 0;
  const result = await answerNpcQuestion({ question: '你覺得我應該怎麼開始？', npcName: 'campers', persona: marc, preferredLanguage: 'zh-TW' }, {
    getPacket: async () => { throw new Error('opinion_is_not_a_document_search'); },
    model: async (_system, user) => {
      calls++;
      if (calls === 1) { assert.equal(JSON.parse(user).persona.id, marc.id); return { reply: '我會建議先做一個便宜、可以拆開重做的小實驗，再邀朋友一起試。' }; }
      return { languageCorrect: true, noUnsupportedFacts: true };
    },
  });
  assert.equal(calls, 2); assert.equal(result.status, 'character'); assert.match(result.answer, /建議/);
});
test('every configured research interview is present in the publication tree; pending interviews remain pending', () => {
  for (const persona of personas.personas) for (const filename of Object.values(persona.transcripts)) {
    const absolute = path.resolve(import.meta.dirname, '../..', filename);
    assert.equal(existsSync(absolute), true, `Missing deployed interview: ${filename}`);
    const text = readFileSync(absolute, 'utf8');
    if (persona.id === 'wukir-suryadi') assert.match(text, /pending|待/i);
    else assert.ok(text.length > 300, `Empty interview: ${filename}`);
  }
});
