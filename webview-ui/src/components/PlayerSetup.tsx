import { useRef, useState } from 'react';

import { type LanguageCode, supportedLanguages, t } from '../i18n.js';
import { generateQuestionPet } from '../pets/generateQuestionPet.js';
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
}

type StartMode = 'camp' | 'expedition';

interface PlayerSetupProps {
  language: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
  onStart: (profile: PlayerProfile, mode: StartMode) => void;
  defaultProfile: PlayerProfile | null;
}

const copy = {
  title: { 'zh-TW': '孵化一隻問題電子雞', en: 'Hatch a Question Pet', th: 'Hatch a Question Pet' },
  question: { 'zh-TW': '你的問題', en: 'Your question', th: 'Your question' },
  placeholder: { 'zh-TW': '你想派遣到桃花源裡的問題是什麼？', en: 'What question do you want to dispatch into Peach Blossom Spring?', th: 'What question do you want to dispatch into Peach Blossom Spring?' },
  skills: { 'zh-TW': '你的技能（可選）', en: 'Your skills (optional)', th: 'Your skills (optional)' },
  name: { 'zh-TW': '顯示名稱（可選）', en: 'Display name (optional)', th: 'Display name (optional)' },
  hatch: { 'zh-TW': '孵化並進入世界', en: 'Hatch and Enter World', th: 'Hatch and Enter World' },
  dispatch: { 'zh-TW': '只派遣到世界', en: 'Dispatch Into World', th: 'Dispatch Into World' },
  hint: { 'zh-TW': '這不是表格，而是一顆問題蛋。輸入之後，它會生成 16x16 的電子雞，在桃花源裡移動、緊張、學習、靠近別人。', en: 'This is not a profile form; it is a question egg. The question becomes a deterministic 16x16 pet that wanders, stresses, learns, and clusters.', th: 'This is not a profile form; it is a question egg.' },
};

export function PlayerSetup({ language, onLanguageChange, onStart, defaultProfile }: PlayerSetupProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [question, setQuestion] = useState(defaultProfile?.question ?? defaultProfile?.mission ?? '');
  const appearance = generateQuestionPet(question || copy.placeholder[language]);

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
    }, mode);
  }

  return (
    <div className="player-setup-overlay absolute inset-0 z-60 flex items-start justify-center px-8 overflow-auto tamagotchi-bg" style={{ paddingTop: 'max(24px, env(safe-area-inset-top))', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
      <form ref={formRef} className="player-setup-panel question-hatch-panel w-[min(980px,100%)] max-h-[calc(100dvh-48px)] overflow-auto px-14 py-12 text-[#1B1B14]" onSubmit={(event) => { event.preventDefault(); handleStart('camp'); }}>
        <div className="player-setup-topbar flex items-center justify-between gap-8 mb-6 flex-wrap">
          <p className="player-setup-kicker text-sm uppercase tracking-wide">NGM / 問題電子雞</p>
          <label className="player-setup-language flex items-center gap-3 text-base">
            {t(language, 'languageLabel')}
            <select value={language} onChange={(event) => onLanguageChange(event.target.value as LanguageCode)} className="player-setup-select bg-[#FFF2A6] border-2 border-[#1B1B14] px-4 py-2 text-base text-[#1B1B14]">
              {supportedLanguages.map((entry) => <option key={entry.code} value={entry.code}>{entry.label}</option>)}
            </select>
          </label>
        </div>

        <div className="grid md:grid-cols-[1fr_220px] gap-10 items-start">
          <div>
            <h1 className="player-setup-title text-3xl leading-[1.15] mb-6">{copy.title[language]}</h1>
            <p className="player-setup-description text-lg leading-[1.5] mb-10 max-w-[720px]">{copy.hint[language]}</p>

            <label className="player-setup-label block text-base mb-3" htmlFor="question-pet-question">{copy.question[language]}</label>
            <textarea id="question-pet-question" name="question" required className="player-setup-field player-setup-textarea-large w-full min-h-[150px] bg-[#B7D879] border-4 border-[#253421] px-6 py-5 text-xl text-[#253421] outline-none focus:border-[#FF4FA3] mb-8" maxLength={800} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={copy.placeholder[language]} autoFocus />

            <label className="player-setup-label block text-base mb-3" htmlFor="question-pet-skills">{copy.skills[language]}</label>
            <textarea id="question-pet-skills" name="skills" className="player-setup-field player-setup-textarea w-full min-h-[90px] bg-[#B7D879] border-4 border-[#253421] px-6 py-5 text-xl text-[#253421] outline-none focus:border-[#FF4FA3] mb-8" maxLength={500} defaultValue={defaultProfile?.skills ?? ''} placeholder="mapping, cooking, coding, listening, 工藝..." />

            <label className="player-setup-label block text-base mb-3" htmlFor="question-pet-name">{copy.name[language]}</label>
            <input id="question-pet-name" name="name" className="player-setup-field w-full bg-[#B7D879] border-4 border-[#253421] px-6 py-5 text-xl text-[#253421] outline-none focus:border-[#FF4FA3] mb-10" maxLength={32} defaultValue={defaultProfile?.name ?? ''} placeholder={language === 'zh-TW' ? '問題飼主' : 'Question Keeper'} />
          </div>

          <aside className="question-hatch-device text-center px-7 py-8">
            <p className="text-base mb-4">16x16 PET</p>
            <QuestionPetPreview question={question || copy.placeholder[language]} appearance={appearance} size={10} />
            <p className="text-sm mt-5 leading-snug">{appearance.bodyType}<br />{appearance.eyeType} / {appearance.accessoryType}</p>
          </aside>
        </div>

        <div className="player-setup-actions flex flex-col md:flex-row gap-5 mt-8">
          <button className="player-setup-action flex-1 bg-[#FF8FBC] text-[#1B1B14] border-4 border-[#1B1B14] px-8 py-5 text-lg shadow-pixel" type="submit">{copy.hatch[language]}</button>
          <button className="player-setup-action flex-1 bg-[#FFF2A6] text-[#1B1B14] border-4 border-[#1B1B14] px-8 py-5 text-lg shadow-pixel" type="button" onClick={() => handleStart('expedition')}>{copy.dispatch[language]}</button>
        </div>
      </form>
    </div>
  );
}

export type { PlayerProfile, StartMode };
