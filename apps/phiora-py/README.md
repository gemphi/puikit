# Phiora (Python) — the FastAPI data backend

The `/api/kind/{...}` data plane for puikit, over the **same Postgres tables** as the Node
`phiora-server` (items, users, sessions, globals, item_changes) — so the two run side by side and
nginx decides which one answers `/api/` while the port completes.

Covered: kinds · rows (n/sort/dir/where/join) · record CRUD with ownership + PHI_CREATE_KINDS ·
mine · app composition (/app/{key}) · demo auth + sessions (phi_sid cookie, shared with Node) ·
**backing settlement** (an order naming a round spends the pledge from the wallet and raises the
round). Compatibility aliases serve today's clients: /tree/rows, /tree/item, /tree/mine.

Still on the Node server until ported: register/login/password + email, wallet swap/earn, /shop,
/chat (model proxy), delegation, /state docs, /activity, theme editing, seeding (`npm run seed`).

Run locally (against the compose db or any Postgres the Node server seeded):
    pip install -r requirements.txt
    DATABASE_URL=postgres://phi:...@localhost:5432/phiora uvicorn main:app --port 4400
