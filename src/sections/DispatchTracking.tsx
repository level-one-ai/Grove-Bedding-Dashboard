import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Truck, Clock, MapPin, Package, User, FileText, Box, ChevronRight, Navigation } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Dispatch {
  id: string;
  orderRef: string;
  client: {
    name: string;
    address: string;
    phone: string;
  };
  items: { name: string; quantity: number; sku: string }[];
  route: {
    from: string;
    to: string;
    distance: string;
    estimatedTime: string;
  };
  driver: {
    name: string;
    vehicle: string;
    phone: string;
  };
  status: 'preparing' | 'in-transit' | 'delivered';
  dispatchTime: string;
  eta: string;
  progress: number;
}

const dispatches: Dispatch[] = [
  {
    id: 'DSP-001',
    orderRef: 'SO-1020',
    client: {
      name: 'Acme Furniture Co.',
      address: '123 Industrial Way, Warehouse District, NY 10001',
      phone: '+1 (555) 123-4567',
    },
    items: [
      { name: 'Memory Foam Mattress - Queen', quantity: 5, sku: 'SKU-001' },
      { name: 'Luxury Bed Sheets - King', quantity: 10, sku: 'SKU-003' },
      { name: 'Down Alternative Pillow', quantity: 15, sku: 'SKU-004' },
    ],
    route: {
      from: 'Grove Bedding Warehouse',
      to: 'Acme Furniture Co.',
      distance: '24.5 miles',
      estimatedTime: '45 mins',
    },
    driver: {
      name: 'Mike Johnson',
      vehicle: 'Truck #TR-204',
      phone: '+1 (555) 987-6543',
    },
    status: 'in-transit',
    dispatchTime: '09:30 AM',
    eta: '10:15 AM',
    progress: 65,
  },
  {
    id: 'DSP-002',
    orderRef: 'SO-1021',
    client: {
      name: 'SleepWell Retailers',
      address: '456 Commerce St, Business Park, NJ 07030',
      phone: '+1 (555) 234-5678',
    },
    items: [
      { name: 'Pillow Top Queen Mattress', quantity: 3, sku: 'SKU-002' },
      { name: 'Weighted Blanket - 15lb', quantity: 8, sku: 'SKU-005' },
      { name: 'Mattress Protector', quantity: 12, sku: 'SKU-006' },
    ],
    route: {
      from: 'Grove Bedding Warehouse',
      to: 'SleepWell Retailers',
      distance: '18.2 miles',
      estimatedTime: '35 mins',
    },
    driver: {
      name: 'Sarah Chen',
      vehicle: 'Van #VN-118',
      phone: '+1 (555) 876-5432',
    },
    status: 'preparing',
    dispatchTime: '10:00 AM',
    eta: '10:35 AM',
    progress: 20,
  },
  {
    id: 'DSP-003',
    orderRef: 'SO-1018',
    client: {
      name: 'Comfort Home Store',
      address: '789 Market Ave, Downtown, NY 10002',
      phone: '+1 (555) 345-6789',
    },
    items: [
      { name: 'Memory Foam Mattress - Twin', quantity: 8, sku: 'SKU-001' },
      { name: 'Luxury Bed Sheets - Queen', quantity: 20, sku: 'SKU-003' },
    ],
    route: {
      from: 'Grove Bedding Warehouse',
      to: 'Comfort Home Store',
      distance: '12.8 miles',
      estimatedTime: '25 mins',
    },
    driver: {
      name: 'David Martinez',
      vehicle: 'Truck #TR-201',
      phone: '+1 (555) 765-4321',
    },
    status: 'delivered',
    dispatchTime: '08:15 AM',
    eta: '08:40 AM',
    progress: 100,
  },
  {
    id: 'DSP-004',
    orderRef: 'SO-1022',
    client: {
      name: 'Dream Sleep Outlet',
      address: '321 Bedding Blvd, Retail Center, NJ 07102',
      phone: '+1 (555) 456-7890',
    },
    items: [
      { name: 'Pillow Top King Mattress', quantity: 2, sku: 'SKU-002' },
      { name: 'Down Alternative Pillow', quantity: 24, sku: 'SKU-004' },
      { name: 'Weighted Blanket - 20lb', quantity: 6, sku: 'SKU-005' },
    ],
    route: {
      from: 'Grove Bedding Warehouse',
      to: 'Dream Sleep Outlet',
      distance: '31.4 miles',
      estimatedTime: '55 mins',
    },
    driver: {
      name: 'Lisa Thompson',
      vehicle: 'Truck #TR-205',
      phone: '+1 (555) 654-3210',
    },
    status: 'in-transit',
    dispatchTime: '09:45 AM',
    eta: '10:40 AM',
    progress: 40,
  },
];

const columns = [
  {
    label: 'Preparing',
    status: 'preparing' as const,
    color: '#f59e0b',
    colorLight: '#fffbeb',
    colorBorder: '#fde68a',
  },
  {
    label: 'In Transit',
    status: 'in-transit' as const,
    color: '#3b82f6',
    colorLight: '#eff6ff',
    colorBorder: '#bfdbfe',
  },
  {
    label: 'Delivered',
    status: 'delivered' as const,
    color: '#22c55e',
    colorLight: '#f0fdf4',
    colorBorder: '#bbf7d0',
  },
];

export default function DispatchTracking() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        sectionRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleCardClick = (dispatch: Dispatch) => {
    setSelectedDispatch(dispatch);
    setDetailDialogOpen(true);
  };

  return (
    <div
      id="dispatch"
      ref={sectionRef}
      className="relative w-full h-full overflow-hidden"
      style={{ background: '#ffffff' }}
    >
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage: `radial-gradient(circle, #cbd5e1 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative z-10 h-full flex flex-col max-w-6xl mx-auto px-8 py-4">

        {/* Header */}
        <div className="mb-3 flex items-center gap-3 flex-shrink-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}
          >
            <Navigation className="w-5 h-5" style={{ color: '#3b82f6' }} />
          </div>
          <div>
            <h2 className="font-sora font-bold text-xl" style={{ color: '#1e293b' }}>
              Dispatch
            </h2>
            <p className="font-inter text-xs" style={{ color: '#64748b' }}>
              Real-time monitoring of all delivery routes and ETAs
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-3 mb-4 flex-shrink-0">
          <div className="glass-card p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#eff6ff' }}>
              <Truck className="w-4 h-4" style={{ color: '#3b82f6' }} />
            </div>
            <div>
              <p className="font-sora font-bold text-xl" style={{ color: '#1e293b' }}>4</p>
              <p className="font-inter text-xs" style={{ color: '#64748b' }}>Active Dispatches</p>
            </div>
          </div>

          <div className="glass-card p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#f0fdf4' }}>
              <Clock className="w-4 h-4" style={{ color: '#22c55e' }} />
            </div>
            <div>
              <p className="font-sora font-bold text-xl" style={{ color: '#1e293b' }}>2</p>
              <p className="font-inter text-xs" style={{ color: '#64748b' }}>On Schedule</p>
            </div>
          </div>

          <div className="glass-card p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#f0f9ff' }}>
              <MapPin className="w-4 h-4" style={{ color: '#0ea5e9' }} />
            </div>
            <div>
              <p className="font-sora font-bold text-xl" style={{ color: '#1e293b' }}>86.9</p>
              <p className="font-inter text-xs" style={{ color: '#64748b' }}>Total Miles Today</p>
            </div>
          </div>

          <div className="glass-card p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#faf5ff' }}>
              <Package className="w-4 h-4" style={{ color: '#8b5cf6' }} />
            </div>
            <div>
              <p className="font-sora font-bold text-xl" style={{ color: '#1e293b' }}>113</p>
              <p className="font-inter text-xs" style={{ color: '#64748b' }}>Items Delivered</p>
            </div>
          </div>
        </div>

        {/* ── Kanban Board: 3 status columns ── */}
        <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
          {columns.map((col) => {
            const colDispatches = dispatches.filter(d => d.status === col.status);
            return (
              <div key={col.status} className="flex flex-col min-h-0">
                {/* Column Header */}
                <div
                  className="flex items-center justify-between px-3 py-2 rounded-xl mb-3 flex-shrink-0"
                  style={{
                    background: col.colorLight,
                    borderLeft: `3px solid ${col.color}`,
                    border: `1px solid ${col.colorBorder}`,
                    borderLeftWidth: '3px',
                  }}
                >
                  <span className="font-sora font-semibold text-sm" style={{ color: col.color }}>
                    {col.label}
                  </span>
                  <span
                    className="font-mono text-xs px-2 py-0.5 rounded-lg"
                    style={{ background: col.colorBorder, color: col.color }}
                  >
                    {colDispatches.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-3 overflow-y-auto flex-1 min-h-0">
                  {colDispatches.length === 0 && (
                    <div
                      className="rounded-2xl p-6 text-center"
                      style={{ border: `2px dashed ${col.colorBorder}` }}
                    >
                      <p className="font-inter text-xs" style={{ color: '#94a3b8' }}>No dispatches</p>
                    </div>
                  )}
                  {colDispatches.map((dispatch) => (
                    <div
                      key={dispatch.id}
                      onClick={() => handleCardClick(dispatch)}
                      className="glass-card p-4 cursor-pointer hover:shadow-md transition-all duration-300 group"
                    >
                      {/* Reference row */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[10px]" style={{ color: '#94a3b8' }}>{dispatch.id}</span>
                        <span
                          className="font-mono text-[10px] px-2 py-0.5 rounded-lg"
                          style={{ background: `${col.color}15`, color: col.color }}
                        >
                          {dispatch.orderRef}
                        </span>
                      </div>

                      {/* Client name */}
                      <h3
                        className="font-sora font-semibold text-sm mb-1 group-hover:transition-colors"
                        style={{ color: '#1e293b' }}
                      >
                        {dispatch.client.name}
                      </h3>

                      {/* Items count */}
                      <p className="font-inter text-xs mb-3" style={{ color: '#94a3b8' }}>
                        {dispatch.items.length} item type{dispatch.items.length > 1 ? 's' : ''} ·{' '}
                        {dispatch.items.reduce((s, i) => s + i.quantity, 0)} units
                      </p>

                      {/* Progress */}
                      <div className="mb-3">
                        <div className="flex justify-between mb-1">
                          <span className="font-mono text-[10px]" style={{ color: '#94a3b8' }}>Progress</span>
                          <span className="font-mono text-[10px]" style={{ color: col.color }}>{dispatch.progress}%</span>
                        </div>
                        <div className="progress-bar h-1.5" style={{ background: `${col.color}18` }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${dispatch.progress}%`,
                              background: `linear-gradient(90deg, ${col.color} 0%, ${col.color}cc 100%)`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Distance + ETA */}
                      <div className="flex items-center gap-3 mb-3" style={{ color: '#94a3b8' }}>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span className="font-inter text-[10px]">{dispatch.route.distance}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span className="font-inter text-[10px]">ETA {dispatch.eta}</span>
                        </div>
                      </div>

                      {/* Driver */}
                      <div
                        className="flex items-center gap-2 pt-2"
                        style={{ borderTop: '1px solid #f1f5f9' }}
                      >
                        <Truck className="w-3 h-3" style={{ color: '#cbd5e1' }} />
                        <span className="font-inter text-[10px] truncate" style={{ color: '#64748b' }}>
                          {dispatch.driver.name} · {dispatch.driver.vehicle}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}
        >
          {selectedDispatch && (
            <>
              <DialogHeader>
                <DialogTitle className="font-sora font-bold text-xl" style={{ color: '#1e293b' }}>
                  <div className="flex items-center gap-3">
                    <Truck className="w-6 h-6" style={{ color: '#3b82f6' }} />
                    {selectedDispatch.id}
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                {/* Status Banner */}
                {(() => {
                  const col = columns.find(c => c.status === selectedDispatch.status)!;
                  return (
                    <div
                      className="p-4 rounded-xl"
                      style={{ background: col.colorLight, border: `1px solid ${col.colorBorder}` }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-sora font-semibold" style={{ color: col.color }}>{col.label}</span>
                        <span className="font-mono text-2xl font-bold" style={{ color: col.color }}>{selectedDispatch.progress}%</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: `${col.color}20` }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${selectedDispatch.progress}%`, background: col.color }}
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* Order Info */}
                <div className="glass-card p-4">
                  <h4 className="font-sora font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: '#1e293b' }}>
                    <FileText className="w-4 h-4" style={{ color: '#3b82f6' }} />
                    Order Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-mono text-[10px] uppercase" style={{ color: '#94a3b8' }}>Order Reference</p>
                      <p className="font-mono text-sm" style={{ color: '#3b82f6' }}>{selectedDispatch.orderRef}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase" style={{ color: '#94a3b8' }}>Dispatch Time</p>
                      <p className="font-inter text-sm" style={{ color: '#1e293b' }}>{selectedDispatch.dispatchTime}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase" style={{ color: '#94a3b8' }}>Estimated Arrival</p>
                      <p className="font-inter text-sm" style={{ color: '#22c55e' }}>{selectedDispatch.eta}</p>
                    </div>
                  </div>
                </div>

                {/* Client Info */}
                <div className="glass-card p-4">
                  <h4 className="font-sora font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: '#1e293b' }}>
                    <User className="w-4 h-4" style={{ color: '#3b82f6' }} />
                    Client Details
                  </h4>
                  <div className="space-y-2">
                    <p className="font-sora font-medium" style={{ color: '#1e293b' }}>{selectedDispatch.client.name}</p>
                    <div className="flex items-start gap-2" style={{ color: '#64748b' }}>
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p className="font-inter text-sm">{selectedDispatch.client.address}</p>
                    </div>
                    <p className="font-mono text-sm" style={{ color: '#94a3b8' }}>{selectedDispatch.client.phone}</p>
                  </div>
                </div>

                {/* Route Info */}
                <div className="glass-card p-4">
                  <h4 className="font-sora font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: '#1e293b' }}>
                    <Navigation className="w-4 h-4" style={{ color: '#3b82f6' }} />
                    Route Details
                  </h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="font-mono text-[10px] uppercase" style={{ color: '#94a3b8' }}>From</p>
                      <p className="font-inter text-sm" style={{ color: '#1e293b' }}>{selectedDispatch.route.from}</p>
                    </div>
                    <ChevronRight className="w-5 h-5" style={{ color: '#cbd5e1' }} />
                    <div className="flex-1">
                      <p className="font-mono text-[10px] uppercase" style={{ color: '#94a3b8' }}>To</p>
                      <p className="font-inter text-sm" style={{ color: '#1e293b' }}>{selectedDispatch.route.to}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4" style={{ borderTop: '1px solid #f1f5f9' }}>
                    <div>
                      <p className="font-mono text-[10px] uppercase" style={{ color: '#94a3b8' }}>Distance</p>
                      <p className="font-inter text-sm" style={{ color: '#1e293b' }}>{selectedDispatch.route.distance}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase" style={{ color: '#94a3b8' }}>Est. Time</p>
                      <p className="font-inter text-sm" style={{ color: '#1e293b' }}>{selectedDispatch.route.estimatedTime}</p>
                    </div>
                  </div>
                </div>

                {/* Driver Info */}
                <div className="glass-card p-4">
                  <h4 className="font-sora font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: '#1e293b' }}>
                    <Truck className="w-4 h-4" style={{ color: '#3b82f6' }} />
                    Driver Information
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="font-mono text-[10px] uppercase" style={{ color: '#94a3b8' }}>Name</p>
                      <p className="font-inter text-sm" style={{ color: '#1e293b' }}>{selectedDispatch.driver.name}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase" style={{ color: '#94a3b8' }}>Vehicle</p>
                      <p className="font-inter text-sm" style={{ color: '#1e293b' }}>{selectedDispatch.driver.vehicle}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase" style={{ color: '#94a3b8' }}>Contact</p>
                      <p className="font-mono text-sm" style={{ color: '#94a3b8' }}>{selectedDispatch.driver.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="glass-card p-4">
                  <h4 className="font-sora font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: '#1e293b' }}>
                    <Box className="w-4 h-4" style={{ color: '#3b82f6' }} />
                    Order Items
                  </h4>
                  <div className="space-y-2">
                    {selectedDispatch.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2"
                        style={{ borderBottom: idx < selectedDispatch.items.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                      >
                        <div>
                          <p className="font-inter text-sm" style={{ color: '#1e293b' }}>{item.name}</p>
                          <p className="font-mono text-[10px]" style={{ color: '#3b82f6' }}>{item.sku}</p>
                        </div>
                        <span className="font-mono text-sm" style={{ color: '#64748b' }}>x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div
                    className="mt-4 pt-3 flex items-center justify-between"
                    style={{ borderTop: '1px solid #e2e8f0' }}
                  >
                    <span className="font-inter text-sm" style={{ color: '#64748b' }}>Total Items</span>
                    <span className="font-sora font-bold" style={{ color: '#1e293b' }}>
                      {selectedDispatch.items.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
