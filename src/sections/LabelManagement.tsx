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
                    Label Preview — DYMO 5XL 104×159mm
                  </h3>

                  {/* Faithful recreation of the Grove Bedding DYMO label */}
                  <div
                    className="mx-auto flex-shrink-0"
                    style={{
                      width: '420px',
                      height: '280px',
                      background: '#ffffff',
                      border: '2px solid #222',
                      borderRadius: '4px',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
                      position: 'relative',
                      fontFamily: 'Arial, sans-serif',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Grove logo — top left */}
                    <img
                      src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAAA1CAYAAAAEVKRZAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAABFPSURBVHhe7dwDkCRJGwbgs23btm3btm3btuMUZ9u2bdu2678nt7653Lqe3undmd25P+qNyOjpzKzMrKqPb2ZPf3/99deyf5dj6lKXuvy7UJAziho1ajQEBTmm/LtGjRoV1ApSo0YT1ApSo0YT1ApSo0YT1ApSo0YT1ApSo0YTdLmCfPTRR8Xdd99dnH322cWRRx5ZHHrooenTd/Xaa9TorugSBXnppZeKfffdt5hqqqmK/vrrr5dFP/1dV6NGd0KnKshjjz1WLLPMMm2CP/300xe77757ceWVVxbPPvts8e677xYffvhh+nzuuedSvXb94hrXP/roo+WINWr0W3SKgvzwww/FVlttlQR84IEHLnbdddfilVdeKVs7Bv1d53rjGM+4NWr0S/Sxgrz44ovFZJNNloR68803Lz755JOypffgeuMYz7gvvPBC2VKjRt9HHynIww8/XAw55JDFUEMNVdx4441lbefgpptuSmMPMcQQxYMPPljW1qjRd9HbCvL8888n4R1jjDGKV199taztXBh3zDHHLAYffPCUs9So0bfRWwryzTffFOONN14x7LDDFm+88UZZ2zV488030zzmM2+N7gle/o477kiRREfYyO+++6645ZZbirvuuqu44YYbii+++KJs6V7oLQVZe+21U45w7733ljVdC/OYb5111ilrWsPXX39dnH/++cV6661XzDXXXMUcc8xRLLXUUsVOO+1UnHvuuf83ezHHHXdcseWWW6b72nrrrYv1118/3bPPHXbYobjggguKjz/+uOzduTj66KOLoYceOr2nbbfdtqxtH5999lmbHCkUJcfLL79cnHHGGcX9999f1vQbtKwgDz30ULqh7bffvqzpOzCfeVvNRwjFOOOM0/YiFllkkWKllVYqRh999La6Qw45pOz938YjjzxSjDXWWOmexh9//GK33XYr9txzz/TsZp555lQ/0kgjFRdeeGF5Rediv/32S3NQ0I5ihhlmSNdUja0NZfWLL754WdNv0LKCzDvvvMlS9G0K9vvvv0/zmr+jOO2009JDViaeeOKeqOeff/65mH/++VPbQQcdVNb+90Eh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"
                      alt="Grove Bedding"
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '10px',
                        width: '110px',
                        height: '30px',
                        objectFit: 'contain',
                        objectPosition: 'left center',
                      }}
                    />

                    {/* Parcel count — top right */}
                    <div style={{
                      position: 'absolute',
                      right: '12px',
                      top: '4px',
                      fontSize: '22px',
                      fontWeight: 'bold',
                      fontFamily: 'Calibri, Arial, sans-serif',
                      color: '#000',
                      textAlign: 'right',
                    }}>1/1</div>

                    {/* Customer name */}
                    <div style={{
                      position: 'absolute',
                      left: '12px',
                      top: '44px',
                      right: '12px',
                      fontSize: '16px',
                      fontWeight: 'normal',
                      fontFamily: 'Arial, sans-serif',
                      color: '#000',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>{selectedLabel.recipientName}</div>

                    {/* Horizontal rule */}
                    <div style={{ position: 'absolute', left: '12px', right: '12px', top: '68px', height: '1px', background: '#ccc' }} />

                    {/* ORDER REF label */}
                    <div style={{
                      position: 'absolute',
                      left: '12px',
                      top: '74px',
                      fontSize: '8px',
                      fontWeight: 'bold',
                      fontFamily: 'Arial, sans-serif',
                      color: '#000',
                      letterSpacing: '0.5px',
                    }}>ORDER REF</div>

                    {/* DELIVERY DATE label */}
                    <div style={{
                      position: 'absolute',
                      left: '228px',
                      top: '74px',
                      fontSize: '8px',
                      fontWeight: 'bold',
                      fontFamily: 'Arial, sans-serif',
                      color: '#000',
                      letterSpacing: '0.5px',
                    }}>DELIVERY DATE</div>

                    {/* Order ref value */}
                    <div style={{
                      position: 'absolute',
                      left: '12px',
                      top: '86px',
                      width: '210px',
                      fontSize: '17px',
                      fontWeight: 'bold',
                      fontFamily: 'Calibri, Arial, sans-serif',
                      color: '#000',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>{selectedLabel.orderId}</div>

                    {/* Delivery date value */}
                    <div style={{
                      position: 'absolute',
                      left: '228px',
                      top: '86px',
                      fontSize: '12px',
                      fontFamily: 'Calibri, Arial, sans-serif',
                      color: '#000',
                    }}>{selectedLabel.createdAt.split(',')[0]}</div>

                    {/* Product name — main large text */}
                    <div style={{
                      position: 'absolute',
                      left: '12px',
                      right: '12px',
                      top: '112px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      fontFamily: 'Arial, sans-serif',
                      color: '#000',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>{selectedLabel.items[0]?.item ?? ''}</div>

                    {/* Product size / extra lines */}
                    {selectedLabel.items.slice(1).map((item, i) => (
                      <div key={i} style={{
                        position: 'absolute',
                        left: '12px',
                        right: '12px',
                        top: `${133 + i * 16}px`,
                        fontSize: '10px',
                        fontFamily: 'Arial, sans-serif',
                        color: '#000',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>{item.item}</div>
                    ))}

                    {/* Horizontal rule before address */}
                    <div style={{ position: 'absolute', left: '12px', right: '12px', top: '178px', height: '1px', background: '#ccc' }} />

                    {/* DELIVERY ADDRESS label */}
                    <div style={{
                      position: 'absolute',
                      left: '12px',
                      top: '183px',
                      fontSize: '8px',
                      fontWeight: 'bold',
                      fontFamily: 'Arial, sans-serif',
                      color: '#000',
                      letterSpacing: '0.5px',
                    }}>DELIVERY ADDRESS</div>

                    {/* Full address */}
                    <div style={{
                      position: 'absolute',
                      left: '12px',
                      right: '80px',
                      top: '196px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      fontFamily: 'Arial, sans-serif',
                      color: '#000',
                      lineHeight: '1.3',
                      overflow: 'hidden',
                      maxHeight: '42px',
                    }}>
                      {[selectedLabel.address1, selectedLabel.address2, selectedLabel.town, selectedLabel.region, selectedLabel.postCode].filter(Boolean).join(', ')}
                    </div>

                    {/* Website — bottom right */}
                    <div style={{
                      position: 'absolute',
                      right: '12px',
                      bottom: '8px',
                      fontSize: '8px',
                      fontWeight: 'bold',
                      fontFamily: 'Arial, sans-serif',
                      color: '#000',
                      textAlign: 'right',
                    }}>www.grovebedding.com</div>
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
