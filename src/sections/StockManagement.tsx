import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import {
  Package, AlertTriangle, ShoppingCart, TrendingUp,
  Warehouse, Plus, CheckCheck, AlertCircle,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { PageId } from '../App';

// ── Stock items — id = your internal SKU, birleaCode = Birlea's product code for the CSV ──
const stockItems = [
  { id: 'SKU-001', birleaCode: 'CASSO46CHA',    name: 'Memory Foam Mattress',   category: 'Mattresses',  current: 45,  max: 100, reorderAt: 30, supplier: 'Birlea' },
  { id: 'SKU-002', birleaCode: 'SS-46BLISS800', name: 'Pillow Top Queen',        category: 'Mattresses',  current: 28,  max: 80,  reorderAt: 25, supplier: 'Birlea' },
  { id: 'SKU-003', birleaCode: 'LXSHT-KNG',     name: 'Luxury Bed Sheets',       category: 'Bedding',     current: 156, max: 200, reorderAt: 50, supplier: 'Birlea' },
  { id: 'SKU-004', birleaCode: 'PIL-DOWNA-D',   name: 'Down Alternative Pillow', category: 'Pillows',     current: 89,  max: 150, reorderAt: 40, supplier: 'Birlea' },
  { id: 'SKU-005', birleaCode: 'WB-COZY-DBL',   name: 'Weighted Blanket',        category: 'Bedding',     current: 12,  max: 60,  reorderAt: 20, supplier: 'Birlea' },
  { id: 'SKU-006', birleaCode: 'MPROT-STD',     name: 'Mattress Protector',      category: 'Accessories', current: 67,  max: 120, reorderAt: 30, supplier: 'Birlea' },
];

interface StockItem {
  id: string; birleaCode: string; name: string; category: string;
  current: number; max: number; reorderAt: number; supplier: string;
}

interface Props { setActivePage: (page: PageId) => void; }

type StepStatus = 'idle' | 'running' | 'done' | 'error';
type OrderType  = 'standard' | 'nextday' | 'homedelivery' | 'collection';

interface AutoStep {
  id: number; icon: string; label: string; sublabel: string;
  status: StepStatus; timestamp: string;
}

const BIRLEA_STEPS: Omit<AutoStep, 'status' | 'timestamp'>[] = [
  { id: 1, icon: '📦', label: 'Low Stock',  sublabel: 'Alert detected'  },
  { id: 2, icon: '⚡', label: 'Make.com',   sublabel: 'Build CSV'       },
  { id: 3, icon: '📎', label: 'Attach CSV', sublabel: 'Format & attach' },
  { id: 4, icon: '📧', label: 'Email',      sublabel: 'Send to Birlea'  },
  { id: 5, icon: '✅', label: 'Confirmed',  sublabel: 'Order placed'    },
];



// Exact Order Type labels that Birlea's ERP expects
const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  standard:     'Standard',
  nextday:      'Next Day',
  homedelivery: 'Home Delivery',
  collection:   'Customer Collection',
};

const ORDER_TYPE_EMAILS: Record<OrderType, string> = {
  standard:     'orders@birlea.com',
  nextday:      'nextday@birlea.com',
  homedelivery: 'homedelivery@birlea.com',
  collection:   'orders@birlea.com',
};

function buildIdleSteps(): AutoStep[] {
  return BIRLEA_STEPS.map(s => ({ ...s, status: 'idle', timestamp: '' }));
}

function ftimeNow() {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}



// ── Pipeline visualiser ───────────────────────────────────────────────────────
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

// ── Main component ────────────────────────────────────────────────────────────
export default function StockManagement({ setActivePage }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [selectedItem, setSelectedItem]     = useState<StockItem | null>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [automationSteps, setAutomationSteps] = useState<AutoStep[]>(buildIdleSteps());
  const [automationRunning, setAutomationRunning] = useState(false);
  const [automationResult, setAutomationResult]   = useState<string | null>(null);

  // Order form state
  const [orderType, setOrderType]         = useState<OrderType>('standard');
  const [orderQty, setOrderQty]           = useState<number>(0);
  const [orderName, setOrderName]         = useState('');
  const [orderAddr1, setOrderAddr1]       = useState('');
  const [orderAddr2, setOrderAddr2]       = useState('');
  const [orderTown, setOrderTown]         = useState('');
  const [orderRegion, setOrderRegion]     = useState('');
  const [orderPostcode, setOrderPostcode] = useState('');
  const [orderPhone, setOrderPhone]       = useState('');
  const [orderEmail, setOrderEmail]       = useState('');
  const [orderRef, setOrderRef]           = useState('');
  const [orderError, setOrderError]       = useState<string | null>(null);
  const [orderSending, setOrderSending]   = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(sectionRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const pct    = (c: number, m: number) => Math.round((c / m) * 100);
  const status = (c: number, r: number) => c <= r ? 'critical' : c <= r * 1.5 ? 'warning' : 'good';

  const handleOrderClick = (item: StockItem) => {
    setSelectedItem(item);
    setOrderQty(item.max - item.current);
    setOrderRef('BIR-' + Date.now().toString().slice(-6));
    setOrderType('standard');
    setOrderError(null);
    setOrderDialogOpen(true);
  };

  const handleConfirmOrder = async () => {
    if (!selectedItem) return;

    // Validation
    if (!orderName.trim())     { setOrderError('Please enter a delivery name.'); return; }
    if (!orderAddr1.trim())    { setOrderError('Please enter address line 1.'); return; }
    if (!orderTown.trim())     { setOrderError('Please enter a town.'); return; }
    if (!orderPostcode.trim()) { setOrderError('Please enter a postcode.'); return; }
    if (!orderEmail.trim())    { setOrderError('Please enter an email address.'); return; }
    if (orderQty < 1)          { setOrderError('Quantity must be at least 1.'); return; }

    setOrderError(null);
    setOrderSending(true);

    const orderTypeLabel = ORDER_TYPE_LABELS[orderType];
    const deliveryEmail  = ORDER_TYPE_EMAILS[orderType];

    // Build the exact CSV rows matching Birlea's template
    // Build the payload — items sent as an array so Make.com can
    // iterate through them and build one CSV row per item
    const payload = {
      // Order header fields (same for all rows)
      birleaCustomerNumber: 'C001768',
      orderType:    orderTypeLabel,
      orderNumber:  orderRef,
      name:         orderName,
      address1:     orderAddr1,
      address2:     orderAddr2,
      town:         orderTown,
      region:       orderRegion,
      postcode:     orderPostcode,
      deliveryCode: 'WAREHOUSE',
      buyerPhone:   orderPhone,
      email:        orderEmail,
      // Items array — one entry per product line
      // Make.com Iterator will split this into one bundle per row
      items: [
        {
          item:     selectedItem.birleaCode,
          itemName: selectedItem.name,
          quantity: orderQty,
        }
        // Additional items would be added here in a future multi-item version
      ],
      // Routing
      deliveryEmail,
      ccEmail: 'salesorderauotmation@birlea.com',
      csvFileName: `${orderRef}.csv`,
      submittedAt: new Date().toISOString(),
    };

    try {
      const resp = await fetch('https://hook.eu1.make.com/38eqdsczy25d5wo864vibvuv46uigyvi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error('Webhook returned ' + resp.status);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setOrderError('Failed to send: ' + msg);
      setOrderSending(false);
      return;
    }

    setOrderSending(false);
    setOrderDialogOpen(false);

    // Animate pipeline
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
    upd(1, 'running'); await delay(600);
    upd(2, 'running'); await delay(800);
    upd(3, 'running'); await delay(900);
    upd(4, 'running'); await delay(700);
    upd(5, 'running'); await delay(500);
    const ts = ftimeNow();
    setAutomationSteps(prev => prev.map(s => ({ ...s, status: 'done', timestamp: ts })));
    setAutomationRunning(false);
    setAutomationResult(`${orderTypeLabel} order #${orderRef} → ${deliveryEmail}`);
  };

  const totalUnits = stockItems.reduce((sum, i) => sum + i.current, 0);
  const lowCount   = stockItems.filter(i => status(i.current, i.reorderAt) !== 'good').length;

  const deliveryTypes: { val: OrderType; label: string; email: string; col: string; bg: string; br: string }[] = [
    { val: 'standard',     label: 'Standard',            email: 'orders@birlea.com',        col: '#0ea5e9', bg: '#f0f9ff', br: '#bae6fd' },
    { val: 'nextday',      label: 'Next Day',             email: 'nextday@birlea.com',       col: '#8b5cf6', bg: '#faf5ff', br: '#ddd6fe' },
    { val: 'homedelivery', label: 'Home Delivery',        email: 'homedelivery@birlea.com',  col: '#f59e0b', bg: '#fffbeb', br: '#fde68a' },
    { val: 'collection',   label: 'Customer Collection',  email: 'orders@birlea.com',        col: '#10b981', bg: '#f0fdf4', br: '#a7f3d0' },
  ];

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
            <p className="font-inter text-xs mt-0.5" style={{ color: '#94a3b8' }}>Click Order on low/critical items to send a CSV order to Birlea via email</p>
          </div>
          <div className="overflow-y-auto flex-1 min-h-0">
            <table className="w-full">
              <thead className="sticky top-0 z-10" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>{['SKU', 'Birlea Code', 'Product', 'Stock', 'Status', 'Action'].map(h => (
                  <th key={h} className="text-left py-2 px-4 font-mono text-[10px] uppercase tracking-wide" style={{ color: '#94a3b8' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {stockItems.map((item, i) => {
                  const p   = pct(item.current, item.max);
                  const s   = status(item.current, item.reorderAt);
                  const bg  = s === 'critical' ? '#fef2f2' : s === 'warning' ? '#fffbeb' : '#f0fdf4';
                  const col = s === 'critical' ? '#dc2626' : s === 'warning' ? '#d97706' : '#16a34a';
                  const bdr = s === 'critical' ? '#fecaca' : s === 'warning' ? '#fde68a' : '#bbf7d0';
                  return (
                    <tr key={i} style={{ borderBottom: i === stockItems.length - 1 ? 'none' : '1px solid #f1f5f9' }} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-4"><span className="font-mono text-xs" style={{ color: '#0ea5e9' }}>{item.id}</span></td>
                      <td className="py-2.5 px-4"><span className="font-mono text-xs font-semibold" style={{ color: '#475569' }}>{item.birleaCode}</span></td>
                      <td className="py-2.5 px-4">
                        <span className="font-inter text-sm font-medium" style={{ color: '#1e293b' }}>{item.name}</span>
                        <p className="font-inter text-[10px]" style={{ color: '#94a3b8' }}>{item.category}</p>
                      </td>
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
          <div className="mb-2">
            <p className="font-sora font-semibold text-sm" style={{ color: '#1e293b' }}>Birlea Auto-Order Pipeline</p>
            <p className="font-inter text-[10px]" style={{ color: '#94a3b8' }}>Dashboard → Make.com builds CSV → Email to Birlea</p>
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

      {/* ── Order dialog ── */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="max-w-lg" style={{ background: '#ffffff', border: '1px solid #e2e8f0', maxHeight: '90vh', overflowY: 'auto' }}>
          <DialogHeader>
            <DialogTitle className="font-sora font-bold text-xl" style={{ color: '#1e293b' }}>Place Birlea Order</DialogTitle>
            <DialogDescription className="font-inter text-sm" style={{ color: '#64748b' }}>
              Fill in the delivery details — Make.com will build and email the CSV to Birlea automatically
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4 mt-2">

              {/* Product */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 rounded-xl p-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <p className="font-mono text-[9px] uppercase tracking-wide mb-0.5" style={{ color: '#94a3b8' }}>Product</p>
                  <p className="font-sora font-semibold text-sm" style={{ color: '#1e293b' }}>{selectedItem.name}</p>
                  <p className="font-mono text-xs mt-0.5" style={{ color: '#64748b' }}>
                    Birlea code: <span style={{ color: '#0ea5e9', fontWeight: 600 }}>{selectedItem.birleaCode}</span>
                  </p>
                </div>
                <div className="rounded-xl p-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <p className="font-mono text-[9px] uppercase tracking-wide mb-0.5" style={{ color: '#94a3b8' }}>Stock</p>
                  <p className="font-sora font-bold" style={{ color: '#1e293b' }}>{selectedItem.current}<span className="text-slate-300">/{selectedItem.max}</span></p>
                  <p className="font-mono text-[9px]" style={{ color: '#ef4444' }}>Reorder at {selectedItem.reorderAt}</p>
                </div>
              </div>

              {/* Delivery type — 4 options matching Birlea's CSV exactly */}
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wide mb-2" style={{ color: '#64748b' }}>Delivery Type</p>
                <div className="grid grid-cols-2 gap-2">
                  {deliveryTypes.map(t => (
                    <button key={t.val} onClick={() => setOrderType(t.val)}
                      className="rounded-xl p-2.5 text-left transition-all"
                      style={{
                        background: orderType === t.val ? t.bg : '#f8fafc',
                        border: `1.5px solid ${orderType === t.val ? t.col : '#e2e8f0'}`,
                        boxShadow: orderType === t.val ? `0 0 0 2px ${t.br}` : 'none',
                      }}>
                      <p className="font-sora font-semibold text-xs" style={{ color: orderType === t.val ? t.col : '#1e293b' }}>{t.label}</p>
                      <p className="font-mono text-[8px] mt-0.5" style={{ color: '#94a3b8' }}>{t.email}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Order ref + quantity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[9px] uppercase tracking-wide mb-1 block" style={{ color: '#64748b' }}>Order Reference</label>
                  <input value={orderRef} onChange={e => setOrderRef(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm font-mono"
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', outline: 'none' }} />
                </div>
                <div>
                  <label className="font-mono text-[9px] uppercase tracking-wide mb-1 block" style={{ color: '#64748b' }}>Quantity</label>
                  <input type="number" value={orderQty} onChange={e => setOrderQty(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg text-sm font-mono"
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', outline: 'none' }} />
                </div>
              </div>

              {/* Delivery details */}
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wide mb-2" style={{ color: '#64748b' }}>Delivery Details</p>
                <div className="space-y-2">
                  <input placeholder="Full Name *" value={orderName} onChange={e => setOrderName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', outline: 'none' }} />
                  <input placeholder="Address Line 1 *" value={orderAddr1} onChange={e => setOrderAddr1(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', outline: 'none' }} />
                  <input placeholder="Address Line 2" value={orderAddr2} onChange={e => setOrderAddr2(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', outline: 'none' }} />
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Town *" value={orderTown} onChange={e => setOrderTown(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', outline: 'none' }} />
                    <input placeholder="Region / County" value={orderRegion} onChange={e => setOrderRegion(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', outline: 'none' }} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Postcode *" value={orderPostcode} onChange={e => setOrderPostcode(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', outline: 'none' }} />
                    <input placeholder="Phone Number" value={orderPhone} onChange={e => setOrderPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', outline: 'none' }} />
                  </div>
                  <input placeholder="Your email address *" value={orderEmail} onChange={e => setOrderEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', outline: 'none' }} />
                </div>
              </div>

              {/* CSV preview */}
              {orderName && orderAddr1 && orderTown && orderPostcode && orderEmail && (
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-wide mb-1" style={{ color: '#94a3b8' }}>CSV Preview — this is what Birlea will receive</p>
                  <pre className="w-full rounded-lg px-3 py-2 font-mono text-[9px] overflow-x-auto whitespace-pre"
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', lineHeight: 1.8 }}>
                    {`Birlea Customer Number ,Order Type ,order number,NAME,Address1,Address2,Town,Region,cPostCode,(Delivery Code Stores Only),BuyerPhoneNumber,email,Item,Quantity\nC001768,${ORDER_TYPE_LABELS[orderType]},${orderRef},${orderName},${orderAddr1},${orderAddr2},${orderTown},${orderRegion},${orderPostcode},WAREHOUSE,${orderPhone},${orderEmail},${selectedItem.birleaCode},${orderQty}`}
                  </pre>
                </div>
              )}

              {/* Routing notice */}
              <div className="rounded-xl px-3 py-2 flex items-start gap-2" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <span className="text-emerald-500 mt-0.5 text-xs flex-shrink-0">✓</span>
                <p className="font-inter text-[10px]" style={{ color: '#15803d' }}>
                  CSV will be emailed to <strong>{ORDER_TYPE_EMAILS[orderType]}</strong> and CC'd to <strong>salesorderauotmation@birlea.com</strong>
                </p>
              </div>

              {/* Error */}
              {orderError && (
                <div className="rounded-xl px-3 py-2 flex items-center gap-2" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                  <span className="text-red-500 text-xs flex-shrink-0">✗</span>
                  <p className="font-inter text-xs" style={{ color: '#dc2626' }}>{orderError}</p>
                </div>
              )}

              {/* Submit */}
              <button onClick={handleConfirmOrder} disabled={orderSending}
                className="w-full py-2.5 rounded-xl font-sora font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                style={{
                  background: orderSending ? '#94a3b8' : '#0ea5e9',
                  color: '#ffffff',
                  boxShadow: orderSending ? 'none' : '0 4px 14px rgba(14,165,233,0.35)',
                  cursor: orderSending ? 'not-allowed' : 'pointer',
                }}>
                <ShoppingCart className="w-4 h-4" />
                {orderSending ? 'Sending to Make.com…' : 'Confirm & Send to Birlea'}
              </button>

            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
