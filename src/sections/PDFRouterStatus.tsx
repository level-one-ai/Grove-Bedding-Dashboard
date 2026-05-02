/**
 * src/sections/PDFRouterStatus.tsx
 * ─────────────────────────────────
 * Live PDF Router monitoring panel.
 *
 * Reads from three Firestore collections on the PDF Router Firebase project:
 *   pdfRouterStatus/{fileId}   — per-file processing status
 *   pdfRouterErrors/{fileId}   — errors including Cin7 no-match
 *   pdfRouterActivity          — recent activity log
 *
 * Updates in real-time via Firestore listeners — no polling needed.
 */

import { useEffect, useState, useRef } from 'react';
import {
  FileText, CheckCircle2, AlertCircle, Clock,
  ChevronDown, ChevronUp, ExternalLink, CloudUpload,
  FolderOpen, Loader2, Activity, AlertTriangle, CheckCheck,
  Building2, User, Play, RefreshCw, Inbox,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────


interface Cin7Lookup {
  folderName: string;
  cin7OrderRef: string | null;
  cin7Company: string | null;
  cin7Customer: string | null;
  source: 'company' | 'customer' | 'fallback';
}

interface FileStatus {
  fileId: string;
  fileName?: string;
  status: 'detected' | 'processing' | 'complete' | 'error';
  totalPages?: number;
  pagesCompleted?: number;
  detectedAt?: string;
  completedAt?: string;
  errorAt?: string;
  error?: string;
  customerName?: string;
  cin7Status?: 'matched' | 'no_match';
  cin7FolderName?: string;
  cin7OrderRef?: string;
  cin7Source?: string;
  cin7Lookup?: Cin7Lookup;
  googleDriveFolderUrl?: string;
  googleDriveCustomerFolderUrl?: string;
  oneDriveProcessedFolderUrl?: string;
  renamedFiles?: string[];
  updatedAt?: { seconds: number } | string;
  [key: string]: unknown;
}

interface RouterError {
  fileId: string;
  type: string;
  message: string;
  searchName?: string;
  pdfRef?: string;
  createdAt?: { seconds: number } | string;
}

interface ActivityEntry {
  event: string;
  fileId?: string;
  fileName?: string;
  createdAt?: { seconds: number } | string;
  [key: string]: unknown;
}

interface ScansFile {
  id: string;
  name: string;
  sizeBytes: number;
  createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(val: { seconds: number } | string | undefined): string {
  if (!val) return '—';
  const date = typeof val === 'string'
    ? new Date(val)
    : new Date(val.seconds * 1000);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDate(val: { seconds: number } | string | undefined): string {
  if (!val) return '—';
  const date = typeof val === 'string'
    ? new Date(val)
    : new Date(val.seconds * 1000);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function statusColour(status: string): string {
  switch (status) {
    case 'complete':    return '#22c55e';
    case 'processing':  return '#3b82f6';
    case 'detected':    return '#f59e0b';
    case 'error':       return '#ef4444';
    default:            return '#94a3b8';
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'complete':    return 'Complete';
    case 'processing':  return 'Processing';
    case 'detected':    return 'Detected';
    case 'error':       return 'Error';
    default:            return status;
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const colour = statusColour(status);
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-inter text-xs font-medium"
      style={{ background: `${colour}18`, color: colour, border: `1px solid ${colour}30` }}
    >
      {status === 'processing' && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
      {status === 'complete'   && <CheckCircle2 className="w-2.5 h-2.5" />}
      {status === 'error'      && <AlertCircle className="w-2.5 h-2.5" />}
      {status === 'detected'   && <Clock className="w-2.5 h-2.5" />}
      {statusLabel(status)}
    </span>
  );
}

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: '#e2e8f0' }}>
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: '#3b82f6' }}
        />
      </div>
      <span className="font-inter text-xs" style={{ color: '#64748b' }}>{completed}/{total}</span>
    </div>
  );
}

function FileCard({ file, expanded, onToggle }: {
  file: FileStatus;
  expanded: boolean;
  onToggle: () => void;
}) {
  const colour = statusColour(file.status);
  const pagesTotal = file.totalPages ?? 0;
  const pagesDone  = file.pagesCompleted ?? 0;

  return (
    <div
      className="rounded-xl border transition-all duration-200"
      style={{
        background: '#ffffff',
        borderColor: expanded ? colour + '40' : '#e2e8f0',
        boxShadow: expanded ? `0 0 0 1px ${colour}20` : 'none',
      }}
    >
      {/* Card header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3.5 text-left"
      >
        {/* Status dot */}
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{
            background: colour,
            boxShadow: file.status === 'processing' ? `0 0 0 4px ${colour}25` : 'none',
            animation: file.status === 'processing' ? 'pulse 2s infinite' : 'none',
          }}
        />

        {/* File name */}
        <div className="flex-1 min-w-0">
          <p className="font-inter text-sm font-medium truncate" style={{ color: '#1e293b' }}>
            {file.fileName ?? file.fileId}
          </p>
          <p className="font-inter text-xs mt-0.5" style={{ color: '#94a3b8' }}>
            {formatDate(file.updatedAt ?? file.detectedAt)}
          </p>
        </div>

        {/* Status badge */}
        <StatusBadge status={file.status} />

        {/* Expand toggle */}
        <span style={{ color: '#94a3b8' }}>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {/* Progress bar for multi-page files */}
      {file.status === 'processing' && pagesTotal > 1 && (
        <div className="px-3.5 pb-3">
          <ProgressBar completed={pagesDone} total={pagesTotal} />
        </div>
      )}

      {/* Expanded detail */}
      {expanded && (
        <div className="px-3.5 pb-3.5 border-t" style={{ borderColor: '#f1f5f9' }}>
          <div className="pt-3 space-y-3">

            {/* Cin7 match */}
            {file.cin7Status === 'matched' && (
              <div className="rounded-lg p-3" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />
                  <span className="font-inter text-xs font-semibold" style={{ color: '#15803d' }}>Cin7 Match Found</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {file.cin7Source === 'company'
                    ? <Building2 className="w-3 h-3" style={{ color: '#64748b' }} />
                    : <User className="w-3 h-3" style={{ color: '#64748b' }} />}
                  <span className="font-inter text-xs font-medium" style={{ color: '#1e293b' }}>
                    {file.cin7FolderName}
                  </span>
                  <span className="font-inter text-xs" style={{ color: '#94a3b8' }}>
                    ({file.cin7Source === 'company' ? 'Company name' : 'Customer name'})
                  </span>
                </div>
                {file.cin7OrderRef && (
                  <p className="font-inter text-xs mt-0.5" style={{ color: '#64748b' }}>
                    Order ref: <span className="font-mono">{file.cin7OrderRef}</span>
                  </p>
                )}
              </div>
            )}

            {/* Cin7 no match */}
            {file.cin7Status === 'no_match' && (
              <div className="rounded-lg p-3" style={{ background: '#fef3c7', border: '1px solid #fde68a' }}>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#d97706' }} />
                  <span className="font-inter text-xs font-semibold" style={{ color: '#92400e' }}>No Cin7 Match</span>
                </div>
                <p className="font-inter text-xs" style={{ color: '#78350f' }}>
                  Used Claude-extracted name. Check Cin7 Sales Orders manually.
                </p>
              </div>
            )}

            {/* Error */}
            {file.status === 'error' && file.error && (
              <div className="rounded-lg p-3" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
                  <span className="font-inter text-xs font-semibold" style={{ color: '#dc2626' }}>Processing Error</span>
                </div>
                <p className="font-inter text-xs" style={{ color: '#b91c1c' }}>{file.error}</p>
              </div>
            )}

            {/* Filing destinations */}
            <div className="space-y-1.5">
              {/* Google Drive */}
              <div className="flex items-center gap-2">
                <CloudUpload className="w-3.5 h-3.5 flex-shrink-0" style={{ color: file.googleDriveFolderUrl ? '#22c55e' : '#94a3b8' }} />
                <span className="font-inter text-xs" style={{ color: '#64748b' }}>Google Drive</span>
                {file.googleDriveFolderUrl ? (
                  <a
                    href={file.googleDriveFolderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-inter text-xs font-medium ml-auto"
                    style={{ color: '#0ea5e9' }}
                  >
                    Open folder <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="font-inter text-xs ml-auto" style={{ color: '#94a3b8' }}>
                    {file.status === 'complete' ? 'No link' : 'Pending'}
                  </span>
                )}
              </div>

              {/* OneDrive */}
              <div className="flex items-center gap-2">
                <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" style={{ color: file.oneDriveProcessedFolderUrl ? '#22c55e' : '#94a3b8' }} />
                <span className="font-inter text-xs" style={{ color: '#64748b' }}>OneDrive</span>
                {file.oneDriveProcessedFolderUrl ? (
                  <a
                    href={file.oneDriveProcessedFolderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-inter text-xs font-medium ml-auto"
                    style={{ color: '#0ea5e9' }}
                  >
                    Open folder <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="font-inter text-xs ml-auto" style={{ color: '#94a3b8' }}>
                    {file.status === 'complete' ? 'No link' : 'Pending'}
                  </span>
                )}
              </div>
            </div>

            {/* Renamed files */}
            {file.renamedFiles && file.renamedFiles.length > 0 && (
              <div>
                <p className="font-inter text-xs font-medium mb-1" style={{ color: '#64748b' }}>Processed files:</p>
                <div className="space-y-0.5">
                  {file.renamedFiles.map((name, i) => (
                    <p key={i} className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: '#f8fafc', color: '#475569' }}>
                      {name}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="flex items-center gap-4 pt-1 border-t" style={{ borderColor: '#f1f5f9' }}>
              {file.detectedAt && (
                <div>
                  <p className="font-inter text-xs" style={{ color: '#94a3b8' }}>Detected</p>
                  <p className="font-inter text-xs" style={{ color: '#64748b' }}>{formatTime({ seconds: new Date(file.detectedAt).getTime() / 1000 })}</p>
                </div>
              )}
              {file.completedAt && (
                <div>
                  <p className="font-inter text-xs" style={{ color: '#94a3b8' }}>Completed</p>
                  <p className="font-inter text-xs" style={{ color: '#64748b' }}>{formatTime({ seconds: new Date(file.completedAt).getTime() / 1000 })}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Unprocessed Files Panel ───────────────────────────────────────────────────

function UnprocessedFiles() {
  const [files, setFiles]         = useState<ScansFile[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [triggering, setTriggering] = useState<string | null>(null); // file id being triggered
  const [triggered, setTriggered] = useState<Set<string>>(new Set());

  async function fetchFiles() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/scans-list');
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to list Scans folder');
      setFiles(data.files || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function triggerProcessing(file: ScansFile) {
    setTriggering(file.id);
    try {
      const res = await fetch('/api/scans-list', { method: 'POST' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Trigger failed');
      setTriggered(prev => new Set(prev).add(file.id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Trigger failed');
    } finally {
      setTriggering(null);
    }
  }

  useEffect(() => { fetchFiles(); }, []);

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="rounded-xl" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3 border-b"
        style={{ borderColor: '#f1f5f9' }}
      >
        <Inbox className="w-4 h-4" style={{ color: '#6366f1' }} />
        <span className="font-sora font-semibold text-sm" style={{ color: '#1e293b' }}>
          Unprocessed Files
        </span>
        {!loading && (
          <span
            className="ml-1 px-1.5 py-0.5 rounded-full font-inter text-xs"
            style={{
              background: files.length > 0 ? '#eef2ff' : '#f1f5f9',
              color: files.length > 0 ? '#6366f1' : '#94a3b8',
            }}
          >
            {files.length}
          </span>
        )}
        <button
          onClick={fetchFiles}
          disabled={loading}
          className="ml-auto p-1 rounded-lg transition-colors"
          style={{ color: '#94a3b8' }}
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-3">
        {/* Error */}
        {error && (
          <div
            className="rounded-lg p-3 mb-3 flex items-start gap-2"
            style={{ background: '#fef2f2', border: '1px solid #fecaca' }}
          >
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
            <p className="font-inter text-xs" style={{ color: '#b91c1c' }}>{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#94a3b8' }} />
          </div>
        )}

        {/* Empty */}
        {!loading && !error && files.length === 0 && (
          <div className="text-center py-6">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2" style={{ color: '#86efac' }} />
            <p className="font-inter text-xs font-medium" style={{ color: '#64748b' }}>
              Scans folder is clear
            </p>
            <p className="font-inter text-xs mt-0.5" style={{ color: '#cbd5e1' }}>
              No unprocessed PDFs waiting
            </p>
          </div>
        )}

        {/* File list */}
        {!loading && files.length > 0 && (
          <div className="space-y-2">
            <p className="font-inter text-xs mb-2" style={{ color: '#94a3b8' }}>
              These PDFs are in the Scans folder and have not yet been processed.
              The router will pick them up automatically, or you can trigger processing now.
            </p>
            {files.map(file => {
              const isTriggering = triggering === file.id;
              const wasTriggered = triggered.has(file.id);
              return (
                <div
                  key={file.id}
                  className="rounded-lg p-3 flex items-center gap-3"
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                >
                  <FileText className="w-4 h-4 flex-shrink-0" style={{ color: '#6366f1' }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-inter text-xs font-medium truncate" style={{ color: '#1e293b' }}>
                      {file.name}
                    </p>
                    <p className="font-inter text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                      {formatSize(file.sizeBytes)} · {new Date(file.createdAt).toLocaleString('en-GB', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => triggerProcessing(file)}
                    disabled={isTriggering || wasTriggered}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-inter text-xs font-medium transition-all flex-shrink-0"
                    style={{
                      background: wasTriggered ? '#f0fdf4' : isTriggering ? '#f1f5f9' : '#6366f1',
                      color:      wasTriggered ? '#16a34a'  : isTriggering ? '#94a3b8' : '#ffffff',
                      border:     wasTriggered ? '1px solid #bbf7d0' : 'none',
                      cursor:     wasTriggered || isTriggering ? 'default' : 'pointer',
                    }}
                  >
                    {isTriggering
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : wasTriggered
                        ? <CheckCircle2 className="w-3 h-3" />
                        : <Play className="w-3 h-3" />}
                    {wasTriggered ? 'Triggered' : isTriggering ? 'Sending...' : 'Process'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

type FilterType = 'all' | 'processing' | 'complete' | 'error';

export default function PDFRouterStatus() {
  const [files, setFiles]           = useState<FileStatus[]>([]);
  const [errors, setErrors]         = useState<RouterError[]>([]);
  const [activity, setActivity]     = useState<ActivityEntry[]>([]);
  const [loading, setLoading]       = useState(true);
  const [connected, setConnected]   = useState(false);
  const [filter, setFilter]         = useState<FilterType>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [connError, setConnError]   = useState<string | null>(null);
  const unsubscribers = useRef<Array<() => void>>([]);

  useEffect(() => {
    let mounted = true;

    async function connect() {
      try {
        // Dynamically import Firebase so it doesn't break if not configured
        const { initializeApp, getApps } = await import('firebase/app');
        const { getFirestore, collection, onSnapshot, query, orderBy, limit } = await import('firebase/firestore');

        const projectId  = import.meta.env.VITE_PDF_ROUTER_FIREBASE_PROJECT_ID;
        const apiKey     = import.meta.env.VITE_PDF_ROUTER_FIREBASE_API_KEY;
        const authDomain = import.meta.env.VITE_PDF_ROUTER_FIREBASE_AUTH_DOMAIN;

        if (!projectId || !apiKey) {
          setConnError('PDF Router Firebase credentials not configured.\nAdd VITE_PDF_ROUTER_FIREBASE_PROJECT_ID and VITE_PDF_ROUTER_FIREBASE_API_KEY to Vercel environment variables.');
          setLoading(false);
          return;
        }

        const app = getApps().find(a => a.name === 'pdf-router')
          ?? initializeApp({ apiKey, authDomain, projectId }, 'pdf-router');
        const db = getFirestore(app);

        // Listen to pdfRouterStatus — real-time updates
        const statusQ = query(
          collection(db, 'pdfRouterStatus'),
          orderBy('updatedAt', 'desc'),
          limit(50)
        );
        const unsubStatus = onSnapshot(statusQ, snap => {
          if (!mounted) return;
          const data = snap.docs.map(d => ({ fileId: d.id, ...d.data() } as FileStatus));
          setFiles(data);
          setConnected(true);
          setLoading(false);
        }, err => {
          console.warn('[PDFRouterStatus] Status listener error:', err.message);
          setConnError(`Connection error: ${err.message}`);
          setLoading(false);
        });

        // Listen to pdfRouterErrors
        const errQ = query(
          collection(db, 'pdfRouterErrors'),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const unsubErrors = onSnapshot(errQ, snap => {
          if (!mounted) return;
          setErrors(snap.docs.map(d => ({ fileId: d.id, ...d.data() } as RouterError)));
        });

        // Listen to pdfRouterActivity
        const actQ = query(
          collection(db, 'pdfRouterActivity'),
          orderBy('createdAt', 'desc'),
          limit(30)
        );
        const unsubActivity = onSnapshot(actQ, snap => {
          if (!mounted) return;
          setActivity(snap.docs.map(d => ({ id: d.id, ...d.data() } as unknown as ActivityEntry)));
        });

        unsubscribers.current = [unsubStatus, unsubErrors, unsubActivity];
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setConnError(`Failed to connect: ${msg}`);
        setLoading(false);
      }
    }

    connect();

    return () => {
      mounted = false;
      unsubscribers.current.forEach(u => u());
    };
  }, []);

  const filtered = files.filter(f => {
    if (filter === 'all') return true;
    return f.status === filter;
  });

  const counts = {
    all:        files.length,
    processing: files.filter(f => f.status === 'processing').length,
    complete:   files.filter(f => f.status === 'complete').length,
    error:      files.filter(f => f.status === 'error' || f.cin7Status === 'no_match').length,
  };

  const recentErrors = errors.slice(0, 5);

  return (
    <div
      className="h-full overflow-y-auto"
      style={{ background: '#f8fafc', padding: '24px' }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-sora font-bold text-2xl" style={{ color: '#1e293b' }}>
              PDF Router
            </h1>
            <p className="font-inter text-sm mt-1" style={{ color: '#64748b' }}>
              Live processing status from the PDF Router
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: connected ? '#22c55e' : connError ? '#ef4444' : '#f59e0b',
                boxShadow: connected ? '0 0 0 4px #22c55e25' : 'none',
                animation: connected ? 'pulse 2s infinite' : 'none',
              }}
            />
            <span className="font-inter text-xs" style={{ color: '#64748b' }}>
              {connected ? 'Live' : connError ? 'Disconnected' : 'Connecting...'}
            </span>
          </div>
        </div>

        {/* Connection error */}
        {connError && (
          <div
            className="rounded-xl p-4 mb-6 flex items-start gap-3"
            style={{ background: '#fef2f2', border: '1px solid #fecaca' }}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
            <div>
              <p className="font-inter text-sm font-semibold" style={{ color: '#dc2626' }}>
                Cannot connect to PDF Router Firebase
              </p>
              <pre className="font-inter text-xs mt-1 whitespace-pre-wrap" style={{ color: '#b91c1c' }}>
                {connError}
              </pre>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total', value: counts.all, colour: '#3b82f6', icon: FileText },
            { label: 'Processing', value: counts.processing, colour: '#f59e0b', icon: Loader2 },
            { label: 'Complete', value: counts.complete, colour: '#22c55e', icon: CheckCheck },
            { label: 'Errors', value: counts.error, colour: '#ef4444', icon: AlertTriangle },
          ].map(({ label, value, colour, icon: Icon }) => (
            <div
              key={label}
              className="rounded-xl p-4"
              style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4" style={{ color: colour }} />
                <span className="font-inter text-xs" style={{ color: '#64748b' }}>{label}</span>
              </div>
              <p className="font-sora font-bold text-2xl" style={{ color: '#1e293b' }}>{value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 340px' }}>

          {/* Left — File list */}
          <div>
            {/* Filter tabs */}
            <div className="flex items-center gap-2 mb-4">
              {(['all', 'processing', 'complete', 'error'] as FilterType[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="px-3 py-1.5 rounded-lg font-inter text-xs font-medium transition-all"
                  style={{
                    background: filter === f ? '#1e293b' : '#ffffff',
                    color:      filter === f ? '#ffffff' : '#64748b',
                    border:     `1px solid ${filter === f ? '#1e293b' : '#e2e8f0'}`,
                  }}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  {counts[f] > 0 && (
                    <span
                      className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs"
                      style={{
                        background: filter === f ? '#ffffff25' : '#f1f5f9',
                        color: filter === f ? '#ffffff' : '#64748b',
                      }}
                    >
                      {counts[f]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* File cards */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#94a3b8' }} />
              </div>
            ) : filtered.length === 0 ? (
              <div
                className="rounded-xl p-12 text-center"
                style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}
              >
                <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: '#cbd5e1' }} />
                <p className="font-inter text-sm font-medium" style={{ color: '#94a3b8' }}>
                  {filter === 'all' ? 'No files processed yet' : `No ${filter} files`}
                </p>
                <p className="font-inter text-xs mt-1" style={{ color: '#cbd5e1' }}>
                  Files will appear here as the PDF Router processes them
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map(file => (
                  <FileCard
                    key={file.fileId}
                    file={file}
                    expanded={expandedId === file.fileId}
                    onToggle={() => setExpandedId(expandedId === file.fileId ? null : file.fileId)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right — Unprocessed files + Activity feed + Errors */}
          <div className="space-y-4">

            {/* Unprocessed files in Scans folder */}
            <UnprocessedFiles />

            {/* Recent errors */}
            {recentErrors.length > 0 && (
              <div
                className="rounded-xl"
                style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}
              >
                <div
                  className="flex items-center gap-2 px-4 py-3 border-b"
                  style={{ borderColor: '#f1f5f9' }}
                >
                  <AlertCircle className="w-4 h-4" style={{ color: '#ef4444' }} />
                  <span className="font-sora font-semibold text-sm" style={{ color: '#1e293b' }}>
                    Recent Errors
                  </span>
                  <span
                    className="ml-auto px-1.5 py-0.5 rounded-full font-inter text-xs"
                    style={{ background: '#fef2f2', color: '#ef4444' }}
                  >
                    {recentErrors.length}
                  </span>
                </div>
                <div className="p-3 space-y-2">
                  {recentErrors.map((err, i) => (
                    <div
                      key={i}
                      className="rounded-lg p-3"
                      style={{ background: '#fef2f2', border: '1px solid #fecaca' }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="px-1.5 py-0.5 rounded text-xs font-mono font-medium"
                          style={{ background: '#fee2e2', color: '#dc2626' }}
                        >
                          {err.type}
                        </span>
                        <span className="font-inter text-xs" style={{ color: '#94a3b8' }}>
                          {formatTime(err.createdAt)}
                        </span>
                      </div>
                      <p className="font-inter text-xs" style={{ color: '#b91c1c' }}>
                        {err.message}
                      </p>
                      {err.searchName && (
                        <p className="font-inter text-xs mt-1" style={{ color: '#94a3b8' }}>
                          Searched for: <span className="font-medium" style={{ color: '#64748b' }}>{err.searchName}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activity feed */}
            <div
              className="rounded-xl"
              style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}
            >
              <div
                className="flex items-center gap-2 px-4 py-3 border-b"
                style={{ borderColor: '#f1f5f9' }}
              >
                <Activity className="w-4 h-4" style={{ color: '#3b82f6' }} />
                <span className="font-sora font-semibold text-sm" style={{ color: '#1e293b' }}>
                  Activity Feed
                </span>
              </div>
              <div className="p-3">
                {activity.length === 0 ? (
                  <p className="font-inter text-xs text-center py-4" style={{ color: '#94a3b8' }}>
                    No recent activity
                  </p>
                ) : (
                  <div className="space-y-2">
                    {activity.map((a, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div
                          className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                          style={{
                            background: a.event === 'file_complete' ? '#22c55e'
                              : a.event === 'cin7_no_match' ? '#f59e0b'
                              : '#3b82f6',
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-inter text-xs" style={{ color: '#1e293b' }}>
                            {a.event === 'file_detected'  && 'New file detected'}
                            {a.event === 'file_complete'  && 'File processing complete'}
                            {a.event === 'cin7_no_match'  && 'Cin7 match not found'}
                            {!['file_detected','file_complete','cin7_no_match'].includes(a.event) && a.event}
                          </p>
                          {a.fileName && (
                            <p className="font-inter text-xs truncate" style={{ color: '#64748b' }}>{String(a.fileName)}</p>
                          )}
                        </div>
                        <span className="font-inter text-xs flex-shrink-0" style={{ color: '#94a3b8' }}>
                          {formatTime(a.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
