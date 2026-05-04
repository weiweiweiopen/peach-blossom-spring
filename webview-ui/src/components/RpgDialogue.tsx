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
  const orderedTopics = useMemo(() => Object.keys(topicLabels), [topicLabels]);

  useEffect(() => {
    setMessages([{ speaker: persona.name, text: `${persona.intro} 你想問我什麼主題？` }]);
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

  function handleTopicClick(topic: string): void {
    const label = topicLabels[topic] ?? topic;
    const answer = persona.responses[topic];
    if (!answer) return;
    setMessages((prev) => [
      ...prev,
      { speaker: player.name, text: label },
      { speaker: persona.name, text: answer },
    ]);
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/35 px-8 py-8 pointer-events-none">
      <section className="pixel-panel pointer-events-auto w-[min(1100px,66vw)] h-[66vh] min-w-[min(760px,calc(100vw-32px))] px-12 py-10 text-text shadow-pixel flex flex-col">
        <div className="flex items-start justify-between gap-8 mb-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-accent-bright mb-2">Wander and talk</p>
            <h2 className="text-2xl leading-none">{persona.name}</h2>
            <p className="text-sm text-text-muted mt-2">{persona.role}</p>
          </div>
          <button className="text-2xl text-text-muted hover:text-text" type="button" onClick={onClose}>
            x
          </button>
        </div>
        <div className="flex-1 overflow-auto bg-bg/70 border border-border px-8 py-7 mb-6 text-lg">
          {messages.map((message, index) => (
            <p key={`${message.speaker}-${index.toString()}`} className="text-base leading-relaxed mb-5 last:mb-0">
              <span className="text-accent-bright">{message.speaker}: </span>
              {message.text}
            </p>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {orderedTopics.map((topic) => (
            <button
              key={topic}
              type="button"
              className="text-left bg-bg border border-border px-5 py-4 text-sm text-text hover:border-accent-bright"
              onClick={() => handleTopicClick(topic)}
              disabled={!persona.responses[topic]}
            >
              {topicLabels[topic] ?? topic}
            </button>
          ))}
        </div>
        <div className="mt-4">
          <button className="bg-accent text-white border-2 border-accent px-8 py-4" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </section>
    </div>
  );
}
