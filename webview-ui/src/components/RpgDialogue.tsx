import { useEffect, useMemo, useState } from 'react';

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
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [question, setQuestion] = useState('');
  const orderedTopics = useMemo(() => Object.keys(topicLabels), [topicLabels]);
  const topicKeywordMap: Record<string, string[]> = {
    nomadic: ['nomadic', 'travel', 'mobile', '遷徙', '遊牧'],
    camp: ['camp', 'hacker', 'gather', '營隊', '黑客'],
    independent: ['independent', 'autonomy', 'solo', '獨立', '自治'],
    artScience: ['science', 'art', 'hybrid', '藝術', '科學'],
    funding: ['fund', 'grant', 'budget', '資金', '補助'],
    exchange: ['exchange', 'international', 'global', '交流', '國際'],
    sustainability: ['sustain', 'long-term', 'community', '永續', '社群'],
  };

  useEffect(() => {
    setMessages([
      {
        speaker: persona.name,
        text: `你好，我是${persona.name}。${persona.role}。在桃花源裡，想聊什麼就直接問我。`,
      },
    ]);
    setQuestion('');
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

  function resolveTopic(input: string): string {
    const normalized = input.toLowerCase();
    for (const topic of orderedTopics) {
      if ((topicKeywordMap[topic] ?? []).some((keyword) => normalized.includes(keyword))) {
        return topic;
      }
      const label = topicLabels[topic];
      if (label && normalized.includes(label.toLowerCase())) {
        return topic;
      }
    }
    return orderedTopics.find((topic) => !!persona.responses[topic]) ?? orderedTopics[0] ?? 'nomadic';
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;
    const topic = resolveTopic(trimmed);
    const response = persona.responses[topic] ?? '我先記下這個問題，我們可以從其他角度再聊一次。';
    setMessages((prev) => [
      ...prev,
      { speaker: player.name, text: trimmed },
      { speaker: persona.name, text: response },
    ]);
    setQuestion('');
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
        <div className="flex-1 overflow-auto bg-bg/70 border border-border px-8 py-7 mb-6 text-lg">
          {messages.map((message, index) => (
            <p key={`${message.speaker}-${index.toString()}`} className="text-lg leading-relaxed mb-5 last:mb-0">
              <span className="text-accent-bright">{message.speaker}: </span>
              {message.text}
            </p>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex gap-4">
          <input
            className="flex-1 bg-bg border-2 border-border px-6 py-5 text-lg text-text outline-none focus:border-accent-bright"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={`Ask ${persona.name} anything...`}
          />
          <button className="bg-accent text-white border-2 border-accent px-8 py-4 text-lg" type="submit">
            Talk
          </button>
          <button className="bg-bg text-text border-2 border-border px-8 py-4 text-lg" type="button" onClick={onClose}>
            Close
          </button>
        </form>
      </section>
    </div>
  );
}
