import { useRef } from 'react';

import { type LanguageCode, supportedLanguages, t } from '../i18n.js';

interface PlayerProfile {
  name: string;
  palette: number;
  avatarTitle?: string;
  currentRole: string;
  mission: string;
  constraints?: string;
  skills?: string;
}

type StartMode = 'camp' | 'expedition';

interface PlayerSetupProps {
  language: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
  onStart: (profile: PlayerProfile, mode: StartMode) => void;
  defaultProfile: PlayerProfile | null;
}

interface AvatarChoice {
  palette: number;
  title: Record<LanguageCode, string>;
  note: Record<LanguageCode, string>;
}

const avatarChoices: AvatarChoice[] = [
  {
    palette: 0,
    title: {
      'zh-TW': '二等星際排隊委員會主席',
      en: 'Chairman of the Sub-Committee for Infinite Queuing',
      th: 'Chairman of the Sub-Committee for Infinite Queuing',
    },
    note: {
      'zh-TW': '負責確保事情按部就班地發生，通常是在錯誤的時間。',
      en: 'Responsible for ensuring events happen procedurally, usually at the wrong time.',
      th: 'Responsible for ensuring events happen procedurally, usually at the wrong time.',
    },
  },
  {
    palette: 1,
    title: {
      'zh-TW': '無用遺物保存處高級副處長',
      en: 'Senior Sub-Warden of Inconvenient Antiques',
      th: 'Senior Sub-Warden of Inconvenient Antiques',
    },
    note: {
      'zh-TW': '小心守護著那些沒人想要但丟掉會被罰款的歷史垃圾。',
      en: 'Carefully guards historical junk nobody wants, but discarding it incurs a fine.',
      th: 'Carefully guards historical junk nobody wants, but discarding it incurs a fine.',
    },
  },
  {
    palette: 2,
    title: {
      'zh-TW': '數位故障道歉專員',
      en: 'Chief Apologist for Digital Hallucinations',
      th: 'Chief Apologist for Digital Hallucinations',
    },
    note: {
      'zh-TW': '向宇宙解釋為什麼電腦認為 2+2 等於一盤熱騰騰的炸魚薯條。',
      en: 'Explains to the universe why the computer believes 2+2 equals a steaming plate of fish and chips.',
      th: 'Explains to the universe why the computer believes 2+2 equals a steaming plate of fish and chips.',
    },
  },
  {
    palette: 3,
    title: {
      'zh-TW': '無視物理定律許可證發放人',
      en: 'Unlicensed Practitioner of Spontaneous Disarray',
      th: 'Unlicensed Practitioner of Spontaneous Disarray',
    },
    note: {
      'zh-TW': '他反對秩序，但對「下午茶時間」出奇地堅持。',
      en: 'Opposes order, yet is surprisingly strict about afternoon tea time.',
      th: 'Opposes order, yet is surprisingly strict about afternoon tea time.',
    },
  },
  {
    palette: 4,
    title: {
      'zh-TW': "過時未來主義宣傳大使",
      en: "Ambassador for Yesterday's Tomorrow",
      th: "Ambassador for Yesterday's Tomorrow",
    },
    note: {
      'zh-TW': '熱衷於推廣那些在建造完成前就已經退流行的星際建築。',
      en: 'Promotes interstellar architecture that goes out of fashion before construction finishes.',
      th: 'Promotes interstellar architecture that goes out of fashion before construction finishes.',
    },
  },
  {
    palette: 5,
    title: {
      'zh-TW': '真空利潤提取專家',
      en: 'Professional Extractor of Credit from Thin Vacuum',
      th: 'Professional Extractor of Credit from Thin Vacuum',
    },
    note: {
      'zh-TW': '致力於向那些連呼吸都困難的人推銷「星雲保險」。',
      en: 'Dedicated to selling Nebula Insurance to people who can barely breathe.',
      th: 'Dedicated to selling Nebula Insurance to people who can barely breathe.',
    },
  },
  {
    palette: 6,
    title: {
      'zh-TW': '認可感官錯覺技術員',
      en: 'Technician of Sanctioned Hallucinations',
      th: 'Technician of Sanctioned Hallucinations',
    },
    note: {
      'zh-TW': '負責讓宇宙看起來比實際上稍微不那麼令人絕望一點點。',
      en: 'Makes the universe look very slightly less hopeless than it actually is.',
      th: 'Makes the universe look very slightly less hopeless than it actually is.',
    },
  },
  {
    palette: 7,
    title: {
      'zh-TW': '非自願型碳基生命飼育員',
      en: 'Involuntary Custodian of Uncooperative Carbon-Based Life',
      th: 'Involuntary Custodian of Uncooperative Carbon-Based Life',
    },
    note: {
      'zh-TW': '這份工作基本上就是每天求著那些毫無生存意志的植物不要隨便死掉。',
      en: 'Basically spends every day begging plants with no will to live not to die randomly.',
      th: 'Basically spends every day begging plants with no will to live not to die randomly.',
    },
  },
  {
    palette: 8,
    title: {
      'zh-TW': '宇宙末日延後申請代理人',
      en: 'Authorized Agent for Postponing the Heat Death of the Universe',
      th: 'Authorized Agent for Postponing the Heat Death of the Universe',
    },
    note: {
      'zh-TW': '主要工作是填寫大量的表格，試圖說服太陽慢點熄滅，或者至少先換成省電燈泡。',
      en: 'Mostly fills out forms to persuade the sun to go out more slowly, or at least switch to energy-saving bulbs first.',
      th: 'Mostly fills out forms to persuade the sun to go out more slowly, or at least switch to energy-saving bulbs first.',
    },
  },
];
export function PlayerSetup({ language, onLanguageChange, onStart, defaultProfile }: PlayerSetupProps) {
  const formRef = useRef<HTMLFormElement | null>(null);

  function handleStart(mode: StartMode) {
    const formElement = formRef.current;
    if (!formElement) return;

    const form = new FormData(formElement);
    const name = String(form.get('name') ?? '').trim() || (language === 'zh-TW' ? '訪客' : 'Visitor');
    const mission = String(form.get('mission') ?? '').trim() || (language === 'zh-TW' ? '尋找一個想要的未來' : 'Find a future I want');
    const constraints = '';
    const skills = '';
    const palette = Number(form.get('palette') ?? 0);
    const avatarTitle =
      avatarChoices.find((choice) => choice.palette === palette)?.title[language] ??
      avatarChoices[0].title[language];
    onStart({ name, palette, avatarTitle, currentRole: avatarTitle, mission, constraints, skills }, mode);
  }

  return (
    <div
      className="player-setup-overlay absolute inset-0 z-60 flex items-start justify-center bg-black/80 px-8 overflow-auto"
      style={{ paddingTop: 'max(24px, env(safe-area-inset-top))', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
    >
      <form
        ref={formRef}
        className="player-setup-panel pixel-panel w-[min(1180px,100%)] max-h-[calc(100dvh-48px)] overflow-auto px-14 py-12 text-text"
        onSubmit={(event) => {
          event.preventDefault();
          handleStart('camp');
        }}
      >
        <div className="player-setup-topbar flex items-center justify-between gap-8 mb-6 flex-wrap">
          <p className="player-setup-kicker text-sm uppercase tracking-wide text-accent-bright">{t(language, 'ngmLabel')}</p>
          <label className="player-setup-language flex items-center gap-3 text-base text-text-muted">
            {t(language, 'languageLabel')}
            <select
              value={language}
              onChange={(event) => onLanguageChange(event.target.value as LanguageCode)}
              className="player-setup-select bg-bg border border-border px-4 py-2 text-base text-text"
            >
              {supportedLanguages.map((entry) => (
                <option key={entry.code} value={entry.code}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <h1 className="player-setup-title text-3xl leading-[1.15] mb-6">{t(language, 'loginTitle')}</h1>
        <p className="player-setup-description text-lg leading-[1.5] text-text-muted mb-10 max-w-[900px]">
          {t(language, 'loginDescription')}
        </p>

        <hr className="player-setup-divider border-border mb-10" />

        <label className="player-setup-label block text-base text-text-muted mb-3" htmlFor="player-name">
          {t(language, 'nameLabel')}
        </label>
        <input
          id="player-name"
          name="name"
          className="player-setup-field w-full bg-bg border-2 border-border px-6 py-5 text-xl text-text outline-none focus:border-accent-bright mb-10"
          maxLength={32}
          defaultValue={defaultProfile?.name ?? ''}
          placeholder={t(language, 'namePlaceholder')}
          autoFocus
        />

        <label className="player-setup-label block text-base text-text-muted mb-3" htmlFor="player-mission">
          {t(language, 'missionLabel')}
        </label>
        <textarea
          id="player-mission"
          name="mission"
          className="player-setup-field player-setup-textarea-large w-full min-h-[130px] bg-bg border-2 border-border px-6 py-5 text-xl text-text outline-none focus:border-accent-bright mb-10"
          maxLength={800}
          defaultValue={defaultProfile?.mission ?? ''}
          placeholder={t(language, 'missionPlaceholder')}
        />

        <p className="player-setup-avatar-heading text-lg text-text-muted mb-5">{t(language, 'avatarCollection')}</p>
        <div className="player-setup-avatar-grid grid grid-cols-2 md:grid-cols-3 gap-5 mb-12">
          {avatarChoices.map((choice) => (
            <label
              key={choice.palette}
              className="player-setup-avatar-choice group relative border border-border bg-bg/70 px-6 py-6 cursor-pointer"
            >
              <input
                className="player-setup-radio mr-4"
                type="radio"
                name="palette"
                value={choice.palette}
                defaultChecked={(defaultProfile?.palette ?? 0) === choice.palette}
              />
              <span className="player-setup-avatar-copy inline-flex max-w-[calc(100%-2.25rem)] flex-col align-top">
                <span className="player-setup-avatar-title text-lg leading-[1.2]">{choice.title[language]}</span>
                <span className="player-setup-avatar-note mt-3 block text-sm leading-[1.35] text-text-muted">
                  {choice.note[language]}
                </span>
              </span>
            </label>
          ))}
        </div>

        <div className="player-setup-actions grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            className="player-setup-action w-full bg-accent text-white border-2 border-accent px-8 py-5 text-2xl shadow-pixel"
            type="button"
            onClick={() => handleStart('camp')}
          >
            {t(language, 'enterWorld')}
          </button>
          <button
            className="player-setup-action w-full bg-bg text-text border-2 border-border px-8 py-5 text-2xl shadow-pixel"
            type="button"
            onClick={() => handleStart('expedition')}
          >
            {t(language, 'sendOnExpedition')}
          </button>
        </div>

        <p className="player-setup-hint mt-8 text-base text-text-muted leading-[1.45]">
          {t(language, 'movementHint')}
        </p>
      </form>
    </div>
  );
}

export type { PlayerProfile };
export type { StartMode };
