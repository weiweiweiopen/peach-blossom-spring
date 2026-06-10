import { useEffect, useMemo, useRef, useState } from 'react';

import type { KnowledgeBase } from '../deepseekClient.js';
import { askDeepSeekPersonaWithEvidence, loadKnowledgeBase } from '../deepseekClient.js';
import { type LanguageCode, t } from '../i18n.js';
import { askNpc, canUseLocalMemoryServer, type DialogueHistoryTurn } from '../localMemoryApi.js';
import { buildTranscriptEvidenceChunks, retrieveNpcEvidence, type ChatEvidence, rankEvidence } from '../localChatbot.js';
import { getCharacterSprites } from '../office/sprites/spriteData.js';
import { Direction, type SpriteData } from '../office/types.js';
import { publicCamperName, sanitizeNpcTextForUi, sanitizeRealPersonReferences } from '../privacy.js';
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
    'campers 的訪談裡，什麼樣的在地關係比實驗室設備更能讓技術留下來？',
  ],
  'marc-dusseiller': [
    'campers 說的 Hackteria 精神裡，為什麼便宜、可拆、好笑會比正式實驗室更重要？',
    '在 campers 的工作坊經驗裡，失敗、料理、焊接和友誼怎麼一起變成教學方法？',
    '如果一個 science-art box 不能被打開、污染、重做，campers 會怎麼批評它？',
  ],
  'tincuta-heinzel': [
    '什麼是 ATTEMPTS, FAILURES, TRIALS AND ERRORS？',
    'campers 如何把失敗、策展與在地回應轉成可以被保存的研究問題？',
    '從 campers 的訪談看，營隊什麼時候比較像策展工具，而不是教學活動？',
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
      'zh-TW': ['可以告訴我你是一個什麼樣的藝術家嗎？', '你怎麼把太陽能、雷射、旅行和寓言放進同一個藝術實踐？', '如果我是第一次認識你的作品，應該先看什麼？'],
      'en': ['Can you tell me what kind of artist you are?', 'What did you mainly talk about in your NGM interview?', 'If I am new to your work, what should I look at first?'],
      'id': ['Bisa ceritakan kamu seniman seperti apa?', 'Apa hal utama yang kamu bicarakan dalam wawancara NGM?', 'Kalau saya baru mengenal karyamu, sebaiknya mulai dari apa?'],
      'de': ['Kannst du mir erzählen, was für eine Künstlerin du bist?', 'Worüber hast du im NGM-Interview hauptsächlich gesprochen?', 'Wenn ich deine Arbeit zum ersten Mal kennenlerne, womit sollte ich anfangen?'],
      'ja': ['あなたはどんなアーティストなのか教えてくれますか？', 'NGM のインタビューでは主に何を話しましたか？', '初めてあなたの作品を知るなら、何から見るとよいですか？'],
      'th': ['ช่วยเล่าได้ไหมว่าคุณเป็นศิลปินแบบไหน?', 'ในบทสัมภาษณ์ NGM คุณพูดถึงเรื่องอะไรเป็นหลัก?', 'ถ้าฉันเพิ่งรู้จักงานของคุณ ควรเริ่มดูจากอะไร?'],
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
      'zh-TW': ['可以告訴我 Lifepatch 是一個什麼樣的團體嗎？', '你怎麼把開放科學做進鄰里和日常生活裡？', '如果新手想理解你的社群實驗室，應該先問什麼？'],
      'en': ['Can you tell me what kind of group Lifepatch is?', 'How did you talk about open science and everyday life in your NGM interview?', 'If a beginner wants to understand your community lab, what should they ask first?'],
      'id': ['Bisa ceritakan Lifepatch itu kelompok seperti apa?', 'Bagaimana kamu membahas sains terbuka dan kehidupan sehari-hari dalam wawancara NGM?', 'Kalau pemula ingin memahami lab komunitasmu, pertanyaan apa yang sebaiknya diajukan dulu?'],
      'de': ['Kannst du mir erzählen, was für eine Gruppe Lifepatch ist?', 'Wie hast du im NGM-Interview über offene Wissenschaft und Alltag gesprochen?', 'Wenn Anfänger dein Community-Labor verstehen wollen, was sollten sie zuerst fragen?'],
      'ja': ['Lifepatch はどんな団体なのか教えてくれますか？', 'NGM のインタビューでオープンサイエンスと日常生活をどう話しましたか？', '初心者があなたのコミュニティ・ラボを理解したいなら、まず何を聞くとよいですか？'],
      'th': ['ช่วยเล่าได้ไหมว่า Lifepatch เป็นกลุ่มแบบไหน?', 'ในบทสัมภาษณ์ NGM คุณพูดถึงวิทยาศาสตร์เปิดกับชีวิตประจำวันอย่างไร?', 'ถ้ามือใหม่อยากเข้าใจแล็บชุมชนของคุณ ควรถามอะไรก่อน?'],
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
      'zh-TW': ['可以告訴我 Fabricademy 是一個什麼樣的學習網絡嗎？', '你怎麼把分散式教育做成一個學習網絡？', '如果我第一次接觸 Fabricademy，應該先理解哪個核心想法？'],
      'en': ['Can you tell me what kind of learning network Fabricademy is?', 'How did you talk about distributed education in your NGM interview?', 'If I am new to Fabricademy, what core idea should I understand first?'],
      'id': ['Bisa ceritakan Fabricademy itu jaringan belajar seperti apa?', 'Bagaimana kamu membahas pendidikan terdistribusi dalam wawancara NGM?', 'Kalau saya baru mengenal Fabricademy, gagasan inti apa yang perlu dipahami dulu?'],
      'de': ['Kannst du mir erzählen, was für ein Lernnetzwerk Fabricademy ist?', 'Wie hast du im NGM-Interview über verteilte Bildung gesprochen?', 'Wenn ich Fabricademy neu kennenlerne, welche Kernidee sollte ich zuerst verstehen?'],
      'ja': ['Fabricademy はどんな学習ネットワークなのか教えてくれますか？', 'NGM のインタビューで分散型教育をどう話しましたか？', '初めて Fabricademy に触れるなら、まずどの中心的な考えを理解するとよいですか？'],
      'th': ['ช่วยเล่าได้ไหมว่า Fabricademy เป็นเครือข่ายการเรียนรู้แบบไหน?', 'ในบทสัมภาษณ์ NGM คุณพูดถึงการศึกษากระจายศูนย์อย่างไร?', 'ถ้าฉันเพิ่งรู้จัก Fabricademy ควรเข้าใจแนวคิดหลักอะไรเป็นอย่างแรก?'],
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
      'zh-TW': ['可以告訴我你關心的是什麼樣的開放實驗室文化嗎？', '你怎麼把維修、規則和社群照護連成開放實驗室文化？', '如果新手想加入開放實驗室，最容易忽略什麼？'],
      'en': ['Can you tell me what kind of open-lab culture you care about?', 'How did you talk about repair, rules, and community care in your NGM interview?', 'If a beginner wants to join an open lab, what do they most often miss?'],
      'id': ['Bisa ceritakan budaya open lab seperti apa yang kamu pedulikan?', 'Bagaimana kamu membahas perbaikan, aturan, dan perawatan komunitas dalam wawancara NGM?', 'Kalau pemula ingin ikut open lab, apa yang sering terlewat?'],
      'de': ['Kannst du mir erzählen, welche Open-Lab-Kultur dir wichtig ist?', 'Wie hast du im NGM-Interview über Reparatur, Regeln und Community-Care gesprochen?', 'Wenn Anfänger in ein offenes Labor kommen, was übersehen sie oft?'],
      'ja': ['あなたが大事にしているオープンラボ文化はどんなものですか？', 'NGM のインタビューで修理、ルール、コミュニティのケアをどう話しましたか？', '初心者がオープンラボに参加するとき、何を見落としがちですか？'],
      'th': ['ช่วยเล่าได้ไหมว่าวัฒนธรรม open lab แบบไหนที่คุณให้ความสำคัญ?', 'ในบทสัมภาษณ์ NGM คุณพูดถึงการซ่อม กฎ และการดูแลชุมชนอย่างไร?', 'ถ้ามือใหม่อยากเข้าร่วม open lab มักมองข้ามอะไร?'],
    },
  },
  'giulia-tomasello': {
    opener: {
      'zh-TW': '我把感測器放到身體附近時，第一個問題永遠是同意和照護。你想知道身體附近的感測技術為什麼不只是酷裝置嗎？',
      en: 'When I put sensors near bodies, the first questions are consent and care. Want to know why body-adjacent sensing is more than a cool device?',
      id: 'Saat sensor dekat tubuh, pertanyaan pertama adalah persetujuan dan perawatan. Mau tahu mengapa teknologi sensor dekat tubuh lebih dari perangkat keren?',
      de: 'Wenn Sensoren nah an Körper kommen, frage ich zuerst nach Zustimmung und Care. Willst du wissen, warum körpernahe Sensortechnik mehr ist als ein cooles Gerät?',
      ja: 'センサーを身体の近くに置く時、最初の問いは同意とケアです。身体に近いセンシング技術が格好いい装置以上のものだと知りたいですか？',
      th: 'เมื่อวางเซนเซอร์ใกล้ร่างกาย คำถามแรกคือความยินยอมและการดูแล อยากรู้ไหมว่าเทคโนโลยีเซนเซอร์ใกล้ร่างกายไม่ใช่แค่อุปกรณ์เท่ ๆ?',
    },
    questions: {
      'zh-TW': ['可以告訴我你做的是什麼樣的女性主義科技實踐嗎？', '你怎麼把身體、資料和照護放進女性主義科技工作坊？', '如果我第一次參加你的工作坊，應該帶著什麼問題來？'],
      'en': ['Can you tell me what kind of feminist technology practice you do?', 'How did you talk about bodies, data, and care in your NGM interview?', 'If I join your workshop for the first time, what question should I bring?'],
      'id': ['Bisa ceritakan praktik teknologi feminis seperti apa yang kamu lakukan?', 'Bagaimana kamu membahas tubuh, data, dan perawatan dalam wawancara NGM?', 'Kalau saya pertama kali ikut workshopmu, pertanyaan apa yang sebaiknya saya bawa?'],
      'de': ['Kannst du mir erzählen, welche feministische Technologiepraxis du machst?', 'Wie hast du im NGM-Interview über Körper, Daten und Care gesprochen?', 'Wenn ich zum ersten Mal an deinem Workshop teilnehme, welche Frage sollte ich mitbringen?'],
      'ja': ['あなたのフェミニスト・テクノロジー実践はどんなものですか？', 'NGM のインタビューで身体、データ、ケアをどう話しましたか？', '初めてあなたのワークショップに参加するなら、どんな問いを持っていくとよいですか？'],
      'th': ['ช่วยเล่าได้ไหมว่าคุณทำ feminist technology แบบไหน?', 'ในบทสัมภาษณ์ NGM คุณพูดถึงร่างกาย ข้อมูล และการดูแลอย่างไร?', 'ถ้าฉันเข้าร่วมเวิร์กช็อปของคุณครั้งแรก ควรพกคำถามอะไรไป?'],
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
      'zh-TW': ['可以告訴我 Open Source Beehives 是一個什麼樣的計畫嗎？', '你怎麼把蜜蜂、農地和開源硬體放在同一個計畫裡？', '如果我第一次認識 Green Fab Lab，應該先理解什麼？'],
      'en': ['Can you tell me what kind of project Open Source Beehives is?', 'How did you talk about bees, farmland, and open hardware in your NGM interview?', 'If I am new to the Green Fab Lab, what should I understand first?'],
      'id': ['Bisa ceritakan Open Source Beehives itu proyek seperti apa?', 'Bagaimana kamu membahas lebah, lahan pertanian, dan open hardware dalam wawancara NGM?', 'Kalau saya baru mengenal Green Fab Lab, apa yang perlu dipahami dulu?'],
      'de': ['Kannst du mir erzählen, was für ein Projekt Open Source Beehives ist?', 'Wie hast du im NGM-Interview über Bienen, Landwirtschaft und Open Hardware gesprochen?', 'Wenn ich das Green Fab Lab neu kennenlerne, was sollte ich zuerst verstehen?'],
      'ja': ['Open Source Beehives はどんなプロジェクトなのか教えてくれますか？', 'NGM のインタビューで蜂、農地、オープンハードウェアをどう話しましたか？', '初めて Green Fab Lab を知るなら、まず何を理解するとよいですか？'],
      'th': ['ช่วยเล่าได้ไหมว่า Open Source Beehives เป็นโครงการแบบไหน?', 'ในบทสัมภาษณ์ NGM คุณพูดถึงผึ้ง พื้นที่เกษตร และ open hardware อย่างไร?', 'ถ้าฉันเพิ่งรู้จัก Green Fab Lab ควรเข้าใจอะไรก่อน?'],
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
      'zh-TW': ['可以告訴我 Hackteria 是一個什麼樣的團體嗎？', '你怎麼把 DIY biology、bioart 和工作坊做成 Hackteria 的社群方法？', '如果新手想加入 Hackteria，應該先知道什麼？'],
      'en': ['Can you tell me what kind of group Hackteria is?', 'How did you talk about DIY biology, bioart, and workshops in your NGM interview?', 'If a beginner wants to join Hackteria, what should they know first?'],
      'id': ['Bisa ceritakan Hackteria itu kelompok seperti apa?', 'Bagaimana kamu membahas DIY biology, bioart, dan workshop dalam wawancara NGM?', 'Kalau pemula ingin ikut Hackteria, apa yang perlu diketahui dulu?'],
      'de': ['Kannst du mir erzählen, was für eine Gruppe Hackteria ist?', 'Wie hast du im NGM-Interview über DIY Biology, Bioart und Workshops gesprochen?', 'Wenn Anfänger bei Hackteria mitmachen wollen, was sollten sie zuerst wissen?'],
      'ja': ['Hackteria はどんな団体なのか教えてくれますか？', 'NGM のインタビューで DIY biology、bioart、ワークショップをどう話しましたか？', '初心者が Hackteria に参加したいなら、まず何を知るとよいですか？'],
      'th': ['ช่วยเล่าได้ไหมว่า Hackteria เป็นกลุ่มแบบไหน?', 'ในบทสัมภาษณ์ NGM คุณพูดถึง DIY biology, bioart และเวิร์กช็อปอย่างไร?', 'ถ้ามือใหม่อยากเข้าร่วม Hackteria ควรรู้อะไรก่อน?'],
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
      'zh-TW': ['可以告訴我你的聲音實踐是什麼樣的嗎？', '你怎麼把身體、聲音和社群變成一種表演方法？', '如果新手想理解你的表演方法，應該先聽什麼？'],
      'en': ['Can you tell me what your vocal practice is like?', 'How did you talk about body, voice, and community in your NGM interview?', 'If a beginner wants to understand your performance method, what should they listen for first?'],
      'id': ['Bisa ceritakan praktik vokalmu seperti apa?', 'Bagaimana kamu membahas tubuh, suara, dan komunitas dalam wawancara NGM?', 'Kalau pemula ingin memahami metode performansmu, apa yang sebaiknya didengar dulu?'],
      'de': ['Kannst du mir erzählen, wie deine Stimmpraxis aussieht?', 'Wie hast du im NGM-Interview über Körper, Stimme und Community gesprochen?', 'Wenn Anfänger deine Performance-Methode verstehen wollen, worauf sollten sie zuerst hören?'],
      'ja': ['あなたの声の実践はどんなものか教えてくれますか？', 'NGM のインタビューで身体、声、コミュニティをどう話しましたか？', '初心者があなたのパフォーマンス方法を理解したいなら、まず何を聴くとよいですか？'],
      'th': ['ช่วยเล่าได้ไหมว่าการปฏิบัติด้านเสียงของคุณเป็นแบบไหน?', 'ในบทสัมภาษณ์ NGM คุณพูดถึงร่างกาย เสียง และชุมชนอย่างไร?', 'ถ้ามือใหม่อยากเข้าใจวิธีการแสดงของคุณ ควรฟังอะไรเป็นอย่างแรก?'],
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
      'zh-TW': ['可以告訴我 Oki Wonder Lab 是一個什麼樣的地方嗎？', '你怎麼把島嶼、孤立和共同製作變成 Oki Wonder Lab 的方法？', '如果我第一次到你的實驗室，應該先感受什麼？'],
      'en': ['Can you tell me what kind of place Oki Wonder Lab is?', 'How did you talk about islands, isolation, and making together in your NGM interview?', 'If I visit your lab for the first time, what should I notice first?'],
      'id': ['Bisa ceritakan Oki Wonder Lab itu tempat seperti apa?', 'Bagaimana kamu membahas pulau, isolasi, dan membuat bersama dalam wawancara NGM?', 'Kalau saya pertama kali datang ke labmu, apa yang perlu saya rasakan dulu?'],
      'de': ['Kannst du mir erzählen, was für ein Ort Oki Wonder Lab ist?', 'Wie hast du im NGM-Interview über Inseln, Isolation und gemeinsames Machen gesprochen?', 'Wenn ich dein Labor zum ersten Mal besuche, was sollte ich zuerst wahrnehmen?'],
      'ja': ['Oki Wonder Lab はどんな場所なのか教えてくれますか？', 'NGM のインタビューで島、孤立、一緒につくることをどう話しましたか？', '初めてあなたのラボを訪ねるなら、まず何を感じるとよいですか？'],
      'th': ['ช่วยเล่าได้ไหมว่า Oki Wonder Lab เป็นสถานที่แบบไหน?', 'ในบทสัมภาษณ์ NGM คุณพูดถึงเกาะ ความโดดเดี่ยว และการทำร่วมกันอย่างไร?', 'ถ้าฉันไปเยี่ยมแล็บของคุณครั้งแรก ควรสังเกตอะไรก่อน?'],
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
      'zh-TW': ['可以告訴我 Modern Body Festival 是一個什麼樣的活動嗎？', '你怎麼把身體、科技和觀眾變成 Modern Body Festival 的現場方法？', '如果第一次看你的表演或策展，應該注意什麼？'],
      'en': ['Can you tell me what kind of event Modern Body Festival is?', 'How did you talk about body, technology, and audience in your NGM interview?', 'If I encounter your performance or curating for the first time, what should I notice?'],
      'id': ['Bisa ceritakan Modern Body Festival itu acara seperti apa?', 'Bagaimana kamu membahas tubuh, teknologi, dan penonton dalam wawancara NGM?', 'Kalau saya pertama kali melihat performans atau kurasimu, apa yang perlu diperhatikan?'],
      'de': ['Kannst du mir erzählen, was für eine Veranstaltung Modern Body Festival ist?', 'Wie hast du im NGM-Interview über Körper, Technologie und Publikum gesprochen?', 'Wenn ich deine Performance oder kuratorische Arbeit neu kennenlerne, worauf sollte ich achten?'],
      'ja': ['Modern Body Festival はどんなイベントなのか教えてくれますか？', 'NGM のインタビューで身体、テクノロジー、観客をどう話しましたか？', '初めてあなたのパフォーマンスやキュレーションを見るなら、何に注目するとよいですか？'],
      'th': ['ช่วยเล่าได้ไหมว่า Modern Body Festival เป็นงานแบบไหน?', 'ในบทสัมภาษณ์ NGM คุณพูดถึงร่างกาย เทคโนโลยี และผู้ชมอย่างไร?', 'ถ้าฉันเพิ่งพบงานแสดงหรือการคิวเรตของคุณ ควรสังเกตอะไร?'],
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
      'zh-TW': ['可以告訴我 Modern Body Festival 背後是一個什麼樣的社群嗎？', '你怎麼把聲音、表演和組織工作放在同一個社群裡？', '如果新手想理解聲音藝術社群，應該先問什麼？'],
      'en': ['Can you tell me what kind of community is behind Modern Body Festival?', 'How did you talk about sound, performance, and organizing in your NGM interview?', 'If a beginner wants to understand a sound-art community, what should they ask first?'],
      'id': ['Bisa ceritakan komunitas seperti apa yang ada di balik Modern Body Festival?', 'Bagaimana kamu membahas suara, performans, dan kerja organisasi dalam wawancara NGM?', 'Kalau pemula ingin memahami komunitas seni suara, apa yang sebaiknya ditanyakan dulu?'],
      'de': ['Kannst du mir erzählen, was für eine Community hinter Modern Body Festival steht?', 'Wie hast du im NGM-Interview über Klang, Performance und Organisationsarbeit gesprochen?', 'Wenn Anfänger eine Sound-Art-Community verstehen wollen, was sollten sie zuerst fragen?'],
      'ja': ['Modern Body Festival の背後にはどんなコミュニティがありますか？', 'NGM のインタビューで音、パフォーマンス、運営をどう話しましたか？', '初心者がサウンドアートのコミュニティを理解したいなら、まず何を聞くとよいですか？'],
      'th': ['ช่วยเล่าได้ไหมว่าข้างหลัง Modern Body Festival เป็นชุมชนแบบไหน?', 'ในบทสัมภาษณ์ NGM คุณพูดถึงเสียง การแสดง และงานจัดการอย่างไร?', 'ถ้ามือใหม่อยากเข้าใจชุมชน sound art ควรถามอะไรก่อน?'],
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
      'zh-TW': ['可以告訴我你的人與其他物種共同居住實踐是什麼嗎？', '你怎麼把植物、建築和穿戴科技放進多物種共同居住？', '如果我第一次認識你的作品，應該先觀察什麼關係？'],
      'en': ['Can you tell me what your practice of living with other species is about?', 'How did you talk about plants, architecture, and wearables in your NGM interview?', 'If I am new to your work, what relationship should I observe first?'],
      'id': ['Bisa ceritakan praktik hidup bersama spesies lain yang kamu lakukan itu tentang apa?', 'Bagaimana kamu membahas tanaman, arsitektur, dan wearable dalam wawancara NGM?', 'Kalau saya baru mengenal karyamu, relasi apa yang perlu diamati dulu?'],
      'de': ['Kannst du mir erzählen, worum es in deiner Praxis des Zusammenlebens mit anderen Arten geht?', 'Wie hast du im NGM-Interview über Pflanzen, Architektur und Wearables gesprochen?', 'Wenn ich deine Arbeit neu kennenlerne, welche Beziehung sollte ich zuerst beobachten?'],
      'ja': ['他の種と共に住むあなたの実践はどんなものですか？', 'NGM のインタビューで植物、建築、ウェアラブルをどう話しましたか？', '初めてあなたの作品を知るなら、まずどんな関係を観察するとよいですか？'],
      'th': ['ช่วยเล่าได้ไหมว่าการอยู่ร่วมกับสปีชีส์อื่นในงานของคุณคืออะไร?', 'ในบทสัมภาษณ์ NGM คุณพูดถึงพืช สถาปัตยกรรม และ wearable อย่างไร?', 'ถ้าฉันเพิ่งรู้จักงานของคุณ ควรสังเกตความสัมพันธ์อะไรเป็นอย่างแรก?'],
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
      'zh-TW': ['可以告訴我 Fablab Taipei 是一個什麼樣的地方嗎？', '你怎麼把會員、信任和透明帳本變成 fab lab 的社群基礎？', '如果新手想理解 fab lab 社群，應該先看哪個日常問題？'],
      'en': ['Can you tell me what kind of place Fablab Taipei is?', 'How did you talk about membership, trust, and transparent ledgers in your NGM interview?', 'If a beginner wants to understand a fab lab community, which everyday question should they look at first?'],
      'id': ['Bisa ceritakan Fablab Taipei itu tempat seperti apa?', 'Bagaimana kamu membahas keanggotaan, kepercayaan, dan buku kas transparan dalam wawancara NGM?', 'Kalau pemula ingin memahami komunitas fab lab, persoalan sehari-hari apa yang perlu dilihat dulu?'],
      'de': ['Kannst du mir erzählen, was für ein Ort Fablab Taipei ist?', 'Wie hast du im NGM-Interview über Mitgliedschaft, Vertrauen und transparente Kassen gesprochen?', 'Wenn Anfänger eine Fab-Lab-Community verstehen wollen, welche Alltagsfrage sollten sie zuerst anschauen?'],
      'ja': ['Fablab Taipei はどんな場所なのか教えてくれますか？', 'NGM のインタビューで会員制度、信頼、透明な帳簿をどう話しましたか？', '初心者が fab lab コミュニティを理解したいなら、まずどの日常的な問題を見るとよいですか？'],
      'th': ['ช่วยเล่าได้ไหมว่า Fablab Taipei เป็นสถานที่แบบไหน?', 'ในบทสัมภาษณ์ NGM คุณพูดถึงสมาชิก ความไว้วางใจ และบัญชีที่โปร่งใสอย่างไร?', 'ถ้ามือใหม่อยากเข้าใจชุมชน fab lab ควรมองปัญหาประจำวันเรื่องไหนก่อน?'],
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
      'zh-TW': ['可以告訴我 Textiltronics 是一個什麼樣的計畫嗎？', '你怎麼把失敗、策展和材料實驗整理成 Textiltronics 的研究方法？', '如果第一次看 Attempts, Failures, Trials and Errors，應該怎麼理解它？'],
      'en': ['Can you tell me what kind of project Textiltronics is?', 'How did you talk about failure, curating, and material experiments in your NGM interview?', 'If I see Attempts, Failures, Trials and Errors for the first time, how should I understand it?'],
      'id': ['Bisa ceritakan Textiltronics itu proyek seperti apa?', 'Bagaimana kamu membahas kegagalan, kurasi, dan eksperimen material dalam wawancara NGM?', 'Kalau saya pertama kali melihat Attempts, Failures, Trials and Errors, bagaimana memahaminya?'],
      'de': ['Kannst du mir erzählen, was für ein Projekt Textiltronics ist?', 'Wie hast du im NGM-Interview über Scheitern, Kuratieren und Materialexperimente gesprochen?', 'Wenn ich Attempts, Failures, Trials and Errors zum ersten Mal sehe, wie sollte ich es verstehen?'],
      'ja': ['Textiltronics はどんなプロジェクトなのか教えてくれますか？', 'NGM のインタビューで失敗、キュレーション、素材実験をどう話しましたか？', '初めて Attempts, Failures, Trials and Errors を見るなら、どう理解するとよいですか？'],
      'th': ['ช่วยเล่าได้ไหมว่า Textiltronics เป็นโครงการแบบไหน?', 'ในบทสัมภาษณ์ NGM คุณพูดถึงความล้มเหลว การคิวเรต และการทดลองวัสดุอย่างไร?', 'ถ้าฉันเพิ่งเห็น Attempts, Failures, Trials and Errors ควรเข้าใจมันอย่างไร?'],
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
      'zh-TW': ['可以告訴我你的竹製樂器和表演是什麼樣的嗎？', '你怎麼把身體、竹子和聲音連成你的表演方法？', '如果第一次聽你的作品，應該先注意什麼？'],
      'en': ['Can you tell me what your bamboo instruments and performances are like?', 'How did you talk about body, bamboo, and sound in your NGM interview?', 'If I hear your work for the first time, what should I notice first?'],
      'id': ['Bisa ceritakan instrumen bambu dan performansmu seperti apa?', 'Bagaimana kamu membahas tubuh, bambu, dan suara dalam wawancara NGM?', 'Kalau saya pertama kali mendengar karyamu, apa yang perlu diperhatikan dulu?'],
      'de': ['Kannst du mir erzählen, wie deine Bambusinstrumente und Performances sind?', 'Wie hast du im NGM-Interview über Körper, Bambus und Klang gesprochen?', 'Wenn ich deine Arbeit zum ersten Mal höre, worauf sollte ich zuerst achten?'],
      'ja': ['あなたの竹の楽器とパフォーマンスはどんなものですか？', 'NGM のインタビューで身体、竹、音をどう話しましたか？', '初めてあなたの作品を聴くなら、まず何に注目するとよいですか？'],
      'th': ['ช่วยเล่าได้ไหมว่าเครื่องดนตรีไม้ไผ่และการแสดงของคุณเป็นแบบไหน?', 'ในบทสัมภาษณ์ NGM คุณพูดถึงร่างกาย ไม้ไผ่ และเสียงอย่างไร?', 'ถ้าฉันฟังงานของคุณครั้งแรก ควรสังเกตอะไรก่อน?'],
    },
  },
};


function communityQuestionSeed(language: LanguageCode, persona: Persona): string[] {
  const communityHint = cleanQuestionPart(sanitizeRealPersonReferences(Object.values(persona.responses).join(' ')), 44);
  if (language === 'ja') {
    return [
      `この camper のコミュニティ経験から、桃花源の初心者はどの材料・方法・組織の問いから始めるとよいですか？`,
      `この camper は自分たちの実践を NGM、Hackteria、SGMK の公開資料とどうつなげますか？`,
      `この camper のコミュニティを小誌の問いで紹介するなら、どの道具・キャンプ・ケアの方法を比較しますか？`,
      communityHint ? `「${communityHint}」は、どんな検証可能な桃花源の問いになりますか？` : `この camper のコミュニティ記憶は、どんな検証可能な桃花源の問いになりますか？`,
    ];
  }
  if (language === 'zh-TW') {
    return [
      `從這位 camper 的社群經驗出發，桃花源新手可以先問哪個材料、方法或組織問題？`,
      `這位 camper 會怎麼把自己的社群實作連到 NGM、Hackteria 或 SGMK 的公開資料？`,
      `如果只用一個小誌問題介紹這位 camper 關心的社群，應該比較哪個工具、營隊或照護方法？`,
      communityHint ? `「${communityHint}」可以變成什麼可查證的桃花源社群問題？` : `這位 camper 的社群記憶可以怎麼變成一個可查證的桃花源問題？`,
    ];
  }
  return [
    `From this camper's community experience, what material, method, or organization question should a Peach Blossom Spring beginner ask first?`,
    `How would this camper connect their community practice to NGM, Hackteria, or SGMK public sources?`,
    `If one zine question introduced this camper's community, which tool, camp, or care method should it compare?`,
    communityHint ? `How can “${communityHint}” become a checkable Peach Blossom Spring community question?` : `How can this camper's community memory become a checkable Peach Blossom Spring question?`,
  ];
}

function makeSuggestedQuestions(language: LanguageCode, persona: Persona, _transcript = ''): string[] {
  const guided = npcGuideProfiles[persona.id]?.questions[language];
  if (guided?.length) return guided.map(sanitizeRealPersonReferences);
  const fixed = personaQuestionSeeds[persona.id] ?? [];
  const responseEntries = Object.entries(persona.responses).slice(0, 9);
  const sourceBridgeQuestions = [
    `這位 camper 的社群實作如何連到 Hackteria、SGMK 或 How To Get What You Want 的公開文件？`,
    `這位 camper 會怎麼把工作坊、材料或照護經驗整理成一份可查證小誌？`,
    `從這位 camper 的觀點看，哪些公開 source 最適合回答「社群如何保存知識」？`,
    `這位 camper 的實作和 Hackteria 的 workshop / open hardware 文件有什麼可比較之處？`,
    `這位 camper 的社群方法可以如何連到 SGMK 的 sound、DIY electronics 或 handmade tool 頁面？`,
    `這位 camper 的 documentation 方法和其他公開維基有什麼共同問題？`,
  ];
  if (language === 'zh-TW') {
    const responseQuestions = responseEntries.map(([, response]) => `從這位 camper 的社群經驗看，「${cleanQuestionPart(sanitizeRealPersonReferences(response), 48)}」如何連到公開 wiki sources 的可檢查材料？`);
    return shuffleCopy([...fixed.map(sanitizeRealPersonReferences), ...communityQuestionSeed(language, persona), ...sourceBridgeQuestions, ...responseQuestions]).slice(0, 9).map(sanitizeRealPersonReferences);
  }

  const templates: Record<LanguageCode, (response: string) => string> = {
    'zh-TW': (response) => `從這位 camper 的社群經驗看，「${cleanQuestionPart(sanitizeRealPersonReferences(response), 50)}」跟他的實作有什麼關係？`,
    en: (response) => `From this camper's community practice, how does “${cleanQuestionPart(sanitizeRealPersonReferences(response), 50)}” connect to materials, methods, or care?`,
    id: (response) => `Dari praktik komunitas camper ini, bagaimana “${cleanQuestionPart(sanitizeRealPersonReferences(response), 50)}” terhubung dengan bahan, metode, atau perawatan?`,
    de: (response) => `Wie verbindet sich „${cleanQuestionPart(sanitizeRealPersonReferences(response), 50)}“ aus der Community-Praxis dieses campers mit Material, Methode oder Sorgearbeit?`,
    ja: (response) => `この camper のコミュニティ実践から見ると、「${cleanQuestionPart(sanitizeRealPersonReferences(response), 50)}」は材料・方法・ケアとどうつながりますか？`,
    th: (response) => `จากการปฏิบัติของชุมชน camper นี้ “${cleanQuestionPart(sanitizeRealPersonReferences(response), 50)}” เชื่อมกับวัสดุ วิธีการ หรือการดูแลอย่างไร?`,
  };
  const generated = responseEntries.map(([, response]) => templates[language](response));
  const englishSourceBridge = [
    `How does this camper's community practice connect to Hackteria, SGMK, or How To Get What You Want source pages?`,
    `Which source pages would help turn this camper's workshop memory into a checkable zine?`,
    `How would this camper compare their community methods with public workshop documentation?`,
    `What material, tool, or care practice from the three sources best matches this camper's concerns?`,
    `How can this camper's community experience become a makeable, checkable, teachable zine question?`,
    `Which Hackteria or SGMK pages would this camper probably argue with first?`,
  ];
  return shuffleCopy([...communityQuestionSeed(language, persona), ...generated, ...englishSourceBridge]).slice(0, 9).map(sanitizeRealPersonReferences);
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
    'zh-TW': '🎧 聽 camper 的音樂',
    en: "🎧 Listen to camper music",
    id: '🎧 Dengarkan musik camper',
    de: '🎧 Camper-Musik hören',
    ja: '🎧 camper の音楽を聴く',
    th: '🎧 ฟังเพลงของ camper',
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
  const evidence = rankEvidence(query || persona.intro, chunks, 2).map((item) => shorten(sanitizeRealPersonReferences(item.text), 150));
  return [
    `NPC writer: ${publicCamperName()}`,
    `Role: ${sanitizeRealPersonReferences(persona.role)}`,
    `Intro voice: ${shorten(sanitizeRealPersonReferences(persona.intro), 180)}`,
    `Transcript style clues: ${evidence.join(' / ') || 'Use the persona intro and response topics as the voice anchor.'}`,
    'Use this only for writing style, rhythm, emphasis, and choice of examples. Do not invent facts from the transcript unless the zine evidence also supports them.',
    'Reader-facing text must not include real person names. Refer to the avatar only as campers/camper.',
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
        speaker: publicCamperName(),
        text: sanitizeNpcTextForUi(makeIntroMessage(persona, language), language),
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
          npcName: publicCamperName(),
          persona: { id: persona.id, name: publicCamperName(), role: sanitizeRealPersonReferences(persona.role), intro: sanitizeRealPersonReferences(persona.intro), responses: persona.responses },
          transcript,
          preferredLanguage: language,
          dialogueHistory,
        });
        const resolvedLinks = answer.links.length ? answer.links : searchWikiPagesWithHints(trimmed, answer.answer, persona.id, 8);
        setMessages((prev) => [...prev, { speaker: publicCamperName(), text: sanitizeNpcTextForUi(answer.answer, language), evidence: answer.evidence, links: resolvedLinks }]);
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
          const sanitizedAnswer = sanitizeNpcTextForUi(answer, language);
          setMessages((prev) => [...prev, { speaker: publicCamperName(), text: sanitizedAnswer, evidence: mergedEvidence, links: links.length ? links : searchWikiPagesWithHints(trimmed, sanitizedAnswer, persona.id, 8) }]);
        } catch (deepseekError) {
          console.warn('NPC DeepSeek answer failed; using transcript fallback.', deepseekError);
          const fallbackText = buildPersonaTranscriptAnswer(language, persona, topic, transcriptEvidence);
          const sanitizedFallbackText = sanitizeNpcTextForUi(fallbackText, language);
          setMessages((prev) => [...prev, { speaker: publicCamperName(), text: sanitizedFallbackText, links: links.length ? links : searchWikiPagesWithHints(trimmed, sanitizedFallbackText, persona.id, 8) }]);
        }
      }
    } catch (err) {
      console.warn('NPC dialogue error:', err);
      setError(t(language, 'dialogue.requestFailed'));
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
              <PixelAvatar avatar={npcAvatar} label={publicCamperName()} />
            </div>
            <div>
              <div className="rpg-dialogue-kicker-row flex items-center gap-3 mb-2">
                <p className="rpg-dialogue-kicker pbs-frame-kicker text-lg uppercase tracking-wide text-accent-bright m-0" data-ui-part="caption">{t(language, 'home.wanderAndTalk')}</p>
                {persona.id === 'wukir-suryadi' && <WukirMusicButton language={language} onOpenMusic={onOpenMusic} />}
              </div>
              <h2 className="rpg-dialogue-name pbs-frame-title text-2xl leading-none" data-ui-part="title">{publicCamperName()}</h2>
              <p className="rpg-dialogue-role pbs-frame-subtitle text-xl text-text-muted mt-2" data-ui-part="subtitle">{sanitizeRealPersonReferences(persona.role)}</p>
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
                  <span className="text-accent-bright">{sanitizeRealPersonReferences(message.speaker)}: </span>
                  {sanitizeRealPersonReferences(message.text)}
                </p>
                {message.links && message.links.length > 0 && (
                  <details className="rpg-dialogue-source-links" aria-label={sourceLinksLabel(language)}>
                    <summary>{sourceLinksLabel(language)} ({message.links.length})</summary>
                    <div className="rpg-dialogue-source-link-list">
                      {message.links.map((link, linkIndex) => (
                        <a key={`${link.url}-${linkIndex.toString()}`} href={link.url} target="_blank" rel="noreferrer">
                          <span>[{linkIndex + 1}] {sanitizeRealPersonReferences(link.title)}</span>
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
                {publicCamperName()} {t(language, 'dialogue.thinking')}
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
            placeholder={t(language, 'dialogue.inputPlaceholder', { name: publicCamperName() })}
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
