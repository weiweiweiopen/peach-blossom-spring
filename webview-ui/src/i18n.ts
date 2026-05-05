export type LanguageCode = 'zh-TW' | 'en' | 'th';

type TranslationKey =
  | 'languageLabel'
  | 'ngmLabel'
  | 'loginTitle'
  | 'loginSubtitle'
  | 'loginDescription'
  | 'createProtagonist'
  | 'createTraveler'
  | 'nameLabel'
  | 'namePlaceholder'
  | 'roleLabel'
  | 'rolePlaceholder'
  | 'missionLabel'
  | 'missionPlaceholder'
  | 'constraintsLabel'
  | 'constraintsPlaceholder'
  | 'avatarCollection'
  | 'enterWorld'
  | 'movementHint'
  | 'pressSpaceToTalk'
  | 'wanderAndTalk'
  | 'archiveTree'
  | 'archiveTitle'
  | 'archiveDescription'
  | 'communityPortals'
  | 'wiki'
  | 'noWikiLinks'
  | 'teachMe'
  | 'whereIsThis'
  | 'askAnything'
  | 'talk'
  | 'close'
  | 'thinking'
  | 'abaoEncounterTitle'
  | 'abaoEncounterHint';

type TranslationTable = Record<LanguageCode, Record<TranslationKey, string>>;

export const supportedLanguages: Array<{ code: LanguageCode; label: string }> = [
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'en', label: 'English' },
  { code: 'th', label: 'ไทย (coming soon)' },
];

const translations: TranslationTable = {
  'zh-TW': {
    languageLabel: '語言',
    ngmLabel: 'Non-Governmental Matters',
    loginTitle: '桃花源：可派遣的思考生命模擬器',
    loginSubtitle: '一個 Non-Governmental Matters 的互動寓言維度',
    loginDescription:
      '桃花源是一個互動寓言維度，許多社群和仙人在這與世隔絕，你來到這裡探索並收集建造一個烏托邦的方式。請自由的與住在這裡的朋友交談，每一個意見裡都有數不盡的寶藏。但記得你的一舉一動都會影響這個自由開源科技藝術世界的發展，或許你也會在裡面發現夢境與現實世界的耦合。',
    createProtagonist: '創建主角',
    createTraveler: '創建異世界旅人',
    nameLabel: '名字',
    namePlaceholder: '輸入你的角色名',
    roleLabel: '目前角色',
    rolePlaceholder: '例如：獨立研究者、藝術家、工程師、村莊召喚師',
    missionLabel: '任務 / 你想推進什麼',
    missionPlaceholder: '描述你想讓這個角色帶進桃花源測試、挑戰、共同發展的想法。',
    constraintsLabel: '限制條件（選填）',
    constraintsPlaceholder: '例如：不能做成企業 dashboard、預算很小、必須開源、三個月內要有原型。',
    avatarCollection: '異世界角色樣式',
    enterWorld: '進入桃花源',
    movementHint: '用方向鍵或 WASD 行走。手機可用螢幕方向鍵。按住 Shift 可加速。',
    pressSpaceToTalk: '按下 Space 交談',
    wanderAndTalk: '漫遊與對話',
    archiveTree: '檔案大樹',
    archiveTitle: 'NGM 人物檔案',
    archiveDescription: '這棵大樹保存 14 位 interviewee 與 Abao 的知識索引與外部連結。',
    communityPortals: '社群入口',
    wiki: 'Wiki',
    noWikiLinks: '尚未加入 wiki 連結',
    teachMe: '你可以教我什麼？',
    whereIsThis: '這裡是哪裡？',
    askAnything: '你想問什麼？',
    talk: '交談',
    close: '關閉',
    thinking: '正在思考...',
    abaoEncounterTitle: 'Abao 的說書人地圖場域',
    abaoEncounterHint: '靠近 Abao 時，故事場景會展開；按 Space 進入對話。',
  },
  en: {
    languageLabel: 'Language',
    ngmLabel: 'Non-Governmental Matters',
    loginTitle: 'Peach Blossom Spring: Dispatchable Thinking Life Simulator',
    loginSubtitle: 'An interactive allegorical dimension of Non-Governmental Matters',
    loginDescription:
      'Peach Blossom Spring is an interactive allegorical dimension inhabited by many immortals. Every action you take influences this free and open-source techno-art world, while revealing how the allegory couples with our present reality.',
    createProtagonist: 'Create your protagonist',
    createTraveler: 'Create your isekai traveler',
    nameLabel: 'Name',
    namePlaceholder: 'Enter your traveler name',
    roleLabel: 'Current role',
    rolePlaceholder: 'Independent researcher, artist, engineer, village summoner...',
    missionLabel: 'Mission / what are you trying to do?',
    missionPlaceholder: 'Describe the idea you want your avatar to test, challenge, and develop inside the camp.',
    constraintsLabel: 'Constraints (optional)',
    constraintsPlaceholder: 'No corporate dashboard, tiny budget, must be open source, prototype in three months...',
    avatarCollection: 'Isekai avatar collection',
    enterWorld: 'Enter Peach Blossom Spring',
    movementHint: 'Use arrow keys or WASD to move. On mobile, use the on-screen controls. Hold Shift to sprint.',
    pressSpaceToTalk: 'Press Space to talk',
    wanderAndTalk: 'Wander and talk',
    archiveTree: 'Archive Tree',
    archiveTitle: 'NGM Character Archive',
    archiveDescription: 'The archive tree keeps the 14 interviewees and Abao linked to transcripts and references.',
    communityPortals: 'Community portals',
    wiki: 'Wiki',
    noWikiLinks: 'No wiki links yet',
    teachMe: 'What can you teach me?',
    whereIsThis: 'Where am I?',
    askAnything: 'What would you like to ask?',
    talk: 'Talk',
    close: 'Close',
    thinking: 'is thinking...',
    abaoEncounterTitle: 'Abao storyteller encounter',
    abaoEncounterHint: 'When you enter Abao’s range, the map opens into a storytelling split scene. Press Space to talk.',
  },
  th: {
    languageLabel: 'ภาษา',
    ngmLabel: 'Non-Governmental Matters',
    loginTitle: 'Peach Blossom Spring: Dispatchable Thinking Life Simulator',
    loginSubtitle: 'Thai UI coming soon',
    loginDescription: 'Thai localization is not ready yet. The game will currently fall back to English content.',
    createProtagonist: 'Create your protagonist',
    createTraveler: 'Create your isekai traveler',
    nameLabel: 'Name',
    namePlaceholder: 'Enter your traveler name',
    roleLabel: 'Current role',
    rolePlaceholder: 'Independent researcher, artist, engineer, village summoner...',
    missionLabel: 'Mission / what are you trying to do?',
    missionPlaceholder: 'Describe the idea you want your avatar to test, challenge, and develop inside the camp.',
    constraintsLabel: 'Constraints (optional)',
    constraintsPlaceholder: 'No corporate dashboard, tiny budget, must be open source, prototype in three months...',
    avatarCollection: 'Isekai avatar collection',
    enterWorld: 'Enter Peach Blossom Spring',
    movementHint: 'Use arrow keys or WASD to move. On mobile, use the on-screen controls. Hold Shift to sprint.',
    pressSpaceToTalk: 'Press Space to talk',
    wanderAndTalk: 'Wander and talk',
    archiveTree: 'Archive Tree',
    archiveTitle: 'NGM Character Archive',
    archiveDescription: 'The archive tree keeps the 14 interviewees and Abao linked to transcripts and references.',
    communityPortals: 'Community portals',
    wiki: 'Wiki',
    noWikiLinks: 'No wiki links yet',
    teachMe: 'What can you teach me?',
    whereIsThis: 'Where am I?',
    askAnything: 'What would you like to ask?',
    talk: 'Talk',
    close: 'Close',
    thinking: 'is thinking...',
    abaoEncounterTitle: 'Abao storyteller encounter',
    abaoEncounterHint: 'When you enter Abao’s range, the map opens into a storytelling split scene. Press Space to talk.',
  },
};

export const LANGUAGE_STORAGE_KEY = 'peach_language';

export function readStoredLanguage(): LanguageCode {
  try {
    const raw = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return raw === 'en' || raw === 'th' || raw === 'zh-TW' ? raw : 'zh-TW';
  } catch {
    return 'zh-TW';
  }
}

export function writeStoredLanguage(language: LanguageCode): void {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    /* ignore storage failures */
  }
}

export function t(language: LanguageCode, key: TranslationKey): string {
  return translations[language]?.[key] ?? translations.en[key];
}
