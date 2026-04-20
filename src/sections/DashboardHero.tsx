import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import {
  FileText, Printer, Truck, PhoneCall,
  CheckCircle2, AlertCircle, Clock,
  TrendingUp, MapPin,
} from 'lucide-react';

// ── Mock activity data — will be replaced with real API calls ──────────────────

const recentDeliveries = [
  { ref: 'SO-1021', client: 'Acme Furniture Co', address: '123 High St, Birmingham, B1 1AA', items: 'Memory Foam Mattress ×10, Pillow Top ×6', date: '24 Mar 2026', status: 'delivered' },
  { ref: 'SO-1020', client: 'SleepWell Retailers', address: '45 Commerce Park, Manchester, M1 2BC', items: 'Weighted Blanket ×8, Mattress Protector ×12', date: '24 Mar 2026', status: 'delivered' },
  { ref: 'SO-1019', client: 'Comfort Home Store', address: '78 Retail Ave, Leeds, LS1 3DE', items: 'Luxury Bed Sheets ×20', date: '23 Mar 2026', status: 'delivered' },
  { ref: 'SO-1018', client: 'Dream Sleep Outlet', address: '99 Market St, Sheffield, S1 2GH', items: 'Down Pillow ×25, Mattress Protector ×10', date: '23 Mar 2026', status: 'delivered' },
  { ref: 'SO-1017', client: 'BedCraft Interiors', address: '12 Kings Rd, London, EC1 4AB', items: 'Memory Foam Mattress ×5', date: '22 Mar 2026', status: 'pending' },
];

const pdfStats = [
  { label: 'Processed today', value: '14', color: '#0ea5e9' },
  { label: 'Filed this week', value: '87', color: '#10b981' },
  { label: 'Pending', value: '2', color: '#f59e0b' },
  { label: 'Failed', value: '0', color: '#ef4444' },
];

const recentCalls = [
  { ref: 'CALL-006', client: 'Nordic Sleep Co', outcome: 'Delivery instructions updated', time: '13:15', date: '24 Mar', status: 'completed' },
  { ref: 'CALL-005', client: 'BedCraft Interiors', outcome: 'Call failed — connection error', time: '11:30', date: '24 Mar', status: 'failed' },
  { ref: 'CALL-004', client: 'Dream Sleep Outlet', outcome: 'Order amended — qty updated', time: '10:45', date: '24 Mar', status: 'completed' },
  { ref: 'CALL-003', client: 'Comfort Home Store', outcome: 'No answer — voicemail left', time: '10:15', date: '24 Mar', status: 'no-answer' },
];

const labelStats = [
  { label: 'Printed today', value: '32', color: '#10b981' },
  { label: 'Queued', value: '3', color: '#f59e0b' },
  { label: 'Failed', value: '1', color: '#ef4444' },
  { label: 'This week', value: '187', color: '#0ea5e9' },
];

export default function DashboardHero() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.hero-card',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out', delay: 0.1 }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={sectionRef}
      className="w-full"
      style={{ background: '#f8fafc', paddingBottom: '48px' }}
    >
      <div className="max-w-[1400px] mx-auto px-6 py-6">

        {/* ── Page header ── */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-sora font-bold text-2xl" style={{ color: '#1e293b' }}>System Overview</h1>
            <p className="font-inter text-sm mt-0.5" style={{ color: '#94a3b8' }}>
              Live activity across all Grove Bedding automations
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-xs font-semibold" style={{ color: '#166534' }}>All Systems Operational</span>
          </div>
        </div>

        {/* ── Top stat row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          {[
            { icon: Truck,    label: 'Deliveries Today',    value: '12', sub: '4 pending',   color: '#0ea5e9', bg: '#f0f9ff', bo: '#bae6fd' },
            { icon: Printer,  label: 'Labels Printed',      value: '32', sub: '3 queued',    color: '#10b981', bg: '#f0fdf4', bo: '#bbf7d0' },
            { icon: FileText, label: 'PDFs Processed',      value: '14', sub: 'today',       color: '#8b5cf6', bg: '#faf5ff', bo: '#e9d5ff' },
            { icon: PhoneCall,label: 'Calls Made',           value: '7',  sub: '1 failed',   color: '#f59e0b', bg: '#fffbeb', bo: '#fde68a' },
          ].map(s => (
            <div key={s.label} className="hero-card rounded-2xl p-4 flex items-center gap-3"
              style={{ background: s.bg, border: `1px solid ${s.bo}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: '#ffffff', border: `1px solid ${s.bo}` }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <div>
                <p className="font-sora font-bold text-2xl leading-none" style={{ color: '#1e293b' }}>{s.value}</p>
                <p className="font-inter text-xs mt-0.5" style={{ color: '#64748b' }}>{s.label}</p>
                <p className="font-mono text-[10px] mt-0.5" style={{ color: s.color }}>{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main content grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Deliveries (spans 2 cols) ── */}
          <div className="hero-card lg:col-span-2 rounded-2xl"
            style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                  <Truck className="w-4 h-4" style={{ color: '#0ea5e9' }} />
                </div>
                <div>
                  <h2 className="font-sora font-semibold text-sm" style={{ color: '#1e293b' }}>Recent Deliveries</h2>
                  <p className="font-mono text-[10px]" style={{ color: '#94a3b8' }}>What has been sent and where</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <TrendingUp className="w-3 h-3" style={{ color: '#10b981' }} />
                <span className="font-mono text-[10px]" style={{ color: '#10b981' }}>+12% this week</span>
              </div>
            </div>
            <div className="divide-y" style={{ borderColor: '#f8fafc' }}>
              {recentDeliveries.map((d, i) => (
                <div key={i} className="px-5 py-3 flex items-start gap-3 hover:bg-slate-50 transition-all">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: d.status === 'delivered' ? '#f0fdf4' : '#fffbeb', border: `1px solid ${d.status === 'delivered' ? '#bbf7d0' : '#fde68a'}` }}>
                    {d.status === 'delivered'
                      ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#10b981' }} />
                      : <Clock className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] font-semibold" style={{ color: '#0ea5e9' }}>{d.ref}</span>
                      <span className="font-sora text-xs font-semibold truncate" style={{ color: '#1e293b' }}>{d.client}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="w-2.5 h-2.5 flex-shrink-0" style={{ color: '#cbd5e1' }} />
                      <p className="font-inter text-[10px] truncate" style={{ color: '#64748b' }}>{d.address}</p>
                    </div>
                    <p className="font-inter text-[10px] mt-0.5 truncate" style={{ color: '#94a3b8' }}>{d.items}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-mono text-[10px]" style={{ color: '#94a3b8' }}>{d.date}</p>
                    <div className="mt-1 flex items-center gap-1 justify-end">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: d.status === 'delivered' ? '#10b981' : '#f59e0b' }} />
                      <span className="font-mono text-[9px] capitalize" style={{ color: d.status === 'delivered' ? '#10b981' : '#f59e0b' }}>{d.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right column ── */}
          <div className="flex flex-col gap-5">

            {/* PDF Router stats */}
            <div className="hero-card rounded-2xl"
              style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div className="p-4 flex items-center gap-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#faf5ff', border: '1px solid #e9d5ff' }}>
                  <FileText className="w-4 h-4" style={{ color: '#8b5cf6' }} />
                </div>
                <div>
                  <h3 className="font-sora font-semibold text-sm" style={{ color: '#1e293b' }}>PDF Processing</h3>
                  <p className="font-mono text-[10px]" style={{ color: '#94a3b8' }}>Pages processed & filed</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 p-4">
                {pdfStats.map(s => (
                  <div key={s.label} className="p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <p className="font-sora font-bold text-xl" style={{ color: s.color }}>{s.value}</p>
                    <p className="font-inter text-[10px] mt-0.5" style={{ color: '#94a3b8' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Label printing stats */}
            <div className="hero-card rounded-2xl"
              style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div className="p-4 flex items-center gap-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <Printer className="w-4 h-4" style={{ color: '#10b981' }} />
                </div>
                <div>
                  <h3 className="font-sora font-semibold text-sm" style={{ color: '#1e293b' }}>Label Printing</h3>
                  <p className="font-mono text-[10px]" style={{ color: '#94a3b8' }}>DYMO 5XL activity</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 p-4">
                {labelStats.map(s => (
                  <div key={s.label} className="p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <p className="font-sora font-bold text-xl" style={{ color: s.color }}>{s.value}</p>
                    <p className="font-inter text-[10px] mt-0.5" style={{ color: '#94a3b8' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent calls */}
            <div className="hero-card rounded-2xl"
              style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div className="p-4 flex items-center gap-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                  <PhoneCall className="w-4 h-4" style={{ color: '#f59e0b' }} />
                </div>
                <div>
                  <h3 className="font-sora font-semibold text-sm" style={{ color: '#1e293b' }}>Recent Calls</h3>
                  <p className="font-mono text-[10px]" style={{ color: '#94a3b8' }}>Outbound agent activity</p>
                </div>
              </div>
              <div className="divide-y p-0" style={{ borderColor: '#f8fafc' }}>
                {recentCalls.map((c, i) => (
                  <div key={i} className="px-4 py-2.5 flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{
                      background: c.status === 'completed' ? '#10b981' : c.status === 'failed' ? '#ef4444' : '#f59e0b'
                    }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-sora text-xs font-semibold truncate" style={{ color: '#1e293b' }}>{c.client}</p>
                      <p className="font-inter text-[10px] truncate" style={{ color: '#94a3b8' }}>{c.outcome}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-mono text-[10px]" style={{ color: '#94a3b8' }}>{c.time}</p>
                      <p className="font-mono text-[9px]" style={{ color: '#cbd5e1' }}>{c.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ── System health row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
          {[
            { label: 'OneDrive Sync',     status: 'ok',      detail: 'Watching Scans folder' },
            { label: 'Make.com Webhook',  status: 'ok',      detail: 'Receiving page data' },
            { label: 'Google Drive',      status: 'ok',      detail: 'Filing processed PDFs' },
            { label: 'DYMO Bridge',       status: 'warning', detail: 'Check office PC connection' },
          ].map(s => (
            <div key={s.label} className="hero-card rounded-xl p-3 flex items-center gap-2.5"
              style={{ background: '#ffffff', border: `1px solid ${s.status === 'ok' ? '#e2e8f0' : '#fde68a'}` }}>
              {s.status === 'ok'
                ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#10b981' }} />
                : <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#f59e0b' }} />}
              <div className="min-w-0">
                <p className="font-sora text-xs font-semibold truncate" style={{ color: '#1e293b' }}>{s.label}</p>
                <p className="font-inter text-[10px] truncate" style={{ color: '#94a3b8' }}>{s.detail}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
