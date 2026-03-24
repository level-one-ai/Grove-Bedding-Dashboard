import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import {
  PhoneCall,
  PhoneOff,
  PhoneMissed,
  ExternalLink,
  Clock,
  User,
  Hash,
  Calendar,
  Timer,
  ShoppingBag,
  MessageSquare,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface TranscriptLine {
  speaker: 'Agent' | 'Contact';
  text: string;
  time?: string;
}

interface CallLog {
  id: string;
  time: string;
  date: string;
  contactName: string;
  contactPerson: string;
  phone: string;
  duration: string;
  orderId: string;
  status: 'completed' | 'no-answer' | 'failed';
  outcome: string;
  transcript: TranscriptLine[];
}

const callLogs: CallLog[] = [
  {
    id: 'CALL-001',
    time: '09:30',
    date: '24 Mar 2026',
    contactName: 'Acme Furniture Co',
    contactPerson: 'James Wilson',
    phone: '+44 121 555 0100',
    duration: '4m 32s',
    orderId: 'SO-1021',
    status: 'completed',
    outcome: 'Order confirmed & dispatch arranged',
    transcript: [
      { speaker: 'Agent', text: 'Good morning, this is the Grove Bedding automated ordering assistant calling on behalf of Grove Bedding Ltd. Am I speaking with Acme Furniture Co?', time: '09:30:05' },
      { speaker: 'Contact', text: 'Yes, this is James Wilson at Acme Furniture. How can I help?', time: '09:30:12' },
      { speaker: 'Agent', text: 'Thank you James. I am calling regarding your recent order reference SO-1021. This order includes 10 units of Memory Foam Mattress and 6 units of Pillow Top Queen. I am calling to confirm the order details and arrange dispatch.', time: '09:30:18' },
      { speaker: 'Contact', text: 'Yes, that is correct. We placed that order yesterday. Is there any issue with the delivery?', time: '09:30:35' },
      { speaker: 'Agent', text: 'No issues at all. Your order has been processed and is scheduled for dispatch today. Delivery is estimated for tomorrow between 9am and 12pm. You will receive a confirmation email and SMS with tracking details.', time: '09:30:42' },
      { speaker: 'Contact', text: 'Perfect. Can you also confirm the delivery address is our Birmingham warehouse on High Street?', time: '09:31:10' },
      { speaker: 'Agent', text: 'Yes, I can confirm delivery to 123 High Street, Warehouse B, Birmingham, B1 1AA. Is that correct?', time: '09:31:15' },
      { speaker: 'Contact', text: 'That is correct. Brilliant, thank you very much for the call.', time: '09:31:30' },
      { speaker: 'Agent', text: 'You are welcome. If you have any further questions, please do not hesitate to contact Grove Bedding on 0121 555 0001. Have a great day.', time: '09:31:38' },
    ],
  },
  {
    id: 'CALL-002',
    time: '09:52',
    date: '24 Mar 2026',
    contactName: 'SleepWell Retailers',
    contactPerson: 'Sarah Thompson',
    phone: '+44 161 555 0200',
    duration: '2m 18s',
    orderId: 'SO-1020',
    status: 'completed',
    outcome: 'Delivery window confirmed',
    transcript: [
      { speaker: 'Agent', text: 'Good morning, this is Grove Bedding automated assistant calling about order SO-1020. May I speak with someone regarding your recent order?', time: '09:52:03' },
      { speaker: 'Contact', text: 'Speaking, this is Sarah Thompson.', time: '09:52:10' },
      { speaker: 'Agent', text: 'Good morning Sarah. I am calling to confirm delivery for order SO-1020 containing 8 Weighted Blankets and 12 Mattress Protectors. Delivery is scheduled for tomorrow morning.', time: '09:52:15' },
      { speaker: 'Contact', text: 'That sounds right. What time should we expect the delivery?', time: '09:52:40' },
      { speaker: 'Agent', text: 'Delivery will be between 10am and 2pm. Please ensure someone is available at Commerce Park, Manchester to sign for the goods.', time: '09:52:47' },
      { speaker: 'Contact', text: 'Noted, we will make sure someone is there. Thanks for the heads up.', time: '09:53:15' },
      { speaker: 'Agent', text: 'Thank you Sarah. You will also receive a text reminder on the morning of delivery. Have a great day.', time: '09:53:20' },
    ],
  },
  {
    id: 'CALL-003',
    time: '10:15',
    date: '24 Mar 2026',
    contactName: 'Comfort Home Store',
    contactPerson: 'N/A',
    phone: '+44 113 555 0300',
    duration: '0m 0s',
    orderId: 'SO-1019',
    status: 'no-answer',
    outcome: 'No answer — voicemail left',
    transcript: [
      { speaker: 'Agent', text: 'This is the Grove Bedding automated assistant calling about order SO-1019. We were unable to reach anyone at Comfort Home Store. A voicemail has been left with delivery details. A follow-up call will be attempted in 2 hours.', time: '10:15:30' },
    ],
  },
  {
    id: 'CALL-004',
    time: '10:45',
    date: '24 Mar 2026',
    contactName: 'Dream Sleep Outlet',
    contactPerson: 'Michael Chen',
    phone: '+44 114 555 0400',
    duration: '6m 04s',
    orderId: 'SO-1018',
    status: 'completed',
    outcome: 'Order amended — quantity updated',
    transcript: [
      { speaker: 'Agent', text: 'Good morning, Grove Bedding automated assistant calling about order SO-1018. Am I speaking with Dream Sleep Outlet?', time: '10:45:02' },
      { speaker: 'Contact', text: 'Yes, Michael Chen here. What is this regarding?', time: '10:45:09' },
      { speaker: 'Agent', text: 'Good morning Michael. I am calling about your order for 15 units of Down Alternative Pillows and 10 units of Mattress Protectors. I wanted to check whether you would like to amend the quantity before dispatch, as we noticed your stock levels may support a larger order.', time: '10:45:14' },
      { speaker: 'Contact', text: 'Actually yes, we have just had a big weekend of sales. Can we increase the pillow order to 25 units?', time: '10:45:50' },
      { speaker: 'Agent', text: 'Of course. I will update order SO-1018 to 25 units of Down Alternative Pillows. The additional 10 units will be included in the same dispatch at no extra delivery charge.', time: '10:45:57' },
      { speaker: 'Contact', text: 'That is great, thank you. Very efficient service as always.', time: '10:46:20' },
      { speaker: 'Agent', text: 'Thank you Michael. Your updated order confirmation will be emailed within the next few minutes. Dispatch is still on schedule for this afternoon.', time: '10:46:26' },
      { speaker: 'Contact', text: 'Perfect, appreciate it.', time: '10:46:50' },
      { speaker: 'Agent', text: 'You are very welcome. Have a great day.', time: '10:46:55' },
    ],
  },
  {
    id: 'CALL-005',
    time: '11:30',
    date: '24 Mar 2026',
    contactName: 'BedCraft Interiors',
    contactPerson: 'N/A',
    phone: '+44 207 555 0500',
    duration: '0m 45s',
    orderId: 'SO-1017',
    status: 'failed',
    outcome: 'Call failed — connection error',
    transcript: [
      { speaker: 'Agent', text: 'Attempting to connect to BedCraft Interiors regarding order SO-1017...', time: '11:30:00' },
      { speaker: 'Agent', text: 'Connection could not be established. The call was terminated after 45 seconds. This call will be retried automatically.', time: '11:30:45' },
    ],
  },
  {
    id: 'CALL-006',
    time: '13:15',
    date: '24 Mar 2026',
    contactName: 'Nordic Sleep Co',
    contactPerson: 'Anna Johansson',
    phone: '+44 121 555 0600',
    duration: '3m 22s',
    orderId: 'SO-1016',
    status: 'completed',
    outcome: 'Delivery instructions updated',
    transcript: [
      { speaker: 'Agent', text: 'Good afternoon, Grove Bedding assistant calling about order SO-1016. May I speak with someone about the delivery?', time: '13:15:05' },
      { speaker: 'Contact', text: 'Hello, Anna Johansson speaking. Yes, what is it about?', time: '13:15:12' },
      { speaker: 'Agent', text: 'Good afternoon Anna. I am calling to confirm delivery of 20 Luxury Bed Sheet sets for order SO-1016. Can you confirm the delivery address is still correct?', time: '13:15:18' },
      { speaker: 'Contact', text: 'Yes but actually we have moved warehouses. The new address is Unit 8 instead of Unit 3 at the same business park.', time: '13:15:45' },
      { speaker: 'Agent', text: 'Thank you for letting us know. I have updated the delivery address to Unit 8. Our driver will have the correct details. Delivery is still scheduled for this Thursday.', time: '13:15:52' },
      { speaker: 'Contact', text: 'Brilliant, thank you for checking. We were worried the delivery might go to the old unit.', time: '13:16:20' },
      { speaker: 'Agent', text: 'No problem at all. You will receive an updated confirmation shortly. Have a great afternoon.', time: '13:16:28' },
    ],
  },
  {
    id: 'CALL-007',
    time: '14:00',
    date: '23 Mar 2026',
    contactName: 'Pillow Palace Ltd',
    contactPerson: 'Robert Davies',
    phone: '+44 29 555 0700',
    duration: '5m 10s',
    orderId: 'SO-1015',
    status: 'completed',
    outcome: 'Order confirmed — express upgrade requested',
    transcript: [
      { speaker: 'Agent', text: 'Good afternoon, this is Grove Bedding automated assistant calling about order SO-1015. Am I speaking with Pillow Palace Ltd?', time: '14:00:03' },
      { speaker: 'Contact', text: 'Yes, Robert Davies here. Go ahead.', time: '14:00:09' },
      { speaker: 'Agent', text: 'Good afternoon Robert. Your order for 30 Down Alternative Pillows is ready for dispatch. Standard delivery would arrive in 2 to 3 working days. Would you like to upgrade to next day delivery?', time: '14:00:15' },
      { speaker: 'Contact', text: 'Yes please, we are running very low and need them urgently. What is the cost?', time: '14:00:50' },
      { speaker: 'Agent', text: 'For your order size, next day delivery is available at an additional charge of £15. Shall I arrange that?', time: '14:01:00' },
      { speaker: 'Contact', text: 'Yes, go ahead please. We definitely need them tomorrow.', time: '14:01:15' },
      { speaker: 'Agent', text: 'Excellent. I have upgraded your delivery to next day. You will receive an updated invoice and order confirmation by email. Your order will be dispatched this evening for delivery tomorrow before 12pm.', time: '14:01:20' },
    ],
  },
];

const statusConfig = {
  completed: { label: 'Completed', dot: '#22c55e', color: '#16a34a', icon: PhoneCall },
  'no-answer': { label: 'No Answer', dot: '#f59e0b', color: '#d97706', icon: PhoneMissed },
  failed: { label: 'Failed', dot: '#ef4444', color: '#dc2626', icon: PhoneOff },
};

export default function OutboundCalls() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(sectionRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const handleCallClick = (call: CallLog) => {
    setSelectedCall(call);
    setDialogOpen(true);
  };

  const completedCount = callLogs.filter(c => c.status === 'completed').length;
  const failedCount = callLogs.filter(c => c.status !== 'completed').length;
  const totalDuration = callLogs.reduce((sum, c) => {
    const [m, s] = c.duration.replace('m', '').replace('s', '').trim().split(' ');
    return sum + (parseInt(m) * 60) + parseInt(s);
  }, 0);
  const avgMins = Math.floor(totalDuration / callLogs.length / 60);
  const avgSecs = Math.floor((totalDuration / callLogs.length) % 60);

  return (
    <div
      id="calls"
      ref={sectionRef}
      className="relative w-full h-full overflow-hidden"
      style={{ background: '#ffffff' }}
    >
      <div className="absolute inset-0 opacity-[0.5]" style={{ backgroundImage: `radial-gradient(circle, #cbd5e1 1px, transparent 1px)`, backgroundSize: '28px 28px' }} />

      <div className="relative z-10 h-full flex flex-col max-w-5xl mx-auto px-8 py-4">

        {/* Header */}
        <div className="mb-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
              <PhoneCall className="w-4 h-4" style={{ color: '#0ea5e9' }} />
            </div>
            <div>
              <h2 className="font-sora font-bold text-xl" style={{ color: '#1e293b' }}>Outbound Call Agent</h2>
              <p className="font-inter text-xs" style={{ color: '#64748b' }}>Click any call to view transcript and details</p>
            </div>
          </div>

          {/* Stats chips */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: '#22c55e' }} />
              <span className="font-mono text-xs font-medium" style={{ color: '#16a34a' }}>{completedCount} completed</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: '#ef4444' }} />
              <span className="font-mono text-xs font-medium" style={{ color: '#dc2626' }}>{failedCount} issues</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <Timer className="w-3.5 h-3.5" style={{ color: '#64748b' }} />
              <span className="font-mono text-xs" style={{ color: '#64748b' }}>Avg {avgMins}m {avgSecs}s</span>
            </div>
            <div className="flex items-center gap-2 ml-1">
              <div className="w-2 h-2 rounded-full" style={{ background: '#22c55e', animation: 'pulse 2s infinite' }} />
              <span className="font-mono text-[10px]" style={{ color: '#22c55e' }}>Live</span>
            </div>
          </div>
        </div>

        {/* Call Log — 2-col grid, same pattern as AutomationStream */}
        <div className="grid grid-cols-2 gap-2 overflow-y-auto content-start flex-1 min-h-0">
          {callLogs.map((call) => {
            const cfg = statusConfig[call.status];
            const StatusIcon = cfg.icon;
            return (
              <div
                key={call.id}
                onClick={() => handleCallClick(call)}
                className="glass-card p-3 flex items-center gap-3 hover:shadow-md transition-all duration-300 cursor-pointer group h-fit"
              >
                {/* Time badge */}
                <div className="flex-shrink-0 text-right">
                  <div className="font-mono text-[10px]" style={{ color: '#94a3b8' }}>{call.time}</div>
                  <div className="font-mono text-[9px]" style={{ color: '#cbd5e1' }}>{call.date.split(' ').slice(0, 2).join(' ')}</div>
                </div>

                {/* Status dot */}
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />

                {/* Contact info */}
                <div className="flex-1 min-w-0">
                  <span className="font-sora font-medium text-xs block truncate group-hover:text-sky-500 transition-colors" style={{ color: '#334155' }}>
                    {call.contactName}
                  </span>
                  <span className="font-mono text-[10px]" style={{ color: '#94a3b8' }}>{call.phone}</span>
                </div>

                {/* Duration + order */}
                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <StatusIcon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                    <span className="font-mono text-[10px]" style={{ color: call.status !== 'completed' ? cfg.color : '#94a3b8' }}>
                      {call.duration === '0m 0s' ? cfg.label : call.duration}
                    </span>
                  </div>
                  <span className="font-mono text-[10px]" style={{ color: '#0ea5e9' }}>{call.orderId}</span>
                </div>

                <ExternalLink className="w-3 h-3 flex-shrink-0 text-slate-300 group-hover:text-sky-400 transition-colors" />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Call Detail Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
          {selectedCall && (() => {
            const cfg = statusConfig[selectedCall.status];
            const StatusIcon = cfg.icon;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="font-sora font-bold text-xl flex items-center gap-3" style={{ color: '#1e293b' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                      <StatusIcon className="w-4 h-4" style={{ color: cfg.color }} />
                    </div>
                    {selectedCall.contactName}
                  </DialogTitle>
                </DialogHeader>

                <div className="mt-2 space-y-4 max-h-[70vh] overflow-y-auto pr-1">

                  {/* Call metadata grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl p-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <User className="w-3 h-3" style={{ color: '#94a3b8' }} />
                        <p className="font-mono text-[10px] uppercase tracking-wide" style={{ color: '#94a3b8' }}>Contact</p>
                      </div>
                      <p className="font-inter text-sm font-medium" style={{ color: '#1e293b' }}>{selectedCall.contactPerson !== 'N/A' ? selectedCall.contactPerson : '—'}</p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Hash className="w-3 h-3" style={{ color: '#94a3b8' }} />
                        <p className="font-mono text-[10px] uppercase tracking-wide" style={{ color: '#94a3b8' }}>Number</p>
                      </div>
                      <p className="font-mono text-sm" style={{ color: '#1e293b' }}>{selectedCall.phone}</p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <ShoppingBag className="w-3 h-3" style={{ color: '#94a3b8' }} />
                        <p className="font-mono text-[10px] uppercase tracking-wide" style={{ color: '#94a3b8' }}>Order</p>
                      </div>
                      <p className="font-mono text-sm" style={{ color: '#0ea5e9' }}>{selectedCall.orderId}</p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Calendar className="w-3 h-3" style={{ color: '#94a3b8' }} />
                        <p className="font-mono text-[10px] uppercase tracking-wide" style={{ color: '#94a3b8' }}>Date & Time</p>
                      </div>
                      <p className="font-inter text-sm" style={{ color: '#1e293b' }}>{selectedCall.date} · {selectedCall.time}</p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Clock className="w-3 h-3" style={{ color: '#94a3b8' }} />
                        <p className="font-mono text-[10px] uppercase tracking-wide" style={{ color: '#94a3b8' }}>Duration</p>
                      </div>
                      <p className="font-mono text-sm" style={{ color: '#1e293b' }}>{selectedCall.duration === '0m 0s' ? 'N/A' : selectedCall.duration}</p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: cfg.dot === '#22c55e' ? '#f0fdf4' : cfg.dot === '#f59e0b' ? '#fffbeb' : '#fef2f2', border: `1px solid ${cfg.dot === '#22c55e' ? '#bbf7d0' : cfg.dot === '#f59e0b' ? '#fde68a' : '#fecaca'}` }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <StatusIcon className="w-3 h-3" style={{ color: cfg.color }} />
                        <p className="font-mono text-[10px] uppercase tracking-wide" style={{ color: '#94a3b8' }}>Outcome</p>
                      </div>
                      <p className="font-inter text-xs font-medium leading-tight" style={{ color: cfg.color }}>{selectedCall.outcome}</p>
                    </div>
                  </div>

                  {/* Transcript */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="w-4 h-4" style={{ color: '#64748b' }} />
                      <h3 className="font-sora font-semibold text-sm" style={{ color: '#1e293b' }}>Call Transcript</h3>
                    </div>

                    <div
                      className="rounded-xl overflow-hidden flex flex-col gap-0"
                      style={{ border: '1px solid #e2e8f0' }}
                    >
                      {selectedCall.transcript.map((line, idx) => (
                        <div
                          key={idx}
                          className="flex gap-3 px-4 py-3"
                          style={{
                            background: line.speaker === 'Agent' ? '#f8fafc' : '#ffffff',
                            borderTop: idx > 0 ? '1px solid #f1f5f9' : 'none',
                          }}
                        >
                          <div className="flex-shrink-0 flex flex-col items-center gap-1 w-14">
                            <span
                              className="font-mono text-[9px] uppercase tracking-wide font-bold"
                              style={{ color: line.speaker === 'Agent' ? '#0ea5e9' : '#64748b' }}
                            >
                              {line.speaker}
                            </span>
                            {line.time && (
                              <span className="font-mono text-[9px]" style={{ color: '#cbd5e1' }}>{line.time.slice(6)}</span>
                            )}
                          </div>
                          <p className="font-inter text-xs leading-relaxed flex-1" style={{ color: '#334155' }}>
                            {line.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
