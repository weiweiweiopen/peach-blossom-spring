import { useMemo, useRef, useState, type CSSProperties } from "react";

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
type CorePetRole = "philosopher" | "engineer" | "artist" | "scientist" | "cook" | "drinker" | "traveler" | "tailor";

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

const corePetRoles: Array<{ role: CorePetRole; zh: string; en: string; intentMode: PlayerIntentMode; skill: string }> = [
  { role: "philosopher", zh: "哲學家", en: "Philosopher", intentMode: "philosophical_debate", skill: "theory translation, hybrid theory, practical philosophy" },
  { role: "engineer", zh: "工程師", en: "Engineer", intentMode: "manufacturing_technical_file", skill: "prototype tutorial, BOM, materials, fabrication steps" },
  { role: "artist", zh: "藝術家", en: "Artist", intentMode: "poem", skill: "art plan, media dramaturgy, S+T+A+R+T+S style technology art" },
  { role: "scientist", zh: "科學家", en: "Scientist", intentMode: "nomadic_research", skill: "fictional paper, material research, matter study, biology paper structure" },
  { role: "cook", zh: "廚師", en: "Chef", intentMode: "how_to_do", skill: "kitchen plan, recipe logic, hosting, collective meals" },
  { role: "drinker", zh: "酒鬼", en: "Drinker", intentMode: "why", skill: "bar talk, social fermentation, jokes, late-night honesty" },
  { role: "traveler", zh: "旅行家", en: "Traveler", intentMode: "travel_plan", skill: "routes, field visits, maps, encounters, travel notes" },
  { role: "tailor", zh: "裁縫阿姨", en: "Tailor auntie", intentMode: "manufacturing_technical_file", skill: "repair, sewing, pattern thinking, textile care" },
];

function normalizeCorePetRole(seed: string | undefined): CorePetRole {
  const value = seed?.startsWith("fixed-pet:") ? seed.slice("fixed-pet:".length) : seed;
  return corePetRoles.some((item) => item.role === value) ? value as CorePetRole : "artist";
}

export function PlayerSetup({
  language,
  onStart,
  defaultProfile,
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
        <main className="player-setup-one-panel" aria-label="Question pet creator">
          <label className="player-setup-one-field" htmlFor="question-pet-name">
            <span className="player-setup-one-label">{t(language, "setup.nameLabel")}</span>
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
          </label>

          <label className="player-setup-one-field" htmlFor="question-pet-question">
            <span className="player-setup-one-label">{t(language, "setup.questionLabel")}</span>
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
          </label>

          <fieldset className="player-setup-one-field player-setup-pet-field">
            <legend className="player-setup-one-label">寵物職業</legend>
            <div className="pet-role-runner-field" role="radiogroup" aria-label="Choose pet occupation">
              {corePetRoles.map((role, index) => {
                const optionAppearance = generateQuestionPet(role.role, `fixed-pet:${role.role}`);
                const selected = selectedPetRole === role.role;
                const label = language === "zh-TW" ? role.zh : role.en;
                return (
                  <button
                    key={role.role}
                    type="button"
                    className={`pet-runner-option${selected ? " is-selected" : ""}`}
                    style={{ "--pet-runner-delay": `${(-index * 0.37).toFixed(2)}s` } as CSSProperties}
                    role="radio"
                    aria-checked={selected}
                    aria-label={label}
                    title={label}
                    onClick={() => setSelectedPetRole(role.role)}
                  >
                    <span className="pet-runner-bubble">{label}</span>
                    <QuestionPetPreview question={role.role} appearance={optionAppearance} size={2} />
                  </button>
                );
              })}
            </div>
          </fieldset>
        </main>

        <div className="player-setup-bottom-action" aria-label="Mode">
          <button
            type="submit"
            className="player-setup-action player-setup-action--why"
            aria-label="生成我的維基電子雞代理"
          >
            生成我的維基電子雞代理（wiki tamagotchi agent)！
          </button>
        </div>
      </form>
    </div>
  );
}

export type { PlayerProfile, StartMode };
