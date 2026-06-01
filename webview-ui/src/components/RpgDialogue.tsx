import { useEffect, useMemo, useRef, useState } from 'react';

import type { KnowledgeBase } from '../deepseekClient.js';
import { askDeepSeekPersonaWithEvidence, loadKnowledgeBase } from '../deepseekClient.js';
import { type LanguageCode, t } from '../i18n.js';
import { askNpc, canUseLocalMemoryServer, type DialogueHistoryTurn } from '../localMemoryApi.js';
import { buildTranscriptEvidenceChunks, retrieveNpcEvidence, type ChatEvidence, rankEvidence } from '../localChatbot.js';
import { getCharacterSprites } from '../office/sprites/spriteData.js';
import { Direction, type SpriteData } from '../office/types.js';
import { searchWikiPages, searchWikiPagesWithHints, type WikiSearchResult } from '../wikiSearch.js';

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
  links?: WikiSearchResult[];
}

const DIALOGUE_CONTEXT_TURNS = 8;

function recentDialogueHistory(messages: DialogueMessage[]): DialogueHistoryTurn[] {
  return messages
    .filter((message) => message.text.trim())
    .slice(-DIALOGUE_CONTEXT_TURNS)
    .map((message) => ({ speaker: message.speaker, text: message.text.trim() }));
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

function cleanQuestionPart(text: string, max = 54): string {
  return shorten(text.replace(/[。.!?？]+$/g, ''), max);
}

function shuffleCopy<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

const personaQuestionSeeds: Record<string, string[]> = {
  'jonathan-minchin': [
    'Open Source Beehives 如何把感測器、蜂群與農地照護連成一種可共享的田野知識？',
    'Green Fab Lab 的農業機器人與生態日曆，怎麼改變 fab lab 只做工具展示的想像？',
    'Jonathan 的訪談裡，什麼樣的在地關係比實驗室設備更能讓技術留下來？',
  ],
  'marc-dusseiller': [
    'Marc 說的 Hackteria 精神裡，為什麼便宜、可拆、好笑會比正式實驗室更重要？',
    '在 Marc 的工作坊經驗裡，失敗、料理、焊接和友誼怎麼一起變成教學方法？',
    '如果一個 science-art box 不能被打開、污染、重做，Marc 會怎麼批評它？',
  ],
  'tincuta-heinzel': [
    '什麼是 ATTEMPTS, FAILURES, TRIALS AND ERRORS？',
    'Tincuta 如何把失敗、策展與在地回應轉成可以被保存的研究問題？',
    '從 Tincuta 的訪談看，營隊什麼時候比較像策展工具，而不是教學活動？',
  ],
};

type NpcGuideProfile = {
  opener: Record<LanguageCode, string>;
  questions: Record<LanguageCode, string[]>;
};

const npcGuideProfiles: Record<string, NpcGuideProfile> = {
  abao: {
    opener: {
      'zh-TW': '我喜歡把太陽能、雷射、旅行和奇怪寓言混在一起。你想知道科學藝術怎麼變成一個故事嗎？',
      en: 'I like mixing solar material, lasers, travel, and strange fables. Want to see how science art can become a story?',
      id: 'Aku suka mencampur bahan surya, laser, perjalanan, dan dongeng aneh. Mau melihat seni-sains menjadi cerita?',
      de: 'Ich mische gern Solarmaterial, Laser, Reisen und seltsame Fabeln. Willst du sehen, wie Science-Art zur Geschichte wird?',
      ja: '太陽素材、レーザー、旅、変な寓話を混ぜるのが好きです。科学芸術が物語になるところを見たいですか？',
      th: 'ฉันชอบผสมวัสดุพลังงานแสงอาทิตย์ เลเซอร์ การเดินทาง และนิทานแปลก ๆ อยากดูไหมว่าวิทยาศาสตร์ศิลป์กลายเป็นเรื่องเล่าได้อย่างไร?',
    },
    questions: {
      'zh-TW': ['太陽能材料可以怎麼用在藝術作品裡？', '旅行為什麼會變成一種研究方法？', '雷射和寓言可以怎麼放在同一個作品裡？'],
      en: ['How can solar materials be used in artworks?', 'Why can travel become a research method?', 'How can lasers and fables belong in the same artwork?'],
      id: ['Bagaimana bahan surya bisa dipakai dalam karya seni?', 'Mengapa perjalanan bisa menjadi metode riset?', 'Bagaimana laser dan dongeng bisa berada dalam karya yang sama?'],
      de: ['Wie können Solarmaterialien in Kunstwerken verwendet werden?', 'Warum kann Reisen eine Forschungsmethode sein?', 'Wie passen Laser und Fabeln in dasselbe Werk?'],
      ja: ['太陽素材は作品の中でどう使えますか？', 'なぜ旅は研究方法になりますか？', 'レーザーと寓話は同じ作品にどう入れられますか？'],
      th: ['วัสดุพลังงานแสงอาทิตย์ใช้ในงานศิลปะได้อย่างไร?', 'ทำไมการเดินทางจึงเป็นวิธีวิจัยได้?', 'เลเซอร์กับนิทานอยู่ในงานเดียวกันได้อย่างไร?'],
    },
  },
  'andreas-siagian': {
    opener: {
      'zh-TW': '我在意的是鄰里裡真的有人會用、會修、會照顧的技術。你想知道實驗室怎麼長在日常生活裡嗎？',
      en: 'I care about tools that neighbors can really use, repair, and care for. Want to know how a lab grows inside everyday life?',
      id: 'Aku peduli pada alat yang benar-benar bisa dipakai, diperbaiki, dan dirawat tetangga. Mau tahu lab tumbuh dalam hidup sehari-hari?',
      de: 'Mich interessieren Werkzeuge, die Nachbarinnen wirklich nutzen, reparieren und pflegen können. Willst du wissen, wie ein Labor im Alltag wächst?',
      ja: '近所の人が本当に使い、直し、世話できる道具が大事です。ラボが日常の中で育つ様子を知りたいですか？',
      th: 'ฉันสนใจเครื่องมือที่เพื่อนบ้านใช้ ซ่อม และดูแลได้จริง อยากรู้ไหมว่าแล็บเติบโตในชีวิตประจำวันอย่างไร?',
    },
    questions: {
      'zh-TW': ['什麼是 Lifepatch 的社群實驗室？', '為什麼鄰里關係比昂貴設備更重要？', '開放科學在印尼城市裡可以怎麼做？'],
      en: ['What is the Lifepatch community lab?', 'Why can neighborhood relations matter more than expensive equipment?', 'How can open science work in an Indonesian city?'],
      id: ['Apa itu laboratorium komunitas Lifepatch?', 'Mengapa relasi lingkungan bisa lebih penting daripada alat mahal?', 'Bagaimana sains terbuka berjalan di kota Indonesia?'],
      de: ['Was ist das Community-Labor Lifepatch?', 'Warum können Nachbarschaftsbeziehungen wichtiger sein als teure Geräte?', 'Wie kann offene Wissenschaft in einer indonesischen Stadt funktionieren?'],
      ja: ['Lifepatch のコミュニティ・ラボとは何ですか？', 'なぜ高価な機材より近隣関係が大事なのですか？', 'インドネシアの都市でオープンサイエンスはどう行えますか？'],
      th: ['แล็บชุมชน Lifepatch คืออะไร?', 'ทำไมความสัมพันธ์ในละแวกบ้านจึงสำคัญกว่าอุปกรณ์แพง ๆ?', 'วิทยาศาสตร์เปิดทำงานในเมืองอินโดนีเซียได้อย่างไร?'],
    },
  },
  'anastassia-pistofidou': {
    opener: {
      'zh-TW': '我喜歡把課程拆成可以旅行、可以被別人改造的節點。你想知道學校怎麼變成一張國際互助網嗎？',
      en: 'I like turning courses into traveling nodes that other people can remake. Want to see how a school becomes an international support network?',
      id: 'Aku suka mengubah kursus menjadi simpul bergerak yang bisa dibuat ulang orang lain. Mau melihat sekolah menjadi jaringan bantuan internasional?',
      de: 'Ich mache aus Kursen gern reisende Knoten, die andere neu bauen können. Willst du sehen, wie Schule zu einem internationalen Hilfsnetz wird?',
      ja: '授業を旅するノードにして、他の人が作り替えられる形にするのが好きです。学校が国際的な支援網になるところを見たいですか？',
      th: 'ฉันชอบเปลี่ยนหลักสูตรให้เป็นโหนดที่เดินทางและถูกดัดแปลงได้ อยากดูไหมว่าโรงเรียนกลายเป็นเครือข่ายช่วยเหลือนานาชาติอย่างไร?',
    },
    questions: {
      'zh-TW': ['Fabricademy 是怎麼教電子織品的？', '為什麼分散式節點可以變成一所學校？', '同儕評量在黑客營裡怎麼運作？'],
      en: ['How does Fabricademy teach electronic textiles?', 'Why can distributed nodes become a school?', 'How does peer review work inside a hacker camp?'],
      id: ['Bagaimana Fabricademy mengajarkan tekstil elektronik?', 'Mengapa simpul tersebar bisa menjadi sekolah?', 'Bagaimana penilaian sejawat bekerja di kamp peretas?'],
      de: ['Wie lehrt Fabricademy elektronische Textilien?', 'Warum können verteilte Knoten zu einer Schule werden?', 'Wie funktioniert Peer-Review in einem Hacker-Camp?'],
      ja: ['Fabricademy は電子テキスタイルをどう教えますか？', 'なぜ分散したノードが学校になれるのですか？', 'ハッカーキャンプで相互評価はどう働きますか？'],
      th: ['Fabricademy สอนสิ่งทออิเล็กทรอนิกส์อย่างไร?', 'ทำไมโหนดที่กระจายกันจึงกลายเป็นโรงเรียนได้?', 'การประเมินโดยเพื่อนทำงานในแคมป์แฮกเกอร์อย่างไร?'],
    },
  },
  'christian-dils': {
    opener: {
      'zh-TW': '我會先問：這台機器壞了誰修？規則誰懂？你想知道一個技術公地怎麼不被用壞嗎？',
      en: 'I first ask: who repairs this machine, and who understands the rules? Want to know how a technical commons avoids breaking down?',
      id: 'Aku pertama bertanya: siapa memperbaiki mesin ini, dan siapa paham aturannya? Mau tahu commons teknis tidak cepat rusak?',
      de: 'Ich frage zuerst: Wer repariert diese Maschine, und wer versteht die Regeln? Willst du wissen, wie technische Commons nicht zerfallen?',
      ja: 'まず聞きます。この機械は誰が直し、誰がルールを理解していますか？技術コモンズが壊れない方法を知りたいですか？',
      th: 'ฉันถามก่อนว่าเครื่องนี้เสียแล้วใครซ่อม และใครเข้าใจกติกา อยากรู้ไหมว่าคอมมอนส์ทางเทคนิคไม่พังได้อย่างไร?',
    },
    questions: {
      'zh-TW': ['為什麼維修也是社群文化的一部分？', '標準作業流程可以怎麼保護開放實驗室？', '健康的技術公地需要哪些規則？'],
      en: ['Why is maintenance part of community culture?', 'How can standard procedures protect an open lab?', 'What rules does a healthy technical commons need?'],
      id: ['Mengapa perawatan menjadi bagian budaya komunitas?', 'Bagaimana prosedur standar melindungi lab terbuka?', 'Aturan apa yang dibutuhkan commons teknis yang sehat?'],
      de: ['Warum ist Wartung Teil von Community-Kultur?', 'Wie schützen Standardabläufe ein offenes Labor?', 'Welche Regeln braucht ein gesundes technisches Commons?'],
      ja: ['なぜ保守はコミュニティ文化の一部なのですか？', '標準手順はオープンラボをどう守りますか？', '健全な技術コモンズにはどんな規則が必要ですか？'],
      th: ['ทำไมการบำรุงรักษาจึงเป็นส่วนหนึ่งของวัฒนธรรมชุมชน?', 'ขั้นตอนมาตรฐานปกป้องแล็บเปิดได้อย่างไร?', 'คอมมอนส์ทางเทคนิคที่แข็งแรงต้องมีกติกาอะไร?'],
    },
  },
  'giulia-tomasello': {
    opener: {
      'zh-TW': '我把感測器放到身體附近時，第一個問題永遠是同意和照護。你想知道電子織品怎麼不只是一件酷衣服嗎？',
      en: 'When I put sensors near bodies, the first questions are consent and care. Want to know why electronic textiles are more than cool clothing?',
      id: 'Saat sensor dekat tubuh, pertanyaan pertama adalah persetujuan dan perawatan. Mau tahu mengapa tekstil elektronik lebih dari pakaian keren?',
      de: 'Wenn Sensoren nah an Körper kommen, frage ich zuerst nach Zustimmung und Care. Willst du wissen, warum elektronische Textilien mehr sind als coole Kleidung?',
      ja: 'センサーを身体の近くに置く時、最初の問いは同意とケアです。電子テキスタイルが格好いい服以上のものだと知りたいですか？',
      th: 'เมื่อวางเซนเซอร์ใกล้ร่างกาย คำถามแรกคือความยินยอมและการดูแล อยากรู้ไหมว่าสิ่งทออิเล็กทรอนิกส์ไม่ใช่แค่เสื้อผ้าเท่ ๆ?',
    },
    questions: {
      'zh-TW': ['你想了解 KOBAKANT 的電子織品和 soft circuit 是什麼嗎？', '為什麼身體資料需要同意和照護？', '女性主義科技工作坊可以怎麼設計？'],
      en: ['Do you want to understand KOBAKANT electronic textiles and soft circuits?', 'Why do body data need consent and care?', 'How can a feminist technology workshop be designed?'],
      id: ['Mau memahami tekstil elektronik KOBAKANT dan soft circuit?', 'Mengapa data tubuh membutuhkan persetujuan dan perawatan?', 'Bagaimana merancang lokakarya teknologi feminis?'],
      de: ['Möchtest du KOBAKANTs elektronische Textilien und Soft Circuits verstehen?', 'Warum brauchen Körperdaten Zustimmung und Care?', 'Wie entwirft man einen feministischen Technologie-Workshop?'],
      ja: ['KOBAKANT の電子テキスタイルとソフト回路を知りたいですか？', 'なぜ身体データには同意とケアが必要ですか？', 'フェミニスト技術ワークショップはどう設計できますか？'],
      th: ['อยากเข้าใจสิ่งทออิเล็กทรอนิกส์และ soft circuit ของ KOBAKANT ไหม?', 'ทำไมข้อมูลร่างกายต้องมีความยินยอมและการดูแล?', 'เวิร์กช็อปเทคโนโลยีเฟมินิสต์ออกแบบได้อย่างไร?'],
    },
  },
  'jonathan-minchin': {
    opener: {
      'zh-TW': '我喜歡把 Green Fab Lab、Valldaura 的森林、蜂箱、感測器和農地放在同一張桌上。你想知道製造實驗室怎麼照顧一片土地嗎？',
      en: 'I like putting Green Fab Lab, Valldaura forests, beehives, sensors, and farmland on the same table. Want to know how a fab lab can care for land?',
      id: 'Aku suka menaruh Green Fab Lab, hutan Valldaura, sarang lebah, sensor, dan lahan tani di meja yang sama. Mau tahu fab lab merawat tanah?',
      de: 'Ich lege gern Green Fab Lab, Valldaura-Wälder, Bienenstöcke, Sensoren und Felder auf denselben Tisch. Willst du wissen, wie ein Fab Lab Land pflegt?',
      ja: 'Green Fab Lab、Valldaura の森、蜂箱、センサー、農地を同じテーブルに置くのが好きです。ファブラボが土地を世話する方法を知りたいですか？',
      th: 'ฉันชอบวาง Green Fab Lab ป่า Valldaura รังผึ้ง เซนเซอร์ และพื้นที่เกษตรไว้บนโต๊ะเดียวกัน อยากรู้ไหมว่าแฟ็บแล็บดูแลผืนดินได้อย่างไร?',
    },
    questions: {
      'zh-TW': ['Open Source Beehives 如何把感測器、蜂群照護和 Green Fab Lab 連起來？', 'Valldaura 的 Green Fab Lab 為什麼把森林當成實驗室？', '農業機器人可以怎麼服務社群而不是只展示科技？'],
      en: ['How do Open Source Beehives connect sensors, bee care, and Green Fab Lab?', 'Why does Valldaura Green Fab Lab treat the forest as a laboratory?', 'How can farm robots serve communities instead of only showing technology?'],
      id: ['Bagaimana Open Source Beehives menghubungkan sensor, perawatan lebah, dan Green Fab Lab?', 'Mengapa Valldaura Green Fab Lab memperlakukan hutan sebagai laboratorium?', 'Bagaimana robot pertanian melayani komunitas, bukan hanya memamerkan teknologi?'],
      de: ['Wie verbinden Open Source Beehives Sensoren, Bienenpflege und Green Fab Lab?', 'Warum behandelt Valldaura Green Fab Lab den Wald als Labor?', 'Wie können Agrarroboter Communities dienen statt nur Technik zu zeigen?'],
      ja: ['Open Source Beehives はセンサー、蜂の世話、Green Fab Lab をどう結びますか？', 'Valldaura Green Fab Lab はなぜ森を実験室として扱いますか？', '農業ロボットは技術展示ではなくコミュニティにどう役立ちますか？'],
      th: ['Open Source Beehives เชื่อมเซนเซอร์ การดูแลผึ้ง และ Green Fab Lab อย่างไร?', 'ทำไม Valldaura Green Fab Lab จึงมองป่าเป็นห้องทดลอง?', 'หุ่นยนต์เกษตรรับใช้ชุมชนแทนการโชว์เทคโนโลยีได้อย่างไร?'],
    },
  },
  'marc-dusseiller': {
    opener: {
      'zh-TW': '我最喜歡像專業旅行者那樣把實驗室塞進行李箱。你想用便宜的方法自己製造高科技實驗工具嗎？',
      en: 'My favorite trick is traveling like a pro with a lab in the luggage. Want to build high-tech lab tools cheaply by yourself?',
      id: 'Trik favoritku adalah bepergian seperti profesional dengan lab di koper. Mau membuat alat lab canggih secara murah?',
      de: 'Mein Lieblingstrick ist Reisen wie ein Profi, mit einem Labor im Gepäck. Willst du Hightech-Laborwerkzeuge billig selbst bauen?',
      ja: 'お気に入りは、実験室を荷物に入れてプロのように旅することです。安くハイテク実験道具を自作したいですか？',
      th: 'เคล็ดลับโปรดของฉันคือเดินทางแบบมือโปรพร้อมแล็บในกระเป๋า อยากสร้างเครื่องมือแล็บไฮเทคราคาถูกเองไหม?',
    },
    questions: {
      'zh-TW': ['你想知道 Hackteria 怎麼便宜地自製顯微鏡和實驗工具嗎？', '你們多久辦一次黑客營？在哪辦？', '為什麼失敗、煮飯和焊接可以變成教學方法？'],
      en: ['Do you want to know how Hackteria builds cheap DIY microscopes and lab tools?', 'How often do you run hacker camps, and where do they happen?', 'Why can failure, cooking, and soldering become a teaching method?'],
      id: ['Mau tahu bagaimana Hackteria membuat mikroskop DIY dan alat lab murah?', 'Seberapa sering kalian membuat kamp peretas, dan di mana?', 'Mengapa kegagalan, memasak, dan menyolder bisa menjadi metode belajar?'],
      de: ['Willst du wissen, wie Hackteria billige DIY-Mikroskope und Laborwerkzeuge baut?', 'Wie oft veranstaltet ihr Hacker-Camps, und wo finden sie statt?', 'Warum können Scheitern, Kochen und Löten zu einer Lehrmethode werden?'],
      ja: ['Hackteria が安い DIY 顕微鏡や実験道具をどう作るか知りたいですか？', 'ハッカーキャンプはどのくらいの頻度で、どこで開きますか？', 'なぜ失敗、料理、はんだ付けが教え方になるのですか？'],
      th: ['อยากรู้ไหมว่า Hackteria ทำกล้องจุลทรรศน์ DIY และเครื่องมือแล็บราคาถูกอย่างไร?', 'พวกคุณจัดแคมป์แฮกเกอร์บ่อยแค่ไหน และจัดที่ไหน?', 'ทำไมความล้มเหลว การทำอาหาร และการบัดกรีจึงเป็นวิธีสอนได้?'],
    },
  },
  'mika-satomi': {
    opener: {
      'zh-TW': '我喜歡讓布、線、電路和人的願望一起工作。你想知道電子織品怎麼從小承諾開始長大嗎？',
      en: 'I like making fabric, thread, circuits, and people’s wishes work together. Want to know how electronic textiles grow from small promises?',
      id: 'Aku suka membuat kain, benang, rangkaian, dan harapan orang bekerja bersama. Mau tahu tekstil elektronik tumbuh dari janji kecil?',
      de: 'Ich lasse gern Stoff, Faden, Schaltungen und Wünsche zusammenarbeiten. Willst du wissen, wie elektronische Textilien aus kleinen Versprechen wachsen?',
      ja: '布、糸、回路、人の願いを一緒に働かせるのが好きです。電子テキスタイルが小さな約束から育つ様子を知りたいですか？',
      th: 'ฉันชอบให้ผ้า ด้าย วงจร และความปรารถนาของผู้คนทำงานร่วมกัน อยากรู้ไหมว่าสิ่งทออิเล็กทรอนิกส์เติบโตจากคำมั่นเล็ก ๆ อย่างไร?',
    },
    questions: {
      'zh-TW': ['你想了解 KOBAKANT 的電子織品和 soft circuit 是什麼嗎？', 'KOBAKANT 為什麼要分享做法而不只展示作品？', '願望牆如何幫社群決定下一步？'],
      en: ['Do you want to understand KOBAKANT electronic textiles and soft circuits?', 'Why does KOBAKANT share how-to knowledge instead of only showing finished work?', 'How can a wish wall help a community choose its next step?'],
      id: ['Mau memahami tekstil elektronik KOBAKANT dan soft circuit?', 'Mengapa KOBAKANT berbagi cara membuat, bukan hanya karya jadi?', 'Bagaimana dinding harapan membantu komunitas memilih langkah berikutnya?'],
      de: ['Möchtest du KOBAKANTs elektronische Textilien und Soft Circuits verstehen?', 'Warum teilt KOBAKANT Anleitungen statt nur fertige Arbeiten zu zeigen?', 'Wie hilft eine Wunschwand einer Community beim nächsten Schritt?'],
      ja: ['KOBAKANT の電子テキスタイルとソフト回路を知りたいですか？', 'KOBAKANT はなぜ完成品だけでなく作り方を共有するのですか？', '願いの壁はコミュニティの次の一歩をどう助けますか？'],
      th: ['อยากเข้าใจสิ่งทออิเล็กทรอนิกส์และ soft circuit ของ KOBAKANT ไหม?', 'ทำไม KOBAKANT จึงแบ่งปันวิธีทำ ไม่ใช่แค่โชว์ผลงานสำเร็จ?', 'กำแพงความปรารถนาช่วยชุมชนเลือกก้าวต่อไปอย่างไร?'],
    },
  },
  'rully-shabara': {
    opener: {
      'zh-TW': '我比較相信圍成一圈、一起吃飯、一起練習，而不是把營隊變成商品。你想知道聲音社群怎麼不被產業吞掉嗎？',
      en: 'I trust circles, meals, and practice more than turning camps into products. Want to know how a voice community avoids being swallowed by industry?',
      id: 'Aku lebih percaya lingkaran, makan bersama, dan latihan daripada mengubah kamp menjadi produk. Mau tahu komunitas suara tidak ditelan industri?',
      de: 'Ich vertraue Kreisen, gemeinsamen Mahlzeiten und Übung mehr als Camps als Produkt. Willst du wissen, wie eine Stimm-Community nicht von Industrie geschluckt wird?',
      ja: 'キャンプを商品にするより、輪、食事、練習を信じます。声のコミュニティが産業に飲み込まれない方法を知りたいですか？',
      th: 'ฉันเชื่อวงล้อม อาหารร่วมกัน และการฝึก มากกว่าการเปลี่ยนแคมป์เป็นสินค้า อยากรู้ไหมว่าชุมชนเสียงไม่ถูกอุตสาหกรรมกลืนได้อย่างไร?',
    },
    questions: {
      'zh-TW': ['為什麼身體聲音練習可以變成社群方法？', '營隊什麼時候會被產業化？', '一起吃飯和圍圈討論為什麼重要？'],
      en: ['Why can body-voice practice become a community method?', 'When does a camp become industrialized?', 'Why do shared meals and circle discussions matter?'],
      id: ['Mengapa latihan suara tubuh bisa menjadi metode komunitas?', 'Kapan kamp berubah menjadi industri?', 'Mengapa makan bersama dan diskusi melingkar penting?'],
      de: ['Warum kann Körper-Stimm-Praxis eine Community-Methode werden?', 'Wann wird ein Camp industrialisiert?', 'Warum sind gemeinsames Essen und Kreisgespräche wichtig?'],
      ja: ['身体の声の練習はなぜコミュニティの方法になりますか？', 'キャンプはいつ産業化されますか？', '一緒に食べることや輪で話すことはなぜ重要ですか？'],
      th: ['ทำไมการฝึกเสียงจากร่างกายจึงเป็นวิธีของชุมชนได้?', 'แคมป์กลายเป็นอุตสาหกรรมเมื่อไร?', 'ทำไมการกินร่วมกันและการคุยเป็นวงจึงสำคัญ?'],
    },
  },
  'ryu-oyama': {
    opener: {
      'zh-TW': '我把島嶼的距離當成方法，不是麻煩。你想知道偏遠地方怎麼反而能保護活動的節奏嗎？',
      en: 'I treat island distance as a method, not a problem. Want to know how remoteness can protect the rhythm of an event?',
      id: 'Aku melihat jarak pulau sebagai metode, bukan masalah. Mau tahu tempat jauh bisa melindungi ritme acara?',
      de: 'Ich behandle Inseldistanz als Methode, nicht als Problem. Willst du wissen, wie Abgelegenheit den Rhythmus einer Veranstaltung schützt?',
      ja: '島の距離を問題ではなく方法として扱います。遠さが活動のリズムを守る方法を知りたいですか？',
      th: 'ฉันมองระยะห่างของเกาะเป็นวิธี ไม่ใช่ปัญหา อยากรู้ไหมว่าความห่างไกลปกป้องจังหวะของกิจกรรมได้อย่างไร?',
    },
    questions: {
      'zh-TW': ['孤立為什麼可以是一種資源？', '島嶼節奏如何改變黑客營的時間感？', '什麼是Oki Wonder Lab?'],
      en: ['Why can isolation become a resource?', 'How does island rhythm change the timing of a hacker camp?', 'What is Oki Wonder Lab?'],
      id: ['Mengapa isolasi bisa menjadi sumber daya?', 'Bagaimana ritme pulau mengubah waktu kamp peretas?', 'Apa itu Oki Wonder Lab?'],
      de: ['Warum kann Isolation eine Ressource sein?', 'Wie verändert Inselrhythmus die Zeit eines Hacker-Camps?', 'Was ist Oki Wonder Lab?'],
      ja: ['孤立はなぜ資源になれますか？', '島のリズムはハッカーキャンプの時間をどう変えますか？', 'Oki Wonder Lab とは何ですか？'],
      th: ['ทำไมความโดดเดี่ยวจึงเป็นทรัพยากรได้?', 'จังหวะของเกาะเปลี่ยนเวลาของแคมป์แฮกเกอร์อย่างไร?', 'Oki Wonder Lab คืออะไร?'],
    },
  },
  'stephanie-pan': {
    opener: {
      'zh-TW': '我喜歡把 Modern Body Festival 變成大家都能加入的小實驗室。你想知道觀眾怎麼不只是看表演，而是一起主持嗎？',
      en: 'I like turning Modern Body Festival into small laboratories that everyone can enter. Want to know how audiences can co-host instead of just watching?',
      id: 'Aku suka mengubah Modern Body Festival menjadi laboratorium kecil yang bisa dimasuki semua orang. Mau tahu penonton ikut menjadi tuan rumah?',
      de: 'Ich verwandle Modern Body Festival gern in kleine Labore, die alle betreten können. Willst du wissen, wie Publikum mitgastgibt statt nur zuzuschauen?',
      ja: 'Modern Body Festival を誰でも入れる小さな実験室にするのが好きです。観客が見るだけでなく共同ホストになる方法を知りたいですか？',
      th: 'ฉันชอบเปลี่ยน Modern Body Festival เป็นห้องทดลองเล็ก ๆ ที่ทุกคนเข้าได้ อยากรู้ไหมว่าผู้ชมเป็นเจ้าภาพร่วมแทนการดูเฉย ๆ ได้อย่างไร?',
    },
    questions: {
      'zh-TW': ['Modern Body Festival 如何把身體、科技和表演變成微型實驗室？', '什麼是觀眾共同主持？', '照護條款可以怎麼放進表演活動？'],
      en: ['How does Modern Body Festival turn bodies, technology, and performance into a micro-lab?', 'What does audience co-hosting mean?', 'How can care clauses be built into a performance event?'],
      id: ['Bagaimana Modern Body Festival mengubah tubuh, teknologi, dan pertunjukan menjadi lab mikro?', 'Apa arti penonton ikut menjadi tuan rumah?', 'Bagaimana klausul perawatan masuk ke acara pertunjukan?'],
      de: ['Wie macht Modern Body Festival Körper, Technologie und Performance zu einem Mikrolabor?', 'Was bedeutet Co-Hosting durch das Publikum?', 'Wie können Care-Klauseln in eine Performance eingebaut werden?'],
      ja: ['Modern Body Festival は身体、テクノロジー、上演をどうマイクロラボにしますか？', '観客との共同ホストとは何ですか？', 'ケア条項はパフォーマンスにどう入れられますか？'],
      th: ['Modern Body Festival เปลี่ยนร่างกาย เทคโนโลยี และการแสดงเป็นไมโครแล็บอย่างไร?', 'การให้ผู้ชมเป็นเจ้าภาพร่วมหมายถึงอะไร?', 'ข้อตกลงเรื่องการดูแลใส่ในงานแสดงได้อย่างไร?'],
    },
  },
  'stelio-manousakis': {
    opener: {
      'zh-TW': '我會把 Modern Body Festival 的排練、行政、音場檢查都當成表演的一部分。你想知道聲音藝術社群怎麼靠日常規則運作嗎？',
      en: 'I treat Modern Body Festival rehearsal, administration, and sound-checks as part of the performance. Want to know how a sound-art community runs on everyday rules?',
      id: 'Aku melihat latihan, administrasi, dan cek suara Modern Body Festival sebagai bagian dari pertunjukan. Mau tahu komunitas seni suara berjalan lewat aturan harian?',
      de: 'Ich behandle Probe, Verwaltung und Soundcheck von Modern Body Festival als Teil der Aufführung. Willst du wissen, wie eine Klangkunst-Community durch Alltagsregeln läuft?',
      ja: 'Modern Body Festival のリハーサル、運営、サウンドチェックを上演の一部として扱います。音の芸術コミュニティが日常の規則で動く様子を知りたいですか？',
      th: 'ฉันมองการซ้อม งานบริหาร และซาวด์เช็กของ Modern Body Festival เป็นส่วนหนึ่งของการแสดง อยากรู้ไหมว่าชุมชนศิลปะเสียงทำงานด้วยกติกาประจำวันอย่างไร?',
    },
    questions: {
      'zh-TW': ['Modern Body Festival 的聲音檢查為什麼也是治理？', '表演團體如何處理行政和創作的衝突？', '小型聲音藝術社群需要哪些日常規則？'],
      en: ['Why is sound-check at Modern Body Festival also governance?', 'How does a performance group handle conflict between administration and creation?', 'What everyday rules does a small sound-art community need?'],
      id: ['Mengapa cek suara di Modern Body Festival juga merupakan tata kelola?', 'Bagaimana kelompok pertunjukan menangani konflik administrasi dan kreasi?', 'Aturan harian apa yang dibutuhkan komunitas seni suara kecil?'],
      de: ['Warum ist Soundcheck beim Modern Body Festival auch Governance?', 'Wie geht eine Performance-Gruppe mit Konflikten zwischen Verwaltung und Kreation um?', 'Welche Alltagsregeln braucht eine kleine Klangkunst-Community?'],
      ja: ['Modern Body Festival のサウンドチェックはなぜガバナンスでもありますか？', 'パフォーマンス団体は運営と創作の衝突をどう扱いますか？', '小さな音の芸術コミュニティにはどんな日常ルールが必要ですか？'],
      th: ['ทำไมซาวด์เช็กที่ Modern Body Festival จึงเป็นการกำกับดูแลด้วย?', 'กลุ่มการแสดงจัดการความขัดแย้งระหว่างงานบริหารกับการสร้างสรรค์อย่างไร?', 'ชุมชนศิลปะเสียงขนาดเล็กต้องมีกติกาประจำวันอะไร?'],
    },
  },
  'svenja-keune': {
    opener: {
      'zh-TW': '我喜歡先和微生物、植物、身體一起待一會，再開始設計。你想知道為什麼身體八成是微生菌群嗎？',
      en: 'I like staying for a while with microbes, plants, and bodies before designing. Want to know why so much of the body is microbial life?',
      id: 'Aku suka tinggal sejenak bersama mikroba, tanaman, dan tubuh sebelum merancang. Mau tahu mengapa begitu banyak tubuh adalah kehidupan mikroba?',
      de: 'Ich bleibe gern erst bei Mikroben, Pflanzen und Körpern, bevor ich entwerfe. Willst du wissen, warum so viel Körper mikrobielles Leben ist?',
      ja: 'デザインの前に、微生物、植物、身体としばらく一緒にいるのが好きです。身体の多くが微生物の生命だと知りたいですか？',
      th: 'ฉันชอบอยู่กับจุลินทรีย์ พืช และร่างกายสักพักก่อนออกแบบ อยากรู้ไหมว่าสถาปัตยกรรมที่มนุษย์อยู่ร่วมกับสปีชีส์อื่นคืออะไร?',
    },
    questions: {
      'zh-TW': ['什麼是人跟其他物種共同居住的建築？', '和植物一起設計是什麼意思？', '生態節奏如何改變穿戴式科技？'],
      en: ['What is architecture where humans live together with other species?', 'What does designing with plants mean?', 'How do ecological rhythms change wearable technology?'],
      id: ['Apa itu arsitektur tempat manusia hidup bersama spesies lain?', 'Apa arti merancang bersama tanaman?', 'Bagaimana ritme ekologis mengubah teknologi pakai?'],
      de: ['Was ist Architektur, in der Menschen mit anderen Arten zusammenleben?', 'Was bedeutet Entwerfen mit Pflanzen?', 'Wie verändern ökologische Rhythmen tragbare Technologie?'],
      ja: ['人間が他の種と共に暮らす建築とは何ですか？', '植物と一緒にデザインするとは何ですか？', '生態的リズムはウェアラブル技術をどう変えますか？'],
      th: ['สถาปัตยกรรมที่มนุษย์อยู่ร่วมกับสปีชีส์อื่นคืออะไร?', 'การออกแบบร่วมกับพืชหมายถึงอะไร?', 'จังหวะนิเวศเปลี่ยนเทคโนโลยีสวมใส่อย่างไร?'],
    },
  },
  'ted-hung': {
    opener: {
      'zh-TW': '我會先看人與人之間有沒有信任，再看實驗室之間有沒有連線。你想知道社群會員制度怎麼不只是名單嗎？',
      en: 'I look for trust between people before I look for links between labs. Want to know how membership can be more than a list?',
      id: 'Aku melihat kepercayaan antarorang sebelum melihat tautan antarlab. Mau tahu keanggotaan bisa lebih dari daftar nama?',
      de: 'Ich suche zuerst Vertrauen zwischen Menschen, dann Verbindungen zwischen Laboren. Willst du wissen, wie Mitgliedschaft mehr als eine Liste sein kann?',
      ja: 'ラボ同士の接続より先に、人と人の信頼を見ます。メンバーシップが名簿以上のものになる方法を知りたいですか？',
      th: 'ฉันมองหาความไว้วางใจระหว่างคนก่อนความเชื่อมโยงระหว่างแล็บ อยากรู้ไหมว่าสมาชิกภาพเป็นได้มากกว่ารายชื่อ?',
    },
    questions: {
      'zh-TW': ['為什麼人跟人的連結比實驗室連線重要？', 'Fablab Taipei 可以怎麼用透明帳本幫會員和小社群互相信任？', 'Fablab 的會員制度可以怎麼支持而不是控制社群？'],
      en: ['Why are person-to-person links more important than lab-to-lab links?', 'How can Fablab Taipei use transparent ledgers to help members and small communities trust each other?', 'How can FabLab membership support a community instead of controlling it?'],
      id: ['Mengapa hubungan antarorang lebih penting daripada koneksi antarlab?', 'Bagaimana Fablab Taipei memakai buku besar transparan agar anggota dan komunitas kecil saling percaya?', 'Bagaimana keanggotaan FabLab mendukung komunitas, bukan mengontrolnya?'],
      de: ['Warum sind Verbindungen zwischen Menschen wichtiger als Laborverbindungen?', 'Wie kann Fablab Taipei transparente Bücher nutzen, damit Mitglieder und kleine Communities einander vertrauen?', 'Wie kann FabLab-Mitgliedschaft eine Community stützen statt kontrollieren?'],
      ja: ['なぜ人と人のつながりはラボ同士の接続より重要ですか？', 'Fablab Taipei は透明な台帳でメンバーと小さなコミュニティの信頼をどう助けられますか？', 'FabLab のメンバーシップはコミュニティを支配せずどう支えますか？'],
      th: ['ทำไมความสัมพันธ์ระหว่างคนจึงสำคัญกว่าการเชื่อมแล็บ?', 'Fablab Taipei ใช้บัญชีโปร่งใสช่วยให้สมาชิกและชุมชนเล็ก ๆ ไว้ใจกันได้อย่างไร?', 'สมาชิกภาพของ FabLab สนับสนุนชุมชนแทนการควบคุมได้อย่างไร?'],
    },
  },
  'tincuta-heinzel': {
    opener: {
      'zh-TW': '我喜歡把失敗、嘗試和地方回應收集起來，不急著做成成功故事。你想知道營隊怎麼變成策展工具嗎？',
      en: 'I collect failures, trials, and local responses without rushing them into success stories. Want to know how a camp becomes a curatorial tool?',
      id: 'Aku mengumpulkan kegagalan, percobaan, dan respons lokal tanpa buru-buru menjadikannya kisah sukses. Mau tahu kamp menjadi alat kuratorial?',
      de: 'Ich sammle Scheitern, Versuche und lokale Antworten, ohne sie schnell zu Erfolgsgeschichten zu machen. Willst du wissen, wie ein Camp zum kuratorischen Werkzeug wird?',
      ja: '失敗、試行、地域の応答を、成功物語に急がず集めます。キャンプがキュレーションの道具になる方法を知りたいですか？',
      th: 'ฉันเก็บความล้มเหลว การทดลอง และการตอบสนองท้องถิ่น โดยไม่รีบทำให้เป็นเรื่องสำเร็จ อยากรู้ไหมว่าแคมป์กลายเป็นเครื่องมือภัณฑารักษ์อย่างไร?',
    },
    questions: {
      'zh-TW': ['Textiltronics 的 Attempts, Failures, Trials and Errors 為什麼要策展失敗的電子織品？', '營隊什麼時候像策展工具而不是課程？', '地方回應如何改變一個研究問題？'],
      en: ['Why did Textiltronics curate failed e-textile attempts in Attempts, Failures, Trials and Errors?', 'When is a camp more like a curatorial tool than a class?', 'How can local responses change a research question?'],
      id: ['Mengapa Textiltronics mengkurasi percobaan e-textile yang gagal dalam Attempts, Failures, Trials and Errors?', 'Kapan kamp lebih mirip alat kuratorial daripada kelas?', 'Bagaimana respons lokal mengubah pertanyaan riset?'],
      de: ['Warum kuratierte Textiltronics gescheiterte E-Textile-Versuche in Attempts, Failures, Trials and Errors?', 'Wann ist ein Camp eher kuratorisches Werkzeug als Unterricht?', 'Wie verändern lokale Antworten eine Forschungsfrage?'],
      ja: ['Textiltronics はなぜ Attempts, Failures, Trials and Errors で失敗した電子テキスタイルをキュレーションしたのですか？', 'キャンプはいつ授業ではなくキュレーションの道具になりますか？', '地域の応答は研究の問いをどう変えますか？'],
      th: ['ทำไม Textiltronics จึงภัณฑารักษ์ความล้มเหลวของ e-textile ใน Attempts, Failures, Trials and Errors?', 'แคมป์เป็นเครื่องมือภัณฑารักษ์มากกว่าชั้นเรียนเมื่อไร?', 'การตอบสนองท้องถิ่นเปลี่ยนคำถามวิจัยอย่างไร?'],
    },
  },
  'wukir-suryadi': {
    opener: {
      'zh-TW': '我喜歡把竹子、弦、身體和電聲做成新的樂器。你想知道奇怪樂器怎麼帶出新的表演方式嗎？',
      en: 'I like turning bamboo, strings, bodies, and electronics into new instruments. Want to know how strange instruments create new performance forms?',
      id: 'Aku suka mengubah bambu, dawai, tubuh, dan elektronik menjadi instrumen baru. Mau tahu alat aneh melahirkan bentuk pertunjukan baru?',
      de: 'Ich mache gern aus Bambus, Saiten, Körpern und Elektronik neue Instrumente. Willst du wissen, wie seltsame Instrumente neue Aufführungsformen erzeugen?',
      ja: '竹、弦、身体、電子音を新しい楽器にするのが好きです。変な楽器が新しい上演形式を生む様子を知りたいですか？',
      th: 'ฉันชอบเปลี่ยนไม้ไผ่ สาย ร่างกาย และอิเล็กทรอนิกส์ให้เป็นเครื่องดนตรีใหม่ อยากรู้ไหมว่าเครื่องดนตรีประหลาดสร้างรูปแบบการแสดงใหม่อย่างไร?',
    },
    questions: {
      'zh-TW': ['Wukir 的竹製樂器如何改變表演者的身體？', '竹子和電子聲音可以怎麼合作？', '你喜歡用身體做表演嗎？還有哪些奇怪表演形式？'],
      en: ['How do Wukir’s bamboo instruments change the performer’s body?', 'How can bamboo and electronic sound work together?', 'Do you like performing with the body? What strange performance forms exist?'],
      id: ['Bagaimana instrumen bambu Wukir mengubah tubuh pemain?', 'Bagaimana bambu dan suara elektronik bekerja bersama?', 'Suka tampil dengan tubuh? Bentuk pertunjukan aneh apa yang ada?'],
      de: ['Wie verändern Wukirs Bambusinstrumente den Körper der Performenden?', 'Wie können Bambus und elektronischer Klang zusammenarbeiten?', 'Magst du Performance mit dem Körper? Welche seltsamen Formen gibt es?'],
      ja: ['Wukir の竹の楽器は演奏者の身体をどう変えますか？', '竹と電子音はどう協働できますか？', '身体でパフォーマンスするのは好きですか？どんな変な上演形式がありますか？'],
      th: ['เครื่องดนตรีไม้ไผ่ของ Wukir เปลี่ยนร่างกายนักแสดงอย่างไร?', 'ไม้ไผ่กับเสียงอิเล็กทรอนิกส์ทำงานร่วมกันได้อย่างไร?', 'ชอบใช้ร่างกายแสดงไหม? มีรูปแบบการแสดงประหลาดอะไรบ้าง?'],
    },
  },
};


function communityQuestionSeed(language: LanguageCode, persona: Persona): string[] {
  const communityHint = cleanQuestionPart(Object.values(persona.responses).join(' '), 44);
  if (language === 'ja') {
    return [
      `${persona.name} のコミュニティ経験から、桃花源の初心者はどの材料・方法・組織の問いから始めるとよいですか？`,
      `${persona.name} は自分たちの実践を NGM、Hackteria、SGMK、KOBAKANT の公開資料とどうつなげますか？`,
      `${persona.name} のコミュニティを小誌の問いで紹介するなら、どの道具・キャンプ・ケアの方法を比較しますか？`,
      communityHint ? `${persona.name} が触れた「${communityHint}」は、どんな検証可能な桃花源の問いになりますか？` : `${persona.name} のコミュニティ記憶は、どんな検証可能な桃花源の問いになりますか？`,
    ];
  }
  if (language === 'zh-TW') {
    return [
      `從 ${persona.name} 的社群經驗出發，桃花源新手可以先問哪個材料、方法或組織問題？`,
      `${persona.name} 會怎麼把自己的社群實作連到 NGM、Hackteria、SGMK 或 KOBAKANT 的公開資料？`,
      `如果只用一個小誌問題介紹 ${persona.name} 關心的社群，應該比較哪個工具、營隊或照護方法？`,
      communityHint ? `${persona.name} 提到的「${communityHint}」可以變成什麼可查證的桃花源社群問題？` : `${persona.name} 的社群記憶可以怎麼變成一個可查證的桃花源問題？`,
    ];
  }
  return [
    `From ${persona.name}'s community experience, what material, method, or organization question should a Peach Blossom Spring beginner ask first?`,
    `How would ${persona.name} connect their own community practice to NGM, Hackteria, SGMK, or KOBAKANT public sources?`,
    `If one zine question introduced ${persona.name}'s community, which tool, camp, or care method should it compare?`,
    communityHint ? `How can “${communityHint}” become a checkable Peach Blossom Spring community question for ${persona.name}?` : `How can ${persona.name}'s community memory become a checkable Peach Blossom Spring question?`,
  ];
}

function makeSuggestedQuestions(language: LanguageCode, persona: Persona, _transcript = ''): string[] {
  const guided = npcGuideProfiles[persona.id]?.questions[language];
  if (guided?.length) return guided;
  const fixed = personaQuestionSeeds[persona.id] ?? [];
  const responseEntries = Object.entries(persona.responses).slice(0, 9);
  const sourceBridgeQuestions = [
    `${persona.name} 的社群實作如何連到 Hackteria、SGMK 或 How To Get What You Want 的公開文件？`,
    `${persona.name} 會怎麼把工作坊、材料或照護經驗整理成一份可查證小誌？`,
    `從 ${persona.name} 的觀點看，哪些公開 source 最適合回答「社群如何保存知識」？`,
    `${persona.name} 的實作和 Hackteria 的 workshop / open hardware 文件有什麼可比較之處？`,
    `${persona.name} 的社群方法可以如何連到 SGMK 的 sound、DIY electronics 或 handmade tool 頁面？`,
    `${persona.name} 和 KOBAKANT / HTG WYWant 的 documentation 方法有什麼共同問題？`,
  ];
  if (language === 'zh-TW') {
    const responseQuestions = responseEntries.map(([, response]) => `從 ${persona.name} 的社群經驗看，「${cleanQuestionPart(response, 48)}」如何連到公開 wiki sources 的可檢查材料？`);
    return shuffleCopy([...fixed, ...communityQuestionSeed(language, persona), ...sourceBridgeQuestions, ...responseQuestions]).slice(0, 9);
  }

  const templates: Record<LanguageCode, (response: string) => string> = {
    'zh-TW': (response) => `從 ${persona.name} 的社群經驗看，「${cleanQuestionPart(response, 50)}」跟他的實作有什麼關係？`,
    en: (response) => `From ${persona.name}'s community practice, how does “${cleanQuestionPart(response, 50)}” connect to materials, methods, or care?`,
    id: (response) => `Dari praktik komunitas ${persona.name}, bagaimana “${cleanQuestionPart(response, 50)}” terhubung dengan bahan, metode, atau perawatan?`,
    de: (response) => `Wie verbindet sich „${cleanQuestionPart(response, 50)}“ aus ${persona.name}s Community-Praxis mit Material, Methode oder Sorgearbeit?`,
    ja: (response) => `${persona.name} のコミュニティ実践から見ると、「${cleanQuestionPart(response, 50)}」は材料・方法・ケアとどうつながりますか？`,
    th: (response) => `จากการปฏิบัติของชุมชน ${persona.name} “${cleanQuestionPart(response, 50)}” เชื่อมกับวัสดุ วิธีการ หรือการดูแลอย่างไร?`,
  };
  const generated = responseEntries.map(([, response]) => templates[language](response));
  const englishSourceBridge = [
    `How does ${persona.name}'s community practice connect to Hackteria, SGMK, or How To Get What You Want source pages?`,
    `Which source pages would help turn ${persona.name}'s workshop memory into a checkable zine?`,
    `How would ${persona.name} compare their community methods with public workshop documentation?`,
    `What material, tool, or care practice from the three sources best matches ${persona.name}'s concerns?`,
    `How can ${persona.name}'s community experience become a makeable, checkable, teachable zine question?`,
    `Which Hackteria, SGMK, or KOBAKANT pages would ${persona.name} probably argue with first?`,
  ];
  return shuffleCopy([...communityQuestionSeed(language, persona), ...generated, ...englishSourceBridge]).slice(0, 9);
}


function sourceLinksLabel(language: LanguageCode): string {
  const copy: Record<LanguageCode, string> = {
    'zh-TW': '相關連結',
    en: 'Source links',
    id: 'Tautan sumber',
    de: 'Quellenlinks',
    ja: '関連リンク',
    th: 'ลิงก์แหล่งที่มา',
  };
  return copy[language];
}

function zineLabel(language: LanguageCode): string {
  const copy: Record<LanguageCode, string> = {
    'zh-TW': 'Wiki 小誌',
    en: 'Wiki zine',
    id: 'Zine wiki',
    de: 'Wiki-Zine',
    ja: 'Wiki 小誌',
    th: 'ซีน wiki',
  };
  return copy[language];
}

function buildPersonaTranscriptAnswer(language: LanguageCode, persona: Persona, topic: string, transcriptEvidence: ChatEvidence[]): string {
  const response = persona.responses[topic] || persona.intro;
  const snippets = transcriptEvidence
    .slice(0, 2)
    .map((item) => cleanQuestionPart(item.text, 92))
    .filter(Boolean);
  const evidenceJoined = snippets.map((snippet, index) => `(${index + 1}) ${snippet}`).join(language === 'zh-TW' || language === 'ja' ? '；' : '; ');
  const evidenceCopy: Record<LanguageCode, string> = {
    'zh-TW': snippets.length ? `\n\n我記得訪談裡還有兩個線索：${evidenceJoined}` : '',
    en: snippets.length ? `\n\nI also remember these interview traces: ${evidenceJoined}` : '',
    id: snippets.length ? `\n\nSaya juga mengingat jejak wawancara ini: ${evidenceJoined}` : '',
    de: snippets.length ? `\n\nIch erinnere außerdem diese Interviewspuren: ${evidenceJoined}` : '',
    ja: snippets.length ? `\n\nインタビューには、さらにこの手がかりがあります：${evidenceJoined}` : '',
    th: snippets.length ? `\n\nฉันยังจำร่องรอยจากบทสัมภาษณ์เหล่านี้ได้: ${evidenceJoined}` : '',
  };
  const localizedLead: Record<LanguageCode, string> = {
    'zh-TW': snippets.length
      ? `我先不把這題丟給搜尋鬼。對我來說，重點會落在可觸摸、可重做、也不把人累壞的小尺度實作。`
      : `我先把問題縮小到一個能活下來的尺度：先做一個可重做的小版本，再看誰願意一起修、一起分享。`,
    en: response,
    id: `Saya akan mengecilkannya dulu menjadi praktik yang bisa disentuh, diulang, dan tidak menghabiskan orang-orangnya.`,
    de: `Ich würde es zuerst auf eine berührbare, wiederholbare Praxis verkleinern, die die Beteiligten nicht ausbrennt.`,
    ja: `まず、触れられて、作り直せて、人を燃え尽きさせない小さな実践に縮めて考えます。`,
    th: `ฉันจะย่อมันให้เป็นการทดลองเล็ก ๆ ที่จับต้องได้ ทำซ้ำได้ และไม่ทำให้คนทำงานหมดแรงก่อน`,
  };
  return `${localizedLead[language]}${evidenceCopy[language]}`;
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


function makeIntroMessage(persona: Persona, language: LanguageCode): string {
  const guided = npcGuideProfiles[persona.id]?.opener[language];
  if (guided) return guided;
  const questions = makeSuggestedQuestions(language, persona).slice(0, 2).join(' ');
  const fallback: Record<LanguageCode, string> = {
    'zh-TW': `我會從工作坊、材料和社群照護開始回答。${questions}`,
    en: `I can start from workshops, materials, and community care. ${questions}`,
    id: `Aku bisa mulai dari lokakarya, bahan, dan perawatan komunitas. ${questions}`,
    de: `Ich kann mit Workshops, Materialien und Community-Care anfangen. ${questions}`,
    ja: `ワークショップ、材料、コミュニティのケアから答えられます。${questions}`,
    th: `ฉันเริ่มตอบได้จากเวิร์กช็อป วัสดุ และการดูแลชุมชน ${questions}`,
  };
  return fallback[language];
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
  const fixedQuestions = useMemo(() => makeSuggestedQuestions(language, persona, `${loadedKnowledge?.transcript_zh ?? ""}
${loadedKnowledge?.transcript_en ?? ""}`), [language, loadedKnowledge, persona]);

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
    const dialogueHistory = recentDialogueHistory(messages);
    setMessages((prev) => [...prev, { speaker: player.name, text: trimmed }]);
    try {
      const topic = resolveTopic(trimmed);
      onSimEvent?.(trimmed, topic);
      const dialogueKnowledge = loadedKnowledge ?? (await loadKnowledgeBase(persona));
      if (!loadedKnowledge) setLoadedKnowledge(dialogueKnowledge);
      const transcriptCandidates = buildTranscriptEvidenceChunks(
        `${dialogueKnowledge.transcript_zh}\n${dialogueKnowledge.transcript_en}`,
        dialogueKnowledge.id,
        dialogueKnowledge.name,
      );
      const transcriptEvidence = rankEvidence(`${trimmed}
${topic}`, transcriptCandidates, 4);
      const npcEvidence = retrieveNpcEvidence({
        message: trimmed,
        retrievalContext: topic,
        knowledge: dialogueKnowledge,
      });
      const mergedEvidence = [...npcEvidence, ...transcriptEvidence]
        .filter((item, index, array) => array.findIndex((other) => other.id === item.id) === index)
        .slice(0, 6);
      const transcript = mergedEvidence.map((item) => `${item.label}
${item.text}`).join('\n\n');
      const links = searchWikiPages(trimmed, persona.id, 8);
      if (canUseLocalMemoryServer()) {
        const answer = await askNpc({
          question: trimmed,
          npcName: persona.name,
          persona: { id: persona.id, name: persona.name, role: persona.role, intro: persona.intro, responses: persona.responses },
          transcript,
          preferredLanguage: language,
          dialogueHistory,
        });
        const resolvedLinks = answer.links.length ? answer.links : searchWikiPagesWithHints(trimmed, answer.answer, persona.id, 8);
        setMessages((prev) => [...prev, { speaker: persona.name, text: answer.answer, evidence: answer.evidence, links: resolvedLinks }]);
      } else {
        try {
          const answer = await askDeepSeekPersonaWithEvidence({
            playerName: player.name,
            question: trimmed,
            knowledge: dialogueKnowledge,
            preferredLanguage: language,
            evidence: mergedEvidence,
            dialogueHistory,
          });
          setMessages((prev) => [...prev, { speaker: persona.name, text: answer, evidence: mergedEvidence, links: links.length ? links : searchWikiPagesWithHints(trimmed, answer, persona.id, 8) }]);
        } catch (deepseekError) {
          console.warn('NPC DeepSeek answer failed; using transcript fallback.', deepseekError);
          const fallbackText = buildPersonaTranscriptAnswer(language, persona, topic, transcriptEvidence);
          setMessages((prev) => [...prev, { speaker: persona.name, text: fallbackText, links: links.length ? links : searchWikiPagesWithHints(trimmed, fallbackText, persona.id, 8) }]);
        }
      }
    } catch (err) {
      setError(err instanceof Error && canUseLocalMemoryServer() ? err.message : t(language, 'dialogue.requestFailed'));
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
                {message.links && message.links.length > 0 && (
                  <details className="rpg-dialogue-source-links" aria-label={sourceLinksLabel(language)}>
                    <summary>{sourceLinksLabel(language)} ({message.links.length})</summary>
                    <div className="rpg-dialogue-source-link-list">
                      {message.links.map((link, linkIndex) => (
                        <a key={`${link.url}-${linkIndex.toString()}`} href={link.url} target="_blank" rel="noreferrer">
                          <span>[{linkIndex + 1}] {link.title}</span>
                          <em>{link.sourceFamily}</em>
                        </a>
                      ))}
                    </div>
                  </details>
                )}
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

        <form onSubmit={(event) => void handleSubmit(event)} className="rpg-dialogue-form flex gap-4" data-ui-footer="zine" autoComplete="off">
          <input
            type="text"
            className="rpg-dialogue-input flex-1 bg-bg border-2 border-border px-7 py-6 text-xl text-text outline-none focus:border-accent-bright"
            data-ui-part="field"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            name={`pbs-dialogue-${persona.id}`}
            inputMode="text"
            enterKeyHint="send"
            autoComplete="new-password"
            aria-autocomplete="none"
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
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
              aria-label={zineLabel(language)}
              title={zineLabel(language)}
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
