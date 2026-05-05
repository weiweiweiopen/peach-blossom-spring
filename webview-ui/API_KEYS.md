# API Key Setup (Local Only)

Use local environment variables for DeepSeek during development.

1. Create `webview-ui/.env.local`.
2. Add:
   `VITE_DEEPSEEK_API_KEY=your_key_here`
3. Restart the dev server.
4. Never commit `.env.local` (it is gitignored).
5. If a key is ever pasted into chat, screenshots, GitHub, or logs, rotate it immediately.

Notes:
- Production/static builds should not require committing a key.
- UI should only use local env or local browser storage fallback.
