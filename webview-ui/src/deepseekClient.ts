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
    preferredLanguage === 'zh-TW'
      ? 'For UI-only prompts or ambiguous questions, use Traditional Chinese.'
      : preferredLanguage === 'ja'
        ? 'For UI-only prompts or ambiguous questions, use Japanese.'
        : preferredLanguage === 'th'
          ? 'For UI-only prompts or ambiguous questions, use Thai.'
          : 'For UI-only prompts or ambiguous questions, use English.',
  ].join(' ');
}

function parseChatResponse(data: { content?: string; error?: string; choices?: Array<{ message?: { content?: string } }> }): string {
  if (data.error) throw new Error(data.error);
  return data.content?.trim() ?? data.choices?.[0]?.message?.content?.trim() ?? '...';
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
    responses: persona.responses,
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
  return parseChatResponse(data);
}

export async function askDeepSeekPersonaWithEvidence({
  playerName,
  question,
  knowledge,
  preferredLanguage,
  evidence,
}: AskPersonaWithEvidenceArgs): Promise<string> {
  const chatApiUrl = configuredWorkerChatApiUrl();
  if (!chatApiUrl) {
    throw new Error('DeepSeek Worker proxy is not configured.');
  }

  const evidenceBlock = evidence.length > 0
    ? evidence.map((item, index) => [
        `Evidence ${index + 1}: ${item.label}`,
        `Source type: ${item.source}`,
        item.url ? `URL: ${item.url}` : '',
        item.text,
      ].filter(Boolean).join('\n')).join('\n\n')
    : '(no retrieved evidence)';
  const systemPrompt = trimMessage([
    knowledge.systemPrompt,
    languageInstruction(preferredLanguage),
    'You are inside a game dialogue. Sound like the NPC, not like a citation bot.',
    'Use the retrieved evidence as grounding, but do not paste source labels, URLs, role tags, or technical retrieval hints into the natural reply.',
    'If the player is joking, teasing, or asking an absurd shortcut question, acknowledge the joke naturally first, then redirect with the NPC perspective.',
    'If evidence is thin, say what is missing conversationally instead of inventing facts.',
    'Keep the answer concise: 2 to 5 sentences.',
    '',
    `NPC: ${knowledge.name} (${knowledge.role})`,
    `Intro: ${knowledge.intro}`,
    '',
    '--- Retrieved evidence for grounding ---',
    evidenceBlock,
    '--- end retrieved evidence ---',
  ].join('\n'));

  const res = await fetch(chatApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'chat',
      messages: [
        { role: 'system', content: systemPrompt },
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
  return parseChatResponse(data);
}

export type { PersonaShape };
