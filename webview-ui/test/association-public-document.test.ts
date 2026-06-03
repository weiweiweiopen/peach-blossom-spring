import assert from 'node:assert/strict';
import test from 'node:test';

import { assertCleanPublicArtifact, extractPublicArtifactText } from '../src/association/artifactGuard.js';
import { renderAssociationFeedbackSection } from '../src/association/associationFeedback.js';
import { associationCorpus } from '../src/association/corpus.js';
import { runAssociationWorkflow } from '../src/association/associationWorkflow.js';
import { renderOfficialTemplateArtifactHtml } from '../src/association/officialTemplateRenderer.js';
import { renderAssociationPublicArtifactHtml, type AssociationHtmlLayoutVariant } from '../src/association/publicArtifactHtml.js';

const variants: AssociationHtmlLayoutVariant[] = ['pbs-reset-title', 'soft-commons-zine', 'aino-motion-grid'];

test('association public document exposes no private trace fields', () => {
  const artifact = runAssociationWorkflow('bioart electronic music wearable textile sensors', associationCorpus).step4.publicArtifact;
  const serialized = JSON.stringify(artifact);

  assert.equal(artifact.schemaVersion, 'association-public-document-v1');
  assert.equal(Object.hasOwn(artifact, 'privateTrace'), false);
  assert.equal(Object.hasOwn(artifact, 'seed'), false);
  assert.equal(serialized.includes('sourceTrail'), false);
  assert.equal(serialized.includes('relationPaths'), false);
  assert.equal(serialized.includes('maturityScore'), false);
});

test('association rendered final HTML has no backend pollution or system label', () => {
  const artifact = runAssociationWorkflow('bioart electronic music wearable textile sensors', associationCorpus).step4.publicArtifact;

  for (const variant of variants) {
    const html = renderAssociationPublicArtifactHtml(artifact, variant);
    assertCleanPublicArtifact(html);
    const visibleText = extractPublicArtifactText(html);
    assert.equal(/Association|Association/i.test(visibleText), false);
    assert.equal(/privateTrace|sourceTrail|relationPaths|maturityScore/i.test(visibleText), false);
  }
});

test('association official final HTML includes template 1 and safe feedback metadata', () => {
  const artifact = runAssociationWorkflow('bioart electronic music wearable textile sensors', associationCorpus).step4.publicArtifact;
  const template = { filename: '01-pbs-reset-title-kinetic.html', html: '<style>.page{display:block}</style>' };
  const html = `${renderOfficialTemplateArtifactHtml(artifact, 'pbs-reset-title', template)}${renderAssociationFeedbackSection('ja', template.filename)}`;

  assert.match(html, /data-official-template="01-pbs-reset-title-kinetic\.html"/);
  assert.match(html, /pbs:zine-repair-feedback/);
  assert.match(html, /data-pbs-zine-repair-feedback/);
  assert.match(html, /pbs:zine-repair-request/);
  assert.match(html, /zineTitle: document\.title/);
  assert.match(html, /page: "feedback"/);
  assert.match(html, /language = "ja"/);
  assert.match(html, /template = "01-pbs-reset-title-kinetic\.html"/);
  assert.match(html, /timestamp: Date\.now\(\)/);
  assert.doesNotMatch(html, /seed|dialogue_history|privateTrace/);
});
