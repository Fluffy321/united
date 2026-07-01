import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Baby,
  BookOpen,
  ChevronDown,
  Clock3,
  Gift,
  HandHeart,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  Package,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import DestinationHeader from '@/components/layout/DestinationHeader';
import LiveNowRail from '@/components/common/LiveNowRail';
import { buildMarketplaceLiveNowItems } from '@/lib/liveNow';

const sections = [
  { id: 'all', label: 'All' },
  { id: 'sale', label: 'For Sale' },
  { id: 'looking', label: 'Looking For' },
  { id: 'free', label: 'Free / Chesed' },
  { id: 'urgent', label: 'Urgent' },
];

const categories = [
  'Furniture',
  'Baby / Kids gear',
  'Clothing',
  'Judaica',
  'Books / school supplies',
  'Apartments / sublets',
  'Food / Shabbos extras',
  'Services',
  'Electronics',
  'Miscellaneous',
];

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

const emptyForm = {
  mode: 'sale',
  title: '',
  price: '',
  category: 'Furniture',
  condition: 'Good',
  neighborhood: 'Woodmere',
  delivery: 'Pickup',
  urgency: 'normal',
  reason: 'Extra item',
  details: '',
};

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function isUnder50(listing) {
  const number = Number(String(listing.price || '').replace(/[^0-9.]/g, ''));
  return number > 0 && number < 50;
}

function MarketplacePhoto({ listing }) {
  const Icon = categoryIcons[listing.category] || ShoppingBag;
  return (
    <div className={classNames('relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br sm:h-28 sm:w-28', listing.photoTone)}>
      <Icon className="h-9 w-9 text-slate-700/65" strokeWidth={1.6} />
      <div className="absolute bottom-1.5 right-1.5 rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-black text-slate-600 shadow-sm">
        1
      </div>
    </div>
  );
}

function ListingCard({ listing, onQuickAction, onOpenMap }) {
  const Icon = categoryIcons[listing.category] || ShoppingBag;
  return (
    <article className="motion-card-enter rounded-[18px] border border-slate-200 bg-white p-2.5 shadow-sm">
      <div className="flex gap-3">
        <MarketplacePhoto listing={listing} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="line-clamp-2 text-[14px] font-black leading-4 text-slate-950">{listing.title}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <p className="text-[15px] font-black text-slate-950">{listing.price}</p>
                <span className="text-[11px] font-bold text-slate-400">· {listing.posted}</span>
              </div>
            </div>
            <button
              onClick={() => onQuickAction('Saved listing')}
              aria-label="Save listing"
              className="motion-press flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-500"
            >
              <Heart className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            <span className={classNames('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ring-1', urgencyStyles[listing.urgency] || urgencyStyles.normal)}>
              {listing.urgencyLabel}
            </span>
            <button
              onClick={() => onOpenMap(listing)}
              className="motion-press inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-700 ring-1 ring-blue-100"
            >
              <MapPin className="h-3 w-3" />
              {listing.neighborhood}
            </button>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700 ring-1 ring-emerald-100">
              <ShieldCheck className="h-3 w-3" />
              Trusted
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
              <span>{listing.interested} interested</span>
            </div>
            <button
              onClick={() => onQuickAction(`Messaging ${listing.seller}`)}
              className="motion-press inline-flex h-8 shrink-0 items-center gap-1 rounded-xl bg-slate-950 px-2.5 text-[11px] font-black text-white"
            >
              <MessageCircle className="h-3 w-3" />
              Message
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function PostListingModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState(emptyForm);
  if (!open) return null;

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = () => {
    if (!form.title.trim()) {
      toast.error('Add a title first');
      return;
    }
    onCreate(form);
    setForm(emptyForm);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end bg-slate-950/40 sm:items-center sm:justify-center sm:p-4">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[28px] bg-white p-4 shadow-2xl sm:max-w-lg sm:rounded-[28px]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wide text-blue-600">JUnited Marketplace</p>
            <h2 className="text-xl font-black text-slate-950">Post a listing</h2>
          </div>
          <button onClick={onClose} className="motion-press flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500">
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
              onClick={() => update('mode', value)}
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
          <div className="grid grid-cols-2 gap-2">
            <select value={form.delivery} onChange={(event) => update('delivery', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none focus:border-blue-400 focus:bg-white">
              {['Pickup', 'Pickup today', 'Delivery possible', 'Meet locally', 'Tour by appointment'].map((item) => <option key={item}>{item}</option>)}
            </select>
            <select value={form.reason} onChange={(event) => update('reason', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none focus:border-blue-400 focus:bg-white">
              {['Moving', 'Upgrading', 'Extra item', 'Need gone ASAP', 'Before Shabbos/Yom Tov', 'School / learning'].map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
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
          <button className="motion-press flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm font-black text-slate-500">
            <Package className="h-4 w-4" />
            Add photos
          </button>
        </div>

        <button
          onClick={submit}
          className="motion-press mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-600 text-sm font-black text-white shadow-lg shadow-blue-500/20"
        >
          <Send className="h-4 w-4" />
          Post to JUnited Marketplace
        </button>
      </div>
    </div>
  );
}

export default function Marketplace() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('all');
  const [category, setCategory] = useState('All');
  const [activeFilters, setActiveFilters] = useState(new Set(['nearby']));
  const [query, setQuery] = useState('');
  const [showPost, setShowPost] = useState(false);
  const [listings, setListings] = useState([]);

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
        const haystack = `${listing.title} ${listing.category} ${listing.neighborhood} ${listing.seller} ${listing.reason}`.toLowerCase();
        if (!haystack.includes(normalizedQuery)) return false;
      }
      return true;
    });
  }, [activeFilters, activeSection, category, listings, query]);
  const liveNowItems = useMemo(() => buildMarketplaceLiveNowItems({
    listings: filteredListings,
  }), [filteredListings]);
  const listingStats = useMemo(() => {
    const stats = [
      [listings.length, 'listings'],
      [listings.filter((listing) => listing.price === 'Free' || listing.section === 'free').length, 'free items'],
      [listings.filter((listing) => ['urgent', 'shabbos', 'soon'].includes(listing.urgency)).length, 'urgent'],
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

  const quickAction = (label) => toast.success(label);

  const createListing = (form) => {
    const newListing = {
      id: `mk-${Date.now()}`,
      section: form.mode,
      title: form.title,
      price: form.mode === 'free' ? 'Free' : (form.price || 'Make offer'),
      category: form.category,
      condition: form.condition,
      neighborhood: form.neighborhood,
      delivery: form.delivery,
      seller: user?.display_name || user?.full_name || 'You',
      sellerInitials: (user?.display_name || user?.full_name || 'You').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
      communities: ['Five Towns Local', 'Your Communities'],
      posted: 'Just now',
      urgency: form.mode === 'urgent' ? 'urgent' : form.urgency,
      urgencyLabel: form.urgency === 'shabbos' ? 'Before Shabbos' : form.urgency === 'urgent' || form.mode === 'urgent' ? 'Need gone ASAP' : 'Flexible',
      reason: form.reason,
      interested: 0,
      photoTone: 'from-blue-200 via-white to-emerald-100',
      trust: 'From your community',
      details: form.details || 'Message for details.',
    };
    setListings((current) => [newListing, ...current]);
    toast.success('Listing posted');
  };

  return (
    <main className="min-h-screen bg-[#F6F8FB] pb-28">
      <DestinationHeader
        showBack
        icon={ShoppingBag}
        title="Marketplace"
        actions={(
          <button
            onClick={() => setShowPost(true)}
            className="motion-press flex shrink-0 items-center gap-1.5 rounded-full bg-slate-950 px-3.5 py-2 text-[12px] font-bold text-white"
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
                className={classNames('motion-press shrink-0 rounded-full px-4 py-2 text-[13px] font-black ring-1', activeSection === section.id ? 'bg-slate-950 text-white ring-slate-950' : 'bg-white text-slate-600 ring-slate-200')}
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
                className={classNames('motion-press shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold ring-1', category === item ? 'bg-slate-950 text-white ring-slate-950' : 'bg-white text-slate-600 ring-slate-200')}
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
                className={classNames('motion-press inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold ring-1', activeFilters.has(filter.id) ? 'bg-slate-950 text-white ring-slate-950' : 'bg-white text-slate-500 ring-slate-200')}
              >
                {filter.label}
                {filter.id === 'nearby' && <MapPin className="h-3 w-3" />}
              </button>
            ))}
            <button className="motion-press inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-slate-500 ring-1 ring-slate-200">
              Shul / school
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="mt-3 rounded-[22px] border border-amber-100 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-700">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-950">Before Shabbos board</p>
              <p className="mt-1 text-[13px] font-semibold leading-5 text-slate-600">
                Free food, last-minute pickup, and need-gone-soon listings are boosted here and can connect into Mitzvah Circle.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-3">
          {filteredListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onQuickAction={quickAction}
              onOpenMap={(item) => navigate(`/Map?marketplace=${encodeURIComponent(item.id)}`)}
            />
          ))}
        </div>

        {filteredListings.length === 0 && (
          <div className="mt-6 rounded-[24px] border border-dashed border-slate-300 bg-white p-8 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-3 text-base font-black text-slate-900">
              {listings.length === 0 ? 'No listings yet' : 'Nothing matches yet'}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {listings.length === 0 ? 'Be the first to post something useful for the neighborhood.' : 'Try a different category or post what you are looking for.'}
            </p>
            <button onClick={() => setShowPost(true)} className="motion-press mt-4 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white">
              Post Looking For
            </button>
          </div>
        )}
      </section>

      <PostListingModal open={showPost} onClose={() => setShowPost(false)} onCreate={createListing} />
    </main>
  );
}
