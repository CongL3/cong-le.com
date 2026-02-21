import React from 'react';
import { ArrowRight, Github, Linkedin, Globe, Twitter } from 'lucide-react';
import { HERO_CONTENT, STATS } from '../constants';

const Hero: React.FC = () => {
  return (
    <section id="hero" className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col items-center text-center">
        {/* Profile Image */}
        <div className="relative mb-8 group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt blur-md"></div>
          <img 
            src={HERO_CONTENT.profileImage} 
            alt={HERO_CONTENT.name} 
            className="relative w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 shadow-2xl object-cover"
            onError={(e) => {
              const img = e.currentTarget;
              if (!img.dataset.fallbackApplied) {
                img.dataset.fallbackApplied = 'true';
                img.src = '/images/profile-placeholder.svg';
              }
            }}
          />
        </div>

        {/* Content */}
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
          {HERO_CONTENT.name}
        </h1>
        <p className="text-xl md:text-2xl text-blue-600 dark:text-blue-400 font-medium mb-3">
          {HERO_CONTENT.title}
        </p>
        <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-6">
          {HERO_CONTENT.subtitle}
        </p>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed mb-8">
          {HERO_CONTENT.blurb}
        </p>

        {/* Social Links */}
        <div className="flex space-x-4 mb-10">
           <a href={HERO_CONTENT.githubLink} target="_blank" rel="noreferrer" className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all">
              <Github className="w-6 h-6" />
           </a>
           <a href={HERO_CONTENT.linkedinLink} target="_blank" rel="noreferrer" className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-all">
              <Linkedin className="w-6 h-6" />
           </a>
           <a href={HERO_CONTENT.xLink} target="_blank" rel="noreferrer" className="p-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all">
              <Twitter className="w-6 h-6" />
           </a>
           <a href={HERO_CONTENT.appStoreLink} target="_blank" rel="noreferrer" className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-all">
              <Globe className="w-6 h-6" />
           </a>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <a
            href="#featured"
            className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-gray-900 dark:bg-white dark:text-black rounded-full hover:bg-black dark:hover:bg-gray-200 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            View Flagship App
            <ArrowRight className="ml-2 h-5 w-5" />
          </a>
          <a
            href={HERO_CONTENT.appStoreLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:border-gray-300 dark:hover:border-gray-600"
          >
            Browse App Store Portfolio
          </a>
        </div>

        {/* Mini Stats - Simplified */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-8 border-t border-gray-100 dark:border-gray-800 pt-10">
          {STATS.map((stat, index) => (
            <div key={index} className="flex flex-col items-center">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;