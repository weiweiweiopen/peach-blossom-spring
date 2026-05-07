import { useEffect, useMemo, useRef, useState } from 'react';

import { askDeepSeekPersona, buildKnowledgeBase } from '../deepseekClient.js';
import { type LanguageCode, t } from '../i18n.js';
import { getCharacterSprites } from '../office/sprites/spriteData.js';
import { Direction, type SpriteData } from '../office/types.js';

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
  currentRole?: string;
  mission?: string;
  constraints?: string;
  skills?: string;
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
  onOpenWiki?: () => void;
  onSimEvent?: (prompt: string, topic: string) => void;
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

function cleanPromptSnippet(text: string, language: LanguageCode): string {
  const oneLine = text
    .replace(/^#+\s*/, '')
    .replace(/^Q\d+[：:]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
  const withoutLatin = language === 'zh-TW' ? oneLine.replace(/[A-Za-z][A-Za-z0-9._/-]*/g, '').replace(/\s+/g, ' ') : oneLine;
  return withoutLatin.replace(/[「」"']/g, '').trim();
}

function shorten(text: string, max: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return normalized.length > max ? `${normalized.slice(0, max).trim()}...` : normalized;
}

function makeFixedQuestions(language: LanguageCode): string[] {
  const questions: Record<LanguageCode, string[]> = {
    'zh-TW': ['你是誰？', '這裡是哪裡？', '你可以給我一些意見嗎？'],
    en: ['Who are you?', 'Where am I?', 'Can you give me some advice?'],
    ja: ['あなたは誰？', 'ここはどこ？', '何か助言をもらえる？'],
    th: ['คุณคือใคร?', 'ที่นี่คือที่ไหน?', 'ช่วยให้คำแนะนำฉันได้ไหม?'],
  };
  return questions[language];
}

function makeSuggestedQuestions(
  transcript: string,
  persona: Persona,
  player: PlayerProfile,
  language: LanguageCode,
  seed: number,
): string[] {
  const sourceLines = transcript
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^##\s*Q\d+[：:]/.test(line));
  const fallbackLines = transcript
    .split(/[。！？.!?]\s*/)
    .map((line) => line.trim())
    .filter((line) => line.length > (language === 'zh-TW' ? 18 : 40));
  const candidates = sourceLines.length > 0 ? sourceLines : fallbackLines;
  const mission = shorten(
    player.mission?.trim() || t(language, 'dialogue.fallbackMission'),
    language === 'zh-TW' ? 34 : 72,
  );
  const skills = shorten(player.skills?.trim() || t(language, 'dialogue.fallbackSkills'), language === 'zh-TW' ? 22 : 48);
  const role = shorten(persona.role, language === 'zh-TW' ? 24 : 48);
  const snippets = candidates.map((item) => cleanPromptSnippet(item, language)).filter(Boolean);
  const offset = snippets.length > 0 ? (seed + persona.id.length) % snippets.length : 0;
  const detail = snippets.length > 0
    ? shorten(snippets[offset], language === 'zh-TW' ? 24 : 52)
    : role;
  const zhTemplates = [
    `你說你是${role}？你對「${mission}」有什麼看法？`,
    `如果我想用「${skills}」開始做這件事，你會建議我先避開什麼？`,
    `你剛剛提到「${detail}」，這跟我的任務有什麼關係？`,
    `以你的經驗，我這個想法最容易在哪裡卡住？`,
    `如果我們才剛認識，你會先問我哪一個問題？`,
  ];
  const enTemplates = [
    `You work with ${role}. What do you think about "${mission}"?`,
    `If I start with ${skills}, what should I be careful about first?`,
    `You mentioned "${detail}". How does that connect to my mission?`,
    `From your experience, where might this idea get stuck?`,
    `If we just met, what would you ask me first?`,
  ];
  const jaTemplates = [
    `あなたは${role}として活動しているのですね。「${mission}」についてどう思いますか？`,
    `「${skills}」から始めるなら、最初に何を避けるべきですか？`,
    `さきほどの「${detail}」は、私の任務とどうつながりますか？`,
    `あなたの経験では、このアイデアはどこで詰まりやすいですか？`,
    `初対面なら、まず私にどんな質問をしますか？`,
  ];
  const thTemplates = [
    `คุณทำงานกับ${role} คุณคิดอย่างไรกับ “${mission}”?`,
    `ถ้าฉันเริ่มจาก “${skills}” ควรระวังอะไรเป็นอย่างแรก?`,
    `คุณพูดถึง “${detail}” สิ่งนี้เกี่ยวกับภารกิจของฉันอย่างไร?`,
    `จากประสบการณ์ของคุณ ไอเดียนี้อาจติดขัดตรงไหน?`,
    `ถ้าเราเพิ่งรู้จักกัน คุณจะถามฉันเรื่องอะไรก่อน?`,
  ];
  const templatesByLanguage: Record<LanguageCode, string[]> = {
    'zh-TW': zhTemplates,
    en: enTemplates,
    ja: jaTemplates,
    th: thTemplates,
  };
  const templates = templatesByLanguage[language];
  return Array.from({ length: 3 }, (_, index) => templates[(seed + index) % templates.length]);
}


function makeIntroMessage(persona: Persona, language: LanguageCode): string {
  const messages: Record<LanguageCode, string> = {
    'zh-TW': `${persona.intro} 歡迎來到桃花源，你想問我什麼？`,
    en: `${persona.intro} Welcome to Peach Blossom Spring. What would you like to ask?`,
    ja: `${persona.intro} 桃花源へようこそ。何を聞きたいですか？`,
    th: `${persona.intro} ยินดีต้อนรับสู่ Peach Blossom Spring คุณอยากถามอะไร?`,
  };
  return messages[language];
}

export function RpgDialogue({ persona, player, npcAvatar, topicLabels, language, onClose, onOpenWiki, onSimEvent }: RpgDialogueProps) {
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [areSuggestionsOpen, setAreSuggestionsOpen] = useState(false);
  const [questionSeed, setQuestionSeed] = useState(() => Math.floor(Math.random() * 1000));
  const messageLogRef = useRef<HTMLDivElement>(null);

  const orderedTopics = useMemo(() => Object.keys(topicLabels), [topicLabels]);
  const knowledge = useMemo(() => buildKnowledgeBase(persona), [persona]);
  const suggestedQuestions = useMemo(() => {
    const transcript = language === 'zh-TW' ? knowledge.transcript_zh || knowledge.transcript_en : knowledge.transcript_en || knowledge.transcript_zh;
    return makeSuggestedQuestions(transcript, persona, player, language, questionSeed);
  }, [knowledge.transcript_en, knowledge.transcript_zh, language, persona, player, questionSeed]);
  const fixedQuestions = useMemo(() => makeFixedQuestions(language), [language]);

  useEffect(() => {
    setMessages([
      {
        speaker: persona.name,
        text: makeIntroMessage(persona, language),
      },
    ]);
    setQuestion('');
    setError('');
    setAreSuggestionsOpen(false);
    setQuestionSeed(Math.floor(Math.random() * 1000));
  }, [language, persona]);

  useEffect(() => {
    const log = messageLogRef.current;
    if (!log) return;
    log.scrollTo({ top: log.scrollHeight, behavior: 'smooth' });
  }, [isLoading, messages]);

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

    setError('');
    setIsLoading(true);
    setMessages((prev) => [...prev, { speaker: player.name, text: trimmed }]);
    try {
      const topic = resolveTopic(trimmed);
      onSimEvent?.(trimmed, topic);
      const answer = await askDeepSeekPersona({
        playerName: player.name,
        question: `${trimmed}\nTopic hint: ${topic}`,
        knowledge: {
          ...knowledge,
          responses: persona.responses,
        },
        preferredLanguage: language,
      });
      setMessages((prev) => [...prev, { speaker: persona.name, text: answer }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t(language, 'dialogue.requestFailed'));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const trimmed = question.trim();
    setQuestion('');
    await submitPrompt(trimmed);
  }

  return (
    <div className="rpg-dialogue-overlay absolute inset-0 z-50 flex items-center justify-center bg-black/35 px-8 py-8 pointer-events-none" data-no-mobile-drag="true">
      <section className="rpg-dialogue-panel pixel-panel pointer-events-auto w-[min(1320px,84vw)] h-[80vh] min-w-[min(860px,calc(100vw-24px))] px-14 py-12 text-text shadow-pixel flex flex-col" data-language={language}>
        <div className="rpg-dialogue-header flex items-start justify-between gap-8 mb-5">
          <div className="rpg-dialogue-title flex items-start gap-6">
            <div className="rpg-dialogue-avatars flex gap-4">
              <PixelAvatar avatar={{ palette: player.palette, hueShift: 0 }} label={player.name} />
              <PixelAvatar avatar={npcAvatar} label={persona.name} />
            </div>
            <div>
              <p className="rpg-dialogue-kicker text-lg uppercase tracking-wide text-accent-bright mb-2">{t(language, 'home.wanderAndTalk')}</p>
              <h2 className="rpg-dialogue-name text-2xl leading-none">{persona.name}</h2>
              <p className="rpg-dialogue-role text-xl text-text-muted mt-2">{persona.role}</p>
            </div>
          </div>
          <button className="rpg-dialogue-x text-2xl text-text-muted hover:text-text" type="button" onClick={onClose}>
            x
          </button>
        </div>

        <div className="rpg-dialogue-main flex-1 min-h-0 flex gap-6 mb-6">
          <div ref={messageLogRef} className="rpg-dialogue-log flex-1 overflow-auto bg-bg/70 border border-border px-10 py-9 text-xl">
            {messages.map((message, index) => (
              <p
                key={`${message.speaker}-${index.toString()}`}
                className="rpg-dialogue-message text-xl leading-relaxed mb-6 last:mb-0"
              >
                <span className="text-accent-bright">{message.speaker}: </span>
                {message.text}
              </p>
            ))}
            {isLoading && (
              <p className="rpg-dialogue-thinking text-base text-text-muted">
                {persona.name} {t(language, 'dialogue.thinking')}
              </p>
            )}
          </div>
        </div>

        <div className="rpg-dialogue-actions flex flex-wrap items-start gap-3 mb-5">
          <button
            className="rpg-dialogue-question-toggle rpg-dialogue-chip bg-accent/80 text-white border border-accent px-5 py-3 text-base"
            type="button"
            aria-expanded={areSuggestionsOpen}
            onClick={() => setAreSuggestionsOpen((prev) => !prev)}
          >
            {t(language, 'dialogue.askQuestion')} {areSuggestionsOpen ? '▲' : '▼'}
          </button>
          <button
            className="rpg-dialogue-wiki-button rpg-dialogue-chip bg-bg text-text border border-border px-5 py-3 text-base"
            type="button"
            onClick={onOpenWiki}
          >
            📚 {t(language, 'dialogue.openWiki')}
          </button>
          {areSuggestionsOpen && (
            <div className="rpg-dialogue-question-drawer w-full border border-border bg-bg/70 px-4 py-4">
              <div className="rpg-dialogue-fixed flex flex-wrap gap-3 mb-3">
                {fixedQuestions.map((item) => (
                  <button
                    key={item}
                    className="rpg-dialogue-chip bg-accent/80 text-white border border-accent px-5 py-3 text-base"
                    type="button"
                    onClick={() => void submitPrompt(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="rpg-dialogue-suggestion-list flex flex-wrap gap-3">
                {suggestedQuestions.map((item) => (
                  <button
                    key={item}
                    className="rpg-dialogue-chip bg-bg text-text border border-border px-5 py-3 text-base"
                    type="button"
                    onClick={() => void submitPrompt(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="rpg-dialogue-form flex gap-4">
          <input
            className="rpg-dialogue-input flex-1 bg-bg border-2 border-border px-7 py-6 text-xl text-text outline-none focus:border-accent-bright"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={t(language, 'dialogue.inputPlaceholder', { name: persona.name })}
          />
          <button
            className="rpg-dialogue-submit bg-accent text-white border-2 border-accent px-10 py-5 text-xl disabled:opacity-50"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? '...' : t(language, 'dialogue.talkButton')}
          </button>
          <button
            className="rpg-dialogue-close-secondary bg-bg text-text border-2 border-border px-10 py-5 text-xl"
            type="button"
            onClick={onClose}
          >
            {t(language, 'common.close')}
          </button>
        </form>

        {error && <p className="text-lg text-red-300 mt-4">{error}</p>}
      </section>
    </div>
  );
}
