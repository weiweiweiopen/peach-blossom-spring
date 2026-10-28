import type { LanguageCode } from './i18n.js';

// Organization names remain original; role descriptions follow the UI language.
// Order: Traditional Chinese, Indonesian, German, Japanese, Thai.
const ROLES: Record<string, [string, string, string, string, string]> = {
  'andreas-siagian': ['Lifepatch／在地共有資源組織者', 'Lifepatch / penggerak sumber daya bersama lokal', 'Lifepatch / Organisation lokaler Gemeingüter', 'Lifepatch／地域コモンズの運営', 'Lifepatch / ผู้จัดการทรัพยากรร่วมในท้องถิ่น'],
  'anastassia-pistofidou': ['Fabricademy／分散式教育', 'Fabricademy / pendidikan terdesentralisasi', 'Fabricademy / dezentrale Bildung', 'Fabricademy／分散型教育', 'Fabricademy / การศึกษาแบบกระจายศูนย์'],
  'giulia-tomasello': ['穿戴科技／照護方法', 'Teknologi sandang / protokol perawatan', 'Tragbare Technologie / Sorgeprotokolle', 'ウェアラブル技術／ケアの方法', 'เทคโนโลยีสวมใส่ / วิธีการดูแล'],
  'christian-dils': ['Fraunhofer TexLab／研究基礎設施', 'Fraunhofer TexLab / infrastruktur penelitian', 'Fraunhofer TexLab / Forschungsinfrastruktur', 'Fraunhofer TexLab／研究基盤', 'Fraunhofer TexLab / โครงสร้างพื้นฐานการวิจัย'],
  'jonathan-minchin': ['Green Fablab／生態場域共有資源', 'Green Fablab / sumber daya bersama di lapangan ekologi', 'Green Fablab / ökologische Gemeingüter', 'Green Fablab／生態フィールドのコモンズ', 'Green Fablab / ทรัพยากรร่วมในพื้นที่นิเวศ'],
  'marc-dusseiller': ['Hackteria／遊牧工作坊實踐', 'Hackteria / praktik lokakarya nomaden', 'Hackteria / nomadische Workshop-Praxis', 'Hackteria／遊動するワークショップ実践', 'Hackteria / การปฏิบัติเวิร์กช็อปแบบเร่ร่อน'],
  'rully-shabara': ['Senyawa／去舞臺化實踐', 'Senyawa / praktik tanpa panggung', 'Senyawa / Praxis jenseits der Bühne', 'Senyawa／舞台を離れる実践', 'Senyawa / การปฏิบัตินอกเวที'],
  'wukir-suryadi': ['藝術家站點／實驗樂器實踐', 'Ruang seniman / praktik instrumen eksperimental', 'Künstlerstation / experimenteller Instrumentenbau', 'アーティスト拠点／実験楽器の実践', 'พื้นที่ศิลปิน / การปฏิบัติเครื่องดนตรีทดลอง'],
  'ryu-oyama': ['Oki Wonder Lab／島鏈接待者', 'Oki Wonder Lab / tuan rumah kepulauan', 'Oki Wonder Lab / Gastgeber der Inselkette', 'Oki Wonder Lab／島々をつなぐホスト', 'Oki Wonder Lab / เจ้าบ้านเครือข่ายหมู่เกาะ'],
  'stephanie-pan': ['Modern Body Festival／微型實驗室編排', 'Modern Body Festival / dramaturgi laboratorium mikro', 'Modern Body Festival / Mikro-Labor-Dramaturgie', 'Modern Body Festival／小さなラボの構成', 'Modern Body Festival / การจัดองค์ประกอบห้องทดลองขนาดเล็ก'],
  'stelio-manousakis': ['Modern Body Festival／治理排演', 'Modern Body Festival / latihan tata kelola', 'Modern Body Festival / Erprobung von Governance', 'Modern Body Festival／運営のリハーサル', 'Modern Body Festival / การซ้อมการบริหารร่วม'],
  'svenja-keune': ['I.N.S.E.C.T.／多物種設計', 'I.N.S.E.C.T. / desain multispesies', 'I.N.S.E.C.T. / Multispezies-Design', 'I.N.S.E.C.T.／多種共生のデザイン', 'I.N.S.E.C.T. / การออกแบบร่วมหลายสายพันธุ์'],
  'ted-hung': ['Fablab Taipei／以人為本的網絡', 'Fablab Taipei / jaringan berbasis manusia', 'Fablab Taipei / menschenbezogenes Netzwerk', 'Fablab Taipei／人を軸としたネットワーク', 'Fablab Taipei / เครือข่ายที่ยึดโยงผู้คน'],
  'tincuta-heinzel': ['策展／織品與媒體的批判提問', 'Kurator / pertanyaan kritis tekstil dan media', 'Kuratieren / kritische Textil- und Medienfragen', 'キュレーション／織物とメディアへの批評的な問い', 'ภัณฑารักษ์ / คำถามเชิงวิพากษ์เกี่ยวกับสิ่งทอและสื่อ'],
  abao: ['NGM 設計者／漫遊敘事者', 'Desainer NGM / pencerita pengembara', 'NGM-Design / wanderndes Erzählen', 'NGMのデザイン／旅する語り手', 'นักออกแบบ NGM / นักเล่าเรื่องพเนจร'],
};
export function localizedNpcRole(id: string, language: LanguageCode, original: string): string {
  if (language === 'en') return original;
  const index = ['zh-TW', 'id', 'de', 'ja', 'th'].indexOf(language);
  return ROLES[id]?.[index] ?? original;
}
