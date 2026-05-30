export type EvidenceFacetId = "kitchen" | "care" | "technical" | "public";

export interface EvidenceFacet {
  id: EvidenceFacetId;
  label: string;
  query: RegExp;
  evidence: RegExp;
  broad?: boolean;
}

export const EVIDENCE_FACETS: EvidenceFacet[] = [
  {
    id: "kitchen",
    label: "community kitchens / food labs",
    query: /community\s+kitchens?|kitchen(?:lab)?|food\s+lab|food|meal|cooking|hosting|hosted|ferment(?:ation)?|kombucha|scoby|biofilm|bacterial\s+cellulose|廚房|厨房|料理|食物|餐|共食|發酵|紅茶菌|康普茶|菌膜/i,
    evidence: /community\s+kitchens?|kitchen(?:lab)?|food\s+lab|food|meal|cooking|hosting|hosted|ferment(?:ation)?|kombucha|scoby|biofilm|bacterial\s+cellulose|gasigaso\s+kitchen|廚房|厨房|料理|食物|餐|共食|發酵|紅茶菌|康普茶|菌膜/i,
  },
  {
    id: "care",
    label: "material care / maintenance",
    query: /material\s+care|care|maintenance|repair|mend|reuse|steward(?:ship)?|failure\s+notes?|照護|照料|維護|維修|保養|修補|再利用/i,
    evidence: /material\s+care|care|maintenance|repair|mend|reuse|steward(?:ship)?|failure\s+notes?|circular|loop|照護|照料|維護|維修|保養|修補|再利用/i,
  },
  {
    id: "technical",
    label: "technical experiments / material practice",
    query: /technical\s+experiments?|experiment(?:al|s)?|prototype|tool(?:kit)?|workshop|lab|wetlab|sensor|electronics?|textiles?|e-?textiles?|fabricat(?:e|ion)|material\s+practice|技術|實驗|原型|工具|工作坊|實驗室|感測|電子|織品|材料/i,
    evidence: /technical\s+experiments?|experiment(?:al|s)?|prototype|tool(?:kit)?|workshop|lab|wetlab|sensor|electronics?|textiles?|e-?textiles?|fabricat(?:e|ion)|soft\s+circuit|wearable|技術|實驗|原型|工具|工作坊|實驗室|感測|電子|織品|材料/i,
    broad: true,
  },
  {
    id: "public",
    label: "public infrastructure / commons",
    query: /public\s+infrastructure|infrastructure|commons?|public|shared\s+resource|open\s+source|community\s+practice|公共|基礎設施|基盤|共同|共用|共享|開源/i,
    evidence: /public\s+infrastructure|infrastructure|commons?|public|shared\s+resource|open\s+source|community\s+practice|documentation|protocol|manual|公共|基礎設施|基盤|共同|共用|共享|開源|文件|紀錄/i,
    broad: true,
  },
];

export function queryEvidenceFacets(query: string): EvidenceFacet[] {
  return EVIDENCE_FACETS.filter((facet) => facet.query.test(query));
}

export function evidenceFacetText(value: unknown): string {
  if (!value || typeof value !== "object") return String(value ?? "");
  const card = value as {
    title?: unknown;
    excerpt?: unknown;
    description?: unknown;
    keywords?: unknown[];
    tags?: unknown[];
    categories?: unknown[];
    sourceCategories?: unknown[];
    semanticTopics?: Array<{ topic?: unknown }>;
    summary?: unknown;
    searchText?: unknown;
    evidence?: unknown;
    related?: unknown[];
    sourceRefs?: unknown[];
    path?: unknown;
    url?: unknown;
  };
  return [
    card.title,
    card.excerpt,
    card.description,
    ...(Array.isArray(card.keywords) ? card.keywords : []),
    ...(Array.isArray(card.tags) ? card.tags : []),
    ...(Array.isArray(card.categories) ? card.categories : []),
    ...(Array.isArray(card.sourceCategories) ? card.sourceCategories : []),
    ...(Array.isArray(card.semanticTopics) ? card.semanticTopics.map((topic) => topic.topic) : []),
    card.summary,
    card.searchText,
    card.evidence,
    ...(Array.isArray(card.related) ? card.related : []),
    ...(Array.isArray(card.sourceRefs) ? card.sourceRefs : []),
    card.path,
    card.url,
  ].map((item) => String(item ?? "")).join(" ");
}

export function evidenceFacetCoverage(query: string, evidence: unknown): EvidenceFacet[] {
  const queryFacets = queryEvidenceFacets(query);
  if (queryFacets.length === 0) return [];
  const text = evidenceFacetText(evidence);
  return queryFacets.filter((facet) => facet.evidence.test(text));
}

export function evidenceFacetRelevanceScore(query: string, evidence: unknown): number {
  const queryFacets = queryEvidenceFacets(query);
  if (queryFacets.length === 0) return 0;
  const covered = evidenceFacetCoverage(query, evidence);
  const concreteHits = covered.filter((facet) => !facet.broad).length;
  const broadHits = covered.length - concreteHits;
  return concreteHits * 22 + broadHits * 8 + Math.max(0, covered.length - 1) * 10;
}

export function hasRelevantFacetSupport(query: string, evidence: unknown): boolean {
  const queryFacets = queryEvidenceFacets(query);
  if (queryFacets.length <= 1) return true;
  const covered = evidenceFacetCoverage(query, evidence);
  if (covered.length === 0) return false;
  const concreteQueryFacets = queryFacets.filter((facet) => !facet.broad);
  const concreteCovered = covered.filter((facet) => !facet.broad);
  if (concreteQueryFacets.length >= 2) return concreteCovered.length >= 1;
  if (concreteQueryFacets.length === 1) return concreteCovered.length >= 1 || covered.length >= 2;
  return covered.length >= 2;
}

export function facetLabels(facets: EvidenceFacet[]): string[] {
  return facets.map((facet) => facet.label);
}
