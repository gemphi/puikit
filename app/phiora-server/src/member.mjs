// A member's own routes on the Phiora API: their saved documents (state), wallet, shop (buy, offer, sell),
// activity and theme. The request handler (server.mjs) hands them what they read; a route that answered has
// ended the response.
import { activityOf, addActivity, setTheme } from './items.mjs';
import { earn, ensureWallet, spend, swap } from './ledger.mjs';
import { buy, offer, sell } from './shop.mjs';

// A saved document's name: letters, digits, dot, dash and underscore (server.mjs).
const NAME = /^[\w.-]{1,64}$/;
/** Answer `route` when it is one of a member's own routes; otherwise leave the response open for the next routes. */
export async function memberRoute(route, { SERVER_DOCS, catalog, designers, docRead, fail, money, pathname, readBody, req, res, searchParams, send, store, u }) {
  let m;
    if ((m = pathname.match(/^\/state\/(.+)$/))) {
      const name = decodeURIComponent(m[1]);
      if (!NAME.test(name)) return fail(res, 400, 'bad_name', 'Bad document name.');
      if (req.method === 'GET') { const v = docRead(u, name); return v === undefined ? fail(res, 404, 'unset', 'Not set.') : send(res, 200, v); }
      if (req.method === 'PUT') {
        if (SERVER_DOCS.has(name)) return fail(res, 403, 'server_owned', name + ' is written by the server — use /wallet or /shop.');
        const body = await readBody(req);
        if (body === undefined) return fail(res, 400, 'empty', 'Send a JSON value.');
        u.docs[name] = body; await store.saveUser(u); return send(res, 204);
      }
    }

    if (req.method === 'POST' && (m = pathname.match(/^\/wallet\/(swap|spend|earn)$/))) {
      const body = (await readBody(req)) || {};
      const out = { swap, spend, earn }[m[1]](ensureWallet(u), body);
      await store.saveUser(u); return send(res, 200, { ...out, ...money(u) });
    }
    if (route === 'POST /shop/buy') {
      const { lookIds, label } = (await readBody(req)) || {};
      const out = buy(ensureWallet(u), catalog, lookIds, label);
      await store.saveUser(u); return send(res, 200, { ...out, ...money(u), cartOffers: u.docs.cartOffers });
    }
    if (route === 'POST /shop/offer') {
      const { lookId, usd } = (await readBody(req)) || {};
      const out = offer(ensureWallet(u), catalog, lookId, usd);
      await store.saveUser(u); return send(res, 200, { ...out, ...money(u), cartOffers: u.docs.cartOffers });
    }

    if (route === 'POST /shop/sell') {
      const { lookId } = (await readBody(req)) || {};
      const out = sell(ensureWallet(u), catalog, lookId);
      await store.saveUser(u); return send(res, 200, { ...out, ...money(u) });
    }
    if (route === 'POST /activity') { const out = addActivity(u, await readBody(req)); await store.saveUser(u); return send(res, 200, out); }
    if (route === 'GET /activity') return send(res, 200, { events: activityOf(u, searchParams.get('ref') || undefined) });
    if (req.method === 'PUT' && (m = pathname.match(/^\/item\/([\w.:-]{1,120})\/theme$/))) return send(res, 200, await setTheme(store, u, catalog, m[1], await readBody(req), designers));
}
