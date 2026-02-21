import React from 'react';
import { AppData } from '../types';
import { Smartphone, ExternalLink } from 'lucide-react';

const AppCard: React.FC<{ app: AppData }> = ({ app }) => (
  <div className="group bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:-translate-y-1">
    <div className="flex items-start justify-between mb-4">
      <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md bg-gray-100 dark:bg-gray-700">
        {app.iconUrl ? (
           <img
             src={app.iconUrl}
             alt={app.name}
             className="w-full h-full object-cover"
             loading="lazy"
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
             <Smartphone className="w-8 h-8" />
           </div>
        )}
      </div>
      <span className="px-3 py-1 rounded-full bg-gray-50 dark:bg-gray-700 text-xs font-medium text-gray-500 dark:text-gray-300 border border-gray-100 dark:border-gray-600">
        {app.category}
      </span>
    </div>
    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{app.name}</h3>
    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-4 line-clamp-2">
      {app.description}
    </p>
    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50 dark:border-gray-700">
        <div className="flex items-center text-xs font-medium text-gray-400 dark:text-gray-500">
            {app.downloads && <span>{app.downloads} Downloads</span>}
        </div>
        <a href={app.url || '#'} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
            <ExternalLink className="w-4 h-4" />
        </a>
    </div>
  </div>
);

export default AppCard;
