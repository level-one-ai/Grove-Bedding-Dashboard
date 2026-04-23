import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import {
  Package, AlertTriangle, ShoppingCart, TrendingUp,
  Warehouse, Plus, CheckCheck, AlertCircle,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { PageId } from '../App';

const stockItems = [
  { id: 'SKU-001', name: 'Memory Foam Mattress',   category: 'Mattresses',  current: 45,  max: 100, reorderAt: 30, supplier: 'Birlea' },
  { id: 'SKU-002', name: 'Pillow Top Queen',        category: 'Mattresses',  current: 28,  max: 80,  reorderAt: 25, supplier: 'Birlea' },
  { id: 'SKU-003', name: 'Luxury Bed Sheets',       category: 'Bedding',     current: 156, max: 200, reorderAt: 50, supplier: 'Birlea' },
  { id: 'SKU-004', name: 'Down Alternative Pillow', category: 'Pillows',     current: 89,  max: 150, reorderAt: 40, supplier: 'Birlea' },
  { id: 'SKU-005', name: 'Weighted Blanket',        category: 'Bedding',     current: 12,  max: 60,  reorderAt: 20, supplier: 'Birlea' },
  { id: 'SKU-006', name: 'Mattress Protector',      category: 'Accessories', current: 67,  max: 120, reorderAt: 30, supplier: 'Birlea' },
];

interface StockItem {
  id: string; name: string; category: string;
  current: number; max: number; reorderAt: number; supplier: string;
}

interface Props { setActivePage: (page: PageId) => void; }

type StepStatus = 'idle' | 'running' | 'done' | 'error';

interface AutoStep {
  id: number; icon: string; label: string; sublabel: string;
  status: StepStatus; timestamp: string;
}

const BIRLEA_STEPS: Omit<AutoStep, 'status' | 'timestamp'>[] = [
  { id: 1, icon: '📦', label: 'Low Stock',  sublabel: 'Alert detected'  },
  { id: 2, icon: '⚡', label: 'Make.com',   sublabel: 'Trigger webhook' },
  { id: 3, icon: '🧠', label: 'Claude AI',  sublabel: 'Build order'     },
  { id: 4, icon: '📧', label: 'Email',      sublabel: 'Send to Birlea'  },
  { id: 5, icon: '✅', label: 'Confirmed',  sublabel: 'Order placed'    },
];

function buildIdleSteps(): AutoStep[] {
  return BIRLEA_STEPS.map(s => ({ ...s, status: 'idle', timestamp: '' }));
}

function ftimeNow() {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function BirleaVisualiser({ steps, isRunning }: { steps: AutoStep[]; isRunning: boolean }) {
  const allDone  = steps.every(s => s.status === 'done');
  const hasError = steps.some(s => s.status === 'error');
  const isIdle   = steps.every(s => s.status === 'idle');
  return (
    <div className="w-full">
      <div className="flex justify-end mb-2">
        {isRunning && <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200"><div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" /><span className="font-sora text-[10px] font-semibold text-sky-600">Ordering…</span></div>}
        {allDone && !isRunning && <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200"><CheckCheck className="w-2.5 h-2.5 text-emerald-500" /><span className="font-sora text-[10px] font-semibold text-emerald-600">Order Sent</span></div>}
        {hasError && <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200"><AlertCircle className="w-2.5 h-2.5 text-red-500" /><span className="font-sora text-[10px] font-semibold text-red-600">Failed</span></div>}
        {isIdle && <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200"><div className="w-1.5 h-1.5 rounded-full bg-slate-400" /><span className="font-sora text-[10px] font-semibold text-slate-500">Idle</span></div>}
      </div>
      <div className="flex items-start justify-center w-full overflow-x-auto pb-1">
        {steps.map((step, idx) => {
          const c = {
            idle:    { border: '#e2e8f0', bg: '#f8fafc', textCol: '#94a3b8', dotCol: '#cbd5e1', shadow: 'none' },
            running: { border: '#0ea5e9', bg: '#f0f9ff', textCol: '#0369a1', dotCol: '#0ea5e9', shadow: '0 0 0 5px #bae6fd' },
            done:    { border: '#10b981', bg: '#f0fdf4', textCol: '#065f46', dotCol: '#10b981', shadow: '0 0 0 3px #a7f3d0' },
            error:   { border: '#ef4444', bg: '#fef2f2', textCol: '#991b1b', dotCol: '#ef4444', shadow: 'none' },
          }[step.status];
          return (
            <div key={step.id} className="flex items-center flex-shrink-0">
              <div className="flex flex-col items-center" style={{ width: '90px' }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 relative"
                  style={{ border: `2.5px solid ${c.border}`, background: c.bg, boxShadow: c.shadow }}>
                  <span className="text-2xl select-none transition-all duration-500" style={{ filter: step.status === 'idle' ? 'grayscale(1) opacity(0.35)' : 'none' }}>{step.icon}</span>
                  {step.status === 'running' && <div className="absolute inset-0 rounded-full animate-spin" style={{ border: '2.5px solid transparent', borderTopColor: '#0ea5e9', margin: '-5px' }} />}
                </div>
                <p className="font-sora font-semibold text-[10px] mt-1.5 text-center" style={{ color: c.textCol }}>{step.label}</p>
                <p className="font-inter text-[9px] text-slate-400 text-center leading-tight">{step.sublabel}</p>
                <div className="mt-1.5 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.dotCol }} />
                  <span className="font-mono text-[8px] font-semibold uppercase" style={{ color: c.dotCol }}>{step.status}</span>
                </div>
                {step.timestamp && <p className="font-mono text-[8px] text-slate-400 mt-0.5">{step.timestamp}</p>}
              </div>
              {idx < steps.length - 1 && (
                <div className="flex items-center flex-shrink-0 mb-8" style={{ width: '24px' }}>
                  <div className="h-px flex-1 transition-all duration-500" style={{ background: steps[idx + 1].status !== 'idle' ? '#10b981' : '#e2e8f0' }} />
                  <div style={{ width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: `6px solid ${steps[idx + 1].status !== 'idle' ? '#10b981' : '#e2e8f0'}` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function StockManagement({ setActivePage }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [selectedItem, setSelectedItem]   = useState<StockItem | null>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [automationSteps, setAutomationSteps] = useState<AutoStep[]>(buildIdleSteps());
  const [automationRunning, setAutomationRunning] = useState(false);
  const [automationResult, setAutomationResult] = useState<string | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(sectionRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const pct = (c: number, m: number) => Math.round((c / m) * 100);
  const status = (c: number, r: number) => c <= r ? 'critical' : c <= r * 1.5 ? 'warning' : 'good';

  const handleOrderClick = (item: StockItem) => { setSelectedItem(item); setOrderDialogOpen(true); };

  const handleConfirmOrder = async () => {
    setOrderDialogOpen(false);
    setAutomationRunning(true);
    setAutomationResult(null);
    setAutomationSteps(buildIdleSteps());
    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
    const upd = (id: number, s: StepStatus) => {
      const ts = ftimeNow();
      setAutomationSteps(prev => prev.map(step => {
        if (step.id < id && (step.status === 'idle' || step.status === 'running')) return { ...step, status: 'done', timestamp: ts };
        if (step.id === id) return { ...step, status: s, timestamp: ts };
        return step;
      }));
    };
    upd(1, 'running'); await delay(700);
    upd(2, 'running'); await delay(900);
    upd(3, 'running'); await delay(1100);
    upd(4, 'running'); await delay(900);
    upd(5, 'running'); await delay(600);
    const ts = ftimeNow();
    setAutomationSteps(prev => prev.map(s => ({ ...s, status: 'done', timestamp: ts })));
    setAutomationRunning(false);
    setAutomationResult(`Order placed for ${selectedItem?.name} with Birlea`);
  };

  const totalUnits = stockItems.reduce((sum, i) => sum + i.current, 0);
  const lowCount   = stockItems.filter(i => status(i.current, i.reorderAt) !== 'good').length;

  return (
    <div id="stock" ref={sectionRef} className="relative w-full h-full overflow-hidden flex flex-col" style={{ background: '#ffffff' }}>
      <div className="absolute inset-0 opacity-[0.4]" style={{ backgroundImage: `radial-gradient(circle, #cbd5e1 1px, transparent 1px)`, backgroundSize: '28px 28px' }} />

      <div className="relative z-10 flex-1 flex flex-col max-w-7xl w-full mx-auto px-6 py-4 min-h-0 gap-3">

        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
              <Warehouse className="w-5 h-5" style={{ color: '#0ea5e9' }} />
            </div>
            <div>
              <h2 className="font-sora font-bold text-xl" style={{ color: '#1e293b' }}>Inventory</h2>
              <p className="font-inter text-xs" style={{ color: '#64748b' }}>Real-time stock tracking · Birlea auto-ordering</p>
            </div>
          </div>
          <button onClick={() => setActivePage('orders')} className="flex items-center gap-2 px-4 py-2 rounded-xl font-sora font-semibold text-xs transition-all" style={{ background: '#0ea5e9', color: '#ffffff', boxShadow: '0 2px 10px rgba(14,165,233,0.3)' }}>
            <Plus className="w-3.5 h-3.5" /> Make an Order
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-3 flex-shrink-0">
          <div className="glass-card px-4 py-2.5 flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#f0f9ff' }}>
              <Package className="w-3.5 h-3.5" style={{ color: '#0ea5e9' }} />
            </div>
            <div>
              <p className="font-sora font-bold text-lg leading-none" style={{ color: '#1e293b' }}>{totalUnits}</p>
              <p className="font-inter text-[10px] mt-0.5" style={{ color: '#64748b' }}>Total Units</p>
            </div>
            <span className="font-mono text-[10px] ml-2 flex items-center gap-0.5" style={{ color: '#22c55e' }}><TrendingUp className="w-3 h-3" /> +12%</span>
          </div>
          <div className="glass-card px-4 py-2.5 flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#fef2f2' }}>
              <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
            </div>
            <div>
              <p className="font-sora font-bold text-lg leading-none" style={{ color: '#1e293b' }}>{lowCount}</p>
              <p className="font-inter text-[10px] mt-0.5" style={{ color: '#64748b' }}>Low Stock</p>
            </div>
            <span className="font-mono text-[10px] ml-2" style={{ color: '#ef4444' }}>Action Needed</span>
          </div>
        </div>

        {/* Table */}
        <div className="glass-card flex flex-col min-h-0" style={{ flex: '1 1 0' }}>
          <div className="px-4 py-2.5 flex-shrink-0" style={{ borderBottom: '1px solid #f1f5f9' }}>
            <h3 className="font-sora font-semibold text-sm" style={{ color: '#1e293b' }}>Inventory Items</h3>
            <p className="font-inter text-xs mt-0.5" style={{ color: '#94a3b8' }}>Click Order to trigger Birlea auto-ordering</p>
          </div>
          <div className="overflow-y-auto flex-1 min-h-0">
            <table className="w-full">
              <thead className="sticky top-0 z-10" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>{['SKU','Product','Supplier','Stock','Status','Action'].map(h => <th key={h} className="text-left py-2 px-4 font-mono text-[10px] uppercase tracking-wide" style={{ color: '#94a3b8' }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {stockItems.map((item, i) => {
                  const p = pct(item.current, item.max);
                  const s = status(item.current, item.reorderAt);
                  const bg  = s === 'critical' ? '#fef2f2' : s === 'warning' ? '#fffbeb' : '#f0fdf4';
                  const col = s === 'critical' ? '#dc2626' : s === 'warning' ? '#d97706' : '#16a34a';
                  const bdr = s === 'critical' ? '#fecaca' : s === 'warning' ? '#fde68a' : '#bbf7d0';
                  return (
                    <tr key={i} style={{ borderBottom: i === stockItems.length - 1 ? 'none' : '1px solid #f1f5f9' }} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-4"><span className="font-mono text-xs" style={{ color: '#0ea5e9' }}>{item.id}</span></td>
                      <td className="py-2.5 px-4"><span className="font-inter text-sm font-medium" style={{ color: '#1e293b' }}>{item.name}</span><p className="font-inter text-[10px]" style={{ color: '#94a3b8' }}>{item.category}</p></td>
                      <td className="py-2.5 px-4"><span className="font-inter text-xs" style={{ color: '#64748b' }}>{item.supplier}</span></td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 rounded-full overflow-hidden" style={{ height: '5px', background: '#f1f5f9' }}>
                            <div className="h-full rounded-full" style={{ width: `${p}%`, background: col }} />
                          </div>
                          <span className="font-mono text-[11px]" style={{ color: '#64748b' }}>{item.current}<span style={{ color: '#cbd5e1' }}>/{item.max}</span></span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium" style={{ background: bg, color: col, border: `1px solid ${bdr}` }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: col }} />
                          {s === 'critical' ? 'Reorder' : s === 'warning' ? 'Low' : 'Good'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <button onClick={() => handleOrderClick(item)} disabled={s === 'good'} className="px-3 py-1 rounded-lg text-xs font-sora font-semibold transition-all"
                          style={s !== 'good' ? { background: '#0ea5e9', color: '#fff', boxShadow: '0 2px 8px rgba(14,165,233,0.3)' } : { background: '#f1f5f9', color: '#94a3b8', cursor: 'not-allowed' }}>
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

        {/* Birlea Automation Visualiser */}
        <div className="flex-shrink-0 bg-white border border-slate-200 rounded-xl shadow-sm px-6 py-3 mx-auto w-fit">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-sora font-semibold text-sm" style={{ color: '#1e293b' }}>Birlea Auto-Order Pipeline</p>
              <p className="font-inter text-[10px]" style={{ color: '#94a3b8' }}>Triggered when stock falls below reorder threshold</p>
            </div>
          </div>
          <BirleaVisualiser steps={automationSteps} isRunning={automationRunning} />
          {automationResult && !automationRunning && (
            <div className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <CheckCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <p className="font-sora text-xs font-semibold text-emerald-700">{automationResult}</p>
            </div>
          )}
        </div>

      </div>

      {/* Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="max-w-md" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <DialogHeader>
            <DialogTitle className="font-sora font-bold text-xl" style={{ color: '#1e293b' }}>Place Birlea Order</DialogTitle>
            <DialogDescription className="font-inter text-sm" style={{ color: '#64748b' }}>This will trigger the automated ordering pipeline</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4 mt-2">
              <div className="rounded-xl p-4" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <p className="font-mono text-[10px] uppercase tracking-wide mb-1" style={{ color: '#94a3b8' }}>Product</p>
                <p className="font-sora font-semibold" style={{ color: '#1e293b' }}>{selectedItem.name}</p>
                <p className="font-mono text-xs mt-1" style={{ color: '#0ea5e9' }}>{selectedItem.id}</p>
              </div>
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
              <div className="rounded-xl p-4" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                <p className="font-mono text-[10px] uppercase tracking-wide mb-1" style={{ color: '#94a3b8' }}>Supplier</p>
                <p className="font-inter text-sm font-semibold" style={{ color: '#0369a1' }}>{selectedItem.supplier}</p>
                <p className="font-inter text-[10px] mt-0.5" style={{ color: '#7dd3fc' }}>Order will be sent automatically via Make.com</p>
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wide mb-2 block" style={{ color: '#64748b' }}>Order Quantity</label>
                <input type="number" defaultValue={selectedItem.max - selectedItem.current} className="w-full px-4 py-2.5 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', outline: 'none' }} />
              </div>
              <button onClick={handleConfirmOrder} className="w-full py-2.5 rounded-xl font-sora font-semibold text-sm flex items-center justify-center gap-2 transition-all" style={{ background: '#0ea5e9', color: '#ffffff', boxShadow: '0 4px 14px rgba(14,165,233,0.35)' }}>
                <ShoppingCart className="w-4 h-4" /> Confirm &amp; Send to Birlea
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
