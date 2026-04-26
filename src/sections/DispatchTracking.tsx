import { useEffect, useState, useCallback } from 'react';
import {
  Truck, MapPin, Package, User, Clock, ChevronRight,
  RefreshCw, AlertCircle, Route, Phone, FileText,
  CheckCircle2, Circle, Loader2, Map, Users
} from 'lucide-react';

interface Stop {
  id: string;
  position: number;
  status: string;
  recipientName: string;
  recipientPhone: string | null;
  recipientEmail: string | null;
  recipientNotes: string | null;
  address: string;
  address2: string;
  city: string;
  postcode: string;
  country: string;
  coordinates: { lat: number; lng: number } | null;
  packageCount: number;
  orderInfo: string | null;
  notes: string | null;
  customFields: Record<string, unknown>;
  scheduledAt: string | null;
  completedAt: string | null;
  route: string | null;
}
interface Plan {
  id: string;
  title: string;
  date: string | null;
  startTime: string | null;
  status: string;
  stopCount: number;
  routeCount: number;
  drivers: string[];
  depot: string | null;
}

function statusColour(status: string) {
  switch (status?.toLowerCase()) {
    case 'success': case 'completed': case 'delivered':
      return { bg: '#f0fdf4', text: '#16a34a', dot: '#22c55e' };
    case 'inprogress': case 'in_progress': case 'in-progress': case 'active':
      return { bg: '#eff6ff', text: '#2563eb', dot: '#3b82f6' };
    case 'failed': case 'cancelled':
      return { bg: '#fef2f2', text: '#dc2626', dot: '#ef4444' };
    default:
      return { bg: '#f8fafc', text: '#64748b', dot: '#94a3b8' };
  }
}
function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function DispatchTracking() {
  const [plans, setPlans]               = useState<Plan[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [refreshing, setRefreshing]     = useState(false);

  const [stops, setStops]                 = useState<Stop[]>([]);
  const [stopsLoading, setStopsLoading]   = useState(false);

  const fetchPlans = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/spoke-plans');
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? 'Failed to load plans');
      setPlans(data.plans ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  const fetchStops = useCallback(async (plan: Plan) => {
    setStopsLoading(true);
    setStops([]);
    setSelectedStop(null);
    try {
      const res  = await fetch(`/api/spoke-stops?planId=${encodeURIComponent(plan.id)}`);
      const data = await res.json();
      setStops(data.stops ?? []);
    } catch (err: unknown) {
      console.error('Failed to load stops:', err);
    } finally { setStopsLoading(false); }
  }, []);

  useEffect(() => { fetchPlans(); }, []);

  // Auto-select first plan and load its stops
  useEffect(() => {
    if (plans.length > 0 && !selectedPlan) {
      setSelectedPlan(plans[0]);
      fetchStops(plans[0]);
    }
  }, [plans]);

  const totalStops     = plans.reduce((n, p) => n + (p.stopCount ?? 0), 0);
  const totalDelivered = stops.filter(s => ['success','completed','delivered'].includes(s.status?.toLowerCase())).length;
  const totalDrivers   = plans.reduce((n, p) => n + (p.drivers?.length ?? 0), 0);

  // Find stops in the same postcode area for route combining
  const nearbyStops = (stop: Stop) => {
    const postcode = stop.postcode?.match(/[A-Z]{1,2}\d{1,2}/)?.[0];
    if (!postcode) return [];
    return stops.filter(s => s.id !== stop.id && s.postcode?.includes(postcode));
  };

  return (
    <div className="relative flex flex-col h-full" style={{ background: '#ffffff' }}>
      <div className="relative z-10 h-full flex flex-col max-w-7xl mx-auto px-8 py-4">

        {/* Header */}
        <div className="mb-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-sora font-bold text-xl" style={{ color: '#1e293b' }}>Dispatch Tracking</h2>
              <p className="font-inter text-xs" style={{ color: '#64748b' }}>Spoke Dispatch · Live delivery plans</p>
            </div>
          </div>
          <button onClick={() => fetchPlans(true)} disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-inter font-medium"
            style={{ background: '#f1f5f9', color: '#475569' }}>
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-4 flex-shrink-0">
          {[
            { icon: <Route className="w-4 h-4" style={{ color: '#3b82f6' }} />, bg: '#eff6ff', value: plans.length, label: 'Active Plans' },
            { icon: <MapPin className="w-4 h-4" style={{ color: '#8b5cf6' }} />, bg: '#f5f3ff', value: totalStops, label: 'Total Stops' },
            { icon: <CheckCircle2 className="w-4 h-4" style={{ color: '#16a34a' }} />, bg: '#f0fdf4', value: totalDelivered, label: 'Delivered' },
            { icon: <Users className="w-4 h-4" style={{ color: '#f59e0b' }} />, bg: '#fffbeb', value: totalDrivers, label: 'Drivers Active' },
          ].map((s, i) => (
            <div key={i} className="glass-card p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: s.bg }}>{s.icon}</div>
              <div>
                <p className="font-sora font-bold text-xl" style={{ color: '#1e293b' }}>{s.value}</p>
                <p className="font-inter text-xs" style={{ color: '#64748b' }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* States */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#3b82f6' }} />
              <p className="font-inter text-sm" style={{ color: '#64748b' }}>Loading delivery plans from Spoke...</p>
            </div>
          </div>
        )}
        {!loading && error && (
          <div className="flex-1 flex items-center justify-center">
            <div className="glass-card p-6 max-w-md text-center">
              <AlertCircle className="w-10 h-10 mx-auto mb-3" style={{ color: '#ef4444' }} />
              <p className="font-sora font-semibold mb-1" style={{ color: '#1e293b' }}>Could not load Spoke plans</p>
              <p className="font-inter text-sm mb-4" style={{ color: '#64748b' }}>{error}</p>
              {error.includes('SPOKE_API_KEY') && (
                <p className="font-inter text-xs p-3 rounded-lg" style={{ background: '#f8fafc', color: '#64748b' }}>
                  Add SPOKE_API_KEY to Vercel environment variables.<br />
                  Get it from Spoke Dispatch → Settings → Integrations → API
                </p>
              )}
              <button onClick={() => fetchPlans()} className="mt-4 px-4 py-2 rounded-lg text-sm font-inter font-medium text-white"
                style={{ background: '#3b82f6' }}>Try again</button>
            </div>
          </div>
        )}
        {!loading && !error && plans.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Truck className="w-12 h-12 mx-auto mb-3" style={{ color: '#e2e8f0' }} />
              <p className="font-sora font-semibold" style={{ color: '#1e293b' }}>No delivery plans today</p>
              <p className="font-inter text-sm mt-1" style={{ color: '#64748b' }}>Plans created in Spoke Dispatch will appear here</p>
            </div>
          </div>
        )}

        {/* Two-column layout */}
        {!loading && !error && plans.length > 0 && (
          <div className="flex gap-4 flex-1 min-h-0">

            {/* LEFT — list */}
            <div className="flex flex-col gap-3 w-72 flex-shrink-0">
              {/* Plan selector */}
              <div className="glass-card p-2 flex-shrink-0">
                <p className="font-inter text-xs px-1 mb-1.5" style={{ color: '#94a3b8' }}>DELIVERY PLANS</p>
                {plans.map(plan => {
                  const sc = statusColour(plan.status);
                  const isSel = selectedPlan?.id === plan.id;
                  return (
                    <button key={plan.id}
                      onClick={() => { setSelectedPlan(plan); fetchStops(plan); }}
                      className="w-full text-left px-2.5 py-2 rounded-lg transition-all flex items-center justify-between gap-2"
                      style={{ background: isSel ? '#eff6ff' : 'transparent' }}>
                      <div className="min-w-0">
                        <p className="font-inter text-sm font-medium truncate" style={{ color: '#1e293b' }}>{plan.title}</p>
                        <p className="font-inter text-xs" style={{ color: '#64748b' }}>{formatDate(plan.date)} · {plan.stopCount} stops</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                        {isSel && <ChevronRight className="w-3.5 h-3.5" style={{ color: '#3b82f6' }} />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Stop list */}
              {selectedPlan && (
                <div className="glass-card flex-1 min-h-0 overflow-hidden flex flex-col">
                  <div className="px-3 py-2 border-b flex-shrink-0" style={{ borderColor: '#f1f5f9' }}>
                    <p className="font-inter text-xs" style={{ color: '#94a3b8' }}>DELIVERIES · {stops.length} stops</p>
                  </div>
                  <div className="overflow-y-auto flex-1 p-1.5 space-y-0.5">
                    {stopsLoading ? (
                      <div className="p-4 text-center">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" style={{ color: '#3b82f6' }} />
                        <p className="font-inter text-xs" style={{ color: '#94a3b8' }}>Loading stops...</p>
                      </div>
                    ) : stops.length === 0 ? (
                      <div className="p-4 text-center">
                        <p className="font-inter text-xs" style={{ color: '#94a3b8' }}>No stops in this plan</p>
                      </div>
                    ) : stops.map(stop => {
                      const sc = statusColour(stop.status);
                      const isSel = selectedStop?.id === stop.id;
                      return (
                        <button key={stop.id} onClick={() => setSelectedStop(stop)}
                          className="w-full text-left px-2.5 py-2 rounded-lg transition-all"
                          style={{ background: isSel ? '#eff6ff' : 'transparent' }}>
                          <div className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: sc.dot }} />
                            <div className="min-w-0 flex-1">
                              <p className="font-inter text-sm font-medium truncate" style={{ color: '#1e293b' }}>
                                {stop.recipientName || 'Unknown'}
                              </p>
                              <p className="font-inter text-xs truncate" style={{ color: '#64748b' }}>{stop.address}</p>
                              {stop.orderRef && <p className="font-inter text-xs" style={{ color: '#94a3b8' }}>{stop.orderRef}</p>}
                            </div>
                            <span className="text-xs font-inter px-1.5 py-0.5 rounded-md flex-shrink-0"
                              style={{ background: sc.bg, color: sc.text }}>{stop.packageCount} pkg</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT — detail panel */}
            <div className="flex-1 min-w-0">
              {!selectedStop ? (
                <div className="glass-card h-full flex items-center justify-center">
                  <div className="text-center">
                    <Package className="w-10 h-10 mx-auto mb-3" style={{ color: '#e2e8f0' }} />
                    <p className="font-sora font-semibold" style={{ color: '#1e293b' }}>Select a delivery</p>
                    <p className="font-inter text-sm mt-1" style={{ color: '#64748b' }}>Click any stop to see full order details</p>
                  </div>
                </div>
              ) : (
                <div className="glass-card h-full flex flex-col overflow-hidden">
                  {/* Detail header */}
                  <div className="px-5 py-4 border-b flex-shrink-0" style={{ borderColor: '#f1f5f9' }}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-sora font-bold text-lg" style={{ color: '#1e293b' }}>
                          {selectedStop.recipientName || 'Unknown Recipient'}
                        </h3>
                        <p className="font-inter text-sm mt-0.5" style={{ color: '#64748b' }}>
                          {[selectedStop.address, selectedStop.city, selectedStop.postcode].filter(Boolean).join(', ')}
                        </p>
                      </div>
                      {(() => { const sc = statusColour(selectedStop.status); return (
                        <span className="text-xs font-inter font-medium px-2.5 py-1 rounded-full capitalize flex-shrink-0"
                          style={{ background: sc.bg, color: sc.text }}>{selectedStop.status || 'Pending'}</span>
                      ); })()}
                    </div>
                  </div>

                  {/* Detail body */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-5">

                    {/* Contact + Order */}
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <p className="font-inter text-xs font-semibold uppercase tracking-wide" style={{ color: '#94a3b8' }}>Contact</p>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 flex-shrink-0" style={{ color: '#64748b' }} />
                          <span className="font-inter text-sm" style={{ color: '#1e293b' }}>{selectedStop.recipientName || '—'}</span>
                        </div>
                        {selectedStop.recipientPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 flex-shrink-0" style={{ color: '#64748b' }} />
                            <a href={`tel:${selectedStop.recipientPhone}`} className="font-inter text-sm" style={{ color: '#3b82f6' }}>
                              {selectedStop.recipientPhone}
                            </a>
                          </div>
                        )}
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#64748b' }} />
                          <span className="font-inter text-sm" style={{ color: '#1e293b' }}>{[selectedStop.address, selectedStop.city, selectedStop.postcode].filter(Boolean).join(', ')}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="font-inter text-xs font-semibold uppercase tracking-wide" style={{ color: '#94a3b8' }}>Order</p>
                        {selectedStop.orderRef && (
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 flex-shrink-0" style={{ color: '#64748b' }} />
                            <span className="font-inter text-sm font-medium" style={{ color: '#1e293b' }}>{selectedStop.orderRef}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 flex-shrink-0" style={{ color: '#64748b' }} />
                          <span className="font-inter text-sm" style={{ color: '#1e293b' }}>
                            {selectedStop.packageCount} package{selectedStop.packageCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {selectedStop.scheduledAt && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 flex-shrink-0" style={{ color: '#64748b' }} />
                            <span className="font-inter text-sm" style={{ color: '#1e293b' }}>ETA {formatTime(selectedStop.scheduledAt)}</span>
                          </div>
                        )}
                        {selectedStop.completedAt && (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#16a34a' }} />
                            <span className="font-inter text-sm" style={{ color: '#16a34a' }}>Delivered {formatTime(selectedStop.completedAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Items */}
                    <div>
                      <p className="font-inter text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#94a3b8' }}>
                        Items in This Order
                      </p>
                      <div className="rounded-xl p-4" style={{ background: '#f8fafc' }}>
                        {selectedStop.orderInfo ? (
                          String(selectedStop.orderInfo).split('\n').filter(Boolean).map((item, i) => (
                            <div key={i} className="flex items-center gap-2 py-1">
                              <Circle className="w-1.5 h-1.5 flex-shrink-0" style={{ color: '#94a3b8' }} fill="#94a3b8" />
                              <span className="font-inter text-sm" style={{ color: '#1e293b' }}>{item}</span>
                            </div>
                          ))
                        ) : (
                          <p className="font-inter text-sm" style={{ color: '#94a3b8' }}>
                            No order info — add item details in the stop notes in Spoke Dispatch
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    {selectedStop.notes && selectedStop.notes !== selectedStop.orderInfo && (
                      <div>
                        <p className="font-inter text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#94a3b8' }}>Notes</p>
                        <div className="rounded-xl p-3" style={{ background: '#fffbeb' }}>
                          <p className="font-inter text-sm" style={{ color: '#92400e' }}>{selectedStop.notes}</p>
                        </div>
                      </div>
                    )}

                    {/* Nearby stops — route combining */}
                    {nearbyStops(selectedStop).length > 0 && (
                      <div>
                        <p className="font-inter text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#94a3b8' }}>
                          ✦ Same area — consider combining
                        </p>
                        <div className="rounded-xl p-3 space-y-2" style={{ background: '#f5f3ff' }}>
                          {nearbyStops(selectedStop).map(s => (
                            <button key={s.id} onClick={() => setSelectedStop(s)}
                              className="w-full text-left flex items-center justify-between gap-2 py-1 hover:opacity-70 transition-opacity">
                              <div>
                                <p className="font-inter text-sm font-medium" style={{ color: '#4c1d95' }}>{s.recipientName}</p>
                                <p className="font-inter text-xs" style={{ color: '#7c3aed' }}>{s.address}</p>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#7c3aed' }} />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
