import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assertCleanPublicArtifact, extractPublicArtifactText } from '../src/daydream/artifactGuard.js';
import { renderAssociationFeedbackSection } from '../src/daydream/associationFeedback.js';
import { daydreamCorpus } from '../src/daydream/corpus.js';
import type { DaydreamCorpus, SourceCard } from '../src/daydream/engine.js';
import { parseSeedKeywords, generateDaydreamReport } from '../src/daydream/engine.js';
import { runDaydreamWorkflow } from '../src/daydream/daydreamWorkflow.js';
import { renderOfficialTemplateArtifactHtml } from '../src/daydream/officialTemplateRenderer.js';
import type { DaydreamPublicArtifactContent } from '../src/daydream/publicArtifactContent.js';

type AllowedFamily = 'SGMK' | 'Fabricademy' | 'HOW TO GET WHAT YOU WANT / KOBAKANT';

const seedSentence = '如何建造一個不會把人變成儀表版的烏托邦？';
const enabledSourceFamilies: AllowedFamily[] = ['SGMK', 'Fabricademy', 'HOW TO GET WHAT YOU WANT / KOBAKANT'];
const proxyUrl = 'https://solar-oracle-deepseek-proxy.dontmarryme.workers.dev/chat';
const requestOrigin = 'http://127.0.0.1:5177';
const officialTemplate = { filename: '01-pbs-reset-title-kinetic.html', html: '<style>.page{display:block}</style>' };
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../..');
const outDir = path.join(repoRoot, 'obsidian-vault/Review/zine-feedback');
const jsonPath = path.join(outDir, 'private-zine-proof-modern-pbs.json');
const mdPath = path.join(outDir, 'private-zine-proof-modern-pbs.md');
const publicHtmlPath = path.join(outDir, 'public-zine-modern-pbs-deepseek.html');

function sourceFamily(card: SourceCard): AllowedFamily | 'Hackteria' | 'Other' {
  const source = String(card.source ?? '').toLowerCase();
  const text = `${card.title ?? ''} ${card.path ?? ''} ${card.url ?? ''}`.toLowerCase();
  if (source === 'hackteria' || text.includes('hackteria')) return 'Hackteria';
  if (source === 'sgmk' || text.includes('/sgmk ')) return 'SGMK';
  if (text.includes('fabricademy')) return 'Fabricademy';
  if (source === 'htgwyw' || text.includes('kobakant') || text.includes('how to get what you want')) return 'HOW TO GET WHAT YOU WANT / KOBAKANT';
  return 'Other';
}

function allowed(card: SourceCard): boolean {
  const family = sourceFamily(card);
  return family !== 'Hackteria' && enabledSourceFamilies.includes(family as AllowedFamily);
}

function textOf(card: SourceCard): string {
  return `${card.title ?? ''}\n${card.excerpt ?? ''}\n${(card.keywords ?? []).join(' ')}\n${(card.tags ?? []).join(' ')}\n${(card.categories ?? []).join(' ')}\n${card.path ?? ''}`;
}

function expandedSeedKeywords(seed: string): string[] {
  const translatedSeedTerms = [
    /烏托邦/.test(seed) ? 'utopia' : '',
    /儀表/.test(seed) ? 'dashboard' : '',
  ].filter(Boolean);
  return Array.from(new Set([
    ...parseSeedKeywords(seed),
    ...translatedSeedTerms,
  ])).slice(0, 32);
}

function scoreCard(card: SourceCard, keywords: string[]): { score: number; matchedKeywords: string[] } {
  const haystack = textOf(card).toLowerCase();
  const matchedKeywords = keywords.filter((keyword) => haystack.includes(keyword.toLowerCase()));
  let score = matchedKeywords.length;
  const family = sourceFamily(card);
  if (family === 'Fabricademy') score += 4;
  if (matchedKeywords.length > 0) score += 2;
  return { score, matchedKeywords };
}

function compact(value: string, limit = 380): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, limit);
}

function citation(card: SourceCard) {
  return {
    title: card.title,
    sourceFamily: sourceFamily(card),
    path: card.path ?? null,
    url: card.url ?? null,
  };
}

function cleanPublicText(value: unknown): string {
  return String(value ?? '')
    .replace(/source\s*graph/gi, 'reading constellation')
    .replace(/source\s*trail/gi, 'reading path')
    .replace(/sources?/gi, 'materials')
    .replace(/backend/gi, 'studio')
    .replace(/traversal/gi, 'walk')
    .replace(/internal\s+process/gi, 'shared practice')
    .replace(/system\s+language/gi, 'house style')
    .replace(/prompts?/gi, 'questions')
    .replace(/workflows?/gi, 'rhythms')
    .replace(/Association/g, 'zine')
    .replace(/HTML|CSS|JavaScript|script/gi, 'page')
    .replace(/Hackteria/gi, 'a bio-art network')
    .replace(/來源圖譜/g, '閱讀星座')
    .replace(/來源圖/g, '閱讀星座')
    .replace(/來源軌跡/g, '閱讀路徑')
    .replace(/來源列表/g, '閱讀清單')
    .replace(/來源/g, '材料')
    .replace(/後台/g, '工作室')
    .replace(/內部流程/g, '共同練習')
    .replace(/提示詞/g, '問題')
    .replace(/提示/g, '問題')
    .replace(/系統語言/g, '語氣')
    .replace(/工作流/g, '節奏')
    .replace(/流程語言/g, '節奏')
    .trim();
}

function normalizeArticle(data: any): DaydreamPublicArtifactContent {
  const sections = Array.isArray(data.sections) ? data.sections.slice(0, 4) : [];
  const protocol = Array.isArray(data.protocol) ? data.protocol.slice(0, 4) : [];
  if (!data.title || !data.subtitle || !data.opening || !data.proposition || sections.length < 4 || protocol.length < 4) {
    throw new Error('model_json_missing_required_fields');
  }
  return {
    schemaVersion: 'association-public-document-v1',
    title: cleanPublicText(data.title),
    subtitle: cleanPublicText(data.subtitle),
    opening: cleanPublicText(data.opening),
    proposition: cleanPublicText(data.proposition),
    sections: sections.map((section: any, index: number) => ({
      id: `deepseek-section-${index + 1}`,
      title: cleanPublicText(section.title ?? `Section ${index + 1}`),
      body: cleanPublicText(section.body ?? ''),
      ...(section.pullQuote ? { pullQuote: cleanPublicText(section.pullQuote) } : {}),
    })),
    protocol: protocol.map((item: any, index: number) => ({
      title: cleanPublicText(item.title ?? `Step ${index + 1}`),
      body: cleanPublicText(item.body ?? ''),
    })),
    quietCaveat: cleanPublicText(data.quietCaveat ?? ''),
    approvedForPublicLayout: true,
  };
}

function extractJsonObject(text: string): any {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
  try { return JSON.parse(trimmed); } catch {}
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
  throw new Error('model_json_parse_failure');
}

async function requestDeepSeekJson(userPrompt: string, maxTokens = 900, repair = true) {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  try {
    const response = await fetch(proxyUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Origin: requestOrigin },
      body: JSON.stringify({
        mode: 'chat',
        messages: [
          { role: 'system', content: 'You write meaningful public zines from supplied local evidence. Return minified JSON only. Do not reveal backend, process, source graph, prompt, or system language.' },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.72,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
      }),
    });
    const body = await response.text();
    const modelCall = {
      provider: 'DeepSeek via Cloudflare Worker', proxyUrl, origin: requestOrigin, attempted: true,
      status: response.ok ? 'pass' : 'failed', httpStatus: response.status,
      errorClass: response.ok ? null : 'http_error', durationMs: Date.now() - startedAt,
    };
    if (!response.ok) return { modelCall, json: null, rawCharacterCount: 0 };
    let content = body;
    try {
      const data = JSON.parse(body || '{}');
      content = data.content ?? data.choices?.[0]?.message?.content ?? body;
    } catch {}
    try {
      return { modelCall, json: extractJsonObject(content), rawCharacterCount: String(content).length };
    } catch (error) {
      if (!repair) throw error;
      const repaired = await requestDeepSeekJson(`Repair this into parseable minified JSON only. Do not add fields or explanation.\n\n${String(content).slice(0, 5000)}`, 900, false);
      return {
        modelCall: {
          ...repaired.modelCall,
          durationMs: modelCall.durationMs + repaired.modelCall.durationMs,
          repairUsed: true,
          originalHttpStatus: modelCall.httpStatus,
        },
        json: repaired.json,
        rawCharacterCount: String(content).length + repaired.rawCharacterCount,
      };
    }
  } catch (error) {
    return {
      modelCall: {
        provider: 'DeepSeek via Cloudflare Worker', proxyUrl, origin: requestOrigin, attempted: true,
        status: 'failed', httpStatus: null, errorClass: error instanceof Error ? error.name : 'unknown_error', durationMs: Date.now() - startedAt,
      },
      json: null,
      rawCharacterCount: 0,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function callDeepSeekArticle(editorialPrompt: string, pages: typeof deepReadPages) {
  const calls: any[] = [];
  let rawCharacterCount = 0;
  const outline = await requestDeepSeekJson(`${editorialPrompt}\n\nFirst return only {"title":"","subtitle":"","opening":"","proposition":"","sections":[{"title":"","plan":""}],"quietCaveat":""}. Use exactly 4 section plans.`, 700);
  calls.push(outline.modelCall);
  rawCharacterCount += outline.rawCharacterCount;
  if (!outline.json) return { modelCall: { ...outline.modelCall, calls }, article: null, rawCharacterCount };
  const sectionPlans = Array.isArray(outline.json.sections) ? outline.json.sections.slice(0, 4) : [];
  while (sectionPlans.length < 4) sectionPlans.push({ title: `Section ${sectionPlans.length + 1}`, plan: '' });
  const sections = [];
  for (let index = 0; index < 4; index += 1) {
    const section = await requestDeepSeekJson(JSON.stringify({
      task: 'Expand one substantive public zine section. Return {"title":"","body":"","pullQuote":""}. Body should be 140-220 words and use concrete observations. No private/process terms.',
      seedSentence,
      outline: { title: outline.json.title, proposition: outline.json.proposition },
      sectionPlan: sectionPlans[index],
      evidence: pages.slice(index, index + 3),
    }), 850);
    calls.push(section.modelCall);
    rawCharacterCount += section.rawCharacterCount;
    if (!section.json) return { modelCall: { ...section.modelCall, calls }, article: null, rawCharacterCount };
    sections.push(section.json);
  }
  const protocol = await requestDeepSeekJson(JSON.stringify({
    task: 'Return {"protocol":[{"title":"","body":""}],"quietCaveat":""}. Exactly 4 actionable steps for building a non-dashboard utopia from the article logic.',
    title: outline.json.title,
    proposition: outline.json.proposition,
    sectionTitles: sections.map((section) => section.title),
  }), 650);
  calls.push(protocol.modelCall);
  rawCharacterCount += protocol.rawCharacterCount;
  if (!protocol.json) return { modelCall: { ...protocol.modelCall, calls }, article: null, rawCharacterCount };
  const lastCall = calls[calls.length - 1];
  const modelCall = {
    provider: 'DeepSeek via Cloudflare Worker', proxyUrl, origin: requestOrigin, attempted: true,
    status: calls.every((call) => call.status === 'pass') ? 'pass' : 'failed',
    httpStatus: calls.every((call) => call.httpStatus === 200) ? 200 : lastCall.httpStatus,
    errorClass: calls.find((call) => call.errorClass)?.errorClass ?? null,
    durationMs: calls.reduce((sum, call) => sum + call.durationMs, 0),
    callCount: calls.length,
    calls: calls.map((call) => ({ status: call.status, httpStatus: call.httpStatus, durationMs: call.durationMs, errorClass: call.errorClass })),
  };
  const article = normalizeArticle({
    title: outline.json.title,
    subtitle: outline.json.subtitle,
    opening: outline.json.opening,
    proposition: outline.json.proposition,
    sections,
    protocol: protocol.json.protocol,
    quietCaveat: protocol.json.quietCaveat ?? outline.json.quietCaveat,
  });
  return { modelCall, article, rawCharacterCount };
}

const seedKeywords = expandedSeedKeywords(seedSentence);
const allowedCards = daydreamCorpus.cards.filter(allowed);
const allowedIds = new Set(allowedCards.map((card) => card.id));
const allowedCorpus: DaydreamCorpus = {
  cards: allowedCards,
  edges: daydreamCorpus.edges.filter((edge) => allowedIds.has(edge.source) && allowedIds.has(edge.target)),
  manifest: { schemaVersion: daydreamCorpus.manifest.schemaVersion, generatedAt: daydreamCorpus.manifest.generatedAt, counts: { sourceCards: allowedCards.length, graphEdges: 0 } },
};
const ranked = allowedCards
  .map((card) => ({ card, ...scoreCard(card, seedKeywords) }))
  .filter((item) => item.score > 0)
  .sort((a, b) => b.score - a.score || a.card.title.localeCompare(b.card.title));
const familyPicks = enabledSourceFamilies.flatMap((family) => ranked.filter((item) => sourceFamily(item.card) === family).slice(0, family === 'Fabricademy' ? 2 : 4));
const matchedRanked = [...new Map([...familyPicks, ...ranked.slice(0, 12)].map((item) => [item.card.id, item])).values()].slice(0, 12);
const matchedCards = matchedRanked.map((item) => item.card);
const workflow = runDaydreamWorkflow(`${seedSentence}\n${seedKeywords.join(' ')}`, allowedCorpus);
const report = generateDaydreamReport(`${seedSentence}\n${seedKeywords.join(' ')}`, allowedCorpus);
report.keywords = seedKeywords;
report.matchedCards = matchedCards;
const evidenceCards = [...new Map([...matchedCards, ...report.deepReadCards, ...report.expandedCards].filter(allowed).map((card) => [card.id, card])).values()].slice(0, 16);
const researchTopics = workflow.step3.researchTopics.slice(0, 6);
const editorialBrief = workflow.step4.editorialBrief;

const matchedPages = matchedRanked.map((item) => ({ ...citation(item.card), score: item.score, matchedKeywords: item.matchedKeywords }));
const relatedPages = [...report.linkedCards.filter((trail) => allowed(trail.card)).slice(0, 16).map((trail) => ({
  from: trail.via?.map((card) => card.title).join(' -> ') || seedSentence,
  to: trail.card.title,
  relation: trail.relation,
  reason: `local allowed-corpus relation at depth ${trail.depth}`,
}))];
const newKeywords = Array.from(new Set(report.deepReadKeywords.filter((keyword) => !seedKeywords.includes(keyword)))).slice(0, 24);
const deepReadPages = evidenceCards.slice(0, 10).map((card) => ({
  ...citation(card),
  extractedObservations: [compact(card.excerpt ?? '', 260), ...(card.keywords ?? []).slice(0, 5)].filter(Boolean),
  whyUsed: scoreCard(card, seedKeywords).matchedKeywords.length
    ? `matched ${scoreCard(card, seedKeywords).matchedKeywords.join(', ')}`
    : `related ${sourceFamily(card)} page in local allowed corpus`,
}));
const diagramNodes = [
  { id: 'seed', label: seedSentence, type: 'seed' },
  ...seedKeywords.slice(0, 14).map((keyword) => ({ id: `keyword:${keyword}`, label: keyword, type: 'keyword' })),
  ...matchedPages.slice(0, 10).map((page) => ({ id: `page:${page.title}`, label: page.title, type: 'page', family: page.sourceFamily })),
];
const diagramEdges = [
  ...seedKeywords.slice(0, 14).map((keyword) => ({ from: 'seed', to: `keyword:${keyword}`, weight: 1, reason: 'seed keyword expansion' })),
  ...matchedPages.slice(0, 10).flatMap((page) => page.matchedKeywords.slice(0, 3).map((keyword) => ({ from: `keyword:${keyword}`, to: `page:${page.title}`, weight: Math.max(0.2, page.score / 10), reason: 'keyword-page match' }))),
  ...relatedPages.slice(0, 8).map((page) => ({ from: `page:${page.from.split(' -> ')[0]}`, to: `page:${page.to}`, weight: 0.55, reason: page.relation })),
];
const mermaid = ['graph TD', ...diagramEdges.slice(0, 32).map((edge, index) => `  n${index}[")${edge.from.replace(/"/g, '')}"] -->|${edge.reason} ${edge.weight}| m${index}["${edge.to.replace(/"/g, '')}"]`)].join('\n');

const editorialPrompt = [
  'PRIVATE EDITORIAL PROMPT - DO NOT EMBED IN PUBLIC ZINE',
  `Seed sentence: ${seedSentence}`,
  `Enabled source families: ${enabledSourceFamilies.join('; ')}`,
  'Hackteria is excluded. Do not cite or use Hackteria.',
  `Seed keywords: ${seedKeywords.join(', ')}`,
  'Visited allowed pages and observations:',
  JSON.stringify(deepReadPages.slice(0, 8).map((page) => ({
    title: page.title,
    sourceFamily: page.sourceFamily,
    observation: page.extractedObservations[0],
    whyUsed: page.whyUsed,
  })), null, 2),
  'Research topics:',
  JSON.stringify(researchTopics.slice(0, 4).map((topic) => ({ title: topic.title, researchQuestion: topic.researchQuestion, relationPattern: topic.relationPattern })), null, 2),
  'Editorial brief:',
  JSON.stringify({ title: editorialBrief.title, deck: editorialBrief.deck, sections: editorialBrief.sections.map((section) => ({ title: section.title, body: compact(section.body, 260) })) }, null, 2),
  'Return JSON with fields: title, subtitle, opening, proposition, sections[4] each with title/body/pullQuote, protocol[4] with title/body, quietCaveat. Each section body must be substantive and cite/use concrete observations from the visited allowed pages without process/private language.',
].join('\n\n');

const { modelCall, article, rawCharacterCount } = await callDeepSeekArticle(editorialPrompt, deepReadPages);
if (!article) {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(jsonPath, `${JSON.stringify({ seedSentence, seedKeywords, enabledSourceFamilies, hackteriaExcluded: true, matchedPages, relatedPages, newKeywords, deepReadPages, editorialBrief, editorialPrompt, modelCall, articleSource: 'blocked' }, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ modelCallStatus: modelCall.status, httpStatus: modelCall.httpStatus, errorClass: modelCall.errorClass, articleSource: 'blocked' }, null, 2));
  process.exitCode = 1;
} else {
  let fragment = renderOfficialTemplateArtifactHtml(article, 'pbs-reset-title', officialTemplate);
  fragment += renderAssociationFeedbackSection('zh-TW', officialTemplate.filename);
  const publicHtml = `<!doctype html><html lang="zh-TW"><head><meta charset="utf-8"><title>${article.title}</title></head><body>${fragment}</body></html>`;
  assertCleanPublicArtifact(publicHtml);
  const visibleText = extractPublicArtifactText(publicHtml);
  const forbiddenTermsFound = ['backend', 'traversal', 'source graph', 'prompt', 'system language', 'Hackteria']
    .filter((term) => visibleText.toLowerCase().includes(term.toLowerCase()));
  const sectionTitles = article.sections.map((section) => section.title);
  const articleCharacterCount = [article.title, article.subtitle, article.opening, article.proposition, ...article.sections.map((section) => section.body), ...article.protocol.map((item) => item.body), article.quietCaveat ?? ''].join('\n').length;
  const proof = {
    seedSentence,
    seedKeywords,
    enabledSourceFamilies,
    hackteriaExcluded: true,
    corpusCounts: { allowedCards: allowedCards.length, hackteriaCardsExcluded: daydreamCorpus.cards.filter((card) => sourceFamily(card) === 'Hackteria').length },
    matchedPages,
    linkedOrRelatedPagesVisited: relatedPages,
    newSeedsOrResearchTopics: researchTopics.map((topic) => ({ title: topic.title, researchQuestion: topic.researchQuestion, relationPattern: topic.relationPattern, maturityScore: topic.maturityScore, firstReadingRoute: topic.firstReadingRoute })),
    newKeywords,
    deepReadPages,
    corpusPageVectorDiagram: { nodes: diagramNodes, edges: diagramEdges, mermaid },
    editorialBrief,
    editorialPrompt,
    modelCall,
    generatedArticle: { articleSource: 'deepseek', title: article.title, sectionTitles, approximateCharacterCount: articleCharacterCount, rawModelCharacterCount: rawCharacterCount, notLocalFallback: true },
    publicValidation: { officialTemplate1: publicHtml.includes('data-official-template="01-pbs-reset-title-kinetic.html"'), publicSafetyPassed: forbiddenTermsFound.length === 0, forbiddenTermsFound },
    artifactPaths: { publicZineHtml: path.relative(repoRoot, publicHtmlPath), privateTraceJson: path.relative(repoRoot, jsonPath), privateTraceMarkdown: path.relative(repoRoot, mdPath) },
  };
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(publicHtmlPath, publicHtml, 'utf8');
  fs.writeFileSync(jsonPath, `${JSON.stringify(proof, null, 2)}\n`, 'utf8');
  fs.writeFileSync(mdPath, [
    '---', 'type: private-zine-proof', 'status: live-deepseek-pass', 'public: false', 'hackteriaExcluded: true', '---', '',
    '# Private Zine Generation Proof - Modern PBS', '',
    `Seed: ${seedSentence}`, `Enabled source families: ${enabledSourceFamilies.join(', ')}`, 'Hackteria excluded: true',
    `DeepSeek status: ${modelCall.status} (${modelCall.httpStatus})`, `Article source: deepseek`,
    `Public zine HTML: ${path.relative(repoRoot, publicHtmlPath)}`, `Private JSON: ${path.relative(repoRoot, jsonPath)}`,
  ].join('\n'), 'utf8');
  console.log(JSON.stringify({
    seedKeywords,
    matchedPageTitles: matchedPages.map((page) => page.title),
    deepReadTitles: deepReadPages.map((page) => page.title),
    newKeywords,
    diagramSummary: { nodes: diagramNodes.length, edges: diagramEdges.length },
    articleTitle: article.title,
    sectionTitles,
    articleCharacterCount,
    modelCallStatus: modelCall.status,
    httpStatus: modelCall.httpStatus,
    durationMs: modelCall.durationMs,
    articleSource: 'deepseek',
    publicValidation: proof.publicValidation,
    artifactPaths: proof.artifactPaths,
  }, null, 2));
}
