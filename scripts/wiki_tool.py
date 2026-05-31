#!/usr/bin/env python3
"""Local-only PBS wiki/vault maintenance tool."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VAULT = ROOT / "obsidian-vault"

REQUIRED_DIRS = [
    "obsidian-vault/Wiki/Sources",
    "obsidian-vault/Wiki/Concepts",
    "obsidian-vault/Wiki/Methods",
    "obsidian-vault/Wiki/Materials",
    "obsidian-vault/Wiki/Theories",
    "obsidian-vault/Wiki/SocialForms",
    "obsidian-vault/Wiki/Projects",
    "obsidian-vault/Wiki/Comparisons",
    "obsidian-vault/Wiki/Syntheses",
    "obsidian-vault/Wiki/Questions",
    "obsidian-vault/Wiki/NPCs",
    "obsidian-vault/Wiki/Pets",
    "obsidian-vault/Wiki/SemanticMemory",
    "obsidian-vault/Wiki/Zines",
    "obsidian-vault/Wiki/Logs",
    "obsidian-vault/Review/npc-agent-pages",
    "obsidian-vault/Review/pet-question-pages",
    "obsidian-vault/Review/semantic-relations",
    "obsidian-vault/Review/terrain-gaps",
    "obsidian-vault/Review/zine-feedback",
    "obsidian-vault/Review/zine-repair-reports",
    "obsidian-vault/Review/source-coverage",
    "obsidian-vault/Review/query-routes",
    "obsidian-vault/Review/routing-gaps",
    "obsidian-vault/Review/thickened-notes",
    "obsidian-vault/_templates",
    "obsidian-vault/Schema",
]

REQUIRED_SCHEMA = [
    "obsidian-vault/Schema/agentic-firewall.md",
    "obsidian-vault/Schema/frontmatter-schema.md",
    "obsidian-vault/Schema/command-reference.md",
    "obsidian-vault/Schema/lint-checklist.md",
    "obsidian-vault/Schema/source-manifest.jsonl",
]

WUKIR_FILES = [
    "docs/transcripts_en/wukir-suryadi.md",
    "docs/transcripts_zh/wukir-suryadi.md",
    "data/personas.json",
    "data/agent-profiles.json",
    "data/wiki/interviewees/wukir-suryadi/links.json",
    "obsidian-vault/Review/npc-agent-pages/wukir-suryadi.md",
]

TERRAIN_GAP_MOTIFS = [
    {
        "id": "sgmk-diy-electronics-sound-kits",
        "title": "SGMK DIY electronics, sound kits, and workshop organization",
        "pattern": r"\b(sgmk|ssam|mechartlab|home made|8bit|gnusbuino|synth|synthie|electronics?|elektronisch|diy)\b",
        "compiled_hint": r"sgmk|diy electronics|sound kits|synth|mechartlab|home made",
        "candidate_folder": "Wiki/Methods or Wiki/Syntheses",
        "pet_broadcast": "SGMK has many DIY electronics pages, but the wiki still lacks a durable node linking kits, sound, and workshop organization.",
    },
    {
        "id": "care-maintenance-failure-notes",
        "title": "Care, maintenance, and failure notes across workshops",
        "pattern": r"\b(care|maintenance|repair|failure|failed|trial|error|prototype|workshop|照護|維修|失敗|錯誤|工作坊)\b",
        "compiled_hint": r"care|maintenance|failure|repair|照護|維修|失敗",
        "candidate_folder": "Wiki/SocialForms or Wiki/Methods",
        "pet_broadcast": "Material practice is visible, but care, maintenance, and failure notes still need a comparative question.",
    },
    {
        "id": "evidence-vs-hypothesis-marking",
        "title": "Evidence versus hypothesis marking in compiled notes",
        "pattern": r"\b(evidence|hypothesis|question|unknown|unverified|sourceRefs|open questions|證據|假設|未知|未驗證|問題)\b",
        "compiled_hint": r"evidence|hypothesis|open questions|sourceRefs|證據|假設",
        "candidate_folder": "Wiki/Comparisons or Wiki/Syntheses",
        "pet_broadcast": "The wiki needs clearer marks for which relations are evidenced and which are still hypotheses.",
    },
]

NOTE_TYPE_FOLDERS = {
    "Concept": "Concepts",
    "Method": "Methods",
    "Material": "Materials",
    "Theory": "Theories",
    "SocialForm": "SocialForms",
    "Project": "Projects",
    "Comparison": "Comparisons",
    "Synthesis": "Syntheses",
}

COMPILED_WIKI_FOLDERS = [
    "Concepts",
    "Methods",
    "Materials",
    "Theories",
    "SocialForms",
    "Projects",
    "Comparisons",
    "Syntheses",
]

SOURCE_FAMILY_LABELS = {
    "hackteria": "Hackteria",
    "htgwyw": "How To Get What You Want / KOBAKANT",
    "sgmk": "SGMK",
}

PUBLIC_SOURCE_NOTE_BLOCKLIST = re.compile(
    r"\b(nigga|manwhore|ex[- ]boyfriend|boyfriend|funny ass|yo my big bro|yo quiero|wtf tyson)\b",
    re.I,
)


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def slugify(value: str) -> str:
    slug = re.sub(r"[^\w\s-]", "", value.lower(), flags=re.UNICODE)
    slug = re.sub(r"[\s_]+", "-", slug).strip("-")
    return slug or "untitled-note"


def local_path(path: str) -> Path:
    candidate = Path(path)
    if candidate.is_absolute():
        return candidate
    return ROOT / path


def path_title(path: Path, text: str) -> str:
    fm = parse_frontmatter(text)
    title = fm.get("title")
    if isinstance(title, str) and title.strip():
        return title.strip().strip('"')
    heading = re.search(r"^#\s+(.+)$", text, re.M)
    if heading:
        return heading.group(1).strip()
    return path.stem


def compact(value: str, max_chars: int = 360) -> str:
    text = re.sub(r"\s+", " ", value).strip()
    if len(text) <= max_chars:
        return text
    return text[: max_chars - 3].rstrip() + "..."


def strip_frontmatter(text: str) -> str:
    if not text.startswith("---\n"):
        return text
    end = text.find("\n---", 4)
    if end == -1:
        return text
    return text[end + 4 :].lstrip()


def is_thin_source_text(text: str) -> bool:
    body = strip_frontmatter(text)
    plain = re.sub(r"<!--.*?-->", " ", body, flags=re.S)
    plain = re.sub(r"\s+", " ", plain).strip()
    return len(plain) < 420 or "No plaintext extract returned" in plain


def extract_source_passages(path: Path, max_items: int = 5) -> list[str]:
    text = path.read_text(encoding="utf-8", errors="ignore")
    body = strip_frontmatter(text)
    body = re.sub(r"<!--.*?-->", " ", body, flags=re.S)
    lines = [line.strip() for line in body.splitlines()]
    passages: list[str] = []
    buffer: list[str] = []
    for line in lines:
        if not line or line.startswith("#") or line.startswith("Source:") or line.startswith("#pbs/"):
            if buffer:
                passages.append(" ".join(buffer))
                buffer = []
            continue
        if line.startswith("-"):
            passages.append(line.lstrip("- ").strip())
            continue
        buffer.append(line)
        if len(" ".join(buffer)) > 420:
            passages.append(" ".join(buffer))
            buffer = []
    if buffer:
        passages.append(" ".join(buffer))
    cleaned = []
    for passage in passages:
        normalized = compact(passage, 520)
        if len(normalized) < 40:
            continue
        if "No plaintext extract returned" in normalized:
            continue
        if normalized.startswith("[[") and normalized.endswith("]]"):
            continue
        without_links = re.sub(r"\[\[[\s\S]*?\]\]", " ", normalized).strip()
        if len(without_links) < 30:
            continue
        cleaned.append(normalized)
    return cleaned[:max_items]


def extract_wikilink_targets(text: str) -> list[str]:
    targets = []
    for raw in re.findall(r"\[\[([^\]|]+)(?:\|[^\]]+)?\]\]", text):
        target = raw.strip()
        if target:
            targets.append(target)
    return targets


def source_ref_from_wikilink(target: str) -> str | None:
    if target.startswith("obsidian-vault/"):
        return target if local_path_exists(target) else None
    if target.startswith("Sources/"):
        direct = f"obsidian-vault/{target}.md" if not target.endswith(".md") else f"obsidian-vault/{target}"
        if local_path_exists(direct):
            return direct
        folder = ROOT / "obsidian-vault" / target.rsplit("/", 1)[0]
        stem = target.rsplit("/", 1)[-1]
        if folder.is_dir():
            matches = sorted(folder.glob(f"{stem}*.md"))
            if matches:
                return rel(matches[0])
    return None


def source_refs_from_bridge(path: Path, limit: int) -> list[str]:
    text = path.read_text(encoding="utf-8", errors="ignore")
    refs: list[str] = []
    for target in extract_wikilink_targets(text):
        ref = source_ref_from_wikilink(target)
        if ref and ref not in refs:
            refs.append(ref)
        if len(refs) >= limit:
            break
    return refs


def related_existing_wiki_links(title: str, passages: list[str], max_items: int = 8) -> dict[str, list[str]]:
    haystack = f"{title}\n" + "\n".join(passages)
    query_terms = set(tokenize(haystack))
    relations: dict[str, list[str]] = {key: [] for key in ["relatedConcepts", "relatedMethods", "relatedMaterials", "relatedSocialForms", "relatedProjects"]}
    key_for_folder = {
        "Concepts": "relatedConcepts",
        "Methods": "relatedMethods",
        "Materials": "relatedMaterials",
        "SocialForms": "relatedSocialForms",
        "Projects": "relatedProjects",
    }
    scored: list[tuple[int, Path, str, str]] = []
    for path in compiled_wiki_paths():
        text = path.read_text(encoding="utf-8", errors="ignore")
        note_title = str(parse_frontmatter(text).get("title") or path.stem)
        terms = set(tokenize(note_title + " " + markdown_section(text, "Scope", 600) + " " + markdown_section(text, "Definition", 600)))
        score = len(query_terms & terms)
        if score > 0:
            scored.append((score, path, note_title, path.parent.name))
    for _score, path, note_title, folder in sorted(scored, key=lambda item: (-item[0], item[2]))[:max_items]:
        key = key_for_folder.get(folder)
        if key:
            relations[key].append(note_title)
    return relations


def evidence_quality_label(path: Path) -> str:
    text = path.read_text(encoding="utf-8", errors="ignore")
    if is_thin_source_text(text):
        return "thin-source"
    return "readable-source"


def append_wiki_log(kind: str, title: str, lines: list[str]) -> None:
    log_path = VAULT / "Wiki/log.md"
    if not log_path.exists():
        log_path.parent.mkdir(parents=True, exist_ok=True)
        log_path.write_text("\n".join([
            "---",
            "type: wiki-log",
            "status: active",
            "sourceRefs:",
            "  - obsidian-vault/Schema/llm-wiki-maintainer.md",
            "---",
            "",
            "# PBS LLM Wiki Log",
            "",
        ]) + "\n", encoding="utf-8")
    entry = ["", f"## [{now_iso()[:10]}] {kind} | {title}", "", *[f"- {line}" for line in lines], ""]
    with log_path.open("a", encoding="utf-8") as handle:
        handle.write("\n".join(entry))


def ensure_wiki_index() -> None:
    index_path = VAULT / "Wiki/index.md"
    if index_path.exists():
        return
    index_path.write_text("\n".join([
        "---",
        "type: wiki-index",
        "status: active",
        "sourceRefs:",
        "  - obsidian-vault/Schema/llm-wiki-maintainer.md",
        "---",
        "",
        "# PBS LLM Wiki Index",
        "",
        "This index is the entry point for compiled, citation-bearing PBS wiki notes.",
        "",
        "## Compiled Note Categories",
        "",
        "- [[Concepts/README|Concepts]]",
        "- [[Methods/README|Methods]]",
        "- [[Materials/README|Materials]]",
        "- [[Theories/README|Theories]]",
        "- [[SocialForms/README|Social Forms]]",
        "- [[Projects/README|Projects]]",
        "- [[Comparisons/README|Comparisons]]",
        "- [[Syntheses/README|Syntheses]]",
        "",
        "## Bridge Layer Boundary",
        "",
        "`Sources/PBS Semantic Layers/` is a source-derived bridge index for retrieval hints and candidate relations. It is not the compiled Wiki middle layer.",
    ]) + "\n", encoding="utf-8")


def load_personas() -> list[dict]:
    data = json.loads((ROOT / "data/personas.json").read_text(encoding="utf-8"))
    return list(data.get("personas", []))


def local_path_exists(path: str) -> bool:
    return (ROOT / path).exists()


def npc_page_path(persona_id: str) -> Path:
    return VAULT / "Wiki/NPCs" / f"{persona_id}.md"


def npc_source_refs(persona: dict) -> list[str]:
    refs = ["data/personas.json"]
    for value in (persona.get("transcripts") or {}).values():
        if value:
            refs.append(value)
    if persona.get("id") in json.loads((ROOT / "data/agent-profiles.json").read_text(encoding="utf-8")):
        refs.append("data/agent-profiles.json")
    link_file = f"data/wiki/interviewees/{persona.get('id')}/links.json"
    if local_path_exists(link_file):
        refs.append(link_file)
    return refs


def write_npc_page(persona: dict) -> None:
    persona_id = persona["id"]
    refs = npc_source_refs(persona)
    evidence = [f"{ref} exists locally" for ref in refs if local_path_exists(ref)]
    allowed_domains = ["nomadic", "camp", "independent", "artScience", "funding", "exchange", "sustainability"]
    redirects = "{}"
    if persona_id == "wukir-suryadi":
        allowed_domains = ["music", "material", "sound", "instrument-making", "bamboo", "Sustainable Sonic Engine", "Senyawa"]
        redirects = "{rully-shabara: voice/performance, marc-dusseiller: Hackteria/open hardware}"
    body = [
        "---",
        "type: npc",
        f"id: {persona_id}",
        f"name: {persona.get('name', persona_id)}",
        "status: source-bounded-draft",
        "sourceRefs:",
        *[f"  - {item}" for item in refs],
        "evidence:",
        *[f"  - {item}" for item in evidence],
        "allowed_domains:",
        *[f"  - {item}" for item in allowed_domains],
        f"redirects: {redirects}",
        "---",
        "",
        f"# {persona.get('name', persona_id)}",
        "",
        str(persona.get("intro", "")).strip(),
        "",
        "## Source Boundary",
        "",
        "Use only the local sourceRefs above. Do not invent transcript claims or use external network collection.",
    ]
    npc_page_path(persona_id).write_text("\n".join(body) + "\n", encoding="utf-8")


def command_doctor(_args: argparse.Namespace) -> int:
    missing_dirs = [path for path in REQUIRED_DIRS if not (ROOT / path).is_dir()]
    missing_schema = [path for path in REQUIRED_SCHEMA if not (ROOT / path).is_file()]
    missing_wukir = [path for path in WUKIR_FILES if not (ROOT / path).exists()]
    print(f"required_dirs={len(REQUIRED_DIRS) - len(missing_dirs)}/{len(REQUIRED_DIRS)}")
    print(f"schema_docs={len(REQUIRED_SCHEMA) - len(missing_schema)}/{len(REQUIRED_SCHEMA)}")
    print(f"wukir_files={len(WUKIR_FILES) - len(missing_wukir)}/{len(WUKIR_FILES)}")
    if missing_dirs:
        print("missing_dirs=" + json.dumps(missing_dirs, ensure_ascii=False))
    if missing_schema:
        print("missing_schema=" + json.dumps(missing_schema, ensure_ascii=False))
    if missing_wukir:
        print("missing_wukir=" + json.dumps(missing_wukir, ensure_ascii=False))
    return 1 if missing_dirs or missing_schema or missing_wukir else 0


def command_build(_args: argparse.Namespace) -> int:
    for persona in load_personas():
        write_npc_page(persona)
    catalog = [{"id": p["id"], "name": p.get("name"), "path": rel(npc_page_path(p["id"]))} for p in load_personas()]
    (VAULT / "Wiki/NPCs/catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"npc_pages={len(catalog)}")
    print("catalog=obsidian-vault/Wiki/NPCs/catalog.json")
    return 0


def command_search_catalog(args: argparse.Namespace) -> int:
    needle = " ".join(args.query).lower()
    limit = args.limit
    rows = []
    for path in sorted((VAULT / "Wiki").glob("**/*.md")):
        text = path.read_text(encoding="utf-8", errors="ignore")
        haystack = f"{path.name}\n{text}".lower()
        if all(part in haystack for part in needle.split()):
            rows.append({"path": rel(path), "title": path.stem})
    for row in rows[:limit]:
        print(json.dumps(row, ensure_ascii=False))
    print(f"matches={min(len(rows), limit)}/{len(rows)}")
    return 0 if rows else 1


def parse_refs(text: str) -> list[str]:
    match = re.search(r"sourceRefs:\n((?:  - .+\n)+)", text)
    if not match:
        match = re.search(r"source_refs:\n((?:  - .+\n)+)", text)
    if not match:
        return []
    return [line.replace("-", "", 1).strip() for line in match.group(1).splitlines()]


def parse_frontmatter(text: str) -> dict[str, object]:
    if not text.startswith("---\n"):
        return {}
    end = text.find("\n---", 4)
    if end == -1:
        return {}
    lines = text[4:end].splitlines()
    data: dict[str, object] = {}
    current_key = ""
    for line in lines:
        if line.startswith("  - ") and current_key:
            data.setdefault(current_key, [])
            if isinstance(data[current_key], list):
                data[current_key].append(line.replace("  - ", "", 1).strip())
            continue
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        current_key = key.strip()
        value = value.strip().strip('"')
        data[current_key] = value if value else []
    return data


def lint_pages() -> tuple[list[str], list[str]]:
    warnings: list[str] = []
    errors: list[str] = []
    for path in sorted((VAULT / "Wiki").glob("**/*.md")) + sorted((VAULT / "Review").glob("**/*.md")):
        text = path.read_text(encoding="utf-8", errors="ignore")
        if "type:" not in text:
            errors.append(f"{rel(path)} missing type")
        refs = parse_refs(text)
        if not refs:
            errors.append(f"{rel(path)} missing sourceRefs")
        for ref in refs:
            if ref.startswith("http://") or ref.startswith("https://"):
                errors.append(f"{rel(path)} has network sourceRef {ref}")
            elif not local_path_exists(ref):
                errors.append(f"{rel(path)} missing local sourceRef {ref}")
        if re.search(r"crawl|scrape|bulk network", text, re.I):
            errors.append(f"{rel(path)} contains crawling language")
    return warnings, errors


def command_lint(_args: argparse.Namespace) -> int:
    warnings, errors = lint_pages()
    print(f"warnings={len(warnings)}")
    print(f"errors={len(errors)}")
    for item in warnings:
        print(f"WARNING {item}")
    for item in errors:
        print(f"ERROR {item}")
    return 1 if warnings or errors else 0


def command_source_coverage(_args: argparse.Namespace) -> int:
    personas = load_personas()
    pages = [npc_page_path(persona["id"]) for persona in personas]
    missing = [rel(path) for path in pages if not path.exists()]
    weak = []
    for path in pages:
        if not path.exists():
            continue
        refs = parse_refs(path.read_text(encoding="utf-8", errors="ignore"))
        if len(refs) < 2:
            weak.append(rel(path))
    print(f"canonical_npc_pages={len(pages) - len(missing)}/{len(pages)}")
    print(f"source_bounded={len(pages) - len(missing) - len(weak)}/{len(pages)}")
    if missing:
        print("missing=" + json.dumps(missing, ensure_ascii=False))
    if weak:
        print("weak=" + json.dumps(weak, ensure_ascii=False))
    return 1 if missing or weak else 0


def load_source_cards() -> list[dict]:
    path = VAULT / "daydream-export/sourceCards.enriched.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    return list(data.get("cards", []))


def card_source_ref(card: dict) -> str:
    path = str(card.get("path", "")).strip()
    if path.startswith("obsidian-vault/"):
        return path
    if path:
        return f"obsidian-vault/{path}"
    return str(card.get("id", "unknown-source-card"))


def card_text(card: dict) -> str:
    parts = [
        str(card.get("title", "")),
        str(card.get("source", "")),
        str(card.get("path", "")),
        str(card.get("url", "")),
        str(card.get("excerpt", "")),
        " ".join(map(str, card.get("keywords") or [])),
        " ".join(map(str, card.get("tags") or [])),
        " ".join(map(str, card.get("categories") or [])),
    ]
    return "\n".join(parts)


def tokenize(value: str) -> list[str]:
    return [token for token in re.split(r"[^\w]+", value.lower(), flags=re.UNICODE) if len(token) > 1]


def card_neighbors(card: dict) -> set[str]:
    values: set[str] = set()
    for key in ["outgoingLinks", "references", "categories", "tags", "sourceCategories"]:
        for item in card.get(key) or []:
            if isinstance(item, dict):
                values.update(str(v).lower() for v in item.values() if v)
            else:
                values.add(str(item).lower())
    for topic in card.get("semanticTopics") or []:
        if isinstance(topic, dict):
            values.add(str(topic.get("topic", "")).lower())
    return values


def source_card_by_ref(ref: str, cards: list[dict]) -> dict | None:
    normalized = ref.removeprefix("obsidian-vault/")
    for card in cards:
        candidates = {str(card.get("id", "")), str(card.get("path", "")), card_source_ref(card)}
        if ref in candidates or normalized in candidates:
            return card
    return None


def score_source_card(card: dict, query: str, graph_terms: set[str] | None = None) -> tuple[float, list[str]]:
    query_terms = tokenize(query)
    text = card_text(card).lower()
    title = str(card.get("title", "")).lower()
    keywords = {str(item).lower() for item in card.get("keywords") or []}
    categories = {str(item).lower() for item in card.get("categories") or []}
    neighbors = card_neighbors(card)
    score = 0.0
    reasons: list[str] = []
    for term in query_terms:
        if term in title:
            score += 4
            reasons.append(f"title:{term}")
        if term in keywords:
            score += 3
            reasons.append(f"keyword:{term}")
        if any(term in item for item in categories):
            score += 2
            reasons.append(f"category:{term}")
        count = text.count(term)
        if count:
            score += min(count, 5) * 0.6
    if graph_terms:
        overlap = {term for term in graph_terms if any(term in item for item in neighbors)}
        if overlap:
            score += min(len(overlap), 5) * 1.5
            reasons.append("graph:" + ",".join(sorted(overlap)[:3]))
    return score, sorted(set(reasons))[:8]


def hybrid_search_cards(query: str, limit: int = 10, source: str | None = None) -> list[dict]:
    cards = load_source_cards()
    graph_terms = set(tokenize(query))
    rows: list[dict] = []
    for card in cards:
        if source and str(card.get("source", "")).lower() != source.lower():
            continue
        score, reasons = score_source_card(card, query, graph_terms)
        if score <= 0:
            continue
        rows.append({
            "score": round(score, 2),
            "id": card.get("id"),
            "title": card.get("title"),
            "source": card.get("source"),
            "sourceRef": card_source_ref(card),
            "semanticLayer": card.get("semanticLayer"),
            "url": card.get("url"),
            "reasons": reasons,
            "excerpt": str(card.get("excerpt", ""))[:320],
        })
    rows.sort(key=lambda row: (-float(row["score"]), str(row.get("title") or "")))
    return rows[:limit]


def command_hybrid_search(args: argparse.Namespace) -> int:
    rows = hybrid_search_cards(args.query, args.limit, args.source)
    for row in rows:
        print(json.dumps(row, ensure_ascii=False))
    print(f"matches={len(rows)}")
    return 0 if rows else 1


def evidence_from_card(card: dict) -> str:
    excerpt = re.sub(r"\s+", " ", str(card.get("excerpt", "")).strip())
    if not excerpt:
        excerpt = "沒有找到足夠的證據摘要；請人工打開 sourceRef 補證。"
    return excerpt[:420]


def semantic_topics_from_cards(cards: list[dict], max_items: int = 8) -> list[str]:
    return sorted({str(topic.get("topic")) for card in cards for topic in (card.get("semanticTopics") or []) if isinstance(topic, dict) and topic.get("topic")})[:max_items]


def source_titles_from_cards(cards: list[dict], max_items: int = 8) -> list[str]:
    return [str(card.get("title") or card.get("id") or "source page") for card in cards[:max_items]]


def relation_seeds(note_type: str, cards: list[dict]) -> dict[str, list[str]]:
    topics = semantic_topics_from_cards(cards, 8)
    titles = source_titles_from_cards(cards, 8)
    source_layers = sorted({str(card.get("semanticLayer") or "") for card in cards if card.get("semanticLayer")})
    concepts = topics[:5]
    methods = [item for item in topics if re.search(r"workshop|tool|method|kit|protocol|fabricat|electronics|circuit|實作|工具|方法|工作坊", item, re.I)][:5]
    materials = [item for item in topics if re.search(r"material|textile|circuit|sensor|bio|electronics|sound|fabric|材料|織品|電子|聲音", item, re.I)][:5]
    social_forms = [item for item in topics if re.search(r"workshop|camp|lab|commons|community|festival|residen|exhibition|工作坊|社群|營隊|展覽", item, re.I)][:5]
    projects = titles[:5] if note_type in {"Project", "Comparison", "Synthesis"} else []
    if "events" in source_layers and not social_forms:
        social_forms = titles[:3]
    if "tools" in source_layers and not methods:
        methods = titles[:3]
    return {
        "relatedConcepts": concepts,
        "relatedMethods": methods,
        "relatedMaterials": materials,
        "relatedSocialForms": social_forms,
        "relatedProjects": projects,
    }


def note_path_for(note_type: str, title: str) -> Path:
    folder = NOTE_TYPE_FOLDERS[note_type]
    return VAULT / "Wiki" / folder / f"{slugify(title)}.md"


def build_note_markdown(note_type: str, title: str, cards: list[dict], query: str | None) -> str:
    source_refs = [card_source_ref(card) for card in cards]
    relations = relation_seeds(note_type, cards)
    summary = f"Source-bounded {note_type.lower()} draft for {title}. Review before promoting beyond draft status."
    lines = [
        "---",
        f"id: {slugify(title)}",
        f"title: {title}",
        f"type: {note_type.lower()}",
        "status: source-bounded-draft",
        f"summary: {summary}",
        "sourceRefs:",
        *[f"  - {ref}" for ref in source_refs],
        "evidence:",
        *[f"  - {evidence_from_card(card)} [{index}]" for index, card in enumerate(cards, start=1)],
        "relatedConcepts:",
        *([f"  - {item}" for item in relations["relatedConcepts"]] or ["  - evidence review"]),
        "relatedMethods:",
        *([f"  - {item}" for item in relations["relatedMethods"]] or ["  - evidence review"]),
        "relatedMaterials:",
        *([f"  - {item}" for item in relations["relatedMaterials"]] or ["  - evidence review"]),
        "relatedSocialForms:",
        *([f"  - {item}" for item in relations["relatedSocialForms"]] or ["  - evidence review"]),
        "relatedProjects:",
        *([f"  - {item}" for item in relations["relatedProjects"]] or ["  - evidence review"]),
        "openQuestions:",
        "  - Which claims should be promoted after manual source review?",
        "---",
        "",
        f"# {title}",
        "",
        "## Scope",
        "",
        summary,
        "",
    ]
    if query:
        lines.extend([f"Search query used: `{query}`.", ""])
    lines.extend([
        "## Evidence",
        "",
    ])
    for index, card in enumerate(cards, start=1):
        lines.extend([
            f"### Evidence {index}: {card.get('title') or card.get('id')}",
            "",
            f"- sourceRef: `{card_source_ref(card)}`",
            f"- source: `{card.get('source', 'unknown')}`",
            f"- semantic layer: `{card.get('semanticLayer', 'unknown')}`",
            f"- citation: {evidence_from_card(card)} [{index}]",
            "",
        ])
    lines.extend([
        "## Draft Claims",
        "",
        "- This note is a compiled draft assembled only from the sourceRefs above.",
        "- Do not use this note as a finished synthesis until each claim is manually checked against the cited sources.",
        "",
        "## Related Wiki Notes",
        "",
        "- Concepts: " + ", ".join(f"[[Wiki/Concepts/{slugify(item)}|{item}]]" for item in relations["relatedConcepts"][:5]) if relations["relatedConcepts"] else "- Concepts: evidence review",
        "- Methods: " + ", ".join(f"[[Wiki/Methods/{slugify(item)}|{item}]]" for item in relations["relatedMethods"][:5]) if relations["relatedMethods"] else "- Methods: evidence review",
        "- Materials: " + ", ".join(f"[[Wiki/Materials/{slugify(item)}|{item}]]" for item in relations["relatedMaterials"][:5]) if relations["relatedMaterials"] else "- Materials: evidence review",
        "- Social forms: " + ", ".join(f"[[Wiki/SocialForms/{slugify(item)}|{item}]]" for item in relations["relatedSocialForms"][:5]) if relations["relatedSocialForms"] else "- Social forms: evidence review",
        "- Projects: " + ", ".join(f"[[Wiki/Projects/{slugify(item)}|{item}]]" for item in relations["relatedProjects"][:5]) if relations["relatedProjects"] else "- Projects: evidence review",
        "",
        "## Citations",
        "",
        *[f"[{index}] `{ref}`" for index, ref in enumerate(source_refs, start=1)],
        "",
        "## Open Questions",
        "",
        "- What stronger source passages should replace the automatic excerpts?",
        "- Which related PBS concepts, methods, materials, social forms, or projects should be linked after review?",
    ])
    return "\n".join(lines).rstrip() + "\n"


def command_build_note(args: argparse.Namespace) -> int:
    if args.type not in NOTE_TYPE_FOLDERS:
        print(f"ERROR unsupported note type {args.type}")
        return 1
    cards = load_source_cards()
    selected: list[dict] = []
    for ref in args.source_ref or []:
        card = source_card_by_ref(ref, cards)
        if not card:
            print(f"ERROR sourceRef not found in source cards: {ref}")
            return 1
        selected.append(card)
    if not selected:
        query = args.query or args.title
        search_rows = hybrid_search_cards(query, args.limit, args.source)
        selected = [card for row in search_rows if (card := source_card_by_ref(str(row["sourceRef"]), cards))]
    if not selected:
        print("ERROR no local source-card evidence found")
        return 1
    selected = selected[: args.limit]
    out_path = Path(args.output) if args.output else note_path_for(args.type, args.title)
    if not out_path.is_absolute():
        out_path = ROOT / out_path
    if out_path.exists() and not args.overwrite:
        print(f"ERROR output exists; pass --overwrite to replace: {rel(out_path)}")
        return 1
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(build_note_markdown(args.type, args.title, selected, args.query), encoding="utf-8")
    append_wiki_log("build-note", args.title, [
        f"Created `{rel(out_path)}` as source-bounded draft.",
        f"Used {len(selected)} local source cards; raw Sources were not mutated.",
    ])
    ensure_wiki_index()
    print(f"note={rel(out_path)}")
    print(f"source_cards={len(selected)}")
    return 0


def source_refs_for_ingest(args: argparse.Namespace) -> list[str]:
    refs: list[str] = []
    for ref in args.source_ref or []:
        if ref not in refs:
            refs.append(ref)
    if args.source:
        source_path = local_path(args.source)
        if not source_path.exists():
            raise ValueError(f"source does not exist: {args.source}")
        refs.append(rel(source_path) if source_path.is_relative_to(ROOT) else str(source_path))
    if args.bridge:
        bridge_path = local_path(args.bridge)
        if not bridge_path.exists():
            raise ValueError(f"bridge does not exist: {args.bridge}")
        for ref in source_refs_from_bridge(bridge_path, args.limit):
            if ref not in refs:
                refs.append(ref)
    if not refs and args.query:
        for row in hybrid_search_cards(args.query, args.limit, args.source_family):
            ref = str(row["sourceRef"])
            if ref not in refs:
                refs.append(ref)
    existing = []
    for ref in refs[: args.limit]:
        if local_path_exists(ref):
            existing.append(ref)
    return existing


def infer_note_type_from_title(title: str, requested: str | None) -> str:
    if requested:
        return requested
    if re.search(r"workshop|method|pedagog|protocol|practice|how|方法|工作坊", title, re.I):
        return "Method"
    if re.search(r"material|textile|circuit|biofilm|sensor|材料|織品", title, re.I):
        return "Material"
    if re.search(r"lab|camp|festival|commons|community|社群|營隊", title, re.I):
        return "SocialForm"
    if re.search(r"compare|comparison|versus|and .* infrastructures|比較", title, re.I):
        return "Comparison"
    return "Concept"


def build_thick_note_markdown(note_type: str, title: str, source_refs: list[str], query: str | None = None) -> str:
    source_items = []
    all_passages: list[str] = []
    for ref in source_refs:
        path = local_path(ref)
        text = path.read_text(encoding="utf-8", errors="ignore")
        passages = extract_source_passages(path, 4)
        all_passages.extend(passages)
        linked_refs = [linked for target in extract_wikilink_targets(text) if (linked := source_ref_from_wikilink(target))]
        source_items.append({
            "ref": ref,
            "title": path_title(path, text),
            "quality": evidence_quality_label(path),
            "passages": passages,
            "linkedRefs": linked_refs[:6],
        })
    relations = related_existing_wiki_links(title, all_passages)
    definition = all_passages[0] if all_passages else "沒有找到足夠的證據；此 note 只能作為待補證的 ingest 草稿。"
    source_backed_claims = all_passages[:5]
    if not source_backed_claims:
        source_backed_claims = ["沒有找到足夠的證據；需要回到 sourceRefs 或其 linked sourceRefs 補讀。"]
    summary = f"Evidence-backed ingest draft for {title}; built from {len(source_refs)} local sourceRefs and marked for review."
    lines = [
        "---",
        f"id: {slugify(title)}",
        f"title: {title}",
        f"type: {note_type.lower()}",
        "status: ingest-draft",
        f"summary: {summary}",
        "sourceRefs:",
        *[f"  - {ref}" for ref in source_refs],
        "evidence:",
        *[f"  - {compact(item['passages'][0] if item['passages'] else item['title'] + ' has thin local text; follow linkedRefs before promotion.', 360)} [{index}]" for index, item in enumerate(source_items, start=1)],
        "relatedConcepts:",
        *([f"  - {item}" for item in relations["relatedConcepts"]] or ["  - evidence review"]),
        "relatedMethods:",
        *([f"  - {item}" for item in relations["relatedMethods"]] or ["  - evidence review"]),
        "relatedMaterials:",
        *([f"  - {item}" for item in relations["relatedMaterials"]] or ["  - evidence review"]),
        "relatedSocialForms:",
        *([f"  - {item}" for item in relations["relatedSocialForms"]] or ["  - evidence review"]),
        "relatedProjects:",
        *([f"  - {item}" for item in relations["relatedProjects"]] or ["  - evidence review"]),
        "openQuestions:",
        "  - Which claims can be promoted after human review of every sourceRef?",
        "  - Which thin sourceRefs require one-hop linked source reading?",
        "---",
        "",
        f"# {title}",
        "",
        "## Definition",
        "",
        compact(definition, 900),
        "",
    ]
    if query:
        lines.extend(["## Ingest Route", "", f"- query: `{query}`", "- route type: local sourceRefs to compiled Wiki draft; no raw source mutation.", ""])
    lines.extend(["## Source-Backed Claims", ""])
    for index, claim in enumerate(source_backed_claims, start=1):
        citation = min(index, len(source_refs))
        lines.append(f"- {compact(claim, 520)} [{citation}]")
    lines.extend(["", "## Evidence", ""])
    for index, item in enumerate(source_items, start=1):
        lines.extend([
            f"### Evidence {index}: {item['title']}",
            "",
            f"- sourceRef: `{item['ref']}`",
            f"- quality: `{item['quality']}`",
        ])
        if item["linkedRefs"]:
            lines.append("- one-hop linked sourceRefs:")
            lines.extend([f"  - `{ref}`" for ref in item["linkedRefs"][:4]])
        if item["passages"]:
            lines.extend(["- readable passages:", *[f"  - {passage}" for passage in item["passages"][:3]]])
        else:
            lines.append("- warning: 沒有找到足夠的證據；source text is thin and needs linked source review.")
        lines.append("")
    lines.extend([
        "## Related Wiki Notes",
        "",
        "- Concepts: " + ", ".join(f"[[Wiki/Concepts/{slugify(item)}|{item}]]" for item in relations["relatedConcepts"][:5]) if relations["relatedConcepts"] else "- Concepts: evidence review",
        "- Methods: " + ", ".join(f"[[Wiki/Methods/{slugify(item)}|{item}]]" for item in relations["relatedMethods"][:5]) if relations["relatedMethods"] else "- Methods: evidence review",
        "- Materials: " + ", ".join(f"[[Wiki/Materials/{slugify(item)}|{item}]]" for item in relations["relatedMaterials"][:5]) if relations["relatedMaterials"] else "- Materials: evidence review",
        "- Social forms: " + ", ".join(f"[[Wiki/SocialForms/{slugify(item)}|{item}]]" for item in relations["relatedSocialForms"][:5]) if relations["relatedSocialForms"] else "- Social forms: evidence review",
        "- Projects: " + ", ".join(f"[[Wiki/Projects/{slugify(item)}|{item}]]" for item in relations["relatedProjects"][:5]) if relations["relatedProjects"] else "- Projects: evidence review",
        "",
        "## What PBS Can Answer",
        "",
        f"- Which local sources currently support or weaken the question around `{title}`.",
        "- Which linked sourceRefs should be read before this draft becomes a stable synthesis.",
        "- Which compiled Wiki notes already form a partial route around this topic.",
        "",
        "## Citations",
        "",
        *[f"[{index}] `{ref}`" for index, ref in enumerate(source_refs, start=1)],
        "",
        "## Open Questions",
        "",
        "- Which evidence passages are strong enough to preserve as claims after review?",
        "- Which one-hop linked sources should be promoted into sourceRefs?",
    ])
    return "\n".join(lines).rstrip() + "\n"


def command_ingest_source(args: argparse.Namespace) -> int:
    refs = source_refs_for_ingest(args)
    if not refs:
        print("ERROR no local sourceRefs found for ingest")
        return 1
    title = args.title
    if not title:
        first = local_path(refs[0])
        title = path_title(first, first.read_text(encoding="utf-8", errors="ignore"))
    note_type = infer_note_type_from_title(title, args.type)
    out_path = Path(args.output) if args.output else note_path_for(note_type, title)
    if not out_path.is_absolute():
        out_path = ROOT / out_path
    if out_path.exists() and not args.overwrite:
        print(f"ERROR output exists; pass --overwrite to replace: {rel(out_path)}")
        return 1
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(build_thick_note_markdown(note_type, title, refs, args.query), encoding="utf-8")
    append_wiki_log("ingest-source", title, [
        f"Created `{rel(out_path)}` as ingest-draft.",
        f"Read {len(refs)} sourceRefs; raw Sources were not mutated.",
    ])
    ensure_wiki_index()
    print(f"note={rel(out_path)}")
    print(f"sourceRefs={len(refs)}")
    print(f"status=ingest-draft")
    return 0


def command_ingest_batch(args: argparse.Namespace) -> int:
    refs = source_refs_for_ingest(args)
    if not refs:
        print("ERROR no local sourceRefs found for ingest batch")
        return 1
    out_dir = ROOT / args.output_dir
    out_dir.mkdir(parents=True, exist_ok=True)
    created: list[str] = []
    for ref in refs[: args.limit]:
        path = local_path(ref)
        title = path_title(path, path.read_text(encoding="utf-8", errors="ignore"))
        note_type = infer_note_type_from_title(title, args.type)
        out_path = out_dir / f"{NOTE_TYPE_FOLDERS[note_type]}-{slugify(title)}.md"
        if out_path.exists() and not args.overwrite:
            continue
        out_path.write_text(build_thick_note_markdown(note_type, title, [ref], args.query), encoding="utf-8")
        created.append(rel(out_path))
    append_wiki_log("ingest-batch", args.title or args.query or "batch", [
        f"Created {len(created)} review ingest drafts under `{rel(out_dir)}`.",
        "Batch output stays in Review until a maintainer promotes individual notes.",
    ])
    for item in created:
        print(f"note={item}")
    print(f"created={len(created)}")
    return 0 if created else 1


def compiled_wiki_paths() -> list[Path]:
    paths: list[Path] = []
    for folder in COMPILED_WIKI_FOLDERS:
        paths.extend(sorted((VAULT / "Wiki" / folder).glob("**/*.md")))
    return [path for path in paths if path.name.lower() != "readme.md"]


def evidence_lint_rows() -> tuple[list[str], list[str]]:
    warnings: list[str] = []
    errors: list[str] = []
    seen_titles: dict[str, Path] = {}
    for path in compiled_wiki_paths():
        text = path.read_text(encoding="utf-8", errors="ignore")
        refs = parse_refs(text)
        title_match = re.search(r"^title:\s*(.+)$", text, re.M)
        title = title_match.group(1).strip().strip('"') if title_match else path.stem
        normalized_title = slugify(title)
        if normalized_title in seen_titles:
            warnings.append(f"{rel(path)} near-duplicate title with {rel(seen_titles[normalized_title])}")
        seen_titles[normalized_title] = path
        if "status:" not in text:
            warnings.append(f"{rel(path)} missing status")
        if not refs:
            errors.append(f"{rel(path)} missing sourceRefs")
        fm = parse_frontmatter(text)
        for key in ["id", "title", "type", "status", "summary", "evidence", "relatedConcepts", "relatedMethods", "relatedMaterials", "relatedSocialForms", "relatedProjects", "openQuestions"]:
            if key not in fm:
                warnings.append(f"{rel(path)} missing compiled wiki field {key}")
        if refs and len(refs) < 2 and "source-bounded-draft" not in text:
            warnings.append(f"{rel(path)} has thin evidence: {len(refs)} sourceRef")
        for ref in refs:
            if ref.startswith("http://") or ref.startswith("https://"):
                errors.append(f"{rel(path)} has network-only sourceRef {ref}")
            elif not local_path_exists(ref):
                errors.append(f"{rel(path)} missing local sourceRef {ref}")
        if not re.search(r"^## Evidence\b|^## Citations\b|\[\d+\]", text, re.M):
            warnings.append(f"{rel(path)} lacks visible evidence/citation section")
        if re.search(r"\b(obviously|clearly proves|without doubt|絕對證明|顯然證明)\b", text, re.I):
            warnings.append(f"{rel(path)} may overstate evidence")
    return warnings, errors


def note_lint_status(path: Path, text: str) -> dict:
    warnings: list[str] = []
    errors: list[str] = []
    refs = parse_refs(text)
    if not refs:
        errors.append("missing sourceRefs")
    fm = parse_frontmatter(text)
    for key in ["id", "title", "type", "status", "summary", "evidence", "relatedConcepts", "relatedMethods", "relatedMaterials", "relatedSocialForms", "relatedProjects", "openQuestions"]:
        if key not in fm:
            warnings.append(f"missing compiled wiki field {key}")
    if "status:" not in text:
        warnings.append("missing status")
    if refs and len(refs) < 2 and "source-bounded-draft" not in text:
        warnings.append(f"thin evidence: {len(refs)} sourceRef")
    for ref in refs:
        if ref.startswith("http://") or ref.startswith("https://"):
            errors.append(f"network-only sourceRef {ref}")
        elif not local_path_exists(ref):
            errors.append(f"missing local sourceRef {ref}")
    if not re.search(r"^## Evidence\b|^## Citations\b|\[\d+\]", text, re.M):
        warnings.append("lacks visible evidence/citation section")
    return {
        "status": "error" if errors else "warning" if warnings else "pass",
        "warnings": warnings,
        "errors": errors,
        "path": rel(path),
    }


def markdown_section(text: str, heading: str, max_chars: int = 900) -> str:
    pattern = re.compile(rf"^##\s+{re.escape(heading)}\s*$\n([\s\S]*?)(?=^##\s+|\Z)", re.M)
    match = pattern.search(text)
    if not match:
        return ""
    return re.sub(r"\s+", " ", match.group(1)).strip()[:max_chars]


def exportable_wiki_note(path: Path) -> dict:
    text = path.read_text(encoding="utf-8", errors="ignore")
    fm = parse_frontmatter(text)
    refs = parse_refs(text)
    title = str(fm.get("title") or path.stem)
    note_type = str(fm.get("type") or path.parent.name.rstrip("s")).lower()
    relation_keys = ["relatedConcepts", "relatedMethods", "relatedMaterials", "relatedSocialForms", "relatedProjects"]
    relations = {key: fm.get(key) if isinstance(fm.get(key), list) else [] for key in relation_keys}
    legacy_related = fm.get("related") if isinstance(fm.get("related"), list) else []
    related = list(dict.fromkeys([*legacy_related, *[item for values in relations.values() for item in values if item != "evidence review"]]))
    open_questions = fm.get("openQuestions") if isinstance(fm.get("openQuestions"), list) else []
    citations = re.findall(r"^\[(\d+)\]\s+`?([^`\n]+)`?", text, re.M)
    lint_status = note_lint_status(path, text)
    body_text = re.sub(r"---[\s\S]*?---", "", text, count=1).strip() if text.startswith("---") else text
    return {
        "id": str(fm.get("id") or slugify(title)),
        "title": title,
        "type": note_type,
        "status": str(fm.get("status") or "unknown"),
        "summary": str(fm.get("summary") or markdown_section(text, "Scope", 360) or body_text[:360]),
        "path": rel(path),
        "sourceRefs": refs,
        "sourceRefCount": len(refs),
        "related": related,
        "relatedConcepts": relations["relatedConcepts"],
        "relatedMethods": relations["relatedMethods"],
        "relatedMaterials": relations["relatedMaterials"],
        "relatedSocialForms": relations["relatedSocialForms"],
        "relatedProjects": relations["relatedProjects"],
        "openQuestions": open_questions,
        "evidence": markdown_section(text, "Evidence", 1200),
        "citations": [{"index": index, "sourceRef": ref.strip()} for index, ref in citations],
        "lint": lint_status,
        "searchText": re.sub(r"\s+", " ", " ".join([title, note_type, str(fm.get("summary") or ""), " ".join(map(str, related)), body_text[:1800]])).strip(),
    }


def export_wiki_index_payload() -> dict:
    notes = [exportable_wiki_note(path) for path in compiled_wiki_paths()]
    eligible = [note for note in notes if note["lint"]["status"] != "error" and note["sourceRefCount"] > 0]
    return {
        "schemaVersion": "pbs-compiled-wiki-index-v1",
        "generatedAt": now_iso(),
        "sourceRefs": ["scripts/wiki_tool.py", "obsidian-vault/Wiki/index.md"],
        "counts": {
            "notes": len(notes),
            "eligibleForZineRag": len(eligible),
        },
        "notes": notes,
    }


def command_export_wiki_index(args: argparse.Namespace) -> int:
    payload = export_wiki_index_payload()
    out_path = Path(args.output)
    if not out_path.is_absolute():
        out_path = ROOT / out_path
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    append_wiki_log("export", "compiled wiki index", [
        f"Wrote `{rel(out_path)}` for zine runtime RAG.",
        f"Exported {payload['counts']['notes']} notes; {payload['counts']['eligibleForZineRag']} eligible for zine RAG.",
    ])
    print(f"artifact={rel(out_path)}")
    print(f"notes={payload['counts']['notes']}")
    print(f"eligible={payload['counts']['eligibleForZineRag']}")
    return 0


def source_cards_for_compilation() -> list[dict]:
    path = VAULT / "daydream-export/sourceCards.enriched.json"
    payload = json.loads(path.read_text(encoding="utf-8"))
    cards = payload.get("cards", []) if isinstance(payload, dict) else []
    local_cards: list[dict] = []
    seen: set[str] = set()
    for card in cards:
        if not isinstance(card, dict):
            continue
        source_path = str(card.get("path") or "").strip()
        source = str(card.get("source") or "").strip().lower()
        if not source_path or source not in SOURCE_FAMILY_LABELS:
            continue
        if is_public_source_note_blocked(card):
            continue
        ref = f"obsidian-vault/{source_path}" if not source_path.startswith("obsidian-vault/") else source_path
        if not local_path_exists(ref):
            continue
        key = str(card.get("id") or ref)
        if key in seen:
            continue
        seen.add(key)
        local_cards.append(card)
    return local_cards


def is_public_source_note_blocked(card: dict) -> bool:
    text = " ".join(str(card.get(key) or "") for key in ["title", "excerpt", "url", "path"])
    return bool(PUBLIC_SOURCE_NOTE_BLOCKLIST.search(text))


def source_note_path_for_card(card: dict) -> Path:
    source = str(card.get("source") or "unknown").lower()
    family = SOURCE_FAMILY_LABELS.get(source, source.title()).replace(" / ", "-").replace(" ", "-")
    title = str(card.get("title") or "untitled source")
    card_id = re.sub(r"[^a-zA-Z0-9]+", "-", str(card.get("id") or "source")).strip("-").lower()
    slug = slugify(title)[:90]
    return VAULT / "Wiki" / "SourceNotes" / family / f"{slug}-{card_id[-12:]}.md"


def card_terms(card: dict, limit: int = 14) -> list[str]:
    terms: list[str] = []
    for key in ["keywords", "tags", "categories", "sourceCategories"]:
        value = card.get(key)
        if isinstance(value, list):
            for item in value:
                term = str(item).strip()
                if term and term not in terms:
                    terms.append(term)
    for topic in card.get("semanticTopics") or []:
        if isinstance(topic, dict):
            term = str(topic.get("topic") or "").strip()
            if term and term not in terms:
                terms.append(term)
    return terms[:limit]


def yaml_string(value: object) -> str:
    return json.dumps(str(value), ensure_ascii=False)


def source_note_markdown(card: dict) -> str:
    title = str(card.get("title") or "Untitled source").strip() or "Untitled source"
    source = str(card.get("source") or "unknown").lower()
    source_label = SOURCE_FAMILY_LABELS.get(source, source)
    source_path = str(card.get("path") or "")
    source_ref = f"obsidian-vault/{source_path}" if not source_path.startswith("obsidian-vault/") else source_path
    url = str(card.get("url") or "")
    terms = card_terms(card)
    excerpt = compact(str(card.get("excerpt") or ""), 900)
    source_passages = extract_source_passages(local_path(source_ref), max_items=5) if local_path_exists(source_ref) else []
    if source_passages:
        evidence_items = source_passages
    elif excerpt and "No plaintext extract returned" not in excerpt:
        evidence_items = [excerpt]
    else:
        evidence_items = ["No readable plaintext passage was available in the local source export; use this note as a routing anchor, not as proof for synthesis."]
    summary_terms = ", ".join(terms[:8]) or source_label
    thin = not source_passages and ("No plaintext extract returned" in excerpt or len(excerpt) < 120)
    summary = f"Compiled source note for {title} from {source_label}. Key terms: {summary_terms}."
    note_id = f"source-note-{source}-{slugify(str(card.get('id') or title))}"
    related_concepts = [term for term in terms if re.search(r"commons|community|bio|care|infrastructure|art|lab|fermentation|kitchen|documentation", term, re.I)][:8]
    related_methods = [term for term in terms if re.search(r"workshop|protocol|diy|experiment|tool|kit|fabrication|electronics", term, re.I)][:8]
    related_materials = [term for term in terms if re.search(r"textile|fabric|circuit|food|coco|cellulose|sensor|material|fermentation|tofu", term, re.I)][:8]
    related_social = [term for term in terms if re.search(r"community|commons|lab|kitchen|camp|festival|workshop|hosting", term, re.I)][:8]
    lines = [
        "---",
        f"id: {yaml_string(note_id)}",
        f"title: {yaml_string(title)}",
        "type: source",
        "status: compiled-source-note",
        f"summary: {yaml_string(summary)}",
        "sourceRefs:",
        f"  - {source_ref}",
        "evidence:",
        *[f"  - {yaml_string(item)}" for item in evidence_items[:5]],
        "relatedConcepts:",
        *[f"  - {term}" for term in related_concepts],
        "relatedMethods:",
        *[f"  - {term}" for term in related_methods],
        "relatedMaterials:",
        *[f"  - {term}" for term in related_materials],
        "relatedSocialForms:",
        *[f"  - {term}" for term in related_social],
        "relatedProjects:",
        f"  - {source_label}",
        "openQuestions:",
        "  - What stronger source passage should replace this automatic source-card summary?" if thin else "  - Which compiled concept or synthesis note should this source support?",
        "---",
        "",
        f"# {title}",
        "",
        "## Scope",
        "",
        f"This is a compiled source note for one raw source page from {source_label}. It is part of the PBS Karpathy Core v1 source-note layer: raw sources remain immutable, while this note gives the runtime a durable, citable wiki page to query before synthesis.",
        "",
        "## Source",
        "",
        f"- source family: `{source_label}`",
        f"- sourceRef: `{source_ref}`",
        f"- url: {url or 'not recorded'}",
        f"- source card id: `{card.get('id') or ''}`",
        "",
        "## Evidence",
        "",
        *[f"- {item} [1]" for item in evidence_items[:5]],
        "",
        "## Terms",
        "",
        *(f"- {term}" for term in terms),
        "",
        "## Lint Notes",
        "",
        "- This source note was generated deterministically from the local source card export.",
        "- It is safe as a retrieval anchor, but claims still need stronger human/LLM review before promotion into concept, material, social-form, comparison, or synthesis notes.",
        "- The raw source page was not modified.",
        "",
        "## Citations",
        "",
        f"[1] `{source_ref}`",
        "",
        "## Open Questions",
        "",
        "- What exact claim, if any, should this source contribute to the compiled PBS wiki?",
    ]
    return "\n".join(lines) + "\n"


def command_compile_source_notes(args: argparse.Namespace) -> int:
    if not args.legacy_enable:
        print("compile-source-notes is disabled in PBS-2026.2; use NotebookLM source packs and promote traces instead.")
        return 1
    all_cards_path = VAULT / "daydream-export/sourceCards.enriched.json"
    payload = json.loads(all_cards_path.read_text(encoding="utf-8"))
    all_cards = payload.get("cards", []) if isinstance(payload, dict) else []
    cards = source_cards_for_compilation()
    written = 0
    skipped = 0
    filtered = 0
    if args.overwrite:
        for card in all_cards:
            if isinstance(card, dict) and is_public_source_note_blocked(card):
                path = source_note_path_for_card(card)
                if path.exists():
                    path.unlink()
                filtered += 1
    for card in cards:
        path = source_note_path_for_card(card)
        if path.exists() and not args.overwrite:
            skipped += 1
            continue
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(source_note_markdown(card), encoding="utf-8")
        written += 1
    append_wiki_log("compile", "full source-note layer", [
        f"Compiled `{written}` source notes into `obsidian-vault/Wiki/SourceNotes/`.",
        f"Skipped `{skipped}` existing source notes.",
        f"Filtered `{filtered}` unsafe public source-note candidates.",
        "Raw source files were not modified.",
    ])
    print(f"cards={len(cards)}")
    print(f"written={written}")
    print(f"skipped={skipped}")
    print(f"filtered={filtered}")
    return 0


def command_lint_evidence(args: argparse.Namespace) -> int:
    warnings, errors = evidence_lint_rows()
    print(f"warnings={len(warnings)}")
    print(f"errors={len(errors)}")
    for item in warnings[: args.limit]:
        print(f"WARNING {item}")
    for item in errors[: args.limit]:
        print(f"ERROR {item}")
    if args.write_log:
        out_dir = VAULT / "Wiki/Logs"
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / f"evidence-lint-{now_iso()[:10]}.md"
        lines = [
            "---",
            "type: evidence-lint-report",
            "status: review-artifact",
            "sourceRefs:",
            "  - scripts/wiki_tool.py",
            "---",
            "",
            "# Evidence Lint Report",
            "",
            f"- warnings: {len(warnings)}",
            f"- errors: {len(errors)}",
            "",
            "## Warnings",
            "",
            *[f"- {item}" for item in warnings],
            "",
            "## Errors",
            "",
            *[f"- {item}" for item in errors],
        ]
        out_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
        append_wiki_log("lint", "evidence lint", [
            f"Wrote `{rel(out_path)}`.",
            f"Found {len(warnings)} warnings and {len(errors)} errors in compiled Wiki folders.",
        ])
        print(f"artifact={rel(out_path)}")
    return 1 if errors else 0


def wiki_note_key(path: Path, text: str) -> str:
    return slugify(str(parse_frontmatter(text).get("title") or path.stem))


def compiled_note_records() -> list[dict]:
    records: list[dict] = []
    for path in compiled_wiki_paths():
        text = path.read_text(encoding="utf-8", errors="ignore")
        fm = parse_frontmatter(text)
        title = str(fm.get("title") or path.stem)
        records.append({
            "path": path,
            "relPath": rel(path),
            "title": title,
            "key": slugify(title),
            "folder": path.parent.name,
            "text": text,
            "refs": parse_refs(text),
            "links": extract_wikilink_targets(text),
            "searchText": re.sub(r"\s+", " ", f"{title} {fm.get('summary') or ''} {markdown_section(text, 'Definition', 900)} {markdown_section(text, 'Source-Backed Claims', 900)} {markdown_section(text, 'Evidence', 900)}"),
        })
    return records


def compiled_note_lookup(records: list[dict]) -> dict[str, dict]:
    lookup: dict[str, dict] = {}
    for record in records:
        path = record["path"]
        keys = {
            record["key"],
            slugify(str(record["title"])),
            slugify(path.stem),
            slugify(f"Wiki/{record['folder']}/{path.stem}"),
            slugify(f"{record['folder']}/{path.stem}"),
        }
        for key in keys:
            lookup[key] = record
    return lookup


def score_wiki_record(record: dict, query: str) -> tuple[float, list[str]]:
    terms = tokenize(query)
    title = str(record["title"]).lower()
    text = str(record["searchText"]).lower()
    score = 0.0
    reasons: list[str] = []
    for term in terms:
        if term in title:
            score += 6
            reasons.append(f"title:{term}")
        count = text.count(term)
        if count:
            score += min(count, 5)
    if record["refs"]:
        score += min(len(record["refs"]), 5) * 0.25
    if "## Source-Backed Claims" in str(record["text"]):
        score += 1.5
        reasons.append("claims")
    return score, sorted(set(reasons))[:8]


def graph_neighbors(record: dict, lookup: dict[str, dict]) -> list[dict]:
    neighbors = []
    for target in record["links"]:
        key = slugify(target)
        candidate = lookup.get(key) or lookup.get(slugify(target.rsplit("/", 1)[-1]))
        if candidate and candidate["relPath"] != record["relPath"] and candidate not in neighbors:
            neighbors.append(candidate)
    for candidate in lookup.values():
        if candidate["relPath"] == record["relPath"]:
            continue
        if any(slugify(target) == record["key"] or slugify(target.rsplit("/", 1)[-1]) == record["key"] for target in candidate["links"]):
            if candidate not in neighbors:
                neighbors.append(candidate)
    return neighbors


def query_route(query: str, hops: int, limit: int) -> dict:
    records = compiled_note_records()
    lookup = compiled_note_lookup(records)
    ranked = []
    for record in records:
        score, reasons = score_wiki_record(record, query)
        if score > 0:
            ranked.append({"record": record, "score": round(score, 2), "reasons": reasons})
    ranked.sort(key=lambda item: (-item["score"], item["record"]["title"]))
    anchors = ranked[:limit]
    visited = {item["record"]["relPath"] for item in anchors}
    frontier = [item["record"] for item in anchors]
    expansions: list[dict] = []
    for depth in range(1, hops + 1):
        next_frontier = []
        for record in frontier:
            for neighbor in graph_neighbors(record, lookup):
                if neighbor["relPath"] in visited:
                    continue
                visited.add(neighbor["relPath"])
                expansions.append({"from": record["relPath"], "to": neighbor["relPath"], "depth": depth, "title": neighbor["title"]})
                next_frontier.append(neighbor)
        frontier = next_frontier
    used_records = [item["record"] for item in anchors] + [next(record for record in records if record["relPath"] == item["to"]) for item in expansions]
    source_refs = list(dict.fromkeys([ref for record in used_records for ref in record["refs"]]))
    verified_refs = []
    thin_refs = []
    for ref in source_refs:
        if not local_path_exists(ref):
            continue
        path = local_path(ref)
        (thin_refs if is_thin_source_text(path.read_text(encoding="utf-8", errors="ignore")) else verified_refs).append(ref)
    return {
        "type": "wiki-query-route",
        "status": "review-artifact",
        "query": query,
        "hops": hops,
        "anchors": [{"path": item["record"]["relPath"], "title": item["record"]["title"], "score": item["score"], "reasons": item["reasons"]} for item in anchors],
        "expansions": expansions,
        "sourceRefs": source_refs,
        "verifiedReadableSourceRefs": verified_refs,
        "thinSourceRefs": thin_refs,
        "warnings": [] if anchors else ["query found no compiled Wiki anchor"],
    }


def command_query(args: argparse.Namespace) -> int:
    route = query_route(args.query, args.hops, args.limit)
    out_dir = VAULT / "Review/query-routes"
    out_dir.mkdir(parents=True, exist_ok=True)
    slug = slugify(args.query)[:80]
    json_path = out_dir / f"{slug}.json"
    md_path = out_dir / f"{slug}.md"
    json_path.write_text(json.dumps(route, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    lines = [
        "---",
        "type: wiki-query-route",
        "status: review-artifact",
        "sourceRefs:",
        "  - scripts/wiki_tool.py",
        "  - obsidian-vault/Wiki/index.md",
        "---",
        "",
        f"# Query Route: {args.query}",
        "",
        "## Anchors",
        "",
    ]
    lines.extend([f"- [[{item['path'].replace('obsidian-vault/Wiki/', '').removesuffix('.md')}|{item['title']}]] score `{item['score']}` reasons `{', '.join(item['reasons']) or 'text match'}`" for item in route["anchors"]] or ["- No compiled Wiki anchor found."])
    lines.extend(["", "## Traversal", ""])
    lines.extend([f"- depth {item['depth']}: `{item['from']}` -> `{item['to']}`" for item in route["expansions"]] or ["- No wikilink traversal available."])
    lines.extend(["", "## Source Verification", "", f"- readable sourceRefs: {len(route['verifiedReadableSourceRefs'])}", f"- thin sourceRefs: {len(route['thinSourceRefs'])}", ""])
    if route["thinSourceRefs"]:
        lines.extend(["## Thin SourceRefs", "", *[f"- `{ref}`" for ref in route["thinSourceRefs"][:20]], ""])
    md_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
    append_wiki_log("query", args.query, [f"Wrote `{rel(md_path)}` route trace.", f"Anchors: {len(route['anchors'])}; expansions: {len(route['expansions'])}."])
    print(f"artifact={rel(md_path)}")
    print(f"anchors={len(route['anchors'])}")
    print(f"expansions={len(route['expansions'])}")
    return 0 if route["anchors"] else 1


def incoming_link_counts(records: list[dict], lookup: dict[str, dict]) -> dict[str, int]:
    counts = {record["relPath"]: 0 for record in records}
    for record in records:
        for neighbor in graph_neighbors(record, lookup):
            counts[neighbor["relPath"]] = counts.get(neighbor["relPath"], 0) + 1
    return counts


def routing_gap_rows(query: str | None = None, limit: int = 40) -> list[dict]:
    records = compiled_note_records()
    lookup = compiled_note_lookup(records)
    incoming = incoming_link_counts(records, lookup)
    rows: list[dict] = []
    compiled_text = compiled_note_text().lower()
    bridge_dir = VAULT / "Sources/PBS Semantic Layers/Concepts"
    for path in sorted(bridge_dir.glob("*.md")) if bridge_dir.is_dir() else []:
        title = path.stem
        if slugify(title) not in {record["key"] for record in records} and title.lower() not in compiled_text:
            rows.append({"kind": "bridge-without-compiled-note", "path": rel(path), "title": title, "severity": "high"})
    for record in records:
        if incoming.get(record["relPath"], 0) == 0:
            rows.append({"kind": "compiled-note-without-incoming-links", "path": record["relPath"], "title": record["title"], "severity": "medium"})
        if record["refs"] and "## Source-Backed Claims" not in str(record["text"]):
            rows.append({"kind": "sourceRefs-without-source-backed-claims", "path": record["relPath"], "title": record["title"], "severity": "high"})
        if record["refs"] and all(local_path_exists(ref) and is_thin_source_text(local_path(ref).read_text(encoding="utf-8", errors="ignore")) for ref in record["refs"]):
            rows.append({"kind": "all-sourceRefs-are-thin", "path": record["relPath"], "title": record["title"], "severity": "high"})
    if query:
        route = query_route(query, 1, 5)
        if not route["anchors"]:
            rows.append({"kind": "query-without-core-note", "query": query, "title": query, "severity": "high"})
    severity_order = {"high": 0, "medium": 1, "low": 2}
    rows.sort(key=lambda row: (severity_order.get(str(row.get("severity")), 9), str(row.get("kind")), str(row.get("title"))))
    return rows[:limit]


def command_routing_gap_lint(args: argparse.Namespace) -> int:
    out_dir = VAULT / "Review/routing-gaps"
    out_dir.mkdir(parents=True, exist_ok=True)
    rows = routing_gap_rows(args.query, args.limit)
    payload = {"type": "routing-gap-lint-report", "status": "review-candidates", "sourceRefs": ["scripts/wiki_tool.py", "obsidian-vault/Wiki/index.md"], "query": args.query, "candidates": rows}
    json_path = out_dir / "latest.json"
    md_path = out_dir / "latest.md"
    json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    lines = [
        "---",
        "type: routing-gap-lint-report",
        "status: review-candidates",
        "sourceRefs:",
        "  - scripts/wiki_tool.py",
        "  - obsidian-vault/Wiki/index.md",
        "---",
        "",
        "# Routing Gap Lint Report",
        "",
        "These gaps identify where the compiled Wiki still fails as a queryable GraphRAG layer.",
        "",
    ]
    for row in rows:
        lines.extend([f"## {row['title']}", "", f"- kind: `{row['kind']}`", f"- severity: `{row['severity']}`"])
        if row.get("path"):
            lines.append(f"- path: `{row['path']}`")
        if row.get("query"):
            lines.append(f"- query: `{row['query']}`")
        lines.append("")
    md_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
    for row in rows:
        print(json.dumps(row, ensure_ascii=False))
    print(f"routing_gap_candidates={len(rows)}")
    print(f"artifact={rel(md_path)}")
    return 0


def compiled_note_text() -> str:
    folders = ["Concepts", "Methods", "Materials", "Theories", "SocialForms", "Projects", "Comparisons", "Syntheses"]
    texts: list[str] = []
    for folder in folders:
        for path in sorted((VAULT / "Wiki" / folder).glob("**/*.md")):
            if path.name.lower() == "readme.md":
                continue
            texts.append(f"{path.stem}\n{path.read_text(encoding='utf-8', errors='ignore')}")
    return "\n".join(texts)


def terrain_gap_candidates(limit: int) -> list[dict]:
    cards = load_source_cards()
    compiled = compiled_note_text().lower()
    candidates: list[dict] = []
    for motif in TERRAIN_GAP_MOTIFS:
        pattern = re.compile(str(motif["pattern"]), re.I)
        matches = [card for card in cards if pattern.search(card_text(card))]
        if str(motif["id"]).startswith("sgmk-"):
            matches = [
                card for card in matches
                if str(card.get("source", "")).lower() == "sgmk" or "sgmk" in card_text(card).lower()
            ]
            matches.sort(key=lambda card: 0 if str(card.get("source", "")).lower() == "sgmk" else 1)
        compiled_exists = bool(re.search(str(motif["compiled_hint"]), compiled, re.I))
        if len(matches) < 6 or compiled_exists:
            continue
        sample = []
        for card in matches[:8]:
            sample.append({
                "title": card.get("title"),
                "source": card.get("source"),
                "url": card.get("url"),
                "path": card.get("path"),
            })
        candidates.append({
            "id": motif["id"],
            "title": motif["title"],
            "matchedSourceCards": len(matches),
            "compiledNodeExists": compiled_exists,
            "candidateFolder": motif["candidate_folder"],
            "petBroadcast": motif["pet_broadcast"],
            "sampleEvidence": sample,
            "reviewStatus": "candidate-not-promoted",
        })
    return candidates[:limit]


def command_terrain_gap_lint(args: argparse.Namespace) -> int:
    out_dir = VAULT / "Review/terrain-gaps"
    out_dir.mkdir(parents=True, exist_ok=True)
    candidates = terrain_gap_candidates(args.limit)
    payload = {
        "type": "terrain-gap-lint-report",
        "status": "review-candidates",
        "sourceRefs": ["scripts/wiki_tool.py", "obsidian-vault/daydream-export/sourceCards.enriched.json"],
        "candidates": candidates,
    }
    (out_dir / "latest.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    lines = [
        "---",
        "type: terrain-gap-lint-report",
        "status: review-candidates",
        "sourceRefs:",
        "  - scripts/wiki_tool.py",
        "  - obsidian-vault/daydream-export/sourceCards.enriched.json",
        "---",
        "",
        "# Terrain Gap Lint Report",
        "",
        "These are review candidates only. Do not promote them into compiled wiki notes until sourceRefs and evidence are manually verified.",
        "",
    ]
    for item in candidates:
        lines.extend([
            f"## {item['title']}",
            "",
            f"- id: `{item['id']}`",
            f"- matched source cards: {item['matchedSourceCards']}",
            f"- candidate folder: `{item['candidateFolder']}`",
            f"- pet broadcast: {item['petBroadcast']}",
            "- sample evidence:",
            *[f"  - {sample.get('title')} ({sample.get('source')})" for sample in item["sampleEvidence"][:5]],
            "",
        ])
    (out_dir / "latest.md").write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
    for item in candidates:
        print(json.dumps(item, ensure_ascii=False))
    print(f"terrain_gap_candidates={len(candidates)}")
    print("artifact=obsidian-vault/Review/terrain-gaps/latest.md")
    return 0


def cross_community_gap_candidates(limit: int) -> list[dict]:
    cards = load_source_cards()
    compiled = compiled_note_text().lower()
    topic_map: dict[str, dict] = {}
    for card in cards:
        family = str(card.get("source") or "unknown")
        for topic in card.get("semanticTopics") or []:
            if not isinstance(topic, dict) or not topic.get("topic"):
                continue
            title = str(topic["topic"]).strip()
            key = title.lower()
            item = topic_map.setdefault(key, {"topic": title, "families": set(), "cards": []})
            item["families"].add(family)
            if len(item["cards"]) < 8:
                item["cards"].append({
                    "title": card.get("title"),
                    "source": family,
                    "path": card.get("path"),
                    "url": card.get("url"),
                })
    rows: list[dict] = []
    for item in topic_map.values():
        families = sorted(item["families"])
        if len(families) < 2:
            continue
        compiled_exists = item["topic"].lower() in compiled
        if compiled_exists:
            continue
        rows.append({
            "topic": item["topic"],
            "sourceFamilies": families,
            "matchedSourceCards": len(item["cards"]),
            "compiledNodeExists": False,
            "candidateFolder": "Wiki/Concepts, Wiki/Methods, or Wiki/Syntheses",
            "reviewStatus": "cross-community-candidate-not-promoted",
            "sampleEvidence": item["cards"],
        })
    rows.sort(key=lambda row: (-len(row["sourceFamilies"]), str(row["topic"])))
    return rows[:limit]


def command_cross_community_gap_lint(args: argparse.Namespace) -> int:
    out_dir = VAULT / "Review/terrain-gaps"
    out_dir.mkdir(parents=True, exist_ok=True)
    candidates = cross_community_gap_candidates(args.limit)
    payload = {
        "type": "cross-community-gap-lint-report",
        "status": "review-candidates",
        "sourceRefs": ["scripts/wiki_tool.py", "obsidian-vault/daydream-export/sourceCards.enriched.json"],
        "candidates": candidates,
    }
    json_path = out_dir / "cross-community-latest.json"
    md_path = out_dir / "cross-community-latest.md"
    json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    lines = [
        "---",
        "type: cross-community-gap-lint-report",
        "status: review-candidates",
        "sourceRefs:",
        "  - scripts/wiki_tool.py",
        "  - obsidian-vault/daydream-export/sourceCards.enriched.json",
        "---",
        "",
        "# Cross-Community Gap Lint Report",
        "",
        "These topics appear across multiple source families but do not yet have an obvious compiled Wiki note. Review before promotion.",
        "",
    ]
    for item in candidates:
        lines.extend([
            f"## {item['topic']}",
            "",
            f"- source families: {', '.join(item['sourceFamilies'])}",
            f"- candidate folder: `{item['candidateFolder']}`",
            "- sample evidence:",
            *[f"  - {sample.get('title')} ({sample.get('source')})" for sample in item["sampleEvidence"][:5]],
            "",
        ])
    md_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
    for item in candidates:
        print(json.dumps(item, ensure_ascii=False))
    print(f"cross_community_gap_candidates={len(candidates)}")
    print(f"artifact={rel(md_path)}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("doctor").set_defaults(func=command_doctor)
    sub.add_parser("build").set_defaults(func=command_build)
    search = sub.add_parser("search-catalog")
    search.add_argument("query", nargs="+")
    search.add_argument("--limit", type=int, default=10)
    search.set_defaults(func=command_search_catalog)
    sub.add_parser("lint").set_defaults(func=command_lint)
    sub.add_parser("source-coverage").set_defaults(func=command_source_coverage)
    hybrid = sub.add_parser("hybrid-search")
    hybrid.add_argument("--query", required=True)
    hybrid.add_argument("--limit", type=int, default=10)
    hybrid.add_argument("--source")
    hybrid.set_defaults(func=command_hybrid_search)
    build_note = sub.add_parser("build-note")
    build_note.add_argument("--type", required=True, choices=sorted(NOTE_TYPE_FOLDERS))
    build_note.add_argument("--title", required=True)
    build_note.add_argument("--query")
    build_note.add_argument("--source")
    build_note.add_argument("--source-ref", action="append")
    build_note.add_argument("--limit", type=int, default=5)
    build_note.add_argument("--output")
    build_note.add_argument("--overwrite", action="store_true")
    build_note.set_defaults(func=command_build_note)
    ingest_source = sub.add_parser("ingest-source")
    ingest_source.add_argument("--source")
    ingest_source.add_argument("--bridge")
    ingest_source.add_argument("--source-ref", action="append")
    ingest_source.add_argument("--query")
    ingest_source.add_argument("--source-family")
    ingest_source.add_argument("--type", choices=sorted(NOTE_TYPE_FOLDERS))
    ingest_source.add_argument("--title")
    ingest_source.add_argument("--limit", type=int, default=6)
    ingest_source.add_argument("--output")
    ingest_source.add_argument("--overwrite", action="store_true")
    ingest_source.set_defaults(func=command_ingest_source)
    ingest_batch = sub.add_parser("ingest-batch")
    ingest_batch.add_argument("--source")
    ingest_batch.add_argument("--bridge")
    ingest_batch.add_argument("--source-ref", action="append")
    ingest_batch.add_argument("--query")
    ingest_batch.add_argument("--source-family")
    ingest_batch.add_argument("--type", choices=sorted(NOTE_TYPE_FOLDERS))
    ingest_batch.add_argument("--title")
    ingest_batch.add_argument("--limit", type=int, default=5)
    ingest_batch.add_argument("--output-dir", default="obsidian-vault/Review/thickened-notes")
    ingest_batch.add_argument("--overwrite", action="store_true")
    ingest_batch.set_defaults(func=command_ingest_batch)
    lint_evidence = sub.add_parser("lint-evidence")
    lint_evidence.add_argument("--limit", type=int, default=80)
    lint_evidence.add_argument("--write-log", action="store_true")
    lint_evidence.set_defaults(func=command_lint_evidence)
    export_wiki = sub.add_parser("export-wiki-index")
    export_wiki.add_argument("--output", default="webview-ui/public/assets/pbs-wiki-index.json")
    export_wiki.set_defaults(func=command_export_wiki_index)
    compile_sources = sub.add_parser("compile-source-notes")
    compile_sources.add_argument("--overwrite", action="store_true")
    compile_sources.add_argument("--legacy-enable", action="store_true")
    compile_sources.set_defaults(func=command_compile_source_notes)
    query = sub.add_parser("query")
    query.add_argument("--query", required=True)
    query.add_argument("--hops", type=int, default=2)
    query.add_argument("--limit", type=int, default=5)
    query.set_defaults(func=command_query)
    routing = sub.add_parser("routing-gap-lint")
    routing.add_argument("--query")
    routing.add_argument("--limit", type=int, default=40)
    routing.set_defaults(func=command_routing_gap_lint)
    terrain = sub.add_parser("terrain-gap-lint")
    terrain.add_argument("--limit", type=int, default=10)
    terrain.set_defaults(func=command_terrain_gap_lint)
    cross = sub.add_parser("cross-community-gap-lint")
    cross.add_argument("--limit", type=int, default=12)
    cross.set_defaults(func=command_cross_community_gap_lint)
    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
