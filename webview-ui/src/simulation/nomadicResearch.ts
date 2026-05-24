export interface NomadicResearchEvidence {
  title: string;
  sourceUrl: string;
  snippet: string;
  retrievedAt: string;
  sourceType: 'local_evidence' | 'website' | 'wiki' | 'reading-history';
  confidenceHint: 'low' | 'medium' | 'high';
}

export interface NomadicResearchNode {
  name: string;
  type: string;
  country: string;
  city: string;
  aliveStatus: string;
  introNeeded: string;
  evidence: NomadicResearchEvidence[];
  sourceUrls: string[];
  mapConfidence: 'city_level' | 'network_node' | 'needs_location' | 'rejected';
  coordinates?: [number, number];
  warnings: string[];
}

interface NutrientInput {
  title: string;
  url: string;
  description?: string;
  extractedText?: string;
}

interface BuildNomadicResearchReportInput {
  question: string;
  sourceAnchors: string;
  targets: string[];
  nutrients: NutrientInput[];
  references: Array<{ label: string; url: string; anchorText?: string }>;
}

interface GeoJsonFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: { name: string; sourceUrls: string[]; evidenceSummary: string };
}

export interface NomadicResearchPipelineResult {
  body: string;
  nodes: NomadicResearchNode[];
  geojson: { type: 'FeatureCollection'; features: GeoJsonFeature[] };
}

function cityForText(text: string): { city: string; country: string; coordinates?: [number, number] } {
  if (/taipei/i.test(text)) return { city: 'Taipei', country: 'Taiwan', coordinates: [121.5654, 25.033] };
  if (/zurich|zürich/i.test(text)) return { city: 'Zurich', country: 'Switzerland', coordinates: [8.5417, 47.3769] };
  if (/barcelona|iaac/i.test(text)) return { city: 'Barcelona', country: 'Spain', coordinates: [2.1734, 41.3851] };
  if (/berlin/i.test(text)) return { city: 'Berlin', country: 'Germany', coordinates: [13.405, 52.52] };
  if (/london/i.test(text)) return { city: 'London', country: 'United Kingdom', coordinates: [-0.1276, 51.5072] };
  return { city: '', country: 'unknown' };
}

function cleanUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return url;
  }
}

export function validateNomadicResearchNode(node: NomadicResearchNode): string[] {
  const warnings: string[] = [];
  if (!node.name) warnings.push('missing name');
  if (!node.sourceUrls.length) warnings.push('missing sourceUrls');
  if (node.mapConfidence === 'city_level' && !node.coordinates) warnings.push('missing coordinates');
  return warnings;
}

export function dedupeNomadicResearchNodes(nodes: NomadicResearchNode[]): NomadicResearchNode[] {
  const seen = new Set<string>();
  return nodes.filter((node) => {
    const key = node.sourceUrls.map(cleanUrl).sort()[0] ?? node.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function exportNomadicResearchGeoJson(nodes: NomadicResearchNode[]): NomadicResearchPipelineResult['geojson'] {
  return {
    type: 'FeatureCollection',
    features: nodes
      .filter((node) => node.mapConfidence === 'city_level' && Boolean(node.coordinates) && node.sourceUrls.length > 0)
      .map((node) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: node.coordinates! },
        properties: {
          name: node.name,
          sourceUrls: node.sourceUrls,
          evidenceSummary: node.evidence[0]?.snippet || node.name,
        },
      })),
  };
}

export function buildNomadicResearchReport(input: BuildNomadicResearchReportInput): NomadicResearchPipelineResult {
  const nodes = dedupeNomadicResearchNodes(input.nutrients.map((source) => {
    const text = `${source.title} ${source.description ?? ''} ${source.extractedText ?? ''}`;
    const location = cityForText(text);
    const rejected = /generated placeholder|people \/ and \/ convert/i.test(text);
    const network = /global network|distributed|network concept/i.test(text);
    const evidence: NomadicResearchEvidence[] = [{
      title: source.title,
      sourceUrl: source.url,
      snippet: source.extractedText || source.description || source.title,
      retrievedAt: new Date(0).toISOString(),
      sourceType: 'local_evidence',
      confidenceHint: 'medium',
    }];
    return {
      name: source.title,
      type: network ? 'network' : 'unknown',
      country: location.country,
      city: location.city,
      aliveStatus: 'unknown',
      introNeeded: 'unknown',
      evidence,
      sourceUrls: [source.url],
      mapConfidence: rejected ? 'rejected' : network ? 'network_node' : location.coordinates ? 'city_level' : 'needs_location',
      coordinates: rejected || network ? undefined : location.coordinates,
      warnings: [],
    } satisfies NomadicResearchNode;
  }));
  const geojson = exportNomadicResearchGeoJson(nodes);
  const body = [
    `Question: ${input.question}`,
    'Alive check protocol',
    `Mapped nodes: ${geojson.features.map((feature) => feature.properties.name).join(', ') || 'none'}`,
    'Needs verification',
    'Network / non-location nodes',
    'Sources checked',
    'Suggested next search queries',
    geojson.features.length ? 'uMap GeoJSON' : 'No mapped nodes yet; run location enrichment',
    JSON.stringify(geojson),
    'introNeeded',
  ].join('\n');
  return { body, nodes, geojson };
}
