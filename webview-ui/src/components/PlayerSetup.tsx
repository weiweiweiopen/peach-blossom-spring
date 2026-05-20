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
  intentMode?: PlayerIntentMode;
  personalArchive?: string;
  petSeed?: string;
}

type StartMode = "interactive" | "dispatch_observer" | "document_generation";
type PlayerIntentMode = "nomadic_research" | "manufacturing_technical_file" | "travel_plan" | "poem" | "find_people" | "survive" | "how_to_do" | "why" | "philosophical_debate";
type CorePetRole = "philosopher" | "engineer" | "artist" | "scientist";

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

const corePetRoles: Array<{ role: CorePetRole; emoji: string; zh: string; en: string; intentMode: PlayerIntentMode; skill: string }> = [
  { role: "philosopher", emoji: "◌", zh: "哲學家", en: "Philosopher", intentMode: "philosophical_debate", skill: "theory translation, hybrid theory, practical philosophy" },
  { role: "engineer", emoji: "▣", zh: "工程師", en: "Engineer", intentMode: "manufacturing_technical_file", skill: "prototype tutorial, BOM, materials, fabrication steps" },
  { role: "artist", emoji: "✶", zh: "藝術家", en: "Artist", intentMode: "poem", skill: "art plan, media dramaturgy, S+T+A+R+T+S style technology art" },
  { role: "scientist", emoji: "◇", zh: "科學家", en: "Scientist", intentMode: "nomadic_research", skill: "fictional paper, material research, matter study, biology paper structure" },
];

function normalizeCorePetRole(seed: string | undefined): CorePetRole {
  const value = seed?.startsWith("fixed-pet:") ? seed.slice("fixed-pet:".length) : seed;
  return corePetRoles.some((item) => item.role === value) ? value as CorePetRole : "artist";
}

export function PlayerSetup({
  language,
  onStart,
  defaultProfile,
  onClearArchive,
  archiveSummary,
}: PlayerSetupProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const startRequestedRef = useRef(false);
  const [name, setName] = useState(defaultProfile?.name ?? "");
  const [question, setQuestion] = useState(defaultProfile?.question ?? defaultProfile?.mission ?? "");
  const [selectedPetRole, setSelectedPetRole] = useState<CorePetRole>(() => normalizeCorePetRole(defaultProfile?.petSeed));
  const selectedRole = corePetRoles.find((item) => item.role === selectedPetRole) ?? corePetRoles[2];
  const appearance = useMemo(
    () => generateQuestionPet(selectedRole.role, `fixed-pet:${selectedRole.role}`),
    [selectedRole.role],
  );

  function profileForMode(): PlayerProfile | null {
    const formElement = formRef.current;
    const profileName = name.trim();
    const seedText = question.trim();
    if (!profileName || !seedText) {
      formElement?.reportValidity();
      return null;
    }
    return {
      name: profileName,
      palette: appearance.seed % 6,
      avatarTitle: selectedRole.role,
      currentRole: t(language, "setup.keeper"),
      mission: seedText,
      question: seedText,
      constraints: seedText,
      skills: selectedRole.skill,
      intentMode: selectedRole.intentMode,
      personalArchive: seedText,
      petSeed: `fixed-pet:${selectedRole.role}`,
    };
  }

  function handleStart(mode: StartMode) {
    if (startRequestedRef.current) return;
    const profile = profileForMode();
    if (!profile) return;
    startRequestedRef.current = true;
    try {
      onStart(profile, mode);
    } catch (error) {
      startRequestedRef.current = false;
      throw error;
    }
  }

  return (
    <div className="player-setup-overlay tamagotchi-bg player-setup-overlay--minimal">
      <form
        ref={formRef}
        className="player-setup-shell player-setup-shell--minimal"
        onSubmit={(event) => {
          event.preventDefault();
          handleStart("interactive");
        }}
      >
        <div className="player-setup-merged-panel rpg-message-frame player-setup-merged-panel--minimal">
          <aside className="question-hatch-device is-hatching question-hatch-device--minimal" aria-live="polite">
            <div className="question-hatch-selector">
              <div className="pet-role-grid pet-role-grid--core" role="radiogroup" aria-label="Choose pet">
                {corePetRoles.map((role) => {
                  const optionAppearance = generateQuestionPet(role.role, `fixed-pet:${role.role}`);
                  const selected = selectedPetRole === role.role;
                  return (
                    <button
                      key={role.role}
                      type="button"
                      className={`pet-role-option${selected ? " is-selected" : ""}`}
                      role="radio"
                      aria-checked={selected}
                      aria-label={language === "zh-TW" ? role.zh : role.en}
                      title={language === "zh-TW" ? role.zh : role.en}
                      onClick={() => setSelectedPetRole(role.role)}
                    >
                      <span className="pet-role-emoji" aria-hidden="true">{role.emoji}</span>
                      <QuestionPetPreview question={role.role} appearance={optionAppearance} size={2} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="question-hatch-screen">
              <QuestionPetPreview question={selectedRole.role} appearance={appearance} fill />
            </div>
          </aside>

          <section className="player-setup-controls player-setup-controls--minimal" aria-label="Start">
            <input
              id="question-pet-name"
              name="name"
              required
              className="player-setup-field"
              maxLength={32}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="name"
              autoFocus
            />
            <textarea
              id="question-pet-question"
              name="question"
              required
              className="player-setup-field player-setup-textarea-large"
              maxLength={1200}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="seed"
            />
            <div className="player-setup-mode-row player-setup-mode-row--single" aria-label="Mode">
              <button
                type="submit"
                className="player-setup-action player-setup-action--why"
                aria-label="Enter with why mode"
              >
                why!
              </button>
              {archiveSummary.total > 0 && (
                <button className="player-setup-clear" type="button" onClick={onClearArchive} aria-label="Clear pets">×</button>
              )}
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}

export type { PlayerProfile, StartMode };
