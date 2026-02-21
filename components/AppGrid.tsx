import React, { useState } from 'react';
import { AppCategory } from '../types';
import { APPS } from '../constants';
import AppCard from './AppCard';

const AppGrid: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Filter apps based on category
  const filteredApps = selectedCategory === 'All' 
    ? APPS 
    : APPS.filter(app => app.category === selectedCategory);

  const categories = ['All', ...Object.values(AppCategory)];

  return (
    <section id="apps" className="py-24 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl mb-3">
            App Portfolio
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            A focused collection of consumer iOS apps across utility, productivity, and lifestyle categories.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedCategory === category
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-black shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredApps.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default AppGrid;