import { d as defineEventHandler, g as getQuery, s as setResponseHeaders } from '../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const downloadTest_get = defineEventHandler((event) => {
  const query = getQuery(event);
  const mbParam = Number(query.mb);
  const MB = Number.isFinite(mbParam) && mbParam > 0 && mbParam <= 50 ? mbParam : 20;
  const TOTAL = MB * 1024 * 1024;
  const CHUNK = 64 * 1024;
  setResponseHeaders(event, {
    "Content-Type": "application/octet-stream",
    "Content-Length": String(TOTAL),
    "Cache-Control": "no-store, no-cache"
  });
  const res = event.node.res;
  const chunk = Buffer.alloc(CHUNK);
  let sent = 0;
  return new Promise((resolve, reject) => {
    function write() {
      let ok = true;
      while (sent < TOTAL && ok) {
        const size = Math.min(CHUNK, TOTAL - sent);
        const slice = chunk.subarray(0, size);
        sent += size;
        if (sent >= TOTAL) {
          res.end(slice, resolve);
          return;
        }
        ok = res.write(slice);
      }
      if (!ok) res.once("drain", write);
    }
    res.on("error", reject);
    write();
  });
});

export { downloadTest_get as default };
//# sourceMappingURL=download-test.get.mjs.map
