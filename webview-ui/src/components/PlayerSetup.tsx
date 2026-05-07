import { useMemo, useRef, useState } from "react";

import { type LanguageCode, t } from "../i18n.js";
import {
  generateQuestionPet,
  makePetSeed,
} from "../pets/generateQuestionPet.js";
import { type PetDispatch } from "../pets/petStore.js";
import { QuestionPetPreview } from "../pets/QuestionPetPreview.js";

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

type StartMode = "interactive" | "dispatch_observer";

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

const copy: Record<
  LanguageCode,
  {
    kicker: string;
    title: string;
    name: string;
    namePlaceholder: string;
    question: string;
    questionPlaceholder: string;
    skills: string;
    skillsPlaceholder: string;
    start: string;
    booting: string;
    blank: string;
    born: string;
    keeper: string;
  }
> = {
  "zh-TW": {
    kicker: "NGM / 桃花源入口機",
    title: "問題電子雞開機",
    name: "名字",
    namePlaceholder: "你在桃花源裡被叫什麼？",
    question: "填入一個你想要探索的問題",
    questionPlaceholder: "例如：如何建造一個不會把人變成儀表板的烏托邦？",
    skills: "我有什麼技能",
    skillsPlaceholder: "例如：田野研究、做飯、寫程式、聆聽、縫紉、召喚朋友...",
    start: "生成 / 開始",
    booting: "問題電子雞出生了，停留 3 秒讓你欣賞...",
    blank: "等待三個欄位完成",
    born: "嗶！牠出生了。牠看起來已經想逃跑。",
    keeper: "問題電子雞飼主",
  },
  en: {
    kicker: "NGM / Peach gate console",
    title: "Question Pet Boot Screen",
    name: "Name",
    namePlaceholder: "What should Peach Blossom Spring call you?",
    question: "Enter one question you want to explore",
    questionPlaceholder:
      "Example: how do we build a utopia that does not turn people into dashboards?",
    skills: "What skills do I have?",
    skillsPlaceholder:
      "Fieldwork, cooking, coding, listening, sewing, summoning friends...",
    start: "Generate / Start",
    booting: "Question pet hatched — pausing 3 seconds to admire it...",
    blank: "Waiting for all three fields",
    born: "Beep! It was born. It already looks ready to run away.",
    keeper: "Question Pet Keeper",
  },
  th: {
    kicker: "NGM / เครื่องทางเข้า桃花源",
    title: "หน้าจอบูตสัตว์คำถาม",
    name: "ชื่อ",
    namePlaceholder: "ให้桃花源เรียกคุณว่าอะไร?",
    question: "ใส่คำถามหนึ่งข้อที่อยากสำรวจ",
    questionPlaceholder:
      "เช่น เราจะสร้างยูโทเปียที่ไม่เปลี่ยนผู้คนเป็น dashboard ได้อย่างไร?",
    skills: "ฉันมีทักษะอะไร",
    skillsPlaceholder: "ภาคสนาม ทำอาหาร เขียนโค้ด ฟัง เย็บผ้า เรียกเพื่อน...",
    start: "สร้าง / เริ่ม",
    booting: "สัตว์คำถามฟักแล้ว — รอ 3 วินาทีเพื่อดูมัน...",
    blank: "รอให้กรอกครบสามช่อง",
    born: "บี๊บ! มันเกิดแล้ว และดูเหมือนพร้อมจะวิ่งหนีทันที",
    keeper: "ผู้ดูแลสัตว์คำถาม",
  },
  ja: {
    kicker: "NGM / 桃花源入口端末",
    title: "質問電子ペット起動画面",
    name: "名前",
    namePlaceholder: "桃花源では何と呼ばれたい？",
    question: "探索したい問いをひとつ入力",
    questionPlaceholder: "例：人を dashboard にしないユートピアをどう作る？",
    skills: "自分にはどんな技能がある？",
    skillsPlaceholder:
      "フィールドワーク、料理、コード、聞くこと、縫製、友だち召喚...",
    start: "生成 / 開始",
    booting: "質問ペットが生まれました。3秒眺めてから入ります...",
    blank: "三つの欄の入力待ち",
    born: "ピッ！生まれた。もう逃げ出す顔をしている。",
    keeper: "質問ペットの飼い主",
  },
};

export function PlayerSetup({
  language,
  onStart,
  defaultProfile,
}: PlayerSetupProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [question, setQuestion] = useState(
    defaultProfile?.question ?? defaultProfile?.mission ?? "",
  );
  const [petSeed, setPetSeed] = useState(
    () =>
      defaultProfile?.petSeed ??
      makePetSeed(defaultProfile?.question ?? "question-pet", 1),
  );
  const [hasHatched, setHasHatched] = useState(false);
  const [isBooting, setIsBooting] = useState(false);
  const c = copy[language];
  const appearance = useMemo(
    () => generateQuestionPet(question || c.questionPlaceholder, petSeed),
    [c.questionPlaceholder, petSeed, question],
  );

  function handleStart() {
    const formElement = formRef.current;
    if (!formElement || isBooting) return;
    const form = new FormData(formElement);
    const name = String(form.get("name") ?? "").trim();
    const questionText = String(form.get("question") ?? "").trim();
    const skills = String(form.get("skills") ?? "").trim();
    if (!name || !questionText || !skills) {
      formElement.reportValidity();
      return;
    }
    const nextSeed = makePetSeed(`${name}|${questionText}|${skills}`);
    setPetSeed(nextSeed);
    setHasHatched(true);
    setIsBooting(true);
    window.setTimeout(() => {
      const hatched = generateQuestionPet(questionText, nextSeed);
      onStart(
        {
          name,
          palette: hatched.seed % 6,
          avatarTitle: c.keeper,
          currentRole: c.keeper,
          mission: questionText,
          question: questionText,
          constraints: "",
          skills,
          petSeed: nextSeed,
        },
        "interactive",
      );
    }, 3000);
  }

  return (
    <div className="player-setup-overlay tamagotchi-bg">
      <form
        ref={formRef}
        className="player-setup-shell"
        onSubmit={(event) => {
          event.preventDefault();
          handleStart();
        }}
      >
        <header className="player-setup-header">
          <p className="player-setup-kicker">{c.kicker}</p>
          <h1 className="player-setup-title">{t(language, "loginTitle")}</h1>
          <p className="player-setup-description">
            {t(language, "loginDescription")}
          </p>
        </header>

        <div className="player-setup-console">
          <aside
            className={`question-hatch-device ${hasHatched ? "is-hatching" : ""}`}
            aria-live="polite"
          >
            <p className="pet-card-label">{c.title}</p>
            <div className="question-hatch-screen">
              {hasHatched ? (
                <QuestionPetPreview
                  question={question || c.questionPlaceholder}
                  appearance={appearance}
                  size={12}
                />
              ) : (
                <div className="question-hatch-egg">?</div>
              )}
            </div>
            <p className="pet-card-label question-hatch-status">
              {hasHatched ? c.born : c.blank}
            </p>
          </aside>

          <section className="player-setup-controls" aria-label="Pet controls">
            <label className="player-setup-label" htmlFor="question-pet-name">
              {c.name}
            </label>
            <input
              id="question-pet-name"
              name="name"
              required
              className="player-setup-field"
              maxLength={32}
              defaultValue={defaultProfile?.name ?? ""}
              placeholder={c.namePlaceholder}
              autoFocus
            />

            <label
              className="player-setup-label"
              htmlFor="question-pet-question"
            >
              {c.question}
            </label>
            <textarea
              id="question-pet-question"
              name="question"
              required
              className="player-setup-field player-setup-textarea-large"
              maxLength={800}
              value={question}
              onChange={(event) => {
                setQuestion(event.target.value);
                setHasHatched(false);
              }}
              placeholder={c.questionPlaceholder}
            />

            <label className="player-setup-label" htmlFor="question-pet-skills">
              {c.skills}
            </label>
            <textarea
              id="question-pet-skills"
              name="skills"
              required
              className="player-setup-field player-setup-textarea"
              maxLength={500}
              defaultValue={defaultProfile?.skills ?? ""}
              placeholder={c.skillsPlaceholder}
            />

            <button
              className={`player-setup-action mode-primary ${isBooting ? "is-booting" : ""}`}
              type="submit"
              disabled={isBooting}
            >
              <span>{c.start}</span>
              {isBooting && (
                <span className="pixel-spinner" aria-hidden="true" />
              )}
            </button>
          </section>
        </div>
      </form>
    </div>
  );
}

export type { PlayerProfile, StartMode };
