#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOST="${PBS_GAME_HOST:-127.0.0.1}"
PORT="${PBS_GAME_PORT:-4173}"
URL="http://${HOST}:${PORT}/"

cd "$ROOT"

echo "Building PBS web UI..."
npm --prefix webview-ui run build

echo "Indexing local PBS memory..."
python3 scripts/pbs_engine.py index

echo "Starting PBS local full-memory game at ${URL}"
if command -v open >/dev/null 2>&1; then
  (sleep 1 && open "$URL") &
fi

python3 scripts/pbs_game_server.py --host "$HOST" --port "$PORT"
