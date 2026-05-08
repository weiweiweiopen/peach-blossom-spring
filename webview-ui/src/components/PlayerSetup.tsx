import { useMemo, useRef, useState } from "react";

import { type LanguageCode, t } from "../i18n.js";
import { generateQuestionPet } from "../pets/generateQuestionPet.js";
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

const fixedPetRoles = [
  "artist",
  "scientist",
  "engineer",
  "cook",
  "dancer",
  "workshopologist",
  "drinker",
  "socialist",
  "professor",
  "fire maker",
  "tailor",
  "musician",
  "shaman",
  "bubble maker",
  "architect",
  "herbalist",
] as const;

function normalizeFixedPetRole(seed: string | undefined): string {
  const value = seed?.startsWith("fixed-pet:") ? seed.slice("fixed-pet:".length) : seed;
  return fixedPetRoles.find((role) => role === value) ?? fixedPetRoles[0];
}

export function PlayerSetup({
  language,
  onStart,
  defaultProfile,
}: PlayerSetupProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [question, setQuestion] = useState(
    defaultProfile?.question ?? defaultProfile?.mission ?? "",
  );
  const [selectedPetRole, setSelectedPetRole] = useState(() =>
    normalizeFixedPetRole(defaultProfile?.petSeed),
  );
  const appearance = useMemo(
    () => generateQuestionPet(selectedPetRole, `fixed-pet:${selectedPetRole}`),
    [selectedPetRole],
  );

  function handleStart() {
    const formElement = formRef.current;
    if (!formElement) return;
    const form = new FormData(formElement);
    const name = String(form.get("name") ?? "").trim();
    const questionText = String(form.get("question") ?? "").trim();
    const skills = String(form.get("skills") ?? "").trim();
    if (!name || !questionText || !skills) {
      formElement.reportValidity();
      return;
    }
    const petSeed = `fixed-pet:${selectedPetRole}`;
    onStart(
      {
        name,
        palette: appearance.seed % 6,
        avatarTitle: selectedPetRole,
        currentRole: t(language, "setup.keeper"),
        mission: questionText,
        question: questionText,
        constraints: "",
        skills,
        petSeed,
      },
      "interactive",
    );
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

            </section>

            <aside
              className="question-hatch-device is-hatching"
              aria-live="polite"
            >
              <div className="question-hatch-selector">
                <label className="player-setup-label" htmlFor="question-pet-role">
                  {t(language, "setup.choosePet")}
                </label>
                <select
                  id="question-pet-role"
                  name="petRole"
                  className="player-setup-field"
                  value={selectedPetRole}
                  onChange={(event) => setSelectedPetRole(event.target.value)}
                >
                  {fixedPetRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              <p className="pet-card-label">{selectedPetRole}</p>
              <div className="question-hatch-screen">
                <QuestionPetPreview
                  question={selectedPetRole}
                  appearance={appearance}
                  fill
                />
              </div>
              <p className="pet-card-label question-hatch-status">
                {t(language, "setup.fixedPetMenu")}
              </p>
              <div className="question-hatch-actions">
                <button
                  className="player-setup-action mode-primary"
                  type="submit"
                >
                  <span>{t(language, "home.startButton")}</span>
                </button>
              </div>
            </aside>
          </div>
        </div>
      </form>
    </div>
  );
}

export type { PlayerProfile, StartMode };
