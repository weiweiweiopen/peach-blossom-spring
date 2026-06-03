import assert from 'node:assert/strict';
import test from 'node:test';

import { associationCorpus } from '../src/association/corpus.js';
import { generateAssociationReport, parseSeedKeywords } from '../src/association/engine.js';
import { generatePrototypeWikiPage } from '../src/association/prototypeMarkdown.js';

test('association parser extracts seed keywords', () => {
  assert.deepEqual(parseSeedKeywords('DIY microscopy, handmade sensors, sensors!').slice(0, 3), [
    'sensors',
    'diy',
    'handmade',
  ]);
});

test('association parser maps Chinese seed terms to corpus keywords', () => {
  const keywords = parseSeedKeywords('用廢棄感測器和濕實驗室筆記，做一個讓社群聽見水質變化的聲音裝置');

  assert.ok(keywords.includes('sensor'));
  assert.ok(keywords.includes('lab'));
  assert.ok(keywords.includes('community'));
  assert.ok(keywords.includes('sound'));
});

test('association report retrieves source cards and generates cited futures', () => {
  const report = generateAssociationReport(
    'A curatorial note about DIY microscopy, bio art, wet labs, and community workshops.',
    associationCorpus,
  );

  assert.ok(report.matchedCards.length > 0);
  assert.ok(report.expandedCards.length > 0);
  assert.ok(report.depthMetrics.directMatches > 0);
  assert.ok(report.depthMetrics.depthScore >= 0);
  assert.ok(Array.isArray(report.linkedCards));
  assert.ok(report.futures.length >= 3);
  assert.ok(report.futures.length <= 5);
  assert.ok(report.futures.some((future) => future.citations.length > 0));

  const evidenceIds = new Set([...report.matchedCards, ...report.expandedCards].map((card) => card.id));
  for (const future of report.futures) {
    for (const citation of future.citations) {
      assert.ok(evidenceIds.has(citation.id));
    }
  }
});

test('association report marks low evidence seeds as low confidence', () => {
  const report = generateAssociationReport('zzzzqqqq xxyyqqq nnnnomatch', associationCorpus);

  assert.equal(report.matchedCards.length, 0);
  assert.equal(report.futures[0].confidence, 'low');
  assert.ok(report.futures[0].caveat);
});

test('association prototype renders a markdown wiki page with mapping explanation', () => {
  const page = generatePrototypeWikiPage(
    '用廢棄感測器和濕實驗室筆記，做一個讓社群聽見水質變化的聲音裝置',
    associationCorpus,
  );

  assert.match(page.markdown, /^# .+未來實作/m);
  assert.match(page.markdown, /## 專案摘要/);
  assert.match(page.markdown, /## 語句／語具解構/);
  assert.match(page.markdown, /## 感知層映射/);
  assert.match(page.markdown, /## 取回的 Wiki 頁面/);
  assert.match(page.markdown, /## Recursive Link Reading／深讀鏈/);
  assert.match(page.markdown, /## Depth Gate／深度門檻/);
  assert.match(page.markdown, /## Connected Papers 語義向量層/);
  assert.match(page.markdown, /### Related Articles/);
  assert.match(page.markdown, /### Missing Bridges/);
  assert.match(page.markdown, /## 材料與設定/);
  assert.match(page.markdown, /## 參與者與角色/);
  assert.match(page.markdown, /## Wiki 文件化模板/);
  assert.match(page.markdown, /```mermaid/);
  assert.match(page.llmPrompt, /# Association Universal Editorial Writing Prompt/);
  assert.match(page.markdown, /## 取回的 Wiki 頁面/);
  assert.match(page.markdown, /## Recursive Link Reading／深讀鏈/);
  assert.match(page.markdown, /## Depth Gate／深度門檻/);
  assert.match(page.markdown, /## Connected Papers 語義向量層/);
  assert.match(page.markdown, /## Association 四步任務/);
  assert.match(page.llmPrompt, /這不是摘要工具/);
  assert.ok(page.report.futures.length >= 3);
  assert.ok(page.semanticContext.relatedCards.length > 0);
});
