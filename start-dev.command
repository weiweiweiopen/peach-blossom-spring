#!/bin/bash
# Double-click this file from Finder to start the Peach Blossom Spring dev server.
# Stop with Ctrl+C.

cd "$(dirname "$0")"

# A half-installed node_modules folder may exist but be missing the .bin
# symlinks vite needs. Detect that state and do a clean reinstall.
if [ -d "webview-ui/node_modules" ] && [ ! -x "webview-ui/node_modules/.bin/vite" ]; then
  echo "==> webview-ui/node_modules looks broken (vite binary missing)."
  echo "    Removing it for a clean reinstall..."
  rm -rf webview-ui/node_modules
fi

if [ ! -x "webview-ui/node_modules/.bin/vite" ]; then
  echo "==> Installing webview-ui dependencies (this can take 1-3 minutes)..."
  npm --prefix webview-ui install || {
    echo
    echo "!! npm install failed. See the error above."
    read -n 1 -s -r -p "Press any key to close this window..."
    exit 1
  }
fi

echo "==> Starting vite dev server..."
echo "    Open the printed http://localhost:... URL in your browser."
echo
exec npm --prefix webview-ui run dev
