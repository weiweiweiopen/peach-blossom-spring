const topicGroups = [
  ['money', 'grant', 'funding', 'budget', '補助', '資金', '錢'], ['camp', 'workshop', 'residency', 'gathering', '營', '工作坊', '駐村'], ['independent', 'autonomy', '自治', '獨立'], ['exchange', 'network', 'international', '國際', '交流', '網絡'], ['sustainability', 'sustain', 'long-term', '永續', '長期'], ['art', 'science', 'technology', '藝術', '科學', '科技'], ['skill', 'craft', 'textile', 'tool', '技術', '工藝', '工具'], ['care', 'burnout', 'support', '照顧', '疲勞', '支持'],
];
export function tokenize(text: string): string[] {
  return text.normalize('NFKC').toLowerCase().match(/[a-z0-9]+|[\u4e00-\u9fff]{1,4}/g) ?? [];
}
export function scorePromptResonance(question: string, context: string | string[]): number {
  const q = new Set(tokenize(question));
  const c = new Set(tokenize(Array.isArray(context) ? context.join(' ') : context));
  if (q.size === 0 || c.size === 0) return 0;
  let score = 0;
  for (const token of q) if (c.has(token)) score += 12;
  for (const group of topicGroups) {
    const qHit = group.some((word) => question.toLowerCase().includes(word));
    const cHit = group.some((word) => (Array.isArray(context) ? context.join(' ') : context).toLowerCase().includes(word));
    if (qHit && cHit) score += 18;
  }
  return Math.max(0, Math.min(100, score));
}
