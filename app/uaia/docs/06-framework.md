---
title: Regulatory Framework
route: /framework
order: 6
label: UAIA / FRAMEWORK
---

# HERO
**Micro-label:** REGULATORY FRAMEWORK
**Headline:** The Model Market Authorization — five gates from lab to market.

# SECTION — OVERVIEW

The MMA is UAIA's core instrument: a staged pipeline every in-scope model
passes before and during deployment. It is proportionate (obligations scale
with risk tier), reproducible (every gate emits a machine-readable evidence
bundle) and continuous (authorization is a state, not an event).

# SECTION — THE FIVE GATES (stepper UI)

**1 · NOTIFY.** Developer files a Model Notification: architecture class,
compute used, capability claims, intended deployment surface. → Assigns a
provisional risk tier.

**2 · EVALUATE.** The Technical Directorate runs UAIA-EVAL (see /evaluations)
plus developer-submitted evidence review. Output: Evaluation Report + final
tier R0–R4.

**3 · CERTIFY.** Models meeting their tier's bar receive a certificate class
C1–C3 (see /certification), signed and published to the Registry.

**4 · AUTHORIZE.** Market authorization is granted per deployment context
(consumer, enterprise, critical-infrastructure) with binding conditions:
disclosure, rate/agentic limits, incident SLAs.

**5 · MONITOR.** Telemetry commitments, incident reporting under STD-400,
scheduled re-evaluation on major version or capability jump. Authorization
can be amended, suspended or revoked at any time.

# SECTION — RISK TIERS

- **R0 — Minimal.** Narrow, low-capability. Self-declaration only.
- **R1 — Limited.** Standard evals, annual attestation.
- **R2 — Substantial.** Full UAIA-EVAL, C1 certificate required.
- **R3 — Frontier.** Full protocol + third-party red team + staged rollout.
- **R4 — Critical.** Highest scrutiny: pre-deployment deep evaluation,
  continuous monitoring, Assembly review, revocation drills.

# SECTION — SCOPE

Applies to models offered on the market (APIs, consumer products, embedded
systems). Pure research artifacts and non-deployed weights are out of scope.
Open-weights releases follow the dedicated policy track (see /policy).

# SECTION — FOR DEVELOPERS

"Start a notification" CTA → contact standards@uaiagency.org · timeline
graphic: median 6 weeks R2, 14 weeks R3.
