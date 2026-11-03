# Mocks

Raw API payloads. Nothing in the app reads these files directly — every one is
consumed by a service in `lib/services/`, which is the single place that knows
the payload shape and maps it onto the `@pui/types` domain models.

Swapping this storefront onto a live backend means changing `lib/services/`
only. No page, hook, component or store imports from here.
