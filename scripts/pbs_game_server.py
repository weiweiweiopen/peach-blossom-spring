#!/usr/bin/env python3
"""Local PBS game server for full-memory mode."""

from __future__ import annotations

import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import sys
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
DIST_DIR = ROOT / "dist" / "webview"
WEBVIEW_DIR = ROOT / "webview-ui"
PUBLIC_DIR = WEBVIEW_DIR / "public"
ASSETS_DIR = PUBLIC_DIR / "assets"
DEEPSEEK_URL = os.environ.get("PBS_DEEPSEEK_PROXY_URL", "https://solar-oracle-deepseek-proxy.dontmarryme.workers.dev/chat")
DEEPSEEK_ORIGIN = os.environ.get("PBS_DEEPSEEK_ORIGIN", "https://weiweiweiopen.github.io")

sys.path.insert(0, str(ROOT / "scripts"))
from pbs_engine import build_evidence_packet, create_review_draft, memory_search, rel, schema_context  # noqa: E402


def json_bytes(payload: object) -> bytes:
    return json.dumps(payload, ensure_ascii=False).encode("utf-8")


def fallback_answer(question: str, evidence: list[dict], error: str = "") -> str:
    lines = [
        "Local PBS memory server found source evidence, but DeepSeek is unavailable right now.",
        "PBS engine evidence fallback:",
    ]
    for index, item in enumerate(evidence, start=1):
        label = item.get("label") or item.get("sourceLabel") or f"Source {index}"
        text = item.get("text") or ""
        url = item.get("url") or ""
        lines.append(f"{index}. {label}: {text} {url}".strip())
    if error:
        lines.append(f"DeepSeek error: {error}")
    return "\n".join(lines)


def language_instruction(preferred_language: str) -> str:
    if preferred_language == "zh-TW":
        return "Answer in Traditional Chinese. Never use Simplified Chinese."
    if preferred_language == "ja":
        return "Answer in Japanese."
    if preferred_language == "th":
        return "Answer in Thai."
    return "Answer in the same language as the question."


def call_deepseek(system_prompt: str, user_prompt: str, max_tokens: int = 900, temperature: float | None = None, response_format: dict | None = None, api_key: str = "") -> str:
    body_payload = {
        "mode": "chat",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "max_tokens": max_tokens,
    }
    if temperature is not None:
        body_payload["temperature"] = temperature
    if response_format:
        body_payload["response_format"] = response_format
    body = json_bytes(body_payload)
    request = urllib.request.Request(
        DEEPSEEK_URL,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Origin": DEEPSEEK_ORIGIN,
            "User-Agent": "PBS-local-memory-server/0.1",
            **({"Authorization": f"Bearer {api_key}", "x-deepseek-api-key": api_key} if api_key else {}),
        },
    )
    with urllib.request.urlopen(request, timeout=45) as response:
        data = json.loads(response.read().decode("utf-8"))
    answer = data.get("answer") or data.get("content")
    if not answer and data.get("choices"):
        answer = data["choices"][0].get("message", {}).get("content")
    if not answer and data.get("raw", {}).get("choices"):
        answer = data["raw"]["choices"][0].get("message", {}).get("content")
    if not isinstance(answer, str) or not answer.strip():
        raise RuntimeError("DeepSeek response did not include answer content")
    return answer.strip()


def answer_with_memory(question: str, preferred_language: str, npc_context: str = "") -> dict:
    links = memory_search(question, limit=8)
    evidence = build_evidence_packet(links)
    evidence_block = "\n\n".join(
        f"[{index}] {item.get('label')}\n{item.get('text')}\n{item.get('url', '')}"
        for index, item in enumerate(evidence, start=1)
    )
    system_prompt = "\n".join([
        language_instruction(preferred_language),
        "You answer as the PBS local-memory game assistant.",
        "If optional NPC context is present, answer through that NPC's persona, response topics, and transcript excerpts. Keep the NPC's role, concerns, and interview memory as the voice anchor.",
        "Use PBS engine evidence for public source grounding and links, but do not flatten the NPC into a generic search assistant.",
        "Use only the source evidence below plus optional NPC context. If evidence is incomplete, say what is missing instead of inventing facts.",
        "Cite evidence by bracket number when useful.",
        "Do not say no evidence was found when PBS engine evidence is present.",
        "",
        "--- PBS schema context ---",
        schema_context()[:5000],
        "--- end schema context ---",
        "",
        "--- optional NPC context ---",
        npc_context[:5000],
        "--- end optional NPC context ---",
        "",
        "--- PBS engine evidence ---",
        evidence_block or "(no PBS engine evidence)",
        "--- end PBS engine evidence ---",
    ])
    try:
        answer = call_deepseek(system_prompt, question)
    except (urllib.error.URLError, urllib.error.HTTPError, RuntimeError, TimeoutError) as error:
        answer = fallback_answer(question, evidence, str(error)) if evidence else f"Local PBS memory server is available, but no PBS engine evidence matched this question. DeepSeek error: {error}"
    return {"answer": answer, "evidence": evidence, "links": links}


class PbsGameHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIST_DIR), **kwargs)

    def send_json(self, payload: object, status: int = 200) -> None:
        data = json_bytes(payload)
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def read_json(self) -> dict:
        length = int(self.headers.get("Content-Length") or "0")
        body = self.rfile.read(length).decode("utf-8") if length else "{}"
        return json.loads(body or "{}")

    def do_POST(self) -> None:  # noqa: N802
        try:
            payload = self.read_json()
            if self.path == "/api/memory/search":
                query = str(payload.get("query") or "")
                limit = int(payload.get("limit") or 8)
                family = payload.get("family")
                self.send_json({"results": memory_search(query, limit=limit, family=family)})
                return
            if self.path == "/api/chat/campfire":
                question = str(payload.get("question") or "")
                preferred_language = str(payload.get("preferredLanguage") or "zh-TW")
                self.send_json(answer_with_memory(question, preferred_language))
                return
            if self.path == "/api/sources":
                raw_urls = payload.get("urls")
                urls = [str(url).strip() for url in raw_urls] if isinstance(raw_urls, list) else []
                urls = [url for url in urls if url.startswith("http://") or url.startswith("https://")]
                source_payload = {
                    "source_urls": urls,
                    "sources": {
                        "hackteria": {"kind": "mediawiki", "main": "https://www.hackteria.org/wiki/Main_Page", "out": "Sources/Raw/hackteria"},
                        "sgmk": {"kind": "mediawiki", "main": "https://wiki.sgmk-ssam.ch/wiki/Main_Page", "out": "Sources/Raw/sgmk"},
                        "htgwyw": {"kind": "wordpress", "main": "https://howtogetwhatyouwant.at", "out": "Sources/Raw/htgwyw"},
                    },
                }
                (ROOT / "pbs_sources.json").write_text(json.dumps(source_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
                self.send_json({"ok": True, "count": len(urls), "path": "pbs_sources.json"})
                return

            if self.path == "/api/editor-layout":
                filename = str(payload.get("filename") or "pbs-map.json").strip() or "pbs-map.json"
                safe = "".join(ch if ch.isalnum() or ch in ".-_" else "-" for ch in filename).strip("-") or "pbs-map.json"
                if not safe.endswith(".json"):
                    safe += ".json"
                layout = payload.get("layout") if isinstance(payload.get("layout"), dict) else payload
                if layout.get("version") != 1 or not isinstance(layout.get("cols"), int) or not isinstance(layout.get("rows"), int) or not isinstance(layout.get("tiles"), list) or not isinstance(layout.get("furniture"), list):
                    self.send_json({"error": "Invalid editor layout payload."}, 400)
                    return
                target = ASSETS_DIR / safe
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(json.dumps(layout, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
                self.send_json({"ok": True, "path": str(target.relative_to(WEBVIEW_DIR))})
                return

            if self.path == "/api/chat/association":
                system_prompt = str(payload.get("systemPrompt") or "")
                user_prompt = str(payload.get("prompt") or "")
                max_tokens = int(payload.get("max_tokens") or payload.get("maxTokens") or 900)
                temperature_value = payload.get("temperature")
                temperature = float(temperature_value) if isinstance(temperature_value, (int, float, str)) and str(temperature_value) else None
                response_format = payload.get("response_format") if isinstance(payload.get("response_format"), dict) else None
                api_key = str(self.headers.get("x-deepseek-api-key") or os.environ.get("DEEPSEEK_API_KEY") or os.environ.get("VITE_DEEPSEEK_API_KEY") or "")
                answer = call_deepseek(system_prompt, user_prompt, max_tokens=max_tokens, temperature=temperature, response_format=response_format, api_key=api_key)
                self.send_json({"content": answer})
                return
            if self.path == "/api/chat/npc":
                question = str(payload.get("question") or "")
                preferred_language = str(payload.get("preferredLanguage") or "zh-TW")
                npc_name = str(payload.get("npcName") or "NPC")
                persona_payload = payload.get("persona") if isinstance(payload.get("persona"), dict) else {}
                transcript = str(payload.get("transcript") or "")
                npc_context = "\n".join([
                    f"NPC: {npc_name}",
                    "Persona JSON:",
                    json.dumps(persona_payload, ensure_ascii=False, indent=2),
                    "Relevant transcript excerpts:",
                    transcript,
                    "Instruction: answer as this NPC, using the persona and transcript excerpts first; then use public PBS evidence as checkable support.",
                ])
                self.send_json(answer_with_memory(question, preferred_language, npc_context=npc_context))
                return
            if self.path == "/api/memory/draft":
                question = str(payload.get("question") or payload.get("query") or "")
                answer = str(payload.get("answer") or "")
                links = payload.get("links") if isinstance(payload.get("links"), list) else memory_search(question, limit=int(payload.get("limit") or 8))
                evidence = payload.get("evidence") if isinstance(payload.get("evidence"), list) else build_evidence_packet(links)
                route = str(payload.get("route") or "game")
                path = create_review_draft(question, answer, evidence, links, route=route)
                self.send_json({"path": rel(path)})
                return
            self.send_json({"error": "Unknown API endpoint"}, status=404)
        except Exception as error:  # noqa: BLE001
            self.send_json({"error": str(error)}, status=500)

    def do_GET(self) -> None:  # noqa: N802
        if self.path.startswith("/api/"):
            self.send_json({"error": "Use POST for PBS memory endpoints"}, status=405)
            return
        if not DIST_DIR.exists():
            self.send_error(503, "webview build not found; run npm --prefix webview-ui run build")
            return
        return super().do_GET()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default=os.environ.get("PBS_GAME_HOST", "127.0.0.1"))
    parser.add_argument("--port", type=int, default=int(os.environ.get("PBS_GAME_PORT", "4173")))
    args = parser.parse_args()
    server = ThreadingHTTPServer((args.host, args.port), PbsGameHandler)
    print(f"PBS local-memory game server: http://{args.host}:{args.port}/")
    print(f"Serving: {DIST_DIR}")
    server.serve_forever()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
