import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Baby,
  BookOpen,
  CheckCircle2,
  Clock3,
  Gift,
  HandHeart,
  Home,
  Loader2,
  MapPin,
  Package,
  Search,
  Send,
  ShoppingBag,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/lib/AuthContext';
import DestinationHeader from '@/components/layout/DestinationHeader';
import LiveNowRail from '@/components/common/LiveNowRail';
import MessageButton from '@/components/common/MessageButton';
import BookmarkButton from '@/components/feed/BookmarkButton';
import { buildMarketplaceLiveNowItems } from '@/lib/liveNow';
import { postsService } from '@/services/postsService';
import { updateUnifiedPost } from '@/services/entityServices';
import { uploadImage } from '@/lib/imageUpload';
import { MARKETPLACE_CATEGORIES, normalizeMarketplaceCategory, normalizePickupOption } from '@/lib/marketplaceTaxonomy';
import { postKeys } from '@/lib/queryKeys';

const sections = [
  { id: 'all', label: 'All' },
  { id: 'sale', label: 'For Sale' },
  { id: 'looking', label: 'Looking For' },
  { id: 'free', label: 'Free / Chesed' },
  { id: 'urgent', label: 'Urgent' },
];

const categories = MARKETPLACE_CATEGORIES;

const filters = [
  { id: 'nearby', label: 'Nearby' },
  { id: 'new', label: 'New' },
  { id: 'urgent', label: 'Urgent' },
  { id: 'free', label: 'Free' },
  { id: 'under50', label: 'Under $50' },
];

const urgencyStyles = {
  urgent: 'bg-red-50 text-red-700 ring-red-100',
  shabbos: 'bg-amber-50 text-amber-700 ring-amber-100',
  soon: 'bg-orange-50 text-orange-700 ring-orange-100',
  normal: 'bg-slate-100 text-slate-600 ring-slate-200',
  free: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
};

const categoryIcons = {
  Furniture: Home,
  'Baby / Kids gear': Baby,
  Clothing: Package,
  Judaica: Sparkles,
  'Books / school supplies': BookOpen,
  'Apartments / sublets': Home,
  'Food / Shabbos extras': Gift,
  Services: HandHeart,
  Electronics: Zap,
  Miscellaneous: ShoppingBag,
};

const categoryTones = {
  Furniture: 'from-amber-100 via-white to-orange-50',
  'Baby / Kids gear': 'from-sky-100 via-white to-blue-50',
  Clothing: 'from-violet-100 via-white to-purple-50',
  Judaica: 'from-blue-100 via-white to-indigo-50',
  'Books / school supplies': 'from-emerald-100 via-white to-teal-50',
  'Apartments / sublets': 'from-slate-100 via-white to-slate-50',
  'Food / Shabbos extras': 'from-rose-100 via-white to-pink-50',
  Services: 'from-teal-100 via-white to-emerald-50',
  Electronics: 'from-indigo-100 via-white to-blue-50',
  Miscellaneous: 'from-blue-200 via-white to-emerald-100',
};

const emptyForm = {
  mode: 'sale',
  title: '',
  price: '',
  category: 'Furniture',
  condition: 'Good',
  neighborhood: 'Woodmere',
  delivery: 'Pickup',
  urgency: 'normal',
  details: '',
};

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function isUnder50(listing) {
  const number = Number(String(listing.price || '').replace(/[^0-9.]/g, ''));
  return number > 0 && number < 50;
}

function urgencyLabelFor(listing) {
  if (listing.urgency === 'shabbos') return 'Before Shabbos';
  if (listing.urgency === 'urgent') return 'Need gone ASAP';
  if (listing.section === 'free' || listing.price === 'Free') return 'Free pickup';
  return 'Flexible';
}

// posts-table row (via toAppRow) → the listing shape this page renders.
function toListing(row) {
  const section = row.listing_section || (row.price === 'Free' ? 'free' : 'sale');
  const listing = {
    id: row.id,
    section,
    title: row.title || row.body || row.content || 'Untitled listing',
    price: row.price || (section === 'free' ? 'Free' : 'Make offer'),
    category: normalizeMarketplaceCategory(row.marketplace_category),
    condition: row.condition || '',
    neighborhood: row.location_text || row.city || 'Five Towns',
    delivery: normalizePickupOption(row.pickup_option),
    urgency: row.listing_urgency || 'normal',
    status: row.listing_status || 'available',
    details: row.body || row.content || '',
    seller: row.author_name || 'Community member',
    sellerId: row.user_id || row.author_user_id || null,
    posted: row.created_date
      ? formatDistanceToNow(new Date(row.created_date), { addSuffix: true })
      : '',
    createdDate: row.created_date || null,
    imageUrl: row.image_url || row.image_urls?.[0] || '',
    imageCount: row.image_urls?.length || (row.image_url ? 1 : 0),
    replies: row.comments_count || 0,
    photoTone: categoryTones[row.marketplace_category] || categoryTones.Miscellaneous,
  };
  listing.urgencyLabel = urgencyLabelFor(listing);
  return listing;
}

function MarketplacePhoto({ listing }) {
  const Icon = categoryIcons[listing.category] || ShoppingBag;
  return (
    <div className={classNames('relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br sm:h-28 sm:w-28', listing.photoTone)}>
      {listing.imageUrl ? (
        <img src={listing.imageUrl} alt={listing.title} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <Icon className="h-9 w-9 text-slate-700/65" strokeWidth={1.6} />
      )}
      {listing.imageCount > 1 && (
        <div className="absolute bottom-1.5 right-1.5 rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-black text-slate-600 shadow-sm">
          {listing.imageCount}
        </div>
      )}
      {listing.status === 'sold' && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/45">
          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-900">Sold</span>
        </div>
      )}
    </div>
  );
}

function ListingCard({ listing, currentUser, onOpen }) {
  const Icon = categoryIcons[listing.category] || ShoppingBag;
  return (
    <article
      onClick={() => onOpen(listing)}
      className="motion-card-enter cursor-pointer rounded-[18px] border border-slate-200 bg-white p-2.5 shadow-sm"
    >
      <div className="flex gap-3">
        <MarketplacePhoto listing={listing} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="line-clamp-2 text-[14px] font-black leading-4 text-slate-950">{listing.title}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <p className="text-[15px] font-black text-slate-950">{listing.price}</p>
                {listing.posted && <span className="text-[11px] font-bold text-slate-400">· {listing.posted}</span>}
              </div>
            </div>
            <div onClick={(event) => event.stopPropagation()}>
              <BookmarkButton postId={listing.id} currentUser={currentUser} />
            </div>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            <span className={classNames('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ring-1', urgencyStyles[listing.urgency] || urgencyStyles.normal)}>
              {listing.urgencyLabel}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-700 ring-1 ring-blue-100">
              <MapPin className="h-3 w-3" />
              {listing.neighborhood}
            </span>
          </div>

          <p className="mt-1.5 line-clamp-2 text-[12px] font-semibold leading-4 text-slate-600">{listing.details}</p>

          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="min-w-0 text-[11px] font-bold text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Icon className="h-3 w-3" />
                {listing.category}
              </span>
              <span className="mx-1">·</span>
              <span>{listing.seller}</span>
            </div>
            {listing.sellerId && listing.sellerId !== currentUser?.id && listing.status !== 'sold' && (
              <div onClick={(event) => event.stopPropagation()}>
                <MessageButton
                  recipientId={listing.sellerId}
                  recipientName={listing.seller}
                  postId={listing.id}
                  postTitle={listing.title}
                  postType="marketplace"
                  currentUser={currentUser}
                  variant="compact"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function ListingDetailSheet({ listing, currentUser, notFound, loadFailed, loading, onRetry, onClose, onSetStatus, updatingStatus }) {
  const [confirmSold, setConfirmSold] = useState(false);
  useEffect(() => {
    setConfirmSold(false);
  }, [listing?.id]);
  if (!listing && !notFound && !loadFailed && !loading) return null;
  const Icon = listing ? categoryIcons[listing.category] || ShoppingBag : ShoppingBag;
  const isOwner = listing && currentUser?.id && listing.sellerId === currentUser.id;

  const handleSoldClick = () => {
    if (!confirmSold) {
      setConfirmSold(true);
      return;
    }
    setConfirmSold(false);
    onSetStatus(listing, 'sold');
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end bg-slate-950/40 sm:items-center sm:justify-center sm:p-4" onClick={onClose}>
      <div
        onClick={(event) => event.stopPropagation()}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-[28px] bg-white p-4 shadow-2xl sm:max-w-lg sm:rounded-[28px]"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-black uppercase tracking-wide text-blue-600">JUnited Marketplace</p>
          <button onClick={onClose} aria-label="Close listing" className="motion-press flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-14">
            <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
          </div>
        ) : loadFailed ? (
          <div className="py-10 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-3 text-base font-black text-slate-900">Couldn't load this listing</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Check your connection and try again.</p>
            <button onClick={onRetry} className="motion-press mt-4 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white">
              Retry
            </button>
          </div>
        ) : notFound ? (
          <div className="py-10 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-3 text-base font-black text-slate-900">Listing not found</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">It may have been removed by the seller.</p>
          </div>
        ) : (
          <>
            <div className={classNames('mt-3 flex h-48 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br', listing.photoTone)}>
              {listing.imageUrl ? (
                <img src={listing.imageUrl} alt={listing.title} className="h-full w-full object-cover" />
              ) : (
                <Icon className="h-14 w-14 text-slate-700/50" strokeWidth={1.4} />
              )}
            </div>

            <div className="mt-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xl font-black leading-6 text-slate-950">{listing.title}</h2>
                <p className="mt-1 text-lg font-black text-slate-950">{listing.price}</p>
              </div>
              <div className="shrink-0 pt-1">
                <BookmarkButton postId={listing.id} currentUser={currentUser} />
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {listing.status === 'sold' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white">Sold</span>
              )}
              <span className={classNames('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black ring-1', urgencyStyles[listing.urgency] || urgencyStyles.normal)}>
                {listing.urgencyLabel}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-700 ring-1 ring-blue-100">
                <MapPin className="h-3 w-3" />
                {listing.neighborhood}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600 ring-1 ring-slate-200">
                <Icon className="h-3 w-3" />
                {listing.category}
              </span>
              {listing.condition && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600 ring-1 ring-slate-200">
                  {listing.condition}
                </span>
              )}
              {listing.delivery && (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700 ring-1 ring-emerald-100">
                  {listing.delivery}
                </span>
              )}
            </div>

            {listing.details && (
              <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-600">{listing.details}</p>
            )}

            <div className="mt-4 flex items-center justify-between gap-2 rounded-2xl bg-slate-50 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-900">{listing.seller}</p>
                {listing.posted && <p className="text-[11px] font-bold text-slate-400">Posted {listing.posted}</p>}
              </div>
              {!isOwner && listing.sellerId && listing.status !== 'sold' && (
                <MessageButton
                  recipientId={listing.sellerId}
                  recipientName={listing.seller}
                  postId={listing.id}
                  postTitle={listing.title}
                  postType="marketplace"
                  currentUser={currentUser}
                />
              )}
            </div>

            {isOwner && listing.status !== 'sold' && (
              <button
                onClick={handleSoldClick}
                disabled={updatingStatus}
                className={classNames(
                  'motion-press mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-black text-white disabled:opacity-60',
                  confirmSold ? 'bg-emerald-600' : 'bg-blue-600',
                )}
              >
                {updatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {confirmSold ? 'Tap again to confirm sold' : 'Mark as sold'}
              </button>
            )}
            {isOwner && listing.status === 'sold' && (
              <button
                onClick={() => onSetStatus(listing, 'available')}
                disabled={updatingStatus}
                className="motion-press mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 text-sm font-black text-slate-700 ring-1 ring-slate-200 disabled:opacity-60"
              >
                {updatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Mark as available again
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PostListingModal({ open, initialMode, onClose, onCreate, creating }) {
  const [form, setForm] = useState(emptyForm);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const fileInputRef = useRef(null);
  useEffect(() => {
    if (open && initialMode) {
      setForm((current) => ({ ...current, mode: initialMode }));
    }
  }, [open, initialMode]);
  if (!open) return null;

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const selectMode = (value) => {
    setForm((current) => ({
      ...current,
      mode: value,
      // keep the urgency chips in sync with what actually gets saved
      urgency: value === 'urgent' ? 'urgent' : current.urgency,
    }));
  };

  const pickPhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
  };

  const submit = () => {
    if (!form.title.trim()) {
      toast.error('Add a title first');
      return;
    }
    onCreate({ form, photoFile }, () => {
      setForm(emptyForm);
      setPhotoFile(null);
      setPhotoPreview((current) => {
        if (current) URL.revokeObjectURL(current);
        return '';
      });
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end bg-slate-950/40 sm:items-center sm:justify-center sm:p-4">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[28px] bg-white p-4 shadow-2xl sm:max-w-lg sm:rounded-[28px]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wide text-blue-600">JUnited Marketplace</p>
            <h2 className="text-xl font-black text-slate-950">Post a listing</h2>
          </div>
          <button onClick={onClose} aria-label="Close post form" className="motion-press flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {[
            ['sale', 'For Sale'],
            ['looking', 'Looking For'],
            ['free', 'Free / Chesed'],
            ['urgent', 'Urgent'],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => selectMode(value)}
              className={classNames('motion-press rounded-2xl border px-3 py-3 text-left text-sm font-black', form.mode === value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-50 text-slate-600')}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          <input
            value={form.title}
            onChange={(event) => update('title', event.target.value)}
            placeholder={form.mode === 'looking' ? 'What are you looking for?' : 'What are you posting?'}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-blue-400 focus:bg-white"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={form.price}
              onChange={(event) => update('price', event.target.value)}
              placeholder={form.mode === 'free' ? 'Free' : 'Price'}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-blue-400 focus:bg-white"
            />
            <select value={form.category} onChange={(event) => update('category', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none focus:border-blue-400 focus:bg-white">
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select value={form.condition} onChange={(event) => update('condition', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none focus:border-blue-400 focus:bg-white">
              {['New', 'Like new', 'Very good', 'Good', 'Used', 'Any usable condition'].map((item) => <option key={item}>{item}</option>)}
            </select>
            <select value={form.neighborhood} onChange={(event) => update('neighborhood', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none focus:border-blue-400 focus:bg-white">
              {['Woodmere', 'Cedarhurst', 'Lawrence', 'Hewlett', 'Inwood', 'Five Towns'].map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <select value={form.delivery} onChange={(event) => update('delivery', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none focus:border-blue-400 focus:bg-white">
            {['Pickup', 'Pickup today', 'Delivery possible', 'Meet locally', 'Tour by appointment'].map((item) => <option key={item}>{item}</option>)}
          </select>
          <div className="grid grid-cols-3 gap-2">
            {[
              ['urgent', 'Urgent'],
              ['shabbos', 'Before Shabbos'],
              ['normal', 'Flexible'],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => update('urgency', value)}
                className={classNames('motion-press rounded-2xl px-3 py-2 text-[12px] font-black ring-1', form.urgency === value ? urgencyStyles[value] : 'bg-slate-50 text-slate-500 ring-slate-200')}
              >
                {label}
              </button>
            ))}
          </div>
          <textarea
            value={form.details}
            onChange={(event) => update('details', event.target.value)}
            placeholder="Details, pickup notes, mutual community context..."
            rows={4}
            className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-400 focus:bg-white"
          />
          <input ref={fileInputRef} type="file" accept="image/*" onChange={pickPhoto} className="hidden" />
          {photoPreview ? (
            <div className="relative overflow-hidden rounded-2xl border border-slate-200">
              <img src={photoPreview} alt="Listing preview" className="h-40 w-full object-cover" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="motion-press absolute bottom-2 right-2 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-black text-slate-700 shadow-sm"
              >
                Change photo
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="motion-press flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm font-black text-slate-500"
            >
              <Package className="h-4 w-4" />
              Add a photo
            </button>
          )}
        </div>

        <button
          onClick={submit}
          disabled={creating}
          className="motion-press mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-500/20 disabled:opacity-60"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {creating ? 'Posting…' : 'Post to JUnited Marketplace'}
        </button>
      </div>
    </div>
  );
}

export default function Marketplace() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState('all');
  const [category, setCategory] = useState('All');
  const [activeFilters, setActiveFilters] = useState(new Set());
  const [query, setQuery] = useState('');
  const [showPost, setShowPost] = useState(false);
  const [postInitialMode, setPostInitialMode] = useState('sale');

  const openPostModal = (mode = 'sale') => {
    setPostInitialMode(mode);
    setShowPost(true);
  };

  const listingParam = searchParams.get('listing');

  const { data: rows = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['marketplace-listings'],
    queryFn: () => postsService.filterPosts({ activity_kind: 'marketplace_listing' }, '-created_date', 100),
  });

  const listings = useMemo(
    () => rows.filter((row) => (row.listing_status || 'available') !== 'closed').map(toListing),
    [rows],
  );

  // Deep link (?listing=<posts.id>) from Search, notifications, and Live Now.
  const listingFromPage = listingParam ? listings.find((item) => item.id === listingParam) : null;
  const { data: deepRow, error: deepError, isError: deepLinkFailed, isLoading: deepLinkLoading, refetch: refetchDeepLink } = useQuery({
    queryKey: ['marketplace-listing', listingParam],
    queryFn: () => postsService.getPost(listingParam),
    enabled: Boolean(listingParam) && !listingFromPage,
    retry: 1,
  });
  const deepListing = deepRow && (deepRow.activity_kind === 'marketplace_listing' || deepRow.type === 'marketplace')
    ? toListing(deepRow)
    : null;
  const detailListing = listingFromPage || deepListing;
  // PGRST116 = zero rows from .single(); anything else is a transient failure,
  // not evidence the listing was removed.
  const rowIsMissing = deepError?.code === 'PGRST116' || /PGRST116|no rows/i.test(deepError?.message || '');
  const detailLoading = Boolean(listingParam) && !detailListing && deepLinkLoading;
  const detailNotFound = Boolean(listingParam) && !detailListing && !deepLinkLoading
    && ((deepLinkFailed && rowIsMissing) || Boolean(deepRow && !deepListing));
  const detailError = Boolean(listingParam) && !detailListing && !deepLinkLoading
    && deepLinkFailed && !rowIsMissing;

  const closeDetail = () => {
    setSearchParams({}, { replace: true });
  };

  const createMutation = useMutation({
    mutationFn: async ({ form, photoFile }) => {
      let imageUrl = '';
      if (photoFile) {
        try {
          const { url } = await uploadImage(photoFile);
          imageUrl = url || '';
        } catch {
          throw new Error('PHOTO_UPLOAD_FAILED');
        }
      }
      const payload = {
        title: form.title.trim(),
        body: form.details || '',
        price: form.mode === 'free' ? 'Free' : (form.price || 'Make offer'),
        marketplace_category: form.category,
        condition: form.condition,
        location_text: form.neighborhood,
        pickup_option: form.delivery,
        listing_urgency: form.mode === 'urgent' ? 'urgent' : form.urgency,
        listing_section: form.mode === 'urgent' ? 'sale' : form.mode,
        listing_status: 'available',
        user_id: user.id,
        author_name: user.display_name || user.full_name || '',
      };
      if (user.avatar_url) payload.author_avatar_url = user.avatar_url;
      if (imageUrl) {
        payload.image_url = imageUrl;
        payload.image_urls = [imageUrl];
      }
      return postsService.createMarketplaceListing(payload);
    },
    onSuccess: () => {
      toast.success('Listing posted');
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
      queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
    onError: (error) => {
      toast.error(error?.message === 'PHOTO_UPLOAD_FAILED'
        ? 'Photo upload failed — try a smaller image, or remove it and post again. Your draft is saved.'
        : 'Could not post listing. Please try again.');
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ listing, status }) => updateUnifiedPost(listing.id, { listing_status: status }),
    onSuccess: (_data, { status }) => {
      toast.success(status === 'sold' ? 'Marked as sold' : 'Listing is available again');
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-listing'] });
      queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
  });

  const handleCreate = (data, onDone) => {
    if (!user?.id || user.id === 'guest') {
      toast.error('Please log in to post a listing');
      return;
    }
    createMutation.mutate(data, { onSuccess: () => onDone?.() });
  };

  const filteredListings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return listings.filter((listing) => {
      if (activeSection !== 'all') {
        if (activeSection === 'urgent' && !['urgent', 'shabbos', 'soon'].includes(listing.urgency)) return false;
        if (activeSection !== 'urgent' && listing.section !== activeSection) return false;
      }
      if (category !== 'All' && listing.category !== category) return false;
      if (activeFilters.has('urgent') && !['urgent', 'shabbos', 'soon'].includes(listing.urgency)) return false;
      if (activeFilters.has('free') && listing.price !== 'Free' && listing.section !== 'free') return false;
      if (activeFilters.has('under50') && !isUnder50(listing)) return false;
      if (normalizedQuery) {
        const haystack = `${listing.title} ${listing.category} ${listing.neighborhood} ${listing.seller} ${listing.details}`.toLowerCase();
        if (!haystack.includes(normalizedQuery)) return false;
      }
      return true;
    });
  }, [activeFilters, activeSection, category, listings, query]);

  const liveNowItems = useMemo(() => buildMarketplaceLiveNowItems({
    listings: filteredListings.filter((listing) => listing.status === 'available'),
  }), [filteredListings]);

  const listingStats = useMemo(() => {
    const available = listings.filter((listing) => listing.status === 'available');
    const stats = [
      [available.length, 'listings'],
      [available.filter((listing) => listing.price === 'Free' || listing.section === 'free').length, 'free items'],
      [available.filter((listing) => ['urgent', 'shabbos', 'soon'].includes(listing.urgency)).length, 'urgent'],
    ];
    return stats.filter(([value]) => value > 0);
  }, [listings]);

  const toggleFilter = (id) => {
    setActiveFilters((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openListing = (listing) => {
    // push (not replace) so hardware/browser Back closes the sheet
    setSearchParams({ listing: listing.id });
  };

  return (
    <main className="min-h-screen bg-[#F6F8FB] pb-28">
      <DestinationHeader
        showBack
        icon={ShoppingBag}
        title="Marketplace"
        actions={(
          <button
            onClick={() => openPostModal('sale')}
            className="motion-press flex shrink-0 items-center gap-1.5 rounded-full bg-blue-600 px-3.5 py-2 text-[12px] font-bold text-white"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Post
          </button>
        )}
      />
      <section className="mobile-page px-3">
        {listingStats.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {listingStats.map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <p className="text-lg font-black text-slate-950">{value}</p>
                <p className="text-[11px] font-bold text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        )}

        <LiveNowRail
          className="mt-3"
          title="Marketplace live"
          subtitle="Need-gone-soon, free, and pickup-today listings"
          items={liveNowItems}
          onItemClick={(item) => navigate(item.href || '/Marketplace')}
        />

        <div className="sticky top-0 z-20 -mx-3 mt-3 border-y border-slate-200 bg-[#F6F8FB]/95 px-3 py-3 backdrop-blur">
          <label className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 shadow-sm">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search crib, seforim, sublet, chairs..."
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
            />
          </label>

          <div className="mobile-scroll-x mt-3 flex gap-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={classNames('motion-press shrink-0 rounded-full px-4 py-2 text-[13px] font-black ring-1', activeSection === section.id ? 'bg-blue-600 text-white ring-blue-600' : 'bg-white text-slate-600 ring-slate-200')}
              >
                {section.label}
              </button>
            ))}
          </div>

          <div className="mobile-scroll-x mt-2 flex gap-2">
            {['All', ...categories].map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={classNames('motion-press shrink-0 rounded-full px-3 py-1.5 text-[12px] font-black ring-1', category === item ? 'bg-blue-600 text-white ring-blue-600' : 'bg-white text-slate-600 ring-slate-200')}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => toggleFilter(filter.id)}
                className={classNames('motion-press inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-black ring-1', activeFilters.has(filter.id) ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : 'bg-white text-slate-500 ring-slate-200')}
              >
                {filter.label}
                {filter.id === 'nearby' && <MapPin className="h-3 w-3" />}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 rounded-[22px] border border-amber-100 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-700">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-950">Before Shabbos</p>
              <p className="mt-1 text-[13px] font-semibold leading-5 text-slate-600">
                Free food, last-minute pickup, and need-gone-soon listings are highlighted in Marketplace Live above.
              </p>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="mt-3 space-y-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-32 animate-pulse rounded-[18px] border border-slate-200 bg-white" />
            ))}
          </div>
        )}

        {isError && !isLoading && (
          <div className="mt-6 rounded-[24px] border border-dashed border-slate-300 bg-white p-8 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-3 text-base font-black text-slate-900">Couldn't load listings</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Check your connection and try again.</p>
            <button onClick={() => refetch()} className="motion-press mt-4 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white">
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="mt-3 space-y-3">
            {filteredListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                currentUser={user}
                onOpen={openListing}
              />
            ))}
          </div>
        )}

        {!isLoading && !isError && filteredListings.length === 0 && (
          <div className="mt-6 rounded-[24px] border border-dashed border-slate-300 bg-white p-8 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-3 text-base font-black text-slate-900">
              {listings.length === 0 ? 'No listings yet' : 'Nothing matches yet'}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {listings.length === 0 ? 'Be the first to post something useful for the neighborhood.' : 'Try a different category or post what you are looking for.'}
            </p>
            <button onClick={() => openPostModal('looking')} className="motion-press mt-4 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white">
              Post Looking For
            </button>
          </div>
        )}
      </section>

      <PostListingModal
        open={showPost}
        initialMode={postInitialMode}
        onClose={() => setShowPost(false)}
        onCreate={handleCreate}
        creating={createMutation.isPending}
      />

      {listingParam && (
        <ListingDetailSheet
          listing={detailListing}
          currentUser={user}
          notFound={detailNotFound}
          loadFailed={detailError}
          loading={detailLoading}
          onRetry={() => refetchDeepLink()}
          onClose={closeDetail}
          onSetStatus={(listing, status) => statusMutation.mutate({ listing, status })}
          updatingStatus={statusMutation.isPending}
        />
      )}
    </main>
  );
}
