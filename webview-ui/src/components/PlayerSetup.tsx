import { useMemo, useRef, useState } from 'react';

import { type LanguageCode, t } from '../i18n.js';
import { generateQuestionPet, makePetSeed } from '../pets/generateQuestionPet.js';
import { type PetDispatch } from '../pets/petStore.js';
import { QuestionPetPreview } from '../pets/QuestionPetPreview.js';

interface PlayerProfile {
  name: string;
  palette: number;
  avatarTitle?: string;
  currentRole: string;
  mission: string;
  constraints?: string;
  skills?: string;
  question: string;
  petSeed?: string;
}

type StartMode = 'interactive' | 'dispatch_observer';

interface ArchiveSummary {
  total: number;
  active: number;
  hibernating: number;
  archived: number;
  notes: number;
}

interface PlayerSetupProps {
  language: LanguageCode;
  onStart: (profile: PlayerProfile, mode: StartMode) => void;
  defaultProfile: PlayerProfile | null;
  archiveSummary: ArchiveSummary;
  recentPets: PetDispatch[];
  onClearArchive: () => void;
}

const copy = {
  title: { 'zh-TW': '孵化一隻問題電子雞', en: 'Hatch a Question Pet', th: 'Hatch a Question Pet' },
  question: { 'zh-TW': '你的問題', en: 'Your question', th: 'Your question' },
  placeholder: { 'zh-TW': '你想派遣到桃花源裡的問題是什麼？', en: 'What question do you want to dispatch into Peach Blossom Spring?', th: 'What question do you want to dispatch into Peach Blossom Spring?' },
  skills: { 'zh-TW': '你的技能（可選）', en: 'Your skills (optional)', th: 'Your skills (optional)' },
  name: { 'zh-TW': '顯示名稱（可選）', en: 'Display name (optional)', th: 'Display name (optional)' },
  hint: { 'zh-TW': '輸入一個問題，它會成為 16x16 的電子雞。你可以本人進入桃花源一起互動，也可以只派遣雞、用無人物瀏覽模式觀察世界。', en: 'Type a question to hatch a deterministic 16x16 pet. Enter with your avatar, or dispatch only the pet and browse without a player.', th: 'Type a question to hatch a deterministic 16x16 pet.' },
  reshuffle: { 'zh-TW': '重新生成', en: 'Shuffle pet', th: 'Shuffle pet' },
  clear: { 'zh-TW': '清空本機 demo', en: 'Clear local demo', th: 'Clear local demo' },
};

export function PlayerSetup({ language, onStart, defaultProfile, archiveSummary, recentPets, onClearArchive }: PlayerSetupProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [question, setQuestion] = useState(defaultProfile?.question ?? defaultProfile?.mission ?? '');
  const [petSeed, setPetSeed] = useState(() => defaultProfile?.petSeed ?? makePetSeed(defaultProfile?.question ?? 'question-pet', 1));
  const [archiveOpen, setArchiveOpen] = useState(false);
  const appearance = useMemo(() => generateQuestionPet(question || copy.placeholder[language], petSeed), [language, petSeed, question]);

  function shufflePet() {
    let next = makePetSeed(question || copy.placeholder[language]);
    while (next === petSeed) next = makePetSeed(question || copy.placeholder[language]);
    setPetSeed(next);
  }

  function handleStart(mode: StartMode) {
    const formElement = formRef.current;
    if (!formElement) return;
    const form = new FormData(formElement);
    const questionText = String(form.get('question') ?? '').trim();
    if (!questionText) return;
    const name = String(form.get('name') ?? '').trim() || (language === 'zh-TW' ? '問題飼主' : 'Question Keeper');
    const skills = String(form.get('skills') ?? '').trim();
    onStart({
      name,
      palette: appearance.seed % 6,
      avatarTitle: language === 'zh-TW' ? '問題電子雞飼主' : 'Question Pet Keeper',
      currentRole: language === 'zh-TW' ? '問題電子雞飼主' : 'Question Pet Keeper',
      mission: questionText,
      question: questionText,
      constraints: '',
      skills,
      petSeed,
    }, mode);
  }

  return (
    <div className="player-setup-overlay absolute inset-0 z-60 flex items-start justify-center px-8 overflow-auto tamagotchi-bg" style={{ paddingTop: 'max(58px, env(safe-area-inset-top))', paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
      <form ref={formRef} className="player-setup-panel question-hatch-panel w-[min(980px,100%)] max-h-[calc(100dvh-76px)] overflow-auto px-14 py-12 text-[var(--tama-ink)]" onSubmit={(event) => { event.preventDefault(); handleStart('interactive'); }}>
        <p className="player-setup-kicker text-sm uppercase tracking-wide mb-4">NGM / 問題電子雞</p>
        <div className="grid md:grid-cols-[1fr_220px] gap-10 items-start">
          <div>
            <h1 className="player-setup-title leading-[1.15] mb-5">{copy.title[language]}</h1>
            <p className="player-setup-description leading-[1.5] mb-8 max-w-[720px]">{copy.hint[language]}</p>

            <label className="player-setup-label block mb-3" htmlFor="question-pet-question">{copy.question[language]}</label>
            <textarea id="question-pet-question" name="question" required className="player-setup-field player-setup-textarea-large w-full min-h-[130px] px-6 py-5 outline-none mb-7" maxLength={800} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={copy.placeholder[language]} autoFocus />

            <label className="player-setup-label block mb-3" htmlFor="question-pet-skills">{copy.skills[language]}</label>
            <textarea id="question-pet-skills" name="skills" className="player-setup-field player-setup-textarea w-full min-h-[82px] px-6 py-5 outline-none mb-7" maxLength={500} defaultValue={defaultProfile?.skills ?? ''} placeholder="mapping, cooking, coding, listening, 工藝..." />

            <label className="player-setup-label block mb-3" htmlFor="question-pet-name">{copy.name[language]}</label>
            <input id="question-pet-name" name="name" className="player-setup-field w-full px-6 py-5 outline-none mb-8" maxLength={32} defaultValue={defaultProfile?.name ?? ''} placeholder={language === 'zh-TW' ? '問題飼主' : 'Question Keeper'} />
          </div>

          <aside className="question-hatch-device text-center px-7 py-8">
            <p className="pet-card-label mb-4">16x16 PET</p>
            <QuestionPetPreview question={question || copy.placeholder[language]} appearance={appearance} size={10} />
            <button className="shuffle-pet-button mt-5 w-full px-4 py-3" type="button" onClick={shufflePet}>{copy.reshuffle[language]}</button>
            <p className="pet-card-label mt-4 leading-snug">seed {petSeed}<br />{appearance.bodyType}<br />{appearance.eyeType} / {appearance.accessoryType}</p>
          </aside>
        </div>

        {archiveSummary.notes > 0 && <p className="archive-inbox mt-2 mb-4 px-5 py-4">{t(language, 'petReturnedNotes').replace('{count}', String(archiveSummary.notes))}</p>}

        <section className="dispatch-archive mt-4 px-5 py-4">
          <button className="w-full flex items-center justify-between gap-4 text-left" type="button" onClick={() => setArchiveOpen((open) => !open)}>
            <span>{t(language, 'dispatchArchive')} / {t(language, 'localDispatchRecords')}</span>
            <span>{archiveSummary.total} · {t(language, 'active')} {archiveSummary.active} · {t(language, 'hibernating')} {archiveSummary.hibernating} · {t(language, 'archived')} {archiveSummary.archived}</span>
          </button>
          {archiveOpen && (
            <div className="mt-4 border-t border-[var(--tama-ink)] pt-4">
              <p className="text-sm mb-3">{t(language, 'localOnlyNotice')}</p>
              {recentPets.slice(0, 5).map((pet) => <p key={pet.id} className="text-sm mb-2">🐣 {pet.displayName}: {pet.question} ({pet.status}) · {pet.interactions.length} {t(language, 'fieldNotes')}</p>)}
              <button className="mt-3 px-4 py-2 border-2 border-[var(--tama-ink)]" type="button" onClick={onClearArchive}>{copy.clear[language]}</button>
            </div>
          )}
        </section>

        <div className="player-setup-actions flex flex-col md:flex-row gap-5 mt-7">
          <button className="player-setup-action flex-1 mode-primary px-8 py-5 shadow-pixel" type="submit">{t(language, 'hatchEnter')}</button>
          <button className="player-setup-action flex-1 mode-secondary px-8 py-5 shadow-pixel" type="button" onClick={() => handleStart('dispatch_observer')}>{t(language, 'dispatchPetOnly')}</button>
        </div>
      </form>
    </div>
  );
}

export type { PlayerProfile, StartMode };
