import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Home, Package, FileText, Truck } from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Home', sectionId: 'dashboard' },
  { icon: Package, label: 'Stock', sectionId: 'stock' },
  { icon: FileText, label: 'API Logs', sectionId: 'logs' },
  { icon: Truck, label: 'Dispatch', sectionId: 'dispatch' },
];

export default function FloatingNav() {
  const navRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        navRef.current,
        { y: '12vh', opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, delay: 1, ease: 'power2.out' }
      );
    });

    return () => ctx.revert();
  }, []);

  const handleClick = (index: number, sectionId: string) => {
    setActiveIndex(index);
    
    // Smooth scroll to section
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div
      ref={navRef}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]"
    >
      <div className="glass-card px-2 py-2 flex items-center gap-1">
        {navItems.map((item, index) => (
          <button
            key={index}
            onClick={() => handleClick(index, item.sectionId)}
            className={`relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 group ${
              activeIndex === index 
                ? 'bg-cyan/10' 
                : 'hover:bg-white/5'
            }`}
          >
            <item.icon 
              className={`w-5 h-5 transition-colors ${
                activeIndex === index 
                  ? 'text-cyan' 
                  : 'text-silver/50 group-hover:text-silver/80'
              }`} 
            />
            <span 
              className={`font-mono text-[9px] tracking-wide uppercase transition-colors ${
                activeIndex === index 
                  ? 'text-cyan' 
                  : 'text-silver/40 group-hover:text-silver/60'
              }`}
            >
              {item.label}
            </span>
            
            {/* Active Indicator */}
            {activeIndex === index && (
              <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
