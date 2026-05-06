import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Phone, Globe, Clock, Loader2, Shield, ExternalLink, Sparkles } from 'lucide-react';
import { dataService, paymentsService } from '@/services';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" onClick={() => onChange?.(n)}>
          <Star className={`w-6 h-6 ${n <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="font-semibold text-slate-800 text-[13px]">{review.reviewer_name || 'Community Member'}</span>
        <div className="flex">
          {[1,2,3,4,5].map(n => (
            <Star key={n} className={`w-3 h-3 ${n <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
          ))}
        </div>
      </div>
      {review.body && <p className="text-[13px] text-slate-600">{review.body}</p>}
    </div>
  );
}

export default function BusinessListingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const listingId = searchParams.get('id');
  const [currentUser, setCurrentUser] = useState(null);
  const [myRating, setMyRating] = useState(0);
  const [reviewBody, setReviewBody] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  useEffect(() => {
    dataService.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: listing, refetch: refetchListing } = useQuery({
    queryKey: ['business-listing', listingId],
    queryFn: () => dataService.entities.BusinessListing.get(listingId),
    enabled: !!listingId,
  });

  const { data: reviews = [], refetch: refetchReviews } = useQuery({
    queryKey: ['business-reviews', listingId],
    queryFn: () => dataService.entities.BusinessReview.filter({ business_id: listingId }, '-created_date', 20),
    enabled: !!listingId,
  });

  const isOwner = currentUser && listing && currentUser.id === listing.owner_id;
  const isPremium = listing?.plan === 'premium';

  const handleSubmitReview = async () => {
    if (!currentUser) { dataService.auth.redirectToLogin(); return; }
    if (myRating === 0) { toast.error('Please select a star rating'); return; }
    setSubmittingReview(true);
    try {
      await dataService.entities.BusinessReview.create({
        business_id: listingId,
        reviewer_id: currentUser.id,
        reviewer_name: currentUser.display_name || currentUser.full_name?.split(' ')[0] || 'Community Member',
        rating: myRating,
        body: reviewBody.trim() || undefined,
      });
      // Update average
      const newCount = (listing.review_count || 0) + 1;
      const newAvg = ((listing.rating_avg || 0) * (listing.review_count || 0) + myRating) / newCount;
      await dataService.entities.BusinessListing.update(listingId, {
        rating_avg: Math.round(newAvg * 10) / 10,
        review_count: newCount,
      });
      setMyRating(0); setReviewBody('');
      toast.success('Review submitted!');
      refetchReviews();
      refetchListing();
    } catch (e) {
      toast.error('Could not submit review');
    }
    setSubmittingReview(false);
  };

  const handleUpgradeToPremium = async () => {
    toast.info('Business upgrades are coming soon. No money was processed.');
    return;

    if (!currentUser) { dataService.auth.redirectToLogin(); return; }
    setUpgradeLoading(true);
    try {
      const res = await paymentsService.createCheckout( {
        checkoutType: 'business_premium',
        billing: 'monthly',
        businessId: listingId,
        businessName: listing.name,
      });
      if (res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      } else {
        toast.error('Could not open checkout');
      }
    } catch (e) {
      toast.error('Checkout failed');
    }
    setUpgradeLoading(false);
  };

  if (!listing) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <span className="font-bold text-slate-900 flex-1 truncate">{listing.name}</span>
          {isPremium && <Shield className="w-4 h-4 text-blue-600" />}
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Cover */}
        {listing.cover_image_url ? (
          <img src={listing.cover_image_url} alt="" className="w-full h-44 object-cover" />
        ) : (
          <div className="w-full h-24 bg-gradient-to-r from-blue-500 to-indigo-500" />
        )}

        {/* Main card */}
        <div className="bg-white border-b border-slate-100 px-4 pb-5 pt-4">
          <div className="flex items-start gap-3">
            {listing.logo_url ? (
              <img src={listing.logo_url} alt="" className="w-14 h-14 rounded-xl object-cover border border-slate-200 flex-shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 text-2xl">
                🏪
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="font-bold text-[19px] text-slate-900">{listing.name}</h1>
                {isPremium && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                    ✓ Verified
                  </span>
                )}
              </div>
              {listing.tagline && <p className="text-[13px] text-slate-500">{listing.tagline}</p>}
              {listing.rating_avg > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  {[1,2,3,4,5].map(n => (
                    <Star key={n} className={`w-3.5 h-3.5 ${n <= Math.round(listing.rating_avg) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                  ))}
                  <span className="text-[12px] text-slate-500 ml-0.5">{listing.rating_avg} ({listing.review_count})</span>
                </div>
              )}
              {listing.kosher_cert && (
                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-[11px] font-semibold">
                  ✡ {listing.kosher_cert}
                </div>
              )}
            </div>
          </div>

          {listing.description && (
            <p className="mt-3 text-[14px] text-slate-700 leading-relaxed">{listing.description}</p>
          )}

          {/* Contact details */}
          <div className="mt-4 space-y-2">
            {listing.address && (
              <InfoRow icon={MapPin}>{listing.address}</InfoRow>
            )}
            {listing.hours && (
              <InfoRow icon={Clock}>{listing.hours}</InfoRow>
            )}
            {listing.phone && (
              <InfoRow icon={Phone}>
                <a href={`tel:${listing.phone}`} className="text-blue-600">{listing.phone}</a>
              </InfoRow>
            )}
            {listing.website && (
              <InfoRow icon={Globe}>
                <a href={listing.website} target="_blank" rel="noreferrer" className="text-blue-600 flex items-center gap-1">
                  {listing.website.replace(/^https?:\/\//, '')}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </InfoRow>
            )}
          </div>

          {/* Menu link (premium only) */}
          {listing.menu_url && isPremium && (
            <a
              href={listing.menu_url}
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-blue-200 text-blue-700 font-semibold text-[14px] bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              📋 View Menu
            </a>
          )}
        </div>

        {/* Premium photos (premium only) */}
        {isPremium && listing.photos?.length > 0 && (
          <div className="bg-white border-b border-slate-100 px-4 py-4">
            <p className="text-[13px] font-bold text-slate-700 mb-2">Photos</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {listing.photos.map((url, i) => (
                <img key={i} src={url} alt="" className="w-28 h-20 rounded-xl object-cover flex-shrink-0" />
              ))}
            </div>
          </div>
        )}

        {/* Owner: premium upsell */}
        {isOwner && !isPremium && (
          <div className="mx-4 my-4 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <p className="font-bold text-slate-900 text-[14px]">Upgrade to Premium</p>
            </div>
            <p className="text-[12px] text-slate-600 mb-3">
              Priority placement · Photo gallery · Menu link · Verified badge — $29/mo · Coming Soon
            </p>
            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-semibold text-amber-800">
              Premium checkout is not live yet. No money will be processed.
            </div>
            <button
              onClick={handleUpgradeToPremium}
              disabled
              className="w-full py-2.5 rounded-xl bg-slate-300 text-white font-bold text-[13px] flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              Premium Checkout Coming Soon
            </button>
          </div>
        )}

        {/* Reviews */}
        <div className="bg-white border-b border-slate-100 px-4 py-4 mt-2">
          <h2 className="font-bold text-slate-900 text-[15px] mb-3">
            Reviews {reviews.length > 0 && <span className="text-slate-400 font-normal text-[13px]">({reviews.length})</span>}
          </h2>

          {/* Write a review */}
          <div className="bg-slate-50 rounded-xl p-3 mb-4">
            <p className="text-[12px] font-bold text-slate-700 mb-2">Leave a Review</p>
            <StarRating value={myRating} onChange={setMyRating} />
            <textarea
              value={reviewBody}
              onChange={e => setReviewBody(e.target.value)}
              placeholder="Share your experience (optional)"
              className="mt-2 w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={2}
            />
            <button
              onClick={handleSubmitReview}
              disabled={submittingReview || myRating === 0}
              className="mt-2 px-4 py-1.5 rounded-full bg-blue-600 text-white text-[12px] font-bold disabled:opacity-50"
            >
              {submittingReview ? 'Submitting…' : 'Submit Review'}
            </button>
          </div>

          {reviews.length === 0 ? (
            <p className="text-[13px] text-slate-400 text-center py-4">No reviews yet. Be the first!</p>
          ) : (
            <div className="space-y-2">
              {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, children }) {
  return (
    <div className="flex items-start gap-2 text-[13px] text-slate-700">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
      <span>{children}</span>
    </div>
  );
}
