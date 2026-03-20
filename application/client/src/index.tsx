import "./index.css";
import "./buildinfo";

import { hydrateRoot } from "react-dom/client";
import { startTransition } from "react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router";

import { AppContainer } from "@web-speed-hackathon-2026/client/src/containers/AppContainer";
import { store } from "@web-speed-hackathon-2026/client/src/store";

// hydrationをstartTransitionで低優先度にし、メインスレッドブロッキングを軽減
startTransition(() => {
  hydrateRoot(
    document.getElementById("app")!,
    <Provider store={store}>
      <BrowserRouter>
        <AppContainer />
      </BrowserRouter>
    </Provider>,
  );
});
