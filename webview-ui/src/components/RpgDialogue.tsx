import { useEffect, useMemo, useRef, useState } from 'react';

import type { KnowledgeBase } from '../deepseekClient.js';
import { askDeepSeekPersonaWithEvidence, loadKnowledgeBase } from '../deepseekClient.js';
import { type LanguageCode, t } from '../i18n.js';
import { calibratePersonaReply, type ChatEvidence, localNpcChat, retrieveNpcEvidence } from '../localChatbot.js';
import { getCharacterSprites } from '../office/sprites/spriteData.js';
import { Direction, type SpriteData } from '../office/types.js';
import { searchWikiPages, type WikiSearchResult } from '../wikiSearch.js';

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
  wikiResults?: WikiSearchResult[];
}

interface RpgDialogueProps {
  persona: Persona;
  player: PlayerProfile;
  npcAvatar: DialogueAvatar;
  topicLabels: Record<string, string>;
  language: LanguageCode;
  onClose: () => void;
  onOpenWiki?: () => void;
  onOpenWikiResult?: (link: WikiSearchResult) => void;
  onOpenMusic?: () => void;
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

function shorten(text: string, max: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return normalized.length > max ? `${normalized.slice(0, max).trim()}...` : normalized;
}

function naturalRoleLabel(persona: Persona, language: LanguageCode): string {
  if (language === 'zh-TW') {
    if (/sound|music|instrument/i.test(persona.role)) return '聲音與樂器實驗者';
    if (/textile|fabric|wearable/i.test(persona.role)) return '材料與織品實作者';
    if (/lab|fabrication|hardware|research/i.test(persona.role)) return '工作坊與研究實作者';
    if (/story|solar|travel/i.test(persona.role)) return '說故事的人';
    return '這個角色';
  }
  return shorten(persona.role, 48);
}

function makeFixedQuestions(language: LanguageCode, personaId: string): string[] {
  void personaId;
  const questions: Record<LanguageCode, string[]> = {
    'zh-TW': ['你是誰？', '這是哪？', '什麼是 LLM wiki？', '什麼是聯想功能？'],
    en: ['Who are you?', 'Where is this?', 'What is an LLM wiki?', 'What is Association?'],
    id: ['Siapa kamu?', 'Ini di mana?', 'Apa itu LLM wiki?', 'Apa itu Association?'],
    de: ['Wer bist du?', 'Wo ist das hier?', 'Was ist ein LLM-Wiki?', 'Was ist Association?'],
    ja: ['あなたは誰？', 'ここはどこ？', 'LLM wiki とは？', 'Association とは？'],
    th: ['คุณคือใคร?', 'ที่นี่คือที่ไหน?', 'LLM wiki คืออะไร?', 'Association คืออะไร?'],
  };
  return [...questions[language]];
}

function WukirMusicButton({ onOpenMusic }: { onOpenMusic?: () => void }) {
  if (!onOpenMusic) return null;
  return (
    <button
      className="rpg-dialogue-wukir-music-button rpg-dialogue-chip pbs-game-button"
      type="button"
      onClick={onOpenMusic}
    >
      🎧 聽 Wukir 的音樂
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

function wikiSearchIntro(language: LanguageCode, count: number): string {
  if (language === 'zh-TW') return count > 0 ? `我先幫你從本地 wiki 找到 ${count} 個比較貼近的頁面；下面可以直接打開。` : '我先查了本地 wiki，但這句話沒有找到夠準的頁面。可以換更具體的材料、作品或方法詞。';
  return count > 0 ? `I found ${count} close local wiki pages. You can open them below.` : 'I checked the local wiki, but this query did not return a precise page yet. Try a more specific material, work, or method term.';
}

function fixedQuestionReply(prompt: string, persona: Persona, language: LanguageCode): string | null {
  const normalized = prompt.toLowerCase().replace(/\s+/g, ' ').trim();
  const role = naturalRoleLabel(persona, language);
  const intro = localizedPersonaIntros[persona.id]?.[language] ?? persona.intro;

  if (/^(你是誰？?|who are you\??|siapa kamu\??|wer bist du\??|あなたは誰？?|คุณคือใคร\??)$/i.test(normalized)) {
    if (language === 'zh-TW') return `我是 ${persona.name}。在這裡，我被整理成一個可以對話的 ${role}：我不是完整本人，而是由訪談、wiki 線索與 PBS 的角色設定組成的入口。${intro}`;
    return `I am ${persona.name}. Here I am a conversational ${role}: not the complete person, but an entry point composed from interviews, wiki traces, and the PBS character layer. ${intro}`;
  }

  if (/^(這是哪？?|這裡是哪裡？?|where is this\??|where am i\??|ini di mana\??|wo ist das hier\??|ここはどこ？?|ที่นี่คือที่ไหน\??)$/i.test(normalized)) {
    if (language === 'zh-TW') return '這裡是 Peach Blossom Spring：一個把 NGM 訪談、PBS wiki、角色對話和生成小誌接在一起的互動場景。你可以和 NPC 談話，也可以把你的問題交給 LLM wiki，讓它沿著整理層、聯想層和來源層生成一份小誌。';
    return 'This is Peach Blossom Spring: an interactive scene connecting NGM interviews, the PBS wiki, character dialogue, and generated zines. You can talk with NPCs or send a question into the LLM wiki so it can produce a zine from organized notes, associations, and sources.';
  }

  if (/llm\s*-?\s*wiki|什麼是\s*llm\s*wiki|llm wiki とは|apa itu llm wiki|was ist ein llm-wiki/i.test(normalized)) {
    if (language === 'zh-TW') return 'LLM wiki 是給語言模型讀的 Obsidian wiki 結構。它不是只放原始資料，而是把 Public / Reading、Association / Semantic、Evidence / Raw Source 分層，讓模型先讀整理層與語意/實體橋，再追 wikilinks 到來源證據。它同時也可以用 lint 和維護規則檢查缺口，讓 wiki 在使用中自我演化、長出新的問題、索引和小誌材料。';
    return 'An LLM wiki is an Obsidian wiki structured for language models. It separates public reading pages, association/semantic layers, and raw evidence, so the model reads curated entry points first and follows wikilinks into sources. Lint and maintainer rules can also expose gaps, helping the wiki evolve into new questions, indexes, and zine material.';
  }

  if (/聯想功能|association|什麼是聯想功能|apa itu association|was ist association|association とは/i.test(normalized)) {
    if (language === 'zh-TW') return '聯想功能是 PBS 裡把「玩家問題」接到 LLM wiki 的生成工具。它會把問題當成查詢：先讀 semantic / entity layers，找相關 notes，追第一層 wikilinks，再用來源支撐生成小誌。之後也可以把生成結果與 lint 檢查回饋到 wiki，讓缺少的索引、概念頁和來源橋逐步被補起來。';
    return 'Association is the PBS tool that docks a player question into the LLM wiki. It treats the question as a query, reads semantic/entity layers, follows wikilinks, and uses source evidence to generate a zine. The resulting traces and lint checks can feed back into the wiki so missing indexes, concepts, and source bridges can be improved.';
  }

  return null;
}

export function RpgDialogue({ persona, player, npcAvatar, topicLabels, language, onClose, onOpenWiki, onOpenWikiResult, onOpenMusic, onSimEvent }: RpgDialogueProps) {
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [areSuggestionsOpen, setAreSuggestionsOpen] = useState(false);
  const messageLogRef = useRef<HTMLDivElement>(null);

  const orderedTopics = useMemo(() => Object.keys(topicLabels), [topicLabels]);
  const [loadedKnowledge, setLoadedKnowledge] = useState<KnowledgeBase | null>(null);
  const fixedQuestions = useMemo(() => makeFixedQuestions(language, persona.id), [language, persona.id]);

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
      const fixedReply = fixedQuestionReply(trimmed, persona, language);
      if (fixedReply) {
        setMessages((prev) => [...prev, { speaker: persona.name, text: fixedReply }]);
        return;
      }
      const dialogueKnowledge = loadedKnowledge ?? (await loadKnowledgeBase(persona));
      if (!loadedKnowledge) setLoadedKnowledge(dialogueKnowledge);
      const chatKnowledge = { ...dialogueKnowledge, responses: persona.responses };
      const evidence = retrieveNpcEvidence({
        message: trimmed,
        retrievalContext: topic,
        knowledge: chatKnowledge,
      });
      const wikiResults = searchWikiPages(trimmed, persona.id, 6);
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
        reply = localNpcChat({ message: trimmed, retrievalContext: topic, knowledge: chatKnowledge }).reply;
      }
      const groundedReply = wikiResults.length > 0
        ? `${wikiSearchIntro(language, wikiResults.length)} ${reply}`
        : reply;
      const answer = { reply: groundedReply, evidence, wikiResults };
      setMessages((prev) => [...prev, { speaker: persona.name, text: answer.reply, evidence: answer.evidence, wikiResults: answer.wikiResults }]);
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
    void submitPrompt(prompt);
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
                <p className="rpg-dialogue-kicker pbs-frame-kicker text-lg uppercase tracking-wide text-accent-bright m-0">{t(language, 'home.wanderAndTalk')}</p>
                <button
                  className="rpg-dialogue-wiki-button rpg-dialogue-chip pbs-frame-button pbs-game-button pbs-game-button--bubble"
                  type="button"
                  aria-label={t(language, 'dialogue.openWiki')}
                  title={t(language, 'dialogue.openWiki')}
                  onClick={onOpenWiki}
                >
                  <span className="pbs-emoji-control" aria-hidden="true">📚</span>
                </button>
                {persona.id === 'wukir-suryadi' && <WukirMusicButton onOpenMusic={onOpenMusic} />}
              </div>
              <h2 className="rpg-dialogue-name pbs-frame-title text-2xl leading-none">{persona.name}</h2>
              <p className="rpg-dialogue-role pbs-frame-subtitle text-xl text-text-muted mt-2">{persona.role}</p>
            </div>
          </div>
          <button className="rpg-dialogue-x pbs-frame-action" type="button" onClick={onClose}>
            X
          </button>
        </div>

        <div className="rpg-dialogue-main flex-1 min-h-0 flex gap-6 mb-6">
          <div ref={messageLogRef} className="rpg-dialogue-log pbs-frame-body rpg-message-scroll flex-1 overflow-auto bg-bg/70 border border-border px-10 py-9 text-xl">
            {messages.map((message, index) => (
              <div key={`${message.speaker}-${index.toString()}`} className="rpg-dialogue-message text-xl leading-relaxed mb-6 last:mb-0">
                <p className="m-0">
                  <span className="text-accent-bright">{message.speaker}: </span>
                  {message.text}
                </p>
                {message.wikiResults && message.wikiResults.length > 0 && (
                  <div className="rpg-dialogue-wiki-results">
                    {message.wikiResults.map((link) => (
                      <button
                        key={link.url}
                        type="button"
                        className="rpg-dialogue-wiki-result pbs-game-button"
                        onClick={() => onOpenWikiResult?.(link)}
                      >
                        <strong>{link.title}</strong>
                        <span>{link.sourceFamily}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <p className="rpg-dialogue-thinking text-base text-text-muted">
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

        <form onSubmit={(event) => void handleSubmit(event)} className="rpg-dialogue-form flex gap-4">
          <input
            type="text"
            className="rpg-dialogue-input flex-1 bg-bg border-2 border-border px-7 py-6 text-xl text-text outline-none focus:border-accent-bright"
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
            type="button"
            aria-expanded={areSuggestionsOpen}
            onClick={() => setAreSuggestionsOpen((prev) => !prev)}
          >
            {t(language, 'dialogue.askQuestion')} {areSuggestionsOpen ? '▲' : '▼'}
          </button>
          <button
            className="rpg-dialogue-submit pbs-game-button pbs-game-button--bubble disabled:opacity-50"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? '...' : t(language, 'dialogue.talkButton')}
          </button>
        </form>

        {error && <p className="text-lg text-red-300 mt-4">{error}</p>}
      </section>
    </div>
  );
}
