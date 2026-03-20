import "./index.css";
import "./buildinfo";
import "./polyfills/invoker-command";

import { hydrateRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router";

import { AppContainer } from "@web-speed-hackathon-2026/client/src/containers/AppContainer";
import { injectFormReducer, store } from "@web-speed-hackathon-2026/client/src/store";

// redux-formを早期にprefetch（AuthModal/Search/NewPost表示前にロード完了させる）
void injectFormReducer();

hydrateRoot(
  document.getElementById("app")!,
  <Provider store={store}>
    <BrowserRouter>
      <AppContainer />
    </BrowserRouter>
  </Provider>,
);
