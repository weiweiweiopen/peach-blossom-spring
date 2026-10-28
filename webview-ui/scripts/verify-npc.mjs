import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { chromium, webkit } from '@playwright/test';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.resolve(root, '../dist/webview');
const prefix = '/peach-blossom-spring/';
const live = process.env.PBS_NPC_LIVE === '1';
const output = path.join(root, 'test-results', live ? 'npc-live' : 'npc');
mkdirSync(output, { recursive: true });
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.png': 'image/png' };
const server = createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const filename = path.resolve(dist, pathname.slice(prefix.length) || 'index.html');
  if (!pathname.startsWith(prefix) || !filename.startsWith(`${dist}/`) || !existsSync(filename)) { response.writeHead(404).end(); return; }
  try { response.setHeader('Content-Type', mime[path.extname(filename)] ?? 'application/octet-stream'); response.end(readFileSync(filename)); }
  catch { response.writeHead(404).end(); }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = process.env.PBS_NPC_VERIFY_URL || `http://127.0.0.1:${server.address().port}${prefix}`;
const identityQuestions = { 'zh-TW': '你是誰', en: 'Who are you?', id: 'Siapa kamu?', de: 'Wer bist du?', ja: 'あなたは誰ですか？', th: 'คุณเป็นใคร' };
const activityQuestions = { 'zh-TW': '現在泰國有什麼活動', en: 'What events are happening in Thailand now?', id: 'Apa kegiatan terbaru di Thailand?', de: 'Welche Veranstaltungen gibt es jetzt in Thailand?', ja: 'タイで今どんなイベントがありますか', th: 'ตอนนี้ประเทศไทยมีกิจกรรมอะไรบ้าง' };
const eventReplies = {
  'zh-TW': '我找到清邁 Arai-eek Co-Laboratory 的活動紀錄，原文日期是 2026 年 5 月 17–30 日；這是過去的場次，不是今天的活動。',
  en: 'I found the Chiang Mai Arai-eek Co-Laboratory record for 17–30 May 2026; these are past dates, not an event happening today.',
  id: 'Aku menemukan catatan Arai-eek Co-Laboratory di Chiang Mai pada 17–30 Mei 2026; itu tanggal yang sudah lewat, bukan acara hari ini.',
  de: 'Ich fand den Eintrag zum Arai-eek Co-Laboratory in Chiang Mai vom 17. bis 30. Mai 2026; das sind vergangene Termine, keine heutige Veranstaltung.',
  ja: 'チェンマイの Arai-eek Co-Laboratory の記録が見つかりました。開催日は2026年5月17〜30日で、今日の催しではなく過去の記録です。',
  th: 'ฉันพบบันทึก Arai-eek Co-Laboratory ที่เชียงใหม่ วันที่ 17–30 พฤษภาคม 2026 ซึ่งเป็นกำหนดการในอดีต ไม่ใช่กิจกรรมวันนี้',
};
const interviewReplies = {
  'zh-TW': '在這份訪談中，我談到 Hackteria 的起源與開放實作。',
  en: 'In this interview account, I discussed the origins of Hackteria and open practice.',
  id: 'Dalam wawancara ini, aku membahas asal-usul Hackteria dan praktik terbuka.',
  de: 'In diesem Interview sprach ich über die Anfänge von Hackteria und offene Praxis.',
  ja: 'このインタビューでは、Hackteria の始まりとオープンな実践について話しています。',
  th: 'ในบทสัมภาษณ์นี้ ฉันพูดถึงจุดเริ่มต้นของ Hackteria และการปฏิบัติแบบเปิด',
};
const quote = 'The Arai-eek Co-Laboratory in Chiang Mai, Thailand ran from 17 to 30 May 2026.';
const reflectionReplies = {
  'zh-TW': '我會建議先做一個便宜、能拆開重做的小實驗，再邀朋友一起試。',
  en: 'I would start with a small, inexpensive experiment that we can take apart and remake, then invite friends to try it.',
  id: 'Aku menyarankan percobaan kecil dan murah yang bisa dibongkar dan dibuat ulang, lalu mengajak teman untuk mencobanya.',
  de: 'Ich würde mit einem kleinen, günstigen Experiment anfangen, das wir zerlegen und neu bauen können, und Freunde zum Ausprobieren einladen.',
  ja: 'まず、安くて分解し直せる小さな実験から始めて、友人と一緒に試すことを勧めます。',
  th: 'ฉันแนะนำให้เริ่มจากการทดลองเล็ก ๆ ราคาถูกที่ถอดประกอบและทำใหม่ได้ แล้วชวนเพื่อนมาลองด้วยกัน',
};
const report = [];
const engines = process.env.PBS_NPC_WEBKIT === '1' ? [{ name: 'webkit', type: webkit }] : [{ name: 'chromium', type: chromium }];
try {
  for (const engine of engines) {
    const browser = await engine.type.launch();
    try {
      const languages = process.env.PBS_NPC_LANGUAGE ? [process.env.PBS_NPC_LANGUAGE] : ['zh-TW', 'en', 'id', 'de', 'ja', 'th'];
      for (const language of languages) {
        const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
        const page = await context.newPage();
        let modelCalls = 0;
        let wikiCalls = 0;
        let sawInterview = false;
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('console', (message) => { if (message.type() === 'warning') console.log(`${engine.name}/${language}: ${message.text()}`); });
        await page.route('**/*', async (route) => {
          const request = route.request();
          const url = new URL(request.url());
          if (url.origin === new URL(base).origin) return route.continue();
          if (url.hostname === 'www.hackteria.org' && url.pathname === '/wiki/api.php') {
            wikiCalls++;
            if (live) return route.continue();
            return route.fulfill({ json: { parse: { title: url.searchParams.get('page'), pageid: wikiCalls, revid: 902030,
              text: { '*': `<h2>Activities and Events</h2><p>${quote}</p><p>The programme brought public workshops and collaborative research to Chiang Mai.</p>` } } } });
          }
          if (url.hostname === 'pbs-deepseek-proxy.dontmarryme.workers.dev') {
            modelCalls++;
            if (live) {
              if (new URL(base).hostname.endsWith('github.io')) return route.continue();
              // Local opt-in live tests forward through the test runner. The
              // deployed-site test above uses the browser's real CORS path.
              const upstream = await route.fetch({ headers: { ...request.headers(), Origin: 'https://weiweiweiopen.github.io' }, timeout: 180000 });
              if (process.env.PBS_DEBUG_MODEL === '1') { const value = await upstream.json(); console.log('MODEL', value.answer ?? value.content ?? value.error); }
              return route.fulfill({ response: upstream, headers: { ...upstream.headers(), 'access-control-allow-origin': new URL(base).origin } });
            }
            const payload = request.postDataJSON();
            const data = JSON.parse(payload.messages[1].content);
            if (payload.messages[0].content.includes('Review a character')) return route.fulfill({ json: { answer: JSON.stringify({ languageCorrect: true, noUnsupportedFacts: true }) } });
            if (payload.messages[0].content.includes('selected camper in a game')) return route.fulfill({ json: { answer: JSON.stringify({ reply: reflectionReplies[language] }) } });
            if (payload.messages[0].content.includes('independent evidence editor')) return route.fulfill({ json: { answer: JSON.stringify({ supported: true, languageCorrect: true }) } });
            const interview = data.passages.find((passage) => passage.kind === 'testimony' && passage.text.includes('Hackteria'));
            if (/NGM|訪談|interview/i.test(data.question)) {
              assert.ok(interview, 'The NPC did not receive its real interview');
              sawInterview = true;
              return route.fulfill({ json: { answer: JSON.stringify({ statements: [{ text: interviewReplies[language], passageId: interview.id, quote: interview.text.slice(0, 160), kind: 'testimony' }] }) } });
            }
            const passage = data.passages.find((passage) => passage.text.includes(quote));
            assert.ok(passage?.id.startsWith('live-hackteria-'), 'Current queries must read the relevant live page, not just relabel the archive');
            return route.fulfill({ json: { answer: JSON.stringify({ statements: [{ text: eventReplies[language], passageId: passage.id, quote, kind: 'fact' }] }) } });
          }
          return route.abort();
        });
        await page.goto(`${base}?qa-ui=1&qa-lang=${language}&qa-panel=npc&qa-npc=marc-dusseiller&qa-player=abao`, { waitUntil: 'networkidle' });
        await page.waitForSelector('.rpg-dialogue-panel');
        assert.match(await page.locator('.rpg-dialogue-role').innerText(), /Hackteria/i);
        const send = async (question) => {
          const before = await page.locator('[data-speaker-role="assistant"]').count();
          await page.locator('.rpg-dialogue-input').fill(question);
          await page.locator('.rpg-dialogue-submit').click();
          await page.waitForFunction((count) => document.querySelectorAll('[data-speaker-role="assistant"]').length > count && !document.querySelector('.rpg-dialogue-submit').disabled, before, { timeout: 180000 });
          await page.waitForFunction(() => { const log = document.querySelector('.rpg-dialogue-log'); return log && log.scrollHeight - log.scrollTop - log.clientHeight < 4; }, null, { timeout: 5000 });
          assert.equal((await page.locator('[data-speaker-role="user"] span').last().innerText()).trim(), 'abao:');
          assert.ok((await page.locator('[data-speaker-role="user"]').last().innerText()).includes(question), 'The player’s words were altered');
          return page.locator('[data-speaker-role="assistant"]').last().locator('p').first().innerText();
        };
        const identity = await send(identityQuestions[language]);
        assert.match(identity, /Hackteria/i); assert.equal(modelCalls, 0); assert.equal(wikiCalls, 0);
        const activities = await send(activityQuestions[language]);
        assert.ok(wikiCalls > 0); assert.match(activities, /\[\d+\]/);
        assert.match(activities, /2026|2024|Arai|CoLab|清邁|チェンマイ|เชียงใหม่/);
        assert.doesNotMatch(activities, /找不到足以回答/);
        const callsAfterActivities = modelCalls;
        const identityAgain = await send(identityQuestions[language]);
        assert.match(identityAgain, /Hackteria/i); assert.equal(modelCalls, callsAfterActivities);
        await page.screenshot({ path: path.join(output, `${engine.name}-${language}-screenshot-regression.png`) });
        const interview = await send('NGM 訪談裡，你怎麼介紹 Hackteria 的起源？');
        assert.match(interview, /\[\d+\]/);
        if (!live) assert.equal(sawInterview, true);
        assert.deepEqual(errors, []);
        await page.screenshot({ path: path.join(output, `${engine.name}-${language}-interview.png`) });
        const reflection = await send('What do you think I should try first?');
        assert.doesNotMatch(reflection, /找不到足以回答|這次我沒能|could not put that thought|今回は考えをうまく/);
        if (!live) assert.ok(reflection.includes(reflectionReplies[language]));
        report.push({ engine: engine.name, language, live, modelCalls, wikiCalls, identity, activities, identityAgain, interview, reflection });
        console.log(JSON.stringify(report.at(-1)));
        await context.close();
      }
    } finally { await browser.close(); }
  }
  writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(`NPC functional QA passed: ${report.length} character conversations, including the screenshot's two questions, player labels and real interview loading. ${output}`);
} finally { await new Promise((resolve) => server.close(resolve)); }
