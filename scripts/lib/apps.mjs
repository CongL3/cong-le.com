/**
 * apps.mjs
 * Shared app registry for the blog/publishing pipeline.
 * Every post's `app` frontmatter must reference one of these slugs.
 */

const SITE_URL = 'https://www.cong-le.com';

/** slug -> { name, trackId, oneLiner } */
const APPS = {
  'frankly-ai': {
    name: 'Frankly AI: Uncensored Chat',
    trackId: '6766366146',
    oneLiner: 'An uncensored AI chat companion that talks about anything, honestly.',
  },
  'ollama-connect': {
    name: 'Ollama Connect',
    trackId: '6769891596',
    oneLiner: 'Run local Ollama models from your iPhone — private, fast, offline-friendly.',
  },
  'baby-screen-lock': {
    name: 'Baby Screen Lock: Kid Safe',
    trackId: '6761378897',
    oneLiner: 'Lock the screen so babies and toddlers can watch without tapping anything.',
  },
  'hoop-quest': {
    name: 'Hoop Quest: Basketball Sim',
    trackId: '6775279715',
    oneLiner: 'Build your baller and climb from the streets to the pros in this basketball sim.',
  },
  'solunar-fishing': {
    name: 'Solunar: Best Fishing Times',
    trackId: '6760960543',
    oneLiner: 'Solunar tables that pin down the best times to fish each day.',
  },
  'anniversary-tracker': {
    name: 'Anniversary Tracker',
    trackId: '1570714816',
    oneLiner: 'Never forget an anniversary, birthday, or milestone again.',
  },
};

/**
 * Resolve full metadata for an app slug.
 * Returns null if the slug is unknown.
 */
export function getApp(slug) {
  const app = APPS[slug];
  if (!app) return null;
  return {
    slug,
    name: app.name,
    trackId: app.trackId,
    oneLiner: app.oneLiner,
    icon: `/images/apps/${app.trackId}/icon.jpg`,
    landingPage: `/apps/${slug}/`,
    storeUrl: `https://apps.apple.com/app/id${app.trackId}?ct=congle-web-${slug}&pt=19678800`,
  };
}

export { APPS, SITE_URL };
