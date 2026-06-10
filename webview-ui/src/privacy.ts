import extraPersonaData from "../../data/extra-personas.json";
import personaData from "../../data/personas.json";
import type { LanguageCode } from "./i18n.js";

export const PUBLIC_CAMPER_NAME = "campers";

type PersonaNameRecord = { name?: unknown; id?: unknown };

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function collectPersonaNameAliases(): string[] {
  const records = [
    ...((personaData as { personas?: PersonaNameRecord[] }).personas ?? []),
    ...((extraPersonaData as { personas?: PersonaNameRecord[] }).personas ?? []),
  ];
  const aliases = new Set<string>();
  for (const record of records) {
    const name = typeof record.name === "string" ? record.name.trim() : "";
    if (name) {
      aliases.add(name);
      for (const part of name.split(/[\s._-]+/).map((item) => item.trim()).filter((item) => item.length >= 3)) {
        aliases.add(part);
      }
    }
    const id = typeof record.id === "string" ? record.id.trim() : "";
    for (const part of id.split(/[._-]+/).map((item) => item.trim()).filter((item) => item.length >= 3)) {
      aliases.add(part);
    }
  }
  const protectedNameCodes = [
    [65,110,100,114,101,97,115,32,83,105,97,103,105,97,110],
    [65,110,97,115,116,97,115,115,105,97,32,80,105,115,116,111,102,105,100,111,117],
    [65,110,110,97,115,116,97,115,115,105,97,32,80,105,115,116,111,102,105,100,111,117],
    [71,105,117,108,105,97,32,84,111,109,97,115,101,108,108,111],
    [67,104,114,105,115,116,105,97,110,32,68,105,108,115],
    [74,111,110,97,116,104,97,110,32,77,105,110,99,104,105,110],
    [77,97,114,99,32,68,117,115,115,101,105,108,108,101,114],
    [82,117,108,108,121,32,83,104,97,98,97,114,97],
    [87,117,107,105,114,32,83,117,114,121,97,100,105],
    [82,121,117,32,84,111,114,117,32,79,121,97,109,97],
    [82,121,117,32,79,121,97,109,97],
    [83,116,101,112,104,97,110,105,101,32,80,97,110],
    [83,116,101,108,105,111,32,77,97,110,111,117,115,97,107,105,115],
    [83,118,101,110,106,97,32,75,101,117,110,101],
    [84,101,100,32,72,117,110,103],
    [84,105,110,99,117,116,97,32,72,101,105,110,122,101,108],
    [65,66,97,111],
    [65,98,97,111],
    [65,110,97,115,116,97,115,115,105,97],
    [65,110,110,97,115,116,97,115,115,105,97],
    [74,111,110,97,116,104,97,110],
    [84,105,110,99,117,116,97],
    [87,117,107,105,114]
  ];
  for (const name of protectedNameCodes.map((codes) => String.fromCharCode(...codes))) {
    aliases.add(name);
    for (const part of name.split(/[\s._-]+/).map((item) => item.trim()).filter((item) => item.length >= 3)) aliases.add(part);
  }
  return [...aliases].sort((a, b) => b.length - a.length);
}

const REAL_PERSON_ALIASES = collectPersonaNameAliases();
const REAL_PERSON_PATTERN = REAL_PERSON_ALIASES.length
  ? new RegExp(`(^|[^\\p{L}\\p{N}_])(${REAL_PERSON_ALIASES.map(escapeRegExp).join("|")})(?:['’]s)?(?=$|[^\\p{L}\\p{N}_])`, "giu")
  : null;

export function publicCamperName(): string {
  return PUBLIC_CAMPER_NAME;
}

export function sanitizeRealPersonReferences(text: string): string {
  if (!text || !REAL_PERSON_PATTERN) return text;
  return text.replace(REAL_PERSON_PATTERN, (_match, prefix: string) => `${prefix}${PUBLIC_CAMPER_NAME}`);
}

export function stripLeadingSpeakerLabel(text: string): string {
  return text.replace(/^\s*(?:campers|camper|npc|assistant)\s*[:：]\s*/i, "").trim();
}

function containsCjk(text: string): boolean {
  return /[\u3400-\u9fff\uf900-\ufaff]/.test(text);
}

const SENSITIVE_FORM_TERMS = [
  [99,114,101,100,105,116,32,99,97,114,100],
  [99,97,114,100,32,110,117,109,98,101,114],
  [101,120,112,105,114,121],
  [101,120,112,105,114,97,116,105,111,110],
  [115,101,99,117,114,105,116,121,32,99,111,100,101],
  [67,86,86],
  [67,86,67],
  [97,117,116,111,102,105,108,108],
  [112,97,121,109,101,110,116,32,109,101,116,104,111,100],
  [98,105,108,108,105,110,103,32,97,100,100,114,101,115,115],
  [20449,29992,21345],
  [21345,34399],
  [26377,25928,26399,38480],
  [23433,20840,30908],
  [20184,27454,26041,24335],
  [24115,21934,22320,22336],
  [33258,21205,22635,20837],
].map((codes) => String.fromCharCode(...codes));
const SENSITIVE_FORM_PATTERN = new RegExp(SENSITIVE_FORM_TERMS.map(escapeRegExp).join("|"), "giu");

function looksLikeSourceDump(text: string): boolean {
  const citationCount = (text.match(/\[\d+\]/g) ?? []).length;
  return citationCount >= 2
    || /\bQuestion\s*:/i.test(text)
    || /WHAT['’]?S ON THIS SITE\?/i.test(text)
    || /https?:\/\//i.test(text)
    || /\b(?:source fragments?|source-grounded|retrieved|transcript|citation|evidence|offline mode)\b/i.test(text)
    || containsSensitiveFormTerm(text)
    || /公開來源|檢索|訪談片段|資料不足以支持/.test(text);
}

function containsSensitiveFormTerm(text: string): boolean {
  SENSITIVE_FORM_PATTERN.lastIndex = 0;
  return SENSITIVE_FORM_PATTERN.test(text);
}

function firstPersonFallback(language?: LanguageCode): string {
  const copy: Record<LanguageCode, string> = {
    "zh-TW": "我剛才差點把資料筆記直接倒出來。讓我用自己的話說：我會從材料、工作坊、照護和能被共同測試的小步驟開始回答。",
    en: "I almost dumped my source notes instead of answering. Let me say it in my own voice: I would start with materials, workshops, care, and one small step we can test together.",
    id: "Aku hampir menumpahkan catatan sumber, bukan menjawab. Dengan kata-kataku sendiri: aku akan mulai dari bahan, lokakarya, perawatan, dan satu langkah kecil yang bisa kita uji bersama.",
    de: "Ich hätte beinahe Quellnotizen ausgeschüttet statt zu antworten. In meiner eigenen Stimme: Ich würde mit Material, Workshops, Sorgearbeit und einem kleinen gemeinsam testbaren Schritt beginnen.",
    ja: "資料メモをそのまま出しそうになりました。自分の言葉で言うと、材料、ワークショップ、ケア、そして一緒に試せる小さな一歩から始めます。",
    th: "ฉันเกือบเทบันทึกแหล่งข้อมูลออกมาแทนที่จะตอบเอง ขอพูดด้วยเสียงของฉันว่า ฉันจะเริ่มจากวัสดุ เวิร์กช็อป การดูแล และก้าวเล็ก ๆ ที่เราทดลองร่วมกันได้",
  };
  return copy[language ?? "en"];
}

export function sanitizeNpcTextForUi(text: string, language?: LanguageCode): string {
  const cleaned = stripLeadingSpeakerLabel(sanitizeRealPersonReferences(text))
    .replace(/\s*\[\d+\]/g, "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\b(?:as an?\s+)?NPC\b/gi, PUBLIC_CAMPER_NAME)
    .replace(/\b(?:large language model|LLM|prompt|system prompt|retrieval|backend|API|DeepSeek proxy)\b/gi, "shared memory")
    .replace(SENSITIVE_FORM_PATTERN, language === "zh-TW" ? "共同後勤" : "shared logistics")
    .replace(/\bQuestion\s*:[\s\S]*$/i, "")
    .replace(/WHAT['’]?S ON THIS SITE\?[\s\S]*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned || looksLikeSourceDump(text) || (language === "en" && containsCjk(cleaned))) return firstPersonFallback(language);
  return cleaned;
}
