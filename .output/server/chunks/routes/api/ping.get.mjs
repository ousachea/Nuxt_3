import { d as defineEventHandler, s as setResponseHeaders } from '../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const ping_get = defineEventHandler((event) => {
  setResponseHeaders(event, {
    "Cache-Control": "no-store, no-cache",
    "Content-Type": "application/json"
  });
  return { ok: true, ts: Date.now() };
});

export { ping_get as default };
//# sourceMappingURL=ping.get.mjs.map
