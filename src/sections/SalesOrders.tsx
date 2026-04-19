/**
 * src/sections/SalesOrders.tsx
 * ─────────────────────────────
 * Sales Orders page — Grove Bedding Dashboard
 *
 * Three panels:
 *  1. Missing ETD Report — orders from Cin7 with no ETD date set
 *     • Calendar date picker to set ETD directly from dashboard
 *     • Sends PATCH to /api/set-etd → Cin7 API
 *     • Cron runs Mon-Fri 7:30am (inactive until activated)
 *
 *  2. Label History — printed labels from grove-label-print Firebase
 *     • Shows order ref, customer, product, date/time printed
 *
 *  3. Dispatch Tracking — dispatched orders from grove-dispatch Firebase
 *     • Ready and wired, shows empty until dispatch workflow confirmed
 */

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import {
  ClipboardList, Calendar, RefreshCw, AlertCircle,
  CheckCircle2, Package, Printer,
  Truck, ChevronDown, ChevronUp, X, Search,
  Tag, Info,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SaleOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  orderDate: string;
  status: string;
  lines: { productName: string; qty: number }[];
  totalAmount?: number;
  currency?: string;
}

interface LabelRecord {
  id: string;
  runId: string;
  orderRef: string;
  customerName: string;
  productName?: string;
  printedAt: string;
  printer?: string;
  status: string;
}

interface DispatchRecord {
  id: string;
  orderRef: string;
  customerName: string;
  dispatchDate: string;
  carrier?: string;
  trackingNumber?: string;
  status: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fdate(iso: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

function ftime(iso: string) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

async function api(url: string, opts?: RequestInit) {
  try {
    const r = await fetch(url, opts);
    return r.json().catch(() => null);
  } catch { return null; }
}

// ─── Calendar Date Picker ─────────────────────────────────────────────────────

function CalendarPicker({
  value,
  onChange,
  onClose,
}: {
  value: string;
  onChange: (date: string) => void;
  onClose: () => void;
}) {
  const today = new Date();
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  // Adjust so Monday = 0
  const startOffset = (firstDay + 6) % 7;

  const monthNames = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];

  const selected = value ? new Date(value) : null;

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }
  function selectDay(day: number) {
    const d = new Date(viewYear, viewMonth, day);
    onChange(d.toISOString().split('T')[0]);
    onClose();
  }
  function isSelected(day: number) {
    if (!selected) return false;
    return selected.getFullYear() === viewYear &&
           selected.getMonth()    === viewMonth &&
           selected.getDate()     === day;
  }
  function isToday(day: number) {
    return today.getFullYear() === viewYear &&
           today.getMonth()    === viewMonth &&
           today.getDate()     === day;
  }
  function isPast(day: number) {
    return new Date(viewYear, viewMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div
      className="absolute z-50 mt-1 rounded-2xl shadow-xl"
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        width: '260px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
        <button onClick={prevMonth} className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-all text-slate-500 text-sm">‹</button>
        <span className="font-sora font-semibold text-sm text-slate-700">{monthNames[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-all text-slate-500 text-sm">›</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 px-3 pt-2 pb-1">
        {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => (
          <div key={d} className="text-center font-mono text-[9px] text-slate-400 py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
        {cells.map((day, i) => (
          <div key={i} className="flex items-center justify-center">
            {day ? (
              <button
                onClick={() => !isPast(day) && selectDay(day)}
                disabled={isPast(day)}
                className="w-7 h-7 rounded-lg text-[11px] font-inter transition-all"
                style={{
                  background: isSelected(day) ? '#0ea5e9' : isToday(day) ? '#f0f9ff' : 'transparent',
                  color: isSelected(day) ? '#ffffff' : isPast(day) ? '#cbd5e1' : isToday(day) ? '#0ea5e9' : '#334155',
                  fontWeight: isSelected(day) || isToday(day) ? '600' : '400',
                  cursor: isPast(day) ? 'not-allowed' : 'pointer',
                  border: isToday(day) && !isSelected(day) ? '1px solid #bae6fd' : '1px solid transparent',
                }}
              >
                {day}
              </button>
            ) : <div className="w-7 h-7" />}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 pb-3 flex gap-2">
        <button
          onClick={() => { onChange(''); onClose(); }}
          className="flex-1 py-1.5 rounded-lg text-[10px] font-sora font-medium text-slate-500 hover:bg-slate-100 transition-all border border-slate-200"
        >
          Clear
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-1.5 rounded-lg text-[10px] font-sora font-medium text-slate-500 hover:bg-slate-100 transition-all border border-slate-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── ETD Row ──────────────────────────────────────────────────────────────────

function EtdRow({ order, onUpdated }: { order: SaleOrder; onUpdated: () => void }) {
  const [pickerOpen, setPickerOpen]   = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [error, setError]             = useState('');
  const [expanded, setExpanded]       = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    if (pickerOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [pickerOpen]);

  async function saveEtd() {
    if (!selectedDate) return;
    setSaving(true);
    setError('');
    const d = await api('/api/set-etd', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id, orderNumber: order.orderNumber, etdDate: selectedDate }),
    });
    setSaving(false);
    if (d?.success) {
      setSaved(true);
      setTimeout(() => onUpdated(), 1500);
    } else {
      setError(d?.error ?? 'Failed to update Cin7');
    }
  }

  const formattedDate = selectedDate
    ? new Date(selectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  return (
    <div
      className="rounded-2xl border transition-all duration-200"
      style={{
        background: saved ? '#f0fdf4' : '#ffffff',
        border: saved ? '1px solid #bbf7d0' : error ? '1px solid #fecaca' : '1px solid #e2e8f0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 p-4">
        {/* Order icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
        >
          <Package className="w-4 h-4" style={{ color: '#94a3b8' }} />
        </div>

        {/* Order info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-sora font-semibold text-sm" style={{ color: '#1e293b' }}>
              {order.orderNumber}
            </span>
            <span
              className="px-2 py-0.5 rounded-full font-mono text-[9px] font-semibold"
              style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}
            >
              No ETD
            </span>
          </div>
          <p className="font-inter text-xs mt-0.5 truncate" style={{ color: '#64748b' }}>
            {order.customerName} · {fdate(order.orderDate)}
          </p>
        </div>

        {/* ETD date picker */}
        <div className="relative flex-shrink-0" ref={pickerRef}>
          <button
            onClick={() => setPickerOpen(o => !o)}
            disabled={saving || saved}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200"
            style={{
              background: pickerOpen ? '#f0f9ff' : '#f8fafc',
              border: pickerOpen ? '1px solid #bae6fd' : '1px solid #e2e8f0',
              color: selectedDate ? '#0ea5e9' : '#94a3b8',
              minWidth: '130px',
            }}
          >
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-inter text-xs">
              {formattedDate || 'Set ETD date'}
            </span>
            <ChevronDown className="w-3 h-3 flex-shrink-0 ml-auto" style={{ color: '#cbd5e1' }} />
          </button>

          {pickerOpen && (
            <CalendarPicker
              value={selectedDate}
              onChange={setSelectedDate}
              onClose={() => setPickerOpen(false)}
            />
          )}
        </div>

        {/* Save button */}
        {selectedDate && !saved && (
          <button
            onClick={saveEtd}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-sora font-semibold text-xs transition-all"
            style={{
              background: saving ? '#e0f2fe' : '#0ea5e9',
              color: '#ffffff',
              border: 'none',
              cursor: saving ? 'wait' : 'pointer',
              flexShrink: 0,
            }}
          >
            {saving ? (
              <><RefreshCw className="w-3 h-3 animate-spin" /> Saving...</>
            ) : (
              <><CheckCircle2 className="w-3 h-3" /> Save</>
            )}
          </button>
        )}

        {/* Saved indicator */}
        {saved && (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#10b981' }} />
            <span className="font-sora text-xs font-semibold" style={{ color: '#065f46' }}>Saved</span>
          </div>
        )}

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="p-1.5 rounded-lg transition-all"
          style={{ color: '#94a3b8' }}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 pb-3 flex items-center gap-2" style={{ color: '#dc2626' }}>
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="font-inter text-xs">{error}</span>
        </div>
      )}

      {/* Expanded line items */}
      {expanded && order.lines.length > 0 && (
        <div className="px-4 pb-4" style={{ borderTop: '1px solid #f1f5f9' }}>
          <p className="font-mono text-[9px] text-slate-400 uppercase tracking-wider py-2">Line Items</p>
          <div className="space-y-1">
            {order.lines.map((line, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="font-inter text-xs" style={{ color: '#475569' }}>{line.productName}</span>
                <span className="font-mono text-[10px] font-semibold" style={{ color: '#94a3b8' }}>×{line.qty}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Label History Row ────────────────────────────────────────────────────────

function LabelRow({ rec }: { rec: LabelRecord }) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl border transition-all hover:border-slate-200 hover:shadow-sm" style={{ background: '#ffffff', border: '1px solid #f1f5f9' }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
        <Tag className="w-3.5 h-3.5" style={{ color: '#10b981' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-sora text-xs font-semibold truncate" style={{ color: '#1e293b' }}>{rec.orderRef}</p>
        <p className="font-inter text-[10px] truncate" style={{ color: '#94a3b8' }}>{rec.customerName}</p>
      </div>
      {rec.productName && (
        <p className="font-inter text-[10px] truncate max-w-[140px] hidden sm:block" style={{ color: '#64748b' }}>{rec.productName}</p>
      )}
      <div className="text-right flex-shrink-0">
        <p className="font-mono text-[10px]" style={{ color: '#64748b' }}>{fdate(rec.printedAt)}</p>
        <p className="font-mono text-[10px]" style={{ color: '#94a3b8' }}>{ftime(rec.printedAt)}</p>
      </div>
      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#10b981' }} />
        <span className="font-sora text-[9px] font-semibold" style={{ color: '#065f46' }}>Printed</span>
      </div>
    </div>
  );
}

// ─── Dispatch Row ─────────────────────────────────────────────────────────────

function DispatchRow({ rec }: { rec: DispatchRecord }) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl border transition-all" style={{ background: '#ffffff', border: '1px solid #f1f5f9' }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
        <Truck className="w-3.5 h-3.5" style={{ color: '#0ea5e9' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-sora text-xs font-semibold truncate" style={{ color: '#1e293b' }}>{rec.orderRef}</p>
        <p className="font-inter text-[10px] truncate" style={{ color: '#94a3b8' }}>{rec.customerName}</p>
      </div>
      {rec.carrier && <p className="font-mono text-[10px]" style={{ color: '#64748b' }}>{rec.carrier}</p>}
      <div className="text-right flex-shrink-0">
        <p className="font-mono text-[10px]" style={{ color: '#64748b' }}>{fdate(rec.dispatchDate)}</p>
      </div>
      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#0ea5e9' }} />
        <span className="font-sora text-[9px] font-semibold" style={{ color: '#0369a1' }}>Dispatched</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SalesOrders() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const [orders, setOrders]         = useState<SaleOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError]     = useState('');
  const [search, setSearch]         = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const [labels, setLabels]         = useState<LabelRecord[]>([]);
  const [loadingLabels, setLoadingLabels] = useState(false);

  const [dispatches, setDispatches] = useState<DispatchRecord[]>([]);
  const [loadingDispatches, setLoadingDispatches] = useState(false);

  // GSAP entrance animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.so-header', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' });
      gsap.fromTo('.so-panel', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out', delay: 0.1 });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    loadOrders();
    loadLabels();
    loadDispatches();
  }, []);

  async function loadOrders() {
    setLoadingOrders(true);
    setOrdersError('');
    const d = await api('/api/sales-orders');
    setLoadingOrders(false);
    setLastRefresh(new Date());
    if (d?.success) {
      setOrders(d.orders ?? []);
    } else {
      setOrdersError(d?.error ?? 'Could not load orders from Cin7');
    }
  }

  async function loadLabels() {
    setLoadingLabels(true);
    const d = await api('/api/label-history');
    setLoadingLabels(false);
    if (d?.success) setLabels(d.records ?? []);
  }

  async function loadDispatches() {
    setLoadingDispatches(true);
    const d = await api('/api/dispatch-log');
    setLoadingDispatches(false);
    if (d?.success) setDispatches(d.records ?? []);
  }

  const filtered = orders.filter(o =>
    !search ||
    o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    o.customerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      ref={sectionRef}
      className="w-full min-h-screen overflow-y-auto"
      style={{ background: '#f8fafc', paddingBottom: '48px' }}
    >
      <div className="max-w-[1400px] mx-auto px-6 py-8">

        {/* ── Header ── */}
        <div className="so-header mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-sora font-bold text-2xl" style={{ color: '#1e293b' }}>Sales Orders</h1>
            <p className="font-inter text-sm mt-0.5" style={{ color: '#94a3b8' }}>
              Orders missing ETD dates · Label history · Dispatch tracking
            </p>
          </div>

          {/* Inactive cron notice */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: '#fffbeb', border: '1px solid #fde68a' }}
          >
            <Info className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#d97706' }} />
            <p className="font-inter text-xs" style={{ color: '#92400e' }}>
              Auto-refresh cron (Mon–Fri 7:30am) — <strong>inactive</strong> · activate in vercel.json
            </p>
          </div>
        </div>

        {/* ── Three column layout ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* ── Panel 1: Missing ETD Orders ── */}
          <div className="so-panel xl:col-span-2 flex flex-col" style={{ minHeight: '500px' }}>
            <div
              className="rounded-2xl border flex flex-col h-full"
              style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            >
              {/* Panel header */}
              <div className="p-5 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                    <ClipboardList className="w-4 h-4" style={{ color: '#d97706' }} />
                  </div>
                  <div>
                    <h2 className="font-sora font-semibold text-sm" style={{ color: '#1e293b' }}>Missing ETD</h2>
                    <p className="font-mono text-[10px]" style={{ color: '#94a3b8' }}>
                      {loadingOrders ? 'Loading...' : `${filtered.length} order${filtered.length !== 1 ? 's' : ''} · No delivery date set`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {lastRefresh && (
                    <p className="font-mono text-[10px]" style={{ color: '#cbd5e1' }}>
                      {ftime(lastRefresh.toISOString())}
                    </p>
                  )}
                  <button
                    onClick={loadOrders}
                    disabled={loadingOrders}
                    className="p-2 rounded-xl transition-all"
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#94a3b8' }}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="px-5 py-3 flex-shrink-0" style={{ borderBottom: '1px solid #f8fafc' }}>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <Search className="w-3.5 h-3.5" style={{ color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Search by order number or customer..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 bg-transparent font-inter text-xs outline-none"
                    style={{ color: '#334155' }}
                  />
                  {search && (
                    <button onClick={() => setSearch('')}>
                      <X className="w-3 h-3" style={{ color: '#94a3b8' }} />
                    </button>
                  )}
                </div>
              </div>

              {/* Orders list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingOrders && (
                  <div className="flex flex-col items-center justify-center h-48 gap-3">
                    <RefreshCw className="w-6 h-6 animate-spin" style={{ color: '#cbd5e1' }} />
                    <p className="font-inter text-sm" style={{ color: '#94a3b8' }}>Fetching orders from Cin7...</p>
                  </div>
                )}

                {!loadingOrders && ordersError && (
                  <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                      <AlertCircle className="w-6 h-6" style={{ color: '#ef4444' }} />
                    </div>
                    <div>
                      <p className="font-sora font-semibold text-sm" style={{ color: '#1e293b' }}>Could not load orders</p>
                      <p className="font-inter text-xs mt-1" style={{ color: '#94a3b8' }}>{ordersError}</p>
                      <p className="font-mono text-[10px] mt-1" style={{ color: '#cbd5e1' }}>
                        Check CIN7_API_KEY and CIN7_API_USERNAME in Vercel env vars
                      </p>
                    </div>
                    <button
                      onClick={loadOrders}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-sora text-xs font-semibold"
                      style={{ background: '#f0f9ff', border: '1px solid #bae6fd', color: '#0369a1' }}
                    >
                      <RefreshCw className="w-3 h-3" /> Retry
                    </button>
                  </div>
                )}

                {!loadingOrders && !ordersError && filtered.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-48 gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                      <CheckCircle2 className="w-6 h-6" style={{ color: '#10b981' }} />
                    </div>
                    <div className="text-center">
                      <p className="font-sora font-semibold text-sm" style={{ color: '#1e293b' }}>
                        {search ? 'No orders match your search' : 'All orders have ETD dates'}
                      </p>
                      <p className="font-inter text-xs mt-1" style={{ color: '#94a3b8' }}>
                        {search ? 'Try a different search term' : 'Nothing to action right now'}
                      </p>
                    </div>
                  </div>
                )}

                {!loadingOrders && !ordersError && filtered.map(order => (
                  <EtdRow key={order.id} order={order} onUpdated={loadOrders} />
                ))}
              </div>

              {/* Stats footer */}
              {!loadingOrders && !ordersError && orders.length > 0 && (
                <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid #f1f5f9' }}>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Missing ETD', val: orders.length, color: '#d97706', bg: '#fffbeb', bo: '#fde68a' },
                      { label: 'Shown', val: filtered.length, color: '#0369a1', bg: '#f0f9ff', bo: '#bae6fd' },
                      { label: 'Last sync', val: lastRefresh ? ftime(lastRefresh.toISOString()) : '—', color: '#64748b', bg: '#f8fafc', bo: '#e2e8f0' },
                    ].map(s => (
                      <div key={s.label} className="text-center p-2.5 rounded-xl" style={{ background: s.bg, border: `1px solid ${s.bo}` }}>
                        <p className="font-sora font-bold text-lg" style={{ color: s.color }}>{s.val}</p>
                        <p className="font-inter text-[9px]" style={{ color: '#94a3b8' }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right column: Label History + Dispatch ── */}
          <div className="so-panel flex flex-col gap-5">

            {/* Label History Panel */}
            <div
              className="rounded-2xl border flex flex-col"
              style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', minHeight: '240px' }}
            >
              <div className="p-4 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <Printer className="w-4 h-4" style={{ color: '#10b981' }} />
                  </div>
                  <div>
                    <h3 className="font-sora font-semibold text-sm" style={{ color: '#1e293b' }}>Label History</h3>
                    <p className="font-mono text-[10px]" style={{ color: '#94a3b8' }}>grove-label-print Firebase</p>
                  </div>
                </div>
                <button onClick={loadLabels} className="p-1.5 rounded-lg transition-all" style={{ color: '#94a3b8' }}>
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingLabels ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-1.5" style={{ maxHeight: '260px' }}>
                {loadingLabels && (
                  <div className="flex items-center justify-center h-24 gap-2 text-slate-300">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="font-inter text-xs">Loading...</span>
                  </div>
                )}
                {!loadingLabels && labels.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-24 gap-2">
                    <Tag className="w-6 h-6" style={{ color: '#e2e8f0' }} />
                    <p className="font-inter text-xs text-center" style={{ color: '#94a3b8' }}>No labels printed yet</p>
                    <p className="font-mono text-[9px] text-center" style={{ color: '#cbd5e1' }}>Connect grove-label-print Firebase to see history</p>
                  </div>
                )}
                {!loadingLabels && labels.map(rec => <LabelRow key={rec.id} rec={rec} />)}
              </div>
            </div>

            {/* Dispatch Tracking Panel */}
            <div
              className="rounded-2xl border flex flex-col"
              style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', minHeight: '240px' }}
            >
              <div className="p-4 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                    <Truck className="w-4 h-4" style={{ color: '#0ea5e9' }} />
                  </div>
                  <div>
                    <h3 className="font-sora font-semibold text-sm" style={{ color: '#1e293b' }}>Dispatch Tracking</h3>
                    <p className="font-mono text-[10px]" style={{ color: '#94a3b8' }}>grove-dispatch Firebase</p>
                  </div>
                </div>
                <button onClick={loadDispatches} className="p-1.5 rounded-lg transition-all" style={{ color: '#94a3b8' }}>
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingDispatches ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-1.5" style={{ maxHeight: '260px' }}>
                {loadingDispatches && (
                  <div className="flex items-center justify-center h-24 gap-2 text-slate-300">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="font-inter text-xs">Loading...</span>
                  </div>
                )}
                {!loadingDispatches && dispatches.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-24 gap-2">
                    <Truck className="w-6 h-6" style={{ color: '#e2e8f0' }} />
                    <p className="font-inter text-xs text-center" style={{ color: '#94a3b8' }}>No dispatches recorded yet</p>
                    <p className="font-mono text-[9px] text-center" style={{ color: '#cbd5e1' }}>Connect grove-dispatch Firebase to track orders</p>
                  </div>
                )}
                {!loadingDispatches && dispatches.map(rec => <DispatchRow key={rec.id} rec={rec} />)}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
