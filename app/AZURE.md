# Deploying puikit to Azure (db + apps on one machine, Docker)

The whole platform — Postgres, Phiora (Node, and/or the FastAPI Phiora from the **phiadk** repo), nginx with every app —
runs from the one `docker-compose.yml`, so the Azure shape that matches "database and app on the
same machine" is a **single Azure VM running Docker Compose**. Simple, cheap, one box to back up.

## The container shape

One box, one concern per container: **web** (nginx with every puikit app — the websites clients
expect), **phiadk** (the platform: ontology + agents, with Phiora the FastAPI data engine answering /api, and phient — its agent runtime — joining on :4500),
**db** (Postgres), and — as they land — **phinet** (models) and **phiace** (3D / simulation /
spatial). The legacy Node `phiora` container stays only until the Python port retires it.

## 1. The VM
- Create an Ubuntu 24.04 VM (Standard **B2s** to start; B2ms if the apps get traffic), open ports
  **22, 80, 443** in its network security group, attach a **Standard SSD**.
- `az vm create -g phiace -n phiace-1 --image Ubuntu2404 --size Standard_B2s --admin-username phi --generate-ssh-keys`
- Install Docker: `curl -fsSL https://get.docker.com | sh && sudo usermod -aG docker $USER` (re-login).

## 2. The code + config
```sh
git clone https://github.com/gemphi/puikit.git
git clone https://github.com/gemphi/phiadk.git   # the platform (phiadk/phiora is the FastAPI Phiora) — needed for --backend python
cd puikit/apps
cp .env.example .env   # fill: PHI_PG_PASSWORD, PHI_DELEGATION_SECRET (openssl rand -hex 32),
                       # PHI_ORIGINS=https://your.domain, PHI_PUBLIC_URL, PHI_EDITORS, mail keys
node build-all.mjs                     # Node backend answers /api/   (today's default)
# node build-all.mjs --backend python  # the FastAPI Phiora (phiadk/phiora) answers /api/ instead
```
(Install Node 22 on the VM for the build, or build dist-all in CI and copy it up.)

## 3. Up
```sh
docker compose up -d --build
docker compose exec phiora npm run seed    # first start only
curl localhost:8080/api/health
```

## 4. TLS + domain
Point your DNS A-record at the VM's public IP, then terminate TLS in front of nginx. Easiest:
run [Caddy](https://caddyserver.com) on the host as the 443 front door reverse-proxying to :8080
(`your.domain { reverse_proxy localhost:8080 }`) — automatic Let's Encrypt. Keep
`PHI_SECURE_COOKIES=1` (the compose default) so the session cookie is HTTPS-only.

## 5. Operate
- Backup (nightly cron): `docker compose exec db pg_dump -U phi phiora | gzip > /backup/phiora-$(date +%F).sql.gz`
- Update: `git pull && node build-all.mjs && docker compose up -d --build`
- Logs: `docker compose logs -f phiora phiadk web`

## Scaling later
When one box stops being enough, the same compose splits cleanly: move `db` to **Azure Database
for PostgreSQL Flexible Server** (set `DATABASE_URL`), and run the services on **Azure Container
Apps** or keep the VM for the stateless tier. Nothing in the apps changes — they only know `/api`.
