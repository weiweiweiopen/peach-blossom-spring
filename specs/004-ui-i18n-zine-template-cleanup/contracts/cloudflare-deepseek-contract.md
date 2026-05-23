# Cloudflare DeepSeek Contract

## Worker URL

Frontend DeepSeek calls must use:

`https://solar-oracle-deepseek-proxy.dontmarryme.workers.dev/chat`

## Allowed Origins

The Cloudflare Worker CORS/secret deployment is expected to allow only these origins for this project:

- `https://weiweiweiopen.github.io`
- `http://localhost:5173`
- `http://127.0.0.1:5173`
- `http://localhost:5177`
- `http://127.0.0.1:5177`
- `https://weiweiweishop2.myshopify.com`

Do not assume automatically selected Vite ports such as 5174 or 5175 are valid DeepSeek origins. If Vite opens on another port, UI can be inspected there, but DeepSeek wiki generation should be tested on an allowed origin.
