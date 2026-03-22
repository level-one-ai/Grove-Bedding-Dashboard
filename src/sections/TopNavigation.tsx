import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Home, Package, FileText, Truck } from 'lucide-react';
import type { PageId } from '../App';

interface Props {
  activePage: PageId;
  setActivePage: (page: PageId) => void;
}

const navItems = [
  { icon: Home, label: 'Overview', pageId: 'dashboard' as PageId },
  { icon: Package, label: 'Inventory', pageId: 'stock' as PageId },
  { icon: FileText, label: 'Automation', pageId: 'logs' as PageId },
  { icon: Truck, label: 'Dispatch', pageId: 'dispatch' as PageId },
];

export default function TopNavigation({ activePage, setActivePage }: Props) {
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        navRef.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, delay: 0.3, ease: 'power2.out' }
      );
    });

    return () => ctx.revert();
  }, []);

  const activeIndex = navItems.findIndex(item => item.pageId === activePage);

  return (
    <div
      ref={navRef}
      className="fixed top-16 left-0 right-0 z-[90] flex justify-center pt-1"
    >
      <div className="glass-card px-2 py-2 flex items-center gap-1">
        {navItems.map((item, index) => (
          <button
            key={index}
            onClick={() => setActivePage(item.pageId)}
            className={`top-nav-item relative flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 group ${
              activeIndex === index
                ? 'bg-blue/20'
                : 'hover:bg-white/5'
            }`}
          >
            {/* Glow effect on hover */}
            <div className={`absolute inset-0 rounded-xl transition-opacity duration-300 ${
              activeIndex === index
                ? 'opacity-100 bg-blue/10'
                : 'opacity-0 group-hover:opacity-100'
            }`}
            style={{
              boxShadow: activeIndex === index
                ? '0 0 20px rgba(0, 150, 255, 0.3), inset 0 0 10px rgba(0, 150, 255, 0.1)'
                : 'none'
            }}
            />

            <item.icon
              className={`w-4 h-4 transition-all duration-300 relative z-10 ${
                activeIndex === index
                  ? 'text-blue scale-110'
                  : 'text-silver/50 group-hover:text-blue/80 group-hover:scale-105'
              }`}
            />
            <span
              className={`font-sora text-xs tracking-wide transition-all duration-300 relative z-10 ${
                activeIndex === index
                  ? 'text-blue font-semibold'
                  : 'text-silver/60 group-hover:text-silver/90'
              }`}
            >
              {item.label}
            </span>

            {/* Active indicator line */}
            {activeIndex === index && (
              <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-transparent via-blue to-transparent rounded-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
