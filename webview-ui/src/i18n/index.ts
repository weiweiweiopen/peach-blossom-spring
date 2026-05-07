import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from "react";

import en from "./locales/en.js";
import ja from "./locales/ja.js";
import th from "./locales/th.js";
import zhTW from "./locales/zh-TW.js";

export type LanguageCode = "zh-TW" | "en" | "ja" | "th";
export type TextDirection = "ltr" | "rtl";
export type LocaleMessages = typeof zhTW;

type Primitive = string | number | boolean;
type TranslationValues = Record<string, Primitive>;
type LeafPaths<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : T[K] extends Record<string, unknown>
      ? LeafPaths<T[K], `${Prefix}${K}.`>
      : never;
}[keyof T & string];

export type TranslationKey = LeafPaths<LocaleMessages>;

export const DEFAULT_LOCALE: LanguageCode = "en";
export const LANGUAGE_STORAGE_KEY = "pbs.settings.language";

export const supportedLanguages: Array<{
  code: LanguageCode;
  nativeName: string;
  shortCode: string;
  dir: TextDirection;
}> = [
  { code: "zh-TW", nativeName: "繁體中文", shortCode: "ZH", dir: "ltr" },
  { code: "en", nativeName: "English", shortCode: "EN", dir: "ltr" },
  { code: "ja", nativeName: "日本語", shortCode: "JA", dir: "ltr" },
  { code: "th", nativeName: "ไทย", shortCode: "TH", dir: "ltr" },
];

const supportedLanguageCodes = new Set<LanguageCode>(
  supportedLanguages.map((entry) => entry.code),
);

export const locales: Record<LanguageCode, LocaleMessages> = {
  "zh-TW": zhTW,
  en,
  ja,
  th,
};

const legacyKeyMap = {
  languageLabel: "language.menuLabel",
  ngmLabel: "home.ngmLabel",
  loginTitle: "home.title",
  loginSubtitle: "home.subtitle",
  loginDescription: "home.description",
  createProtagonist: "home.createProtagonist",
  createTraveler: "home.createTraveler",
  nameLabel: "home.playerNameLabel",
  namePlaceholder: "home.playerNamePlaceholder",
  roleLabel: "home.roleLabel",
  rolePlaceholder: "home.rolePlaceholder",
  missionLabel: "home.missionLabel",
  missionPlaceholder: "home.missionPlaceholder",
  constraintsLabel: "home.constraintsLabel",
  constraintsPlaceholder: "home.constraintsPlaceholder",
  avatarCollection: "home.avatarCollection",
  skillsLabel: "home.skillsLabel",
  skillsPlaceholder: "home.skillsPlaceholder",
  enterWorld: "home.enterWorld",
  sendOnExpedition: "home.sendOnExpedition",
  movementHint: "home.movementHint",
  pressSpaceToTalk: "hud.pressToTalk",
  wanderAndTalk: "home.wanderAndTalk",
  archiveTree: "archive.tree",
  archiveTitle: "archive.title",
  archiveDescription: "archive.description",
  archiveNewsTitle: "archive.newsTitle",
  archiveEbookButton: "archive.ebookButton",
  archiveMapButton: "archive.mapButton",
  archivePdfTitle: "archive.pdfTitle",
  archiveMapTitle: "archive.mapTitle",
  communityPortals: "archive.communityPortals",
  wiki: "dialogue.openWiki",
  noWikiLinks: "archive.noWikiLinks",
  teachMe: "dialogue.teachMe",
  whereIsThis: "dialogue.whereIsThis",
  askAnything: "dialogue.inputPlaceholder",
  talk: "dialogue.talkButton",
  close: "common.close",
  thinking: "dialogue.thinking",
  apiKeyMissing: "api.keyMissing",
  apiKeyMissingInstruction: "api.keyMissingInstruction",
  localApiKeySettings: "api.localSettings",
  apiKeyLabel: "api.keyLabel",
  saveLocally: "api.saveLocally",
  savedLocally: "api.savedLocally",
  clearSavedKey: "api.clearSavedKey",
  expeditionTitle: "expedition.title",
  templateSimulation: "expedition.templateSimulation",
  expeditionDescription: "expedition.description",
  expeditionPlayerSummary: "expedition.playerSummary",
  expeditionConstraints: "expedition.constraints",
  expeditionSkills: "expedition.skills",
  expeditionNoConstraints: "expedition.noConstraints",
  expeditionMission: "expedition.mission",
  expeditionMaxRounds: "expedition.maxRounds",
  expeditionSelectedNpcs: "expedition.selectedNpcs",
  expeditionRun: "expedition.run",
  expeditionRunning: "expedition.running",
  expeditionLiveLog: "expedition.liveLog",
  expeditionNoEvents: "expedition.noEvents",
  expeditionRound: "expedition.round",
  expeditionChallenge: "expedition.challenge",
  expeditionLead: "expedition.lead",
  expeditionNextQuestion: "expedition.nextQuestion",
  expeditionReport: "expedition.report",
  expeditionOriginalMission: "expedition.originalMission",
  expeditionInterpretedMission: "expedition.interpretedMission",
  expeditionEmergentDirection: "expedition.emergentDirection",
  expeditionKeyEncounters: "expedition.keyEncounters",
  expeditionNpcDisagreements: "expedition.npcDisagreements",
  expeditionBlindSpots: "expedition.blindSpots",
  expeditionNextActions: "expedition.nextActions",
  expeditionFollowUpQuestions: "expedition.followUpQuestions",
  expeditionResearchLeads: "expedition.researchLeads",
  encounterFrictionCircle: "encounter.frictionCircle",
  encounterFieldTest: "encounter.fieldTest",
  encounterNightKitchenArgument: "encounter.nightKitchenArgument",
  encounterArchiveDetour: "encounter.archiveDetour",
  encounterPrototypeOmen: "encounter.prototypeOmen",
  abaoEncounterTitle: "encounter.abaoTitle",
  abaoEncounterHint: "encounter.abaoHint",
  hatchEnter: "encounter.hatchEnter",
  dispatchPetOnly: "pet.dispatchPetOnly",
  dispatchArchive: "pet.dispatchArchive",
  localDispatchRecords: "pet.localDispatchRecords",
  active: "pet.active",
  hibernating: "pet.hibernating",
  archived: "pet.archived",
  fieldNotes: "pet.fieldNotes",
  petReturnedNotes: "pet.returnedNotes",
  localOnlyNotice: "pet.localOnlyNotice",
  smallCircleEvent: "pet.smallCircleEvent",
  hibernationEvent: "pet.hibernationEvent",
  worldResonanceEvent: "pet.worldResonanceEvent",
  observerMode: "sim.observerMode",
  stats: "sim.stats",
  status: "pet.status",
  skill: "pet.skill",
  sendFieldNote: "pet.sendFieldNote",
  fieldNotePlaceholder: "pet.fieldNotePlaceholder",
  zoomIn: "hud.zoomIn",
  zoomOut: "hud.zoomOut",
  questionPetName: "pet.questionPet",
  questionPetKeeper: "pet.keeper",
  questionPetSim: "hud.questionPetSim",
  tick: "hud.tick",
  energy: "pet.energy",
  stress: "pet.stress",
  bond: "pet.bond",
  originalQuestionPurpose: "pet.originalQuestionPurpose",
  responses: "pet.responses",
  shareIdeaPlaceholder: "pet.shareIdeaPlaceholder",
  postResponse: "pet.postResponse",
  noResponsesYet: "pet.noResponsesYet",
  npcLabel: "sim.npcLabel",
  loadingExpedition: "hud.loadingExpedition",
  rotateHint: "home.rotateHint",
} as const satisfies Record<string, TranslationKey>;

type LegacyTranslationKey = keyof typeof legacyKeyMap;

function isLanguageCode(value: string): value is LanguageCode {
  return supportedLanguageCodes.has(value as LanguageCode);
}

function warn(message: string): void {
  if (import.meta.env.DEV) {
    console.warn(message);
  }
}

export function normalizeLocale(value: string | null | undefined): LanguageCode {
  return value && isLanguageCode(value) ? value : DEFAULT_LOCALE;
}

export function getLanguageMeta(locale: LanguageCode) {
  return supportedLanguages.find((entry) => entry.code === locale) ?? supportedLanguages[0];
}

export function readStoredLanguage(): LanguageCode {
  if (typeof localStorage === "undefined") return DEFAULT_LOCALE;
  return normalizeLocale(localStorage.getItem(LANGUAGE_STORAGE_KEY));
}

export function writeStoredLanguage(language: LanguageCode): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

export function applyDocumentLocale(language: LanguageCode): void {
  if (typeof document === "undefined") return;
  const meta = getLanguageMeta(language);
  document.documentElement.lang = language;
  document.documentElement.dir = meta.dir;
}

function resolveKey(key: TranslationKey | LegacyTranslationKey | string): TranslationKey {
  return (legacyKeyMap[key as LegacyTranslationKey] ?? key) as TranslationKey;
}

function lookup(messages: LocaleMessages, key: TranslationKey): string | undefined {
  let current: unknown = messages;
  for (const segment of key.split(".")) {
    if (!current || typeof current !== "object" || !(segment in current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return typeof current === "string" ? current : undefined;
}

function interpolate(template: string, values: TranslationValues = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = values[name];
    return value === undefined ? match : String(value);
  });
}

export function t(
  language: LanguageCode,
  key: TranslationKey | LegacyTranslationKey,
  values?: TranslationValues,
): string {
  const resolvedKey = resolveKey(key);
  const value = lookup(locales[language], resolvedKey);
  if (value === undefined) {
    warn(`[i18n] Missing translation for ${language}:${resolvedKey}`);
    return resolvedKey;
  }
  return interpolate(value, values);
}

interface I18nContextValue {
  locale: LanguageCode;
  setLocale: (locale: LanguageCode) => void;
  t: (key: TranslationKey | LegacyTranslationKey, values?: TranslationValues) => string;
  supportedLanguages: typeof supportedLanguages;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LanguageCode>(() => readStoredLanguage());

  const setLocale = useCallback((nextLocale: LanguageCode) => {
    const normalized = normalizeLocale(nextLocale);
    setLocaleState(normalized);
    writeStoredLanguage(normalized);
    applyDocumentLocale(normalized);
  }, []);

  useEffect(() => {
    applyDocumentLocale(locale);
    writeStoredLanguage(locale);
  }, [locale]);

  const contextValue = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      supportedLanguages,
      t: (key, values) => t(locale, key, values),
    }),
    [locale, setLocale],
  );

  return createElement(I18nContext.Provider, { value: contextValue }, children);
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return context;
}
