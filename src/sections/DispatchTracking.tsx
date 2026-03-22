import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Truck, Clock, MapPin, Package, Calendar, User, FileText, Box, ChevronRight, Navigation } from 'lucide-react';
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-transit':
        return 'text-cyan border-cyan/30 bg-cyan/10';
      case 'preparing':
        return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
      case 'delivered':
        return 'text-emerald border-emerald/30 bg-emerald/10';
      default:
        return 'text-silver/60 border-white/10 bg-white/5';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in-transit':
        return 'In Transit';
      case 'preparing':
        return 'Preparing';
      case 'delivered':
        return 'Delivered';
      default:
        return status;
    }
  };

  return (
    <div
      id="dispatch"
      ref={sectionRef}
      className="relative w-full h-full overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #0a1628 0%, #0d1e36 50%, #0a1628 100%)',
      }}
    >
      {/* Background Map Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 240, 255, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 240, 255, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      <div className="relative z-10 h-full flex flex-col max-w-6xl mx-auto px-8 py-4">
        {/* Header */}
        <div className="dispatch-header mb-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan/10 border border-cyan/30 flex items-center justify-center">
            <Navigation className="w-5 h-5 text-cyan" />
          </div>
          <div>
            <h2 className="font-sora font-bold text-xl text-white tracking-tight-custom">
              Dispatch
            </h2>
            <p className="font-inter text-xs text-silver/60">
              Real-time monitoring of all delivery routes and ETAs
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="dispatch-grid grid grid-cols-4 gap-3 mb-3">
          <div className="dispatch-card glass-card p-3">
            <div className="flex items-center justify-between mb-2">
              <Truck className="w-4 h-4 text-cyan" />
            </div>
            <p className="font-sora font-bold text-xl text-white">4</p>
            <p className="font-inter text-xs text-silver/60 mt-0.5">Active Dispatches</p>
          </div>

          <div className="dispatch-card glass-card p-3">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-4 h-4 text-emerald" />
            </div>
            <p className="font-sora font-bold text-xl text-white">2</p>
            <p className="font-inter text-xs text-silver/60 mt-0.5">On Schedule</p>
          </div>

          <div className="dispatch-card glass-card p-3">
            <div className="flex items-center justify-between mb-2">
              <MapPin className="w-4 h-4 text-magenta" />
            </div>
            <p className="font-sora font-bold text-xl text-white">86.9</p>
            <p className="font-inter text-xs text-silver/60 mt-0.5">Total Miles Today</p>
          </div>

          <div className="dispatch-card glass-card p-3">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-4 h-4 text-purple-400" />
            </div>
            <p className="font-sora font-bold text-xl text-white">113</p>
            <p className="font-inter text-xs text-silver/60 mt-0.5">Items Delivered</p>
          </div>
        </div>

        {/* Dispatch Cards — scrollable if needed */}
        <div className="grid grid-cols-2 gap-4 overflow-y-auto flex-1 content-start">
          {dispatches.map((dispatch, index) => (
            <div
              key={index}
              onClick={() => handleCardClick(dispatch)}
              className="dispatch-card glass-card p-4 hover:border-cyan/30 transition-all duration-300 cursor-pointer group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-cyan">{dispatch.id}</span>
                    <span className="text-silver/30">•</span>
                    <span className="font-mono text-xs text-silver/50">{dispatch.orderRef}</span>
                  </div>
                  <h3 className="font-sora font-semibold text-white group-hover:text-cyan transition-colors">
                    {dispatch.client.name}
                  </h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase border ${getStatusColor(dispatch.status)}`}>
                  {getStatusLabel(dispatch.status)}
                </span>
              </div>

              {/* Route Info */}
              <div className="flex items-center gap-3 mb-4 text-sm">
                <div className="flex items-center gap-1.5 text-silver/60">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="font-inter text-xs">{dispatch.route.distance}</span>
                </div>
                <div className="flex items-center gap-1.5 text-silver/60">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="font-inter text-xs">{dispatch.route.estimatedTime}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[10px] text-silver/50">Progress</span>
                  <span className="font-mono text-[10px] text-cyan">{dispatch.progress}%</span>
                </div>
                <div className="progress-bar h-2">
                  <div 
                    className="progress-bar-fill h-full rounded-full transition-all"
                    style={{ width: `${dispatch.progress}%` }}
                  />
                </div>
              </div>

              {/* Times */}
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-silver/40" />
                  <span className="font-mono text-[10px] text-silver/60">Dispatch: {dispatch.dispatchTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-emerald" />
                  <span className="font-mono text-[10px] text-emerald">ETA: {dispatch.eta}</span>
                </div>
              </div>

              {/* Driver Info */}
              <div className="mt-4 flex items-center gap-2 text-xs text-silver/50">
                <Truck className="w-3.5 h-3.5" />
                <span className="font-inter">{dispatch.driver.name} • {dispatch.driver.vehicle}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="glass-card border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedDispatch && (
            <>
              <DialogHeader>
                <DialogTitle className="font-sora font-bold text-xl text-white">
                  <div className="flex items-center gap-3">
                    <Truck className="w-6 h-6 text-cyan" />
                    {selectedDispatch.id}
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="mt-6 space-y-6">
                {/* Status Banner */}
                <div className={`p-4 rounded-xl border ${getStatusColor(selectedDispatch.status)}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-sora font-semibold">{getStatusLabel(selectedDispatch.status)}</span>
                    <span className="font-mono text-2xl font-bold">{selectedDispatch.progress}%</span>
                  </div>
                  <div className="mt-2 progress-bar h-2">
                    <div 
                      className="progress-bar-fill h-full rounded-full"
                      style={{ width: `${selectedDispatch.progress}%` }}
                    />
                  </div>
                </div>

                {/* Order Info */}
                <div className="glass-card p-4">
                  <h4 className="font-sora font-semibold text-sm text-white mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan" />
                    Order Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-mono text-[10px] text-silver/50 uppercase">Order Reference</p>
                      <p className="font-mono text-sm text-cyan">{selectedDispatch.orderRef}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] text-silver/50 uppercase">Dispatch Time</p>
                      <p className="font-inter text-sm text-white">{selectedDispatch.dispatchTime}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] text-silver/50 uppercase">Estimated Arrival</p>
                      <p className="font-inter text-sm text-emerald">{selectedDispatch.eta}</p>
                    </div>
                  </div>
                </div>

                {/* Client Info */}
                <div className="glass-card p-4">
                  <h4 className="font-sora font-semibold text-sm text-white mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-cyan" />
                    Client Details
                  </h4>
                  <div className="space-y-2">
                    <p className="font-sora font-medium text-white">{selectedDispatch.client.name}</p>
                    <div className="flex items-start gap-2 text-silver/60">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p className="font-inter text-sm">{selectedDispatch.client.address}</p>
                    </div>
                    <p className="font-mono text-sm text-silver/60">{selectedDispatch.client.phone}</p>
                  </div>
                </div>

                {/* Route Info */}
                <div className="glass-card p-4">
                  <h4 className="font-sora font-semibold text-sm text-white mb-3 flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-cyan" />
                    Route Details
                  </h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="font-mono text-[10px] text-silver/50 uppercase">From</p>
                      <p className="font-inter text-sm text-white">{selectedDispatch.route.from}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-silver/30" />
                    <div className="flex-1">
                      <p className="font-mono text-[10px] text-silver/50 uppercase">To</p>
                      <p className="font-inter text-sm text-white">{selectedDispatch.route.to}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5">
                    <div>
                      <p className="font-mono text-[10px] text-silver/50 uppercase">Distance</p>
                      <p className="font-inter text-sm text-white">{selectedDispatch.route.distance}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] text-silver/50 uppercase">Est. Time</p>
                      <p className="font-inter text-sm text-white">{selectedDispatch.route.estimatedTime}</p>
                    </div>
                  </div>
                </div>

                {/* Driver Info */}
                <div className="glass-card p-4">
                  <h4 className="font-sora font-semibold text-sm text-white mb-3 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-cyan" />
                    Driver Information
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="font-mono text-[10px] text-silver/50 uppercase">Name</p>
                      <p className="font-inter text-sm text-white">{selectedDispatch.driver.name}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] text-silver/50 uppercase">Vehicle</p>
                      <p className="font-inter text-sm text-white">{selectedDispatch.driver.vehicle}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] text-silver/50 uppercase">Contact</p>
                      <p className="font-mono text-sm text-silver/60">{selectedDispatch.driver.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="glass-card p-4">
                  <h4 className="font-sora font-semibold text-sm text-white mb-3 flex items-center gap-2">
                    <Box className="w-4 h-4 text-cyan" />
                    Order Items
                  </h4>
                  <div className="space-y-2">
                    {selectedDispatch.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <div>
                          <p className="font-inter text-sm text-white">{item.name}</p>
                          <p className="font-mono text-[10px] text-cyan">{item.sku}</p>
                        </div>
                        <span className="font-mono text-sm text-silver/60">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="font-inter text-sm text-silver/60">Total Items</span>
                    <span className="font-sora font-bold text-white">
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
