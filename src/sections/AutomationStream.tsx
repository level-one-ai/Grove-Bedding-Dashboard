import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { CheckCircle2, XCircle, ExternalLink, Webhook, Brain, Truck, Printer, X, AlertTriangle, Clock, type LucideIcon } from 'lucide-react';
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
    { icon: Webhook, label: 'Cin7 Omni Webhook', status: 'success', timestamp: '09:14:02', color: '#0096ff' },
    { icon: Brain, label: 'Data Validation', status: 'success', timestamp: '09:14:03', color: '#32dc96' },
    { icon: Truck, label: 'Order Creation', status: 'success', timestamp: '09:14:05', color: '#00c8ff' },
  ],
  'Claude AI Extraction': [
    { icon: Webhook, label: 'PDF Upload', status: 'success', timestamp: '09:14:10', color: '#0096ff' },
    { icon: Brain, label: 'Claude AI Parse', status: 'success', timestamp: '09:14:11', color: '#a855f7' },
    { icon: Printer, label: 'Data Extraction', status: 'success', timestamp: '09:14:13', color: '#00c8ff' },
  ],
  'Spoke Dispatch': [
    { icon: Webhook, label: 'Route Request', status: 'success', timestamp: '09:14:15', color: '#0096ff' },
    { icon: Truck, label: 'Driver Assignment', status: 'success', timestamp: '09:14:16', color: '#32dc96' },
    { icon: Printer, label: 'Dispatch Confirm', status: 'success', timestamp: '09:14:18', color: '#00c8ff' },
  ],
  'Dymo Print': [
    { icon: Webhook, label: 'Print Request', status: 'success', timestamp: '09:14:20', color: '#0096ff' },
    { icon: Printer, label: 'Dymo Connect', status: 'error', timestamp: '09:14:22', color: '#ff5096' },
    { icon: AlertTriangle, label: 'Retry Queued', status: 'pending', timestamp: '09:14:25', color: '#ffd700' },
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

interface Notification {
  id: number;
  message: string;
  type: 'error' | 'warning' | 'success';
}

export default function AutomationStream() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<LogEntry | null>(null);
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        sectionRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      );
    }, sectionRef);

    // Check for failed automations and show notifications
    const failedEntries = logEntries.filter(entry => entry.status === 'failed');
    if (failedEntries.length > 0) {
      const newNotifications = failedEntries.map((entry, idx) => ({
        id: Date.now() + idx,
        message: `${entry.event} failed: ${entry.result}`,
        type: 'error' as const,
      }));
      setNotifications(newNotifications);
    }

    return () => ctx.revert();
  }, []);

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleRowClick = (entry: LogEntry) => {
    setSelectedWorkflow(entry);
    setWorkflowDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-magenta" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default:
        return null;
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-emerald';
      case 'failed':
        return 'bg-magenta';
      case 'warning':
        return 'bg-yellow-400';
      default:
        return 'bg-silver/30';
    }
  };

  return (
    <div
      id="logs"
      ref={sectionRef}
      className="relative w-full h-full overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #0a1628 0%, #0d1e36 100%)',
      }}
    >
      {/* Notifications */}
      <div className="fixed top-24 right-6 z-[200] space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="glass-card border-magenta/30 p-4 flex items-start gap-3 max-w-sm animate-in slide-in-from-right"
            style={{ animation: 'slideIn 0.3s ease-out' }}
          >
            <AlertTriangle className="w-5 h-5 text-magenta flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-sora font-semibold text-sm text-magenta">Automation Failed</p>
              <p className="font-inter text-xs text-silver/60 mt-1">{notification.message}</p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="text-silver/40 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Background */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 150, 255, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 150, 255, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 h-full flex flex-col max-w-5xl mx-auto px-8 py-4">
        {/* Header */}
        <div className="logs-header mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue/10 border border-blue/30 flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue" />
            </div>
            <div>
              <h2 className="font-sora font-bold text-xl text-white tracking-tight-custom">
                Automation
              </h2>
              <p className="font-inter text-xs text-silver/60">
                Click any entry to view workflow
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
            <span className="font-mono text-[10px] text-emerald">Live</span>
          </div>
        </div>

        {/* Log List - Compact 2-col grid filling remaining height */}
        <div className="grid grid-cols-2 gap-2 overflow-y-auto flex-1 content-start">
          {logEntries.map((entry, index) => (
            <div
              key={index}
              onClick={() => handleRowClick(entry)}
              className="log-row glass-card p-3 flex items-center gap-3 hover:border-blue/30 transition-all duration-300 cursor-pointer group"
            >
              {/* Time Badge */}
              <div className="font-mono text-[10px] text-silver/50 w-12 flex-shrink-0">
                {entry.time}
              </div>

              {/* Status Dot */}
              <div className={`w-1.5 h-1.5 rounded-full ${getStatusDot(entry.status)} flex-shrink-0`} />

              {/* Event Name */}
              <div className="flex-1 min-w-0">
                <span className="font-sora font-medium text-xs text-white group-hover:text-blue transition-colors">
                  {entry.event}
                </span>
              </div>

              {/* Result */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {getStatusIcon(entry.status)}
                <span className={`font-mono text-[10px] ${
                  entry.status === 'failed' ? 'text-magenta' : 
                  entry.status === 'warning' ? 'text-yellow-400' : 
                  'text-silver/60'
                }`}>
                  {entry.result}
                </span>
              </div>

              {/* View Icon */}
              <ExternalLink className="w-3 h-3 text-silver/30 group-hover:text-blue transition-colors" />
            </div>
          ))}
        </div>
      </div>

      {/* Workflow Dialog - Matching Main Page Style */}
      <Dialog open={workflowDialogOpen} onOpenChange={setWorkflowDialogOpen}>
        <DialogContent className="glass-card border-blue/20 max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-sora font-bold text-xl text-white flex items-center gap-3">
              {selectedWorkflow && getStatusIcon(selectedWorkflow.status)}
              {selectedWorkflow?.event} Workflow
            </DialogTitle>
          </DialogHeader>
          
          {selectedWorkflow && (
            <div className="mt-4">
              <p className="font-mono text-xs text-silver/50 mb-6">
                Triggered at {selectedWorkflow.time} • Result: {selectedWorkflow.result}
              </p>
              
              {/* Make.com Style Workflow - Matching Main Page */}
              <div className="relative">
                {/* Connection Line */}
                <div 
                  className="absolute left-6 top-8 bottom-8 w-0.5"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(0, 150, 255, 0.5), rgba(0, 200, 255, 0.3), rgba(50, 220, 150, 0.2))',
                  }}
                />
                
                <div className="space-y-4">
                  {selectedWorkflow.workflow.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-4 relative">
                      {/* Step Circle - Matching main page workflow-module style */}
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center border-2 z-10 transition-all"
                        style={{
                          background: 'rgba(20, 35, 60, 0.8)',
                          borderColor: step.color,
                          boxShadow: `0 0 20px ${step.color}60`,
                        }}
                      >
                        <step.icon className="w-5 h-5" style={{ color: step.color }} />
                      </div>
                      
                      {/* Step Info */}
                      <div className="flex-1 glass-card p-3 border-blue/10">
                        <div className="flex items-center justify-between">
                          <span className="font-sora font-medium text-sm text-white">
                            {step.label}
                          </span>
                          <span className="font-mono text-[10px] text-silver/50">
                            {step.timestamp}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span 
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ 
                              background: step.status === 'success' ? '#32dc96' : 
                                         step.status === 'error' ? '#ff5096' : '#ffd700',
                              boxShadow: `0 0 6px ${step.status === 'success' ? '#32dc96' : 
                                         step.status === 'error' ? '#ff5096' : '#ffd700'}`,
                            }}
                          />
                          <span 
                            className="font-mono text-[10px] uppercase"
                            style={{
                              color: step.status === 'success' ? '#32dc96' : 
                                     step.status === 'error' ? '#ff5096' : '#ffd700',
                            }}
                          >
                            {step.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
