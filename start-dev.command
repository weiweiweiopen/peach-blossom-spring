#!/bin/zsh
# Peach Blossom Spring — local dev launcher
# Double-click this file in Finder. It will install dependencies if needed,
# start the local Vite server, and open Safari.

set -u

PROJECT_DIR="${0:A:h}"
WEB_DIR="$PROJECT_DIR/webview-ui"
PORT="${PBS_DEV_PORT:-5173}"
URL="http://localhost:${PORT}/"

cd "$PROJECT_DIR" || exit 1

# Finder-launched shells sometimes inherit a very small PATH. Add common Homebrew/Node paths.
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

print "🍑 Peach Blossom Spring local dev"
print "Project: $PROJECT_DIR"
print "URL:     $URL"
print ""

fail_pause() {
  print ""
  print "❌ $1"
  print ""
  print "Press any key to close this window..."
  read -k 1
  exit 1
}

command -v node >/dev/null 2>&1 || fail_pause "Node.js is not installed or not in PATH."
command -v npm >/dev/null 2>&1 || fail_pause "npm is not installed or not in PATH."

[[ -d "$WEB_DIR" ]] || fail_pause "Missing folder: $WEB_DIR"
[[ -f "$WEB_DIR/package.json" ]] || fail_pause "Missing package.json in $WEB_DIR"

cd "$WEB_DIR" || fail_pause "Cannot enter $WEB_DIR"

if [[ -d "node_modules" && ! -x "node_modules/.bin/vite" ]]; then
  print "⚠️  node_modules exists but Vite is missing; reinstalling cleanly..."
  rm -rf node_modules || fail_pause "Could not remove broken node_modules."
fi

if [[ ! -x "node_modules/.bin/vite" ]]; then
  print "📦 Installing dependencies. This can take a few minutes..."
  npm install || fail_pause "npm install failed. Check the messages above."
fi

EXISTING_PIDS="$(/usr/sbin/lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"
if [[ -n "$EXISTING_PIDS" ]]; then
  print "♻️  Port $PORT is already running. Stopping stale local server first..."
  for pid in ${(f)EXISTING_PIDS}; do
    kill "$pid" >/dev/null 2>&1 || true
  done
  sleep 1
fi

print "🚀 Starting local Vite dev server from this folder:"
print "   $WEB_DIR"
print "   Stop it with Ctrl+C, or close this Terminal window."
print ""

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]]; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup INT TERM EXIT

npm run dev -- --host 127.0.0.1 --port "$PORT" &
SERVER_PID=$!

print "⏳ Waiting for local server..."
for i in {1..60}; do
  if /usr/bin/curl -fsS "$URL" >/dev/null 2>&1; then
    print "✅ Server is ready. Opening Safari..."
    /usr/bin/open -a Safari "$URL" || /usr/bin/open "$URL" || true
    break
  fi
  if ! kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    wait "$SERVER_PID"
    fail_pause "Dev server stopped before it became ready."
  fi
  sleep 1
done

if ! /usr/bin/curl -fsS "$URL" >/dev/null 2>&1; then
  print "⚠️  Server did not answer yet, but the process is still running."
  print "   Try opening: $URL"
fi

wait "$SERVER_PID"
