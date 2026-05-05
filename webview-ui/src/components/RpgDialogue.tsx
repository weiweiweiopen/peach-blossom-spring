import { useEffect, useState, type FormEvent } from 'react';

import { getInitialDeepSeekApiKey, writeStoredDeepSeekApiKey } from '../apiKeyStorage.js';
import { askDeepSeekPersona, loadPersonaKnowledge, type KnowledgeBase } from '../deepseekClient.js';

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
  onClose: () => void;
}

export function RpgDialogue({ persona, player, onClose }: RpgDialogueProps) {
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [apiKey, setApiKey] = useState(() => getInitialDeepSeekApiKey());
  const [apiKeyDraft, setApiKeyDraft] = useState('');
  const [knowledge, setKnowledge] = useState<KnowledgeBase | null>(null);
  const [isReplying, setIsReplying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setMessages([
      {
        speaker: persona.name,
        text: `你好，我是${persona.name}。${persona.role}。在桃花源裡，想聊什麼就直接問我。`,
      },
    ]);
    setQuestion('');
    setErrorMessage('');
    setKnowledge(null);

    let isCancelled = false;
    void loadPersonaKnowledge(persona.id)
      .then((loadedKnowledge) => {
        if (!isCancelled) setKnowledge(loadedKnowledge);
      })
      .catch(() => {
        if (!isCancelled) setErrorMessage('讀取 NPC 知識庫失敗，請稍後再試。');
      });

    return () => {
      isCancelled = true;
    };
  }, [persona.id, persona.name, persona.role]);

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

  function saveApiKey(candidate: string): string {
    const trimmed = candidate.trim();
    if (!trimmed) return apiKey;
    writeStoredDeepSeekApiKey(trimmed);
    setApiKey(trimmed);
    setApiKeyDraft('');
    return trimmed;
  }

  function handleSaveApiKey(): void {
    const saved = saveApiKey(apiKeyDraft);
    setErrorMessage(
      saved
        ? 'API key 已儲存在這台裝置，下次開啟會自動使用。'
        : '請先貼上 API key；儲存後，下次進入 PBS 會自動沿用。',
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isReplying) return;

    const activeApiKey = apiKey || saveApiKey(apiKeyDraft);
    if (!activeApiKey) {
      setErrorMessage('請先貼上 API key；儲存後，下次進入 PBS 會自動沿用。');
      return;
    }
    if (!knowledge) {
      setErrorMessage('NPC 知識庫還在載入中，請稍候再送出。');
      return;
    }

    setQuestion('');
    setErrorMessage('');
    setMessages((prev) => [...prev, { speaker: player.name, text: trimmed }]);
    setIsReplying(true);

    try {
      const response = await askDeepSeekPersona({
        apiKey: activeApiKey,
        playerName: player.name,
        question: trimmed,
        knowledge,
      });
      setMessages((prev) => [...prev, { speaker: persona.name, text: response }]);
    } catch (error) {
      const fallback = error instanceof Error ? error.message : 'Unknown error';
      setErrorMessage(`對話請求失敗：${fallback}`);
      setMessages((prev) => [
        ...prev,
        { speaker: persona.name, text: '我暫時連不上對話服務，請確認 API key 或稍後再試。' },
      ]);
    } finally {
      setIsReplying(false);
    }
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/35 px-8 py-8 pointer-events-none">
      <section className="pixel-panel pointer-events-auto w-[min(1280px,82vw)] h-[78vh] min-w-[min(860px,calc(100vw-32px))] px-14 py-12 text-text shadow-pixel flex flex-col">
        <div className="flex items-start justify-between gap-8 mb-6">
          <div>
            <p className="text-lg uppercase tracking-wide text-accent-bright mb-3">Wander and talk</p>
            <h2 className="text-4xl leading-none">{persona.name}</h2>
            <p className="text-2xl text-text-muted mt-3">{persona.role}</p>
          </div>
          <button className="text-4xl text-text-muted hover:text-text" type="button" onClick={onClose}>
            x
          </button>
        </div>

        {!apiKey && (
          <div className="mb-6 border border-border bg-bg/70 px-7 py-6">
            <p className="text-xl text-accent-bright mb-4">API key setup</p>
            <div className="flex gap-4">
              <input
                className="flex-1 bg-bg border-2 border-border px-6 py-5 text-2xl text-text outline-none focus:border-accent-bright"
                type="password"
                value={apiKeyDraft}
                onChange={(event) => setApiKeyDraft(event.target.value)}
                placeholder="Paste API key once; PBS will store it locally"
              />
              <button
                className="bg-accent text-white border-2 border-accent px-8 py-4 text-2xl"
                type="button"
                onClick={handleSaveApiKey}
              >
                Save
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto bg-bg/70 border border-border px-9 py-8 mb-6 text-2xl">
          {messages.map((message, index) => (
            <p
              key={`${message.speaker}-${index.toString()}`}
              className="text-2xl leading-relaxed mb-6 last:mb-0"
            >
              <span className="text-accent-bright">{message.speaker}: </span>
              {message.text}
            </p>
          ))}
          {isReplying && (
            <p className="text-2xl leading-relaxed text-text-muted">{persona.name}: ...</p>
          )}
        </div>

        {errorMessage && <p className="mb-5 text-xl leading-snug text-warning">{errorMessage}</p>}

        <form onSubmit={handleSubmit} className="flex gap-4">
          <input
            className="flex-1 bg-bg border-2 border-border px-7 py-6 text-2xl text-text outline-none focus:border-accent-bright"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={`Ask ${persona.name} anything...`}
            disabled={isReplying}
          />
          <button
            className="bg-accent text-white border-2 border-accent px-10 py-5 text-2xl disabled:opacity-50"
            type="submit"
            disabled={isReplying}
          >
            Talk
          </button>
          <button
            className="bg-bg text-text border-2 border-border px-10 py-5 text-2xl"
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </form>
      </section>
    </div>
  );
}
