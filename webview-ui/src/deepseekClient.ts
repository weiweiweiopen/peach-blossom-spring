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

export async function loadPersonaKnowledge(personaId: string): Promise<KnowledgeBase> {
  const base = import.meta.env.BASE_URL;
  const res = await fetch(`${base}data/knowledge/${personaId}.json?ts=${Date.now().toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to load knowledge base for ${personaId}`);
  }
  return (await res.json()) as KnowledgeBase;
}

export async function askDeepSeekPersona({
  apiKey,
  playerName,
  question,
  knowledge,
}: AskPersonaArgs): Promise<string> {
  const prompt = [
    knowledge.systemPrompt,
    'You are inside a traditional RPG dialogue scene. Reply in Traditional Chinese unless the player asks for another language.',
    'Do not claim you have full transcript access beyond the knowledge base supplied here.',
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
  return data.choices?.[0]?.message?.content?.trim() || '...';
}

export type { KnowledgeBase };
