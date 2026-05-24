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

type StartMode = "interactive" | "dispatch_observer";
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

const corePetRoles: Array<{ role: CorePetRole; labels: Record<LanguageCode, string>; intentMode: PlayerIntentMode; skill: string }> = [
  { role: "philosopher", labels: { "zh-TW": "哲學家", en: "Philosopher", de: "Philosoph:in", id: "Filsuf", ja: "哲学者", th: "นักปรัชญา" }, intentMode: "philosophical_debate", skill: "theory translation, hybrid theory, practical philosophy" },
  { role: "engineer", labels: { "zh-TW": "工程師", en: "Engineer", de: "Ingenieur:in", id: "Insinyur", ja: "エンジニア", th: "วิศวกร" }, intentMode: "manufacturing_technical_file", skill: "prototype tutorial, BOM, materials, fabrication steps" },
  { role: "artist", labels: { "zh-TW": "藝術家", en: "Artist", de: "Künstler:in", id: "Seniman", ja: "アーティスト", th: "ศิลปิน" }, intentMode: "poem", skill: "art plan, media dramaturgy, S+T+A+R+T+S style technology art" },
  { role: "scientist", labels: { "zh-TW": "科學家", en: "Scientist", de: "Wissenschaftler:in", id: "Ilmuwan", ja: "科学者", th: "นักวิทยาศาสตร์" }, intentMode: "why", skill: "fictional paper, material research, matter study, biology paper structure" },
  { role: "cook", labels: { "zh-TW": "廚師", en: "Chef", de: "Koch/Köchin", id: "Koki", ja: "料理人", th: "เชฟ" }, intentMode: "how_to_do", skill: "kitchen plan, recipe logic, hosting, collective meals" },
  { role: "drinker", labels: { "zh-TW": "酒鬼", en: "Drinker", de: "Trinker:in", id: "Pemabuk", ja: "飲み助", th: "นักดื่ม" }, intentMode: "why", skill: "bar talk, fermentation, late-night honesty, gentle humor" },
  { role: "traveler", labels: { "zh-TW": "旅行家", en: "Traveler", de: "Reisende:r", id: "Pengelana", ja: "旅人", th: "นักเดินทาง" }, intentMode: "travel_plan", skill: "routes, field visits, maps, encounters, travel notes" },
  { role: "tailor", labels: { "zh-TW": "裁縫阿姨", en: "Tailor auntie", de: "Schneider-Tante", id: "Bibi penjahit", ja: "仕立て屋のおばさん", th: "ป้าช่างตัดเสื้อ" }, intentMode: "manufacturing_technical_file", skill: "repair, sewing, pattern thinking, textile care" },
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
    const queryText = question.trim();
    if (!profileName || !queryText) {
      formElement?.reportValidity();
      return null;
    }
    return {
      name: profileName,
      palette: appearance.seed % 6,
      avatarTitle: selectedRole.role,
      currentRole: t(language, "setup.keeper"),
      mission: queryText,
      question: queryText,
      constraints: queryText,
      skills: selectedRole.skill,
      intentMode: selectedRole.intentMode,
      personalArchive: queryText,
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
    <div className="player-setup-overlay tamagotchi-bg player-setup-overlay--minimal" data-language={language}>
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
              placeholder={t(language, "setup.namePlaceholder")}
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
              placeholder={t(language, "setup.questionPlaceholder")}
            />
          </label>

          <fieldset className="player-setup-one-field player-setup-pet-field">
            <legend className="player-setup-one-label">{t(language, "setup.petOccupationLabel")}</legend>
            <div className="pet-role-runner-field" role="radiogroup" aria-label={t(language, "setup.petOccupationAria")}>
              {corePetRoles.map((role, index) => {
                const optionAppearance = generateQuestionPet(role.role, `fixed-pet:${role.role}`);
                const selected = selectedPetRole === role.role;
                const label = role.labels[language];
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
            aria-label={t(language, "setup.creatorSubmitAria")}
          >
            {t(language, "setup.creatorSubmit")}
          </button>
        </div>
      </form>
    </div>
  );
}

export type { PlayerProfile, StartMode };
