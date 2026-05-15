import { generateQuestionPet } from "../pets/generateQuestionPet.js";
import {
  defaultScores,
  deriveNpcState,
  playerDefaultState,
  throngletDefaultState,
} from "./defaults.js";
import { scorePromptResonance } from "./resonance.js";
import { deltaForAction, makeEvent, updateStateForAction } from "./rules.js";
import { scoreEvent } from "./scoring.js";
import { chooseAction } from "./selectors.js";
import {
  deterministicThought,
  shouldTriggerThought,
} from "./thoughtTriggers.js";
import type {
  A2AExchange,
  A2ANutrientSource,
  A2AState,
  DispatchedQuestion,
  FinalDocument,
  FinalDocumentLogEntry,
  FinalDocumentMode,
  PetKnowledgeJson,
  PetPersonaJson,
  ProblemMaturationProfile,
  SimEntity,
  SimEvent,
  SimScores,
  SimSnapshot,
  SimThrong,
  Thronglet,
} from "./types.js";

export interface NpcKnowledgeLink {
  title: string;
  url: string;
  description: string;
}

export interface NpcKnowledgeContext {
  personaId: string;
  name: string;
  role: string;
  intro: string;
  links: NpcKnowledgeLink[];
}

export interface ThrongletCreationContext {
  intentMode?: string;
  petRole?: string;
  skills?: string;
  personalArchive?: string;
}

function splitTags(text: string): string[] {
  const withoutUrls = text.replace(/https?:\/\/\S+/gi, ' ');
  return Array.from(
    new Set(
      withoutUrls
        .toLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .filter((word) => word.length >= 3 && word !== 'com' && !word.includes('.'))
        .slice(0, 12),
    ),
  );
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

function extractDomains(text: string): string[] {
  return unique(
    Array.from(text.matchAll(/https?:\/\/([^/\s)]+)/gi))
      .map((match) => match[1].replace(/^www\./, '').toLowerCase()),
  );
}

function maturityStage(exchangeCount: number, turnCount: number): ProblemMaturationProfile['stage'] {
  if (exchangeCount >= 5 || turnCount >= 140) return 'fruit';
  if (exchangeCount >= 3 || turnCount >= 80) return 'mycelium';
  if (exchangeCount >= 1 || turnCount >= 18) return 'sprout';
  return 'seed';
}

function createPetPersonaJson(context: ThrongletCreationContext): PetPersonaJson {
  const intentMode = context.intentMode ?? "why";
  const mentaleseByIntent: Record<string, string[]> = {
    find_people: ["affinity", "trust", "exchange", "invitation"],
    survive: ["care", "resource", "shelter", "risk"],
    how_to_do: ["material", "method", "prototype", "constraint"],
    why: ["desire", "freedom", "pressure", "contradiction"],
  };
  return {
    role: context.petRole ?? "question pet",
    intentMode,
    mentaleseBias: mentaleseByIntent[intentMode] ?? mentaleseByIntent.why,
    voice: intentMode === "how_to_do" ? "practical indexed muse" : "poetic indexed muse",
    constraints: splitTags(context.personalArchive ?? "").slice(0, 6),
    revision: 1,
    growthLog: [],
    tensionProfile: [],
  };
}

function createPetKnowledgeJson(context: ThrongletCreationContext): PetKnowledgeJson {
  const tags = splitTags(`${context.skills ?? ""} ${context.personalArchive ?? ""}`);
  const modeByIntent: Record<string, string[]> = {
    find_people: ["travel_plan", "story", "philosophical_debate"],
    survive: ["manufacturing_technical_file", "travel_plan", "story"],
    how_to_do: ["manufacturing_technical_file", "travel_plan", "philosophical_debate"],
    why: ["poem", "philosophical_debate", "story"],
  };
  return {
    sourceText: context.personalArchive ?? "",
    skillText: context.skills ?? "",
    tags,
    preferredDocumentModes: modeByIntent[context.intentMode ?? "why"] ?? modeByIntent.why,
    referencePolicy: "Only cite sources gathered from in-game dialogue, NPC/community wiki pages, and community websites.",
    revision: 1,
    sourceQueries: tags.slice(0, 8),
    hypotheses: [],
    collectedInsights: [],
    maturationStage: 'seed',
  };
}

function deriveProblemMaturationProfile(
  pet: Thronglet,
  exchanges: A2AExchange[] = [],
  tick = 0,
): ProblemMaturationProfile {
  const petExchanges = exchanges.filter((exchange) => exchange.petId === pet.id);
  const exchangeCount = pet.a2aState?.exchangeCount ?? petExchanges.length;
  const turnCount = pet.a2aState?.turnCount ?? petExchanges.reduce((sum, exchange) => sum + exchange.turns.length, 0);
  const stage = maturityStage(exchangeCount, turnCount);
  const sourceText = pet.knowledgeJson?.sourceText ?? '';
  const skillText = pet.knowledgeJson?.skillText ?? '';
  const questionTags = splitTags(pet.question.text);
  const materialSignals = unique([
    ...(pet.knowledgeJson?.tags ?? []),
    ...splitTags(`${sourceText} ${skillText}`),
  ]).slice(0, 10);
  const mentaleseAttributes = unique([
    ...(pet.personaJson?.mentaleseBias ?? []),
    ...materialSignals.slice(0, 3),
  ]).slice(0, 8);
  const domains = extractDomains(`${pet.question.text} ${sourceText} ${skillText}`);
  const sourceQueries = unique([
    ...mentaleseAttributes.flatMap((attribute) =>
      (materialSignals.length ? materialSignals : questionTags).slice(0, 4).map((signal) => `${attribute} ${signal}`),
    ),
    ...domains.map((domain) => `context around ${domain}`),
    ...(pet.knowledgeJson?.sourceQueries ?? []),
  ]).slice(0, 12);
  const a2aDirectives = unique([
    'decompose the player question before answering it',
    'collect NPC evidence and community sources before forming conclusions',
    'ask what material, social, and emotional conditions are missing',
    pet.personaJson?.intentMode === 'how_to_do'
      ? 'convert abstract tension into a small prototype or technical file'
      : 'preserve poetic ambiguity until enough evidence exists',
  ]).slice(0, 6);
  const rejectedShortcuts = unique([
    'do not treat direct keyword/domain overlap as a finished result',
    'do not cite the player supplied source as proof until another NPC/source has reframed it',
    ...domains.map((domain) => `do not let ${domain} become the only source domain`),
  ]).slice(0, 6);
  return {
    revision: Math.max(pet.problemMaturation?.revision ?? 0, pet.knowledgeJson?.revision ?? 1),
    stage,
    attentionHypothesis: `The pet is testing how ${mentaleseAttributes.slice(0, 3).join(' / ') || 'desire / material / exchange'} changes the original question before any final answer is allowed.`,
    materialSignals,
    mentaleseAttributes,
    a2aDirectives,
    sourceQueries,
    rejectedShortcuts,
    lastUpdatedTick: tick,
  };
}

export function createThronglet(
  questionText: string,
  ownerName: string,
  ownerPlayerId: string | number,
  characterId = 10000,
  seed?: string,
  displayName = "問題電子雞",
  context: ThrongletCreationContext = {},
): Thronglet {
  const question: DispatchedQuestion = {
    id: `question-${characterId}`,
    ownerPlayerId,
    ownerName,
    text: questionText,
    createdAt: Date.now(),
    tags: [],
  };
  const pet: Thronglet = {
    id: `thronglet-${characterId}`,
    kind: "thronglet",
    characterId,
    displayName,
    ownerPlayerId,
    question,
    prompt: questionText,
    state: { ...throngletDefaultState },
    memory: [],
    currentAction: "wander",
    appearance: generateQuestionPet(questionText, seed),
    personaJson: createPetPersonaJson(context),
    knowledgeJson: createPetKnowledgeJson(context),
  };
  return {
    ...pet,
    problemMaturation: deriveProblemMaturationProfile(pet, [], 0),
  };
}

export function createInitialSnapshot(
  thronglets: Thronglet[],
  npcContexts: Array<{
    id: string;
    characterId: number;
    name: string;
    personaId?: string;
    text: string;
  }> = [],
): SimSnapshot {
  const npcs: SimEntity[] = npcContexts.map((npc) => ({
    id: npc.id,
    kind: "npc",
    characterId: npc.characterId,
    displayName: npc.name,
    prompt: npc.text,
    personaId: npc.personaId ?? npc.id.replace(/^npc-/, ""),
    state: deriveNpcState(npc.text),
    memory: [],
  }));
  return {
    tick: 0,
    entities: [
      {
        id: "player-0",
        kind: "player",
        characterId: 0,
        displayName: "player",
        state: { ...playerDefaultState },
        memory: [],
      },
      ...npcs,
    ],
    thronglets,
    events: [],
    scores: { ...defaultScores },
    throngs: [],
    thoughts: [],
    a2aExchanges: [],
    finalDocuments: [],
  };
}

const EXCHANGE_TICK_MIN = 14;
const EXCHANGE_TICK_SPAN = 16;

const referencePool = [
  { label: "Hackteria", url: "https://hackteria.org", anchorText: "Hackteria" },
  { label: "Lifepatch", url: "https://lifepatch.org", anchorText: "Lifepatch" },
  { label: "Fabricademy", url: "https://fabricademy.org", anchorText: "Fabricademy" },
  { label: "Fablab Taipei", url: "https://www.fablabtaipei.tw", anchorText: "Fablab Taipei" },
  { label: "Green FabLab", url: "https://greenfablab.org", anchorText: "Green FabLab" },
  { label: "Non-Governmental Matters", url: "https://www.nonmatter.tw", anchorText: "NGM" },
];

const finalModeLabels: Record<FinalDocumentMode, string> = {
  story: "故事",
  poem: "詩",
  manufacturing_technical_file: "製造技術文件",
  travel_plan: "旅行方案",
  philosophical_debate: "哲學辯論",
};

function normalizeDocumentMode(mode: string | undefined): FinalDocumentMode {
  if (mode === "story" || mode === "poem" || mode === "manufacturing_technical_file" || mode === "travel_plan" || mode === "philosophical_debate") return mode;
  if (mode?.includes("manufacturing") || mode?.includes("equipment") || mode?.includes("material")) return "manufacturing_technical_file";
  if (mode?.includes("travel") || mode?.includes("social")) return "travel_plan";
  if (mode?.includes("debate")) return "philosophical_debate";
  return "story";
}

function chooseFinalDocumentMode(pet: Thronglet, exchanges: A2AExchange[]): FinalDocumentMode {
  const preferred = pet.knowledgeJson?.preferredDocumentModes.map(normalizeDocumentMode) ?? [];
  const tendencies = exchanges
    .filter((exchange) => exchange.petId === pet.id)
    .flatMap((exchange) => exchange.turns.map((turn) => normalizeDocumentMode(turn.evaluation.documentModeTendency)));
  const counts = new Map<FinalDocumentMode, number>();
  for (const mode of [...preferred, ...tendencies]) counts.set(mode, (counts.get(mode) ?? 0) + 1);
  const fallback = preferred[0] ?? "poem";
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? fallback;
}

function clampStat(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function hashText(text: string): number {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function ensureA2AState(pet: Thronglet, tick: number): A2AState {
  if (pet.a2aState) return pet.a2aState;
  const seed = hashText(`${pet.id}:${pet.question.text}`);
  return {
    nextExchangeTick: tick + EXCHANGE_TICK_MIN + (seed % EXCHANGE_TICK_SPAN),
    exchangeCount: 0,
    turnCount: 0,
    requiredExchanges: 2 + (seed % 2),
    requiredTurns: 48 + (seed % 31),
  };
}

function nextExchangeTick(tick: number, pet: Thronglet, exchangeIndex: number): number {
  const seed = hashText(`${pet.id}:${exchangeIndex}:${tick}`);
  return tick + EXCHANGE_TICK_MIN + (seed % EXCHANGE_TICK_SPAN);
}

function overlapScore(words: string[], text: string): number {
  const lower = text.toLowerCase();
  return words.reduce((score, word) => score + (lower.includes(word.toLowerCase()) ? 1 : 0), 0);
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

function evidenceLabel(text: string): string {
  return text
    .replace(/https?:\/\/\S+/gi, 'source')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

function anchorToken(text: string): string {
  return text
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/[^\p{L}\p{N}\s_-]+/gu, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2 && !/^(source|wiki|com|www|https?|the|and|for|with)$/i.test(word))
    .sort((a, b) => b.length - a.length)[0]
    ?.slice(0, 18) || 'source';
}

function referenceAnchor(ref: { label: string; url: string; anchorText?: string }, index: number, signals: string[]): string {
  const signal = signals[index % Math.max(1, signals.length)];
  if (signal && !/^(夢境|修補|工具)$/i.test(signal)) return compactAnchor(signal);
  return compactAnchor(ref.anchorText ?? anchorToken(ref.label) ?? domainOf(ref.url) ?? `source-${index + 1}`);
}

function compactAnchor(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, 18) || 'source';
}

function modeActions(mode: FinalDocumentMode, args: { question: string; attributes: string[]; tags: string[]; anchors: string[]; targets: string[] }): string[] {
  const attributePair = args.attributes.slice(0, 2).join('／') || args.tags.slice(0, 2).join('／') || '關係／資源';
  const tagOne = args.tags[0] ?? args.attributes[0] ?? '問題';
  const tagTwo = args.tags[1] ?? args.attributes[1] ?? '回應';
  const anchorOne = args.anchors[0] ?? tagOne;
  const anchorTwo = args.anchors[1] ?? tagTwo;
  const targetText = args.targets.length ? args.targets.join('、') : '兩個不同場域的人';
  const plans: Record<FinalDocumentMode, string[]> = {
    story: [
      `方向 1：把「${args.question}」改寫成一段會被別人打斷的場景。測試方式：讓 ${targetText} 各自指出一個不可信的地方，留下被打斷後仍成立的部分。`,
      `方向 2：用 ${attributePair} 做一個小型公開版本。測試方式：不要收集稱讚，只記錄誰願意補充、反對或接手。`,
      `方向 3：把 [[${anchorOne}]] 與 [[${anchorTwo}]] 當作兩個入口。測試方式：追蹤它們分別帶來的合作、拒絕與成本。`,
    ],
    poem: [
      `方向 1：不要把詩寫成漂亮答案。測試方式：先列出 ${tagOne}、${tagTwo} 之間互相牴觸的句子。`,
      `方向 2：每一段都要連到一個可驗證的人、材料或交換。測試方式：檢查 [[${anchorOne}]] 是否真的帶來行動，而不是只變成裝飾。`,
      `方向 3：保留問題裡的荒謬感。測試方式：刪掉沒有下一步行動的意象。`,
    ],
    manufacturing_technical_file: [
      `方向 1：把問題拆成輸入、輸出、失敗條件三欄。測試方式：先測 ${attributePair} 是否真的能被操作。`,
      `方向 2：用 [[${anchorOne}]] 做第一個材料入口。測試方式：記錄它產生的限制，而不是只記來源名稱。`,
      `方向 3：請 ${targetText} 測一次。測試方式：若他們無法重做或反駁，文件還不是技術文件。`,
    ],
    travel_plan: [
      `方向 1：不要先排景點。測試方式：先排三次對話，分別問 ${targetText} 這個問題在哪裡失真。`,
      `方向 2：把 [[${anchorOne}]] 當第一個節點。測試方式：每個節點都必須有邀請、交換或拒絕紀錄。`,
      `方向 3：旅程結束時只保留能改變原問題的路線。測試方式：刪掉只增加名單的停靠點。`,
    ],
    philosophical_debate: [
      `方向 1：先拆開 ${attributePair}。測試方式：確認它們沒有被同一個成功答案吞掉。`,
      `方向 2：讓 ${targetText} 分別反駁這個問題。測試方式：如果反駁都一樣，代表問題還不夠清楚。`,
      `方向 3：用 [[${anchorOne}]] 和 [[${anchorTwo}]] 檢查承諾。測試方式：標出哪些會帶來收入、信任、依賴或新的負擔。`,
    ],
  };
  return plans[mode];
}

function bestResponseDirection(pet: Thronglet, exchanges: A2AExchange[]): string {
  const question = pet.question.text;
  const intent = pet.personaJson?.intentMode ?? 'why';
  const exchangeTargets = unique(exchanges.map((exchange) => exchange.targetLabel)).slice(0, 3);
  const hypotheses = pet.knowledgeJson?.hypotheses ?? [];
  const insights = (pet.knowledgeJson?.collectedInsights ?? [])
    .filter((item) => !/^https?:/i.test(item))
    .map(evidenceLabel)
    .slice(0, 2);
  const socialProof = exchangeTargets.length
    ? `先把問題交給 ${exchangeTargets.join('、')} 等不同場域測試，而不是只向一個來源求證`
    : '先尋找至少兩個不同場域的人來測試這個問題';
  const evidence = insights.length
    ? `目前可用的回應材料是「${insights.join('」與「')}」`
    : '目前材料仍不足，所以最誠實的回應是一個可執行的下一步，而不是結論';
  const hypothesis = hypotheses[0]
    ? `暫時假設：${hypotheses[0]}`
    : `暫時假設：這個問題真正要問的不是「${question}」的捷徑，而是哪些關係、能力與資源能承受它`;
  const practicalTurn = intent === 'how_to_do' || intent === 'survive'
    ? '把回應收斂成一個七天內能試做、能失敗、能被別人檢查的小原型'
    : '把回應保持成一個可以邀請他人加入、也可以被反駁的敘事或論證';
  return `${hypothesis}。最好的回應不是把來源名稱當答案，而是：${socialProof}；${evidence}；接著${practicalTurn}。`;
}

function chooseExchangeTarget(
  snapshot: SimSnapshot,
  pet: Thronglet,
  tick: number,
  knowledgeContexts: Record<string, NpcKnowledgeContext> = {},
): SimEntity {
  const candidates = snapshot.entities.filter((entity) => entity.kind === "npc");
  const previousTargetId = (snapshot.a2aExchanges ?? []).find((exchange) => exchange.petId === pet.id)?.targetId;
  const maturation = pet.problemMaturation ?? deriveProblemMaturationProfile(pet, snapshot.a2aExchanges ?? [], tick);
  const words = unique([
    ...maturation.sourceQueries,
    ...maturation.materialSignals,
    ...maturation.mentaleseAttributes,
    ...maturation.a2aDirectives,
  ]);
  const playerDomains = extractDomains(`${pet.question.text} ${pet.knowledgeJson?.sourceText ?? ''}`);
  const ranked = candidates
    .map((entity) => {
      const knowledge = knowledgeContexts[entity.id] ?? (entity.personaId ? knowledgeContexts[entity.personaId] : undefined);
      const wikiText = knowledge?.links.map((link) => `${link.title} ${link.description}`).join(" ") ?? "";
      const baseText = `${entity.displayName} ${entity.prompt ?? ""} ${knowledge?.role ?? ""} ${knowledge?.intro ?? ""} ${wikiText}`;
      const domains = new Set((knowledge?.links ?? []).map((link) => domainOf(link.url)).filter(Boolean));
      const directSourceShortcutPenalty = playerDomains.some((domain) => domains.has(domain)) ? 60 : 0;
      const repeatPenalty = previousTargetId === entity.id && candidates.length > 1 ? 180 : 0;
      const score = overlapScore(words, baseText) * 100 + (hashText(`${pet.id}:${entity.id}:${tick}`) % 97) - directSourceShortcutPenalty - repeatPenalty;
      return { entity, score };
    })
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.entity ?? candidates[hashText(`${pet.id}:${tick}`) % Math.max(1, candidates.length)] ?? snapshot.entities[0];
}

function selectDiversePetExchanges(exchanges: A2AExchange[], petId: string): A2AExchange[] {
  const petExchanges = exchanges.filter((exchange) => exchange.petId === petId);
  const selected: A2AExchange[] = [];
  const seenTargets = new Set<string>();
  for (const exchange of petExchanges) {
    if (seenTargets.has(exchange.targetId)) continue;
    selected.push(exchange);
    seenTargets.add(exchange.targetId);
    if (selected.length >= 3) break;
  }
  for (const exchange of petExchanges) {
    if (selected.length >= 3) break;
    if (!selected.some((item) => item.id === exchange.id)) selected.push(exchange);
  }
  return selected;
}

function uniqueNutrientsByDomain(sources: A2ANutrientSource[]): A2ANutrientSource[] {
  const selected: A2ANutrientSource[] = [];
  const seenUrls = new Set<string>();
  const seenDomains = new Set<string>();
  for (const source of sources) {
    const domain = domainOf(source.url) || source.url;
    if (seenUrls.has(source.url) || seenDomains.has(domain)) continue;
    selected.push(source);
    seenUrls.add(source.url);
    seenDomains.add(domain);
    if (selected.length >= 4) break;
  }
  for (const source of sources) {
    if (selected.length >= 4) break;
    if (!seenUrls.has(source.url)) {
      selected.push(source);
      seenUrls.add(source.url);
    }
  }
  return selected;
}

function imageUrlForWikiSource(link: NpcKnowledgeLink): string | undefined {
  return `https://api.microlink.io/?url=${encodeURIComponent(link.url)}&screenshot=true&embed=screenshot.url`;
}

function nutrientSourcesForTarget(
  target: SimEntity,
  knowledgeContexts: Record<string, NpcKnowledgeContext>,
): A2ANutrientSource[] {
  const knowledge = knowledgeContexts[target.id] ?? (target.personaId ? knowledgeContexts[target.personaId] : undefined);
  const links = knowledge?.links ?? [];
  return links.slice(0, 8).map((link) => ({
    title: link.title,
    url: link.url,
    description: link.description,
    extractedText: `${link.title}: ${link.description}`,
    imageUrl: imageUrlForWikiSource(link),
  }));
}

function makeA2AExchange(
  snapshot: SimSnapshot,
  pet: Thronglet,
  tick: number,
  knowledgeContexts: Record<string, NpcKnowledgeContext> = {},
): A2AExchange {
  const target = chooseExchangeTarget(snapshot, pet, tick, knowledgeContexts);
  const seed = hashText(`${pet.id}:${target.id}:${tick}`);
  const turnCount = 18 + (seed % 33);
  const maturation = pet.problemMaturation ?? deriveProblemMaturationProfile(pet, snapshot.a2aExchanges ?? [], tick);
  const mentalese = maturation.mentaleseAttributes.length
    ? maturation.mentaleseAttributes
    : pet.personaJson?.mentaleseBias ?? ["desire", "resource", "contradiction"];
  const modes = pet.knowledgeJson?.preferredDocumentModes ?? ["story", "technical document"];
  const tags = maturation.materialSignals.length ? maturation.materialSignals : pet.knowledgeJson?.tags ?? splitTags(pet.question.text);
  const nutrientSources = nutrientSourcesForTarget(target, knowledgeContexts);
  const turns = Array.from({ length: turnCount }, (_, index) => {
    const source = nutrientSources[index % Math.max(1, nutrientSources.length)];
    const ref = source
      ? { label: source.title, url: source.url, anchorText: ["資料", "圖像", "方法", "群落", "證詞", "路徑"][(seed + index) % 6] }
      : referencePool[(seed + index) % referencePool.length];
    const attribute = mentalese[(seed + index) % mentalese.length];
    const tag = tags[(seed + index) % Math.max(1, tags.length)] ?? attribute;
    const mode = modes[(seed + index) % modes.length];
    const speakerIsPet = index % 2 === 0;
    const sourceText = source?.extractedText ?? `${ref.label} reference trace`;
    return {
      id: `${pet.id}-a2a-${tick}-${index}`,
      speakerId: speakerIsPet ? pet.id : target.id,
      targetId: speakerIsPet ? target.id : pet.id,
      text: speakerIsPet
        ? `${pet.displayName} follows its maturation brief (${maturation.stage}): ${maturation.a2aDirectives[index % maturation.a2aDirectives.length]}. It asks ${target.displayName} for evidence about ${attribute} / ${tag} from ${ref.label}, without accepting direct keyword overlap as an answer.`
        : `${target.displayName} extracts "${sourceText}" and reframes it toward ${mode}: ${maturation.rejectedShortcuts[index % maturation.rejectedShortcuts.length]}.`,
      evaluation: {
        usefulReferences: [ref.url],
        mentaleseAttributes: [attribute, tag, source?.title ?? ref.label],
        socialDelta: { affinity: 0.12, groupBond: 0.16, curiosity: 0.1, resonanceWithPrompt: 0.18 },
        contradictionSurprise: ((seed + index * 13) % 100) / 100,
        documentModeTendency: mode,
      },
    };
  });
  return {
    id: `${pet.id}-exchange-${tick}`,
    petId: pet.id,
    tick,
    targetId: target.id,
    targetLabel: target.displayName,
    turns,
    nutrientSources,
    summary: `${pet.displayName} and ${target.displayName} completed ${turnCount} A2A turns from a ${maturation.stage} maturation brief, using ${nutrientSources.length} wiki/community sources about ${mentalese.slice(0, 2).join(" / ")}.`,
  };
}

function growPetFilesFromExchange(pet: Thronglet, exchange: A2AExchange, tick: number): Thronglet {
  const previousKnowledge = pet.knowledgeJson;
  const previousPersona = pet.personaJson;
  const sourceInsights = unique([
    ...(previousKnowledge?.collectedInsights ?? []),
    ...exchange.turns.slice(0, 6).map((turn) => turn.text),
    ...(exchange.nutrientSources ?? []).map((source) => source.extractedText),
  ]).slice(0, 48);
  const hypotheses = unique([
    ...(previousKnowledge?.hypotheses ?? []),
    `${exchange.targetLabel} reframed the question through ${exchange.turns[0]?.evaluation.mentaleseAttributes.slice(0, 2).join(' / ') ?? 'unknown tension'}.`,
  ]).slice(0, 16);
  const sourceQueries = unique([
    ...(previousKnowledge?.sourceQueries ?? []),
    ...exchange.turns.flatMap((turn) => turn.evaluation.mentaleseAttributes),
  ]).slice(0, 16);
  const personaGrowth = unique([
    ...(previousPersona?.growthLog ?? []),
    `tick ${tick}: learned to ask ${exchange.targetLabel} for evidence before answering.`,
  ]).slice(0, 24);
  const tensionProfile = unique([
    ...(previousPersona?.tensionProfile ?? []),
    ...exchange.turns.flatMap((turn) => turn.evaluation.mentaleseAttributes).slice(0, 8),
  ]).slice(0, 16);
  const next: Thronglet = {
    ...pet,
    personaJson: previousPersona
      ? {
          ...previousPersona,
          revision: (previousPersona.revision ?? 1) + 1,
          growthLog: personaGrowth,
          tensionProfile,
        }
      : previousPersona,
    knowledgeJson: previousKnowledge
      ? {
          ...previousKnowledge,
          revision: (previousKnowledge.revision ?? 1) + 1,
          sourceQueries,
          hypotheses,
          collectedInsights: sourceInsights,
          maturationStage: maturityStage(pet.a2aState?.exchangeCount ?? 0, pet.a2aState?.turnCount ?? 0),
        }
      : previousKnowledge,
  };
  return {
    ...next,
    problemMaturation: deriveProblemMaturationProfile(next, [exchange], tick),
  };
}

function applyExchangeToPet(pet: Thronglet, exchange: A2AExchange, tick: number): Thronglet {
  const current = ensureA2AState(pet, tick);
  const turnCount = exchange.turns.length;
  const nextState = {
    ...pet.state,
    affinity: clampStat(pet.state.affinity + turnCount * 0.12),
    groupBond: clampStat(pet.state.groupBond + turnCount * 0.16),
    curiosity: clampStat(pet.state.curiosity + turnCount * 0.1),
    resonanceWithPrompt: clampStat(pet.state.resonanceWithPrompt + turnCount * 0.18),
    stress: clampStat(pet.state.stress - turnCount * 0.02),
  };
  const exchangeCount = current.exchangeCount + 1;
  const nextPet: Thronglet = {
    ...pet,
    state: nextState,
    memory: [
      { id: `${exchange.id}-memory`, tick, text: exchange.summary, significance: 75 },
      ...pet.memory,
    ].slice(0, 12),
    a2aState: {
      ...current,
      exchangeCount,
      turnCount: current.turnCount + turnCount,
      nextExchangeTick: nextExchangeTick(tick, pet, exchangeCount),
    },
  };
  return growPetFilesFromExchange(nextPet, exchange, tick);
}

function shouldCreateFinalDocument(pet: Thronglet, scores: SimScores, existing: FinalDocument[]): boolean {
  if (existing.some((document) => document.petId === pet.id && document.images?.length)) return false;
  const a2a = pet.a2aState;
  if (!a2a) return false;
  const enoughA2A = a2a.exchangeCount >= a2a.requiredExchanges || (a2a.exchangeCount >= 2 && a2a.turnCount >= a2a.requiredTurns);
  const metSignals = [pet.state.resonanceWithPrompt >= 42, scores.wisdom >= 5, scores.community >= 0.12].filter(Boolean).length;
  return enoughA2A && metSignals >= 2;
}

function createFinalDocument(pet: Thronglet, exchanges: A2AExchange[], tick: number): FinalDocument {
  const petExchanges = selectDiversePetExchanges(exchanges, pet.id);
  const nutrients = uniqueNutrientsByDomain(petExchanges.flatMap((exchange) => exchange.nutrientSources ?? []));
  const refs: Array<{ label: string; url: string; anchorText?: string }> = Array.from(
    new Map(
      [
        ...nutrients.map((source) => ({ label: source.title, url: source.url })),
        ...petExchanges
          .flatMap((exchange) => exchange.turns.flatMap((turn) => turn.evaluation.usefulReferences))
          .map((url) => referencePool.find((ref) => ref.url === url) ?? { label: url, url }),
      ].map((ref) => [ref.url, ref]),
    ).values(),
  ).slice(0, 6);
  const mode = chooseFinalDocumentMode(pet, petExchanges);
  const modeLabel = finalModeLabels[mode];
  const maturation = pet.problemMaturation ?? deriveProblemMaturationProfile(pet, petExchanges, tick);
  const attributeList = maturation.mentaleseAttributes.length ? maturation.mentaleseAttributes : pet.personaJson?.mentaleseBias ?? ["慾望", "資源", "矛盾"];
  const materialTags = maturation.materialSignals.length ? maturation.materialSignals : pet.knowledgeJson?.tags ?? splitTags(pet.question.text);
  const anchorSignals = unique([...materialTags, ...attributeList, ...refs.map((ref) => anchorToken(ref.label))]).filter((item) => !/^(夢境|修補|工具)$/i.test(item));
  const references = (refs.length > 0 ? refs : referencePool.slice(0, 3)).map((ref, index) => ({
    ...ref,
    anchorText: referenceAnchor(ref, index, anchorSignals),
  }));
  const responseDirection = bestResponseDirection(pet, petExchanges);
  const tags = materialTags.slice(0, 5).join("、") || "尚未命名的材料";
  const log: FinalDocumentLogEntry[] = petExchanges.flatMap((exchange) =>
    exchange.turns.map((turn) => ({
      tick: exchange.tick,
      speaker: turn.speakerId === pet.id ? pet.displayName : exchange.targetLabel,
      target: turn.targetId === pet.id ? pet.displayName : exchange.targetLabel,
      text: turn.text,
      source: "a2a" as const,
    })),
  );
  const anchor = (index: number) => `[[${references[index % references.length].anchorText}]]`;
  const evidenceTargets = unique(petExchanges.map((exchange) => exchange.targetLabel)).join("、") || "NPC";
  const sourceAnchors = nutrients.length ? nutrients.slice(0, 3).map((_, index) => anchor(index)).join("、") : `${anchor(0)}、${anchor(1)}`;
  const commonFrame = `【模式：${modeLabel}】原始問題是「${pet.question.text}」。壓縮證據：${petExchanges.length} 次交換、${pet.a2aState?.turnCount ?? 0} 回合，對象包含 ${evidenceTargets}；材料標籤是 ${tags}；參考入口是 ${sourceAnchors}。`;
  const [directionOne, directionTwo, directionThree] = modeActions(mode, {
    question: pet.question.text,
    attributes: attributeList,
    tags: materialTags,
    anchors: references.map((reference) => reference.anchorText),
    targets: unique(petExchanges.map((exchange) => exchange.targetLabel)),
  });
  const compactClosing = `暫定回應：${responseDirection}`;
  const bodyByMode: Record<FinalDocumentMode, string> = {
    story: [
      commonFrame,
      directionOne,
      directionTwo,
      compactClosing,
    ].join("\n\n"),
    poem: [
      commonFrame,
      directionOne,
      directionTwo,
      directionThree,
    ].join("\n\n"),
    manufacturing_technical_file: [
      commonFrame,
      directionOne,
      directionTwo,
      directionThree,
    ].join("\n\n"),
    travel_plan: [
      commonFrame,
      directionOne,
      directionTwo,
      directionThree,
    ].join("\n\n"),
    philosophical_debate: [
      commonFrame,
      directionOne,
      directionTwo,
      compactClosing,
    ].join("\n\n"),
  };
  return {
    id: `${pet.id}-final-${tick}`,
    petId: pet.id,
    tick,
    title: `${modeLabel}：${pet.question.text.slice(0, 28)}`,
    mode,
    modeLabel,
    body: bodyByMode[mode],
    references,
    reviewLog: log.slice(0, 6),
    sourceExchangeIds: petExchanges.map((exchange) => exchange.id),
    images: nutrients
      .filter((source): source is A2ANutrientSource & { imageUrl: string } => Boolean(source.imageUrl))
      .slice(0, 1)
      .map((source) => ({
        url: source.imageUrl,
        alt: source.title,
        sourceUrl: source.url,
        caption: `Image extracted from community/wiki source: ${source.title}`,
      })),
  };
}

function formThrongs(snapshot: SimSnapshot): {
  throngs: SimThrong[];
  events: SimEvent[];
} {
  const members = [...snapshot.entities, ...snapshot.thronglets].filter(
    (e) =>
      e.state.groupBond > 55 &&
      e.state.stress < 70 &&
      e.state.resonanceWithPrompt > 45,
  );
  if (members.length < 3)
    return {
      throngs: snapshot.throngs.filter((t) => t.stability > 1),
      events: [],
    };
  if (snapshot.throngs.length > 0)
    return {
      throngs: snapshot.throngs.map((t) => ({
        ...t,
        stability: Math.min(100, t.stability + 1),
      })),
      events: [],
    };
  const throng: SimThrong = {
    id: `throng-${snapshot.tick}`,
    memberIds: members.slice(0, 5).map((m) => m.id),
    center: { col: 32, row: 32 },
    topic: "temporary question circle",
    createdAtTick: snapshot.tick,
    stability: 60,
  };
  return {
    throngs: [throng],
    events: [
      makeEvent(
        "throng_formed",
        snapshot.tick,
        members[0].id,
        { groupBond: 2 },
        80,
        "A temporary throng formed.",
      ),
    ],
  };
}

export function tickSimulation(
  snapshot: SimSnapshot,
  contexts: Record<string, string> = {},
  knowledgeContexts: Record<string, NpcKnowledgeContext> = {},
): SimSnapshot {
  const tick = snapshot.tick + 1;
  const events: SimEvent[] = [];
  const newExchanges: A2AExchange[] = [];
  const thronglets = snapshot.thronglets.map((pet) => {
    const action = chooseAction(pet.state, `${pet.question.text}-${tick}`);
    const context = contexts[pet.id] ?? Object.values(contexts).join(" ");
    const resonance = context
      ? scorePromptResonance(pet.question.text, context)
      : pet.state.resonanceWithPrompt;
    const state = updateStateForAction(
      {
        ...pet.state,
        resonanceWithPrompt: Math.max(
          pet.state.resonanceWithPrompt * 0.96,
          resonance,
        ),
      },
      action,
    );
    const delta = deltaForAction(action, pet.state);
    if (["talk", "seekMoney", "practiceSkill", "joinThrong"].includes(action))
      events.push(
        makeEvent(
          "thronglet_interaction",
          tick,
          pet.id,
          delta,
          state.resonanceWithPrompt,
          `${pet.displayName} ${action}`,
        ),
      );
    const petWithMaturation = pet.problemMaturation
      ? pet
      : { ...pet, problemMaturation: deriveProblemMaturationProfile(pet, snapshot.a2aExchanges ?? [], tick) };
    const nextPet = {
      ...petWithMaturation,
      state,
      currentAction: action,
      a2aState: ensureA2AState(petWithMaturation, tick),
    };
    if (tick >= nextPet.a2aState.nextExchangeTick) {
      const exchange = makeA2AExchange(snapshot, nextPet, tick, knowledgeContexts);
      newExchanges.push(exchange);
      events.push(
        makeEvent(
          "thronglet_interaction",
          tick,
          nextPet.id,
          { affinity: 2, groupBond: 3, curiosity: 1, resonanceWithPrompt: 2 },
          85,
          exchange.summary,
        ),
      );
      return applyExchangeToPet(nextPet, exchange, tick);
    }
    return nextPet;
  });
  const throngResult = formThrongs({ ...snapshot, tick, thronglets });
  events.push(...throngResult.events);
  let scores: SimScores = { ...snapshot.scores };
  for (const event of events) scores = scoreEvent(scores, event);
  const a2aExchanges = [...newExchanges, ...(snapshot.a2aExchanges ?? [])].slice(0, 24);
  const finalDocuments = [...(snapshot.finalDocuments ?? [])];
  for (const pet of thronglets) {
    if (shouldCreateFinalDocument(pet, scores, finalDocuments)) {
      const document = createFinalDocument(pet, a2aExchanges, tick);
      finalDocuments.unshift(document);
      events.push(
        makeEvent(
          "state_threshold",
          tick,
          pet.id,
          { resonanceWithPrompt: 2, groupBond: 2 },
          95,
          `Final document generated: ${document.title}`,
        ),
      );
      scores = scoreEvent(scores, events[events.length - 1]);
    }
  }
  const thoughts = [...snapshot.thoughts];
  for (const pet of thronglets) {
    const event =
      events.find((item) => item.actorId === pet.id) ?? throngResult.events[0];
    if (shouldTriggerThought(pet.state, event))
      thoughts.unshift(
        deterministicThought(pet.state, pet.question.text, event),
      );
  }
  return {
    ...snapshot,
    tick,
    thronglets,
    events: [...events, ...snapshot.events].slice(0, 30),
    scores,
    throngs: throngResult.throngs,
    thoughts: Array.from(new Set(thoughts)).slice(0, 8),
    a2aExchanges,
    finalDocuments: finalDocuments.slice(0, 8),
  };
}

export function applyPlayerThrongletResponse(
  snapshot: SimSnapshot,
  petId: string,
  response: string,
): SimSnapshot {
  const tick = snapshot.tick;
  const event = makeEvent(
    "player_thronglet_response",
    tick,
    "player-0",
    { affinity: 4, openness: 3, stress: -1, groupBond: 4 },
    75,
    response,
  );
  const thronglets = snapshot.thronglets.map((pet) =>
    pet.id === petId
      ? {
          ...pet,
          state: updateStateForAction(
            {
              ...pet.state,
              affinity: pet.state.affinity + 4,
              groupBond: pet.state.groupBond + 4,
            },
            "listen",
          ),
        }
      : pet,
  );
  return {
    ...snapshot,
    thronglets,
    finalDocuments: (snapshot.finalDocuments ?? []).map((document) =>
      document.petId === petId
        ? {
            ...document,
            reviewLog: [
              { tick, speaker: "player", target: petId, text: response, source: "player" as const },
              ...(document.reviewLog ?? []),
            ].slice(0, 180),
          }
        : document,
    ),
    events: [event, ...snapshot.events].slice(0, 30),
    scores: scoreEvent(snapshot.scores, event),
    thoughts: [
      deterministicThought(
        thronglets.find((p) => p.id === petId)?.state ?? throngletDefaultState,
        thronglets.find((p) => p.id === petId)?.question.text ?? "",
        event,
      ),
      ...snapshot.thoughts,
    ].slice(0, 8),
  };
}

export function applyPlayerNpcDialogue(
  snapshot: SimSnapshot,
  npcId: string,
  prompt: string,
  resonance: number,
): SimSnapshot {
  const event = makeEvent(
    "player_npc_dialogue",
    snapshot.tick,
    "player-0",
    { curiosity: 1, skills: resonance > 45 ? 1 : 0 },
    resonance,
    prompt,
  );
  event.targetId = npcId;
  return {
    ...snapshot,
    events: [event, ...snapshot.events].slice(0, 30),
    scores: scoreEvent(snapshot.scores, event),
  };
}
