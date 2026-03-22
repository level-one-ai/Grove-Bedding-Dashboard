import { useState, useEffect } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './App.css';

// Import sections
import Header from './sections/Header';
import TopNavigation from './sections/TopNavigation';
import DashboardHero from './sections/DashboardHero';
import StockManagement from './sections/StockManagement';
import AutomationStream from './sections/AutomationStream';
import DispatchTracking from './sections/DispatchTracking';

export type PageId = 'dashboard' | 'stock' | 'logs' | 'dispatch';

function App() {
  const [activePage, setActivePage] = useState<PageId>('dashboard');

  useEffect(() => {
    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, []);

  return (
    <div className="relative overflow-hidden" style={{ height: '100vh' }}>
      {/* Noise Overlay */}
      <div className="noise-overlay" />

      {/* Header */}
      <Header />

      {/* Top Navigation */}
      <TopNavigation activePage={activePage} setActivePage={setActivePage} />

      {/* Main Content — pt-32 clears the fixed header (64px) + fixed nav (~64px) */}
      <main className="relative pt-32 h-full">
        {activePage === 'dashboard' && <DashboardHero key="dashboard" />}
        {activePage === 'stock' && <StockManagement key="stock" />}
        {activePage === 'logs' && <AutomationStream key="logs" />}
        {activePage === 'dispatch' && <DispatchTracking key="dispatch" />}
      </main>
    </div>
  );
}

export default App;
