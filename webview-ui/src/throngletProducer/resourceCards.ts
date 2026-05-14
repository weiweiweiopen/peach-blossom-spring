import type { EvidenceItem, QuestionDossier, ResourceCard, ResourceSourceType } from './types.js';

export interface ManualResourceCardInput {
  title: string;
  sourceType?: ResourceSourceType;
  sourceUrl?: string;
  summary?: string;
  relevanceReason?: string;
  costOrAccess?: string;
  region?: string;
}

function normalizeText(value: string | undefined, fallback: string): string {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  return normalized && normalized.length > 0 ? normalized : fallback;
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'resource';
}

export function createManualResourceCard(
  dossier: QuestionDossier,
  input: ManualResourceCardInput,
  now = Date.now(),
): { resourceCard: ResourceCard; evidenceItem: EvidenceItem } {
  const title = normalizeText(input.title, 'Manual resource note');
  const summary = normalizeText(
    input.summary,
    `Manual resource candidate for the question: ${dossier.originalQuestion}`,
  );
  const sourceType = input.sourceType ?? 'reference';
  const id = `resource-${dossier.id}-${slug(title)}`;

  const evidenceType: EvidenceItem['evidenceType'] = input.sourceUrl ? 'external_source' : 'player_provided';

  const resourceCard: ResourceCard = {
    id,
    title,
    sourceType,
    sourceUrl: input.sourceUrl?.trim() || undefined,
    summary,
    relevanceReason: normalizeText(
      input.relevanceReason,
      'Player or producer marked this as potentially useful; it still needs review before proposal use.',
    ),
    costOrAccess: input.costOrAccess?.trim() || undefined,
    region: input.region?.trim() || undefined,
    fetchedAt: now,
    caution: 'Manual local resource. Not externally verified and not NPC memory.',
    evidenceType,
  };

  const evidenceItem: EvidenceItem = {
    id: `evidence-${id}`,
    evidenceType,
    summary: resourceCard.summary,
    sourceLabel: resourceCard.title,
    sourceUrl: resourceCard.sourceUrl,
    sourceId: resourceCard.id,
    fetchedAt: now,
    caution: resourceCard.caution,
  };

  return { resourceCard, evidenceItem };
}

export function withManualResourceCard(
  dossier: QuestionDossier,
  input: ManualResourceCardInput,
  now = Date.now(),
): QuestionDossier {
  const { resourceCard, evidenceItem } = createManualResourceCard(dossier, input, now);
  const withoutDuplicateResource = dossier.resourceCards.filter((resource) => resource.id !== resourceCard.id);
  const withoutDuplicateEvidence = dossier.evidenceItems.filter((evidence) => evidence.id !== evidenceItem.id);

  return {
    ...dossier,
    updatedAt: now,
    maturityStage: dossier.maturityStage === 'seed_question' ? 'resource_mapping' : dossier.maturityStage,
    resourceCards: [...withoutDuplicateResource, resourceCard],
    evidenceItems: [...withoutDuplicateEvidence, evidenceItem],
  };
}
