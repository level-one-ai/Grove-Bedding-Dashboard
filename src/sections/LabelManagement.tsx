import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Tag, Printer, CheckCircle, Clock, CheckCheck, Edit2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { LabelData } from '../App';

interface Props {
  labels: LabelData[];
  onVerify: (id: string) => void;
  onPrint: (id: string) => void;
  onUpdate: (id: string, updates: Partial<LabelData>) => void;
}

export default function LabelManagement({ labels, onVerify, onPrint, onUpdate }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [selectedLabel, setSelectedLabel] = useState<LabelData | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Partial<LabelData>>({});

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

  // Select first label by default
  useEffect(() => {
    if (labels.length > 0 && !selectedLabel) {
      setSelectedLabel(labels[0]);
    }
  }, [labels]);

  // Keep selectedLabel in sync when labels array changes
  useEffect(() => {
    if (selectedLabel) {
      const updated = labels.find(l => l.id === selectedLabel.id);
      if (updated) setSelectedLabel(updated);
    }
  }, [labels]);

  const pendingCount = labels.filter(l => l.status === 'pending').length;
  const verifiedCount = labels.filter(l => l.status === 'verified').length;
  const printedCount = labels.filter(l => l.status === 'printed').length;

  const openEdit = (label: LabelData) => {
    setEditData({ ...label });
    setEditDialogOpen(true);
  };

  const saveEdit = () => {
    if (selectedLabel && editData) {
      onUpdate(selectedLabel.id, editData);
      setEditDialogOpen(false);
    }
  };

  const statusConfig = {
    pending: {
      label: 'Pending Review',
      icon: Clock,
      bg: '#fffbeb',
      border: '#fde68a',
      color: '#d97706',
      dot: '#f59e0b',
    },
    verified: {
      label: 'Verified',
      icon: CheckCircle,
      bg: '#f0fdf4',
      border: '#bbf7d0',
      color: '#16a34a',
      dot: '#22c55e',
    },
    printed: {
      label: 'Printed',
      icon: CheckCheck,
      bg: '#f8fafc',
      border: '#e2e8f0',
      color: '#64748b',
      dot: '#94a3b8',
    },
  };

  return (
    <div
      id="labels"
      ref={sectionRef}
      className="relative w-full h-full overflow-hidden flex flex-col"
      style={{ background: '#ffffff' }}
    >
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: `radial-gradient(circle, #cbd5e1 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative z-10 flex-1 flex flex-col max-w-7xl w-full mx-auto px-6 py-4 min-h-0">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}
            >
              <Tag className="w-5 h-5" style={{ color: '#0ea5e9' }} />
            </div>
            <div>
              <h2 className="font-sora font-bold text-xl" style={{ color: '#1e293b' }}>Label Management</h2>
              <p className="font-inter text-xs" style={{ color: '#64748b' }}>
                DYMO 5XL shipping labels — review and verify before printing
              </p>
            </div>
          </div>

          {/* Stats chips */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
              <Clock className="w-3.5 h-3.5" style={{ color: '#d97706' }} />
              <span className="font-mono text-xs font-medium" style={{ color: '#d97706' }}>{pendingCount} Pending</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <CheckCircle className="w-3.5 h-3.5" style={{ color: '#16a34a' }} />
              <span className="font-mono text-xs font-medium" style={{ color: '#16a34a' }}>{verifiedCount} Verified</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <Printer className="w-3.5 h-3.5" style={{ color: '#64748b' }} />
              <span className="font-mono text-xs font-medium" style={{ color: '#64748b' }}>{printedCount} Printed</span>
            </div>
          </div>
        </div>

        {/* ── Body: Label Queue | Label Preview ── */}
        <div className="flex-1 grid grid-cols-5 gap-4 min-h-0">

          {/* Left: Label Queue */}
          <div className="col-span-2 glass-card flex flex-col min-h-0 overflow-hidden">
            <div className="px-4 pt-4 pb-3 flex-shrink-0" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <h3 className="font-sora font-semibold text-sm" style={{ color: '#1e293b' }}>Label Queue</h3>
              <p className="font-inter text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                {labels.length} label{labels.length !== 1 ? 's' : ''} total
              </p>
            </div>

            <div className="overflow-y-auto flex-1 min-h-0 p-3 flex flex-col gap-2">
              {labels.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <Tag className="w-6 h-6" style={{ color: '#cbd5e1' }} />
                  </div>
                  <p className="font-inter text-sm" style={{ color: '#94a3b8' }}>No labels generated yet</p>
                  <p className="font-inter text-xs mt-1" style={{ color: '#cbd5e1' }}>Labels appear here when orders are placed</p>
                </div>
              ) : (
                labels.map(label => {
                  const cfg = statusConfig[label.status];
                  const isSelected = selectedLabel?.id === label.id;
                  return (
                    <button
                      key={label.id}
                      onClick={() => setSelectedLabel(label)}
                      className="w-full text-left rounded-xl p-3 transition-all"
                      style={{
                        background: isSelected ? '#f0f9ff' : '#f8fafc',
                        border: isSelected ? '1px solid #bae6fd' : '1px solid #e2e8f0',
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-[10px]" style={{ color: '#0ea5e9' }}>{label.id}</span>
                            <span className="font-mono text-[10px]" style={{ color: '#94a3b8' }}>·</span>
                            <span className="font-mono text-[10px]" style={{ color: '#64748b' }}>{label.orderId}</span>
                          </div>
                          <p className="font-inter text-sm font-medium truncate" style={{ color: '#1e293b' }}>{label.recipientName}</p>
                          <p className="font-inter text-[11px] mt-0.5 truncate" style={{ color: '#94a3b8' }}>
                            {label.town}, {label.postCode}
                          </p>
                          <p className="font-inter text-[10px] mt-1" style={{ color: '#cbd5e1' }}>{label.createdAt}</p>
                        </div>
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium flex-shrink-0"
                          style={{
                            background: cfg.bg,
                            border: `1px solid ${cfg.border}`,
                            color: cfg.color,
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                          {cfg.label}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Label Preview + Actions */}
          <div className="col-span-3 flex flex-col gap-4 min-h-0">

            {selectedLabel ? (
              <>
                {/* Action bar */}
                <div className="glass-card p-3 flex-shrink-0 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: statusConfig[selectedLabel.status].bg }}
                    >
                      {(() => {
                        const Icon = statusConfig[selectedLabel.status].icon;
                        return <Icon className="w-4 h-4" style={{ color: statusConfig[selectedLabel.status].color }} />;
                      })()}
                    </div>
                    <div>
                      <p className="font-sora font-semibold text-sm" style={{ color: '#1e293b' }}>
                        {selectedLabel.id} — {selectedLabel.orderId}
                      </p>
                      <p className="font-inter text-xs" style={{ color: '#64748b' }}>
                        {statusConfig[selectedLabel.status].label} · {selectedLabel.orderType}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(selectedLabel)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-sora font-medium transition-all"
                      style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    {selectedLabel.status === 'pending' && (
                      <button
                        onClick={() => onVerify(selectedLabel.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-sora font-semibold transition-all"
                        style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a' }}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Verify & Approve
                      </button>
                    )}
                    {selectedLabel.status === 'verified' && (
                      <button
                        onClick={() => onPrint(selectedLabel.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-sora font-semibold transition-all"
                        style={{
                          background: '#0ea5e9',
                          color: '#ffffff',
                          boxShadow: '0 2px 10px rgba(14,165,233,0.3)',
                        }}
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print to DYMO 5XL
                      </button>
                    )}
                    {selectedLabel.status === 'printed' && (
                      <div
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-sora font-medium"
                        style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#94a3b8' }}
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Printed
                      </div>
                    )}
                  </div>
                </div>

                {/* DYMO Label Preview */}
                <div className="glass-card p-5 flex-1 flex flex-col min-h-0 overflow-auto">
                  <h3 className="font-sora font-semibold text-sm mb-4 flex-shrink-0" style={{ color: '#1e293b' }}>
                    Label Preview — DYMO 5XL
                  </h3>

                  {/* Label visual — styled as a DYMO 4"×6" shipping label */}
                  <div
                    className="mx-auto w-full max-w-md flex-shrink-0"
                    style={{
                      background: '#ffffff',
                      border: '2px solid #1e293b',
                      borderRadius: '8px',
                      fontFamily: 'IBM Plex Mono, monospace',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                      overflow: 'hidden',
                    }}
                  >
                    {/* FROM section */}
                    <div className="px-5 py-3" style={{ background: '#1e293b' }}>
                      <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: '#94a3b8' }}>From</p>
                      <p className="text-sm font-bold" style={{ color: '#ffffff' }}>Grove Bedding Ltd</p>
                      <p className="text-[11px]" style={{ color: '#cbd5e1' }}>Warehouse & Distribution Centre</p>
                      <p className="text-[11px]" style={{ color: '#cbd5e1' }}>Birmingham, B1 1AA · United Kingdom</p>
                    </div>

                    {/* Divider with order info */}
                    <div className="px-5 py-2 flex items-center justify-between" style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                      <div>
                        <span className="text-[9px] uppercase tracking-widest" style={{ color: '#94a3b8' }}>Order Ref: </span>
                        <span className="text-[11px] font-bold" style={{ color: '#0ea5e9' }}>{selectedLabel.orderId}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-widest" style={{ color: '#94a3b8' }}>Type: </span>
                        <span className="text-[11px] font-medium" style={{ color: '#1e293b' }}>{selectedLabel.orderType}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-widest" style={{ color: '#94a3b8' }}>Date: </span>
                        <span className="text-[11px]" style={{ color: '#64748b' }}>{selectedLabel.createdAt.split(',')[0]}</span>
                      </div>
                    </div>

                    {/* TO section */}
                    <div className="px-5 py-4">
                      <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: '#94a3b8' }}>Deliver To</p>
                      <p className="text-lg font-bold leading-tight" style={{ color: '#1e293b' }}>{selectedLabel.recipientName}</p>
                      <p className="text-sm mt-1" style={{ color: '#334155' }}>{selectedLabel.address1}</p>
                      {selectedLabel.address2 && (
                        <p className="text-sm" style={{ color: '#334155' }}>{selectedLabel.address2}</p>
                      )}
                      <p className="text-sm" style={{ color: '#334155' }}>{selectedLabel.town}</p>
                      <p className="text-sm" style={{ color: '#334155' }}>{selectedLabel.region}</p>
                      <p className="text-base font-bold mt-1" style={{ color: '#1e293b' }}>{selectedLabel.postCode}</p>
                      <p className="text-[11px] mt-2" style={{ color: '#64748b' }}>Tel: {selectedLabel.phone}</p>
                    </div>

                    {/* Items section */}
                    <div className="px-5 py-3" style={{ borderTop: '1px dashed #e2e8f0' }}>
                      <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: '#94a3b8' }}>Items</p>
                      {selectedLabel.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between py-0.5">
                          <span className="text-[11px]" style={{ color: '#334155' }}>{item.item}</span>
                          <span className="text-[11px] font-bold" style={{ color: '#1e293b' }}>×{item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {/* Status bar */}
                    <div
                      className="px-5 py-2 flex items-center justify-between"
                      style={{
                        background: statusConfig[selectedLabel.status].bg,
                        borderTop: `1px solid ${statusConfig[selectedLabel.status].border}`,
                      }}
                    >
                      <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: statusConfig[selectedLabel.status].color }}>
                        {statusConfig[selectedLabel.status].label}
                      </span>
                      <span className="text-[9px]" style={{ color: '#94a3b8' }}>DYMO 5XL · Grove Bedding v2.4.1</span>
                    </div>
                  </div>

                  {/* Warning if pending */}
                  {selectedLabel.status === 'pending' && (
                    <div
                      className="mt-4 flex items-start gap-3 rounded-xl p-3 flex-shrink-0"
                      style={{ background: '#fffbeb', border: '1px solid #fde68a' }}
                    >
                      <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#d97706' }} />
                      <p className="font-inter text-xs leading-relaxed" style={{ color: '#92400e' }}>
                        This label requires verification before printing. Please review the delivery details above and click <strong>Verify & Approve</strong> to authorise printing.
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="glass-card flex-1 flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                  <Tag className="w-7 h-7" style={{ color: '#0ea5e9' }} />
                </div>
                <p className="font-sora font-semibold text-base" style={{ color: '#1e293b' }}>Select a Label</p>
                <p className="font-inter text-sm mt-1" style={{ color: '#94a3b8' }}>Choose a label from the queue to preview it</p>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Edit Label Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <DialogHeader>
            <DialogTitle className="font-sora font-bold text-lg" style={{ color: '#1e293b' }}>
              Edit Label — {selectedLabel?.id}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mt-2 max-h-[60vh] overflow-y-auto pr-1">
            {[
              { key: 'recipientName', label: 'Recipient Name' },
              { key: 'address1', label: 'Address Line 1' },
              { key: 'address2', label: 'Address Line 2' },
              { key: 'town', label: 'Town' },
              { key: 'region', label: 'Region' },
              { key: 'postCode', label: 'Post Code' },
              { key: 'phone', label: 'Phone Number' },
            ].map(field => (
              <div key={field.key}>
                <label className="font-mono text-[10px] uppercase tracking-wide mb-1.5 block" style={{ color: '#64748b' }}>
                  {field.label}
                </label>
                <input
                  type="text"
                  value={(editData as Record<string, string>)[field.key] ?? ''}
                  onChange={e => setEditData(prev => ({ ...prev, [field.key]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-sm"
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    color: '#1e293b',
                    outline: 'none',
                    fontFamily: 'Inter, sans-serif',
                  }}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setEditDialogOpen(false)}
              className="flex-1 py-2.5 rounded-xl font-sora font-semibold text-sm flex items-center justify-center gap-2"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={saveEdit}
              className="flex-1 py-2.5 rounded-xl font-sora font-semibold text-sm flex items-center justify-center gap-2 transition-all"
              style={{
                background: '#0ea5e9',
                color: '#ffffff',
                boxShadow: '0 4px 14px rgba(14,165,233,0.35)',
              }}
            >
              <CheckCircle className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
