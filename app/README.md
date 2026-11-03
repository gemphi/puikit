# Phient UI Applications (`app/`)

Applications and workbenches for Phient UI (`@pui/components`), structured according to the Palantir Blueprint standard (`*-app` / workbench convention).

---

## One app, many configs

`phi` is the one running app. Every config app is served by it at `/<key>/` (`http://localhost:3100/phiora/`), and the Apps switcher moves between them without changing server. An app is its config: `<key>/public/data/<key>.json`. Set `"config": true` on its entry in `phi-kit/src/registry.json` to run it there.

A module has a singular name and lives once in `phi-kit/src/module`. An app turns one on by naming it in its config, e.g. `{ "kind": "feed", "pull": { "kind": "shot" } }`, and never keeps its own copy. Code that only one app needs still lands in core, or that app contributes it with `registerModule`.

Apps with their own code (`phiegg`, `phione`, `phipad`, `phidao`) still run on their own ports until they move onto the host.

---

## Application Directory

| Application | Port | Description |
|:---|:---|:---|
| [`pui-book`](./pui-book) | `3001` | **Component Documentation & Live Playground (`puikit.com`)**: Interactive workbench with real-time props inspector, token switcher, and live code examples (replaces legacy Storybook). |
| [`demo-app`](./demo-app) | `3002` | **Enterprise Operations Showcase**: Full operational cockpit featuring agent swarms, ontology Topos trees, dense data tables, and metrics telemetry. |
| [`uaia`](./uaia) | `3005` | **UAIA (`uaiagency.org`)**: Unified Artificial Intelligence Agency — 16-page regulatory-body site on the `uaia` brand theme. |
| [`phiegg`](./phiegg) | `3101` | **Phiegg**: feed, explore, worlds, SS26 shows, series & films, hosts & nests, agents, quests/coins/pools, League, events, Phipad, Laura's Spark shop. Apple theme by default, puikit-only markup; every card is a three-layer `DepthMedia` (scene → look → photo). Replaces the `phiegg-v2` draft. |
| [`phiegg-v1`](./phiegg-v1) | `3101` | **Phiegg v1**: the earlier social app (feed, clubs, Laura's Spark shop). Shares port 3101 with `phiegg` — run one at a time. |
| [`phipad`](./phipad) | `3102` | **Phipad**: the Phiegg accelerator — funding tracks and the application pipeline by stage. Organic theme, phi-kit shell. |
| [`phient`](./phient) | `3103` | **Phient**: Your digital human across Phiace. Organic theme, phi-kit shell. |
| [`phihub`](./phihub) | `3104` | **Phihub**: The code home of Phiace. Organic theme, phi-kit shell. |
| [`phiace`](./phiace) | `3105` | **Phiace**: Personal assistants and personas. Organic theme, phi-kit shell. |
| [`phiora`](./phiora) | `3106` | **Phiora**: The first ECS database. Organic theme, phi-kit shell. |
| [`phiano`](./phiano) | `3107` | **Phiano**: The phase large language model. Organic theme, phi-kit shell. |
| [`phinet`](./phinet) | `3108` | **Phinet**: Train and fine-tune. Organic theme, phi-kit shell. |
| [`phiber`](./phiber) | `3109` | **Phiber**: The 4D spatial platform. Organic theme, phi-kit shell. |
| [`phinux`](./phinux) | `3110` | **Phinux**: Open-source trading. Organic theme, phi-kit shell. |
| [`phiret`](./phiret) | `3111` | **Phiret**: The real estate council. Organic theme, phi-kit shell. |
| [`phidao`](./phidao) | `3112` | **Phidao**: The members platform. Organic theme, phi-kit shell. |
| [`phisum`](./phisum) | `3113` | **Phisum**: The fund and the $UM token. Organic theme, phi-kit shell. |
| [`phione`](./phione) | `3115` | **Phione** (formerly the Phiegg cockpit): console of the Phient platform — core ontology, platform agents and their verbs, workforce, API docs. Reads the Python Phient API (`VITE_PHIADK_API`, gemphi/phient `phiadk.phiapi`, port 8000); sample data without it. |
| [`phiora-server`](./phiora-server) | `4300` | **Phiora API**: app content, per-user state, server-owned wallet, shop orders priced from data, persona chat via a model. Zero dependencies — `npm start`. |
| [`phi-kit`](./phi-kit) | — | **Shared Phiace shell** (rail, section menu, right-bar, content blocks, wallet). Imported via `@phi-kit`; not run on its own. |
| [`landing-app`](./landing-app) | `3003` | **Design System Landing Page**: Showcase and overview of Phient UI's design philosophy, Palantir Blueprint parity, and theming capabilities. |

---

## Running Applications

### Everything at once

```bash
cd app
node dev-all.mjs              # Phiora API on :4300 + every built app in phi-kit/src/registry.json
node dev-all.mjs --install    # npm install first where node_modules is missing
node dev-all.mjs --phiadk     # + the Python Phient API on :8000 (gemphi/phient; pip install fastapi uvicorn pydantic)
node dev-all.mjs phiegg phione --phiadk   # only some apps
```

Every app gets `VITE_PHI_API=http://localhost:4300` (one session = one identity across apps); with `--phiadk` also `VITE_PHIADK_API=http://localhost:8000`.

From the repo root the same commands are npm scripts:

```bash
npm run dev:all            # Phiora API on :4300 + every linked app (dev servers, hot reload)
npm run dev:all:offline    # every app, no API (each keeps its data on the device)
npm run build:all          # build every linked app (app/build-all.mjs); add -- --install for missing node_modules
npm run serve:all          # build, then serve every app on its port + Phiora (vite preview)
npm run api                # the Phiora API alone (:4300)
npm run data:phiegg        # rebuild the Phiegg data (worlds, rides, jewels, stories, renders, scenes)
```

| App | URL |
|:---|:---|
| Phiegg | http://localhost:3101/ (public home page at `#welcome`, rides at `#rides`) |
| Phipad | http://localhost:3102/ |
| Phient | http://localhost:3103/ |
| Phihub | http://localhost:3104/ |
| Phiace | http://localhost:3105/ |
| Phiora | http://localhost:3106/ |
| Phiano | http://localhost:3107/ |
| Phinet | http://localhost:3108/ |
| Phiber | http://localhost:3109/ |
| Phinux | http://localhost:3110/ |
| Phiret | http://localhost:3111/ |
| Phidao | http://localhost:3112/ |
| Phisum | http://localhost:3113/ |
| Phidata | http://localhost:3114/ |
| Phione | http://localhost:3115/ |
| Phiora API | http://localhost:4300/health |

### One app

```bash
# 1. Run the Component Documentation & Workbench (puikit.com)
cd app/pui-book
npm install
npm run dev

# 2. Run the Enterprise Operations Showcase
cd ../demo-app
npm install
npm run dev

# 3. Run the Landing Showcase
cd ../landing-app
npm install
npm run dev
```

## Phiace apps (Organic theme)

Every `phi*` app is a full 8-page app: **Home, News, About, FAQ** plus its domain pages, all ending with You + Settings. `phiegg`, `phipad` and `phidao` are bespoke (their own `src/pages`); the rest render from `public/data/<key>.json` (nav + views + blocks) through `phi-kit`'s `PhiApp`. Block kinds: hero, news, prose, faq, chat, grid, table, terminal, swap, stats.


Every `phi*` app is a thin Vite wrapper around `phi-kit` plus one data file:

```bash
cd app/phient && npm install && npm run dev   # http://localhost:3103
```

- Theme: `themeStyle="organic"`, brand `phiegg` — see `src/tokens/_organic.scss`.
- Content: `public/data/<key>.json` (nav + views + blocks). Point `VITE_PHI_API` at Phiora to serve it live.
- Cross-app links: `VITE_PHI_APPS_BASE=https://phiace.com/` in production; localhost ports in dev.
- `phiegg` is the worlds hub (Phipad is a section inside it); the earlier social app is `app/phiegg-v1`.
- Backend: `@phi-kit/api` is the Phiora client (`/apps/<key>`, `/state/<name>`, `/chat`). Without `VITE_PHI_API` everything falls back to localStorage. Run the real server with `cd app/phiora-server && npm start` (port 4300) and start any app with `VITE_PHI_API=http://localhost:4300`. `app/phi-kit/dev/mock-phiora.mjs` is the older throwaway mock.

## Themes

Every app boots with the **Apple** theme (`@phi-kit/mount` → `@phi-kit/looks`). Users switch to **SpaceX** or **Organic** in Settings (data-driven apps) or the Phiegg header.
A one-time migration (`phi-look-version`) drops stored style/brand choices from before the change so the new default shows.

## Agents on the Phient platform

Set `VITE_PHIADK_API` (or run `node dev-all.mjs --phiadk`) and these apps get a working Platform view (the `agent` block in `public/data/<key>.json`, `phi-kit/src/blocks/Agent.tsx`):

| App | Agent |
|:---|:---|
| Phihub | PhiGit |
| Phiora | PhiOra |
| Phiano | PhiLLM |
| Phinet | PhiCal |
| Phiace | PhiRAG, PhiMen |
| Phient | PhiBot, PhiBrd |
| Phione | Every agent: its Agents console is the same block; PhiOne, PhiBus, PhiLog and PhiGov also have their own pages |

A block is `{ "kind": "agent", "agent": "phigit", "intro": "…", "presets": [{ "verb": "log", "label": "Log", "params": { … } }] }`. With Phiora on, each run carries the signed-in user's delegation (`Authorization: Bearer`).

Verbs that change the platform (a commit, a record write, a playbook) need a signed-in Phiora account: the block marks them with " ·", says who they run as, and shows Phient's reason when a guest is refused. Each run shows who ran it, and Phione's Audit trail lists every change.

