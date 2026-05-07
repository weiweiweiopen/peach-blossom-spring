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

export function PlayerSetup({
  language,
  onStart,
  defaultProfile,
}: PlayerSetupProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const hatchRef = useRef<HTMLElement | null>(null);
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
  const appearance = useMemo(
    () => generateQuestionPet(question || t(language, "setup.questionPlaceholder"), petSeed),
    [language, petSeed, question],
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
    window.requestAnimationFrame(() => {
      hatchRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    window.setTimeout(() => {
      const hatched = generateQuestionPet(questionText, nextSeed);
      onStart(
        {
          name,
          palette: hatched.seed % 6,
          avatarTitle: t(language, "setup.keeper"),
          currentRole: t(language, "setup.keeper"),
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
          <p className="player-setup-kicker">{t(language, "setup.kicker")}</p>
          <h1 className="player-setup-title">{t(language, "home.title")}</h1>
          <p className="player-setup-description">
            {t(language, "home.description")}
          </p>
        </header>

        <div className="player-setup-console">
          <div className="player-setup-merged-panel">
            <section
              className="player-setup-controls"
              aria-label={t(language, "setup.petControls")}
            >
              <label className="player-setup-label" htmlFor="question-pet-name">
                {t(language, "setup.nameLabel")}
              </label>
              <input
                id="question-pet-name"
                name="name"
                required
                className="player-setup-field"
                maxLength={32}
                defaultValue={defaultProfile?.name ?? ""}
                placeholder={t(language, "setup.namePlaceholder")}
                autoFocus
              />

              <label
                className="player-setup-label"
                htmlFor="question-pet-question"
              >
                {t(language, "setup.questionLabel")}
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
                placeholder={t(language, "setup.questionPlaceholder")}
              />

              <label className="player-setup-label" htmlFor="question-pet-skills">
                {t(language, "setup.skillsLabel")}
              </label>
              <textarea
                id="question-pet-skills"
                name="skills"
                required
                className="player-setup-field player-setup-textarea"
                maxLength={500}
                defaultValue={defaultProfile?.skills ?? ""}
                placeholder={t(language, "setup.skillsPlaceholder")}
              />

              <button
                className={`player-setup-action mode-primary ${isBooting ? "is-booting" : ""}`}
                type="submit"
                disabled={isBooting}
              >
                <span>{t(language, "home.startButton")}</span>
                {isBooting && (
                  <span className="pixel-spinner" aria-hidden="true" />
                )}
              </button>
            </section>

            <aside
              ref={hatchRef}
              className={`question-hatch-device ${hasHatched ? "is-hatching" : ""}`}
              aria-live="polite"
            >
              <p className="pet-card-label">{t(language, "setup.title")}</p>
              <div className="question-hatch-screen">
                {hasHatched ? (
                  <QuestionPetPreview
                    question={question || t(language, "setup.questionPlaceholder")}
                    appearance={appearance}
                    size={12}
                  />
                ) : (
                  <div className="question-hatch-egg">?</div>
                )}
              </div>
              <p className="pet-card-label question-hatch-status">
                {hasHatched ? t(language, "setup.born") : t(language, "setup.blank")}
              </p>
            </aside>
          </div>
        </div>
      </form>
    </div>
  );
}

export type { PlayerProfile, StartMode };
