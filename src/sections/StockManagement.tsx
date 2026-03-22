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
  { name: 'Mattresses', value: 73, color: '#3b82f6' },
  { name: 'Bedding', value: 168, color: '#22c55e' },
  { name: 'Pillows', value: 89, color: '#f97316' },
  { name: 'Accessories', value: 67, color: '#8b5cf6' },
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

// White tooltip for charts — dark text on white background
const tooltipStyle = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '10px',
  color: '#1e293b',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.10)',
  fontSize: '12px',
};

const tooltipLabelStyle = { color: '#1e293b', fontWeight: 600 };

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
      style={{ background: '#ffffff' }}
    >
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: `radial-gradient(circle, #cbd5e1 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative z-10 flex-1 flex flex-col max-w-7xl w-full mx-auto px-6 py-4 min-h-0">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-4 flex-shrink-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}
          >
            <Warehouse className="w-5 h-5" style={{ color: '#0ea5e9' }} />
          </div>
          <div>
            <h2 className="font-sora font-bold text-xl" style={{ color: '#1e293b' }}>Inventory</h2>
            <p className="font-inter text-xs" style={{ color: '#64748b' }}>
              Real-time stock tracking with automated reorder alerts
            </p>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-4 gap-3 mb-4 flex-shrink-0">

          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#f0f9ff' }}>
                <Package className="w-4 h-4" style={{ color: '#0ea5e9' }} />
              </div>
              <span className="font-mono text-[10px] flex items-center gap-1" style={{ color: '#22c55e' }}>
                <TrendingUp className="w-3 h-3" /> +12%
              </span>
            </div>
            <p className="font-sora font-bold text-2xl" style={{ color: '#1e293b' }}>397</p>
            <p className="font-inter text-xs mt-0.5" style={{ color: '#64748b' }}>Total Units</p>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#fef2f2' }}>
                <AlertTriangle className="w-4 h-4" style={{ color: '#ef4444' }} />
              </div>
              <span className="font-mono text-[10px]" style={{ color: '#ef4444' }}>Action Needed</span>
            </div>
            <p className="font-sora font-bold text-2xl" style={{ color: '#1e293b' }}>2</p>
            <p className="font-inter text-xs mt-0.5" style={{ color: '#64748b' }}>Low Stock Items</p>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#f0fdf4' }}>
                <TrendingUp className="w-4 h-4" style={{ color: '#22c55e' }} />
              </div>
              <span className="font-mono text-[10px]" style={{ color: '#22c55e' }}>Healthy</span>
            </div>
            <p className="font-sora font-bold text-2xl" style={{ color: '#1e293b' }}>68%</p>
            <p className="font-inter text-xs mt-0.5" style={{ color: '#64748b' }}>Avg Stock Level</p>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#faf5ff' }}>
                <ShoppingCart className="w-4 h-4" style={{ color: '#8b5cf6' }} />
              </div>
              <span className="font-mono text-[10px]" style={{ color: '#8b5cf6' }}>Pending</span>
            </div>
            <p className="font-sora font-bold text-2xl" style={{ color: '#1e293b' }}>3</p>
            <p className="font-inter text-xs mt-0.5" style={{ color: '#64748b' }}>Open Orders</p>
          </div>
        </div>

        {/* ── Body: Charts | Inventory Table ── */}
        <div className="flex-1 grid grid-cols-5 gap-4 min-h-0">

          {/* Left: Charts stacked */}
          <div className="col-span-2 flex flex-col gap-4 min-h-0">

            {/* Pie Chart — Stock by Category */}
            <div className="glass-card p-4 flex flex-col flex-1 min-h-0">
              <h3 className="font-sora font-semibold text-sm mb-3 flex-shrink-0" style={{ color: '#1e293b' }}>
                Stock by Category
              </h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={36}
                      outerRadius={60}
                      paddingAngle={3}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={1200}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelStyle={tooltipLabelStyle}
                      formatter={(value: number, name: string) => [
                        <span style={{ color: '#1e293b', fontWeight: 600 }}>{value} units</span>,
                        <span style={{ color: '#64748b' }}>{name}</span>,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2 flex-shrink-0">
                {categoryData.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                      <span className="font-inter text-[11px]" style={{ color: '#64748b' }}>{cat.name}</span>
                    </div>
                    <span className="font-mono text-[11px] font-medium" style={{ color: '#1e293b' }}>{cat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bar Chart — Weekly Movement */}
            <div className="glass-card p-4 flex flex-col flex-1 min-h-0">
              <h3 className="font-sora font-semibold text-sm mb-3 flex-shrink-0" style={{ color: '#1e293b' }}>
                Weekly Movement
              </h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} margin={{ top: 2, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.06)" />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelStyle={tooltipLabelStyle}
                      cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                    />
                    <Bar dataKey="incoming" name="Incoming" fill="#0ea5e9" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="outgoing" name="Outgoing" fill="#ef4444" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="flex gap-4 mt-2 flex-shrink-0">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-2 rounded-sm" style={{ background: '#0ea5e9' }} />
                  <span className="font-inter text-[11px]" style={{ color: '#64748b' }}>Incoming</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-2 rounded-sm" style={{ background: '#ef4444' }} />
                  <span className="font-inter text-[11px]" style={{ color: '#64748b' }}>Outgoing</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right: Inventory Items Table */}
          <div className="col-span-3 glass-card flex flex-col min-h-0 overflow-hidden">

            <div className="px-4 pt-4 pb-3 flex-shrink-0" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <h3 className="font-sora font-semibold text-sm" style={{ color: '#1e293b' }}>
                Inventory Items
              </h3>
              <p className="font-inter text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                Click Order to restock low or critical items
              </p>
            </div>

            <div className="overflow-y-auto flex-1 min-h-0">
              <table className="w-full">
                <thead className="sticky top-0 z-10" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th className="text-left py-2.5 px-4 font-mono text-[10px] uppercase tracking-wide" style={{ color: '#94a3b8' }}>SKU</th>
                    <th className="text-left py-2.5 px-4 font-mono text-[10px] uppercase tracking-wide" style={{ color: '#94a3b8' }}>Product</th>
                    <th className="text-left py-2.5 px-4 font-mono text-[10px] uppercase tracking-wide" style={{ color: '#94a3b8' }}>Supplier</th>
                    <th className="text-left py-2.5 px-4 font-mono text-[10px] uppercase tracking-wide" style={{ color: '#94a3b8' }}>Stock</th>
                    <th className="text-left py-2.5 px-4 font-mono text-[10px] uppercase tracking-wide" style={{ color: '#94a3b8' }}>Status</th>
                    <th className="text-left py-2.5 px-4 font-mono text-[10px] uppercase tracking-wide" style={{ color: '#94a3b8' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stockItems.map((item, index) => {
                    const percentage = getStockPercentage(item.current, item.max);
                    const status = getStockStatus(item.current, item.reorderAt);
                    const isLast = index === stockItems.length - 1;
                    return (
                      <tr
                        key={index}
                        style={{ borderBottom: isLast ? 'none' : '1px solid #f1f5f9' }}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        {/* SKU */}
                        <td className="py-3 px-4">
                          <span className="font-mono text-xs" style={{ color: '#0ea5e9' }}>{item.id}</span>
                        </td>

                        {/* Product */}
                        <td className="py-3 px-4">
                          <span className="font-inter text-sm font-medium" style={{ color: '#1e293b' }}>{item.name}</span>
                          <p className="font-inter text-[10px] mt-0.5" style={{ color: '#94a3b8' }}>{item.category}</p>
                        </td>

                        {/* Supplier */}
                        <td className="py-3 px-4">
                          <span className="font-inter text-xs" style={{ color: '#64748b' }}>{item.supplier}</span>
                        </td>

                        {/* Stock level */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 rounded-full overflow-hidden" style={{ height: '6px', background: '#f1f5f9' }}>
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${percentage}%`,
                                  background:
                                    status === 'critical' ? '#ef4444' :
                                    status === 'warning' ? '#f59e0b' :
                                    '#22c55e',
                                }}
                              />
                            </div>
                            <span className="font-mono text-[11px]" style={{ color: '#64748b' }}>
                              {item.current}<span style={{ color: '#cbd5e1' }}>/{item.max}</span>
                            </span>
                          </div>
                        </td>

                        {/* Status badge */}
                        <td className="py-3 px-4">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium"
                            style={{
                              background:
                                status === 'critical' ? '#fef2f2' :
                                status === 'warning' ? '#fffbeb' :
                                '#f0fdf4',
                              color:
                                status === 'critical' ? '#dc2626' :
                                status === 'warning' ? '#d97706' :
                                '#16a34a',
                              border:
                                status === 'critical' ? '1px solid #fecaca' :
                                status === 'warning' ? '1px solid #fde68a' :
                                '1px solid #bbf7d0',
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{
                                background:
                                  status === 'critical' ? '#dc2626' :
                                  status === 'warning' ? '#d97706' :
                                  '#16a34a',
                              }}
                            />
                            {status === 'critical' ? 'Reorder' : status === 'warning' ? 'Low' : 'Good'}
                          </span>
                        </td>

                        {/* Action button */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleOrderClick(item)}
                            disabled={status === 'good'}
                            className="px-3 py-1.5 rounded-lg text-xs font-sora font-semibold transition-all"
                            style={
                              status !== 'good'
                                ? {
                                    background: '#0ea5e9',
                                    color: '#ffffff',
                                    boxShadow: '0 2px 8px rgba(14,165,233,0.3)',
                                  }
                                : {
                                    background: '#f1f5f9',
                                    color: '#94a3b8',
                                    cursor: 'not-allowed',
                                  }
                            }
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
        <DialogContent className="max-w-md" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <DialogHeader>
            <DialogTitle className="font-sora font-bold text-xl" style={{ color: '#1e293b' }}>
              {orderSuccess ? 'Order Placed!' : 'Place Order'}
            </DialogTitle>
            {!orderSuccess && (
              <DialogDescription className="font-inter text-sm" style={{ color: '#64748b' }}>
                Order more stock from the supplier
              </DialogDescription>
            )}
          </DialogHeader>

          {orderSuccess ? (
            <div className="text-center py-6">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
              >
                <ShoppingCart className="w-6 h-6" style={{ color: '#22c55e' }} />
              </div>
              <p className="font-sora font-semibold text-lg" style={{ color: '#1e293b' }}>Order Confirmed</p>
              <p className="font-inter text-sm mt-1" style={{ color: '#64748b' }}>
                Your order has been sent to {selectedItem?.supplier}
              </p>
            </div>
          ) : (
            <div className="space-y-4 mt-2">
              {selectedItem && (
                <>
                  {/* Product */}
                  <div className="rounded-xl p-4" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <p className="font-mono text-[10px] uppercase tracking-wide mb-1" style={{ color: '#94a3b8' }}>Product</p>
                    <p className="font-sora font-semibold" style={{ color: '#1e293b' }}>{selectedItem.name}</p>
                    <p className="font-mono text-xs mt-1" style={{ color: '#0ea5e9' }}>{selectedItem.id}</p>
                  </div>

                  {/* Current / Reorder grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl p-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <p className="font-mono text-[10px] uppercase tracking-wide mb-1" style={{ color: '#94a3b8' }}>Current Stock</p>
                      <p className="font-sora font-bold text-lg" style={{ color: '#1e293b' }}>{selectedItem.current}</p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                      <p className="font-mono text-[10px] uppercase tracking-wide mb-1" style={{ color: '#94a3b8' }}>Reorder At</p>
                      <p className="font-sora font-bold text-lg" style={{ color: '#dc2626' }}>{selectedItem.reorderAt}</p>
                    </div>
                  </div>

                  {/* Supplier */}
                  <div className="rounded-xl p-4" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <p className="font-mono text-[10px] uppercase tracking-wide mb-1" style={{ color: '#94a3b8' }}>Supplier</p>
                    <p className="font-inter text-sm font-medium" style={{ color: '#1e293b' }}>{selectedItem.supplier}</p>
                  </div>

                  {/* Quantity input */}
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-wide mb-2 block" style={{ color: '#64748b' }}>
                      Order Quantity
                    </label>
                    <input
                      type="number"
                      defaultValue={selectedItem.max - selectedItem.current}
                      className="w-full px-4 py-2.5 rounded-xl"
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        color: '#1e293b',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <button
                    onClick={handleConfirmOrder}
                    className="w-full py-2.5 rounded-xl font-sora font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                    style={{
                      background: '#0ea5e9',
                      color: '#ffffff',
                      boxShadow: '0 4px 14px rgba(14,165,233,0.35)',
                    }}
                  >
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
