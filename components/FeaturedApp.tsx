import React from 'react';
import { Heart, Star, ChevronRight } from 'lucide-react';
import { APPS } from '../constants';

const FeaturedApp: React.FC = () => {
  const anniversaryApp = APPS.find(app => app.id === 'anniversary');
  const todoApp = APPS.find(app => app.id === 'to-do-list');
  const waterApp = APPS.find(app => app.id === 'water-plants');
  const babyKicksApp = APPS.find(app => app.id === 'baby-kicks');

  if (!anniversaryApp) return null;

  const screenshot1 = anniversaryApp.screenshots?.[0];
  const screenshot2 = anniversaryApp.screenshots?.[1];

  return (
    <section id="featured" className="py-24 bg-white dark:bg-black overflow-hidden relative transition-colors duration-300">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Primary Feature: Anniversary Tracker */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12 mb-12 border border-gray-800 shadow-2xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left: App info */}
            <div className="order-2 lg:order-1">
              <div className={`inline-flex p-3 rounded-2xl ${anniversaryApp.iconColor} mb-6 shadow-lg shadow-red-900/20`}>
                <Heart className="w-8 h-8 text-white fill-current" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white">
                {anniversaryApp.name}
              </h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                {anniversaryApp.description}
                <span className="block mt-4 text-base text-gray-400">
                  The definitive app for couples. Trusted by 250k+ users to celebrate the moments that matter.
                </span>
              </p>

              <div className="flex gap-8 mb-10">
                <div>
                  <div className="flex items-center text-white text-2xl font-bold">
                    4.7 <Star className="w-5 h-5 ml-1 fill-yellow-400 text-yellow-400" />
                  </div>
                  <span className="text-sm text-gray-500">5k+ Ratings</span>
                </div>
                <div className="w-px bg-gray-700" />
                <div>
                  <div className="text-white text-2xl font-bold">250k+</div>
                  <span className="text-sm text-gray-500">Downloads</span>
                </div>
              </div>

              <a
                href={anniversaryApp.url || '#'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-rose-50 transition-all group"
              >
                View on App Store
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            {/* Right: Screenshots fan */}
            <div className="order-1 lg:order-2 flex justify-center items-center relative min-h-[340px]">
              <div className="absolute inset-0 bg-rose-500/15 blur-3xl rounded-full scale-75 pointer-events-none" />
              <div className="relative flex items-end justify-center w-full">
                {screenshot2 && (
                  <div className="absolute right-[52%] bottom-0 w-[44%] max-w-[200px] z-0 transform -rotate-6 origin-bottom hover:rotate-0 hover:z-20 transition-all duration-500 ease-out cursor-pointer">
                    <img
                      src={screenshot2}
                      alt={`${anniversaryApp.name} screenshot 2`}
                      className="w-full rounded-2xl shadow-2xl ring-1 ring-white/10"
                      loading="lazy"
                    />
                  </div>
                )}
                {screenshot1 && (
                  <div className="relative w-[48%] max-w-[220px] z-10 transform rotate-3 origin-bottom hover:rotate-0 transition-all duration-500 ease-out ml-16">
                    <img
                      src={screenshot1}
                      alt={`${anniversaryApp.name} screenshot`}
                      className="w-full rounded-2xl shadow-2xl ring-1 ring-white/10"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Secondary Features Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {[todoApp, waterApp, babyKicksApp].filter(Boolean).map((app) => (
            <a
              key={app!.id}
              href={app!.url || '#'}
              target="_blank"
              rel="noreferrer"
              className="bg-gray-900/60 dark:bg-gray-900/50 rounded-3xl overflow-hidden border border-gray-800 hover:border-gray-600 transition-all duration-300 group hover:-translate-y-1 flex flex-col"
            >
              {/* Screenshot */}
              {app!.screenshots?.[0] ? (
                <div className="w-full aspect-[9/16] max-h-64 overflow-hidden">
                  <img
                    src={app!.screenshots[0]}
                    alt={app!.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="flex justify-center pt-8 pb-2">
                  <div className="w-20 h-20 rounded-[1.25rem] overflow-hidden shadow-xl ring-1 ring-white/10">
                    <img src={app!.iconUrl} alt={app!.name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                </div>
              )}
              {/* Info */}
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">{app!.name}</h3>
                <p className="text-gray-400 text-sm mb-4 flex-1 leading-relaxed">{app!.description}</p>
                <span className="text-blue-400 text-sm font-medium group-hover:text-blue-300 flex items-center gap-1 transition-colors">
                  View on App Store
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </a>
          ))}
        </div>

      </div>
    </section>
  );
};

export default FeaturedApp;
