import fs from "node:fs";
import path from "node:path";

import { CLIENT_DIST_PATH } from "@web-speed-hackathon-2026/server/src/paths";

// ビルド済みテンプレートをキャッシュ
let templateHtml: string | null = null;
function getTemplate(): string {
  if (templateHtml !== null) return templateHtml;
  const indexPath = path.join(CLIENT_DIST_PATH, "index.html");
  templateHtml = fs.readFileSync(indexPath, "utf-8");
  return templateHtml;
}

let ssrModule: { render: (url: string, data: any) => Promise<string> } | null = null;
async function getSSRModule() {
  if (ssrModule !== null) return ssrModule;
  const serverDir = path.join(CLIENT_DIST_PATH, "server", "scripts");
  const entryFile = fs.readdirSync(serverDir).find((f) => f.startsWith("entry-server"));
  if (!entryFile) throw new Error("SSR entry not found");
  ssrModule = await import(path.join(serverDir, entryFile));
  return ssrModule!;
}

interface SSRData {
  user?: unknown | null;
}

// レスポンスキャッシュ
const cache = new Map<string, { html: string; timestamp: number }>();
const CACHE_TTL_MS = 5000;

/**
 * Vite SSRバンドルでAppContainerをレンダリングし、HTMLに埋め込む
 */
export async function renderPage(url: string, data: SSRData): Promise<string> {
  const cacheKey = `${url}:${data.user ? "auth" : "anon"}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.html;
  }

  let html = getTemplate();
  const ssr = await getSSRModule();

  // renderToPipeableStreamで実際のAppContainerをレンダリング
  const shellHtml = await ssr.render(url, data);

  // シェルHTMLを注入
  html = html.replace(
    '<div id="app"></div>',
    `<div id="app">${shellHtml}</div>`,
  );

  // preload fetchスクリプトにSSRユーザーデータを追加
  if (data.user !== undefined) {
    const userScript = `window.__SSR_USER__=${safeJSON(data.user)};`;
    html = html.replace(
      /<script>window\.__PRELOAD_ME/,
      `<script>${userScript}window.__PRELOAD_ME`,
    );
  }

  // フォントpreload
  const fontPreloads = [
    '<link rel="preload" as="font" type="font/woff2" href="/fonts/ReiNoAreMincho-Regular.woff2" crossorigin>',
    '<link rel="preload" as="font" type="font/woff2" href="/fonts/ReiNoAreMincho-Heavy.woff2" crossorigin>',
  ].join("");
  html = html.replace("</head>", `${fontPreloads}</head>`);

  cache.set(cacheKey, { html, timestamp: Date.now() });
  return html;
}

function safeJSON(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c").replace(/>/g, "\\u003e");
}
