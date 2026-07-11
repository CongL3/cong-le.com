/**
 * indexnow.mjs
 * IndexNow submission helper. IndexNow lets us proactively tell search and
 * answer engines (Bing, Yandex, and the growing set of participating crawlers)
 * that a URL changed, so fresh posts get discovered without waiting for a crawl.
 *
 * The key below is a static, publicly-verifiable secret: it MUST also exist as
 * a plain-text file at https://www.cong-le.com/<KEY>.txt (public/<KEY>.txt) whose
 * only content is the key itself. That file is how IndexNow proves we own the host.
 */

export const INDEXNOW_KEY = 'ad0b8fafbe4c67fbe85c40052783ebc1';
export const INDEXNOW_HOST = 'www.cong-le.com';
export const INDEXNOW_KEY_LOCATION = `https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`;
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

/**
 * Build the JSON payload IndexNow expects. Pure — no network — so it can be
 * unit-tested by asserting on the returned object.
 */
export function buildIndexNowPayload(urlList) {
  return {
    host: INDEXNOW_HOST,
    key: INDEXNOW_KEY,
    keyLocation: INDEXNOW_KEY_LOCATION,
    urlList: [...urlList],
  };
}

/**
 * Fire-and-forget IndexNow ping. Any failure is swallowed to a console.warn so
 * that a publish/cron run is never failed by an unreachable endpoint. Returns
 * true on a 2xx response, false otherwise (including on network errors).
 */
export async function pingIndexNow(urlList) {
  const payload = buildIndexNowPayload(urlList);
  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.warn(`indexnow: endpoint returned HTTP ${res.status} (ignored)`);
      return false;
    }
    console.log(`indexnow: submitted ${payload.urlList.length} URL(s).`);
    return true;
  } catch (err) {
    console.warn(`indexnow: submission failed (ignored): ${err.message}`);
    return false;
  }
}
