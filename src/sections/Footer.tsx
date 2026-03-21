import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Leaf } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const footerLinks = [
  { label: 'Products', href: '#' },
  { label: 'Logistics', href: '#' },
  { label: 'API Docs', href: '#' },
  { label: 'Support', href: '#' },
];

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        footerRef.current,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 90%',
            end: 'top 70%',
            scrub: true,
          },
        }
      );
    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer
      ref={footerRef}
      className="relative w-full bg-navy-900 py-12 border-t border-white/[0.06]"
    >
      <div className="max-w-6xl mx-auto px-8">
        {/* Top Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan/20 to-cyan/5 border border-cyan/30 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-cyan" />
            </div>
            <span className="font-sora font-semibold text-lg text-silver tracking-tight">
              Grove Bedding
            </span>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-8">
            {footerLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className="font-inter text-sm text-silver/60 hover:text-cyan transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-white/[0.06] mb-8" />

        {/* Bottom Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-inter text-xs text-silver/40">
            &copy; {new Date().getFullYear()} Grove Bedding. All rights reserved.
          </p>
          
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] text-silver/30">
              System v2.4.1
            </span>
            <span className="w-1 h-1 rounded-full bg-silver/20" />
            <span className="font-mono text-[10px] text-emerald/60 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
              All Systems Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
