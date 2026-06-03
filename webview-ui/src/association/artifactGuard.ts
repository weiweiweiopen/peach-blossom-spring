export interface ArtifactGuardViolation {
  pattern: string;
  excerpt: string;
}

export interface ArtifactGuardResult {
  ok: boolean;
  visibleText: string;
  violations: ArtifactGuardViolation[];
}

/**
 * Public Association/zine artifacts must speak only in the work's own voice.
 * Workflow labels, implementation notes, debug/provenance labels, tool names,
 * source-card labels, and delivery mechanics belong in private metadata or a
 * separate debug artifact — never in the public surface.
 */
export const PUBLIC_ARTIFACT_BANNED_PATTERNS: RegExp[] = [
  /\bworkflow\b/i,
  /\bworkflow run\b/i,
  /\bstep\s*[1-4]\b/i,
  /\bphase\s*[1-4]\b/i,
  /\bdebug\b/i,
  /\bprovenance\b/i,
  /\bsource\s*trail\b/i,
  /\bsource\s*graph\b/i,
  /\bsources?\b/i,
  /\bbackend\b/i,
  /\binternal\s+process\b/i,
  /\bprompt\b/i,
  /\bsystem\s+language\b/i,
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
  /來源圖/,
  /來源圖譜/,
  /內部流程/,
  /提示詞/,
  /系統語言/,
  /工作流/,
  /流程語言/,
  /工具名/,
  /來源軌跡/,
  /來源列表/,
  /原始資料/,
  /偵錯/,
  /\bPOTENTIAL\s+TOPIC\b/i,
  /\bSource:\b/i,
  /\bExcerpt\b/i,
  /\bDepth\s*score\b/i,
  /\bdeepReadCards\b/i,
  /\bresearchTopics\b/i,
  /\bselectedTopic\b/i,
  /\bMOUSE1\b/i,
  /\bMOUSE2\b/i,
  /\bmask\s*debug\b/i,
  /\bGLYPH\s+MASK\s+FLOW\b/i,
  /\bPRINT\s+CALIBRATION\b/i,
  /原始摘錄/,
  /深度門檻/,
  /校正頁/,
  /generated question/i,
  /research score/i,
  /source paths?/i,
  /\bpath\s*\//i,
  /traversal/i,
  /プロンプト/i,
  /システム言語/i,
  /バックエンド/i,
  /トラバーサル/i,
  /graf sumber/i,
  /bahasa sistem/i,
  /proses internal/i,
  /quellgraph/i,
  /systemsprache/i,
  /interner prozess/i,
  /แบ็กเอนด์/i,
  /พรอมป์ต์/i,
  /ภาษาระบบ/i,
  /secondary seed/i,
  /玩家\s*seed/i,
  /\bseed[-\s]?(?:words?|workflow|phrase|sentence|mechanism|text)\b/i,
  /\b(?:generated\s+from|derived\s+from)\s+(?:a\s+)?seed\b/i,
  /命中/,
  /第一層/,
  /第二層/,
  /來源路徑/,
  /搜尋結果/,
  /檢索過程/,
  /正文裡作為路徑使用/,
];

export function extractPublicArtifactText(html: string): string {
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

export function inspectPublicArtifact(html: string): ArtifactGuardResult {
  const visibleText = extractPublicArtifactText(html);
  const violations = PUBLIC_ARTIFACT_BANNED_PATTERNS.flatMap((pattern) => {
    const match = pattern.exec(visibleText);
    if (!match || match.index === undefined) return [];
    const start = Math.max(0, match.index - 48);
    const end = Math.min(visibleText.length, match.index + match[0].length + 48);
    return [{ pattern: pattern.toString(), excerpt: visibleText.slice(start, end) }];
  });

  return { ok: violations.length === 0, visibleText, violations };
}

export function assertCleanPublicArtifact(html: string): void {
  const result = inspectPublicArtifact(html);
  if (result.ok) return;

  const details = result.violations
    .map((violation) => `- ${violation.pattern}: …${violation.excerpt}…`)
    .join('\n');
  throw new Error(`Public artifact contains backend/provenance/tooling language:\n${details}`);
}
