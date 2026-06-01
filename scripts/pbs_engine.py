#!/usr/bin/env python3
"""PBS knowledge engine: source -> passage -> claim -> query.

This engine is deliberately separate from the game/zine runtime. It never
mutates raw sources and never treats player questions as knowledge.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from datetime import datetime, timezone
import hashlib
import html
import json
import re
import sqlite3
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VAULT = ROOT  # legacy name kept for old helper functions; do not recreate obsidian-vault.
SOURCES = ROOT / "Sources"
STORE = ROOT / "Knowledge"
RAW_SOURCES = ROOT / "Sources" / "Raw"
SQLITE_PATH = STORE / "pbs_source_first.sqlite"
REGISTRY_PATH = STORE / "source-registry.jsonl"
PASSAGES_PATH = STORE / "passages.jsonl"
CLAIMS_PATH = STORE / "claims.jsonl"
QUERY_DIR = STORE / "query-runs"
WEB_CACHE = STORE / "web-cache"
NOTE_DRAFT_DIR = ROOT / "Review" / "compiled-note-drafts"
EXPERIMENT_DIR = STORE / "experiments"
LINT_PATH = STORE / "engine-lint.md"

# Clean source-first layout. Legacy `obsidian-vault/Sources/* Full` may exist in
# old PBS checkouts, but the engine/runtime should not treat it as canonical.
SOURCE_FOLDERS: list[str] = []

MEDIAWIKI_API = {
    "hackteria": "https://www.hackteria.org/wiki/api.php",
    "sgmk": "https://wiki.sgmk-ssam.ch/api.php",
}

HIGH_VALUE_TERMS = {
    "8bit", "bio", "biology", "biomod", "camera", "camp", "chemistry", "circuit", "commons", "community",
    "diy", "electron", "festival", "hardware", "homemade", "lab", "laser", "machine", "microscope", "microscopy",
    "open", "residency", "sensor", "solar", "sound", "summer", "synth", "textile", "workshop",
}

LOW_VALUE_TITLE_TERMS = {
    "admin", "calendar", "category", "help", "index", "meeting notes", "protokoll", "sandbox", "template", "traktanden", "widget",
}

STOP_WORDS = {
    "about", "after", "also", "and", "are", "because", "been", "being", "can", "could", "for", "from",
    "have", "into", "not", "of", "on", "or", "our", "source", "that", "the", "their", "this", "through",
    "with", "would", "一個", "什麼", "可以", "如何", "我們", "這個",
}

GENERIC_QUERY_TERMS = {
    "camp", "commons", "diy", "hardware", "open", "temporary", "workshop", "workshops",
}

PBS_DOMAIN_TERMS = {
    "8bit", "arduino", "bio", "bioart", "biohacking", "camp", "circuit", "commons", "community", "diy",
    "etextile", "e-textile", "fabric", "hackteria", "htgwyw", "kobakant", "lab", "microscope", "microscopy",
    "open", "residency", "sensor", "sgmk", "solar", "sound", "synth", "textile", "wearable", "workshop",
    "小誌", "工作坊", "共同體", "社群", "聲音", "太陽能", "織品", "顯微", "開源", "電子", "材料",
}

ZINE_EXPERIMENT_CASES = [
    {"id": "keyword-etextile", "input": "e-textile summer camp", "expected": "accept", "family": "htgwyw", "kind": "keywords"},
    {"id": "imperative-8bit", "input": "幫我做一本 8bit mix tape workshop 小誌", "expected": "accept", "family": "sgmk", "kind": "imperative-specific"},
    {"id": "question-microscopy", "input": "How can DIY microscopy become open hardware?", "expected": "accept", "family": "hackteria", "kind": "full-question"},
    {"id": "mixed-solar", "input": "solar oracle walkman 聲音與太陽能", "expected": "accept", "family": "sgmk", "kind": "mixed-language"},
    {"id": "broad-workshop", "input": "workshop", "expected": "guide", "family": "all", "kind": "keyword-too-broad"},
    {"id": "vague-commons", "input": "我想知道這裡的共同體是什麼", "expected": "guide", "family": "all", "kind": "vague-contextual"},
    {"id": "command-broad-bioart", "input": "做一份關於 bio art 的完整總整理", "expected": "guide", "family": "all", "kind": "imperative-broad"},
    {"id": "compare-communities", "input": "比較 Hackteria 和 SGMK 的 workshop culture", "expected": "guide", "family": "all", "kind": "comparison-needs-scope"},
    {"id": "offtopic-macbook", "input": "How do I fix my MacBook battery?", "expected": "refuse", "family": "all", "kind": "out-of-scope"},
    {"id": "offtopic-food", "input": "推薦我台北晚餐餐廳", "expected": "refuse", "family": "all", "kind": "out-of-scope"},
    {"id": "unsafe-medical", "input": "給我治療感染的醫療建議", "expected": "refuse", "family": "all", "kind": "out-of-scope-medical"},
    {"id": "too-short", "input": "材料", "expected": "guide", "family": "all", "kind": "too-short"},
]

CLAIM_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("definition", re.compile(r"\b(is|are|was|were|refers to|means|is a|are a)\b|是|代表|指的是", re.I)),
    ("event", re.compile(r"\b(held|organized|hosted|took place|workshop|camp|festival|meeting|open call)\b|工作坊|營隊|活動|舉辦", re.I)),
    ("method", re.compile(r"\b(hands-on|share|teach|learn|build|prototype|documentation|practice|method)\b|實作|教學|方法|分享|紀錄", re.I)),
    ("material", re.compile(r"\b(textile|circuit|sensor|electronics|bio|material|fabric|soft circuitry|microscopy)\b|材料|織品|電子|感測", re.I)),
    ("social-form", re.compile(r"\b(community|commons|participants|practitioners|collaboration|exchange|network)\b|社群|共同|參與|協作|交換", re.I)),
]

WEAK_DRAFT_PATTERNS = [
    re.compile(r"\b(download|downloaded|available now|contact\s+\[?mailto|if you don't have an account)\b", re.I),
    re.compile(r"\b(is a transdisciplinary scholar|is a self-taught programmer|visiting faculty|permanent faculty)\b", re.I),
]


@dataclass
class SourceRecord:
    id: str
    path: str
    title: str
    source_family: str
    sha256: str
    mtime: float
    bytes: int
    readability: str


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def slugify(value: str) -> str:
    slug = re.sub(r"[^\w\s-]", "", value.lower(), flags=re.UNICODE)
    slug = re.sub(r"[\s_]+", "-", slug).strip("-")
    return slug or "untitled"


def ensure_store() -> None:
    STORE.mkdir(parents=True, exist_ok=True)
    QUERY_DIR.mkdir(parents=True, exist_ok=True)
    WEB_CACHE.mkdir(parents=True, exist_ok=True)
    NOTE_DRAFT_DIR.mkdir(parents=True, exist_ok=True)
    EXPERIMENT_DIR.mkdir(parents=True, exist_ok=True)


def read_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    rows = []
    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        if line.strip():
            rows.append(json.loads(line))
    return rows


def write_jsonl(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(json.dumps(row, ensure_ascii=False, sort_keys=True) for row in rows) + ("\n" if rows else ""), encoding="utf-8")


def file_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def frontmatter(text: str) -> dict[str, str]:
    if not text.startswith("---\n"):
        return {}
    end = text.find("\n---", 4)
    if end < 0:
        return {}
    data = {}
    for line in text[4:end].splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        data[key.strip()] = value.strip().strip('"')
    return data


def frontmatter_int(text: str, key: str) -> int | None:
    value = frontmatter(text).get(key)
    if not value:
        return None
    try:
        return int(value)
    except ValueError:
        return None


def frontmatter_length(text: str) -> int:
    return frontmatter_int(text, "length") or 0


def strip_frontmatter(text: str) -> str:
    if not text.startswith("---\n"):
        return text
    end = text.find("\n---", 4)
    return text[end + 4 :].lstrip() if end >= 0 else text



def configured_source_urls() -> list[str]:
    config_path = ROOT / "pbs_sources.json"
    if not config_path.exists():
        return []
    try:
        payload = json.loads(config_path.read_text(encoding="utf-8"))
    except Exception:
        return []
    urls = payload.get("source_urls")
    if isinstance(urls, list):
        return [str(url).strip() for url in urls if str(url).strip()]
    sources = payload.get("sources")
    if isinstance(sources, dict):
        out: list[str] = []
        for value in sources.values():
            if isinstance(value, dict):
                main = str(value.get("main") or "").strip()
                if main:
                    out.append(main)
        return out
    return []


def source_family_for(path: Path) -> str:
    parts = {part.lower() for part in path.parts}
    lowered = path.as_posix().lower()
    if "hackteria" in parts or "hackteria full" in lowered:
        return "hackteria"
    if "htgwyw" in parts or "kobakant" in lowered or "how to get what you want" in lowered:
        return "htgwyw"
    if "designposthumanism" in parts or "designandposthumanism" in lowered or "design+posthumanism" in lowered:
        return "designposthumanism"
    if "sgmk" in parts or "sgmk full" in lowered:
        return "sgmk"
    return "unknown"


def title_for(path: Path, text: str) -> str:
    fm = frontmatter(text)
    if fm.get("title"):
        return fm["title"]
    heading = re.search(r"^#\s+(.+)$", text, re.M)
    return heading.group(1).strip() if heading else path.stem


def source_paths(limit: int | None = None, family: str | None = None) -> list[Path]:
    """Return canonical raw sources from top-level Sources/Raw only."""
    paths: list[Path] = []
    if not RAW_SOURCES.exists():
        return paths
    for path in sorted(RAW_SOURCES.rglob("*.md")):
        if family and family != "all" and source_family_for(path) != family:
            continue
        paths.append(path)
        if limit and len(paths) >= limit:
            return paths
    return paths


def clean_body(text: str) -> str:
    body = strip_frontmatter(text)
    body = re.sub(r"<!--.*?-->", " ", body, flags=re.S)
    body = re.sub(r"^Source:\s*https?://\S+", " ", body, flags=re.M)
    body = re.sub(r"#pbs/source/\S+", " ", body)
    return body


def markdown_url(text: str) -> str:
    fm = frontmatter(text)
    if fm.get("url"):
        return fm["url"]
    match = re.search(r"^Source:\s*(https?://\S+)", text, flags=re.M)
    return match.group(1) if match else ""


def memory_source_family(path: Path, text: str = "") -> str:
    fm = frontmatter(text) if text else {}
    if fm.get("sourceFamily"):
        return fm["sourceFamily"].lower()
    lowered = path.as_posix().lower()
    if "hackteria" in lowered:
        return "hackteria"
    if "sgmk" in lowered:
        return "sgmk"
    if "kobakant" in lowered or "how-to-get-what-you-want" in lowered or "how to get what you want" in lowered or "htgwyw" in lowered:
        return "htgwyw"
    if "/wiki/" in lowered:
        return "wiki"
    if "/schema/" in lowered:
        return "schema"
    return "unknown"


def iter_memory_docs(family: str | None = None) -> list[dict]:
    # Runtime search is source-first: use only top-level Sources/Raw. Legacy
    # Obsidian wiki/review/source folders may remain in old repos but are not
    # authoritative evidence for the game or local memory server.
    roots: list[Path] = [RAW_SOURCES] if RAW_SOURCES.exists() else []

    docs: list[dict] = []
    seen: set[Path] = set()
    for root in roots:
        if not root.exists():
            continue
        for path in sorted(root.rglob("*.md")):
            resolved = path.resolve()
            if resolved in seen:
                continue
            seen.add(resolved)
            text = path.read_text(encoding="utf-8", errors="ignore")
            doc_family = memory_source_family(path, text)
            if family and family != "all" and doc_family != family:
                continue
            body = clean_body(text)
            docs.append({
                "title": title_for(path, text),
                "path": rel(path),
                "sourceFamily": doc_family,
                "url": markdown_url(text),
                "body": body,
            })
    return docs


def _fts_query(query: str) -> str:
    terms = re.findall(r"[\w\u3400-\u9fff-]+", query.lower(), flags=re.UNICODE)
    terms = [term for term in terms if len(term) >= 2]
    expansions: list[str] = []
    if re.search(r"synth|synthesizer|sound|music|oscillator|聲音|合成器", query, flags=re.I):
        expansions.extend(["synth", "synthesizer", "sound", "music", "oscillator", "speaker", "Nandsynth", "SolarpunkSynth", "starvation"])
    if re.search(r"kobakant|textile|wearable|fabric|soft|織品|穿戴", query, flags=re.I):
        expansions.extend(["kobakant", "HTGWYW", "textile", "wearable", "fabric", "soft", "circuit"])
    if re.search(r"sgmk|hackteria", query, flags=re.I):
        expansions.extend(["SGMK", "Hackteria", "workshop", "residency", "community"])
    terms = list(dict.fromkeys([*terms, *[item.lower() for item in expansions]]))
    return " OR ".join(f'"{term}"' for term in terms) or '"pbs"'


def rebuild_index(family: str | None = None) -> int:
    ensure_store()
    docs = iter_memory_docs(family)
    conn = sqlite3.connect(SQLITE_PATH)
    try:
        conn.execute("DROP TABLE IF EXISTS memory_docs")
        conn.execute("DROP TABLE IF EXISTS memory_fts")
        conn.execute("CREATE TABLE memory_docs (title TEXT, path TEXT UNIQUE, source_family TEXT, url TEXT, body TEXT)")
        conn.execute("CREATE VIRTUAL TABLE memory_fts USING fts5(title, body, path UNINDEXED, source_family UNINDEXED, url UNINDEXED)")
        for doc in docs:
            conn.execute(
                "INSERT INTO memory_docs(title, path, source_family, url, body) VALUES (?, ?, ?, ?, ?)",
                (doc["title"], doc["path"], doc["sourceFamily"], doc["url"], doc["body"]),
            )
            conn.execute(
                "INSERT INTO memory_fts(title, body, path, source_family, url) VALUES (?, ?, ?, ?, ?)",
                (doc["title"], doc["body"], doc["path"], doc["sourceFamily"], doc["url"]),
            )
        conn.commit()
    finally:
        conn.close()
    return len(docs)


def memory_search(query: str, limit: int = 8, family: str | None = None) -> list[dict]:
    ensure_store()
    if not SQLITE_PATH.exists():
        rebuild_index()
    conn = sqlite3.connect(SQLITE_PATH)
    conn.row_factory = sqlite3.Row
    try:
        where_family = "AND source_family = ?" if family and family != "all" else ""
        params: list[object] = [_fts_query(query)]
        if where_family:
            params.append(family)
        params.append(limit)
        rows = conn.execute(
            f"""
            SELECT title, path, source_family, url,
                   snippet(memory_fts, 1, '', '', ' ', 48) AS snippet,
                   bm25(memory_fts) AS score
            FROM memory_fts
            WHERE memory_fts MATCH ? {where_family}
            ORDER BY score
            LIMIT ?
            """,
            params,
        ).fetchall()
    except sqlite3.OperationalError:
        rebuild_index()
        return memory_search(query, limit, family)
    finally:
        conn.close()
    return [{
        "title": row["title"],
        "path": row["path"],
        "sourceFamily": row["source_family"],
        "url": row["url"],
        "score": float(row["score"]),
        "description": re.sub(r"\s+", " ", strip_frontmatter(row["snippet"] or "")).strip(),
    } for row in rows]


def build_evidence_packet(results: list[dict]) -> list[dict]:
    evidence = []
    for index, result in enumerate(results, start=1):
        evidence.append({
            "id": f"pbs-engine-{index}",
            "label": result.get("title") or result.get("path") or f"Source {index}",
            "text": result.get("description") or "",
            "source": "corpus",
            "sourceLabel": result.get("title") or "",
            "sourceType": result.get("sourceFamily") or "unknown",
            "url": result.get("url") or "",
            "tags": ["pbs-engine", result.get("sourceFamily") or "unknown"],
            "score": result.get("score", 0),
        })
    return evidence


def schema_context() -> str:
    return "PBS local memory schema: answer only from Sources/Raw canonical sources; keep source-first evidence visible; if evidence is incomplete, mark the gap instead of inventing claims."


def create_review_draft(question: str, answer: str, evidence: list[dict], links: list[dict], route: str = "game") -> Path:
    ensure_store()
    slug = slugify(question)[:80]
    out_path = NOTE_DRAFT_DIR / f"{slug}.md"
    source_refs = list(dict.fromkeys([item.get("path") or item.get("url") or item.get("sourceLabel") or item.get("label") for item in links or evidence if item.get("path") or item.get("url") or item.get("sourceLabel") or item.get("label")]))
    lines = [
        "---",
        "type: compiled-note-draft",
        "status: review-candidate",
        f"route: {route}",
        f"title: {wiki_link_title(question)}",
        f"query: {question}",
        "promotionTarget: Wiki/",
        "sourceRefs:",
        *[f"  - {source_ref}" for source_ref in source_refs],
        "---",
        "",
        f"# {wiki_link_title(question)}",
        "",
        "## Draft Status",
        "",
        "- This is a machine-generated review candidate created by the local PBS game server.",
        "- Browser UI did not write this file directly; it went through scripts/pbs_game_server.py and scripts/pbs_engine.py.",
        "- Promote manually only after checking source links and evidence quality.",
        "",
        "## Question",
        "",
        question,
        "",
        "## Answer Draft",
        "",
        answer or "(No answer was supplied.)",
        "",
        "## Evidence",
        "",
    ]
    if evidence:
        for item in evidence:
            label = item.get("label") or item.get("sourceLabel") or "Source"
            url = item.get("url") or ""
            text = item.get("text") or item.get("description") or ""
            lines.append(f"- {label}: {text} {url}".rstrip())
    else:
        lines.append("- No evidence supplied.")
    out_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
    return out_path


def command_index(args: argparse.Namespace) -> int:
    count = rebuild_index(args.family)
    print(f"indexed {count} source docs into {rel(SQLITE_PATH)}")
    return 0


def command_search(args: argparse.Namespace) -> int:
    results = memory_search(args.query, args.limit, args.family)
    for index, result in enumerate(results, start=1):
        print(f"## {index}. {result['title']}")
        print(f"family: {result['sourceFamily']}")
        print(f"path: {result['path']}")
        if result.get("url"):
            print(f"url: {result['url']}")
        print(f"bm25: {result['score']:.4f}")
        print(result.get("description") or "")
        print("")
    return 0 if results else 1


def command_status(args: argparse.Namespace) -> int:
    if not SQLITE_PATH.exists():
        rebuild_index()
    conn = sqlite3.connect(SQLITE_PATH)
    try:
        count = conn.execute("SELECT COUNT(*) FROM memory_docs").fetchone()[0]
    finally:
        conn.close()
    print(f"sqlite={rel(SQLITE_PATH)}")
    print(f"indexedDocs={count}")
    print(f"reviewDrafts={len(list(NOTE_DRAFT_DIR.glob('*.md'))) if NOTE_DRAFT_DIR.exists() else 0}")
    return 0


def wikitext_to_text(value: str) -> str:
    value = html.unescape(value)
    value = re.sub(r"\{\{.*?\}\}", " ", value, flags=re.S)
    value = re.sub(r"\[\[File:[^\]]+\]\]", " ", value, flags=re.I)
    value = re.sub(r"\[\[:?File:[^\]]+\]\]", " ", value, flags=re.I)
    value = re.sub(r"\[\[([^\]|]+)\|([^\]]+)\]\]", r"\2", value)
    value = re.sub(r"\[\[([^\]]+)\]\]", r"\1", value)
    value = re.sub(r"\[https?://\S+\s+([^\]]+)\]", r"\1", value)
    value = re.sub(r"'{2,}", "", value)
    value = re.sub(r"^={2,}\s*(.*?)\s*={2,}$", r"# \1", value, flags=re.M)
    value = re.sub(r"<[^>]+>", " ", value)
    return value


def cache_path_for(source_id: str) -> Path:
    return WEB_CACHE / f"{source_id}.md"


def source_text_for(source: dict) -> str:
    path = ROOT / source["path"]
    raw = path.read_text(encoding="utf-8", errors="ignore") if path.exists() else ""
    cache_path = cache_path_for(source["id"])
    if "No plaintext extract returned" in raw and cache_path.exists():
        return cache_path.read_text(encoding="utf-8", errors="ignore")
    return raw


def normalize_text(text: str) -> str:
    text = re.sub(r"\[\[[^\]|]+\|([^\]]+)\]\]", r"\1", text)
    text = re.sub(r"\[\[([^\]]+)\]\]", r"\1", text)
    text = re.sub(r"https?://\S+", "", text)
    return re.sub(r"\s+", " ", text).strip()


def is_navigation_line(text: str) -> bool:
    stripped = text.strip()
    if not stripped:
        return True
    if stripped.startswith("[[") and stripped.endswith("]]" ):
        return True
    if stripped.count("[[") >= 2 and len(stripped) < 220:
        return True
    if re.fullmatch(r"[\[\]\w\s()|,./:-]+", stripped) and stripped.count("[[") >= 1 and len(stripped) < 180:
        return True
    return False


def readability_for(text: str) -> str:
    body = re.sub(r"\s+", " ", clean_body(text)).strip()
    if "No plaintext extract returned" in body:
        return "thin"
    if len(body) < 500:
        return "thin"
    if len(body) < 1500:
        return "medium"
    return "rich"


def tokenize(value: str) -> list[str]:
    return [token for token in re.split(r"[^\w]+", value.lower(), flags=re.UNICODE) if len(token) > 1 and token not in STOP_WORDS]


def command_build_registry(args: argparse.Namespace) -> int:
    ensure_store()
    rows: list[dict] = []
    for path in source_paths(args.limit, args.family):
        text = path.read_text(encoding="utf-8", errors="ignore")
        stat = path.stat()
        row = SourceRecord(
            id=slugify(rel(path)),
            path=rel(path),
            title=title_for(path, text),
            source_family=source_family_for(path),
            sha256=file_hash(path),
            mtime=stat.st_mtime,
            bytes=stat.st_size,
            readability=readability_for(text),
        )
        rows.append(row.__dict__)
    write_jsonl(REGISTRY_PATH, rows)
    print(f"registry={rel(REGISTRY_PATH)}")
    print(f"sources={len(rows)}")
    print("readability=" + json.dumps(counts(row["readability"] for row in rows), ensure_ascii=False, sort_keys=True))
    return 0


def counts(values) -> dict[str, int]:
    out: dict[str, int] = {}
    for value in values:
        out[str(value)] = out.get(str(value), 0) + 1
    return out


def split_passages(text: str, max_per_source: int) -> list[str]:
    body = clean_body(text)
    chunks: list[str] = []
    buffer: list[str] = []
    for raw in body.splitlines():
        line = raw.strip()
        if is_navigation_line(line):
            if buffer:
                chunks.append(" ".join(buffer))
                buffer = []
            continue
        if not line or line.startswith("#") or line.startswith("<!--"):
            if buffer:
                chunks.append(" ".join(buffer))
                buffer = []
            continue
        if "No plaintext extract returned" in line:
            continue
        if line.startswith("-"):
            item = line.lstrip("- ").strip()
            if len(item) >= 80 and not is_navigation_line(item):
                chunks.append(item)
            continue
        buffer.append(line)
        if len(" ".join(buffer)) >= 500:
            chunks.append(" ".join(buffer))
            buffer = []
    if buffer:
        chunks.append(" ".join(buffer))
    cleaned = []
    for chunk in chunks:
        chunk = normalize_text(chunk)
        if len(chunk) < 80:
            continue
        if is_navigation_line(chunk):
            continue
        cleaned.append(chunk[:1200])
    return cleaned[:max_per_source]


def command_extract_passages(args: argparse.Namespace) -> int:
    ensure_store()
    registry = read_jsonl(REGISTRY_PATH)
    if not registry:
        command_build_registry(argparse.Namespace(limit=args.limit, family=args.family))
        registry = read_jsonl(REGISTRY_PATH)
    rows: list[dict] = []
    for source in registry:
        if args.family and source["source_family"] != args.family:
            continue
        path = ROOT / source["path"]
        if not path.exists():
            continue
        text = source_text_for(source)
        for index, passage in enumerate(split_passages(text, args.max_per_source), start=1):
            rows.append({
                "id": f"{source['id']}#p{index}",
                "sourceId": source["id"],
                "sourceRef": source["path"],
                "sourceFamily": source["source_family"],
                "sourceTitle": source["title"],
                "passageIndex": index,
                "text": passage,
                "terms": tokenize(passage)[:40],
            })
        if args.limit and len({row["sourceId"] for row in rows}) >= args.limit:
            break
    write_jsonl(PASSAGES_PATH, rows)
    print(f"passages={rel(PASSAGES_PATH)}")
    print(f"count={len(rows)}")
    print("families=" + json.dumps(counts(row["sourceFamily"] for row in rows), ensure_ascii=False, sort_keys=True))
    return 0


def fetch_mediawiki_wikitext(api_url: str, pageid: int) -> str:
    query = urllib.parse.urlencode({
        "action": "parse",
        "pageid": str(pageid),
        "prop": "wikitext",
        "format": "json",
    })
    url = f"{api_url}?{query}"
    request = urllib.request.Request(url, headers={"User-Agent": "PBSKnowledgeEngine/0.1"})
    with urllib.request.urlopen(request, timeout=30) as response:
        payload = json.loads(response.read().decode("utf-8"))
    return payload.get("parse", {}).get("wikitext", {}).get("*", "")


def source_priority(source: dict, raw: str, query_terms: list[str]) -> int:
    title = source.get("title", "").lower()
    path = source.get("path", "").lower()
    haystack = f"{title} {path}"
    length = frontmatter_length(raw)
    score = length
    for term in HIGH_VALUE_TERMS:
        if term in haystack:
            score += 5000
    for term in query_terms:
        if term in haystack:
            score += 10000
    for term in LOW_VALUE_TITLE_TERMS:
        if term in title:
            score -= 15000
    return score


def command_hydrate_mediawiki(args: argparse.Namespace) -> int:
    ensure_store()
    registry = read_jsonl(REGISTRY_PATH)
    if not registry:
        command_build_registry(argparse.Namespace(limit=None, family=None))
        registry = read_jsonl(REGISTRY_PATH)
    query_terms = tokenize(args.query or "")
    candidates = []
    for source in registry:
        family = source.get("source_family")
        if family not in MEDIAWIKI_API:
            continue
        if args.family != "all" and family != args.family:
            continue
        path = ROOT / source["path"]
        if not path.exists():
            continue
        raw = path.read_text(encoding="utf-8", errors="ignore")
        if "No plaintext extract returned" not in raw and not args.force:
            continue
        pageid = frontmatter_int(raw, "pageid")
        if args.pageid and pageid != args.pageid:
            continue
        if frontmatter_length(raw) < args.min_length:
            continue
        if query_terms:
            haystack = f"{source.get('title', '')} {source.get('path', '')}".lower()
            if not any(term in haystack for term in query_terms):
                continue
        if pageid is None:
            continue
        candidates.append((source_priority(source, raw, query_terms), source, pageid))
    candidates.sort(key=lambda row: (-row[0], row[1].get("title", "")))
    hydrated = 0
    failures = []
    for _score, source, pageid in candidates[: args.limit]:
        family = source["source_family"]
        try:
            wikitext = fetch_mediawiki_wikitext(MEDIAWIKI_API[family], pageid)
        except Exception as error:  # noqa: BLE001 - report and continue batch hydration.
            failures.append({"sourceRef": source["path"], "error": str(error)})
            continue
        text = wikitext_to_text(wikitext)
        if len(text.strip()) < 200:
            continue
        cache_path = cache_path_for(source["id"])
        cache_path.write_text(
            "\n".join([
                "---",
                "type: pbs-web-cache",
                "status: source-cache",
                f"family: {family}",
                f"sourceRef: {source['path']}",
                f"pageid: {pageid}",
                f"fetchedAt: {now_iso()}",
                "---",
                "",
                f"# {source['title']}",
                "",
                text.strip(),
                "",
            ]),
            encoding="utf-8",
        )
        hydrated += 1
    print(f"web_cache={rel(WEB_CACHE)}")
    print(f"candidates={len(candidates)}")
    print(f"hydrated={hydrated}")
    print(f"failures={len(failures)}")
    return 0 if hydrated else 1


def claim_type_for(text: str) -> str:
    for claim_type, pattern in CLAIM_PATTERNS:
        if pattern.search(text):
            return claim_type
    return "observation"


def claim_sentence(text: str) -> str:
    text = normalize_text(text)
    sentences = re.split(r"(?<=[.!?。！？])\s+", text)
    candidates = [sentence.strip() for sentence in sentences if len(sentence.strip()) >= 80]
    return (candidates[0] if candidates else text.strip())[:520]


def claim_key(text: str) -> str:
    key = normalize_text(text).lower()
    key = re.sub(r"\([^a-z0-9]{0,8}\)", " ", key)
    key = re.sub(r"[^a-z0-9\u4e00-\u9fff]+", "", key)
    return key


def command_extract_claims(args: argparse.Namespace) -> int:
    ensure_store()
    passages = read_jsonl(PASSAGES_PATH)
    if not passages:
        command_extract_passages(argparse.Namespace(limit=args.limit, family=args.family, max_per_source=args.max_per_source))
        passages = read_jsonl(PASSAGES_PATH)
    rows: list[dict] = []
    seen = set()
    for passage in passages:
        if args.family and passage["sourceFamily"] != args.family:
            continue
        text = claim_sentence(passage["text"])
        key = claim_key(text)
        if key in seen:
            continue
        seen.add(key)
        rows.append({
            "id": f"claim-{hashlib.sha1((passage['id'] + text).encode('utf-8')).hexdigest()[:12]}",
            "claimType": claim_type_for(text),
            "text": text,
            "sourceRef": passage["sourceRef"],
            "sourceId": passage["sourceId"],
            "passageId": passage["id"],
            "sourceFamily": passage["sourceFamily"],
            "sourceTitle": passage["sourceTitle"],
            "terms": tokenize(text)[:30],
            "confidence": "medium" if len(text) >= 140 else "low",
            "createdAt": now_iso(),
        })
        if args.limit and len(rows) >= args.limit:
            break
    write_jsonl(CLAIMS_PATH, rows)
    print(f"claims={rel(CLAIMS_PATH)}")
    print(f"count={len(rows)}")
    print("types=" + json.dumps(counts(row["claimType"] for row in rows), ensure_ascii=False, sort_keys=True))
    return 0


def score_claim(claim: dict, query_terms: list[str]) -> float:
    text = " ".join([claim.get("text", ""), claim.get("sourceTitle", ""), " ".join(claim.get("terms", []))]).lower()
    score = 0.0
    for term in query_terms:
        if term in str(claim.get("sourceTitle", "")).lower():
            score += 5
        if term in text:
            score += min(text.count(term), 4)
    if claim.get("confidence") == "medium":
        score += 0.5
    return score


def discriminating_terms(query_terms: list[str]) -> list[str]:
    terms = [term for term in query_terms if term not in GENERIC_QUERY_TERMS and (len(term) >= 6 or any(char.isdigit() for char in term))]
    return terms or [term for term in query_terms if term not in GENERIC_QUERY_TERMS]


def claim_matches_any(claim: dict, terms: list[str]) -> bool:
    if not terms:
        return True
    haystack = " ".join([claim.get("text", ""), claim.get("sourceTitle", ""), " ".join(claim.get("terms", []))]).lower()
    return any(term in haystack for term in terms)


def command_query(args: argparse.Namespace) -> int:
    ensure_store()
    claims = read_jsonl(CLAIMS_PATH)
    if not claims:
        print("ERROR no claims found; run extract-claims first")
        return 1
    if args.family != "all":
        claims = [claim for claim in claims if claim.get("sourceFamily") == args.family]
    terms = tokenize(args.query)
    required_terms = discriminating_terms(terms)
    ranked = [({"score": score_claim(claim, terms), **claim}) for claim in claims if claim_matches_any(claim, required_terms)]
    ranked = [row for row in ranked if row["score"] > 0]
    ranked.sort(key=lambda row: (-row["score"], row["sourceTitle"], row["id"]))
    selected = ranked[: args.limit]
    payload = {
        "type": "pbs-engine-query-run",
        "query": args.query,
        "family": args.family,
        "createdAt": now_iso(),
        "queryTerms": terms,
        "requiredTerms": required_terms,
        "claimCount": len(selected),
        "claims": selected,
        "sourceRefs": list(dict.fromkeys(row["sourceRef"] for row in selected)),
    }
    out_path = QUERY_DIR / f"{slugify(args.query)[:80]}.json"
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    md_path = QUERY_DIR / f"{slugify(args.query)[:80]}.md"
    lines = [
        "---",
        "type: pbs-engine-query-run",
        "status: review-artifact",
        "sourceRefs:",
        "  - scripts/pbs_engine.py",
        "---",
        "",
        f"# Query: {args.query}",
        "",
        "## Claims",
        "",
    ]
    lines.extend([f"- ({row['claimType']}, score {row['score']:.1f}) {row['text']} [`{row['sourceRef']}`]" for row in selected] or ["- No claims matched this query."])
    md_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
    print(f"artifact={rel(md_path)}")
    print(f"claims={len(selected)}")
    print(f"sourceRefs={len(payload['sourceRefs'])}")
    return 0 if selected else 1


def load_ranked_claims(query_text: str, family: str, limit: int) -> list[dict]:
    claims = read_jsonl(CLAIMS_PATH)
    if family != "all":
        claims = [claim for claim in claims if claim.get("sourceFamily") == family]
    terms = tokenize(query_text)
    required_terms = discriminating_terms(terms)
    ranked = [({"score": score_claim(claim, terms), **claim}) for claim in claims if claim_matches_any(claim, required_terms)]
    ranked = [row for row in ranked if row["score"] > 0]
    ranked.sort(key=lambda row: (-row["score"], row["sourceTitle"], row["id"]))
    return ranked[:limit]


def is_weak_draft_claim(claim: dict) -> bool:
    text = claim.get("text", "")
    title = claim.get("sourceTitle", "").lower()
    if any(term in title for term in ["old main page", "main page", "workshops overview"]):
        return True
    return any(pattern.search(text) for pattern in WEAK_DRAFT_PATTERNS)


def wiki_link_title(query_text: str) -> str:
    words = [word for word in re.split(r"\s+", query_text.strip()) if word]
    return " ".join(word[:1].upper() + word[1:] for word in words)


def command_draft_note(args: argparse.Namespace) -> int:
    ensure_store()
    selected = [claim for claim in load_ranked_claims(args.query, args.family, args.limit * 3) if not is_weak_draft_claim(claim)][: args.limit]
    slug = slugify(args.query)[:80]
    out_path = NOTE_DRAFT_DIR / f"{slug}.md"
    source_refs = list(dict.fromkeys(row["sourceRef"] for row in selected))
    type_groups: dict[str, list[dict]] = {}
    for claim in selected:
        type_groups.setdefault(claim["claimType"], []).append(claim)
    lines = [
        "---",
        "type: compiled-note-draft",
        "status: review-candidate",
        f"title: {wiki_link_title(args.query)}",
        f"query: {args.query}",
        f"family: {args.family}",
        f"targetCategory: {args.category}",
        "promotionTarget: Wiki/",
        "sourceRefs:",
        *[f"  - {source_ref}" for source_ref in source_refs],
        "---",
        "",
        f"# {wiki_link_title(args.query)}",
        "",
        "## Draft Status",
        "",
        "- This is a machine-generated review candidate, not a compiled Wiki note.",
        "- Promote manually only after checking sourceRefs, deleting weak claims, adding wikilinks, and choosing the final Wiki category.",
        "- If the evidence below is insufficient, keep this in Review instead of moving it into Wiki.",
        "",
        "## Evidence-Bound Summary",
        "",
    ]
    if selected:
        lines.append(f"- The query `{args.query}` currently has {len(selected)} claim candidates across {len(source_refs)} sourceRefs.")
        lines.append("- The strongest claims are listed below; this draft does not add synthesis beyond those claims.")
    else:
        lines.append("- 沒有找到足夠的證據。")
    lines.extend(["", "## Claim Candidates", ""])
    if selected:
        for claim_type in sorted(type_groups):
            lines.append(f"### {claim_type}")
            lines.append("")
            for claim in type_groups[claim_type]:
                lines.append(f"- {claim['text']} [`{claim['sourceRef']}`] score={claim['score']:.1f}")
            lines.append("")
    else:
        lines.append("- No claim candidates matched the discriminating terms.")
    lines.extend([
        "",
        "## Promotion Checklist",
        "",
        "- [ ] Open every sourceRef and verify the claim text against the source/cache passage.",
        "- [ ] Remove navigation, biography, generic announcement, or list-only claims.",
        "- [ ] Decide whether the final note belongs in Concepts, Methods, Materials, SocialForms, Projects, Comparisons, or Syntheses.",
        "- [ ] Add durable wikilinks to existing compiled Wiki notes.",
        "- [ ] Add open questions for missing evidence instead of inventing synthesis.",
        "",
        "## Suggested Wiki Fields",
        "",
        f"- `title`: {wiki_link_title(args.query)}",
        f"- `status`: source-bounded-draft",
        f"- `sourceRefs`: {len(source_refs)} verified refs after review",
        "- `evidence`: selected claims with sourceRefs",
        "- `openQuestions`: gaps found during review",
    ])
    out_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
    print(f"artifact={rel(out_path)}")
    print(f"claims={len(selected)}")
    print(f"sourceRefs={len(source_refs)}")
    return 0 if selected else 1


def has_pbs_domain_signal(query_text: str, query_terms: list[str]) -> bool:
    lowered = query_text.lower()
    if any(term in lowered for term in PBS_DOMAIN_TERMS):
        return True
    return any(term in PBS_DOMAIN_TERMS for term in query_terms)


def has_broad_intent(query_text: str) -> bool:
    lowered = query_text.lower()
    broad_markers = [
        "complete overview", "everything", "full summary", "general", "compare", "comparison",
        "完整", "總整理", "全部", "比較", "介紹一下", "這裡的", "是什麼",
    ]
    return any(marker in lowered for marker in broad_markers)


def guidance_for(query_text: str, top_claims: list[dict]) -> list[str]:
    source_titles = list(dict.fromkeys(claim.get("sourceTitle", "") for claim in top_claims if claim.get("sourceTitle")))[:4]
    if source_titles:
        return [
            "請把題目縮小到一個專案、方法、材料或社群情境。",
            "可改問：`請用 source-backed claims 做一本關於 " + source_titles[0] + " 的小誌`。",
            "也可以指定社群：Hackteria、HTGWYW/Kobakant、或 SGMK。",
        ]
    return [
        "這個輸入還不夠 PBS-specific，請補一個專案、社群、材料、方法或活動名稱。",
        "可嘗試：`DIY microscopy open hardware`、`8bit MixTape workshop`、`e-textile summer camp`。",
    ]


def classify_zine_input(query_text: str, family: str, min_claims: int, min_source_refs: int) -> dict:
    terms = tokenize(query_text)
    required_terms = discriminating_terms(terms)
    ranked = load_ranked_claims(query_text, family, 30)
    usable = [claim for claim in ranked if not is_weak_draft_claim(claim)]
    source_refs = list(dict.fromkeys(claim["sourceRef"] for claim in usable))
    top_score = usable[0]["score"] if usable else 0.0
    domain_signal = has_pbs_domain_signal(query_text, terms)
    too_short = len(query_text.strip()) < 8 or len(terms) <= 1
    broad = has_broad_intent(query_text) or all(term in GENERIC_QUERY_TERMS for term in terms if term)

    if domain_signal and len(usable) >= min_claims and len(source_refs) >= min_source_refs and not too_short and not broad:
        decision = "accept"
        reason = "enough source-backed claims for a zine draft"
    elif domain_signal:
        decision = "guide"
        reason = "PBS-adjacent but too broad, ambiguous, or under-supported for direct zine generation"
    else:
        decision = "refuse"
        reason = "outside current PBS source context"

    return {
        "decision": decision,
        "reason": reason,
        "queryTerms": terms,
        "requiredTerms": required_terms,
        "domainSignal": domain_signal,
        "tooShort": too_short,
        "broadIntent": broad,
        "claimCount": len(usable),
        "sourceRefCount": len(source_refs),
        "topScore": top_score,
        "sourceRefs": source_refs[:8],
        "guidance": guidance_for(query_text, usable) if decision == "guide" else [],
    }


def command_zine_experiment(args: argparse.Namespace) -> int:
    ensure_store()
    cases = ZINE_EXPERIMENT_CASES
    if args.cases:
        cases = json.loads(Path(args.cases).read_text(encoding="utf-8"))
    rows = []
    for case in cases:
        result = classify_zine_input(case["input"], case.get("family", "all"), args.min_claims, args.min_source_refs)
        passed = result["decision"] == case["expected"]
        rows.append({**case, **result, "passed": passed})

    total = len(rows)
    passed_count = sum(1 for row in rows if row["passed"])
    accepted = [row for row in rows if row["decision"] == "accept"]
    guided = [row for row in rows if row["decision"] == "guide"]
    refused = [row for row in rows if row["decision"] == "refuse"]
    expected_accept = [row for row in rows if row["expected"] == "accept"]
    ready_accept = [row for row in expected_accept if row["decision"] == "accept"]
    summary = {
        "type": "pbs-zine-readiness-experiment",
        "createdAt": now_iso(),
        "caseCount": total,
        "responsibleHandlingPassRate": round(passed_count / total, 4) if total else 0,
        "expectedZineGenerationCases": len(expected_accept),
        "zineGenerationReadinessRate": round(len(ready_accept) / len(expected_accept), 4) if expected_accept else 0,
        "accepted": len(accepted),
        "guided": len(guided),
        "refused": len(refused),
        "minClaims": args.min_claims,
        "minSourceRefs": args.min_source_refs,
        "cases": rows,
    }
    out_dir = EXPERIMENT_DIR / "zine-readiness"
    out_dir.mkdir(parents=True, exist_ok=True)
    json_path = out_dir / "latest.json"
    md_path = out_dir / "latest.md"
    json_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    lines = [
        "---",
        "type: pbs-zine-readiness-experiment",
        "status: review-artifact",
        "sourceRefs:",
        "  - scripts/pbs_engine.py",
        "---",
        "",
        "# Zine Readiness Experiment",
        "",
        "## Summary",
        "",
        f"- cases: {total}",
        f"- responsible handling pass rate: {summary['responsibleHandlingPassRate'] * 100:.1f}%",
        f"- zine generation readiness rate for expected-accept cases: {summary['zineGenerationReadinessRate'] * 100:.1f}%",
        f"- accepted for generation: {len(accepted)}",
        f"- guided to reframe: {len(guided)}",
        f"- refused as out of PBS context: {len(refused)}",
        "",
        "Responsible handling means: accept evidence-backed prompts, guide PBS-adjacent vague prompts, and refuse out-of-context prompts.",
        "",
        "## Cases",
        "",
    ]
    for row in rows:
        mark = "PASS" if row["passed"] else "FAIL"
        lines.extend([
            f"### {row['id']} - {mark}",
            "",
            f"- input: `{row['input']}`",
            f"- kind: {row['kind']}",
            f"- expected: {row['expected']}",
            f"- decision: {row['decision']}",
            f"- reason: {row['reason']}",
            f"- claims: {row['claimCount']}",
            f"- sourceRefs: {row['sourceRefCount']}",
        ])
        if row["guidance"]:
            lines.append("- guidance: " + " / ".join(row["guidance"]))
        lines.append("")
    md_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
    print(f"artifact={rel(md_path)}")
    print(f"responsible_pass_rate={summary['responsibleHandlingPassRate'] * 100:.1f}%")
    print(f"zine_generation_readiness_rate={summary['zineGenerationReadinessRate'] * 100:.1f}%")
    print(f"accepted={len(accepted)} guided={len(guided)} refused={len(refused)}")
    return 0 if passed_count == total else 1



def command_export_game_index(args: argparse.Namespace) -> int:
    results = iter_memory_docs(None)
    payload = {
        "version": "source-first-2026-05-31",
        "name": "PBS local memory source-first index",
        "count": len(results),
        "sourceUrls": configured_source_urls(),
        "items": [
            {
                "title": row["title"],
                "url": row["url"],
                "sourceFamily": row["sourceFamily"],
                "path": row["path"],
                "description": re.sub(r"\s+", " ", row["body"]).strip()[:620],
            }
            for row in results
        ],
    }
    out = Path(args.target)
    if not out.is_absolute():
        out = ROOT / out
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"exported={rel(out)}")
    print(f"items={len(results)}")
    return 0

def command_lint(_args: argparse.Namespace) -> int:
    ensure_store()
    registry = read_jsonl(REGISTRY_PATH)
    passages = read_jsonl(PASSAGES_PATH)
    claims = read_jsonl(CLAIMS_PATH)
    source_ids_with_passages = {row["sourceId"] for row in passages}
    source_ids_with_claims = {row["sourceId"] for row in claims}
    rich_sources = [row for row in registry if row.get("readability") in {"medium", "rich"}]
    rich_without_claims = [row for row in rich_sources if row["id"] not in source_ids_with_claims]
    thin_sources = [row for row in registry if row.get("readability") == "thin"]
    lines = [
        "---",
        "type: pbs-engine-lint",
        "status: review-artifact",
        "sourceRefs:",
        "  - scripts/pbs_engine.py",
        "---",
        "",
        "# PBS Engine Lint",
        "",
        f"- registry sources: {len(registry)}",
        f"- passages: {len(passages)}",
        f"- claims: {len(claims)}",
        f"- readable sources without claims: {len(rich_without_claims)}",
        f"- thin sources: {len(thin_sources)}",
        "",
        "## Readable Sources Without Claims",
        "",
        *[f"- `{row['path']}`" for row in rich_without_claims[:60]],
        "",
        "## Thin Source Sample",
        "",
        *[f"- `{row['path']}`" for row in thin_sources[:60]],
    ]
    LINT_PATH.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
    print(f"artifact={rel(LINT_PATH)}")
    print(f"sources={len(registry)}")
    print(f"claims={len(claims)}")
    print(f"readable_without_claims={len(rich_without_claims)}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    registry = sub.add_parser("build-registry")
    registry.add_argument("--limit", type=int)
    registry.add_argument("--family", choices=["designposthumanism", "hackteria", "htgwyw", "sgmk"])
    registry.set_defaults(func=command_build_registry)
    passages = sub.add_parser("extract-passages")
    passages.add_argument("--limit", type=int)
    passages.add_argument("--family", choices=["designposthumanism", "hackteria", "htgwyw", "sgmk"])
    passages.add_argument("--max-per-source", type=int, default=8)
    passages.set_defaults(func=command_extract_passages)
    claims = sub.add_parser("extract-claims")
    claims.add_argument("--limit", type=int)
    claims.add_argument("--family", choices=["designposthumanism", "hackteria", "htgwyw", "sgmk"])
    claims.add_argument("--max-per-source", type=int, default=8)
    claims.set_defaults(func=command_extract_claims)
    hydrate = sub.add_parser("hydrate-mediawiki")
    hydrate.add_argument("--family", choices=["all", "hackteria", "sgmk"], default="all")
    hydrate.add_argument("--query", help="Hydrate pages whose title/path contains any query term")
    hydrate.add_argument("--pageid", type=int, help="Hydrate one Hackteria pageid")
    hydrate.add_argument("--limit", type=int, default=10)
    hydrate.add_argument("--min-length", type=int, default=1500)
    hydrate.add_argument("--force", action="store_true", help="Hydrate even when the local source already has text")
    hydrate.set_defaults(func=command_hydrate_mediawiki)
    hydrate_old = sub.add_parser("hydrate-hackteria")
    hydrate_old.add_argument("--query")
    hydrate_old.add_argument("--pageid", type=int)
    hydrate_old.add_argument("--limit", type=int, default=10)
    hydrate_old.add_argument("--min-length", type=int, default=1500)
    hydrate_old.add_argument("--force", action="store_true")
    hydrate_old.set_defaults(func=lambda args: command_hydrate_mediawiki(argparse.Namespace(**vars(args), family="hackteria")))
    index = sub.add_parser("index")
    index.add_argument("--family", choices=["all", "designposthumanism", "hackteria", "htgwyw", "sgmk", "wiki", "schema"], default="all")
    index.set_defaults(func=command_index)
    search = sub.add_parser("search")
    search.add_argument("query")
    search.add_argument("--family", choices=["all", "designposthumanism", "hackteria", "htgwyw", "sgmk", "wiki", "schema"], default="all")
    search.add_argument("--limit", type=int, default=8)
    search.set_defaults(func=command_search)
    sub.add_parser("status").set_defaults(func=command_status)
    query = sub.add_parser("query")
    query.add_argument("--query", required=True)
    query.add_argument("--family", choices=["all", "designposthumanism", "hackteria", "htgwyw", "sgmk"], default="all")
    query.add_argument("--limit", type=int, default=12)
    query.set_defaults(func=command_query)
    draft = sub.add_parser("draft-note")
    draft.add_argument("--query", required=True)
    draft.add_argument("--family", choices=["all", "designposthumanism", "hackteria", "htgwyw", "sgmk"], default="all")
    draft.add_argument("--category", choices=["Concepts", "Methods", "Materials", "Theories", "SocialForms", "Projects", "Comparisons", "Syntheses"], default="Projects")
    draft.add_argument("--limit", type=int, default=12)
    draft.set_defaults(func=command_draft_note)
    experiment = sub.add_parser("zine-experiment")
    experiment.add_argument("--cases", help="Optional JSON file containing experiment cases")
    experiment.add_argument("--min-claims", type=int, default=6)
    experiment.add_argument("--min-source-refs", type=int, default=1)
    experiment.set_defaults(func=command_zine_experiment)
    export_game = sub.add_parser("export-game-index")
    export_game.add_argument("--target", required=True)
    export_game.set_defaults(func=command_export_game_index)
    sub.add_parser("lint").set_defaults(func=command_lint)
    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
