#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const bannedPatterns = [
  /\bworkflow\b/i,
  /\bworkflow run\b/i,
  /\bstep\s*[1-4]\b/i,
  /\bphase\s*[1-4]\b/i,
  /\bdebug\b/i,
  /\bprovenance\b/i,
  /\bsource\s*trail\b/i,
  /\bsources?\b/i,
  /\bcolophon\b/i,
  /\bstatic\s*html\b/i,
  /\bno[-\s]?js\b/i,
  /\bno\s+script\b/i,
  /\bgenerated\s*type\b/i,
  /\bgenerative\s*type\b/i,
  /\bColdtype\b/i,
  /\bDrawBot\b/i,
  /\bopentype\.js\b/i,
  /\bfontTools\b/i,
  /\bfontmake\b/i,
  /\bPaged\.js\b/i,
  /\bSplitting\.js\b/i,
  /\bBasil\.js\b/i,
  /\bSVG\s*\/\s*CSS\b/i,
  /\bHTML\b/i,
  /\bCSS\b/i,
  /\bJavaScript\b/i,
  /\bscript\b/i,
  /\bPBS\s+vault\b/i,
  /\bsourceCards\b/i,
  /\bcategoryGraph\b/i,
  /\bcorpusManifest\b/i,
  /\bAssociation\s+workflow\b/i,
  /\bconnected[-\s]?paper/i,
  /\bsemantic\s+vector\b/i,
  /\bdepth\s+gate\b/i,
  /\brecursive\s+linked[-\s]?source\s+reading\b/i,
  /後台/,
  /工作流/,
  /流程語言/,
  /工具名/,
  /來源軌跡/,
  /來源列表/,
  /原始資料/,
  /偵錯/,
];

function extractPublicArtifactText(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function inspectPublicArtifact(html) {
  const visibleText = extractPublicArtifactText(html);
  const violations = [];
  for (const pattern of bannedPatterns) {
    const match = pattern.exec(visibleText);
    if (!match || match.index === undefined) continue;
    const start = Math.max(0, match.index - 48);
    const end = Math.min(visibleText.length, match.index + match[0].length + 48);
    violations.push({ pattern: pattern.toString(), excerpt: visibleText.slice(start, end) });
  }
  return { ok: violations.length === 0, violations };
}

const files = process.argv.slice(2);

if (files.length === 0) {
  console.error('Usage: npm run check:public-artifact -- <artifact.html> [...more.html]');
  process.exit(2);
}

let failed = false;

for (const file of files) {
  const path = resolve(file);
  const html = await readFile(path, 'utf8');
  const result = inspectPublicArtifact(html);

  if (result.ok) {
    console.log(`✓ clean public artifact: ${path}`);
    continue;
  }

  failed = true;
  console.error(`✗ backend/provenance/tooling language found in public artifact: ${path}`);
  for (const violation of result.violations) {
    console.error(`  - ${violation.pattern}: …${violation.excerpt}…`);
  }
}

if (failed) process.exit(1);
