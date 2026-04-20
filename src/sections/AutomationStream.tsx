import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import {
  Zap, CheckCircle2, XCircle, RefreshCw,
  ChevronRight, AlertTriangle, Clock,
  Webhook, Brain, Printer, Truck, FileText, Tag,
  PhoneCall, type LucideIcon,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AutomationRun {
  id: string;
  time: string;
  date: string;
  status: 'success' | 'failed' | 'warning';
  detail: string;
  duration: string;
}

interface Automation {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
  runsThisMonth: number;
  failuresThisMonth: number;
  lastRun: string;
  lastStatus: 'success' | 'failed' | 'warning' | 'idle';
  recentRuns: AutomationRun[];
}

// ─── Automation definitions ───────────────────────────────────────────────────
// These represent every automation in the system, shown once with monthly counts.

const automations: Automation[] = [
  {
    id: 'cin7-webhook',
    name: 'Cin7 Order Webhook',
    description: 'Triggered when a new order is created or updated in Cin7 Omni',
    icon: Webhook,
    color: '#3b82f6',
    bg: '#eff6ff',
    border: '#bfdbfe',
    runsThisMonth: 247,
    failuresThisMonth: 3,
    lastRun: '09:14 today',
    lastStatus: 'success',
    recentRuns: [
      { id: 'r1', time: '09:14', date: '24 Mar', status: 'success', detail: 'SO-1021 created — Acme Furniture Co', duration: '0.3s' },
      { id: 'r2', time: '09:15', date: '24 Mar', status: 'success', detail: 'SO-1020 created — SleepWell Retailers', duration: '0.2s' },
      { id: 'r3', time: '08:45', date: '24 Mar', status: 'failed', detail: 'Timeout — Cin7 API did not respond', duration: '30s' },
      { id: 'r4', time: '16:30', date: '23 Mar', status: 'success', detail: 'SO-1019 created — Comfort Home Store', duration: '0.3s' },
      { id: 'r5', time: '14:15', date: '23 Mar', status: 'success', detail: 'SO-1018 updated — Dream Sleep Outlet', duration: '0.2s' },
    ],
  },
  {
    id: 'pdf-router',
    name: 'PDF Router Processing',
    description: 'Scans OneDrive, extracts data with Claude AI, files to Google Drive and OneDrive',
    icon: FileText,
    color: '#8b5cf6',
    bg: '#faf5ff',
    border: '#e9d5ff',
    runsThisMonth: 89,
    failuresThisMonth: 1,
    lastRun: '11:32 today',
    lastStatus: 'success',
    recentRuns: [
      { id: 'r1', time: '11:32', date: '24 Mar', status: 'success', detail: 'invoice_birlea_march.pdf — 3 pages processed', duration: '2m 14s' },
      { id: 'r2', time: '10:05', date: '24 Mar', status: 'success', detail: 'po_acme_furniture.pdf — 1 page processed', duration: '45s' },
      { id: 'r3', time: '16:22', date: '23 Mar', status: 'failed', detail: 'corrupt_scan.pdf — could not parse page 2', duration: '1m 02s' },
      { id: 'r4', time: '14:50', date: '23 Mar', status: 'success', detail: 'delivery_note_0324.pdf — 5 pages processed', duration: '3m 38s' },
      { id: 'r5', time: '09:30', date: '23 Mar', status: 'success', detail: 'order_sleepwell.pdf — 2 pages processed', duration: '1m 22s' },
    ],
  },
  {
    id: 'label-print',
    name: 'Label Print Automation',
    description: 'Builds DYMO label from Cin7 order data and sends to office PC bridge agent',
    icon: Tag,
    color: '#10b981',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    runsThisMonth: 187,
    failuresThisMonth: 4,
    lastRun: '13:44 today',
    lastStatus: 'success',
    recentRuns: [
      { id: 'r1', time: '13:44', date: '24 Mar', status: 'success', detail: 'SO-1021 — Acme Furniture Co · DYMO 5XL', duration: '2s' },
      { id: 'r2', time: '13:30', date: '24 Mar', status: 'success', detail: 'SO-1020 — SleepWell Retailers · DYMO 5XL', duration: '1s' },
      { id: 'r3', time: '11:15', date: '24 Mar', status: 'failed', detail: 'Bridge agent offline — could not reach printer', duration: '30s' },
      { id: 'r4', time: '10:22', date: '24 Mar', status: 'success', detail: 'SO-1019 — Comfort Home Store · DYMO 5XL', duration: '2s' },
      { id: 'r5', time: '09:55', date: '24 Mar', status: 'success', detail: 'SO-1018 — Dream Sleep Outlet · DYMO 5XL', duration: '1s' },
    ],
  },
  {
    id: 'spoke-dispatch',
    name: 'Spoke Dispatch Routing',
    description: 'Routes delivery orders through Spoke and assigns drivers',
    icon: Truck,
    color: '#0ea5e9',
    bg: '#f0f9ff',
    border: '#bae6fd',
    runsThisMonth: 156,
    failuresThisMonth: 0,
    lastRun: '14:10 today',
    lastStatus: 'success',
    recentRuns: [
      { id: 'r1', time: '14:10', date: '24 Mar', status: 'success', detail: 'SO-1021 routed — Driver assigned · Birmingham', duration: '0.8s' },
      { id: 'r2', time: '13:55', date: '24 Mar', status: 'success', detail: 'SO-1020 routed — Driver assigned · Manchester', duration: '0.7s' },
      { id: 'r3', time: '10:30', date: '24 Mar', status: 'success', detail: 'SO-1019 routed — Driver assigned · Leeds', duration: '0.9s' },
      { id: 'r4', time: '16:45', date: '23 Mar', status: 'success', detail: 'SO-1018 routed — Driver assigned · Sheffield', duration: '0.8s' },
      { id: 'r5', time: '15:20', date: '23 Mar', status: 'success', detail: 'SO-1017 routed — Driver assigned · London', duration: '0.7s' },
    ],
  },
  {
    id: 'claude-extraction',
    name: 'Claude AI Data Extraction',
    description: 'Extracts structured data from PDF pages via Make.com webhook',
    icon: Brain,
    color: '#f59e0b',
    bg: '#fffbeb',
    border: '#fde68a',
    runsThisMonth: 312,
    failuresThisMonth: 2,
    lastRun: '11:34 today',
    lastStatus: 'success',
    recentRuns: [
      { id: 'r1', time: '11:34', date: '24 Mar', status: 'success', detail: 'Page 1 of invoice_birlea_march.pdf — 7 fields extracted', duration: '4.2s' },
      { id: 'r2', time: '11:33', date: '24 Mar', status: 'success', detail: 'Page 2 of invoice_birlea_march.pdf — 5 fields extracted', duration: '3.8s' },
      { id: 'r3', time: '10:07', date: '24 Mar', status: 'success', detail: 'Page 1 of po_acme_furniture.pdf — 6 fields extracted', duration: '4.5s' },
      { id: 'r4', time: '16:25', date: '23 Mar', status: 'failed', detail: 'corrupt_scan.pdf page 2 — unreadable content', duration: '8s' },
      { id: 'r5', time: '14:52', date: '23 Mar', status: 'success', detail: 'Page 1 of delivery_note_0324.pdf — 8 fields extracted', duration: '3.9s' },
    ],
  },
  {
    id: 'outbound-calls',
    name: 'Outbound Call Agent',
    description: 'Automated calls to confirm orders, delivery windows and amendments',
    icon: PhoneCall,
    color: '#ec4899',
    bg: '#fdf2f8',
    border: '#f9a8d4',
    runsThisMonth: 74,
    failuresThisMonth: 6,
    lastRun: '13:15 today',
    lastStatus: 'success',
    recentRuns: [
      { id: 'r1', time: '13:15', date: '24 Mar', status: 'success', detail: 'Nordic Sleep Co — Delivery instructions updated · 3m 22s', duration: '3m 22s' },
      { id: 'r2', time: '11:30', date: '24 Mar', status: 'failed', detail: 'BedCraft Interiors — Connection error after 45s', duration: '45s' },
      { id: 'r3', time: '10:45', date: '24 Mar', status: 'success', detail: 'Dream Sleep Outlet — Order amended, qty updated · 6m 04s', duration: '6m 04s' },
      { id: 'r4', time: '10:15', date: '24 Mar', status: 'warning', detail: 'Comfort Home Store — No answer, voicemail left', duration: '0m 45s' },
      { id: 'r5', time: '09:52', date: '24 Mar', status: 'success', detail: 'SleepWell Retailers — Delivery window confirmed · 2m 18s', duration: '2m 18s' },
    ],
  },
  {
    id: 'dymo-bridge',
    name: 'DYMO Bridge Agent',
    description: 'Windows PC agent that polls Firestore and sends labels to the physical printer',
    icon: Printer,
    color: '#64748b',
    bg: '#f8fafc',
    border: '#e2e8f0',
    runsThisMonth: 187,
    failuresThisMonth: 4,
    lastRun: '13:44 today',
    lastStatus: 'success',
    recentRuns: [
      { id: 'r1', time: '13:44', date: '24 Mar', status: 'success', detail: 'Print job received — DYMO LabelWriter 5 XL', duration: '2s' },
      { id: 'r2', time: '13:30', date: '24 Mar', status: 'success', detail: 'Print job received — DYMO LabelWriter 5 XL', duration: '1s' },
      { id: 'r3', time: '11:15', date: '24 Mar', status: 'failed', detail: 'Bridge offline — heartbeat missed for 5 minutes', duration: '—' },
      { id: 'r4', time: '10:22', date: '24 Mar', status: 'success', detail: 'Print job received — DYMO LabelWriter 5 XL', duration: '2s' },
      { id: 'r5', time: '09:55', date: '24 Mar', status: 'success', detail: 'Print job received — DYMO LabelWriter 5 XL', duration: '1s' },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function RunRow({ run }: { run: AutomationRun }) {
  const cfg = {
    success: { dot: '#10b981', text: '#065f46', bg: '#f0fdf4', bo: '#bbf7d0', label: 'Success' },
    failed:  { dot: '#ef4444', text: '#991b1b', bg: '#fef2f2', bo: '#fecaca', label: 'Failed' },
    warning: { dot: '#f59e0b', text: '#92400e', bg: '#fffbeb', bo: '#fde68a', label: 'Warning' },
  }[run.status];

  return (
    <div className="flex items-center gap-3 py-2.5 px-4" style={{ borderBottom: '1px solid #f8fafc' }}>
      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      <div className="flex-1 min-w-0">
        <p className="font-inter text-xs truncate" style={{ color: '#334155' }}>{run.detail}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-mono text-[10px]" style={{ color: '#94a3b8' }}>{run.time} · {run.date}</p>
        <p className="font-mono text-[10px]" style={{ color: '#cbd5e1' }}>{run.duration}</p>
      </div>
      <div className="px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: cfg.bg, border: `1px solid ${cfg.bo}` }}>
        <span className="font-sora text-[9px] font-semibold" style={{ color: cfg.text }}>{cfg.label}</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AutomationStream() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<Automation | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.auto-row',
        { x: -10, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, stagger: 0.06, ease: 'power2.out' }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const now = new Date();
  const monthName = now.toLocaleString('en-GB', { month: 'long', year: 'numeric' });

  const totalRuns     = automations.reduce((s, a) => s + a.runsThisMonth, 0);
  const totalFailures = automations.reduce((s, a) => s + a.failuresThisMonth, 0);

  function handleClick(a: Automation) {
    setSelected(a);
    setDialogOpen(true);
  }

  return (
    <div
      ref={sectionRef}
      className="w-full min-h-screen overflow-y-auto"
      style={{ background: '#f8fafc', paddingBottom: '48px' }}
    >
      <div className="max-w-[1000px] mx-auto px-6 py-6">

        {/* Header */}
        <div className="mb-5 flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-sora font-bold text-2xl" style={{ color: '#1e293b' }}>Automations</h1>
            <p className="font-inter text-sm mt-0.5" style={{ color: '#94a3b8' }}>
              All automations in the system · Resets 1st of each month
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-3 py-1.5 rounded-xl" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <span className="font-mono text-xs font-semibold" style={{ color: '#166534' }}>{totalRuns.toLocaleString()} runs</span>
            </div>
            {totalFailures > 0 && (
              <div className="px-3 py-1.5 rounded-xl" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                <span className="font-mono text-xs font-semibold" style={{ color: '#991b1b' }}>{totalFailures} failures</span>
              </div>
            )}
            <div className="px-3 py-1.5 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <span className="font-mono text-xs" style={{ color: '#94a3b8' }}>{monthName}</span>
            </div>
          </div>
        </div>

        {/* Automation list */}
        <div className="rounded-2xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {automations.map((auto, idx) => {
            const Icon = auto.icon;
            const statusCfg = {
              success: { dot: '#10b981', label: 'Last run succeeded' },
              failed:  { dot: '#ef4444', label: 'Last run failed' },
              warning: { dot: '#f59e0b', label: 'Last run had warnings' },
              idle:    { dot: '#94a3b8', label: 'No recent runs' },
            }[auto.lastStatus];

            return (
              <div
                key={auto.id}
                className="auto-row flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-all duration-200 group"
                style={{ borderBottom: idx < automations.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                onClick={() => handleClick(auto)}
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: auto.bg, border: `1px solid ${auto.border}` }}>
                  <Icon className="w-5 h-5" style={{ color: auto.color }} />
                </div>

                {/* Name + description */}
                <div className="flex-1 min-w-0">
                  <p className="font-sora font-semibold text-sm group-hover:text-sky-600 transition-colors" style={{ color: '#1e293b' }}>
                    {auto.name}
                  </p>
                  <p className="font-inter text-xs mt-0.5 truncate" style={{ color: '#94a3b8' }}>
                    {auto.description}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  {/* Runs this month */}
                  <div className="text-center hidden sm:block">
                    <p className="font-sora font-bold text-lg" style={{ color: '#1e293b' }}>{auto.runsThisMonth}</p>
                    <p className="font-mono text-[9px] uppercase tracking-wide" style={{ color: '#94a3b8' }}>runs</p>
                  </div>

                  {/* Failures */}
                  <div className="text-center hidden sm:block">
                    <p className="font-sora font-bold text-lg" style={{ color: auto.failuresThisMonth > 0 ? '#ef4444' : '#10b981' }}>
                      {auto.failuresThisMonth}
                    </p>
                    <p className="font-mono text-[9px] uppercase tracking-wide" style={{ color: '#94a3b8' }}>failed</p>
                  </div>

                  {/* Last run + status */}
                  <div className="text-right hidden md:block">
                    <div className="flex items-center gap-1.5 justify-end">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusCfg.dot }} />
                      <p className="font-mono text-[10px]" style={{ color: '#64748b' }}>{auto.lastRun}</p>
                    </div>
                    <p className="font-mono text-[9px] mt-0.5" style={{ color: '#94a3b8' }}>{statusCfg.label}</p>
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight className="w-4 h-4 flex-shrink-0 text-slate-300 group-hover:text-sky-400 transition-colors" />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Detail Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="max-w-2xl"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {selected && (() => {
            const Icon = selected.icon;
            const successCount  = selected.recentRuns.filter(r => r.status === 'success').length;
            const failedCount   = selected.recentRuns.filter(r => r.status === 'failed').length;
            const warningCount  = selected.recentRuns.filter(r => r.status === 'warning').length;
            return (
              <>
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle className="font-sora font-bold text-lg flex items-center gap-3" style={{ color: '#1e293b' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: selected.bg, border: `1px solid ${selected.border}` }}>
                      <Icon className="w-5 h-5" style={{ color: selected.color }} />
                    </div>
                    {selected.name}
                  </DialogTitle>
                  <p className="font-inter text-sm mt-1" style={{ color: '#64748b' }}>{selected.description}</p>
                </DialogHeader>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mt-4 flex-shrink-0">
                  {[
                    { label: 'Runs this month', value: selected.runsThisMonth, color: '#1e293b' },
                    { label: 'Failures',         value: selected.failuresThisMonth, color: selected.failuresThisMonth > 0 ? '#ef4444' : '#10b981' },
                    { label: 'Success rate',     value: `${Math.round((selected.runsThisMonth - selected.failuresThisMonth) / selected.runsThisMonth * 100)}%`, color: '#10b981' },
                  ].map(s => (
                    <div key={s.label} className="p-3 rounded-xl text-center" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                      <p className="font-sora font-bold text-xl" style={{ color: s.color }}>{s.value}</p>
                      <p className="font-inter text-[10px] mt-0.5" style={{ color: '#94a3b8' }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Recent runs — scrollable */}
                <div className="mt-4 flex-1 overflow-hidden flex flex-col min-h-0">
                  <div className="flex items-center gap-2 mb-2 flex-shrink-0 px-4">
                    <Clock className="w-3.5 h-3.5" style={{ color: '#94a3b8' }} />
                    <h3 className="font-sora font-semibold text-sm" style={{ color: '#1e293b' }}>Recent Runs</h3>
                    <div className="flex items-center gap-2 ml-auto">
                      {successCount > 0 && <span className="font-mono text-[10px]" style={{ color: '#10b981' }}>{successCount} ok</span>}
                      {failedCount > 0  && <span className="font-mono text-[10px]" style={{ color: '#ef4444' }}>{failedCount} failed</span>}
                      {warningCount > 0 && <span className="font-mono text-[10px]" style={{ color: '#f59e0b' }}>{warningCount} warnings</span>}
                    </div>
                  </div>
                  <div className="overflow-y-auto flex-1 rounded-xl" style={{ border: '1px solid #f1f5f9' }}>
                    {selected.recentRuns.map(run => <RunRow key={run.id} run={run} />)}
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
