import assert from 'node:assert/strict';
import test from 'node:test';

import { assertCleanPublicArtifact, inspectPublicArtifact } from '../src/daydream/artifactGuard.js';

test('public artifact guard accepts artwork-facing language', () => {
  assert.doesNotThrow(() =>
    assertCleanPublicArtifact(`<!doctype html><html><body><h1>Fermentation Circuit Almanac</h1><p>紙張留下手、氣味與季節。</p></body></html>`),
  );
});

test('public artifact guard rejects backend workflow labels in visible text', () => {
  const result = inspectPublicArtifact('<main><h1>Step 1 recursive linked-source reading</h1><p>source trail</p></main>');

  assert.equal(result.ok, false);
  assert.ok(result.violations.length >= 2);
});

test('public artifact guard rejects source graph and localized process language', () => {
  const result = inspectPublicArtifact('<main><p>source graph 後台 系統語言 プロンプト</p></main>');

  assert.equal(result.ok, false);
  assert.ok(result.violations.some((violation) => /source\\s\*graph|source/.test(violation.pattern)));
  assert.ok(result.violations.length >= 3);
});

test('public artifact guard ignores hidden comments but checks visible svg text', () => {
  const hiddenOnly = inspectPublicArtifact('<!-- workflow sourceCards debug --><main><svg><text>Living Alphabet</text></svg></main>');
  assert.equal(hiddenOnly.ok, true);

  const visibleSvg = inspectPublicArtifact('<main><svg><text>generated type</text></svg></main>');
  assert.equal(visibleSvg.ok, false);
});
