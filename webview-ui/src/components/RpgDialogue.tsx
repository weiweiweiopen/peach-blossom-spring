import { useEffect, useState } from 'react';

import { askDeepSeekPersona, loadPersonaKnowledge } from '../deepseekClient.js';

interface Persona {
  id: string;
  name: string;
  role: string;
  intro: string;
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
  onClose: () => void;
}

export function RpgDialogue({ persona, player, onClose }: RpgDialogueProps) {
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem('deepseek_api_key') ?? '');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<DialogueMessage[]>([
    { speaker: persona.name, text: `${persona.intro} 你想問我什麼？` },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMessages([{ speaker: persona.name, text: `${persona.intro} 你想問我什麼？` }]);
    setQuestion('');
    setError('');
  }, [persona]);

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;
    if (!apiKey.trim()) {
      setError('請先輸入 DeepSeek API key。Key 只會存在這個瀏覽器 session，不會寫進 Git。');
      return;
    }

    sessionStorage.setItem('deepseek_api_key', apiKey.trim());
    setQuestion('');
    setError('');
    setIsLoading(true);
    setMessages((prev) => [...prev, { speaker: player.name, text: trimmed }]);

    try {
      const knowledge = await loadPersonaKnowledge(persona.id);
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
      <section className="pixel-panel pointer-events-auto w-[min(1100px,66vw)] h-[66vh] min-w-[min(760px,calc(100vw-32px))] px-12 py-10 text-text shadow-pixel flex flex-col">
        <div className="flex items-start justify-between gap-8 mb-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-accent-bright mb-2">RPG dialogue</p>
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
          {isLoading && <p className="text-sm text-text-muted">{persona.name} is thinking...</p>}
        </div>
        <form onSubmit={handleSubmit}>
          <input
            className="w-full bg-bg border border-border px-5 py-4 text-sm text-text outline-none focus:border-accent-bright mb-4"
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="DeepSeek API key, kept only in this browser session"
          />
          <div className="flex gap-4">
            <input
              className="flex-1 bg-bg border-2 border-border px-5 py-4 text-base text-text outline-none focus:border-accent-bright"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={`Ask ${persona.name}...`}
            />
            <button className="bg-accent text-white border-2 border-accent px-8 py-4" type="submit" disabled={isLoading}>
              Talk
            </button>
          </div>
          {error && <p className="text-sm text-red-300 mt-4">{error}</p>}
        </form>
      </section>
    </div>
  );
}
