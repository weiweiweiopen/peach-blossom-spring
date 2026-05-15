import agentProfiles from '../../../data/agent-profiles.json';
import { buildExpeditionPromptContext } from './expeditionPrompt.js';
import { getNpcBehaviorProfile } from './npcBehaviorProfiles.js';
import type { AgentProfile, ExpeditionEvent, ExpeditionReport, ExpeditionResult, RunExpeditionInput } from './types.js';

const encounterTypes = ['friction circle', 'field test', 'night kitchen argument', 'archive detour', 'prototype omen'];
const topicOrder = ['camp', 'independent', 'artScience', 'sustainability', 'nomadic', 'funding', 'exchange'];
const agentProfileMap = agentProfiles as Record<string, AgentProfile>;
const transcriptZhModules = import.meta.glob('../../../docs/transcripts_zh/*.md?raw', {
  import: 'default',
  eager: true,
}) as Record<string, string>;
const transcriptZhByPersonaId: Record<string, string> = {};
for (const [filepath, contents] of Object.entries(transcriptZhModules)) {
  const match = /\/([^/]+)\.md\?raw$/.exec(filepath);
  if (match) transcriptZhByPersonaId[match[1]] = contents;
}

function localizeEncounterType(encounterType: string, language: RunExpeditionInput['language']): string {
  const labels: Record<string, string> = {
    'friction circle': language === 'zh-TW' ? '摩擦圓桌' : 'Friction circle',
    'field test': language === 'zh-TW' ? '現地測試' : 'Field test',
    'night kitchen argument': language === 'zh-TW' ? '夜間廚房辯論' : 'Night kitchen argument',
    'archive detour': language === 'zh-TW' ? '檔案岔路' : 'Archive detour',
    'prototype omen': language === 'zh-TW' ? '原型預兆' : 'Prototype omen',
  };
  return labels[encounterType] ?? encounterType;
}

function chooseTopic(mission: string, round: number, skills?: string, constraints?: string): string {
  const q = [mission, skills, constraints].filter(Boolean).join(' ').toLowerCase();
  const keywordTopics: Array<[string, string[]]> = [
    ['funding', ['fund', 'grant', 'money', '資金', '補助']],
    ['sustainability', ['sustain', 'long-term', 'community', '永續', '社群']],
    ['artScience', ['art', 'science', 'tech', '藝術', '科技', '科學']],
    ['exchange', ['exchange', 'international', '國際', '交流']],
    ['camp', ['camp', 'village', '黑客', '營隊', '村']],
    ['nomadic', ['travel', 'nomad', '移動', '旅行']],
    ['independent', ['independent', 'autonomy', '獨立', '自治']],
  ];
  const matched = keywordTopics.find(([, words]) => words.some((word) => q.includes(word)));
  return matched?.[0] ?? topicOrder[round % topicOrder.length];
}

function localizeTopic(topic: string): string {
  const labels: Record<string, string> = {
    camp: '營隊與共同生活',
    independent: '獨立實作與自治',
    artScience: '藝術科技合作',
    sustainability: '永續與維護',
    nomadic: '移動研究',
    funding: '資金與支持',
    exchange: '國際交流',
  };
  return labels[topic] ?? '任務脈絡';
}

function summarize(text: string, max = 170): string {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}...` : trimmed;
}

function removeLatinText(text: string): string {
  return text
    .replace(/[A-Za-z][A-Za-z0-9._/-]*/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([，。！？：；、])/g, '$1')
    .trim();
}

function summarizeChineseTranscript(personaId: string, roundIndex: number): string {
  const transcript = transcriptZhByPersonaId[personaId] ?? '';
  const paragraphs = transcript
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 30 && !line.startsWith('#'));
  const raw = paragraphs.length > 0 ? paragraphs[roundIndex % paragraphs.length] : '';
  return removeLatinText(summarize(raw, 120)) || '這段訪談提醒我們，任務必須先回到具體的人、場域、責任與後續維護。';
}

function trimContext(text: string, fallback: string, max = 42): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return fallback;
  return cleaned.length > max ? `${cleaned.slice(0, max).trim()}...` : cleaned;
}

function pickByRound<T>(items: T[], roundIndex: number, personaId: string): T {
  const offset = personaId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return items[(roundIndex + offset) % items.length];
}

function interpretMission(mission: string, language: RunExpeditionInput['language'], constraints?: string): string {
  const base = mission.trim() || phrase(language, '找出一個能經得起營隊現實碰撞的任務。', 'Find a mission that can survive contact with the camp.');
  return constraints?.trim()
    ? `${base} ${phrase(language, '派遣必須尊重這些限制：', 'The expedition must respect these constraints: ')}${constraints.trim()}`
    : `${base} ${phrase(language, '派遣應先暴露衝突，再產生綜合。', 'The expedition should expose conflict before it produces synthesis.')}`;
}

function phrase(language: RunExpeditionInput['language'], zh: string, en: string): string {
  return language === 'zh-TW' ? zh : en;
}

export function runExpedition(input: RunExpeditionInput): ExpeditionResult {
  const selected = input.personas.filter((persona) => input.selectedNpcIds.includes(persona.id));
  const expeditionNpcs = selected.length > 0 ? selected : input.personas.slice(0, 6);
  const interpretedMission = interpretMission(input.mission, input.language, input.avatar.constraints);
  const isChinese = input.language === 'zh-TW';
  const playerSkills = input.avatar.skills?.trim() || phrase(input.language, '泛用型好奇心', 'generalist curiosity');
  const missionBrief = trimContext(input.mission, phrase(input.language, '未命名任務', 'unnamed mission'), isChinese ? 46 : 90);
  const constraintBrief = trimContext(input.avatar.constraints ?? '', phrase(input.language, '沒有明確限制', 'no explicit constraints'), isChinese ? 40 : 90);
  const rounds = Math.max(1, Math.min(input.maxRounds, 20));
  const events: ExpeditionEvent[] = Array.from({ length: rounds }, (_, index) => {
    const round = index + 1;
    const persona = expeditionNpcs[index % expeditionNpcs.length];
    const profile = getNpcBehaviorProfile(persona);
    const topic = chooseTopic(input.mission, index, input.avatar.skills, input.avatar.constraints);
    const displayTopic = isChinese ? localizeTopic(topic) : topic;
    const response = isChinese
      ? summarizeChineseTranscript(persona.id, index)
      : persona.responses[topic] ?? persona.responses.camp ?? persona.intro;
    const reasoning = buildExpeditionPromptContext({
      avatar: input.avatar,
      persona,
      agentProfile: agentProfileMap[persona.id],
      behaviorProfile: profile,
      language: input.language,
      topic: displayTopic,
      sourceResponse: isChinese ? response : summarize(response, 150),
      mission: input.mission,
      constraints: input.avatar.constraints,
    });
    const challengeTemplates = isChinese
      ? [
        `先不要擴張。${persona.name} 會問：「${missionBrief}」真的需要現在做嗎？玩家技能「${playerSkills}」能不能先證明一個最小版本？`,
        `${persona.name} 把限制放到桌上：${constraintBrief}。如果這個限制不能被尊重，任務就還不應該上場。`,
        `現場有人質疑：這件事會不會只是把「${playerSkills}」包成好看的提案？請指出誰會受益、誰能拒絕。`,
        `${persona.name} 要求把任務翻成一句可執行的測試，而不是再引用訪談語錄。`,
      ]
      : [
        `${persona.name} asks whether "${missionBrief}" really needs to scale now, or whether ${playerSkills} can prove one smallest useful version first.`,
        `${persona.name} puts the constraint on the table: ${constraintBrief}. If the mission cannot respect it, it is not ready for the field.`,
        `The room questions whether ${playerSkills} is becoming presentation language instead of practice. Name who benefits and who can refuse.`,
        `${persona.name} asks for one executable field test, not another transcript quotation.`,
      ];
    const leadTemplates = isChinese
      ? [
        `把「${missionBrief}」拆成一個 48 小時內能被看見、被拒絕、被修正的小測試。`,
        `找一位會受限制條件影響的人，先讓他改寫任務規則。限制是：${constraintBrief}。`,
        `用玩家技能「${playerSkills}」做一份可交給別人的材料：地圖、清單、SOP、願望牆或訪談問題。`,
        `下一輪不要問角色贊不贊成，改問他會刪掉任務中的哪一部分。`,
      ]
      : [
        `Break "${missionBrief}" into one 48-hour test that can be seen, refused, and revised.`,
        `Find one person affected by the constraint and let them rewrite the mission rule first: ${constraintBrief}.`,
        `Use ${playerSkills} to make something another person can hold: a map, checklist, SOP, wish wall, or interview prompt.`,
        `Next round, do not ask whether the NPC agrees. Ask what part of the mission they would delete.`,
      ];
    const nextQuestionTemplates = isChinese
      ? [
        `如果只能用「${playerSkills}」做第一步，哪個結果明天就能驗證？`,
        `「${missionBrief}」最需要誰先說不？`,
        `哪一個限制最可能讓這個任務變得更準，而不是更小？`,
        `${persona.name} 的提醒要怎麼改寫成玩家下一個行動？`,
      ]
      : [
        `If the first step can only use ${playerSkills}, what result could be tested tomorrow?`,
        `Who needs the power to say no to "${missionBrief}" first?`,
        `Which constraint could make the mission more precise rather than merely smaller?`,
        `How should ${persona.name}'s warning rewrite the player's next action?`,
      ];
    const contribution = isChinese
      ? `文本記憶：${reasoning.sourceGroundedMemory}\n任務連接：${reasoning.cautiousExtrapolation}\n現場提案：${reasoning.speculativeProposal}`
      : `Source-grounded memory: ${reasoning.sourceGroundedMemory} Cautious extrapolation: ${reasoning.cautiousExtrapolation} Speculative proposal: ${reasoning.speculativeProposal}`;
    return {
      round,
      npcId: persona.id,
      encounterType: localizeEncounterType(encounterTypes[index % encounterTypes.length], input.language),
      npcContribution: contribution,
      challengeToUser: pickByRound(challengeTemplates, index, persona.id),
      newLead: pickByRound(leadTemplates, index + 1, persona.id),
      avatarBeliefUpdate: isChinese
        ? `${input.avatar.name} 暫時把任務更新成：用「${playerSkills}」在「${constraintBrief}」內驗證「${missionBrief}」的第一個可行接觸點。`
        : `${input.avatar.name} updates the mission from "make the idea convincing" toward "make the idea accountable to ${profile.perspective}" through skills in ${playerSkills}.`,
      nextQuestion: pickByRound(nextQuestionTemplates, index + 2, persona.id),
    };
  });

  const report: ExpeditionReport = {
    originalMission: input.mission,
    interpretedMission,
    keyEncounters: events.slice(0, 6).map((event) => {
      const persona = input.personas.find((item) => item.id === event.npcId);
      return input.language === 'zh-TW'
        ? `第 ${event.round} 回合，${persona?.name ?? event.npcId}：${event.encounterType}。${event.npcContribution}`
        : `Round ${event.round}, ${persona?.name ?? event.npcId}: ${event.encounterType} -> ${event.npcContribution}`;
    }),
    strongestEmergentDirection: isChinese
      ? `把任務轉成由 ${playerSkills} 形塑的活原型：一個小型營隊測試、一份可見的衝突紀錄、一套照護或維護協議，以及一個可被其他節點 fork 的共享物件。`
      : `Turn the mission into a living prototype shaped by ${playerSkills}: one small camp-scale test, one visible conflict log, one care or maintenance protocol, and one shareable artifact that other nodes can fork.`,
    disagreementsBetweenNpcs: isChinese
      ? [
        '尺度衝突：共用資源組織者與田野實作者拉向小而負責的單位，網絡教育者則要求跨節點可攜。',
        '節奏衝突：hacker camp 的即興者想快速玩出失敗，照護與基礎設施聲音則為同意、安全與維護放慢任務。',
        '輸出衝突：說書人的邏輯想要神話式轉化，技術共用邏輯要求可重複的 SOP 與修復線。',
      ]
      : [
        'Scale conflict: commons organizers and field practitioners pull toward small accountable units, while network educators ask for portability across nodes.',
        'Tempo conflict: hacker-camp improvisers want fast playful failure, while care and infrastructure voices slow the mission down for consent, safety, and maintenance.',
        'Output conflict: storyteller logic wants mythic transformation, while technical commons logic asks for repeatable SOPs and repair lines.',
      ],
    blindSpots: isChinese
      ? [
        '當想法進入真實社群時，誰有拒絕權？',
        '第一個令人興奮的 demo 之後，會出現什麼維護負擔？',
        '如果玩家明天離開，哪一位在地 host 仍然受益？',
      ]
      : [
        'Who has refusal power when the idea enters a real community?',
        'What maintenance burden appears after the first exciting demo?',
        'Which local host benefits if the avatar leaves tomorrow?',
      ],
    concreteNextActions: isChinese
      ? [
        '寫一頁任務公約，涵蓋同意、署名、維護，以及什麼絕不被擴張。',
        '用少於十二人的規模跑一次 48 小時營隊原型，並把每一次分歧記成設計材料。',
        `做一個使用玩家技能「${playerSkills}」的可 fork 物件：食譜、地圖、SOP、願望牆或田野筆記，讓另一個節點能改造。`,
        '尋求資金前，先指認一位在地 steward 與一位外部 peer reviewer。',
      ]
      : [
        'Write a one-page mission covenant covering consent, credit, maintenance, and what will not be scaled.',
        'Run a 48-hour camp prototype with fewer than twelve people and document every disagreement as design material.',
        `Create a forkable artifact that uses the player's skills in ${playerSkills}: recipe, map, SOP, wish wall, or field notebook that another node can adapt.`,
        'Name one local steward and one external peer reviewer before seeking funding.',
      ],
    followUpQuestions: events.slice(-4).map((event) => event.nextQuestion),
    openCallResearchLeads: isChinese
      ? [
        '公開徵集：尋找能從土地、照護、修復或教育脈絡挑戰任務的田野 host。',
        '研究線索：整理 transcript、wiki link 與未來 backend orchestrator 可引用的來源。',
      ]
      : [
        'Open call for field hosts who can challenge the mission from land, care, repair, or education contexts.',
        'Research lead list for transcripts, wiki links, and future backend orchestrator citations.',
      ],
  };

  return { events, report };
}
