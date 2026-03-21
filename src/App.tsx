import { useEffect } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './App.css';

// Import sections
import Header from './sections/Header';
import TopNavigation from './sections/TopNavigation';
import DashboardHero from './sections/DashboardHero';
import StockManagement from './sections/StockManagement';
import AutomationStream from './sections/AutomationStream';
import DispatchTracking from './sections/DispatchTracking';

function App() {

  useEffect(() => {
    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, []);

  return (
    <div className="relative">
      {/* Noise Overlay */}
      <div className="noise-overlay" />

      {/* Header */}
      <Header />

      {/* Top Navigation */}
      <TopNavigation />

      {/* Main Content */}
      <main className="relative pt-16">
        {/* Section 1: Dashboard Hero - pin: true */}
        <section id="dashboard" className="relative z-10 overflow-hidden">
          <DashboardHero />
        </section>

        {/* Section 2: Stock Management */}
        <section id="stock" className="relative z-20 overflow-hidden">
          <StockManagement />
        </section>

        {/* Section 3: Automation Stream */}
        <section id="logs" className="relative z-30 overflow-hidden">
          <AutomationStream />
        </section>

        {/* Section 4: Dispatch Tracking */}
        <section id="dispatch" className="relative z-40 overflow-hidden">
          <DispatchTracking />
        </section>
      </main>
    </div>
  );
}

export default App;
