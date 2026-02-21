import React from 'react';
import { Heart, Star, ChevronRight } from 'lucide-react';
import { APPS } from '../constants';

const PhoneMockup: React.FC<{ src?: string; alt: string; className?: string }> = ({ src, alt, className }) => (
  <div className={`relative border-8 border-gray-900 rounded-[2.5rem] overflow-hidden bg-black shadow-2xl aspect-[9/19] max-w-[280px] mx-auto ${className}`}>
    {/* Dynamic Island / Notch */}
    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-6 w-1/3 bg-black rounded-b-2xl z-20"></div>
    {src ? (
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={(e) => {
          const img = e.currentTarget;
          if (!img.dataset.fallbackApplied) {
            img.dataset.fallbackApplied = 'true';
            img.src = '/images/screenshot-placeholder.svg';
          }
        }}
      />
    ) : (
      <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-600">
        <span className="text-xs">Screenshot</span>
      </div>
    )}
    {/* Glare reflection */}
    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none z-10"></div>
  </div>
);

const FeaturedApp: React.FC = () => {
  const anniversaryApp = APPS.find(app => app.id === 'anniversary');
  const linkSaverApp = APPS.find(app => app.id === 'link-saver');
  const cardValueApp = APPS.find(app => app.id === 'cardvalue');
  const sunriseApp = APPS.find(app => app.id === 'sunrise');

  if (!anniversaryApp) return null;

  return (
    <section id="featured" className="py-24 bg-white dark:bg-black overflow-hidden relative transition-colors duration-300">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Primary Feature: Anniversary Tracker */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12 mb-12 border border-gray-800 shadow-2xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
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
                    <div className="text-white text-2xl font-bold">
                        250k+
                    </div>
                    <span className="text-sm text-gray-500">Downloads</span>
                </div>
              </div>

              <a href={anniversaryApp.url || '#'} target="_blank" rel="noreferrer" className="inline-flex items-center bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-50 transition-all group">
                View on App Store
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            <div className="order-1 lg:order-2 flex justify-center relative">
                <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full transform scale-75"></div>
                <PhoneMockup src={anniversaryApp.screenshots?.[0]} alt={anniversaryApp.name} className="transform rotate-3 hover:rotate-0 transition-transform duration-500" />
            </div>
          </div>
        </div>

        {/* Secondary Features Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Link Saver */}
          {linkSaverApp && (
            <div className="bg-gray-900 dark:bg-gray-900/50 rounded-3xl p-6 border border-gray-800 hover:border-gray-700 transition-all flex flex-col items-center text-center group backdrop-blur-sm">
               <div className="mb-6 mt-4 transform group-hover:-translate-y-2 transition-transform duration-300">
                  <PhoneMockup src={linkSaverApp.screenshots?.[0]} alt={linkSaverApp.name} className="max-w-[200px]" />
               </div>
               <div className="mt-auto">
                  <h3 className="text-xl font-bold mb-2 text-white">{linkSaverApp.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{linkSaverApp.description}</p>
                  <a href={linkSaverApp.url || '#'} target="_blank" rel="noreferrer" className="text-blue-400 text-sm font-medium group-hover:text-blue-300 flex items-center justify-center">
                    Learn more <ChevronRight className="w-4 h-4 ml-1" />
                  </a>
               </div>
            </div>
          )}

          {/* Card Value */}
          {cardValueApp && (
            <div className="bg-gray-900 dark:bg-gray-900/50 rounded-3xl p-6 border border-gray-800 hover:border-gray-700 transition-all flex flex-col items-center text-center group backdrop-blur-sm">
               <div className="mb-6 mt-4 transform group-hover:-translate-y-2 transition-transform duration-300">
                  <PhoneMockup src={cardValueApp.screenshots?.[0]} alt={cardValueApp.name} className="max-w-[200px]" />
               </div>
               <div className="mt-auto">
                  <h3 className="text-xl font-bold mb-2 text-white">{cardValueApp.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{cardValueApp.description}</p>
                  <a href={cardValueApp.url || '#'} target="_blank" rel="noreferrer" className="text-blue-400 text-sm font-medium group-hover:text-blue-300 flex items-center justify-center">
                    Learn more <ChevronRight className="w-4 h-4 ml-1" />
                  </a>
               </div>
            </div>
          )}

          {/* Sunrise */}
          {sunriseApp && (
            <div className="bg-gray-900 dark:bg-gray-900/50 rounded-3xl p-6 border border-gray-800 hover:border-gray-700 transition-all flex flex-col items-center text-center group backdrop-blur-sm">
               <div className="mb-6 mt-4 transform group-hover:-translate-y-2 transition-transform duration-300">
                  <PhoneMockup src={sunriseApp.screenshots?.[0]} alt={sunriseApp.name} className="max-w-[200px]" />
               </div>
               <div className="mt-auto">
                  <h3 className="text-xl font-bold mb-2 text-white">{sunriseApp.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{sunriseApp.description}</p>
                  <a href={sunriseApp.url || '#'} target="_blank" rel="noreferrer" className="text-blue-400 text-sm font-medium group-hover:text-blue-300 flex items-center justify-center">
                    Learn more <ChevronRight className="w-4 h-4 ml-1" />
                  </a>
               </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
};

export default FeaturedApp;