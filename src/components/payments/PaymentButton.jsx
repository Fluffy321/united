import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DonationModal from './DonationModal';

export default function PaymentButton() {
  const [showDonation, setShowDonation] = useState(false);

  return (
    <>
      <Button
        onClick={() => setShowDonation(true)}
        className="bg-red-500 hover:bg-red-600 text-white gap-2 font-semibold"
      >
        <Heart className="w-4 h-4 fill-current" />
        Support Community
      </Button>
      <DonationModal open={showDonation} onOpenChange={setShowDonation} />
    </>
  );
}