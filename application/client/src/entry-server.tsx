import { PassThrough } from "node:stream";

import { renderToPipeableStream } from "react-dom/server";
import { Provider } from "react-redux";
import { StaticRouter } from "react-router";

import { AppContainer } from "@web-speed-hackathon-2026/client/src/containers/AppContainer";
import { store } from "@web-speed-hackathon-2026/client/src/store";

interface SSRData {
  user?: Models.User | null;
}

/**
 * renderToPipeableStreamで実際のAppContainerをレンダリング
 * → hydrateRootでのhydrationが完全一致
 */
export function render(url: string, data: SSRData): Promise<string> {
  // グローバル変数にSSRデータをセット（AppContainerが読み取る）
  (globalThis as any).__SSR_USER__ = data.user ?? null;

  return new Promise<string>((resolve, reject) => {
    let html = "";
    const { pipe } = renderToPipeableStream(
      <Provider store={store}>
        <StaticRouter location={url}>
          <AppContainer />
        </StaticRouter>
      </Provider>,
      {
        onShellReady() {
          // シェル（Suspense外の部分）が準備完了
          const stream = new PassThrough();
          stream.on("data", (chunk: Buffer) => {
            html += chunk.toString();
          });
          stream.on("end", () => resolve(html));
          pipe(stream);
        },
        onError(err) {
          console.error("SSR stream error:", err);
          reject(err);
        },
      },
    );
  });
}
