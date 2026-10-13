import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { generateConnectedPapersMarkdown } from "../src/daydream/connectedPapers.js";
import { daydreamCorpus } from "../src/daydream/corpus.js";

const testDir = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(testDir, "output/connected-papers-grounded-report.md");
const markdown = generateConnectedPapersMarkdown(daydreamCorpus);

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, markdown, "utf8");

console.log(`已生成 grounded connected-paper report：${outputPath}`);
console.log(`來源卡數：${daydreamCorpus.cards.length}`);
console.log(`圖譜邊數：${daydreamCorpus.edges.length}`);
