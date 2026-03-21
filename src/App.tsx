import { useEffect } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './App.css';

// Import sections
import Header from './sections/Header';
import TopNavigation from './sections/TopNavigation';
import DashboardHero from './sections/DashboardHero';
import StockManagement from './sections/StockManagement';
import WarehouseBridge from './sections/WarehouseBridge';
import AutomationStream from './sections/AutomationStream';
import DispatchTracking from './sections/DispatchTracking';
import ContactPanel from './sections/ContactPanel';
import Footer from './sections/Footer';

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

        {/* Section 3: Warehouse Bridge - pin: true */}
        <section id="warehouse" className="relative z-30 overflow-hidden">
          <WarehouseBridge />
        </section>

        {/* Section 4: Automation Stream */}
        <section id="logs" className="relative z-40 overflow-hidden">
          <AutomationStream />
        </section>

        {/* Section 5: Dispatch Tracking */}
        <section id="dispatch" className="relative z-50 overflow-hidden">
          <DispatchTracking />
        </section>

        {/* Section 6: Contact Panel - pin: true */}
        <section id="contact" className="relative z-[60] overflow-hidden">
          <ContactPanel />
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
