import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import type { LocalChatKnowledgeBase, WebsiteCorpusRecord } from '../src/localChatbot.js';
import { buildLocalGroundedAnswerDraft, buildNpcReplyWithEvidence, buildTranscriptEvidenceChunks, buildWebsiteEvidenceChunks, calibratePersonaReply, expandIntent, localNpcChat, localPetChat, rankEvidence, retrieveNpcEvidence, rewriteLocalPersonaVoice, sanitizeNpcReply } from '../src/localChatbot.js';
import { Direction, TileType } from '../src/office/types.js';
import { generateQuestionPet, petMoodTypes } from '../src/pets/generateQuestionPet.js';
import { chooseThrongletExpression, throngletMvpAnimation } from '../src/pets/throngletAssets.js';
import { createThrongletWaAnimation, createThrongletWaDirectionalAnimations } from '../src/pets/throngletWaSprites.js';
import { clampState } from '../src/simulation/defaults.js';
import { createInitialSnapshot, createThronglet, tickSimulation } from '../src/simulation/engine.js';
import { scorePromptResonance } from '../src/simulation/resonance.js';
import { scoreEvent } from '../src/simulation/scoring.js';
import { shouldTriggerThought } from '../src/simulation/thoughtTriggers.js';
import type { SimEvent, SimScores, SimState } from '../src/simulation/types.js';
import { generateWikiDaydreamReport } from '../src/simulation/wikiDaydream.js';
import { createNextTinyRoomLayout, NEXT_ROOM_GRID_SIZE, NEXT_ROOM_MAP_PADDING, NEXT_ROOM_MAP_SIZE } from '../src/world/peachBlossomWorld.js';

const testDir = dirname(fileURLToPath(import.meta.url));
const wikiRoot = resolve(testDir, '../../data/wiki/interviewees');
const forbiddenReplyFragments = [/domain:/i, /Wikipedia/i, /Transcript 1/i, /https?:\/\//i, /Player asked:/i, /Retrieved:/i, /Evidence 1:/i, /Source type:/i, /[A-Za-z][A-Za-z0-9_-]+\s*\/\s*[A-Za-z][A-Za-z0-9_/-]+/];

function assertCleanNpcReply(reply: string): void {
  for (const pattern of forbiddenReplyFragments) assert.ok(!pattern.test(reply), `reply leaked ${pattern.toString()}: ${reply}`);
}

test('state clamping works', () => {
  const state = clampState({ energy: -10, curiosity: 120, stress: 50, affinity: 0, solitude: 0, openness: 0, stubbornness: 0, resonanceWithPrompt: 0, groupBond: 0, money: 0, skills: 0 });
  assert.equal(state.energy, 0);
  assert.equal(state.curiosity, 100);
});

test('prompt resonance scores keyword overlap without external APIs', () => {
  assert.ok(scorePromptResonance('How can independent art funding support long-term care?', 'grant budget independent community care') > 40);
  assert.equal(scorePromptResonance('', 'grant'), 0);
});

test('same question gives the same pet seed and different questions vary', () => {
  const a = generateQuestionPet('資金如何支持獨立藝術社群？');
  const b = generateQuestionPet('資金如何支持獨立藝術社群？');
  const c = generateQuestionPet('科技工具如何照顧疲勞？');
  assert.equal(a.seed, b.seed);
  assert.deepEqual(a.sprite16, b.sprite16);
  assert.notEqual(a.seed, c.seed);
  assert.equal(a.sprite16.length, 16);
  assert.equal(a.sprite16[0].length, 16);
  assert.ok(petMoodTypes.includes(a.moodType));
  assert.equal(a.palette.primary, a.palette.skin);
  for (const mood of petMoodTypes) {
    const frames = a.animations[mood];
    assert.ok(frames.length >= 12);
    assert.equal(frames[0].length, 16);
    assert.equal(frames[0][0].length, 16);
  }
});

test('simulation ticks update state and events update scores', () => {
  const pet = createThronglet('How do we share tools?', 'Tester', 0, 10000);
  const snapshot = createInitialSnapshot([pet]);
  const next = tickSimulation(snapshot, { [pet.id]: 'tool craft skill community' });
  assert.equal(next.tick, 1);
  assert.notDeepEqual(next.thronglets[0].state, snapshot.thronglets[0].state);

  const scores: SimScores = { interaction: 0, wisdom: 0, community: 0, resource: 0, skill: 0, care: 0 };
  const event: SimEvent = { id: 'e', type: 'player_thronglet_response', createdAt: 0, tick: 1, actorId: 'player-0', delta: { stress: -3, skills: 2 }, significance: 70 };
  const scored = scoreEvent(scores, event);
  assert.ok(scored.interaction > 0);
  assert.ok(scored.care > 0);
  assert.ok(scored.skill > 0);
});

test('local retrieval ranks overlapping evidence first', () => {
  const ranked = rankEvidence('solar repair community', [
    { id: 'a', label: 'Noise', text: 'unrelated performance note', source: 'wiki' },
    { id: 'b', label: 'Repair archive', text: 'solar repair and community tool exchange', source: 'transcript' },
  ]);
  assert.equal(ranked[0].id, 'b');
});

test('local retrieval supports Chinese overlap and full transcript chunks', () => {
  const transcript = Array.from({ length: 95 }, (_, index) => `Q${index + 1}: unrelated opening note about travel and camp.`).join('\n')
    + '\nQ96: 太陽能修理工作坊需要共同維護、工具清單與社群交換。';
  const chunks = buildTranscriptEvidenceChunks(transcript, 'tester', 'Tester NPC');
  assert.ok(chunks.length > 80);
  const ranked = rankEvidence('太陽能修理怎麼跟社群交換？', chunks, 3);
  assert.ok(ranked[0].text.includes('太陽能修理'));
});

test('every persona wiki link becomes a readable website evidence chunk', () => {
  const personaDirs = readdirSync(wikiRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  assert.ok(personaDirs.length >= 15);
  for (const entry of personaDirs) {
    const filepath = resolve(wikiRoot, entry.name, 'links.json');
    const record = JSON.parse(readFileSync(filepath, 'utf8')) as WebsiteCorpusRecord;
    const chunks = buildWebsiteEvidenceChunks({ ...record, name: entry.name });
    assert.equal(chunks.length, record.links.length);
    assert.ok(chunks.length >= 1);
    assert.ok(chunks.every((chunk) => chunk.label.includes(' / ')));
    assert.ok(chunks.every((chunk) => !chunk.text.includes('domain:')));
    assert.ok(chunks.every((chunk) => chunk.sourceLabel));
  }
});

test('local NPC fallback returns clean evidence summary and readable evidence labels', () => {
  const knowledge: LocalChatKnowledgeBase = {
    id: 'tester',
    name: 'Tester NPC',
    role: 'community repair host',
    intro: 'Hosts solar repair workshops with local communities.',
    transcript_en: 'Q1: How do you repair tools? We repair solar devices through community workshops and shared notes.',
    transcript_zh: '',
    wikiLinks: [{ title: 'Solar repair wiki', url: 'https://example.test/solar', description: 'solar repair community documentation' }],
    responses: { repair: 'Repair starts from shared tools and community evidence.' },
  };
  const reply = localNpcChat({ message: 'How can I repair solar tools with community?', knowledge });
  assert.ok(reply.evidence.length >= 1);
  assert.ok(reply.reply.includes('Tester NPC'));
  assert.ok(!reply.reply.includes('最可靠的說法是'));
  assert.ok(reply.reply.includes('repair') || reply.reply.includes('solar') || reply.reply.includes('工具'));
  assert.ok(reply.reply.includes('repair') || reply.reply.includes('solar'));
  assert.ok(reply.evidence.some((item) => item.label.includes('Tester NPC / Solar repair wiki')));
  for (const item of reply.evidence) assert.ok(!reply.reply.includes(item.label));
});

test('local NPC chat keeps internal topic hints out of natural reply', () => {
  const knowledge: LocalChatKnowledgeBase = {
    id: 'tester',
    name: 'Tester NPC',
    role: 'lab research host',
    intro: 'Tests practical questions through materials and maintenance.',
    transcript_en: 'Q1: Nomadic practice means checking who maintains the work after travel.',
    transcript_zh: '',
    wikiLinks: [{ title: 'Nomadic lab note', url: 'https://example.test/nomadic', description: 'nomadic maintenance and travel research' }],
    responses: {},
  };
  const reply = localNpcChat({ message: '怎麼變的有錢又有名？', retrievalContext: 'nomadic', knowledge });
  assert.ok(!reply.reply.toLowerCase().includes('topic hint'));
  assert.ok(!reply.reply.includes('nomadic」'));
  assert.ok(reply.reply.length > 20);
});

test('local NPC chat does not leak technical role tags into Chinese natural reply', () => {
  const knowledge: LocalChatKnowledgeBase = {
    id: 'wukir-suryadi',
    name: 'Wukir Suryadi',
    role: 'artist station / experimental instrument practice',
    intro: 'Builds experimental instruments through listening and careful practice.',
    transcript_en: 'Q1: Instrument practice grows from listening, making, and testing with people.',
    transcript_zh: 'Q1: 樂器實驗從聆聽、製作，以及和人一起測試開始。',
    wikiLinks: [{ title: 'Wukir music', url: 'https://example.test/wukir', description: 'experimental instrument practice' }],
    responses: {},
  };
  const reply = localNpcChat({ message: '你剛剛提到「artist station / experimental instrument practice」，這跟我的任務有什麼關係？', knowledge });
  assert.ok(reply.reply.length > 20);
  assert.ok(!reply.reply.includes('artist station'));
  assert.ok(!reply.reply.includes('experimental instrument practice'));
});

test('Marc and ABao money/fame replies keep source labels in evidence only', () => {
  const marc: LocalChatKnowledgeBase = {
    id: 'marc-dusseiller',
    name: 'Marc',
    role: 'open hardware lab host',
    intro: 'Values dense improvisation, low-cost open hardware, friendship, and failure as pedagogy.',
    transcript_en: 'Q1: How do workshops grow? Start with cheap open hardware, friends, failures, and shared maintenance.',
    transcript_zh: 'Q1: 工作坊怎麼長出資源？先做低成本、開放、朋友能一起維護的原型。',
    wikiLinks: [{ title: 'Hackteria Wiki / Marc Dusseiller bio', url: 'https://www.hackteria.org/wiki/Marc_Dusseiller_bio', description: 'open hardware workshop biography and lab evidence' }],
    responses: {},
  };
  const abao: LocalChatKnowledgeBase = {
    id: 'abao',
    name: 'ABao',
    role: 'solar material storyteller',
    intro: 'Drifts between solar materials, travel, AI identity, lasers, and allegorical worlds.',
    transcript_en: 'Q1: How does a story travel? Let energy, identity, sound, and a small recognizable work carry it.',
    transcript_zh: 'Q1: 故事怎麼被記得？讓能量、身份、聲音和一個小但有辨識度的作品帶它走。',
    wikiLinks: [{ title: 'Solar Oracle Walkman', url: 'https://medium.com/@shihweichieh/solar-oracle-walman', description: 'solar materials, generative audio, and identity evidence' }],
    responses: {},
  };

  for (const knowledge of [marc, abao]) {
    const reply = localNpcChat({ message: '怎麼變的有錢又有名？', knowledge });
    assert.ok(reply.evidence.length > 0);
    assert.ok(reply.evidence.some((item) => item.source === 'wiki'));
    for (const item of reply.evidence) {
      assert.ok(!reply.reply.includes(item.label));
      assert.ok(!item.url || !reply.reply.includes(item.url));
    }
  }
});

test('local NPC fallback does not synthesize canned money/fame advice', () => {
  const knowledge: LocalChatKnowledgeBase = {
    id: 'anastassia-pistofidou',
    name: 'Anastassia Pistofidou',
    role: 'Fabricademy / decentralized education',
    intro: 'Turns camps and textile practice into distributed learning frameworks.',
    transcript_en: 'Q1: Learning starts from small modules, peer validation, and shared experiments.',
    transcript_zh: 'Q1: 學習從小模組、同儕驗證與共同實驗開始。',
    wikiLinks: [{ title: 'Fabricademy', url: 'https://fabricademy.org', description: 'distributed textile learning network' }],
    responses: {},
  };
  const reply = localNpcChat({ message: '怎麼變的有錢又有名？', knowledge });
  assert.ok(!reply.reply.includes('兩個可測試的問題'));
  assert.ok(!reply.reply.includes('誰會因為你的作品得到幫助'));
  assert.ok(reply.reply.includes('離線模式'));
});

test('local NPC fallback does not contain animal-regex joke templates', () => {
  const knowledge: LocalChatKnowledgeBase = {
    id: 'christian-dils',
    name: 'Christian Dils',
    role: 'Fraunhofer TexLab / research infrastructure',
    intro: 'Thinks from equipment, maintenance, procedures, and healthy technical commons.',
    transcript_en: 'Q1: Infrastructure needs care, maintenance, and realistic responsibilities.',
    transcript_zh: 'Q1: 基礎設施需要照護、維修與實際責任。',
    wikiLinks: [{ title: 'Re-FREAM', url: 'https://example.test/refream', description: 'research infrastructure and textile collaboration' }],
    responses: {},
  };
  const reply = localNpcChat({ message: '我想做一個兔子幫我賺錢', knowledge });
  assert.ok(!reply.reply.includes('勞動契約'));
  assert.ok(!reply.reply.includes('荒謬'));
  assert.ok(!reply.reply.includes('兔子真的'));
  assert.ok(!reply.reply.includes('誰會因為你的作品得到幫助'));
});

test('Marc Hackteria livelihood question retrieves corpus and keeps reply clean', () => {
  const knowledge: LocalChatKnowledgeBase = {
    id: 'marc-dusseiller',
    name: 'Marc Dusseiller',
    role: 'Hackteria / nomadic workshopologist',
    intro: 'Values dense improvisation, low-cost open hardware, friendship, and failure as pedagogy.',
    transcript_en: 'Q1: Hackteria workshops use open hardware, DIY biology, low-cost tools, and community labs.',
    transcript_zh: 'Q1: Hackteria 工作坊從開放硬體、低成本工具、社群實驗室與藝術科學合作開始。',
    wikiLinks: [{ title: 'Hackteria Wikipedia', url: 'https://en.wikipedia.org/wiki/Hackteria', description: 'Wikipedia article for Hackteria.' }],
    responses: {},
  };
  const message = '我想把藝術、科學和社群變成可以維持生活的工作，要怎麼開始？';
  const evidence = retrieveNpcEvidence({ message, knowledge });
  assert.ok(evidence.some((item) => /Hackteria|open hardware|workshop|community lab/i.test(`${item.label} ${item.text} ${item.tags?.join(' ') ?? ''}`)));
  const reply = localNpcChat({ message, knowledge });
  assert.ok(reply.reply.includes('Hackteria') || reply.reply.includes('工作坊') || reply.reply.includes('open hardware'));
  assertCleanNpcReply(reply.reply);
  for (const item of reply.evidence) assert.ok(!reply.reply.includes(item.label));
});

test('Mika wearable question retrieves How To Get What You Want corpus and keeps human reply', () => {
  const knowledge: LocalChatKnowledgeBase = {
    id: 'mika-satomi',
    name: 'Mika Satomi',
    role: 'KOBAKANT / e-textile exchange',
    intro: 'Emphasizes survivable scale, e-textile knowledge sharing, and mutual promises.',
    transcript_en: 'Q1: E-textile knowledge starts with small wearable experiments and careful documentation.',
    transcript_zh: 'Q1: 電子織品知識從小型穿戴實驗、柔軟電路與清楚紀錄開始。',
    wikiLinks: [{ title: 'How To Get What You Want', url: 'https://www.kobakant.at/DIY/', description: 'DIY wearable technology resource.' }],
    responses: {},
  };
  const message = '我想做一個可以穿在身上的電子小作品，怎麼開始？';
  const reply = localNpcChat({ message, knowledge });
  assert.ok(reply.evidence.some((item) => /e-textiles|soft circuits|wearable technology|DIY electronics/i.test(`${item.text} ${item.tags?.join(' ') ?? ''}`)));
  assert.ok(reply.reply.includes('離線模式'));
  assertCleanNpcReply(reply.reply);
});

test('money and fame retrieval uses expanded livelihood concepts without evidence leakage', () => {
  const knowledge: LocalChatKnowledgeBase = {
    id: 'marc-dusseiller',
    name: 'Marc Dusseiller',
    role: 'Hackteria / nomadic workshopologist',
    intro: 'Values dense improvisation, low-cost open hardware, friendship, and failure as pedagogy.',
    transcript_en: 'Q1: Small funding, invitations, workshop exchange, and shared documentation sustained Hackteria.',
    transcript_zh: 'Q1: 小型資金、邀請、工作坊交換與共享紀錄讓 Hackteria 得以維持。',
    wikiLinks: [{ title: 'Hackteria Wiki / nomadic work', url: 'https://www.hackteria.org/wiki/Hackteria', description: 'Hackteria wiki evidence.' }],
    responses: {},
  };
  const reply = localNpcChat({ message: '怎麼變得有錢又有名？', knowledge });
  assertCleanNpcReply(reply.reply);
  assert.ok(reply.evidence.length > 0);
  assert.ok(reply.evidence.some((item) => item.label.includes('Hackteria')));
  for (const item of reply.evidence) assert.ok(!reply.reply.includes(item.label));
});

test('money and fame intent expansion adds livelihood retrieval concepts', () => {
  const concepts = expandIntent('怎麼變得有錢又有名？');
  for (const expected of ['livelihood', 'visibility', 'community exchange', 'sustainable creative work', 'cost of fame', 'small experiment']) {
    assert.ok(concepts.includes(expected), `missing concept: ${expected}`);
  }
});

test('two-stage local NPC fallback keeps grounded draft separate from clean persona reply', () => {
  const knowledge: LocalChatKnowledgeBase = {
    id: 'marc-dusseiller',
    name: 'Marc Dusseiller',
    role: 'Hackteria / nomadic workshopologist',
    intro: 'Values low-cost open hardware, workshops, friends, and failure as pedagogy.',
    transcript_en: 'Q1: Livelihood grew through workshop invitations, low-cost tools, shared protocols, and community labs.',
    transcript_zh: 'Q1: 生活支撐來自工作坊邀請、低成本工具、共享流程與社群實驗室。',
    wikiLinks: [{ title: 'Hackteria Wiki / Marc', url: 'https://www.hackteria.org/wiki/Marc_Dusseiller', description: 'open hardware workshop livelihood community lab documentation' }],
    responses: {},
  };
  const message = '怎麼變得有錢又有名？';
  const evidence = retrieveNpcEvidence({ message, knowledge });
  const draft = buildLocalGroundedAnswerDraft({ message, knowledge, evidence });
  const rewritten = rewriteLocalPersonaVoice({ draft, message, knowledge, evidence });
  const wrapped = buildNpcReplyWithEvidence({ message, knowledge });

  assert.ok(draft.includes('離線模式'));
  assert.ok(draft.includes('工作坊') || draft.includes('workshop'));
  assert.ok(wrapped.evidence.length > 0);
  assert.equal(wrapped.reply, rewritten);
  assertCleanNpcReply(rewritten);
  for (const item of evidence) {
    assert.ok(!rewritten.includes(item.label));
    assert.ok(!item.url || !rewritten.includes(item.url));
  }
});

test('local NPC fallback avoids canned roleplay phrases without leaking evidence', () => {
  const knowledge: LocalChatKnowledgeBase = {
    id: 'marc-dusseiller',
    name: 'Marc Dusseiller',
    role: 'Hackteria / nomadic workshopologist',
    intro: 'Values low-cost open hardware, workshops, friends, and failure as pedagogy.',
    transcript_en: 'Q1: Livelihood grew through workshop invitations, low-cost tools, shared protocols, and community labs.',
    transcript_zh: 'Q1: 生活支撐來自工作坊邀請、低成本工具、共享流程與社群實驗室。',
    wikiLinks: [{ title: 'Hackteria Wiki / Marc', url: 'https://www.hackteria.org/wiki/Marc_Dusseiller', description: 'open hardware workshop livelihood community lab documentation' }],
    responses: {},
  };
  const replies = [
    localNpcChat({ message: '怎麼變得有錢又有名？', knowledge }),
    localNpcChat({ message: '如果我想靠藝術科學社群維持生活，第一步要做什麼？', knowledge }),
    localNpcChat({ message: '我想讓作品被更多人看見，但不要變成空的名聲，怎麼開始？', knowledge }),
  ];
  for (const reply of replies) {
    assertCleanNpcReply(reply.reply);
    assert.ok(!/工作桌|材料邊緣|手掌大小|勞動契約|販賣機|你問的是/.test(reply.reply));
    for (const item of reply.evidence) assert.ok(!reply.reply.includes(item.label));
  }
});

test('NPC reply sanitizer strips retrieval labels while preserving evidence', () => {
  const evidence = [{ id: 'e1', label: 'Hackteria / nomadic work', sourceLabel: 'Hackteria Wikipedia', text: 'open hardware workshop', source: 'wiki' as const, url: 'https://example.test/hackteria', score: 1 }];
  const reply = sanitizeNpcReply('Evidence 1: Hackteria / nomadic work Source type: wiki domain: example.test https://example.test/hackteria 先做一個小工作坊。', evidence);
  assert.equal(evidence.length, 1);
  assert.ok(reply.includes('先做一個小工作坊'));
  assertCleanNpcReply(reply);

  const calibrated = calibratePersonaReply({
    draft: 'Hackteria / nomadic work 說要 open hardware。',
    message: '我要怎麼開始？',
    knowledge: { id: 'marc-dusseiller', name: 'Marc', role: 'Hackteria / nomadic workshopologist', intro: 'hands-on', transcript_en: '', transcript_zh: '', wikiLinks: [], responses: {} },
    evidence,
  });
  assert.ok(calibrated.includes('open hardware'));
  assertCleanNpcReply(calibrated);
});

test('local pet chat produces action-oriented next step and memory event', () => {
  const pet = createThronglet('How can I share solar repair tools?', 'Tester', 0, 10000, undefined, '問題電子雞', {
    intentMode: 'how_to_do',
    personalArchive: 'solar repair kit and community workshop notes',
    skills: 'soldering teaching repair',
  });
  const memoryPet = {
    ...pet,
    memory: [{ id: 'm1', tick: 2, text: 'The pet learned that community repair needs a shared checklist.', significance: 70 }],
  };
  const reply = localPetChat({ message: 'What checklist should I test?', pet: memoryPet, tick: 3 });
  assert.ok(reply.evidence.some((item) => item.source === 'pet-memory'));
  assert.ok(reply.reply.includes('下一步行動') || reply.reply.includes('下一步小實驗'));
  assert.ok(reply.memoryEvent?.text.includes('Player asked'));
});

test('question pets create and grow problem maturation files before final answers', () => {
  const pet = createThronglet('What does https://shihweichieh.com teach about repair?', 'Tester', 0, 10000, undefined, '問題電子雞', {
    intentMode: 'why',
    personalArchive: 'I care about textile repair, community archives, and slow tools.',
    skills: 'sewing writing hosting',
  });
  assert.equal(pet.problemMaturation?.stage, 'seed');
  assert.ok(pet.problemMaturation?.rejectedShortcuts.some((item) => item.includes('shihweichieh.com')));

  const forcedPet = {
    ...pet,
    a2aState: { nextExchangeTick: 1, exchangeCount: 0, turnCount: 0, requiredExchanges: 1, requiredTurns: 18 },
  };
  const snapshot = createInitialSnapshot([forcedPet], [
    { id: 'npc-repair', characterId: 1, name: 'Repair Host', personaId: 'repair', text: 'repair textile archive hosting tools community' },
  ]);
  const next = tickSimulation(snapshot, {}, {
    'npc-repair': {
      personaId: 'repair',
      name: 'Repair Host',
      role: 'repair archive host',
      intro: 'collects community repair cases before making claims',
      links: [{ title: 'Repair archive', url: 'https://repair.example/archive', description: 'community textile repair evidence' }],
    },
  });
  const grownPet = next.thronglets[0];
  assert.equal(grownPet.problemMaturation?.stage, 'sprout');
  assert.ok((grownPet.personaJson?.revision ?? 0) > (pet.personaJson?.revision ?? 0));
  assert.ok((grownPet.knowledgeJson?.collectedInsights?.length ?? 0) > 0);
  assert.ok(next.a2aExchanges[0].turns[0].text.includes('maturation brief'));
});

test('final documents treat supplied URLs as sources, not answers', () => {
  const pet = createThronglet('怎麼變的有錢又有名？', 'Tester', 0, 10000, undefined, '問題電子雞', {
    intentMode: 'why',
    personalArchive: 'shihweichieh.com',
    skills: 'diy 太陽能板',
  });
  const forcedPet = {
    ...pet,
    state: { ...pet.state, resonanceWithPrompt: 80 },
    a2aState: { nextExchangeTick: 1, exchangeCount: 0, turnCount: 0, requiredExchanges: 1, requiredTurns: 18 },
  };
  let snapshot = createInitialSnapshot([forcedPet], [
    { id: 'npc-repair', characterId: 1, name: 'Repair Host', personaId: 'repair', text: 'repair fame resource community exchange' },
  ]);
  snapshot = { ...snapshot, scores: { ...snapshot.scores, wisdom: 30, community: 2 } };
  const next = tickSimulation(snapshot, {}, {
    'npc-repair': {
      personaId: 'repair',
      name: 'Repair Host',
      role: 'community repair host',
      intro: 'tests fame and money questions through community exchange',
      links: [{ title: 'Repair economy', url: 'https://repair.example/economy', description: 'how communities exchange resources without fame shortcuts' }],
    },
  });
  const document = next.finalDocuments[0];
  assert.ok(['manufacturing_technical_file', 'travel_plan', 'poem'].includes(document.mode));
  assert.ok(!document.body.includes('最強的線索'));
  assert.ok(!document.body.includes('shihweichieh、com'));
  assert.ok(document.body.includes('原始問題'));
  assert.ok(document.body.includes('Day Dream') || document.body.includes('製造／Camp') || document.body.includes('旅行 uMap'));
});

test('compact final appears in demo window with concise body and log', () => {
  const pet = createThronglet('怎麼變的有錢又有名？', 'Tester', 0, 10000, undefined, '問題電子雞', {
    intentMode: 'why',
    personalArchive: '我會做小型太陽能聲音裝置，也想找能交換資源的人。',
    skills: 'diy 太陽能板 寫作 展演',
  });
  let snapshot = createInitialSnapshot([pet], [
    { id: 'npc-a', characterId: 1, name: 'Resource Host', personaId: 'resource-host', text: 'resource exchange income community prototype' },
    { id: 'npc-b', characterId: 2, name: 'Fame Critic', personaId: 'fame-critic', text: 'fame visibility critique audience trust' },
  ]);
  const knowledge = {
    'npc-a': {
      personaId: 'resource-host',
      name: 'Resource Host',
      role: 'resource exchange host',
      intro: 'tests income questions through exchange and prototypes',
      links: [{ title: 'Resource exchange', url: 'https://resource.example/exchange', description: 'resource exchange prototype evidence' }],
    },
    'npc-b': {
      personaId: 'fame-critic',
      name: 'Fame Critic',
      role: 'visibility critic',
      intro: 'tests fame through audience trust and refusal',
      links: [{ title: 'Visibility critique', url: 'https://visibility.example/critique', description: 'audience trust and fame critique' }],
    },
  };
  for (let index = 0; index < 75 && snapshot.finalDocuments.length === 0; index++) {
    snapshot = tickSimulation(snapshot, {}, knowledge);
  }
  const document = snapshot.finalDocuments[0];
  assert.ok(document, 'expected final document by tick 75');
  assert.ok(document.tick >= 28 && document.tick <= 75);
  assert.ok(['manufacturing_technical_file', 'travel_plan', 'poem'].includes(document.mode));
  assert.ok(document.body.split('\n\n').length <= 5);
  assert.ok(/計劃 1|路線 1|詩節 1/.test(document.body));
  assert.ok(document.body.includes('製造／Camp') || document.body.includes('旅行 uMap') || document.body.includes('Day Dream'));
  assert.ok(!document.body.includes('夢境、修補、工具'));
  assert.ok(!document.references.every((reference) => ['夢境', '修補', '工具'].includes(reference.anchorText)));
  assert.ok(document.reviewLog.length <= 6);
  assert.ok(new Set(document.sourceExchangeIds).size >= 2);
});

test('thronglet MVP animation has 22 PNG frames for every expression', () => {
  for (const frames of Object.values(throngletMvpAnimation.expressionFrames)) {
    assert.equal(frames.length, 22);
    assert.ok(frames.every((frame) => frame.endsWith('.png')));
  }
  assert.equal(chooseThrongletExpression({ social: 80, energy: 70 }), 'happy');
  assert.equal(chooseThrongletExpression({ tension: 75, energy: 70 }), 'stressed');
});

test('WA thronglet expression map keeps character sprite dimensions', () => {
  const frames = createThrongletWaAnimation('happy');
  assert.equal(frames.length, 22);
  assert.equal(frames[0].length, 32);
  assert.equal(frames[0][0].length, 16);
  assert.ok(frames[0].some((row) => row.some(Boolean)));
});

test('WA thronglet directional animation matches character template rows', () => {
  const animations = createThrongletWaDirectionalAnimations('curious');
  for (const direction of [Direction.DOWN, Direction.UP, Direction.RIGHT, Direction.LEFT]) {
    const frames = animations[direction];
    assert.equal(frames?.length, 7);
    assert.equal(frames?.[0].length, 32);
    assert.equal(frames?.[0][0].length, 16);
  }
  assert.notDeepEqual(animations[Direction.DOWN]?.[0], animations[Direction.UP]?.[0]);
});

test('throng forms correctly when entities have high group bond', () => {
  const pets = [0, 1, 2].map((index) => {
    const pet = createThronglet(`question ${index} autonomy`, 'Tester', 0, 10000 + index);
    pet.state.groupBond = 70;
    pet.state.stress = 20;
    pet.state.resonanceWithPrompt = 80;
    return pet;
  });
  const next = tickSimulation(createInitialSnapshot(pets), {});
  assert.ok(next.throngs.length >= 1);
  assert.ok(next.events.some((event) => event.type === 'throng_formed'));
});

test('thought trigger works', () => {
  const state: SimState = { energy: 50, curiosity: 80, stress: 10, affinity: 40, solitude: 20, openness: 70, stubbornness: 20, resonanceWithPrompt: 90, groupBond: 20, money: 40, skills: 20 };
  assert.equal(shouldTriggerThought(state, { id: 'e', type: 'thronglet_interaction', createdAt: 0, tick: 1, actorId: 'pet', delta: {}, significance: 50 }), true);
});

test('next tiny room config is 15x15 in a 20x20 map with top and bottom entrances and clear outer path', () => {
  const layout = createNextTinyRoomLayout();
  assert.equal(NEXT_ROOM_GRID_SIZE, 15);
  assert.equal(NEXT_ROOM_MAP_SIZE, 20);
  assert.equal(layout.cols, NEXT_ROOM_MAP_SIZE);
  assert.equal(layout.rows, NEXT_ROOM_MAP_SIZE);
  assert.ok(layout.furniture.some((item) => item.type === 'PC_FRONT_ON_1' && item.col === 9 && item.row === 9));
  const entranceCol = NEXT_ROOM_MAP_PADDING + Math.floor(NEXT_ROOM_GRID_SIZE / 2) - 1;
  const topEntranceRow = NEXT_ROOM_MAP_PADDING;
  const bottomEntranceRow = NEXT_ROOM_MAP_PADDING + NEXT_ROOM_GRID_SIZE - 1;
  assert.notEqual(layout.tiles[topEntranceRow * layout.cols + entranceCol], TileType.WALL);
  assert.notEqual(layout.tiles[topEntranceRow * layout.cols + entranceCol + 1], TileType.WALL);
  assert.notEqual(layout.tiles[bottomEntranceRow * layout.cols + entranceCol], TileType.WALL);
  assert.notEqual(layout.tiles[bottomEntranceRow * layout.cols + entranceCol + 1], TileType.WALL);
  for (let row = 0; row < layout.rows; row++) {
    for (let col = 0; col < layout.cols; col++) {
      const isOuterPath = col === 0 || row === 0 || col === layout.cols - 1 || row === layout.rows - 1;
      if (!isOuterPath) continue;
      assert.notEqual(layout.tiles[row * layout.cols + col], TileType.WALL);
      assert.ok(!layout.furniture.some((item) => item.col === col && item.row === row));
    }
  }
  const treeCount = layout.furniture.filter((item) => item.type === 'PLANT' || item.type === 'PLANT_2').length;
  assert.equal(treeCount, 0);
});

test('wiki daydream mode generates final report from wiki and corpus without external APIs', () => {
  const pet = createThronglet('我想做一個可以穿在身上的電子小作品，怎麼開始？', 'Tester', 0, 10099);
  const report = generateWikiDaydreamReport({
    question: pet.question.text,
    pet,
    readingHistory: [{
      id: 'soft-circuit-note',
      title: 'Soft circuit reading note',
      sourceLabel: 'Local reading history',
      sourceType: 'reading-history',
      text: 'A wearable experiment can begin with one handmade textile sensor, visible conductive thread, careful documentation, and a tiny prototype that another person can remake.',
      tags: ['wearable technology', 'e-textiles', 'soft circuits', 'documentation'],
      url: 'https://example.test/soft-circuit',
    }],
    knowledgeBases: [{
      id: 'mika-satomi',
      name: 'Mika Satomi',
      role: 'KOBAKANT / e-textile exchange',
      intro: 'Works with handmade wearable electronics and textile sensors.',
      transcript_en: 'Q1: A wearable electronic project starts from a soft circuit, a small sensor, and documentation of failure.',
      transcript_zh: '',
      wikiLinks: [{ title: 'How To Get What You Want', url: 'https://www.kobakant.at/DIY/', description: 'DIY wearable electronics and e-textile documentation' }],
      responses: {},
    }],
    tick: 12,
  });
  assert.equal(report.mode, 'manufacturing_technical_file');
  assert.equal(report.petId, pet.id);
  assert.ok(report.body.includes('Wiki Daydream Mode'));
  assert.ok(report.body.includes('最小原型'));
  assert.ok(report.body.includes('documentation') || report.body.includes('文件'));
  assert.ok(report.references.some((reference) => reference.label.includes('How To Get What You Want') || reference.label.includes('Local reading history')));
  assert.ok(!/https?:\/\//i.test(report.body));
  assert.ok(!/domain:/i.test(report.body));
});

test('wiki daydream mode uses Hackteria concepts for art science livelihood questions', () => {
  const report = generateWikiDaydreamReport({
    question: '我想把藝術、科學和社群變成可以維持生活的工作，要怎麼開始？',
    readingHistory: [{
      id: 'hackteria-note',
      title: 'Hackteria workshop note',
      text: 'Hackteria workshops connect DIY biology, open hardware, low-cost tools, community labs, nomadic science, and art/science collaboration through informal learning.',
      tags: ['Hackteria', 'DIY biology', 'open hardware', 'community lab', 'workshops'],
      sourceLabel: 'Local reading history',
    }],
    websiteRecords: [{
      intervieweeId: 'marc-dusseiller',
      name: 'Marc Dusseiller',
      links: [{ title: 'Hackteria', url: 'https://hackteria.org', description: 'Open hardware, DIY biology, community lab, and art/science workshop network.' }],
    }],
    tick: 8,
  });
  assert.ok(report.body.includes('社群') || report.body.includes('community'));
  assert.ok(report.body.includes('open hardware') || report.body.includes('工具'));
  assert.ok(report.sourceExchangeIds.length >= 1);
  assert.ok(!/sourceLabel|sourceType|Retrieved evidence/i.test(report.body));
});
