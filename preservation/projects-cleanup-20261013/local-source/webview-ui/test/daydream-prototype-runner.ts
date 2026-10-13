import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { daydreamCorpus } from '../src/daydream/corpus.js';
import { generatePrototypeWikiPage } from '../src/daydream/prototypeMarkdown.js';

const defaultSeed = '用廢棄感測器和濕實驗室筆記，做一個讓社群聽見水質變化的聲音裝置';
const seed = process.argv.slice(2).join(' ').trim() || defaultSeed;
const testDir = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(testDir, 'output/daydream-prototype-page.md');
const promptPath = resolve(testDir, 'output/daydream-llm-prompt.md');
const page = generatePrototypeWikiPage(seed, daydreamCorpus);

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, page.markdown, 'utf8');
writeFileSync(promptPath, page.llmPrompt, 'utf8');

console.log(`原始 Seed：${seed}`);
console.log(`已生成 prototype 草稿：${outputPath}`);
console.log(`已生成 LLM 中文提示：${promptPath}`);
console.log(`檔名 slug：${page.fileTitle}`);
console.log(`直接命中來源卡數：${page.report.matchedCards.length}`);
console.log(`圖譜擴展來源卡數：${page.report.expandedCards.length}`);
