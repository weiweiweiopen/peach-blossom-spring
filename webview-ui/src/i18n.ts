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
  | 'skillsLabel'
  | 'skillsPlaceholder'
  | 'enterWorld'
  | 'sendOnExpedition'
  | 'movementHint'
  | 'pressSpaceToTalk'
  | 'wanderAndTalk'
  | 'archiveTree'
  | 'archiveTitle'
  | 'archiveDescription'
  | 'archivePdfTitle'
  | 'archiveMapTitle'
  | 'communityPortals'
  | 'wiki'
  | 'noWikiLinks'
  | 'teachMe'
  | 'whereIsThis'
  | 'askAnything'
  | 'talk'
  | 'close'
  | 'thinking'
  | 'apiKeyMissing'
  | 'apiKeyMissingInstruction'
  | 'localApiKeySettings'
  | 'apiKeyLabel'
  | 'saveLocally'
  | 'savedLocally'
  | 'clearSavedKey'
  | 'expeditionTitle'
  | 'templateSimulation'
  | 'expeditionDescription'
  | 'expeditionPlayerSummary'
  | 'expeditionConstraints'
  | 'expeditionSkills'
  | 'expeditionNoConstraints'
  | 'expeditionMission'
  | 'expeditionMaxRounds'
  | 'expeditionSelectedNpcs'
  | 'expeditionRun'
  | 'expeditionRunning'
  | 'expeditionLiveLog'
  | 'expeditionNoEvents'
  | 'expeditionRound'
  | 'expeditionChallenge'
  | 'expeditionLead'
  | 'expeditionNextQuestion'
  | 'expeditionReport'
  | 'expeditionOriginalMission'
  | 'expeditionInterpretedMission'
  | 'expeditionEmergentDirection'
  | 'expeditionKeyEncounters'
  | 'expeditionNpcDisagreements'
  | 'expeditionBlindSpots'
  | 'expeditionNextActions'
  | 'expeditionFollowUpQuestions'
  | 'expeditionResearchLeads'
  | 'encounterFrictionCircle'
  | 'encounterFieldTest'
  | 'encounterNightKitchenArgument'
  | 'encounterArchiveDetour'
  | 'encounterPrototypeOmen'
  | 'abaoEncounterTitle'
  | 'abaoEncounterHint'
  | 'hatchEnter'
  | 'dispatchPetOnly'
  | 'dispatchArchive'
  | 'localDispatchRecords'
  | 'active'
  | 'hibernating'
  | 'archived'
  | 'fieldNotes'
  | 'petReturnedNotes'
  | 'localOnlyNotice'
  | 'smallCircleEvent'
  | 'hibernationEvent'
  | 'worldResonanceEvent'
  | 'observerMode'
  | 'stats'
  | 'status'
  | 'skill'
  | 'sendFieldNote'
  | 'fieldNotePlaceholder'
  | 'zoomIn'
  | 'zoomOut';

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
    missionLabel: '我想要什麼',
    missionPlaceholder: '描述你想讓這個角色帶進桃花源的願望、需求或想共同發展的未來。',
    constraintsLabel: '限制條件（選填）',
    constraintsPlaceholder: '例如：不能做成企業 dashboard、預算很小、必須開源、三個月內要有原型。',
    avatarCollection: '置入角色',
    skillsLabel: '我有什麼技能',
    skillsPlaceholder: '例如：田野研究、開源硬體、策展、社群組織、織品、寫程式。',
    enterWorld: '進入桃花源',
    sendOnExpedition: '派遣why星人',
    movementHint: '用方向鍵或 WASD 行走。手機請在左下角拇指圓圈拖曳移動。按住 Shift 可加速。',
    pressSpaceToTalk: '點我交談',
    wanderAndTalk: '漫遊與對話',
    archiveTree: '檔案大樹',
    archiveTitle: 'NGM PDF 與社群地圖',
    archiveDescription: '人物檔案與外部連結已移到各受訪者 NPC 交談視窗的 Wiki 連結下。',
    archivePdfTitle: 'NGM PDF 嵌入電子書',
    archiveMapTitle: 'NGM 社群地圖',
    communityPortals: '社群入口',
    wiki: 'Wiki',
    noWikiLinks: '尚未加入 wiki 連結',
    teachMe: '你可以教我什麼？',
    whereIsThis: '這裡是哪裡？',
    askAnything: '你想問什麼？',
    talk: '交談',
    close: '關閉',
    thinking: '正在思考...',
    apiKeyMissing: '缺少 API key',
    apiKeyMissingInstruction: '請在 webview-ui/.env.local 設定 VITE_DEEPSEEK_API_KEY，或使用本機瀏覽器儲存一次。',
    localApiKeySettings: '本機 API key 設定',
    apiKeyLabel: 'DeepSeek API key',
    saveLocally: '只存本機',
    savedLocally: '已儲存在本機',
    clearSavedKey: '清除本機 key',
    expeditionTitle: '桃花源：可派遣的思考生命模擬器',
    templateSimulation: '模板模擬',
    expeditionDescription: '把你的任務派進桃花源，讓不同 NPC 從記憶、推演與猜測三種層次互相碰撞。',
    expeditionPlayerSummary: '遠征者',
    expeditionConstraints: '限制條件',
    expeditionSkills: '技能',
    expeditionNoConstraints: '未設定',
    expeditionMission: '任務',
    expeditionMaxRounds: '回合上限',
    expeditionSelectedNpcs: '選擇同行 NPC',
    expeditionRun: '派遣why星人',
    expeditionRunning: 'why星人派遣中...',
    expeditionLiveLog: '現場事件紀錄',
    expeditionNoEvents: '尚未產生遠征事件。',
    expeditionRound: '回合',
    expeditionChallenge: '質疑',
    expeditionLead: '新線索',
    expeditionNextQuestion: '下一個問題',
    expeditionReport: '遠征報告',
    expeditionOriginalMission: '原始任務',
    expeditionInterpretedMission: '重新詮釋的任務',
    expeditionEmergentDirection: '湧現方向',
    expeditionKeyEncounters: '關鍵遭遇',
    expeditionNpcDisagreements: 'NPC 分歧',
    expeditionBlindSpots: '盲點',
    expeditionNextActions: '下一步行動',
    expeditionFollowUpQuestions: '後續問題',
    expeditionResearchLeads: '招募 / 研究線索',
    encounterFrictionCircle: '摩擦圓桌',
    encounterFieldTest: '現地測試',
    encounterNightKitchenArgument: '夜間廚房辯論',
    encounterArchiveDetour: '檔案岔路',
    encounterPrototypeOmen: '原型預兆',
    abaoEncounterTitle: 'Abao 的說書人地圖場域',
    abaoEncounterHint: '靠近 Abao 時，故事場景會展開；點角色泡泡進入對話。',
    hatchEnter: '孵化並進入世界',
    dispatchPetOnly: '只派遣電子雞',
    dispatchArchive: '派遣紀錄',
    localDispatchRecords: '本機派遣紀錄',
    active: '活躍',
    hibernating: '休眠',
    archived: '已封存',
    fieldNotes: '田野筆記',
    petReturnedNotes: '你的電子雞帶回了 {count} 則田野筆記',
    localOnlyNotice: '本版為本機派遣紀錄；跨使用者同步需要下一版伺服器。',
    smallCircleEvent: '一小群問題雞開始交換彼此的失敗經驗。',
    hibernationEvent: '有些問題雞鑽進草叢休眠，等待下一次被召回。',
    worldResonanceEvent: '桃花源短暫變成一座會彼此回應的網絡。',
    observerMode: '無人物瀏覽模式',
    stats: '數值',
    status: '狀態',
    skill: '技能',
    sendFieldNote: '留下田野筆記',
    fieldNotePlaceholder: '寫一則短田野筆記...',
    zoomIn: '放大',
    zoomOut: '縮小',
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
    missionLabel: 'What do I want?',
    missionPlaceholder: 'Describe the wish, need, or future you want this avatar to bring into Peach Blossom Spring.',
    constraintsLabel: 'Constraints (optional)',
    constraintsPlaceholder: 'No corporate dashboard, tiny budget, must be open source, prototype in three months...',
    avatarCollection: 'Place Role',
    skillsLabel: 'What skills do I have?',
    skillsPlaceholder: 'For example: field research, open hardware, curation, community organizing, textiles, coding.',
    enterWorld: 'Enter Peach Blossom Spring',
    sendOnExpedition: 'Send the Mr. WHY',
    movementHint: 'Use arrow keys or WASD to move. On mobile, drag from the lower-left thumb circle. Hold Shift to sprint.',
    pressSpaceToTalk: 'Tap to talk',
    wanderAndTalk: 'Wander and talk',
    archiveTree: 'Archive Tree',
    archiveTitle: 'NGM PDF and Community Map',
    archiveDescription: 'Interviewee dossiers and external references now live under each NPC dialogue window’s Wiki links.',
    archivePdfTitle: 'NGM PDF embedded ebook',
    archiveMapTitle: 'NGM community map',
    communityPortals: 'Community portals',
    wiki: 'Wiki',
    noWikiLinks: 'No wiki links yet',
    teachMe: 'What can you teach me?',
    whereIsThis: 'Where am I?',
    askAnything: 'What would you like to ask?',
    talk: 'Talk',
    close: 'Close',
    thinking: 'is thinking...',
    apiKeyMissing: 'API key missing',
    apiKeyMissingInstruction: 'Set VITE_DEEPSEEK_API_KEY in webview-ui/.env.local, or save it once in local browser storage.',
    localApiKeySettings: 'Local API key settings',
    apiKeyLabel: 'DeepSeek API key',
    saveLocally: 'Save locally',
    savedLocally: 'saved locally',
    clearSavedKey: 'Clear saved key',
    expeditionTitle: 'Peach Blossom Spring: Dispatchable Thinking Life Simulator',
    templateSimulation: 'Template Simulation',
    expeditionDescription: 'Dispatch your mission into Peach Blossom Spring and let NPCs collide through memory, extrapolation, and speculation.',
    expeditionPlayerSummary: 'Expedition avatar',
    expeditionConstraints: 'Constraints',
    expeditionSkills: 'Skills',
    expeditionNoConstraints: 'none declared',
    expeditionMission: 'Mission',
    expeditionMaxRounds: 'Max rounds',
    expeditionSelectedNpcs: 'Selected NPCs',
    expeditionRun: 'Send the Mr. WHY',
    expeditionRunning: 'Mr. WHY is away...',
    expeditionLiveLog: 'Live Event Log',
    expeditionNoEvents: 'No expedition events yet.',
    expeditionRound: 'Round',
    expeditionChallenge: 'Challenge',
    expeditionLead: 'Lead',
    expeditionNextQuestion: 'Next question',
    expeditionReport: 'Expedition Report',
    expeditionOriginalMission: 'Original mission',
    expeditionInterpretedMission: 'Interpreted mission',
    expeditionEmergentDirection: 'Emergent direction',
    expeditionKeyEncounters: 'Key Encounters',
    expeditionNpcDisagreements: 'NPC Disagreements',
    expeditionBlindSpots: 'Blind Spots',
    expeditionNextActions: 'Concrete Next Actions',
    expeditionFollowUpQuestions: 'Follow-Up Questions',
    expeditionResearchLeads: 'Open-Call / Research Leads',
    encounterFrictionCircle: 'Friction circle',
    encounterFieldTest: 'Field test',
    encounterNightKitchenArgument: 'Night kitchen argument',
    encounterArchiveDetour: 'Archive detour',
    encounterPrototypeOmen: 'Prototype omen',
    abaoEncounterTitle: 'Abao storyteller encounter',
    abaoEncounterHint: 'When you enter Abao’s range, the map opens into a storytelling split scene. Tap the character bubble to talk.',
    hatchEnter: 'Hatch & Enter',
    dispatchPetOnly: 'Dispatch Pet Only',
    dispatchArchive: 'Dispatch Archive',
    localDispatchRecords: 'Local Dispatch Records',
    active: 'Active',
    hibernating: 'Hibernating',
    archived: 'Archived',
    fieldNotes: 'Field Notes',
    petReturnedNotes: 'Your pet returned with {count} field notes.',
    localOnlyNotice: 'This version stores dispatch records locally. Cross-user sync requires a future server backend.',
    smallCircleEvent: 'A small circle of question-pets begins exchanging failed attempts.',
    hibernationEvent: 'Some question-pets slip into the grass to hibernate, waiting to be recalled.',
    worldResonanceEvent: 'Peach Blossom Spring briefly becomes a network that answers itself.',
    observerMode: 'No-avatar browse mode',
    stats: 'Stats',
    status: 'Status',
    skill: 'Skill',
    sendFieldNote: 'Leave field note',
    fieldNotePlaceholder: 'Write a short field note...',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',

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
    missionLabel: 'What do I want?',
    missionPlaceholder: 'Describe the wish, need, or future you want this avatar to bring into Peach Blossom Spring.',
    constraintsLabel: 'Constraints (optional)',
    constraintsPlaceholder: 'No corporate dashboard, tiny budget, must be open source, prototype in three months...',
    avatarCollection: 'Place Role',
    skillsLabel: 'What skills do I have?',
    skillsPlaceholder: 'For example: field research, open hardware, curation, community organizing, textiles, coding.',
    enterWorld: 'Enter Peach Blossom Spring',
    sendOnExpedition: 'Send the Mr. WHY',
    movementHint: 'Use arrow keys or WASD to move. On mobile, drag from the lower-left thumb circle. Hold Shift to sprint.',
    pressSpaceToTalk: 'Tap to talk',
    wanderAndTalk: 'Wander and talk',
    archiveTree: 'Archive Tree',
    archiveTitle: 'NGM PDF and Community Map',
    archiveDescription: 'Interviewee dossiers and external references now live under each NPC dialogue window’s Wiki links.',
    archivePdfTitle: 'NGM PDF embedded ebook',
    archiveMapTitle: 'NGM community map',
    communityPortals: 'Community portals',
    wiki: 'Wiki',
    noWikiLinks: 'No wiki links yet',
    teachMe: 'What can you teach me?',
    whereIsThis: 'Where am I?',
    askAnything: 'What would you like to ask?',
    talk: 'Talk',
    close: 'Close',
    thinking: 'is thinking...',
    apiKeyMissing: 'API key missing',
    apiKeyMissingInstruction: 'Set VITE_DEEPSEEK_API_KEY in webview-ui/.env.local, or save it once in local browser storage.',
    localApiKeySettings: 'Local API key settings',
    apiKeyLabel: 'DeepSeek API key',
    saveLocally: 'Save locally',
    savedLocally: 'saved locally',
    clearSavedKey: 'Clear saved key',
    expeditionTitle: 'Peach Blossom Spring: Dispatchable Thinking Life Simulator',
    templateSimulation: 'Template Simulation',
    expeditionDescription: 'Dispatch your mission into Peach Blossom Spring and let NPCs collide through memory, extrapolation, and speculation.',
    expeditionPlayerSummary: 'Expedition avatar',
    expeditionConstraints: 'Constraints',
    expeditionSkills: 'Skills',
    expeditionNoConstraints: 'none declared',
    expeditionMission: 'Mission',
    expeditionMaxRounds: 'Max rounds',
    expeditionSelectedNpcs: 'Selected NPCs',
    expeditionRun: 'Send the Mr. WHY',
    expeditionRunning: 'Mr. WHY is away...',
    expeditionLiveLog: 'Live Event Log',
    expeditionNoEvents: 'No expedition events yet.',
    expeditionRound: 'Round',
    expeditionChallenge: 'Challenge',
    expeditionLead: 'Lead',
    expeditionNextQuestion: 'Next question',
    expeditionReport: 'Expedition Report',
    expeditionOriginalMission: 'Original mission',
    expeditionInterpretedMission: 'Interpreted mission',
    expeditionEmergentDirection: 'Emergent direction',
    expeditionKeyEncounters: 'Key Encounters',
    expeditionNpcDisagreements: 'NPC Disagreements',
    expeditionBlindSpots: 'Blind Spots',
    expeditionNextActions: 'Concrete Next Actions',
    expeditionFollowUpQuestions: 'Follow-Up Questions',
    expeditionResearchLeads: 'Open-Call / Research Leads',
    encounterFrictionCircle: 'Friction circle',
    encounterFieldTest: 'Field test',
    encounterNightKitchenArgument: 'Night kitchen argument',
    encounterArchiveDetour: 'Archive detour',
    encounterPrototypeOmen: 'Prototype omen',
    abaoEncounterTitle: 'Abao storyteller encounter',
    abaoEncounterHint: 'When you enter Abao’s range, the map opens into a storytelling split scene. Tap the character bubble to talk.',
    hatchEnter: 'Hatch & Enter',
    dispatchPetOnly: 'Dispatch Pet Only',
    dispatchArchive: 'Dispatch Archive',
    localDispatchRecords: 'Local Dispatch Records',
    active: 'Active',
    hibernating: 'Hibernating',
    archived: 'Archived',
    fieldNotes: 'Field Notes',
    petReturnedNotes: 'Your pet returned with {count} field notes.',
    localOnlyNotice: 'This version stores dispatch records locally. Cross-user sync requires a future server backend.',
    smallCircleEvent: 'A small circle of question-pets begins exchanging failed attempts.',
    hibernationEvent: 'Some question-pets slip into the grass to hibernate, waiting to be recalled.',
    worldResonanceEvent: 'Peach Blossom Spring briefly becomes a network that answers itself.',
    observerMode: 'No-avatar browse mode',
    stats: 'Stats',
    status: 'Status',
    skill: 'Skill',
    sendFieldNote: 'Leave field note',
    fieldNotePlaceholder: 'Write a short field note...',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',

  },
};

export const LANGUAGE_STORAGE_KEY = 'pbs.settings.language';

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
