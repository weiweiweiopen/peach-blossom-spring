import assert from 'node:assert/strict';
import test from 'node:test';

import { estimateQuestionSpecificity, scoreQuestionTraversal } from '../src/traversal/questionQuality.js';
import type { WikiSearchResult } from '../src/wikiSearch.js';

function result(title: string, sourceFamily: string, url: string): WikiSearchResult {
  return {
    title,
    sourceFamily,
    url,
    score: 1,
    description: `${title} documents a concrete workshop, material practice, community context, and source evidence for traversal scoring.`,
  };
}

test('specificity rewards concrete scoped questions', () => {
  assert.ok(estimateQuestionSpecificity('藝術') < 40);
  assert.ok(estimateQuestionSpecificity('能否用紅茶菌來設計多物種建築？請用 PBS source evidence 回答') > 70);
});

test('traversal quality scores evidence pages and source-family diversity', () => {
  const quality = scoreQuestionTraversal('比較 KOBAKANT 和 Hackteria 的電子織品教學如何走向作品？', [
    result('Playing with electronic textiles', 'HOW TO GET WHAT YOU WANT / KOBAKANT', 'https://www.kobakant.at/DIY/?p=9812'),
    result('Fluffy MIDI', 'HOW TO GET WHAT YOU WANT / KOBAKANT', 'https://www.kobakant.at/DIY/?p=9948'),
    result('BioElectronics and BioMaterials Workshop', 'Hackteria', 'https://www.hackteria.org/wiki/BioElectronics'),
    result('Archive HOME MADE', 'SGMK', 'https://wiki.sgmk-ssam.ch/wiki/Archive_HOME_MADE'),
  ]);
  assert.equal(quality.status, 'ready');
  assert.equal(quality.pageCount, 4);
  assert.equal(quality.sourceFamilyCount, 3);
  assert.ok(quality.evidenceReadiness >= 70);
  assert.ok(quality.crossSystemPotential >= 80);
});

test('traversal quality marks missing evidence as unavailable', () => {
  const quality = scoreQuestionTraversal('這是什麼？', []);
  assert.equal(quality.pageCount, 0);
  assert.ok(quality.evidenceReadiness < 20);
  assert.ok(quality.caveats.some((item) => item.includes('沒有找到')));
});
