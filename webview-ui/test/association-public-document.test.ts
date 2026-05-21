import assert from 'node:assert/strict';
import test from 'node:test';

import { assertCleanPublicArtifact, extractPublicArtifactText } from '../src/daydream/artifactGuard.js';
import { renderAssociationFeedbackSection } from '../src/daydream/associationFeedback.js';
import { daydreamCorpus } from '../src/daydream/corpus.js';
import { runDaydreamWorkflow } from '../src/daydream/daydreamWorkflow.js';
import { renderOfficialTemplateArtifactHtml } from '../src/daydream/officialTemplateRenderer.js';
import { renderDaydreamPublicArtifactHtml, type DaydreamHtmlLayoutVariant } from '../src/daydream/publicArtifactHtml.js';

const variants: DaydreamHtmlLayoutVariant[] = ['pbs-reset-title', 'soft-commons-zine', 'aino-motion-grid'];

test('association public document exposes no private trace fields', () => {
  const artifact = runDaydreamWorkflow('bioart electronic music wearable textile sensors', daydreamCorpus).step4.publicArtifact;
  const serialized = JSON.stringify(artifact);

  assert.equal(artifact.schemaVersion, 'association-public-document-v1');
  assert.equal(Object.hasOwn(artifact, 'privateTrace'), false);
  assert.equal(Object.hasOwn(artifact, 'seed'), false);
  assert.equal(serialized.includes('sourceTrail'), false);
  assert.equal(serialized.includes('relationPaths'), false);
  assert.equal(serialized.includes('maturityScore'), false);
});

test('association rendered final HTML has no backend pollution or system label', () => {
  const artifact = runDaydreamWorkflow('bioart electronic music wearable textile sensors', daydreamCorpus).step4.publicArtifact;

  for (const variant of variants) {
    const html = renderDaydreamPublicArtifactHtml(artifact, variant);
    assertCleanPublicArtifact(html);
    const visibleText = extractPublicArtifactText(html);
    assert.equal(/Daydream|Association/i.test(visibleText), false);
    assert.equal(/privateTrace|sourceTrail|relationPaths|maturityScore/i.test(visibleText), false);
  }
});

test('association official final HTML includes template 1 and safe feedback metadata', () => {
  const artifact = runDaydreamWorkflow('bioart electronic music wearable textile sensors', daydreamCorpus).step4.publicArtifact;
  const template = { filename: '01-pbs-reset-title-kinetic.html', html: '<style>.page{display:block}</style>' };
  const html = `${renderOfficialTemplateArtifactHtml(artifact, 'pbs-reset-title', template)}${renderAssociationFeedbackSection('ja', template.filename)}`;

  assert.match(html, /data-official-template="01-pbs-reset-title-kinetic\.html"/);
  assert.match(html, /pbs:zine-page-feedback/);
  assert.match(html, /data-pbs-feedback-icon="black-broken-heart"/);
  assert.match(html, /class="pbs-feedback-broken-heart"/);
  assert.match(html, /💔︎/u);
  assert.match(html, /zineTitle: document\.title/);
  assert.match(html, /page: "feedback"/);
  assert.match(html, /language = "ja"/);
  assert.match(html, /template = "01-pbs-reset-title-kinetic\.html"/);
  assert.match(html, /timestamp: Date\.now\(\)/);
  assert.doesNotMatch(html, /seed|dialogue_history|privateTrace/);
});
