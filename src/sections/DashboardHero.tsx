import { useEffect, useRef, useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref as dbRef, onValue } from 'firebase/database';
import { gsap } from 'gsap';
import {
  FileText, Printer, Truck, PhoneCall,
  CheckCircle2, AlertCircle, Clock,
  TrendingUp, MapPin,
} from 'lucide-react';

const recentDeliveries = [
  { ref: 'SO-1021', client: 'Acme Furniture Co', address: '123 High St, Birmingham B1 1AA', items: 'Memory Foam Mattress ×10, Pillow Top ×6', date: '24 Mar', status: 'delivered' },
  { ref: 'SO-1020', client: 'SleepWell Retailers', address: '45 Commerce Park, Manchester M1 2BC', items: 'Weighted Blanket ×8, Mattress Protector ×12', date: '24 Mar', status: 'delivered' },
  { ref: 'SO-1019', client: 'Comfort Home Store', address: '78 Retail Ave, Leeds LS1 3DE', items: 'Luxury Bed Sheets ×20', date: '23 Mar', status: 'delivered' },
  { ref: 'SO-1018', client: 'Dream Sleep Outlet', address: '99 Market St, Sheffield S1 2GH', items: 'Down Pillow ×25, Mattress Protector ×10', date: '23 Mar', status: 'delivered' },
  { ref: 'SO-1017', client: 'BedCraft Interiors', address: '12 Kings Rd, London EC1 4AB', items: 'Memory Foam Mattress ×5', date: '22 Mar', status: 'pending' },
  { ref: 'SO-1016', client: 'Nordic Sleep Co', address: 'Unit 8, Trade Park, Bristol BS1 2AB', items: 'Luxury Bed Sheets ×20', date: '22 Mar', status: 'delivered' },
];

const recentCalls = [
  { client: 'Nordic Sleep Co', outcome: 'Delivery instructions updated', time: '13:15', status: 'completed' },
  { client: 'BedCraft Interiors', outcome: 'Call failed — connection error', time: '11:30', status: 'failed' },
  { client: 'Dream Sleep Outlet', outcome: 'Order amended — qty updated', time: '10:45', status: 'completed' },
  { client: 'Comfort Home Store', outcome: 'No answer — voicemail left', time: '10:15', status: 'no-answer' },
  { client: 'SleepWell Retailers', outcome: 'Delivery window confirmed', time: '09:52', status: 'completed' },
  { client: 'Acme Furniture Co', outcome: 'Order confirmed & dispatch arranged', time: '09:30', status: 'completed' },
];



const STATIC_SYSTEMS = [
  { label: 'OneDrive Sync',    status: 'ok' as const, detail: 'Watching Scans folder' },
  { label: 'Make.com Webhook', status: 'ok' as const, detail: 'Receiving page data' },
  { label: 'Google Drive',     status: 'ok' as const, detail: 'Filing processed PDFs' },
];

function getLabelDb() {
  const cfg = {
    apiKey:      import.meta.env.VITE_LABEL_FIREBASE_API_KEY      ?? '',
    authDomain:  import.meta.env.VITE_LABEL_FIREBASE_AUTH_DOMAIN  ?? '',
    databaseURL: import.meta.env.VITE_LABEL_FIREBASE_DATABASE_URL ?? '',
    projectId:   import.meta.env.VITE_LABEL_FIREBASE_PROJECT_ID   ?? '',
  };
  if (!cfg.databaseURL) return null;
  const app = getApps().find(a => a.name === 'grove-labels')
    ?? initializeApp(cfg, 'grove-labels');
  return getDatabase(app);
}

export default function DashboardHero() {
  const [dymoStatus, setDymoStatus] = useState<{ status: 'ok'|'warning'|'offline'; detail: string }>({
    status: 'warning', detail: 'Connecting...',
  });

  useEffect(() => {
    const db = getLabelDb();
    if (!db) {
      setDymoStatus({ status: 'warning', detail: 'Firebase not configured' });
      return;
    }
    const statusRef = dbRef(db, 'bridgeStatus');
    const unsub = onValue(statusRef, (snap) => {
      const data = snap.val();
      if (!data) {
        setDymoStatus({ status: 'warning', detail: 'Bridge never connected' });
        return;
      }
      const lastSeen = data.lastSeen ?? 0;
      const ageMs = Date.now() - lastSeen;
      const ageMins = Math.floor(ageMs / 60000);

      if (!data.online || ageMs > 120000) {
        // Offline if explicitly set offline or heartbeat > 2 minutes old
        setDymoStatus({ status: 'offline', detail: `Last seen ${ageMins}m ago` });
      } else if (!data.dymoService) {
        setDymoStatus({ status: 'warning', detail: 'Bridge online · DYMO service not running' });
      } else if (!data.printerFound) {
        setDymoStatus({ status: 'warning', detail: 'Bridge online · Printer not found' });
      } else {
        setDymoStatus({ status: 'ok', detail: `${data.printerName ?? 'DYMO'} · Connected` });
      }
    }, (err) => {
      console.error('bridgeStatus read error:', err);
      setDymoStatus({ status: 'warning', detail: 'Firebase read error' });
    });
    return () => unsub();
  }, []);

  const systems = [
    ...STATIC_SYSTEMS,
    { label: 'DYMO Bridge', status: dymoStatus.status === 'offline' ? 'warning' as const : dymoStatus.status, detail: dymoStatus.detail },
  ];
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.hero-item',
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out' }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={sectionRef} className="h-full overflow-hidden flex flex-col" style={{ background: '#f8fafc' }}>
      <div className="flex-1 flex flex-col min-h-0 max-w-[1400px] w-full mx-auto px-6 py-4">

        {/* Header — fixed */}
        <div className="flex-shrink-0 mb-3 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-sora font-bold text-xl" style={{ color: '#1e293b' }}>System Overview</h1>
            <p className="font-inter text-xs mt-0.5" style={{ color: '#94a3b8' }}>Live activity across all Grove Bedding automations</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-xs font-semibold" style={{ color: '#166534' }}>All Systems Operational</span>
          </div>
        </div>

        {/* Stat pills — fixed */}
        <div className="hero-item flex-shrink-0 grid grid-cols-4 gap-3 mb-3">
          {[
            { icon: Truck,     label: 'Deliveries Today', value: '12', sub: '4 pending', color: '#0ea5e9', bg: '#f0f9ff', bo: '#bae6fd' },
            { icon: Printer,   label: 'Labels Printed',   value: '32', sub: '3 queued',  color: '#10b981', bg: '#f0fdf4', bo: '#bbf7d0' },
            { icon: FileText,  label: 'PDFs Processed',   value: '14', sub: 'today',     color: '#8b5cf6', bg: '#faf5ff', bo: '#e9d5ff' },
            { icon: PhoneCall, label: 'Calls Made',        value: '7',  sub: '1 failed', color: '#f59e0b', bg: '#fffbeb', bo: '#fde68a' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3 flex items-center gap-3" style={{ background: s.bg, border: `1px solid ${s.bo}` }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#ffffff', border: `1px solid ${s.bo}` }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div>
                <p className="font-sora font-bold text-xl leading-none" style={{ color: '#1e293b' }}>{s.value}</p>
                <p className="font-inter text-[10px] mt-0.5" style={{ color: '#64748b' }}>{s.label}</p>
                <p className="font-mono text-[9px]" style={{ color: s.color }}>{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main grid — fills remaining space, cards scroll internally */}
        <div className="flex-1 min-h-0 grid grid-cols-3 gap-4">

          {/* Deliveries — 2 cols, scrollable list */}
          <div className="col-span-2 hero-item rounded-2xl flex flex-col min-h-0" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div className="flex-shrink-0 px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                  <Truck className="w-3.5 h-3.5" style={{ color: '#0ea5e9' }} />
                </div>
                <div>
                  <p className="font-sora font-semibold text-sm" style={{ color: '#1e293b' }}>Recent Deliveries</p>
                  <p className="font-mono text-[9px]" style={{ color: '#94a3b8' }}>What has been sent and where</p>
                </div>
              </div>
              <div className="flex items-center gap-1" style={{ color: '#10b981' }}>
                <TrendingUp className="w-3 h-3" />
                <span className="font-mono text-[10px]">+12% this week</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              {recentDeliveries.map((d, i) => (
                <div key={i} className="px-4 py-2.5 flex items-start gap-3 hover:bg-slate-50 transition-all" style={{ borderBottom: i < recentDeliveries.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: d.status === 'delivered' ? '#f0fdf4' : '#fffbeb', border: `1px solid ${d.status === 'delivered' ? '#bbf7d0' : '#fde68a'}` }}>
                    {d.status === 'delivered' ? <CheckCircle2 className="w-3 h-3" style={{ color: '#10b981' }} /> : <Clock className="w-3 h-3" style={{ color: '#f59e0b' }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-semibold" style={{ color: '#0ea5e9' }}>{d.ref}</span>
                      <span className="font-sora text-xs font-semibold truncate" style={{ color: '#1e293b' }}>{d.client}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="w-2.5 h-2.5 flex-shrink-0" style={{ color: '#cbd5e1' }} />
                      <p className="font-inter text-[10px] truncate" style={{ color: '#64748b' }}>{d.address}</p>
                    </div>
                    <p className="font-inter text-[10px] truncate" style={{ color: '#94a3b8' }}>{d.items}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-mono text-[10px]" style={{ color: '#94a3b8' }}>{d.date}</p>
                    <div className="flex items-center gap-1 justify-end mt-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: d.status === 'delivered' ? '#10b981' : '#f59e0b' }} />
                      <span className="font-mono text-[9px] capitalize" style={{ color: d.status === 'delivered' ? '#10b981' : '#f59e0b' }}>{d.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div className="hero-item flex flex-col gap-3 min-h-0">

            {/* Recent Calls — scrollable */}
            <div className="flex-1 rounded-2xl flex flex-col min-h-0" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div className="flex-shrink-0 px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                  <PhoneCall className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
                </div>
                <div>
                  <p className="font-sora font-semibold text-sm" style={{ color: '#1e293b' }}>Recent Calls</p>
                  <p className="font-mono text-[9px]" style={{ color: '#94a3b8' }}>Outbound agent activity</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                {recentCalls.map((c, i) => (
                  <div key={i} className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: i < recentCalls.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c.status === 'completed' ? '#10b981' : c.status === 'failed' ? '#ef4444' : '#f59e0b' }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-sora text-xs font-semibold truncate" style={{ color: '#1e293b' }}>{c.client}</p>
                      <p className="font-inter text-[10px] truncate" style={{ color: '#94a3b8' }}>{c.outcome}</p>
                    </div>
                    <p className="font-mono text-[10px] flex-shrink-0" style={{ color: '#94a3b8' }}>{c.time}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* System Health — fixed */}
            <div className="flex-shrink-0 rounded-2xl p-3" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <p className="font-mono text-[9px] uppercase tracking-wider mb-2" style={{ color: '#94a3b8' }}>System Health</p>
              <div className="grid grid-cols-2 gap-1.5">
                {systems.map(s => (
                  <div key={s.label} className="flex items-center gap-1.5 p-2 rounded-lg" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    {s.status === 'ok' ? <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: '#10b981' }} /> : <AlertCircle className="w-3 h-3 flex-shrink-0" style={{ color: '#f59e0b' }} />}
                    <div className="min-w-0">
                      <p className="font-sora text-[10px] font-semibold truncate" style={{ color: '#1e293b' }}>{s.label}</p>
                      <p className="font-inter text-[9px] truncate" style={{ color: '#94a3b8' }}>{s.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
