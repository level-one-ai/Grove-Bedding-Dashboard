import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Leaf, Activity } from 'lucide-react';

export default function Header() {
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, delay: 0.3, ease: 'power2.out' }
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <header
      ref={headerRef}
      className="fixed top-0 left-0 right-0 z-[100] px-6 py-4"
      style={{
        background: 'linear-gradient(180deg, rgba(10, 22, 40, 0.9) 0%, rgba(10, 22, 40, 0.7) 100%)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex items-center justify-between max-w-[1920px] mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue/15 border border-blue/40 flex items-center justify-center glow-blue">
            <Leaf className="w-4 h-4 text-blue" />
          </div>
          <div>
            <span className="font-sora font-semibold text-lg text-white tracking-tight">
              Grove Bedding
            </span>
            <span className="font-mono text-[10px] text-silver/50 ml-2">v2.4.1</span>
          </div>
        </div>

        {/* System Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 glass-card px-3 py-1.5 border-blue/20">
            <Activity className="w-3.5 h-3.5 text-blue animate-pulse" />
            <span className="font-mono text-xs text-silver/70">System Load: 42%</span>
          </div>
          <div className="flex items-center gap-3 glass-card px-4 py-2 border-emerald/20">
            <span className="status-dot status-online" />
            <span className="font-mono text-xs text-silver/80 tracking-wide">
              Dymo 5XL: Online
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
