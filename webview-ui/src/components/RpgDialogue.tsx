import { useEffect, useMemo, useState } from 'react';

import { askDeepSeekPersona, buildKnowledgeBase } from '../deepseekClient.js';

interface Persona {
  id: string;
  name: string;
  role: string;
  intro: string;
  responses: Record<string, string>;
}

interface PlayerProfile {
  name: string;
}

interface DialogueMessage {
  speaker: string;
  text: string;
}

interface RpgDialogueProps {
  persona: Persona;
  player: PlayerProfile;
  topicLabels: Record<string, string>;
  onClose: () => void;
}

const DEFAULT_DEEPSEEK_API_KEY = 'sk-48ddd8a93a0342cfb9b96b050a965cf8';
const API_KEY_STORAGE_KEYS = [
  'deepseek_api_key',
  'pbs_deepseek_api_key',
  'solar_oracle_walkman_api_key',
  'solar_oracle_api_key',
];

function loadPersistedApiKey(): string {
  for (const key of API_KEY_STORAGE_KEYS) {
    const fromLocal = localStorage.getItem(key);
    if (fromLocal?.trim()) return fromLocal.trim();
    const fromSession = sessionStorage.getItem(key);
    if (fromSession?.trim()) return fromSession.trim();
  }
  return DEFAULT_DEEPSEEK_API_KEY;
}

function persistApiKey(value: string): void {
  for (const key of API_KEY_STORAGE_KEYS) {
    localStorage.setItem(key, value);
    sessionStorage.setItem(key, value);
  }
}

export function RpgDialogue({ persona, player, topicLabels, onClose }: RpgDialogueProps) {
  const [apiKey] = useState(() => loadPersistedApiKey());
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const orderedTopics = useMemo(() => Object.keys(topicLabels), [topicLabels]);
  const knowledge = useMemo(() => buildKnowledgeBase(persona), [persona]);

  useEffect(() => {
    persistApiKey(apiKey);
  }, [apiKey]);

  useEffect(() => {
    setMessages([
      {
        speaker: persona.name,
        text: `${persona.intro} 歡迎來到桃花源，你想從哪個面向開始聊？`,
      },
    ]);
    setQuestion('');
    setError('');
  }, [persona.id, persona.intro, persona.name]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function resolveTopic(questionInput: string): string {
    const q = questionInput.toLowerCase();
    const keywords: Record<string, string[]> = {
      nomadic: ['nomadic', 'travel', 'wandering', '遊牧', '移動'],
      camp: ['camp', 'hacker', '營隊', '黑客'],
      independent: ['independent', 'autonomy', '獨立', '自治'],
      artScience: ['science', 'art', '藝術', '科學'],
      funding: ['fund', 'grant', 'budget', '資金', '補助'],
      exchange: ['exchange', 'international', '國際', '交流'],
      sustainability: ['sustain', 'long-term', 'community', '永續', '社群'],
    };
    for (const topic of orderedTopics) {
      const words = keywords[topic] ?? [];
      if (words.some((word) => q.includes(word))) return topic;
      if (q.includes((topicLabels[topic] ?? '').toLowerCase())) return topic;
    }
    return orderedTopics.find((topic) => !!persona.responses[topic]) ?? 'nomadic';
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;
    if (!apiKey.trim()) {
      setError('DeepSeek API key is missing.');
      return;
    }
    persistApiKey(apiKey.trim());
    setQuestion('');
    setError('');
    setIsLoading(true);
    setMessages((prev) => [...prev, { speaker: player.name, text: trimmed }]);
    try {
      const topic = resolveTopic(trimmed);
      const answer = await askDeepSeekPersona({
        apiKey: apiKey.trim(),
        playerName: player.name,
        question: `${trimmed}\nTopic hint: ${topic}`,
        knowledge: {
          ...knowledge,
          responses: persona.responses,
        },
      });
      setMessages((prev) => [...prev, { speaker: persona.name, text: answer }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'DeepSeek request failed.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/35 px-8 py-8 pointer-events-none">
      <section className="pixel-panel pointer-events-auto w-[min(1320px,84vw)] h-[80vh] min-w-[min(860px,calc(100vw-24px))] px-14 py-12 text-text shadow-pixel flex flex-col">
        <div className="flex items-start justify-between gap-8 mb-5">
          <div>
            <p className="text-lg uppercase tracking-wide text-accent-bright mb-2">Wander and talk</p>
            <h2 className="text-2xl leading-none">{persona.name}</h2>
            <p className="text-xl text-text-muted mt-2">{persona.role}</p>
          </div>
          <button className="text-2xl text-text-muted hover:text-text" type="button" onClick={onClose}>
            x
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-bg/70 border border-border px-10 py-9 mb-6 text-xl">
          {messages.map((message, index) => (
            <p
              key={`${message.speaker}-${index.toString()}`}
              className="text-xl leading-relaxed mb-6 last:mb-0"
            >
              <span className="text-accent-bright">{message.speaker}: </span>
              {message.text}
            </p>
          ))}
          {isLoading && <p className="text-xl text-text-muted">{persona.name} is thinking...</p>}
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="flex gap-4">
          <input
            className="flex-1 bg-bg border-2 border-border px-7 py-6 text-xl text-text outline-none focus:border-accent-bright"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={`Ask ${persona.name} anything...`}
          />
          <button
            className="bg-accent text-white border-2 border-accent px-10 py-5 text-xl disabled:opacity-50"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? '...' : 'Talk'}
          </button>
          <button
            className="bg-bg text-text border-2 border-border px-10 py-5 text-xl"
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </form>

        {error && <p className="text-lg text-red-300 mt-4">{error}</p>}
      </section>
    </div>
  );
}
