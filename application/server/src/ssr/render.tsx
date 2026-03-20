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

interface SSRData {
  posts?: unknown[];
  user?: unknown | null;
}

const SSR_RENDER_LIMIT = 10;

// レスポンスキャッシュ
const cache = new Map<string, { html: string; timestamp: number }>();
const CACHE_TTL_MS = 5000;

/**
 * データを埋め込んだHTMLを返す（HTML描画はクライアントに任せる）
 */
export function renderPage(url: string, data: SSRData): string {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.html;
  }

  let html = getTemplate();

  // preloadスクリプトをSSRデータスクリプトに置き換え
  const dataScript = buildDataScript(data);
  html = html.replace(
    /<script>window\.__PRELOAD_ME.*?<\/script>/,
    dataScript,
  );

  // フォントpreload
  const fontPreloads = [
    '<link rel="preload" as="font" type="font/woff2" href="/fonts/ReiNoAreMincho-Regular.woff2" crossorigin>',
    '<link rel="preload" as="font" type="font/woff2" href="/fonts/ReiNoAreMincho-Heavy.woff2" crossorigin>',
  ].join("");
  html = html.replace("</head>", `${fontPreloads}</head>`);

  cache.set(url, { html, timestamp: Date.now() });
  return html;
}

function safeJSON(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c").replace(/>/g, "\\u003e");
}

function buildDataScript(data: SSRData): string {
  const parts: string[] = [];

  if (data.posts !== undefined) {
    parts.push(`window.__SSR_POSTS__=${safeJSON(data.posts)}`);
    parts.push(`window.__SSR_RENDER_LIMIT__=${SSR_RENDER_LIMIT}`);
  }

  if (data.user !== undefined) {
    parts.push(`window.__SSR_USER__=${safeJSON(data.user)}`);
  }

  if (parts.length === 0) return "";
  return `<script>${parts.join(";")}</script>`;
}
