import { defineEventHandler, setResponseHeaders } from 'file:///Users/ousa/Desktop/Nuxt_3/node_modules/.pnpm/h3@1.15.11/node_modules/h3/dist/index.mjs';

const ping_get = defineEventHandler((event) => {
  setResponseHeaders(event, {
    "Cache-Control": "no-store, no-cache",
    "Content-Type": "application/json"
  });
  return { ok: true, ts: Date.now() };
});

export { ping_get as default };
//# sourceMappingURL=ping.get.mjs.map
