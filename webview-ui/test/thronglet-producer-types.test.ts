import assert from 'node:assert/strict';
import test from 'node:test';

import { EVIDENCE_TYPES, RISK_CATEGORIES, type QuestionDossier } from '../src/throngletProducer/types.js';

test('producer evidence vocabulary preserves source separation', () => {
  assert.deepEqual([...EVIDENCE_TYPES], [
    'player_provided',
    'transcript_grounded',
    'persona_extrapolated',
    'external_source',
    'speculative_synthesis',
  ]);
});

test('producer risk categories include commons and evidence safeguards', () => {
  assert.ok(RISK_CATEGORIES.includes('cultural_extraction'));
  assert.ok(RISK_CATEGORIES.includes('labor_exploitation'));
  assert.ok(RISK_CATEGORIES.includes('over_commercialization'));
  assert.ok(RISK_CATEGORIES.includes('evidence_confusion'));
});

test('question dossier can represent the first safe seed stage without runtime wiring', () => {
  const now = Date.now();
  const dossier: QuestionDossier = {
    id: 'dossier-demo',
    ownerId: 'owner-demo',
    title: 'Can a question become accountable?',
    originalQuestion: 'How can my unfinished art-tech idea mature without becoming a startup pitch?',
    createdAt: now,
    updatedAt: now,
    maturityStage: 'seed_question',
    tags: ['commons', 'question-pet'],
    evidenceItems: [],
    councilReviews: [],
    resourceCards: [],
    proposalVersions: [],
    riskChecks: [],
  };

  assert.equal(dossier.maturityStage, 'seed_question');
  assert.equal(dossier.proposalVersions.length, 0);
});
