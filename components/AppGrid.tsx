import React, { useMemo, useState } from 'react';
import { AppCategory } from '../types';
import { APPS } from '../constants';
import AppCard from './AppCard';
import { Search, X } from 'lucide-react';

const AppGrid: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [query, setQuery] = useState('');

  // Only surface categories that actually have apps, in the enum's declared order.
  const categories = useMemo(() => {
    const present = new Set(APPS.map((app) => app.category));
    return ['All', ...Object.values(AppCategory).filter((cat) => present.has(cat))];
  }, []);

  const countForCategory = (cat: string) =>
    cat === 'All' ? APPS.length : APPS.filter((app) => app.category === cat).length;

  const normalizedQuery = query.trim().toLowerCase();

  const filteredApps = APPS.filter((app) => {
    const matchesCategory = selectedCategory === 'All' || app.category === selectedCategory;
    const matchesQuery =
      normalizedQuery === '' ||
      app.name.toLowerCase().includes(normalizedQuery) ||
      app.description.toLowerCase().includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  });

  const hasActiveFilters = selectedCategory !== 'All' || normalizedQuery !== '';
  const clearFilters = () => {
    setSelectedCategory('All');
    setQuery('');
  };

  return (
    <section id="apps" className="py-24 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-100 dark:border-blue-900/50">
            {APPS.length} apps on the App Store
          </span>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl mb-3">
            Browse the Portfolio
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            A focused collection of consumer iOS apps across utility, productivity, and lifestyle categories.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search apps…"
              aria-label="Search apps by name or description"
              className="w-full pl-11 pr-10 py-3 rounded-full bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((category) => {
            const count = countForCategory(category);
            const isActive = selectedCategory === category;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                aria-pressed={isActive}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-black shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {category}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    isActive
                      ? 'bg-white/20 dark:bg-black/20 text-white dark:text-black'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {filteredApps.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredApps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-1">
              No apps match your search.
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
              Try a different keyword or category.
            </p>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <X className="w-4 h-4" />
              Clear filters
            </button>
          </div>
        )}

        {/* Result count when filtering */}
        {hasActiveFilters && filteredApps.length > 0 && (
          <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-8">
            Showing {filteredApps.length} of {APPS.length} apps
            <button onClick={clearFilters} className="ml-2 text-blue-600 dark:text-blue-400 hover:underline font-medium">
              Clear filters
            </button>
          </p>
        )}
      </div>
    </section>
  );
};

export default AppGrid;
