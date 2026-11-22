# Deploying Phiace (Phiora + the apps)

Everything runs on one host behind one origin: **Postgres** (the store), **Phiora** (the one API and
database), and **nginx** serving every app with `/api` proxied to Phiora (no CORS).

## 1. Configure
```sh
cd app
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

## 7. Calls (optional)
A room's call is kept by Phiogy's line, a Rust program (`phikit/crates/appkit/app/phiogy`), with Phiora in front
of it; without it Phiora keeps the rooms itself.
```sh
# on the machine with the source, in phikit: send the crates the line builds from
bash crates/appkit/app/phiogy/script/ship.sh ubuntu@<host> <key file>
# on the server
cd ~/gemphi/phikit && sudo docker build -f crates/appkit/app/phiogy/Dockerfile -t phiogy-line .
cd ~/gemphi/puikit/app
echo "PHI_CALL_KEY=$(openssl rand -hex 32)" >> .env; echo "PHI_CALL_LINE=http://127.0.0.1:4310" >> .env
sudo docker compose up -d --build phiora && sudo docker compose up -d phiogy
```
The line shares Phiora's network, so start it again whenever Phiora is recreated (`up -d --force-recreate phiogy`).
For callers on different networks, a relay: `sudo apt-get install coturn`, then
`bash ../deploy/relay/setup.sh <domain> ~/gemphi/puikit/app/.env` (writes `PHI_CALL_ICE`), restart both services, and
let UDP 3478, TCP 3478 and UDP 49152-49407 in through the host's firewall.

## 8. A config app (Phiogy)
An app with no package of its own is the one app (`app/phi`) under its key; `build-all.mjs` does not build it yet,
so it is built where the source is and sent. In Git Bash keep the three paths from being rewritten:
```sh
cd app/phi
MSYS2_ENV_CONV_EXCL='PHI_BASE;VITE_PHI_API;VITE_PHI_APPS_BASE' PHI_BASE=/phiogy/ VITE_PHI_API=/api VITE_PHI_APPS_BASE=/ \
  npx vite build --outDir <out>/phiogy --emptyOutDir
cp -r ../phiogy/public/. <out>/phiogy/
```
Send `<out>/phiogy` to the server's `app/dist-all/phiogy` (world-readable) and `app/phiogy/public` to the same place
in the server's source, then `docker compose up -d --build phiora`, `up -d --force-recreate phiogy`, and
`docker compose exec phiora npm run seed`. The first time, run `build-all.mjs` or add the app's `location` row to
`dist-all/nginx.conf`, and restart `web` (a single mounted file is not seen again after it is replaced).

## Still worth doing before heavy traffic
- Phiegg bundle diet (lazy-load kinds from `/tree`) — the big front-end optimisation.
- A real chat model: set `PHI_MODEL_PROVIDER/MODEL/KEY/URL` (the apps' Talk falls back to a scripted
  reply until then).
- Wallet is real money movement inside the system (coins/pledges); before taking **external** payment,
  add a payment provider — nothing here charges a card.
