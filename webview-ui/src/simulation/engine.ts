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
    nomadic_research: ["country", "active space", "field note", "uMap"],
    manufacturing_technical_file: ["material", "method", "prototype", "constraint"],
    travel_plan: ["route", "exchange", "invitation", "place"],
    poem: ["desire", "material", "metaphor", "borrowed structure"],
    find_people: ["affinity", "trust", "exchange", "invitation"],
    survive: ["care", "resource", "shelter", "risk"],
    how_to_do: ["material", "method", "prototype", "constraint"],
    why: ["desire", "freedom", "pressure", "contradiction"],
  };
  return {
    role: context.petRole ?? "question pet",
    intentMode,
    mentaleseBias: mentaleseByIntent[intentMode] ?? mentaleseByIntent.why,
    voice: intentMode === "how_to_do" || intentMode === "manufacturing_technical_file" || intentMode === "nomadic_research" ? "practical indexed muse" : "poetic indexed muse",
    constraints: splitTags(context.personalArchive ?? "").slice(0, 6),
    revision: 1,
    growthLog: [],
    tensionProfile: [],
  };
}

function createPetKnowledgeJson(context: ThrongletCreationContext): PetKnowledgeJson {
  const tags = splitTags(`${context.skills ?? ""} ${context.personalArchive ?? ""}`);
  const modeByIntent: Record<string, string[]> = {
    nomadic_research: ["nomadic_research"],
    manufacturing_technical_file: ["manufacturing_technical_file"],
    travel_plan: ["travel_plan"],
    poem: ["poem"],
    find_people: ["travel_plan", "story", "philosophical_debate"],
    survive: ["manufacturing_technical_file", "travel_plan", "story"],
    how_to_do: ["nomadic_research", "travel_plan", "philosophical_debate"],
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
    pet.personaJson?.intentMode === 'how_to_do' || pet.personaJson?.intentMode === 'manufacturing_technical_file'
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

const EXCHANGE_TICK_MIN = 667;
const EXCHANGE_TICK_SPAN = 120;

const referencePool = [
  { label: "Lifepatch", url: "https://lifepatch.org", anchorText: "Lifepatch" },
  { label: "Fabricademy", url: "https://fabricademy.org", anchorText: "Fabricademy" },
  { label: "Fablab Taipei", url: "https://www.fablabtaipei.tw", anchorText: "Fablab Taipei" },
  { label: "Green FabLab", url: "https://greenfablab.org", anchorText: "Green FabLab" },
  { label: "Non-Governmental Matters", url: "https://www.nonmatter.tw", anchorText: "NGM" },
];

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

function compactAnchor(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, 18) || 'source';
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

function imageUrlForWikiSource(link: NpcKnowledgeLink): string | undefined {
  return `https://api.microlink.io/?url=${encodeURIComponent(link.url)}&screenshot=true&embed=screenshot.url`;
}

function nutrientSourcesForTarget(
  target: SimEntity,
  knowledgeContexts: Record<string, NpcKnowledgeContext>,
): A2ANutrientSource[] {
  const knowledge = knowledgeContexts[target.id] ?? (target.personaId ? knowledgeContexts[target.personaId] : undefined);
  const links = knowledge?.links ?? [];
  return links.filter((link) => !/hackteria/i.test(`${link.title} ${link.url} ${link.description}`)).slice(0, 6).map((link) => ({
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
  const turnCount = 2;
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
    const petText = `${pet.displayName}: 我想先問一個很小的問題：${compactAnchor(tag)} 在日常裡會被誰照顧？如果要把它做成可分享的東西，我會先找一個可修補的版本。`;
    const npcText = `${target.displayName}: 我會從現場關係看，不先給答案。${sourceText ? `${compactAnchor(sourceText)} 提醒我：` : ''}材料、責任和維護要一起設計，才不會只剩漂亮的概念。`;
    return {
      id: `${pet.id}-a2a-${tick}-${index}`,
      speakerId: speakerIsPet ? pet.id : target.id,
      targetId: speakerIsPet ? target.id : pet.id,
      text: speakerIsPet ? petText.slice(0, 200) : npcText.slice(0, 200),
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
      summary: `${pet.displayName} 和 ${target.displayName} 討論如何把問題縮小成可照顧、可修補、可共同測試的下一步。${turns.slice(0, 2).map((turn) => turn.text).join(" ")}`.slice(0, 420),
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
    `tick ${tick}: learned from ${exchange.targetLabel} to ask one grounded care-and-maintenance question before answering.`,
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
    finalDocuments: [],
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
    finalDocuments: [],
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
