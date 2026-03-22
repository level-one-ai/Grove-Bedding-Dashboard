import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import {
  Cloud,
  TrafficCone,
  Bell,
  Film,
  UtensilsCrossed,
  ShoppingBag,
  RefreshCw,
  AlertCircle,
  Webhook,
  Brain,
  Truck,
  Printer,
  Activity,
  Database,
  CheckCircle2,
} from 'lucide-react';

const automationCards = [
  { icon: Cloud, label: 'WEATHER', desc: 'Order ETD Date changes', progress: 62, color: '#3b82f6' },
  { icon: TrafficCone, label: 'TRAFFIC', desc: 'Spoke Dispatch Routes', progress: 62, color: '#0ea5e9' },
  { icon: Bell, label: 'ALERTS', desc: 'Print Label Automation', progress: 62, color: '#f59e0b' },
  { icon: Film, label: 'MONITOR', desc: 'Graph Site Monitoring', progress: 62, color: '#8b5cf6' },
  { icon: UtensilsCrossed, label: 'STOCK', desc: 'Bedding Stock Levels', progress: 65, color: '#22c55e' },
  { icon: ShoppingBag, label: 'ACCOUNTS', desc: 'Customer Accounts', progress: 45, color: '#f97316' },
];

const workflowSteps = [
  { icon: Webhook, label: 'Cin7 Omni Webhook', status: 'success', color: '#3b82f6' },
  { icon: Brain, label: 'Claude AI Reader', status: 'success', color: '#22c55e' },
  { icon: Truck, label: 'Spoke Dispatch', status: 'success', color: '#0ea5e9' },
  { icon: Printer, label: 'Dymo Printer', status: 'error', color: '#ef4444' },
];

const ordersToday = [
  { ref: 'SO-402', client: 'Acme Furniture Co.', time: '09:14 AM' },
  { ref: 'SO-403', client: 'SleepWell Retailers', time: '09:15 AM' },
  { ref: 'SO-404', client: 'Comfort Home Store', time: '09:16 AM' },
  { ref: 'SO-1020', client: 'Dream Sleep Outlet', time: '09:30 AM' },
  { ref: 'SO-1021', client: 'Bedding World', time: '09:45 AM' },
  { ref: 'SO-1022', client: 'Rest & Relax Co.', time: '10:00 AM' },
];

const activeSyncs = [
  { from: 'Cin7 Omni', to: 'Shopify' },
  { from: 'Customer DB', to: 'Mailchimp' },
  { from: 'Order Feed', to: 'Spoke' },
  { from: 'Stock Levels', to: 'WMS' },
  { from: 'Invoice API', to: 'Xero' },
  { from: 'Route Data', to: 'Maps API' },
  { from: 'Printer Queue', to: 'Dymo 5XL' },
  { from: 'Label Gen', to: 'PDF Store' },
];

export default function DashboardHero() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        sectionRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      id="dashboard"
      ref={sectionRef}
      className="relative w-full h-full overflow-hidden"
      style={{ background: '#f5f6fa' }}
    >
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage: `radial-gradient(circle, #cbd5e1 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
        }}
      />

      {/* Main Content — 3-column layout */}
      <div className="relative z-10 w-full h-full grid grid-cols-12 gap-4 px-8 pt-6 pb-4">

        {/* ── Left Panel: Automation Stream ── */}
        <div className="col-span-3 flex flex-col gap-3 min-h-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-sora font-semibold text-sm tracking-wide-custom uppercase" style={{ color: '#64748b' }}>
              Automation Stream
            </h3>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
              <span className="font-mono text-[10px] text-emerald">Live</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 overflow-y-auto flex-1 pr-1">
            {automationCards.map((card, index) => (
              <div
                key={index}
                className="glass-card p-3 hover:shadow-md transition-all duration-300 group cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${card.color}15`, border: `1px solid ${card.color}30` }}
                  >
                    <card.icon className="w-4 h-4" style={{ color: card.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-sora font-semibold text-xs tracking-wide-custom uppercase" style={{ color: card.color }}>
                      {card.label}
                    </p>
                    <p className="font-inter text-xs mt-0.5 truncate" style={{ color: '#64748b' }}>{card.desc}</p>
                    <div className="mt-2">
                      <span className="font-mono text-[10px]" style={{ color: '#94a3b8' }}>{card.progress}%</span>
                      <div className="progress-bar h-1 mt-1">
                        <div className="progress-bar-fill" style={{ width: `${card.progress}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Center: System Overview ── */}
        <div className="col-span-6 flex flex-col gap-3 min-h-0">

          {/* Hub Status Header */}
          <div className="glass-card p-4 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="font-sora font-bold text-xl tracking-tight" style={{ color: '#1e293b' }}>Grove Bedding</h2>
              <p className="font-inter text-[10px] mt-0.5 uppercase tracking-widest" style={{ color: '#94a3b8' }}>
                Logistics Operations Hub
              </p>
            </div>
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
              style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
            >
              <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
              <span className="font-mono text-xs text-emerald">All Systems Operational</span>
            </div>
          </div>

          {/* KPI area: System Load + stacked Orders+Syncs */}
          <div className="grid grid-cols-3 gap-3 flex-1 min-h-0">

            {/* System Load */}
            <div className="glass-card p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#fff7ed' }}>
                  <Activity className="w-4 h-4" style={{ color: '#f97316' }} />
                </div>
                <p className="font-mono text-[10px] uppercase tracking-wide" style={{ color: '#94a3b8' }}>System Load</p>
              </div>
              <div>
                <p className="font-sora font-bold text-3xl" style={{ color: '#1e293b' }}>42%</p>
                <div className="progress-bar h-1.5 mt-2">
                  <div className="progress-bar-fill" style={{ width: '42%' }} />
                </div>
              </div>
            </div>

            {/* Orders Today + Active Syncs stacked */}
            <div className="col-span-2 flex flex-col gap-3 min-h-0">

              {/* Orders Today — expanded with list */}
              <div className="glass-card p-4 flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-3 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#fce7f3' }}>
                      <ShoppingBag className="w-3.5 h-3.5" style={{ color: '#db2777' }} />
                    </div>
                    <p className="font-mono text-[10px] uppercase tracking-wide" style={{ color: '#94a3b8' }}>Orders Today</p>
                  </div>
                  <span className="font-sora font-bold text-2xl" style={{ color: '#1e293b' }}>47</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-0 pr-1 min-h-0">
                  {ordersToday.map((order, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-1.5"
                      style={{ borderBottom: idx < ordersToday.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-[10px] flex-shrink-0" style={{ color: '#f97316' }}>{order.ref}</span>
                        <span className="font-inter text-xs truncate" style={{ color: '#334155' }}>{order.client}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                        <span className="font-mono text-[10px]" style={{ color: '#94a3b8' }}>{order.time}</span>
                        <CheckCircle2 className="w-3 h-3" style={{ color: '#22c55e' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Syncs — expanded with list */}
              <div className="glass-card p-4 flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-3 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#ecfdf5' }}>
                      <Database className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />
                    </div>
                    <p className="font-mono text-[10px] uppercase tracking-wide" style={{ color: '#94a3b8' }}>Active Syncs</p>
                  </div>
                  <span className="font-sora font-bold text-2xl" style={{ color: '#1e293b' }}>8</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-0 pr-1 min-h-0">
                  {activeSyncs.map((sync, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-1.5"
                      style={{ borderBottom: idx < activeSyncs.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-inter text-xs font-medium" style={{ color: '#334155' }}>{sync.from}</span>
                        <span className="font-mono text-[10px]" style={{ color: '#cbd5e1' }}>→</span>
                        <span className="font-inter text-xs" style={{ color: '#64748b' }}>{sync.to}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald" />
                        <span className="font-mono text-[10px] text-emerald">Active</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ── Right Panel: Active Workflow ── */}
        <div className="col-span-3 flex flex-col gap-3 min-h-0 overflow-y-auto">
          <h3 className="font-sora font-semibold text-sm tracking-wide-custom uppercase flex-shrink-0" style={{ color: '#64748b' }}>
            Active Workflow
          </h3>

          {/* Order Details */}
          <div className="glass-card p-4 flex-shrink-0">
            <div className="space-y-2.5">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wide" style={{ color: '#94a3b8' }}>Order</p>
                <p className="font-sora font-semibold text-lg" style={{ color: '#1e293b' }}>SO-1020</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wide" style={{ color: '#94a3b8' }}>Category</p>
                <p className="font-inter text-sm" style={{ color: '#64748b' }}>Bedding & Mattress</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wide" style={{ color: '#94a3b8' }}>Source</p>
                <p className="font-inter text-sm" style={{ color: '#3b82f6' }}>OneDrive PDF Upload</p>
              </div>
            </div>
          </div>

          {/* Workflow Processing Chain */}
          <div className="glass-card p-4 flex-shrink-0">
            <p className="font-mono text-[10px] uppercase tracking-wide mb-4" style={{ color: '#94a3b8' }}>Processing Chain</p>
            <div className="flex items-center justify-between">
              {workflowSteps.map((step, index) => (
                <div key={index} className="flex items-center">
                  <div
                    className="workflow-module"
                    style={{
                      borderColor: step.color,
                      boxShadow: `0 0 10px ${step.color}30`,
                    }}
                    title={step.label}
                  >
                    <step.icon className="w-5 h-5" style={{ color: step.color }} />
                  </div>
                  {index < workflowSteps.length - 1 && (
                    <div
                      className="w-4 h-px mx-1"
                      style={{
                        background: `linear-gradient(90deg, ${workflowSteps[index].color}60, ${workflowSteps[index + 1].color}40)`,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 px-1">
              {workflowSteps.map((step, index) => (
                <span key={index} className="font-mono text-[8px] w-12 text-center truncate" style={{ color: '#94a3b8' }}>
                  {step.label.split(' ')[0]}
                </span>
              ))}
            </div>

            {/* Error notice — removed from here, now in global popup */}
            <div
              className="mt-4 p-3 rounded-xl flex items-start gap-2"
              style={{ background: '#fef2f2', border: '1px solid #fecaca' }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
              <div>
                <p className="font-sora font-semibold text-xs" style={{ color: '#dc2626' }}>Printer Offline</p>
                <p className="font-inter text-[10px] mt-0.5" style={{ color: '#64748b' }}>Communication Error</p>
              </div>
            </div>
            <button className="mt-3 w-full btn-outline text-xs py-2 flex items-center justify-center gap-2">
              <RefreshCw className="w-3 h-3" />
              Retry Automation
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
