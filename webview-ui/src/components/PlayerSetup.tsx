import { useRef } from 'react';

import { type LanguageCode,supportedLanguages, t } from '../i18n.js';

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

const avatarChoices = [
  { palette: 0, title: { 'zh-TW': '星軌編織者', en: 'Weaver of Star-Paths', th: 'Weaver of Star-Paths' } },
  { palette: 1, title: { 'zh-TW': '永恆記憶守望者', en: 'Sentinel of Eternal Echoes', th: 'Sentinel of Eternal Echoes' } },
  { palette: 2, title: { 'zh-TW': '虛擬靈魂架構師', en: 'Architect of Digital Souls', th: 'Architect of Digital Souls' } },
  { palette: 3, title: { 'zh-TW': '引力叛徒', en: 'Gravity Renegade', th: 'Gravity Renegade' } },
  { palette: 4, title: { 'zh-TW': '新世界黎明先鋒', en: 'Vanguard of the Neon Dawn', th: 'Vanguard of the Neon Dawn' } },
  { palette: 5, title: { 'zh-TW': '星系繁榮鑄造師', en: 'Shaper of Galactic Fortune', th: 'Shaper of Galactic Fortune' } },
  { palette: 6, title: { 'zh-TW': '光譜詩人', en: 'Poet of the Spectrum', th: 'Poet of the Spectrum' } },
];
export function PlayerSetup({ language, onLanguageChange, onStart, defaultProfile }: PlayerSetupProps) {
  const formRef = useRef<HTMLFormElement | null>(null);

  function handleStart(mode: StartMode) {
    const formElement = formRef.current;
    if (!formElement) return;

    const form = new FormData(formElement);
    const name = String(form.get('name') ?? '').trim() || (language === 'zh-TW' ? '訪客' : 'Visitor');
    const currentRole = String(form.get('currentRole') ?? '').trim() || (language === 'zh-TW' ? '漂流研究者' : 'Wandering researcher');
    const mission = String(form.get('mission') ?? '').trim() || (language === 'zh-TW' ? '尋找一個值得被共同推進的想法' : 'Find an idea worth developing with others');
    const constraints = String(form.get('constraints') ?? '').trim();
    const skills = String(form.get('skills') ?? '').trim();
    const palette = Number(form.get('palette') ?? 0);
    const avatarTitle =
      avatarChoices.find((choice) => choice.palette === palette)?.title[language] ??
      avatarChoices[0].title[language];
    onStart({ name, palette, avatarTitle, currentRole, mission, constraints, skills }, mode);
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

        <label className="player-setup-label block text-base text-text-muted mb-3" htmlFor="player-role">
          {t(language, 'roleLabel')}
        </label>
        <input
          id="player-role"
          name="currentRole"
          className="player-setup-field w-full bg-bg border-2 border-border px-6 py-5 text-xl text-text outline-none focus:border-accent-bright mb-10"
          maxLength={80}
          defaultValue={defaultProfile?.currentRole ?? ''}
          placeholder={t(language, 'rolePlaceholder')}
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

        <label className="player-setup-label block text-base text-text-muted mb-3" htmlFor="player-constraints">
          {t(language, 'constraintsLabel')}
        </label>
        <textarea
          id="player-constraints"
          name="constraints"
          className="player-setup-field player-setup-textarea w-full min-h-[90px] bg-bg border-2 border-border px-6 py-5 text-xl text-text outline-none focus:border-accent-bright mb-10"
          maxLength={500}
          defaultValue={defaultProfile?.constraints ?? ''}
          placeholder={t(language, 'constraintsPlaceholder')}
        />

        <label className="player-setup-label block text-base text-text-muted mb-3" htmlFor="player-skills">
          {t(language, 'skillsLabel')}
        </label>
        <textarea
          id="player-skills"
          name="skills"
          className="player-setup-field player-setup-textarea w-full min-h-[90px] bg-bg border-2 border-border px-6 py-5 text-xl text-text outline-none focus:border-accent-bright mb-10"
          maxLength={500}
          defaultValue={defaultProfile?.skills ?? ''}
          placeholder={t(language, 'skillsPlaceholder')}
        />

        <p className="player-setup-avatar-heading text-lg text-text-muted mb-5">{t(language, 'avatarCollection')}</p>
        <div className="player-setup-avatar-grid grid grid-cols-2 md:grid-cols-3 gap-5 mb-12">
          {avatarChoices.map((choice) => (
            <label
              key={choice.palette}
              className="player-setup-avatar-choice border border-border bg-bg/70 px-6 py-6 cursor-pointer"
            >
              <input
                className="player-setup-radio mr-4"
                type="radio"
                name="palette"
                value={choice.palette}
                defaultChecked={(defaultProfile?.palette ?? 0) === choice.palette}
              />
              <span className="player-setup-avatar-title text-lg leading-[1.2]">{choice.title[language]}</span>
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
