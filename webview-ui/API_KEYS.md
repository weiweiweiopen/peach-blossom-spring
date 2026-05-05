# API Key Setup

1. Create `webview-ui/.env.local`.
2. Add `VITE_DEEPSEEK_API_KEY=...`.
3. Restart the dev server.
4. Never commit `.env.local`.
5. Rotate the key immediately if it was pasted into chat, screenshots, GitHub, or logs.

Local browser storage is also supported for one-time local saving, but `.env.local` is the preferred local development workflow.
