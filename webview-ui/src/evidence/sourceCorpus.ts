/** Shared by the Pages build, browser search and offline regression tests. */
export interface SourceDocument {
  id: string;
  title: string;
  url: string;
  path: string;
  family: string;
  hash: string;
  capturedAt: string | null;
  body: string;
}
export interface Passage {
  id: string;
  sourceId: string;
  title: string;
  url: string;
  path: string;
  hash: string;
  text: string;
  start: number;
  end: number;
  kind: 'source' | 'testimony';
  capturedAt?: string | null;
  readAt?: string;
}
export interface EvidencePacket {
  id: string;
  query: string;
  corpusVersion: string;
  questionContext?: string;
  currentRequest?: boolean;
  liveChecked?: boolean;
  answeredAt?: string;
  passages: Passage[];
}
export interface SourceCorpus { version: string; documents: SourceDocument[] }
export const normalizeText = (value: string) => value.normalize('NFC').replace(/\s+/gu, ' ').trim();
export function asksForCurrentInformation(question: string): boolean {
  return /現在|目前|最近|近期|今天|明天|本週|本周|今年|\b(?:now|current|currently|recent|latest|today|tomorrow|upcoming|sekarang|terbaru|aktuell|jetzt)\b|今日|今週|今.*(?:イベント|催し)|ตอนนี้|ปัจจุบัน|วันนี้/i.test(question);
}

// Equivalents, not topic associations: sensing never implies music or textiles.
const CONCEPTS: string[][] = [
  ['蜂箱', '蜂巢', '蜜蜂', 'beehive', 'beehives', 'honeybee', 'honeybees', 'bienenstock', 'bienenstöcke', 'sarang lebah', '養蜂', 'ミツバチ', '巣箱', 'ผึ้ง'],
  ['感測', '传感', 'sensor', 'sensors', 'sensoren', 'sensing', 'センサー', 'เซนเซอร์'],
  ['電子織品', '電子紡織', '織品', 'textile', 'textiles', 'e-textile', 'e-textiles', 'テキスタイル', 'สิ่งทอ'],
  ['駐村', '駐地', 'residency', 'residence', 'resident', 'レジデンス', 'พำนัก'],
  ['工作坊', 'workshop', 'workshops', 'ワークショップ', 'เวิร์กช็อป'],
  ['合成器', 'synth', 'synthesizer', 'synthesiser', 'シンセサイザー'],
  ['發酵', 'ferment', 'fermentation', '発酵', 'หมัก'],
  ['紅茶菌', '康普茶', 'kombucha', 'scoby', 'コンブチャ', 'คอมบูชา'],
  ['廚房', '厨房', 'kitchen', 'kitchenlab', 'キッチン', 'ครัว'],
  ['開源硬體', '開放硬體', 'open hardware'],
  ['維護', 'maintenance', 'maintain', 'メンテナンス'],
  ['生物藝術', '生物艺术', 'bioart', 'バイオアート', 'ศิลปะชีวภาพ'],
  ['資金', '資助', '補助', 'funding', 'grant', 'grants', 'financing', '資金調達', 'ทุน'],
  ['失敗', 'failure', 'failures', '失敗経験', 'ความล้มเหลว'],
  ['社群', 'community', 'communities', 'コミュニティ', 'ชุมชน'],
  ['自製', '自造', '自己動手', 'diy', 'do it yourself', '自作'],
  ['活動', '活动', '活動資訊', 'activity', 'activities', 'event', 'events', 'programme', 'program', 'schedule', 'workshop', 'workshops', 'residency', 'concert', 'performance', 'イベント', '催し', 'กิจกรรม', 'acara', 'kegiatan', 'veranstaltungen'],
];
// Geographic containment is separate from subject aliases: Thailand includes
// Chiang Mai, but asking specifically for Bangkok must not return Chiang Mai.
const LOCATIONS: Array<{ query: string[]; matches: string[] }> = [
  { query: ['泰國', '泰国', 'thailand', 'タイ', 'ประเทศไทย'], matches: ['thailand', 'thai', 'เชียงใหม่', 'chiang mai', 'cnx', 'bangkok', 'กรุงเทพ', '泰國', '泰国'] },
  { query: ['清邁', '清迈', 'chiang mai', 'チェンマイ', 'เชียงใหม่'], matches: ['清邁', '清迈', 'chiang mai', 'チェンマイ', 'เชียงใหม่', 'cnx'] },
  { query: ['曼谷', 'bangkok', 'バンコク', 'กรุงเทพ'], matches: ['曼谷', 'bangkok', 'バンコク', 'กรุงเทพ'] },
  { query: ['台灣', '臺灣', '台湾', 'taiwan', 'ไต้หวัน'], matches: ['taiwan', 'taipei', 'taichung', '台灣', '臺灣', '台湾'] },
  { query: ['日本', 'japan', 'ญี่ปุ่น'], matches: ['japan', 'okinawa', 'tokyo', '日本', '沖縄'] },
  { query: ['印尼', '印度尼西亞', 'indonesia', 'インドネシア', 'อินโดนีเซีย'], matches: ['indonesia', 'yogyakarta', 'jogja', 'surabaya', 'bandung', '印尼'] },
];
const ORGANIZATIONS = ['sgmk', 'hackteria', 'kobakant', 'fabricademy', 'radiona', 'valldaura'];
const STOP = new Set('a an the is are was were be been being of in on at to for from and or with by as it its this that these those i you your we our they their what which who when where how why can could would should do does did have has had about tell me please more later then said say describe explain introduce recent current now today upcoming happening there any available latest activities project projects open source science citizen tracking decline using use used sensor sensors gibt es jetzt aktuell welche in der die das was für apa ada sekarang di terbaru'.split(' '));

function contains(text: string, term: string): boolean {
  if (/^[a-z0-9-]+$/i.test(term)) return new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text);
  return text.toLowerCase().includes(term.toLowerCase());
}

export function queryTerms(query: string): { concepts: string[][]; words: string[]; organizations: string[]; locations: string[][] } {
  const lower = query.toLowerCase();
  const concepts = CONCEPTS.filter((group) => group.some((word) => contains(lower, word)));
  const organizations = ORGANIZATIONS.filter((name) => contains(lower, name));
  const selectedLocations = LOCATIONS.filter((location) => location.query.some((term) => contains(lower, term)));
  const locations = selectedLocations.map((location) => location.matches);
  const conceptWords = new Set([...concepts.flat(), ...selectedLocations.flatMap((location) => location.query)].flatMap((phrase) => phrase.split(/\s+/)));
  const words = (lower.match(/[\p{Script=Latin}\p{N}][\p{Script=Latin}\p{N}-]{1,}/gu) ?? [])
    .filter((word) => !STOP.has(word) && !conceptWords.has(word) && !organizations.includes(word));
  // Chinese unknown names remain exact; do not manufacture thousands of broad OR aliases.
  if (!concepts.length && !words.length && !organizations.length && !locations.length) {
    const cleaned = lower.replace(/請問|請|介紹一下|介紹|可以|一下|有哪些|什麼|如何|的|嗎|呢|？|\?/g, '').trim();
    if (cleaned.length >= 2) words.push(cleaned);
  }
  return { concepts, words: [...new Set(words)], organizations, locations };
}

export function splitDocument(document: SourceDocument): Passage[] {
  const passages: Passage[] = [];
  // Offsets address the exact published, normalized body; the source hash pins raw Markdown.
  for (let start = 0; start < document.body.length;) {
    let end = Math.min(start + 1500, document.body.length);
    if (end < document.body.length) {
      const boundary = document.body.lastIndexOf('. ', end);
      if (boundary > start + 600) end = boundary + 1;
      else {
        const space = document.body.lastIndexOf(' ', end);
        if (space > start + 600) end = space;
      }
    }
    const text = document.body.slice(start, end).trim();
    if (text.length >= 50) passages.push({
      id: `${document.id}-${start}`, sourceId: document.id, title: document.title,
      url: document.url, path: document.path, hash: document.hash,
      text, start, end, kind: 'source', capturedAt: document.capturedAt,
    });
    start = end;
    while (document.body[start] === ' ') start++;
  }
  return passages;
}

export function retrievePassages(corpus: SourceCorpus, query: string, limit = 6): Passage[] {
  const terms = queryTerms(query);
  const wantsDates = asksForCurrentInformation(query);
  if (!terms.concepts.length && !terms.words.length && !terms.organizations.length && !terms.locations.length) return [];
  const scoreText = (title: string, text: string) => {
    let score = 0;
    for (const group of terms.concepts) {
      if (group.some((term) => contains(text, term))) score += 12;
      if (group.some((term) => contains(title, term))) score += 20;
    }
    for (const word of terms.words) {
      if (contains(text, word)) score += 4;
      if (contains(title, word)) score += 16;
    }
    for (const group of terms.locations) {
      if (group.some((term) => contains(text, term))) score += 18;
      if (group.some((term) => contains(title, term))) score += 30;
    }
    return score;
  };
  const candidates = corpus.documents.flatMap((document) => {
    const text = `${document.title} ${document.body}`;
    if (terms.organizations.some((org) => !contains(`${document.family} ${text}`, org))) return [];
    if (terms.locations.some((group) => !group.some((term) => contains(text, term)))) return [];
    // All explicit topics must occur in the document. A workshop is not a substitute for a residency.
    if (terms.concepts.some((group) => !group.some((term) => contains(text, term)))) return [];
    const wordHits = terms.words.filter((word) => contains(text, word)).length;
    if (terms.words.length && wordHits < Math.min(terms.words.length, 2)) return [];
    const docScore = scoreText(document.title, text);
    if (!docScore && !terms.organizations.length) return [];
    return splitDocument(document)
      .filter((passage) => terms.concepts.every((group) => group.some((term) => contains(`${document.title} ${passage.text}`, term))))
      .filter((passage) => terms.locations.every((group) => group.some((term) => contains(`${document.title} ${passage.text}`, term))))
      .filter((passage) => scoreText('', passage.text) > 0 || terms.organizations.length > 0)
      .map((passage) => {
        const dated = wantsDates && /\b20\d{2}\b/.test(passage.text);
        const calendarDate = dated && /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b/i.test(passage.text);
        return { passage, score: docScore * 0.1 + scoreText('', passage.text) + (calendarDate ? 40 : dated ? 8 : 0) };
      });
  }).sort((a, b) => b.score - a.score || a.passage.sourceId.localeCompare(b.passage.sourceId) || a.passage.start - b.passage.start);
  const result: Passage[] = [];
  const counts = new Map<string, number>();
  const hasLocationTitle = terms.locations.length > 0 && candidates.some(({ passage }) => terms.locations.every((group) => group.some((term) => contains(passage.title, term))));
  for (const { passage } of candidates) {
    // Prefer pages about the place over a person's nationality in an unrelated
    // residency. Do not pad a Thai event answer with Swiss resident biographies.
    if (hasLocationTitle && !terms.locations.every((group) => group.some((term) => contains(passage.title, term)))) continue;
    if ((counts.get(passage.sourceId) ?? 0) >= 3) continue;
    // Avoid duplicated flattened extracts from crawler output.
    if (result.some((other) => other.text === passage.text)) continue;
    result.push(passage);
    counts.set(passage.sourceId, (counts.get(passage.sourceId) ?? 0) + 1);
    if (result.length >= limit) break;
  }
  return result;
}

export interface SupportedStatement { text: string; passageId: string; quote: string; kind: 'fact' | 'testimony' }

export function validateStatements(value: unknown, packet: EvidencePacket): SupportedStatement[] {
  if (!Array.isArray(value) || !value.length || value.length > 8) throw new Error('invalid_statements');
  return value.map((item: unknown) => {
    if (!item || typeof item !== 'object') throw new Error('invalid_statement');
    const claim = item as SupportedStatement;
    if (typeof claim.text !== 'string' || !claim.text.trim() || claim.text.length > 1400 ||
        typeof claim.quote !== 'string' || normalizeText(claim.quote).length < 20 || claim.quote.length > 900 ||
        !['fact', 'testimony'].includes(claim.kind)) throw new Error('invalid_statement');
    const passage = packet.passages.find((entry) => entry.id === claim.passageId);
    if (!passage || !normalizeText(passage.text).includes(normalizeText(claim.quote))) throw new Error('unsupported_quote');
    if (passage.kind === 'testimony' && claim.kind !== 'testimony') throw new Error('testimony_is_not_fact');
    // Preserve the meaning-changing term involved in the historical output corruption.
    if (/e-?textile|electronic textiles/i.test(claim.quote) && /聲音介面/.test(claim.text)) throw new Error('changed_material');
    return { text: claim.text.trim(), passageId: claim.passageId, quote: normalizeText(claim.quote), kind: claim.kind };
  });
}
