import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Home, Package, FileText, Truck } from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Dashboard', sectionId: 'dashboard' },
  { icon: Package, label: 'Stock', sectionId: 'stock' },
  { icon: FileText, label: 'API Logs', sectionId: 'logs' },
  { icon: Truck, label: 'Dispatch', sectionId: 'dispatch' },
];

export default function TopNavigation() {
  const navRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        navRef.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, delay: 0.5, ease: 'power2.out' }
      );
    });

    // Show/hide navigation on scroll
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsVisible(scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      ctx.revert();
      window.removeEventListener('scroll', handleScroll);
    };
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
      className={`fixed top-16 left-0 right-0 z-[90] flex justify-center transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}
    >
      <div className="glass-card px-2 py-2 flex items-center gap-1">
        {navItems.map((item, index) => (
          <button
            key={index}
            onClick={() => handleClick(index, item.sectionId)}
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
