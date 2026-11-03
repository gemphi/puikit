# Phiora server (`app/phiora-server`, port 4300)

The one API and the one database behind every Phiace product system — the contract the client side already speaks
(`app/phi-kit/src/api.ts`). All records live in Phiora's `items` table (md5 ids, slugs, a change log) and every
system reads and writes them through this API; the data files only seed the database.
Storage: **Postgres in production** (set `DATABASE_URL`, or `PHI_PG_URL`; needs `npm install` for the `pg` driver),
SQLite through the built-in `node:sqlite` locally, or JSON files as the last fallback.

```bash
cd app/phiora-server
npm start                      # http://localhost:4300
npm run seed                   # load the data files into the database (dev starts do this when files changed)
npm test                       # 57 tests; PHI_TEST_PG_URL=postgres://… runs them against a real Postgres too
```

Then run any app against it:

```bash
# PowerShell
$env:VITE_PHI_API="http://localhost:4300"; npm run dev
# bash
VITE_PHI_API=http://localhost:4300 npm run dev
```

## Names

The API uses singular names: `/app/<key>`, `/item/theme`, `/item/<id>/theme`, `/auth/session`, `/auth/session/revoke`, `/auth/demo-user`. The plural spellings of earlier releases (`/apps/`, `/items/`, `/auth/sessions`, `/auth/demo-users`) still answer and map to the singular routes.

## What it does

| Route | |
|---|---|
| `GET /health` | status, priced looks, model provider |
| `GET /app` | the apps in the database: `{ apps: [{ key, name, slug }] }` |
| `GET /app/<key>` | an app's menus and pages, composed from its `app`, `menu`, `page` and `block` records (src/apps.mjs); the file `app/<key>/public/data/<key>.json` only seeds them and answers when the database has no such app. Edit a record (`PATCH /tree/item/menu/<id>`) and the app shows it on its next load |
| `GET /me` | every visitor gets a guest user + `phi_sid` HttpOnly cookie |
| `POST /auth/register {handle,name,password,email?}` | an email is optional; when given it gets a confirm link |
| `POST /auth/signin {handle,password}` · `POST /auth/logout` | `handle` may also be the email; 8 wrong tries / 10 min → 429; sign out starts a new guest |
| `POST /auth/email {email}` · `POST /auth/verify {token}` | add or change the email (signed in); confirm it with the token from the link (24 h, once) |
| `POST /auth/forgot {login}` · `POST /auth/reset {token,password}` | always answers `ok` (no account probing); mails a 30-minute link when the account has an email; reset signs out every other browser and signs this one in |
| `POST /auth/password {current,password}` | change password (signed in); other browsers are signed out |
| `GET /auth/session` · `POST /auth/session/revoke {id \| others:true}` | the browsers signed in to this account (browser + OS, created, last seen; never the cookie) — sign one or all others out |
| `GET /me/export` · `POST /auth/delete {password,confirm}` | download everything kept about you (no password hash); delete the account (`confirm` = your handle) — handle and email become free again |
| `GET /auth/demo-user` · `POST /auth/demo {userId}` | demo sign-in as a seeded member, no password (`PHI_DEMO_LOGIN=0` turns it off) |
| `GET/PUT /state/<name>` | per-user documents (follows, cartOffers, votes, rsvp, flags, chats, me, …) |
| `GET /state/wallet\|history\|owned` | read-only — **the server owns money** (`PUT` → 403 `server_owned`) |
| `POST /wallet/swap {amt,from,to}` · `/wallet/spend {coin,amt,what}` · `/wallet/earn {coin,amt,what}` | same rates and 0.3 % fee as `wallet.ts`; overdrafts refused; `earn` capped at 50k USD per user (demo top-up) |
| `POST /shop/buy {lookIds}` | prices come from `app/phiegg/src/data/ls.json` + `stores.json`, never from the client; one USD spend; records `owned`, clears those looks from the cart |
| `POST /shop/offer {lookId,usd}` | at/above floor → paid and owned now; below → pending |
| `POST /shop/sell {lookId}` | sell an owned look back at floor |
| `GET /tree` · `GET /tree?kind=a,b` · `GET /tree/info` | every record of every kind (or only those kinds), public, plus Phiora's live records (designer themes): `{ at, loadedAt, live, sources: [{ kind, rows, live? }] }`; the counts. Clients build the items model and the relations index with phi-kit (`kinds.ts`, `relations.ts`) |
| `GET /tree/item/<kind>/<id>` | one record with where it came from (files or the API), whether it was edited, its owner, whether **you** may change it, and its last 20 changes |
| `POST /tree/item {kind,fields}` | create a record (signed in; you own it). The id is made for you: md5, always; the `slug` comes from the name |
| `PATCH /tree/item/<kind>/<id> {set?,unset?}` · `DELETE …` | change or delete a record: its owner, the person it is or names (founder, owner, creator, author, user, holder), or an editor (`PHI_EDITORS`). Guests never. The id never changes; 32 KB per record; 30 changes a minute per user |
| `GET /tree/change?kind=&id=&n=` | the change log, newest first: action, fields, who (id and handle), when |
| `POST /chat {app,persona,messages}` | persona reply from a model (30/min per user); canned reply when none is configured |

Every money route answers with `{ wallet, history, owned, cartOffers? }`; the client applies that answer (`settle()` in `wallet.ts`).

## Configuration

| Env | Default | |
|---|---|---|
| `PORT` | `4300` | |
| `PHI_DATA_DIR` | `app/phiora-server/.data` | `phiora.db` (or the JSON files) + dev `outbox.jsonl` (git-ignored) |
| `PHI_STORE` | auto | `postgres` (default when `DATABASE_URL` is set), `sqlite` (default otherwise) or `json`. Starting on sqlite with an old JSON data dir imports it once |
| `PHI_PUBLIC_URL` | `http://localhost:3101` | where email links land when the request has no allowed Origin (links go to `/?phi_verify=…` / `/?phi_reset=…`) |
| `RESEND_API_KEY` · `PHI_MAIL_FROM` | — | send account email through Resend |
| `PHI_MAIL_WEBHOOK` · `PHI_MAIL_KEY` | — | or POST `{from,to,subject,text}` to your own relay (bearer key) |
| `PHI_ENV` | — | `production` turns off dev links (see below) and warns at start about a missing mail transport, `PHI_ORIGINS` or `PHI_SECURE_COOKIES` |
| `PHI_SESSION_IDLE_DAYS` | `30` | a session unused this long is signed out; unreachable guest data is swept (SQLite) every 6 h |
| `PHI_ORIGINS` | any `http://localhost:*` | comma list of allowed browser origins in production, e.g. `https://phiace.com` |
| `PHI_SECURE_COOKIES` | off | `1` → `SameSite=None; Secure` (HTTPS, API on another site) |
| `PHI_DEMO_LOGIN` | on | `0` disables `/auth/login` |
| `DATABASE_URL` / `PHI_PG_URL` | — | the Postgres connection string; set → Postgres is the store (production) |
| `PHI_ITEMS_DIR` | `app/phiegg/src/data` | the one data folder that seeds the database (a `tree.json` manifest naming where each kind sits in its files) |
| `PHI_SEED` | on | `0`: do not load data files into the items database on start |
| `PHI_EDITORS` | — | ids or handles who may change any record (`*`: anyone signed in), besides each record's owner |
| `PHI_CREATE_KINDS` | all kinds | comma list of kinds anyone signed in may create; other kinds then need an editor (403 `kind_closed`) |
| `PHI_SHOP_DATA` | `app/phiegg/src/data` | where looks are priced from |
| `PHI_MODEL_PROVIDER` | `openai` (or `anthropic` when only `ANTHROPIC_API_KEY` is set) | |
| `PHI_MODEL_URL` | — | OpenAI-compatible base, e.g. `http://localhost:11434/v1` (Ollama) |
| `PHI_MODEL` | `llama3.1` | model name / Anthropic model id |
| `PHI_MODEL_KEY` · `ANTHROPIC_API_KEY` | — | kept on the server only |

## Email in development

With no mail transport configured, mails go to `.data/outbox.jsonl` and the console, and — only for requests from this machine
and only when `PHI_ENV` isn't `production` — the API answer carries `devLink`, which the account dialog shows as a button.
Set `RESEND_API_KEY` or `PHI_MAIL_WEBHOOK` (and `PHI_ENV=production`) before real users.

## Storage

`src/store.mjs` has one interface with two backends. SQLite keeps users as JSON documents plus indexed tables for sessions,
handles, emails and one-time tokens (stored as SHA-256 hashes, expiring on their own); WAL mode, transactions for token use and email moves.
Back up by copying `phiora.db` while the server is stopped (or `sqlite3 phiora.db ".backup b.db"` while it runs).

## Deploy

```bash
cd puikit/app && docker build -f phiora-server/Dockerfile -t phiora .
docker run -p 4300:4300 -v phiora-data:/data \
  -e PHI_ORIGINS=https://phiace.com -e PHI_SECURE_COOKIES=1 -e PHI_PUBLIC_URL=https://phiace.com \
  -e RESEND_API_KEY=re_… -e PHI_MAIL_FROM='Phiace <hi@phiace.com>' -e ANTHROPIC_API_KEY=… phiora
```

The image holds only the server and the JSON it reads (`Dockerfile.dockerignore`); the database lives on the `/data` volume.
Put it behind HTTPS (the cookie is `SameSite=None; Secure` with `PHI_SECURE_COOKIES=1`), then build the apps with `VITE_PHI_API=https://api.phiace.com`.

## Not production yet

- A guest who clears cookies before registering starts again with a fresh demo wallet.
- Accounts without an email can't reset their password — prompt users to add one (the Phiegg account dialog does).
- One process owns the database; for several servers move to a shared database (Postgres) behind the same `store.mjs` interface.

## Activity and designer themes

- `POST /activity` `{ events: [{ kind, ref, at?, refKind?, with?, usd?, note? }] }`: 1 to 100 events; unknown kinds are refused. Stored in the user's
  server-owned `activity` document (newest first, 1,000 kept; `PUT /state/activity` is 403). `GET /activity?ref=<id>` reads them back.
- `GET /item/theme`: every designer-supplied theme `{ [lookId]: { kinds, mood, story, by, at } }`, public.
- `PUT /item/<lookId>/theme` `{ kinds, mood?, story? }`: only the look's designer (`specs.provenance.designerId` in the shop data, the house
  founder) or a user listed in `PHI_DESIGNERS` (comma ids, `*` for everyone in dev). Up to 12 kinds of 32 characters.

## Delegation (Phient, Phione)

Phiora vouches for the signed-in user to another service with a short-lived HS256 JWT.

- `POST /auth/delegation` `{ audience: "phient" }`: `{ token, claims, expiresAt, ephemeral }`. Claims: `iss` (phiora), `aud`, `sub` (user id), `name`, `handle`, `email`, `email_verified`, `guest`, `sid` (public session handle), `iat`, `exp`.
- `POST /auth/delegation/verify` `{ token, audience? }`: `{ ok, claims }` or 401 with `malformed`, `signature`, `expired`, `issuer` or `audience`. No session needed, for services.
- `PHI_DELEGATION_SECRET` (16+ characters) is the shared key. Without it a random key is made per process (`ephemeral: true`), so tokens end with a restart and only Phiora can check them. `PHI_DELEGATION_AUDIENCES` (default `phient,phione`), `PHI_DELEGATION_MINUTES` (1 to 60, default 10).
- Phient checks the token in `phiadk/phiapi/delegation.py`: locally with the same secret, or by asking Phiora (`PHIORA_URL`).

## The one database

Three data tables, exactly the KINDS / ITEMS / PROPS shape: `items` is the one records table and `kind` is a
column on it, not a table of its own; the props are the record itself — the `doc` JSONB column — so there is no
item_props join table and `SELECT doc->>'title' FROM items WHERE kind='proposal'` is how props read in SQL.
Relations are props and nothing else: a reference is a field ending `Id`/`Ids` inside `doc`, never a link table.
`item_meta` (one row of counts and the seed fingerprint) and `item_changes` (the audit log) complete the data
side. Every other table — `users`, `sessions`, `handles`, `emails`, `tokens`, `globals` — is the account system
(sign-in, state, wallet), not the data model.

Every record of every kind lives once in the `items` table: `kind, id, slug, ord, doc, origin, edited, deleted,
owner, updated_at, updated_by`. Ids are **md5** (stable: md5 of `kind:originalId` at seed time, md5 of a fresh UUID
for records created through the API), every record has a **slug** — the full name with underscores (`maison_opal`,
`pearl_quay`) — and every reference field (`founderId`, `worldIds`, nested `members[].userId`, …) carries the md5 id
of the record it points at, so the whole graph resolves inside the database. `item_meta` keeps the counts and the
seed fingerprint; `item_changes` keeps every create, edit and delete with who and when. Accounts sign in under the
same md5 ids, so a person owns the records that name them.

**The database is the source; the data files only seed it** (`app/phiegg/src/data` by its `tree.json`). Seeding
replaces only rows that came from the files and were never touched: records created, edited or deleted through the
API stay (a deleted file record stays as a tombstone). Development starts reseed when the files changed; in
production (`PHI_ENV=production`) only an empty database is seeded, and `npm run seed` brings file changes in on
purpose — back up first. 20,768 records in 37 kinds load in about a second on Postgres.

## Deploy (docker compose)

One origin, three services — Postgres (the database), Phiora (the API) and nginx serving every built app, with
`/api` proxied to Phiora so there is no CORS:

```bash
cd puikit/app
node build-all.mjs --dist        # builds every app under /<key>/ with VITE_PHI_API=/api → dist-all/ + nginx.conf
PHI_PG_PASSWORD=… PHI_DELEGATION_SECRET=… docker compose up -d
docker compose exec phiora npm run seed    # first start: put the data into the database
```

Apps at `http://localhost:8080/phiegg/` (and `/phipad/`, `/phidao/`, …); `/` redirects to the first app;
`http://localhost:8080/api/health` is Phiora. Demo sign-in is off in compose (`PHI_DEMO_LOGIN=0`); set
`PHI_EDITORS`, `PHI_CREATE_KINDS`, `PHI_PUBLIC_URL`, mail and cookie settings through the environment
(`docker-compose.yml` passes them through). Postgres data lives in the `pgdata` volume; back it up with
`docker compose exec db pg_dump -U phi phiora`.



## The old apps in the one database

`npm run extract:oldapps` traverses `gemphi/old-apps-js` (the original JS apps): every `config/schema.json` becomes a
kind declaration (fields with their controls: form, values, filterable, searchable) and every mock dataset (TS literals,
article JSONs) becomes records, written to `Claude outputs/old-apps-bundle.json`. `npm run feed:oldapps` (with
DATABASE_URL set) feeds the bundle into Phiora: md5 ids (`md5(kind:srcId)`), slug = the full name with underscores,
origin `oldapps`; the declarations land as records of kind `kindSpec`, so surfaces can render controls from the
database (GET /tree?kind=kindSpec). Kind names: entities keep their Gem/Phi prefix (gemLaunch, phiFeed), everything
else is prefixed by its app (gembarSong, phihubShow), so nothing collides with the Phiegg kinds. The feed writes
direct SQL and no item_changes rows, so the apps' live overlay window is untouched; re-running updates in place.
Record references (userId and friends) keep their source form; each record carries `srcId`.
