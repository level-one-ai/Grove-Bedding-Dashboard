import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Package, AlertTriangle, ShoppingCart, TrendingUp, Warehouse } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const stockItems = [
  { id: 'SKU-001', name: 'Memory Foam Mattress', category: 'Mattresses', current: 45, max: 100, reorderAt: 30, supplier: 'SleepTech Corp' },
  { id: 'SKU-002', name: 'Pillow Top Queen', category: 'Mattresses', current: 28, max: 80, reorderAt: 25, supplier: 'ComfortZone Ltd' },
  { id: 'SKU-003', name: 'Luxury Bed Sheets', category: 'Bedding', current: 156, max: 200, reorderAt: 50, supplier: 'SoftTouch Textiles' },
  { id: 'SKU-004', name: 'Down Alternative Pillow', category: 'Pillows', current: 89, max: 150, reorderAt: 40, supplier: 'PillowPerfect Inc' },
  { id: 'SKU-005', name: 'Weighted Blanket', category: 'Bedding', current: 12, max: 60, reorderAt: 20, supplier: 'CozyWrap Co' },
  { id: 'SKU-006', name: 'Mattress Protector', category: 'Accessories', current: 67, max: 120, reorderAt: 30, supplier: 'GuardSleep Pro' },
];

const categoryData = [
  { name: 'Mattresses', value: 73, color: '#0096ff' },
  { name: 'Bedding', value: 168, color: '#32dc96' },
  { name: 'Pillows', value: 89, color: '#ff5096' },
  { name: 'Accessories', value: 67, color: '#a855f7' },
];

const weeklyData = [
  { day: 'Mon', incoming: 45, outgoing: 32 },
  { day: 'Tue', incoming: 38, outgoing: 41 },
  { day: 'Wed', incoming: 52, outgoing: 28 },
  { day: 'Thu', incoming: 29, outgoing: 45 },
  { day: 'Fri', incoming: 41, outgoing: 38 },
  { day: 'Sat', incoming: 18, outgoing: 22 },
  { day: 'Sun', incoming: 12, outgoing: 15 },
];

interface StockItem {
  id: string;
  name: string;
  category: string;
  current: number;
  max: number;
  reorderAt: number;
  supplier: string;
}

const tooltipStyle = {
  background: 'rgba(10, 22, 40, 0.95)',
  border: '1px solid rgba(0, 150, 255, 0.3)',
  borderRadius: '12px',
  color: '#e8f4ff',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
};

export default function StockManagement() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

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

  const getStockPercentage = (current: number, max: number) => Math.round((current / max) * 100);

  const getStockStatus = (current: number, reorderAt: number) => {
    if (current <= reorderAt) return 'critical';
    if (current <= reorderAt * 1.5) return 'warning';
    return 'good';
  };

  const handleOrderClick = (item: StockItem) => {
    setSelectedItem(item);
    setOrderDialogOpen(true);
    setOrderSuccess(false);
  };

  const handleConfirmOrder = () => {
    setOrderSuccess(true);
    setTimeout(() => setOrderDialogOpen(false), 2000);
  };

  return (
    <div
      id="stock"
      ref={sectionRef}
      className="relative w-full h-full overflow-hidden flex flex-col"
      style={{ background: 'linear-gradient(180deg, #0a1628 0%, #0d1e36 50%, #0a1628 100%)' }}
    >
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,150,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(0,150,255,0.5) 1px,transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      <div className="relative z-10 flex-1 flex flex-col max-w-7xl w-full mx-auto px-6 py-4 min-h-0">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-blue/10 border border-blue/30 flex items-center justify-center glow-blue">
            <Warehouse className="w-5 h-5 text-blue" />
          </div>
          <div>
            <h2 className="font-sora font-bold text-xl text-white tracking-tight-custom text-glow-blue">Inventory</h2>
            <p className="font-inter text-xs text-silver/60">Real-time stock tracking with automated reorder alerts</p>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-4 gap-3 mb-3 flex-shrink-0">
          <div className="glass-card p-3 relative overflow-hidden group hover:border-blue/40 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-2 relative z-10">
              <Package className="w-4 h-4 text-blue" />
              <span className="font-mono text-[10px] text-emerald flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +12%</span>
            </div>
            <p className="font-sora font-bold text-xl text-white relative z-10">397</p>
            <p className="font-inter text-xs text-silver/60 mt-0.5 relative z-10">Total Units</p>
          </div>

          <div className="glass-card p-3 relative overflow-hidden group hover:border-magenta/40 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-magenta/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-2 relative z-10">
              <AlertTriangle className="w-4 h-4 text-magenta" />
              <span className="font-mono text-[10px] text-magenta">Action Needed</span>
            </div>
            <p className="font-sora font-bold text-xl text-white relative z-10">2</p>
            <p className="font-inter text-xs text-silver/60 mt-0.5 relative z-10">Low Stock Items</p>
          </div>

          <div className="glass-card p-3 relative overflow-hidden group hover:border-emerald/40 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-2 relative z-10">
              <TrendingUp className="w-4 h-4 text-emerald" />
              <span className="font-mono text-[10px] text-emerald">Healthy</span>
            </div>
            <p className="font-sora font-bold text-xl text-white relative z-10">68%</p>
            <p className="font-inter text-xs text-silver/60 mt-0.5 relative z-10">Avg Stock Level</p>
          </div>

          <div className="glass-card p-3 relative overflow-hidden group hover:border-purple-400/40 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-2 relative z-10">
              <ShoppingCart className="w-4 h-4 text-purple-400" />
              <span className="font-mono text-[10px] text-purple-400">Pending</span>
            </div>
            <p className="font-sora font-bold text-xl text-white relative z-10">3</p>
            <p className="font-inter text-xs text-silver/60 mt-0.5 relative z-10">Open Orders</p>
          </div>
        </div>

        {/* ── Two-column Body: Charts | Items Table ── */}
        <div className="flex-1 grid grid-cols-5 gap-3 min-h-0">

          {/* Left: Charts stacked */}
          <div className="col-span-2 flex flex-col gap-3 min-h-0">

            {/* Pie Chart */}
            <div className="glass-card p-3 relative overflow-hidden flex flex-col flex-1">
              <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-blue/40 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-blue/40 rounded-tr-lg" />
              <h3 className="font-sora font-semibold text-xs text-white mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue animate-pulse" />
                Stock by Category
              </h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={32} outerRadius={56} paddingAngle={3} dataKey="value" animationBegin={0} animationDuration={1200}>
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(255,255,255,0.1)" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                {categoryData.map((cat, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: cat.color }} />
                    <span className="font-mono text-[10px] text-silver/60">{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bar Chart */}
            <div className="glass-card p-3 relative overflow-hidden flex flex-col flex-1">
              <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-blue/40 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-blue/40 rounded-tr-lg" />
              <h3 className="font-sora font-semibold text-xs text-white mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue animate-pulse" />
                Weekly Movement
              </h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} margin={{ top: 2, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="day" tick={{ fill: '#a8c4e8', fontSize: 9 }} axisLine={false} />
                    <YAxis tick={{ fill: '#a8c4e8', fontSize: 9 }} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="incoming" fill="#0096ff" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="outgoing" fill="#ff5096" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-3 mt-2">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue" />
                  <span className="font-mono text-[10px] text-silver/60">Incoming</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-magenta" />
                  <span className="font-mono text-[10px] text-silver/60">Outgoing</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right: Inventory Items Table — full column height, compact rows */}
          <div className="col-span-3 glass-card p-3 relative flex flex-col min-h-0">
            <div className="absolute top-0 left-0 w-5 h-5 border-l-2 border-t-2 border-blue/40 rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-5 h-5 border-r-2 border-t-2 border-blue/40 rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-5 h-5 border-l-2 border-b-2 border-blue/40 rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-5 h-5 border-r-2 border-b-2 border-blue/40 rounded-br-xl" />

            <h3 className="font-sora font-semibold text-xs text-white mb-2 flex items-center gap-2 flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-blue animate-pulse" />
              Inventory Items
            </h3>

            <div className="overflow-y-auto flex-1 min-h-0">
              <table className="w-full">
                <thead className="sticky top-0 z-10" style={{ background: 'rgba(10,22,40,0.95)' }}>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 px-2 font-mono text-[10px] text-silver/50 uppercase tracking-wide">SKU</th>
                    <th className="text-left py-2 px-2 font-mono text-[10px] text-silver/50 uppercase tracking-wide">Product</th>
                    <th className="text-left py-2 px-2 font-mono text-[10px] text-silver/50 uppercase tracking-wide">Cat.</th>
                    <th className="text-left py-2 px-2 font-mono text-[10px] text-silver/50 uppercase tracking-wide">Stock</th>
                    <th className="text-left py-2 px-2 font-mono text-[10px] text-silver/50 uppercase tracking-wide">Status</th>
                    <th className="text-left py-2 px-2 font-mono text-[10px] text-silver/50 uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stockItems.map((item, index) => {
                    const percentage = getStockPercentage(item.current, item.max);
                    const status = getStockStatus(item.current, item.reorderAt);
                    return (
                      <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-2 px-2">
                          <span className="font-mono text-[11px] text-blue">{item.id}</span>
                        </td>
                        <td className="py-2 px-2">
                          <span className="font-inter text-xs text-white">{item.name}</span>
                        </td>
                        <td className="py-2 px-2">
                          <span className="font-inter text-[11px] text-silver/60">{item.category}</span>
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-2">
                            <div className="w-16 progress-bar h-1.5">
                              <div
                                className={`progress-bar-fill h-full rounded-full transition-all ${
                                  status === 'critical' ? 'bg-magenta' :
                                  status === 'warning' ? 'bg-yellow-400' : ''
                                }`}
                                style={{
                                  width: `${percentage}%`,
                                  boxShadow: status === 'critical' ? '0 0 8px rgba(255,80,150,0.5)' :
                                            status === 'warning' ? '0 0 8px rgba(250,204,21,0.5)' : ''
                                }}
                              />
                            </div>
                            <span className="font-mono text-[10px] text-silver/50">{item.current}/{item.max}</span>
                          </div>
                        </td>
                        <td className="py-2 px-2">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono uppercase ${
                            status === 'critical' ? 'bg-magenta/20 text-magenta border border-magenta/30' :
                            status === 'warning' ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30' :
                            'bg-emerald/20 text-emerald border border-emerald/30'
                          }`}>
                            <span className={`w-1 h-1 rounded-full ${
                              status === 'critical' ? 'bg-magenta animate-pulse' :
                              status === 'warning' ? 'bg-yellow-400' : 'bg-emerald'
                            }`} />
                            {status === 'critical' ? 'Reorder' : status === 'warning' ? 'Low' : 'Good'}
                          </span>
                        </td>
                        <td className="py-2 px-2">
                          <button
                            onClick={() => handleOrderClick(item)}
                            disabled={status === 'good'}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-sora font-medium transition-all ${
                              status !== 'good'
                                ? 'bg-blue text-white hover:bg-blue/80 glow-blue'
                                : 'bg-white/5 text-silver/40 cursor-not-allowed'
                            }`}
                          >
                            Order
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* Order Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="glass-card border-blue/20 max-w-md">
          <DialogHeader>
            <DialogTitle className="font-sora font-bold text-xl text-white">
              {orderSuccess ? 'Order Placed!' : 'Place Order'}
            </DialogTitle>
            {!orderSuccess && (
              <DialogDescription className="font-inter text-sm text-silver/60">
                Order more stock from the supplier
              </DialogDescription>
            )}
          </DialogHeader>

          {orderSuccess ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald/20 border border-emerald/40 flex items-center justify-center mx-auto mb-4 glow-emerald">
                <ShoppingCart className="w-6 h-6 text-emerald" />
              </div>
              <p className="font-sora font-semibold text-lg text-white mb-2">Order Confirmed</p>
              <p className="font-inter text-sm text-silver/60">Your order has been sent to {selectedItem?.supplier}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedItem && (
                <>
                  <div className="glass-card p-4 border-blue/20">
                    <p className="font-mono text-[10px] text-silver/50 uppercase mb-1">Product</p>
                    <p className="font-sora font-semibold text-white">{selectedItem.name}</p>
                    <p className="font-mono text-xs text-blue mt-1">{selectedItem.id}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass-card p-3 border-blue/10">
                      <p className="font-mono text-[10px] text-silver/50 uppercase mb-1">Current Stock</p>
                      <p className="font-sora font-bold text-white">{selectedItem.current}</p>
                    </div>
                    <div className="glass-card p-3 border-magenta/20">
                      <p className="font-mono text-[10px] text-silver/50 uppercase mb-1">Reorder At</p>
                      <p className="font-sora font-bold text-magenta">{selectedItem.reorderAt}</p>
                    </div>
                  </div>
                  <div className="glass-card p-4 border-blue/10">
                    <p className="font-mono text-[10px] text-silver/50 uppercase mb-1">Supplier</p>
                    <p className="font-inter text-sm text-white">{selectedItem.supplier}</p>
                  </div>
                  <div>
                    <label className="font-mono text-[10px] text-silver/50 uppercase mb-1.5 block">Order Quantity</label>
                    <input type="number" defaultValue={selectedItem.max - selectedItem.current} className="glass-input" />
                  </div>
                  <button onClick={handleConfirmOrder} className="w-full btn-primary flex items-center justify-center gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    Confirm Order
                  </button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
