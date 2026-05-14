import { withGuardedProposalDraft } from './proposalDraft.js';
import type { CouncilReview, QuestionDossier, RiskCheck } from './types.js';

export interface DossierPetSeedInput {
  id: string;
  ownerId: string;
  displayName?: string;
  question: string;
  skill?: string;
}

export const DOSSIERS_KEY = 'pbs.throngletProducer.dossiers';

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function uuid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function tagsFromPet(pet: DossierPetSeedInput): string[] {
  return Array.from(new Set([
    ...(pet.skill ? pet.skill.toLowerCase().split(/[^\p{L}\p{N}]+/u) : []),
    ...pet.question.toLowerCase().split(/[^\p{L}\p{N}]+/u),
  ].filter((word) => word.length >= 3).slice(0, 10)));
}

function excerpt(text: string, maxLength: number): string {
  const normalized = text.trim().replace(/\s+/g, ' ');
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}…` : normalized;
}

function seedRiskChecks(now: number): RiskCheck[] {
  const checks: RiskCheck[] = [
    {
      id: uuid('risk'),
      category: 'over_commercialization',
      level: 'unknown',
      question: 'Is the question being reduced too quickly into monetization, growth, or pitch logic?',
      finding: 'Not reviewed yet. Keep the first dossier stage as a question-maturation record, not a business plan.',
      mitigation: 'Require commons contribution and evidence labels before proposal drafting.',
      evidenceType: 'speculative_synthesis',
    },
    {
      id: uuid('risk'),
      category: 'evidence_confusion',
      level: 'unknown',
      question: 'Are player input, NPC/persona extrapolation, transcript-grounded claims, and external sources separated?',
      finding: 'Not reviewed yet. The seed dossier starts with only player-provided evidence.',
      mitigation: 'Attach evidenceType to council reviews, resource cards, and proposal versions.',
      evidenceType: 'speculative_synthesis',
    },
  ];
  return checks.map((risk, index) => ({ ...risk, id: `${risk.id}-${index}-${now.toString(36)}` }));
}

export function createMockCouncilReviewForDossier(dossier: QuestionDossier, now = Date.now()): CouncilReview {
  return {
    id: `review-${dossier.id}-commons-seed`,
    kind: 'commons_check',
    reviewerId: 'mock-council-commons-steward',
    reviewerName: 'Commons Steward Mock Review',
    createdAt: now,
    summary: 'Seed review only: keep this question in inquiry mode before turning it into a proposal.',
    critique: `The question "${excerpt(dossier.originalQuestion, 120)}" needs one clear commons contribution, one next experiment, and explicit evidence labels before it should become a draft proposal.`,
    suggestedRevision: 'Rewrite the question as: what can be made, who it is for/with, and what remains shareable or repairable afterward?',
    evidenceType: 'speculative_synthesis',
    evidenceItemIds: dossier.evidenceItems.map((item) => item.id),
  };
}

function withSeedReview(dossier: QuestionDossier, now = Date.now()): QuestionDossier {
  if (dossier.councilReviews.some((review) => review.id === `review-${dossier.id}-commons-seed`)) {
    return dossier;
  }
  return {
    ...dossier,
    updatedAt: now,
    maturityStage: 'contradiction_review',
    councilReviews: [...dossier.councilReviews, createMockCouncilReviewForDossier(dossier, now)],
  };
}

export function createSeedDossierFromPet(pet: DossierPetSeedInput, now = Date.now()): QuestionDossier {
  return {
    id: `dossier-${pet.id}`,
    questionId: pet.id,
    petId: pet.id,
    ownerId: pet.ownerId,
    title: pet.displayName || 'Question Pet Dossier',
    originalQuestion: pet.question,
    createdAt: now,
    updatedAt: now,
    maturityStage: 'seed_question',
    tags: tagsFromPet(pet),
    evidenceItems: [
      {
        id: `evidence-${pet.id}-question`,
        evidenceType: 'player_provided',
        summary: pet.question,
        sourceLabel: 'Original player question',
        fetchedAt: now,
      },
    ],
    councilReviews: [],
    resourceCards: [],
    proposalVersions: [],
    riskChecks: seedRiskChecks(now),
    commonsContribution: undefined,
  };
}

export class LocalDossierStore {
  listDossiers(): QuestionDossier[] {
    return safeRead<QuestionDossier[]>(DOSSIERS_KEY, []);
  }

  getDossierForPet(petId: string): QuestionDossier | null {
    return this.listDossiers().find((dossier) => dossier.petId === petId) ?? null;
  }

  ensureSeedDossierForPet(pet: DossierPetSeedInput): QuestionDossier {
    const dossiers = this.listDossiers();
    const existing = dossiers.find((dossier) => dossier.petId === pet.id);
    if (existing) return existing;
    const created = createSeedDossierFromPet(pet);
    localStorage.setItem(DOSSIERS_KEY, JSON.stringify([created, ...dossiers]));
    return created;
  }

  ensureMockCouncilReview(pet: DossierPetSeedInput): QuestionDossier {
    const dossiers = this.listDossiers();
    const existingIndex = dossiers.findIndex((dossier) => dossier.petId === pet.id);
    const baseDossier = existingIndex >= 0 ? dossiers[existingIndex] : createSeedDossierFromPet(pet);
    const reviewed = withSeedReview(baseDossier);
    const nextDossiers = existingIndex >= 0
      ? dossiers.map((dossier, index) => index === existingIndex ? reviewed : dossier)
      : [reviewed, ...dossiers];
    localStorage.setItem(DOSSIERS_KEY, JSON.stringify(nextDossiers));
    return reviewed;
  }

  ensureGuardedProposalDraft(pet: DossierPetSeedInput): QuestionDossier {
    const dossiers = this.listDossiers();
    const existingIndex = dossiers.findIndex((dossier) => dossier.petId === pet.id);
    const baseDossier = existingIndex >= 0 ? dossiers[existingIndex] : createSeedDossierFromPet(pet);
    const reviewed = withSeedReview(baseDossier);
    const result = withGuardedProposalDraft(reviewed);
    const drafted = result.dossier ?? reviewed;
    const nextDossiers = existingIndex >= 0
      ? dossiers.map((dossier, index) => index === existingIndex ? drafted : dossier)
      : [drafted, ...dossiers];
    localStorage.setItem(DOSSIERS_KEY, JSON.stringify(nextDossiers));
    return drafted;
  }

  clearLocalDemo(): void {
    localStorage.removeItem(DOSSIERS_KEY);
  }
}

export const dossierStore = new LocalDossierStore();
