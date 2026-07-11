/**
 * accents.mjs
 * Per-app accent colours for generated landing pages.
 *
 * An accent drives the hero gradient tint, the download-button fill, and link
 * accents on a generated page. Colours are chosen from the same family as the
 * homepage aesthetic (blue-600 primary) and all pass white-text contrast so
 * they work as solid button fills in both light and dark mode.
 *
 * Resolution order: curated per-trackId hex → genre fallback → default blue.
 */

// Curated accents for well-known apps (keyed by trackId as a string).
const ACCENT = {
  '6740433779': '#D97706', // Sun Times — amber
  '6760960352': '#4F46E5', // Moon Phases — indigo
  '6760960498': '#D97706', // UV Index — amber
  '6760960439': '#B45309', // Golden Hour — deep amber
  '6743774763': '#CA8A04', // CardDex — gold
  '6761291886': '#E11D48', // LovePet — rose
  '6772072727': '#DB2777', // Anime Chat — pink
  '6768801666': '#7C3AED', // Persona AI — violet
  '6761863969': '#7C3AED', // PrivateChat AI — violet
  '6776417249': '#7C3AED', // Local AI Image Generator — violet
  '6768466507': '#2563EB', // CodingChat AI — blue
  '6760222884': '#B45309', // Poop Tracker — brown/amber
  '6772686797': '#059669', // Tiny Table — emerald
  '6744445553': '#EA580C', // Pomodoro — orange
  '6771269878': '#E11D48', // Jump Rope — rose
  '6746223793': '#0891B2', // Fish Finder — cyan
  '6777125671': '#16A34A', // Football Career Quest — green
  '6747094958': '#4F46E5', // Passport Photo — indigo
  '6765780052': '#4F46E5', // Captions — indigo
  '6740165217': '#7C3AED', // Photo Cleaner — violet
  '6740351118': '#4F46E5', // VidCompress — indigo
  '1580103922': '#0891B2', // Fish Run — cyan
  '6761100038': '#2563EB', // Life Countdown — blue
  '6770217651': '#2563EB', // Age Calculator — blue
};

// Fallback palette keyed by iTunes primaryGenreName.
const GENRE_ACCENT = {
  'Utilities': '#2563EB',        // blue
  'Productivity': '#475569',     // slate
  'Lifestyle': '#E11D48',        // rose
  'Health & Fitness': '#059669', // emerald
  'Entertainment': '#7C3AED',    // violet
  'Games': '#7C3AED',            // violet
  'Photo & Video': '#4F46E5',    // indigo
  'Weather': '#D97706',          // amber
  'Education': '#DC2626',        // red
  'Sports': '#0284C7',           // sky
  'Music': '#DB2777',            // pink
  'Finance': '#059669',          // emerald
  'Travel': '#0891B2',           // cyan
  'Reference': '#4F46E5',        // indigo
  'Books': '#B45309',            // amber
  'Food & Drink': '#EA580C',     // orange
  'Navigation': '#0284C7',       // sky
  'Business': '#475569',         // slate
  'Social Networking': '#7C3AED',// violet
};

const DEFAULT_ACCENT = '#2563EB';

/** Resolve the accent hex for an app. */
export function accentForApp({ trackId, genre } = {}) {
  const key = String(trackId);
  if (ACCENT[key]) return ACCENT[key];
  if (genre && GENRE_ACCENT[genre]) return GENRE_ACCENT[genre];
  return DEFAULT_ACCENT;
}

/** Parse a #rrggbb hex string into {r,g,b}. */
export function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
  const int = m ? parseInt(m[1], 16) : 0x2563eb;
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

/** rgba() string for a hex at a given alpha. */
export function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

export { ACCENT, GENRE_ACCENT, DEFAULT_ACCENT };
