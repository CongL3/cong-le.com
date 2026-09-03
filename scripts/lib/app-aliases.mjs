/**
 * Historical app slugs that remain reachable for old links but must not be
 * treated as separate indexable product pages.
 *
 * GitHub Pages is static, so the alias documents use a browser redirect plus
 * a canonical/noindex signal. New links must always use the destination slug.
 */
export const APP_ALIASES = {
  'baby-kicks-track-movements': 'baby-kicks-kick-counter',
  'carddex-tcg-scanner-price': 'carddex-tcg-scanner-value',
  'cardkeeper-wallet-passes': 'cardkeeper-wallet-pass-maker',
  'to-do-list-one-focus': 'checklist-to-do-one-focus',
  'golden-hour-light-planner': 'golden-hour-sun-tracker',
  'link-saver-fast-and-easy': 'link-saver-bookmark-manager',
  okaeshi: 'okaeshi-return-gift-tracker',
  'simple-timer-stopwatch-clock': 'simple-timer-stopwatch',
  'uv-index-burn-time-tracker': 'uv-index-widget-burn-time',
};
