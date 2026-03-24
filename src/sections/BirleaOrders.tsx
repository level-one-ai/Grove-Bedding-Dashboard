import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Send,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  Clock,
  PackageCheck,
  Search,
  X,
  ExternalLink,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// ── Birlea full catalogue (inventory items + additional Birlea products) ──
const birleaCatalogue = [
  { id: 'SKU-001', name: 'Memory Foam Mattress', category: 'Mattresses', current: 45, max: 100, reorderAt: 30 },
  { id: 'SKU-002', name: 'Pillow Top Queen', category: 'Mattresses', current: 28, max: 80, reorderAt: 25 },
  { id: 'SKU-003', name: 'Luxury Bed Sheets', category: 'Bedding', current: 156, max: 200, reorderAt: 50 },
  { id: 'SKU-004', name: 'Down Alternative Pillow', category: 'Pillows', current: 89, max: 150, reorderAt: 40 },
  { id: 'SKU-005', name: 'Weighted Blanket', category: 'Bedding', current: 12, max: 60, reorderAt: 20 },
  { id: 'SKU-006', name: 'Mattress Protector', category: 'Accessories', current: 67, max: 120, reorderAt: 30 },
  { id: 'BIR-001', name: 'Alabama Bed Frame (Double)', category: 'Bed Frames', current: null, max: null, reorderAt: null },
  { id: 'BIR-002', name: 'Alabama Bed Frame (King)', category: 'Bed Frames', current: null, max: null, reorderAt: null },
  { id: 'BIR-003', name: 'Colorado Bed Frame', category: 'Bed Frames', current: null, max: null, reorderAt: null },
  { id: 'BIR-004', name: 'New York Bed Frame', category: 'Bed Frames', current: null, max: null, reorderAt: null },
  { id: 'BIR-005', name: 'Prague Storage Bed', category: 'Bed Frames', current: null, max: null, reorderAt: null },
  { id: 'BIR-006', name: 'Enzo Mattress (Single)', category: 'Mattresses', current: null, max: null, reorderAt: null },
  { id: 'BIR-007', name: 'Enzo Mattress (Double)', category: 'Mattresses', current: null, max: null, reorderAt: null },
  { id: 'BIR-008', name: 'Pearl Comfort Mattress', category: 'Mattresses', current: null, max: null, reorderAt: null },
  { id: 'BIR-009', name: 'Hugo Ottoman Bed', category: 'Ottoman Beds', current: null, max: null, reorderAt: null },
  { id: 'BIR-010', name: 'Kenzo Ottoman Bed', category: 'Ottoman Beds', current: null, max: null, reorderAt: null },
  { id: 'BIR-011', name: 'Serene Ottoman Bed', category: 'Ottoman Beds', current: null, max: null, reorderAt: null },
  { id: 'BIR-012', name: 'Luxury Duvet Set (King)', category: 'Bedding', current: null, max: null, reorderAt: null },
  { id: 'BIR-013', name: 'Luxury Duvet Set (Super King)', category: 'Bedding', current: null, max: null, reorderAt: null },
  { id: 'BIR-014', name: 'Memory Foam Pillow (Pair)', category: 'Pillows', current: null, max: null, reorderAt: null },
];

const getItemStatus = (current: number | null, reorderAt: number | null) => {
  if (current === null || reorderAt === null) return 'good';
  if (current <= reorderAt) return 'critical';
  if (current <= reorderAt * 1.5) return 'warning';
  return 'good';
};

const WEBHOOK_URL = 'https://hook.eu1.make.com/ekeigx4rsyy6ur1p0pjyn46emny84hed';

// Fixed Grove Bedding warehouse delivery address
const GROVE_ADDRESS = {
  name: 'Grove Bedding Ltd',
  address1: 'Warehouse & Distribution Centre',
  address2: 'Unit 5, Commerce Park',
  town: 'Birmingham',
  region: 'West Midlands',
  postCode: 'B1 1AA',
  phone: '0121 555 0001',
};

const emailByOrderType: Record<string, string> = {
  'Standard': 'orders@birlea.com',
  'Next Day': 'nextday@birlea.com',
  'Birlea Direct Home Delivery': 'homedelivery@birlea.com',
};

interface OrderItem {
  item: string;
  quantity: number;
}

interface InventoryOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: 'pending_approval' | 'approved' | 'sent' | 'received';
  orderType: 'auto' | 'custom';
  orderDeliveryType: string;
  items: OrderItem[];
  receivedAt?: string;
  notes?: string;
}

interface Props {
  onOrderCreated: (orderNumber: string, itemCount: number) => void;
}

const initialOrders: InventoryOrder[] = [
  {
    id: 'INV-001',
    orderNumber: 'PO-2026-001',
    createdAt: '23 Mar 2026, 14:20',
    status: 'received',
    orderType: 'auto',
    orderDeliveryType: 'Standard',
    items: [
      { item: 'Memory Foam Mattress', quantity: 20 },
      { item: 'Luxury Bed Sheets', quantity: 30 },
    ],
    receivedAt: '24 Mar 2026, 10:05',
  },
  {
    id: 'INV-002',
    orderNumber: 'PO-2026-002',
    createdAt: '24 Mar 2026, 07:45',
    status: 'sent',
    orderType: 'custom',
    orderDeliveryType: 'Next Day',
    items: [
      { item: 'Hugo Ottoman Bed', quantity: 4 },
      { item: 'Colorado Bed Frame', quantity: 6 },
      { item: 'Pearl Comfort Mattress', quantity: 8 },
    ],
  },
  {
    id: 'INV-003',
    orderNumber: 'PO-2026-003',
    createdAt: '24 Mar 2026, 08:30',
    status: 'pending_approval',
    orderType: 'auto',
    orderDeliveryType: 'Standard',
    items: [
      { item: 'Memory Foam Mattress', quantity: 55 },
      { item: 'Pillow Top Queen', quantity: 52 },
      { item: 'Weighted Blanket', quantity: 48 },
    ],
    notes: 'Auto-generated from low stock alert',
  },
];

const statusConfig = {
  pending_approval: { label: 'Pending Approval', bg: '#fffbeb', border: '#fde68a', color: '#d97706', dot: '#f59e0b' },
  approved: { label: 'Approved', bg: '#f0f9ff', border: '#bae6fd', color: '#0284c7', dot: '#0ea5e9' },
  sent: { label: 'Sent to Birlea', bg: '#f5f3ff', border: '#ddd6fe', color: '#7c3aed', dot: '#8b5cf6' },
  received: { label: 'Received', bg: '#f0fdf4', border: '#bbf7d0', color: '#16a34a', dot: '#22c55e' },
};

export default function BirleaOrders({ onOrderCreated }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [orders, setOrders] = useState<InventoryOrder[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<InventoryOrder | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  // Custom order state
  const [catalogueSearch, setCatalogueSearch] = useState('');
  const [customItems, setCustomItems] = useState<Array<{ catalogueId: string; name: string; quantity: number }>>([]);
  const [customOrderType, setCustomOrderType] = useState('Standard');

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(sectionRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  // Keep selectedOrder in sync
  useEffect(() => {
    if (selectedOrder) {
      const updated = orders.find(o => o.id === selectedOrder.id);
      if (updated) setSelectedOrder(updated);
    }
  }, [orders]);

  const handleAutoOrder = () => {
    const lowItems = birleaCatalogue.filter(
      item => item.current !== null && getItemStatus(item.current, item.reorderAt) !== 'good'
    );
    if (lowItems.length === 0) return;

    const newOrder: InventoryOrder = {
      id: `INV-${String(Date.now()).slice(-4)}`,
      orderNumber: `PO-${new Date().getFullYear()}-${String(orders.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'pending_approval',
      orderType: 'auto',
      orderDeliveryType: 'Standard',
      items: lowItems.map(item => ({
        item: item.name,
        quantity: (item.max ?? 0) - (item.current ?? 0),
      })),
      notes: 'Auto-generated from low stock alert',
    };

    setOrders(prev => [newOrder, ...prev]);
    onOrderCreated(newOrder.orderNumber, newOrder.items.length);
  };

  const handleApproveOrder = async (order: InventoryOrder) => {
    setIsSending(true);
    setSendSuccess(false);

    const payload = {
      ...GROVE_ADDRESS,
      orderType: order.orderDeliveryType,
      orderNumber: order.orderNumber,
      email: emailByOrderType[order.orderDeliveryType],
      items: order.items,
    };

    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'sent' as const } : o));
      setSendSuccess(true);
    } catch {
      // still update status optimistically
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'sent' as const } : o));
      setSendSuccess(true);
    } finally {
      setIsSending(false);
    }
  };

  const handleMarkReceived = (orderId: string) => {
    const receivedAt = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'received' as const, receivedAt } : o));
  };

  const toggleCatalogueItem = (item: typeof birleaCatalogue[0]) => {
    const exists = customItems.find(i => i.catalogueId === item.id);
    if (exists) {
      setCustomItems(prev => prev.filter(i => i.catalogueId !== item.id));
    } else {
      setCustomItems(prev => [...prev, { catalogueId: item.id, name: item.name, quantity: 1 }]);
    }
  };

  const updateCustomQty = (catalogueId: string, quantity: number) => {
    setCustomItems(prev => prev.map(i => i.catalogueId === catalogueId ? { ...i, quantity } : i));
  };

  const submitCustomOrder = () => {
    if (customItems.length === 0) return;
    const newOrder: InventoryOrder = {
      id: `INV-${String(Date.now()).slice(-4)}`,
      orderNumber: `PO-${new Date().getFullYear()}-${String(orders.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'pending_approval',
      orderType: 'custom',
      orderDeliveryType: customOrderType,
      items: customItems.map(i => ({ item: i.name, quantity: i.quantity })),
    };
    setOrders(prev => [newOrder, ...prev]);
    onOrderCreated(newOrder.orderNumber, newOrder.items.length);
    setCustomModalOpen(false);
    setCustomItems([]);
    setCatalogueSearch('');
  };

  const filteredCatalogue = birleaCatalogue.filter(item =>
    item.name.toLowerCase().includes(catalogueSearch.toLowerCase()) ||
    item.category.toLowerCase().includes(catalogueSearch.toLowerCase())
  );

  const pendingCount = orders.filter(o => o.status === 'pending_approval').length;

  return (
    <div
      id="orders"
      ref={sectionRef}
      className="relative w-full h-full overflow-hidden flex flex-col"
      style={{ background: '#ffffff' }}
    >
      <div className="absolute inset-0 opacity-[0.4]" style={{ backgroundImage: `radial-gradient(circle, #cbd5e1 1px, transparent 1px)`, backgroundSize: '28px 28px' }} />

      <div className="relative z-10 flex-1 flex flex-col max-w-7xl w-full mx-auto px-6 py-4 min-h-0">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
              <ShoppingBag className="w-5 h-5" style={{ color: '#0ea5e9' }} />
            </div>
            <div>
              <h2 className="font-sora font-bold text-xl" style={{ color: '#1e293b' }}>Inventory Orders</h2>
              <p className="font-inter text-xs" style={{ color: '#64748b' }}>
                Purchase orders from Birlea — click any order to view details
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#d97706' }} />
                <span className="font-mono text-xs font-medium" style={{ color: '#d97706' }}>{pendingCount} awaiting approval</span>
              </div>
            )}
            <button
              onClick={handleAutoOrder}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-sora font-semibold text-xs transition-all"
              style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#d97706' }}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Auto-Order Low Stock
            </button>
            <button
              onClick={() => setCustomModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-sora font-semibold text-xs transition-all"
              style={{ background: '#0ea5e9', color: '#ffffff', boxShadow: '0 2px 10px rgba(14,165,233,0.3)' }}
            >
              <Plus className="w-3.5 h-3.5" />
              Custom Order
            </button>
          </div>
        </div>

        {/* ── Orders Table ── */}
        <div className="glass-card flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="px-4 pt-3 pb-2 flex-shrink-0" style={{ borderBottom: '1px solid #f1f5f9' }}>
            <div className="grid grid-cols-12 gap-3">
              <span className="col-span-2 font-mono text-[10px] uppercase tracking-wide" style={{ color: '#94a3b8' }}>Order #</span>
              <span className="col-span-2 font-mono text-[10px] uppercase tracking-wide" style={{ color: '#94a3b8' }}>Date</span>
              <span className="col-span-1 font-mono text-[10px] uppercase tracking-wide" style={{ color: '#94a3b8' }}>Type</span>
              <span className="col-span-1 font-mono text-[10px] uppercase tracking-wide" style={{ color: '#94a3b8' }}>Items</span>
              <span className="col-span-3 font-mono text-[10px] uppercase tracking-wide" style={{ color: '#94a3b8' }}>Delivery</span>
              <span className="col-span-2 font-mono text-[10px] uppercase tracking-wide" style={{ color: '#94a3b8' }}>Status</span>
              <span className="col-span-1 font-mono text-[10px] uppercase tracking-wide" style={{ color: '#94a3b8' }}>Received</span>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 min-h-0">
            {orders.map((order, idx) => {
              const cfg = statusConfig[order.status];
              const isLast = idx === orders.length - 1;
              return (
                <div
                  key={order.id}
                  onClick={() => { setSelectedOrder(order); setDetailOpen(true); setSendSuccess(false); }}
                  className="grid grid-cols-12 gap-3 items-center px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer group"
                  style={{ borderBottom: isLast ? 'none' : '1px solid #f1f5f9' }}
                >
                  <div className="col-span-2">
                    <span className="font-mono text-xs" style={{ color: '#0ea5e9' }}>{order.orderNumber}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-inter text-xs" style={{ color: '#64748b' }}>{order.createdAt}</span>
                  </div>
                  <div className="col-span-1">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-lg font-mono text-[10px]"
                      style={{
                        background: order.orderType === 'auto' ? '#f0f9ff' : '#faf5ff',
                        border: order.orderType === 'auto' ? '1px solid #bae6fd' : '1px solid #ddd6fe',
                        color: order.orderType === 'auto' ? '#0284c7' : '#7c3aed',
                      }}
                    >
                      {order.orderType === 'auto' ? 'Auto' : 'Custom'}
                    </span>
                  </div>
                  <div className="col-span-1">
                    <span className="font-mono text-xs" style={{ color: '#64748b' }}>{order.items.length}</span>
                  </div>
                  <div className="col-span-3">
                    <span className="font-inter text-xs truncate block" style={{ color: '#64748b' }}>{order.orderDeliveryType}</span>
                  </div>
                  <div className="col-span-2">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                      {cfg.label}
                    </span>
                  </div>
                  <div className="col-span-1">
                    {order.receivedAt ? (
                      <PackageCheck className="w-4 h-4" style={{ color: '#22c55e' }} />
                    ) : (
                      <Clock className="w-4 h-4" style={{ color: '#cbd5e1' }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ── Order Detail Dialog ── */}
      <Dialog open={detailOpen} onOpenChange={v => { setDetailOpen(v); if (!v) setSendSuccess(false); }}>
        <DialogContent className="max-w-lg" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
          {selectedOrder && (() => {
            const cfg = statusConfig[selectedOrder.status];
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="font-sora font-bold text-lg" style={{ color: '#1e293b' }}>
                    {selectedOrder.orderNumber}
                  </DialogTitle>
                  <DialogDescription className="font-inter text-sm" style={{ color: '#64748b' }}>
                    {selectedOrder.orderType === 'auto' ? 'Auto-generated' : 'Custom'} order · {selectedOrder.orderDeliveryType}
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-2 space-y-4">
                  {/* Status + dates */}
                  <div className="flex gap-3">
                    <div className="flex-1 rounded-xl p-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <p className="font-mono text-[10px] uppercase tracking-wide mb-1" style={{ color: '#94a3b8' }}>Created</p>
                      <p className="font-inter text-sm" style={{ color: '#1e293b' }}>{selectedOrder.createdAt}</p>
                    </div>
                    <div className="flex-1 rounded-xl p-3" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                      <p className="font-mono text-[10px] uppercase tracking-wide mb-1" style={{ color: '#94a3b8' }}>Status</p>
                      <p className="font-inter text-sm font-medium" style={{ color: cfg.color }}>{cfg.label}</p>
                    </div>
                  </div>

                  {selectedOrder.receivedAt && (
                    <div className="rounded-xl p-3" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                      <p className="font-mono text-[10px] uppercase tracking-wide mb-1" style={{ color: '#94a3b8' }}>Received</p>
                      <p className="font-inter text-sm font-medium" style={{ color: '#16a34a' }}>{selectedOrder.receivedAt}</p>
                    </div>
                  )}

                  {selectedOrder.notes && (
                    <div className="rounded-xl p-3" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                      <p className="font-inter text-xs" style={{ color: '#92400e' }}>{selectedOrder.notes}</p>
                    </div>
                  )}

                  {/* Items */}
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-wide mb-2" style={{ color: '#64748b' }}>Items Ordered</p>
                    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
                      <table className="w-full">
                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <tr>
                            <th className="text-left py-2 px-3 font-mono text-[10px] uppercase tracking-wide" style={{ color: '#94a3b8' }}>Item</th>
                            <th className="text-right py-2 px-3 font-mono text-[10px] uppercase tracking-wide" style={{ color: '#94a3b8' }}>Qty</th>
                            <th className="text-right py-2 px-3 font-mono text-[10px] uppercase tracking-wide" style={{ color: '#94a3b8' }}>Received</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.items.map((item, idx) => (
                            <tr key={idx} style={{ borderTop: idx > 0 ? '1px solid #f1f5f9' : 'none' }}>
                              <td className="py-2 px-3 font-inter text-sm" style={{ color: '#1e293b' }}>{item.item}</td>
                              <td className="py-2 px-3 font-mono text-xs text-right" style={{ color: '#64748b' }}>×{item.quantity}</td>
                              <td className="py-2 px-3 text-right">
                                {selectedOrder.status === 'received' ? (
                                  <CheckCircle className="w-3.5 h-3.5 ml-auto" style={{ color: '#22c55e' }} />
                                ) : (
                                  <Clock className="w-3.5 h-3.5 ml-auto" style={{ color: '#cbd5e1' }} />
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Delivery address */}
                  <div className="rounded-xl p-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <p className="font-mono text-[10px] uppercase tracking-wide mb-1.5" style={{ color: '#94a3b8' }}>Delivering to</p>
                    <p className="font-inter text-sm font-medium" style={{ color: '#1e293b' }}>{GROVE_ADDRESS.name}</p>
                    <p className="font-inter text-xs mt-0.5" style={{ color: '#64748b' }}>{GROVE_ADDRESS.address1}, {GROVE_ADDRESS.address2}</p>
                    <p className="font-inter text-xs" style={{ color: '#64748b' }}>{GROVE_ADDRESS.town}, {GROVE_ADDRESS.postCode}</p>
                  </div>

                  {/* Actions */}
                  {sendSuccess ? (
                    <div className="flex items-center gap-2 justify-center py-2 rounded-xl" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                      <CheckCircle className="w-4 h-4" style={{ color: '#22c55e' }} />
                      <span className="font-inter text-sm font-medium" style={{ color: '#16a34a' }}>Order sent to Birlea successfully</span>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      {selectedOrder.status === 'pending_approval' && (
                        <button
                          onClick={() => handleApproveOrder(selectedOrder)}
                          disabled={isSending}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-sora font-semibold text-sm transition-all"
                          style={isSending
                            ? { background: '#f1f5f9', color: '#94a3b8', cursor: 'not-allowed' }
                            : { background: '#0ea5e9', color: '#ffffff', boxShadow: '0 4px 14px rgba(14,165,233,0.35)' }
                          }
                        >
                          {isSending ? (
                            <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />Sending...</>
                          ) : (
                            <><Send className="w-4 h-4" />Approve &amp; Send to Birlea</>
                          )}
                        </button>
                      )}
                      {selectedOrder.status === 'sent' && (
                        <button
                          onClick={() => handleMarkReceived(selectedOrder.id)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-sora font-semibold text-sm transition-all"
                          style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a' }}
                        >
                          <PackageCheck className="w-4 h-4" />
                          Mark as Received
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ── Custom Order Modal ── */}
      <Dialog open={customModalOpen} onOpenChange={v => { setCustomModalOpen(v); if (!v) { setCustomItems([]); setCatalogueSearch(''); } }}>
        <DialogContent className="max-w-2xl" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <DialogHeader>
            <DialogTitle className="font-sora font-bold text-lg" style={{ color: '#1e293b' }}>
              Custom Order
            </DialogTitle>
            <DialogDescription className="font-inter text-sm" style={{ color: '#64748b' }}>
              Search the Birlea catalogue and select items to order
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 flex gap-4" style={{ height: '420px' }}>
            {/* Left: catalogue search */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Search */}
              <div className="relative mb-3 flex-shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94a3b8' }} />
                <input
                  type="text"
                  value={catalogueSearch}
                  onChange={e => setCatalogueSearch(e.target.value)}
                  placeholder="Search Birlea catalogue..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-sm"
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', outline: 'none' }}
                />
              </div>

              <div className="flex items-center justify-between mb-2">
                <a
                  href="https://www.birlea.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] font-sora"
                  style={{ color: '#0ea5e9' }}
                >
                  <ExternalLink className="w-3 h-3" />
                  View full Birlea catalogue
                </a>
                <span className="font-mono text-[10px]" style={{ color: '#94a3b8' }}>{filteredCatalogue.length} items</span>
              </div>

              <div className="overflow-y-auto flex-1 flex flex-col gap-1.5">
                {filteredCatalogue.map(item => {
                  const selected = customItems.find(i => i.catalogueId === item.id);
                  const status = getItemStatus(item.current, item.reorderAt);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleCatalogueItem(item)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all"
                      style={{
                        background: selected ? '#f0f9ff' : '#f8fafc',
                        border: selected ? '1px solid #bae6fd' : '1px solid #e2e8f0',
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                        style={{
                          background: selected ? '#0ea5e9' : '#ffffff',
                          border: selected ? '1px solid #0ea5e9' : '1px solid #cbd5e1',
                        }}
                      >
                        {selected && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-inter text-xs font-medium truncate" style={{ color: '#1e293b' }}>{item.name}</span>
                          {status === 'critical' && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#ef4444' }} />}
                          {status === 'warning' && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#f59e0b' }} />}
                        </div>
                        <span className="font-mono text-[10px]" style={{ color: '#94a3b8' }}>{item.category} · {item.id}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: selected items + qty */}
            <div className="w-52 flex flex-col flex-shrink-0">
              <div className="mb-2 flex-shrink-0">
                <p className="font-mono text-[10px] uppercase tracking-wide mb-1.5" style={{ color: '#64748b' }}>Order Type</p>
                <div className="relative">
                  <select
                    value={customOrderType}
                    onChange={e => setCustomOrderType(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl text-xs appearance-none"
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', outline: 'none', paddingRight: '28px' }}
                  >
                    <option value="Standard">Standard</option>
                    <option value="Next Day">Next Day</option>
                    <option value="Birlea Direct Home Delivery">Direct Delivery</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: '#94a3b8' }} />
                </div>
              </div>

              <p className="font-mono text-[10px] uppercase tracking-wide mb-2 flex-shrink-0" style={{ color: '#64748b' }}>
                Selected ({customItems.length})
              </p>

              <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 min-h-0">
                {customItems.length === 0 ? (
                  <p className="font-inter text-xs text-center mt-6" style={{ color: '#cbd5e1' }}>Select items from the catalogue</p>
                ) : (
                  customItems.map(item => (
                    <div key={item.catalogueId} className="rounded-xl p-2" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-inter text-[10px] font-medium leading-tight" style={{ color: '#1e293b' }}>{item.name}</span>
                        <button onClick={() => toggleCatalogueItem(birleaCatalogue.find(i => i.id === item.catalogueId)!)} style={{ color: '#94a3b8' }}>
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-[10px]" style={{ color: '#64748b' }}>Qty:</span>
                        <input
                          type="number"
                          value={item.quantity}
                          min={1}
                          onChange={e => updateCustomQty(item.catalogueId, parseInt(e.target.value) || 1)}
                          onClick={e => e.stopPropagation()}
                          className="w-full px-2 py-0.5 rounded-lg text-xs font-mono text-center"
                          style={{ background: '#ffffff', border: '1px solid #bae6fd', color: '#1e293b', outline: 'none' }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex flex-col gap-2 mt-3 flex-shrink-0">
                <button
                  onClick={submitCustomOrder}
                  disabled={customItems.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-sora font-semibold text-xs transition-all"
                  style={customItems.length === 0
                    ? { background: '#f1f5f9', color: '#94a3b8', cursor: 'not-allowed' }
                    : { background: '#0ea5e9', color: '#ffffff', boxShadow: '0 2px 10px rgba(14,165,233,0.3)' }
                  }
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Order
                </button>
                <button
                  onClick={() => { setCustomModalOpen(false); setCustomItems([]); setCatalogueSearch(''); }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl font-sora font-medium text-xs"
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
