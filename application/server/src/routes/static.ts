import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic from "serve-static";

import { User } from "@web-speed-hackathon-2026/server/src/models";
import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";
import { sessionMiddleware } from "@web-speed-hackathon-2026/server/src/session";
import { renderPage } from "@web-speed-hackathon-2026/server/src/ssr/render";

export const staticRouter = Router();

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

// ユーザーデータのみサーバーで取得してHTML埋め込み
staticRouter.use(async (req, res, next) => {
  if (req.url !== "/index.html") {
    return next();
  }

  try {
    const originalUrl = req.originalUrl?.split("?")[0] ?? "/";

    // セッションからユーザーを取得
    let user: unknown | null = undefined;
    await new Promise<void>((resolve) => {
      sessionMiddleware(req as any, res as any, () => resolve());
    });
    const userId = (req as any).session?.userId;
    if (userId) {
      const userModel = await User.findByPk(userId);
      user = userModel ? userModel.toJSON() : null;
    } else {
      user = null;
    }

    const html = renderPage(originalUrl, { user });
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (e) {
    console.error("SSR render error:", e);
    next();
  }
});

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    etag: false,
    lastModified: false,
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    etag: false,
    lastModified: false,
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: false,
    lastModified: false,
  }),
);
