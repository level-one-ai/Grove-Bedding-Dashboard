import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Home, Package, FileText, Truck, Tag, ShoppingBag, PhoneCall, FolderOpen } from 'lucide-react';
import type { PageId } from '../App';

interface Props {
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { icon: Home,        label: 'Overview',   pageId: 'dashboard' as PageId },
  { icon: Package,     label: 'Inventory',  pageId: 'stock'     as PageId },
  { icon: FileText,    label: 'Automation', pageId: 'logs'      as PageId },
  { icon: Truck,       label: 'Dispatch',   pageId: 'dispatch'  as PageId },
  { icon: Tag,         label: 'Labels',     pageId: 'labels'    as PageId },
  { icon: ShoppingBag, label: 'Orders',     pageId: 'orders'    as PageId },
  { icon: PhoneCall,   label: 'Calls',      pageId: 'calls'     as PageId },
  { icon: FolderOpen,  label: 'PDF Router', pageId: 'files'     as PageId },
];

export default function SideNavigation({ activePage, setActivePage, isOpen, onClose }: Props) {
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sidebarRef.current) return;
    if (isOpen) {
      gsap.to(sidebarRef.current, { x: 0, duration: 0.3, ease: 'power2.out' });
    } else {
      gsap.to(sidebarRef.current, { x: '-100%', duration: 0.25, ease: 'power2.in' });
    }
  }, [isOpen]);

  const handleNav = (pageId: PageId) => {
    setActivePage(pageId);
    onClose();
  };

  return (
    <>
      {/* Backdrop overlay — click to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[150]"
          style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(2px)' }}
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <div
        ref={sidebarRef}
        className="fixed top-0 left-0 z-[200] h-full flex flex-col"
        style={{
          width: '220px',
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid #e2e8f0',
          boxShadow: '4px 0 24px rgba(0,0,0,0.08)',
          transform: 'translateX(-100%)',
        }}
      >
        {/* Logo area */}
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{ borderBottom: '1px solid #e2e8f0' }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="#0ea5e9"/>
            </svg>
          </div>
          <div>
            <p className="font-sora font-semibold text-sm" style={{ color: '#1e293b', lineHeight: 1.2 }}>Grove Bedding</p>
            <p className="font-mono text-[10px]" style={{ color: '#94a3b8' }}>v2.4.1</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          <div className="space-y-0.5">
            {navItems.map(({ icon: Icon, label, pageId }) => {
              const isActive = activePage === pageId;
              return (
                <button
                  key={pageId}
                  onClick={() => handleNav(pageId)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left"
                  style={{
                    background: isActive ? '#f0f9ff' : 'transparent',
                    border: isActive ? '1px solid #bae6fd' : '1px solid transparent',
                    color: isActive ? '#0ea5e9' : '#475569',
                  }}
                >
                  <Icon
                    style={{
                      width: '16px',
                      height: '16px',
                      flexShrink: 0,
                      color: isActive ? '#0ea5e9' : '#94a3b8',
                    }}
                  />
                  <span
                    className="font-sora font-medium text-sm"
                    style={{ color: isActive ? '#0ea5e9' : '#475569' }}
                  >
                    {label}
                  </span>
                  {isActive && (
                    <div
                      className="ml-auto w-1.5 h-1.5 rounded-full"
                      style={{ background: '#0ea5e9', flexShrink: 0 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div
          className="px-4 py-3"
          style={{ borderTop: '1px solid #e2e8f0' }}
        >
          <p className="font-mono text-[9px] text-center" style={{ color: '#cbd5e1' }}>
            Level One AI · Grove Bedding
          </p>
        </div>
      </div>
    </>
  );
}
