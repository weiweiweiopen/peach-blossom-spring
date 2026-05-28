import { useEffect, useMemo, useRef, useState } from 'react';

import type { KnowledgeBase } from '../deepseekClient.js';
import { askDeepSeekPersonaWithEvidence, loadKnowledgeBase } from '../deepseekClient.js';
import { type LanguageCode, t } from '../i18n.js';
import { buildTranscriptEvidenceChunks, calibratePersonaReply, type ChatEvidence, rankEvidence } from '../localChatbot.js';
import { getCharacterSprites } from '../office/sprites/spriteData.js';
import { Direction, type SpriteData } from '../office/types.js';

interface Persona {
  id: string;
  name: string;
  role: string;
  intro: string;
  responses: Record<string, string>;
}

interface PlayerProfile {
  name: string;
  palette: number;
  currentRole?: string;
  mission?: string;
  constraints?: string;
  skills?: string;
}

interface DialogueAvatar {
  palette: number;
  hueShift: number;
}

interface DialogueMessage {
  speaker: string;
  text: string;
  evidence?: ChatEvidence[];
}

interface RpgDialogueProps {
  persona: Persona;
  player: PlayerProfile;
  npcAvatar: DialogueAvatar;
  topicLabels: Record<string, string>;
  language: LanguageCode;
  onClose: () => void;
  onOpenMusic?: () => void;
  onSimEvent?: (prompt: string, topic: string) => void;
  onOpenAssociationZine?: (query: string, writingStyle: string) => void;
}

function PixelAvatar({ avatar, label }: { avatar: DialogueAvatar; label: string }) {
  const [frame, setFrame] = useState(0);
  const sprite = useMemo<SpriteData>(() => {
    const sprites = getCharacterSprites(avatar.palette, avatar.hueShift);
    return sprites.walk[Direction.DOWN][frame % 4];
  }, [avatar.hueShift, avatar.palette, frame]);

  useEffect(() => {
    const id = window.setInterval(() => setFrame((current) => current + 1), 120);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="bg-bg/80 border border-border p-2"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${(sprite[0]?.length ?? 1).toString()}, 3px)`,
          gridAutoRows: '3px',
        }}
        aria-label={label}
      >
        {sprite.flatMap((row, rowIndex) =>
          row.map((color, colIndex) => (
            <span
              key={`${rowIndex.toString()}-${colIndex.toString()}`}
              style={{ backgroundColor: color || 'transparent' }}
            />
          )),
        )}
      </div>
      <span className="max-w-[110px] truncate text-xs text-text-muted">{label}</span>
    </div>
  );
}

function shorten(text: string, max: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return normalized.length > max ? `${normalized.slice(0, max).trim()}...` : normalized;
}

const representedCommunityByPersonaId: Record<string, string> = {
  'andreas-siagian': 'Lifepatch',
  'anastassia-pistofidou': 'Fabricademy',
  'giulia-tomasello': 'wearable technology / care protocols',
  'christian-dils': 'Fraunhofer TexLab',
  'jonathan-minchin': 'Green Fablab',
  'marc-dusseiller': 'Hackteria',
  'mika-satomi': 'KOBAKANT',
  'rully-shabara': 'Senyawa',
  'wukir-suryadi': 'experimental instrument practice',
  'ryu-oyama': 'Oki Wonder Lab',
  'stephanie-pan': 'Modern Body Festival',
  'stelio-manousakis': 'Modern Body Festival',
  'svenja-keune': 'I.N.S.E.C.T.',
  'ted-hung': 'Fablab Taipei',
  'tincuta-heinzel': 'critical textile and media questions',
  abao: 'Non-Governmental Matters',
};

function transcriptOnlyFallback(message: string, evidence: ChatEvidence[], persona: Persona, language: LanguageCode): string {
  const excerpt = evidence[0]?.text;
  if (excerpt) {
    if (language === 'zh-TW') return `我先回到訪談記憶來答。關於「${shorten(message, 36)}」，我會從這段線索開始：${shorten(excerpt, 260)}`;
    return `I will answer from the interview memory first. For “${shorten(message, 54)}”, I would begin from this trace: ${shorten(excerpt, 260)}`;
  }
  if (language === 'zh-TW') return `${persona.name} 的訪談記憶裡沒有直接回答這一句。我可以改從他的訪談主題慢慢回想：${shorten(persona.intro, 180)}`;
  return `${persona.name}'s interview memory does not directly answer that. I can still recall from the persona's interview frame: ${shorten(persona.intro, 180)}`;
}

function representedCommunity(persona: Persona): string {
  return representedCommunityByPersonaId[persona.id] ?? shorten(persona.role.split('/')[0] ?? persona.role, 48);
}

function makeFixedQuestions(language: LanguageCode, persona: Persona): string[] {
  if (persona.id === 'tincuta-heinzel') {
    const attemptsQuestion = '什麼是 ATTEMPTS, FAILURES, TRIALS AND ERRORS？';
    const fallback: Record<LanguageCode, string> = {
      'zh-TW': '電子織品如何變成批判材料？',
      en: 'How do electronic textiles become critical material?',
      id: 'Bagaimana e-textile menjadi bahan kritis?',
      de: 'Wie werden E-Textiles zu kritischem Material?',
      ja: '電子テキスタイルはどう批評的な素材になる？',
      th: 'e-textile กลายเป็นวัสดุวิพากษ์ได้อย่างไร?',
    };
    const method: Record<LanguageCode, string> = {
      'zh-TW': '失敗紀錄如何幫助工作坊學習？',
      en: 'How do failure notes help workshops learn?',
      id: 'Bagaimana catatan gagal membantu lokakarya belajar?',
      de: 'Wie helfen Fehlernotizen Workshops beim Lernen?',
      ja: '失敗の記録はワークショップの学びをどう助ける？',
      th: 'บันทึกความล้มเหลวช่วยให้เวิร์กช็อปเรียนรู้อย่างไร?',
    };
    return [attemptsQuestion, fallback[language], method[language]];
  }
  const community = representedCommunity(persona);
  const questions: Record<LanguageCode, string[]> = {
    'zh-TW': [`${community} 如何組織工作坊知識？`, `${community} 和臨時共同體有什麼關係？`, `${community} 的材料實踐如何被保存？`],
    en: [`How does ${community} organize workshop knowledge?`, `How is ${community} related to temporary commons?`, `How are ${community}'s material practices preserved?`],
    id: [`Bagaimana ${community} mengatur pengetahuan lokakarya?`, `Apa hubungan ${community} dengan commons sementara?`, `Bagaimana praktik material ${community} disimpan?`],
    de: [`Wie organisiert ${community} Workshop-Wissen?`, `Wie haengt ${community} mit temporaeren Commons zusammen?`, `Wie werden materielle Praktiken von ${community} bewahrt?`],
    ja: [`${community} はワークショップ知識をどう組織する？`, `${community} は一時的な commons とどう関係する？`, `${community} の素材実践はどう保存される？`],
    th: [`${community} จัดความรู้เวิร์กช็อปอย่างไร?`, `${community} เกี่ยวข้องกับ commons ชั่วคราวอย่างไร?`, `การปฏิบัติด้านวัสดุของ ${community} ถูกเก็บไว้อย่างไร?`],
  };
  return [...questions[language]];
}

function wukirMusicLabel(language: LanguageCode): string {
  const copy: Record<LanguageCode, string> = {
    'zh-TW': '🎧 聽 Wukir 的音樂',
    en: "🎧 Listen to Wukir's music",
    id: '🎧 Dengarkan musik Wukir',
    de: '🎧 Wukirs Musik hören',
    ja: '🎧 Wukir の音楽を聴く',
    th: '🎧 ฟังเพลงของ Wukir',
  };
  return copy[language];
}

function WukirMusicButton({ language, onOpenMusic }: { language: LanguageCode; onOpenMusic?: () => void }) {
  if (!onOpenMusic) return null;
  return (
    <button
      className="rpg-dialogue-wukir-music-button rpg-dialogue-chip pbs-game-button"
      data-ui-control="text-button"
      data-ui-part="button-label"
      type="button"
      onClick={onOpenMusic}
    >
      {wukirMusicLabel(language)}
    </button>
  );
}


const localizedPersonaIntros: Record<string, Record<LanguageCode, string>> = {
  abao: {
    'zh-TW': 'ABao 是一位說故事的人，持續漂移在太陽能材料、旅行、AI 身分、雷射與寓言世界之間。',
    en: 'ABao is a storyteller who keeps drifting between solar materials, travel, AI identity, lasers, and allegorical worlds.',
    id: 'ABao adalah pencerita yang terus bergerak di antara material surya, perjalanan, identitas AI, laser, dan dunia alegoris.',
    de: 'ABao ist ein:e Geschichtenerzähler:in, der:die ständig zwischen Solarmaterialien, Reisen, KI-Identität, Lasern und allegorischen Welten driftet.',
    ja: 'ABao は、太陽素材、旅、AI アイデンティティ、レーザー、寓話的な世界のあいだを漂い続ける語り手です。',
    th: 'ABao เป็นนักเล่าเรื่องที่ล่องลอยอยู่ระหว่างวัสดุพลังงานแสงอาทิตย์ การเดินทาง อัตลักษณ์ AI เลเซอร์ และโลกเชิงอุปมา',
  },
  'andreas-siagian': {
    'zh-TW': 'Andreas 將 Lifepatch 介紹為承載價值的生活空間，而不是擁有他全部身分的品牌。他的人格不斷回到鄰里尺度、可見的責任與扎根的協作。',
    en: 'Andreas introduces Lifepatch as a living space of values rather than a brand that owns his whole identity. His persona keeps returning to neighborhood scale, visible responsibility, and grounded collaboration.',
    id: 'Andreas memperkenalkan Lifepatch sebagai ruang hidup nilai-nilai, bukan merek yang memiliki seluruh identitasnya. Personanya terus kembali pada skala lingkungan, tanggung jawab yang terlihat, dan kolaborasi yang membumi.',
    de: 'Andreas stellt Lifepatch als Lebensraum von Werten vor, nicht als Marke, die seine ganze Identität besitzt. Seine Persona kehrt immer wieder zu Nachbarschaftsmaßstab, sichtbarer Verantwortung und geerdeter Zusammenarbeit zurück.',
    ja: 'Andreas は Lifepatch を、自分のアイデンティティ全体を所有するブランドではなく、価値が生きる生活空間として紹介します。彼のペルソナは、近隣のスケール、見える責任、地に足のついた協働へ戻り続けます。',
    th: 'Andreas แนะนำ Lifepatch ในฐานะพื้นที่อยู่อาศัยของคุณค่า ไม่ใช่แบรนด์ที่ครอบครองตัวตนทั้งหมดของเขา บุคลิกของเขาวนกลับมาหาขนาดระดับละแวกบ้าน ความรับผิดชอบที่มองเห็นได้ และการร่วมมือที่ติดดินเสมอ',
  },
  'anastassia-pistofidou': {
    'zh-TW': 'Anastassia 透過節點網絡、可攜式課程與同儕驗證來說話。她的人格把營隊轉化為分散式學習框架。',
    en: 'Anastassia speaks through node networks, portable curriculum, and peer validation. Her persona turns camps into distributed learning frameworks.',
    id: 'Anastassia berbicara melalui jaringan simpul, kurikulum portabel, dan validasi sejawat. Personanya mengubah kamp menjadi kerangka belajar terdistribusi.',
    de: 'Anastassia spricht durch Knotennetzwerke, mobile Curricula und Peer-Validierung. Ihre Persona verwandelt Camps in verteilte Lernrahmen.',
    ja: 'Anastassia はノード型ネットワーク、持ち運べるカリキュラム、ピア検証を通して語ります。彼女のペルソナはキャンプを分散型の学習フレームワークへ変えます。',
    th: 'Anastassia พูดผ่านเครือข่ายโหนด หลักสูตรที่เคลื่อนย้ายได้ และการรับรองจากเพื่อนร่วมทาง บุคลิกของเธอเปลี่ยนแคมป์ให้เป็นกรอบการเรียนรู้แบบกระจายตัว',
  },
  'giulia-tomasello': {
    'zh-TW': 'Giulia 的人格透過同意、女性主義實踐與作為基礎設施的照護來理解科技。',
    en: "Giulia's persona frames technology through consent, feminist practice, and care as infrastructure.",
    id: 'Persona Giulia memahami teknologi melalui persetujuan, praktik feminis, dan perawatan sebagai infrastruktur.',
    de: 'Giulias Persona rahmt Technologie durch Einwilligung, feministische Praxis und Care als Infrastruktur.',
    ja: 'Giulia のペルソナは、同意、フェミニストの実践、インフラとしてのケアを通してテクノロジーを捉えます。',
    th: 'บุคลิกของ Giulia มองเทคโนโลยีผ่านความยินยอม ปฏิบัติการเฟมินิสต์ และการดูแลในฐานะโครงสร้างพื้นฐาน',
  },
  'christian-dils': {
    'zh-TW': 'Christian 的人格從設備、維護、標準作業程序與健康的技術公地出發思考。',
    en: "Christian's persona thinks from equipment, maintenance, standard operating procedures, and healthy technical commons.",
    id: 'Persona Christian berpikir dari peralatan, pemeliharaan, prosedur operasi standar, dan commons teknis yang sehat.',
    de: 'Christians Persona denkt von Ausrüstung, Wartung, Standardarbeitsabläufen und gesunden technischen Commons her.',
    ja: 'Christian のペルソナは、機材、保守、標準作業手順、健全な技術コモンズから考えます。',
    th: 'บุคลิกของ Christian คิดจากอุปกรณ์ การบำรุงรักษา ขั้นตอนปฏิบัติมาตรฐาน และคอมมอนส์ทางเทคนิคที่แข็งแรง',
  },
  'jonathan-minchin': {
    'zh-TW': 'Jonathan 的人格連結數位製造、農業、生態曆法與以田野為基礎的知識公地。',
    en: "Jonathan's persona connects digital fabrication, agriculture, ecological calendars, and field-based knowledge commons.",
    id: 'Persona Jonathan menghubungkan fabrikasi digital, pertanian, kalender ekologis, dan commons pengetahuan berbasis lapangan.',
    de: 'Jonathans Persona verbindet digitale Fabrikation, Landwirtschaft, ökologische Kalender und feldbasierte Wissens-Commons.',
    ja: 'Jonathan のペルソナは、デジタルファブリケーション、農業、生態暦、現場に根ざした知識コモンズを結びます。',
    th: 'บุคลิกของ Jonathan เชื่อมโยงการผลิตดิจิทัล เกษตรกรรม ปฏิทินนิเวศ และคอมมอนส์ความรู้ที่ตั้งอยู่บนภาคสนาม',
  },
  'marc-dusseiller': {
    'zh-TW': 'Marc 的人格重視高密度即興、低成本開放硬體、友誼，以及把失敗當作教學法。',
    en: "Marc's persona values dense improvisation, low-cost open hardware, friendship, and failure as pedagogy.",
    id: 'Persona Marc menghargai improvisasi padat, perangkat keras terbuka berbiaya rendah, persahabatan, dan kegagalan sebagai pedagogi.',
    de: 'Marcs Persona schätzt dichte Improvisation, kostengünstige offene Hardware, Freundschaft und Scheitern als Pädagogik.',
    ja: 'Marc のペルソナは、濃密な即興、低コストのオープンハードウェア、友情、そして教育法としての失敗を大切にします。',
    th: 'บุคลิกของ Marc ให้คุณค่ากับการด้นสดที่เข้มข้น ฮาร์ดแวร์เปิดราคาต่ำ มิตรภาพ และความล้มเหลวในฐานะวิธีสอน',
  },
  'mika-satomi': {
    'zh-TW': 'Mika 的人格強調能存活的尺度、願望牆、電子織品知識分享與相互承諾。',
    en: "Mika's persona emphasizes survivable scale, wish walls, e-textile knowledge sharing, and mutual promises.",
    id: 'Persona Mika menekankan skala yang dapat bertahan, dinding harapan, berbagi pengetahuan e-textile, dan janji timbal balik.',
    de: 'Mikas Persona betont überlebensfähige Maßstäbe, Wunsch-Wände, Wissensaustausch zu E-Textiles und gegenseitige Versprechen.',
    ja: 'Mika のペルソナは、持続できるスケール、願いの壁、電子テキスタイルの知識共有、相互の約束を強調します。',
    th: 'บุคลิกของ Mika เน้นขนาดที่อยู่รอดได้ กำแพงความปรารถนา การแบ่งปันความรู้ e-textile และคำมั่นต่อกัน',
  },
  'rully-shabara': {
    'zh-TW': 'Rully 的人格警告不要把營隊變成產業。他重視圓圈、餐食、練習，以及能自己發聲的社群。',
    en: "Rully's persona warns against turning camps into industries. He privileges circles, meals, exercises, and self-speaking communities.",
    id: 'Persona Rully memperingatkan agar kamp tidak diubah menjadi industri. Ia mengutamakan lingkaran, makan bersama, latihan, dan komunitas yang berbicara dengan suaranya sendiri.',
    de: 'Rullys Persona warnt davor, Camps in Industrien zu verwandeln. Er bevorzugt Kreise, Mahlzeiten, Übungen und Communities, die für sich selbst sprechen.',
    ja: 'Rully のペルソナは、キャンプを産業に変えることへ警鐘を鳴らします。彼は輪、食事、練習、自ら語るコミュニティを重んじます。',
    th: 'บุคลิกของ Rully เตือนว่าอย่าเปลี่ยนแคมป์ให้กลายเป็นอุตสาหกรรม เขาให้ความสำคัญกับวงล้อม มื้ออาหาร แบบฝึกหัด และชุมชนที่พูดด้วยเสียงของตนเอง',
  },
  'ryu-oyama': {
    'zh-TW': 'Ryu 的人格把孤立視為方法與資源，運用島嶼節奏來讓活動在時間與空間中去中心化。',
    en: "Ryu's persona treats isolation as method and resource, using island rhythms to decenter activity in time and space.",
    id: 'Persona Ryu memperlakukan isolasi sebagai metode dan sumber daya, memakai ritme pulau untuk mendesentralisasi aktivitas dalam waktu dan ruang.',
    de: 'Ryus Persona behandelt Isolation als Methode und Ressource und nutzt Inselrhythmen, um Aktivität in Zeit und Raum zu dezentrieren.',
    ja: 'Ryu のペルソナは孤立を方法であり資源として扱い、島のリズムによって活動を時間と空間の中で脱中心化します。',
    th: 'บุคลิกของ Ryu มองความโดดเดี่ยวเป็นทั้งวิธีการและทรัพยากร โดยใช้จังหวะของเกาะเพื่อลดศูนย์กลางของกิจกรรมในเวลาและพื้นที่',
  },
  'stephanie-pan': {
    'zh-TW': 'Stephanie 的人格把節慶轉化為微型實驗室，帶著照護條款、觀眾共同主持與持續的小規模生成。',
    en: "Stephanie's persona transforms festivals into micro-labs with care clauses, audience co-hosting, and continuous small generation.",
    id: 'Persona Stephanie mengubah festival menjadi laboratorium mikro dengan klausul perawatan, ko-hosting bersama audiens, dan pembentukan kecil yang berkelanjutan.',
    de: 'Stephanies Persona verwandelt Festivals in Mikrolabore mit Care-Klauseln, Co-Hosting durch das Publikum und fortlaufender kleiner Generierung.',
    ja: 'Stephanie のペルソナは、フェスティバルをケア条項、観客との共同ホスト、継続的な小さな生成を備えたマイクロラボへ変えます。',
    th: 'บุคลิกของ Stephanie เปลี่ยนเทศกาลให้เป็นไมโครแล็บที่มีข้อตกลงเรื่องการดูแล การร่วมเป็นเจ้าภาพกับผู้ชม และการก่อรูปเล็ก ๆ อย่างต่อเนื่อง',
  },
  'stelio-manousakis': {
    'zh-TW': 'Stelio 的人格融合行政與表演，把 sound-check 當成治理檢查。',
    en: "Stelio's persona fuses administration and performance, treating sound-checks as governance checks.",
    id: 'Persona Stelio memadukan administrasi dan pertunjukan, memperlakukan sound-check sebagai pemeriksaan tata kelola.',
    de: 'Stelios Persona verschmilzt Verwaltung und Performance und behandelt Soundchecks als Governance-Prüfungen.',
    ja: 'Stelio のペルソナは運営とパフォーマンスを融合させ、サウンドチェックをガバナンスの点検として扱います。',
    th: 'บุคลิกของ Stelio ผสานงานบริหารกับการแสดง และมองการซาวด์เช็กเป็นการตรวจสอบธรรมาภิบาล',
  },
  'svenja-keune': {
    'zh-TW': 'Svenja 的人格以生態節奏思考，先共處再共同設計，也把停頓視為協作的一部分。',
    en: "Svenja's persona thinks in ecological rhythms, being-with before designing-with, and pauses as part of collaboration.",
    id: 'Persona Svenja berpikir dalam ritme ekologis: berada-bersama sebelum merancang-bersama, dan jeda sebagai bagian dari kolaborasi.',
    de: 'Svenjas Persona denkt in ökologischen Rhythmen: Mit-Sein vor Mit-Entwerfen und Pausen als Teil der Zusammenarbeit.',
    ja: 'Svenja のペルソナは生態的なリズムで考え、共にデザインする前に共に在ること、そして協働の一部としての間を大切にします。',
    th: 'บุคลิกของ Svenja คิดเป็นจังหวะนิเวศ อยู่-ด้วยกันก่อนออกแบบ-ด้วยกัน และมองการหยุดพักเป็นส่วนหนึ่งของความร่วมมือ',
  },
  'ted-hung': {
    'zh-TW': 'Ted 的人格說，人與人之間的連結比實驗室之間的連結更重要。他偏好以人為本的會員關係與透明帳本。',
    en: "Ted's persona says connections between people matter more than connections between labs. He favors person-based membership and transparent ledgers.",
    id: 'Persona Ted mengatakan bahwa hubungan antarorang lebih penting daripada hubungan antarlab. Ia menyukai keanggotaan berbasis orang dan buku besar yang transparan.',
    de: 'Teds Persona sagt, Verbindungen zwischen Menschen seien wichtiger als Verbindungen zwischen Laboren. Er bevorzugt personenbezogene Mitgliedschaft und transparente Bücher.',
    ja: 'Ted のペルソナは、ラボ同士のつながりより人と人のつながりの方が重要だと言います。彼は人を基盤にしたメンバーシップと透明な台帳を好みます。',
    th: 'บุคลิกของ Ted บอกว่าความเชื่อมโยงระหว่างผู้คนสำคัญกว่าความเชื่อมโยงระหว่างแล็บ เขาชอบสมาชิกภาพที่ตั้งอยู่บนตัวบุคคลและบัญชีที่โปร่งใส',
  },
  'tincuta-heinzel': {
    'zh-TW': 'Tincuta 的人格把營隊視為策展工具，產生倫理問題、在地回應與版本，而不是固定成果。',
    en: "Tincuta's persona treats camps as curatorial tools that produce ethical questions, local responses, and versions rather than fixed outputs.",
    id: 'Persona Tincuta memperlakukan kamp sebagai alat kuratorial yang menghasilkan pertanyaan etis, respons lokal, dan versi, bukan keluaran yang tetap.',
    de: 'Tincutas Persona behandelt Camps als kuratorische Werkzeuge, die ethische Fragen, lokale Antworten und Versionen erzeugen statt fester Ergebnisse.',
    ja: 'Tincuta のペルソナは、キャンプを固定された成果物ではなく、倫理的な問い、地域の応答、複数のバージョンを生み出すキュレーションの道具として扱います。',
    th: 'บุคลิกของ Tincuta มองแคมป์เป็นเครื่องมือภัณฑารักษ์ที่สร้างคำถามเชิงจริยธรรม การตอบสนองเฉพาะถิ่น และเวอร์ชันต่าง ๆ มากกว่าผลงานตายตัว',
  },
};

function makeIntroMessage(persona: Persona, language: LanguageCode): string {
  const intro = localizedPersonaIntros[persona.id]?.[language] ?? persona.intro;
  const messages: Record<LanguageCode, string> = {
    'zh-TW': `${intro} 歡迎來到桃花源，你想問我什麼？`,
    en: `${intro} Welcome to Peach Blossom Spring. What would you like to ask?`,
    id: `${intro} Selamat datang di Peach Blossom Spring. Apa yang ingin kamu tanyakan?`,
    de: `${intro} Willkommen in Peach Blossom Spring. Was möchtest du fragen?`,
    ja: `${intro} 桃花源へようこそ。何を聞きたいですか？`,
    th: `${intro} ยินดีต้อนรับสู่ Peach Blossom Spring คุณอยากถามอะไร?`,
  };
  return messages[language];
}

function npcWritingStylePrompt(persona: Persona, knowledge: KnowledgeBase | null, query: string): string {
  const transcript = `${knowledge?.transcript_zh ?? ''}\n${knowledge?.transcript_en ?? ''}`.trim();
  const chunks = transcript ? buildTranscriptEvidenceChunks(transcript, persona.id, persona.name) : [];
  const evidence = rankEvidence(query || persona.intro, chunks, 2).map((item) => shorten(item.text, 150));
  return [
    `NPC writer: ${persona.name}`,
    `Role: ${persona.role}`,
    `Intro voice: ${shorten(persona.intro, 180)}`,
    `Transcript style clues: ${evidence.join(' / ') || 'Use the persona intro and response topics as the voice anchor.'}`,
    'Use this only for writing style, rhythm, emphasis, and choice of examples. Do not invent facts from the transcript unless the zine evidence also supports them.',
  ].join('\n');
}

export function RpgDialogue({ persona, player, npcAvatar, topicLabels, language, onClose, onOpenMusic, onSimEvent, onOpenAssociationZine }: RpgDialogueProps) {
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [areSuggestionsOpen, setAreSuggestionsOpen] = useState(false);
  const messageLogRef = useRef<HTMLDivElement>(null);

  const orderedTopics = useMemo(() => Object.keys(topicLabels), [topicLabels]);
  const [loadedKnowledge, setLoadedKnowledge] = useState<KnowledgeBase | null>(null);
  const fixedQuestions = useMemo(() => makeFixedQuestions(language, persona), [language, persona]);

  useEffect(() => {
    let isCurrent = true;
    setLoadedKnowledge(null);
    void loadKnowledgeBase(persona).then((nextKnowledge) => {
      if (isCurrent) setLoadedKnowledge(nextKnowledge);
    });
    return () => {
      isCurrent = false;
    };
  }, [persona]);

  useEffect(() => {
    setMessages([
      {
        speaker: persona.name,
        text: makeIntroMessage(persona, language),
      },
    ]);
    setQuestion('');
    setError('');
    setAreSuggestionsOpen(false);
  }, [language, persona]);

  useEffect(() => {
    const log = messageLogRef.current;
    if (!log) return;
    log.scrollTo({ top: log.scrollHeight, behavior: 'smooth' });
  }, [isLoading, messages]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function resolveTopic(questionInput: string): string {
    const q = questionInput.toLowerCase();
    const keywords: Record<string, string[]> = {
      nomadic: ['nomadic', 'travel', 'wandering', '遊牧', '移動', 'teach'],
      camp: ['camp', 'hacker', '營隊', '黑客'],
      independent: ['independent', 'autonomy', '獨立', '自治'],
      artScience: ['science', 'art', '藝術', '科學'],
      funding: ['fund', 'grant', 'budget', '資金', '補助'],
      exchange: ['exchange', 'international', '國際', '交流'],
      sustainability: ['sustain', 'long-term', 'community', '永續', '社群', 'where'],
    };
    for (const topic of orderedTopics) {
      const words = keywords[topic] ?? [];
      if (words.some((word) => q.includes(word))) return topic;
      if (q.includes((topicLabels[topic] ?? '').toLowerCase())) return topic;
    }
    return orderedTopics.find((topic) => !!persona.responses[topic]) ?? 'nomadic';
  }

  async function submitPrompt(prompt: string): Promise<void> {
    const trimmed = prompt.trim();
    if (!trimmed || isLoading) return;

    setError('');
    setIsLoading(true);
    setMessages((prev) => [...prev, { speaker: player.name, text: trimmed }]);
    try {
      const topic = resolveTopic(trimmed);
      onSimEvent?.(trimmed, topic);
      const dialogueKnowledge = loadedKnowledge ?? (await loadKnowledgeBase(persona));
      if (!loadedKnowledge) setLoadedKnowledge(dialogueKnowledge);
      const chatKnowledge = { ...dialogueKnowledge, responses: persona.responses };
      const transcriptCandidates = buildTranscriptEvidenceChunks(
        `${dialogueKnowledge.transcript_zh}\n${dialogueKnowledge.transcript_en}`,
        dialogueKnowledge.id,
        dialogueKnowledge.name,
      );
      const evidence = rankEvidence(`${trimmed}\n${topic}`, transcriptCandidates, 4);
      let reply: string;
      try {
        reply = await askDeepSeekPersonaWithEvidence({
          playerName: player.name,
          question: trimmed,
          knowledge: dialogueKnowledge,
          preferredLanguage: language,
          evidence,
        });
        reply = calibratePersonaReply({ draft: reply, message: trimmed, knowledge: chatKnowledge, evidence });
      } catch {
        reply = transcriptOnlyFallback(trimmed, evidence, persona, language);
      }
      const answer = { reply, evidence };
      setMessages((prev) => [...prev, { speaker: persona.name, text: answer.reply, evidence: answer.evidence }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t(language, 'dialogue.requestFailed'));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const trimmed = question.trim();
    setQuestion('');
    await submitPrompt(trimmed);
  }

  function handleSuggestedPrompt(prompt: string): void {
    setAreSuggestionsOpen(false);
    setQuestion(prompt);
  }

  async function handleOpenZine(): Promise<void> {
    const trimmed = question.trim();
    if (!trimmed || isLoading || !onOpenAssociationZine) return;
    const dialogueKnowledge = loadedKnowledge ?? (await loadKnowledgeBase(persona));
    if (!loadedKnowledge) setLoadedKnowledge(dialogueKnowledge);
    onOpenAssociationZine(trimmed, npcWritingStylePrompt(persona, dialogueKnowledge, trimmed));
  }

  return (
    <div className="rpg-dialogue-overlay absolute inset-0 z-50 flex items-center justify-center bg-black/35 px-8 py-8 pointer-events-none" data-no-mobile-drag="true">
      <section className="rpg-dialogue-panel pbs-frame F2 pbs-frame-f2 pixel-panel pointer-events-auto w-[min(1320px,84vw)] h-[80vh] min-w-[min(860px,calc(100vw-24px))] px-14 py-12 text-text shadow-pixel flex flex-col" data-language={language}>
        <div className="rpg-dialogue-header flex items-start justify-between gap-8 mb-5">
          <div className="rpg-dialogue-title flex items-start gap-6">
            <div className="rpg-dialogue-avatars flex gap-4">
              <PixelAvatar avatar={{ palette: player.palette, hueShift: 0 }} label={player.name} />
              <PixelAvatar avatar={npcAvatar} label={persona.name} />
            </div>
            <div>
              <div className="rpg-dialogue-kicker-row flex items-center gap-3 mb-2">
                <p className="rpg-dialogue-kicker pbs-frame-kicker text-lg uppercase tracking-wide text-accent-bright m-0" data-ui-part="caption">{t(language, 'home.wanderAndTalk')}</p>
                {persona.id === 'wukir-suryadi' && <WukirMusicButton language={language} onOpenMusic={onOpenMusic} />}
              </div>
              <h2 className="rpg-dialogue-name pbs-frame-title text-2xl leading-none" data-ui-part="title">{persona.name}</h2>
              <p className="rpg-dialogue-role pbs-frame-subtitle text-xl text-text-muted mt-2" data-ui-part="subtitle">{persona.role}</p>
            </div>
          </div>
          <button className="rpg-dialogue-x pbs-frame-action" data-ui-control="window-action" type="button" onClick={onClose}>
            X
          </button>
        </div>

        <div className="rpg-dialogue-main flex-1 min-h-0 flex gap-6 mb-6">
          <div ref={messageLogRef} className="rpg-dialogue-log pbs-frame-body rpg-message-scroll flex-1 overflow-auto bg-bg/70 border border-border px-10 py-9 text-xl" data-ui-part="body">
            {messages.map((message, index) => (
              <div key={`${message.speaker}-${index.toString()}`} className="rpg-dialogue-message text-xl leading-relaxed mb-6 last:mb-0" data-ui-part="body">
                <p className="m-0">
                  <span className="text-accent-bright">{message.speaker}: </span>
                  {message.text}
                </p>
              </div>
            ))}
            {isLoading && (
              <p className="rpg-dialogue-thinking text-base text-text-muted" data-ui-part="body">
                {persona.name} {t(language, 'dialogue.thinking')}
              </p>
            )}
          </div>
        </div>

        {areSuggestionsOpen && (
          <div className="rpg-dialogue-actions flex flex-wrap items-start gap-3 mb-5">
            <div className="rpg-dialogue-question-drawer w-full border border-border bg-bg/70 px-4 py-4">
              <div className="rpg-dialogue-fixed flex flex-wrap gap-3 mb-3">
                {fixedQuestions.map((item) => (
                  <button
                    key={item}
                    className="rpg-dialogue-chip pbs-game-button"
                    data-ui-control="text-button"
                    data-ui-part="button-label"
                    type="button"
                    onClick={() => handleSuggestedPrompt(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={(event) => void handleSubmit(event)} className="rpg-dialogue-form flex gap-4" data-ui-footer="zine">
          <input
            type="text"
            className="rpg-dialogue-input flex-1 bg-bg border-2 border-border px-7 py-6 text-xl text-text outline-none focus:border-accent-bright"
            data-ui-part="field"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="sentences"
            spellCheck={false}
            placeholder={t(language, 'dialogue.inputPlaceholder', { name: persona.name })}
          />
          <button
            className="rpg-dialogue-question-toggle rpg-dialogue-chip pbs-game-button"
            data-ui-control="icon-button"
            type="button"
            aria-label={t(language, 'dialogue.askQuestion')}
            title={t(language, 'dialogue.askQuestion')}
            aria-expanded={areSuggestionsOpen}
            onClick={() => setAreSuggestionsOpen((prev) => !prev)}
          >
            🔍
          </button>
          <button
            className="rpg-dialogue-submit pbs-game-button pbs-game-button--bubble disabled:opacity-50"
            data-ui-control="icon-button"
            type="submit"
            disabled={isLoading}
            aria-busy={isLoading}
            aria-label={t(language, 'dialogue.talkButton')}
            title={t(language, 'dialogue.talkButton')}
          >
            💬
          </button>
          {onOpenAssociationZine && (
            <button
              className="rpg-dialogue-chip pbs-game-button pbs-game-button--bubble disabled:opacity-50"
              data-ui-control="icon-button"
              type="button"
              disabled={isLoading || !question.trim()}
              aria-label="Wiki zine"
              title="Wiki zine"
              onClick={() => void handleOpenZine()}
            >
              📚
            </button>
          )}
        </form>

        {error && <p className="text-lg text-red-300 mt-4" data-ui-part="caption">{error}</p>}
      </section>
    </div>
  );
}
