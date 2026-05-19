import assert from 'node:assert/strict';
import test from 'node:test';

import { assertCleanPublicArtifact, extractPublicArtifactText } from '../src/daydream/artifactGuard.js';
import { daydreamCorpus } from '../src/daydream/corpus.js';
import { runDaydreamWorkflow } from '../src/daydream/daydreamWorkflow.js';
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

test('association rendered final HTML has no backend pollution or Daydream label', () => {
  const artifact = runDaydreamWorkflow('bioart electronic music wearable textile sensors', daydreamCorpus).step4.publicArtifact;

  for (const variant of variants) {
    const html = renderDaydreamPublicArtifactHtml(artifact, variant);
    assertCleanPublicArtifact(html);
    const visibleText = extractPublicArtifactText(html);
    assert.equal(/Daydream/i.test(visibleText), false);
    assert.equal(/privateTrace|sourceTrail|relationPaths|maturityScore/i.test(visibleText), false);
    assert.match(visibleText, /Association/);
  }
});
