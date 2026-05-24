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
type CorePetRole = "architect" | "artist" | "bubble maker" | "cook" | "dancer" | "drinker" | "engineer" | "fire maker" | "herbalist" | "musician" | "professor" | "scientist" | "shaman" | "socialist" | "tailor" | "workshopologist";

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
  { role: "architect", labels: { "zh-TW": "建築師", en: "Architect", de: "Architekt:in", id: "Arsitek", ja: "建築家", th: "สถาปนิก" }, intentMode: "why", skill: "spatial thinking, shelter, public rooms, village diagrams" },
  { role: "artist", labels: { "zh-TW": "藝術家", en: "Artist", de: "Künstler:in", id: "Seniman", ja: "アーティスト", th: "ศิลปิน" }, intentMode: "poem", skill: "art plan, media dramaturgy, S+T+A+R+T+S style technology art" },
  { role: "bubble maker", labels: { "zh-TW": "泡泡師", en: "Bubble maker", de: "Blasenmacher:in", id: "Pembuat gelembung", ja: "泡つくり", th: "คนทำฟอง" }, intentMode: "poem", skill: "play, fragile atmospheres, small publics, light experiments" },
  { role: "cook", labels: { "zh-TW": "廚師", en: "Chef", de: "Koch/Köchin", id: "Koki", ja: "料理人", th: "เชฟ" }, intentMode: "how_to_do", skill: "kitchen plan, recipe logic, hosting, collective meals" },
  { role: "dancer", labels: { "zh-TW": "舞者", en: "Dancer", de: "Tänzer:in", id: "Penari", ja: "踊り手", th: "นักเต้น" }, intentMode: "poem", skill: "movement scores, embodied research, rhythm, rehearsal" },
  { role: "drinker", labels: { "zh-TW": "酒鬼", en: "Drinker", de: "Trinker:in", id: "Pemabuk", ja: "飲み助", th: "นักดื่ม" }, intentMode: "why", skill: "bar talk, fermentation, late-night honesty, gentle humor" },
  { role: "engineer", labels: { "zh-TW": "工程師", en: "Engineer", de: "Ingenieur:in", id: "Insinyur", ja: "エンジニア", th: "วิศวกร" }, intentMode: "manufacturing_technical_file", skill: "prototype tutorial, BOM, materials, fabrication steps" },
  { role: "fire maker", labels: { "zh-TW": "生火師", en: "Fire maker", de: "Feuermacher:in", id: "Pembuat api", ja: "火起こし", th: "คนก่อไฟ" }, intentMode: "survive", skill: "camp maintenance, warmth, risk, practical survival" },
  { role: "herbalist", labels: { "zh-TW": "草藥師", en: "Herbalist", de: "Kräuterkundige:r", id: "Peramu herbal", ja: "薬草師", th: "หมอยา" }, intentMode: "how_to_do", skill: "plants, care, remedies, field observation" },
  { role: "musician", labels: { "zh-TW": "音樂家", en: "Musician", de: "Musiker:in", id: "Musisi", ja: "音楽家", th: "นักดนตรี" }, intentMode: "poem", skill: "listening, rhythm, performance, collective sound" },
  { role: "professor", labels: { "zh-TW": "教授", en: "Professor", de: "Professor:in", id: "Profesor", ja: "教授", th: "ศาสตราจารย์" }, intentMode: "philosophical_debate", skill: "theory translation, hybrid theory, practical philosophy" },
  { role: "scientist", labels: { "zh-TW": "科學家", en: "Scientist", de: "Wissenschaftler:in", id: "Ilmuwan", ja: "科学者", th: "นักวิทยาศาสตร์" }, intentMode: "why", skill: "fictional paper, material research, matter study, biology paper structure" },
  { role: "shaman", labels: { "zh-TW": "薩滿", en: "Shaman", de: "Schamane:in", id: "Dukun", ja: "シャーマン", th: "หมอผี" }, intentMode: "philosophical_debate", skill: "ritual, intuition, spirits, nonhuman negotiation" },
  { role: "socialist", labels: { "zh-TW": "社會主義者", en: "Socialist", de: "Sozialist:in", id: "Sosialis", ja: "社会主義者", th: "นักสังคมนิยม" }, intentMode: "why", skill: "commons, mutual aid, labor, collective infrastructure" },
  { role: "tailor", labels: { "zh-TW": "裁縫阿姨", en: "Tailor auntie", de: "Schneider-Tante", id: "Bibi penjahit", ja: "仕立て屋のおばさん", th: "ป้าช่างตัดเสื้อ" }, intentMode: "manufacturing_technical_file", skill: "repair, sewing, pattern thinking, textile care" },
  { role: "workshopologist", labels: { "zh-TW": "工作坊學家", en: "Workshopologist", de: "Workshopolog:in", id: "Workshopolog", ja: "ワークショップ学者", th: "นักเวิร์กช็อป" }, intentMode: "how_to_do", skill: "facilitation, workshop formats, collective learning, protocols" },
];

function normalizeCorePetRole(seed: string | undefined): CorePetRole {
  const value = seed?.startsWith("fixed-pet:") ? seed.slice("fixed-pet:".length) : seed;
  if (value === "philosopher") return "professor";
  if (value === "traveler") return "dancer";
  if (value === "bubble-maker") return "bubble maker";
  if (value === "fire-maker") return "fire maker";
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
  const [selectedPetRole, setSelectedPetRole] = useState<CorePetRole>(() => normalizeCorePetRole(defaultProfile?.petSeed));
  const selectedRole = corePetRoles.find((item) => item.role === selectedPetRole) ?? corePetRoles[2];
  const appearance = useMemo(
    () => generateQuestionPet(selectedRole.role, `fixed-pet:${selectedRole.role}`),
    [selectedRole.role],
  );

  function profileForMode(): PlayerProfile | null {
    const formElement = formRef.current;
    const profileName = name.trim();
    if (!profileName) {
      formElement?.reportValidity();
      return null;
    }
    return {
      name: profileName,
      palette: appearance.seed % 6,
      avatarTitle: selectedRole.role,
      currentRole: t(language, "setup.keeper"),
      mission: "Tamagotchi agent",
      question: "",
      constraints: "",
      skills: selectedRole.skill,
      intentMode: selectedRole.intentMode,
      personalArchive: "",
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
