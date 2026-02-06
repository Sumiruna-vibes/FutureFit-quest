# Developer Guide — Project layout and import conventions

This repository uses a single canonical application workspace under `app/`.

Canonical layout

- `app/src/components/` — React UI components (default exports)
- `app/src/engine/` — Engine/services (EventManager, PolicyEngine, SafeLocalStorage)
- `app/src/contexts/` — React context providers (EngineContext)
- `app/src/assets/` — Static assets

Import examples

- Component in same folder:

  ```js
  import MyComponent from './MyComponent';
  ```

- Component from components folder (from `app/src`):

  ```js
  import Dashboard from './components/Dashboard';
  ```

- Engine services:

  ```js
  import EventManager from './engine/EventManager';
  ```

Conventions

- Use default exports for components and main engine classes to keep imports simple.
- Use relative imports rooted at `app/src` when editing files inside that directory.
- Keep UI components in `components/` and non-UI logic in `engine/`.

Quick checklist before submitting changes

- Do files live under `app/src/components` or `app/src/engine`? ✅
- Do imports use the expected relative paths (see examples)? ✅
- Run `npm run build` inside `app/` to confirm there are no missing module errors. ✅

If you need help moving files into this layout, reply here and I will relocate them and open a branch.
