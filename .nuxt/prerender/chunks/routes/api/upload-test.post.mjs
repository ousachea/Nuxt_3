import { defineEventHandler, setResponseHeaders } from 'file:///Users/ousa/Desktop/Nuxt_3/node_modules/.pnpm/h3@1.15.11/node_modules/h3/dist/index.mjs';

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
