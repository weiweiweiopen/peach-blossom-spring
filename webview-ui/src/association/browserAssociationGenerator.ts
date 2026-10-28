import { EVIDENCE_COPY, getEvidencePacket, writeSupportedStatements } from '../evidence/pagesEvidence.js';
import type { LanguageCode } from '../i18n.js';
import { extractPublicArtifactText } from './artifactGuard.js';
import { publicationFontCss, renderEvidencePublication, savePublication, type EvidencePublication } from './evidencePublication.js';
import type { AssociationHtmlLayoutVariant } from './publicArtifactHtml.js';

export interface BrowserAssociationResult {
  title: string; html: string; visibleText: string; variant: AssociationHtmlLayoutVariant;
  requestId?: string; traceKey?: string; evidenceId?: string; saved?: boolean;
}
export interface BrowserAssociationOptions { writingStyle?: string; repairInstruction?: string; repairUsefulParts?: string; repairUselessParts?: string }
export type AssociationProgressCallback = (message: string) => void;
export type AssociationZineLanguage = LanguageCode;

export async function generateBrowserAssociationZine(query: string, language: LanguageCode = 'zh-TW', onProgress?: AssociationProgressCallback, options: BrowserAssociationOptions = {}): Promise<BrowserAssociationResult> {
  const copy = EVIDENCE_COPY[language];
  onProgress?.(copy.reading);
  const packet = await getEvidencePacket(query).catch(() => { throw new Error(copy.failed); });
  if (!packet.passages.length) {
    const error = new Error(copy.empty);
    error.name = 'LowRelevanceZineError';
    throw error;
  }
  onProgress?.(copy.writing);
  // The same immutable packet used by the answer is used by every writing/review stage.
  const instructions = ['Write a short, coherent publication answering the question. Evidence determines length; do not pad.',
    options.writingStyle ? `Style only, never additional facts: ${options.writingStyle.slice(0, 1200)}` : '',
    options.repairInstruction ? `Editorial request, subordinate to the evidence: ${options.repairInstruction.slice(0, 1200)}` : ''].join('\n');
  let statements;
  try {
    onProgress?.(copy.checking);
    statements = await writeSupportedStatements(packet, language, instructions);
  } catch { throw new Error(copy.unverified); }
  if (!statements.length) throw new Error(copy.empty);
  const bySource = new Map<string, typeof statements>();
  for (const claim of statements) {
    const sourceId = packet.passages.find((passage) => passage.id === claim.passageId)!.sourceId;
    bySource.set(sourceId, [...(bySource.get(sourceId) ?? []), claim]);
  }
  const publication: EvidencePublication = { id: `zine-${crypto.randomUUID()}`, query, language, createdAt: new Date().toISOString(), packet,
    sections: [...bySource].map(([id, claims]) => ({ title: packet.passages.find((passage) => passage.sourceId === id)!.title, statements: claims })) };
  const html = renderEvidencePublication(publication, publicationFontCss());
  const saved = savePublication(publication, html);
  return { title: query, html, visibleText: extractPublicArtifactText(html), variant: 'pbs-reset-title', requestId: publication.id, evidenceId: packet.id, saved };
}
