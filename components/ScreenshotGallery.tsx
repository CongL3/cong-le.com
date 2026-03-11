import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { APPS } from '../constants';

const EXCLUDED_IDS = new Set(['to-do-list', 'couple-days', 'water-plants', 'othello', 'solitaire']);
const appsWithScreenshots = APPS.filter(
  app => app.screenshots && app.screenshots.length > 0 && !EXCLUDED_IDS.has(app.id)
);

const ScreenshotGallery: React.FC = () => {
  const [lightbox, setLightbox] = useState<{ appIdx: number; imgIdx: number } | null>(null);

  const openLightbox = (appIdx: number, imgIdx: number) => setLightbox({ appIdx, imgIdx });
  const closeLightbox = () => setLightbox(null);

  const prev = () => {
    if (!lightbox) return;
    const app = appsWithScreenshots[lightbox.appIdx];
    const total = app.screenshots!.length;
    setLightbox({ ...lightbox, imgIdx: (lightbox.imgIdx - 1 + total) % total });
  };

  const next = () => {
    if (!lightbox) return;
    const app = appsWithScreenshots[lightbox.appIdx];
    const total = app.screenshots!.length;
    setLightbox({ ...lightbox, imgIdx: (lightbox.imgIdx + 1) % total });
  };

  const activeSrc = lightbox
    ? appsWithScreenshots[lightbox.appIdx].screenshots![lightbox.imgIdx]
    : null;
  const activeApp = lightbox ? appsWithScreenshots[lightbox.appIdx] : null;

  return (
    <section id="gallery" className="py-24 bg-gray-50 dark:bg-gray-950 transition-colors duration-300 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl mb-3">
            App Gallery
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Screenshots straight from the App Store.
          </p>
        </div>

        <div className="space-y-14">
          {appsWithScreenshots.map((app, appIdx) => (
            <div key={app.id}>
              {/* App header */}
              <a
                href={app.url || '#'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-3 mb-5 group"
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md flex-shrink-0">
                  {app.iconUrl ? (
                    <img src={app.iconUrl} alt={app.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className={`w-full h-full ${app.iconColor}`} />
                  )}
                </div>
                <span className="text-gray-900 dark:text-white font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {app.name}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {app.screenshots!.length} screenshot{app.screenshots!.length > 1 ? 's' : ''}
                </span>
              </a>

              {/* Horizontal scroll row */}
              <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
                {app.screenshots!.map((src, imgIdx) => (
                  <button
                    key={imgIdx}
                    onClick={() => openLightbox(appIdx, imgIdx)}
                    className="flex-shrink-0 snap-start w-40 sm:w-48 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ring-1 ring-black/5 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <img
                      src={src}
                      alt={`${app.name} screenshot ${imgIdx + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && activeSrc && activeApp && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Prev */}
          {activeApp.screenshots!.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          {/* Image */}
          <img
            src={activeSrc}
            alt={`${activeApp.name} screenshot ${lightbox.imgIdx + 1}`}
            className="max-h-[85vh] max-w-sm w-full rounded-3xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next */}
          {activeApp.screenshots!.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          {/* Caption */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
            <p className="text-white font-medium text-sm">{activeApp.name}</p>
            <p className="text-white/50 text-xs mt-1">
              {lightbox.imgIdx + 1} / {activeApp.screenshots!.length}
            </p>
          </div>
        </div>
      )}
    </section>
  );
};

export default ScreenshotGallery;
