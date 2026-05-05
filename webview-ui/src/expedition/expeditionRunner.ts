import agentProfiles from '../../../data/agent-profiles.json';

import { buildExpeditionPromptContext, EXPEDITION_REASONING_RULES } from './expeditionPrompt.js';
import { getNpcBehaviorProfile } from './npcBehaviorProfiles.js';
import type { AgentProfile, ExpeditionEvent, ExpeditionReport, ExpeditionResult, RunExpeditionInput } from './types.js';

const encounterTypes = ['friction circle', 'field test', 'night kitchen argument', 'archive detour', 'prototype omen'];
const topicOrder = ['camp', 'independent', 'artScience', 'sustainability', 'nomadic', 'funding', 'exchange'];
const agentProfileMap = agentProfiles as Record<string, AgentProfile>;

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

function chooseTopic(mission: string, round: number): string {
  const q = mission.toLowerCase();
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

function summarize(text: string, max = 170): string {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}...` : trimmed;
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
  const rounds = Math.max(1, Math.min(input.maxRounds, 20));
  const events: ExpeditionEvent[] = Array.from({ length: rounds }, (_, index) => {
    const round = index + 1;
    const persona = expeditionNpcs[index % expeditionNpcs.length];
    const profile = getNpcBehaviorProfile(persona);
    const topic = chooseTopic(input.mission, index);
    const response = persona.responses[topic] ?? persona.responses.camp ?? persona.intro;
    const reasoning = buildExpeditionPromptContext({
      avatar: input.avatar,
      persona,
      agentProfile: agentProfileMap[persona.id],
      behaviorProfile: profile,
      language: input.language,
      topic,
      sourceResponse: summarize(response, 150),
    });
    const contribution = isChinese
      ? `文本記憶：${reasoning.sourceGroundedMemory} 謹慎推演：${reasoning.cautiousExtrapolation} 試探提案：${reasoning.speculativeProposal}`
      : `Source-grounded memory: ${reasoning.sourceGroundedMemory} Cautious extrapolation: ${reasoning.cautiousExtrapolation} Speculative proposal: ${reasoning.speculativeProposal}`;
    return {
      round,
      npcId: persona.id,
      encounterType: localizeEncounterType(encounterTypes[index % encounterTypes.length], input.language),
      npcContribution: contribution,
      challengeToUser: isChinese
        ? `${profile.disagreementStyle} 可能反對：${profile.likelyToReject}。技能檢查：${playerSkills} 在真實壓力下如何派上用場？`
        : `${profile.disagreementStyle} Likely objection: ${profile.likelyToReject} Player-skill check: how will ${playerSkills} help under real pressure?`,
      newLead: isChinese
        ? `追蹤 ${profile.likelyToNotice}。用這條規則重讀：${EXPEDITION_REASONING_RULES}`
        : `Follow ${profile.likelyToNotice}. Re-read through this rule: ${EXPEDITION_REASONING_RULES}`,
      avatarBeliefUpdate: isChinese
        ? `${input.avatar.name} 透過 ${playerSkills}，把任務從「讓想法有說服力」更新成「讓想法對 ${profile.perspective} 負責」。`
        : `${input.avatar.name} updates the mission from "make the idea convincing" toward "make the idea accountable to ${profile.perspective}" through skills in ${playerSkills}.`,
      nextQuestion: isChinese
        ? `如果任務必須面對「${profile.bias.toLowerCase()}」，並真正依靠 ${playerSkills}，會改變什麼？`
        : `What would change if ${profile.bias.toLowerCase()} and the mission leaned on ${playerSkills}?`,
    };
  });

  const report: ExpeditionReport = {
    originalMission: input.mission,
    interpretedMission,
    keyEncounters: events.slice(0, 6).map((event) => {
      const persona = input.personas.find((item) => item.id === event.npcId);
      return input.language === 'zh-TW'
        ? `第 ${event.round} 回合，${persona?.name ?? event.npcId}：${event.encounterType} -> ${event.npcContribution}`
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
