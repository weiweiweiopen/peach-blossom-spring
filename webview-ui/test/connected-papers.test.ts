import assert from "node:assert/strict";
import test from "node:test";

import { buildSemanticVectorContext, generateConnectedPapersMarkdown } from "../src/association/connectedPapers.js";
import { associationCorpus } from "../src/association/corpus.js";

test("connected-paper report is grounded in exported source cards", () => {
  const markdown = generateConnectedPapersMarkdown(associationCorpus);

  assert.match(markdown, /## 1\. Related Articles/);
  assert.match(markdown, /## 2\. Missing Bridges/);
  assert.match(markdown, /## 3\. Future Papers/);
  assert.match(markdown, /Hackteria/);
  assert.match(markdown, /SGMK/);
  assert.match(markdown, /How To Get What You Want \/ Kobakant/);
  assert.match(markdown, /只使用 `sourceCards\.json`/);
  assert.doesNotMatch(markdown, /Hackteria 不會被預設為水，除非 page 文字或 keyword 真的出現 water。[\s\S]*Hackteria = water/);
});

test("connected-paper semantic context acts as a grounded vector layer", () => {
  const anchors = associationCorpus.cards
    .filter((card) => card.source === "htgwyw" && /wearable sound/i.test(card.title))
    .slice(0, 2);
  const context = buildSemanticVectorContext(associationCorpus, anchors);

  assert.ok(context.anchorCards.length > 0);
  assert.ok(context.relatedCards.length > 0);
  assert.ok(context.bridgeCards.length > 0);
  assert.ok(context.futureDirections.length > 0);
  assert.ok(context.relatedCards.every((item) => item.score > 0));
  assert.ok(context.bridgeCards.some((bridge) => bridge.sharedTerms.length > 0));
  assert.ok(context.futureDirections.some((future) => future.evidenceCards.length > 1));
});
