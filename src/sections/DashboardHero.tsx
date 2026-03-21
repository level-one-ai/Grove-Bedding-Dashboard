import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
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
  Database
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const automationCards = [
  { icon: Cloud, label: 'WEATHER', desc: 'Order ETD Date changes', progress: 62, sectionId: 'dashboard', color: 'blue' },
  { icon: TrafficCone, label: 'TRAFFIC', desc: 'Spoke Dispatch Routes', progress: 62, sectionId: 'dispatch', color: 'cyan' },
  { icon: Bell, label: 'ALERTS', desc: 'Print Label Automation', progress: 62, sectionId: 'logs', color: 'gold' },
  { icon: Film, label: 'MONITOR', desc: 'Graph Site Monitoring', progress: 62, sectionId: 'dashboard', color: 'purple' },
  { icon: UtensilsCrossed, label: 'STOCK', desc: 'Bedding Stock Levels', progress: 65, sectionId: 'stock', color: 'emerald' },
  { icon: ShoppingBag, label: 'ACCOUNTS', desc: 'Customer Accounts', progress: 45, sectionId: 'stock', color: 'magenta' },
];

const workflowSteps = [
  { icon: Webhook, label: 'Cin7 Omni Webhook', status: 'success', color: '#0096ff' },
  { icon: Brain, label: 'Claude AI Reader', status: 'success', color: '#32dc96' },
  { icon: Truck, label: 'Spoke Dispatch', status: 'success', color: '#00c8ff' },
  { icon: Printer, label: 'Dymo Printer', status: 'error', color: '#ff5096' },
];

const advancedMetrics = [
  { icon: Activity, label: 'System Load', value: '42%', color: 'blue' },
  { icon: Zap, label: 'API Calls/min', value: '1,247', color: 'cyan' },
  { icon: Database, label: 'Active Syncs', value: '8', color: 'emerald' },
];

export default function DashboardHero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const metricsRef = useRef<HTMLDivElement>(null);
  const [showError, setShowError] = useState(true);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Auto-play entrance animation
      const tl = gsap.timeline({ delay: 0.5 });

      // Orb entrance
      tl.fromTo(
        orbRef.current,
        { scale: 0.7, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.2, ease: 'power3.out' },
        0
      );

      // Left panel cards entrance
      const leftCards = leftPanelRef.current?.querySelectorAll('.automation-card');
      if (leftCards) {
        tl.fromTo(
          leftCards,
          { x: '-10vw', opacity: 0 },
          { x: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: 'power2.out' },
          0.2
        );
      }

      // Right panel entrance
      tl.fromTo(
        rightPanelRef.current,
        { x: '10vw', opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, ease: 'power2.out' },
        0.3
      );

      // Metrics entrance
      const metrics = metricsRef.current?.querySelectorAll('.metric-item');
      if (metrics) {
        tl.fromTo(
          metrics,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out' },
          0.6
        );
      }

      // Scroll-driven animation (pinned) — single unified timeline
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=100%',
          pin: true,
          scrub: true,
          anticipatePin: 1,
        },
      });

      // Features fade out (0% – 60%)
      if (leftCards) {
        scrollTl.fromTo(
          leftCards,
          { x: 0, opacity: 1 },
          { x: '-10vw', opacity: 0, stagger: 0.02, ease: 'power1.in' },
          0
        );
      }

      scrollTl.fromTo(
        rightPanelRef.current,
        { x: 0, opacity: 1 },
        { x: '10vw', opacity: 0, ease: 'power1.in' },
        0
      );

      if (metrics) {
        scrollTl.fromTo(
          metrics,
          { y: 0, opacity: 1 },
          { y: 20, opacity: 0, stagger: 0.02, ease: 'power1.in' },
          0
        );
      }

      // Orb zooms in (0% – 80%) then fades out (50% – 100%)
      scrollTl.fromTo(
        orbRef.current,
        { scale: 1 },
        { scale: 1.4, ease: 'power1.in' },
        0
      );

      scrollTl.fromTo(
        orbRef.current,
        { opacity: 1 },
        { opacity: 0, ease: 'power2.in' },
        0.5
      );
    }, sectionRef);

    return () => {
      ctx.revert();
    };
  }, []);

  const handleCardClick = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div
      id="dashboard"
      ref={sectionRef}
      className="relative w-full h-screen overflow-hidden"
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

      {/* Main Content Grid */}
      <div className="relative z-10 w-full h-full grid grid-cols-12 gap-6 px-8 pt-24 pb-20">
        {/* Left Panel - Automation Stream */}
        <div 
          ref={leftPanelRef}
          className="col-span-3 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-sora font-semibold text-sm text-silver/70 tracking-wide-custom uppercase">
              Automation Stream
            </h3>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
              <span className="font-mono text-[10px] text-emerald">Live</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 220px)' }}>
            {automationCards.map((card, index) => (
              <div
                key={index}
                onClick={() => handleCardClick(card.sectionId)}
                className="automation-card glass-card p-3 hover:border-blue/40 transition-all duration-300 cursor-pointer group relative overflow-hidden"
              >
                {/* Hover glow */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${card.color === 'blue' ? 'rgba(0, 150, 255, 0.1)' : card.color === 'cyan' ? 'rgba(0, 200, 255, 0.1)' : card.color === 'emerald' ? 'rgba(50, 220, 150, 0.1)' : card.color === 'magenta' ? 'rgba(255, 80, 150, 0.1)' : 'rgba(150, 100, 255, 0.1)'} 0%, transparent 60%)`,
                  }}
                />
                
                <div className="flex items-start gap-3 relative z-10">
                  <div className="w-8 h-8 rounded-lg bg-navy-700/80 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:border-blue/40 transition-colors">
                    <card.icon className="w-4 h-4 text-blue/80" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-sora font-semibold text-xs text-blue tracking-wide-custom uppercase">
                      {card.label}
                    </p>
                    <p className="font-inter text-xs text-silver/60 mt-0.5 truncate">
                      {card.desc}
                    </p>
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[10px] text-silver/50">{card.progress}%</span>
                      </div>
                      <div className="progress-bar h-1">
                        <div 
                          className="progress-bar-fill animate-pulse-glow"
                          style={{ width: `${card.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center - Sync Orb */}
        <div className="col-span-6 flex flex-col items-center justify-center relative">
          {/* 3D Orb Container */}
          <div
            ref={orbRef}
            className="relative"
            style={{
              width: 'min(38vw, 480px)',
              height: 'min(38vw, 480px)',
            }}
          >
            {/* Orb Glow */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(0, 150, 255, 0.2) 0%, transparent 60%)',
                filter: 'blur(40px)',
              }}
            />

            {/* Orb Image */}
            <div
              className="relative w-full h-full rounded-full overflow-hidden border-2 border-blue/30 glow-blue"
              style={{
                boxShadow: '0 0 60px rgba(0, 150, 255, 0.3), inset 0 0 40px rgba(0, 150, 255, 0.1)',
              }}
            >
              <img
                src="/orb-visual-new.jpg"
                alt="Sync Orb"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Orb Label */}
          <div className="mt-6 text-center">
            <p className="font-inter text-sm text-silver/60">
              Grove Bedding Logistics Hub
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
              <span className="font-mono text-xs text-emerald">System Operational</span>
            </div>
          </div>

          {/* Advanced Metrics */}
          <div ref={metricsRef} className="flex items-center gap-4 mt-8">
            {advancedMetrics.map((metric, index) => (
              <div 
                key={index}
                className="metric-item glass-card px-4 py-2 flex items-center gap-3"
              >
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: `rgba(${metric.color === 'blue' ? '0, 150, 255' : metric.color === 'cyan' ? '0, 200, 255' : '50, 220, 150'}, 0.15)`,
                  }}
                >
                  <metric.icon className="w-4 h-4" style={{ color: metric.color === 'blue' ? '#0096ff' : metric.color === 'cyan' ? '#00c8ff' : '#32dc96' }} />
                </div>
                <div>
                  <p className="font-mono text-[10px] text-silver/50 uppercase">{metric.label}</p>
                  <p className="font-sora font-bold text-sm text-white">{metric.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Workflow Visualizer */}
        <div 
          ref={rightPanelRef}
          className="col-span-3 flex flex-col gap-4"
        >
          <h3 className="font-sora font-semibold text-sm text-silver/70 tracking-wide-custom uppercase">
            Active Workflow
          </h3>

          {/* Order Details Card */}
          <div className="glass-card p-4 hover:border-blue/30 transition-all duration-300">
            <div className="space-y-3">
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

          {/* Workflow Modules */}
          <div className="glass-card p-4">
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

            {/* Error Tooltip */}
            {showError && (
              <div className="mt-4 glass-card border-magenta/30 p-3 relative">
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

          {/* Quick Actions */}
          <div className="glass-card p-4">
            <p className="font-mono text-[10px] text-silver/50 uppercase tracking-wide mb-3">
              Quick Actions
            </p>
            <div className="space-y-2">
              <button className="w-full glass-card p-2 flex items-center gap-2 hover:border-blue/30 transition-all text-left group">
                <div className="w-6 h-6 rounded bg-blue/20 flex items-center justify-center">
                  <Webhook className="w-3 h-3 text-blue" />
                </div>
                <span className="font-inter text-xs text-silver/70 group-hover:text-white transition-colors">Trigger Webhook</span>
              </button>
              <button className="w-full glass-card p-2 flex items-center gap-2 hover:border-emerald/30 transition-all text-left group">
                <div className="w-6 h-6 rounded bg-emerald/20 flex items-center justify-center">
                  <Database className="w-3 h-3 text-emerald" />
                </div>
                <span className="font-inter text-xs text-silver/70 group-hover:text-white transition-colors">Sync Database</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
