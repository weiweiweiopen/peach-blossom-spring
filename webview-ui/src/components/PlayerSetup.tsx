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
          avatarTitle:
            language === "zh-TW" ? "問題電子雞飼主" : "Question Pet Keeper",
          currentRole:
            language === "zh-TW" ? "問題電子雞飼主" : "Question Pet Keeper",
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
    <div
      className="player-setup-overlay absolute inset-0 z-60 flex items-start justify-center px-8 overflow-auto tamagotchi-bg"
      style={{
        paddingTop: "max(58px, env(safe-area-inset-top))",
        paddingBottom: "max(16px, env(safe-area-inset-bottom))",
      }}
    >
      <form
        ref={formRef}
        className="player-setup-panel question-hatch-panel w-[min(1040px,100%)] max-h-[calc(100dvh-76px)] overflow-auto px-14 py-12 text-[var(--tama-ink)]"
        onSubmit={(event) => {
          event.preventDefault();
          handleStart();
        }}
      >
        <p className="player-setup-kicker text-sm uppercase tracking-wide mb-4">
          {c.kicker}
        </p>
        <div className="grid md:grid-cols-[1fr_260px] gap-10 items-start">
          <div>
            <h1 className="player-setup-title leading-[1.1] mb-5">
              {t(language, "loginTitle")}
            </h1>
            <p className="player-setup-description leading-[1.58] mb-8 max-w-[760px]">
              {t(language, "loginDescription")}
            </p>

            <label
              className="player-setup-label block mb-3"
              htmlFor="question-pet-name"
            >
              {c.name}
            </label>
            <input
              id="question-pet-name"
              name="name"
              required
              className="player-setup-field w-full px-6 py-5 outline-none mb-7"
              maxLength={32}
              defaultValue={defaultProfile?.name ?? ""}
              placeholder={c.namePlaceholder}
              autoFocus
            />

            <label
              className="player-setup-label block mb-3"
              htmlFor="question-pet-question"
            >
              {c.question}
            </label>
            <textarea
              id="question-pet-question"
              name="question"
              required
              className="player-setup-field player-setup-textarea-large w-full min-h-[116px] px-6 py-5 outline-none mb-7"
              maxLength={800}
              value={question}
              onChange={(event) => {
                setQuestion(event.target.value);
                setHasHatched(false);
              }}
              placeholder={c.questionPlaceholder}
            />

            <label
              className="player-setup-label block mb-3"
              htmlFor="question-pet-skills"
            >
              {c.skills}
            </label>
            <textarea
              id="question-pet-skills"
              name="skills"
              required
              className="player-setup-field player-setup-textarea w-full min-h-[92px] px-6 py-5 outline-none mb-2"
              maxLength={500}
              defaultValue={defaultProfile?.skills ?? ""}
              placeholder={c.skillsPlaceholder}
            />
          </div>

          <aside
            className={`question-hatch-device text-center px-7 py-8 ${hasHatched ? "is-hatching" : ""}`}
            aria-live="polite"
          >
            <p className="pet-card-label mb-4">{c.title}</p>
            <div className="question-hatch-screen mx-auto">
              {hasHatched ? (
                <QuestionPetPreview
                  question={question || c.questionPlaceholder}
                  appearance={appearance}
                  size={10}
                />
              ) : (
                <div className="question-hatch-egg">?</div>
              )}
            </div>
            <p className="pet-card-label mt-5 leading-snug">
              {hasHatched ? c.born : c.blank}
            </p>
          </aside>
        </div>

        <div className="player-setup-actions flex flex-col md:flex-row gap-5 mt-8">
          <button
            className="player-setup-action flex-1 mode-primary px-8 py-5 shadow-pixel"
            type="submit"
            disabled={isBooting}
          >
            {isBooting ? "..." : c.start}
          </button>
        </div>
      </form>
    </div>
  );
}

export type { PlayerProfile, StartMode };
