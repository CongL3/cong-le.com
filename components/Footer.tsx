import React from 'react';
import { HERO_CONTENT } from '../constants';
import { Mail, Github, Linkedin, Globe, Twitter } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer id="contact" className="bg-gray-900 dark:bg-black text-white pt-16 pb-8 border-t border-gray-800 dark:border-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold mb-4">Cong Le</h3>
            <p className="text-gray-400 leading-relaxed mb-6">
              Building digital experiences that matter. Combining enterprise-grade engineering with creative product design.
            </p>
            <div className="flex space-x-4">
               <a href={HERO_CONTENT.githubLink} className="text-gray-400 hover:text-white transition-colors p-2 bg-gray-800 rounded-full">
                  <Github className="w-5 h-5" />
               </a>
               <a href={HERO_CONTENT.linkedinLink} className="text-gray-400 hover:text-white transition-colors p-2 bg-gray-800 rounded-full">
                  <Linkedin className="w-5 h-5" />
               </a>
               <a href={HERO_CONTENT.xLink} className="text-gray-400 hover:text-white transition-colors p-2 bg-gray-800 rounded-full">
                  <Twitter className="w-5 h-5" />
               </a>
               <a href={HERO_CONTENT.appStoreLink} className="text-gray-400 hover:text-white transition-colors p-2 bg-gray-800 rounded-full">
                  <Globe className="w-5 h-5" />
               </a>
            </div>
          </div>

          {/* Contact */}
          <div>
             <h4 className="text-lg font-semibold mb-6 text-gray-100">Contact</h4>
             <div className="space-y-4">
                <a href={`mailto:${HERO_CONTENT.email}`} className="flex items-center text-gray-400 hover:text-blue-400 transition-colors">
                    <Mail className="w-5 h-5 mr-3" />
                    {HERO_CONTENT.email}
                </a>
                <div className="text-gray-500 text-sm mt-4">
                    Available for consulting and interesting opportunities.
                </div>
             </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6 text-gray-100">Explore</h4>
            <ul className="space-y-3">
                <li><a href={HERO_CONTENT.appStoreLink} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors">App Store Portfolio</a></li>
                <li><a href={HERO_CONTENT.githubLink} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors">GitHub Projects</a></li>
                <li><a href={HERO_CONTENT.linkedinLink} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors">LinkedIn Profile</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">
                © {new Date().getFullYear()} Cong Le. All rights reserved.
            </p>
            <p className="text-gray-600 text-xs mt-2 md:mt-0">
                Designed with React & Tailwind
            </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;