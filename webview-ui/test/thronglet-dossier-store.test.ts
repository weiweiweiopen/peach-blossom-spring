import assert from 'node:assert/strict';
import test from 'node:test';

import { createMockCouncilReviewForDossier, createSeedDossierFromPet, type DossierPetSeedInput } from '../src/throngletProducer/localDossierStore.js';

const demoPet: DossierPetSeedInput = {
  id: 'pet-demo',
  ownerId: 'owner-demo',
  displayName: 'Demo Question Pet',
  question: 'How can a wearable sound project stay open and community accountable?',
  skill: 'wearable sound open hardware',
};

test('creates seed dossier from a pet without runtime side effects', () => {
  const dossier = createSeedDossierFromPet(demoPet, 1234);

  assert.equal(dossier.id, 'dossier-pet-demo');
  assert.equal(dossier.petId, demoPet.id);
  assert.equal(dossier.maturityStage, 'seed_question');
  assert.equal(dossier.evidenceItems[0]?.evidenceType, 'player_provided');
  assert.equal(dossier.evidenceItems[0]?.summary, demoPet.question);
  assert.ok(dossier.tags.includes('wearable'));
  assert.ok(dossier.riskChecks.some((risk) => risk.category === 'over_commercialization'));
  assert.ok(dossier.riskChecks.some((risk) => risk.category === 'evidence_confusion'));
  assert.equal(dossier.councilReviews.length, 0);
  assert.equal(dossier.resourceCards.length, 0);
  assert.equal(dossier.proposalVersions.length, 0);
});

test('creates a mock council review with explicit speculative evidence label', () => {
  const dossier = createSeedDossierFromPet(demoPet, 1234);
  const review = createMockCouncilReviewForDossier(dossier, 5678);

  assert.equal(review.kind, 'commons_check');
  assert.equal(review.evidenceType, 'speculative_synthesis');
  assert.equal(review.evidenceItemIds.length, 1);
  assert.match(review.critique, /commons contribution/);
  assert.match(review.suggestedRevision ?? '', /what can be made/);
});
