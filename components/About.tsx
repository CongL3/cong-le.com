import React from 'react';
import { ABOUT } from '../constants';

const About: React.FC = () => {
  return (
    <section id="about" className="py-24 bg-gray-50 dark:bg-black transition-colors duration-300">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl mb-8 text-center">
          About
        </h2>
        <div className="space-y-5">
          {ABOUT.map((para, index) => (
            <p key={index} className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              {para}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;
