const React = require('react');
const make = (name) => {
  const C = () => React.createElement('span', { 'data-icon': name, 'aria-hidden': 'true' });
  C.displayName = name;
  return C;
};
const cache = {};
const proxy = new Proxy({}, {
  get: (t, p) => {
    if (p === '__esModule') return true;
    if (p === 'default') return proxy;          // so `import icons from` yields the proxy
    if (typeof p !== 'string') return undefined;
    if (!cache[p]) cache[p] = make(p);
    return cache[p];
  },
});
module.exports = proxy;
