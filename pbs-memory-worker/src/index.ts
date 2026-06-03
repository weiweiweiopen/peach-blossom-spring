interface Env {
  DB: D1Database;
  DEEPSEEK_PROXY?: Fetcher;
  DEEPSEEK_PROXY_URL?: string;
  DEEPSEEK_ORIGIN?: string;
  PBS_ALLOWED_ORIGINS?: string;
}

interface SearchResult {
  title: string;
  url: string;
  sourceFamily: string;
  path: string;
  description: string;
  score: number;
}

interface EvidenceItem {
  id: string;
  label: string;
  text: string;
  source: 'corpus';
  sourceLabel: string;
  sourceType: string;
  url: string;
  tags: string[];
  score: number;
}

function allowedOrigin(request: Request, env: Env): string {
  const origin = request.headers.get('Origin') ?? '';
  const allowed = (env.PBS_ALLOWED_ORIGINS ?? '').split(',').map((item) => item.trim()).filter(Boolean);
  if (origin && allowed.includes(origin)) return origin;
  if (origin.endsWith('.github.io')) return origin;
  return allowed[0] ?? '*';
}

function corsHeaders(request: Request, env: Env): HeadersInit {
  return {
    'Access-Control-Allow-Origin': allowedOrigin(request, env),
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function jsonResponse(request: Request, env: Env, payload: unknown, status = 200): Response {
  return Response.json(payload, { status, headers: corsHeaders(request, env) });
}

function tokens(text: string): string[] {
  return Array.from(new Set(text.toLowerCase().split(/[^\p{L}\p{N}-]+/u).filter((word) => word.length >= 2)));
}

const DOMAIN_ALIASES: Array<[RegExp, string[]]> = [
  [/獨立|independent|artist-run|artist run/i, ['independent', 'artist-run', 'self-organized', 'community-driven']],
  [/藝術|art|artist/i, ['art', 'artist', 'artistic', 'creative']],
  [/營|camp|summercamp|summer camp|camping/i, ['camp', 'summercamp', 'summer', 'gathering', 'festival', 'retreat', 'home made', 'homemade', 'HOME MADE']],
  [/展覽|exhibition|showcase/i, ['exhibition', 'showcase', 'presentation', 'public']],
  [/學校|課程|course|school|curriculum|class/i, ['school', 'course', 'curriculum', 'lecture', 'participants', 'learning']],
  [/科技|技術|technology|tech|workshop|工作坊/i, ['technology', 'technical', 'workshop', 'hands-on', 'tool', 'prototype', 'kit']],
  [/社群|community|commons|共同|臨時/i, ['community', 'commons', 'temporary', 'self-organization', 'knowledge exchange', 'mutual learning']],
  [/hackteria|bioart|biology|生物|實驗室|lab/i, ['hackteria', 'bioart', 'biology', 'lab', 'open science', 'workshopology']],
  [/sgmk|mechatronic|機電/i, ['sgmk', 'mechatronic', 'HOME MADE', 'Flick the World', 'festival']],
  [/kobakant|htgwyw|textile|wearable|fabric|soft|織品|穿戴/i, ['kobakant', 'htgwyw', 'textile', 'wearable', 'fabric', 'soft', 'circuit']],
  [/kombucha|scoby|紅茶菌|康普茶|bacterial cellulose|biofilm|fermentation|bioplastic/i, ['kombucha', 'scoby', 'bacterial cellulose', 'biofilm', 'fermentation', 'bioplastic', 'kitchenlab']],
  [/architecture|architectural|multispecies|multi-species|more-than-human|building|habitat|建築|多物種/i, ['architecture', 'multispecies', 'more-than-human', 'habitat', 'living material', 'bioregional']],
  [/synth|synthesizer|sound|music|midi|oscillator|speaker|聲音|合成器|sensor|感測/i, ['synth', 'synthesizer', 'sound', 'music', 'midi', 'oscillator', 'speaker', 'sensor']],
];

function expandedTokens(query: string): string[] {
  const out = tokens(query);
  for (const [pattern, aliases] of DOMAIN_ALIASES) {
    if (pattern.test(query)) out.push(...aliases);
  }
  return Array.from(new Set(out));
}

function searchPlans(query: string): string[] {
  const plans = new Set<string>([query, expandedTokens(query).join(' ')]);
  for (const [pattern, aliases] of DOMAIN_ALIASES) {
    if (pattern.test(query)) plans.add(aliases.join(' '));
  }
  return Array.from(plans).filter((item) => item.trim().length > 0).slice(0, 8);
}

function ftsQuery(query: string): string {
  const queryTokens = expandedTokens(query);
  return queryTokens.map((token) => `"${token.replace(/"/g, '""')}"`).join(' OR ') || '"pbs"';
}

async function searchFts(env: Env, query: string, limit: number, boosts: { kombucha?: boolean; architecture?: boolean; synthMaterial?: boolean }): Promise<SearchResult[]> {
  const wantsKombucha = /kombucha|scoby|紅茶菌|康普茶|bacterial cellulose|biofilm|fermentation|bioplastic/i.test(query);
  const wantsArchitecture = /architecture|architectural|multispecies|multi-species|more-than-human|building|habitat|建築|多物種/i.test(query);
  const wantsSynthMaterial = /synth|synthesizer|sound|music|midi|oscillator|speaker|聲音|合成器|material|textile|fabric|circuit|sensor|材料|織品/i.test(query);
  const rows = await env.DB.prepare(`
    SELECT title, url, source_family AS sourceFamily, path,
           snippet(source_chunks_fts, 1, '', '', ' ', 72) AS description,
           (
             bm25(source_chunks_fts)
             - CASE WHEN ? AND (lower(title || ' ' || body) LIKE '%kombucha%' OR lower(title || ' ' || body) LIKE '%scoby%' OR lower(title || ' ' || body) LIKE '%bacterial cellulose%' OR lower(title || ' ' || body) LIKE '%biofilm%' OR lower(title || ' ' || body) LIKE '%fermentation%' OR lower(title || ' ' || body) LIKE '%bioplastic%') THEN 8 ELSE 0 END
             - CASE WHEN ? AND (lower(title || ' ' || body) LIKE '%multispecies%' OR lower(title || ' ' || body) LIKE '%multi-species%' OR lower(title || ' ' || body) LIKE '%more-than-human%' OR lower(title || ' ' || body) LIKE '%architecture%' OR lower(title || ' ' || body) LIKE '%habitat%') THEN 8 ELSE 0 END
             - CASE WHEN ? AND (lower(title || ' ' || body) LIKE '%synth%' OR lower(title || ' ' || body) LIKE '%midi%' OR lower(title || ' ' || body) LIKE '%sound%' OR lower(title || ' ' || body) LIKE '%speaker%' OR lower(title || ' ' || body) LIKE '%textile sensor%' OR lower(title || ' ' || body) LIKE '%circuit%') THEN 8 ELSE 0 END
           ) AS score
    FROM source_chunks_fts
    WHERE source_chunks_fts MATCH ?
    ORDER BY score
    LIMIT ?
  `).bind((boosts.kombucha ?? wantsKombucha) ? 1 : 0, (boosts.architecture ?? wantsArchitecture) ? 1 : 0, (boosts.synthMaterial ?? wantsSynthMaterial) ? 1 : 0, ftsQuery(query), Math.max(1, Math.min(limit, 20))).all<SearchResult>();
  return (rows.results ?? []).map((row) => ({
    title: row.title,
    url: row.url ?? '',
    sourceFamily: row.sourceFamily ?? 'unknown',
    path: row.path ?? '',
    description: String(row.description ?? '').replace(/\s+/g, ' ').trim(),
    score: Number(row.score ?? 0),
  }));
}

async function searchMemory(env: Env, query: string, limit = 8): Promise<SearchResult[]> {
  const perPlanLimit = Math.max(8, Math.min(16, limit * 2));
  const planned = await Promise.all(searchPlans(query).map((plan) => searchFts(env, plan, perPlanLimit, {})));
  const merged = new Map<string, SearchResult & { appearances: number; planIndex: number }>();
  planned.forEach((results, planIndex) => {
    for (const result of results) {
      const key = result.path || result.url || result.title;
      const existing = merged.get(key);
      if (!existing || result.score < existing.score) {
        merged.set(key, { ...result, appearances: (existing?.appearances ?? 0) + 1, planIndex: Math.min(existing?.planIndex ?? planIndex, planIndex) });
      } else {
        existing.appearances += 1;
      }
    }
  });

  const queryTerms = expandedTokens(query).map((item) => item.toLowerCase());
  const ranked = Array.from(merged.values()).sort((a, b) => {
    const rankA = rerankScore(a, queryTerms);
    const rankB = rerankScore(b, queryTerms);
    return rankB - rankA || a.score - b.score || a.title.localeCompare(b.title);
  });

  const selected: SearchResult[] = [];
  const familyCounts = new Map<string, number>();
  const familySoftCap = Math.max(2, Math.ceil(limit / 3));
  for (const item of ranked) {
    const count = familyCounts.get(item.sourceFamily) ?? 0;
    if (count >= familySoftCap && selected.length < Math.max(1, limit - 2)) continue;
    selected.push(item);
    familyCounts.set(item.sourceFamily, count + 1);
    if (selected.length >= limit) break;
  }
  for (const item of ranked) {
    if (selected.length >= limit) break;
    if (selected.some((current) => (current.path || current.url || current.title) === (item.path || item.url || item.title))) continue;
    selected.push(item);
  }
  return selected.slice(0, limit);
}

function rerankScore(result: SearchResult & { appearances?: number; planIndex?: number }, queryTerms: string[]): number {
  const text = `${result.title} ${result.description} ${result.sourceFamily}`.toLowerCase();
  const title = result.title.toLowerCase();
  const uniqueHits = queryTerms.filter((term) => text.includes(term.toLowerCase())).length;
  const titleHits = queryTerms.filter((term) => title.includes(term.toLowerCase())).length;
  const sourceWeight = result.sourceFamily === 'hackteria' || result.sourceFamily === 'sgmk' || result.sourceFamily === 'htgwyw' ? 3 : 0;
  return uniqueHits * 3 + titleHits * 4 + (result.appearances ?? 1) * 2 + sourceWeight - (result.planIndex ?? 0) * 0.25 - result.score * 0.02;
}

function evidenceFromResults(results: SearchResult[]): EvidenceItem[] {
  return results.map((item, index) => ({
    id: `pbs-memory-worker-${index + 1}`,
    label: item.title,
    text: item.description,
    source: 'corpus',
    sourceLabel: item.title,
    sourceType: item.sourceFamily,
    url: item.url,
    tags: ['pbs-memory-worker', item.sourceFamily],
    score: item.score,
  }));
}

function languageInstruction(preferredLanguage: string): string {
  if (preferredLanguage === 'zh-TW') return 'Answer in Traditional Chinese. Never use Simplified Chinese.';
  if (preferredLanguage === 'ja') return 'Answer in Japanese.';
  if (preferredLanguage === 'th') return 'Answer in Thai.';
  if (preferredLanguage === 'id') return 'Answer in Indonesian.';
  if (preferredLanguage === 'de') return 'Answer in German.';
  return 'Answer in the same language as the question.';
}

function fallbackAnswer(evidence: EvidenceItem[], error: string): string {
  if (!evidence.length) return `目前沒有找到足夠的公開來源可以回答。請換成更具體的材料、工具、社群、地點或案例再問一次。DeepSeek error: ${error}`;
  return [
    '我先把可查到的公開來源列出來；完整自然語句暫時無法生成。',
    '可繼續讀的來源：',
    ...evidence.map((item, index) => `${index + 1}. ${item.label}: ${item.text} ${item.url}`.trim()),
    `DeepSeek error: ${error}`,
  ].join('\n');
}

function deterministicGroundedAnswer(question: string, evidence: EvidenceItem[], preferredLanguage: string, reason = ''): string {
  if (!evidence.length) {
    return preferredLanguage === 'zh-TW'
      ? '目前沒有找到足夠的公開來源可以回答。請換成更具體的材料、工具、社群、地點或案例再問一次。'
      : 'I could not find enough public source material for this question. Try a more specific material, tool, community, place, or case.';
  }
  if (preferredLanguage !== 'zh-TW') {
    return [
      reason || 'Using the public sources found for this question.',
      `Question: ${question}`,
      ...evidence.slice(0, 6).map((item, index) => `[${index + 1}] ${item.label}: ${item.text} ${item.url}`.trim()),
      'No unsupported project or workshop is added beyond these source snippets.',
    ].join('\n\n');
  }
  return [
    reason || '我先只整理下方公開來源真正支持的內容，不補不存在的工作坊或產品案例。',
    `問題：${question}`,
    '',
    ...evidence.slice(0, 6).map((item, index) => `- [${index + 1}] ${item.label}：${item.text} ${item.url}`.trim()),
    '',
    '如果某個社群只出現在相關連結、但片段沒有提到 electronic textiles、soft circuit、wearable electronics、kit、產品或作品轉化，我不會把它寫成已證實案例。',
  ].join('\n');
}

function answerLooksGrounded(answer: string, evidence: EvidenceItem[]): boolean {
  if (!answer.trim()) return false;
  if (!/\[[1-8]\]/.test(answer)) return false;
  const lower = answer.toLowerCase();
  const evidenceText = evidence.map((item) => `${item.label} ${item.text} ${item.sourceType}`).join('\n').toLowerCase();
  if (/lilypad|胸針|brooch|kit|套件/.test(lower) && !/lilypad|胸針|brooch|kit|套件/.test(evidenceText)) return false;
  if (/sgmk/.test(lower) && /soft circuit|soft-circuit|wearable electronics|電子織品|電子紡織|軟電路/.test(lower)) {
    const sgmkEvidence = evidence.filter((item) => item.sourceType.toLowerCase() === 'sgmk').map((item) => `${item.label} ${item.text}`).join('\n').toLowerCase();
    if (!/soft circuit|soft-circuit|wearable|wearable electronics|electronic textile|e-textile|電子織品|電子紡織|軟電路|sensor|circuit/.test(sgmkEvidence)) return false;
  }
  return true;
}

async function callDeepSeek(env: Env, systemPrompt: string, userPrompt: string): Promise<string> {
  const url = env.DEEPSEEK_PROXY_URL || 'https://pbs-deepseek-proxy.dontmarryme.workers.dev/chat';
  const request = new Request(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': env.DEEPSEEK_ORIGIN || 'https://weiweiweiopen.github.io',
      'User-Agent': 'PBS-memory-worker/0.1',
    },
    body: JSON.stringify({
      mode: 'chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 900,
    }),
  });
  const response = env.DEEPSEEK_PROXY ? await env.DEEPSEEK_PROXY.fetch(request) : await fetch(request);
  if (!response.ok) throw new Error(`DeepSeek proxy failed ${response.status}: ${await response.text()}`);
  const data = await response.json() as { answer?: string; content?: string; choices?: Array<{ message?: { content?: string } }> };
  const answer = data.answer ?? data.content ?? data.choices?.[0]?.message?.content ?? '';
  if (!answer.trim()) throw new Error('DeepSeek response did not include answer text');
  return answer.trim();
}

async function answerWithMemory(env: Env, question: string, preferredLanguage: string, npcContext = ''): Promise<{ answer: string; evidence: EvidenceItem[]; links: SearchResult[] }> {
  const links = await searchMemory(env, question, 8);
  const evidence = evidenceFromResults(links);
  const evidenceBlock = evidence.map((item, index) => `[${index + 1}] ${item.label}\n${item.text}\n${item.url}`).join('\n\n');
  const systemPrompt = [
    languageInstruction(preferredLanguage),
    'You answer inside Peach Blossom Spring using PBS public source evidence.',
    'Use ONLY the numbered PBS memory evidence below for factual claims. Optional NPC context is voice framing only, not evidence.',
    'Every concrete project, workshop, material, tool, claim, or source-family claim must include a citation like [1] or [2] that points to the numbered evidence item that directly supports it.',
    'Never infer that a source family has a workshop or product just because that family appears in related links. If an SGMK item does not explicitly mention e-textile, soft circuit, wearable electronics, kit, product, sensor, or circuit, do not describe it as an SGMK soft-circuit case.',
    'Do not invent details such as Arduino LilyPad, brooches, kits, failure notes, productization, or reusable kits unless those exact ideas appear in the evidence text.',
    'If evidence is incomplete, say what is missing instead of inventing facts.',
    'Do not say no evidence was found when PBS evidence is present.',
    'Keep the answer readable for a game dialogue.',
    '',
    '--- optional NPC voice context, not evidence ---',
    npcContext.slice(0, 5000),
    '--- end optional NPC voice context ---',
    '',
    '--- PBS memory evidence ---',
    evidenceBlock || '(no PBS memory evidence)',
    '--- end PBS memory evidence ---',
  ].join('\n');
  try {
    const answer = await callDeepSeek(env, systemPrompt, question);
    return {
      answer: answerLooksGrounded(answer, evidence)
        ? answer
        : deterministicGroundedAnswer(question, evidence, preferredLanguage, '剛才可用的材料不足以支持某些延伸說法，所以這裡只列出能直接對應的公開來源。'),
      evidence,
      links,
    };
  } catch (error) {
    return { answer: fallbackAnswer(evidence, error instanceof Error ? error.message : String(error)), evidence, links };
  }
}

function draftMarkdown(question: string, answer: string, evidence: EvidenceItem[], links: SearchResult[]): string {
  const title = question.trim().replace(/\s+/g, ' ').slice(0, 120) || 'PBS Memory Draft';
  const sourceRefs = links.map((item) => item.path || item.url).filter(Boolean);
  return [
    '---',
    'type: compiled-note-draft',
    'status: cloud-review-candidate',
    'route: cloud-memory-worker',
    `title: ${title}`,
    `query: ${question}`,
    'sourceRefs:',
    ...sourceRefs.map((ref) => `  - ${ref}`),
    '---',
    '',
    `# ${title}`,
    '',
    '## Cloud Draft Boundary',
    '',
    '- This cloud Worker cannot write to the local Obsidian vault.',
    '- Save or promote this draft through the local PBS full-memory mode when editing durable wiki memory.',
    '',
    '## Answer Draft',
    '',
    answer || '(No answer supplied.)',
    '',
    '## Evidence',
    '',
    ...(evidence.length ? evidence.map((item) => `- ${item.label}: ${item.text} ${item.url}`.trim()) : ['- No evidence supplied.']),
  ].join('\n');
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(request, env) });
    const url = new URL(request.url);
    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/health' || url.pathname === '/status')) {
      const count = await env.DB.prepare('SELECT COUNT(*) AS count FROM source_chunks').first<{ count: number }>();
      return jsonResponse(request, env, { ok: true, service: 'peach-blossom-spring-memory', mode: 'd1-sqlite', items: count?.count ?? 0 });
    }
    if (request.method !== 'POST') return jsonResponse(request, env, { error: 'Use POST for PBS memory endpoints.' }, 405);
    const payload = await request.json().catch(() => ({})) as Record<string, unknown>;
    if (url.pathname === '/api/memory/search') {
      const query = String(payload.query ?? '');
      const limit = Number(payload.limit ?? 8);
      return jsonResponse(request, env, { results: await searchMemory(env, query, Number.isFinite(limit) ? limit : 8) });
    }
    if (url.pathname === '/api/chat/campfire') {
      const question = String(payload.question ?? '');
      const preferredLanguage = String(payload.preferredLanguage ?? 'zh-TW');
      return jsonResponse(request, env, await answerWithMemory(env, question, preferredLanguage));
    }
    if (url.pathname === '/api/chat/npc') {
      const question = String(payload.question ?? '');
      const preferredLanguage = String(payload.preferredLanguage ?? 'zh-TW');
      const npcName = String(payload.npcName ?? 'NPC');
      const persona = typeof payload.persona === 'object' && payload.persona !== null ? payload.persona as Record<string, unknown> : {};
      const npcContext = [
        `NPC: ${npcName}`,
        `Role: ${String(persona.role ?? '')}`,
        `Intro: ${String(persona.intro ?? '')}`,
      ].join('\n');
      return jsonResponse(request, env, await answerWithMemory(env, question, preferredLanguage, npcContext));
    }
    if (url.pathname === '/api/memory/draft') {
      const question = String(payload.question ?? payload.query ?? '');
      const answer = String(payload.answer ?? '');
      const links = Array.isArray(payload.links) ? payload.links as SearchResult[] : await searchMemory(env, question, Number(payload.limit ?? 8));
      const evidence = Array.isArray(payload.evidence) ? payload.evidence as EvidenceItem[] : evidenceFromResults(links);
      return jsonResponse(request, env, { stored: false, markdown: draftMarkdown(question, answer, evidence, links) });
    }
    return jsonResponse(request, env, { error: 'Unknown PBS memory endpoint.' }, 404);
  },
};
