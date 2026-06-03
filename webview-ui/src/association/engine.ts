import { evidenceHygienePenalty, evidenceTextForHygiene, isThinOrEmptyEvidence } from "./evidenceHygiene.js";

export interface SourceCard {
  id: string;
  title: string;
  excerpt: string;
  keywords?: string[];
  categories?: string[];
  tags?: string[];
  outgoingLinks?: string[];
  attachments?: string[];
  footnotes?: string[];
  references?: string[];
  semanticLayer?: string;
  semanticTopics?: Array<{ layer?: string; score?: number; topic: string }>;
  sourceCategories?: string[];
  source?: string;
  url?: string;
  path?: string;
}

export interface CategoryGraphEdge {
  relation: string;
  source: string;
  target: string;
  weight?: number;
}

export interface AssociationCorpus {
  cards: SourceCard[];
  edges: CategoryGraphEdge[];
  manifest: {
    schemaVersion?: string;
    generatedAt?: string;
    counts?: {
      sourceCards?: number;
      graphEdges?: number;
    };
  };
}

export interface AssociationFuture {
  title: string;
  scenario: string;
  confidence: "low" | "medium" | "high";
  caveat?: string;
  citations: Array<Pick<SourceCard, "id" | "title" | "url">>;
}

export interface LinkedEvidenceTrail {
  card: SourceCard;
  depth: number;
  via: Array<Pick<SourceCard, "id" | "title" | "url">>;
  relation: "outgoing_link" | "graph_neighbor" | "secondary_seed";
}

export interface EvidenceDepthMetrics {
  directMatches: number;
  graphExpansions: number;
  linkedExpansions: number;
  meaningfulLinkedExpansions: number;
  thinLinkedExpansions: number;
  deepReadExpansions: number;
  cardsWithThinExtracts: number;
  averageExcerptChars: number;
  sourceDiversity: number;
  depthScore: number;
  warnings: string[];
}

export interface AssociationReport {
  seed: string;
  question: string;
  keywords: string[];
  matchedCards: SourceCard[];
  expandedCards: SourceCard[];
  linkedCards: LinkedEvidenceTrail[];
  deepReadCards: SourceCard[];
  deepReadKeywords: string[];
  depthMetrics: EvidenceDepthMetrics;
  futures: AssociationFuture[];
  corpusSummary: string;
}

interface RankedCard {
  card: SourceCard;
  score: number;
}

const STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "also",
  "and",
  "are",
  "because",
  "been",
  "being",
  "can",
  "could",
  "for",
  "from",
  "have",
  "into",
  "its",
  "in",
  "of",
  "on",
  "or",
  "not",
  "our",
  "research",
  "source",
  "that",
  "the",
  "to",
  "at",
  "their",
  "this",
  "through",
  "with",
  "would",
  "一個",
  "什麼",
  "可以",
  "如何",
  "我們",
  "這個",
]);

const GENERIC_TERMS = new Set([
  "art",
  "project",
  "workshop",
  "bio",
  "audio",
  "music",
  "design",
  "community",
  "research",
  "essay",
  "image",
  "visual",
  "biology",
]);

const CHINESE_KEYWORD_ALIASES: Array<[RegExp, string[]]> = [
  [/感測器|傳感器|感應器/u, ["sensor", "sensors", "electronics"]],
  [/濕實驗室|實驗室|生物實驗/u, ["wetlab", "lab", "bio"]],
  [/社群|社區|共同體/u, ["community", "community", "commons", "collective"]],
  [/水質|水/u, ["water", "environment"]],
  [/電子音樂|聲音|聽見|聲響|音樂/u, ["sound", "sound", "sound", "audio", "music", "electronic"]],
  [/理論|論述|研究/u, ["theory", "research", "essay"]],
  [/視覺|影像|圖像/u, ["visual", "image", "art"]],
  [/裝置|裝置藝術/u, ["installation", "device"]],
  [/廢棄|回收|再利用/u, ["recycling", "reuse", "diy"]],
  [/筆記|紀錄|田野/u, ["notes", "documentation", "fieldwork"]],
  [/生物藝術/u, ["bioart", "bio", "biology", "art", "hackteria"]],
  [/藝術|專案|創作/u, ["art", "project"]],
  [/基因|轉殖|改造|合成生物|生物科技/u, ["gene", "genetic", "synthetic", "biology", "bio"]],
  [/技術|實驗|實驗性|原型/u, ["experiment", "experimental", "lab", "protocol", "tool", "biohack", "wetlab"]],
  [/穿戴|衣服|服裝|紡織|布料|織物/u, ["wearable", "textile", "textiles", "fabric", "clothing"]],
  [/廚房|厨房|料理|食物|餐|發酵|紅茶菌|康普茶/u, ["kitchen", "kitchen", "kitchenlab", "mobilekitchenlab", "food", "cuisine", "hosting", "fermentation", "kombucha", "nata", "coco", "tofu", "wetlab", "biohack", "hackteria"]],
  [/公共|基礎設施|基盤|共同|共用/u, ["public", "infrastructure", "commons", "commons", "shared", "open", "documentation", "maintenance", "community"]],
  [/照護|照料|維護|維修|保養/u, ["care", "care", "maintenance", "repair", "documentation", "reuse", "stewardship", "protocol"]],
  [/工作坊/u, ["workshop", "workshop", "pedagogy", "participants"]],
];

export function parseSeedKeywords(seed: string, limit = 18): string[] {
  const normalized = seed
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[\u0000-\u001f]/g, " ");
  const tokens = normalized.match(/[\p{L}\p{N}][\p{L}\p{N}-]{1,}/gu) ?? [];
  const counts = new Map<string, number>();

  for (const token of tokens) {
    const cleaned = token.replace(/^-+|-+$/g, "");
    if (cleaned.length < 2 || STOP_WORDS.has(cleaned)) continue;

    if (/\p{Script=Han}/u.test(cleaned)) {
      const aliases = CHINESE_KEYWORD_ALIASES.flatMap(([pattern, values]) =>
        pattern.test(cleaned) ? values : [],
      );
      if (aliases.length > 0) {
        for (const alias of aliases) addKeyword(counts, alias);
        if (/感測器|傳感器|感應器/u.test(cleaned)) addKeyword(counts, "sensor");
        continue;
      }
    }

    addKeyword(counts, cleaned);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([keyword]) => keyword);
}

function addKeyword(counts: Map<string, number>, keyword: string): void {
  if (keyword.length < 2 || STOP_WORDS.has(keyword)) return;
  counts.set(keyword, (counts.get(keyword) ?? 0) + 1);
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’']/g, "")
    .match(/[\p{L}\p{N}][\p{L}\p{N}-]{1,}/gu) ?? [];
}

export function generateAssociationReport(seed: string, corpus: AssociationCorpus): AssociationReport {
  const keywords = parseSeedKeywords(seed);
  const matchedCards = rankCards(corpus.cards, keywords).slice(0, 8).map((item) => item.card);
  const expandedCards = expandViaGraph(matchedCards, corpus).slice(0, 8);
  const linkedCards = expandViaLinkedSources(matchedCards, corpus, { maxDepth: 2, maxPerCard: 8 });
  const reseedLinkedCards = collectThinPageSecondarySeedExpansions(matchedCards, linkedCards, corpus, {
    maxPerCard: 4,
    maxTotal: 16,
  });
  const linkedEvidenceCards = dedupeLinkedEvidenceTrails([...linkedCards, ...reseedLinkedCards]);
  const firstPassEvidence = dedupeCards([
    ...matchedCards,
    ...linkedEvidenceCards.map((trail) => trail.card),
    ...expandedCards,
  ]);
  const deepReadCards = collectNextLayerText(firstPassEvidence, corpus, { maxPerCard: 6, maxTotal: 12 });
  const deepReadKeywords = extractDeepReadKeywords(deepReadCards, 14);
  const evidenceCards = dedupeCards([
    ...firstPassEvidence,
    ...deepReadCards,
  ]).slice(0, 32);
  const depthMetrics = buildDepthMetrics(matchedCards, expandedCards, linkedEvidenceCards, deepReadCards, evidenceCards);
  const citationCards = dedupeCards([...matchedCards, ...expandedCards]);
  const futures = buildFutures(seed, keywords, citationCards.length ? citationCards : evidenceCards, depthMetrics);

  return {
    seed,
    question: "這個東西的未來可以變成什麼？",
    keywords,
    matchedCards,
    expandedCards,
    linkedCards: linkedEvidenceCards,
    deepReadCards,
    deepReadKeywords,
    depthMetrics,
    futures,
    corpusSummary: `${corpus.manifest.schemaVersion ?? "unknown schema"}; ${corpus.manifest.counts?.sourceCards ?? corpus.cards.length} source cards; ${corpus.manifest.counts?.graphEdges ?? corpus.edges.length} graph edges`,
  };
}

function rankCards(cards: SourceCard[], keywords: string[]): RankedCard[] {
  if (keywords.length === 0) return [];

  return cards
    .filter((card) => hasKeywordEvidence(card, keywords))
    .map((card) => ({ card, score: scoreCard(card, keywords) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.card.title.localeCompare(b.card.title));
}

function hasKeywordEvidence(card: SourceCard, keywords: string[]): boolean {
  const keywordSet = new Set((card.keywords ?? []).map((keyword) => keyword.toLowerCase()));
  const tagSet = new Set((card.tags ?? []).map((tag) => tag.toLowerCase()));
  const title = card.title.toLowerCase();
  const excerpt = card.excerpt.toLowerCase();
  const categories = (card.categories ?? []).join(" ").toLowerCase();
  if (sourceIntentBoost(card, keywords) > 0) return true;
  return keywords.some((keyword) => (
    keywordSet.has(keyword) ||
    tagSet.has(keyword) ||
    title.includes(keyword) ||
    categories.includes(keyword) ||
    excerpt.includes(keyword)
  ));
}

function scoreCard(card: SourceCard, keywords: string[]): number {
  const keywordSet = new Set((card.keywords ?? []).map((keyword) => keyword.toLowerCase()));
  const tagSet = new Set((card.tags ?? []).map((tag) => tag.toLowerCase()));
  const title = card.title.toLowerCase();
  const excerpt = card.excerpt.toLowerCase();
  const categories = (card.categories ?? []).join(" ").toLowerCase();
  let score = 0;

  for (const keyword of keywords) {
    const weight = keywordWeight(keyword);
    if (keywordSet.has(keyword)) score += 8 * weight;
    if (tagSet.has(keyword)) score += 7 * weight;
    if (title.includes(keyword)) score += 6 * weight;
    if (categories.includes(keyword)) score += 4 * weight;
    if (excerpt.includes(keyword)) score += 2 * weight;
  }

  return score + sourceIntentBoost(card, keywords) + initialEvidenceQuality(card);
}

function sourceIntentBoost(card: SourceCard, keywords: string[]): number {
  const source = String(card.source ?? "").toLowerCase();
  const keywordSet = new Set(keywords.map((keyword) => keyword.toLowerCase()));
  const wantsHackteria = keywordSet.has("hackteria") || keywordSet.has("biohack") || keywordSet.has("wetlab") || keywordSet.has("kitchen") || keywordSet.has("kitchenlab") || keywordSet.has("mobilekitchenlab") || keywordSet.has("fermentation") || keywordSet.has("food") || keywordSet.has("cuisine") || keywordSet.has("kombucha") || keywordSet.has("nata") || keywordSet.has("coco") || keywordSet.has("tofu");
  const wantsTextiles = keywordSet.has("textile") || keywordSet.has("textiles") || keywordSet.has("wearable") || keywordSet.has("fabric") || keywordSet.has("sensor") || keywordSet.has("sensors");
  if (wantsHackteria && source === "hackteria") return 42;
  if (wantsHackteria && source === "htgwyw" && !wantsTextiles) return -8;
  return 0;
}

function initialEvidenceQuality(card: SourceCard): number {
  const excerpt = card.excerpt ?? "";
  const hygienePenalty = evidenceHygienePenalty(evidenceTextForHygiene(card));
  if (hygienePenalty < 0) return Math.min(-10, hygienePenalty);
  if (isThinOrEmptyEvidence(excerpt)) return -10;
  return Math.min(10, Math.floor(excerpt.replace(/\s+/g, " ").trim().length / 90));
}

function keywordWeight(keyword: string): number {
  return GENERIC_TERMS.has(keyword.toLowerCase()) ? 0.35 : 1;
}

function expandViaGraph(seedCards: SourceCard[], corpus: AssociationCorpus): SourceCard[] {
  if (seedCards.length === 0) return [];

  const seedIds = new Set(seedCards.map((card) => card.id));
  const cardById = new Map(corpus.cards.map((card) => [card.id, card]));
  const related = new Map<string, number>();

  for (const edge of corpus.edges) {
    const boost = edge.relation === "tagged" ? 3 : 2;
    const weight = boost * (edge.weight ?? 1);
    if (seedIds.has(edge.source) && !seedIds.has(edge.target)) {
      related.set(edge.target, (related.get(edge.target) ?? 0) + weight);
    }
    if (seedIds.has(edge.target) && !seedIds.has(edge.source)) {
      related.set(edge.source, (related.get(edge.source) ?? 0) + weight);
    }
  }

  return [...related.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([id]) => cardById.get(id))
    .filter((card): card is SourceCard => Boolean(card));
}

interface LinkExpansionOptions {
  maxDepth: number;
  maxPerCard: number;
}

function expandViaLinkedSources(
  seedCards: SourceCard[],
  corpus: AssociationCorpus,
  options: LinkExpansionOptions,
): LinkedEvidenceTrail[] {
  if (seedCards.length === 0) return [];

  const cardById = new Map(corpus.cards.map((card) => [card.id, card]));
  const cardByPath = new Map<string, SourceCard>();
  const cardByTitle = new Map<string, SourceCard>();

  for (const card of corpus.cards) {
    if (card.path) cardByPath.set(normalizeLinkKey(card.path), card);
    cardByTitle.set(normalizeLinkKey(card.title), card);
    if (card.url) cardByPath.set(normalizeLinkKey(card.url), card);
  }

  const trails: LinkedEvidenceTrail[] = [];
  const visited = new Set(seedCards.map((card) => card.id));
  let frontier = seedCards.map((card) => ({ card, via: [citationFor(card)] }));

  for (let depth = 1; depth <= options.maxDepth; depth += 1) {
    const nextFrontier: Array<{ card: SourceCard; via: Array<Pick<SourceCard, "id" | "title" | "url">> }> = [];

    for (const item of frontier) {
      const linked = dedupeCards([
        ...resolveOutgoingLinks(item.card, cardById, cardByPath, cardByTitle),
        ...resolveOutgoingEdgeTargets(item.card, corpus),
      ])
        .filter((card) => !visited.has(card.id))
        .sort((a, b) => textThicknessScore(b) - textThicknessScore(a) || a.title.localeCompare(b.title))
        .slice(0, options.maxPerCard);

      for (const card of linked) {
        visited.add(card.id);
        const via = [...item.via, citationFor(card)];
        trails.push({ card, depth, via, relation: "outgoing_link" });
        nextFrontier.push({ card, via });
      }
    }

    frontier = nextFrontier;
    if (frontier.length === 0) break;
  }

  return trails;
}

function collectThinPageSecondarySeedExpansions(
  matchedCards: SourceCard[],
  linkedCards: LinkedEvidenceTrail[],
  corpus: AssociationCorpus,
  options: { maxPerCard: number; maxTotal: number },
): LinkedEvidenceTrail[] {
  const alreadyLinkedFrom = new Set(linkedCards.flatMap((trail) => trail.via.map((item) => item.id)));
  const usedTargets = new Set([
    ...matchedCards.map((card) => card.id),
    ...linkedCards.map((trail) => trail.card.id),
  ]);
  const trails: LinkedEvidenceTrail[] = [];

  for (const card of matchedCards) {
    if (!isThinExtract(card)) continue;
    if (alreadyLinkedFrom.has(card.id)) continue;
    if (resolveOutgoingEdgeTargets(card, corpus).some(isMeaningfulLinkedEvidence)) continue;

    const secondaryKeywords = secondarySeedKeywordsFor(card);
    if (secondaryKeywords.length === 0) continue;

    const candidates = rankCards(corpus.cards, secondaryKeywords)
      .map((item) => item.card)
      .filter((candidate) => candidate.id !== card.id && !usedTargets.has(candidate.id))
      .filter((candidate) => !isBoilerplateThinMatch(candidate))
      .slice(0, options.maxPerCard);

    for (const candidate of candidates) {
      usedTargets.add(candidate.id);
      trails.push({
        card: candidate,
        depth: 1,
        via: [citationFor(card), citationFor(candidate)],
        relation: "secondary_seed",
      });
      if (trails.length >= options.maxTotal) return trails;
    }
  }

  return trails;
}

function secondarySeedKeywordsFor(card: SourceCard): string[] {
  const semanticTerms = (card.semanticTopics ?? []).map((topic) => topic.topic);
  const sourceTerms = (card.sourceCategories ?? []).map((category) => category.replace(/[-_/]/g, " "));
  const raw = [
    card.title,
    ...(card.keywords ?? []),
    ...(card.tags ?? []),
    ...(card.categories ?? []),
    ...semanticTerms,
    ...sourceTerms,
    stripBoilerplate(card.excerpt),
  ].join(" ");

  const counts = new Map<string, number>();
  for (const token of tokenize(raw)) {
    if (SECONDARY_SEED_STOP_WORDS.has(token)) continue;
    addKeyword(counts, token);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 16)
    .map(([keyword]) => keyword);
}

const SECONDARY_SEED_STOP_WORDS = new Set([
  "source",
  "sources",
  "excerpt",
  "content",
  "plaintext",
  "returned",
  "redirect",
  "empty",
  "mostly",
  "media",
  "table",
  "markup",
  "imported",
  "relationship",
  "layer",
  "mediawiki",
  "api",
  "found",
  "links",
  "internal",
  "categories",
  "hackteria",
  "htgwyw",
]);

function stripBoilerplate(input: string): string {
  return input
    .replace(/\bSource:\s*https?:\/\/\S+/gi, " ")
    .replace(/\(No plaintext extract returned[^)]*\)/gi, " ")
    .replace(/Hackteria relationship layer Imported:[^.。]*/gi, " ")
    .replace(/No internal links\/categories found from MediaWiki API\.?/gi, " ")
    .replace(/Original wiki links/gi, " ")
    .replace(/\[\[Sources\/[^\]]+\]\]/gi, " ");
}

function isBoilerplateThinMatch(card: SourceCard): boolean {
  const excerpt = card.excerpt ?? "";
  return isThinExtract(card) && /No plaintext extract returned|No internal links\/categories found|relationship layer Imported/i.test(excerpt);
}

function dedupeLinkedEvidenceTrails(trails: LinkedEvidenceTrail[]): LinkedEvidenceTrail[] {
  const seen = new Set<string>();
  const result: LinkedEvidenceTrail[] = [];
  for (const trail of trails) {
    if (seen.has(trail.card.id)) continue;
    seen.add(trail.card.id);
    result.push(trail);
  }
  return result;
}

function resolveOutgoingEdgeTargets(card: SourceCard, corpus: AssociationCorpus): SourceCard[] {
  const cardById = new Map(corpus.cards.map((candidate) => [candidate.id, candidate]));
  return dedupeCards(corpus.edges
    .filter((edge) => edge.source === card.id && edge.relation === "outgoing_link")
    .map((edge) => cardById.get(edge.target))
    .filter((candidate): candidate is SourceCard => Boolean(candidate)));
}

function resolveOutgoingLinks(
  card: SourceCard,
  cardById: Map<string, SourceCard>,
  cardByPath: Map<string, SourceCard>,
  cardByTitle: Map<string, SourceCard>,
): SourceCard[] {
  const links = [
    ...(card.outgoingLinks ?? []),
    ...(card.attachments ?? []),
    ...(card.footnotes ?? []),
    ...(card.references ?? []),
  ];

  return dedupeCards(links.flatMap((link) => {
    const candidates = [
      cardById.get(link),
      cardByPath.get(normalizeLinkKey(link)),
      cardByTitle.get(normalizeLinkKey(link)),
      cardByTitle.get(normalizeLinkKey(link.replace(/^.*\//, ""))),
      cardByTitle.get(normalizeLinkKey(link.replace(/^.*\//, "").replace(/\s*\[[^\]]+\]$/, ""))),
    ];
    return candidates.filter((candidate): candidate is SourceCard => Boolean(candidate));
  }));
}

function normalizeLinkKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\.(md|html?)$/u, "")
    .replace(/\s*\[[^\]]+\]$/u, "")
    .replace(/^sources\//u, "")
    .replace(/[?&#].*$/u, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

interface NextLayerTextOptions {
  maxPerCard: number;
  maxTotal: number;
}

function collectNextLayerText(
  evidenceCards: SourceCard[],
  corpus: AssociationCorpus,
  options: NextLayerTextOptions,
): SourceCard[] {
  if (evidenceCards.length === 0) return [];

  const evidenceIds = new Set(evidenceCards.map((card) => card.id));
  const cardById = new Map(corpus.cards.map((card) => [card.id, card]));
  const cardByPath = new Map<string, SourceCard>();
  const cardByTitle = new Map<string, SourceCard>();
  for (const card of corpus.cards) {
    if (card.path) cardByPath.set(normalizeLinkKey(card.path), card);
    if (card.url) cardByPath.set(normalizeLinkKey(card.url), card);
    cardByTitle.set(normalizeLinkKey(card.title), card);
  }

  const linkedCandidates = new Map<string, { card: SourceCard; score: number }>();
  for (const card of evidenceCards) {
    const linked = dedupeCards([
      ...resolveOutgoingLinks(card, cardById, cardByPath, cardByTitle),
      ...resolveOutgoingEdgeTargets(card, corpus),
    ])
      .filter((candidate) => !evidenceIds.has(candidate.id))
      .sort((a, b) => textThicknessScore(b) - textThicknessScore(a) || a.title.localeCompare(b.title))
      .slice(0, options.maxPerCard);
    for (const candidate of linked) {
      const current = linkedCandidates.get(candidate.id);
      const score = 18 + textThicknessScore(candidate);
      if (!current || score > current.score) linkedCandidates.set(candidate.id, { card: candidate, score });
    }
  }

  const directEdgeTargets = collectDirectEdgeTargets(evidenceCards, corpus, evidenceIds, options.maxPerCard);
  for (const item of directEdgeTargets) {
    const current = linkedCandidates.get(item.card.id);
    const score = item.score + textThicknessScore(item.card);
    if (!current || score > current.score) linkedCandidates.set(item.card.id, { card: item.card, score });
  }

  const graphCandidates = collectGraphNeighborText(evidenceCards, corpus, evidenceIds, options.maxPerCard);
  for (const item of graphCandidates) {
    const current = linkedCandidates.get(item.card.id);
    const score = item.score + textThicknessScore(item.card);
    if (!current || score > current.score) linkedCandidates.set(item.card.id, { card: item.card, score });
  }

  return [...linkedCandidates.values()]
    .sort((a, b) => b.score - a.score || a.card.title.localeCompare(b.card.title))
    .slice(0, options.maxTotal)
    .map((item) => item.card);
}

function collectDirectEdgeTargets(
  evidenceCards: SourceCard[],
  corpus: AssociationCorpus,
  evidenceIds: Set<string>,
  maxPerCard: number,
): Array<{ card: SourceCard; score: number }> {
  const cardById = new Map(corpus.cards.map((card) => [card.id, card]));
  const evidenceIdSet = new Set(evidenceCards.map((card) => card.id));
  const relationWeight: Record<string, number> = {
    has_attachment: 18,
    cites_reference: 16,
    has_footnote: 14,
    outgoing_link: 10,
  };
  const related = new Map<string, number>();

  for (const edge of corpus.edges) {
    if (!evidenceIdSet.has(edge.source) || evidenceIds.has(edge.target)) continue;
    const target = cardById.get(edge.target);
    if (!target) continue;
    const boost = relationWeight[edge.relation] ?? 4;
    related.set(edge.target, (related.get(edge.target) ?? 0) + boost * (edge.weight ?? 1));
  }

  return [...related.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, evidenceCards.length * maxPerCard)
    .map(([id, score]) => ({ card: cardById.get(id), score }))
    .filter((item): item is { card: SourceCard; score: number } => Boolean(item.card));
}

function collectGraphNeighborText(
  evidenceCards: SourceCard[],
  corpus: AssociationCorpus,
  evidenceIds: Set<string>,
  maxPerCard: number,
): Array<{ card: SourceCard; score: number }> {
  const cardById = new Map(corpus.cards.map((card) => [card.id, card]));
  const evidenceIdSet = new Set(evidenceCards.map((card) => card.id));
  const sharedTargets = new Map<string, number>();

  for (const edge of corpus.edges) {
    if (!evidenceIdSet.has(edge.source)) continue;
    sharedTargets.set(edge.target, (sharedTargets.get(edge.target) ?? 0) + (edge.weight ?? 1));
  }

  const related = new Map<string, number>();
  for (const edge of corpus.edges) {
    const targetWeight = sharedTargets.get(edge.target);
    if (!targetWeight || evidenceIds.has(edge.source)) continue;
    related.set(edge.source, (related.get(edge.source) ?? 0) + targetWeight * (edge.weight ?? 1));
  }

  return [...related.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, evidenceCards.length * maxPerCard)
    .map(([id, score]) => ({ card: cardById.get(id), score }))
    .filter((item): item is { card: SourceCard; score: number } => Boolean(item.card));
}

function textThicknessScore(card: SourceCard): number {
  const excerptLength = card.excerpt?.length ?? 0;
  const linkCount = (card.outgoingLinks?.length ?? 0) +
    (card.attachments?.length ?? 0) +
    (card.footnotes?.length ?? 0) +
    (card.references?.length ?? 0);
  const semanticCount = (card.semanticTopics?.length ?? 0) + (card.sourceCategories?.length ?? 0);
  return Math.min(18, Math.floor(excerptLength / 120)) + linkCount * 2 + semanticCount;
}

function extractDeepReadKeywords(cards: SourceCard[], limit: number): string[] {
  const counts = new Map<string, number>();
  for (const card of cards) {
    for (const keyword of card.keywords ?? []) addKeyword(counts, keyword.toLowerCase());
    for (const tag of card.tags ?? []) addKeyword(counts, tag.toLowerCase());
    for (const token of tokenize(`${card.title} ${card.excerpt}`).slice(0, 80)) addKeyword(counts, token);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([keyword]) => keyword);
}

function buildDepthMetrics(
  matchedCards: SourceCard[],
  expandedCards: SourceCard[],
  linkedCards: LinkedEvidenceTrail[],
  deepReadCards: SourceCard[],
  evidenceCards: SourceCard[],
): EvidenceDepthMetrics {
  const averageExcerptChars = evidenceCards.length > 0
    ? Math.round(evidenceCards.reduce((sum, card) => sum + (card.excerpt?.length ?? 0), 0) / evidenceCards.length)
    : 0;
  const cardsWithThinExtracts = evidenceCards.filter((card) => isThinExtract(card)).length;
  const sourceDiversity = new Set(evidenceCards.map((card) => card.source ?? "unknown")).size;
  const meaningfulLinkedExpansions = linkedCards.filter((trail) => isMeaningfulLinkedEvidence(trail.card)).length;
  const thinLinkedExpansions = linkedCards.length - meaningfulLinkedExpansions;
  const rawDepthScore = Math.min(100,
    matchedCards.length * 5 +
    expandedCards.length * 3 +
    meaningfulLinkedExpansions * 6 +
    Math.min(18, thinLinkedExpansions) +
    deepReadCards.length * 3 +
    sourceDiversity * 8 +
    Math.min(24, Math.floor(averageExcerptChars / 80)) -
    cardsWithThinExtracts * 2,
  );
  let depthScore = rawDepthScore;
  const warnings: string[] = [];

  // Publication depth is not just “many cards matched”. If no real outgoing
  // wiki/source links were traversed, the system only has retrieval + graph
  // neighborhood evidence. That may be useful for critique, but it must not be
  // reported as a polished-publication depth score.
  if (linkedCards.length === 0 && matchedCards.length > 0) depthScore = Math.min(depthScore, 44);
  if (meaningfulLinkedExpansions < 3 && matchedCards.length > 0) depthScore = Math.min(depthScore, 54);
  if (deepReadCards.length === 0 && matchedCards.length > 0) depthScore = Math.min(depthScore, 44);
  if (sourceDiversity < 2 && evidenceCards.length > 0) depthScore = Math.min(depthScore, 55);
  if (cardsWithThinExtracts > evidenceCards.length / 2) depthScore = Math.min(depthScore, 50);

  if (linkedCards.length === 0 && matchedCards.length > 0) {
    warnings.push("No outgoing wiki/source links were traversed; output should stay at source-card depth.");
  }
  if (meaningfulLinkedExpansions < 3 && matchedCards.length > 0) {
    warnings.push("Too few meaningful linked-source traversals; require real wiki/source links with readable extracts before polished publication.");
  }
  if (deepReadCards.length === 0 && matchedCards.length > 0) {
    warnings.push("No second-layer text was collected; require attachment/footnote/reference ingestion before polished publication.");
  }
  if (cardsWithThinExtracts > evidenceCards.length / 2) {
    warnings.push("Most evidence cards have thin or missing plaintext extracts; require deeper page/PDF ingestion before publication.");
  }
  if (depthScore < 45) {
    warnings.push("Depth score below publication threshold; generate critique/questions, not a polished final artefact.");
  }

  return {
    directMatches: matchedCards.length,
    graphExpansions: expandedCards.length,
    linkedExpansions: linkedCards.length,
    meaningfulLinkedExpansions,
    thinLinkedExpansions,
    deepReadExpansions: deepReadCards.length,
    cardsWithThinExtracts,
    averageExcerptChars,
    sourceDiversity,
    depthScore,
    warnings,
  };
}

function isMeaningfulLinkedEvidence(card: SourceCard): boolean {
  return !isBoilerplateThinMatch(card) && card.source !== "deep-reference";
}

function isThinExtract(card: SourceCard): boolean {
  const excerpt = card.excerpt ?? "";
  return excerpt.length < 360 || /No plaintext extract returned/i.test(excerpt);
}

function buildFutures(
  seed: string,
  keywords: string[],
  evidenceCards: SourceCard[],
  depthMetrics: EvidenceDepthMetrics,
): AssociationFuture[] {
  const selectedCards = evidenceCards.length > 0 ? evidenceCards : [];
  const count = Math.min(5, Math.max(3, selectedCards.length || 3));
  const theme = keywords.slice(0, 3).join(" / ") || trimForDisplay(seed, 36);
  const confidence = depthMetrics.depthScore >= 70 ? "high" : depthMetrics.depthScore >= 45 ? "medium" : "low";
  const caveat = depthMetrics.warnings.length > 0 ? depthMetrics.warnings.join(" ") : undefined;
  const frames = [
    "哲辯軸：先把來源中的技術承諾、治理問題與身體隱喻拆開，再討論誰有權把生命或身體資料變成設計材料",
    "反命題：如果證據只停在摘要，產物必須暴露自己的無知，改生成閱讀路線、爭點表與待查連結，而不是假裝完成",
    "實作軸：只允許非活體、可關閉、可維修、可追溯的 prototype；把危險知識轉譯成倫理介面與展示結構",
    "社群軸：檢查這個作品是回饋 wiki/commoning，還是抽取 DIY bio 與 e-textile 社群的酷感",
    "形式軸：小誌版面必須讓 source trails 可見，讀者能沿著連結繼續深讀，而不是只消費漂亮結論",
  ];

  return Array.from({ length: count }, (_, index) => {
    const citations = selectedCards.slice(index, index + 4);
    const citationText = citations.map((card) => card.title).join("; ") || "no strong source card match";
    const frame = frames[index % frames.length];

    return {
      title: `${index + 1}. ${theme} / ${frame.split("：")[0]}`,
      scenario: `${frame}。目前依據：${citationText}。這不是產品點子，而是一個必須用來源鏈、反例與安全邊界支撐的論證段落。`,
      confidence,
      caveat,
      citations: citations.map(({ id, title, url }) => ({ id, title, url })),
    };
  });
}

function citationFor(card: SourceCard): Pick<SourceCard, "id" | "title" | "url"> {
  return { id: card.id, title: card.title, url: card.url };
}

function dedupeCards(cards: SourceCard[]): SourceCard[] {
  const seen = new Set<string>();
  const result: SourceCard[] = [];

  for (const card of cards) {
    if (seen.has(card.id)) continue;
    seen.add(card.id);
    result.push(card);
  }

  return result;
}

function trimForDisplay(text: string, maxLength: number): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 3)}...`;
}
