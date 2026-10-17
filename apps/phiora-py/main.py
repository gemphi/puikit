"""Phiora (Python) — the FastAPI data backend for puikit.

One database, one API. Serves the kinds/items/props store the apps read and write, over the SAME
Postgres tables as the Node phiora-server (items, users, sessions, globals, item_changes), so the
two backends are interchangeable behind nginx while the port completes.

Primary routes (the /api/kind/{...} shape; nginx strips /api/):
  GET  /health                         liveness + store
  GET  /kinds                          every kind with its count
  GET  /kind/{kind}?n&sort&dir&where&join      a page of rows (same semantics as the Node /tree/rows)
  POST /kind/{kind}        {fields}    create (signed in; ownerId set; backing a round settles the wallet)
  GET  /kind/{kind}/{id}               one record
  PATCH/DELETE /kind/{kind}/{id}       change / remove (owner or editor)
  GET  /mine?kinds=a,b                 the signed-in user's records per kind
  GET  /app/{key}                      an app's nav+views composed from app/menu/page/block records
  GET  /me · GET /auth/demo-user · POST /auth/demo · POST /auth/logout

Compatibility aliases (what today's built apps call): /tree/rows, /tree/item, /tree/item/{kind}/{id},
/tree/mine — same handlers.

Env: DATABASE_URL (required) · PHI_DEMO_LOGIN (default on; "0" = off) · PHI_EDITORS (ids/handles,
comma) · PHI_CREATE_KINDS (open kinds; unset = all open) · PHI_SECURE_COOKIES=1 behind TLS.
Run:  uvicorn main:app --host 0.0.0.0 --port 4400
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import secrets
import time
from typing import Any

import psycopg
from fastapi import Depends, FastAPI, Request, Response
from fastapi.responses import JSONResponse
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

DATABASE_URL = os.environ.get("DATABASE_URL") or os.environ.get("PHI_PG_URL") or ""
DEMO_LOGIN = os.environ.get("PHI_DEMO_LOGIN", "1") != "0"
SECURE = os.environ.get("PHI_SECURE_COOKIES") == "1"
EDITORS = {s.strip() for s in os.environ.get("PHI_EDITORS", "").split(",") if s.strip()}
CREATE_KINDS = {s.strip() for s in os.environ.get("PHI_CREATE_KINDS", "").split(",") if s.strip()} or None
OWNER_FIELDS = ["founderId", "ownerId", "creatorId", "authorId", "userId", "holderId", "createdBy"]
KIND_RE = re.compile(r"^[A-Za-z][A-Za-z0-9]{0,39}$")
ID_RE = re.compile(r"^[\w.:-]{1,120}$")
COINS = {"usd": 1.0, "egg": 0.25, "sum": 6.0, "eth": 3200.0}
START = {"usd": 2500, "egg": 12000, "sum": 140, "eth": 0.42}

pool = ConnectionPool(DATABASE_URL, min_size=1, max_size=8, kwargs={"row_factory": dict_row}, open=False)
app = FastAPI(title="Phiora", docs_url=None, redoc_url=None)


@app.on_event("startup")
def _open_pool() -> None:
    pool.open()


def fail(status: int, code: str, message: str) -> JSONResponse:
    return JSONResponse({"error": code, "message": message}, status_code=status)


def q(sql: str, params: tuple = ()) -> list[dict]:
    with pool.connection() as c:
        return c.execute(sql, params).fetchall()


def run(sql: str, params: tuple = ()) -> None:
    with pool.connection() as c:
        c.execute(sql, params)


# ---------- sessions: the same phi_sid cookie and tables the Node server uses ----------

def _cookie(resp: Response, sid: str, clear: bool = False) -> None:
    resp.set_cookie("phi_sid", "" if clear else sid, path="/", httponly=True,
                    max_age=0 if clear else 31536000,
                    samesite="none" if SECURE else "lax", secure=SECURE)


def load_user(uid: str) -> dict | None:
    r = q("SELECT doc FROM users WHERE id=%s", (uid,))
    return json.loads(r[0]["doc"]) if r else None


def save_user(u: dict) -> None:
    run("""INSERT INTO users (id, doc, updated_at) VALUES (%s,%s,%s)
           ON CONFLICT (id) DO UPDATE SET doc=EXCLUDED.doc, updated_at=EXCLUDED.updated_at""",
        (u["id"], json.dumps(u), int(time.time() * 1000)))


def ensure_wallet(u: dict) -> dict:
    u.setdefault("wallet", dict(START))
    u.setdefault("history", [])
    u.setdefault("docs", {})
    return u


async def current(req: Request, resp: Response) -> dict:
    """The signed-in (or guest) user behind the phi_sid cookie, created on first touch like the Node server."""
    sid = req.cookies.get("phi_sid")
    now = int(time.time() * 1000)
    if sid:
        s = q("SELECT user_id FROM sessions WHERE sid=%s", (sid,))
        if s:
            run("UPDATE sessions SET at=%s WHERE sid=%s", (now, sid))
            u = load_user(s[0]["user_id"])
            if u:
                req.state.sid = sid
                return ensure_wallet(u)
    u = ensure_wallet({"id": "guest_" + secrets.token_hex(6), "guest": True, "name": "Guest"})
    # Anonymous read: answer as an ephemeral guest WITHOUT minting a session or setting a cookie.
    # An app boot fires many parallel GETs before any cookie exists; if each minted its own guest
    # session + Set-Cookie, a late-arriving guest cookie would overwrite the one a sign-in just set.
    # Sessions are only created on writes and on the /auth routes, where one request is in flight.
    if req.method in ("GET", "HEAD") and not req.url.path.startswith("/auth"):
        req.state.sid = None
        return u
    save_user(u)
    sid = secrets.token_urlsafe(24)
    run("INSERT INTO sessions (sid, user_id, at, created, ua) VALUES (%s,%s,%s,%s,%s)",
        (sid, u["id"], now, now, str(req.headers.get("user-agent", ""))[:200]))
    _cookie(resp, sid)
    req.state.sid = sid
    return u


def is_editor(u: dict) -> bool:
    return bool(u) and not u.get("guest") and (("*" in EDITORS) or (u["id"] in EDITORS) or (u.get("handle") in EDITORS))


def me_of(u: dict) -> dict:
    return {"id": u["id"], "name": u.get("name"), "handle": u.get("handle"), "guest": bool(u.get("guest")),
            "editor": is_editor(u)}


# ---------- rows: same semantics as the Node /tree/rows ----------

_NUM = re.compile(r"-?\d+(\.\d+)?")


def _num(v: Any) -> float:
    if isinstance(v, (int, float)):
        return float(v)
    m = _NUM.search(str(v or "").replace(",", ""))
    if not m:
        return float("nan")
    x = float(m.group(0))
    u = re.search(r"\d\s*([kKmMbB])\b", str(v))
    mul = {"k": 1e3, "m": 1e6, "b": 1e9}.get((u.group(1).lower() if u else ""), 1)
    return x * mul


def _cmp_key(v: Any):
    n = _num(v)
    return (0, n, "") if n == n else (1, 0.0, str(v or ""))


def ref_kind(field: str) -> str | None:
    m = re.search(r"([A-Z]?[a-z]+)Id$", field)
    return m.group(1).lower() if m else None


def items_of(kind: str) -> list[dict]:
    return [r["doc"] for r in q("SELECT doc FROM items WHERE kind=%s AND NOT deleted ORDER BY ord", (kind,))]


def rows_payload(kind: str, n: int, sort: str | None, direction: str | None, where: str | None, join: str | None) -> dict:
    n = min(500, max(1, n or 8))
    conds = [w.split(":", 1) for w in (where or "").split(",") if ":" in w]
    joins = [f.strip() for f in (join or "").split(",") if f.strip() and ref_kind(f.strip())]
    rows = [r for r in items_of(kind) if all(str(r.get(f) if r.get(f) is not None else "") == v for f, v in conds)]
    total = len(rows)
    if sort:
        rows = sorted(rows, key=lambda r: _cmp_key(r.get(sort)), reverse=(direction != "asc"))
    rows = rows[:n]
    if joins:
        index: dict[str, dict] = {}
        for k in {ref_kind(f) for f in joins}:
            for r in items_of(k):
                index[f"{k}:{r.get('id')}"] = r
        out = []
        for r in rows:
            o = dict(r)
            for f in joins:
                t = index.get(f"{ref_kind(f)}:{r.get(f)}")
                if t:
                    o[re.sub(r"Id$", "", f)] = {"id": t.get("id"), "name": t.get("name") or t.get("title"),
                                                "image": t.get("image")}
            out.append(o)
        rows = out
    return {"kind": kind, "total": total, "rows": rows}


# ---------- records: create / read / change / remove, with the backing settlement ----------

def log_change(kind: str, rid: str, action: str, fields: list[str], u: dict) -> None:
    run("INSERT INTO item_changes (kind, id, action, fields, by_id, by_handle, at) VALUES (%s,%s,%s,%s,%s,%s,%s)",
        (kind, rid, action, json.dumps(fields), u["id"], u.get("handle"), int(time.time() * 1000)))


def save_item(kind: str, rid: str, doc: dict, u: dict, action: str, fields: list[str]) -> None:
    now = int(time.time() * 1000)
    run("""INSERT INTO items (kind, id, slug, ord, doc, origin, edited, owner, updated_at, updated_by)
           VALUES (%s,%s,%s,(SELECT COALESCE(MAX(ord),-1)+1 FROM items),%s,'api',TRUE,%s,%s,%s)
           ON CONFLICT (kind, id) DO UPDATE SET doc=EXCLUDED.doc, slug=EXCLUDED.slug, edited=TRUE,
             deleted=FALSE, updated_at=EXCLUDED.updated_at, updated_by=EXCLUDED.updated_by""",
        (kind, rid, doc.get("slug"), json.dumps(doc), u["id"], now, u["id"]))
    log_change(kind, rid, action, fields, u)


def get_item(kind: str, rid: str) -> dict | None:
    r = q("SELECT doc FROM items WHERE kind=%s AND id=%s AND NOT deleted", (kind, rid))
    return r[0]["doc"] if r else None


def slugify(s: str) -> str:
    return re.sub(r"_+", "_", re.sub(r"[^a-z0-9]+", "_", s.lower())).strip("_")[:80]


FEE = 0.003
EARN_CAP_USD = 50000
COIN_LABEL = {"usd": "USD", "egg": "$EGG", "sum": "$SUM", "eth": "ETH"}


def _round8(v: float) -> float:
    return round(v * 1e8) / 1e8


def _log(u: dict, coin: str, amt: float, what: str) -> None:
    u["history"] = ([{"t": int(time.time() * 1000), "coin": coin, "amt": _round8(amt), "what": str(what)[:120]}]
                    + u["history"])[:200]


def spend(u: dict, coin: str, amt: float, what: str) -> str | None:
    """Move amt of coin out of the wallet; returns an error code or None. Same maths as the Node ledger."""
    if coin not in COINS:
        return "bad_coin"
    if not (amt > 0):
        return "bad_amount"
    if amt > u["wallet"].get(coin, 0) + 1e-9:
        return "insufficient"
    u["wallet"][coin] = _round8(u["wallet"][coin] - amt)
    _log(u, coin, -amt, what)
    return None


def swap(u: dict, amt: float, frm: str, to: str) -> tuple[dict | None, str | None]:
    if frm not in COINS or to not in COINS or frm == to:
        return None, "bad_pair"
    if not (amt > 0):
        return None, "bad_amount"
    if amt > u["wallet"].get(frm, 0) + 1e-9:
        return None, "insufficient"
    got = amt * COINS[frm] / COINS[to] * (1 - FEE)
    u["wallet"][frm] = _round8(u["wallet"][frm] - amt)
    u["wallet"][to] = _round8(u["wallet"].get(to, 0) + got)
    _log(u, frm, -amt, "Swapped to " + COIN_LABEL[to])
    _log(u, to, got, "Received from swap")
    return {"got": _round8(got)}, None


def earn(u: dict, coin: str, amt: float, what: str) -> str | None:
    if coin not in COINS:
        return "bad_coin"
    if not (amt > 0):
        return "bad_amount"
    usd = amt * COINS[coin]
    if u.get("earned", 0) + usd > EARN_CAP_USD:
        return "earn_cap"
    u["earned"] = u.get("earned", 0) + usd
    u["wallet"][coin] = _round8(u["wallet"].get(coin, 0) + amt)
    _log(u, coin, amt, what)
    return None


def create_record(u: dict, kind: str, fields: dict) -> tuple[dict | None, JSONResponse | None]:
    if u.get("guest"):
        return None, fail(401, "signin", "Sign in first.")
    if not KIND_RE.match(kind):
        return None, fail(400, "bad_kind", "A kind is a word of letters and digits.")
    if CREATE_KINDS is not None and kind not in CREATE_KINDS and not is_editor(u):
        return None, fail(403, "kind_closed", f"Only editors create {kind} records here.")
    extra: dict = {}
    # Backing a round: the pledge moves from the wallet before any order is written (money moves here, nowhere else).
    if kind == "order" and fields.get("roundId"):
        rnd = get_item("round", str(fields["roundId"]))
        if not rnd:
            return None, fail(404, "no_round", "That round is gone.")
        coin = str(rnd.get("coin", "usd")).lower()
        amt = float(fields.get("amount") or fields.get("totalUsd") or rnd.get("minTicket") or 0)
        err = spend(u, coin, amt, f"Backed {rnd.get('name', 'round')}")
        if err:
            return None, fail(400, err, "Not enough in the wallet." if err == "insufficient" else "Bad pledge.")
        save_user(u)
        fields = {**fields, "amount": amt, "coin": coin, "totalUsd": round(amt * COINS[coin])}
        raised = round(float(rnd.get("raised") or 0) + amt * COINS[coin])
        backers = int(rnd.get("backers") or 0) + 1
        save_item("round", rnd["id"], {**rnd, "raised": raised, "backers": backers}, u, "update", ["raised", "backers"])
        extra = {"wallet": u["wallet"], "history": u["history"], "round": {"id": rnd["id"], "raised": raised, "backers": backers}}
    rid = hashlib.md5(f"{kind}:{secrets.token_hex(16)}".encode()).hexdigest()
    named = next((fields.get(k) for k in ("slug", "name", "title", "label", "handle") if isinstance(fields.get(k), str) and fields.get(k).strip()), None)
    doc = {"id": rid, "ownerId": u["id"], **fields, "slug": slugify(named) if named else f"{kind}_{rid[:8]}"}
    save_item(kind, rid, doc, u, "create", list(fields.keys()))
    return {"kind": kind, "item": doc, "owner": u["id"], **extra}, None


def can_edit(u: dict, rec: dict) -> bool:
    return is_editor(u) or (not u.get("guest") and any(rec.get(f) == u["id"] for f in OWNER_FIELDS))


# ---------- routes ----------

@app.get("/health")
def health() -> dict:
    ok = True
    try:
        q("SELECT 1")
    except Exception:
        ok = False
    return {"ok": ok, "store": "postgres", "service": "phiora-py"}


@app.get("/kinds")
def kinds() -> dict:
    rows = q("SELECT kind, COUNT(*) AS n FROM items WHERE NOT deleted GROUP BY kind ORDER BY kind")
    return {"kinds": [{"kind": r["kind"], "count": int(r["n"])} for r in rows]}


@app.get("/kind/{kind}")
def kind_rows(kind: str, n: int = 8, sort: str | None = None, dir: str | None = None,
              where: str | None = None, join: str | None = None) -> Any:
    if not KIND_RE.match(kind):
        return fail(400, "bad_kind", "Bad kind.")
    return rows_payload(kind, n, sort, dir, where, join)


@app.post("/kind/{kind}", status_code=201)
async def kind_create(kind: str, req: Request, resp: Response, u: dict = Depends(current)) -> Any:
    body = await req.json()
    out, err = create_record(u, kind, body.get("fields") or body or {})
    return err or out


@app.get("/kind/{kind}/{rid}")
def kind_item(kind: str, rid: str, resp: Response) -> Any:
    rec = get_item(kind, rid)
    return rec and {"kind": kind, "item": rec} or fail(404, "missing", "No such record.")


@app.patch("/kind/{kind}/{rid}")
async def kind_patch(kind: str, rid: str, req: Request, resp: Response, u: dict = Depends(current)) -> Any:
    rec = get_item(kind, rid)
    if not rec:
        return fail(404, "missing", "No such record.")
    if not can_edit(u, rec):
        return fail(403, "not_yours", "Only the owner or an editor changes this.")
    body = await req.json()
    fields = body.get("fields") or body or {}
    doc = {**rec, **fields}
    save_item(kind, rid, doc, u, "update", list(fields.keys()))
    return {"kind": kind, "item": doc}


@app.delete("/kind/{kind}/{rid}")
async def kind_delete(kind: str, rid: str, resp: Response, u: dict = Depends(current)) -> Any:
    rec = get_item(kind, rid)
    if not rec:
        return fail(404, "missing", "No such record.")
    if not can_edit(u, rec):
        return fail(403, "not_yours", "Only the owner or an editor removes this.")
    run("DELETE FROM items WHERE kind=%s AND id=%s AND origin!='file'", (kind, rid))
    run("UPDATE items SET deleted=TRUE WHERE kind=%s AND id=%s AND origin='file'", (kind, rid))
    log_change(kind, rid, "delete", [], u)
    return {"ok": True}


@app.get("/mine")
async def mine(req: Request, resp: Response, kinds: str = "", u: dict = Depends(current)) -> Any:
    wanted = [k for k in kinds.split(",") if KIND_RE.match(k)]
    out = {k: [r for r in items_of(k) if any(r.get(f) == u["id"] for f in OWNER_FIELDS)] for k in wanted}
    return {"me": u["id"], "kinds": out}


@app.get("/app/{key}")
def app_doc(key: str) -> Any:
    rows = {k: items_of(k) for k in ("app", "menu", "page", "block")}
    a = next((x for x in rows["app"] if x.get("key") == key), None)
    if not a:
        return fail(404, "no_app", "No such app.")
    omit = lambda d, ks: {k: v for k, v in d.items() if k not in ks}  # noqa: E731
    menus = [m for m in rows["menu"] if m.get("appId") == a["id"]]

    def nav_of(parent):
        out = []
        for m in sorted([x for x in menus if x.get("parentId") == parent], key=lambda x: x.get("order") or 0):
            rest = omit(m, ["id", "slug", "appId", "parentId", "pageId", "order", "key", "group"])
            entry = {"id": m.get("key"), **rest}
            if m.get("group"):
                entry["items"] = nav_of(m["id"])
            out.append(entry)
        return out

    pages = [p for p in rows["page"] if p.get("appId") == a["id"]]
    blocks: dict[str, list] = {}
    for b in rows["block"]:
        blocks.setdefault(b.get("pageId"), []).append(b)
    views = {}
    for p in pages:
        bs = sorted(blocks.get(p["id"], []), key=lambda x: x.get("order") or 0)
        views[p["key"]] = {**omit(p, ["id", "slug", "appId", "key"]),
                           "blocks": [{"kind": b.get("type"), **omit(b, ["id", "slug", "pageId", "order", "type"])} for b in bs]}
    return {**omit(a, ["id", "slug", "key", "name"]), "nav": nav_of(None), "views": views}


@app.get("/me")
async def me(req: Request, resp: Response, u: dict = Depends(current)) -> dict:
    return me_of(u)


@app.get("/auth/demo-user")
def demo_users() -> Any:
    if not DEMO_LOGIN:
        return fail(403, "disabled", "Demo sign-in is off.")
    people = items_of("person")[:24]
    return [{"id": p.get("id"), "name": p.get("name"), "handle": p.get("handle")} for p in people]


@app.post("/auth/demo")
async def demo_login(req: Request, resp: Response, u: dict = Depends(current)) -> Any:
    if not DEMO_LOGIN:
        return fail(403, "disabled", "Demo sign-in is off.")
    body = await req.json()
    uid = str(body.get("userId") or "")
    idmap = q("SELECT doc FROM globals WHERE name='items.idmap'")
    mapped = (json.loads(idmap[0]["doc"]) if idmap else {}).get(uid, uid)
    user = load_user(mapped)
    if not user:
        person = get_item("person", mapped)
        if not person:
            return fail(404, "no_user", "Unknown user.")
        user = ensure_wallet({"id": mapped, "name": person.get("name"), "handle": person.get("handle")})
        save_user(user)
    user.pop("guest", None)
    save_user(ensure_wallet(user))
    run("""INSERT INTO sessions (sid, user_id, at, created, ua) VALUES (%s,%s,%s,%s,'')
           ON CONFLICT (sid) DO UPDATE SET user_id=EXCLUDED.user_id, at=EXCLUDED.at""",
        (req.state.sid, user["id"], int(time.time() * 1000), int(time.time() * 1000)))
    return me_of(user)


@app.post("/auth/logout")
async def logout(req: Request, resp: Response, u: dict = Depends(current)) -> dict:
    run("DELETE FROM sessions WHERE sid=%s", (getattr(req.state, "sid", ""),))
    _cookie(resp, "", clear=True)
    return {"ok": True}


# ---------- compatibility aliases: what today's built apps call ----------

@app.get("/tree/rows")
def tree_rows(kind: str = "", n: int = 8, sort: str | None = None, dir: str | None = None,
              where: str | None = None, join: str | None = None) -> Any:
    return kind_rows(kind, n, sort, dir, where, join) if kind else fail(400, "bad_kind", "kind required")


@app.get("/tree/item/{kind}/{rid}")
def tree_item(kind: str, rid: str, resp: Response) -> Any:
    return kind_item(kind, rid, resp)


@app.post("/tree/item", status_code=201)
async def tree_create(req: Request, resp: Response, u: dict = Depends(current)) -> Any:
    body = await req.json()
    out, err = create_record(u, str(body.get("kind") or ""), body.get("fields") or {})
    return err or out


@app.patch("/tree/item/{kind}/{rid}")
async def tree_patch(kind: str, rid: str, req: Request, resp: Response, u: dict = Depends(current)) -> Any:
    return await kind_patch(kind, rid, req, resp, u)


@app.delete("/tree/item/{kind}/{rid}")
async def tree_delete(kind: str, rid: str, resp: Response, u: dict = Depends(current)) -> Any:
    return await kind_delete(kind, rid, resp, u)


@app.get("/tree/mine")
async def tree_mine(req: Request, resp: Response, kinds: str = "", u: dict = Depends(current)) -> Any:
    return await mine(req, resp, kinds, u)


# ---------- accounts: register / sign in / password — scrypt-compatible with the Node server ----------

HANDLE_RE = re.compile(r"^[a-z0-9][a-z0-9._]{2,29}$")
EMAIL_RE = re.compile(r"^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$")
_signin_fails: dict[str, list[float]] = {}


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    h = hashlib.scrypt(password.encode(), salt=salt, n=16384, r=8, p=1, dklen=64, maxmem=64 * 1024 * 1024)
    import base64
    return f"scrypt$16384${base64.b64encode(salt).decode()}${base64.b64encode(h).decode()}"


def verify_password(password: str, stored: Any) -> bool:
    if not isinstance(stored, str):
        return False
    parts = stored.split("$")
    if len(parts) != 4 or parts[0] != "scrypt":
        return False
    import base64
    try:
        salt, want = base64.b64decode(parts[2]), base64.b64decode(parts[3])
        got = hashlib.scrypt(str(password).encode(), salt=salt, n=int(parts[1]), r=8, p=1,
                             dklen=len(want), maxmem=64 * 1024 * 1024)
        return secrets.compare_digest(got, want)
    except Exception:
        return False


def _seed_handles() -> set[str]:
    return {p.get("handle") for p in items_of("person") if p.get("handle")}


def _account_of(login: str) -> dict | None:
    login = str(login or "").strip().lower()
    r = q("SELECT user_id FROM handles WHERE handle=%s", (login,)) or q("SELECT user_id FROM emails WHERE email=%s", (login,))
    return load_user(r[0]["user_id"]) if r else None


def _throttled(key: str) -> bool:
    now = time.time()
    fails = [t for t in _signin_fails.get(key, []) if now - t < 300]
    _signin_fails[key] = fails
    return len(fails) >= 8


@app.post("/auth/register")
async def register(req: Request, resp: Response, u: dict = Depends(current)) -> Any:
    if not u.get("guest"):
        return fail(409, "signed_in", "Sign out first to create another account.")
    body = await req.json()
    handle = str(body.get("handle") or "").strip().lower()
    name = str(body.get("name") or "").strip()
    password = body.get("password")
    email = str(body.get("email") or "").strip().lower() or None
    if not HANDLE_RE.match(handle):
        return fail(400, "bad_handle", "Handle: 3–30 characters, letters, numbers, dots or underscores.")
    if not (1 <= len(name) <= 60):
        return fail(400, "bad_name", "Name: 1–60 characters.")
    if not isinstance(password, str) or not (8 <= len(password) <= 200):
        return fail(400, "bad_password", "Password: at least 8 characters.")
    if email and not EMAIL_RE.match(email):
        return fail(400, "bad_email", "That email doesn't look right.")
    if q("SELECT 1 FROM handles WHERE handle=%s", (handle,)) or handle in _seed_handles():
        return fail(409, "handle_taken", "That handle is taken.")
    if email and q("SELECT 1 FROM emails WHERE email=%s", (email,)):
        return fail(409, "email_taken", "That email is already on an account.")
    # Registering upgrades the current guest in place, so its wallet and saved state carry over.
    u.pop("guest", None)
    u.update({"handle": handle, "name": name, "passwordHash": hash_password(password),
              "registeredAt": int(time.time() * 1000), "email": email, "emailVerified": False})
    run("INSERT INTO handles (handle, user_id) VALUES (%s,%s) ON CONFLICT (handle) DO NOTHING", (handle, u["id"]))
    if email:
        run("INSERT INTO emails (email, user_id) VALUES (%s,%s) ON CONFLICT (email) DO NOTHING", (email, u["id"]))
    save_user(u)
    return me_of(u)  # email verification mail is still the Node server's job until the mailer is ported


@app.post("/auth/signin")
async def signin(req: Request, resp: Response, u: dict = Depends(current)) -> Any:
    body = await req.json()
    login = str(body.get("handle") or body.get("login") or "").strip().lower()
    key = (req.client.host if req.client else "") + "|" + login
    if _throttled(key):
        return fail(429, "throttled", "Too many tries — wait a few minutes.")
    acct = _account_of(login)
    if not acct or not verify_password(body.get("password"), acct.get("passwordHash")):
        _signin_fails.setdefault(key, []).append(time.time())
        return fail(401, "bad_credentials", "Handle or password is wrong.")
    _signin_fails.pop(key, None)
    now = int(time.time() * 1000)
    run("""INSERT INTO sessions (sid, user_id, at, created, ua) VALUES (%s,%s,%s,%s,'')
           ON CONFLICT (sid) DO UPDATE SET user_id=EXCLUDED.user_id, at=EXCLUDED.at""",
        (req.state.sid, acct["id"], now, now))
    return me_of(ensure_wallet(acct))


@app.post("/auth/password")
async def change_password(req: Request, resp: Response, u: dict = Depends(current)) -> Any:
    if u.get("guest"):
        return fail(401, "sign_in", "Sign in first.")
    body = await req.json()
    if not verify_password(body.get("current"), u.get("passwordHash")):
        return fail(401, "bad_credentials", "Current password is wrong.")
    pw = body.get("password")
    if not isinstance(pw, str) or not (8 <= len(pw) <= 200):
        return fail(400, "bad_password", "Password: at least 8 characters.")
    u["passwordHash"] = hash_password(pw)
    save_user(u)
    return me_of(u)


@app.post("/auth/login")
async def login_alias(req: Request, resp: Response, u: dict = Depends(current)) -> Any:
    return await demo_login(req, resp, u)  # parity: /auth/login is the demo sign-in alias


# ---------- user state docs + wallet ops + activity + chat ----------

SERVER_DOCS = {"wallet", "history", "owned", "activity"}
ACTIVITY_KINDS = {"view", "angle", "cart.add", "cart.remove", "offer", "offer.withdraw", "buy", "checkout", "swap",
                  "lot.buy", "quest.join", "quest.leave", "coin.buy", "coin.sell", "stake", "unstake", "follow",
                  "unfollow", "rsvp", "unrsvp", "like", "unlike", "save", "unsave", "share", "comment", "chat", "open"}
NAME_RE = re.compile(r"^[\w.-]{1,64}$")


def money(u: dict) -> dict:
    return {"wallet": u.get("wallet"), "history": u.get("history"), "owned": u.get("owned")}


@app.get("/state/{name}")
async def state_get(name: str, req: Request, resp: Response, u: dict = Depends(current)) -> Any:
    if not NAME_RE.match(name):
        return fail(400, "bad_name", "Bad document name.")
    v = u.get("docs", {}).get("activity") if name == "activity" else \
        (money(u).get(name) if name in SERVER_DOCS else u.get("docs", {}).get(name))
    return fail(404, "unset", "Not set.") if v is None else v


@app.put("/state/{name}")
async def state_put(name: str, req: Request, resp: Response, u: dict = Depends(current)) -> Any:
    if not NAME_RE.match(name):
        return fail(400, "bad_name", "Bad document name.")
    if name in SERVER_DOCS:
        return fail(403, "server_owned", name + " is written by the server — use /wallet or /shop.")
    body = await req.json()
    u.setdefault("docs", {})[name] = body
    save_user(u)
    return Response(status_code=204)


@app.post("/wallet/{op}")
async def wallet_op(op: str, req: Request, resp: Response, u: dict = Depends(current)) -> Any:
    body = await req.json()
    out: dict = {}
    if op == "swap":
        out2, err = swap(u, float(body.get("amt") or 0), str(body.get("from") or ""), str(body.get("to") or ""))
        if err:
            return fail(409, err, "Swap refused: " + err + ".")
        out = out2 or {}
    elif op == "spend":
        err = spend(u, str(body.get("coin") or ""), float(body.get("amt") or 0), str(body.get("what") or "Spent"))
        if err:
            return fail(409, err, "Spend refused: " + err + ".")
    elif op == "earn":
        err = earn(u, str(body.get("coin") or ""), float(body.get("amt") or 0), str(body.get("what") or "Received"))
        if err:
            return fail(409, err, "Earn refused: " + err + ".")
    else:
        return fail(404, "not_found", "No wallet op " + op + ".")
    save_user(u)
    return {**out, **money(u)}


@app.post("/activity")
async def activity_add(req: Request, resp: Response, u: dict = Depends(current)) -> Any:
    body = await req.json()
    events = body.get("events") if isinstance(body.get("events"), list) else []
    if not events or len(events) > 100:
        return fail(400, "bad_events", "Send 1 to 100 events.")
    now = int(time.time() * 1000)
    clean = []
    for e in events:
        if not isinstance(e, dict) or e.get("kind") not in ACTIVITY_KINDS:
            return fail(400, "bad_kind", "Unknown activity kind.")
        if not ID_RE.match(str(e.get("ref") or "")):
            return fail(400, "bad_ref", "Bad ref.")
        at = e.get("at")
        at = at if isinstance(at, (int, float)) and at <= now + 60000 and at > now - 86400000 else now
        ev = {"id": e.get("id") if ID_RE.match(str(e.get("id") or "")) else "s" + secrets.token_hex(5),
              "kind": e["kind"], "ref": e["ref"], "at": int(at)}
        for k in ("refKind", "with"):
            if ID_RE.match(str(e.get(k) or "")):
                ev[k] = e[k]
        if isinstance(e.get("usd"), (int, float)):
            ev["usd"] = round(float(e["usd"]) * 100) / 100
        if isinstance(e.get("note"), str) and e["note"]:
            ev["note"] = e["note"][:120]
        clean.append(ev)
    doc = u.setdefault("docs", {}).setdefault("activity", {"events": []})
    seen = {x.get("id") for x in doc["events"]}
    fresh = sorted([x for x in clean if x["id"] not in seen], key=lambda x: -x["at"])
    doc["events"] = (fresh + doc["events"])[:1000]
    save_user(u)
    return {"added": len(clean), "total": len(doc["events"])}


@app.get("/activity")
async def activity_list(req: Request, resp: Response, ref: str = "", u: dict = Depends(current)) -> Any:
    events = u.get("docs", {}).get("activity", {}).get("events", [])
    return {"events": [e for e in events if not ref or e.get("ref") == ref or e.get("with") == ref]}


@app.post("/chat")
async def chat(req: Request, resp: Response, u: dict = Depends(current)) -> Any:
    body = await req.json()
    msgs = body.get("messages") if isinstance(body.get("messages"), list) else []
    last = str((msgs[-1] or {}).get("text") or (msgs[-1] or {}).get("content") or "") if msgs else ""
    # Canned fallback, same voice as the Node model proxy; a live model lands with the full model port.
    return {"text": f'Noted — "{last[:80]}". (Phiora has no model configured yet; set PHI_MODEL_URL or ANTHROPIC_API_KEY.)',
            "offline": True}
