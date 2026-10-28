import type { LanguageCode } from '../i18n.js';
import type { DialogueHistoryTurn, MemoryChatResponse } from '../localMemoryApi.js';
import { answerFromPacket, callPublicationModel, getEvidencePacket, hasConsistentOutputLanguage, type ModelCall } from './pagesEvidence.js';
import type { EvidencePacket } from './sourceCorpus.js';

export interface NpcPersonaContext {
  id?: string; name?: string; role?: string; intro?: string;
  displayRole?: string; opening?: string; responses?: Record<string, string>;
}
export interface NpcQuestion {
  question: string; npcName: string; persona?: NpcPersonaContext; transcript?: string;
  transcriptUrl?: string; preferredLanguage: LanguageCode; dialogueHistory?: DialogueHistoryTurn[];
}
export type NpcIntent = 'identity' | 'greeting' | 'thanks' | 'help' | 'reflection' | 'research';
export function npcIntent(question: string): NpcIntent {
  const q = question.trim().replace(/[!?！？。．]+$/u, '').trim().replace(/[啊呀啦呢]$/u, '');
  if (/^(?:請|可以|能不能|可不可以)?(?:你是誰|你是哪位|你叫什麼(?:名字)?|你是做什麼的|介紹(?:一下)?你自己|自我介紹|你自我介紹(?:一下)?|你介紹(?:一下)?自己)(?:嗎|呢)?$/u.test(q)
    || /你(?:是一個|是個|是)?什麼樣的(?:藝術家|人|角色)|what kind of (?:artist|person).*you/i.test(q)
    || /^(?:請問|請)?你?(?:能|可以|能不能|可不可以)?(?:先)?(?:自我介紹|介紹(?:一下)?(?:你)?自己)(?:一下)?嗎?$/u.test(q)
    || /^(?:who are you|what(?:'s| is) your name|introduce yourself|tell me about yourself|siapa (?:kamu|anda)|wer bist du|あなたは誰(?:ですか)?|自己紹介(?:してください)?|คุณเป็นใคร)$/iu.test(q)) return 'identity';
  if (/^(?:你好|您好|嗨|哈囉|哈喽|hello|hi|hey|halo|hallo|こんにちは|สวัสดี(?:ครับ|ค่ะ)?)[\s～~]*$/iu.test(q)) return 'greeting';
  if (/^(?:你)?(?:最近好嗎|還好嗎|在嗎|有空嗎|早安|晚安)$|^how are you$|^are you there$/iu.test(q)) return 'greeting';
  if (/^(?:謝謝(?:你)?|謝啦|谢谢(?:你)?|thanks|thank you(?: very much)?|terima kasih|danke|ありがとう(?:ございます)?|ขอบคุณ(?:ครับ|ค่ะ)?)$/iu.test(q)) return 'thanks';
  if (/^(?:你(?:能|可以|會)做什麼|怎麼跟你聊|怎麼使用|你可以幫我什麼|what can you do|how (?:can|do) i (?:use|talk to) you|was kannst du|何ができますか|คุณทำอะไรได้บ้าง|kamu bisa apa)$/iu.test(q)) return 'help';
  // Opinions, empathy and suggestions are dialogue acts, not assertions that
  // some external event happened. All factual questions retain the evidence path.
  if (/你(?:覺得|喜歡|會怎麼建議|有什麼建議|怎麼看|想不想)|陪我聊|我(?:很難過|好累|很焦慮)|what do you (?:think|like)|how would you|your advice|was denkst du|menurutmu|どう思|どうしたら|คุณคิดว่า|แนะนำ/i.test(q)) return 'reflection';
  return 'research';
}

const COPY: Record<LanguageCode, { identity: (role: string) => string; help: string; thanks: string; greeting: string; failed: string }> = {
  'zh-TW': { identity: (role) => `我是這裡的 camper，角色是「${role}」。`, help: '可以問我是誰、聊我的訪談和做事方法，也可以給我一個地點、材料或專案，一起找相關頁面。問近期活動時，我會分清楚活動日期與舊紀錄。', thanks: '不客氣！想繼續聊哪一條線？', greeting: '你好！想聊我的工作方法，還是一起找個實作或活動？', failed: '這次我沒能把想法整理好，可以換個角度再聊一次嗎？' },
  en: { identity: (role) => `I'm a camper here. My role is “${role}”.`, help: 'Ask who I am, discuss my interview and working methods, or give me a place, material or project to explore. For recent events, I distinguish event dates from older records.', thanks: 'You’re welcome! Which thread would you like to follow?', greeting: 'Hello! Want to talk about my methods, or explore a project or event together?', failed: 'I could not put that thought together this time. Could we try it from another angle?' },
  id: { identity: (role) => `Aku camper di sini, dengan peran “${role}”.`, help: 'Tanyakan siapa aku, bicarakan wawancara dan cara kerjaku, atau sebutkan tempat, bahan, atau proyek untuk ditelusuri. Untuk kegiatan terbaru, aku membedakan tanggal acara dari arsip lama.', thanks: 'Sama-sama! Mau melanjutkan pembicaraan yang mana?', greeting: 'Halo! Mau membahas caraku bekerja atau mencari proyek dan kegiatan bersama?', failed: 'Aku belum berhasil merangkai pikiran itu. Bisa kita coba dari sudut lain?' },
  de: { identity: (role) => `Ich bin hier ein Camper. Meine Rolle ist „${role}“.`, help: 'Frag, wer ich bin, sprich über mein Interview und meine Arbeitsweise oder nenne einen Ort, ein Material oder ein Projekt. Bei aktuellen Veranstaltungen unterscheide ich Termine von älteren Aufzeichnungen.', thanks: 'Gern! Welchen Faden möchtest du weiterverfolgen?', greeting: 'Hallo! Möchtest du über meine Arbeitsweise sprechen oder gemeinsam ein Projekt oder eine Veranstaltung erkunden?', failed: 'Diesen Gedanken konnte ich gerade nicht ausformulieren. Versuchen wir einen anderen Blickwinkel?' },
  ja: { identity: (role) => `ここにいる camper です。役割は「${role}」です。`, help: '自己紹介、インタビュー、制作方法について話せます。場所、素材、プロジェクトを挙げて、一緒に関連資料を探すこともできます。最近の催しは、開催日と古い記録を区別します。', thanks: 'どういたしまして！どの話を続けましょうか？', greeting: 'こんにちは！制作方法の話をしますか、それとも一緒にプロジェクトや催しを探しますか？', failed: '今回は考えをうまくまとめられませんでした。別の角度から話してみませんか？' },
  th: { identity: (role) => `ฉันเป็น camper ที่นี่ มีบทบาทคือ “${role}”`, help: 'ถามได้ว่าฉันเป็นใคร คุยเรื่องบทสัมภาษณ์และวิธีทำงาน หรือบอกสถานที่ วัสดุ หรือโครงการให้เราค้นด้วยกัน สำหรับกิจกรรมล่าสุด ฉันจะแยกวันที่จัดงานออกจากบันทึกเก่า', thanks: 'ยินดี! อยากคุยต่อเรื่องไหน?', greeting: 'สวัสดี! อยากคุยเรื่องวิธีทำงานของฉัน หรือค้นโครงการและกิจกรรมด้วยกัน?', failed: 'ครั้งนี้ฉันยังเรียบเรียงความคิดไม่ได้ ลองคุยจากอีกมุมหนึ่งได้ไหม?' },
};

const MISSING_INTERVIEW: Record<LanguageCode, string> = {
  'zh-TW': '這個角色的訪談逐字稿目前還沒收錄。我可以介紹角色設定，但不會把設定說成訪談內容。你也可以問一個材料、專案或活動，我們先查公開資料。',
  en: 'This character’s interview transcript has not been added yet. I can introduce the character profile, but will not present it as interview testimony. We can still look up public material, projects or events.',
  id: 'Transkrip wawancara karakter ini belum tersedia. Aku bisa mengenalkan profil karakter, tetapi tidak akan menyebutnya sebagai isi wawancara. Kita masih bisa mencari bahan, proyek, atau kegiatan dari sumber publik.',
  de: 'Das Interviewtranskript dieser Figur liegt noch nicht vor. Ich kann das Rollenprofil vorstellen, werde es aber nicht als Interviewaussage ausgeben. Öffentliche Materialien, Projekte oder Veranstaltungen können wir trotzdem erkunden.',
  ja: 'このキャラクターのインタビュー原稿はまだ収録されていません。役割の設定は紹介できますが、インタビューの発言とは区別します。素材、プロジェクト、催しの公開資料は一緒に探せます。',
  th: 'ยังไม่มีบทสัมภาษณ์ของตัวละครนี้ ฉันแนะนำข้อมูลบทบาทได้ แต่จะไม่อ้างว่าเป็นคำให้สัมภาษณ์ เรายังค้นข้อมูลสาธารณะเกี่ยวกับวัสดุ โครงการ หรือกิจกรรมด้วยกันได้',
};

export interface NpcDependencies {
  getPacket?: (question: string, context: { transcript?: string; transcriptUrl?: string; history?: DialogueHistoryTurn[] }) => Promise<EvidencePacket>;
  model?: ModelCall;
}

export async function answerNpcQuestion(args: NpcQuestion, dependencies: NpcDependencies = {}): Promise<MemoryChatResponse> {
  const language = args.preferredLanguage;
  const copy = COPY[language];
  const persona = args.persona ?? {};
  const intent = npcIntent(args.question);
  const role = persona.displayRole || persona.role || args.npcName;
  const plain = (answer: string): MemoryChatResponse => ({ answer, links: [], evidence: [], status: 'character' });
  if (intent === 'identity') return plain([copy.identity(role), persona.opening || copy.help].join(' '));
  if (intent === 'greeting') return plain(persona.opening || copy.greeting);
  if (intent === 'thanks') return plain(copy.thanks);
  if (intent === 'help') return plain(copy.help);
  if (/訪談|interview|インタビュー|สัมภาษณ์|wawancara/i.test(args.question) &&
    (!args.transcript?.trim() || /Transcript pending|user will provide later|逐字稿待補|訪談待補/i.test(args.transcript))) {
    return { answer: MISSING_INTERVIEW[language], links: [], evidence: [], status: 'no_evidence' };
  }
  const model = dependencies.model ?? callPublicationModel;
  if (intent === 'reflection') {
    try {
      const result = await model(
        `You are the selected camper in a game, speaking in ${language}. Respond naturally to an opinion, emotional or advice question. Frame suggestions as proposals, not facts or memories. Use only the supplied character profile to anchor your perspective. Do not claim external events, current activities, real visits or achievements. Conversation history resolves references but is not factual evidence. Return JSON only: {"reply":"2–4 conversational sentences"}.`,
        JSON.stringify({ question: args.question, persona, history: args.dialogueHistory?.slice(-8) ?? [] }),
      ) as { reply?: string };
      if (typeof result.reply !== 'string' || !result.reply.trim() || !hasConsistentOutputLanguage(result.reply, language)) throw new Error('invalid_dialogue');
      const review = await model(
        `Review a character's reflection in ${language}. Return JSON only: {"languageCorrect":true or false,"noUnsupportedFacts":true or false}. Advice and opinions are allowed; invented visits, activities, biography or external facts are not. Check against the supplied profile, not previous AI prose.`,
        JSON.stringify({ profile: persona, question: args.question, reply: result.reply }),
      ) as { languageCorrect?: boolean; noUnsupportedFacts?: boolean };
      if (review.languageCorrect !== true || review.noUnsupportedFacts !== true) throw new Error('unsupported_dialogue');
      return plain(result.reply.trim());
    } catch { return { ...plain(copy.failed), status: 'unverified' }; }
  }
  const packet = await (dependencies.getPacket ?? getEvidencePacket)(args.question, { transcript: args.transcript, transcriptUrl: args.transcriptUrl, history: args.dialogueHistory });
  return answerFromPacket(packet, language,
    `Speak conversationally in FIRST PERSON as this selected camper. The supplied testimony passages belong to this avatar's own interview: attribute them as "in my interview, I said..." in the selected language, never "he/she said" or "the interviewee said". For external source pages, say what you found, not that you personally took part. Voice context only, not additional factual evidence: ${JSON.stringify({ role: persona.role, intro: persona.intro })}. Do not borrow another person's experiences. Preserve uncertainty.`, model);
}
