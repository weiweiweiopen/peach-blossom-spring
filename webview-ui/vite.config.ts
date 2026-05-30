import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import * as fs from 'fs';
import type { IncomingMessage, ServerResponse } from 'http';
import * as path from 'path';
import type { Plugin } from 'vite';
import { defineConfig, loadEnv } from 'vite';

import { buildAssetIndex, buildFurnitureCatalog } from '../shared/assets/build.ts';
import {
  decodeAllCharacters,
  decodeAllFloors,
  decodeAllFurniture,
  decodeAllWalls,
} from '../shared/assets/loader.ts';

// ── Decoded asset cache (invalidated on file change) ─────────────────────────

interface DecodedCache {
  characters: ReturnType<typeof decodeAllCharacters> | null;
  floors: ReturnType<typeof decodeAllFloors> | null;
  walls: ReturnType<typeof decodeAllWalls> | null;
  furniture: ReturnType<typeof decodeAllFurniture> | null;
}

type MiddlewareStack = {
  use: (
    path: string,
    handler: (
      req: IncomingMessage,
      res: ServerResponse,
      next: (err?: unknown) => void,
    ) => void | Promise<void>,
  ) => void;
};

// ── Vite plugin ───────────────────────────────────────────────────────────────

function browserMockAssetsPlugin(): Plugin {
  const assetsDir = path.resolve(__dirname, 'public/assets');
  const distAssetsDir = path.resolve(__dirname, '../dist/webview/assets');
  const editorLayoutPath = path.join(assetsDir, 'pbs-editor-layout.json');

  const cache: DecodedCache = { characters: null, floors: null, walls: null, furniture: null };
  let suppressNextEditorLayoutReload = false;

  function clearCache(): void {
    cache.characters = null;
    cache.floors = null;
    cache.walls = null;
    cache.furniture = null;
  }

  return {
    name: 'browser-mock-assets',
    configureServer(server) {
      // Strip trailing slash: '/' → '', '/sub/' → '/sub'
      const base = server.config.base.replace(/\/$/, '');

      server.middlewares.use('/api/editor-layout', async (req, res, next) => {
        if (req.method !== 'POST') {
          next();
          return;
        }

        try {
          const chunks: Uint8Array[] = [];
          for await (const chunk of req) {
            chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
          }
          const body = Buffer.concat(chunks).toString('utf8');
          const layout = JSON.parse(body || '{}') as { version?: unknown; cols?: unknown; rows?: unknown; tiles?: unknown; furniture?: unknown };
          if (
            layout.version !== 1 ||
            typeof layout.cols !== 'number' ||
            typeof layout.rows !== 'number' ||
            !Array.isArray(layout.tiles) ||
            !Array.isArray(layout.furniture)
          ) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Invalid editor layout payload.' }));
            return;
          }

          suppressNextEditorLayoutReload = true;
          fs.writeFileSync(editorLayoutPath, `${JSON.stringify(layout, null, 2)}\n`);
          clearCache();
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: true, path: path.relative(__dirname, editorLayoutPath) }));
        } catch (error) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to save editor layout.' }));
        }
      });

      server.middlewares.use('/api/zine-repair-report', async (req, res, next) => {
        if (req.method !== 'POST') {
          next();
          return;
        }

        try {
          const chunks: Uint8Array[] = [];
          for await (const chunk of req) {
            chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
          }
          const report = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') as Record<string, unknown>;
          const id = typeof report.id === 'string' && /^[a-zA-Z0-9._-]+$/.test(report.id) ? report.id : `zine-repair-${Date.now()}`;
          const outDir = path.resolve(__dirname, '../obsidian-vault/Review/zine-repair-reports');
          const inboxDir = path.resolve(__dirname, '../obsidian-vault/Review/zine-feedback-inbox');
          const questionDir = path.resolve(__dirname, '../obsidian-vault/Review/question-candidates');
          fs.mkdirSync(outDir, { recursive: true });
          fs.mkdirSync(inboxDir, { recursive: true });
          fs.mkdirSync(questionDir, { recursive: true });
          const jsonPath = path.join(outDir, `${id}.json`);
          const mdPath = path.join(outDir, `${id}.md`);
          const inboxPath = path.join(inboxDir, `${id}.md`);
          const questionPath = path.join(questionDir, `${id}.md`);
          fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
          fs.writeFileSync(mdPath, zineRepairReportMarkdown(report));
          fs.writeFileSync(inboxPath, zineReviewArtifactMarkdown(report, 'zine-feedback-inbox'));
          fs.writeFileSync(questionPath, zineReviewArtifactMarkdown(report, 'question-candidate'));
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            ok: true,
            jsonPath: path.relative(path.resolve(__dirname, '..'), jsonPath),
            mdPath: path.relative(path.resolve(__dirname, '..'), mdPath),
            inboxPath: path.relative(path.resolve(__dirname, '..'), inboxPath),
            questionPath: path.relative(path.resolve(__dirname, '..'), questionPath),
          }));
        } catch (error) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to save zine repair report.' }));
        }
      });

      // Catalog & index (existing)
      server.middlewares.use(`${base}/assets/furniture-catalog.json`, (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(buildFurnitureCatalog(assetsDir)));
      });
      server.middlewares.use(`${base}/assets/asset-index.json`, (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(buildAssetIndex(assetsDir)));
      });

      // Pre-decoded sprites (new — eliminates browser-side PNG decoding)
      server.middlewares.use(`${base}/assets/decoded/characters.json`, (_req, res) => {
        cache.characters ??= decodeAllCharacters(assetsDir);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(cache.characters));
      });
      server.middlewares.use(`${base}/assets/decoded/floors.json`, (_req, res) => {
        cache.floors ??= decodeAllFloors(assetsDir);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(cache.floors));
      });
      server.middlewares.use(`${base}/assets/decoded/walls.json`, (_req, res) => {
        cache.walls ??= decodeAllWalls(assetsDir);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(cache.walls));
      });
      server.middlewares.use(`${base}/assets/decoded/furniture.json`, (_req, res) => {
        cache.furniture ??= decodeAllFurniture(assetsDir, buildFurnitureCatalog(assetsDir));
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(cache.furniture));
      });

      // Hot-reload on asset file changes (PNGs, manifests, layouts)
      server.watcher.add(assetsDir);
      server.watcher.on('change', (file) => {
        if (file.startsWith(assetsDir)) {
          if (file === editorLayoutPath && suppressNextEditorLayoutReload) {
            suppressNextEditorLayoutReload = false;
            clearCache();
            return;
          }
          console.log(`[browser-mock-assets] Asset changed: ${path.relative(assetsDir, file)}`);
          clearCache();
          server.ws.send({ type: 'full-reload' });
        }
      });
    },
    // Build output includes lightweight metadata consumed by browser runtime.
    closeBundle() {
      fs.mkdirSync(distAssetsDir, { recursive: true });

      const catalog = buildFurnitureCatalog(assetsDir);
      fs.writeFileSync(path.join(distAssetsDir, 'furniture-catalog.json'), JSON.stringify(catalog));
      fs.writeFileSync(
        path.join(distAssetsDir, 'asset-index.json'),
        JSON.stringify(buildAssetIndex(assetsDir)),
      );
    },
  };
}

function deepSeekChatProxyPlugin(defaultApiKey: string): Plugin {
  function registerChatRoute(middlewares: MiddlewareStack): void {
    middlewares.use('/api/chat', async (req, res, next) => {
      if (req.method !== 'POST') {
        next();
        return;
      }

      const runtimeApiKey = req.headers['x-deepseek-api-key'];
      const resolvedApiKey = Array.isArray(runtimeApiKey)
        ? runtimeApiKey.find((value) => value.trim().length > 0)?.trim() ?? ''
        : runtimeApiKey?.trim() ?? defaultApiKey.trim();

      if (!resolvedApiKey) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Missing DeepSeek API key. Set VITE_DEEPSEEK_API_KEY in webview-ui/.env.local or save one locally in the browser.' }));
        return;
      }

      const chunks: Uint8Array[] = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }

      try {
        const bodyText = Buffer.concat(chunks).toString('utf8');
        const payload = JSON.parse(bodyText || '{}') as {
          systemPrompt?: string;
          prompt?: string;
          temperature?: number;
          max_tokens?: number;
        };

        if (!payload.prompt || typeof payload.prompt !== 'string') {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'prompt is required' }));
          return;
        }

        const upstream = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resolvedApiKey}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: payload.systemPrompt ?? '' },
              { role: 'user', content: payload.prompt },
            ],
            temperature: payload.temperature ?? 0.7,
            max_tokens: payload.max_tokens ?? 700,
          }),
        });

        const responseText = await upstream.text();
        res.statusCode = upstream.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(responseText);
      } catch (error) {
        res.statusCode = 502;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            error: `Upstream error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          }),
        );
      }
    });
  }

  return {
    name: 'deepseek-chat-proxy',
    configureServer(server) {
      registerChatRoute(server.middlewares);
    },
    configurePreviewServer(server) {
      registerChatRoute(server.middlewares);
    },
  };
}

function markdownField(report: Record<string, unknown>, key: string): string {
  const value = report[key];
  if (typeof value === 'string') return value.trim() || '(empty)';
  return JSON.stringify(value ?? null, null, 2);
}

function zineReviewArtifactMarkdown(report: Record<string, unknown>, artifactKind: string): string {
  return `# ${artifactKind}: ${markdownField(report, 'zineTitle')}\n\n` +
    `- id: ${markdownField(report, 'id')}\n` +
    `- query: ${markdownField(report, 'query')}\n` +
    `- createdAt: ${markdownField(report, 'createdAt')}\n` +
    `- reviewKind: ${artifactKind}\n` +
    `- sourceReport: zine-repair-reports/${markdownField(report, 'id')}.md\n\n` +
    `## Review Routing\n\n\`\`\`json\n${markdownField(report, 'vaultReviewRouting')}\n\`\`\`\n\n` +
    `## Player Feedback\n\n` +
    `### Useful Parts\n${markdownField(report, 'usefulParts')}\n\n` +
    `### Useless Or Misleading Parts\n${markdownField(report, 'uselessParts')}\n\n` +
    `### Requested Repair\n${markdownField(report, 'repairInstruction')}\n\n` +
    `## Evidence Snapshot\n\n\`\`\`json\n${markdownField(report, 'evidenceSnapshot')}\n\`\`\`\n`;
}

function zineRepairReportMarkdown(report: Record<string, unknown>): string {
  const title = typeof report.zineTitle === 'string' && report.zineTitle.trim() ? report.zineTitle.trim() : 'Zine repair report';
  return `# ${title}\n\n` +
    `- id: ${markdownField(report, 'id')}\n` +
    `- query: ${markdownField(report, 'query')}\n` +
    `- language: ${markdownField(report, 'language')}\n` +
    `- createdAt: ${markdownField(report, 'createdAt')}\n` +
    `- originalRequestId: ${markdownField(report, 'originalRequestId')}\n` +
    `- reportKind: zine-repair-feedback\n\n` +
    `## Useful Parts\n${markdownField(report, 'usefulParts')}\n\n` +
    `## Useless Or Misleading Parts\n${markdownField(report, 'uselessParts')}\n\n` +
    `## Requested Repair\n${markdownField(report, 'repairInstruction')}\n\n` +
    `## Evidence Snapshot\n\`\`\`json\n${markdownField(report, 'evidenceSnapshot')}\n\`\`\`\n\n` +
    `## Suggested Vault Actions\n${markdownField(report, 'suggestedVaultActions')}\n`;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');

  return {
    plugins: [tailwindcss(), react(), browserMockAssetsPlugin(), deepSeekChatProxyPlugin(env.VITE_DEEPSEEK_API_KEY ?? '')],
    build: {
      outDir: '../dist/webview',
      emptyOutDir: true,
    },
    server: {
      fs: {
        allow: [__dirname, path.resolve(__dirname, '..'), path.resolve(__dirname, '../shared')],
      },
    },
    base: './',
  };
});
