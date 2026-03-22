import { useEffect, useRef, useState } from 'react';
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
  Zap,
  Database,
} from 'lucide-react';

const automationCards = [
  { icon: Cloud, label: 'WEATHER', desc: 'Order ETD Date changes', progress: 62, color: 'blue' },
  { icon: TrafficCone, label: 'TRAFFIC', desc: 'Spoke Dispatch Routes', progress: 62, color: 'cyan' },
  { icon: Bell, label: 'ALERTS', desc: 'Print Label Automation', progress: 62, color: 'gold' },
  { icon: Film, label: 'MONITOR', desc: 'Graph Site Monitoring', progress: 62, color: 'purple' },
  { icon: UtensilsCrossed, label: 'STOCK', desc: 'Bedding Stock Levels', progress: 65, color: 'emerald' },
  { icon: ShoppingBag, label: 'ACCOUNTS', desc: 'Customer Accounts', progress: 45, color: 'magenta' },
];

const workflowSteps = [
  { icon: Webhook, label: 'Cin7 Omni Webhook', status: 'success', color: '#0096ff' },
  { icon: Brain, label: 'Claude AI Reader', status: 'success', color: '#32dc96' },
  { icon: Truck, label: 'Spoke Dispatch', status: 'success', color: '#00c8ff' },
  { icon: Printer, label: 'Dymo Printer', status: 'error', color: '#ff5096' },
];

export default function DashboardHero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [showError, setShowError] = useState(true);

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
      style={{
        background: 'linear-gradient(180deg, #0a1628 0%, #0d1e36 50%, #0a1628 100%)',
      }}
    >
      {/* Animated Background Grid */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 150, 255, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 150, 255, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            transform: 'perspective(500px) rotateX(60deg)',
            transformOrigin: 'center top',
          }}
        />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Main Content — 3-column layout */}
      <div className="relative z-10 w-full h-full grid grid-cols-12 gap-4 px-8 pt-6 pb-4">

        {/* ── Left Panel: Automation Stream ── */}
        <div className="col-span-3 flex flex-col gap-3 min-h-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-sora font-semibold text-sm text-silver/70 tracking-wide-custom uppercase">
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
                className="automation-card glass-card p-3 hover:border-blue/40 transition-all duration-300 group relative overflow-hidden"
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${
                      card.color === 'blue' ? 'rgba(0, 150, 255, 0.1)' :
                      card.color === 'cyan' ? 'rgba(0, 200, 255, 0.1)' :
                      card.color === 'emerald' ? 'rgba(50, 220, 150, 0.1)' :
                      card.color === 'magenta' ? 'rgba(255, 80, 150, 0.1)' :
                      'rgba(150, 100, 255, 0.1)'
                    } 0%, transparent 60%)`,
                  }}
                />
                <div className="flex items-start gap-3 relative z-10">
                  <div className="w-8 h-8 rounded-lg bg-navy-700/80 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <card.icon className="w-4 h-4 text-blue/80" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-sora font-semibold text-xs text-blue tracking-wide-custom uppercase">
                      {card.label}
                    </p>
                    <p className="font-inter text-xs text-silver/60 mt-0.5 truncate">{card.desc}</p>
                    <div className="mt-2">
                      <span className="font-mono text-[10px] text-silver/50">{card.progress}%</span>
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
              <h2 className="font-sora font-bold text-xl text-white tracking-tight">Grove Bedding</h2>
              <p className="font-inter text-[10px] text-silver/50 mt-0.5 uppercase tracking-widest">
                Logistics Operations Hub
              </p>
            </div>
            <div className="flex items-center gap-2 glass-card px-3 py-1.5 border-emerald/20">
              <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
              <span className="font-mono text-xs text-emerald">All Systems Operational</span>
            </div>
          </div>

          {/* KPI Grid — 2 × 2 */}
          <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">

            {/* System Load */}
            <div className="glass-card p-5 flex flex-col gap-3 hover:border-blue/40 transition-all duration-300">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue/20 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-blue" />
                </div>
                <p className="font-mono text-[10px] text-silver/50 uppercase tracking-wide">System Load</p>
              </div>
              <div>
                <p className="font-sora font-bold text-3xl text-white">42%</p>
                <div className="progress-bar h-1.5 mt-2">
                  <div className="progress-bar-fill" style={{ width: '42%' }} />
                </div>
              </div>
            </div>

            {/* API Calls / min */}
            <div className="glass-card p-5 flex flex-col gap-3 hover:border-cyan/40 transition-all duration-300">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0, 200, 255, 0.15)' }}>
                  <Zap className="w-4 h-4" style={{ color: '#00c8ff' }} />
                </div>
                <p className="font-mono text-[10px] text-silver/50 uppercase tracking-wide">API Calls / min</p>
              </div>
              <p className="font-sora font-bold text-3xl text-white">1,247</p>
            </div>

            {/* Active Syncs */}
            <div className="glass-card p-5 flex flex-col gap-3 hover:border-emerald/40 transition-all duration-300">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald/20 flex items-center justify-center">
                  <Database className="w-4 h-4 text-emerald" />
                </div>
                <p className="font-mono text-[10px] text-silver/50 uppercase tracking-wide">Active Syncs</p>
              </div>
              <p className="font-sora font-bold text-3xl text-white">8</p>
            </div>

            {/* Orders Today */}
            <div className="glass-card p-5 flex flex-col gap-3 hover:border-magenta/40 transition-all duration-300">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-magenta/20 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-magenta" />
                </div>
                <p className="font-mono text-[10px] text-silver/50 uppercase tracking-wide">Orders Today</p>
              </div>
              <p className="font-sora font-bold text-3xl text-white">47</p>
            </div>

          </div>
        </div>

        {/* ── Right Panel: Active Workflow ── */}
        <div className="col-span-3 flex flex-col gap-3 min-h-0 overflow-y-auto">
          <h3 className="font-sora font-semibold text-sm text-silver/70 tracking-wide-custom uppercase flex-shrink-0">
            Active Workflow
          </h3>

          {/* Order Details */}
          <div className="glass-card p-4 hover:border-blue/30 transition-all duration-300 flex-shrink-0">
            <div className="space-y-2.5">
              <div>
                <p className="font-mono text-[10px] text-silver/50 uppercase tracking-wide">Order</p>
                <p className="font-sora font-semibold text-lg text-white">SO-1020</p>
              </div>
              <div>
                <p className="font-mono text-[10px] text-silver/50 uppercase tracking-wide">Category</p>
                <p className="font-inter text-sm text-silver/70">Bedding & Mattress</p>
              </div>
              <div>
                <p className="font-mono text-[10px] text-silver/50 uppercase tracking-wide">Source</p>
                <p className="font-inter text-sm text-blue">OneDrive PDF Upload</p>
              </div>
            </div>
          </div>

          {/* Workflow Processing Chain */}
          <div className="glass-card p-4 flex-shrink-0">
            <p className="font-mono text-[10px] text-silver/50 uppercase tracking-wide mb-4">Processing Chain</p>
            <div className="flex items-center justify-between">
              {workflowSteps.map((step, index) => (
                <div key={index} className="flex items-center">
                  <div
                    className={`workflow-module ${step.status === 'error' ? 'error' : 'active'}`}
                    style={{
                      borderColor: step.color,
                      boxShadow: step.status === 'error'
                        ? `0 0 20px ${step.color}60`
                        : `0 0 15px ${step.color}40`,
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
                <span key={index} className="font-mono text-[8px] text-silver/40 w-12 text-center truncate">
                  {step.label.split(' ')[0]}
                </span>
              ))}
            </div>

            {/* Error notice */}
            {showError && (
              <div className="mt-4 glass-card border-magenta/30 p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-magenta flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-sora font-semibold text-xs text-magenta">Printer Offline</p>
                    <p className="font-inter text-[10px] text-silver/60 mt-0.5">Communication Error</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowError(false)}
                  className="mt-3 w-full btn-outline text-xs py-2 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry Automation
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
