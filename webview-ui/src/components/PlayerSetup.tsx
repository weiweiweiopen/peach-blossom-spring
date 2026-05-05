import { type LanguageCode,supportedLanguages, t } from '../i18n.js';

interface PlayerProfile {
  name: string;
  palette: number;
  avatarTitle?: string;
  currentRole: string;
  mission: string;
  constraints?: string;
  skills: string;
}
type StartMode = 'camp' | 'expedition';

interface PlayerSetupProps {
  language: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
  onStart: (profile: PlayerProfile, mode: StartMode) => void;
  defaultProfile: PlayerProfile | null;
}

const avatarChoices = [
  { palette: 0, title: { 'zh-TW': '迷路外星使者', en: 'Lost alien envoy', th: 'Lost alien envoy' } },
  { palette: 1, title: { 'zh-TW': '會發光的魚人', en: 'Luminous fishfolk', th: 'Luminous fishfolk' } },
  { palette: 2, title: { 'zh-TW': '竹林機器精靈', en: 'Bamboo machine spirit', th: 'Bamboo machine spirit' } },
  { palette: 3, title: { 'zh-TW': '桃花風暴巫師', en: 'Peach storm mage', th: 'Peach storm mage' } },
  { palette: 4, title: { 'zh-TW': '笑點超低史萊姆', en: 'Low-threshold slime', th: 'Low-threshold slime' } },
  { palette: 5, title: { 'zh-TW': '跨維度旅人', en: 'Interdimensional traveler', th: 'Interdimensional traveler' } },
];

export function PlayerSetup({ language, onLanguageChange, onStart, defaultProfile }: PlayerSetupProps) {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? '').trim() || (language === 'zh-TW' ? '訪客' : 'Visitor');
    const currentRole = String(form.get('currentRole') ?? '').trim() || (language === 'zh-TW' ? '漂流研究者' : 'Wandering researcher');
    const mission = String(form.get('mission') ?? '').trim() || (language === 'zh-TW' ? '尋找一個值得被共同推進的想法' : 'Find an idea worth developing with others');
    const constraints = String(form.get('constraints') ?? '').trim();
    const palette = Number(form.get('palette') ?? 0);
    const avatarTitle =
      avatarChoices.find((choice) => choice.palette === palette)?.title[language] ??
      avatarChoices[5].title[language];
    const skills = String(form.get('skills') ?? '').trim();
    const mode = (String(form.get('startMode') ?? 'camp') === 'expedition' ? 'expedition' : 'camp') as StartMode;
    onStart({ name, palette, avatarTitle, currentRole, mission, constraints, skills }, mode);
  }

  return (
    <div
      className="absolute inset-0 z-60 flex items-start justify-center bg-black/80 px-8 overflow-auto"
      style={{ paddingTop: 'max(24px, env(safe-area-inset-top))', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
    >
      <form
        className="pixel-panel w-[min(1180px,100%)] max-h-[calc(100dvh-48px)] overflow-auto px-14 py-12 text-text"
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between gap-8 mb-6 flex-wrap">
          <p className="text-sm uppercase tracking-wide text-accent-bright">{t(language, 'ngmLabel')}</p>
          <label className="flex items-center gap-3 text-base text-text-muted">
            {t(language, 'languageLabel')}
            <select
              value={language}
              onChange={(event) => onLanguageChange(event.target.value as LanguageCode)}
              className="bg-bg border border-border px-4 py-2 text-base text-text"
            >
              {supportedLanguages.map((entry) => (
                <option key={entry.code} value={entry.code}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <h1 className="text-3xl leading-[1.15] mb-6">{t(language, 'loginTitle')}</h1>
        <p className="text-lg leading-[1.5] text-text-muted mb-10 max-w-[900px]">
          {t(language, 'loginDescription')}
        </p>

        <hr className="border-border mb-10" />

        <label className="block text-base text-text-muted mb-3" htmlFor="player-name">
          {t(language, 'nameLabel')}
        </label>
        <input
          id="player-name"
          name="name"
          className="w-full bg-bg border-2 border-border px-6 py-5 text-xl text-text outline-none focus:border-accent-bright mb-10"
          maxLength={32}
          defaultValue={defaultProfile?.name ?? ''}
          placeholder={t(language, 'namePlaceholder')}
          autoFocus
        />

        <label className="block text-base text-text-muted mb-3" htmlFor="player-role">
          {t(language, 'roleLabel')}
        </label>
        <input
          id="player-role"
          name="currentRole"
          className="w-full bg-bg border-2 border-border px-6 py-5 text-xl text-text outline-none focus:border-accent-bright mb-10"
          maxLength={80}
          defaultValue={defaultProfile?.currentRole ?? ''}
          placeholder={t(language, 'rolePlaceholder')}
        />

        <label className="block text-base text-text-muted mb-3" htmlFor="player-mission">
          {t(language, 'missionLabel')}
        </label>
        <textarea
          id="player-mission"
          name="mission"
          className="w-full min-h-[130px] bg-bg border-2 border-border px-6 py-5 text-xl text-text outline-none focus:border-accent-bright mb-10"
          maxLength={800}
          defaultValue={defaultProfile?.mission ?? ''}
          placeholder={t(language, 'missionPlaceholder')}
        />

        <label className="block text-base text-text-muted mb-3" htmlFor="player-constraints">
          {t(language, 'constraintsLabel')}
        </label>
        <textarea
          id="player-constraints"
          name="constraints"
          className="w-full min-h-[90px] bg-bg border-2 border-border px-6 py-5 text-xl text-text outline-none focus:border-accent-bright mb-10"
          maxLength={500}
          defaultValue={defaultProfile?.constraints ?? ''}
          placeholder={t(language, 'constraintsPlaceholder')}
        />
        <label className="block text-base text-text-muted mb-3" htmlFor="player-skills">
          {language === 'zh-TW' ? '我有什麼技能' : 'What skills do I have?'}
        </label>
        <textarea
          id="player-skills"
          name="skills"
          className="w-full min-h-[90px] bg-bg border-2 border-border px-6 py-5 text-xl text-text outline-none focus:border-accent-bright mb-10"
          maxLength={500}
          defaultValue={defaultProfile?.skills ?? ''}
        />

        <p className="text-lg text-text-muted mb-5">{t(language, 'avatarCollection')}</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-12">
          {avatarChoices.map((choice) => (
            <label
              key={choice.palette}
              className="border border-border bg-bg/70 px-6 py-6 cursor-pointer"
            >
              <input
                className="mr-4"
                type="radio"
                name="palette"
                value={choice.palette}
                defaultChecked={(defaultProfile?.palette ?? 0) === choice.palette}
              />
              <span className="text-lg leading-[1.2]">{choice.title[language]}</span>
            </label>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="w-full bg-accent text-white border-2 border-accent px-8 py-5 text-2xl shadow-pixel" type="submit" name="startMode" value="camp">
            {t(language, 'enterWorld')}
          </button>
          <button className="w-full bg-bg text-text border-2 border-border px-8 py-5 text-2xl shadow-pixel" type="submit" name="startMode" value="expedition">
            {language === 'zh-TW' ? '派遣遠征' : 'Send on Expedition'}
          </button>
        </div>

        <p className="mt-8 text-base text-text-muted leading-[1.45]">
          {t(language, 'movementHint')}
        </p>
      </form>
    </div>
  );
}

export type { PlayerProfile };
