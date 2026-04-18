/**
 * src/sections/FileManagement.tsx
 * ─────────────────────────────────
 * Grove PDF Router — File Management page.
 * Matches the dashboard design language (glass-cards, blue/emerald/magenta
 * colour tokens, Sora/Inter/Mono fonts) while containing every feature
 * from the original pdf-router /api/dashboard HTML page:
 *
 *  • Scans column   — unprocessed PDFs in OneDrive Scans folder
 *  • Processed column — filed PDFs with Google Drive / OneDrive links
 *  • Run panel      — select a file, pick run mode, stream progress steps
 *  • Diagnostics    — system health checks (/api/diag)
 *  • Firestore logs — read-cost panel (/api/logs)
 *  • GD Retry       — bulk re-file missing Google Drive uploads (/api/gdrive)
 *  • Waiting queue  — files paused mid-run (/api/admin?action=waiting)
 *  • Auto mode      — SSE stream from /api/notify for instant new-file detection
 *
 * All API calls go to /api/* which Vercel routes to pdf-router/api/*.
 * No props required — fully self-contained.
 */

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  FileText, RefreshCw, CheckCircle2, Upload,
  Play, Zap, Pause, Activity, Wrench, ScrollText,
  CloudUpload, Inbox, ChevronDown, ChevronUp,
  ExternalLink, RotateCcw, X, AlertCircle,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScanFile {
  id: string;
  name: string;
  size: number;
  createdAt: string;
  webUrl?: string;
}

interface ProcessedFile {
  name: string;
  size: number;
  createdAt: string;
  webUrl?: string;
  rec?: StatusRecord | null;
}

interface StatusRecord {
  fileId?: string;
  status?: string;
  customerName?: string;
  ref?: string;
  supplier?: string;
  originalFileName?: string;
  renamedFiles?: string[];
  googleDriveFolderUrl?: string;
  totalPages?: number;
}

interface WaitingFile {
  fileId: string;
  fileName: string;
  totalPages?: number;
}

interface RunStep {
  id: number;
  label: string;
  message: string;
  status: 'pending' | 'running' | 'done' | 'error';
}

interface RunResult {
  customerName?: string;
  ref?: string;
  totalPages?: number;
  googleDriveFolderUrl?: string;
  oneDriveProcessedFolderUrl?: string;
  renamedFiles?: string[];
}

interface DiagItem {
  label: string;
  detail: string;
  ok: boolean;
}

interface GdRow {
  id: string;
  cls: 'filing' | 'success' | 'failed' | 'skipped';
  icon: string;
  name: string;
  detail: string;
  linkUrl?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS_DEF = [
  { id: 1, label: 'Initialise record' },
  { id: 2, label: 'Download from OneDrive' },
  { id: 3, label: 'Split PDF into pages' },
  { id: 4, label: 'Send page 1 to Make.com' },
  { id: 5, label: 'AI extraction — Claude reads page' },
  { id: 6, label: 'File page to OneDrive & Google Drive' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fdate(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  }) + ' ' + new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function fsize(b: number) {
  if (!b) return '';
  const k = 1024, i = Math.floor(Math.log(b) / Math.log(k));
  return parseFloat((b / Math.pow(k, i)).toFixed(1)) + ['B', 'KB', 'MB', 'GB'][i];
}

async function api(url: string, opts?: RequestInit) {
  try {
    const r = await fetch(url, opts);
    return r.json().catch(() => null);
  } catch { return null; }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusDot({ colour }: { colour: 'green' | 'yellow' | 'red' | 'grey' }) {
  const map = { green: 'bg-emerald shadow-[0_0_6px_#32dc96]', yellow: 'bg-yellow-400', red: 'bg-magenta', grey: 'bg-silver/30' };
  return <span className={`w-2 h-2 rounded-full flex-shrink-0 ${map[colour]}`} />;
}

function StepRow({ step }: { step: RunStep }) {
  const colour = { pending: 'border-white/10 bg-white/2', running: 'border-blue/40 bg-blue/5', done: 'border-emerald/30 bg-emerald/5', error: 'border-magenta/30 bg-magenta/5' }[step.status];
  const iconColour = { pending: 'text-silver/30', running: 'text-blue', done: 'text-emerald', error: 'text-magenta' }[step.status];
  const msgColour = { pending: 'text-silver/30', running: 'text-blue', done: 'text-emerald', error: 'text-magenta' }[step.status];
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${colour} transition-all duration-300`}>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[9px] font-bold ${iconColour} border border-current`}>
        {step.status === 'running' ? <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
          : step.status === 'done' ? '✓'
          : step.status === 'error' ? '✗'
          : step.id}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-sora text-xs font-medium text-white">{step.label}</p>
        {step.message && <p className={`font-mono text-[10px] mt-0.5 ${msgColour}`}>{step.message}</p>}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FileManagement() {
  const sectionRef = useRef<HTMLDivElement>(null);

  // ── Data state ──
  const [scanFiles, setScanFiles]         = useState<ScanFile[]>([]);
  const [procFiles, setProcFiles]         = useState<ProcessedFile[]>([]);
  const [statusCache, setStatusCache]     = useState<StatusRecord[]>([]);
  const [waitingFiles, setWaitingFiles]   = useState<WaitingFile[]>([]);
  const [subStatus, setSubStatus]         = useState<{ colour: 'green'|'yellow'|'red'|'grey'; message: string }>({ colour: 'grey', message: 'Loading...' });

  // ── UI state ──
  const [selectedFile, setSelectedFile]   = useState<ScanFile | null>(null);
  const [runMode, setRunMode]             = useState<1|2|3>(1);
  const [isRunning, setIsRunning]         = useState(false);
  const [autoMode, setAutoMode]           = useState(true);
  const [steps, setSteps]                 = useState<RunStep[]>([]);
  const [runResult, setRunResult]         = useState<RunResult | null>(null);
  const [runError, setRunError]           = useState<string | null>(null);

  // ── Panel toggles ──
  const [diagOpen, setDiagOpen]           = useState(false);
  const [logsOpen, setLogsOpen]           = useState(false);
  const [gdOpen, setGdOpen]               = useState(false);
  const [queueOpen, setQueueOpen]         = useState(false);

  // ── Panel data ──
  const [diagItems, setDiagItems]         = useState<DiagItem[]>([]);
  const [diagLoading, setDiagLoading]     = useState(false);
  const [logData, setLogData]             = useState<string>('');
  const [logLoading, setLogLoading]       = useState(false);
  const [gdRows, setGdRows]               = useState<GdRow[]>([]);
  const [gdRunning, setGdRunning]         = useState(false);

  // ── Expanded processed file ──
  const [expandedProc, setExpandedProc]   = useState<number | null>(null);

  // ── Auto-processing ──
  const autoProcessing = useRef(false);
  const autoKnownIds   = useRef<Record<string, boolean> | null>(null);
  const notifyEs       = useRef<EventSource | null>(null);

  // ─── GSAP entrance ───────────────────────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.fm-header', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out', scrollTrigger: { trigger: sectionRef.current, start: 'top 85%', toggleActions: 'play none none reverse' } });
      gsap.fromTo('.fm-col', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out', scrollTrigger: { trigger: '.fm-grid', start: 'top 80%', toggleActions: 'play none none reverse' } });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  // ─── Init ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadAll();
    loadSub();
    openNotifyStream();
    return () => { notifyEs.current?.close(); };
  }, []);

  async function loadAll() {
    const cache = await loadStatusCache();
    await Promise.all([loadScans(cache), loadProcessed(cache), loadWaiting()]);
  }

  async function loadStatusCache(): Promise<StatusRecord[]> {
    const d = await api('/api/status?limit=200');
    const records: StatusRecord[] = d?.records ?? [];
    setStatusCache(records);
    return records;
  }

  async function loadSub() {
    const d = await api('/api/subscribe?action=status');
    if (!d) return;
    setSubStatus({ colour: d.colour === 'green' ? 'green' : d.colour === 'yellow' ? 'yellow' : d.colour === 'red' ? 'red' : 'grey', message: d.message ?? '—' });
  }

  async function loadScans(cache?: StatusRecord[]) {
    const c = cache ?? statusCache;
    const d = await api('/api/scan-files');
    if (!d?.success || !d.files) return;
    const processedIds: Record<string, boolean> = {};
    c.forEach(r => { if (r.status === 'completed' && r.fileId) processedIds[r.fileId] = true; });
    const unprocessed = d.files.filter((f: ScanFile) => !processedIds[f.id]);
    setScanFiles(unprocessed);
    if (autoKnownIds.current === null) {
      autoKnownIds.current = {};
      unprocessed.forEach((f: ScanFile) => { autoKnownIds.current![f.id] = true; });
    }
    return unprocessed as ScanFile[];
  }

  async function loadProcessed(cache?: StatusRecord[]) {
    const c = cache ?? statusCache;
    const d = await api('/api/scan-files?folder=Processed');
    if (!d?.success || !d.files) return;

    const byFile: Record<string, StatusRecord> = {};
    const byOriginal: Record<string, StatusRecord> = {};
    c.forEach(r => {
      (r.renamedFiles ?? []).forEach(f => { byFile[f] = r; });
      if (r.originalFileName) byOriginal[r.originalFileName.toLowerCase()] = r;
    });

    const files: ProcessedFile[] = d.files.map((f: ScanFile) => {
      let rec = byFile[f.name] ?? null;
      if (!rec) {
        const base = f.name.replace(/[-_]\d+\.pdf$/i, '').replace(/\.pdf$/i, '').toLowerCase();
        rec = byOriginal[base] ?? null;
      }
      if (!rec) rec = c.find(r => r.customerName && f.name.toLowerCase().includes(r.customerName.toLowerCase())) ?? null;
      return { ...f, rec: rec ?? null };
    });
    setProcFiles(files);
  }

  async function loadWaiting() {
    const d = await api('/api/admin?action=waiting');
    setWaitingFiles(d?.files ?? []);
  }

  // ─── SSE Notify stream ───────────────────────────────────────────────────────
  function openNotifyStream() {
    notifyEs.current?.close();
    const es = new EventSource('/api/notify');
    notifyEs.current = es;

    es.addEventListener('new-file', () => {
      loadStatusCache().then(cache => {
        loadScans(cache).then(files => {
          if (!autoProcessing.current && files?.length) {
            const newFile = files.find(f => !autoKnownIds.current?.[f.id]);
            if (newFile) {
              autoKnownIds.current![newFile.id] = true;
              if (autoMode) autoRunFile(newFile);
            }
          }
        });
        loadProcessed(cache);
      });
    });

    es.addEventListener('reconnect', () => {
      es.close();
      setTimeout(openNotifyStream, 1000);
    });

    es.onerror = () => {
      es.close();
      setTimeout(openNotifyStream, 5000);
    };
  }

  // ─── Auto run ────────────────────────────────────────────────────────────────
  async function autoRunFile(f: ScanFile) {
    if (autoProcessing.current) return;
    autoProcessing.current = true;
    setSelectedFile(f);
    setIsRunning(true);
    setSteps(STEPS_DEF.map(s => ({ ...s, message: '', status: 'pending' })));
    setRunResult(null);
    setRunError(null);
    await streamRun(f, 1, true);
  }

  // ─── Manual run ──────────────────────────────────────────────────────────────
  async function startRun() {
    if (!selectedFile || isRunning) return;
    setIsRunning(true);
    setSteps(STEPS_DEF.map(s => ({ ...s, message: '', status: 'pending' })));
    setRunResult(null);
    setRunError(null);
    await streamRun(selectedFile, runMode, false);
  }

  async function streamRun(f: ScanFile, step: number, isAuto: boolean) {
    const isWaiting = waitingFiles.some(w => w.fileId === f.id);
    try {
      const resp = await fetch('/api/test-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: f.id, fileName: f.name, runMode: isAuto ? 'auto' : 'manual', runStep: step, isWaiting }),
      });

      const reader = resp.body!.getReader();
      const dec = new TextDecoder();
      let buf = '', evt: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n'); buf = lines.pop()!;
        for (const line of lines) {
          if (line.startsWith('event: ')) { evt = line.slice(7).trim(); continue; }
          if (line.startsWith('data: ')) {
            try {
              const d = JSON.parse(line.slice(6));
              handleStreamEvent(evt, d);
            } catch {}
          }
          if (line === '') evt = null;
        }
      }
    } catch (err: any) {
      finishErr(err.message);
    }
  }

  function handleStreamEvent(evt: string | null, d: any) {
    if (evt === 'progress') {
      setSteps(prev => {
        const next = prev.map(s => {
          if (s.id < d.step) return s.status === 'pending' || s.status === 'running' ? { ...s, status: 'done' as const } : s;
          if (s.id === d.step) return { ...s, message: d.message ?? '', status: d.status as any };
          return s;
        });
        return next;
      });
    } else if (evt === 'complete') {
      setSteps(prev => prev.map(s => ({ ...s, status: 'done' as const })));
      setRunResult(d);
      finishOk();
    } else if (evt === 'error') {
      finishErr(d.message);
    }
  }

  function finishOk() {
    setIsRunning(false);
    autoProcessing.current = false;
    setTimeout(() => {
      loadStatusCache().then(cache => { loadScans(cache); loadProcessed(cache); });
      setSelectedFile(null);
      setSteps([]);
    }, 5000);
  }

  function finishErr(msg: string) {
    setIsRunning(false);
    autoProcessing.current = false;
    setRunError(msg);
    setSteps(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'error' as const, message: msg } : s));
  }

  // ─── Reset file ───────────────────────────────────────────────────────────────
  async function doReset(fileId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('Reset this file so it can be reprocessed?')) return;
    const d = await api('/api/admin?action=reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileId }) });
    if (d?.success) { loadWaiting(); }
  }

  // ─── Diagnostics ─────────────────────────────────────────────────────────────
  async function runDiag() {
    setDiagLoading(true);
    setDiagItems([]);
    const d = await api('/api/diag?format=json');
    setDiagItems(d?.results ?? []);
    setDiagLoading(false);
  }

  useEffect(() => { if (diagOpen) runDiag(); }, [diagOpen]);

  // ─── Logs ─────────────────────────────────────────────────────────────────────
  async function loadLogs() {
    setLogLoading(true);
    const d = await api('/api/logs');
    if (!d?.entries?.length) { setLogData('No read logs found yet.'); setLogLoading(false); return; }
    const grouped: Record<string, { total: number; count: number }> = {};
    d.entries.forEach((e: any) => {
      if (!grouped[e.source]) grouped[e.source] = { total: 0, count: 0 };
      grouped[e.source].total += e.reads;
      grouped[e.source].count++;
    });
    const lines = Object.entries(grouped).sort((a, b) => b[1].total - a[1].total)
      .map(([src, g]) => `${src}: ${g.total} reads (${g.count} invocations)`).join('\n');
    setLogData(`Total: ${d.totalReads} reads in last ${d.windowMins ?? 60} min\n\n${lines}`);
    setLogLoading(false);
  }

  useEffect(() => { if (logsOpen) loadLogs(); }, [logsOpen]);

  // ─── GD Retry ─────────────────────────────────────────────────────────────────
  async function retryGoogleDrive() {
    setGdRunning(true);
    setGdOpen(true);
    setGdRows([]);
    try {
      const resp = await fetch('/api/gdrive?action=retry', { method: 'POST' });
      const reader = resp.body!.getReader();
      const dec = new TextDecoder();
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n'); buf = lines.pop()!;
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const ev = JSON.parse(line.slice(6));
            if (ev.type === 'file') {
              const cls = ev.status === 'success' ? 'success' : ev.status === 'failed' ? 'failed' : ev.status === 'skipped' ? 'skipped' : 'filing';
              setGdRows(r => {
                const next = r.filter(x => x.id !== 'file-' + ev.name);
                return [...next, { id: 'file-' + ev.name, cls, icon: ev.status === 'success' ? '✓' : ev.status === 'failed' ? '✗' : '—', name: ev.name, detail: ev.status === 'filing' ? `Filing ${ev.pages} page(s)...` : ev.status === 'success' ? `${ev.pages} page(s) filed` : ev.reason ?? ev.status, linkUrl: ev.gdFolderUrl }];
              });
            }
          } catch {}
        }
      }
    } catch {}
    setGdRunning(false);
    setTimeout(() => { loadStatusCache().then(cache => loadProcessed(cache)); }, 1500);
  }

  // ─── Send single file to GD ───────────────────────────────────────────────────
  async function sendFileToGd(fileName: string, fileId: string, _idx: number) {
    const d = await api('/api/gdrive?action=file', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName, fileId: fileId || undefined }) });
    if (d?.success) { loadStatusCache().then(cache => loadProcessed(cache)); }
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      id="files"
      ref={sectionRef}
      className="relative w-full py-12"
      style={{ background: 'linear-gradient(180deg, #0a1628 0%, #080f1e 100%)' }}
    >
      {/* Grid background */}
      <div className="absolute inset-0 opacity-[0.02]"
        style={{ backgroundImage: 'linear-gradient(rgba(0,150,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,150,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8">

        {/* ── Header ── */}
        <div className="fm-header mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue/10 border border-blue/30 flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue" />
            </div>
            <div>
              <h2 className="font-sora font-bold text-lg text-white">File Management</h2>
              <p className="font-inter text-xs text-silver/60">Grove PDF Router · OneDrive · Google Drive · Make.com</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Subscription status */}
            <div className="glass-card px-3 py-1.5 flex items-center gap-2">
              <StatusDot colour={subStatus.colour} />
              <span className="font-mono text-[10px] text-silver/60">{subStatus.message}</span>
            </div>

            {/* Waiting queue pill */}
            {waitingFiles.length > 0 && (
              <button onClick={() => setQueueOpen(q => !q)}
                className="glass-card px-3 py-1.5 flex items-center gap-2 hover:border-blue/30 transition-all">
                <Inbox className="w-3 h-3 text-blue" />
                <span className="font-mono text-[10px] text-blue">{waitingFiles.length} queued</span>
              </button>
            )}

            {/* Auto / Manual toggle */}
            <div className="glass-card p-1 flex items-center gap-1">
              <button onClick={() => setAutoMode(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-sora font-semibold transition-all ${autoMode ? 'bg-blue/20 text-blue border border-blue/30' : 'text-silver/50 hover:text-silver/80'}`}>
                <Zap className="w-3 h-3" /> Auto
              </button>
              <button onClick={() => setAutoMode(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-sora font-semibold transition-all ${!autoMode ? 'bg-silver/10 text-white border border-silver/20' : 'text-silver/50 hover:text-silver/80'}`}>
                <Pause className="w-3 h-3" /> Manual
              </button>
            </div>

            {/* Live indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${autoMode ? 'bg-emerald animate-pulse' : 'bg-silver/30'}`} />
              <span className={`font-mono text-[10px] ${autoMode ? 'text-emerald' : 'text-silver/40'}`}>
                {autoMode ? 'Watching' : 'Paused'}
              </span>
            </div>

            {/* Tool buttons */}
            <button onClick={() => setDiagOpen(d => !d)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-sora font-semibold border transition-all ${diagOpen ? 'text-blue border-blue/30 bg-blue/10' : 'text-silver/50 border-silver/20 hover:text-blue hover:border-blue/30'}`}>
              <Wrench className="w-3 h-3" /> Diag
            </button>
            <button onClick={() => setLogsOpen(d => !d)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-sora font-semibold border transition-all ${logsOpen ? 'text-blue border-blue/30 bg-blue/10' : 'text-silver/50 border-silver/20 hover:text-blue hover:border-blue/30'}`}>
              <ScrollText className="w-3 h-3" /> Logs
            </button>
            <button onClick={retryGoogleDrive} disabled={gdRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-sora font-semibold text-emerald border border-emerald/30 bg-emerald/5 hover:bg-emerald/10 transition-all disabled:opacity-50">
              <CloudUpload className="w-3 h-3" /> GD Retry
            </button>
            <button onClick={loadAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-sora font-semibold text-silver/50 border border-silver/20 hover:text-blue hover:border-blue/30 transition-all">
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* ── Diagnostics panel ── */}
        {diagOpen && (
          <div className="fm-header glass-card p-4 mb-6 border-blue/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-3.5 h-3.5 text-blue" />
                <span className="font-sora font-semibold text-sm text-white">System Diagnostics</span>
              </div>
              <button onClick={() => setDiagOpen(false)} className="text-silver/40 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
            </div>
            {diagLoading ? (
              <div className="flex items-center gap-2 text-silver/40"><span className="w-3 h-3 rounded-full border-2 border-blue/30 border-t-blue animate-spin" /><span className="font-mono text-[11px]">Running checks...</span></div>
            ) : (
              <div className="space-y-2">
                {diagItems.map((item, i) => (
                  <div key={i} className={`flex items-start gap-3 p-2.5 rounded-lg ${item.ok ? 'bg-emerald/5 border border-emerald/20' : 'bg-magenta/5 border border-magenta/20'}`}>
                    <span className={item.ok ? 'text-emerald' : 'text-magenta'}>{item.ok ? '✓' : '✗'}</span>
                    <div>
                      <p className="font-sora text-xs font-semibold text-white">{item.label}</p>
                      <p className={`font-mono text-[10px] ${item.ok ? 'text-emerald' : 'text-magenta'}`}>{item.detail}</p>
                    </div>
                  </div>
                ))}
                {!diagItems.length && <p className="font-mono text-[10px] text-silver/40">No results</p>}
              </div>
            )}
          </div>
        )}

        {/* ── Logs panel ── */}
        {logsOpen && (
          <div className="fm-header glass-card p-4 mb-6 border-blue/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ScrollText className="w-3.5 h-3.5 text-blue" />
                <span className="font-sora font-semibold text-sm text-white">Firestore Read Log</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={loadLogs} className="text-silver/40 hover:text-blue transition-colors"><RefreshCw className="w-3.5 h-3.5" /></button>
                <button onClick={() => setLogsOpen(false)} className="text-silver/40 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
              </div>
            </div>
            {logLoading ? (
              <div className="flex items-center gap-2 text-silver/40"><span className="w-3 h-3 rounded-full border-2 border-blue/30 border-t-blue animate-spin" /><span className="font-mono text-[11px]">Loading...</span></div>
            ) : (
              <pre className="font-mono text-[10px] text-silver/60 whitespace-pre-wrap leading-relaxed">{logData || 'No data'}</pre>
            )}
          </div>
        )}

        {/* ── GD Retry panel ── */}
        {gdOpen && (
          <div className="fm-header glass-card p-4 mb-6 border-emerald/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CloudUpload className="w-3.5 h-3.5 text-emerald" />
                <span className="font-sora font-semibold text-sm text-white">Google Drive Filing</span>
                {gdRunning && <span className="w-3 h-3 rounded-full border-2 border-emerald/30 border-t-emerald animate-spin" />}
              </div>
              <button onClick={() => setGdOpen(false)} className="text-silver/40 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {gdRows.length === 0 && gdRunning && <p className="font-mono text-[10px] text-silver/40">Connecting...</p>}
              {gdRows.length === 0 && !gdRunning && <p className="font-mono text-[10px] text-silver/40">No files to process</p>}
              {gdRows.map(row => (
                <div key={row.id} className={`flex items-start gap-2 p-2 rounded-lg ${row.cls === 'success' ? 'bg-emerald/5 border border-emerald/20' : row.cls === 'failed' ? 'bg-magenta/5 border border-magenta/20' : 'bg-white/2 border border-white/5'}`}>
                  <span className={row.cls === 'success' ? 'text-emerald' : row.cls === 'failed' ? 'text-magenta' : 'text-yellow-400'}>{row.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-sora text-xs text-white truncate">{row.name}</p>
                    <p className="font-mono text-[10px] text-silver/40">{row.detail}</p>
                    {row.linkUrl && <a href={row.linkUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] text-blue hover:underline flex items-center gap-1">Open folder <ExternalLink className="w-2.5 h-2.5" /></a>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Waiting queue panel ── */}
        {queueOpen && waitingFiles.length > 0 && (
          <div className="fm-header glass-card p-4 mb-6 border-blue/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Inbox className="w-3.5 h-3.5 text-blue" />
                <span className="font-sora font-semibold text-sm text-white">Waiting Queue</span>
              </div>
              <button onClick={() => setQueueOpen(false)} className="text-silver/40 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2">
              {waitingFiles.map(f => (
                <button key={f.fileId} onClick={() => { const scan = scanFiles.find(s => s.id === f.fileId); if (scan) setSelectedFile(scan); setQueueOpen(false); }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg glass-card hover:border-blue/30 transition-all text-left">
                  <FileText className="w-4 h-4 text-blue flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-sora text-xs font-medium text-white truncate">{f.fileName}</p>
                    <p className="font-mono text-[10px] text-silver/40">{f.totalPages ?? '?'} pages</p>
                  </div>
                  <Play className="w-3 h-3 text-blue flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Main 3-column grid ── */}
        <div className="fm-grid grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Scans Column ── */}
          <div className="fm-col glass-card overflow-hidden flex flex-col" style={{ maxHeight: '600px' }}>
            <div className="p-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5 text-blue" />
                  <span className="font-sora font-semibold text-sm text-white">Scans</span>
                </div>
                <p className="font-mono text-[10px] text-silver/40 mt-0.5">{scanFiles.length} file{scanFiles.length !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => loadStatusCache().then(cache => loadScans(cache))}
                className="p-1.5 rounded-lg text-silver/40 hover:text-blue border border-transparent hover:border-blue/30 transition-all">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="px-4 py-1.5 font-mono text-[9px] text-silver/30 border-b border-white/5 bg-white/[0.01] flex-shrink-0">
              Grove Bedding › <span className="text-blue">Scans</span>
            </p>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {scanFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 gap-2 text-silver/30">
                  <CheckCircle2 className="w-6 h-6" />
                  <p className="font-sora text-xs">All files processed</p>
                </div>
              ) : scanFiles.map(f => (
                <div key={f.id} onClick={() => !isRunning && setSelectedFile(f)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer group ${selectedFile?.id === f.id ? 'border-blue/50 bg-blue/8' : waitingFiles.some(w => w.fileId === f.id) ? 'border-blue/20 bg-blue/3' : 'border-white/5 bg-white/[0.02] hover:border-white/15'}`}>
                  <div className="w-7 h-7 rounded-lg bg-blue/10 border border-blue/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-3.5 h-3.5 text-blue" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-sora text-xs font-medium text-white truncate">{f.name}</p>
                    <p className="font-mono text-[9px] text-silver/40">{fsize(f.size)} · {fdate(f.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {waitingFiles.some(w => w.fileId === f.id) && (
                      <span className="px-1.5 py-0.5 rounded bg-blue/15 border border-blue/30 font-mono text-[8px] text-blue">⏳</span>
                    )}
                    <button onClick={e => doReset(f.id, e)}
                      className="w-5 h-5 rounded border border-transparent hover:border-magenta/40 text-silver/20 hover:text-magenta transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <RotateCcw className="w-2.5 h-2.5" />
                    </button>
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-all ${selectedFile?.id === f.id ? 'border-blue bg-blue' : 'border-silver/20'}`}>
                      {selectedFile?.id === f.id && <span className="text-white text-[7px] font-bold">✓</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Processed Column ── */}
          <div className="fm-col glass-card overflow-hidden flex flex-col" style={{ maxHeight: '600px' }}>
            <div className="p-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald" />
                  <span className="font-sora font-semibold text-sm text-white">Processed</span>
                </div>
                <p className="font-mono text-[10px] text-silver/40 mt-0.5">{procFiles.length} file{procFiles.length !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => loadStatusCache().then(cache => loadProcessed(cache))}
                className="p-1.5 rounded-lg text-silver/40 hover:text-emerald border border-transparent hover:border-emerald/30 transition-all">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="px-4 py-1.5 font-mono text-[9px] text-silver/30 border-b border-white/5 bg-white/[0.01] flex-shrink-0">
              Grove Bedding › Scans › <span className="text-emerald">Processed</span>
            </p>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {procFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 gap-2 text-silver/30">
                  <FileText className="w-6 h-6" />
                  <p className="font-sora text-xs">No files yet</p>
                </div>
              ) : procFiles.map((f, idx) => {
                const hasGd = !!f.rec?.googleDriveFolderUrl;
                const gdPending = !!f.rec && !hasGd;
                const isExpanded = expandedProc === idx;
                return (
                  <div key={idx} className="rounded-xl border border-emerald/15 bg-emerald/[0.03] overflow-hidden">
                    <div onClick={() => setExpandedProc(isExpanded ? null : idx)}
                      className="flex items-center gap-2.5 p-2.5 cursor-pointer hover:bg-emerald/5 transition-all">
                      <div className="w-7 h-7 rounded-lg bg-emerald/10 border border-emerald/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-sora text-xs font-medium text-white truncate">{f.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {hasGd && <span className="px-1 py-0.5 rounded text-[8px] font-mono font-bold bg-emerald/10 border border-emerald/25 text-emerald">GD ✓</span>}
                          {gdPending && <span className="px-1 py-0.5 rounded text-[8px] font-mono font-bold bg-yellow-400/10 border border-yellow-400/25 text-yellow-400">GD ⏳</span>}
                          {f.webUrl && <span className="px-1 py-0.5 rounded text-[8px] font-mono font-bold bg-blue/10 border border-blue/25 text-blue">OD ✓</span>}
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-3 h-3 text-silver/40 flex-shrink-0" /> : <ChevronDown className="w-3 h-3 text-silver/40 flex-shrink-0" />}
                    </div>
                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-1.5 border-t border-emerald/10">
                        <div className="h-2" />
                        {f.rec?.customerName && <div className="flex gap-2"><span className="font-mono text-[9px] text-silver/40 w-16">Customer</span><span className="font-inter text-[10px] text-white">{f.rec.customerName}</span></div>}
                        {f.rec?.ref && <div className="flex gap-2"><span className="font-mono text-[9px] text-silver/40 w-16">Ref</span><span className="font-inter text-[10px] text-white">{f.rec.ref}</span></div>}
                        {hasGd && <div className="flex gap-2 items-center"><span className="font-mono text-[9px] text-silver/40 w-16">Google Drive</span><a href={f.rec!.googleDriveFolderUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] text-emerald hover:underline flex items-center gap-1">Open folder <ExternalLink className="w-2.5 h-2.5" /></a></div>}
                        {gdPending && <div className="flex gap-2 items-center"><span className="font-mono text-[9px] text-silver/40 w-16">Google Drive</span><button onClick={() => sendFileToGd(f.name, f.rec?.fileId ?? '', idx)} className="font-mono text-[10px] text-emerald border border-emerald/30 px-2 py-0.5 rounded hover:bg-emerald/10 transition-all">Send to GD</button></div>}
                        {f.webUrl && <div className="flex gap-2 items-center"><span className="font-mono text-[9px] text-silver/40 w-16">OneDrive</span><a href={f.webUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] text-blue hover:underline flex items-center gap-1">Open file <ExternalLink className="w-2.5 h-2.5" /></a></div>}
                        <div className="flex gap-2"><span className="font-mono text-[9px] text-silver/40 w-16">Size</span><span className="font-inter text-[10px] text-silver/60">{fsize(f.size)}</span></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Run Panel ── */}
          <div className="fm-col glass-card overflow-hidden flex flex-col" style={{ maxHeight: '600px' }}>
            {/* File selection */}
            <div className="p-4 border-b border-white/5 flex-shrink-0">
              {!selectedFile ? (
                <div className="flex flex-col items-center gap-2 py-4 text-silver/30">
                  <Activity className="w-5 h-5" />
                  <p className="font-sora text-xs">Select a file from Scans</p>
                </div>
              ) : (
                <div>
                  <p className="font-sora text-sm font-semibold text-white truncate mb-0.5">{selectedFile.name}</p>
                  <p className="font-mono text-[10px] text-silver/40 mb-3">{fsize(selectedFile.size)} · {fdate(selectedFile.createdAt)}</p>

                  {/* Run mode selector */}
                  {!isRunning && (
                    <div className="space-y-1.5 mb-3">
                      {([
                        [1, 'Full run', 'AI + file to Google Drive & OneDrive'],
                        [2, 'AI extraction only', 'Get JSON, skip filing'],
                        [3, 'Split only', 'Download & split, skip Make.com'],
                      ] as [1|2|3, string, string][]).map(([val, title, sub]) => (
                        <label key={val} onClick={() => setRunMode(val)}
                          className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${runMode === val ? 'border-blue/50 bg-blue/8' : 'border-white/5 hover:border-white/15'}`}>
                          <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all ${runMode === val ? 'border-blue bg-blue' : 'border-silver/30'}`} />
                          <div>
                            <p className="font-sora text-xs font-semibold text-white">{title}</p>
                            <p className="font-mono text-[9px] text-silver/40">{sub}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  {!isRunning && (
                    <button onClick={startRun}
                      className="w-full py-2.5 rounded-xl bg-blue text-white font-sora font-semibold text-sm flex items-center justify-center gap-2 hover:bg-blue/90 transition-all">
                      <Play className="w-3.5 h-3.5" /> Process
                    </button>
                  )}
                  {isRunning && (
                    <div className="flex items-center gap-2 justify-center py-2 text-blue">
                      <span className="w-3 h-3 rounded-full border-2 border-blue/30 border-t-blue animate-spin" />
                      <span className="font-sora text-xs font-semibold">Running...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Progress steps */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {steps.length === 0 && !runResult && !runError && (
                <div className="flex flex-col items-center justify-center h-32 gap-2 text-silver/30">
                  <Play className="w-5 h-5" />
                  <p className="font-sora text-xs text-center">Select a file and click Process to begin</p>
                </div>
              )}

              {steps.map(s => <StepRow key={s.id} step={s} />)}

              {runResult && (
                <div className="mt-2 p-3 rounded-xl bg-emerald/5 border border-emerald/25">
                  <p className="font-sora text-xs font-semibold text-emerald mb-2">✅ Complete</p>
                  {runResult.customerName && <div className="flex gap-2 mb-1"><span className="font-mono text-[9px] text-silver/40 w-16">Customer</span><span className="font-inter text-xs text-white">{runResult.customerName}</span></div>}
                  {runResult.ref && <div className="flex gap-2 mb-1"><span className="font-mono text-[9px] text-silver/40 w-16">Ref</span><span className="font-inter text-xs text-white">{runResult.ref}</span></div>}
                  {runResult.totalPages && <div className="flex gap-2 mb-1"><span className="font-mono text-[9px] text-silver/40 w-16">Pages</span><span className="font-inter text-xs text-white">{runResult.totalPages}</span></div>}
                  {runResult.googleDriveFolderUrl && <a href={runResult.googleDriveFolderUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] text-emerald hover:underline flex items-center gap-1 mt-1">Google Drive <ExternalLink className="w-2.5 h-2.5" /></a>}
                  {runResult.oneDriveProcessedFolderUrl && <a href={runResult.oneDriveProcessedFolderUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] text-blue hover:underline flex items-center gap-1 mt-1">OneDrive <ExternalLink className="w-2.5 h-2.5" /></a>}
                </div>
              )}

              {runError && (
                <div className="mt-2 p-3 rounded-xl bg-magenta/5 border border-magenta/25">
                  <div className="flex items-center gap-2 mb-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-magenta flex-shrink-0" />
                    <p className="font-sora text-xs font-semibold text-magenta">Failed</p>
                  </div>
                  <p className="font-mono text-[10px] text-magenta/80">{runError}</p>
                  <button onClick={startRun} className="mt-2 font-sora text-xs text-blue hover:underline">↺ Try Again</button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
