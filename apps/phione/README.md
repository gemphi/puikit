# Phione

The Phient identity and ontology console (port 3115). It reads the Python Phient platform API
(`gemphi/phient` → `phiadk.phiapi`). Without the API it shows sample data.

```
# in gemphi/phient
PYTHONPATH=src python -m uvicorn phiadk.phiapi.app:create_app --factory --port 8000
# in puijs/apps/phione
VITE_PHIADK_API=http://localhost:8000 npm run dev
```

`node apps/dev-all.mjs --phiadk` starts the Python API with the apps, and gives Phiora and Phient one shared
`PHI_DELEGATION_SECRET` (plus `PHIORA_URL`) for the run, so delegations are checked locally.

Phione also reads Phiora (`VITE_PHI_API=http://localhost:4300`) for the signed-in account. Every Phient call carries
the current delegation as `Authorization: Bearer`, so Phient knows who asks. Verbs that change the platform are refused without one (guests too); the console shows the reason.

| Page | Endpoints |
|:---|:---|
| Identity | Phiora `GET /me` and `POST /auth/delegation` (audience `phient`); Phient `GET /v2/identity/me` with `Authorization: Bearer <delegation>` (the PhiOne identity for your email); `provision_identity` to request one; the link is kept on Phiora (`/state/phione-link`) |
| Agents | `GET /v2/agents`, `POST /v2/agents/{id}/execute`. The console is the phi-kit `agent` block (the one in the apps' Platform views): ready-made runs from `phi-kit/src/presets.ts`, JSON parameters, the output, who ran it and a sortable list of runs. A card's verb opens the console on it and runs it. Verbs that change the platform need a Phiora sign-in |
| Ontology | `GET /v2/ontologies`, `/v2/ontologies/objects/{type}`, `/v2/workforce/org`, `/v2/git/log` |
| PhiBus streams | `GET /v2/bus/events?limit=200` (polled every 3 s while running, newest first), `POST /v2/bus/pub` (the Publish form, `source_agent: phione`); filter by topic, search, sort any column |
| Audit and governance | `GET /v2/telemetry/tail?n=100` (polled every 5 s), PhiGov verbs `get_compliance_score`, `check_compliance`, `audit_lineage` via `POST /v2/agents/phigov/execute`; each run is written to PhiLog (`philog` `info`), plus the Audit trail table from `GET /v2/audit/tail?n=50` (who changed the platform: time, agent, action, by, status) |
| API and SDK docs | the real endpoints with a live Run |
