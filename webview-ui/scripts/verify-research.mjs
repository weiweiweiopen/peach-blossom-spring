import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { chromium, webkit } from '@playwright/test';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.resolve(root, '../dist/webview');
const output = path.join(root, 'test-results/research');
mkdirSync(output, { recursive: true });
const prefix = '/peach-blossom-spring/';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };
const server = createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(dist, pathname.slice(prefix.length) || 'index.html');
  if (!pathname.startsWith(prefix) || !file.startsWith(`${dist}/`) || !existsSync(file)) return res.writeHead(404).end();
  try { res.setHeader('Content-Type', types[path.extname(file)] ?? 'application/octet-stream'); res.end(readFileSync(file)); } catch { res.writeHead(404).end(); }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = process.env.PBS_RESEARCH_URL || `http://127.0.0.1:${server.address().port}${prefix}`;
const language = process.env.PBS_RESEARCH_LANG || 'zh-TW';
const question = '怎麼製做導電縫線、織品的觸控螢幕？';
const quote = 'For Teensy 4.0, we used teensy40_fastTouch_midi.ino example sketch.';
const live = process.env.PBS_RESEARCH_LIVE === '1';
const engine = process.env.PBS_RESEARCH_WEBKIT === '1' ? webkit : chromium;
const report = [];
try {
  const browser = await engine.launch();
  try {
    for (const panel of ['computer', 'npc']) {
      const context = await browser.newContext({ viewport: { width: 1100, height: 850 }, acceptDownloads: true });
      const page = await context.newPage();
      let calls = 0;
      let passagesSeen = [];
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => { if (message.type() === 'warning') console.log(`${panel}: ${message.text()}`); });
      await page.route('**/*', async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        if (url.origin === new URL(base).origin) return route.continue();
        if (url.hostname !== 'pbs-deepseek-proxy.dontmarryme.workers.dev') return route.abort();
        calls++;
        if (live) {
          if (new URL(base).hostname.endsWith('github.io')) return route.continue();
          const upstream = await route.fetch({ headers: { ...request.headers(), Origin: 'https://weiweiweiopen.github.io' }, timeout: 180000 });
          return route.fulfill({ response: upstream, headers: { ...upstream.headers(), 'access-control-allow-origin': new URL(base).origin } });
        }
        const payload = request.postDataJSON();
        const input = JSON.parse(payload.messages[1].content);
        if (payload.messages[0].content.includes('Independently review a research answer')) return route.fulfill({ json: { answer: JSON.stringify({ supported: true, languageCorrect: true, issues: [] }) } });
        if (payload.messages[0].content.includes('source-grounded research assistant')) {
          passagesSeen = input.passages;
          const passage = input.passages.find((item) => item.text.includes(quote));
          assert.ok(passage, 'The actual code passage was not supplied');
          const response = { sections: [
            { title: '先確認目標', kind: 'answer', items: [{ id: 'a1', role: 'fact', text: '原文在 Teensy 4.0 使用 teensy40_fastTouch_midi.ino 範例程式。', supports: [{ passageId: passage.id, quote }] }] },
            { title: '限制', kind: 'limits', items: [{ id: 'g1', role: 'gap', text: '目前選到的資料沒有證明這是可顯示影像的螢幕。', supports: [] }] },
          ] };
          return route.fulfill({ json: { answer: JSON.stringify(response) } });
        }
        throw new Error(`Unexpected model request: ${payload.messages[0].content.slice(0, 150)}`);
      });
      await page.goto(`${base}?qa-ui=1&qa-lang=${language}&qa-panel=${panel}&qa-npc=marc-dusseiller&qa-player=abao`, { waitUntil: 'networkidle' });
      const field = page.locator('.rpg-dialogue-input');
      await field.fill(question);
      await page.locator('.rpg-dialogue-submit').click();
      await page.locator('[data-research-answer="true"]').waitFor({ timeout: 240000 });
      const message = page.locator('.rpg-dialogue-message').last();
      const answer = await message.locator('[data-research-answer]').innerText();
      assert.match(answer, /Teensy|Teensyduino|teensy/i);
      assert.ok((await message.locator('[data-research-section]').count()) >= 2);
      assert.ok((await message.locator('[data-answer-item]').count()) >= (live ? 6 : 2));
      assert.ok(!answer.includes('members'));
      const sourceCount = await message.locator('.answer-sources summary').first().innerText();
      assert.ok(sourceCount.includes('1') || sourceCount.includes('2') || sourceCount.includes('3'));
      await message.locator('.answer-sources summary').first().click();
      assert.equal(await message.locator('blockquote:visible').count(), 0, 'Raw passages must not flood the links area');
      assert.equal(await message.locator('.answer-source-heading a').evaluateAll((nodes) => new Set(nodes.map((node) => node.href)).size === nodes.length), true, 'Duplicate source URLs');
      await message.locator('[data-export-answer]').click();
      const getDownload = async (format) => {
        const pending = page.waitForEvent('download');
        await message.locator(`[data-export-format="${format}"]`).click();
        const download = await pending;
        const stream = await download.createReadStream();
        const chunks = []; for await (const chunk of stream) chunks.push(chunk);
        return Buffer.concat(chunks).toString('utf8');
      };
      const json = JSON.parse(await getDownload('json'));
      const markdown = await getDownload('md');
      assert.equal(json.question, question);
      assert.ok(json.research.verified);
      assert.ok(json.sources.length >= 1);
      assert.ok(json.sources.every((source) => source.quotations.length > 0));
      assert.ok(json.evidencePacket.passages.some((passage) => passage.text.includes('TeensyTouch')));
      assert.ok(json.evidencePacket.retrieval.candidates.some((candidate) => candidate.title === 'members' && candidate.decision === 'rejected'));
      assert.ok(json.modelTrace.some((entry) => entry.stage === 'draft'));
      assert.ok(json.modelTrace.some((entry) => entry.stage === 'review'));
      assert.ok(json.handoff.instruction.includes('implementable') || json.handoff.instruction.includes('deliverable'));
      assert.ok(markdown.includes(question)); assert.ok(markdown.includes('https://github.com/KOBAKANT/TeensyTouch'));
      assert.ok(markdown.includes('Sources/Raw/htgwyw/9812-playing-with-electronic-textiles.md'));
      assert.ok(!json.sources.some((source) => source.title === 'members'));
      if (!live) assert.ok(passagesSeen.length > 0);
      writeFileSync(path.join(output, `${panel}-answer.json`), JSON.stringify(json, null, 2));
      writeFileSync(path.join(output, `${panel}-answer.md`), markdown);
      await message.locator('.answer-quotations summary').first().click();
      assert.ok((await message.locator('blockquote:visible').count()) > 0);
      await message.screenshot({ path: path.join(output, `${panel}-${live ? 'live' : 'fixture'}.png`) });
      // Zine uses the same validated research, not a newly generated summary.
      const callsBeforeZine = calls;
      await field.fill(question);
      await page.locator('[data-ui-control="icon-button"]').filter({ hasText: '📚' }).click();
      const frameHandle = await page.waitForSelector('iframe[src^="blob:"]', { timeout: 20000 });
      const frame = await frameHandle.contentFrame();
      await frame.waitForSelector('html[data-publication-id]');
      assert.equal(await frame.locator('html').getAttribute('data-evidence-id'), json.evidencePacket.id);
      assert.ok((await frame.locator('body').innerText()).includes(json.research.sections[0].items[0].text));
      assert.equal(calls, callsBeforeZine, 'The zine must reuse the approved research, not regenerate facts');
      assert.deepEqual(errors, []);
      report.push({ panel, live, calls, answer, sources: json.sources.map((source) => source.url), packet: json.evidencePacket.id, mdBytes: Buffer.byteLength(markdown) });
      await context.close();
    }
  } finally { await browser.close(); }
  writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(`Research/export QA passed for NPC and campfire (${live ? 'real model' : 'controlled model'}). ${output}`);
} finally { await new Promise((resolve) => server.close(resolve)); }
