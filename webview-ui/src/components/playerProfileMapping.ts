import type { LanguageCode } from "../i18n.js";

export interface EntryPlayerProfile {
  name: string;
  palette: number;
  avatarTitle?: string;
  currentRole: string;
  mission: string;
  constraints?: string;
  skills?: string;
  question: string;
  webLink?: string;
  petSeed?: string;
}

const urlPattern = /https?:\/\/[^\s)\]}>'"]+/i;

export function extractFirstUrl(text: string): string {
  return text.match(urlPattern)?.[0] ?? "";
}

export function createEntryProfile(input: {
  name: string;
  questionAndLink: string;
  language: LanguageCode;
  seed: string;
  palette: number;
}): EntryPlayerProfile {
  const name =
    input.name.trim() ||
    (input.language === "zh-TW" ? "桃花源訪客" : "Visitor");
  const question = input.questionAndLink.trim();
  return {
    name,
    palette: input.palette,
    avatarTitle:
      input.language === "zh-TW"
        ? "桃花源訪客"
        : "Visitor of Peach Blossom Spring",
    currentRole:
      input.language === "zh-TW"
        ? "桃花源訪客"
        : "Visitor of Peach Blossom Spring",
    mission: question,
    question,
    webLink: extractFirstUrl(question),
    constraints: "",
    skills: "",
    petSeed: input.seed,
  };
}
