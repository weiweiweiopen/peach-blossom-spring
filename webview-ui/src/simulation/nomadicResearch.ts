import type { A2ANutrientSource } from './types.js';

export type NomadicResearchSourceType = 'hackerspaces_wiki' | 'fablabs' | 'wikidata' | 'osm' | 'official_site' | 'event_page' | 'social' | 'github' | 'youtube' | 'local_evidence';
export type NomadicResearchNodeType = 'hackerspace' | 'fablab' | 'university_lab' | 'art_lab' | 'meetup' | 'network' | 'unknown';
export type AliveStatus = 'active' | 'probably_active' | 'uncertain' | 'inactive' | 'unknown';
export type IntroNeeded = 'yes' | 'maybe' | 'no' | 'unknown';
export type MapConfidence = 'exact_address' | 'city_level' | 'network_node' | 'needs_location' | 'rejected';

export interface EvidenceCard {
  title: string;
  sourceUrl: string;
  snippet: string;
  retrievedAt: string;
  sourceType: NomadicResearchSourceType;
  confidenceHint: 'high' | 'medium' | 'low';
}

export interface NomadicResearchNode {
  name: string;
  type: NomadicResearchNodeType;
  country: string;
  city: string;
  address?: string;
  aliveStatus: AliveStatus;
  introNeeded: IntroNeeded;
  equipment?: string;
  openDays?: string;
  communityLanguage?: string;
  fees?: string;
  evidence: EvidenceCard[];
  sourceUrls: string[];
  mapConfidence: MapConfidence;
  coordinates?: [number, number];
  notes?: string;
  warnings: string[];
}

export interface ResearchSourceAdapter {
  readonly sourceType: NomadicResearchSourceType;
  retrieve(query: string): Promise<EvidenceCard[]>;
}

export interface LocationGeocodingAdapter {
  geocodeCity(city: string, country?: string): { city: string; country: string; coordinates: [number, number] } | undefined;
  geocodeAddress?(address: string): { city: string; country: string; address: string; coordinates: [number, number] } | undefined;
}

export interface NomadicResearchPipelineInput {
  question: string;
  sourceAnchors: string;
  nutrients: A2ANutrientSource[];
  references: Array<{ label: string; url: string; anchorText: string }>;
  targets: string[];
  retrievedAt?: string;
  geocoder?: LocationGeocodingAdapter;
}

export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: Record<string, unknown>;
    geometry: { type: 'Point'; coordinates: [number, number] };
  }>;
}

export interface NomadicResearchPipelineResult {
  body: string;
  nodes: NomadicResearchNode[];
  geojson: GeoJsonFeatureCollection;
}

const CITY_COORDINATES: Record<string, { city: string; country: string; coordinates: [number, number] }> = {
  taipei: { city: 'Taipei', country: 'Taiwan', coordinates: [121.5654, 25.033] },
  tokyo: { city: 'Tokyo', country: 'Japan', coordinates: [139.6917, 35.6895] },
  berlin: { city: 'Berlin', country: 'Germany', coordinates: [13.405, 52.52] },
  london: { city: 'London', country: 'United Kingdom', coordinates: [-0.1276, 51.5072] },
  barcelona: { city: 'Barcelona', country: 'Spain', coordinates: [2.1734, 41.3851] },
  zurich: { city: 'Zurich', country: 'Switzerland', coordinates: [8.5417, 47.3769] },
  geneva: { city: 'Geneva', country: 'Switzerland', coordinates: [6.1432, 46.2044] },
};

const STOPWORDS = new Set(['people', 'and', 'convert', 'them', 'with', 'from', 'into', 'source', 'wiki', 'https', 'http', 'www']);

const defaultGeocoder: LocationGeocodingAdapter = {
  geocodeCity(city: string, country?: string) {
    const normalizedCity = city.toLowerCase().trim();
    const record = CITY_COORDINATES[normalizedCity];
    if (!record) return undefined;
    if (country && record.country.toLowerCase() !== country.toLowerCase()) return undefined;
    return record;
  },
};

function normalizeText(text: string): string {
  return text.replace(/https?:\/\/\S+/gi, '').replace(/\s+/g, ' ').trim();
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    parsed.search = '';
    return parsed.toString().replace(/\/$/, '').toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

function normalizedName(name: string): string {
  return normalizeText(name).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function isUrlName(name: string): boolean {
  return /^https?:\/\//i.test(name.trim());
}

function isPlaceholder(value: string): boolean {
  return /city-level node|unknown city|people\s*\/\s*and\s*\/\s*convert\s*\/\s*them/i.test(value);
}

function compact(text: string, max = 220): string {
  const normalized = normalizeText(text);
  return normalized.length > max ? `${normalized.slice(0, max).trim()}...` : normalized;
}

function sourceTypeForUrl(url: string, title: string, snippet: string): NomadicResearchSourceType {
  const haystack = `${url} ${title} ${snippet}`.toLowerCase();
  if (haystack.includes('hackerspaces')) return 'hackerspaces_wiki';
  if (haystack.includes('fablab') || haystack.includes('fab lab') || haystack.includes('fabcity')) return 'fablabs';
  if (haystack.includes('wikidata')) return 'wikidata';
  if (haystack.includes('openstreetmap') || haystack.includes('osm')) return 'osm';
  if (haystack.includes('meetup') || haystack.includes('eventbrite')) return 'event_page';
  if (haystack.includes('facebook') || haystack.includes('instagram')) return 'social';
  if (haystack.includes('github')) return 'github';
  if (haystack.includes('youtube')) return 'youtube';
  return 'local_evidence';
}

function nodeTypeFromEvidence(text: string): NomadicResearchNodeType {
  const value = text.toLowerCase();
  if (value.includes('hackerspace') || value.includes('hackspace')) return 'hackerspace';
  if (value.includes('fablab') || value.includes('fab lab')) return 'fablab';
  if (value.includes('university') || value.includes('school') || value.includes('college')) return 'university_lab';
  if (value.includes('art lab') || value.includes('artist-run') || value.includes('media lab')) return 'art_lab';
  if (value.includes('meetup') || value.includes('workshop') || value.includes('event')) return 'meetup';
  if (value.includes('network') || value.includes('fab city') || value.includes('fabricademy')) return 'network';
  return 'unknown';
}

function aliveStatusFromEvidence(text: string): AliveStatus {
  const value = text.toLowerCase();
  if (/recent|upcoming|current|open day|workshop|event|calendar|newsletter|github|maintain/.test(value)) return 'probably_active';
  if (/closed|inactive|archived|defunct|ended/.test(value)) return 'inactive';
  return 'uncertain';
}

function detectCityCountry(text: string): { city: string; country: string; coordinates?: [number, number] } | undefined {
  const normalized = text.toLowerCase();
  for (const [key, record] of Object.entries(CITY_COORDINATES)) {
    if (normalized.includes(key)) return record;
  }
  if (/swiss|switzerland/i.test(text)) return { city: '', country: 'Switzerland' };
  if (/japan/i.test(text)) return { city: '', country: 'Japan' };
  if (/taiwan/i.test(text)) return { city: '', country: 'Taiwan' };
  if (/germany/i.test(text)) return { city: '', country: 'Germany' };
  if (/united kingdom|\buk\b|england/i.test(text)) return { city: '', country: 'United Kingdom' };
  return undefined;
}

function extractExplicitLocationCandidate(text: string): { city?: string; country?: string; address?: string } | undefined {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const explicitCity = Object.values(CITY_COORDINATES).find((record) =>
    new RegExp(`\\b${record.city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(normalized),
  );
  if (explicitCity) return { city: explicitCity.city, country: explicitCity.country };
  const countryOnly = detectCityCountry(normalized);
  if (countryOnly?.country && !countryOnly.city) return { country: countryOnly.country };
  return undefined;
}

export function retrieveNomadicResearchSourcesFromEvidence(input: NomadicResearchPipelineInput): EvidenceCard[] {
  const retrievedAt = input.retrievedAt ?? new Date(0).toISOString();
  const nutrientCards = input.nutrients.map((source) => ({
    title: source.title,
    sourceUrl: source.url,
    snippet: compact(`${source.description} ${source.extractedText}`),
    retrievedAt,
    sourceType: sourceTypeForUrl(source.url, source.title, source.description),
    confidenceHint: 'medium' as const,
  }));
  const referenceCards = input.references.map((reference) => ({
    title: reference.label,
    sourceUrl: reference.url,
    snippet: compact(reference.anchorText),
    retrievedAt,
    sourceType: sourceTypeForUrl(reference.url, reference.label, reference.anchorText),
    confidenceHint: 'low' as const,
  }));
  const byUrl = new Map<string, EvidenceCard>();
  for (const card of [...nutrientCards, ...referenceCards]) {
    const key = normalizeUrl(card.sourceUrl);
    if (!key || byUrl.has(key)) continue;
    byUrl.set(key, card);
  }
  return Array.from(byUrl.values());
}

function buildNodeFromEvidence(card: EvidenceCard, geocoder: LocationGeocodingAdapter = defaultGeocoder): NomadicResearchNode {
  const warnings: string[] = [];
  const rawName = normalizeText(card.title) || card.sourceUrl;
  let name = rawName;
  const urlFallbackName = isUrlName(name);
  if (urlFallbackName) {
    warnings.push('URL used as fallback name; needs human title verification.');
    name = new URL(card.sourceUrl).hostname.replace(/^www\./, '');
  }
  const brokenName = normalizedName(name).split(' ').every((word) => STOPWORDS.has(word));
  const evidenceText = `${card.title} ${card.snippet} ${card.sourceUrl}`;
  const locationCandidate = extractExplicitLocationCandidate(evidenceText);
  const location = locationCandidate?.city ? geocoder.geocodeCity(locationCandidate.city, locationCandidate.country) : undefined;
  const type = nodeTypeFromEvidence(evidenceText);
  let mapConfidence: MapConfidence = 'needs_location';
  let coordinates: [number, number] | undefined;
  if (brokenName || isPlaceholder(name)) {
    mapConfidence = 'rejected';
    warnings.push('Rejected placeholder or broken generated name.');
    name = 'Rejected generated placeholder';
  } else if (urlFallbackName) {
    warnings.push('URL/PDF fallback name cannot generate a map point without a verified title.');
  } else if (type === 'network') {
    mapConfidence = 'network_node';
  } else if (location?.coordinates) {
    mapConfidence = 'city_level';
    coordinates = location.coordinates;
  }
  return {
    name,
    type,
    country: location?.country ?? locationCandidate?.country ?? 'unknown',
    city: location?.city ?? '',
    aliveStatus: aliveStatusFromEvidence(evidenceText),
    introNeeded: 'unknown',
    equipment: /equipment|tool|machine|fabrication|workshop/i.test(evidenceText) ? 'Evidence mentions tools/workshops; verify equipment before visiting.' : undefined,
    openDays: /open day|public hours|calendar|event/i.test(evidenceText) ? 'Evidence mentions public/event rhythm; verify current date.' : undefined,
    communityLanguage: undefined,
    fees: undefined,
    evidence: [card],
    sourceUrls: [card.sourceUrl],
    mapConfidence,
    coordinates,
    notes: 'Generated from local evidence adapter only; no live web fetch/geocoder has run.',
    warnings,
  };
}

export function dedupeNomadicResearchNodes(nodes: NomadicResearchNode[]): NomadicResearchNode[] {
  const byKey = new Map<string, NomadicResearchNode>();
  for (const node of nodes) {
    const sourceKey = node.sourceUrls.map(normalizeUrl).sort().join('|');
    const key = `${normalizedName(node.name)}|${node.city.toLowerCase()}|${sourceKey}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, node);
      continue;
    }
    existing.evidence = [...existing.evidence, ...node.evidence];
    existing.sourceUrls = Array.from(new Set([...existing.sourceUrls, ...node.sourceUrls]));
    existing.warnings = Array.from(new Set([...existing.warnings, ...node.warnings, 'Duplicate source/name merged.']));
  }
  return Array.from(byKey.values());
}

export function enrichNomadicResearchLocations(
  nodes: NomadicResearchNode[],
  geocoder: LocationGeocodingAdapter = defaultGeocoder,
): NomadicResearchNode[] {
  return nodes.map((node) => {
    if (node.mapConfidence !== 'needs_location') return node;
    if (node.warnings.some((warning) => warning.includes('URL/PDF fallback name'))) return node;
    const evidenceText = node.evidence.map((item) => `${item.title} ${item.snippet} ${item.sourceUrl}`).join(' ');
    const candidate = extractExplicitLocationCandidate(evidenceText);
    if (!candidate?.city) {
      return {
        ...node,
        country: candidate?.country ?? node.country,
        warnings: Array.from(new Set([...node.warnings, 'No explicit city/address found in evidence; kept unmapped.'])),
      };
    }
    const geocoded = geocoder.geocodeCity(candidate.city, candidate.country);
    if (!geocoded) {
      return {
        ...node,
        city: candidate.city,
        country: candidate.country ?? node.country,
        warnings: Array.from(new Set([...node.warnings, 'Explicit city found but geocoder returned no trusted coordinate.'])),
      };
    }
    return {
      ...node,
      city: geocoded.city,
      country: geocoded.country,
      mapConfidence: 'city_level',
      coordinates: geocoded.coordinates,
      warnings: Array.from(new Set([...node.warnings, 'Location enriched from explicit evidence city.'])),
    };
  });
}

export function validateNomadicResearchNode(node: NomadicResearchNode): string[] {
  const problems: string[] = [];
  if (!node.evidence.length) problems.push('missing evidence');
  if (!node.sourceUrls.length) problems.push('missing sourceUrls');
  if (isPlaceholder(node.city) || isPlaceholder(node.country)) problems.push('placeholder location');
  if (node.coordinates) {
    const [lng, lat] = node.coordinates;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) problems.push('coordinates out of range');
  }
  if ((node.mapConfidence === 'exact_address' || node.mapConfidence === 'city_level') && !node.coordinates) problems.push('mapped node missing coordinates');
  if ((node.mapConfidence === 'network_node' || node.mapConfidence === 'needs_location' || node.mapConfidence === 'rejected') && node.coordinates) problems.push('unmapped node has coordinates');
  return problems;
}

export function exportNomadicResearchGeoJson(nodes: NomadicResearchNode[]): GeoJsonFeatureCollection {
  const features = nodes
    .filter((node) => (node.mapConfidence === 'exact_address' || node.mapConfidence === 'city_level') && node.coordinates && validateNomadicResearchNode(node).length === 0)
    .map((node) => ({
      type: 'Feature' as const,
      properties: {
        name: node.name,
        description: node.notes ?? '',
        type: node.type,
        aliveStatus: node.aliveStatus,
        introNeeded: node.introNeeded,
        city: node.city,
        country: node.country,
        sourceUrls: node.sourceUrls,
        evidenceSummary: node.evidence.map((item) => item.snippet).join('\n'),
        mapConfidence: node.mapConfidence,
        warnings: node.warnings,
      },
      geometry: { type: 'Point' as const, coordinates: node.coordinates! },
    }));
  return { type: 'FeatureCollection', features };
}

function formatNode(node: NomadicResearchNode): string {
  const location = [node.city, node.country].filter(Boolean).join(', ') || 'location unknown';
  const warnings = node.warnings.length ? ` warnings: ${node.warnings.join('; ')}` : '';
  return `- ${node.name} (${node.type}, ${location}) — status: ${node.aliveStatus}; mapConfidence: ${node.mapConfidence}; intro: ${node.introNeeded}; sources: ${node.sourceUrls.join(', ')}.${warnings}`;
}

function displayEvidenceTitle(title: string): string {
  return isPlaceholder(title) || normalizedName(title).split(' ').every((word) => STOPWORDS.has(word))
    ? 'Rejected generated placeholder'
    : title;
}

export function buildNomadicResearchReport(input: NomadicResearchPipelineInput): NomadicResearchPipelineResult {
  const evidence = retrieveNomadicResearchSourcesFromEvidence(input);
  const nodes = enrichNomadicResearchLocations(
    dedupeNomadicResearchNodes(evidence.map((item) => buildNodeFromEvidence(item, input.geocoder ?? defaultGeocoder))),
    input.geocoder ?? defaultGeocoder,
  );
  const geojson = exportNomadicResearchGeoJson(nodes);
  const mapped = nodes.filter((node) => node.mapConfidence === 'exact_address' || node.mapConfidence === 'city_level');
  const needsVerification = nodes.filter((node) => node.mapConfidence === 'needs_location');
  const network = nodes.filter((node) => node.mapConfidence === 'network_node');
  const rejected = nodes.filter((node) => node.mapConfidence === 'rejected' || validateNomadicResearchNode(node).length > 0);
  const sourceList = evidence.map((item) => `- ${displayEvidenceTitle(item.title)}: ${item.sourceUrl} (${item.sourceType}, ${item.confidenceHint})`).join('\n') || '- No local evidence sources retrieved.';
  const body = [
    '【Nomadic Research】Evidence-first local report. This MVP uses local wiki/A2A evidence adapters only; live web retrieval and live geocoding are interfaces/future adapters, not simulated.',
    'Alive check protocol\nactive/probably_active requires evidence such as recent events, public workshops, current pages, open-day calendars, maintained repositories, or explicit community traces. A map listing alone is not proof of life.',
    `Mapped nodes\n${mapped.map(formatNode).join('\n') || '- No mapped nodes yet; run location enrichment with Wikidata / OSM / Nominatim or add evidence containing a verified city/address.'}`,
    `Needs verification\n${needsVerification.map(formatNode).join('\n') || '- None.'}`,
    `Network / non-location nodes\n${network.map(formatNode).join('\n') || '- None.'}`,
    `Rejected / insufficient evidence\n${rejected.map(formatNode).join('\n') || '- None.'}`,
    `Sources checked\n${sourceList}`,
    `Suggested next search queries\n- ${normalizeText(input.question)} hackerspace recent workshop official site\n- ${normalizeText(input.question)} fablab open day fee language\n- ${normalizeText(input.question)} art lab university lab meetup current event\n- Verify locations with Wikidata / OSM / Nominatim before exporting more points.`,
    `uMap import instructions\nImport only the GeoJSON below. It contains Point features only for exact_address or city_level nodes with evidence and validated coordinates. network_node / needs_location / rejected nodes are intentionally excluded.`,
    `uMap GeoJSON:\n${JSON.stringify(geojson, null, 2)}`,
  ].join('\n\n');
  return { body, nodes, geojson };
}
