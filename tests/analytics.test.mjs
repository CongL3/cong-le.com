import assert from 'node:assert/strict';
import test from 'node:test';

import { injectAnalytics } from '../scripts/inject-analytics.mjs';

test('analytics injection is present once and idempotent', () => {
  const html = '<html><body><main>content</main></body></html>';
  const injected = injectAnalytics(html);
  assert.equal((injected.match(/Cloudflare Web Analytics/g) || []).length, 2);
  assert.equal(injectAnalytics(injected), injected);
});

test('analytics injection rejects incomplete HTML', () => {
  assert.throws(() => injectAnalytics('<html><main>content</main></html>'), /closing body tag/);
});
