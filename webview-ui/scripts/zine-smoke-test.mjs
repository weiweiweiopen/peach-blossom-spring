import { chromium } from '@playwright/test';

const port = process.env.PBS_ZINE_SMOKE_PORT || '5176';
const baseUrl = process.env.PBS_ZINE_SMOKE_URL || `http://127.0.0.1:${port}/`;
const openAiKey = process.env.PBS_ZINE_SMOKE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '';
const openAiModel = process.env.PBS_ZINE_SMOKE_OPENAI_MODEL || 'gpt-4.1-mini';

if (!openAiKey) {
  throw new Error('PBS zine smoke test requires PBS_ZINE_SMOKE_OPENAI_API_KEY or OPENAI_API_KEY for local LLM request interception.');
}

const cases = [
  { query: '臨時藝術科技營隊如何形成 temporary commons？', terms: ['camp', 'commons', 'workshop'] },
  { query: '維護、失敗和 repair notes 如何成為工作坊知識？', terms: ['maintenance', 'failure', 'workshop'] },
  { query: 'e-textile workshop pedagogy 可以如何被整理成公共知識？', terms: ['textile', 'workshop', 'fabric'] },
  { query: 'DIY microscopy and imaging workshops 在 Hackteria 裡扮演什麼角色？', terms: ['microscopy', 'imaging', 'workshop'] },
  { query: 'conductive textiles and soft circuits 如何連接材料和教學？', terms: ['conductive', 'textile', 'circuit'] },
  { query: 'community labs and temporary labs 如何保存知識？', terms: ['community', 'lab', 'temporary'] },
  { query: 'camps and festivals 如何成為 knowledge infrastructure？', terms: ['camp', 'festival', 'knowledge'] },
  { query: '8bit Mix Tape 在 SGMK workshop infrastructure 中代表什麼？', terms: ['8bit', 'SGMK', 'workshop'] },
  { query: 'SGMK 和 Hackteria 的 workshop infrastructure 有什麼差異？', terms: ['SGMK', 'Hackteria', 'workshop'] },
  { query: 'material experimentation across community labs 有哪些可查證線索？', terms: ['material', 'experimentation', 'community'] },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function hasInsight(text, terms) {
  const compact = text.toLowerCase();
  const hits = terms.filter((term) => compact.includes(term.toLowerCase()));
  const hasCaveat = /證據|查證|source|reading materials|材料|限制|問題/i.test(text);
  return hits.length >= 2 && hasCaveat;
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.setDefaultTimeout(360000);
await page.route(/https:\/\/.*dontmarryme\.workers\.dev\/chat/, async (route) => {
  const request = route.request();
  const payload = request.postDataJSON();
  const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openAiKey}`,
    },
    body: JSON.stringify({
      model: openAiModel,
      messages: payload.messages,
      temperature: payload.temperature ?? 0.7,
      max_tokens: payload.max_tokens ?? 900,
      response_format: payload.response_format ?? { type: 'json_object' },
    }),
  });
  const text = await upstream.text();
  if (!upstream.ok) {
    await route.fulfill({ status: upstream.status, contentType: 'application/json', body: text });
    return;
  }
  const data = JSON.parse(text);
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ choices: [{ message: { content: data.choices?.[0]?.message?.content || '{}' } }] }),
  });
});
await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });

const results = [];
try {
  for (const item of cases) {
    const startedAt = Date.now();
    const result = await page.evaluate(async ({ query }) => {
      const module = await import('/src/daydream/browserAssociationGenerator.ts');
      return module.generateBrowserAssociationZine(query, 'zh-TW');
    }, { query: item.query });
    const text = result.visibleText || '';
    assert(result.title && result.title.trim().length > 0, `${item.query}: missing title`);
    assert(result.html.includes('pbs-reading-materials'), `${item.query}: missing reading materials`);
    assert(result.html.includes('pbs-readable-trace'), `${item.query}: missing readable trace`);
    assert(!/world-association-error|public_validation_error|low_relevance_zine|沒有找到足夠的證據/i.test(result.html), `${item.query}: contains error or insufficient evidence marker`);
    assert(text.length >= 1800, `${item.query}: visible text too short (${text.length})`);
    assert(hasInsight(text, item.terms), `${item.query}: lacks expected concrete/insight terms`);
    results.push({ query: item.query, title: result.title, chars: text.length, durationMs: Date.now() - startedAt });
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify({ ok: true, count: results.length, results }, null, 2));
