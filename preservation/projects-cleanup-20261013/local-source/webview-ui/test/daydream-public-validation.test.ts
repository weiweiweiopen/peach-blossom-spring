import assert from 'node:assert/strict';
import test from 'node:test';

import { findUnsupportedBioDetailTerms } from '../src/daydream/publicValidation.js';

test('public validation allows bio workshop details when retrieved evidence supports them', () => {
  const publicText = '工作坊把 E. coli 與 16S rRNA 當成可討論的實驗材料，讓玩家看見實驗性的判讀過程。';
  const evidenceText = 'Workshop notes mention Escherichia coli samples and 16S rRNA sequencing as part of the public workshop documentation.';

  assert.deepEqual(findUnsupportedBioDetailTerms(publicText, evidenceText), []);
});

test('public validation still blocks bio details absent from retrieved evidence', () => {
  const publicText = '小誌聲稱參與者使用 NCBI、Phred 與 lacZ 數據完成實驗。';
  const evidenceText = 'Workshop notes mention handmade sensors, textiles, and discussion exercises.';

  assert.deepEqual(findUnsupportedBioDetailTerms(publicText, evidenceText), ['NCBI', 'lacZ', 'Phred']);
});
