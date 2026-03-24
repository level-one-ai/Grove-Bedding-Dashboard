import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Send,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import type { NewLabelInput } from '../App';

const birleaStockItems = [
  { id: 'SKU-001', name: 'Memory Foam Mattress', current: 45, max: 100, reorderAt: 30 },
  { id: 'SKU-002', name: 'Pillow Top Queen', current: 28, max: 80, reorderAt: 25 },
  { id: 'SKU-003', name: 'Luxury Bed Sheets', current: 156, max: 200, reorderAt: 50 },
  { id: 'SKU-004', name: 'Down Alternative Pillow', current: 89, max: 150, reorderAt: 40 },
  { id: 'SKU-005', name: 'Weighted Blanket', current: 12, max: 60, reorderAt: 20 },
  { id: 'SKU-006', name: 'Mattress Protector', current: 67, max: 120, reorderAt: 30 },
];

const getItemStatus = (current: number, reorderAt: number) => {
  if (current <= reorderAt) return 'critical';
  if (current <= reorderAt * 1.5) return 'warning';
  return 'good';
};

const emailByOrderType: Record<string, string> = {
  'Standard': 'orders@birlea.com',
  'Next Day': 'nextday@birlea.com',
  'Birlea Direct Home Delivery': 'homedelivery@birlea.com',
};

const WEBHOOK_URL = 'https://hook.eu1.make.com/ekeigx4rsyy6ur1p0pjyn46emny84hed';

interface OrderItem {
  item: string;
  quantity: number;
}

interface Props {
  onOrderSubmit: (label: NewLabelInput) => void;
}

export default function BirleaOrders({ onOrderSubmit }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);

  // Pre-populate items that need restocking
  const defaultItems: OrderItem[] = birleaStockItems
    .filter(item => getItemStatus(item.current, item.reorderAt) !== 'good')
    .map(item => ({
      item: item.name,
      quantity: item.max - item.current,
    }));

  const [birleaCustomerNumber, setBirleaCustomerNumber] = useState('');
  const [orderType, setOrderType] = useState('Standard');
  const [orderNumber, setOrderNumber] = useState(`ORD-${Date.now().toString().slice(-6)}`);
  const [name, setName] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [town, setTown] = useState('');
  const [region, setRegion] = useState('');
  const [postCode, setPostCode] = useState('');
  const [buyerPhoneNumber, setBuyerPhoneNumber] = useState('');
  const [email, setEmail] = useState(emailByOrderType['Standard']);
  const [orderItems, setOrderItems] = useState<OrderItem[]>(defaultItems);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(false);

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

  // Auto-update email when order type changes
  const handleOrderTypeChange = (value: string) => {
    setOrderType(value);
    setEmail(emailByOrderType[value] ?? '');
  };

  const addItem = () => {
    setOrderItems(prev => [...prev, { item: '', quantity: 1 }]);
  };

  const updateItem = (index: number, field: keyof OrderItem, value: string | number) => {
    setOrderItems(prev =>
      prev.map((item, i) => i === index ? { ...item, [field]: value } : item)
    );
  };

  const removeItem = (index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(false);

    const payload = {
      birleaCustomerNumber,
      orderType,
      orderNumber,
      name,
      address1,
      address2,
      town,
      region,
      postCode,
      buyerPhoneNumber,
      email,
      items: orderItems,
    };

    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Generate label after successful submission
      onOrderSubmit({
        orderId: orderNumber,
        recipientName: name,
        address1,
        address2,
        town,
        region,
        postCode,
        phone: buyerPhoneNumber,
        orderType,
        items: orderItems,
      });

      setSubmitSuccess(true);
    } catch {
      setSubmitError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    color: '#1e293b',
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
  };

  const labelStyle = {
    display: 'block' as const,
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: '10px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: '#64748b',
    marginBottom: '6px',
  };

  if (submitSuccess) {
    return (
      <div
        ref={sectionRef}
        className="relative w-full h-full flex items-center justify-center"
        style={{ background: '#ffffff' }}
      >
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: `radial-gradient(circle, #cbd5e1 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
          }}
        />
        <div className="relative z-10 text-center max-w-md px-6">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
          >
            <CheckCircle className="w-10 h-10" style={{ color: '#22c55e' }} />
          </div>
          <h2 className="font-sora font-bold text-2xl mb-2" style={{ color: '#1e293b' }}>Order Sent!</h2>
          <p className="font-inter text-sm leading-relaxed mb-2" style={{ color: '#64748b' }}>
            Your order <span className="font-mono" style={{ color: '#0ea5e9' }}>{orderNumber}</span> has been sent to Birlea.
          </p>
          <p className="font-inter text-sm leading-relaxed mb-6" style={{ color: '#64748b' }}>
            A shipping label has been generated and is awaiting verification in the <strong>Label Management</strong> section.
          </p>
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
          >
            <span className="font-mono text-xs" style={{ color: '#16a34a' }}>Sent to: {email}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="orders"
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

      <div className="relative z-10 flex-1 flex flex-col max-w-7xl w-full mx-auto px-6 py-4 min-h-0 overflow-y-auto">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}
            >
              <ShoppingBag className="w-5 h-5" style={{ color: '#0ea5e9' }} />
            </div>
            <div>
              <h2 className="font-sora font-bold text-xl" style={{ color: '#1e293b' }}>Make an Order</h2>
              <p className="font-inter text-xs" style={{ color: '#64748b' }}>
                Place a new order with Birlea — low stock items are pre-loaded
              </p>
            </div>
          </div>

          {/* Pre-populated notice */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: '#fffbeb', border: '1px solid #fde68a' }}
          >
            <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#d97706' }} />
            <span className="font-inter text-xs" style={{ color: '#92400e' }}>
              {defaultItems.length} low stock item{defaultItems.length !== 1 ? 's' : ''} pre-loaded
            </span>
          </div>
        </div>

        {/* ── Form Grid ── */}
        <div className="grid grid-cols-5 gap-5 flex-shrink-0">

          {/* Left: Order & Delivery Details */}
          <div className="col-span-3 flex flex-col gap-4">

            {/* Order Details Card */}
            <div className="glass-card p-5">
              <h3 className="font-sora font-semibold text-sm mb-4 pb-3" style={{ color: '#1e293b', borderBottom: '1px solid #f1f5f9' }}>
                Order Details
              </h3>
              <div className="grid grid-cols-2 gap-4">

                <div>
                  <label style={labelStyle}>Birlea Customer Number</label>
                  <input
                    type="text"
                    value={birleaCustomerNumber}
                    onChange={e => setBirleaCustomerNumber(e.target.value)}
                    placeholder="e.g. BIR-12345"
                    className="w-full px-3 py-2.5 rounded-xl text-sm"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Order Number</label>
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={e => setOrderNumber(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm font-mono"
                    style={inputStyle}
                  />
                </div>

                <div className="col-span-2">
                  <label style={labelStyle}>Order Type</label>
                  <div className="relative">
                    <select
                      value={orderType}
                      onChange={e => handleOrderTypeChange(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm appearance-none"
                      style={{ ...inputStyle, paddingRight: '36px' }}
                    >
                      <option value="Standard">Standard (Store / Warehouse)</option>
                      <option value="Next Day">Next Day (Own Courier)</option>
                      <option value="Birlea Direct Home Delivery">Birlea Direct Home Delivery</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#94a3b8' }} />
                  </div>
                </div>

                <div className="col-span-2">
                  <label style={labelStyle}>Recipient Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm"
                      style={{ ...inputStyle, background: '#f0f9ff', border: '1px solid #bae6fd' }}
                    />
                    <span
                      className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] uppercase tracking-wide"
                      style={{ color: '#0ea5e9' }}
                    >
                      Auto
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Delivery Details Card */}
            <div className="glass-card p-5">
              <h3 className="font-sora font-semibold text-sm mb-4 pb-3" style={{ color: '#1e293b', borderBottom: '1px solid #f1f5f9' }}>
                Delivery Details
              </h3>
              <div className="grid grid-cols-2 gap-4">

                <div className="col-span-2">
                  <label style={labelStyle}>Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Customer or business name"
                    className="w-full px-3 py-2.5 rounded-xl text-sm"
                    style={inputStyle}
                  />
                </div>

                <div className="col-span-2">
                  <label style={labelStyle}>Address Line 1</label>
                  <input
                    type="text"
                    value={address1}
                    onChange={e => setAddress1(e.target.value)}
                    placeholder="Street address"
                    className="w-full px-3 py-2.5 rounded-xl text-sm"
                    style={inputStyle}
                  />
                </div>

                <div className="col-span-2">
                  <label style={labelStyle}>Address Line 2</label>
                  <input
                    type="text"
                    value={address2}
                    onChange={e => setAddress2(e.target.value)}
                    placeholder="Unit, building, etc. (optional)"
                    className="w-full px-3 py-2.5 rounded-xl text-sm"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Town</label>
                  <input
                    type="text"
                    value={town}
                    onChange={e => setTown(e.target.value)}
                    placeholder="Town / City"
                    className="w-full px-3 py-2.5 rounded-xl text-sm"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Region</label>
                  <input
                    type="text"
                    value={region}
                    onChange={e => setRegion(e.target.value)}
                    placeholder="County / Region"
                    className="w-full px-3 py-2.5 rounded-xl text-sm"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Post Code</label>
                  <input
                    type="text"
                    value={postCode}
                    onChange={e => setPostCode(e.target.value)}
                    placeholder="e.g. B1 1AA"
                    className="w-full px-3 py-2.5 rounded-xl text-sm font-mono"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Buyer Phone Number</label>
                  <input
                    type="tel"
                    value={buyerPhoneNumber}
                    onChange={e => setBuyerPhoneNumber(e.target.value)}
                    placeholder="e.g. 0121 555 0100"
                    className="w-full px-3 py-2.5 rounded-xl text-sm"
                    style={inputStyle}
                  />
                </div>

              </div>
            </div>

          </div>

          {/* Right: Items List */}
          <div className="col-span-2 flex flex-col gap-4">
            <div className="glass-card p-5 flex flex-col" style={{ minHeight: 0 }}>
              <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <h3 className="font-sora font-semibold text-sm" style={{ color: '#1e293b' }}>Order Items</h3>
                  <p className="font-inter text-[11px] mt-0.5" style={{ color: '#94a3b8' }}>
                    Low stock items pre-loaded
                  </p>
                </div>
                <a
                  href="https://www.birlea.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-sora font-medium transition-all"
                  style={{ background: '#f0f9ff', border: '1px solid #bae6fd', color: '#0ea5e9' }}
                >
                  <ExternalLink className="w-3 h-3" />
                  Birlea Catalogue
                </a>
              </div>

              {/* Status legend */}
              <div className="flex gap-3 mb-3">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: '#ef4444' }} />
                  <span className="font-inter text-[10px]" style={{ color: '#94a3b8' }}>Critical</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: '#f59e0b' }} />
                  <span className="font-inter text-[10px]" style={{ color: '#94a3b8' }}>Low Stock</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: '340px' }}>
                {orderItems.map((orderItem, index) => {
                  const stockMatch = birleaStockItems.find(s => s.name === orderItem.item);
                  const itemStatus = stockMatch ? getItemStatus(stockMatch.current, stockMatch.reorderAt) : null;
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2.5 rounded-xl"
                      style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                    >
                      {itemStatus && (
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{
                            background: itemStatus === 'critical' ? '#ef4444' :
                              itemStatus === 'warning' ? '#f59e0b' : '#22c55e',
                          }}
                        />
                      )}
                      <input
                        type="text"
                        value={orderItem.item}
                        onChange={e => updateItem(index, 'item', e.target.value)}
                        placeholder="Item name"
                        className="flex-1 px-2 py-1 rounded-lg text-xs"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#1e293b',
                          outline: 'none',
                          fontFamily: 'Inter, sans-serif',
                        }}
                      />
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-[10px]" style={{ color: '#94a3b8' }}>Qty</span>
                        <input
                          type="number"
                          value={orderItem.quantity}
                          min={1}
                          onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-14 px-2 py-1 rounded-lg text-xs font-mono text-center"
                          style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            color: '#1e293b',
                            outline: 'none',
                          }}
                        />
                      </div>
                      <button
                        onClick={() => removeItem(index)}
                        className="p-1 rounded-lg transition-colors"
                        style={{ color: '#cbd5e1' }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={addItem}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-sora font-medium transition-all"
                style={{
                  background: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  color: '#64748b',
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>
          </div>

        </div>

        {/* ── Submit ── */}
        <div className="flex items-center justify-between mt-5 pt-4 flex-shrink-0" style={{ borderTop: '1px solid #f1f5f9' }}>
          {submitError && (
            <div className="flex items-center gap-2" style={{ color: '#dc2626' }}>
              <AlertTriangle className="w-4 h-4" />
              <span className="font-inter text-sm">Failed to send. Please check your connection and try again.</span>
            </div>
          )}
          {!submitError && (
            <p className="font-inter text-xs" style={{ color: '#94a3b8' }}>
              Order will be sent to <span className="font-mono" style={{ color: '#0ea5e9' }}>{email || 'recipient email'}</span> via Make.com webhook
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !name || !address1 || !town || !postCode}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-sora font-semibold text-sm transition-all"
            style={
              isSubmitting || !name || !address1 || !town || !postCode
                ? { background: '#f1f5f9', color: '#94a3b8', cursor: 'not-allowed' }
                : {
                    background: '#0ea5e9',
                    color: '#ffffff',
                    boxShadow: '0 4px 14px rgba(14,165,233,0.35)',
                  }
            }
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Order
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
