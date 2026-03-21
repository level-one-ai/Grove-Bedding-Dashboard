import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Send, Clock } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function ContactPanel() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const microcopyRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=120%',
          pin: true,
          scrub: true,
          anticipatePin: 1,
        },
      });

      // ENTRANCE (0% - 30%)
      scrollTl.fromTo(
        bgRef.current,
        { scale: 1.08, opacity: 0.7 },
        { scale: 1, opacity: 1, ease: 'none' },
        0
      );

      scrollTl.fromTo(
        labelRef.current,
        { y: '-6vh', opacity: 0 },
        { y: 0, opacity: 1, ease: 'none' },
        0.05
      );

      scrollTl.fromTo(
        cardRef.current,
        { y: '18vh', opacity: 0, scale: 0.96 },
        { y: 0, opacity: 1, scale: 1, ease: 'none' },
        0.08
      );

      scrollTl.fromTo(
        microcopyRef.current,
        { opacity: 0 },
        { opacity: 1, ease: 'none' },
        0.18
      );

      // SETTLE (30% - 70%): Hold static

      // EXIT (70% - 100%)
      scrollTl.fromTo(
        cardRef.current,
        { y: 0, opacity: 1 },
        { y: '12vh', opacity: 0.25, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        labelRef.current,
        { opacity: 1 },
        { opacity: 0.2, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        microcopyRef.current,
        { opacity: 1 },
        { opacity: 0.2, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        bgRef.current,
        { scale: 1, opacity: 1 },
        { scale: 1.05, opacity: 0.8, ease: 'power2.in' },
        0.7
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
    }, 1500);
  };

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
          src="/city-night-bg.jpg"
          alt="City Night Skyline"
          className="w-full h-full object-cover"
        />
        {/* Overlay */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'rgba(5, 10, 24, 0.55)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-8">
        {/* Top Label */}
        <div
          ref={labelRef}
          className="absolute top-24"
        >
          <span className="font-mono text-xs text-cyan/70 tracking-wide-custom uppercase">
            Dispatch Control
          </span>
        </div>

        {/* Contact Card */}
        <div
          ref={cardRef}
          className="glass-card-light p-8 w-full"
          style={{ maxWidth: '520px' }}
        >
          <h2 className="font-sora font-bold text-xl text-white tracking-tight-custom mb-6">
            Contact the Hub
          </h2>

          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald/20 border border-emerald/40 flex items-center justify-center mx-auto mb-4">
                <Send className="w-6 h-6 text-emerald" />
              </div>
              <h3 className="font-sora font-semibold text-lg text-white mb-2">
                Message Sent
              </h3>
              <p className="font-inter text-sm text-silver/60">
                We&apos;ll get back to you within 4 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="font-mono text-[10px] text-silver/50 uppercase tracking-wide mb-1.5 block">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your name"
                  required
                  className="glass-input"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] text-silver/50 uppercase tracking-wide mb-1.5 block">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                  required
                  className="glass-input"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] text-silver/50 uppercase tracking-wide mb-1.5 block">
                  Message
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="How can we help?"
                  required
                  rows={4}
                  className="glass-input resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-cyan flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Bottom Microcopy */}
        <div
          ref={microcopyRef}
          className="absolute bottom-12 flex items-center gap-2"
        >
          <Clock className="w-3 h-3 text-silver/40" />
          <span className="font-inter text-xs text-silver/40">
            Response time: typically under 4 hours.
          </span>
        </div>
      </div>
    </div>
  );
}
