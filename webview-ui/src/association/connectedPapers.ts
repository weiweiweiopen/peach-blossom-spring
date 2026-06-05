import type { AssociationCorpus, SourceCard } from "./engine.js";

type SourceName = "hackteria" | "sgmk";

type RichSourceCard = SourceCard & {
  sourceCategories?: string[];
  semanticTopics?: Array<{ topic?: string; layer?: string; score?: number }>;
  entities?: {
    people?: string[];
    places?: string[];
    times?: string[];
  };
  path?: string;
};

interface CardProfile {
  card: RichSourceCard;
  source: SourceName;
  terms: Set<string>;
  categories: Set<string>;
  tags: Set<string>;
  topics: Set<string>;
  methods: Set<string>;
  materials: Set<string>;
  objects: Set<string>;
}

interface RelatedPair {
  source: CardProfile;
  target: CardProfile;
  score: number;
  reasons: string[];
}

interface MissingBridge {
  left: CardProfile;
  right: CardProfile;
  score: number;
  sharedMethods: string[];
  sharedMaterials: string[];
  sharedObjects: string[];
  sharedTopics: string[];
}

interface FuturePaper {
  title: string;
  score: number;
  sharedTerms: string[];
  cards: CardProfile[];
}

export interface SemanticVectorContext {
  anchorCards: SourceCard[];
  relatedCards: Array<{
    card: SourceCard;
    score: number;
    reasons: string[];
    anchorTitle: string;
  }>;
  bridgeCards: Array<{
    cards: [SourceCard, SourceCard];
    score: number;
    sharedTerms: string[];
  }>;
  futureDirections: Array<{
    title: string;
    score: number;
    groundedTerms: string[];
    evidenceCards: SourceCard[];
  }>;
}

const SOURCES = new Set<SourceName>(["hackteria", "sgmk"]);

const METHOD_TERMS = [
  "workshop",
  "documentation",
  "fieldwork",
  "prototype",
  "prototyping",
  "experiment",
  "lab",
  "wetlab",
  "microscopy",
  "sensor",
  "sensors",
  "sewing",
  "knit",
  "soldering",
  "performance",
  "recording",
  "listening",
  "diy",
  "open-source",
  "hardware",
];

const MATERIAL_TERMS = [
  "textile",
  "textiles",
  "fabric",
  "thread",
  "conductive",
  "arduino",
  "microcontroller",
  "microscope",
  "camera",
  "speaker",
  "audio",
  "circuit",
  "electronics",
  "paper",
  "bio",
  "bacteria",
  "plant",
  "sensor",
  "sensors",
];

const OBJECT_TERMS = [
  "instrument",
  "synth",
  "synthesizer",
  "wearable",
  "installation",
  "interface",
  "tool",
  "device",
  "microscope",
  "sensor",
  "score",
  "sound",
  "music",
];

const STOP_TERMS = new Set([
  "and",
  "api",
  "broken",
  "categories",
  "category",
  "file",
  "found",
  "for",
  "from",
  "imported",
  "internal",
  "layer",
  "links",
  "mediawiki",
  "notes",
  "page",
  "pages",
  "plaintext",
  "relationship",
  "returned",
  "source",
  "the",
  "with",
]);

const FUTURE_NOISE_TERMS = new Set([
  "and",
  "art-science",
  "communities",
  "community",
  "diy",
  "electronics",
  "lab",
  "practice",
]);

export function generateConnectedPapersMarkdown(corpus: AssociationCorpus): string {
  const profiles = corpus.cards
    .map((card) => buildProfile(card as RichSourceCard))
    .filter((profile): profile is CardProfile => Boolean(profile));
  const representativeProfiles = selectRepresentativeProfiles(profiles);
  const relatedSections = representativeProfiles.map((profile) => ({
    profile,
    related: relatedArticles(profile, profiles, 5),
  }));
  const bridges = missingBridges(profiles, 12);
  const futures = futurePapers(profiles, 10);

  return [
    "# Connected Paper 式關聯分析：Hackteria / SGMK / How To Get What You Want-Kobakant",
    "",
    "## 執行原則",
    "",
    "- 只使用 `sourceCards.json` 裡現有 page 的 `title`、`excerpt`、`keywords`、`categories/sourceCategories`、`tags`、`semanticTopics`、`outgoingLinks`。",
    "- 不把社群預設成某個主題；例如 Hackteria 不會被預設為水，除非 page 文字或 keyword 真的出現 water。",
    "- Related Articles 是相似度；Missing Bridges 是跨社群、有共同方法/材料/物件但沒有明確互連的 pair；Future Papers 是由多個社群共同出現的實際詞彙組合出來的研究缺口。",
    "",
    "## Scoring",
    "",
    "```text",
    "related_score = shared_categories*4 + shared_tags*3 + shared_semantic_topics*3 + shared_methods*2 + shared_materials*2 + shared_objects*2 + shared_terms*1 + direct_link*6",
    "bridge_score = shared_methods*3 + shared_materials*3 + shared_objects*2 + shared_topics*2 + cross_community*4 - direct_link*6",
    "future_score = number_of_communities*5 + shared_terms*2 + evidence_cards",
    "```",
    "",
    "## 1. Related Articles：這篇文章附近有哪些 note？",
    "",
    ...relatedSections.flatMap(renderRelatedSection),
    "## 2. Missing Bridges：哪些社群之間有方法互補，但沒有明確文章？",
    "",
    ...bridges.flatMap(renderBridge),
    "## 3. Future Papers：哪些組合可以變成研究計畫、論文、展覽、工作坊？",
    "",
    ...futures.flatMap(renderFuture),
    "## 限制",
    "",
    "- 這是基於 export 的 deterministic analysis，不讀 raw markdown，不補未出現在 page 的知識。",
    "- 若某些 wiki page 沒有 plaintext extract，該 page 的分數會主要來自 title、keywords、categories，可靠度較低。",
  ].join("\n");
}

export function buildSemanticVectorContext(
  corpus: AssociationCorpus,
  anchorCards: SourceCard[],
  limits = { relatedPerAnchor: 3, bridges: 6, futures: 6 },
): SemanticVectorContext {
  const profiles = corpus.cards
    .map((card) => buildProfile(card as RichSourceCard))
    .filter((profile): profile is CardProfile => Boolean(profile));
  const profilesById = new Map(profiles.map((profile) => [profile.card.id, profile]));
  const anchorProfiles = anchorCards
    .map((card) => profilesById.get(card.id))
    .filter((profile): profile is CardProfile => Boolean(profile));
  const anchorIds = new Set(anchorProfiles.map((profile) => profile.card.id));

  const relatedCards = dedupeRelatedPairs(
    anchorProfiles.flatMap((anchor) =>
      relatedArticles(anchor, profiles, limits.relatedPerAnchor).map((pair) => ({
        card: pair.target.card,
        score: pair.score,
        reasons: pair.reasons,
        anchorTitle: anchor.card.title,
      })),
    ),
  );
  const relatedIds = new Set(relatedCards.map((related) => related.card.id));
  const contextProfiles = profiles.filter((profile) => anchorIds.has(profile.card.id) || relatedIds.has(profile.card.id));
  const localBridges = missingBridges(contextProfiles.length >= 2 ? contextProfiles : profiles, limits.bridges)
    .filter((bridge) => anchorIds.has(bridge.left.card.id) || anchorIds.has(bridge.right.card.id) || relatedIds.has(bridge.left.card.id) || relatedIds.has(bridge.right.card.id))
    .map((bridge) => ({
      cards: [bridge.left.card, bridge.right.card] as [SourceCard, SourceCard],
      score: bridge.score,
      sharedTerms: [...new Set([...bridge.sharedMethods, ...bridge.sharedMaterials, ...bridge.sharedObjects, ...bridge.sharedTopics])].slice(0, 8),
    }));
  const bridgeCards = localBridges.length > 0
    ? localBridges
    : missingBridges(profiles, limits.bridges).map((bridge) => ({
        cards: [bridge.left.card, bridge.right.card] as [SourceCard, SourceCard],
        score: bridge.score,
        sharedTerms: [...new Set([...bridge.sharedMethods, ...bridge.sharedMaterials, ...bridge.sharedObjects, ...bridge.sharedTopics])].slice(0, 8),
      }));
  const localFutures = futurePapers(contextProfiles.length >= 2 ? contextProfiles : profiles, limits.futures);
  const futureDirections = (localFutures.length > 0 ? localFutures : futurePapers(profiles, limits.futures))
    .map((future) => ({
      title: future.title,
      score: future.score,
      groundedTerms: future.sharedTerms,
      evidenceCards: future.cards.map((profile) => profile.card),
    }));

  return {
    anchorCards: anchorProfiles.map((profile) => profile.card),
    relatedCards,
    bridgeCards,
    futureDirections,
  };
}

function buildProfile(card: RichSourceCard): CardProfile | undefined {
  if (!isSourceName(card.source)) return undefined;

  const categories = normalizeSet([...(card.categories ?? []), ...(card.sourceCategories ?? [])]);
  const tags = normalizeSet(card.tags ?? []);
  const topics = normalizeSet((card.semanticTopics ?? []).map((topic) => topic.topic ?? ""));
  const text = normalizeSet([
    card.title,
    card.excerpt,
    ...(card.keywords ?? []),
    ...(card.categories ?? []),
    ...(card.sourceCategories ?? []),
    ...(card.tags ?? []),
    ...(card.semanticTopics ?? []).map((topic) => topic.topic ?? ""),
  ]);

  return {
    card,
    source: card.source,
    terms: text,
    categories,
    tags,
    topics,
    methods: pickObservedTerms(text, METHOD_TERMS),
    materials: pickObservedTerms(text, MATERIAL_TERMS),
    objects: pickObservedTerms(text, OBJECT_TERMS),
  };
}

function isSourceName(source: string | undefined): source is SourceName {
  return Boolean(source && SOURCES.has(source as SourceName));
}

function normalizeSet(values: string[]): Set<string> {
  const terms = new Set<string>();
  for (const value of values) {
    const tokens = value
      .toLowerCase()
      .replace(/&/g, " and ")
      .match(/[a-z0-9][a-z0-9-]{1,}/g) ?? [];
    for (const token of tokens) {
      const normalized = token.replace(/^-+|-+$/g, "");
      if (normalized.length > 1 && !STOP_TERMS.has(normalized)) terms.add(normalized);
    }
  }
  return terms;
}

function pickObservedTerms(terms: Set<string>, vocabulary: string[]): Set<string> {
  return new Set(vocabulary.filter((term) => terms.has(term)));
}

function selectRepresentativeProfiles(profiles: CardProfile[]): CardProfile[] {
  return ["hackteria", "sgmk"].flatMap((source) =>
    profiles
      .filter((profile) => profile.source === source)
      .sort((a, b) => profileRichness(b) - profileRichness(a) || a.card.title.localeCompare(b.card.title))
      .slice(0, 3),
  );
}

function profileRichness(profile: CardProfile): number {
  return (
    profile.categories.size * 4 +
    profile.topics.size * 3 +
    profile.methods.size * 3 +
    profile.materials.size * 3 +
    profile.objects.size * 2 +
    Math.min(profile.terms.size, 30)
  );
}

function relatedArticles(profile: CardProfile, profiles: CardProfile[], limit: number): RelatedPair[] {
  return profiles
    .filter((candidate) => candidate.card.id !== profile.card.id)
    .map((candidate) => scoreRelated(profile, candidate))
    .filter((pair) => pair.score > 0)
    .sort((a, b) => b.score - a.score || a.target.card.title.localeCompare(b.target.card.title))
    .slice(0, limit);
}

function scoreRelated(source: CardProfile, target: CardProfile): RelatedPair {
  const sharedCategories = intersection(source.categories, target.categories);
  const sharedTags = intersection(source.tags, target.tags);
  const sharedTopics = intersection(source.topics, target.topics);
  const sharedMethods = intersection(source.methods, target.methods);
  const sharedMaterials = intersection(source.materials, target.materials);
  const sharedObjects = intersection(source.objects, target.objects);
  const sharedTerms = intersection(source.terms, target.terms).filter((term) => !SOURCES.has(term as SourceName));
  const directLink = hasDirectLink(source.card, target.card) || hasDirectLink(target.card, source.card);
  const score =
    sharedCategories.length * 4 +
    sharedTags.length * 3 +
    sharedTopics.length * 3 +
    sharedMethods.length * 2 +
    sharedMaterials.length * 2 +
    sharedObjects.length * 2 +
    Math.min(sharedTerms.length, 10) +
    (directLink ? 6 : 0);
  const reasons = [
    formatReason("categories", sharedCategories),
    formatReason("tags", sharedTags),
    formatReason("semantic topics", sharedTopics),
    formatReason("methods", sharedMethods),
    formatReason("materials", sharedMaterials),
    formatReason("objects", sharedObjects),
    directLink ? "direct wikilink/outgoingLink evidence" : "",
  ].filter(Boolean);

  return { source, target, score, reasons };
}

function missingBridges(profiles: CardProfile[], limit: number): MissingBridge[] {
  const bridges: MissingBridge[] = [];
  for (let index = 0; index < profiles.length; index += 1) {
    for (let otherIndex = index + 1; otherIndex < profiles.length; otherIndex += 1) {
      const left = profiles[index];
      const right = profiles[otherIndex];
      if (!left || !right || left.source === right.source) continue;
      if (hasDirectLink(left.card, right.card) || hasDirectLink(right.card, left.card)) continue;

      const sharedMethods = intersection(left.methods, right.methods);
      const sharedMaterials = intersection(left.materials, right.materials);
      const sharedObjects = intersection(left.objects, right.objects);
      const sharedTopics = intersection(left.topics, right.topics);
      const score = sharedMethods.length * 3 + sharedMaterials.length * 3 + sharedObjects.length * 2 + sharedTopics.length * 2 + 4;

      if (score >= 10 && sharedMethods.length + sharedMaterials.length + sharedObjects.length > 1) {
        bridges.push({ left, right, score, sharedMethods, sharedMaterials, sharedObjects, sharedTopics });
      }
    }
  }

  return bridges
    .sort((a, b) => b.score - a.score || a.left.card.title.localeCompare(b.left.card.title))
    .slice(0, limit);
}

function futurePapers(profiles: CardProfile[], limit: number): FuturePaper[] {
  const termIndex = new Map<string, CardProfile[]>();
  for (const profile of profiles) {
    const researchTerms = new Set([...profile.methods, ...profile.materials, ...profile.objects, ...profile.topics]);
    for (const term of researchTerms) {
      const list = termIndex.get(term) ?? [];
      list.push(profile);
      termIndex.set(term, list);
    }
  }

  const candidates: FuturePaper[] = [];
  const seen = new Set<string>();
  for (const [term, termProfiles] of termIndex) {
    const bySource = groupBestBySource(termProfiles);
    if (bySource.size < 2) continue;

    const cards = [...bySource.values()].sort((a, b) => a.source.localeCompare(b.source));
    const sharedTerms = [...new Set(cards.flatMap((card) => [...card.methods, ...card.materials, ...card.objects, ...card.topics]))]
      .filter((candidateTerm) => !FUTURE_NOISE_TERMS.has(candidateTerm))
      .filter((candidateTerm) => cards.filter((card) => hasResearchTerm(card, candidateTerm)).length >= 2)
      .slice(0, 6);
    const key = sharedTerms.slice(0, 3).join("|");
    if (sharedTerms.length < 2 || !key || seen.has(key)) continue;
    seen.add(key);

    candidates.push({
      title: buildFutureTitle(sharedTerms, cards),
      score: bySource.size * 5 + sharedTerms.length * 2 + cards.length,
      sharedTerms: sharedTerms.includes(term) ? sharedTerms : [term, ...sharedTerms].slice(0, 6),
      cards,
    });
  }

  return candidates.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, limit);
}

function groupBestBySource(profiles: CardProfile[]): Map<SourceName, CardProfile> {
  const bySource = new Map<SourceName, CardProfile>();
  for (const profile of profiles) {
    const current = bySource.get(profile.source);
    if (!current || profileRichness(profile) > profileRichness(current)) bySource.set(profile.source, profile);
  }
  return bySource;
}

function hasResearchTerm(profile: CardProfile, term: string): boolean {
  return profile.methods.has(term) || profile.materials.has(term) || profile.objects.has(term) || profile.topics.has(term);
}

function buildFutureTitle(terms: string[], cards: CardProfile[]): string {
  const sourceLabel = [...new Set(cards.map((card) => sourceTitle(card.source)))].join(" + ");
  const termLabel = terms.slice(0, 3).join(" / ");
  return `${termLabel}: ${sourceLabel} 的可研究交叉點`;
}

function hasDirectLink(source: RichSourceCard, target: RichSourceCard): boolean {
  const outgoing = (source.outgoingLinks ?? []).join(" ").toLowerCase();
  const targetHints = [target.id, target.title, target.path, target.url].filter(Boolean).map((value) => String(value).toLowerCase());
  return targetHints.some((hint) => hint.length > 6 && outgoing.includes(hint));
}

function intersection(left: Set<string>, right: Set<string>): string[] {
  return [...left].filter((value) => right.has(value)).sort();
}

function formatReason(label: string, values: string[]): string {
  if (values.length === 0) return "";
  return `${label}: ${values.slice(0, 5).join(", ")}`;
}

function renderRelatedSection(section: { profile: CardProfile; related: RelatedPair[] }): string[] {
  return [
    `### ${sourceTitle(section.profile.source)} / ${section.profile.card.title}`,
    "",
    `來源：${section.profile.card.url ?? section.profile.card.id}`,
    "",
    ...section.related.flatMap((pair, index) => [
      `${index + 1}. **${sourceTitle(pair.target.source)} / ${pair.target.card.title}**，score ${pair.score}`,
      `   - evidence: ${pair.reasons.join("; ")}`,
      `   - source: ${pair.target.card.url ?? pair.target.card.id}`,
    ]),
    "",
  ];
}

function renderBridge(bridge: MissingBridge, index: number): string[] {
  const evidence = [
    formatReason("shared methods", bridge.sharedMethods),
    formatReason("shared materials", bridge.sharedMaterials),
    formatReason("shared objects", bridge.sharedObjects),
    formatReason("shared semantic topics", bridge.sharedTopics),
  ].filter(Boolean);

  return [
    `${index + 1}. **${sourceTitle(bridge.left.source)} / ${bridge.left.card.title}** ↔ **${sourceTitle(bridge.right.source)} / ${bridge.right.card.title}**，bridge score ${bridge.score}`,
    `   - why missing: cross-community pair with no direct outgoingLink evidence in the export`,
    `   - evidence: ${evidence.join("; ")}`,
    `   - sources: ${bridge.left.card.url ?? bridge.left.card.id} | ${bridge.right.card.url ?? bridge.right.card.id}`,
    "",
  ];
}

function renderFuture(future: FuturePaper, index: number): string[] {
  const communities = [...new Set(future.cards.map((card) => sourceTitle(card.source)))].join(" + ");
  return [
    `${index + 1}. **${future.title}**，future score ${future.score}`,
    `   - grounded terms: ${future.sharedTerms.join(", ")}`,
    `   - communities: ${communities}`,
    `   - possible output: research plan / paper / exhibition / workshop, depending on which source card is used as the anchor`,
    ...future.cards.map((profile) => `   - evidence card: ${sourceTitle(profile.source)} / ${profile.card.title} (${profile.card.url ?? profile.card.id})`),
    "",
  ];
}

function sourceTitle(source: SourceName): string {
  if (source === "sgmk") return "SGMK";
  return "Hackteria";
}

function dedupeRelatedPairs(
  relatedPairs: Array<{ card: RichSourceCard; score: number; reasons: string[]; anchorTitle: string }>,
): Array<{ card: SourceCard; score: number; reasons: string[]; anchorTitle: string }> {
  const byId = new Map<string, { card: SourceCard; score: number; reasons: string[]; anchorTitle: string }>();
  for (const related of relatedPairs) {
    const current = byId.get(related.card.id);
    if (!current || related.score > current.score) {
      byId.set(related.card.id, related);
    }
  }
  return [...byId.values()].sort((a, b) => b.score - a.score || a.card.title.localeCompare(b.card.title));
}
