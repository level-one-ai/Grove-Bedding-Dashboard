/**
 * src/sections/PDFRouterStatus.tsx
 * ─────────────────────────────────
 * Live PDF Router monitoring panel.
 */

import { useEffect, useState, useRef } from 'react';
import {
  FileText, CheckCircle2, AlertCircle, Clock,
  ChevronDown, ChevronUp, ExternalLink, CloudUpload,
  FolderOpen, Loader2, AlertTriangle, CheckCheck,
  Building2, User, Play, RefreshCw, Inbox, Wrench, RotateCcw, Square,
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
  // Stage tracking — written by scan-now.js and file-page.js
  currentStage?: string;
  currentPage?: number;
  queuedReason?: string;
  [key: string]: unknown;
}

// Per-page data written into pdfRouterStatus by file-page.js as page_${n}
interface PageInfo {
  status?: 'complete' | string;
  finalFileName?: string;
  customerName?: string;
  ref?: string;
  oneDriveUrl?: string | null;
  oneDriveId?: string | null;
  googleDriveUrl?: string | null;
  googleDriveFileId?: string | null;
  reprocessedAt?: string;
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
  const date = typeof val === 'string' ? new Date(val) : new Date(val.seconds * 1000);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDate(val: { seconds: number } | string | undefined): string {
  if (!val) return '—';
  const date = typeof val === 'string' ? new Date(val) : new Date(val.seconds * 1000);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function statusColour(status: string): string {
  switch (status) {
    case 'complete':   return '#22c55e';
    case 'processing': return '#3b82f6';
    case 'detected':   return '#f59e0b';
    case 'error':      return '#ef4444';
    default:           return '#94a3b8';
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'complete':   return 'Complete';
    case 'processing': return 'Processing';
    case 'detected':   return 'Detected';
    case 'error':      return 'Error';
    default:           return status;
  }
}

// Friendly labels for the currentStage field shown inline on each file card
const STAGE_LABELS: Record<string, string> = {
  downloading:  'Downloading',
  splitting:    'Splitting PDF',
  dispatching:  'Sending to Make.com',
  extracting:   'Extracting',
  cin7:         'Looking up Cin7',
  filing:       'Naming file',
  uploading:    'Uploading',
  non_order:    'Non-order page',
  complete:     'Finishing',
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
        <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: '#3b82f6' }} />
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
  const colour     = statusColour(file.status);
  const pagesTotal = file.totalPages ?? 0;
  const pagesDone  = file.pagesCompleted ?? 0;
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [stopping, setStopping]   = useState(false);
  const [stopped, setStopped]     = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [restarted, setRestarted]   = useState(false);
  const [reprocessingPage, setReprocessingPage] = useState<number | null>(null);
  const [reprocessAllRunning, setReprocessAllRunning] = useState(false);

  async function handleReprocessPage(e: React.MouseEvent, pageNumber: number) {
    e.stopPropagation();
    if (!window.confirm(`Reprocess page ${pageNumber}?\n\nThe current file will be moved to the OneDrive Recycle Bin and replaced with a re-extracted version.`)) return;
    setReprocessingPage(pageNumber);
    try {
      const res = await fetch('/api/reprocess-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: file.fileId, pageNumber }),
      });
      const data = await res.json();
      if (!res.ok) {
        window.alert(`Reprocess failed: ${data.error || 'Unknown error'}`);
      } else if (data.status === 'no_change') {
        window.alert(`Page ${pageNumber} is already filed correctly — no changes made.`);
      }
    } catch (err) {
      window.alert(`Reprocess failed: ${(err as Error).message}`);
    } finally {
      setReprocessingPage(null);
    }
  }

  async function handleReprocessAll(e: React.MouseEvent) {
    e.stopPropagation();
    const ok = window.confirm(`Reprocess ALL pages of "${file.fileName ?? file.fileId}"?\n\nThis will re-extract every page and replace the existing files.`);
    if (!ok) return;
    setReprocessAllRunning(true);
    try {
      const res = await fetch('/api/reprocess-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: file.fileId, confirm: 'REPROCESS' }),
      });
      const data = await res.json();
      if (!res.ok) {
        window.alert(`Reprocess all failed: ${data.error || 'Unknown error'}`);
      } else {
        const s = data.summary || {};
        window.alert(`Reprocess complete:\n• Reprocessed: ${s.reprocessed ?? 0}\n• No change: ${s.noChange ?? 0}\n• Skipped: ${s.skipped ?? 0}\n• Failed: ${s.failed ?? 0}`);
      }
    } catch (err) {
      window.alert(`Reprocess all failed: ${(err as Error).message}`);
    } finally {
      setReprocessAllRunning(false);
    }
  }

  async function handleReset(e: React.MouseEvent) {
    e.stopPropagation();
    setResetting(true);
    try {
      await fetch('/api/reset-stuck-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: file.fileId }),
      });
      setResetDone(true);
      setTimeout(() => setResetDone(false), 3000);
    } catch {
      // silent — Firestore listener will reflect the change
    } finally {
      setResetting(false);
    }
  }

  async function handleStop(e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm(`Stop processing "${file.fileName ?? file.fileId}"?\n\nThis will mark the file as stopped. You can reset it later to reprocess.`)) return;
    setStopping(true);
    try {
      await fetch('/api/reset-stuck-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: file.fileId, action: 'stop' }),
      });
      setStopped(true);
    } catch {
      // silent
    } finally {
      setStopping(false);
    }
  }

  async function handleRestart(e: React.MouseEvent) {
    e.stopPropagation();
    setRestarting(true);
    try {
      await fetch('/api/reset-stuck-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: file.fileId, action: 'reset' }),
      });
      setRestarted(true);
      setTimeout(() => setRestarted(false), 3000);
    } catch {
      // silent
    } finally {
      setRestarting(false);
    }
  }

  return (
    <div
      className="rounded-xl border transition-all duration-200"
      style={{
        background:  '#ffffff',
        borderColor: expanded ? colour + '40' : '#e2e8f0',
        boxShadow:   expanded ? `0 0 0 1px ${colour}20` : 'none',
      }}
    >
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-3.5 text-left">
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{
            background: colour,
            boxShadow:  file.status === 'processing' ? `0 0 0 4px ${colour}25` : 'none',
            animation:  file.status === 'processing' ? 'pulse 2s infinite' : 'none',
          }}
        />
        <div className="flex-1 min-w-0">
          <p className="font-inter text-sm font-medium truncate" style={{ color: '#1e293b' }}>
            {file.fileName ?? file.fileId}
          </p>
          <p className="font-inter text-xs mt-0.5 flex items-center gap-1.5" style={{ color: '#94a3b8' }}>
            <span>{formatDate(file.updatedAt ?? file.detectedAt)}</span>
            {file.status === 'processing' && file.currentStage && (
              <>
                <span style={{ color: '#cbd5e1' }}>·</span>
                <span
                  className="font-inter text-xs px-1.5 py-0.5 rounded inline-flex items-center gap-1"
                  style={{
                    background: '#fff7ed',
                    color: '#c2410c',
                    border: '1px solid #fed7aa',
                  }}
                >
                  <span
                    className="w-1 h-1 rounded-full"
                    style={{ background: '#f97316', animation: 'pulse 1.5s infinite' }}
                  />
                  {STAGE_LABELS[file.currentStage] || file.currentStage}
                  {file.currentPage && file.totalPages
                    ? ` · page ${file.currentPage}/${file.totalPages}`
                    : ''}
                </span>
              </>
            )}
          </p>
        </div>
        <StatusBadge status={stopped ? 'error' : file.status} />
        {/* Buttons — only shown for processing files */}
        {file.status === 'processing' && !stopped && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Reset — try again from scratch */}
            <button
              onClick={handleReset}
              disabled={resetting || resetDone || stopping}
              title="Reset — clear stuck status and reprocess"
              className="p-1.5 rounded-lg transition-colors flex items-center gap-1"
              style={{
                background: resetDone ? '#f0fdf4' : '#f1f5f9',
                color: resetDone ? '#22c55e' : '#64748b',
                border: `1px solid ${resetDone ? '#bbf7d0' : '#e2e8f0'}`,
              }}
            >
              {resetting
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : resetDone
                  ? <CheckCircle2 className="w-3 h-3" />
                  : <RotateCcw className="w-3 h-3" />}
              <span className="font-inter text-xs">
                {resetDone ? 'Reset' : 'Reset'}
              </span>
            </button>
            {/* Stop — abandon processing */}
            <button
              onClick={handleStop}
              disabled={stopping || resetting}
              title="Stop — abandon processing this file"
              className="p-1.5 rounded-lg transition-colors flex items-center gap-1"
              style={{
                background: '#fef2f2',
                color: '#ef4444',
                border: '1px solid #fecaca',
              }}
            >
              {stopping
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <Square className="w-3 h-3" />}
              <span className="font-inter text-xs">Stop</span>
            </button>
          </div>
        )}
        {/* Restart — appears for stopped/error files so they're not stuck */}
        {(file.status === 'error' || stopped) && !restarted && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={handleRestart}
              disabled={restarting}
              title="Restart — clear stopped state and reprocess from scratch"
              className="p-1.5 rounded-lg transition-colors flex items-center gap-1"
              style={{
                background: '#f0fdf4',
                color: '#15803d',
                border: '1px solid #bbf7d0',
              }}
            >
              {restarting
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <Play className="w-3 h-3" />}
              <span className="font-inter text-xs">Restart</span>
            </button>
          </div>
        )}
        {restarted && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <span
              className="p-1.5 rounded-lg flex items-center gap-1"
              style={{
                background: '#f0fdf4',
                color: '#15803d',
                border: '1px solid #bbf7d0',
              }}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span className="font-inter text-xs">Restarted</span>
            </span>
          </div>
        )}
        <span style={{ color: '#94a3b8' }}>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {file.status === 'processing' && pagesTotal > 1 && (
        <div className="px-3.5 pb-3">
          <ProgressBar completed={pagesDone} total={pagesTotal} />
        </div>
      )}

      {expanded && (
        <div className="px-3.5 pb-3.5 border-t" style={{ borderColor: '#f1f5f9' }}>
          <div className="pt-3 space-y-3">

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
                  <span className="font-inter text-xs font-medium" style={{ color: '#1e293b' }}>{file.cin7FolderName}</span>
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

            {file.status === 'error' && file.error && (
              <div className="rounded-lg p-3" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
                  <span className="font-inter text-xs font-semibold" style={{ color: '#dc2626' }}>Processing Error</span>
                </div>
                <p className="font-inter text-xs" style={{ color: '#b91c1c' }}>{file.error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <CloudUpload className="w-3.5 h-3.5 flex-shrink-0" style={{ color: file.googleDriveFolderUrl ? '#22c55e' : '#94a3b8' }} />
                <span className="font-inter text-xs" style={{ color: '#64748b' }}>Google Drive</span>
                {file.googleDriveFolderUrl ? (
                  <a href={file.googleDriveFolderUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 font-inter text-xs font-medium ml-auto" style={{ color: '#0ea5e9' }}>
                    Open folder <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="font-inter text-xs ml-auto" style={{ color: '#94a3b8' }}>
                    {file.status === 'complete' ? 'No link' : 'Pending'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" style={{ color: file.oneDriveProcessedFolderUrl ? '#22c55e' : '#94a3b8' }} />
                <span className="font-inter text-xs" style={{ color: '#64748b' }}>OneDrive</span>
                {file.oneDriveProcessedFolderUrl ? (
                  <a href={file.oneDriveProcessedFolderUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 font-inter text-xs font-medium ml-auto" style={{ color: '#0ea5e9' }}>
                    Open folder <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="font-inter text-xs ml-auto" style={{ color: '#94a3b8' }}>
                    {file.status === 'complete' ? 'No link' : 'Pending'}
                  </span>
                )}
              </div>
            </div>

            {file.status === 'complete' && file.totalPages && file.totalPages > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-inter text-xs font-medium" style={{ color: '#64748b' }}>Processed pages:</p>
                  <button
                    onClick={handleReprocessAll}
                    disabled={reprocessAllRunning}
                    className="font-inter text-xs font-medium px-2 py-1 rounded transition-colors"
                    style={{
                      background: reprocessAllRunning ? '#f1f5f9' : '#fef3c7',
                      color: reprocessAllRunning ? '#94a3b8' : '#92400e',
                      border: '1px solid #fde68a',
                      cursor: reprocessAllRunning ? 'wait' : 'pointer',
                    }}
                    title="Reprocess every page of this file"
                  >
                    {reprocessAllRunning ? 'Reprocessing all…' : 'Reprocess all pages'}
                  </button>
                </div>
                <div className="space-y-2">
                  {Array.from({ length: file.totalPages }, (_, i) => i + 1).map(pageNumber => {
                    const pageInfo = file[`page_${pageNumber}`] as PageInfo | undefined;
                    const isReprocessing = reprocessingPage === pageNumber;
                    const fileName = pageInfo?.finalFileName || `Page ${pageNumber}`;
                    const customerName = pageInfo?.customerName || '—';
                    const ref = pageInfo?.ref;
                    const oneDriveUrl = pageInfo?.oneDriveUrl;
                    const googleDriveUrl = pageInfo?.googleDriveUrl;

                    return (
                      <div
                        key={pageNumber}
                        className="rounded-lg p-2.5"
                        style={{
                          background: pageInfo ? '#f0fdf4' : '#f8fafc',
                          border: pageInfo ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                        }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span
                                className="font-inter text-xs font-semibold px-1.5 py-0.5 rounded"
                                style={{ background: '#dcfce7', color: '#15803d' }}
                              >
                                Page {pageNumber}
                              </span>
                              <span className="font-inter text-xs font-medium truncate" style={{ color: '#1e293b' }}>
                                {customerName}
                              </span>
                              {ref && (
                                <span className="font-mono text-xs" style={{ color: '#64748b' }}>
                                  {ref}
                                </span>
                              )}
                            </div>
                            <p className="font-mono text-xs truncate" style={{ color: '#475569' }} title={fileName}>
                              {fileName}
                            </p>
                          </div>
                          <button
                            onClick={(e) => handleReprocessPage(e, pageNumber)}
                            disabled={isReprocessing || !pageInfo?.oneDriveId}
                            className="font-inter text-xs font-medium px-2 py-1 rounded transition-colors flex-shrink-0"
                            style={{
                              background: isReprocessing ? '#f1f5f9' : (!pageInfo?.oneDriveId ? '#f1f5f9' : '#dbeafe'),
                              color: isReprocessing ? '#94a3b8' : (!pageInfo?.oneDriveId ? '#cbd5e1' : '#1e40af'),
                              border: '1px solid #bfdbfe',
                              cursor: isReprocessing || !pageInfo?.oneDriveId ? 'not-allowed' : 'pointer',
                            }}
                            title={!pageInfo?.oneDriveId ? 'Cannot reprocess — no OneDrive ID stored for this page' : 'Reprocess this page'}
                          >
                            {isReprocessing ? 'Reprocessing…' : 'Reprocess'}
                          </button>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          {oneDriveUrl ? (
                            <a
                              href={oneDriveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 font-inter text-xs font-medium"
                              style={{ color: '#0ea5e9' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FolderOpen className="w-3 h-3" /> OneDrive <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ) : (
                            <span className="font-inter text-xs" style={{ color: '#94a3b8' }}>OneDrive: —</span>
                          )}
                          {googleDriveUrl ? (
                            <a
                              href={googleDriveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 font-inter text-xs font-medium"
                              style={{ color: '#0ea5e9' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <CloudUpload className="w-3 h-3" /> Drive <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ) : (
                            <span className="font-inter text-xs" style={{ color: '#94a3b8' }}>Drive: —</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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

// ── Unprocessed File Card — same style as FileCard ────────────────────────────

function UnprocessedCard({ file, triggering, triggered, onTrigger }: {
  file: ScansFile;
  triggering: boolean;
  triggered: boolean;
  onTrigger: () => void;
}) {
  return (
    <div
      className="rounded-xl border transition-all duration-200"
      style={{ background: '#ffffff', borderColor: '#e2e8f0' }}
    >
      <div className="w-full flex items-center gap-3 p-3.5">
        {/* Status dot — indigo for unprocessed */}
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: '#6366f1' }} />
        <div className="flex-1 min-w-0">
          <p
            className="font-inter text-sm font-medium truncate"
            style={{ color: '#1e293b' }}
            title={file.name}
          >
            {file.name}
          </p>
          <p className="font-inter text-xs mt-0.5" style={{ color: '#94a3b8' }}>
            {formatSize(file.sizeBytes)} · {new Date(file.createdAt).toLocaleString('en-GB', {
              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
        {/* Status badge matching the pattern */}
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-inter text-xs font-medium"
          style={{ background: '#eef2ff', color: '#6366f1', border: '1px solid #c7d2fe' }}
        >
          <Clock className="w-2.5 h-2.5" />
          Waiting
        </span>
        {/* Process button */}
        <button
          onClick={onTrigger}
          disabled={triggering || triggered}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-inter text-xs font-medium transition-all flex-shrink-0 ml-1"
          style={{
            background: triggered  ? '#f0fdf4' : triggering ? '#f1f5f9' : '#6366f1',
            color:      triggered  ? '#16a34a'  : triggering ? '#94a3b8'  : '#ffffff',
            border:     triggered  ? '1px solid #bbf7d0' : 'none',
            cursor:     triggered || triggering ? 'default' : 'pointer',
          }}
        >
          {triggering ? <Loader2 className="w-3 h-3 animate-spin" />
            : triggered ? <CheckCircle2 className="w-3 h-3" />
            : <Play className="w-3 h-3" />}
          {triggered ? 'Triggered' : triggering ? 'Sending...' : 'Process'}
        </button>
      </div>
    </div>
  );
}

// ── Unprocessed Files View ────────────────────────────────────────────────────

function UnprocessedFilesView() {
  const [files, setFiles]           = useState<ScansFile[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [triggered, setTriggered]   = useState<Set<string>>(new Set());

  async function fetchFiles() {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/scans-list');
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to list Scans folder');
      // Sort newest first so most recent scans appear at the top
      const sorted = (data.files || []).sort(
        (a: ScansFile, b: ScansFile) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setFiles(sorted);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function triggerProcessing(file: ScansFile) {
    setTriggering(file.id);
    try {
      const res  = await fetch('/api/scans-list', { method: 'POST' });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#94a3b8' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
        <div>
          <p className="font-inter text-sm font-semibold" style={{ color: '#dc2626' }}>Could not load Scans folder</p>
          <p className="font-inter text-xs mt-1" style={{ color: '#b91c1c' }}>{error}</p>
          <button onClick={fetchFiles} className="mt-2 font-inter text-xs font-medium" style={{ color: '#0ea5e9' }}>Try again</button>
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="rounded-xl p-12 text-center" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
        <CheckCircle2 className="w-10 h-10 mx-auto mb-3" style={{ color: '#86efac' }} />
        <p className="font-inter text-sm font-medium" style={{ color: '#94a3b8' }}>Scans folder is clear</p>
        <p className="font-inter text-xs mt-1" style={{ color: '#cbd5e1' }}>No unprocessed PDFs waiting</p>
        <button onClick={fetchFiles} className="mt-3 flex items-center gap-1 mx-auto font-inter text-xs font-medium" style={{ color: '#0ea5e9' }}>
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="font-inter text-xs" style={{ color: '#94a3b8' }}>
          {files.length} PDF{files.length !== 1 ? 's' : ''} waiting in Scans. Router picks these up automatically, or trigger manually.
        </p>
        <button onClick={fetchFiles} className="flex items-center gap-1 font-inter text-xs font-medium" style={{ color: '#64748b' }}>
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>
      <div className="space-y-2">
        {files.map(file => (
          <UnprocessedCard
            key={file.id}
            file={file}
            triggering={triggering === file.id}
            triggered={triggered.has(file.id)}
            onTrigger={() => triggerProcessing(file)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Pipeline Stage Cards ──────────────────────────────────────────────────────

// Maps the currentStage field written by scan-now/file-page to a stage card ID
const STAGE_MAP: Record<string, string> = {
  downloading:  'scan',
  splitting:    'split',
  dispatching:  'make',
  extracting:   'make',
  cin7:         'cin7',
  filing:       'cin7',
  uploading:    'drive',
  non_order:    'drive',
  complete:     'drive',
};

const PIPELINE_STAGES = [
  { id: 'scan',   label: 'OneDrive\nScan'    },
  { id: 'split',  label: 'PDF\nSplit'         },
  { id: 'make',   label: 'Make.com\nExtract'  },
  { id: 'cin7',   label: 'Cin7\nMatch'        },
  { id: 'drive',  label: 'File to\nDrive'     },
];


function PipelineStageCards({ files, processingCount }: {
  files: FileStatus[];
  processingCount: number;
}) {
  // Find the most recently active processing file's current stage
  const activeFile = files.find(f => f.status === 'processing');
  const currentStage = activeFile?.currentStage;
  const activeStageId = currentStage ? STAGE_MAP[currentStage] ?? null : null;
  const activeStageIdx = activeStageId ? PIPELINE_STAGES.findIndex(s => s.id === activeStageId) : -1;

  const isRunning = processingCount > 0;

  return (
    <div className="rounded-xl" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
      <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: '#f1f5f9' }}>
        <div
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{
            background: isRunning ? '#22c55e' : '#cbd5e1',
            boxShadow:  isRunning ? '0 0 0 3px #22c55e20' : 'none',
            animation:  isRunning ? 'pulse 2s infinite' : 'none',
          }}
        />
        <span className="font-sora font-semibold text-sm" style={{ color: '#1e293b' }}>
          Automation Pipeline
        </span>
        <span className="font-inter text-xs ml-1" style={{ color: '#94a3b8' }}>
          {isRunning
            ? `${processingCount} file${processingCount !== 1 ? 's' : ''} processing${activeFile?.fileName ? ` — ${String(activeFile.fileName)}` : ''}`
            : 'Idle'}
        </span>
      </div>

      <div className="p-3 grid grid-cols-2 gap-2 lg:grid-cols-3">
        {PIPELINE_STAGES.map((stage, idx) => {
          const isActive = stage.id === activeStageId && isRunning;
          const isDone   = isRunning && activeStageIdx > idx;

          return (
            <div
              key={stage.id}
              className="rounded-lg p-3 flex flex-col justify-between transition-all duration-500"
              style={{
                background: isActive ? '#fff7ed' : isDone ? '#f0fdf4' : '#f8fafc',
                border:     isActive ? '1px solid #fed7aa' : isDone ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                minHeight: '60px',
              }}
            >
              <div className="flex items-start justify-between gap-1">
                <p
                  className="font-inter text-xs font-medium leading-tight whitespace-pre-line"
                  style={{ color: isActive ? '#c2410c' : isDone ? '#15803d' : '#94a3b8' }}
                >
                  {stage.label}
                </p>
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5 transition-all duration-500"
                  style={{
                    background: isActive ? '#f97316' : isDone ? '#22c55e' : '#e2e8f0',
                    boxShadow:  isActive ? '0 0 0 3px #f9731620' : 'none',
                    animation:  isActive ? 'pulse 1.5s infinite' : 'none',
                  }}
                />
              </div>
              <p
                className="font-inter text-xs mt-1"
                style={{ color: isActive ? '#ea580c' : isDone ? '#16a34a' : '#cbd5e1' }}
              >
                {isActive ? 'Running...' : isDone ? 'Done' : 'Waiting'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Diagnostics View ─────────────────────────────────────────────────────────

interface DiagResult {
  label: string;
  ok: boolean;
  detail: string;
}

interface DiagResponse {
  ok: boolean;
  summary: string;
  results: DiagResult[];
}

function DiagnosticsView() {
  const [data, setData]       = useState<DiagResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [ranAt, setRanAt]     = useState<string | null>(null);

  async function runDiag() {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res  = await fetch('/api/run-diag');
      const json = await res.json();
      setData(json);
      setRanAt(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Run button + last run time */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-inter text-sm font-medium" style={{ color: '#1e293b' }}>
            Connection Diagnostics
          </p>
          <p className="font-inter text-xs mt-0.5" style={{ color: '#94a3b8' }}>
            Tests OneDrive and Cin7 connections on the PDF Router
          </p>
        </div>
        <div className="flex items-center gap-3">
          {ranAt && (
            <span className="font-inter text-xs" style={{ color: '#94a3b8' }}>
              Last run: {ranAt}
            </span>
          )}
          <button
            onClick={runDiag}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-inter text-sm font-medium transition-all"
            style={{
              background: loading ? '#f1f5f9' : '#1e293b',
              color:      loading ? '#94a3b8'  : '#ffffff',
              cursor:     loading ? 'default'  : 'pointer',
            }}
          >
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Wrench className="w-4 h-4" />}
            {loading ? 'Running...' : 'Run Diagnostics'}
          </button>
        </div>
      </div>

      {/* Fetch error */}
      {error && (
        <div className="rounded-xl p-4 flex items-start gap-3 mb-4"
          style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
          <div>
            <p className="font-inter text-sm font-semibold" style={{ color: '#dc2626' }}>
              Could not reach PDF Router
            </p>
            <p className="font-inter text-xs mt-1" style={{ color: '#b91c1c' }}>{error}</p>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-2">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="rounded-xl p-3.5 flex items-center gap-3 animate-pulse"
              style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
              <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ background: '#e2e8f0' }} />
              <div className="flex-1">
                <div className="h-3 rounded" style={{ background: '#e2e8f0', width: `${50 + i * 8}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && data && (
        <div className="space-y-2">
          {/* Summary banner */}
          <div className="rounded-xl p-3.5 flex items-center gap-3 mb-2"
            style={{
              background: data.ok ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${data.ok ? '#bbf7d0' : '#fecaca'}`,
            }}>
            {data.ok
              ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#22c55e' }} />
              : <AlertCircle  className="w-4 h-4 flex-shrink-0" style={{ color: '#ef4444' }} />}
            <p className="font-inter text-sm font-semibold"
              style={{ color: data.ok ? '#15803d' : '#dc2626' }}>
              {data.summary}
            </p>
          </div>

          {/* Individual check rows */}
          {data.results.map((result, i) => (
            <div
              key={i}
              className="rounded-xl border p-3.5"
              style={{
                background:   result.ok ? '#ffffff' : '#fef2f2',
                borderColor:  result.ok ? '#e2e8f0' : '#fecaca',
              }}
            >
              <div className="flex items-start gap-3">
                {result.ok
                  ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#22c55e' }} />
                  : <AlertCircle  className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />}
                <div className="flex-1 min-w-0">
                  <p className="font-inter text-xs font-semibold"
                    style={{ color: result.ok ? '#1e293b' : '#dc2626' }}>
                    {result.label}
                  </p>
                  <p className="font-inter text-xs mt-0.5 break-words"
                    style={{ color: result.ok ? '#64748b' : '#b91c1c' }}>
                    {result.detail}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state — not yet run */}
      {!loading && !data && !error && (
        <div className="rounded-xl p-12 text-center"
          style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <Wrench className="w-10 h-10 mx-auto mb-3" style={{ color: '#cbd5e1' }} />
          <p className="font-inter text-sm font-medium" style={{ color: '#94a3b8' }}>
            No diagnostics run yet
          </p>
          <p className="font-inter text-xs mt-1" style={{ color: '#cbd5e1' }}>
            Click Run Diagnostics to test all connections
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

type FilterType = 'all' | 'processing' | 'complete' | 'error' | 'unprocessed' | 'diagnostics';

export default function PDFRouterStatus() {
  const [files, setFiles]           = useState<FileStatus[]>([]);
  const [errors, setErrors]         = useState<RouterError[]>([]);
  const [_activity, setActivity]     = useState<ActivityEntry[]>([]);
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
        const { initializeApp, getApps }    = await import('firebase/app');
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

        const statusQ = query(collection(db, 'pdfRouterStatus'), orderBy('updatedAt', 'desc'), limit(50));
        const unsubStatus = onSnapshot(statusQ, snap => {
          if (!mounted) return;
          setFiles(snap.docs.map(d => ({ fileId: d.id, ...d.data() } as FileStatus)));
          setConnected(true);
          setLoading(false);
        }, err => {
          console.warn('[PDFRouterStatus] Status listener error:', err.message);
          setConnError(`Connection error: ${err.message}`);
          setLoading(false);
        });

        const errQ = query(collection(db, 'pdfRouterErrors'), orderBy('createdAt', 'desc'), limit(20));
        const unsubErrors = onSnapshot(errQ, snap => {
          if (!mounted) return;
          setErrors(snap.docs.map(d => ({ fileId: d.id, ...d.data() } as RouterError)));
        });

        const actQ = query(collection(db, 'pdfRouterActivity'), orderBy('createdAt', 'desc'), limit(30));
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

  const filtered = files.filter(f => filter === 'all' || f.status === filter);

  const counts = {
    all:        files.length,
    processing: files.filter(f => f.status === 'processing').length,
    complete:   files.filter(f => f.status === 'complete').length,
    error:      files.filter(f => f.status === 'error' || f.cin7Status === 'no_match').length,
  };

  const recentErrors = errors.slice(0, 5);

  const tabs: { id: FilterType; label: string; count?: number }[] = [
    { id: 'all',         label: 'All',         count: counts.all        },
    { id: 'processing',  label: 'Processing',  count: counts.processing  },
    { id: 'complete',    label: 'Complete',    count: counts.complete    },
    { id: 'error',       label: 'Error',       count: counts.error       },
    { id: 'unprocessed', label: 'Unprocessed'                            },
    { id: 'diagnostics', label: 'Diagnostics'                            },
  ];

  return (
    <div className="h-full flex flex-col" style={{ background: '#f8fafc' }}>

      {/* ── Fixed top section — header + stats ── */}
      <div style={{ padding: '24px 24px 0', flexShrink: 0 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-sora font-bold text-2xl" style={{ color: '#1e293b' }}>PDF Router</h1>
              <p className="font-inter text-sm mt-1" style={{ color: '#64748b' }}>Live processing status from the PDF Router</p>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background: connected ? '#22c55e' : connError ? '#ef4444' : '#f59e0b',
                  boxShadow:  connected ? '0 0 0 4px #22c55e25' : 'none',
                  animation:  connected ? 'pulse 2s infinite' : 'none',
                }}
              />
              <span className="font-inter text-xs" style={{ color: '#64748b' }}>
                {connected ? 'Live' : connError ? 'Disconnected' : 'Connecting...'}
              </span>
            </div>
          </div>

          {/* Connection error */}
          {connError && (
            <div className="rounded-xl p-4 mb-5 flex items-start gap-3" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
              <div>
                <p className="font-inter text-sm font-semibold" style={{ color: '#dc2626' }}>Cannot connect to PDF Router Firebase</p>
                <pre className="font-inter text-xs mt-1 whitespace-pre-wrap" style={{ color: '#b91c1c' }}>{connError}</pre>
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Total',      value: counts.all,       colour: '#3b82f6', icon: FileText      },
              { label: 'Processing', value: counts.processing, colour: '#f59e0b', icon: Loader2       },
              { label: 'Complete',   value: counts.complete,   colour: '#22c55e', icon: CheckCheck    },
              { label: 'Errors',     value: counts.error,      colour: '#ef4444', icon: AlertTriangle },
            ].map(({ label, value, colour, icon: Icon }) => (
              <div key={label} className="rounded-xl p-4" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4" style={{ color: colour }} />
                  <span className="font-inter text-xs" style={{ color: '#64748b' }}>{label}</span>
                </div>
                <p className="font-sora font-bold text-2xl" style={{ color: '#1e293b' }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-2 mb-4">
            {tabs.map(tab => {
              const isActive = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-inter text-xs font-medium transition-all"
                  style={{
                    background: isActive ? '#1e293b' : '#ffffff',
                    color:      isActive ? '#ffffff'  : '#64748b',
                    border:     `1px solid ${isActive ? '#1e293b' : '#e2e8f0'}`,
                  }}
                >
                  {tab.id === 'unprocessed' && (
                    <Inbox className="w-3 h-3" style={{ color: isActive ? '#ffffff' : '#6366f1' }} />
                  )}
                  {tab.id === 'diagnostics' && (
                    <Wrench className="w-3 h-3" style={{ color: isActive ? '#ffffff' : '#64748b' }} />
                  )}
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className="px-1.5 py-0.5 rounded-full text-xs"
                      style={{
                        background: isActive ? '#ffffff25' : '#f1f5f9',
                        color:      isActive ? '#ffffff'    : '#64748b',
                      }}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Scrollable content area ── */}
      <div className="flex-1 overflow-hidden" style={{ padding: '0 24px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', height: '100%' }}>
          <div className="grid gap-6 h-full" style={{ gridTemplateColumns: '1fr 340px' }}>

            {/* Left — scrollable file list */}
            <div className="overflow-y-auto">
              {/* Diagnostics tab */}
              {filter === 'diagnostics' && <DiagnosticsView />}

              {/* Unprocessed tab */}
              {filter === 'unprocessed' && <UnprocessedFilesView />}

              {/* All other tabs — file cards */}
              {filter !== 'unprocessed' && filter !== 'diagnostics' && (
                loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#94a3b8' }} />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="rounded-xl p-12 text-center" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
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
                )
              )}
            </div>

            {/* Right — fixed: Pipeline stage cards + Errors */}
            <div className="space-y-4 overflow-y-auto">

              {/* Pipeline stage cards */}
              <PipelineStageCards files={files} processingCount={counts.processing} />

              {/* Recent errors */}
              {recentErrors.length > 0 && (
                <div className="rounded-xl" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                  <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: '#f1f5f9' }}>
                    <AlertCircle className="w-4 h-4" style={{ color: '#ef4444' }} />
                    <span className="font-sora font-semibold text-sm" style={{ color: '#1e293b' }}>Recent Errors</span>
                    <span className="ml-auto px-1.5 py-0.5 rounded-full font-inter text-xs" style={{ background: '#fef2f2', color: '#ef4444' }}>
                      {recentErrors.length}
                    </span>
                  </div>
                  <div className="p-3 space-y-2">
                    {recentErrors.map((err, i) => (
                      <div key={i} className="rounded-lg p-3" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-1.5 py-0.5 rounded text-xs font-mono font-medium" style={{ background: '#fee2e2', color: '#dc2626' }}>
                            {err.type}
                          </span>
                          <span className="font-inter text-xs" style={{ color: '#94a3b8' }}>{formatTime(err.createdAt)}</span>
                        </div>
                        <p className="font-inter text-xs" style={{ color: '#b91c1c' }}>{err.message}</p>
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

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
