import { chromium } from '@playwright/test';

const baseUrl = process.env.PBS_PUBLIC_ZINE_URL || 'https://weiweiweiopen.github.io/peach-blossom-spring/';
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
  return hits.length >= 2 && /證據|查證|材料|限制|問題|Reading materials/i.test(text);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.setDefaultTimeout(420000);
const results = [];

try {
  for (const item of cases) {
    const startedAt = Date.now();
    const url = `${baseUrl}?qa-ui=1&qa-panel=computer&qa-lang=zh-TW&smoke=${Date.now()}`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.locator('.rpg-dialogue-input').fill(item.query);
    await page.locator('button[aria-label="維基小書"]').click();
    const iframeHandle = await page.waitForSelector('.world-split-iframe', { timeout: 420000 });
    const frame = await iframeHandle.contentFrame();
    assert(frame, `${item.query}: zine iframe missing frame`);
    await frame.waitForSelector('.pbs-reading-materials', { timeout: 420000 });
    await frame.waitForSelector('.pbs-readable-trace', { timeout: 420000 });
    const text = await frame.locator('body').innerText({ timeout: 420000 });
    const html = await frame.locator('html').evaluate((node) => node.outerHTML);
    assert(!/world-association-error|public_validation_error|low_relevance_zine|沒有找到足夠的證據/i.test(text + html), `${item.query}: contains error or insufficient evidence marker`);
    assert(text.length >= 1800, `${item.query}: visible text too short (${text.length})`);
    assert(hasInsight(text, item.terms), `${item.query}: lacks expected concrete/insight terms`);
    results.push({ query: item.query, chars: text.length, durationMs: Date.now() - startedAt });
  }
} finally {
  await browser.close();
}

console.log(JSON.stringify({ ok: true, count: results.length, results }, null, 2));
