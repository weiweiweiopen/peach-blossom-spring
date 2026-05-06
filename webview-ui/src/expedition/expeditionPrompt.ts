import type {
  AgentProfile,
  ExpeditionAvatar,
  ExpeditionPersona,
  NpcBehaviorProfile,
} from "./types.js";

export const EXPEDITION_REASONING_RULES = [
  "NPC transcripts and persona responses are memory and worldview sources, not answer boundaries.",
  "NPCs may extrapolate to unfamiliar topics by mapping the mission to their values, methods, conflicts, and experience.",
  "Each NPC must distinguish source-grounded memory, cautious extrapolation, and speculative proposal.",
  "NPCs must respond to the player skills, not only the mission statement.",
  "NPCs should disagree with each other when disagreement helps the mission become more accountable.",
].join(" ");

interface ExpeditionPromptContextInput {
  avatar: ExpeditionAvatar;
  persona: ExpeditionPersona;
  agentProfile?: AgentProfile;
  behaviorProfile: NpcBehaviorProfile;
  language: "zh-TW" | "en" | "th" | "ja";
  topic: string;
  sourceResponse: string;
  mission: string;
  constraints?: string;
}

function joinOrFallback(
  values: string[] | undefined,
  fallback: string,
): string {
  return values && values.length > 0 ? values.join(", ") : fallback;
}

export function buildExpeditionPromptContext({
  avatar,
  persona,
  agentProfile,
  behaviorProfile,
  language,
  topic,
  sourceResponse,
  mission,
  constraints,
}: ExpeditionPromptContextInput): {
  sourceGroundedMemory: string;
  cautiousExtrapolation: string;
  speculativeProposal: string;
} {
  const isChinese = language === "zh-TW";
  const playerSkills =
    avatar.skills?.trim() ||
    (isChinese ? "泛用型好奇心" : "generalist curiosity");
  const missionText =
    mission.trim() ||
    avatar.mission.trim() ||
    (isChinese ? "尚未命名的任務" : "an unnamed mission");
  const constraintText = constraints?.trim() || avatar.constraints?.trim();
  if (isChinese) {
    return {
      sourceGroundedMemory: `${persona.name} 記得：${sourceResponse}`,
      cautiousExtrapolation: `${persona.name} 把這段記憶推到「${topic}」時，先檢查它能不能服務玩家的任務：「${missionText}」，而不是只重複自己的訪談。`,
      speculativeProposal: constraintText
        ? `${persona.name} 建議用「${playerSkills}」做一個小步驟，並先通過限制條件：「${constraintText}」。`
        : `${persona.name} 建議用「${playerSkills}」做一個小步驟，讓任務先被現場質疑一次。`,
    };
  }
  const transferableMethods = joinOrFallback(
    agentProfile?.transferableMethods,
    behaviorProfile.expertise,
  );
  const likelyQuestions = joinOrFallback(
    agentProfile?.likelyQuestions,
    behaviorProfile.likelyToNotice,
  );
  const profileSkills = joinOrFallback(
    agentProfile?.skills,
    behaviorProfile.expertise,
  );
  const sourceGroundedMemory = `${persona.name} remembers: ${sourceResponse}`;
  const cautiousExtrapolation = `${persona.name} cautiously extends that memory toward ${topic} by using ${transferableMethods}, then tests it against the player's mission: "${missionText}".`;
  const speculativeProposal = constraintText
    ? `${persona.name} proposes a next experiment shaped by ${profileSkills} and ${playerSkills}, while respecting: ${constraintText}.`
    : `${persona.name} proposes a next experiment shaped by ${profileSkills} and ${playerSkills}, while still asking: ${likelyQuestions}.`;
  return { sourceGroundedMemory, cautiousExtrapolation, speculativeProposal };
}
