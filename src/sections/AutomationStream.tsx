import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { CheckCircle2, XCircle, ExternalLink, Webhook, Brain, Truck, Printer, AlertTriangle, Clock, RefreshCw, type LucideIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface LogEntry {
  time: string;
  event: string;
  status: 'success' | 'failed' | 'warning';
  result: string;
  workflow: WorkflowStep[];
}

interface WorkflowStep {
  icon: LucideIcon;
  label: string;
  status: 'success' | 'error' | 'pending';
  timestamp?: string;
  color: string;
}

const workflowTemplates: Record<string, WorkflowStep[]> = {
  'Cin7 Webhook': [
    { icon: Webhook, label: 'Cin7 Omni Webhook', status: 'success', timestamp: '09:14:02', color: '#3b82f6' },
    { icon: Brain, label: 'Data Validation', status: 'success', timestamp: '09:14:03', color: '#22c55e' },
    { icon: Truck, label: 'Order Creation', status: 'success', timestamp: '09:14:05', color: '#0ea5e9' },
  ],
  'Claude AI Extraction': [
    { icon: Webhook, label: 'PDF Upload', status: 'success', timestamp: '09:14:10', color: '#3b82f6' },
    { icon: Brain, label: 'Claude AI Parse', status: 'success', timestamp: '09:14:11', color: '#8b5cf6' },
    { icon: Printer, label: 'Data Extraction', status: 'success', timestamp: '09:14:13', color: '#0ea5e9' },
  ],
  'Spoke Dispatch': [
    { icon: Webhook, label: 'Route Request', status: 'success', timestamp: '09:14:15', color: '#3b82f6' },
    { icon: Truck, label: 'Driver Assignment', status: 'success', timestamp: '09:14:16', color: '#22c55e' },
    { icon: Printer, label: 'Dispatch Confirm', status: 'success', timestamp: '09:14:18', color: '#0ea5e9' },
  ],
  'Dymo Print': [
    { icon: Webhook, label: 'Print Request', status: 'success', timestamp: '09:14:20', color: '#3b82f6' },
    { icon: Printer, label: 'Dymo Connect', status: 'error', timestamp: '09:14:22', color: '#ef4444' },
    { icon: AlertTriangle, label: 'Retry Queued', status: 'pending', timestamp: '09:14:25', color: '#f59e0b' },
  ],
};

const logEntries: LogEntry[] = [
  { time: '09:14:02', event: 'Cin7 Webhook', status: 'success', result: 'SO-402 created', workflow: workflowTemplates['Cin7 Webhook'] },
  { time: '09:14:11', event: 'Claude AI Extraction', status: 'success', result: '6 fields parsed', workflow: workflowTemplates['Claude AI Extraction'] },
  { time: '09:14:15', event: 'Spoke Dispatch', status: 'success', result: 'Route assigned', workflow: workflowTemplates['Spoke Dispatch'] },
  { time: '09:14:22', event: 'Dymo Print', status: 'failed', result: 'Retry queued', workflow: workflowTemplates['Dymo Print'] },
  { time: '09:15:03', event: 'Cin7 Webhook', status: 'success', result: 'SO-403 created', workflow: workflowTemplates['Cin7 Webhook'] },
  { time: '09:15:18', event: 'Claude AI Extraction', status: 'success', result: '8 fields parsed', workflow: workflowTemplates['Claude AI Extraction'] },
  { time: '09:15:25', event: 'Spoke Dispatch', status: 'success', result: 'Driver notified', workflow: workflowTemplates['Spoke Dispatch'] },
  { time: '09:15:42', event: 'Dymo Print', status: 'success', result: 'Label printed', workflow: workflowTemplates['Dymo Print'] },
  { time: '09:16:05', event: 'Cin7 Webhook', status: 'success', result: 'SO-404 created', workflow: workflowTemplates['Cin7 Webhook'] },
  { time: '09:16:14', event: 'Claude AI Extraction', status: 'success', result: '5 fields parsed', workflow: workflowTemplates['Claude AI Extraction'] },
];

export default function AutomationStream() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<LogEntry | null>(null);
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false);

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

  const handleRowClick = (entry: LogEntry) => {
    setSelectedWorkflow(entry);
    setWorkflowDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4" style={{ color: '#22c55e' }} />;
      case 'failed':
        return <XCircle className="w-4 h-4" style={{ color: '#ef4444' }} />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" style={{ color: '#f59e0b' }} />;
      default:
        return null;
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'success': return '#22c55e';
      case 'failed': return '#ef4444';
      case 'warning': return '#f59e0b';
      default: return '#cbd5e1';
    }
  };

  return (
    <div
      id="logs"
      ref={sectionRef}
      className="relative w-full h-full overflow-hidden"
      style={{ background: '#ffffff' }}
    >
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage: `radial-gradient(circle, #cbd5e1 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative z-10 h-full flex flex-col max-w-5xl mx-auto px-8 py-4">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}
            >
              <Clock className="w-4 h-4" style={{ color: '#0ea5e9' }} />
            </div>
            <div>
              <h2 className="font-sora font-bold text-xl" style={{ color: '#1e293b' }}>
                Automation
              </h2>
              <p className="font-inter text-xs" style={{ color: '#64748b' }}>
                Click any entry to view workflow
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
            <span className="font-mono text-[10px] text-emerald">Live</span>
          </div>
        </div>

        {/* Log List — 2-col grid */}
        <div className="grid grid-cols-2 gap-2 overflow-y-auto content-start flex-1 min-h-0">
          {logEntries.map((entry, index) => (
            <div
              key={index}
              onClick={() => handleRowClick(entry)}
              className="glass-card p-3 flex items-center gap-3 hover:shadow-md transition-all duration-300 cursor-pointer group h-fit"
            >
              {/* Time Badge */}
              <div className="font-mono text-[10px] w-12 flex-shrink-0" style={{ color: '#94a3b8' }}>
                {entry.time}
              </div>

              {/* Status Dot */}
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: getStatusDotColor(entry.status) }}
              />

              {/* Event Name */}
              <div className="flex-1 min-w-0">
                <span
                  className="font-sora font-medium text-xs group-hover:text-orange-500 transition-colors"
                  style={{ color: '#334155' }}
                >
                  {entry.event}
                </span>
              </div>

              {/* Result */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {getStatusIcon(entry.status)}
                <span
                  className="font-mono text-[10px]"
                  style={{
                    color: entry.status === 'failed' ? '#ef4444' :
                           entry.status === 'warning' ? '#f59e0b' :
                           '#94a3b8'
                  }}
                >
                  {entry.result}
                </span>
              </div>

              {/* View Icon */}
              <ExternalLink className="w-3 h-3 flex-shrink-0 text-slate-300 group-hover:text-orange-400 transition-colors" />
            </div>
          ))}
        </div>

        {/* Failed Automations Panel */}
        {(() => {
          const failedEntries = logEntries.filter(e => e.status === 'failed');
          if (failedEntries.length === 0) return null;
          return (
            <div
              className="flex-shrink-0 mt-3 rounded-2xl p-4"
              style={{ background: '#fef2f2', border: '1px solid #fecaca' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4" style={{ color: '#ef4444' }} />
                <h3 className="font-sora font-semibold text-sm" style={{ color: '#dc2626' }}>Failed Automations</h3>
                <span
                  className="ml-auto px-2 py-0.5 rounded-lg font-mono text-[10px]"
                  style={{ background: '#fecaca', color: '#dc2626' }}
                >
                  {failedEntries.length} issue{failedEntries.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {failedEntries.map((entry, idx) => {
                  const errorStep = entry.workflow.find(s => s.status === 'error');
                  const pendingStep = entry.workflow.find(s => s.status === 'pending');
                  return (
                    <div
                      key={idx}
                      onClick={() => handleRowClick(entry)}
                      className="bg-white rounded-xl p-3 hover:shadow-sm transition-all cursor-pointer group"
                      style={{ border: '1px solid #fecaca' }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
                          <span className="font-sora font-semibold text-sm" style={{ color: '#1e293b' }}>
                            {entry.event}
                          </span>
                        </div>
                        <span className="font-mono text-[10px]" style={{ color: '#94a3b8' }}>{entry.time}</span>
                      </div>
                      {errorStep && (
                        <p className="font-inter text-xs mb-1" style={{ color: '#ef4444' }}>
                          Failed at <span className="font-semibold">{errorStep.label}</span> — connection could not be established
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="font-mono text-[10px]" style={{ color: '#94a3b8' }}>
                          Result: {entry.result}{pendingStep ? ` · ${pendingStep.label}` : ''}
                        </p>
                        <button className="flex items-center gap-1 text-[10px] font-sora" style={{ color: '#0ea5e9' }}>
                          <RefreshCw className="w-3 h-3" /> Retry
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Workflow Dialog — Horizontal Make.com Style */}
      <Dialog open={workflowDialogOpen} onOpenChange={setWorkflowDialogOpen}>
        <DialogContent className="max-w-2xl" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <DialogHeader>
            <DialogTitle className="font-sora font-bold text-xl flex items-center gap-3" style={{ color: '#1e293b' }}>
              {selectedWorkflow && getStatusIcon(selectedWorkflow.status)}
              {selectedWorkflow?.event} Workflow
            </DialogTitle>
          </DialogHeader>

          {selectedWorkflow && (
            <div className="mt-2">
              <p className="font-mono text-xs mb-8" style={{ color: '#94a3b8' }}>
                Triggered at {selectedWorkflow.time} • Result: {selectedWorkflow.result}
              </p>

              {/* ── Horizontal Make.com Style Workflow ── */}
              <div className="flex items-start justify-center gap-0 overflow-x-auto pb-4">
                {selectedWorkflow.workflow.map((step, idx) => (
                  <div key={idx} className="flex items-center flex-shrink-0">

                    {/* Module + Label + Status */}
                    <div className="flex flex-col items-center gap-2 w-28">
                      {/* Circle */}
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all"
                        style={{
                          background: '#ffffff',
                          borderColor: step.color,
                          boxShadow: `0 0 16px ${step.color}30, 0 2px 8px rgba(0,0,0,0.08)`,
                        }}
                      >
                        <step.icon className="w-6 h-6" style={{ color: step.color }} />
                      </div>

                      {/* Label */}
                      <span
                        className="font-sora font-medium text-xs text-center leading-tight"
                        style={{ color: '#334155' }}
                      >
                        {step.label}
                      </span>

                      {/* Status */}
                      <div className="flex items-center gap-1">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            background: step.status === 'success' ? '#22c55e' :
                                        step.status === 'error' ? '#ef4444' : '#f59e0b',
                          }}
                        />
                        <span
                          className="font-mono text-[9px] uppercase"
                          style={{
                            color: step.status === 'success' ? '#22c55e' :
                                   step.status === 'error' ? '#ef4444' : '#f59e0b',
                          }}
                        >
                          {step.status}
                        </span>
                      </div>

                      {/* Timestamp */}
                      {step.timestamp && (
                        <span className="font-mono text-[9px]" style={{ color: '#cbd5e1' }}>
                          {step.timestamp}
                        </span>
                      )}
                    </div>

                    {/* Connector arrow */}
                    {idx < selectedWorkflow.workflow.length - 1 && (
                      <div className="flex items-center mb-10 flex-shrink-0">
                        <div
                          className="h-0.5 w-10"
                          style={{
                            background: `linear-gradient(90deg, ${step.color}80, ${selectedWorkflow.workflow[idx + 1].color}80)`,
                          }}
                        />
                        <div
                          className="w-0 h-0 -ml-px"
                          style={{
                            borderTop: '4px solid transparent',
                            borderBottom: '4px solid transparent',
                            borderLeft: `6px solid ${selectedWorkflow.workflow[idx + 1].color}80`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
