import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Star, MapPin, Phone, Globe, ArrowLeft, Loader2, Shield, ChevronRight, Utensils, BookOpen, ShoppingBag, GraduationCap, Droplets, Package } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const CATEGORIES = [
  { key: 'all', label: 'All', icon: null },
  { key: 'restaurant', label: 'Restaurants', icon: Utensils },
  { key: 'grocery', label: 'Grocery', icon: ShoppingBag },
  { key: 'bakery', label: 'Bakery', icon: Package },
  { key: 'mikvah', label: 'Mikvaos', icon: Droplets },
  { key: 'judaica', label: 'Judaica', icon: BookOpen },
  { key: 'tutor', label: 'Tutors', icon: GraduationCap },
  { key: 'other', label: 'Other', icon: Package },
];

function StarRating({ rating, count }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(n => (
        <Star key={n} className={`w-3 h-3 ${n <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
      ))}
      {count > 0 && <span className="text-[11px] text-slate-500 ml-0.5">({count})</span>}
    </div>
  );
}

function BusinessCard({ listing, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer"
    >
      {listing.cover_image_url && (
        <img src={listing.cover_image_url} alt={listing.name} className="w-full h-32 object-cover" />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-slate-900 text-[15px] truncate">{listing.name}</h3>
              {listing.plan === 'premium' && (
                <Shield className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
              )}
            </div>
            {listing.tagline && (
              <p className="text-[12px] text-slate-500 truncate">{listing.tagline}</p>
            )}
          </div>
          {listing.logo_url && (
            <img src={listing.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover ml-2 flex-shrink-0" />
          )}
        </div>

        {listing.rating_avg > 0 && (
          <div className="my-1.5">
            <StarRating rating={listing.rating_avg} count={listing.review_count} />
          </div>
        )}

        <div className="space-y-1 mt-2">
          {listing.address && (
            <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{listing.address}</span>
            </div>
          )}
          {listing.kosher_cert && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-[11px] font-semibold">
              ✡ {listing.kosher_cert}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BusinessDirectory() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['business-listings', category],
    queryFn: () =>
      category === 'all'
        ? base44.entities.BusinessListing.filter({ is_active: true }, '-created_date', 50)
        : base44.entities.BusinessListing.filter({ is_active: true, category }, '-created_date', 50),
    staleTime: 60000,
  });

  const filtered = listings.filter(l =>
    !search || l.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.tagline?.toLowerCase().includes(search.toLowerCase()) ||
    l.city?.toLowerCase().includes(search.toLowerCase())
  );

  // Sort: premium first
  const sorted = [...filtered].sort((a, b) => {
    if (a.plan === 'premium' && b.plan !== 'premium') return -1;
    if (b.plan === 'premium' && a.plan !== 'premium') return 1;
    return 0;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <span className="font-bold text-slate-900 flex-1">Kosher Business Directory</span>
          <button
            onClick={() => navigate('/CreateBusinessListing')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-600 text-white text-[12px] font-bold"
          >
            <Plus className="w-3.5 h-3.5" /> List Business
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search businesses…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-4">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all ${
                category === cat.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              {cat.icon && <cat.icon className="w-3.5 h-3.5" />}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
            <div className="text-4xl mb-2">🏪</div>
            <p className="font-bold text-slate-700">No listings yet in this category</p>
            <p className="text-sm text-slate-400 mt-1 mb-4">Be the first to add your business!</p>
            <button
              onClick={() => navigate('/CreateBusinessListing')}
              className="px-5 py-2 rounded-full bg-blue-600 text-white text-sm font-bold"
            >
              Add Business
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {sorted.map(listing => (
              <BusinessCard
                key={listing.id}
                listing={listing}
                onClick={() => navigate(`/BusinessListing?id=${listing.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}