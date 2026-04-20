import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import {
  PhoneCall, PhoneOff, PhoneMissed,
  Clock, User, Hash, Calendar,
  Timer, ShoppingBag, MessageSquare,
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
    duration: '0m 45s',
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
  completed:  { label: 'Completed',  dot: '#10b981', color: '#166534', bg: '#f0fdf4', bo: '#bbf7d0', icon: PhoneCall },
  'no-answer':{ label: 'No Answer',  dot: '#f59e0b', color: '#92400e', bg: '#fffbeb', bo: '#fde68a', icon: PhoneMissed },
  failed:     { label: 'Failed',     dot: '#ef4444', color: '#991b1b', bg: '#fef2f2', bo: '#fecaca', icon: PhoneOff },
};

export default function OutboundCalls() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.call-card',
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.07, ease: 'power2.out' }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const completedCount = callLogs.filter(c => c.status === 'completed').length;
  const failedCount    = callLogs.filter(c => c.status !== 'completed').length;
  const totalSecs      = callLogs.reduce((s, c) => {
    const parts = c.duration.replace('m', '').replace('s', '').trim().split(' ');
    return s + (parseInt(parts[0] ?? '0') * 60) + parseInt(parts[1] ?? '0');
  }, 0);
  const avgMins = Math.floor(totalSecs / callLogs.length / 60);
  const avgSecs = Math.floor((totalSecs / callLogs.length) % 60);

  return (
    <div
      ref={sectionRef}
      className="w-full min-h-screen overflow-y-auto"
      style={{ background: '#f8fafc', paddingBottom: '48px' }}
    >
      <div className="max-w-[700px] mx-auto px-6 py-6">

        {/* Header */}
        <div className="mb-5 flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-sora font-bold text-2xl" style={{ color: '#1e293b' }}>Outbound Calls</h1>
            <p className="font-inter text-sm mt-0.5" style={{ color: '#94a3b8' }}>
              Automated call agent · Click any call to view transcript
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: '#10b981' }} />
              <span className="font-mono text-xs font-medium" style={{ color: '#166534' }}>{completedCount} completed</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: '#ef4444' }} />
              <span className="font-mono text-xs font-medium" style={{ color: '#dc2626' }}>{failedCount} issues</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <Timer className="w-3.5 h-3.5" style={{ color: '#64748b' }} />
              <span className="font-mono text-xs" style={{ color: '#64748b' }}>Avg {avgMins}m {avgSecs}s</span>
            </div>
          </div>
        </div>

        {/* Call cards — single vertical column */}
        <div className="space-y-3">
          {callLogs.map(call => {
            const cfg = statusConfig[call.status];
            const StatusIcon = cfg.icon;
            return (
              <div
                key={call.id}
                className="call-card rounded-2xl cursor-pointer hover:shadow-md transition-all duration-200 group"
                style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                onClick={() => { setSelectedCall(call); setDialogOpen(true); }}
              >
                {/* Top row — date/time + status badge */}
                <div className="px-5 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: '1px solid #f8fafc' }}>
                  <div className="flex items-center gap-3">
                    {/* Status icon circle */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.bo}` }}>
                      <StatusIcon className="w-5 h-5" style={{ color: cfg.color }} />
                    </div>
                    {/* Date + time */}
                    <div>
                      <p className="font-sora font-semibold text-sm" style={{ color: '#1e293b' }}>{call.date}</p>
                      <p className="font-mono text-xs" style={{ color: '#94a3b8' }}>{call.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-2.5 py-1 rounded-full" style={{ background: cfg.bg, border: `1px solid ${cfg.bo}` }}>
                      <span className="font-sora text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                    </div>
                    <span className="font-mono text-xs" style={{ color: '#94a3b8' }}>{call.duration === '0m 0s' ? '—' : call.duration}</span>
                  </div>
                </div>

                {/* Main info */}
                <div className="px-5 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-sora font-bold text-base group-hover:text-sky-600 transition-colors" style={{ color: '#1e293b' }}>
                        {call.contactName}
                      </p>
                      {call.contactPerson !== 'N/A' && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <User className="w-3 h-3" style={{ color: '#94a3b8' }} />
                          <p className="font-inter text-sm" style={{ color: '#64748b' }}>{call.contactPerson}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 mt-1">
                        <Hash className="w-3 h-3" style={{ color: '#94a3b8' }} />
                        <p className="font-mono text-sm" style={{ color: '#64748b' }}>{call.phone}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-mono text-xs font-semibold" style={{ color: '#0ea5e9' }}>{call.orderId}</p>
                      <p className="font-inter text-xs mt-1" style={{ color: '#94a3b8' }}>Order ref</p>
                    </div>
                  </div>

                  {/* Outcome */}
                  <div className="mt-3 px-3 py-2 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <p className="font-inter text-xs" style={{ color: '#334155' }}>
                      <span className="font-semibold" style={{ color: '#94a3b8' }}>Outcome: </span>
                      {call.outcome}
                    </p>
                  </div>
                </div>

                {/* Footer hint */}
                <div className="px-5 py-2.5 flex items-center gap-2" style={{ borderTop: '1px solid #f8fafc' }}>
                  <MessageSquare className="w-3.5 h-3.5" style={{ color: '#cbd5e1' }} />
                  <span className="font-inter text-xs" style={{ color: '#94a3b8' }}>
                    {call.transcript.length} transcript line{call.transcript.length !== 1 ? 's' : ''} · Click to view
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Call Detail Dialog — centred, scrollable, no header overlap ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="max-w-2xl"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {selectedCall && (() => {
            const cfg = statusConfig[selectedCall.status];
            const StatusIcon = cfg.icon;
            return (
              <>
                {/* Fixed header */}
                <DialogHeader className="flex-shrink-0 pb-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <DialogTitle className="font-sora font-bold text-lg flex items-center gap-3" style={{ color: '#1e293b' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.bo}` }}>
                      <StatusIcon className="w-5 h-5" style={{ color: cfg.color }} />
                    </div>
                    {selectedCall.contactName}
                  </DialogTitle>
                </DialogHeader>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto pt-4 space-y-4">

                  {/* Metadata grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { icon: User,      label: 'Contact',    value: selectedCall.contactPerson !== 'N/A' ? selectedCall.contactPerson : '—' },
                      { icon: Hash,      label: 'Number',     value: selectedCall.phone },
                      { icon: ShoppingBag, label: 'Order',   value: selectedCall.orderId },
                      { icon: Calendar,  label: 'Date',       value: `${selectedCall.date} · ${selectedCall.time}` },
                      { icon: Timer,     label: 'Duration',   value: selectedCall.duration === '0m 0s' ? 'N/A' : selectedCall.duration },
                      { icon: StatusIcon,label: 'Outcome',    value: selectedCall.outcome },
                    ].map(item => (
                      <div key={item.label} className="p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <item.icon className="w-3 h-3" style={{ color: '#94a3b8' }} />
                          <p className="font-mono text-[9px] uppercase tracking-wide" style={{ color: '#94a3b8' }}>{item.label}</p>
                        </div>
                        <p className="font-inter text-xs font-medium leading-snug" style={{ color: '#1e293b' }}>{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Transcript */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="w-4 h-4" style={{ color: '#64748b' }} />
                      <h3 className="font-sora font-semibold text-sm" style={{ color: '#1e293b' }}>Call Transcript</h3>
                      <span className="font-mono text-[10px]" style={{ color: '#94a3b8' }}>{selectedCall.transcript.length} lines</span>
                    </div>
                    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
                      {selectedCall.transcript.map((line, idx) => (
                        <div
                          key={idx}
                          className="flex gap-3 px-4 py-3"
                          style={{
                            background: line.speaker === 'Agent' ? '#f8fafc' : '#ffffff',
                            borderTop: idx > 0 ? '1px solid #f1f5f9' : 'none',
                          }}
                        >
                          <div className="flex-shrink-0 w-14">
                            <span
                              className="font-mono text-[9px] uppercase tracking-wide font-bold block"
                              style={{ color: line.speaker === 'Agent' ? '#0ea5e9' : '#64748b' }}
                            >
                              {line.speaker}
                            </span>
                            {line.time && (
                              <span className="font-mono text-[9px] block mt-0.5" style={{ color: '#cbd5e1' }}>
                                {line.time.slice(6)}
                              </span>
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
