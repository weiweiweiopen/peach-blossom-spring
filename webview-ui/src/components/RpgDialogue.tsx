import { useEffect, useMemo, useState } from 'react';

import {
  clearStoredDeepSeekApiKey,
  getInitialDeepSeekApiKey,
  hasStoredDeepSeekApiKey,
  writeStoredDeepSeekApiKey,
} from '../apiKeyStorage.js';
import { askDeepSeekPersona, buildKnowledgeBase } from '../deepseekClient.js';
import { type LanguageCode,t } from '../i18n.js';
import { getCharacterSprites } from '../office/sprites/spriteData.js';
import { Direction, type SpriteData } from '../office/types.js';
import { getWikiLinksForInterviewee } from '../wikiLinks.js';

interface Persona {
  id: string;
  name: string;
  role: string;
  intro: string;
  responses: Record<string, string>;
}

interface PlayerProfile {
  name: string;
  palette: number;
}

interface DialogueAvatar {
  palette: number;
  hueShift: number;
}

interface DialogueMessage {
  speaker: string;
  text: string;
}

interface RpgDialogueProps {
  persona: Persona;
  player: PlayerProfile;
  npcAvatar: DialogueAvatar;
  topicLabels: Record<string, string>;
  language: LanguageCode;
  onClose: () => void;
}

function PixelAvatar({ avatar, label }: { avatar: DialogueAvatar; label: string }) {
  const [frame, setFrame] = useState(0);
  const sprite = useMemo<SpriteData>(() => {
    const sprites = getCharacterSprites(avatar.palette, avatar.hueShift);
    return sprites.walk[Direction.DOWN][frame % 4];
  }, [avatar.hueShift, avatar.palette, frame]);

  useEffect(() => {
    const id = window.setInterval(() => setFrame((current) => current + 1), 120);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="bg-bg/80 border border-border p-2"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${(sprite[0]?.length ?? 1).toString()}, 3px)`,
          gridAutoRows: '3px',
        }}
        aria-label={label}
      >
        {sprite.flatMap((row, rowIndex) =>
          row.map((color, colIndex) => (
            <span
              key={`${rowIndex.toString()}-${colIndex.toString()}`}
              style={{ backgroundColor: color || 'transparent' }}
            />
          )),
        )}
      </div>
      <span className="max-w-[110px] truncate text-xs text-text-muted">{label}</span>
    </div>
  );
}

export function RpgDialogue({ persona, player, npcAvatar, topicLabels, language, onClose }: RpgDialogueProps) {
  const [apiKey, setApiKey] = useState(() => getInitialDeepSeekApiKey());
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isWikiOpen, setIsWikiOpen] = useState(false);
  const [isApiPanelOpen, setIsApiPanelOpen] = useState(false);
  const [manualApiInput, setManualApiInput] = useState('');
  const [savedLocally, setSavedLocally] = useState(() => hasStoredDeepSeekApiKey());

  const orderedTopics = useMemo(() => Object.keys(topicLabels), [topicLabels]);
  const knowledge = useMemo(() => buildKnowledgeBase(persona), [persona]);
  const wiki = useMemo(() => getWikiLinksForInterviewee(persona.id), [persona.id]);

  useEffect(() => {
    setMessages([
      {
        speaker: persona.name,
        text:
          language === 'zh-TW'
            ? `${persona.intro} 歡迎來到桃花源，你想問我什麼？`
            : `${persona.intro} Welcome to Peach Blossom Spring. What would you like to ask?`,
      },
    ]);
    setQuestion('');
    setError('');
    setIsWikiOpen(false);
  }, [language, persona.id, persona.intro, persona.name]);

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
      nomadic: ['nomadic', 'travel', 'wandering', '遊牧', '移動', 'teach'],
      camp: ['camp', 'hacker', '營隊', '黑客'],
      independent: ['independent', 'autonomy', '獨立', '自治'],
      artScience: ['science', 'art', '藝術', '科學'],
      funding: ['fund', 'grant', 'budget', '資金', '補助'],
      exchange: ['exchange', 'international', '國際', '交流'],
      sustainability: ['sustain', 'long-term', 'community', '永續', '社群', 'where'],
    };
    for (const topic of orderedTopics) {
      const words = keywords[topic] ?? [];
      if (words.some((word) => q.includes(word))) return topic;
      if (q.includes((topicLabels[topic] ?? '').toLowerCase())) return topic;
    }
    return orderedTopics.find((topic) => !!persona.responses[topic]) ?? 'nomadic';
  }

  async function submitPrompt(prompt: string): Promise<void> {
    const trimmed = prompt.trim();
    if (!trimmed || isLoading) return;
    if (!apiKey.trim()) {
      setError('DeepSeek API key is missing.');
      return;
    }

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
        preferredLanguage: language,
      });
      writeStoredDeepSeekApiKey(apiKey.trim());
      setMessages((prev) => [...prev, { speaker: persona.name, text: answer }]);
    } catch (err) {
      if (err instanceof Error && err.message.includes('DeepSeek request failed (401)')) {
        clearStoredDeepSeekApiKey();
        setSavedLocally(false);
        setError('DeepSeek API key is invalid. Update the key and try again.');
      } else {
        setError(err instanceof Error ? err.message : 'DeepSeek request failed.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleSaveLocalApiKey(): void {
    const trimmed = manualApiInput.trim();
    if (!trimmed) return;
    writeStoredDeepSeekApiKey(trimmed);
    setApiKey(trimmed);
    setManualApiInput('');
    setSavedLocally(true);
    setError('');
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const trimmed = question.trim();
    setQuestion('');
    await submitPrompt(trimmed);
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/35 px-8 py-8 pointer-events-none">
      <section className="pixel-panel pointer-events-auto w-[min(1320px,84vw)] h-[80vh] min-w-[min(860px,calc(100vw-24px))] px-14 py-12 text-text shadow-pixel flex flex-col">
        <div className="flex items-start justify-between gap-8 mb-5">
          <div className="flex items-start gap-6">
            <div className="flex gap-4">
              <PixelAvatar avatar={{ palette: player.palette, hueShift: 0 }} label={player.name} />
              <PixelAvatar avatar={npcAvatar} label={persona.name} />
            </div>
            <div>
              <p className="text-lg uppercase tracking-wide text-accent-bright mb-2">{t(language, 'wanderAndTalk')}</p>
              <h2 className="text-2xl leading-none">{persona.name}</h2>
              <p className="text-xl text-text-muted mt-2">{persona.role}</p>
            </div>
          </div>
          <button className="text-2xl text-text-muted hover:text-text" type="button" onClick={onClose}>
            x
          </button>
        </div>

        <div className="flex-1 min-h-0 flex gap-6 mb-6">
          <div className="flex-1 overflow-auto bg-bg/70 border border-border px-10 py-9 text-xl">
            {messages.map((message, index) => (
              <p
                key={`${message.speaker}-${index.toString()}`}
                className="text-xl leading-relaxed mb-6 last:mb-0"
              >
                <span className="text-accent-bright">{message.speaker}: </span>
                {message.text}
              </p>
            ))}
            {isLoading && (
              <p className="text-xl text-text-muted">
                {persona.name} {t(language, 'thinking')}
              </p>
            )}
          </div>
          {isWikiOpen && (
            <aside className="w-[320px] shrink-0 overflow-auto bg-bg/70 border border-border px-7 py-7">
              <h3 className="text-lg text-accent-bright mb-4">{t(language, 'wiki')}</h3>
              {wiki.links.length === 0 ? (
                <p className="text-base text-text-muted">{t(language, 'noWikiLinks')}</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {wiki.links.map((link) => (
                    <a
                      key={`${link.title}-${link.url}`}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="border border-border px-4 py-4 hover:border-accent-bright"
                    >
                      <p className="text-base text-accent-bright">{link.title}</p>
                      <p className="text-sm text-text-muted mt-2 leading-snug">{link.description}</p>
                    </a>
                  ))}
                </div>
              )}
            </aside>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mb-5">
          <button
            className="bg-bg text-text border border-border hover:border-accent-bright px-5 py-3 text-base"
            type="button"
            onClick={() => void submitPrompt(t(language, 'teachMe'))}
          >
            {t(language, 'teachMe')}
          </button>
          <button
            className="bg-bg text-text border border-border hover:border-accent-bright px-5 py-3 text-base"
            type="button"
            onClick={() => void submitPrompt(t(language, 'whereIsThis'))}
          >
            {t(language, 'whereIsThis')}
          </button>
          <button
            className="bg-bg text-text border border-border hover:border-accent-bright px-5 py-3 text-base"
            type="button"
            onClick={() => setIsWikiOpen((prev) => !prev)}
          >
            {t(language, 'wiki')}
          </button>
        </div>

        {!apiKey.trim() && (
          <div className="mb-4 border border-border bg-bg/60 px-4 py-3 text-sm text-text-muted">
            <p className="text-accent-bright mb-1">{language === 'zh-TW' ? '缺少 API key' : 'API key missing'}</p>
            <p>
              {language === 'zh-TW'
                ? '請在 webview-ui/.env.local 設定 VITE_DEEPSEEK_API_KEY，或使用本機瀏覽器儲存一次。'
                : 'Set VITE_DEEPSEEK_API_KEY in webview-ui/.env.local, or save it once in local browser storage.'}
            </p>
          </div>
        )}
        <details className="mb-4" open={isApiPanelOpen} onToggle={(event) => setIsApiPanelOpen(event.currentTarget.open)}>
          <summary className="cursor-pointer text-sm text-text-muted">
            {language === 'zh-TW' ? '本機 API key 設定' : 'Local API key settings'}
          </summary>
          <div className="mt-3 border border-border bg-bg/60 px-4 py-4">
            <input
              className="w-full bg-bg border border-border px-4 py-3 text-base text-text outline-none focus:border-accent-bright mb-3"
              type="password"
              value={manualApiInput}
              onChange={(event) => setManualApiInput(event.target.value)}
              placeholder="VITE_DEEPSEEK_API_KEY"
              autoComplete="off"
              spellCheck={false}
            />
            <button className="bg-bg text-text border border-border px-4 py-2 text-sm" type="button" onClick={handleSaveLocalApiKey}>
              {language === 'zh-TW' ? '儲存到本機' : 'Save locally'}
            </button>
            {savedLocally && (
              <p className="text-xs text-text-muted mt-2">{language === 'zh-TW' ? '已儲存在本機。' : 'Saved locally.'}</p>
            )}
          </div>
        </details>

        <form onSubmit={(event) => void handleSubmit(event)} className="flex gap-4">
          <input
            className="flex-1 bg-bg border-2 border-border px-7 py-6 text-xl text-text outline-none focus:border-accent-bright"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={`${persona.name} - ${t(language, 'askAnything')}`}
          />
          <button
            className="bg-accent text-white border-2 border-accent px-10 py-5 text-xl disabled:opacity-50"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? '...' : t(language, 'talk')}
          </button>
          <button
            className="bg-bg text-text border-2 border-border px-10 py-5 text-xl"
            type="button"
            onClick={onClose}
          >
            {t(language, 'close')}
          </button>
        </form>

        {error && <p className="text-lg text-red-300 mt-4">{error}</p>}
      </section>
    </div>
  );
}
