# Deploying Phiace (Phiora + the apps)

Everything runs on one host behind one origin: **Postgres** (the store), **Phiora** (the one API and
database), and **nginx** serving every app with `/api` proxied to Phiora (no CORS).

## 1. Configure
```sh
cd apps
cp .env.example .env
# fill in PHI_PG_PASSWORD, PHI_DELEGATION_SECRET (openssl rand -hex 32), PHI_ORIGINS, PHI_PUBLIC_URL,
# PHI_EDITORS, and (for email) RESEND_API_KEY / PHI_MAIL_FROM.
```

## 2. Build the apps
```sh
node build-all.mjs            # builds every app with source here into dist-all/, writes dist-all/nginx.conf
```
Each app is built with `base=/<key>/`, `VITE_PHI_API=/api`, `VITE_PHI_APPS_BASE=/`, so links resolve on
the one origin. (Prebuilt apps already in `dist-all/` — e.g. phipad — are kept and served too.)

## 3. Bring it up
```sh
docker compose up -d --build
docker compose exec phiora npm run seed   # FIRST START ONLY — loads app data + kind declarations
```
Open `http://<host>:${PHI_PORT}/` → it 302s to the first app. Put TLS (a host proxy or load balancer)
in front of nginx; the auth cookie is `Secure` in production, so it needs HTTPS.

## 4. What production mode changes (vs the dev stack)
- `PHI_DEMO_LOGIN=0`: the one-tap demo sign-in is OFF. People sign in / register with email + password.
- `PHI_SECURE_COOKIES=1`: the session cookie is `Secure` (HTTPS only), scoped to `PHI_ORIGINS`.
- `PHI_CREATE_KINDS`: only those kinds are open to signed-in users (default `comment,order` — comments
  and backing rounds). Editors (`PHI_EDITORS`) may create anything. Unset = all kinds open.
- Seeding uses `onlyMissing` in production: it loads only when the database is empty, and never touches
  records created/edited/deleted through the API.

## 5. Demo / seed content
The bundled data (worlds, clubs, looks, and the demo rounds/pools) seeds a populated catalogue. For a
clean launch, either keep it as the starter catalogue, or seed an empty DB and author your own via the
apps. The seeded demo **users** (Noor, etc.) exist only for `PHI_DEMO_LOGIN=1`; with demo login off they
cannot be signed into. To start empty, bring up db + phiora without running `npm run seed`.

## 6. Operate
- Backup:  `docker compose exec db pg_dump -U phi phiora > backup.sql`
- Restore: `docker compose exec -T db psql -U phi phiora < backup.sql`
- Logs:    `docker compose logs -f phiora`
- Health:  `curl https://<host>/api/health`

## Still worth doing before heavy traffic
- Phiegg bundle diet (lazy-load kinds from `/tree`) — the big front-end optimisation.
- A real chat model: set `PHI_MODEL_PROVIDER/MODEL/KEY/URL` (the apps' Talk falls back to a scripted
  reply until then).
- Wallet is real money movement inside the system (coins/pledges); before taking **external** payment,
  add a payment provider — nothing here charges a card.
