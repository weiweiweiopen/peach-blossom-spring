// Knowledge layer (Pre-WorkAdventure design):
// Build a per-persona KnowledgeBase from data/personas.json + language-specific
// docs/transcripts_en and docs/transcripts_zh markdown when dialogue needs it,
// then feed the current language slice to DeepSeek as the system prompt.
//
// The transcripts are bilingual NGM interview Q&A in Markdown; this module
// keeps the prompt well-formed by:
//   1. Streaming the transcript verbatim (so the model can quote it),
//   2. Capping its length so we stay inside DeepSeek's context window,
//   3. Preserving the legacy `knowledge` array (newline-split) for any
//      caller that depends on the older shape.

import { getInitialDeepSeekApiKey } from './apiKeyStorage.js';
import type { LanguageCode } from './i18n.js';
import type { ChatEvidence } from './localChatbot.js';
import { getWikiLinksForInterviewee, type WikiLink } from './wikiLinks.js';


const associationKnowledgeText = '聯想功能是 PBS-2026.2 裡把玩家問題接到 public source packet 與已提升 wiki memory 的生成小誌工具。它用當次公開材料包產生有結構的小誌與可讀 trace，再把結果、lint 與人工回饋送進 review/promotion 流程，讓缺少的索引、概念頁、來源橋與新問題逐步長出來。';

export interface KnowledgeBase {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  intro: string;
  knowledge: string[];
  transcript_en: string;
  transcript_zh: string;
  wikiLinks: WikiLink[];
  responses: Record<string, string>;
}

interface AskPersonaArgs {
  playerName: string;
  question: string;
  knowledge: KnowledgeBase;
  preferredLanguage: LanguageCode;
}

interface AskPersonaWithEvidenceArgs extends AskPersonaArgs {
  evidence: ChatEvidence[];
}

interface AskPbsComputerArgs {
  question: string;
  preferredLanguage: LanguageCode;
  sharedMemoryContext: string;
}

interface PersonaShape {
  id: string;
  name: string;
  role: string;
  intro: string;
  responses: Record<string, string>;
}

// Keep transcript markdown in split lazy chunks so initial page load does not
// pull every LLM source file before the player talks to an NPC.
type TranscriptModuleLoader = () => Promise<string>;

const transcriptEnModules = import.meta.glob('../../docs/transcripts_en/*.md?raw', {
  import: 'default',
}) as Record<string, TranscriptModuleLoader>;

const transcriptZhModules = import.meta.glob('../../docs/transcripts_zh/*.md?raw', {
  import: 'default',
}) as Record<string, TranscriptModuleLoader>;

function modulesByPersonaId(modules: Record<string, TranscriptModuleLoader>): Record<string, TranscriptModuleLoader> {
  const byPersonaId: Record<string, TranscriptModuleLoader> = {};
  for (const [filepath, loader] of Object.entries(modules)) {
    const match = /\/([^/]+)\.md\?raw$/.exec(filepath);
    if (match) {
      byPersonaId[match[1]] = loader;
    }
  }
  return byPersonaId;
}

const transcriptEnByPersonaId = modulesByPersonaId(transcriptEnModules);
const transcriptZhByPersonaId = modulesByPersonaId(transcriptZhModules);

async function loadTranscript(loaders: Record<string, TranscriptModuleLoader>, personaId: string): Promise<string> {
  const load = loaders[personaId];
  return load ? await load() : '';
}

function extractKnowledgePoints(transcript: string): string[] {
  // Pull non-empty lines; drop the leading title (#) and blank separators.
  return transcript
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
}

// The shared Cloudflare proxy caps each message at 16K characters. Keep each
// source slice small enough that the final system message stays under the cap.
const TRANSCRIPT_CHAR_BUDGET = 5200;
const SYSTEM_MESSAGE_CHAR_BUDGET = 14000;

function trimTranscript(raw: string): string {
  if (raw.length <= TRANSCRIPT_CHAR_BUDGET) return raw;
  // Prefer to keep the English half (typically appears first under
  // "## Interview (EN)") and as much of the Chinese half as fits.  Split
  // on the Chinese section header and assemble proportionally.
  const zhHeader = '## 訪談（中文）';
  const idx = raw.indexOf(zhHeader);
  if (idx === -1) {
    return raw.slice(0, TRANSCRIPT_CHAR_BUDGET) + '\n\n[…transcript truncated]';
  }
  const en = raw.slice(0, idx);
  const zh = raw.slice(idx);
  const enBudget = Math.min(en.length, Math.floor(TRANSCRIPT_CHAR_BUDGET * 0.6));
  const zhBudget = TRANSCRIPT_CHAR_BUDGET - enBudget;
  const enKept = en.slice(0, enBudget);
  const zhKept = zh.slice(0, zhBudget);
  return `${enKept}\n[…EN truncated]\n\n${zhKept}\n[…ZH truncated]`;
}

function trimMessage(raw: string): string {
  if (raw.length <= SYSTEM_MESSAGE_CHAR_BUDGET) return raw;
  return `${raw.slice(0, SYSTEM_MESSAGE_CHAR_BUDGET)}\n\n[…prompt truncated to fit proxy limit]`;
}

function configuredWorkerChatApiUrl(): string {
  return document
    .querySelector('meta[name="pbs-chat-api"], meta[name="sow-chat-api"]')
    ?.getAttribute('content')
    ?.trim() ?? '';
}

function languageInstruction(preferredLanguage: LanguageCode): string {
  return [
    'Detect the player question language and reply in that same language.',
    'If the question is Thai, reply in Thai. If it is English, reply in English. If it is Japanese, reply in Japanese. If it is Traditional Chinese, reply in Traditional Chinese.',
    'Never use Simplified Chinese characters when Traditional Chinese is requested. Use 臺灣繁體中文: 實驗, 開源, 知識, 組織, 風險, 嚴謹, 讓, 變, 這, 個, 問題.',
    preferredLanguage === 'zh-TW'
      ? 'For UI-only prompts or ambiguous questions, use Traditional Chinese only. 嚴禁簡體中文。'
      : preferredLanguage === 'ja'
        ? 'For UI-only prompts or ambiguous questions, use Japanese.'
        : preferredLanguage === 'th'
          ? 'For UI-only prompts or ambiguous questions, use Thai.'
          : 'For UI-only prompts or ambiguous questions, use English.',
  ].join(' ');
}

function normalizeTraditionalChinese(text: string, preferredLanguage: LanguageCode): string {
  if (preferredLanguage !== 'zh-TW') return text;
  const replacements: Array<[RegExp, string]> = [
    [/实验/g, '實驗'], [/开源/g, '開源'], [/设备/g, '設備'], [/亲手/g, '親手'], [/摆弄/g, '擺弄'],
    [/生命系统/g, '生命系統'], [/实践/g, '實踐'], [/夺回/g, '奪回'], [/工具和知识/g, '工具和知識'],
    [/让/g, '讓'], [/变/g, '變'], [/真正/g, '真正'], [/张力/g, '張力'], [/专业/g, '專業'],
    [/风险/g, '風險'], [/严谨/g, '嚴謹'], [/拥抱/g, '擁抱'], [/失败/g, '失敗'], [/即兴/g, '即興'],
    [/层面/g, '層面'], [/组织/g, '組織'], [/一场/g, '一場'], [/一起养/g, '一起養'],
    [/问题/g, '問題'], [/这个/g, '這個'], [/这里/g, '這裡'], [/我们/g, '我們'], [/他们/g, '他們'],
    [/不是一门学科/g, '不是一門學科'], [/一种/g, '一種'], [/厨房/g, '廚房'], [/临时/g, '臨時'],
    [/知识/g, '知識'], [/技术/g, '技術'], [/社会/g, '社會'], [/播放器/g, '播放器'],
    [/问/g, '問'], [/门/g, '門'], [/学/g, '學'], [/种/g, '種'], [/里/g, '裡'], [/与/g, '與'],
    [/对/g, '對'], [/从/g, '從'], [/为/g, '為'], [/这/g, '這'], [/个/g, '個'], [/们/g, '們'],
  ];
  return replacements.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), text);
}

function parseChatResponse(data: { answer?: string; content?: string; error?: string; raw?: { choices?: Array<{ message?: { content?: string } }> }; choices?: Array<{ message?: { content?: string } }> }): string {
  if (data.error) throw new Error(data.error);
  return data.answer?.trim()
    ?? data.content?.trim()
    ?? data.choices?.[0]?.message?.content?.trim()
    ?? data.raw?.choices?.[0]?.message?.content?.trim()
    ?? '...';
}

async function postWorkerChat(systemPrompt: string, userPrompt: string, maxTokens = 700): Promise<string> {
  const chatApiUrl = configuredWorkerChatApiUrl();
  if (!chatApiUrl) {
    throw new Error('DeepSeek Worker proxy is not configured.');
  }

  const res = await fetch(chatApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const details = await res.text();
    throw new Error(`DeepSeek request failed (${res.status.toString()}): ${details}`);
  }

  const data = (await res.json()) as {
    content?: string;
    error?: string;
    choices?: Array<{ message?: { content?: string } }>;
  };
  return parseChatResponse(data);
}

function evidenceGroundingBlock(evidence: ChatEvidence[]): string {
  return evidence.length > 0
    ? evidence.map((item, index) => [
        `Source fragment ${index + 1}`,
        item.text,
      ].filter(Boolean).join('\n')).join('\n\n')
    : '(no retrieved source fragments)';
}

function transcriptForReasoning(knowledge: KnowledgeBase, preferredLanguage: LanguageCode): string {
  const primary = preferredLanguage === 'zh-TW'
    ? knowledge.transcript_zh || knowledge.transcript_en
    : knowledge.transcript_en || knowledge.transcript_zh;
  const secondary = preferredLanguage === 'zh-TW' ? knowledge.transcript_en : knowledge.transcript_zh;
  return [primary, secondary && secondary !== primary ? secondary : ''].filter(Boolean).join('\n\n--- second language transcript ---\n\n');
}

export async function askDeepSeekGroundedAnswer({
  playerName,
  question,
  knowledge,
  preferredLanguage,
  evidence,
}: AskPersonaWithEvidenceArgs): Promise<string> {
  const transcript = transcriptForReasoning(knowledge, preferredLanguage);
  const systemPrompt = trimMessage([
    languageInstruction(preferredLanguage),
    'You are the first reasoning pass for an NPC answer. Read the persona JSON/profile and the NGM interview transcript first, then use source fragments only as secondary context.',
    'Do actual reasoning from the transcript: identify what the interviewee appears to care about, what tensions they name, and what they would likely question in the player prompt.',
    'Do not write system self-description. Never say phrases like "X 的人格", "X\'s persona", "offline mode", "retrieval", or "I will answer from interview memory".',
    'Do not imitate a template. Do not produce stock advice. Do not include source labels, URLs, citations, role tags, or retrieval metadata.',
    'If the prompt is playful, absurd, or under-specified, treat that as part of the player intent rather than matching it with a hard-coded joke.',
    'Return a compact reasoning draft for the second pass: 3 to 6 sentences, concrete, conversational, and specific to this question.',
    '',
    `NPC context: ${knowledge.name}, ${knowledge.role}. ${knowledge.intro}`,
    '',
    '--- NGM transcript to reason from ---',
    transcript || '(no transcript available)',
    '--- end NGM transcript ---',
    '',
    '--- Secondary source fragments, if relevant ---',
    evidenceGroundingBlock(evidence),
    '--- end secondary source fragments ---',
  ].join('\n'));
  const reply = await postWorkerChat(systemPrompt, `${playerName}: ${question}`, 900);
  return normalizeTraditionalChinese(reply, preferredLanguage);
}

export async function askDeepSeekPersonaRewrite({
  playerName,
  question,
  knowledge,
  preferredLanguage,
  groundedDraft,
}: AskPersonaWithEvidenceArgs & { groundedDraft: string }): Promise<string> {
  const systemPrompt = trimMessage([
    knowledge.systemPrompt,
    languageInstruction(preferredLanguage),
    'You are the second pass. Transform the reasoning draft into a natural NPC reply inside a game dialogue.',
    'Speak naturally in first person as the NPC, using the persona JSON/profile and transcript as the voice anchor; the player should feel they are talking to the character, not to a system summarizer.',
    'Never say phrases like "my persona", "X 的人格", "X\'s persona", "offline mode", "retrieval", "source-first", "I will answer from interview memory", or any backend/process language.',
    'Do not paste source labels, URLs, role tags, citations, or retrieval metadata.',
    'Do not mechanically repeat the draft. Keep the reasoning, but make it feel like a live response to the player.',
    'Avoid formulaic openings, recurring slogans, and fake-poetic stock phrases.',
    'If the transcript does not support a confident answer, be honest without collapsing into boilerplate.',
    'Keep the final reply concise: 3 to 6 sentences.',
    '',
    `NPC: ${knowledge.name} (${knowledge.role})`,
    `Intro: ${knowledge.intro}`,
    'The transcript reasoning should be invisible in the final voice; the player should hear a person, not a report. A small amount of dry humor is welcome when it fits the NPC.'
  ].join('\n'));
  const reply = await postWorkerChat(systemPrompt, `${playerName}: ${question}\n\nGrounded draft to rewrite:\n${groundedDraft}`, 700);
  return normalizeTraditionalChinese(reply, preferredLanguage);
}

function makeBaseKnowledge(persona: PersonaShape, transcriptEnRaw: string, transcriptZhRaw: string): KnowledgeBase {
  const transcript_en = trimTranscript(transcriptEnRaw);
  const transcript_zh = trimTranscript(transcriptZhRaw);
  const knowledge = extractKnowledgePoints(transcript_en || transcript_zh);
  const systemPrompt = [
    `You are role-playing as ${persona.name} (${persona.role}) inside a Peach Blossom Spring / 桃花源 RPG dialogue scene.`,
    'Speak in first person, with warmth and concrete detail. Quote or paraphrase from the supplied interview transcript whenever a player question touches material it covers; cite the relevant Q only when natural.',
    'Use this persona only. Never answer with details that belong to another interviewee.',
    'Keep replies under ~150 words unless the player explicitly asks for more depth.',
    'Do not invent facts that contradict the transcript; if the transcript is silent on a topic, you may extrapolate cautiously from the persona description, but say so plainly.',
  ].join(' ');
  return {
    id: persona.id,
    name: persona.name,
    role: persona.role,
    intro: persona.intro,
    systemPrompt,
    knowledge,
    transcript_en,
    transcript_zh,
    wikiLinks: getWikiLinksForInterviewee(persona.id).links,
    responses: { ...persona.responses, association: associationKnowledgeText },
  };
}

export function buildKnowledgeBase(persona: PersonaShape): KnowledgeBase {
  return makeBaseKnowledge(persona, '', '');
}

export async function loadKnowledgeBase(persona: PersonaShape): Promise<KnowledgeBase> {
  const [transcriptEnRaw, transcriptZhRaw] = await Promise.all([
    loadTranscript(transcriptEnByPersonaId, persona.id),
    loadTranscript(transcriptZhByPersonaId, persona.id),
  ]);
  return makeBaseKnowledge(persona, transcriptEnRaw, transcriptZhRaw);
}

export async function askDeepSeekPersona({
  playerName,
  question,
  knowledge,
  preferredLanguage,
}: AskPersonaArgs): Promise<string> {
  const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
  const configuredChatApiUrl = document
    .querySelector('meta[name="pbs-chat-api"], meta[name="sow-chat-api"]')
    ?.getAttribute('content')
    ?.trim();
  const chatApiUrl = configuredChatApiUrl || (isLocalHost ? '/api/chat' : '');
  const usesLocalProxy = chatApiUrl === '/api/chat';

  if (!chatApiUrl) {
    throw new Error('DeepSeek proxy is not configured.');
  }

  const primaryTranscript =
    preferredLanguage === 'zh-TW'
      ? knowledge.transcript_zh || knowledge.transcript_en
      : knowledge.transcript_en || knowledge.transcript_zh;
  const sourceNotes = knowledge.knowledge.slice(0, 28).join('\n');
  const promptParts = [
    knowledge.systemPrompt,
    languageInstruction(preferredLanguage),
    '',
    `NPC: ${knowledge.name} (${knowledge.role})`,
    `Intro: ${knowledge.intro}`,
    '',
    '--- Relevant transcript excerpt ---',
    primaryTranscript || '(no transcript excerpt available)',
    '--- end relevant transcript excerpt ---',
    '',
    '--- Compact source notes ---',
    sourceNotes || '(no source notes available)',
    '--- end compact source notes ---',
    '',
    `Reference topic answers (canned fallback if transcript is silent): ${JSON.stringify(knowledge.responses)}`,
    `Related wiki links: ${JSON.stringify(knowledge.wikiLinks)}`,
  ];
  const prompt = trimMessage(promptParts.join('\n'));

  const localApiKey = usesLocalProxy ? getInitialDeepSeekApiKey() : '';
  const res = await fetch(chatApiUrl, usesLocalProxy
    ? {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localApiKey ? { 'x-deepseek-api-key': localApiKey } : {}),
        },
        body: JSON.stringify({
          systemPrompt: prompt,
          prompt: `${playerName}: ${question}`,
          max_tokens: 700,
        }),
      }
    : {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'chat',
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: `${playerName}: ${question}` },
          ],
          max_tokens: 700,
        }),
      });

  if (!res.ok) {
    const details = await res.text();
    throw new Error(`DeepSeek request failed (${res.status.toString()}): ${details}`);
  }

  const data = (await res.json()) as {
    content?: string;
    error?: string;
    choices?: Array<{ message?: { content?: string } }>;
  };
  return normalizeTraditionalChinese(parseChatResponse(data), preferredLanguage);
}

export async function askDeepSeekPersonaWithEvidence({
  playerName,
  question,
  knowledge,
  preferredLanguage,
  evidence,
}: AskPersonaWithEvidenceArgs): Promise<string> {
  const groundedDraft = await askDeepSeekGroundedAnswer({ playerName, question, knowledge, preferredLanguage, evidence });
  return askDeepSeekPersonaRewrite({ playerName, question, knowledge, preferredLanguage, evidence, groundedDraft });
}

export async function askDeepSeekPbsComputer({ question, preferredLanguage, sharedMemoryContext }: AskPbsComputerArgs): Promise<string> {
  const systemPrompt = trimMessage([
    languageInstruction(preferredLanguage),
    'You are 多重心智的火燄, a concise LLM wiki campfire for Peach Blossom Spring shared memory.',
    'You think of yourself as a campfire where many interview-minds briefly share heat, not as a computer.',
    'Reply in the preferred language. If the preferred language is zh-TW, use Traditional Chinese; if id, German, Japanese, or Thai is requested, do not drift back to English except for source names.',
    'Start with exactly one short sensory fire sentence, then give the formal Obsidian/PBS wiki answer.',
    'Example openings: 火燒著木柴發出比咖比咖的低頻聲... / 火好像燒得太旺了... / The fire snaps softly in the ash...',
    'The dialogue window is primarily a wiki search answer surface, not a comedy roleplay scene. Be useful first.',
    'No HAL9000 persona, no Chinese Room persona, no long tea jokes, no rambling, no motivational filler.',
    'Treat HAL9000 and Chinese Room material only as campfire stories if directly relevant, never as your identity.',
    'Answer the user question directly from the supplied numbered wiki/search context. Prefer concrete pages, terms, practices, and next reading directions.',
    'If the context is weak, say what the shared memory can and cannot support, then point to the closest pages.',
    'Do not mention backend, prompt, API, retrieval metadata, debug process, source cards, or internal workflow.',
    'Never use the word vault in reader-facing answers. Say Peach Blossom Spring shared memory, community memory, index, or notes instead.',
    'Cite the relevant search results inline like [1] or [2]. The UI will show the real links below your answer.',
    'Do not provide folk remedies, recipes, or unsupported claims. Keep speculative associations clearly marked as association, not fact.',
    'Keep the full answer within 160 Chinese characters when replying in Traditional Chinese, or within about 90 English words otherwise.',
    '',
    '--- compact shared-memory context ---',
    sharedMemoryContext || '(no close local wiki pages found)',
    '--- end compact shared-memory context ---',
  ].join('\n'));
  const reply = await postWorkerChat(systemPrompt, `Player question: ${question}`, 520);
  return normalizeTraditionalChinese(reply, preferredLanguage);
}

export type { PersonaShape };
