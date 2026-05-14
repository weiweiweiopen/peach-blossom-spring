export type EvidenceType =
  | 'player_provided'
  | 'transcript_grounded'
  | 'persona_extrapolated'
  | 'external_source'
  | 'speculative_synthesis';

export type DossierMaturityStage =
  | 'seed_question'
  | 'npc_digesting'
  | 'resource_mapping'
  | 'contradiction_review'
  | 'proposal_draft'
  | 'field_test_ready'
  | 'archived';

export type CouncilReviewKind =
  | 'npc_commentary'
  | 'council_synthesis'
  | 'contradiction_encounter'
  | 'commons_check'
  | 'resource_fit_check';

export type ResourceSourceType =
  | 'supplier'
  | 'residency'
  | 'forum'
  | 'reference'
  | 'event'
  | 'platform'
  | 'artist'
  | 'tool'
  | 'community'
  | 'open_call';

export type RiskCategory =
  | 'cultural_extraction'
  | 'labor_exploitation'
  | 'bodily_consent'
  | 'sustainability'
  | 'privacy'
  | 'safety'
  | 'over_commercialization'
  | 'evidence_confusion';

export type RiskLevel = 'low' | 'medium' | 'high' | 'unknown';

export interface EvidenceItem {
  id: string;
  evidenceType: EvidenceType;
  summary: string;
  sourceLabel?: string;
  sourceUrl?: string;
  sourceId?: string;
  quote?: string;
  fetchedAt?: number;
  caution?: string;
}

export interface CouncilReview {
  id: string;
  kind: CouncilReviewKind;
  reviewerId?: string;
  reviewerName?: string;
  createdAt: number;
  summary: string;
  critique: string;
  suggestedRevision?: string;
  evidenceType: EvidenceType;
  evidenceItemIds: string[];
}

export interface ResourceCard {
  id: string;
  title: string;
  sourceUrl?: string;
  sourceType: ResourceSourceType;
  summary: string;
  relevanceReason: string;
  opennessScore?: number;
  laborEthicsScore?: number;
  commonsScore?: number;
  costOrAccess?: string;
  region?: string;
  deadline?: string;
  freshnessDate?: string;
  fetchedAt?: number;
  caution?: string;
  evidenceType: Extract<EvidenceType, 'external_source' | 'player_provided'> | 'ngm_linked';
}

export interface RiskCheck {
  id: string;
  category: RiskCategory;
  level: RiskLevel;
  question: string;
  finding: string;
  mitigation?: string;
  evidenceType: EvidenceType;
}

export interface ProposalVersion {
  id: string;
  version: number;
  createdAt: number;
  title: string;
  howToMake: string;
  whoForAndWith: string;
  commonsContribution: string;
  nextExperiment: string;
  openQuestions: string[];
  riskCheckIds: string[];
  evidenceItemIds: string[];
  evidenceType: EvidenceType;
}

export interface QuestionDossier {
  id: string;
  questionId?: string;
  petId?: string;
  ownerId: string;
  title: string;
  originalQuestion: string;
  createdAt: number;
  updatedAt: number;
  maturityStage: DossierMaturityStage;
  tags: string[];
  evidenceItems: EvidenceItem[];
  councilReviews: CouncilReview[];
  resourceCards: ResourceCard[];
  proposalVersions: ProposalVersion[];
  riskChecks: RiskCheck[];
  commonsContribution?: string;
}

export const EVIDENCE_TYPES: readonly EvidenceType[] = [
  'player_provided',
  'transcript_grounded',
  'persona_extrapolated',
  'external_source',
  'speculative_synthesis',
] as const;

export const RISK_CATEGORIES: readonly RiskCategory[] = [
  'cultural_extraction',
  'labor_exploitation',
  'bodily_consent',
  'sustainability',
  'privacy',
  'safety',
  'over_commercialization',
  'evidence_confusion',
] as const;
