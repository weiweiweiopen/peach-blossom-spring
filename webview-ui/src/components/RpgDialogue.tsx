import { useEffect, useMemo, useRef, useState } from 'react';

import type { KnowledgeBase } from '../deepseekClient.js';
import { askDeepSeekPersona, buildKnowledgeBase, loadKnowledgeBase } from '../deepseekClient.js';
import { type LanguageCode, t } from '../i18n.js';
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
}

interface RpgDialogueProps {
  persona: Persona;
  player: PlayerProfile;
  npcAvatar: DialogueAvatar;
  topicLabels: Record<string, string>;
  language: LanguageCode;
  onClose: () => void;
  onOpenWiki?: () => void;
  onSimEvent?: (prompt: string, topic: string) => void;
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

function cleanPromptSnippet(text: string, language: LanguageCode): string {
  const oneLine = text
    .replace(/^#+\s*/, '')
    .replace(/^Q\d+[：:]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
  const withoutLatin = language === 'zh-TW' ? oneLine.replace(/[A-Za-z][A-Za-z0-9._/-]*/g, '').replace(/\s+/g, ' ') : oneLine;
  return withoutLatin.replace(/[「」"']/g, '').trim();
}

function shorten(text: string, max: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return normalized.length > max ? `${normalized.slice(0, max).trim()}...` : normalized;
}

function makeFixedQuestions(language: LanguageCode): string[] {
  const questions: Record<LanguageCode, string[]> = {
    'zh-TW': ['你是誰？', '這裡是哪裡？', '你可以給我一些意見嗎？'],
    en: ['Who are you?', 'Where am I?', 'Can you give me some advice?'],
    id: ['Siapa kamu?', 'Di mana saya?', 'Bisakah kamu memberi saya saran?'],
    de: ['Wer bist du?', 'Wo bin ich?', 'Kannst du mir einen Rat geben?'],
    ja: ['あなたは誰？', 'ここはどこ？', '何か助言をもらえる？'],
    th: ['คุณคือใคร?', 'ที่นี่คือที่ไหน?', 'ช่วยให้คำแนะนำฉันได้ไหม?'],
  };
  return questions[language];
}

function makeSuggestedQuestions(
  transcript: string,
  persona: Persona,
  player: PlayerProfile,
  language: LanguageCode,
  seed: number,
): string[] {
  const sourceLines = transcript
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^##\s*Q\d+[：:]/.test(line));
  const fallbackLines = transcript
    .split(/[。！？.!?]\s*/)
    .map((line) => line.trim())
    .filter((line) => line.length > (language === 'zh-TW' ? 18 : 40));
  const candidates = sourceLines.length > 0 ? sourceLines : fallbackLines;
  const mission = shorten(
    player.mission?.trim() || t(language, 'dialogue.fallbackMission'),
    language === 'zh-TW' ? 34 : 72,
  );
  const skills = shorten(player.skills?.trim() || t(language, 'dialogue.fallbackSkills'), language === 'zh-TW' ? 22 : 48);
  const role = shorten(persona.role, language === 'zh-TW' ? 24 : 48);
  const snippets = candidates.map((item) => cleanPromptSnippet(item, language)).filter(Boolean);
  const offset = snippets.length > 0 ? (seed + persona.id.length) % snippets.length : 0;
  const detail = snippets.length > 0
    ? shorten(snippets[offset], language === 'zh-TW' ? 24 : 52)
    : role;
  const zhTemplates = [
    `你說你是${role}？你對「${mission}」有什麼看法？`,
    `如果我想用「${skills}」開始做這件事，你會建議我先避開什麼？`,
    `你剛剛提到「${detail}」，這跟我的任務有什麼關係？`,
    `以你的經驗，我這個想法最容易在哪裡卡住？`,
    `如果我們才剛認識，你會先問我哪一個問題？`,
  ];
  const enTemplates = [
    `You work with ${role}. What do you think about "${mission}"?`,
    `If I start with ${skills}, what should I be careful about first?`,
    `You mentioned "${detail}". How does that connect to my mission?`,
    `From your experience, where might this idea get stuck?`,
    `If we just met, what would you ask me first?`,
  ];
  const idTemplates = [
    `Kamu bekerja dengan ${role}. Apa pendapatmu tentang "${mission}"?`,
    `Jika saya mulai dengan ${skills}, apa yang harus saya waspadai terlebih dahulu?`,
    `Kamu menyebut "${detail}". Bagaimana itu terhubung dengan misi saya?`,
    `Menurut pengalamanmu, di mana ide ini mungkin tersendat?`,
    `Jika kita baru bertemu, apa yang akan kamu tanyakan kepada saya lebih dulu?`,
  ];
  const deTemplates = [
    `Du arbeitest mit ${role}. Was denkst du über "${mission}"?`,
    `Wenn ich mit ${skills} beginne, worauf sollte ich zuerst achten?`,
    `Du hast "${detail}" erwähnt. Wie hängt das mit meiner Mission zusammen?`,
    `Wo könnte diese Idee deiner Erfahrung nach stecken bleiben?`,
    `Wenn wir uns gerade erst kennengelernt hätten, was würdest du mich zuerst fragen?`,
  ];
  const jaTemplates = [
    `あなたは${role}として活動しているのですね。「${mission}」についてどう思いますか？`,
    `「${skills}」から始めるなら、最初に何を避けるべきですか？`,
    `さきほどの「${detail}」は、私の任務とどうつながりますか？`,
    `あなたの経験では、このアイデアはどこで詰まりやすいですか？`,
    `初対面なら、まず私にどんな質問をしますか？`,
  ];
  const thTemplates = [
    `คุณทำงานกับ${role} คุณคิดอย่างไรกับ “${mission}”?`,
    `ถ้าฉันเริ่มจาก “${skills}” ควรระวังอะไรเป็นอย่างแรก?`,
    `คุณพูดถึง “${detail}” สิ่งนี้เกี่ยวกับภารกิจของฉันอย่างไร?`,
    `จากประสบการณ์ของคุณ ไอเดียนี้อาจติดขัดตรงไหน?`,
    `ถ้าเราเพิ่งรู้จักกัน คุณจะถามฉันเรื่องอะไรก่อน?`,
  ];
  const templatesByLanguage: Record<LanguageCode, string[]> = {
    'zh-TW': zhTemplates,
    en: enTemplates,
    id: idTemplates,
    de: deTemplates,
    ja: jaTemplates,
    th: thTemplates,
  };
  const templates = templatesByLanguage[language];
  return Array.from({ length: 3 }, (_, index) => templates[(seed + index) % templates.length]);
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

export function RpgDialogue({ persona, player, npcAvatar, topicLabels, language, onClose, onOpenWiki, onSimEvent }: RpgDialogueProps) {
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [areSuggestionsOpen, setAreSuggestionsOpen] = useState(false);
  const [questionSeed, setQuestionSeed] = useState(() => Math.floor(Math.random() * 1000));
  const messageLogRef = useRef<HTMLDivElement>(null);

  const orderedTopics = useMemo(() => Object.keys(topicLabels), [topicLabels]);
  const emptyKnowledge = useMemo(() => buildKnowledgeBase(persona), [persona]);
  const [loadedKnowledge, setLoadedKnowledge] = useState<KnowledgeBase | null>(null);
  const knowledge = loadedKnowledge ?? emptyKnowledge;
  const suggestedQuestions = useMemo(() => {
    const transcript = language === 'zh-TW' ? knowledge.transcript_zh || knowledge.transcript_en : knowledge.transcript_en || knowledge.transcript_zh;
    return makeSuggestedQuestions(transcript, persona, player, language, questionSeed);
  }, [knowledge.transcript_en, knowledge.transcript_zh, language, persona, player, questionSeed]);
  const fixedQuestions = useMemo(() => makeFixedQuestions(language), [language]);

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
    setQuestionSeed(Math.floor(Math.random() * 1000));
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
      const answer = await askDeepSeekPersona({
        playerName: player.name,
        question: `${trimmed}\nTopic hint: ${topic}`,
        knowledge: {
          ...dialogueKnowledge,
          responses: persona.responses,
        },
        preferredLanguage: language,
      });
      setMessages((prev) => [...prev, { speaker: persona.name, text: answer }]);
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

  return (
    <div className="rpg-dialogue-overlay absolute inset-0 z-50 flex items-center justify-center bg-black/35 px-8 py-8 pointer-events-none" data-no-mobile-drag="true">
      <section className="rpg-dialogue-panel pixel-panel pointer-events-auto w-[min(1320px,84vw)] h-[80vh] min-w-[min(860px,calc(100vw-24px))] px-14 py-12 text-text shadow-pixel flex flex-col" data-language={language}>
        <div className="rpg-dialogue-header flex items-start justify-between gap-8 mb-5">
          <div className="rpg-dialogue-title flex items-start gap-6">
            <div className="rpg-dialogue-avatars flex gap-4">
              <PixelAvatar avatar={{ palette: player.palette, hueShift: 0 }} label={player.name} />
              <PixelAvatar avatar={npcAvatar} label={persona.name} />
            </div>
            <div>
              <p className="rpg-dialogue-kicker text-lg uppercase tracking-wide text-accent-bright mb-2">{t(language, 'home.wanderAndTalk')}</p>
              <h2 className="rpg-dialogue-name text-2xl leading-none">{persona.name}</h2>
              <p className="rpg-dialogue-role text-xl text-text-muted mt-2">{persona.role}</p>
            </div>
          </div>
          <button className="rpg-dialogue-x text-2xl text-text-muted hover:text-text" type="button" onClick={onClose}>
            x
          </button>
        </div>

        <div className="rpg-dialogue-main flex-1 min-h-0 flex gap-6 mb-6">
          <div ref={messageLogRef} className="rpg-dialogue-log flex-1 overflow-auto bg-bg/70 border border-border px-10 py-9 text-xl">
            {messages.map((message, index) => (
              <p
                key={`${message.speaker}-${index.toString()}`}
                className="rpg-dialogue-message text-xl leading-relaxed mb-6 last:mb-0"
              >
                <span className="text-accent-bright">{message.speaker}: </span>
                {message.text}
              </p>
            ))}
            {isLoading && (
              <p className="rpg-dialogue-thinking text-base text-text-muted">
                {persona.name} {t(language, 'dialogue.thinking')}
              </p>
            )}
          </div>
        </div>

        <div className="rpg-dialogue-actions flex flex-wrap items-start gap-3 mb-5">
          <button
            className="rpg-dialogue-question-toggle rpg-dialogue-chip bg-accent/80 text-white border border-accent px-5 py-3 text-base"
            type="button"
            aria-expanded={areSuggestionsOpen}
            onClick={() => setAreSuggestionsOpen((prev) => !prev)}
          >
            {t(language, 'dialogue.askQuestion')} {areSuggestionsOpen ? '▲' : '▼'}
          </button>
          <button
            className="rpg-dialogue-wiki-button rpg-dialogue-chip bg-bg text-text border border-border px-5 py-3 text-base"
            type="button"
            onClick={onOpenWiki}
          >
            📚 {t(language, 'dialogue.openWiki')}
          </button>
          {areSuggestionsOpen && (
            <div className="rpg-dialogue-question-drawer w-full border border-border bg-bg/70 px-4 py-4">
              <div className="rpg-dialogue-fixed flex flex-wrap gap-3 mb-3">
                {fixedQuestions.map((item) => (
                  <button
                    key={item}
                    className="rpg-dialogue-chip bg-accent/80 text-white border border-accent px-5 py-3 text-base"
                    type="button"
                    onClick={() => void submitPrompt(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="rpg-dialogue-suggestion-list flex flex-wrap gap-3">
                {suggestedQuestions.map((item) => (
                  <button
                    key={item}
                    className="rpg-dialogue-chip bg-bg text-text border border-border px-5 py-3 text-base"
                    type="button"
                    onClick={() => void submitPrompt(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="rpg-dialogue-form flex gap-4">
          <input
            className="rpg-dialogue-input flex-1 bg-bg border-2 border-border px-7 py-6 text-xl text-text outline-none focus:border-accent-bright"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={t(language, 'dialogue.inputPlaceholder', { name: persona.name })}
          />
          <button
            className="rpg-dialogue-submit bg-accent text-white border-2 border-accent px-10 py-5 text-xl disabled:opacity-50"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? '...' : t(language, 'dialogue.talkButton')}
          </button>
          <button
            className="rpg-dialogue-close-secondary bg-bg text-text border-2 border-border px-10 py-5 text-xl"
            type="button"
            onClick={onClose}
          >
            {t(language, 'common.close')}
          </button>
        </form>

        {error && <p className="text-lg text-red-300 mt-4">{error}</p>}
      </section>
    </div>
  );
}
