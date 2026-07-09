import { d as defineEventHandler, s as setResponseHeaders } from '../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const uploadTest_post = defineEventHandler((event) => {
  setResponseHeaders(event, {
    "Cache-Control": "no-store, no-cache",
    "Content-Type": "application/json"
  });
  const req = event.node.req;
  const start = Date.now();
  let received = 0;
  return new Promise((resolve, reject) => {
    req.on("data", (chunk) => {
      received += chunk.length;
    });
    req.on("end", () => {
      const elapsed = Date.now() - start;
      resolve({
        received,
        elapsed,
        mbps: received > 0 && elapsed > 0 ? +(received * 8 / 1e6 / (elapsed / 1e3)).toFixed(2) : 0
      });
    });
    req.on("error", reject);
  });
});

export { uploadTest_post as default };
//# sourceMappingURL=upload-test.post.mjs.map
