q
Hi Claude,

We're standardizing the code layout so your next deliveries integrate cleanly.

Please place UI components under:

- `app/src/components/` (e.g. `Dashboard.jsx`, `LessonPlayer.jsx`)

And engine/services under:

- `app/src/engine/` (e.g. `EventManager.js`, `PolicyEngine.js`)

Use default exports and import like:

```js
import Dashboard from './components/Dashboard';
import EventManager from './engine/EventManager';
```

I added minimal placeholders for `Dashboard` and `LessonPlayer` so the build stays green while you move files. Could you re-target your next PR to this layout or let me know where your files are and I will move them?

Thanks — Giuliano
