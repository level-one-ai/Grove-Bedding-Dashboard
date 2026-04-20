import { useState, useEffect } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AlertTriangle, X, RefreshCw, Tag, CheckCircle } from 'lucide-react';
import './App.css';

// Import sections
import Header from './sections/Header';
import SideNavigation from './sections/TopNavigation';
import DashboardHero from './sections/DashboardHero';
import StockManagement from './sections/StockManagement';
import AutomationStream from './sections/AutomationStream';
import DispatchTracking from './sections/DispatchTracking';
import LabelManagement from './sections/LabelManagement';
import BirleaOrders from './sections/BirleaOrders';
import OutboundCalls from './sections/OutboundCalls';
import FileManagement from './sections/FileManagement';
import SalesOrders from './sections/SalesOrders';

export type PageId = 'dashboard' | 'stock' | 'logs' | 'dispatch' | 'labels' | 'orders' | 'calls' | 'files' | 'salesorders';

// ── Shared label types exported for child components ──
export interface LabelData {
  id: string;
  orderId: string;
  recipientName: string;
  address1: string;
  address2: string;
  town: string;
  region: string;
  postCode: string;
  phone: string;
  orderType: string;
  items: Array<{ item: string; quantity: number }>;
  status: 'pending' | 'verified' | 'printed';
  createdAt: string;
}

export type NewLabelInput = Omit<LabelData, 'id' | 'status' | 'createdAt'>;

// ── Existing failure alerts ──
interface FailureAlert {
  id: number;
  event: string;
  message: string;
}

interface LabelAlert {
  id: number;
  orderId: string;
  labelId: string;
}

interface OrderAlert {
  id: number;
  orderNumber: string;
  itemCount: number;
}

const initialAlerts: FailureAlert[] = [
  { id: 1, event: 'Dymo Print', message: 'Printer offline – retry queued at 09:14' },
];

// ── Sample labels so the Labels page has content from the start ──
const initialLabels: LabelData[] = [
  {
    id: 'LBL-001',
    orderId: 'SO-1021',
    recipientName: 'Acme Furniture Co',
    address1: '123 High Street',
    address2: 'Warehouse B',
    town: 'Birmingham',
    region: 'West Midlands',
    postCode: 'B1 1AA',
    phone: '0121 555 0100',
    orderType: 'Standard',
    items: [{ item: 'Memory Foam Mattress', quantity: 10 }, { item: 'Pillow Top Queen', quantity: 6 }],
    status: 'pending',
    createdAt: '24 Mar 2026, 08:30',
  },
  {
    id: 'LBL-002',
    orderId: 'SO-1020',
    recipientName: 'SleepWell Retailers',
    address1: '45 Commerce Park',
    address2: '',
    town: 'Manchester',
    region: 'Greater Manchester',
    postCode: 'M1 2BC',
    phone: '0161 555 0200',
    orderType: 'Next Day',
    items: [{ item: 'Weighted Blanket', quantity: 8 }, { item: 'Mattress Protector', quantity: 12 }],
    status: 'verified',
    createdAt: '24 Mar 2026, 07:45',
  },
  {
    id: 'LBL-003',
    orderId: 'SO-1019',
    recipientName: 'Comfort Home Store',
    address1: '78 Retail Avenue',
    address2: 'Unit 3',
    town: 'Leeds',
    region: 'West Yorkshire',
    postCode: 'LS1 3DE',
    phone: '0113 555 0300',
    orderType: 'Standard',
    items: [{ item: 'Luxury Bed Sheets', quantity: 20 }],
    status: 'printed',
    createdAt: '23 Mar 2026, 16:10',
  },
];

function App() {
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [failureAlerts, setFailureAlerts] = useState<FailureAlert[]>(initialAlerts);
  const [labels, setLabels] = useState<LabelData[]>(initialLabels);
  const [labelAlerts, setLabelAlerts] = useState<LabelAlert[]>([]);
  const [orderAlerts, setOrderAlerts] = useState<OrderAlert[]>([]);

  const dismissOrderAlert = (id: number) => {
    setOrderAlerts(prev => prev.filter(a => a.id !== id));
  };

  const handleOrderCreated = (orderNumber: string, itemCount: number) => {
    setOrderAlerts(prev => [...prev, { id: Date.now(), orderNumber, itemCount }]);
  };

  const dismissAlert = (id: number) => {
    setFailureAlerts(prev => prev.filter(a => a.id !== id));
  };

  const dismissLabelAlert = (id: number) => {
    setLabelAlerts(prev => prev.filter(a => a.id !== id));
  };

  const verifyLabel = (id: string) => {
    setLabels(prev => prev.map(l => l.id === id ? { ...l, status: 'verified' } : l));
  };

  const printLabel = (id: string) => {
    setLabels(prev => prev.map(l => l.id === id ? { ...l, status: 'printed' } : l));
  };

  const updateLabel = (id: string, updates: Partial<LabelData>) => {
    setLabels(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  useEffect(() => {
    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, []);

  return (
    <div className="relative flex flex-col" style={{ height: '100vh', overflow: 'hidden', background: '#ffffff' }}>
      {/* Noise Overlay */}
      <div className="noise-overlay" />

      {/* Header */}
      <Header onMenuToggle={() => setSidebarOpen(o => !o)} />

      {/* Sidebar Navigation */}
      <SideNavigation activePage={activePage} setActivePage={setActivePage} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content — pt-16 clears the fixed header (64px) */}
      <main className="relative flex-1 overflow-hidden" style={{ marginTop: '64px' }}>
        {activePage === 'dashboard' && <DashboardHero key="dashboard" />}
        {activePage === 'stock' && <StockManagement key="stock" setActivePage={setActivePage} />}
        {activePage === 'logs' && <AutomationStream key="logs" />}
        {activePage === 'dispatch' && <DispatchTracking key="dispatch" />}
        {activePage === 'labels' && (
          <LabelManagement
            key="labels"
            labels={labels}
            onVerify={verifyLabel}
            onPrint={printLabel}
            onUpdate={updateLabel}
          />
        )}
        {activePage === 'orders' && (
          <BirleaOrders key="orders" onOrderCreated={handleOrderCreated} />
        )}
        {activePage === 'calls' && <OutboundCalls key="calls" />}
        {activePage === 'files' && <FileManagement key="files" />}
        {activePage === 'salesorders' && <SalesOrders key="salesorders" />}
      </main>

      {/* ── Order Created Notifications — bottom-right ── */}
      {orderAlerts.length > 0 && (
        <div className="fixed bottom-5 right-5 z-[600] flex flex-col gap-2">
          {orderAlerts.map(alert => (
            <div
              key={alert.id}
              className="glass-card w-80 p-4 flex items-start gap-3 shadow-lg"
              style={{ borderColor: '#fde68a', animation: 'slideInRight 0.3s ease-out' }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#fffbeb' }}>
                <AlertTriangle className="w-4 h-4" style={{ color: '#d97706' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sora font-semibold text-sm" style={{ color: '#1e293b' }}>
                  Low Stock Order Pending
                </p>
                <p className="font-inter text-xs mt-0.5 leading-relaxed" style={{ color: '#64748b' }}>
                  Order <span className="font-mono" style={{ color: '#d97706' }}>{alert.orderNumber}</span> created for {alert.itemCount} low-stock item{alert.itemCount !== 1 ? 's' : ''} — awaiting your approval
                </p>
                <button
                  onClick={() => { setActivePage('orders'); dismissOrderAlert(alert.id); }}
                  className="mt-2 flex items-center gap-1 text-[11px] font-sora font-medium"
                  style={{ color: '#0ea5e9' }}
                >
                  <RefreshCw className="w-3 h-3" />
                  Review &amp; Approve Order
                </button>
              </div>
              <button
                onClick={() => dismissOrderAlert(alert.id)}
                className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Label Generated Notifications — bottom-right ── */}
      {labelAlerts.length > 0 && (
        <div className="fixed bottom-5 right-5 z-[600] flex flex-col gap-2">
          {labelAlerts.map(alert => (
            <div
              key={alert.id}
              className="glass-card w-80 p-4 flex items-start gap-3 shadow-lg"
              style={{
                borderColor: '#bae6fd',
                animation: 'slideInRight 0.3s ease-out',
              }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#f0f9ff' }}>
                <Tag className="w-4 h-4" style={{ color: '#0ea5e9' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sora font-semibold text-sm" style={{ color: '#1e293b' }}>
                  Label Generated
                </p>
                <p className="font-inter text-xs mt-0.5 leading-relaxed" style={{ color: '#64748b' }}>
                  Order <span className="font-mono" style={{ color: '#0ea5e9' }}>{alert.orderId}</span> — awaiting verification before printing
                </p>
                <button
                  onClick={() => { setActivePage('labels'); dismissLabelAlert(alert.id); }}
                  className="mt-2 flex items-center gap-1 text-[11px] font-sora font-medium"
                  style={{ color: '#0ea5e9' }}
                >
                  <CheckCircle className="w-3 h-3" />
                  Review &amp; Verify Label
                </button>
              </div>
              <button
                onClick={() => dismissLabelAlert(alert.id)}
                className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Global Failure Popup — bottom-right, always visible ── */}
      {failureAlerts.length > 0 && (
        <div
          className="fixed z-[600] flex flex-col gap-2"
          style={{
            bottom: `${20 + (labelAlerts.length + orderAlerts.length) * 88}px`,
            right: '20px',
            transition: 'bottom 0.3s ease',
          }}
        >
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
                  style={{ color: '#0ea5e9' }}
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
