import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
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

gsap.registerPlugin(ScrollTrigger);

function App() {
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Wait for all sections to mount
    const timer = setTimeout(() => {
      const pinned = ScrollTrigger.getAll()
        .filter(st => st.vars.pin)
        .sort((a, b) => a.start - b.start);
      
      const maxScroll = ScrollTrigger.maxScroll(window);
      
      if (!maxScroll || pinned.length === 0) return;

      const pinnedRanges = pinned.map(st => ({
        start: st.start / maxScroll,
        end: (st.end ?? st.start) / maxScroll,
        center: (st.start + ((st.end ?? st.start) - st.start) * 0.5) / maxScroll,
      }));

      ScrollTrigger.create({
        snap: {
          snapTo: (value: number) => {
            const inPinned = pinnedRanges.some(
              r => value >= r.start - 0.02 && value <= r.end + 0.02
            );
            if (!inPinned) return value;

            const target = pinnedRanges.reduce(
              (closest, r) =>
                Math.abs(r.center - value) < Math.abs(closest - value)
                  ? r.center
                  : closest,
              pinnedRanges[0]?.center ?? 0
            );
            return target;
          },
          duration: { min: 0.15, max: 0.35 },
          delay: 0,
          ease: 'power2.out',
        },
      });
    }, 500);

    return () => {
      clearTimeout(timer);
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, []);

  return (
    <div ref={mainRef} className="relative">
      {/* Noise Overlay */}
      <div className="noise-overlay" />

      {/* Header */}
      <Header />

      {/* Top Navigation */}
      <TopNavigation />

      {/* Main Content */}
      <main className="relative pt-16">
        {/* Section 1: Dashboard Hero - pin: true */}
        <section id="dashboard" className="relative z-10">
          <DashboardHero />
        </section>

        {/* Section 2: Stock Management - pin: false */}
        <section id="stock" className="relative z-20">
          <StockManagement />
        </section>

        {/* Section 3: Warehouse Bridge - pin: true */}
        <section id="warehouse" className="relative z-30">
          <WarehouseBridge />
        </section>

        {/* Section 4: Automation Stream - pin: false */}
        <section id="logs" className="relative z-40">
          <AutomationStream />
        </section>

        {/* Section 5: Dispatch Tracking - pin: false */}
        <section id="dispatch" className="relative z-50">
          <DispatchTracking />
        </section>

        {/* Section 6: Contact Panel - pin: true */}
        <section id="contact" className="relative z-[60]">
          <ContactPanel />
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
