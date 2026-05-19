import React from 'react';
import { Receipt, ShieldCheck, MessageSquareOff, BookOpen } from 'lucide-react';

const BASE_BENEFITS = [
  { Icon: Receipt,          text: 'Receipt saved in your account' },
  { Icon: ShieldCheck,      text: 'Easier refunds, disputes, and support' },
  { Icon: MessageSquareOff, text: 'No need to exchange payment handles' },
];

const ADMIN_BENEFIT = {
  Icon: BookOpen,
  text: 'Payment recorded for community records',
};

/**
 * Compact trust-benefits block shown near payment CTAs.
 *
 * Props:
 *   showAdminRecord  — include the community-record benefit line (for admin/organizer contexts)
 *   className        — extra Tailwind classes on the wrapper
 */
export default function PaymentTrustBenefits({ showAdminRecord = false, className = '' }) {
  const benefits = showAdminRecord ? [...BASE_BENEFITS, ADMIN_BENEFIT] : BASE_BENEFITS;

  return (
    <div className={`rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2.5 ${className}`}>
      <p className="mb-1.5 text-[10px] font-black uppercase tracking-wide text-blue-700">
        Pay securely in JUnited
      </p>
      <div className="space-y-1.5">
        {benefits.map(({ Icon, text }) => (
          <div key={text} className="flex items-center gap-2">
            <Icon className="h-3 w-3 shrink-0 text-blue-500" />
            <span className="text-[12px] font-semibold text-slate-600">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
