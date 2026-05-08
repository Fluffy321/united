import { useState } from 'react';
import { CreditCard } from 'lucide-react';
import PaymentModal from '@/components/payments/PaymentModal';
import { StatusBadge } from '@/components/common/FeatureStatusNotice';

export default function CommunityPaymentButton({ community }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-[13px] font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
      >
        <CreditCard className="h-3.5 w-3.5" />
        Pay / Donate
        <StatusBadge className="ml-1">Soon</StatusBadge>
      </button>

      <PaymentModal
        open={open}
        onOpenChange={setOpen}
        type="service_payment"
        defaultAmount={36}
        description={`Support ${community?.name || 'this community'}`}
        relatedEntityId={community?.id}
        relatedEntityType="Community"
      />
    </>
  );
}
