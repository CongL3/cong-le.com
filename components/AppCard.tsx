import React from 'react';
import { AppData } from '../types';
import { Smartphone, Star, ArrowUpRight } from 'lucide-react';

const AppCard: React.FC<{ app: AppData }> = ({ app }) => {
  const primaryHref = app.landingPage || app.url || '#';
  const isInternal = Boolean(app.landingPage);

  return (
    <div className="group relative flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:-translate-y-0.5 hover:border-blue-200 dark:hover:border-blue-900/60 focus-within:ring-2 focus-within:ring-blue-500">
      {/* Stretched primary link — whole card clicks through to the landing page (or App Store fallback) */}
      <a
        href={primaryHref}
        {...(isInternal ? {} : { target: '_blank', rel: 'noreferrer' })}
        aria-label={`${app.name} — details`}
        className="absolute inset-0 z-0 rounded-2xl focus:outline-none"
      />

      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm bg-gray-100 dark:bg-gray-700 flex-shrink-0">
          {app.iconUrl ? (
            <img
              src={app.iconUrl}
              alt=""
              width={48}
              height={48}
              loading="lazy"
              className="w-full h-full object-cover"
              onError={(e) => {
                const img = e.currentTarget;
                if (!img.dataset.fallbackApplied) {
                  img.dataset.fallbackApplied = 'true';
                  img.src = '/images/app-placeholder.svg';
                }
              }}
            />
          ) : (
            <div className={`w-full h-full ${app.iconColor} flex items-center justify-center text-white`}>
              <Smartphone className="w-6 h-6" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {app.name}
          </h3>
          <span className="mt-1 inline-block text-[11px] font-medium text-gray-400 dark:text-gray-500">
            {app.category}
          </span>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-gray-500 dark:text-gray-400 line-clamp-2 flex-1">
        {app.description}
      </p>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 text-[11px] font-medium text-gray-400 dark:text-gray-500 min-w-0">
          {app.rating && (
            <span className="inline-flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              {app.rating}
            </span>
          )}
          {app.downloads && <span className="truncate">{app.downloads}</span>}
        </div>
        <a
          href={app.url || '#'}
          target="_blank"
          rel="noreferrer"
          aria-label={`${app.name} on the App Store`}
          className="relative z-10 inline-flex items-center gap-0.5 flex-shrink-0 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 px-2 py-1 -mr-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          App Store
          <ArrowUpRight className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};

export default AppCard;
