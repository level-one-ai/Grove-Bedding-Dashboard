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
      <div
        className="px-2 py-1.5 flex items-center gap-1 rounded-2xl"
        style={{
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(20px)',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        {navItems.map((item, index) => (
          <button
            key={index}
            onClick={() => setActivePage(item.pageId)}
            className="top-nav-item relative flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 group"
            style={{
              background: activeIndex === index ? '#fff7ed' : 'transparent',
              border: activeIndex === index ? '1px solid #fed7aa' : '1px solid transparent',
            }}
          >
            <item.icon
              className="w-4 h-4 transition-all duration-300"
              style={{
                color: activeIndex === index ? '#f97316' : '#94a3b8',
              }}
            />
            <span
              className="font-sora text-xs tracking-wide transition-all duration-300"
              style={{
                color: activeIndex === index ? '#f97316' : '#64748b',
                fontWeight: activeIndex === index ? 600 : 400,
              }}
            >
              {item.label}
            </span>

            {/* Active indicator line */}
            {activeIndex === index && (
              <div
                className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                style={{ background: '#f97316' }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
