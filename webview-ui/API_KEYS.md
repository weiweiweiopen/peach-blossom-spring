# DeepSeek Proxy Setup

Peach Blossom Spring follows the Solar Oracle Walkman pattern: the browser calls a Cloudflare Worker proxy, and the DeepSeek API key lives only in the Worker secret.

1. Deploy or reuse a Cloudflare Worker compatible with `worker/deepseek-proxy.js` from Solar Oracle Walkman.
2. Store the DeepSeek key with `wrangler secret put DEEPSEEK_API_KEY`.
3. Allow `https://weiweiweiopen.github.io` in the Worker CORS origins.
4. Set `webview-ui/index.html` meta `pbs-chat-api` to the Worker `/chat` URL.
5. Never put DeepSeek keys in frontend source, `.env`, screenshots, GitHub, logs, or chat transcripts.
6. Rotate the key immediately if it was pasted into chat, screenshots, GitHub, or logs.

Do not reintroduce frontend API key inputs. The active UI must talk through the proxy and must not render, log, or store the full key.
