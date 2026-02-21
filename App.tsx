import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import FeaturedApp from './components/FeaturedApp';
import AppGrid from './components/AppGrid';
import Career from './components/Career';
import Footer from './components/Footer';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white selection:bg-blue-100 selection:text-blue-900 dark:selection:bg-blue-900 dark:selection:text-white transition-colors duration-300">
      <Navbar />
      <main>
        <Hero />
        <FeaturedApp />
        <AppGrid />
        <Career />
      </main>
      <Footer />
    </div>
  );
};

export default App;