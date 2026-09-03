import React from 'react';
import { ArrowUpRight, Download } from 'lucide-react';
import { AVAILABLE_APPS } from '../constants';
import type { AppData } from '../types';

const APP_STORE_PROVIDER_TOKEN = '19678800';

const POCKETGROVE_APP_PAGES: Record<string, string> = {
  anniversary: 'https://pocketgrove.com/apps/anniversary-tracker/',
  'football-career-quest': 'https://pocketgrove.com/apps/football-career-quest/',
  'prime-minister-sim-politics': 'https://pocketgrove.com/apps/prime-minister-sim-politics/',
  'ollama-connect': 'https://pocketgrove.com/apps/ollama-connect/',
  'hoop-quest': 'https://pocketgrove.com/apps/hoop-quest/',
};

const spotlightIds = ['anniversary', 'football-career-quest', 'prime-minister-sim-politics', 'ollama-connect', 'hoop-quest'];

function spotlightStoreUrl(app: AppData): string | null {
  if (!app.url) return null;

  const url = new URL(app.url);
  url.searchParams.set('pt', APP_STORE_PROVIDER_TOKEN);
  url.searchParams.set('ct', `congle-web-spotlight-${app.id}`);
  url.searchParams.set('mt', '8');
  return url.toString();
}

const DownloadSpotlight: React.FC = () => {
  const apps = spotlightIds
    .map((id) => {
      // The legacy catalogue contains a few empty array slots between synced
      // entries; optional chaining keeps the spotlight SSR-safe while the
      // normal app grid continues to filter those slots out.
      const app = AVAILABLE_APPS.find((candidate) => candidate?.id === id);
      const href = POCKETGROVE_APP_PAGES[id];
      return app && href ? { app, href } : null;
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  return (
    <section id="download-spotlight" className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
              <Download className="w-5 h-5" aria-hidden="true" />
              <span className="text-sm font-semibold uppercase tracking-[0.18em]">Try an app</span>
            </div>
            <h2 className="mt-4 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
              A few useful places to start
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-gray-600 dark:text-gray-300">
              Explore a small selection of apps I actively maintain, then follow through to the store page for your device.
            </p>
          </div>
          <a
            href="#apps"
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-blue-300 hover:text-blue-600 dark:border-gray-700 dark:text-gray-200 dark:hover:border-blue-700 dark:hover:text-blue-400 sm:self-auto"
          >
            Browse all 50+ apps
            <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {apps.map(({ app, href }) => {
            const storeUrl = spotlightStoreUrl(app);
            return (
              <article
                key={app.id}
                className="group flex h-full flex-col rounded-2xl border border-gray-200 bg-gray-50 p-5 transition-all hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-700"
              >
                <img src={app.iconUrl} alt="" width={64} height={64} className="h-16 w-16 rounded-2xl shadow-sm" loading="lazy" />
                <h3 className="mt-5 text-lg font-bold leading-snug text-gray-900 dark:text-white">{app.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{app.description}</p>
                <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold">
                  <a
                    href={`${href}?utm_source=congle&utm_medium=referral&utm_campaign=portfolio_downloads&utm_content=${app.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-gray-700 transition-colors hover:text-blue-600 dark:text-gray-200 dark:hover:text-blue-400"
                  >
                    Learn more
                    <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                  </a>
                  {storeUrl ? (
                    <a
                      href={storeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Download
                      <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                    </a>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default DownloadSpotlight;
