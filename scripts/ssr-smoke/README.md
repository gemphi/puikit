# Browser verification harness

Two layers, because they catch different things.

**SSR layer** (`render.js`, `shoot.js`, `shoot-book.js`, `snap.js`, `test.js`) renders
pages with `react-dom/server` and screenshots the HTML. It is fast and it proves the
markup contract, but effects never run there, so it can only ever show a loading state —
and it will happily render a page whose provider the app forgot to mount, because the
harness mounts the provider itself.

**Live layer** (`bundle.js`, `live/host.js`, `drive.js`) runs the *real* apps in Chromium.
`bundle.js` is a small CommonJS→browser bundler over the `tsc` output: there is no npm
registry reachable from CI here, so esbuild and vite are unavailable, and the require
graph is walked by hand instead. Effects run, the adapters resolve, overlays mount into
`document.body`, and `drive.js` clicks real controls.

The live layer is what found the defects the SSR layer could not: a missing
`ShopProvider` in the app, product entries that were click handlers rather than links,
overlays that ignored Escape, and a bag drawer that was never mounted.

## Running it

    ./sync.sh          # stage sources, compile to CJS, compile SCSS with per-file class scoping
    node bundle.js     # -> live/chanel.js, live/book.js
    node live/host.js& # serve on :8788
    node drive.js      # drive Chromium, screenshot to live-shots/, assert

    node shoot.js && node shoot-book.js && node snap.js && node test.js   # SSR layer
