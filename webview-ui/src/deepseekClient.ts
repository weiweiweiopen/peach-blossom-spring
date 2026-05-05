// Knowledge layer (Pre-WorkAdventure design):
// Build a per-persona KnowledgeBase from data/personas.json + docs/transcripts/*.md
// at build time (Vite raw glob), then feed it to DeepSeek as the system prompt.
//
// The transcripts are bilingual NGM interview Q&A in Markdown; this module
// keeps the prompt well-formed by:
//   1. Streaming the transcript verbatim (so the model can quote it),
//   2. Capping its length so we stay inside DeepSeek's context window,
//   3. Preserving the legacy `knowledge` array (newline-split) for any
//      caller that depends on the older shape.

import type { LanguageCode } from './i18n.js';
import { getWikiLinksForInterviewee, type WikiLink } from './wikiLinks.js';

interface KnowledgeBase {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  intro: string;
  knowledge: string[];
  transcript: string;
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

interface PersonaShape {
  id: string;
  name: string;
  role: string;
  intro: string;
  responses: Record<string, string>;
}

// Eagerly inline every transcript markdown at build time.
// Path is relative to this file: webview-ui/src → docs/transcripts is ../../docs/transcripts
const transcriptModules = import.meta.glob('../../docs/transcripts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const transcriptEnModules = import.meta.glob('../../docs/transcripts_en/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const transcriptZhModules = import.meta.glob('../../docs/transcripts_zh/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const transcriptByPersonaId: Record<string, string> = {};
const transcriptEnByPersonaId: Record<string, string> = {};
const transcriptZhByPersonaId: Record<string, string> = {};
for (const [filepath, contents] of Object.entries(transcriptModules)) {
  const match = /\/([^/]+)\.md$/.exec(filepath);
  if (match) {
    transcriptByPersonaId[match[1]] = contents;
  }
}
for (const [filepath, contents] of Object.entries(transcriptEnModules)) {
  const match = /\/([^/]+)\.md$/.exec(filepath);
  if (match) {
    transcriptEnByPersonaId[match[1]] = contents;
  }
}
for (const [filepath, contents] of Object.entries(transcriptZhModules)) {
  const match = /\/([^/]+)\.md$/.exec(filepath);
  if (match) {
    transcriptZhByPersonaId[match[1]] = contents;
  }
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

export function buildKnowledgeBase(persona: PersonaShape): KnowledgeBase {
  const transcriptRaw = transcriptByPersonaId[persona.id] ?? '';
  const transcriptEnRaw = transcriptEnByPersonaId[persona.id] ?? '';
  const transcriptZhRaw = transcriptZhByPersonaId[persona.id] ?? '';
  const transcript = trimTranscript(transcriptRaw);
  const transcript_en = trimTranscript(transcriptEnRaw);
  const transcript_zh = trimTranscript(transcriptZhRaw);
  const knowledge = extractKnowledgePoints(transcript);
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
    transcript,
    transcript_en,
    transcript_zh,
    wikiLinks: getWikiLinksForInterviewee(persona.id).links,
    responses: persona.responses,
  };
}

export async function askDeepSeekPersona({
  playerName,
  question,
  knowledge,
  preferredLanguage,
}: AskPersonaArgs): Promise<string> {
  const chatApiUrl = document
    .querySelector('meta[name="pbs-chat-api"], meta[name="sow-chat-api"]')
    ?.getAttribute('content')
    ?.trim();

  if (!chatApiUrl) {
    throw new Error('DeepSeek proxy is not configured.');
  }

  const languageInstruction =
    preferredLanguage === 'zh-TW'
      ? 'Reply in Traditional Chinese.'
      : preferredLanguage === 'en'
        ? 'Reply in English.'
        : 'Reply in English for now.';
  const primaryTranscript =
    preferredLanguage === 'zh-TW'
      ? knowledge.transcript_zh || knowledge.transcript
      : knowledge.transcript_en || knowledge.transcript;
  const sourceNotes = knowledge.knowledge.slice(0, 28).join('\n');
  const promptParts = [
    knowledge.systemPrompt,
    languageInstruction,
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

  const res = await fetch(chatApiUrl, {
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

  const data = (await res.json()) as { content?: string; error?: string };
  if (data.error) throw new Error(data.error);
  return data.content?.trim() ?? '...';
}

export type { KnowledgeBase, PersonaShape };
