import { useState, useEffect } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';
import './App.css';

// Import sections
import Header from './sections/Header';
import TopNavigation from './sections/TopNavigation';
import DashboardHero from './sections/DashboardHero';
import StockManagement from './sections/StockManagement';
import AutomationStream from './sections/AutomationStream';
import DispatchTracking from './sections/DispatchTracking';

export type PageId = 'dashboard' | 'stock' | 'logs' | 'dispatch';

interface FailureAlert {
  id: number;
  event: string;
  message: string;
}

const initialAlerts: FailureAlert[] = [
  { id: 1, event: 'Dymo Print', message: 'Printer offline – retry queued at 09:14' },
];

function App() {
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [failureAlerts, setFailureAlerts] = useState<FailureAlert[]>(initialAlerts);

  const dismissAlert = (id: number) => {
    setFailureAlerts(prev => prev.filter(a => a.id !== id));
  };

  useEffect(() => {
    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, []);

  return (
    <div className="relative overflow-hidden" style={{ height: '100vh', background: '#f5f6fa' }}>
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

      {/* ── Global Failure Popup — bottom-right, always visible ── */}
      {failureAlerts.length > 0 && (
        <div className="fixed bottom-5 right-5 z-[600] flex flex-col gap-2">
          {failureAlerts.map(alert => (
            <div
              key={alert.id}
              className="glass-card w-72 p-4 flex items-start gap-3 shadow-lg"
              style={{
                borderColor: '#fecaca',
                animation: 'slideInRight 0.3s ease-out',
              }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#fef2f2' }}>
                <AlertTriangle className="w-4 h-4" style={{ color: '#ef4444' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sora font-semibold text-sm" style={{ color: '#1e293b' }}>
                  Automation Failed
                </p>
                <p className="font-inter text-xs mt-0.5 leading-relaxed" style={{ color: '#64748b' }}>
                  <span style={{ color: '#ef4444' }}>{alert.event}</span>: {alert.message}
                </p>
                <button
                  className="mt-2 flex items-center gap-1 text-[11px] font-sora font-medium"
                  style={{ color: '#f97316' }}
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry Automation
                </button>
              </div>
              <button
                onClick={() => dismissAlert(alert.id)}
                className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
