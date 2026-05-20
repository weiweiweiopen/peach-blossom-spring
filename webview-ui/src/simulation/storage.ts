import type { FinalDocument, SimSnapshot } from './types.js';

const key = 'peach_question_pet_simulation';
const associationStorageVersionKey = 'peach_question_pet_association_public_v2';

const STALE_PUBLIC_DOCUMENT = /\b(Daydream|Association|privateTrace|sourceTrail|relationPaths|maturityScore|workflow|debug|sourceCards|categoryGraph|corpusManifest|selectedTopic|researchTopics|outputPlan|depthScore|POTENTIAL TOPIC|source\s*trail|relation\s*paths?)\b|來源卡|檢索|後台|工作流|偵錯|深度門檻|閱讀路線|關係場|生成流程|草稿/i;

export function saveSimulation(snapshot: SimSnapshot): void {
  localStorage.setItem(key, JSON.stringify(snapshot));
  localStorage.setItem(associationStorageVersionKey, '2');
}

export function loadSimulation(): SimSnapshot | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  const snapshot = JSON.parse(raw) as SimSnapshot;
  return migrateAssociationPublicDocuments(snapshot);
}

function migrateAssociationPublicDocuments(snapshot: SimSnapshot): SimSnapshot {
  const version = localStorage.getItem(associationStorageVersionKey);
  const finalDocuments = Array.isArray(snapshot.finalDocuments) ? snapshot.finalDocuments : [];
  const cleanedFinalDocuments = finalDocuments.filter(isCleanAssociationDocument);

  if (version !== '2' || cleanedFinalDocuments.length !== finalDocuments.length) {
    const migrated: SimSnapshot = { ...snapshot, finalDocuments: cleanedFinalDocuments };
    localStorage.setItem(key, JSON.stringify(migrated));
    localStorage.setItem(associationStorageVersionKey, '2');
    return migrated;
  }

  return snapshot;
}

function isCleanAssociationDocument(document: FinalDocument): boolean {
  if (document.modeLabel === 'Daydream' || document.modeLabel === 'Association') return false;
  const htmlText = stripHtmlToVisibleText(document.bodyHtml ?? '');
  const publicText = [document.title, document.modeLabel, document.body, htmlText].join('\n');
  return !STALE_PUBLIC_DOCUMENT.test(publicText);
}

function stripHtmlToVisibleText(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--([\s\S]*?)-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
