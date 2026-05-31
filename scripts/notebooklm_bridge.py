#!/usr/bin/env python3
"""Local PBS-2026.2 NotebookLM bridge trace builder.

This script does not authenticate to NotebookLM and does not read browser state.
It normalizes a public query plus public source observations into the PBS trace
shape that the web UI can review, download, and later promote into wiki memory.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


PRIVACY_RULES = [
    "Only public or explicitly approved source-level material may enter this trace.",
    "Do not include private player memory, unpublished interviews, secrets, cookies, tokens, or API keys.",
    "NotebookLM or any cloud reader is a reading engine, not PBS durable memory.",
    "Promotion into the wiki requires local review after trace creation.",
    "PBS canonical memory is the local Markdown wiki, not account-bound cloud notebook context.",
]

OWNERSHIP_RULES = [
    "Raw sources remain immutable source of truth.",
    "Reviewed traces may create or update Markdown wiki pages.",
    "Contradictions, weak claims, and unresolved questions should remain visible during promotion.",
    "Git history is the audit trail for durable knowledge changes.",
    "NotebookLM is the shovel; PBS keeps the land.",
]


def read_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def normalize_sources(raw: Any) -> list[dict[str, Any]]:
    if isinstance(raw, dict):
        raw_items = raw.get("sources") or raw.get("observations") or raw.get("items") or []
    elif isinstance(raw, list):
        raw_items = raw
    else:
        raw_items = []

    sources: list[dict[str, Any]] = []
    for index, item in enumerate(raw_items, start=1):
        if not isinstance(item, dict):
            item = {"summary": str(item)}
        title = str(item.get("title") or item.get("name") or f"Public source {index}").strip()
        url = str(item.get("url") or item.get("sourceRef") or item.get("source") or "").strip()
        summary = str(item.get("summary") or item.get("observation") or item.get("text") or "").strip()
        if not title and not summary:
            continue
        sources.append(
            {
                "id": f"source-{index:03d}",
                "title": title,
                "url": url,
                "summary": summary[:1200],
                "sourceRefs": [value for value in [url or title] if value],
                "privacy": "public-or-approved",
                "status": "needs-review",
            }
        )
    return sources


def build_trace(query: str, sources: list[dict[str, Any]], notebook_id: str | None) -> dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    digest = hashlib.sha256(json.dumps({"query": query, "sources": sources}, sort_keys=True).encode("utf-8")).hexdigest()[:16]
    return {
        "schemaVersion": "pbs-notebooklm-bridge-trace-v1",
        "traceId": f"pbs-bridge-{digest}",
        "createdAt": now,
        "query": query,
        "bridge": {
            "label": "PBS-2026.2 NotebookLM bridge",
            "notebookId": notebook_id or None,
            "mode": "manual-public-source-packet",
            "durableMemory": False,
            "privacyRules": PRIVACY_RULES,
            "ownershipRules": OWNERSHIP_RULES,
        },
        "primarySourcePacket": sources,
        "compiledWikiNotes": [],
        "review": {
            "status": "needs-human-review",
            "promotionTargets": [
                "obsidian-vault/Review/question-candidates",
                "obsidian-vault/Review/compiled-note-drafts",
                "obsidian-vault/Wiki/Zines",
            ],
            "rawSourcesMutation": "forbidden-by-default",
            "canonicalMemory": "obsidian-vault/Wiki markdown notes",
            "auditTrail": "git diff and commit history",
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Create a PBS-2026.2 bridge trace from public source observations.")
    parser.add_argument("--query", required=True, help="Player/wiki question. Do not include private memory.")
    parser.add_argument("--sources-json", type=Path, required=True, help="JSON file containing public sources/observations.")
    parser.add_argument("--output", type=Path, required=True, help="Where to write the bridge trace JSON.")
    parser.add_argument("--notebook-id", default="", help="Optional NotebookLM notebook identifier for human reference only.")
    args = parser.parse_args()

    sources = normalize_sources(read_json(args.sources_json))
    if not sources:
        raise SystemExit("No public source observations found in --sources-json")

    trace = build_trace(args.query.strip(), sources, args.notebook_id.strip() or None)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8") as handle:
        json.dump(trace, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    print(f"wrote {args.output} with {len(sources)} public sources")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
