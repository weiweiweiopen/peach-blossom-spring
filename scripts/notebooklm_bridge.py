#!/usr/bin/env python3
"""Local PBS-2026.2 NotebookLM bridge trace builder.

This script never stores NotebookLM/Google auth in the repository. In manual
mode it normalizes a public query plus public source observations into a PBS
trace. In NotebookLM mode it shells out to a local `notebooklm` CLI that is
already authenticated on this machine, then converts the answer and metadata
into the same reviewable PBS trace shape.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse


DEFAULT_NOTEBOOK_ID = "a1b30f29-e30b-4a8b-ac89-2b4471d516b3"
DEFAULT_NOTEBOOK_URL = f"https://notebooklm.google.com/notebook/{DEFAULT_NOTEBOOK_ID}"


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


def notebook_id_from(value: str | None) -> str:
    raw = (value or DEFAULT_NOTEBOOK_ID).strip()
    if not raw:
        return DEFAULT_NOTEBOOK_ID
    parsed = urlparse(raw)
    if parsed.scheme and parsed.netloc:
        parts = [part for part in parsed.path.split("/") if part]
        if "notebook" in parts:
            notebook_index = parts.index("notebook")
            if notebook_index + 1 < len(parts):
                return parts[notebook_index + 1]
        if parts:
            return parts[-1]
    return raw


def notebooklm_bin_from(value: str | None) -> str:
    return (value or os.environ.get("PBS_NOTEBOOKLM_BIN") or os.environ.get("NOTEBOOKLM_BIN") or "notebooklm").strip()


def run_json_command(command: list[str]) -> Any:
    completed = subprocess.run(command, check=False, text=True, capture_output=True)
    if completed.returncode != 0:
        details = (completed.stderr or completed.stdout or "").strip()
        raise SystemExit(f"NotebookLM command failed: {' '.join(command)}\n{details}")
    try:
        return json.loads(completed.stdout)
    except json.JSONDecodeError as exc:
        raise SystemExit(f"NotebookLM command did not return JSON: {exc}\n{completed.stdout[:1000]}") from exc


def first_text_value(raw: Any, keys: tuple[str, ...]) -> str:
    if isinstance(raw, dict):
        for key in keys:
            value = raw.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
        for value in raw.values():
            nested = first_text_value(value, keys)
            if nested:
                return nested
    if isinstance(raw, list):
        for value in raw:
            nested = first_text_value(value, keys)
            if nested:
                return nested
    return ""


def collect_reference_ids(raw: Any) -> set[str]:
    refs: set[str] = set()
    if isinstance(raw, dict):
        for key, value in raw.items():
            lowered = key.lower()
            if lowered in {"sourceid", "source_id", "source", "sourceidstr", "citation", "citationlabel"}:
                if isinstance(value, str) and value.strip():
                    refs.add(value.strip())
            elif lowered in {"sources", "references", "citations", "sourceids", "source_ids"}:
                if isinstance(value, list):
                    for item in value:
                        if isinstance(item, str) and item.strip():
                            refs.add(item.strip())
                        else:
                            refs.update(collect_reference_ids(item))
                elif isinstance(value, str) and value.strip():
                    refs.add(value.strip())
            else:
                refs.update(collect_reference_ids(value))
    elif isinstance(raw, list):
        for item in raw:
            refs.update(collect_reference_ids(item))
    return refs


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


def normalize_notebook_sources(metadata: Any, answer_json: Any) -> list[dict[str, Any]]:
    raw_sources: list[Any] = []
    if isinstance(metadata, dict):
        candidate = metadata.get("sources") or metadata.get("source") or []
        raw_sources = candidate if isinstance(candidate, list) else []

    referenced = collect_reference_ids(answer_json)
    sources: list[dict[str, Any]] = []
    for index, item in enumerate(raw_sources, start=1):
        if not isinstance(item, dict):
            item = {"title": str(item)}
        source_id = str(item.get("id") or item.get("source_id") or item.get("sourceId") or f"source-{index:03d}").strip()
        title = str(item.get("title") or item.get("name") or f"NotebookLM source {index}").strip()
        url = str(item.get("url") or item.get("web_url") or item.get("source_url") or "").strip()
        source_type = str(item.get("type") or item.get("source_type") or "NotebookLM source").strip()
        is_referenced = source_id in referenced or title in referenced or str(index) in referenced
        summary_parts = [source_type]
        if is_referenced:
            summary_parts.append("referenced by NotebookLM answer")
        sources.append(
            {
                "id": source_id or f"source-{index:03d}",
                "title": title,
                "url": url,
                "summary": "; ".join(summary_parts),
                "sourceRefs": [value for value in [source_id, url or title] if value],
                "privacy": "public-or-approved",
                "status": "needs-review",
            }
        )

    if sources:
        return sources

    answer = first_text_value(answer_json, ("answer", "content", "text", "response"))
    return normalize_sources([{"title": "NotebookLM answer", "summary": answer or json.dumps(answer_json, ensure_ascii=False)[:1200]}])


def ask_notebooklm(query: str, notebook_id: str, notebooklm_bin: str) -> tuple[Any, Any]:
    metadata = run_json_command([notebooklm_bin, "metadata", "-n", notebook_id, "--json"])
    answer = run_json_command([notebooklm_bin, "ask", "-n", notebook_id, "--json", query])
    return metadata, answer


def build_trace(
    query: str,
    sources: list[dict[str, Any]],
    notebook_id: str | None,
    *,
    mode: str = "manual-public-source-packet",
    answer: str = "",
    notebook_url: str = "",
    metadata: Any | None = None,
) -> dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    digest = hashlib.sha256(json.dumps({"query": query, "sources": sources, "answer": answer}, sort_keys=True).encode("utf-8")).hexdigest()[:16]
    return {
        "schemaVersion": "pbs-notebooklm-bridge-trace-v1",
        "traceId": f"pbs-bridge-{digest}",
        "createdAt": now,
        "query": query,
        "bridge": {
            "label": "PBS-2026.2 NotebookLM bridge",
            "notebookId": notebook_id or None,
            "notebookUrl": notebook_url or None,
            "mode": mode,
            "durableMemory": False,
            "privacyRules": PRIVACY_RULES,
            "ownershipRules": OWNERSHIP_RULES,
        },
        "answer": answer,
        "notebookMetadata": metadata or {},
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
    parser.add_argument("--sources-json", type=Path, help="JSON file containing public sources/observations for manual mode.")
    parser.add_argument("--output", type=Path, required=True, help="Where to write the bridge trace JSON.")
    parser.add_argument("--notebook-id", default=DEFAULT_NOTEBOOK_ID, help="NotebookLM notebook identifier or URL.")
    parser.add_argument("--notebook-url", default=DEFAULT_NOTEBOOK_URL, help="NotebookLM notebook URL for trace metadata.")
    parser.add_argument("--notebooklm-bin", default="", help="Path to local notebooklm CLI. Defaults to PBS_NOTEBOOKLM_BIN, NOTEBOOKLM_BIN, or notebooklm on PATH.")
    parser.add_argument("--ask-notebooklm", action="store_true", help="Use the local authenticated notebooklm CLI to query the configured notebook.")
    args = parser.parse_args()

    notebook_id = notebook_id_from(args.notebook_id or args.notebook_url)
    notebook_url = args.notebook_url.strip() or f"https://notebooklm.google.com/notebook/{notebook_id}"
    answer = ""
    metadata: Any | None = None
    mode = "manual-public-source-packet"

    if args.ask_notebooklm:
        metadata, answer_json = ask_notebooklm(args.query.strip(), notebook_id, notebooklm_bin_from(args.notebooklm_bin))
        answer = first_text_value(answer_json, ("answer", "content", "text", "response"))
        sources = normalize_notebook_sources(metadata, answer_json)
        mode = "notebooklm-cli"
    else:
        if not args.sources_json:
            raise SystemExit("--sources-json is required unless --ask-notebooklm is used")
        sources = normalize_sources(read_json(args.sources_json))

    if not sources:
        raise SystemExit("No public source observations found in --sources-json")

    trace = build_trace(
        args.query.strip(),
        sources,
        notebook_id,
        mode=mode,
        answer=answer,
        notebook_url=notebook_url,
        metadata=metadata,
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8") as handle:
        json.dump(trace, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    print(f"wrote {args.output} with {len(sources)} public sources")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
