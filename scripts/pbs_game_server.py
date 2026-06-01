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
from pbs_engine import build_evidence_packet, create_review_draft, memory_search, memory_search_with_hints, rel, schema_context  # noqa: E402


def json_bytes(payload: object) -> bytes:
    return json.dumps(payload, ensure_ascii=False).encode("utf-8")


def fallback_answer(question: str, evidence: list[dict], error: str = "") -> str:
    if not evidence:
        return "這題火邊暫時沒有撿到可靠材料；換一個更具體的作品、材料或工作坊名稱，我再翻一次灰。"
    first = evidence[0]
    label = first.get("label") or first.get("sourceLabel") or "第一個來源"
    text = str(first.get("text") or "").strip()
    snippet = text[:180].strip()
    return f"我先抓住「{label}」這根木柴：{snippet}。這不是完整答案，只是火暫時把能檢查的材料推到你手邊；等外部腦袋醒來，我再把它烤成比較像話的回應。"


def language_instruction(preferred_language: str) -> str:
    if preferred_language == "zh-TW":
        return "Answer in Traditional Chinese. Never use Simplified Chinese."
    if preferred_language == "ja":
        return "Answer in Japanese."
    if preferred_language == "th":
        return "Answer in Thai."
    if preferred_language == "id":
        return "Answer in Indonesian."
    if preferred_language == "de":
        return "Answer in German."
    if preferred_language == "en":
        return "Answer in English only. Do not use Chinese unless quoting a source title."
    return "Answer in the same language as the question. Do not switch languages."


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


def dialogue_history_context(turns: object, limit: int = 8) -> str:
    if not isinstance(turns, list):
        return ""
    cleaned = []
    for turn in turns[-limit:]:
        if not isinstance(turn, dict):
            continue
        speaker = str(turn.get("speaker") or "").strip()[:80]
        text = str(turn.get("text") or "").strip().replace("\n", " ")[:900]
        if speaker and text:
            cleaned.append(f"{speaker}: {text}")
    return "\n".join(cleaned)


def answer_with_memory(question: str, preferred_language: str, npc_context: str = "", dialogue_history: str = "") -> dict:
    links = memory_search(question, limit=8)
    evidence = build_evidence_packet(links)
    evidence_block = "\n\n".join(
        f"[{index}] {item.get('label')}\n{item.get('text')}\n{item.get('url', '')}"
        for index, item in enumerate(evidence, start=1)
    )
    system_prompt = "\n".join([
        language_instruction(preferred_language),
        "You answer inside a Peach Blossom Spring RPG dialogue.",
        "The interface language instruction is binding; do not answer in Traditional Chinese unless preferred_language is zh-TW.",
        "If optional NPC context is present, answer in first person as that NPC, using the persona JSON/profile, response topics, and transcript excerpts as the voice anchor.",
        "Do not write system self-description. Never say phrases like 'X persona', 'X 的人格', 'local-memory game assistant', 'retrieval', 'backend', 'source-first', or 'I will answer from interview memory'.",
        "Use PBS engine evidence for public source grounding and links, but do not flatten the NPC into a generic search assistant.",
        "No visible Markdown/syntax language in reader-facing dialogue: no **bold**, no backticks, no headings, no bullets, no bracket citations like [1].",
        "Do not overgeneralize from a single event page. For SGMK, describe it as the Swiss Mechatronic Art Society / mechatronic art, DIY electronics, sound, handmade technology, workshops and gatherings network. Do not call SGMK an AI-workshop organization just because one page mentions an AI talk or workshop.",
        "Use the recent dialogue context to answer follow-ups and preserve continuity. Do not reset the conversation when the player refers to something already said.",
        "Use only the source evidence below plus optional NPC context. If evidence is incomplete, say what is missing in the NPC/campfire voice instead of inventing facts.",
        "Mention links by plain language only when useful; keep source references light in NPC dialogue.",
        "Do not say no evidence was found when PBS engine evidence is present. If the evidence block is empty, say the link search did not find reliable related sources and do not imply that source links exist.",
        "Keep a little campfire wit when it fits, but be concrete first.",
        "Every campfire answer must include one short practical PBS usage tip in the same language. Vary the tip: open the source links, ask for examples, turn the answer into a zine, compare communities, or use more concrete material/place names.",
        "Occasionally, roughly one out of four answers, briefly explain the name 多重心智自我火燄: feelings, emotions, and thoughts can be shared rather than privately owned; cite it as Joscha Bach's reading of an ancient Greek idea that later became the idea of gods. Keep it short and do not force it when the user needs a direct answer.",
        "",
        "--- PBS schema context ---",
        schema_context()[:5000],
        "--- end schema context ---",
        "",
        "--- optional NPC context ---",
        npc_context[:5000],
        "--- end optional NPC context ---",
        "",
        "--- recent dialogue context ---",
        dialogue_history[:5000] or "(no prior dialogue in this window)",
        "--- end recent dialogue context ---",
        "",
        "--- PBS engine evidence ---",
        evidence_block or "(no PBS engine evidence)",
        "--- end PBS engine evidence ---",
    ])
    try:
        answer = call_deepseek(system_prompt, question)
    except (urllib.error.URLError, urllib.error.HTTPError, RuntimeError, TimeoutError) as error:
        answer = fallback_answer(question, evidence, str(error)) if evidence else f"Local PBS memory server is available, but no PBS engine evidence matched this question. DeepSeek error: {error}"
    resolved_links = links if links else memory_search_with_hints(question, answer, limit=8)
    resolved_evidence = evidence if links else build_evidence_packet(resolved_links)
    return {"answer": answer, "evidence": resolved_evidence, "links": resolved_links}


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
                dialogue_history = dialogue_history_context(payload.get("dialogueHistory"))
                self.send_json(answer_with_memory(question, preferred_language, dialogue_history=dialogue_history))
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
                dialogue_history = dialogue_history_context(payload.get("dialogueHistory"))
                npc_context = "\n".join([
                    f"NPC: {npc_name}",
                    "Persona JSON:",
                    json.dumps(persona_payload, ensure_ascii=False, indent=2),
                    "Relevant transcript excerpts:",
                    transcript,
                    "Instruction: answer as this NPC, using the persona and transcript excerpts first as the voice/stance/cadence anchor; public PBS evidence is only checkable support. Do not answer like a generic search assistant.",
                ])
                self.send_json(answer_with_memory(question, preferred_language, npc_context=npc_context, dialogue_history=dialogue_history))
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
