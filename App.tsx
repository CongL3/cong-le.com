import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import AppGrid from './components/AppGrid';
import Career from './components/Career';
import Footer from './components/Footer';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white selection:bg-blue-100 selection:text-blue-900 dark:selection:bg-blue-900 dark:selection:text-white transition-colors duration-300 overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <AppGrid />
        <Career />
      </main>
      <Footer />
    </div>
  );
};

export default App;