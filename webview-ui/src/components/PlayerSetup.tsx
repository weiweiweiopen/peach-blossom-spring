import { useMemo, useRef, useState } from "react";

import { type LanguageCode, t } from "../i18n.js";
import { generateQuestionPet } from "../pets/generateQuestionPet.js";
import { homePetRoles } from "../pets/homePetVisuals.js";
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
  intentMode?: PlayerIntentMode;
  personalArchive?: string;
  petSeed?: string;
}

type StartMode = "interactive" | "dispatch_observer";
type PlayerIntentMode = "find_people" | "survive" | "how_to_do" | "why";

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

const intentOptions: Array<{ value: PlayerIntentMode; zh: string; en: string }> = [
  { value: "find_people", zh: "我想找人", en: "I wanna find people" },
  { value: "survive", zh: "怎麼生存？", en: "How to survive?" },
  { value: "how_to_do", zh: "我想知道怎麼做", en: "How to do?" },
  { value: "why", zh: "我只是想知道為什麼", en: "I just wanna know why" },
];

function setupCopy(language: LanguageCode) {
  const zh = language === "zh-TW";
  return {
    constitution: zh
      ? "生命探測器會把你的抽象問題孵化成電子雞，透過 A2A 協定與 NPC、知識庫和其他電子雞互動，讓問題得到本質提升與擴大，最後生成一份帶來源索引的意外文件。"
      : "The life-detector hatches your abstract question into a Tamagotchi, lets it communicate through A2A with NPCs, knowledge systems, and other pets, then matures the question into a referenced surprise document.",
    intentLabel: zh ? "這次你主要想做什麼？" : "What do you mainly want this run to do?",
    archiveLabel: zh ? "個人資料、食譜、材料或任何你想餵給電子雞的文本" : "Personal data, recipes, materials, or any text you want to feed the pet",
    archivePlaceholder: zh
      ? "越具體越好：背景、技能、限制、材料、想見的人、口味、禁忌、已知資料、夢、失敗經驗...這會形成電子雞的 persona / knowledge JSON。"
      : "More detail helps: background, skills, constraints, materials, people to find, tastes, taboos, known data, dreams, failed attempts... This becomes the pet persona / knowledge JSON.",
    htmlMode: zh ? "HTML 沉浸模式" : "HTML immersive mode",
    cliMode: zh ? "CLI 模式（尚未開發）" : "CLI mode (not developed yet)",
  };
}

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
  const startRequestedRef = useRef(false);
  const [name, setName] = useState(defaultProfile?.name ?? "");
  const [question, setQuestion] = useState(
    defaultProfile?.question ?? defaultProfile?.mission ?? "",
  );
  const [skills, setSkills] = useState(defaultProfile?.skills ?? "");
  const [intentMode, setIntentMode] = useState<PlayerIntentMode>(
    defaultProfile?.intentMode ?? "why",
  );
  const [personalArchive, setPersonalArchive] = useState(
    defaultProfile?.personalArchive ?? defaultProfile?.constraints ?? "",
  );
  const [selectedPetRole, setSelectedPetRole] = useState(() =>
    normalizeFixedPetRole(defaultProfile?.petSeed),
  );
  const copy = setupCopy(language);
  const appearance = useMemo(
    () => generateQuestionPet(selectedPetRole, `fixed-pet:${selectedPetRole}`),
    [selectedPetRole],
  );

  function handleStart() {
    if (startRequestedRef.current) return;
    const formElement = formRef.current;
    if (!formElement) return;
    const profileName = name.trim();
    const questionText = question.trim();
    const skillText = skills.trim();
    const archiveText = personalArchive.trim();
    if (!profileName || !questionText || !skillText) {
      formElement.reportValidity();
      return;
    }
    const petSeed = `fixed-pet:${selectedPetRole}`;
    startRequestedRef.current = true;
    try {
      onStart(
        {
          name: profileName,
          palette: appearance.seed % 6,
          avatarTitle: selectedPetRole,
          currentRole: t(language, "setup.keeper"),
          mission: questionText,
          question: questionText,
          constraints: archiveText,
          skills: skillText,
          intentMode,
          personalArchive: archiveText,
          petSeed,
        },
        "interactive",
      );
    } catch (error) {
      startRequestedRef.current = false;
      throw error;
    }
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
        <div className="player-setup-merged-panel rpg-message-frame">
          <header className="player-setup-header">
            <h1 className="player-setup-title">{t(language, "home.title")}</h1>
            <p className="player-setup-description rpg-message-scroll">
              {t(language, "home.description")}
            </p>
            <p className="player-setup-description rpg-message-scroll">
              {copy.constitution}
            </p>
          </header>

          <div className="player-setup-console">
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
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                }}
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

              <label className="player-setup-label" htmlFor="question-pet-intent">
                {copy.intentLabel}
              </label>
              <select
                id="question-pet-intent"
                name="intentMode"
                className="player-setup-field"
                value={intentMode}
                onChange={(event) => setIntentMode(event.target.value as PlayerIntentMode)}
              >
                {intentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {language === "zh-TW" ? `${option.zh} / ${option.en}` : option.en}
                  </option>
                ))}
              </select>

              <label className="player-setup-label" htmlFor="question-pet-skills">
                {t(language, "setup.skillsLabel")}
              </label>
              <textarea
                id="question-pet-skills"
                name="skills"
                required
                className="player-setup-field player-setup-textarea"
                maxLength={500}
                value={skills}
                onChange={(event) => {
                  setSkills(event.target.value);
                }}
                placeholder={t(language, "setup.skillsPlaceholder")}
              />

              <label className="player-setup-label" htmlFor="question-pet-archive">
                {copy.archiveLabel}
              </label>
              <textarea
                id="question-pet-archive"
                name="personalArchive"
                className="player-setup-field player-setup-textarea-large"
                maxLength={1800}
                value={personalArchive}
                onChange={(event) => {
                  setPersonalArchive(event.target.value);
                }}
                placeholder={copy.archivePlaceholder}
              />

              <div className="player-setup-mode-row" aria-label="Game mode">
                <span>{copy.htmlMode}</span>
                <span aria-disabled="true">{copy.cliMode}</span>
              </div>

            </section>

            <aside
              className="question-hatch-device is-hatching"
              aria-live="polite"
            >
              <div className="question-hatch-selector">
                <span className="player-setup-label" id="question-pet-role-label">
                  {t(language, "setup.choosePet")}
                </span>
                <div className="pet-role-grid" role="radiogroup" aria-labelledby="question-pet-role-label">
                  {homePetRoles.map((role) => {
                    const optionAppearance = generateQuestionPet(role.label, `fixed-pet:${role.label}`);
                    const selected = selectedPetRole === role.label;
                    return (
                      <button
                        key={role.label}
                        type="button"
                        className={`pet-role-option${selected ? " is-selected" : ""}`}
                        role="radio"
                        aria-checked={selected}
                        aria-label={role.label}
                        title={role.label}
                        onClick={() => setSelectedPetRole(role.label)}
                      >
                        <QuestionPetPreview
                          question={role.label}
                          appearance={optionAppearance}
                          size={2}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
              <p className="pet-card-label">{selectedPetRole}</p>
              <div className="question-hatch-screen">
                <QuestionPetPreview
                  question={selectedPetRole}
                  appearance={appearance}
                  fill
                />
              </div>
              <div className="question-hatch-actions">
                <button
                  className="player-setup-action mode-primary"
                  type="button"
                  onPointerUp={(event) => {
                    event.preventDefault();
                    handleStart();
                  }}
                  onClick={handleStart}
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
