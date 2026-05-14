import assert from 'node:assert/strict';
import test from 'node:test';
import { createMockCouncilReviewForDossier, createSeedDossierFromPet, type DossierPetSeedInput } from '../src/throngletProducer/localDossierStore.js';
import { createGuardedProposalDraft, withGuardedProposalDraft } from '../src/throngletProducer/proposalDraft.js';

const demoPet: DossierPetSeedInput = {
  id: 'pet-proposal',
  ownerId: 'owner-demo',
  displayName: 'Community Sound Pet',
  question: 'How can a wearable sound project stay open, repairable, and community accountable?',
  skill: 'wearable sound open hardware',
};

test('refuses proposal draft before council review exists', () => {
  const dossier = createSeedDossierFromPet(demoPet, 1000);
  const result = createGuardedProposalDraft(dossier, 2000);

  assert.equal(result.ok, false);
  assert.match(result.reason ?? '', /council review/);
});

test('creates guarded speculative proposal from reviewed dossier', () => {
  const seed = createSeedDossierFromPet(demoPet, 1000);
  const reviewed = {
    ...seed,
    councilReviews: [createMockCouncilReviewForDossier(seed, 1500)],
  };
  const result = createGuardedProposalDraft(reviewed, 2000);

  assert.equal(result.ok, true);
  assert.ok(result.proposal);
  assert.equal(result.proposal.evidenceType, 'speculative_synthesis');
  assert.deepEqual(result.proposal.evidenceItemIds, reviewed.evidenceItems.map((item) => item.id));
  assert.deepEqual(result.proposal.riskCheckIds, reviewed.riskChecks.map((risk) => risk.id));
  assert.match(result.proposal.howToMake, /reversible prototype/);
  assert.match(result.proposal.whoForAndWith, /co-producers/);
  assert.match(result.proposal.commonsContribution, /shareable/);
  assert.doesNotMatch(result.proposal.howToMake, /monetization|growth|pitch/i);
});

test('adds proposal to dossier and advances maturity without duplicating drafts', () => {
  const seed = createSeedDossierFromPet(demoPet, 1000);
  const reviewed = {
    ...seed,
    maturityStage: 'contradiction_review' as const,
    councilReviews: [createMockCouncilReviewForDossier(seed, 1500)],
  };

  const first = withGuardedProposalDraft(reviewed, 2000);
  assert.equal(first.ok, true);
  assert.equal(first.dossier?.maturityStage, 'proposal_draft');
  assert.equal(first.dossier?.proposalVersions.length, 1);

  const second = withGuardedProposalDraft(first.dossier!, 3000);
  assert.equal(second.ok, true);
  assert.equal(second.dossier?.proposalVersions.length, 1);
  assert.equal(second.proposal?.version, 1);
});
