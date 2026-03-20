import { combineReducers, legacy_createStore as createStore, Dispatch, UnknownAction } from "redux";

const rootReducer = combineReducers({
  form: (state = {}) => state,
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = Dispatch<UnknownAction>;

export const store = createStore(rootReducer);

let formReducerInjected = false;

export async function injectFormReducer() {
  if (formReducerInjected) return;
  formReducerInjected = true;
  const { reducer: formReducer } = await import("redux-form");
  store.replaceReducer(
    combineReducers({
      form: formReducer,
    }),
  );
}
