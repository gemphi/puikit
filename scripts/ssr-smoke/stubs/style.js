// Stand-in for *.scss: class names echo their key so assertions can see them.
const handler = {
  get: (t, prop) => {
    if (prop === '__esModule') return true;
    if (prop === 'default') return proxy;
    if (typeof prop === 'symbol') return undefined;
    return prop;
  },
};
const proxy = new Proxy({}, handler);
module.exports = proxy;
