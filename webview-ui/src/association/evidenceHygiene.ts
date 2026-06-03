const THIN_OR_EMPTY_EXTRACT = /No plaintext extract returned|mostly media\/table markup|There is currently no text in this page/i;

const SEO_SPAM_EVIDENCE = /\b(?:college application essay|dissertation writing services?|writing services review|homework help|good reasons for not doing homework|phd engineering resume|buy online college|customer reviews?|rated\s+\d[,.]\d\s+stars?|masterarbeit|cheap essay|essay writing|thesis writing service|resume writing|casino|loan|viagra)\b/i;

export function evidenceTextForHygiene(value: unknown): string {
  if (!value || typeof value !== "object") return String(value ?? "");
  const card = value as {
    title?: unknown;
    excerpt?: unknown;
    description?: unknown;
    keywords?: unknown[];
    tags?: unknown[];
    categories?: unknown[];
    url?: unknown;
  };
  return [
    card.title,
    card.excerpt,
    card.description,
    ...(Array.isArray(card.keywords) ? card.keywords : []),
    ...(Array.isArray(card.tags) ? card.tags : []),
    ...(Array.isArray(card.categories) ? card.categories : []),
    card.url,
  ].map((item) => String(item ?? "")).join(" ");
}

export function isThinOrEmptyEvidence(text: string): boolean {
  return THIN_OR_EMPTY_EXTRACT.test(text);
}

export function isSpamEvidence(text: string): boolean {
  return SEO_SPAM_EVIDENCE.test(text);
}

export function isUsableEvidenceText(text: string): boolean {
  return !isThinOrEmptyEvidence(text) && !isSpamEvidence(text);
}

export function evidenceHygienePenalty(text: string): number {
  if (isSpamEvidence(text)) return -80;
  if (isThinOrEmptyEvidence(text)) return -24;
  return 0;
}
