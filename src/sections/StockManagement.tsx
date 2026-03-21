import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
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
  AreaChart,
  Area
} from 'recharts';
import { Package, AlertTriangle, ShoppingCart, TrendingUp, Warehouse } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

gsap.registerPlugin(ScrollTrigger);

// Stock data with reorder thresholds
const stockItems = [
  { id: 'SKU-001', name: 'Memory Foam Mattress', category: 'Mattresses', current: 45, max: 100, reorderAt: 30, supplier: 'SleepTech Corp' },
  { id: 'SKU-002', name: 'Pillow Top Queen', category: 'Mattresses', current: 28, max: 80, reorderAt: 25, supplier: 'ComfortZone Ltd' },
  { id: 'SKU-003', name: 'Luxury Bed Sheets', category: 'Bedding', current: 156, max: 200, reorderAt: 50, supplier: 'SoftTouch Textiles' },
  { id: 'SKU-004', name: 'Down Alternative Pillow', category: 'Pillows', current: 89, max: 150, reorderAt: 40, supplier: 'PillowPerfect Inc' },
  { id: 'SKU-005', name: 'Weighted Blanket', category: 'Bedding', current: 12, max: 60, reorderAt: 20, supplier: 'CozyWrap Co' },
  { id: 'SKU-006', name: 'Mattress Protector', category: 'Accessories', current: 67, max: 120, reorderAt: 30, supplier: 'GuardSleep Pro' },
];

// Category data for pie chart
const categoryData = [
  { name: 'Mattresses', value: 73, color: '#0096ff' },
  { name: 'Bedding', value: 168, color: '#32dc96' },
  { name: 'Pillows', value: 89, color: '#ff5096' },
  { name: 'Accessories', value: 67, color: '#a855f7' },
];

// Weekly stock movement data
const weeklyData = [
  { day: 'Mon', incoming: 45, outgoing: 32 },
  { day: 'Tue', incoming: 38, outgoing: 41 },
  { day: 'Wed', incoming: 52, outgoing: 28 },
  { day: 'Thu', incoming: 29, outgoing: 45 },
  { day: 'Fri', incoming: 41, outgoing: 38 },
  { day: 'Sat', incoming: 18, outgoing: 22 },
  { day: 'Sun', incoming: 12, outgoing: 15 },
];

// Stock trend data
const trendData = [
  { month: 'Jan', stock: 420 },
  { month: 'Feb', stock: 385 },
  { month: 'Mar', stock: 410 },
  { month: 'Apr', stock: 395 },
  { month: 'May', stock: 450 },
  { month: 'Jun', stock: 397 },
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

// 3D Pie Chart Component
function PieChart3D({ data, isLoading }: { data: typeof categoryData; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue/20 border-t-blue rounded-full animate-spin" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-cyan/40 rounded-full animate-spin" style={{ animationDuration: '1.5s' }} />
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={45}
          outerRadius={75}
          paddingAngle={3}
          dataKey="value"
          animationBegin={0}
          animationDuration={1500}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.color}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            background: 'rgba(10, 22, 40, 0.95)', 
            border: '1px solid rgba(0, 150, 255, 0.3)',
            borderRadius: '12px',
            color: '#e8f4ff',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// Holographic Chart Container
function HolographicChart({ 
  children, 
  title, 
  isLoading,
  className = ''
}: { 
  children: React.ReactNode; 
  title: string; 
  isLoading: boolean;
  className?: string;
}) {
  return (
    <div className={`stock-card glass-card p-5 relative overflow-hidden ${className}`}>
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-navy-900/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
          <div className="relative mb-4">
            <div className="w-12 h-12 border-3 border-blue/20 border-t-blue rounded-full animate-spin" />
            <div className="absolute inset-0 w-12 h-12 border-3 border-transparent border-t-cyan/50 rounded-full animate-spin" style={{ animationDuration: '1.2s', animationDirection: 'reverse' }} />
          </div>
          <p className="font-mono text-xs text-blue animate-pulse">Initializing Hologram...</p>
        </div>
      )}
      
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-blue/40 rounded-tl-lg" />
      <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-blue/40 rounded-tr-lg" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-blue/40 rounded-bl-lg" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-blue/40 rounded-br-lg" />
      
      <h3 className="font-sora font-semibold text-sm text-white mb-4 relative z-10 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-blue animate-pulse" />
        {title}
      </h3>
      
      <div className="relative z-10" style={{ height: '200px' }}>
        {children}
      </div>
    </div>
  );
}

export default function StockManagement() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [chartsLoading, setChartsLoading] = useState(true);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header animation
      gsap.fromTo(
        '.stock-header',
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Stats cards animation
      gsap.fromTo(
        '.stat-card',
        { y: 40, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.stats-grid',
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Charts animation - trigger loading then reveal
      ScrollTrigger.create({
        trigger: '.charts-grid',
        start: 'top 80%',
        onEnter: () => {
          setChartsLoading(true);
          setTimeout(() => {
            setChartsLoading(false);
            gsap.fromTo(
              '.chart-card',
              { y: 30, opacity: 0, rotateX: 15 },
              { y: 0, opacity: 1, rotateX: 0, duration: 0.8, stagger: 0.15, ease: 'power2.out' }
            );
          }, 1200);
        },
      });

      // Table animation
      gsap.fromTo(
        '.stock-table',
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.stock-table',
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const getStockPercentage = (current: number, max: number) => {
    return Math.round((current / max) * 100);
  };

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
    setTimeout(() => {
      setOrderDialogOpen(false);
    }, 2000);
  };

  return (
    <div
      id="stock"
      ref={sectionRef}
      className="relative w-full min-h-screen py-16"
      style={{
        background: 'linear-gradient(180deg, #0a1628 0%, #0d1e36 50%, #0a1628 100%)',
      }}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 150, 255, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 150, 255, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${4 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-8">
        {/* Header */}
        <div className="stock-header mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue/10 border border-blue/30 flex items-center justify-center glow-blue">
              <Warehouse className="w-6 h-6 text-blue" />
            </div>
            <div>
              <h2 className="font-sora font-bold text-2xl text-white tracking-tight-custom text-glow-blue">
                Stock Management
              </h2>
              <p className="font-inter text-sm text-silver/60">
                Real-time inventory tracking with automated reorder alerts
              </p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="stats-grid grid grid-cols-4 gap-4 mb-8">
          <div className="stat-card glass-card p-5 relative overflow-hidden group hover:border-blue/40 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-3 relative z-10">
              <Package className="w-5 h-5 text-blue" />
              <span className="font-mono text-xs text-emerald flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +12%
              </span>
            </div>
            <p className="font-sora font-bold text-2xl text-white relative z-10">397</p>
            <p className="font-inter text-xs text-silver/60 mt-1 relative z-10">Total Units</p>
          </div>

          <div className="stat-card glass-card p-5 relative overflow-hidden group hover:border-magenta/40 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-magenta/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-3 relative z-10">
              <AlertTriangle className="w-5 h-5 text-magenta" />
              <span className="font-mono text-xs text-magenta">Action Needed</span>
            </div>
            <p className="font-sora font-bold text-2xl text-white relative z-10">2</p>
            <p className="font-inter text-xs text-silver/60 mt-1 relative z-10">Low Stock Items</p>
          </div>

          <div className="stat-card glass-card p-5 relative overflow-hidden group hover:border-emerald/40 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-3 relative z-10">
              <TrendingUp className="w-5 h-5 text-emerald" />
              <span className="font-mono text-xs text-emerald">Healthy</span>
            </div>
            <p className="font-sora font-bold text-2xl text-white relative z-10">68%</p>
            <p className="font-inter text-xs text-silver/60 mt-1 relative z-10">Avg Stock Level</p>
          </div>

          <div className="stat-card glass-card p-5 relative overflow-hidden group hover:border-purple/40 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-3 relative z-10">
              <ShoppingCart className="w-5 h-5 text-purple-400" />
              <span className="font-mono text-xs text-purple-400">Pending</span>
            </div>
            <p className="font-sora font-bold text-2xl text-white relative z-10">3</p>
            <p className="font-inter text-xs text-silver/60 mt-1 relative z-10">Open Orders</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="charts-grid grid grid-cols-3 gap-6 mb-8">
          {/* 3D Pie Chart - Category Distribution */}
          <HolographicChart title="Stock by Category" isLoading={chartsLoading} className="chart-card">
            <PieChart3D data={categoryData} isLoading={chartsLoading} />
            <div className="flex flex-wrap gap-2 mt-3">
              {categoryData.map((cat, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: cat.color, boxShadow: `0 0 6px ${cat.color}` }} />
                  <span className="font-mono text-[10px] text-silver/60">{cat.name}</span>
                </div>
              ))}
            </div>
          </HolographicChart>

          {/* Bar Chart - Weekly Movement */}
          <HolographicChart title="Weekly Movement" isLoading={chartsLoading} className="chart-card">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill: '#a8c4e8', fontSize: 10 }} axisLine={false} />
                <YAxis tick={{ fill: '#a8c4e8', fontSize: 10 }} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(10, 22, 40, 0.95)', 
                    border: '1px solid rgba(0, 150, 255, 0.3)',
                    borderRadius: '12px',
                    color: '#e8f4ff',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                  }}
                />
                <Bar dataKey="incoming" fill="#0096ff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outgoing" fill="#ff5096" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue" style={{ boxShadow: '0 0 6px #0096ff' }} />
                <span className="font-mono text-[10px] text-silver/60">Incoming</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-magenta" style={{ boxShadow: '0 0 6px #ff5096' }} />
                <span className="font-mono text-[10px] text-silver/60">Outgoing</span>
              </div>
            </div>
          </HolographicChart>

          {/* Area Chart - Stock Trend */}
          <HolographicChart title="6-Month Trend" isLoading={chartsLoading} className="chart-card">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0096ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0096ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: '#a8c4e8', fontSize: 10 }} axisLine={false} />
                <YAxis tick={{ fill: '#a8c4e8', fontSize: 10 }} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(10, 22, 40, 0.95)', 
                    border: '1px solid rgba(0, 150, 255, 0.3)',
                    borderRadius: '12px',
                    color: '#e8f4ff',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="stock" 
                  stroke="#0096ff" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorStock)" 
                />
              </AreaChart>
            </ResponsiveContainer>
            <p className="font-mono text-[10px] text-silver/60 mt-3">
              Total stock units over time
            </p>
          </HolographicChart>
        </div>

        {/* Stock Items Table */}
        <div className="stock-table glass-card p-5 relative overflow-hidden">
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-blue/40 rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-blue/40 rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-blue/40 rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-blue/40 rounded-br-xl" />
          
          <h3 className="font-sora font-semibold text-sm text-white mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue animate-pulse" />
            Inventory Items
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 font-mono text-[10px] text-silver/50 uppercase tracking-wide">SKU</th>
                  <th className="text-left py-3 px-4 font-mono text-[10px] text-silver/50 uppercase tracking-wide">Product</th>
                  <th className="text-left py-3 px-4 font-mono text-[10px] text-silver/50 uppercase tracking-wide">Category</th>
                  <th className="text-left py-3 px-4 font-mono text-[10px] text-silver/50 uppercase tracking-wide">Stock Level</th>
                  <th className="text-left py-3 px-4 font-mono text-[10px] text-silver/50 uppercase tracking-wide">Status</th>
                  <th className="text-left py-3 px-4 font-mono text-[10px] text-silver/50 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody>
                {stockItems.map((item, index) => {
                  const percentage = getStockPercentage(item.current, item.max);
                  const status = getStockStatus(item.current, item.reorderAt);
                  
                  return (
                    <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4">
                        <span className="font-mono text-xs text-blue">{item.id}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-inter text-sm text-white">{item.name}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-inter text-xs text-silver/70">{item.category}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 progress-bar h-1.5">
                            <div 
                              className={`progress-bar-fill h-full rounded-full transition-all ${
                                status === 'critical' ? 'bg-magenta' : 
                                status === 'warning' ? 'bg-yellow-400' : ''
                              }`}
                              style={{ 
                                width: `${percentage}%`,
                                boxShadow: status === 'critical' ? '0 0 10px rgba(255, 80, 150, 0.5)' : 
                                          status === 'warning' ? '0 0 10px rgba(250, 204, 21, 0.5)' : ''
                              }}
                            />
                          </div>
                          <span className="font-mono text-xs text-silver/60">{item.current}/{item.max}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-mono uppercase ${
                          status === 'critical' 
                            ? 'bg-magenta/20 text-magenta border border-magenta/30' :
                          status === 'warning' 
                            ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30' :
                            'bg-emerald/20 text-emerald border border-emerald/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            status === 'critical' ? 'bg-magenta animate-pulse' :
                            status === 'warning' ? 'bg-yellow-400' : 'bg-emerald'
                          }`} />
                          {status === 'critical' ? 'Reorder Now' : status === 'warning' ? 'Low Stock' : 'Good'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleOrderClick(item)}
                          disabled={status !== 'critical' && status !== 'warning'}
                          className={`px-3 py-1.5 rounded-lg text-xs font-sora font-medium transition-all ${
                            status === 'critical' || status === 'warning'
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
              <p className="font-sora font-semibold text-lg text-white mb-2">
                Order Confirmed
              </p>
              <p className="font-inter text-sm text-silver/60">
                Your order has been sent to {selectedItem?.supplier}
              </p>
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
                    <label className="font-mono text-[10px] text-silver/50 uppercase mb-1.5 block">
                      Order Quantity
                    </label>
                    <input
                      type="number"
                      defaultValue={selectedItem.max - selectedItem.current}
                      className="glass-input"
                    />
                  </div>

                  <button
                    onClick={handleConfirmOrder}
                    className="w-full btn-primary flex items-center justify-center gap-2"
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
