import type { ProposalVersion, QuestionDossier } from './types.js';

export interface ProposalDraftResult {
  ok: boolean;
  proposal?: ProposalVersion;
  reason?: string;
}

function excerpt(text: string, maxLength: number): string {
  const normalized = text.trim().replace(/\s+/g, ' ');
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}…` : normalized;
}

function hasEvidence(dossier: QuestionDossier): boolean {
  return dossier.evidenceItems.length > 0;
}

function hasReview(dossier: QuestionDossier): boolean {
  return dossier.councilReviews.length > 0;
}

export function canCreateGuardedProposalDraft(dossier: QuestionDossier): ProposalDraftResult {
  if (!hasEvidence(dossier)) {
    return { ok: false, reason: 'A proposal draft needs at least one evidence item.' };
  }
  if (!hasReview(dossier)) {
    return { ok: false, reason: 'A proposal draft needs at least one council review or mock review.' };
  }
  if (dossier.riskChecks.length === 0) {
    return { ok: false, reason: 'A proposal draft needs linked risk checks.' };
  }
  return { ok: true };
}

export function createGuardedProposalDraft(dossier: QuestionDossier, now = Date.now()): ProposalDraftResult {
  const readiness = canCreateGuardedProposalDraft(dossier);
  if (!readiness.ok) return readiness;

  const nextVersion = dossier.proposalVersions.length + 1;
  const evidenceItemIds = dossier.evidenceItems.map((item) => item.id);
  const riskCheckIds = dossier.riskChecks.map((risk) => risk.id);
  const latestReview = dossier.councilReviews.at(-1);
  const question = excerpt(dossier.originalQuestion, 140);

  return {
    ok: true,
    proposal: {
      id: `proposal-${dossier.id}-v${nextVersion}`,
      version: nextVersion,
      createdAt: now,
      title: `${dossier.title} · guarded draft ${nextVersion}`,
      howToMake: `Start with one reversible prototype around: ${question}. Keep it small enough to test with materials, documentation, and a public critique note before any larger production step.`,
      whoForAndWith: 'Name the community, collaborators, maintainers, and affected bodies before naming markets or audiences. Treat participants as co-producers rather than users to optimize.',
      commonsContribution: 'Define what remains shareable after the project: documentation, repair notes, open hardware/software fragments, workshop formats, source files, or a reusable question map.',
      nextExperiment: latestReview?.suggestedRevision
        ? `Run one field test based on the council revision: ${latestReview.suggestedRevision}`
        : 'Run one field test that asks how the question can be made, who it is for/with, and what it leaves for others.',
      openQuestions: [
        'What evidence is still only speculative synthesis?',
        'Who needs consent, credit, care, or payment before this becomes production?',
        'What part of the work can be documented, forked, repaired, or reused by others?',
      ],
      riskCheckIds,
      evidenceItemIds,
      evidenceType: 'speculative_synthesis',
    },
  };
}

export function withGuardedProposalDraft(dossier: QuestionDossier, now = Date.now()): ProposalDraftResult & { dossier?: QuestionDossier } {
  const existing = dossier.proposalVersions.at(-1);
  if (existing) {
    return { ok: true, proposal: existing, dossier };
  }

  const result = createGuardedProposalDraft(dossier, now);
  if (!result.ok || !result.proposal) return result;

  return {
    ...result,
    dossier: {
      ...dossier,
      updatedAt: now,
      maturityStage: 'proposal_draft',
      commonsContribution: result.proposal.commonsContribution,
      proposalVersions: [...dossier.proposalVersions, result.proposal],
    },
  };
}
