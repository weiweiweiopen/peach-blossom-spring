export interface Env {
  PBS_DB: D1Database;
}

interface SearchRow {
  title: string;
  body: string;
  path: string;
  source_family: string;
  url: string;
  rank?: number;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data: unknown, init: ResponseInit = {}): Response {
  return Response.json(data, { ...init, headers: { ...corsHeaders, ...(init.headers ?? {}) } });
}

function sanitizeFtsQuery(input: string): string {
  return input
    .split(/[^\p{L}\p{N}_-]+/u)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
    .slice(0, 16)
    .map((token) => `"${token.replace(/"/g, '""')}"`)
    .join(' OR ');
}

function routeKeywords(text: string): string[] {
  const hay = text.toLowerCase();
  const keywords: string[] = [];
  const add = (...items: string[]) => {
    for (const item of items) if (!keywords.includes(item)) keywords.push(item);
  };
  if (/共居|共同居住|多物種|其他物種|cohab|multi-?species|more-than-human|habitat|architecture|建築/.test(hay)) {
    add('共居創作', '多物種共居', '臨時社群', 'habitat design', 'more-than-human cohabitation', 'interspecies');
  }
  if (/臨時|社群|營隊|工作坊|camp|temporary|community|collective|workshop/.test(hay)) {
    add('臨時社群', 'temporary commons', 'camp as method', 'workshop documentation');
  }
  if (/女性主義|女性|生殖|照護|同意|femini|reproductive|care|consent|alma|flora/.test(hay)) {
    add('女性主義科技', '照護基礎設施', '同意與資料邊界', 'ALMA connects FLORA', 'reproductive justice');
  }
  if (/聲音|合成器|synth|sound|speaker|oscillator|diy/.test(hay)) {
    add('DIY synth', '聲音電路', '臨時聲音社群', 'workshop score', 'shared instrument');
  }
  if (/電子織品|織品|穿戴|感測|textile|wearable|sensor|soft circuit/.test(hay)) {
    add('電子織品', '身體介面', 'soft circuit', 'failure notes', 'repairable documentation');
  }
  return keywords.slice(0, 8);
}

function rowToLink(row: SearchRow, score: number) {
  return {
    title: row.title,
    url: row.url,
    description: row.body.slice(0, 360),
    sourceFamily: row.source_family || 'PBS source',
    score,
  };
}

async function search(env: Env, query: string, limit: number) {
  const route = routeKeywords(query).join(' ');
  const fts = sanitizeFtsQuery(`${query} ${route}`);
  if (!fts) return [];
  const result = await env.PBS_DB.prepare(
    `SELECT title, body, path, source_family, url, bm25(memory) AS rank
     FROM memory
     WHERE memory MATCH ?
     ORDER BY rank
     LIMIT ?`,
  ).bind(fts, Math.max(1, Math.min(20, limit))).all<SearchRow>();
  return (result.results ?? []).map((row, index) => rowToLink(row, 1000 - index));
}

function answerFromLinks(question: string, preferredLanguage: string, links: ReturnType<typeof rowToLink>[]): string {
  const route = routeKeywords(question);
  const routeText = route.slice(0, 3).map((item) => `「${item}」`).join('、');
  if (preferredLanguage === 'en') {
    return links.length
      ? `I will follow ${routeText || 'the strongest source route'} directly and read the pages below for you. Start from ${links[0].title}, then compare it with the next linked cases.`
      : 'I could not find a strong enough source page yet. Try adding one concrete place, material, community, or method.';
  }
  return links.length
    ? `我會直接用 ${routeText || '最強來源路線'} 替你讀下方連結，不要你再自己重查。先從「${links[0].title}」開始，再比較後面的案例。`
    : '我還沒有找到足夠強的真實來源頁面。請補一個具體場域、材料、社群或方法，我會再沿著來源查。';
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
    const url = new URL(request.url);
    if (url.pathname === '/health' || url.pathname === '/status') {
      return json({ ok: true, service: 'pbs-engine', backend: 'cloudflare-d1-fts' });
    }
    if (url.pathname === '/api/memory/search' && request.method === 'POST') {
      const body = await request.json<{ query?: string; limit?: number }>();
      return json({ results: await search(env, body.query ?? '', body.limit ?? 8) });
    }
    if ((url.pathname === '/api/chat/campfire' || url.pathname === '/api/chat/npc') && request.method === 'POST') {
      const body = await request.json<{ question?: string; preferredLanguage?: string }>();
      const links = await search(env, body.question ?? '', 8);
      return json({
        answer: answerFromLinks(body.question ?? '', body.preferredLanguage ?? 'zh-TW', links),
        evidence: links.slice(0, 4).map((link, index) => ({
          id: `d1-${index}`,
          label: link.title,
          text: link.description,
          score: link.score,
          source: 'wiki',
        })),
        links,
      });
    }
    return json({ ok: true, endpoints: ['/api/memory/search', '/api/chat/campfire', '/api/chat/npc'] });
  },
};
