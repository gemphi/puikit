# Phiora (Python) — the FastAPI data backend

The `/api/kind/{...}` data plane for puikit, over the **same Postgres tables** as the Node
`phiora-server` (items, users, sessions, globals, item_changes) — so the two run side by side and
nginx decides which one answers `/api/` while the port completes.

Covered: kinds · rows (n/sort/dir/where/join) · record CRUD with ownership + PHI_CREATE_KINDS ·
mine · app composition (/app/{key}) · demo auth + sessions (phi_sid cookie, shared with Node) ·
**accounts** (/auth/register guest-upgrade, /auth/signin, /auth/password — same scrypt hash format
as Node, so passwords made by either server verify on both) · **/state/{doc}** (server docs
read-only) · **/wallet** swap/spend/earn (same rates, fee and earn cap) · **/activity** ·
/chat (scripted reply) · **backing settlement** (an order naming a round spends the pledge from the
wallet and raises the round). Compatibility aliases serve today's clients: /tree/rows, /tree/item,
/tree/mine. Anonymous GETs are answered as an ephemeral guest without minting a session, so an
app's parallel boot requests can never overwrite a signed-in cookie.

Still on the Node server until ported: account verification/reset email, /shop buy·offer·sell,
/chat model proxy (PHI_MODEL_*), delegation tokens, theme editing, seeding (`npm run seed`).

Run locally (against the compose db or any Postgres the Node server seeded):
    pip install -r requirements.txt
    DATABASE_URL=postgres://phi:...@localhost:5432/phiora uvicorn main:app --port 4400
