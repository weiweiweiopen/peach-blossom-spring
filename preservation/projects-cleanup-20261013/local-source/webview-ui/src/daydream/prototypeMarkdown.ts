import type { DaydreamCorpus, DaydreamReport, SourceCard } from "./engine.js";
import type { SemanticVectorContext } from "./connectedPapers.js";
import { buildSemanticVectorContext } from "./connectedPapers.js";
import { generateDaydreamReport } from "./engine.js";
import { generateResearchTopicCandidates, type ResearchTopicCandidate } from "./researchTopics.js";

export interface PrototypeWikiPage {
  fileTitle: string;
  markdown: string;
  llmPrompt: string;
  report: DaydreamReport;
  semanticContext: SemanticVectorContext;
  researchTopics: ResearchTopicCandidate[];
}

interface CardMapping {
  card: SourceCard;
  perceptionTargets: string[];
}

interface ProjectBlueprint {
  concept: string;
  materials: string[];
  roles: string[];
  setting: string;
  output: string;
  workshopScore: string[];
  executionSteps: string[];
  documentationFields: string[];
}

type EditorialSourceType = "article" | "interview" | "workshop" | "artwork" | "tool" | "event" | "organization" | "note";

function renderEditorialSourcePreprocessBlock(card: SourceCard, index: number): string {
  const observations = concreteObservationsFor(card).map((item) => ` - ${item}`).join("\n") || " - 來源摘錄太薄；只能作為弱線索。";
  const potentials = interpretivePotentialFor(card).map((item) => ` - ${item}`).join("\n") || " - 可作為旁支語境，不應作為主要論證支柱。";
  const risks = sourceRisksFor(card).map((item) => ` - ${item}`).join("\n");
  const url = card.url ? `\nurl: ${card.url}` : "";

  return `source ${index + 1}\ntitle: ${card.title}\nsourceType: ${sourceTypeFor(card)}\nstrength: ${sourceStrengthFor(card)}${url}\nconcreteObservations:\n${observations}\ninterpretivePotential:\n${potentials}\nrisk:\n${risks || " - 不要把來源標題擴寫成來源中沒有的成果。"}`;
}

function sourceTypeFor(card: SourceCard): EditorialSourceType {
  const text = `${card.title} ${card.excerpt} ${(card.keywords ?? []).join(" ")} ${(card.categories ?? []).join(" ")} ${(card.sourceCategories ?? []).join(" ")}`.toLowerCase();
  if (/interview|conversation|訪談|對談/.test(text)) return "interview";
  if (/workshop|course|class|school|工作坊|課程/.test(text)) return "workshop";
  if (/festival|symposium|conference|hackathon|event|camp|展演|活動/.test(text)) return "event";
  if (/tool|software|kicad|arduino|pcb|kit|工具/.test(text)) return "tool";
  if (/organization|collective|network|lab|組織|社群/.test(text)) return "organization";
  if (/project|artwork|installation|performance|作品|裝置|表演/.test(text)) return "artwork";
  if (/essay|article|theory|primer|overview|文章|理論/.test(text)) return "article";
  return "note";
}

function concreteObservationsFor(card: SourceCard): string[] {
  const excerpt = cleanEditorialExcerpt(card.excerpt);
  const observations: string[] = [];
  const datePlace = excerpt.match(/(?:\b\d{1,2}[–\- ]?\d{1,2}\w*\s+\w+\s+\d{4}\b|\b\w+\s+\d{1,2}\w*\s+\d{4}\b|\b\d{4}\b|[A-Z][A-Za-z .'-]+(?:University|School|Center|Centre|Lab|Atelier|Festival|College|Institute)[A-Za-z .'-]*)/u)?.[0];
  if (datePlace) observations.push(`來源明確出現時間、地點或機構線索：${datePlace}。`);

  const materialTerms = [
    "Arduino", "KiCAD", "PCB", "toy piano", "wearable", "electronic textile", "e-textile", "fabric", "sensor", "circuit", "sound", "bacteria", "synthetic biology", "bio", "microscopy", "workshop", "hackathon", "interview", "performance", "installation",
  ];
  const found = materialTerms.filter((term) => new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(excerpt));
  if (found.length > 0) observations.push(`明確材料／媒介／形式：${found.slice(0, 8).join("、")}。`);

  const sentence = excerpt.split(/(?<=[.!?。])\s+/u).find((item) => item.length > 60 && !/No plaintext extract returned|relationship layer Imported/i.test(item));
  if (sentence) observations.push(`可用片段：${sentence.slice(0, 260)}${sentence.length > 260 ? "…" : ""}`);

  if ((card.sourceCategories ?? []).length > 0) observations.push(`來源分類：${(card.sourceCategories ?? []).slice(0, 4).join("、")}。`);
  if ((card.semanticTopics ?? []).length > 0) observations.push(`語義主題提示：${(card.semanticTopics ?? []).slice(0, 4).map((topic) => topic.topic).join("、")}。`);

  return observations.slice(0, 5);
}

function interpretivePotentialFor(card: SourceCard): string[] {
  const text = `${card.title} ${card.excerpt} ${(card.keywords ?? []).join(" ")} ${(card.semanticTopics ?? []).map((topic) => topic.topic).join(" ")}`.toLowerCase();
  const potentials: string[] = [];
  if (/workshop|course|hackathon|school/.test(text)) potentials.push("可用來討論知識如何透過工作坊、課程或短期活動變成方法。 ");
  if (/sound|audio|music|sonic/.test(text)) potentials.push("可用來討論不可見系統如何被聽見、觸發或干擾。 ");
  if (/textile|fabric|wearable|sensor|circuit|arduino|pcb|kicad/.test(text)) potentials.push("可用來討論材料、電路、身體與介面如何互相改寫。 ");
  if (/bio|biology|bacteria|synthetic|gene|microscopy/.test(text)) potentials.push("可用來討論生命系統、控制、照護、突變或安全邊界如何成為形式問題。 ");
  if (/organization|network|community|commons|collective|lab/.test(text)) potentials.push("可用來討論技術背後的社群關係、維持方式與組織壓力。 ");
  return potentials.slice(0, 4);
}

function sourceStrengthFor(card: SourceCard): "high" | "medium" | "weak" {
  const excerpt = card.excerpt ?? "";
  if (/No plaintext extract returned|No internal links\/categories found|relationship layer Imported/i.test(excerpt) && excerpt.length < 900) return "weak";
  if (excerpt.length >= 650) return "high";
  if (excerpt.length >= 360) return "medium";
  return "weak";
}

function sourceRisksFor(card: SourceCard): string[] {
  const risks: string[] = [];
  const type = sourceTypeFor(card);
  const strength = sourceStrengthFor(card);
  if (strength === "weak") risks.push("來源內容偏薄；不要把標題或語義提示寫成已被來源充分支持的事實。 ");
  if (type === "workshop") risks.push("不要把工作坊、課程或 hackathon 誤寫成完成藝術作品。 ");
  if (type === "tool") risks.push("不要把工具文件誤寫成作品成果；應聚焦它提供的方法或限制。 ");
  if (type === "interview") risks.push("不要把個人經驗改寫成普遍真理；應保留觀點性。 ");
  return risks;
}

function cleanEditorialExcerpt(input: string | undefined): string {
  return (input ?? "")
    .replace(/\bSource:\s*https?:\/\/\S+/gi, " ")
    .replace(/\(No plaintext extract returned[^)]*\)/gi, " ")
    .replace(/Imported:\s*\d{4}[^.。]*/gi, " ")
    .replace(/Hackteria relationship layer/gi, " ")
    .replace(/Original wiki links/gi, " ")
    .replace(/\[\[Sources\/[^\]]+\]\]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}


export function generatePrototypeWikiPage(seed: string, corpus: DaydreamCorpus): PrototypeWikiPage {
  const report = generateDaydreamReport(seed, corpus);
  const evidenceCards = dedupeCards([
    ...report.matchedCards,
    ...report.linkedCards.map((trail) => trail.card),
    ...report.expandedCards,
    ...report.deepReadCards,
  ]).slice(0, 18);
  const semanticContext = buildSemanticVectorContext(corpus, evidenceCards);
  const mappings = evidenceCards.map((card) => ({
    card,
    perceptionTargets: perceptionTargetsForCard(card, corpus),
  }));
  const researchTopics = generateResearchTopicCandidates(report, semanticContext);
  const projectTitle = buildProjectTitle(report);
  const blueprint = buildProjectBlueprint(seed, report, evidenceCards);

  return {
    fileTitle: slugify(projectTitle),
    report,
    semanticContext,
    researchTopics,
    markdown: renderMarkdown(projectTitle, seed, report, mappings, blueprint, semanticContext, researchTopics),
    llmPrompt: renderEmergentLlmPrompt(projectTitle, seed, report, mappings, semanticContext, researchTopics),
  };
}

function renderEmergentLlmPrompt(
  projectTitle: string,
  seed: string,
  report: DaydreamReport,
  mappings: CardMapping[],
  semanticContext: SemanticVectorContext,
  researchTopics: ResearchTopicCandidate[],
): string {
  const evidenceBlocks = mappings.length > 0
    ? mappings.map((mapping, index) => renderEditorialSourcePreprocessBlock(mapping.card, index)).join("\n\n")
    : "沒有找到足夠來源。請輸出較短、謹慎的 public note，不要硬湊案例或宣稱完成。";
  const semanticBlocks = renderSemanticPromptBlocks(semanticContext);

  return `# Association Universal Editorial Writing Prompt

你是 Association editorial writer。

你的任務是根據使用者原始需求與 Obsidian export 中找到的來源，寫一篇可公開閱讀的 zine essay / speculative research note。

這不是摘要工具。
這不是搜尋報告。
這不是資料庫整理。
你的任務是：讀懂來源，選出真正有用的材料，提煉一條有閱讀樂趣、啟發性、美學感的研究短文。

## 系統暫定題名（內部參考，可重寫）
${projectTitle}

## 使用者原始需求（內部理解用）
${seed}

## 你會收到的資料
- 使用者原始需求
- 來源內容摘要或摘錄
- 來源之間的語義關係
- 深讀鏈或候選題目
- 可能的概念提示

這些資料只供你內部理解與選材使用，不是文章內容。
讀者不應該看見搜尋、命中、路徑、深讀鏈、候選題目、資料欄位、source map、workflow 或任何後台整理痕跡。

重要：
你可以使用來源之間的關係來理解材料之間的概念張力，但正文中不要說明材料是如何被找到的，也不要說明某個案例為何被選入文章。
讀者只需要看到：這些材料如何共同推動一個問題。

## Preprocessed source cards（內部選材用；不要把欄位名稱寫進正文）
${evidenceBlocks}

## Internal relation hints（只供理解概念張力；不要外顯）
${renderEditorialRelationPathsPrompt(report)}

## Additional readable material（只供補充具體觀察；不要外顯欄位名）
${renderDeepReadPrompt(report)}

## Semantic context and topic hints（只供內部判斷；不要外顯）
${semanticBlocks}

${renderResearchTopicsPrompt(researchTopics)}

## 內部寫作流程
在寫作前，請先在內部判斷以下五件事，但不要輸出這個分析過程：

1. 使用者真正想找的是什麼？可能是案例、理論、方法、靈感、創作方向、研究題目、作品參考、社群脈絡或技術線索。
2. 這次文章的核心概念軸是什麼？請根據使用者需求與來源內容自行推導。不要套用固定主題。
3. 使用者的位置是什麼？可能是視覺創作者、音樂人、研究者、策展人、設計師、工程師、社群組織者、學生或其他角色。文章要讓這個位置的人讀完後知道：這些來源如何轉化成自己的方法。
4. 哪些來源真的有用？不要平均使用所有來源。選出 3–5 個最能推動文章問題的來源。如果高品質來源少於 3 個，就寫短一點，不要硬湊。
5. 這篇文章的中心命題是什麼？文章需要有一個清楚的觀察，而不是一串案例摘要。實際命題必須根據本次來源生成。

## 寫作目標
文章應該像一位作者讀過這些來源後，為讀者提煉出一條有用的思考線索。

要寫成：
- 可公開閱讀的 zine essay
- 由具體案例推動的 speculative research note
- 給使用者所在創作／研究位置的概念轉譯文章
- 有美學感，但不空泛
- 有推測性，但不亂編

不要寫成：
- 搜尋過程報告
- source list
- workflow 說明
- traversal 解釋
- 每個頁面的摘要
- prompt 規則的外顯版本
- 「我如何找到這些文章」的紀錄
- 系統產生文章的自我說明
- 技術輸出備註
- 草稿狀態說明

## 選材規則
1. 不要平均使用所有來源。只使用最能推動文章命題的來源。
2. 每個被使用的來源，必須至少提取一個具體觀察。具體觀察可以是：作品實際處理了什麼材料；活動或組織實際採用了什麼形式；使用了什麼介面、身體、聲音、電路、生物材料、資料、空間、社群方法或教育方法；來源中出現了什麼明確的案例、人物、地點、衝突、問題或工作方式；這個來源如何讓某個抽象問題變得可感、可做、可討論。
3. speculative interpretation 最多約 20%。每個推測性說法之前，必須先有具體來源觀察作為支點。
4. 如果某個來源只提供很弱的連結，不要硬寫成強案例。可以用較謹慎的語氣，例如「可以被讀作……」「提供了一種方法……」「讓問題轉向……」「比較像是一個旁支線索……」。
5. 來源關係只能用來幫助你理解材料之間的概念張力。不要用 from / to / path / 第一層 / 第二層 等格式寫給讀者看。

## 來源忠實規則
1. 只有來源摘錄或來源摘要中明確出現的資訊，可以寫成事實。
2. 語義關係、深讀鏈、候選題目、reasoning hint 只能用來輔助概念解讀，不可直接當成事實來源。
3. 不要替來源補上沒有出現的材料、技術流程、作者意圖、展示脈絡或成果。
4. 不要把 workshop、短講、課程、網頁、工具文件、訪談、組織介紹自動升級成完整藝術作品。
5. 如果來源是訪談，要尊重它的語氣與立場。不要把受訪者的個人經驗改寫成普遍真理。可以把它寫成一種觀點、一種經驗、一種警告或一種方法。
6. 如果來源之間存在張力或矛盾，不要抹平。好文章可以讓矛盾存在。

## 概念轉譯規則
文章的重點不是列出案例，而是說明：
1. 某個抽象問題如何在來源中變成具體形式。
2. 某個具體案例如何讓使用者重新理解自己的創作或研究方法。
3. 某個材料、活動、技術、社群或作品如何從「題材」變成「方法」。

不要寫：「A 來源導向 B 來源。」
要寫：「B 讓 A 所關心的問題換了一種媒介出現。」

不要寫：「這些來源被選入文章，因為它們都和使用者需求有關。」
要寫：「這些案例共同顯示，問題不在於找到更多工具，而在於如何讓工具暴露它背後的關係。」

## 文章結構
請依照以下結構寫作，但不要讓段落看起來像模板。

1. 標題：生成一個新的概念題目。不要直接複製來源頁標題。不要使用「ZINE DRAFT」「SPECULATIVE NOTE」「OPENING」「VISUAL」「BIOLOGY」這類模板狀態詞。
2. 開場：直接把使用者需求轉化成一個可公開閱讀的研究問題。不要提玩家、seed、搜尋、命中、來源如何被找到、社群筆記如何展開。
3. 理論／問題入口：從最能建立問題意識的來源開始。這個來源不一定是理論文章，也可以是一段訪談、一個工作坊、一個社群案例、一個作品描述或一個技術文件。重點不是介紹來源，而是說明它打開了什麼問題。
4. 案例段落：選 2–4 個最有力的案例或來源。每個案例都要先給一個具體觀察，再說它如何改變或延伸前面的問題，最後指出它對使用者所在位置有什麼方法上的啟發。
5. 方法轉譯：提出對使用者有用的轉譯方法。方法可以是創作方法、研究方法、策展方法、組織方法、技術實驗方法或觀看方法。這些方法必須來自前面的來源觀察，不可無中生有。
6. 暫定研究題或作品方向：生成一個可以繼續發展的研究題、作品方向、工作坊方向或社群行動方向。這個方向必須從前文長出來，不要突然加入新材料。
7. 結尾：提出 2–3 個可以繼續創作、研究或展開的問題。這些問題要面向行動與思考，不要面向搜尋流程。不要寫「下一步是找更多案例」這類後台句子。

## 語氣
像 public zine essay / speculative research note。但正文中不要出現「public-facing」「zine draft」「speculative note」這類生成狀態詞。
語氣可以有畫面感、有概念密度、有一點詩性、有明確觀察、有方法上的啟發、允許適度推測。
語氣不要像學術論文、工程報告、資料庫摘要、prompt 執行說明、搜尋系統介紹，或替 Association 解釋自己怎麼工作。

## 可見文字保護規則
讀者可見文本中，不得出現任何生成狀態、版型狀態、工程狀態或實作備註。
禁止包括：ZINE DRAFT、SPECULATIVE NOTE、Public-facing draft、Static HTML、No JavaScript、prototype、layout note、implementation note、dev note、generated output、rendering note、source map、research score、generated question。

章節標題必須像文章內容的一部分，而不是模板導航。不要使用：OPENING、BIOLOGY、VISUAL、NATURE、WEARABLE、CASES、SOURCES、METHOD。實際章節名稱必須根據本次主題生成，不要套用固定例子。

## 避免自我說明式句子
不要寫：本文將會……；這份筆記把幾個案例放在一起……；以下案例將說明……；我們可以看到這些來源……；這些來源在正文中作為……；這篇文章根據 traversal……；這些路徑顯示……

可以寫：在這些案例裡，……；這個問題真正有趣的地方不是……而是……；對創作者來說，這裡可用的不是題材，而是方法；技術在這裡不是工具，而是一種關係的壓力測試；材料不只是被使用，它也改變了組織方式。

## 後台語言限制
以下詞彙不得以後台、檢索、生成流程或資料結構的意思出現在正文中：workflow、traversal、graph expansion、linkedExpansions、sourceCards、secondary seed、depth score、玩家 seed、命中、第一層、第二層、from / to、relation、reasoningHint、sourceNotes、來源路徑、source paths、generated question、research score、搜尋結果、檢索過程、社群筆記如何找到、這些來源在正文裡如何使用。

注意：禁止的是這些詞作為後台流程語言。如果某個詞是本次主題或來源內容的必要概念，可以自然使用。例如農業可以使用 seed 作為「種子」，開源文化可以使用 source / open source，但不得用它們描述 Association 的資料流程或生成過程。

## 輸出格式
只輸出文章本身。
不要輸出 analysis、選材理由、source map、後台流程、搜尋過程、prompt 執行說明、技術實作備註、所有來源清單、research score、generated question、sources section。
除非使用者明確要求，否則不要加 sources section。
輸出語言應跟使用者原始需求的主要語言一致。專有名詞、作品名、組織名可以保留原文。

## 輸出前的靜默檢查
在輸出前，請自行檢查，但不要把檢查結果寫出來：
1. 文章是否真的回應了使用者需求？
2. 是否根據本次來源推導主題，而不是套用固定主題？
3. 是否選用了 3–5 個真正有用的來源，而不是平均摘要？
4. 每個主要案例是否都有具體來源觀察？
5. speculative interpretation 是否有來源支點？
6. 是否避免了搜尋、路徑、workflow、source map 等後台語言？
7. 是否沒有輸出 Static HTML、No JavaScript、ZINE DRAFT 等技術或草稿狀態？
8. 章節標題是否像文章，而不是模板導航？
9. 是否沒有把 workshop、短講、訪談、工具文件誤寫成完整藝術作品？
10. 結尾問題是否面向創作、研究或行動，而不是面向搜尋流程？

如果不符合，請在輸出前自行重寫。
`;
}

function renderMarkdown(
  projectTitle: string,
  seed: string,
  report: DaydreamReport,
  mappings: CardMapping[],
  blueprint: ProjectBlueprint,
  semanticContext: SemanticVectorContext,
  researchTopics: ResearchTopicCandidate[],
): string {
  const evidenceRows = mappings.length > 0
    ? mappings.map((mapping) => {
        const card = mapping.card;
        return `| ${escapeTable(formatKeywords(report.keywords) || "無")} | ${escapeTable(mapping.perceptionTargets.join(", ") || "無圖譜節點")} | ${escapeTable(card.title)} | ${card.id} |`;
      }).join("\n")
    : "| 沒有強關鍵詞命中 | 沒有圖譜節點 | 沒有取回 wiki 頁 | low-evidence |";

  const sourceList = mappings.length > 0
    ? mappings.map((mapping) => {
        const card = mapping.card;
        const url = card.url ? ` (${card.url})` : "";
        return `- ${card.id}: ${card.title}${url}`;
      }).join("\n")
    : "- 沒有強匹配 source card。請把此頁視為推測性草稿。";

  const futureBlocks = report.futures.map((future) => {
    const citations = future.citations.length > 0
      ? future.citations.map((card) => `${card.id}: ${card.title}`).join("; ")
      : "低證據；沒有直接來源卡引用";
    return `### ${future.title}\n${future.scenario}\n\n證據：${citations}\n信心：${translateConfidence(future.confidence)}${future.caveat ? `\n限制：${future.caveat}` : ""}`;
  }).join("\n\n");

  const materialList = blueprint.materials.map((item) => `- ${item}`).join("\n");
  const roleList = blueprint.roles.map((item) => `- ${item}`).join("\n");
  const scoreList = blueprint.workshopScore.map((item, index) => `${index + 1}. ${item}`).join("\n");
  const executionList = blueprint.executionSteps.map((item, index) => `${index + 1}. ${item}`).join("\n");
  const documentationList = blueprint.documentationFields.map((item) => `- ${item}`).join("\n");
  const semanticSection = renderSemanticMarkdownSection(semanticContext);

  return `# ${projectTitle}

Prototype 狀態：這是由 mouse1 corpus export 產生的本機 Association MVP 草稿。此檔案是一篇測試用 wiki 專案頁提案，不代表專案已經存在。

## 專案摘要
${blueprint.concept}

場域：${blueprint.setting}

預期產出：${blueprint.output}

## 原始 Seed
${seed}

## 核心問題
${report.question}

## 語句／語具解構
- 抽取出的關鍵詞／主題：${formatKeywords(report.keywords) || "無"}
- Seed 被視為一個壓縮的文化物件：可以是文字、圖像說明、策展語、歌詞或研究筆記。
- Prototype 不掃描 raw Markdown；只讀既有 export 裡的 sourceCards、categoryGraph、corpusManifest。

## 感知層映射
感知層是 seed 與本地 wiki corpus 之間的橋。流程先用關鍵詞取回 source cards，再用 categoryGraph 的 tags/categories 擴展聯想場。

| Seed 詞／感知詞 | 感知層圖譜節點 | 取回的 wiki/source page | 來源卡 ID |
| --- | --- | --- | --- |
${evidenceRows}

## 取回的 Wiki 頁面
${sourceList}

## Recursive Link Reading／深讀鏈
${renderLinkedEvidenceMarkdown(report)}

## Second-layer Text Collection／下一層文字收集
${renderDeepReadMarkdown(report)}

## Depth Gate／深度門檻
${renderDepthGateMarkdown(report)}

## Connected Papers 語義向量層
${semanticSection}

## Research Topic Generator／跨知識題目候選
${renderResearchTopicsMarkdown(researchTopics)}

## Association 四步任務
1. Corpus creation：讀 Obsidian export，建立 source cards / graph edges / manifest。
2. Recursive + second-layer reading：沿 linked pages、附件、footnote、reference 能解析到的文字再收集一次。
3. Connected-paper-like discovery：找出相似、互補、張力、轉譯、缺橋與風險關係。
4. Cross-knowledge topic generation：把關係群升級成可研究的題目與問題。
5. Zine / project output：最後才生成小誌、wiki page、workshop score 或展覽草案。

## 新 Wiki 頁面草稿
本頁提案 ${projectTitle} 作為一個公共藝術／研究專案。專案把 seed 轉化成可重複執行的 practice：參與者收集一個地方訊號，用簡單工具或身體記譜方式轉譯，再把過程發布成一篇帶有 evidence links 與 open questions 的小型 wiki 頁面。

這件作品應被視為 prototype score，而不是完成品。它的價值在於映射過程：seed 語言變成感知詞，感知詞取回 wiki 先例，wiki 先例再轉化成一個可以被現場測試的新方法。

## 材料與設定
${materialList}

## 參與者與角色
${roleList}

## Project Score／行動譜
${scoreList}

## 執行步驟
${executionList}

## Wiki 文件化模板
${documentationList}

## 映射方法
1. Seed intake：收集一句短句、詩、歌詞片段、作品說明、策展語或研究筆記。
2. 語句／語具解構：抽取關鍵詞、材料名詞、動作、社會場景與隱含的未來問題。
3. Corpus retrieval：把這些詞對照 export 裡 source card 的標題、摘錄、標籤、分類與關鍵詞。
4. 感知層擴展：用 categoryGraph edges 找出與初始命中頁共享 tags/categories 的相鄰卡片。
5. Connected Papers 語義向量：計算每張 source card 的 categories、tags、semanticTopics、methods、materials、objects，找出 related articles、missing bridges 與 future directions。
6. Research Topic Generator：把 relation clusters 轉成題目候選，包含 research question、knowledge systems、evidence trail、novelty gap、risk caveat、first reading route。
7. Association output：選定一個成熟題目後，才生成 zine / wiki page / workshop score / exhibition protocol。
8. 人工驗證：發布前由人檢查 cited source cards 是否真的支持該方向。

## 驗證問題
- 哪一個取回頁面是最強先例？哪一個只是鬆散聯想？
- 哪一個材料步驟能在 30 分鐘內測試，而且不需要特殊許可或不安全的實驗條件？
- 參與者最後會上傳什麼回 wiki：圖片、表格、聲音檔、diagram、protocol，還是 reflection？
- 如果 evidence 仍然很弱，哪一個主張應該被移除？

## 後續迭代用 Future Scenarios
${futureBlocks}

## 流程圖
\`\`\`mermaid
flowchart LR
  A[玩家輸入 seed 句子] --> B[語句／語具解構]
  B --> C[sourceCards 關鍵詞取回]
  C --> D[categoryGraph 感知層擴展]
  D --> E[取回 wiki/source pages]
  E --> F[新 wiki 頁面草稿]
  F --> G[發布前人工驗證]
\`\`\`

## Evidence Caveat／證據限制
信心只根據本地 corpus overlap 判斷。Low evidence 代表輸出必須保留為帶有明確 caveat 的測試 stub，不應被視為完成的策展或研究主張。
`;
}

function renderResearchTopicsPrompt(topics: ResearchTopicCandidate[]): string {
  if (topics.length === 0) return "沒有足夠 evidence 生成研究題目；輸出應停在 reading route 與待查問題。";

  return topics.map((topic, index) => {
    const evidence = topic.evidenceTrail.map((card) => `${card.id}: ${card.title}`).join("; ");
    return `### 題目候選 ${index + 1}: ${topic.title}\nrelationPattern: ${topic.relationPattern}\nmaturityScore: ${Math.round(topic.maturityScore)}\nresearchQuestion: ${topic.researchQuestion}\nknowledgeSystems: ${topic.knowledgeSystems.join(", ")}\nwhyInteresting: ${topic.whyInteresting}\nnoveltyGap: ${topic.noveltyGap}\nriskCaveat: ${topic.riskCaveat}\nfirstReadingRoute: ${topic.firstReadingRoute.join(" → ")}\nevidence: ${evidence}`;
  }).join("\n\n");
}

function renderResearchTopicsMarkdown(topics: ResearchTopicCandidate[]): string {
  if (topics.length === 0) return "尚未生成跨知識研究題目。請增加 recursive reading 或調整 seed。";

  return topics.map((topic, index) => {
    const evidence = topic.evidenceTrail.map((card) => `  - ${card.id}: ${card.title}${card.url ? ` (${card.url})` : ""}`).join("\n");
    return `### ${index + 1}. ${topic.title}\n- relation pattern: ${topic.relationPattern}\n- maturity score: ${Math.round(topic.maturityScore)}/100\n- research question: ${topic.researchQuestion}\n- knowledge systems: ${topic.knowledgeSystems.join("、")}\n- why interesting: ${topic.whyInteresting}\n- novelty/gap: ${topic.noveltyGap}\n- risk/caveat: ${topic.riskCaveat}\n- first reading route: ${topic.firstReadingRoute.join(" → ")}\n- possible outputs: ${topic.possibleOutputs.join(" / ")}\n- evidence trail:\n${evidence}`;
  }).join("\n\n");
}

function renderEditorialRelationPathsPrompt(report: DaydreamReport): string {
  if (report.linkedCards.length === 0) {
    return "沒有明確深讀鏈。若有 thin page secondary search 結果，請把它視為內部選材提示，不要在正文說明搜尋方法。";
  }

  return report.linkedCards.slice(0, 16).map((trail, index) => {
    const from = trail.via[0]?.title ?? "unknown source";
    const to = trail.card.title;
    const note = trail.card.excerpt
      ? trail.card.excerpt.replace(/\s+/g, " ").slice(0, 520)
      : "no excerpt";
    return `### 內部關係 ${index + 1}
from: ${from}
relation: ${trail.relation}
to: ${to}
sourceNotes: ${note}`;
  }).join("\n\n");
}

function renderDeepReadPrompt(report: DaydreamReport): string {
  if (report.deepReadCards.length === 0) {
    return "沒有收集到下一層文字。若附件、footnote、reference 或 linked paper 未被 export 成 source card，必須先補 ingestion，不能宣稱已完成深讀。";
  }

  const keywords = report.deepReadKeywords.length > 0 ? report.deepReadKeywords.join(", ") : "無";
  const cards = report.deepReadCards.slice(0, 12).map((card) =>
    `- ${card.id}: ${card.title}${card.url ? ` (${card.url})` : ""}\n  excerpt: ${card.excerpt}`,
  ).join("\n");
  return `deepReadKeywords: ${keywords}\n${cards}`;
}

function renderDeepReadMarkdown(report: DaydreamReport): string {
  if (report.deepReadCards.length === 0) {
    return "尚未收集到下一層文字；需要補抓附件、footnote、reference 或 linked paper。";
  }

  const keywords = report.deepReadKeywords.length > 0 ? report.deepReadKeywords.join("、") : "無";
  const cards = report.deepReadCards.slice(0, 12).map((card) => {
    const url = card.url ? ` (${card.url})` : "";
    return `- ${card.id}: ${card.title}${url}`;
  }).join("\n");
  return `下一層關鍵詞：${keywords}\n\n${cards}`;
}

function renderLinkedEvidenceMarkdown(report: DaydreamReport): string {
  if (report.linkedCards.length === 0) {
    return "尚未找到可解析的 outgoingLinks。此結果只能視為第一層 source-card 草稿。";
  }

  return report.linkedCards.slice(0, 18).map((trail) => {
    const via = trail.via.map((card) => card.title).join(" → ");
    const url = trail.card.url ? ` (${trail.card.url})` : "";
    return `- depth ${trail.depth}: ${trail.card.id}: ${trail.card.title}${url}\n  - via: ${via}`;
  }).join("\n");
}

function renderDepthGateMarkdown(report: DaydreamReport): string {
  const m = report.depthMetrics;
  const warnings = m.warnings.length > 0 ? m.warnings.map((warning) => `- ${warning}`).join("\n") : "- 無重大警告";
  return `- depthScore: ${m.depthScore}/100\n- direct matches: ${m.directMatches}\n- graph expansions: ${m.graphExpansions}\n- linked expansions: ${m.linkedExpansions}\n- source diversity: ${m.sourceDiversity}\n- average excerpt chars: ${m.averageExcerptChars}\n- thin extract cards: ${m.cardsWithThinExtracts}\n\nWarnings:\n${warnings}`;
}

function renderSemanticPromptBlocks(context: SemanticVectorContext): string {
  const related = context.relatedCards.slice(0, 8).map((item, index) =>
    `${index + 1}. ${item.card.id}: ${item.card.title}（score ${item.score}，anchor: ${item.anchorTitle}；reason: ${item.reasons.join("; ") || "shared vector terms"}）`,
  ).join("\n") || "沒有足夠 related cards。";
  const bridges = context.bridgeCards.slice(0, 6).map((bridge, index) =>
    `${index + 1}. ${bridge.cards[0].id}: ${bridge.cards[0].title} ↔ ${bridge.cards[1].id}: ${bridge.cards[1].title}（score ${bridge.score}；shared terms: ${bridge.sharedTerms.join(", ") || "無"}）`,
  ).join("\n") || "沒有足夠 missing bridge。";
  const futures = context.futureDirections.slice(0, 6).map((future, index) =>
    `${index + 1}. ${future.title}（score ${future.score}；grounded terms: ${future.groundedTerms.join(", ")}；evidence: ${future.evidenceCards.map((card) => card.title).join(" / ")}）`,
  ).join("\n") || "沒有足夠 future direction。";

  return `### Related cards\n${related}\n\n### Missing bridges\n${bridges}\n\n### Future directions\n${futures}`;
}

function renderSemanticMarkdownSection(context: SemanticVectorContext): string {
  const related = context.relatedCards.slice(0, 6).map((item) =>
    `- Related: ${item.card.id}: ${item.card.title}，score ${item.score}，anchor：${item.anchorTitle}`,
  ).join("\n") || "- 沒有足夠 related cards。";
  const bridges = context.bridgeCards.slice(0, 6).map((bridge) =>
    `- Missing bridge: ${bridge.cards[0].title} ↔ ${bridge.cards[1].title}，shared：${bridge.sharedTerms.join(", ") || "無"}，score ${bridge.score}`,
  ).join("\n") || "- 沒有足夠 missing bridge。";
  const futures = context.futureDirections.slice(0, 6).map((future) =>
    `- Future direction: ${future.title}，grounded terms：${future.groundedTerms.join(", ")}，score ${future.score}`,
  ).join("\n") || "- 沒有足夠 future direction。";

  return `這一層把 Connected Papers 當成生成前的語義向量庫：不是拿來替文章裝飾，而是用來挑選更有張力的 evidence 組合。\n\n### Related Articles\n${related}\n\n### Missing Bridges\n${bridges}\n\n### Future Papers / Research Directions\n${futures}`;
}

function perceptionTargetsForCard(card: SourceCard, corpus: DaydreamCorpus): string[] {
  const graphTargets = corpus.edges
    .filter((edge) => edge.source === card.id)
    .filter((edge) => edge.target.startsWith("tag:") || edge.target.startsWith("category:"))
    .map((edge) => edge.target.replace(/^tag:/, "tag:").replace(/^category:/, "category:"));
  const cardTargets = [
    ...(card.tags ?? []).map((tag) => `tag:${tag}`),
    ...(card.categories ?? []).map((category) => `category:${category}`),
  ];

  return dedupeStrings([...cardTargets, ...graphTargets]).slice(0, 8);
}

function buildProjectTitle(report: DaydreamReport): string {
  const theme = report.keywords.slice(0, 3).map(keywordLabel).join("／") || "低證據 Seed";
  return `${theme}未來實作`;
}

function buildProjectBlueprint(
  seed: string,
  report: DaydreamReport,
  evidenceCards: SourceCard[],
): ProjectBlueprint {
  const keywords = new Set(report.keywords);
  const anchors = evidenceCards.slice(0, 3).map((card) => card.title).join("、") || "低證據來源卡";
  const sensingMode = keywords.has("sound") || keywords.has("audio")
    ? "聆聽與聲音轉譯"
    : keywords.has("microscopy") || keywords.has("bio") || keywords.has("lab")
      ? "觀察與濕實驗室記譜"
      : "田野觀察與集體註記";
  const materialFocus = keywords.has("sensor") || keywords.has("sensors") || keywords.has("electronics")
    ? "廢棄感測器、簡單電路、紙標籤與共同校準筆記"
    : "拾得材料、註記卡、錄音設備與共同田野筆記";

  return {
    concept: `這是一個參與式藝術專案，使用「${sensingMode}」把 seed「${seed}」轉化成公共 protocol。第一組來源錨點是 ${anchors}；它們提供先例，說明小型社群如何把工具、筆記與地方觀察轉化成可重複的藝術／研究方法。`,
    materials: [
      materialFocus,
      "一張共同桌面或線上白板，用來整理訊號、筆記與來源卡引用",
      "索引卡或 wiki 表格列，用來記錄每次觀察、行動與不確定性",
      "低風險示範工具包；避免無法本地驗證的生物、電氣或環境主張",
      "相機或錄音設備，只作為過程文件化工具，不作監控用途",
    ],
    roles: [
      "Seed 朗讀者：讀出原始句子，並讓核心問題保持可見",
      "Corpus 映射者：檢查每個來源卡 ID／標題，標記強證據與弱證據",
      "工具看守者：準備安全材料，避免 prototype 變成未驗證的實驗室宣稱",
      "參與觀察者：每人把一個地方訊號轉譯成聲音、標記、姿勢或指令",
      "Wiki 書寫者：把 session 整理成帶有 citations、caveats 與下一輪測試指令的頁面",
    ],
    setting: "30-90 分鐘工作坊、studio test、教室桌面、community lab，或小型展演 activation。",
    output: "一篇新的 wiki 頁面，包含 project score、來源卡引用、參與者觀察、照片或 diagram，以及清楚的 evidence caveat。",
    workshopScore: [
      "把 seed 句子放在桌面中央，畫出名詞、工具、場址、動作與隱含的 public。",
      "只以片段朗讀取回的 wiki/source pages：標題、來源卡 ID、tags/categories，以及一個可用的方法線索。",
      "從房間或場址選一個可觀察訊號，轉譯成一個小行動：聆聽、標記、接線、比較、修補或敘述。",
      "建立三段式公開示範：感知到什麼、如何被轉譯、仍然不確定什麼。",
      "把測試發布為 wiki-page draft，附上來源卡引用，以及擴大前必須驗證的項目。",
    ],
    executionSteps: [
      "把 seed 丟進 Association prototype，保存生成的 Markdown 頁面。",
      "檢查前 3 個 matched source cards，移除只是在標題層面巧合的 citation。",
      "用安全、可取得的工具準備一個小型材料站；清楚記錄所有替代材料。",
      "邀請 2-6 位參與者執行一次 project score，每一步控制在 10 分鐘內。",
      "用表格記錄觀察：訊號、工具／姿勢、來源卡影響、參與者筆記、不確定性。",
      "測試後修訂生成頁，讓它描述實際發生的事，而不只是想像。",
    ],
    documentationFields: [
      "Seed 句子與抽取出的關鍵詞",
      "Matched source card IDs／titles／URLs",
      "作為感知層使用的 graph-expanded tags／categories",
      "實際使用的材料",
      "參與者行動與產生的 traces",
      "安全或 evidence caveats",
      "下一版 score",
    ],
  };
}

function dedupeCards(cards: SourceCard[]): SourceCard[] {
  const seen = new Set<string>();
  const result: SourceCard[] = [];

  for (const card of cards) {
    if (seen.has(card.id)) continue;
    seen.add(card.id);
    result.push(card);
  }

  return result;
}

function dedupeStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function formatKeywords(keywords: string[]): string {
  return keywords.map(keywordLabel).join("、");
}

function keywordLabel(value: string): string {
  const labels: Record<string, string> = {
    audio: "聲音",
    bio: "生物",
    community: "社群",
    device: "裝置",
    diy: "DIY",
    documentation: "文件化",
    electronics: "電子材料",
    environment: "環境",
    fieldwork: "田野",
    installation: "裝置藝術",
    lab: "實驗室",
    notes: "筆記",
    recycling: "回收",
    reuse: "再利用",
    sensor: "感測器",
    sensors: "感測器",
    sound: "聲音",
    water: "水",
    wetlab: "濕實驗室",
    workshop: "工作坊",
  };

  return labels[value] ?? value;
}

function translateConfidence(confidence: DaydreamReport["futures"][number]["confidence"]): string {
  if (confidence === "high") return "高";
  if (confidence === "medium") return "中";
  return "低";
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "") || "daydream-prototype-page";
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}
