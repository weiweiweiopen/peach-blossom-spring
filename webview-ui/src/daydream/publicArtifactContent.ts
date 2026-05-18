import type { DaydreamReport, SourceCard } from "./engine.js";
import type { ResearchTopicCandidate } from "./researchTopics.js";

export interface DaydreamPublicArtifactSection {
  id: string;
  title: string;
  body: string;
  pullQuote?: string;
}

export interface DaydreamPublicArtifactProtocolItem {
  title: string;
  body: string;
}

export interface DaydreamPublicArtifactContent {
  schemaVersion: "daydream-public-artifact-v1";
  seed: string;
  title: string;
  subtitle: string;
  opening: string;
  proposition: string;
  sections: DaydreamPublicArtifactSection[];
  protocol: DaydreamPublicArtifactProtocolItem[];
  quietCaveat?: string;
  privateTrace: {
    sourceTrail: Array<Pick<SourceCard, "id" | "title" | "url" | "source">>;
    terms: string[];
    relationPattern?: ResearchTopicCandidate["relationPattern"];
    maturityScore?: number;
    relationPaths: Array<{ from: string; to: string; relation: string }>;
  };
  approvedForPublicLayout: boolean;
}

const PROCESS_LANGUAGE = /\b(workflow|debug|sourceCards|categoryGraph|corpusManifest|selectedTopic|researchTopics|outputPlan|depthScore|POTENTIAL TOPIC|Source:|Excerpt|Content)\b|工作流|偵錯|來源卡|原始摘錄|問題如何形成|閱讀路線|第二層深讀|關係場|輸出形式|閱讀依據|深度門檻|校正頁/i;

export function buildPublicArtifactContent(params: {
  seed: string;
  report: DaydreamReport;
  selectedTopic?: ResearchTopicCandidate;
  evidenceCards: SourceCard[];
}): DaydreamPublicArtifactContent {
  const { seed, report, selectedTopic, evidenceCards } = params;
  const sourceTrail = dedupeCitations([
    ...(selectedTopic?.evidenceTrail ?? []),
    ...evidenceCards.map(citationFor),
  ]).slice(0, 10);
  const signals = extractPublicSignals(seed, report, selectedTopic, evidenceCards);
  const concept = nameConcept(signals);
  const artifact: DaydreamPublicArtifactContent = {
    schemaVersion: "daydream-public-artifact-v1",
    seed,
    title: concept.title,
    subtitle: concept.subtitle,
    opening: buildOpening(signals),
    proposition: buildProposition(signals),
    sections: buildSections(signals),
    protocol: buildProtocol(signals),
    quietCaveat: buildQuietCaveat(signals, selectedTopic, report),
    privateTrace: {
      sourceTrail,
      terms: signals.terms,
      relationPattern: selectedTopic?.relationPattern,
      maturityScore: selectedTopic?.maturityScore,
      relationPaths: signals.relationPaths,
    },
    approvedForPublicLayout: false,
  };

  validatePublicArtifactContent(artifact);
  artifact.approvedForPublicLayout = isPublicationDepthReady(report);
  return artifact;
}

function isPublicationDepthReady(report: DaydreamReport): boolean {
  // Public Daydream output is allowed to be speculative and emergent. The gate
  // blocks empty/thin retrieval, not every absence of academic-grade traversal.
  // A separate warning/caveat can carry uncertainty into the artifact voice.
  const thinRatio = report.depthMetrics.directMatches + report.depthMetrics.deepReadExpansions > 0
    ? report.depthMetrics.cardsWithThinExtracts / (report.depthMetrics.directMatches + report.depthMetrics.deepReadExpansions)
    : 1;

  return report.depthMetrics.depthScore >= 40 &&
    report.depthMetrics.directMatches >= 4 &&
    report.depthMetrics.deepReadExpansions >= 3 &&
    thinRatio <= 0.9 &&
    !report.depthMetrics.warnings.some((warning) => /No second-layer|below publication/i.test(warning));
}

export function validatePublicArtifactContent(artifact: DaydreamPublicArtifactContent): void {
  const visible = [
    artifact.title,
    artifact.subtitle,
    artifact.opening,
    artifact.proposition,
    artifact.quietCaveat ?? "",
    ...artifact.sections.flatMap((section) => [section.title, section.body, section.pullQuote ?? ""]),
    ...artifact.protocol.flatMap((item) => [item.title, item.body]),
  ].join("\n");

  if (PROCESS_LANGUAGE.test(visible)) {
    throw new Error("Daydream public artifact still contains workflow/process/source/debug language.");
  }
  if (artifact.sections.length < 4) {
    throw new Error("Daydream public artifact needs at least four public-facing sections.");
  }
  if (artifact.protocol.length < 3) {
    throw new Error("Daydream public artifact needs at least three public-facing protocol items.");
  }
  const shortSection = artifact.sections.find((section) => section.body.trim().length < 90);
  if (shortSection) {
    throw new Error(`Daydream public section is too thin: ${shortSection.id}`);
  }
}

interface PublicSignals {
  seed: string;
  terms: string[];
  systems: string[];
  sourceTitles: string[];
  sourceSnippets: string[];
  hasSound: boolean;
  hasWearable: boolean;
  hasTextile: boolean;
  hasSensor: boolean;
  hasWorkshop: boolean;
  hasBio: boolean;
  hasGene: boolean;
  hasLocalPlace: boolean;
  relationPaths: Array<{ from: string; to: string; relation: string }>;
  relationPattern?: ResearchTopicCandidate["relationPattern"];
}

function extractPublicSignals(
  seed: string,
  report: DaydreamReport,
  selectedTopic: ResearchTopicCandidate | undefined,
  evidenceCards: SourceCard[],
): PublicSignals {
  const text = [
    seed,
    ...report.keywords,
    ...(selectedTopic?.knowledgeSystems ?? []),
    selectedTopic?.researchQuestion ?? "",
    selectedTopic?.whyInteresting ?? "",
    ...evidenceCards.flatMap((card) => [card.title, card.excerpt, ...(card.keywords ?? []), ...(card.tags ?? []), ...(card.categories ?? [])]),
  ].join(" ").toLowerCase();
  const terms = dedupeStrings([
    ...report.keywords,
    ...(selectedTopic?.firstReadingRoute ?? []),
    ...evidenceCards.flatMap((card) => [...(card.keywords ?? []), ...(card.tags ?? [])]),
  ]).filter((term) => isPublicTerm(term)).slice(0, 14);
  return {
    seed,
    terms,
    systems: selectedTopic?.knowledgeSystems?.length ? selectedTopic.knowledgeSystems : inferSystems(evidenceCards),
    sourceTitles: dedupeStrings(evidenceCards.map((card) => card.title)).slice(0, 8),
    sourceSnippets: evidenceCards.map((card) => cleanSnippet(card.excerpt)).filter(Boolean).slice(0, 8),
    hasSound: /sound|audio|聲音|聲響/.test(text),
    hasWearable: /wearable|wearables|穿戴/.test(text),
    hasTextile: /textile|textiles|fabric|cloth|布料|紡織|織物|e-textile/.test(text),
    hasSensor: /sensor|sensors|感測|傳感/.test(text),
    hasWorkshop: /workshop|workshops|工作坊|教學/.test(text),
    hasBio: /bio|biology|bioart|wetlab|gene|genetic|bacteria|hackteria|生物|基因|濕實驗/.test(text),
    hasGene: /gene|genetic|synthetic|基因|合成生物|改造/.test(text),
    hasLocalPlace: /local|place|city|mapping|field|地方|田野|城市/.test(text),
    relationPaths: report.linkedCards
      .filter((trail) => trail.via.length >= 2)
      .map((trail) => ({
        from: trail.via[0]?.title ?? "",
        to: trail.card.title,
        relation: trail.relation,
      }))
      .slice(0, 16),
    relationPattern: selectedTopic?.relationPattern,
  };
}

function nameConcept(signals: PublicSignals): { title: string; subtitle: string } {
  if (signals.hasBio && signals.hasSound && signals.hasGene) {
    return {
      title: "Mutant Sound Interfaces",
      subtitle: "從合成生物學給藝術家與設計師的入口，轉向聲音、電子介面與視覺形式如何學會變異。",
    };
  }
  if (signals.hasSound && signals.hasWorkshop) {
    return {
      title: "Soft Sound Commons",
      subtitle: "柔性聲音裝置不是個人 gadget，而是一種讓身體、維修與聆聽暫時共享的公共協定。",
    };
  }
  if (signals.hasTextile && signals.hasSensor) {
    return {
      title: "可縫補的感測協定",
      subtitle: "當感測器進入布料，它不只偵測身體，也把同意、修補與共同記錄縫進材料裡。",
    };
  }
  if (signals.hasBio && signals.hasWorkshop) {
    return {
      title: "濕實驗室的民間手勢",
      subtitle: "生物技術在社群工作坊裡不先成為奇觀，而先成為安全、教學與共同照護的練習。",
    };
  }
  if (signals.hasLocalPlace) {
    return {
      title: "地方可以被重新接線",
      subtitle: "場所不是背景，而是工具、記憶、材料和行動互相留下索引的介面。",
    };
  }
  return {
    title: "尚未命名的共同問題",
    subtitle: "玩家給出的 seed 在社群筆記裡找到一組相互靠近、但還沒有被正式命名的實作關係。",
  };
}

function buildOpening(signals: PublicSignals): string {
  const sourceWorld = sourceWorldSentence(signals);
  if (signals.hasBio && signals.hasSound && signals.hasGene) {
    const pathText = relationPathSentence(signals);
    return `${sourceWorld} ${pathText} 這條路線不是把 DNA 直接轉成旋律，而是把「生命可以被設計」這件事，推向聲音介面、柔性電路與視覺形式的變異問題。`;
  }
  if (signals.hasSound && signals.hasWorkshop) {
    return `${sourceWorld} 這些頁面讓聲音離開「輸出效果」的位置，變成一種組織人的方法：誰願意被聽見，誰保留安靜，誰在裝置壞掉時一起修。`;
  }
  if (signals.hasTextile && signals.hasSensor) {
    return `${sourceWorld} 這些材料把感測器從硬殼零件帶進柔軟的表面；它開始貼近皮膚、衣物與手作，也因此必須重新處理身體資料、接觸邊界與維修責任。`;
  }
  return `${sourceWorld} 這些來源沒有給出一個完成答案，而是把一組原本分散的工具、場所與動作推到一起，露出一個可以繼續追問的共同問題。`;
}

function buildProposition(signals: PublicSignals): string {
  if (signals.hasBio && signals.hasSound && signals.hasGene) return "基因改造在這裡不是題材裝飾，而是一種形式問題：圖像、聲音與介面都可能被轉錄、突變、污染與重寫。";
  if (signals.hasSound && signals.hasWorkshop) return "聲音不是成果；聲音是共同體形成時留下的痕跡。";
  if (signals.hasTextile && signals.hasSensor) return "感測不是收集資料，而是把接觸變成一份可以被拒絕、修補、重寫的協議。";
  if (signals.hasBio && signals.hasWorkshop) return "民間生物實作的重點不是打開危險邊界，而是把安全、好奇與照護放在同一張桌上。";
  return "Daydream 不是預言成品，而是把還沒被命名的關係暫時排成可閱讀的形式。";
}

function buildSections(signals: PublicSignals): DaydreamPublicArtifactSection[] {
  if (signals.hasBio && signals.hasSound && signals.hasGene) {
    const paths = signals.relationPaths;
    const absurdPath = pathPhrase(paths, /Synthetic Biology|ArtScienceBangalore|Mukund/i, /Absurd Musical Interfaces|The Sound of Nature|Knitting, hacking, hanging, sound/i);
    const softPath = pathPhrase(paths, /Synthetic Biology|ArtScienceBangalore/i, /Toy Piano|Beautiful Circuits|Soft & Tiny|E-Textile/i);
    return [
      {
        id: "bioart-entry",
        title: "合成生物學先是一個藝術家的入口",
        body: "Synthetic Biology for Artists and Designers 這組頁面把基因、設計與藝術教育放在同一個房間裡。它對視覺創作者有用的地方，不是提供一個科學題材，而是提出一種形式條件：生命材料不是穩定物件，而是會被培養、複製、污染、失控與重新命名的系統。",
        pullQuote: "當生命被當成可設計材料，形式就不再只是造型，而變成一套會變異的規則。",
      },
      {
        id: "path-to-sound",
        title: "聲音案例要沿著入口讀，而不是平面列舉",
        body: `${absurdPath || "Absurd Musical Interfaces、The Sound of Nature、Knitting, hacking, hanging, sound 這類案例"}讓聲音不再只是電子音樂案例。它變成一種把自然、身體與系統變化轉成可感知介面的方式。這裡的關鍵不是「找一首基因音樂」，而是看見生命系統如何借用聲音來顯示自己的不穩定。`,
      },
      {
        id: "visual-translation",
        title: "對視覺創作者來說，聲音是一種會變異的圖像",
        body: "如果聲音介面來自生物藝術的問題意識，它就不是配樂，而是圖像的另一種時間結構。頻率、雜訊、觸發、延遲與錯誤，都可以被視為突變的痕跡。視覺工作不必把基因畫成螺旋，而可以把轉錄、重組、失敗與污染變成版面、動畫或互動規則。",
      },
      {
        id: "soft-electronic-bridge",
        title: "柔性電路把基因想像帶回身體與工作坊",
        body: `${softPath || "Toy Piano T-shirt workshop、Beautiful Circuits、Soft & Tiny Arduino Workshop 這些案例"}把電子聲音拉回布料、接線、穿戴與共同製作。這使基因改造不只是遠方實驗室的想像，而是一個關於介面如何被人觸摸、修改和誤用的問題。作品可以是一台樂器，也可以是一套讓圖像與聲音一起突變的工作坊 protocol。`,
      },
    ];
  }
  if (signals.hasSound && signals.hasWorkshop) {
    return [
      {
        id: "sound-as-gathering",
        title: "聲音不是 output，而是聚會的方法",
        body: "可穿戴聲音頁、聲響紡織實驗與工作坊筆記被放在一起時，聲音不再只是作品最後發出的效果。它變成一種分工方式：有人觸發，有人聆聽，有人修接點，有人記錄失敗。裝置越柔軟，社群規則就越需要被說清楚。",
        pullQuote: "一個小小的聲音觸發，可以把電路圖改寫成多人協作的行動譜。",
      },
      {
        id: "body-as-interface",
        title: "身體不是感測材料，而是有選擇權的接口",
        body: "穿戴裝置容易把身體當成現成輸入，但社群筆記裡反覆出現的手作、工作坊與文件化提醒我們：身體不是材料庫。真正有趣的問題是，參與者能不能決定自己何時發聲、何時安靜、何時退出記錄。",
      },
      {
        id: "repair-as-public-memory",
        title: "故障應該留下來，而不是被藏起來",
        body: "柔性電路會鬆、會斷、會雜訊。這些失敗如果只被視為技術問題，工作坊就會失去它最珍貴的公共記憶。斷線、短路、音量太小、身體不舒服，都應該成為下一張筆記的內容。",
      },
      {
        id: "commons-score",
        title: "工作坊可以是一份 commons score",
        body: "這個題目最後不必先變成一件完美作品。它更適合變成一份可以被 fork 的 score：材料怎麼選、誰可以不參與、聲音如何被記錄、失敗如何回寫。每次實作都為下一次聚會留下更細的協定。",
      },
    ];
  }

  if (signals.hasTextile && signals.hasSensor) {
    return [
      {
        id: "soft-interface",
        title: "布料讓感測器變成身體界面",
        body: "當感測器被縫進布料，它不再只是讀取數值的零件。布料會彎曲、磨損、吸汗，也會跟穿戴者的姿勢、情緒和拒絕一起變形。這種柔軟性讓技術更靠近生活，也讓每一次接觸都需要被重新同意。",
        pullQuote: "柔軟不是風格；柔軟是一種必須讓人可以修、可以拆、可以拒絕的技術條件。",
      },
      {
        id: "lab-to-garment",
        title: "實驗室方法被翻進衣物之後，責任也被翻譯",
        body: "生物藝術、DIY 實驗室、電子紡織與 maker 工作坊共享很多工具語言，但它們面對身體時的責任並不相同。把 lab 的方法放進衣物，不只是材料轉換，也是安全、照護與社群協議的轉換。",
      },
      {
        id: "workshop-as-grammar",
        title: "工作坊不是教學活動，而是共同語法",
        body: "社群筆記裡的 workshop 不只是傳授技能。它讓陌生人用同一組材料、錯誤和問題建立暫時語法：怎麼接線、怎麼說明風險、怎麼把失敗留下。題目真正的核心在這個語法，而不只在某個裝置。",
      },
      {
        id: "wiki-return",
        title: "每個 prototype 都應該回到公共記憶",
        body: "一個感測衣物如果只留下照片，它很快就會變成靈感碎片。Daydream 讀到的可能形式，是把每次試作寫回共同文件：材料、接法、不舒服之處、失敗原因、下一個問題。這樣 prototype 才會成為社群可繼續工作的記憶。",
      },
    ];
  }

  return [
    {
      id: "unnamed-relation",
      title: "它們靠近，因為共享同一種未完成的手勢",
      body: "這組來源之間的關係不是單純相似，而是都在處理一種還沒固定名稱的實作手勢：把工具交給社群，把材料交給地方，把結果交給下一次修改。題目因此不是一個成品，而是一條可以繼續工作的關係線。",
    },
    {
      id: "tools-have-social-shape",
      title: "工具有自己的社會形狀",
      body: "工具不只改變作品，也改變誰能加入、誰能修理、誰能理解錯誤。當不同筆記反覆出現相同材料或方法時，Daydream 讀到的是一種社群形狀：它把技能、照護與公開文件綁在一起。",
    },
    {
      id: "failure-as-index",
      title: "失敗是最可靠的索引",
      body: "成功案例通常太平滑，反而不容易留下路徑。真正能讓下一個人接上的，是故障、限制、缺口與不確定。這些訊號讓題目保持開放，也讓美學不只是表面排版，而是對未完成狀態的承認。",
    },
    {
      id: "public-form",
      title: "公共形式比完成答案更重要",
      body: "這份 Daydream 的結果不應急著變成結論。它應該成為一份能被帶走、修改和回寫的公共形式：小誌、score、protocol 或 wiki 頁都可以，只要它能讓下一個人繼續這條尚未命名的線。",
    },
  ];
}

function buildProtocol(signals: PublicSignals): DaydreamPublicArtifactProtocolItem[] {
  if (signals.hasBio && signals.hasSound && signals.hasGene) {
    return [
      { title: "不要先找作品清單", body: "先把每個聲音案例問成一條路徑：它是從哪個生物藝術、合成生物學或設計教育問題長出來的？" },
      { title: "把基因當形式規則", body: "不要只畫 DNA；試著把轉錄、突變、污染、修復、沉默這些操作變成聲音與圖像的共同語法。" },
      { title: "讓聲音留下視覺痕跡", body: "把雜訊、觸發與錯誤轉成譜面、圖像介面或可變版面，讓觀眾看見系統如何變化。" },
      { title: "保留不確定性", body: "這條路線容許概念跳躍，但每個跳躍都要能回到某一條來源路徑，而不是只靠風格聯想。" },
    ];
  }
  if (signals.hasSound && signals.hasWorkshop) {
    return [
      { title: "靜默權", body: "每個參與者先選擇是否發聲、被感測、被錄音；拒絕不是缺席，而是作品的一部分。" },
      { title: "身體作為接口", body: "用鈕扣、布料、導電線、彎曲或接觸製作最小聲音觸發，不追求穩定表演，追求可解釋的關係。" },
      { title: "公共維修", body: "把斷線、雜訊、短路與不舒服公開記錄，讓故障成為下一次聚會的材料。" },
      { title: "寫回共同記憶", body: "每次結束留下一張可追溯筆記：材料、接法、失敗、拒絕、聲音記憶與下一個問題。" },
    ];
  }
  if (signals.hasTextile && signals.hasSensor) {
    return [
      { title: "先問接觸", body: "感測前先確認身體邊界：哪裡可以被觸發、哪裡不可被記錄、什麼狀況下可以停止。" },
      { title: "讓接點可拆", body: "把導電線、按扣、布料與控制板做成可以拆卸的關係，讓修補與退出都成為設計的一部分。" },
      { title: "留下錯誤樣本", body: "不要只保存成功電路；也保存鬆動、誤觸、雜訊和穿戴不適，作為下一次設計的公共資料。" },
      { title: "把 prototype 變成筆記", body: "每個試作都回到共同文件，記下材料來源、身體感受、風險邊界與下一個可測問題。" },
    ];
  }
  return [
    { title: "保留未命名", body: "不要急著把題目變成作品名稱；先保留它作為一條可以被多人接續的問題線。" },
    { title: "只公開可分享的部分", body: "把工具、方法、限制與下一步公開；把個人資料、敏感紀錄與未同意內容留在外面。" },
    { title: "把失敗寫清楚", body: "讓下一個人知道哪些地方不穩、哪些假設太快、哪些來源還需要補讀。" },
  ];
}

function buildQuietCaveat(
  signals: PublicSignals,
  selectedTopic: ResearchTopicCandidate | undefined,
  report: DaydreamReport,
): string | undefined {
  if (signals.hasBio) return "如果實作牽涉活體、生物材料、基因改造或濕實驗，這份 Daydream 只能停在閱讀、倫理討論與非活體 prototype；任何實驗都需要正式安全審查。";
  if ((selectedTopic?.maturityScore ?? 100) < 45 || report.depthMetrics.warnings.length > 0) {
    return "這是一個還在形成中的題目；它適合先作為小誌或工作坊 score 被測試，而不是被宣稱為完成研究。";
  }
  return undefined;
}

function relationPathSentence(signals: PublicSignals): string {
  const titles = signals.relationPaths
    .filter((path) => path.to)
    .map((path) => path.to);
  if (titles.some((title) => /Absurd Musical Interfaces|The Sound of Nature|Knitting, hacking, hanging, sound/i.test(title))) {
    return "幾個聲音與介面案例讓合成生物學的問題換了一種媒介出現。";
  }
  if (titles.some((title) => /Toy Piano|Beautiful Circuits|Soft & Tiny|E-Textile/i.test(title))) {
    return "一些柔性電路與穿戴聲音案例把生命設計的想像拉回身體、材料與手作介面。";
  }
  return "幾個延伸案例讓生物藝術的問題從理論入口移到聲音、介面與視覺方法。";
}

function pathPhrase(
  paths: Array<{ from: string; to: string; relation: string }>,
  _fromPattern: RegExp,
  toPattern: RegExp,
): string | undefined {
  const path = paths.find((item) => toPattern.test(item.to));
  if (!path) return undefined;
  return `${path.to} 這類案例`;
}

function sourceWorldSentence(signals: PublicSignals): string {
  const titles = signals.sourceTitles.filter((title) => !/no plaintext extract/i.test(title)).slice(0, 4);
  if (titles.length === 0) return "社群筆記裡的幾個片段被放在同一張桌上。";
  if (titles.length === 1) return `從 ${titles[0]} 開始，社群筆記露出一個比單一作品更大的問題。`;
  return `從 ${titles.slice(0, -1).join("、")} 到 ${titles.at(-1)}，社群筆記露出一個比單一作品更大的問題。`;
}

function cleanSnippet(input: string): string {
  return input
    .replace(/\bSource:\s*https?:\/\/\S+/gi, "")
    .replace(/\(No plaintext extract returned[^)]*\)/gi, "")
    .replace(/Imported:\s*\d{4}[^.。]*/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isPublicTerm(term: string): boolean {
  const normalized = term.toLowerCase().trim();
  if (normalized.length < 2) return false;
  return !/^(source|content|workflow|debug|api|mediawiki|relationship|layer|imported|pages|with|found|none|unknown)$/.test(normalized);
}

function inferSystems(cards: SourceCard[]): string[] {
  return dedupeStrings(cards.map((card) => card.source ?? "社群筆記")).slice(0, 4);
}

function citationFor(card: SourceCard): Pick<SourceCard, "id" | "title" | "url" | "source"> {
  return { id: card.id, title: card.title, url: card.url, source: card.source };
}

function dedupeCitations<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  return result;
}

function dedupeStrings(items: string[]): string[] {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}
