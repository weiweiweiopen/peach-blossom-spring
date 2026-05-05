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

export function RpgDialogue({ persona, player, topicLabels, onClose }: RpgDialogueProps) {
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem('deepseek_api_key') ?? '');
  const [showKeyField, setShowKeyField] = useState(() => !sessionStorage.getItem('deepseek_api_key'));
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const orderedTopics = useMemo(
    () => Object.keys(topicLabels).filter((topic) => persona.responses[topic]),
    [persona.responses, topicLabels],
  );
  const knowledge = useMemo(() => buildKnowledgeBase(persona), [persona]);

  useEffect(() => {
    setMessages([
      {
        speaker: persona.name,
        text: `${persona.intro} 你想問我什麼？`,
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

  function handleTopicPick(topic: string): void {
    const response = persona.responses[topic];
    if (!response) return;
    setMessages((prev) => [
      ...prev,
      { speaker: player.name, text: topicLabels[topic] ?? topic },
      { speaker: persona.name, text: response },
    ]);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;
    if (!apiKey.trim()) {
      setError('Add a DeepSeek API key for free-form chat. Key is stored only in this browser session.');
      setShowKeyField(true);
      return;
    }
    sessionStorage.setItem('deepseek_api_key', apiKey.trim());
    setQuestion('');
    setError('');
    setIsLoading(true);
    setMessages((prev) => [...prev, { speaker: player.name, text: trimmed }]);
    try {
      const answer = await askDeepSeekPersona({
        apiKey: apiKey.trim(),
        playerName: player.name,
        question: trimmed,
        knowledge,
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
      <section className="pixel-panel pointer-events-auto w-[min(1100px,72vw)] h-[70vh] min-w-[min(760px,calc(100vw-32px))] px-12 py-10 text-text shadow-pixel flex flex-col">
        <div className="flex items-start justify-between gap-8 mb-5">
          <div>
            <p className="text-sm uppercase tracking-wide text-accent-bright mb-2">Wander and talk</p>
            <h2 className="text-2xl leading-none">{persona.name}</h2>
            <p className="text-base text-text-muted mt-2">{persona.role}</p>
          </div>
          <button className="text-2xl text-text-muted hover:text-text" type="button" onClick={onClose}>
            x
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-bg/70 border border-border px-8 py-7 mb-5 text-base">
          {messages.map((message, index) => (
            <p
              key={`${message.speaker}-${index.toString()}`}
              className="text-base leading-relaxed mb-5 last:mb-0"
            >
              <span className="text-accent-bright">{message.speaker}: </span>
              {message.text}
            </p>
          ))}
          {isLoading && <p className="text-base text-text-muted">{persona.name} is thinking...</p>}
        </div>

        <div className="flex flex-wrap gap-3 mb-5">
          {orderedTopics.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => handleTopicPick(topic)}
              className="bg-bg text-text border border-border hover:border-accent-bright px-5 py-3 text-sm"
            >
              {topicLabels[topic] ?? topic}
            </button>
          ))}
        </div>

        {showKeyField && (
          <input
            className="w-full bg-bg border border-border px-5 py-4 text-sm text-text outline-none focus:border-accent-bright mb-3"
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="DeepSeek API key (kept only in this browser session)"
          />
        )}

        <form onSubmit={(event) => void handleSubmit(event)} className="flex gap-4">
          <input
            className="flex-1 bg-bg border-2 border-border px-6 py-5 text-base text-text outline-none focus:border-accent-bright"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={`Ask ${persona.name} anything...`}
          />
          <button
            className="bg-accent text-white border-2 border-accent px-8 py-4 text-base disabled:opacity-50"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? '...' : 'Talk'}
          </button>
          <button
            className="bg-bg text-text border-2 border-border px-8 py-4 text-base"
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </form>

        {error && <p className="text-sm text-red-300 mt-3">{error}</p>}
      </section>
    </div>
  );
}
