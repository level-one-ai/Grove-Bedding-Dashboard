import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function WarehouseBridge() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const titleCardRef = useRef<HTMLDivElement>(null);
  const leftCardRef = useRef<HTMLDivElement>(null);
  const rightCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: true,
          anticipatePin: 1,
        },
      });

      // ENTRANCE (0% - 30%)
      scrollTl.fromTo(
        bgRef.current,
        { scale: 1.10, opacity: 0.8 },
        { scale: 1, opacity: 1, ease: 'none' },
        0
      );

      scrollTl.fromTo(
        titleCardRef.current,
        { y: '18vh', opacity: 0, scale: 0.96 },
        { y: 0, opacity: 1, scale: 1, ease: 'none' },
        0
      );

      scrollTl.fromTo(
        leftCardRef.current,
        { x: '-12vw', opacity: 0 },
        { x: 0, opacity: 1, ease: 'none' },
        0.05
      );

      scrollTl.fromTo(
        rightCardRef.current,
        { x: '12vw', opacity: 0 },
        { x: 0, opacity: 1, ease: 'none' },
        0.05
      );

      // SETTLE (30% - 70%): Subtle parallax
      scrollTl.fromTo(
        bgRef.current,
        { y: 0 },
        { y: '-2vh', ease: 'none' },
        0.3
      );

      // EXIT (70% - 100%)
      scrollTl.fromTo(
        titleCardRef.current,
        { y: 0, opacity: 1 },
        { y: '-16vh', opacity: 0.25, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        leftCardRef.current,
        { y: 0, opacity: 1 },
        { y: '10vh', opacity: 0.2, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        rightCardRef.current,
        { y: 0, opacity: 1 },
        { y: '10vh', opacity: 0.2, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        bgRef.current,
        { scale: 1 },
        { scale: 1.06, ease: 'power2.in' },
        0.7
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={sectionRef}
      className="relative w-full h-screen overflow-hidden"
    >
      {/* Background Image */}
      <div
        ref={bgRef}
        className="absolute inset-0 w-full h-full"
      >
        <img
          src="/warehouse-bg.jpg"
          alt="Warehouse Interior"
          className="w-full h-full object-cover"
        />
        {/* Overlay */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(5, 10, 24, 0.35) 0%, rgba(5, 10, 24, 0.65) 100%)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-8">
        {/* Center Title Card */}
        <div
          ref={titleCardRef}
          className="glass-card-light px-12 py-8 text-center"
          style={{ width: 'min(52vw, 720px)' }}
        >
          <h2 className="font-sora font-bold text-3xl md:text-4xl text-white tracking-tight-custom">
            Live Inventory Search
          </h2>
          <p className="font-inter text-sm text-silver/60 mt-3">
            Real-time tracking across all warehouse locations
          </p>
          
          {/* Search Bar */}
          <div className="mt-6 relative">
            <input
              type="text"
              placeholder="Search by SKU, product name, or location..."
              className="glass-input w-full text-center"
            />
            <div className="absolute inset-0 rounded-xl border border-cyan/30 pointer-events-none" />
          </div>
        </div>

        {/* Bottom Cards */}
        <div className="absolute bottom-12 left-8 right-8 flex justify-between items-end">
          {/* Left Card - Inventory Overview */}
          <div
            ref={leftCardRef}
            className="glass-card p-5"
            style={{ width: 'min(22vw, 320px)' }}
          >
            <h3 className="font-sora font-semibold text-sm text-white tracking-wide-custom uppercase mb-3">
              Inventory Overview
            </h3>
            <p className="font-inter text-xs text-silver/70 leading-relaxed">
              Track SKU-level movement across bays, pallets, and dispatch lanes. 
              Updated every 30 seconds.
            </p>
            <button className="mt-4 flex items-center gap-2 text-cyan text-xs font-sora font-semibold hover:text-cyan/80 transition-colors group">
              View Details
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Right Card - Stock Accuracy */}
          <div
            ref={rightCardRef}
            className="glass-card p-5"
            style={{ width: 'min(22vw, 320px)' }}
          >
            <h3 className="font-sora font-semibold text-sm text-white tracking-wide-custom uppercase mb-3">
              Stock Accuracy
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="font-sora font-extrabold text-4xl text-cyan text-glow-cyan">
                99.7%
              </span>
            </div>
            <p className="font-inter text-xs text-silver/60 mt-2">
              Real-time sync with Cin7 + Spoke
            </p>
            
            {/* Mini Progress */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 progress-bar h-1">
                <div className="progress-bar-fill" style={{ width: '99.7%' }} />
              </div>
              <span className="font-mono text-[10px] text-silver/50">99.7%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
