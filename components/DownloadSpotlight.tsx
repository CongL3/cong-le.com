import React from 'react';
import { ArrowUpRight, Download } from 'lucide-react';
import { APPS } from '../constants';

const POCKETGROVE_APP_PAGES: Record<string, string> = {
  anniversary: 'https://pocketgrove.com/apps/anniversary-tracker/',
  solunar: 'https://pocketgrove.com/apps/solunar-best-fishing-times/',
  'prime-minister-sim-politics': 'https://pocketgrove.com/apps/prime-minister-sim-politics/',
  'ollama-connect': 'https://pocketgrove.com/apps/ollama-connect/',
};

const spotlightIds = ['anniversary', 'solunar', 'prime-minister-sim-politics', 'ollama-connect'];

const DownloadSpotlight: React.FC = () => {
  const apps = spotlightIds
    .map((id) => {
      // The legacy catalogue contains a few empty array slots between synced
      // entries; optional chaining keeps the spotlight SSR-safe while the
      // normal app grid continues to filter those slots out.
      const app = APPS.find((candidate) => candidate?.id === id);
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
          {apps.map(({ app, href }) => (
            <a
              key={app.id}
              href={`${href}?utm_source=congle&utm_medium=referral&utm_campaign=portfolio_downloads&utm_content=${app.id}`}
              target="_blank"
              rel="noreferrer"
              className="group flex h-full flex-col rounded-2xl border border-gray-200 bg-gray-50 p-5 transition-all hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-700"
            >
              <img src={app.iconUrl} alt="" width={64} height={64} className="h-16 w-16 rounded-2xl shadow-sm" loading="lazy" />
              <h3 className="mt-5 text-lg font-bold leading-snug text-gray-900 dark:text-white">{app.name}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{app.description}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 transition-colors group-hover:text-blue-700 dark:text-blue-400 dark:group-hover:text-blue-300">
                See the app
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DownloadSpotlight;
