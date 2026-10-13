import type { WikiSearchResult } from '../wikiSearch.js';

export type QuestionQualityStatus = 'idle' | 'estimating' | 'ready' | 'error';

export interface QuestionQuality {
  question: string;
  specificity: number;
  evidenceReadiness: number;
  crossSystemPotential: number;
  pageCount: number;
  sourceFamilyCount: number;
  sourceFamilies: string[];
  topPages: Array<{ title: string; url?: string; sourceFamily: string }>;
  caveats: string[];
  evaluatedAt: number;
  status: QuestionQualityStatus;
}

export const emptyQuestionQuality: QuestionQuality = {
  question: '',
  specificity: 0,
  evidenceReadiness: 0,
  crossSystemPotential: 0,
  pageCount: 0,
  sourceFamilyCount: 0,
  sourceFamilies: [],
  topPages: [],
  caveats: ['等待 shared memory traversal。'],
  evaluatedAt: 0,
  status: 'idle',
};

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeFamily(value: string): string {
  const lower = value.toLowerCase();
  if (lower.includes('sgmk')) return 'SGMK';
  if (lower.includes('hackteria')) return 'Hackteria';
  if (lower.includes('kobakant') || lower.includes('how to get what you want') || lower.includes('htgwyw')) return 'HOW TO GET WHAT YOU WANT / KOBAKANT';
  if (lower.includes('designposthumanism') || lower.includes('posthuman')) return 'designposthumanism';
  if (lower.includes('fabricademy')) return 'Fabricademy';
  return value.trim() || 'unknown';
}

function uniquePages(results: WikiSearchResult[]): WikiSearchResult[] {
  const seen = new Set<string>();
  const pages: WikiSearchResult[] = [];
  for (const result of results) {
    const key = (result.url || result.title).trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    pages.push(result);
  }
  return pages;
}

export function estimateQuestionSpecificity(question: string): number {
  const trimmed = question.trim();
  if (!trimmed) return 0;
  const lengthScore = Math.min(28, trimmed.length * 0.8);
  const concreteSignals = [
    /材料|material|素材|วัสดุ|素材/i,
    /方法|method|protocol|workflow|做法|実践|practice/i,
    /社群|community|network|組織|organization|collective|協會|association/i,
    /作品|project|case|案例|workshop|營|camp|event|展覽|exhibition/i,
    /地方|場域|where|place|site|city|country|地點/i,
    /比較|compare|between|之間|關係|relation|cross|跨|不同/i,
    /能否|如何|怎麼|why|how|whether|what/i,
    /產品|product|kit|prototype|tool|工具|教具/i,
    /source|evidence|來源|證據|引用|citation/i,
    /紅茶菌|kombucha|多物種|multispecies|建築|architecture|biofilm|bioart|fermentation/i,
  ];
  const signalScore = concreteSignals.reduce((score, pattern) => score + (pattern.test(trimmed) ? 8 : 0), 0);
  const hasConstraint = /尤其|特別|限制|只|不要|from|to|從|到|走向|轉向|rather than|not/i.test(trimmed) ? 10 : 0;
  const tooBroadPenalty = /^(藝術|社群|科技|材料|bioart|community|technology|art)$/i.test(trimmed) ? 24 : 0;
  return clampPercent(22 + lengthScore + signalScore + hasConstraint - tooBroadPenalty);
}

export function scoreQuestionTraversal(question: string, results: WikiSearchResult[]): QuestionQuality {
  const pages = uniquePages(results);
  const families = Array.from(new Set(pages.map((result) => normalizeFamily(result.sourceFamily))));
  const pageCount = pages.length;
  const sourceFamilyCount = families.length;
  const specificity = estimateQuestionSpecificity(question);
  const genericHits = pages.filter((page) => /main page|home|archive|members/i.test(page.title)).length;
  const describedHits = pages.filter((page) => `${page.title} ${page.description}`.replace(/\s+/g, ' ').trim().length >= 80).length;
  const urlHits = pages.filter((page) => page.url).length;
  const evidenceReadiness = clampPercent(
    16 +
    Math.min(54, pageCount * 9) +
    Math.min(20, describedHits * 4) +
    Math.min(12, urlHits * 2) -
    Math.min(18, genericHits * 4),
  );
  const crossSystemPotential = clampPercent(
    18 +
    Math.min(54, sourceFamilyCount * 18) +
    Math.min(18, pageCount * 2) +
    (/比較|compare|between|之間|跨|cross|relation|關係/i.test(question) ? 10 : 0),
  );
  const caveats: string[] = [];
  if (!pageCount) caveats.push('shared memory 沒有找到可用來源頁面。');
  if (pageCount > 0 && pageCount < 3) caveats.push('來源頁面偏少，適合先當閱讀路徑，不適合直接下定論。');
  if (sourceFamilyCount <= 1 && pageCount > 0) caveats.push('證據目前集中在單一社群系統。');
  if (genericHits >= Math.max(2, Math.ceil(pageCount / 2))) caveats.push('命中頁面偏 generic，需要更具體材料、事件或案例。');
  if (specificity < 55) caveats.push('問題仍偏抽象；補上材料、場域、事件或比較對象會讓 traversal 更穩。');
  if (!caveats.length) caveats.push(`找到 ${pageCount.toString()} 個頁面，橫跨 ${families.join(' / ')}。`);
  return {
    question,
    specificity,
    evidenceReadiness,
    crossSystemPotential,
    pageCount,
    sourceFamilyCount,
    sourceFamilies: families,
    topPages: pages.slice(0, 5).map((page) => ({ title: page.title, url: page.url, sourceFamily: normalizeFamily(page.sourceFamily) })),
    caveats,
    evaluatedAt: Date.now(),
    status: 'ready',
  };
}
