import React from 'react';
import { Loader2 } from 'lucide-react';
import HelpSwipeRails from './HelpSwipeRails';

export default function BrowseTab({
  activeCategory,
  loadingRequests,
  browseRequests,
  onQuickView,
  onPostNeed,
  onPostOffer,
}) {
  return (
    <>
      {loadingRequests ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      ) : activeCategory === 'rides' ? null : (
        <HelpSwipeRails
          requests={browseRequests}
          onPostNeed={onPostNeed}
          onPostOffer={onPostOffer}
          onOpen={onQuickView}
        />
      )}
    </>
  );
}
