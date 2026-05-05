// Knowledge layer (Pre-WorkAdventure design):
// Build a per-persona KnowledgeBase from data/personas.json + docs/transcripts/*.md
// at build time (Vite raw glob), then feed it to DeepSeek as the system prompt.

interface KnowledgeBase {
  name: string;
  role: string;
  systemPrompt: string;
  intro: string;
  knowledge: string[];
  responses: Record<string, string>;
}

interface AskPersonaArgs {
  apiKey: string;
  playerName: string;
  question: string;
  knowledge: KnowledgeBase;
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

const transcriptByPersonaId: Record<string, string> = {};
for (const [filepath, contents] of Object.entries(transcriptModules)) {
  const match = /\/([^/]+)\.md$/.exec(filepath);
  if (match) {
    transcriptByPersonaId[match[1]] = contents;
  }
}

function extractKnowledgePoints(transcript: string): string[] {
  // Pull non-empty lines; drop the leading title (#) and blank separators.
  return transcript
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
}

export function buildKnowledgeBase(persona: PersonaShape): KnowledgeBase {
  const transcript = transcriptByPersonaId[persona.id] ?? '';
  const knowledge = extractKnowledgePoints(transcript);
  const systemPrompt = [
    `You are role-playing as ${persona.name} (${persona.role}) inside a Peach Blossom Spring / 桃花源 village in an RPG dialogue scene.`,
    'Stay in character. Speak with warmth and concrete details rooted in the persona description and reference topic answers below.',
    'Reply in Traditional Chinese unless the player asks for another language. Keep replies under ~150 words.',
    'Do not invent transcript material beyond what is supplied here.',
  ].join(' ');
  return {
    name: persona.name,
    role: persona.role,
    intro: persona.intro,
    systemPrompt,
    knowledge,
    responses: persona.responses,
  };
}

export async function askDeepSeekPersona({
  apiKey,
  playerName,
  question,
  knowledge,
}: AskPersonaArgs): Promise<string> {
  const prompt = [
    knowledge.systemPrompt,
    `NPC: ${knowledge.name} (${knowledge.role})`,
    `Intro: ${knowledge.intro}`,
    `Knowledge: ${knowledge.knowledge.join(' / ')}`,
    `Reference topic answers: ${JSON.stringify(knowledge.responses)}`,
  ].join('\n');

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: `${playerName}: ${question}` },
      ],
      temperature: 0.7,
      max_tokens: 700,
    }),
  });

  if (!res.ok) {
    const details = await res.text();
    throw new Error(`DeepSeek request failed (${res.status.toString()}): ${details}`);
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content?.trim() ?? '...';
}

export type { KnowledgeBase, PersonaShape };
