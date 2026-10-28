import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.resolve(root, '../dist/webview');
const prefix = '/peach-blossom-spring/';
const output = path.join(root, 'test-results/pages');
mkdirSync(output, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };
const server = createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (!pathname.startsWith(prefix)) { res.writeHead(404).end(); return; }
  const filename = path.resolve(dist, pathname.slice(prefix.length) || 'index.html');
  if (!filename.startsWith(`${dist}/`) || !existsSync(filename)) { res.writeHead(404).end(); return; }
  try { res.setHeader('Content-Type', types[path.extname(filename)] ?? 'application/octet-stream'); res.end(readFileSync(filename)); }
  catch { res.writeHead(404).end(); }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = process.env.PBS_VERIFY_URL || `http://127.0.0.1:${server.address().port}${prefix}`;
const languages = ['zh-TW', 'en', 'id', 'de', 'ja', 'th'];
const answers = {
  'zh-TW': '原文描述 Alpha Kit 當時仍在開發中，規劃包含音訊、溫度、紅外線與濕度感測器。',
  en: 'The source describes the Alpha Kit as being developed with audio, temperature, infrared and humidity sensors.',
  id: 'Sumber menjelaskan bahwa Alpha Kit sedang dikembangkan dengan sensor audio, suhu, inframerah, dan kelembapan.',
  de: 'Die Quelle beschreibt das Alpha Kit als in Entwicklung, mit Audio-, Temperatur-, Infrarot- und Feuchtigkeitssensoren.',
  ja: '原文では、Alpha Kit は音声、温度、赤外線、湿度のセンサーを備える開発中のキットとして説明されています。',
  th: 'ต้นฉบับอธิบายว่า Alpha Kit อยู่ระหว่างการพัฒนา โดยวางแผนใช้เซนเซอร์เสียง อุณหภูมิ อินฟราเรด และความชื้น',
};
const quote = 'The first Alpha Kit is being developed with audio, temperature, infrared, and humidity sensors.';
const browser = await chromium.launch();
const reports = [];
try {
  const context = await browser.newContext();
  for (const language of languages) {
    for (const width of [390, 1440]) {
      const page = await context.newPage();
      await page.setViewportSize({ width, height: 960 });
      await page.route('**/*', (route) => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort());
      await page.goto(`${base}?qa-lang=${language}`, { waitUntil: 'networkidle' });
      await page.waitForSelector('.retro-boot-overlay');
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator('.pbs-interaction-root').getAttribute('data-language'), language);
      const heading = await page.locator('.retro-title-card h1').evaluate((element) => { const style = getComputedStyle(element); return { size: parseFloat(style.fontSize), font: style.fontFamily }; });
      assert.ok(heading.size >= 32 && heading.size <= 60, `${language}/${width} boot title out of bounds`);
      if (['zh-TW', 'ja', 'th'].includes(language)) assert.match(heading.font, /Noto Sans/);
      await page.screenshot({ path: path.join(output, `${language}-home-${width}.png`) });
      reports.push({ language, width, home: true, heading });
      await page.close();
    }
  }
  for (const width of [320, 390, 768, 1440]) {
    for (const language of languages) {
      for (const panel of ['computer', 'npc', 'hud', 'language', 'zine']) {
        const page = await context.newPage();
        await page.setViewportSize({ width, height: 960 });
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.route('**/*', async (route) => {
          if (new URL(route.request().url()).origin === new URL(base).origin) return route.continue();
          return route.abort();
        });
        await page.goto(`${base}?qa-ui=1&qa-lang=${language}&qa-panel=${panel}`, { waitUntil: 'networkidle' });
        const dialoguePanel = ['computer', 'npc', 'language'].includes(panel);
        await page.waitForSelector(dialoguePanel ? '.rpg-dialogue-panel' : panel === 'hud' ? '.question-status-panel:visible, .mobile-stats-bar:visible' : '.world-split-panel', { timeout: 20000 })
          .catch((error) => { throw new Error(`${language}/${width}/${panel}: ${error.message}`); });
        await page.evaluate(() => document.fonts.ready);
        if (!dialoguePanel) {
          const slots = await page.locator('[data-ui-part]').evaluateAll((nodes) => nodes.map((node) => {
            const style = getComputedStyle(node);
            return { part: node.getAttribute('data-ui-part'), control: node.getAttribute('data-ui-control'), size: parseFloat(style.fontSize), font: style.fontFamily };
          }));
          const sizes = { title: width <= 700 ? 24 : 30, subtitle: width <= 700 ? 18 : 20, body: 18, caption: 14, field: 18, 'button-label': 16, micro: 12 };
          for (const slot of slots.filter((slot) => !slot.control)) if (sizes[slot.part]) assert.equal(slot.size, sizes[slot.part], `${language}/${width}/${panel}/${slot.part}`);
          assert.deepEqual(errors, [], `${language}/${width}/${panel} JS errors`);
          if (width === 390 || width === 1440) await page.screenshot({ path: path.join(output, `${language}-${panel}-${width}.png`) });
          reports.push({ language, panel, width, slots });
          await page.close();
          continue;
        }
        const result = await page.evaluate(() => {
          const panel = document.querySelector('.rpg-dialogue-panel');
          const field = panel.querySelector('[data-ui-part="field"]');
          const body = panel.querySelector('.rpg-dialogue-message');
          const title = panel.querySelector('[data-ui-part="title"]');
          const close = panel.querySelector('[data-ui-control="window-action"]');
          const info = (node) => { const s = getComputedStyle(node); return { size: parseFloat(s.fontSize), line: parseFloat(s.lineHeight), font: s.fontFamily }; };
          const box = close.getBoundingClientRect();
          return { field: info(field), body: info(body), title: info(title), closeInside: box.left >= 0 && box.right <= innerWidth && box.top >= 0 && box.bottom <= innerHeight,
            overflow: panel.scrollWidth > panel.clientWidth + 2, fontStatus: document.fonts.status };
        });
        assert.equal(result.field.size, 18, `${language}/${width}/${panel} field`);
        assert.equal(result.body.size, 18, `${language}/${width}/${panel} body`);
        assert.equal(result.title.size, width <= 700 ? 24 : 30, `${language}/${width}/${panel} title`);
        assert.equal(result.field.font, result.body.font, `${language}/${width}/${panel} mixed font`);
        assert.ok(result.closeInside, `${language}/${width}/${panel} close out of viewport`);
        assert.equal(result.overflow, false, `${language}/${width}/${panel} panel overflow`);
        assert.deepEqual(errors, [], `${language}/${width}/${panel} JS errors`);
        if (['ja', 'th', 'zh-TW'].includes(language)) assert.match(result.body.font, /Noto Sans/);
        if (width === 390 || width === 1440) await page.screenshot({ path: path.join(output, `${language}-${panel}-${width}.png`) });
        reports.push({ language, panel, width, ...result });
        await page.close();
      }
    }
  }
  // Exercise the real public UI, real corpus, JSON contract, review, same-packet publication,
  // persisted shelf and print layout. Only model responses are controlled fixtures.
  for (const language of languages) {
    const page = await context.newPage();
    await page.setViewportSize({ width: 390, height: 960 });
    let modelCalls = 0;
    let firstIds;
    await page.route('**/*', async (route) => {
      const request = route.request();
      if (new URL(request.url()).origin === new URL(base).origin) return route.continue();
      if (/pbs-deepseek-proxy.*\/chat/.test(request.url())) {
        modelCalls++;
        const payload = request.postDataJSON();
        const input = JSON.parse(payload.messages[1].content);
        if (payload.messages[0].content.includes('independent evidence editor')) return route.fulfill({ json: { content: JSON.stringify({ supported: true, languageCorrect: true }) } });
        const ids = input.passages.map((passage) => passage.id);
        if (!firstIds) firstIds = ids;
        else assert.deepEqual(ids, firstIds, 'The publication silently changed its evidence');
        const passage = input.passages.find((item) => item.text.includes(quote));
        assert.ok(passage, 'The Alpha Kit original passage is missing');
        return route.fulfill({ json: { content: JSON.stringify({ statements: [{ text: answers[language], quote, kind: 'fact', passageId: passage.id }] }) } });
      }
      return route.abort();
    });
    await page.goto(`${base}?qa-ui=1&qa-lang=${language}&qa-panel=computer`, { waitUntil: 'networkidle' });
    const field = page.locator('.rpg-dialogue-input');
    const submit = page.locator('.rpg-dialogue-submit');
    await field.fill('quasar-zzzz-no-such-material'); await submit.click();
    await page.waitForFunction(() => !document.querySelector('.rpg-dialogue-submit').disabled);
    assert.equal(modelCalls, 0, 'Missing evidence must not invoke the model');
    await field.fill('蜂箱感測器'); await submit.click();
    await page.getByText(answers[language], { exact: false }).first().waitFor();
    assert.equal(modelCalls, 2);
    await field.fill('蜂箱感測器'); await page.locator('[data-ui-control="icon-button"]').filter({ hasText: '📚' }).click();
    await page.waitForSelector('iframe[src^="blob:"]', { timeout: 20000 });
    const iframe = page.locator('iframe[src^="blob:"]');
    const frame = await (await iframe.elementHandle()).contentFrame();
    await frame.waitForSelector('html[data-publication-id]');
    assert.ok((await frame.locator('body').innerText()).includes(answers[language]));
    await frame.evaluate(() => document.fonts.ready);
    assert.equal(await frame.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2), false, `${language} publication overflow`);
    const html = await frame.content();
    const printPage = await context.newPage();
    await printPage.setContent(html, { waitUntil: 'networkidle' });
    await printPage.evaluate(() => document.fonts.ready);
    const pdf = await printPage.pdf({ preferCSSPageSize: true, printBackground: true });
    assert.ok(pdf.length > 10000, `${language} PDF is unexpectedly empty`);
    const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) ?? []).length;
    assert.ok(pages >= 1 && pages <= 5, `${language} unexpected PDF page count ${pages}`);
    writeFileSync(path.join(output, `${language}.pdf`), pdf);
    await printPage.screenshot({ path: path.join(output, `${language}-publication.png`), fullPage: true });
    await printPage.close();
    assert.equal(modelCalls, 4);
    assert.equal(await page.locator('.pbs-publication-shelf').count(), 1);
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('.pbs-publication-shelf').count(), 1, 'The saved artifact disappeared after reload');
    reports.push({ language, publication: true, modelCalls, pdfPages: pages, pdfBytes: pdf.length });
    await page.close();
  }
  await context.close();
  writeFileSync(path.join(output, 'report.json'), JSON.stringify(reports, null, 2));
  console.log(`Pages QA passed: 12 home screens, 120 multilingual/viewport panels, 6 query/publication/save/PDF flows. ${output}`);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
