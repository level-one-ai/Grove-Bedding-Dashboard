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
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid #e2e8f0',
      }}
    >
      <div className="flex items-center justify-between max-w-[1920px] mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}
          >
            <Leaf className="w-4 h-4" style={{ color: '#0ea5e9' }} />
          </div>
          <div>
            <span className="font-sora font-semibold text-lg tracking-tight" style={{ color: '#1e293b' }}>
              Grove Bedding
            </span>
            <span className="font-mono text-[10px] ml-2" style={{ color: '#94a3b8' }}>v2.4.1</span>
          </div>
        </div>

        {/* System Status */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
          >
            <Activity className="w-3.5 h-3.5 animate-pulse" style={{ color: '#0ea5e9' }} />
            <span className="font-mono text-xs" style={{ color: '#64748b' }}>System Load: 42%</span>
          </div>
          <div
            className="flex items-center gap-3 px-4 py-2 rounded-xl"
            style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
          >
            <span className="status-dot status-online" />
            <span className="font-mono text-xs tracking-wide" style={{ color: '#166534' }}>
              Dymo 5XL: Online
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
