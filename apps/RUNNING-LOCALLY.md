# Running every app locally (and testing the cross-app linking)

You need **Node ≥ 22.5** (Phiora uses the built-in `node:sqlite` for a zero-setup local store) and the
repo checked out. No Postgres and no Docker are required for local testing.

Everything runs from the `apps/` folder:
```sh
cd puikit/apps
```

---

## Option A — one command (recommended)

```sh
node dev-all.mjs
```
This starts **Phiora** on `http://localhost:4300` (local sqlite store under `apps/phiora-server/.data`,
auto-seeded with the bundled data) and **every app's dev server** on its own port, each already pointed
at Phiora (`VITE_PHI_API=http://localhost:4300`). The first run installs each app's dependencies, so it
takes a minute; after that it's instant. **Ctrl+C stops everything.**

Then open **http://localhost:3101/** (phiegg) and use the **Apps** button in the left rail to jump
between apps — each link opens that app on its own port, so with `dev-all` running, the whole switcher
works. Run only some apps: `node dev-all.mjs phisum phipal`.

Ports (from `phi-kit/src/registry.json`):

| app | url | | app | url |
|---|---|---|---|---|
| phiegg | http://localhost:3101 | | phiace | http://localhost:3105 |
| phient | http://localhost:3103 | | phinet | http://localhost:3108 |
| phihub | http://localhost:3104 | | phisum | http://localhost:3113 |
| | | | phipal | http://localhost:3116 |

---

## Option B — one terminal per app (manual)

1. **Phiora** (the API + database) — one terminal:
   ```sh
   cd apps/phiora-server
   npm install
   npm start            # http://localhost:4300, sqlite store, auto-seeds
   ```
2. **Each app** — one terminal each, pointed at Phiora. Vite already knows each app's port.
   - macOS / Linux: `cd apps/phisum && npm install && VITE_PHI_API=http://localhost:4300 npm run dev`
   - Windows **PowerShell**: `cd apps\phisum; npm install; $env:VITE_PHI_API="http://localhost:4300"; npm run dev`
   - Windows **cmd**: `cd apps\phisum && npm install && set VITE_PHI_API=http://localhost:4300 && npm run dev`

   Prefer not to set the variable every time? Create `apps/<key>/.env.local` with one line —
   `VITE_PHI_API=http://localhost:4300` — and just run `npm run dev`. (Leave `VITE_PHI_APPS_BASE`
   **unset** in dev so cross-app links resolve to `http://localhost:<port>/`.)

---

## Signing in and what to test

- **Sign in**: in dev, one-tap demo sign-in is on — click **Sign in** and pick a demo member (e.g.
  Noor Hale), or register a real account. (Signed-in state is a cookie Phiora sets; localhost origins
  are allowed automatically, so it "just works" across the different ports.)
- **Linking to test**:
  - The **Apps** switcher (left rail) → hops to each app on its port.
  - **Welcome** landing (every app opens here) → its feature buttons jump into that app's sections.
  - Click any **record** (a round, a pool, an item) → the **bottom sheet** opens; expand it to get the
    movable/resizable panes; **Linked** cards open the records they point at; **Variants** shows siblings.
  - In **phisum**: open a round → **Back this round** (enter an amount) → the wallet drops and the
    round's **Raised** goes up; **Comment** slides in the comments; the **You** sidebar lists your
    pools/rounds/orders and each opens its sheet.
  - Cross-app token/links (e.g. "manage in Phione", "open in Phiegg") open the other app's port.

---

## Testing it exactly like production (one origin)

To exercise the same one-origin setup the live site uses (all apps under `/<key>/`, `/api` proxied,
no per-port links), build once and serve behind nginx:
```sh
node build-all.mjs          # builds every app into dist-all/ + writes dist-all/nginx.conf
docker compose up -d --build
docker compose exec phiora npm run seed    # first start only
# open http://localhost:8080/
```
See **DEPLOY.md** for the full production path and the `.env` it needs.

---

## Troubleshooting

- **A switcher link opens a dead page** → that app isn't running. Start it (or use `dev-all`).
- **"Not signed in" / data not loading** → make sure Phiora is up (`curl http://localhost:4300/health`)
  and the app was started with `VITE_PHI_API=http://localhost:4300`. Without it, apps run offline on
  localStorage only.
- **Port already in use** → stop whatever holds it, or run fewer apps (`node dev-all.mjs phiegg phisum`).
- **Reset the local data** → stop Phiora, delete `apps/phiora-server/.data`, start again (it re-seeds).
- **Use Postgres instead of the file store** → start Phiora with `DATABASE_URL=postgres://…` (then
  `npm run seed` once).
- **Node too old for sqlite** → either upgrade to Node ≥ 22.5, or run Phiora with `PHI_STORE=json`.
