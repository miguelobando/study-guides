// Checks that every source URL in the question bank still resolves.
// Usage: npm run check-links
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DATA_DIR = new URL('../src/data/', import.meta.url).pathname;
const CONCURRENCY = 8;
const TIMEOUT_MS = 20_000;

const urls = new Set();
for (const file of readdirSync(DATA_DIR).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))) {
  const text = readFileSync(join(DATA_DIR, file), 'utf8');
  for (const match of text.matchAll(/url:\s*'([^']+)'/g)) urls.add(match[1]);
}

async function check(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, {
        method,
        redirect: 'follow',
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { 'user-agent': 'Mozilla/5.0 (link checker)', accept: 'text/html,*/*' },
      });
      if (res.ok) return { url, status: res.status, ok: true, final: res.url };
      // Some servers reject HEAD; retry with GET before reporting.
      if (method === 'HEAD') continue;
      return { url, status: res.status, ok: false };
    } catch (err) {
      if (method === 'HEAD') continue;
      return { url, status: String(err.cause?.code ?? err.name), ok: false };
    }
  }
}

const queue = [...urls];
const results = [];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) results.push(await check(queue.shift()));
  }),
);

const failed = results.filter((r) => !r.ok);
// 401/403/429 usually mean bot protection rather than a dead link.
const blocked = failed.filter((r) => [401, 403, 429].includes(r.status));
const broken = failed.filter((r) => !blocked.includes(r));

console.log(`Checked ${results.length} unique URLs: ${results.length - failed.length} OK`);
for (const r of blocked) console.log(`  ? ${r.status}  ${r.url}  (blocked by bot protection, check manually)`);
for (const r of broken) console.log(`  ✗ ${r.status}  ${r.url}`);
process.exit(broken.length ? 1 : 0);
