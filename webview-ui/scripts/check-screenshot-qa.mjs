import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const outDir = join(root, "test-results", "ui-screenshots");
const host = "127.0.0.1";
const port = 5177;
const baseUrl = `http://${host}:${port}`;
const languages = ["zh-TW", "en", "id", "de", "ja", "th"];
const panels = ["computer", "npc", "pet", "zine", "language"];
const viewport = { width: 1440, height: 900 };

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, timeoutMs = 30000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await wait(500);
  }
  throw new Error(`Vite server did not respond at ${url} within ${timeoutMs}ms`);
}

function startServer() {
  const child = spawn("npm", ["run", "dev", "--", "--host", host, "--port", String(port)], {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, BROWSER: "none" },
  });
  child.stdout.on("data", (chunk) => process.stdout.write(`[vite] ${chunk}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`[vite] ${chunk}`));
  return child;
}

function stopServer(child) {
  if (!child || child.killed) return;
  child.kill("SIGTERM");
}

async function measurePage(page, language, panel) {
  return page.evaluate(({ language, panel }) => {
    const visible = (element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
    };
    const rectOf = (element) => {
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height, x: rect.x, y: rect.y };
    };
    const failures = [];
    const iconButtons = Array.from(document.querySelectorAll('[data-ui-control="icon-button"]')).filter(visible);
    for (const button of iconButtons) {
      const rect = rectOf(button);
      if (Math.abs(rect.width - 64) > 1 || Math.abs(rect.height - 64) > 1) {
        failures.push(`${language}/${panel}: icon button not 64px square (${rect.width.toFixed(1)}x${rect.height.toFixed(1)})`);
      }
    }
    const windowButtons = Array.from(document.querySelectorAll('[data-ui-control="window-action"]')).filter(visible);
    for (const button of windowButtons) {
      const rect = rectOf(button);
      if (Math.abs(rect.width - 34) > 1 || Math.abs(rect.height - 34) > 1) {
        failures.push(`${language}/${panel}: window action not 34px square (${rect.width.toFixed(1)}x${rect.height.toFixed(1)})`);
      }
    }
    const overflowTargets = Array.from(document.querySelectorAll([
      '[data-ui-part]',
      '.global-language-options button',
      '.question-status-panel',
      '.question-response-panel',
      '.world-split-toolbar h2',
    ].join(','))).filter(visible);
    for (const element of overflowTargets) {
      const style = window.getComputedStyle(element);
      const allowsXScroll = ["auto", "scroll"].includes(style.overflowX);
      const allowsEllipsis = style.textOverflow === "ellipsis" && style.overflowX === "hidden" && style.whiteSpace === "nowrap";
      if (!allowsXScroll && !allowsEllipsis && element.scrollWidth > element.clientWidth + 2) {
        const label = element.getAttribute("data-ui-part") || element.className || element.tagName;
        failures.push(`${language}/${panel}: horizontal overflow in ${String(label).slice(0, 80)} (${element.scrollWidth}>${element.clientWidth})`);
      }
    }
    for (const splitPanel of Array.from(document.querySelectorAll('.world-split-panel')).filter(visible)) {
      const close = splitPanel.querySelector('.world-split-close');
      if (!close || !visible(close)) {
        failures.push(`${language}/${panel}: split panel close button not visible`);
        continue;
      }
      const panelRect = splitPanel.getBoundingClientRect();
      const closeRect = close.getBoundingClientRect();
      if (closeRect.right > panelRect.right + 1 || closeRect.left < panelRect.left - 1 || closeRect.top < panelRect.top - 1) {
        failures.push(`${language}/${panel}: split panel close button outside panel bounds`);
      }
    }
    for (const form of Array.from(document.querySelectorAll('.rpg-dialogue-form')).filter(visible)) {
      const input = form.querySelector('[data-ui-part="field"]');
      const controls = Array.from(form.querySelectorAll('[data-ui-control="icon-button"]')).filter(visible);
      if (!input || controls.length === 0) continue;
      const inputHeight = input.getBoundingClientRect().height;
      for (const control of controls) {
        const controlHeight = control.getBoundingClientRect().height;
        if (Math.abs(inputHeight - controlHeight) > 1) {
          failures.push(`${language}/${panel}: dialogue footer height mismatch input=${inputHeight.toFixed(1)} control=${controlHeight.toFixed(1)}`);
        }
      }
    }
    const menuItems = Array.from(document.querySelectorAll('.global-language-options button')).filter(visible);
    if (menuItems.length > 1) {
      const heights = menuItems.map((item) => item.getBoundingClientRect().height);
      const min = Math.min(...heights);
      const max = Math.max(...heights);
      if (max - min > 1) failures.push(`${language}/${panel}: language menu row heights differ (${min.toFixed(1)}..${max.toFixed(1)})`);
    }
    return { failures, counts: { iconButtons: iconButtons.length, windowButtons: windowButtons.length, overflowTargets: overflowTargets.length } };
  }, { language, panel });
}

async function waitForPanel(page, panel) {
  try {
    await page.waitForSelector('.pbs-interaction-root[data-language]', { timeout: 30000 });
    if (panel === "computer" || panel === "language") await page.waitForSelector('.rpg-dialogue-panel', { timeout: 30000 });
    if (panel === "npc") await page.waitForSelector('.rpg-dialogue-panel', { timeout: 30000 });
    if (panel === "pet") await page.waitForSelector('.question-response-panel', { timeout: 30000 });
    if (panel === "zine") await page.waitForSelector('.world-split-panel', { timeout: 30000 });
    if (panel === "language") await page.waitForSelector('.global-language-options', { timeout: 30000 });
  } catch (error) {
    const bodyText = await page.locator('body').innerText({ timeout: 1000 }).catch(() => 'body unavailable');
    throw new Error(`${error instanceof Error ? error.message : String(error)}\nCurrent body text: ${bodyText.slice(0, 800)}`);
  }
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  const server = startServer();
  let browser;
  const failures = [];
  try {
    await waitForServer(baseUrl);
    browser = await chromium.launch();
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    for (const language of languages) {
      for (const panel of panels) {
        const page = await context.newPage();
        page.on("console", (message) => {
          if (["error", "warning"].includes(message.type())) {
            console.warn(`[browser:${language}/${panel}] ${message.type()}: ${message.text()}`);
          }
        });
        page.on("pageerror", (error) => console.warn(`[browser:${language}/${panel}] pageerror: ${error.message}`));
        const url = `${baseUrl}/?qa-ui=1&qa-lang=${encodeURIComponent(language)}&qa-panel=${panel}`;
        console.log(`Screenshot QA fixture: ${language}/${panel}`);
        await page.goto(url, { waitUntil: "networkidle" });
        await waitForPanel(page, panel);
        await page.waitForTimeout(450);
        const screenshotPath = join(outDir, `${language}-${panel}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        const result = await measurePage(page, language, panel);
        failures.push(...result.failures);
        await page.close();
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/Executable doesn't exist|browserType\.launch/i.test(message)) {
      throw new Error(`${message}\nInstall browser binaries with: npm --prefix webview-ui exec playwright install chromium`);
    }
    throw error;
  } finally {
    if (browser) await browser.close();
    stopServer(server);
  }
  if (failures.length > 0) {
    console.error("Screenshot QA failures:");
    for (const failure of failures) console.error(`- ${failure}`);
    console.error(`Screenshots written to ${outDir}`);
    process.exit(1);
  }
  console.log(`Screenshot QA passed for ${languages.length * panels.length} fixtures. Screenshots: ${outDir}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
