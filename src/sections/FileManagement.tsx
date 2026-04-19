/**
 * src/sections/FileManagement.tsx
 * ─────────────────────────────────
 * Grove PDF Router — File Management page.
 * White light theme matching the dashboard.
 * Features:
 *  • Make.com style automation visualiser — horizontal circles with icons + arrows
 *  • Scans column — unprocessed PDFs from OneDrive
 *  • Processed column — filed PDFs with GD/OneDrive links, auto-refreshes after run
 *  • Automation history — last 10 runs with file name, date, time, status
 */

import { useEffect, useRef, useState } from 'react';
import {
  FileText, RefreshCw, CheckCircle2, Upload,
  Play, Zap, Pause, CloudUpload, Inbox,
  ChevronDown, ChevronUp, ExternalLink,
  RotateCcw, X, AlertCircle, Wrench, ScrollText,
  Clock, CheckCheck,
} from 'lucide-react';

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
  rec: StatusRecord | null;
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

type StepStatus = 'idle' | 'running' | 'done' | 'error';

interface AutoStep {
  id: number;
  label: string;
  sublabel: string;
  icon: string;
  status: StepStatus;
  message: string;
  timestamp: string;
}

interface HistoryRun {
  id: string;
  fileName: string;
  date: string;
  time: string;
  status: 'success' | 'failed' | 'running';
  pages?: number;
  customer?: string;
}

// ─── Pipeline steps matching the PDF router exactly ───────────────────────────

const PIPELINE_STEPS: Omit<AutoStep, 'status' | 'message' | 'timestamp'>[] = [
  { id: 1, label: 'OneDrive',     sublabel: 'File detected',      icon: '☁️' },
  { id: 2, label: 'Download',     sublabel: 'Pull from OneDrive', icon: '⬇️' },
  { id: 3, label: 'Split PDF',    sublabel: 'Separate pages',     icon: '📄' },
  { id: 4, label: 'Make.com',     sublabel: 'Send to webhook',    icon: '⚡' },
  { id: 5, label: 'Claude AI',    sublabel: 'Extract data',       icon: '🧠' },
  { id: 6, label: 'File OneDrive', sublabel: 'Move to Processed', icon: '📁' },
  { id: 7, label: 'Google Drive', sublabel: 'Copy to GD folder',  icon: '🟢' },
];

function buildIdleSteps(): AutoStep[] {
  return PIPELINE_STEPS.map(s => ({ ...s, status: 'idle', message: '', timestamp: '' }));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fdate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
function fdateShort(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}
function ftime(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
function ftimeNow() { return ftime(new Date().toISOString()); }
function fsize(b: number) {
  if (!b) return '';
  const k = 1024, i = Math.floor(Math.log(b) / Math.log(k));
  return parseFloat((b / Math.pow(k, i)).toFixed(1)) + ['B', 'KB', 'MB', 'GB'][i];
}
async function api(url: string, opts?: RequestInit) {
  try { const r = await fetch(url, opts); return r.json().catch(() => null); }
  catch { return null; }
}

// ─── Automation Visualiser ────────────────────────────────────────────────────

function AutomationVisualiser({ steps, isRunning, fileName }: {
  steps: AutoStep[];
  isRunning: boolean;
  fileName: string;
}) {
  const allDone   = steps.every(s => s.status === 'done');
  const hasError  = steps.some(s => s.status === 'error');
  const isIdle    = steps.every(s => s.status === 'idle');

  return (
    <div className="w-full">
      {/* Header row */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-sora font-bold text-base text-slate-800">Automation Pipeline</h3>
          <p className="font-inter text-xs text-slate-400 mt-0.5">
            {isRunning ? `Processing: ${fileName}`
              : allDone ? `Completed: ${fileName}`
              : 'Idle — select a file and click Process to begin'}
          </p>
        </div>
        <div>
          {isRunning && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200">
              <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              <span className="font-sora text-xs font-semibold text-sky-600">Running</span>
            </div>
          )}
          {allDone && !isRunning && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200">
              <CheckCheck className="w-3 h-3 text-emerald-500" />
              <span className="font-sora text-xs font-semibold text-emerald-600">Complete</span>
            </div>
          )}
          {hasError && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200">
              <AlertCircle className="w-3 h-3 text-red-500" />
              <span className="font-sora text-xs font-semibold text-red-600">Failed</span>
            </div>
          )}
          {isIdle && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
              <div className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="font-sora text-xs font-semibold text-slate-500">Idle</span>
            </div>
          )}
        </div>
      </div>

      {/* Circles row */}
      <div className="flex items-start justify-center w-full overflow-x-auto pb-3">
        {steps.map((step, idx) => {
          const c = {
            idle:    { border: '#e2e8f0', bg: '#f8fafc', textCol: '#94a3b8', dotCol: '#cbd5e1',   shadow: 'none' },
            running: { border: '#0ea5e9', bg: '#f0f9ff', textCol: '#0369a1', dotCol: '#0ea5e9',   shadow: '0 0 0 5px #bae6fd' },
            done:    { border: '#10b981', bg: '#f0fdf4', textCol: '#065f46', dotCol: '#10b981',   shadow: '0 0 0 3px #a7f3d0' },
            error:   { border: '#ef4444', bg: '#fef2f2', textCol: '#991b1b', dotCol: '#ef4444',   shadow: 'none' },
          }[step.status];

          return (
            <div key={step.id} className="flex items-center flex-shrink-0">
              {/* Circle + labels */}
              <div className="flex flex-col items-center" style={{ width: '76px' }}>
                {/* Circle */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 relative"
                  style={{ border: `2.5px solid ${c.border}`, background: c.bg, boxShadow: c.shadow }}
                >
                  <span
                    className="text-lg select-none transition-all duration-500"
                    style={{ filter: step.status === 'idle' ? 'grayscale(1) opacity(0.35)' : 'none' }}
                  >
                    {step.icon}
                  </span>
                  {/* Spinning ring for running state */}
                  {step.status === 'running' && (
                    <div
                      className="absolute inset-0 rounded-full animate-spin"
                      style={{ border: '2px solid transparent', borderTopColor: '#0ea5e9', margin: '-4px' }}
                    />
                  )}
                </div>

                {/* Step name */}
                <p className="font-sora font-semibold text-[10px] mt-1.5 text-center transition-colors duration-500"
                  style={{ color: c.textCol }}>
                  {step.label}
                </p>
                <p className="font-inter text-[9px] text-slate-400 text-center leading-tight px-1">
                  {step.sublabel}
                </p>

                {/* Status badge */}
                <div className="mt-1.5 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full transition-all duration-500"
                    style={{ background: c.dotCol }} />
                  <span className="font-mono text-[9px] font-semibold uppercase tracking-wide transition-all duration-500"
                    style={{ color: c.dotCol }}>
                    {step.status === 'idle' ? 'idle'
                      : step.status === 'running' ? 'running'
                      : step.status === 'done' ? 'success'
                      : 'failed'}
                  </span>
                </div>

                {/* Timestamp */}
                {step.timestamp && (
                  <p className="font-mono text-[9px] text-slate-400 mt-0.5">{step.timestamp}</p>
                )}
              </div>

              {/* Arrow */}
              {idx < steps.length - 1 && (
                <div className="flex items-center flex-shrink-0 mb-8" style={{ width: '20px', paddingTop: '2px' }}>
                  <div className="h-px flex-1 transition-all duration-500"
                    style={{ background: steps[idx + 1].status !== 'idle' ? '#10b981' : '#e2e8f0' }} />
                  <div className="transition-all duration-500" style={{
                    width: 0, height: 0,
                    borderTop: '4px solid transparent',
                    borderBottom: '4px solid transparent',
                    borderLeft: `6px solid ${steps[idx + 1].status !== 'idle' ? '#10b981' : '#e2e8f0'}`,
                  }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── History Row ──────────────────────────────────────────────────────────────

function HistoryRow({ run }: { run: HistoryRun }) {
  const cfg = {
    success: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', dot: 'bg-emerald-500', label: 'Success' },
    failed:  { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-600',     dot: 'bg-red-500',     label: 'Failed' },
    running: { bg: 'bg-sky-50',     border: 'border-sky-200',     text: 'text-sky-600',     dot: 'bg-sky-500 animate-pulse', label: 'Running' },
  }[run.status];

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl border border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm transition-all">
      <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0">
        <FileText className="w-3.5 h-3.5 text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-sora text-xs font-semibold text-slate-700 truncate">{run.fileName}</p>
        {run.customer && <p className="font-inter text-[10px] text-slate-400 truncate">{run.customer}</p>}
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-mono text-[10px] text-slate-500">{run.date}</p>
        <p className="font-mono text-[10px] text-slate-400">{run.time}</p>
      </div>
      {run.pages && <span className="font-mono text-[10px] text-slate-400 flex-shrink-0">{run.pages}p</span>}
      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border flex-shrink-0 ${cfg.bg} ${cfg.border}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        <span className={`font-sora text-[10px] font-semibold ${cfg.text}`}>{cfg.label}</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FileManagement() {
  const [scanFiles, setScanFiles]         = useState<ScanFile[]>([]);
  const [procFiles, setProcFiles]         = useState<ProcessedFile[]>([]);
  const [statusCache, setStatusCache]     = useState<StatusRecord[]>([]);
  const [waitingFiles, setWaitingFiles]   = useState<WaitingFile[]>([]);
  const [selectedFile, setSelectedFile]   = useState<ScanFile | null>(null);
  const [runMode, setRunMode]             = useState<1|2|3>(1);
  const [isRunning, setIsRunning]         = useState(false);
  const [autoMode, setAutoMode]           = useState(true);
  const [runResult, setRunResult]         = useState<RunResult | null>(null);
  const [runError, setRunError]           = useState<string | null>(null);
  const [pipelineSteps, setPipelineSteps] = useState<AutoStep[]>(buildIdleSteps());
  const [activeFileName, setActiveFileName] = useState('');
  const [history, setHistory]             = useState<HistoryRun[]>([]);
  const [diagOpen, setDiagOpen]           = useState(false);
  const [logsOpen, setLogsOpen]           = useState(false);
  const [gdOpen, setGdOpen]               = useState(false);
  const [queueOpen, setQueueOpen]         = useState(false);
  const [diagItems, setDiagItems]         = useState<DiagItem[]>([]);
  const [diagLoading, setDiagLoading]     = useState(false);
  const [logData, setLogData]             = useState('');
  const [logLoading, setLogLoading]       = useState(false);
  const [gdRows, setGdRows]               = useState<{ id: string; name: string; detail: string; status: string; linkUrl?: string }[]>([]);
  const [gdRunning, setGdRunning]         = useState(false);
  const [expandedProc, setExpandedProc]   = useState<number | null>(null);

  const autoProcessing = useRef(false);
  const autoKnownIds   = useRef<Record<string, boolean> | null>(null);
  const notifyEs       = useRef<EventSource | null>(null);

  useEffect(() => {
    loadAll();
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

  async function loadScans(cache?: StatusRecord[]): Promise<ScanFile[]> {
    const c = cache ?? statusCache;
    const d = await api('/api/scan-files');
    if (!d?.success || !d.files) return [];
    const processedIds: Record<string, boolean> = {};
    c.forEach(r => { if (r.status === 'completed' && r.fileId) processedIds[r.fileId] = true; });
    const unprocessed = d.files.filter((f: ScanFile) => !processedIds[f.id]);
    setScanFiles(unprocessed);
    if (autoKnownIds.current === null) {
      autoKnownIds.current = {};
      unprocessed.forEach((f: ScanFile) => { autoKnownIds.current![f.id] = true; });
    }
    return unprocessed;
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
      let rec: StatusRecord | null = byFile[f.name] ?? null;
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

  function openNotifyStream() {
    notifyEs.current?.close();
    const es = new EventSource('/api/notify');
    notifyEs.current = es;
    es.addEventListener('new-file', () => {
      loadStatusCache().then(cache => {
        loadScans(cache).then(files => {
          if (!autoProcessing.current && files?.length && autoMode) {
            const newFile = files.find(f => !autoKnownIds.current?.[f.id]);
            if (newFile) { autoKnownIds.current![newFile.id] = true; autoRunFile(newFile); }
          }
        });
      });
    });
    es.addEventListener('reconnect', () => { es.close(); setTimeout(openNotifyStream, 1000); });
    es.onerror = () => { es.close(); setTimeout(openNotifyStream, 5000); };
  }

  function updateStep(stepId: number, status: StepStatus, message = '') {
    const ts = ftimeNow();
    setPipelineSteps(prev => prev.map(s => {
      if (s.id < stepId && (s.status === 'idle' || s.status === 'running'))
        return { ...s, status: 'done', timestamp: ts };
      if (s.id === stepId) return { ...s, status, message, timestamp: ts };
      return s;
    }));
  }

  function allStepsDone() {
    const ts = ftimeNow();
    setPipelineSteps(prev => prev.map(s => ({ ...s, status: 'done', timestamp: s.timestamp || ts })));
  }

  function addHistoryRun(run: HistoryRun) {
    setHistory(prev => [run, ...prev].slice(0, 10));
  }

  function updateHistoryStatus(id: string, updates: Partial<HistoryRun>) {
    setHistory(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }

  async function streamRun(f: ScanFile, step: number, isAuto: boolean) {
    const isWaiting = waitingFiles.some(w => w.fileId === f.id);
    const now = new Date().toISOString();
    const runId = `run-${Date.now()}`;
    addHistoryRun({ id: runId, fileName: f.name, date: fdateShort(now), time: ftime(now), status: 'running' });

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
              if (evt === 'progress') {
                const ps = d.step ?? 0;
                if (d.status === 'running') updateStep(ps, 'running', d.message ?? '');
                else if (d.status === 'done') updateStep(ps, 'done', d.message ?? '');
                else if (d.status === 'error') updateStep(ps, 'error', d.message ?? '');
              } else if (evt === 'complete') {
                allStepsDone();
                updateStep(7, 'done', 'Filed to Google Drive');
                setRunResult(d as RunResult);
                updateHistoryStatus(runId, { status: 'success', pages: d.totalPages, customer: d.customerName });
                finishOk();
              } else if (evt === 'error') {
                updateStep(d.step ?? 1, 'error', d.message ?? '');
                updateHistoryStatus(runId, { status: 'failed' });
                finishErr(d.message ?? 'Unknown error');
              }
            } catch {}
          }
          if (line === '') evt = null;
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      updateHistoryStatus(runId, { status: 'failed' });
      finishErr(msg);
    }
  }

  function finishOk() {
    setIsRunning(false);
    autoProcessing.current = false;
    setTimeout(() => {
      loadStatusCache().then(cache => { loadScans(cache); loadProcessed(cache); });
      setSelectedFile(null);
    }, 3000);
  }

  function finishErr(msg: string) {
    setIsRunning(false);
    autoProcessing.current = false;
    setRunError(msg);
    setPipelineSteps(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'error', message: msg } : s));
  }

  async function autoRunFile(f: ScanFile) {
    if (autoProcessing.current) return;
    autoProcessing.current = true;
    setSelectedFile(f);
    setActiveFileName(f.name);
    setIsRunning(true);
    setPipelineSteps(buildIdleSteps());
    setRunResult(null);
    setRunError(null);
    updateStep(1, 'running', 'File detected in OneDrive');
    await streamRun(f, 1, true);
  }

  async function startRun() {
    if (!selectedFile || isRunning) return;
    setIsRunning(true);
    setActiveFileName(selectedFile.name);
    setPipelineSteps(buildIdleSteps());
    setRunResult(null);
    setRunError(null);
    updateStep(1, 'running', 'Initialising...');
    await streamRun(selectedFile, runMode, false);
  }

  async function doReset(fileId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('Reset this file so it can be reprocessed?')) return;
    await api('/api/admin?action=reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileId }) });
    loadWaiting();
  }

  async function runDiag() {
    setDiagLoading(true); setDiagItems([]);
    const d = await api('/api/diag?format=json');
    setDiagItems(d?.results ?? []); setDiagLoading(false);
  }
  useEffect(() => { if (diagOpen) runDiag(); }, [diagOpen]);

  async function loadLogs() {
    setLogLoading(true);
    const d = await api('/api/logs');
    if (!d?.entries?.length) { setLogData('No read logs found yet.'); setLogLoading(false); return; }
    const grouped: Record<string, { total: number; count: number }> = {};
    d.entries.forEach((e: { source: string; reads: number }) => {
      if (!grouped[e.source]) grouped[e.source] = { total: 0, count: 0 };
      grouped[e.source].total += e.reads; grouped[e.source].count++;
    });
    const lines = Object.entries(grouped).sort((a, b) => b[1].total - a[1].total)
      .map(([src, g]) => `${src}: ${g.total} reads (${g.count} inv)`).join('\n');
    setLogData(`Total: ${d.totalReads} reads (last ${d.windowMins ?? 60}min)\n\n${lines}`);
    setLogLoading(false);
  }
  useEffect(() => { if (logsOpen) loadLogs(); }, [logsOpen]);

  async function retryGoogleDrive() {
    setGdRunning(true); setGdOpen(true); setGdRows([]);
    try {
      const resp = await fetch('/api/gdrive?action=retry', { method: 'POST' });
      const reader = resp.body!.getReader();
      const dec = new TextDecoder(); let buf = '';
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
              setGdRows(r => {
                const next = r.filter(x => x.id !== 'file-' + ev.name);
                return [...next, { id: 'file-' + ev.name, name: ev.name, status: ev.status, detail: ev.status === 'filing' ? `Filing ${ev.pages}p...` : ev.status === 'success' ? `${ev.pages}p filed` : ev.reason ?? ev.status, linkUrl: ev.gdFolderUrl }];
              });
            }
          } catch {}
        }
      }
    } catch {}
    setGdRunning(false);
    setTimeout(() => { loadStatusCache().then(cache => loadProcessed(cache)); }, 1500);
  }

  async function sendFileToGd(fileName: string, fileId: string) {
    await api('/api/gdrive?action=file', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName, fileId: fileId || undefined }) });
    loadStatusCache().then(cache => loadProcessed(cache));
  }

  const allPipelineDone = pipelineSteps.every(s => s.status === 'done');

  return (
    <div className="w-full min-h-screen overflow-y-auto" style={{ background: '#f8fafc', paddingBottom: '48px' }}>
      <div className="max-w-[1400px] mx-auto px-6 py-8">

        {/* ── Header ── */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-sora font-bold text-2xl text-slate-800">File Management</h1>
            <p className="font-inter text-sm text-slate-400 mt-0.5">Grove PDF Router · OneDrive · Google Drive · Make.com</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
              <button onClick={() => setAutoMode(true)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sora font-semibold transition-all ${autoMode ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <Zap className="w-3 h-3" /> Auto
              </button>
              <button onClick={() => setAutoMode(false)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sora font-semibold transition-all ${!autoMode ? 'bg-slate-100 text-slate-700' : 'text-slate-500 hover:text-slate-700'}`}>
                <Pause className="w-3 h-3" /> Manual
              </button>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl">
              <div className={`w-2 h-2 rounded-full ${autoMode ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              <span className={`font-mono text-[11px] font-semibold ${autoMode ? 'text-emerald-600' : 'text-slate-400'}`}>{autoMode ? 'Watching' : 'Paused'}</span>
            </div>
            <button onClick={() => setDiagOpen(d => !d)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-sora font-semibold border transition-all ${diagOpen ? 'bg-sky-50 border-sky-200 text-sky-600' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}><Wrench className="w-3 h-3" /> Diag</button>
            <button onClick={() => setLogsOpen(d => !d)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-sora font-semibold border transition-all ${logsOpen ? 'bg-sky-50 border-sky-200 text-sky-600' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}><ScrollText className="w-3 h-3" /> Logs</button>
            <button onClick={retryGoogleDrive} disabled={gdRunning} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-sora font-semibold bg-white border border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600 transition-all disabled:opacity-50"><CloudUpload className="w-3 h-3" /> GD Retry</button>
            <button onClick={loadAll} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-sky-500 hover:border-sky-200 transition-all"><RefreshCw className="w-3.5 h-3.5" /></button>
          </div>
        </div>

        {/* ── Diag panel ── */}
        {diagOpen && (
          <div className="glass-card p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><Wrench className="w-4 h-4 text-sky-500" /><span className="font-sora font-semibold text-sm text-slate-700">System Diagnostics</span></div>
              <button onClick={() => setDiagOpen(false)} className="text-slate-300 hover:text-slate-500"><X className="w-4 h-4" /></button>
            </div>
            {diagLoading ? <div className="flex items-center gap-2 text-slate-400"><RefreshCw className="w-3.5 h-3.5 animate-spin" /><span className="font-mono text-xs">Running checks...</span></div>
              : <div className="space-y-2">
                  {diagItems.map((item, i) => (
                    <div key={i} className={`flex items-start gap-3 p-2.5 rounded-lg border ${item.ok ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                      <span className={item.ok ? 'text-emerald-500' : 'text-red-500'}>{item.ok ? '✓' : '✗'}</span>
                      <div><p className="font-sora text-xs font-semibold text-slate-700">{item.label}</p><p className={`font-mono text-[10px] ${item.ok ? 'text-emerald-600' : 'text-red-600'}`}>{item.detail}</p></div>
                    </div>
                  ))}
                  {!diagItems.length && <p className="font-mono text-xs text-slate-400">No results</p>}
                </div>}
          </div>
        )}

        {/* ── Logs panel ── */}
        {logsOpen && (
          <div className="glass-card p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><ScrollText className="w-4 h-4 text-sky-500" /><span className="font-sora font-semibold text-sm text-slate-700">Firestore Read Log</span></div>
              <div className="flex items-center gap-2">
                <button onClick={loadLogs} className="text-slate-400 hover:text-sky-500"><RefreshCw className="w-3.5 h-3.5" /></button>
                <button onClick={() => setLogsOpen(false)} className="text-slate-300 hover:text-slate-500"><X className="w-4 h-4" /></button>
              </div>
            </div>
            {logLoading ? <div className="flex items-center gap-2 text-slate-400"><RefreshCw className="w-3.5 h-3.5 animate-spin" /><span className="font-mono text-xs">Loading...</span></div>
              : <pre className="font-mono text-[11px] text-slate-500 whitespace-pre-wrap">{logData || 'No data'}</pre>}
          </div>
        )}

        {/* ── GD panel ── */}
        {gdOpen && (
          <div className="glass-card p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><CloudUpload className="w-4 h-4 text-emerald-500" /><span className="font-sora font-semibold text-sm text-slate-700">Google Drive Filing</span>{gdRunning && <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />}</div>
              <button onClick={() => setGdOpen(false)} className="text-slate-300 hover:text-slate-500"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {gdRows.length === 0 && <p className="font-mono text-xs text-slate-400">{gdRunning ? 'Connecting...' : 'No files to process'}</p>}
              {gdRows.map(row => (
                <div key={row.id} className={`flex items-start gap-2 p-2.5 rounded-lg border ${row.status === 'success' ? 'bg-emerald-50 border-emerald-200' : row.status === 'failed' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-sora text-xs font-medium text-slate-700 truncate">{row.name}</p>
                    <p className="font-mono text-[10px] text-slate-400">{row.detail}</p>
                    {row.linkUrl && <a href={row.linkUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] text-sky-500 hover:underline flex items-center gap-1">Open folder <ExternalLink className="w-2.5 h-2.5" /></a>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Queue panel ── */}
        {queueOpen && waitingFiles.length > 0 && (
          <div className="glass-card p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><Inbox className="w-4 h-4 text-sky-500" /><span className="font-sora font-semibold text-sm text-slate-700">Waiting Queue</span></div>
              <button onClick={() => setQueueOpen(false)} className="text-slate-300 hover:text-slate-500"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2">
              {waitingFiles.map(f => (
                <button key={f.fileId} onClick={() => { const scan = scanFiles.find(s => s.id === f.fileId); if (scan) setSelectedFile(scan); setQueueOpen(false); }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-white hover:border-sky-200 transition-all text-left">
                  <FileText className="w-4 h-4 text-sky-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0"><p className="font-sora text-xs font-medium text-slate-700 truncate">{f.fileName}</p><p className="font-mono text-[10px] text-slate-400">{f.totalPages ?? '?'} pages</p></div>
                  <Play className="w-3 h-3 text-sky-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Three columns ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Scans */}
          <div className="glass-card flex flex-col" style={{ minHeight: '320px', maxHeight: '380px' }}>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-sky-500" />
                  <span className="font-sora font-semibold text-sm text-slate-700">Scans</span>
                  {waitingFiles.length > 0 && (
                    <button onClick={() => setQueueOpen(q => !q)} className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-600 hover:bg-sky-100">
                      <Inbox className="w-2.5 h-2.5" /><span className="font-mono text-[9px] font-bold">{waitingFiles.length}</span>
                    </button>
                  )}
                </div>
                <p className="font-mono text-[10px] text-slate-400 mt-0.5">{scanFiles.length} file{scanFiles.length !== 1 ? 's' : ''} · OneDrive Scans</p>
              </div>
              <button onClick={() => loadStatusCache().then(cache => loadScans(cache))} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 border border-transparent hover:border-sky-200 transition-all"><RefreshCw className="w-3.5 h-3.5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {scanFiles.length === 0
                ? <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-300"><CheckCircle2 className="w-8 h-8" /><p className="font-sora text-sm">All files processed</p></div>
                : scanFiles.map(f => (
                  <div key={f.id} onClick={() => !isRunning && setSelectedFile(f)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group ${selectedFile?.id === f.id ? 'border-sky-300 bg-sky-50 shadow-sm' : waitingFiles.some(w => w.fileId === f.id) ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${selectedFile?.id === f.id ? 'bg-sky-100' : 'bg-slate-100'}`}>
                      <FileText className={`w-4 h-4 ${selectedFile?.id === f.id ? 'text-sky-500' : 'text-slate-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-sora text-xs font-semibold text-slate-700 truncate">{f.name}</p>
                      <p className="font-mono text-[10px] text-slate-400">{fsize(f.size)} · {fdate(f.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {waitingFiles.some(w => w.fileId === f.id) && <span className="px-1.5 py-0.5 rounded bg-amber-100 border border-amber-200 font-mono text-[8px] text-amber-600">WAIT</span>}
                      <button onClick={e => doReset(f.id, e)} className="w-5 h-5 rounded border border-transparent hover:border-red-200 text-slate-200 hover:text-red-400 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"><RotateCcw className="w-2.5 h-2.5" /></button>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${selectedFile?.id === f.id ? 'border-sky-500 bg-sky-500' : 'border-slate-300'}`}>
                        {selectedFile?.id === f.id && <span className="text-white text-[8px] font-bold">✓</span>}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            {selectedFile && !isRunning && (
              <div className="p-4 border-t border-slate-100 flex-shrink-0">
                <p className="font-sora text-xs font-semibold text-slate-600 mb-2 truncate">{selectedFile.name}</p>
                <div className="space-y-1.5 mb-3">
                  {([
                    [1, 'Full run', 'AI + file to GD & OneDrive'],
                    [2, 'AI only', 'Skip filing'],
                    [3, 'Split only', 'Skip Make.com'],
                  ] as [1|2|3, string, string][]).map(([val, title, sub]) => (
                    <label key={val} onClick={() => setRunMode(val)} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${runMode === val ? 'border-sky-300 bg-sky-50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${runMode === val ? 'border-sky-500 bg-sky-500' : 'border-slate-300'}`} />
                      <div><p className="font-sora text-xs font-semibold text-slate-700">{title}</p><p className="font-mono text-[9px] text-slate-400">{sub}</p></div>
                    </label>
                  ))}
                </div>
                <button onClick={startRun} className="w-full py-2.5 rounded-xl bg-sky-500 text-white font-sora font-semibold text-sm flex items-center justify-center gap-2 hover:bg-sky-600 transition-all shadow-sm">
                  <Play className="w-3.5 h-3.5" /> Process File
                </button>
              </div>
            )}
            {selectedFile && isRunning && (
              <div className="p-4 border-t border-slate-100 flex-shrink-0">
                <div className="flex items-center gap-2 justify-center py-1 text-sky-500">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="font-sora text-xs font-semibold">Processing...</span>
                </div>
              </div>
            )}
          </div>

          {/* Processed */}
          <div className="glass-card flex flex-col" style={{ minHeight: '320px', maxHeight: '380px' }}>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span className="font-sora font-semibold text-sm text-slate-700">Processed</span></div>
                <p className="font-mono text-[10px] text-slate-400 mt-0.5">{procFiles.length} file{procFiles.length !== 1 ? 's' : ''} · OneDrive Processed</p>
              </div>
              <button onClick={() => loadStatusCache().then(cache => loadProcessed(cache))} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 border border-transparent hover:border-emerald-200 transition-all"><RefreshCw className="w-3.5 h-3.5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {procFiles.length === 0
                ? <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-300"><FileText className="w-8 h-8" /><p className="font-sora text-sm">No files yet</p></div>
                : procFiles.map((f, idx) => {
                  const hasGd = !!f.rec?.googleDriveFolderUrl;
                  const gdPending = !!f.rec && !hasGd;
                  const isExpanded = expandedProc === idx;
                  return (
                    <div key={idx} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                      <div onClick={() => setExpandedProc(isExpanded ? null : idx)} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-all">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0"><CheckCircle2 className="w-4 h-4 text-emerald-500" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-sora text-xs font-semibold text-slate-700 truncate">{f.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {hasGd && <span className="px-1.5 py-0.5 rounded-full text-[8px] font-mono font-bold bg-emerald-100 border border-emerald-200 text-emerald-600">GD ✓</span>}
                            {gdPending && <span className="px-1.5 py-0.5 rounded-full text-[8px] font-mono font-bold bg-amber-100 border border-amber-200 text-amber-600">GD ⏳</span>}
                            {f.webUrl && <span className="px-1.5 py-0.5 rounded-full text-[8px] font-mono font-bold bg-sky-100 border border-sky-200 text-sky-600">OD ✓</span>}
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
                      </div>
                      {isExpanded && (
                        <div className="px-4 pb-3 space-y-1.5 border-t border-slate-100 bg-slate-50">
                          <div className="h-2" />
                          {f.rec?.customerName && <div className="flex gap-2"><span className="font-mono text-[9px] text-slate-400 w-16">Customer</span><span className="font-inter text-xs text-slate-600">{f.rec.customerName}</span></div>}
                          {f.rec?.ref && <div className="flex gap-2"><span className="font-mono text-[9px] text-slate-400 w-16">Ref</span><span className="font-inter text-xs text-slate-600">{f.rec.ref}</span></div>}
                          <div className="flex gap-2"><span className="font-mono text-[9px] text-slate-400 w-16">Size</span><span className="font-inter text-xs text-slate-600">{fsize(f.size)}</span></div>
                          <div className="flex gap-2"><span className="font-mono text-[9px] text-slate-400 w-16">Added</span><span className="font-inter text-xs text-slate-600">{fdate(f.createdAt)}</span></div>
                          {hasGd && <div className="flex gap-2 items-center"><span className="font-mono text-[9px] text-slate-400 w-16">GDrive</span><a href={f.rec!.googleDriveFolderUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] text-emerald-500 hover:underline flex items-center gap-1">Open folder <ExternalLink className="w-2.5 h-2.5" /></a></div>}
                          {gdPending && <div className="flex gap-2 items-center"><span className="font-mono text-[9px] text-slate-400 w-16">GDrive</span><button onClick={() => sendFileToGd(f.name, f.rec?.fileId ?? '')} className="font-mono text-[10px] text-emerald-500 border border-emerald-200 px-2 py-0.5 rounded-lg hover:bg-emerald-50 transition-all">Send to GD</button></div>}
                          {f.webUrl && <div className="flex gap-2 items-center"><span className="font-mono text-[9px] text-slate-400 w-16">OneDrive</span><a href={f.webUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] text-sky-500 hover:underline flex items-center gap-1">Open file <ExternalLink className="w-2.5 h-2.5" /></a></div>}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* History */}
          <div className="glass-card flex flex-col" style={{ minHeight: '320px', maxHeight: '380px' }}>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <div>
                <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" /><span className="font-sora font-semibold text-sm text-slate-700">Run History</span></div>
                <p className="font-mono text-[10px] text-slate-400 mt-0.5">Last 10 automation runs</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 font-mono text-[9px] text-emerald-600 font-bold">{history.filter(r => r.status === 'success').length} ok</span>
                <span className="px-2 py-0.5 rounded-full bg-red-50 border border-red-200 font-mono text-[9px] text-red-500 font-bold">{history.filter(r => r.status === 'failed').length} fail</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {history.length === 0
                ? <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-300"><Clock className="w-8 h-8" /><p className="font-sora text-sm text-center">No runs yet</p><p className="font-inter text-xs text-center">Process a file to see history</p></div>
                : history.map(run => <HistoryRow key={run.id} run={run} />)
              }
            </div>
            {history.length > 0 && (
              <div className="p-4 border-t border-slate-100 flex-shrink-0">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Total', val: history.length, c: 'text-slate-600' },
                    { label: 'Success', val: history.filter(r => r.status === 'success').length, c: 'text-emerald-600' },
                    { label: 'Failed', val: history.filter(r => r.status === 'failed').length, c: 'text-red-500' },
                  ].map(s => (
                    <div key={s.label} className="text-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <p className={`font-sora font-bold text-lg ${s.c}`}>{s.val}</p>
                      <p className="font-inter text-[9px] text-slate-400">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Automation Visualiser (full width) ── */}
        <div className="glass-card p-4 mt-4">
          <AutomationVisualiser steps={pipelineSteps} isRunning={isRunning} fileName={activeFileName} />

          {/* Result */}
          {runResult && !isRunning && (
            <div className="mt-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2 mb-3"><CheckCheck className="w-4 h-4 text-emerald-500" /><span className="font-sora font-semibold text-sm text-emerald-700">Processing Complete</span></div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {runResult.customerName && <div><p className="font-mono text-[9px] text-slate-400 uppercase">Customer</p><p className="font-sora text-xs font-medium text-slate-700">{runResult.customerName}</p></div>}
                {runResult.ref && <div><p className="font-mono text-[9px] text-slate-400 uppercase">Reference</p><p className="font-sora text-xs font-medium text-slate-700">{runResult.ref}</p></div>}
                {runResult.totalPages && <div><p className="font-mono text-[9px] text-slate-400 uppercase">Pages</p><p className="font-sora text-xs font-medium text-slate-700">{runResult.totalPages}</p></div>}
                {runResult.googleDriveFolderUrl && <div><p className="font-mono text-[9px] text-slate-400 uppercase">Google Drive</p><a href={runResult.googleDriveFolderUrl} target="_blank" rel="noopener noreferrer" className="font-sora text-xs text-sky-500 hover:underline flex items-center gap-1">Open <ExternalLink className="w-2.5 h-2.5" /></a></div>}
              </div>
            </div>
          )}

          {/* Error */}
          {runError && !isRunning && (
            <div className="mt-5 p-4 rounded-xl bg-red-50 border border-red-200">
              <div className="flex items-center gap-2 mb-1"><AlertCircle className="w-4 h-4 text-red-500" /><span className="font-sora font-semibold text-sm text-red-700">Processing Failed</span></div>
              <p className="font-mono text-xs text-red-600">{runError}</p>
              {selectedFile && <button onClick={startRun} className="mt-2 font-sora text-xs text-sky-500 hover:underline">↺ Try Again</button>}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
