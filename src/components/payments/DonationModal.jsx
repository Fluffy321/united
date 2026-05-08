import PaymentModal from './PaymentModal';

export default function DonationModal({ open, onOpenChange }) {
  return (
    <PaymentModal
      open={open}
      onOpenChange={onOpenChange}
      type="donation"
      defaultAmount={25}
    />
  );
}
