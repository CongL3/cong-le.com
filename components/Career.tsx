import React from 'react';
import { EXPERIENCE } from '../constants';
import { Building, Calendar, MapPin, Briefcase } from 'lucide-react';

const Career: React.FC = () => {
  return (
    <section id="career" className="py-24 bg-white dark:bg-black transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl mb-4">
            Professional Journey
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400">
                10+ years across iOS engineering, architecture leadership, and product delivery.
            </p>
        </div>

        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-100 dark:bg-gray-800 md:left-1/2 md:-ml-0.5" />

          <div className="space-y-12">
            {EXPERIENCE.map((job, index) => (
              <div key={job.id} className={`relative flex flex-col md:flex-row ${index % 2 === 0 ? 'md:flex-row-reverse' : ''} items-center md:items-start`}>
                
                {/* Timeline Dot */}
                <div className="absolute left-8 md:left-1/2 -ml-3.5 md:-ml-3.5 mt-1.5 w-7 h-7 rounded-full border-4 border-white dark:border-black bg-blue-600 shadow-sm z-10"></div>

                {/* Content Spacer for Desktop */}
                <div className="hidden md:block md:w-1/2" />

                {/* Content Card */}
                <div className="ml-20 md:ml-0 md:px-8 w-full md:w-1/2">
                  <div className={`bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow ${job.isCurrent ? 'ring-2 ring-blue-50 dark:ring-blue-900 border-blue-100 dark:border-blue-900' : ''}`}>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${job.isCurrent ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
                            {job.isCurrent ? 'Current Role' : 'Past'}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" /> {job.period}
                        </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{job.role}</h3>
                    
                    <div className="flex items-center text-gray-600 dark:text-gray-400 mb-4 text-sm font-medium">
                        <Building className="w-4 h-4 mr-1.5" />
                        {job.company}
                        {job.location && (
                            <>
                                <span className="mx-2 text-gray-300 dark:text-gray-600">|</span>
                                <MapPin className="w-4 h-4 mr-1.5" />
                                {job.location}
                            </>
                        )}
                    </div>

                    <ul className="space-y-2 mb-4">
                        {job.description.map((desc, i) => (
                            <li key={i} className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                                <span className="mr-2 mt-1.5 w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                                {desc}
                            </li>
                        ))}
                    </ul>

                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-50 dark:border-gray-800">
                        {job.technologies.map(tech => (
                            <span key={tech} className="px-2 py-1 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs rounded-md font-medium">
                                {tech}
                            </span>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
             {/* Instructions: Place your resume file named 'cv.pdf' in the root public directory */}
             <a 
                href="./CV.pdf" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
             >
                <Briefcase className="w-4 h-4 mr-2" />
                Download Full Resume (PDF)
            </a>
        </div>
      </div>
    </section>
  );
};

export default Career;