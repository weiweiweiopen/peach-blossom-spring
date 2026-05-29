#!/usr/bin/env python3
"""Local-only PBS wiki/vault maintenance tool."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VAULT = ROOT / "obsidian-vault"

REQUIRED_DIRS = [
    "obsidian-vault/Wiki/Sources",
    "obsidian-vault/Wiki/Concepts",
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
    "obsidian-vault/Review/source-coverage",
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


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


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
    terrain = sub.add_parser("terrain-gap-lint")
    terrain.add_argument("--limit", type=int, default=10)
    terrain.set_defaults(func=command_terrain_gap_lint)
    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
