import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BadgeCheck,
  BarChart3,
  Baby,
  Car,
  Edit3,
  ExternalLink,
  EyeOff,
  Globe2,
  Gift,
  HeartPulse,
  Home as HomeIcon,
  LayoutGrid,
  List,
  Loader2,
  LockKeyhole,
  Map as MapIcon,
  MapPin,
  Navigation,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Utensils,
  UsersRound,
  Wrench,
  X,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import PageHelp from '@/components/common/PageHelp';
import DestinationHeader from '@/components/layout/DestinationHeader';
import LiveNowRail from '@/components/common/LiveNowRail';
import { buildMapLiveNowItems } from '@/lib/liveNow';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { COMMUNITIES_ENABLED } from '@/config/features';
import { createBusinessClaimRequest, createBusinessListing, filterBusinessClaimRequest, filterBusinessListing, filterBusinessManager, filterUserCommunity, listBusinessListing, listBusinessReview, listCommunity, listMitzvahRequest, listUnifiedPost } from '@/services/entityServices';
import { postKeys } from '@/lib/queryKeys';

const BusinessMap = lazy(() => import('@/components/business/BusinessMap'));
const MitzvahMap = lazy(() => import('@/components/mitzvah/MitzvahMap'));

const MAP_FILTER_STORAGE = 'junited-map-community-filters';
const MAP_LOCATION_PROMPT_KEY = 'junited-map-location-prompted';
const COMMUNITY_LOCATION_FALLBACKS = {
  cedarhurst: { lat: 40.6224, lng: -73.7268, label: 'Cedarhurst' },
  lawrence: { lat: 40.6134, lng: -73.7302, label: 'Lawrence' },
  woodmere: { lat: 40.6326, lng: -73.7162, label: 'Woodmere' },
  hewlett: { lat: 40.6412, lng: -73.7012, label: 'Hewlett' },
  inwood: { lat: 40.6223, lng: -73.7462, label: 'Inwood' },
  'five towns': { lat: 40.6249, lng: -73.7178, label: 'Five Towns' },
};

const BUSINESS_CATEGORIES = [
  { key: 'all',              label: 'All',                         shortLabel: 'All',        icon: LayoutGrid,  iconBg: 'bg-slate-100',   iconColor: 'text-slate-500',   labelColor: 'text-slate-500',   barColor: 'bg-slate-300',   chipActive: 'bg-slate-950 text-white border-slate-950',   chipInactive: 'bg-white text-slate-600 border-slate-200' },
  { key: 'attractions',      label: 'Attractions',                 shortLabel: 'Attract',    icon: Star,        iconBg: 'bg-sky-50',      iconColor: 'text-sky-600',     labelColor: 'text-sky-700',     barColor: 'bg-sky-400',     chipActive: 'bg-sky-600 text-white border-sky-600',       chipInactive: 'bg-white text-slate-600 border-slate-200' },
  { key: 'childcare',        label: 'Babysitting / Childcare',     shortLabel: 'Childcare',  icon: Baby,        iconBg: 'bg-pink-50',     iconColor: 'text-pink-600',    labelColor: 'text-pink-700',    barColor: 'bg-pink-400',    chipActive: 'bg-pink-600 text-white border-pink-600',     chipInactive: 'bg-white text-slate-600 border-slate-200' },
  { key: 'beauty_services',  label: 'Beauty Services',             shortLabel: 'Beauty',     icon: Sparkles,    iconBg: 'bg-fuchsia-50',  iconColor: 'text-fuchsia-600', labelColor: 'text-fuchsia-700', barColor: 'bg-fuchsia-400', chipActive: 'bg-fuchsia-600 text-white border-fuchsia-600', chipInactive: 'bg-white text-slate-600 border-slate-200' },
  { key: 'car_services',     label: 'Car Services',                shortLabel: 'Cars',       icon: Car,         iconBg: 'bg-cyan-50',     iconColor: 'text-cyan-600',    labelColor: 'text-cyan-700',    barColor: 'bg-cyan-400',    chipActive: 'bg-cyan-600 text-white border-cyan-600',     chipInactive: 'bg-white text-slate-600 border-slate-200' },
  { key: 'chessed',          label: 'Chessed',                     shortLabel: 'Chessed',    icon: HeartPulse,  iconBg: 'bg-rose-50',     iconColor: 'text-rose-600',    labelColor: 'text-rose-700',    barColor: 'bg-rose-400',    chipActive: 'bg-rose-600 text-white border-rose-600',     chipInactive: 'bg-white text-slate-600 border-slate-200' },
  { key: 'food_dining',      label: 'Food & Dining',               shortLabel: 'Food',       icon: Utensils,    iconBg: 'bg-amber-50',    iconColor: 'text-amber-600',   labelColor: 'text-amber-700',   barColor: 'bg-amber-400',   chipActive: 'bg-amber-600 text-white border-amber-600',   chipInactive: 'bg-white text-slate-600 border-slate-200' },
  { key: 'health',           label: 'Health',                      shortLabel: 'Health',     icon: HeartPulse,  iconBg: 'bg-emerald-50',  iconColor: 'text-emerald-600', labelColor: 'text-emerald-700', barColor: 'bg-emerald-500', chipActive: 'bg-emerald-600 text-white border-emerald-600',chipInactive: 'bg-white text-slate-600 border-slate-200' },
  { key: 'home_improvement', label: 'Home Improvement Services',   shortLabel: 'Home',       icon: Wrench,      iconBg: 'bg-orange-50',   iconColor: 'text-orange-600',  labelColor: 'text-orange-700',  barColor: 'bg-orange-400',  chipActive: 'bg-orange-500 text-white border-orange-500', chipInactive: 'bg-white text-slate-600 border-slate-200' },
  { key: 'hostess_gifts',    label: 'Hostess Gifts',               shortLabel: 'Gifts',      icon: Gift,        iconBg: 'bg-violet-50',   iconColor: 'text-violet-600',  labelColor: 'text-violet-700',  barColor: 'bg-violet-400',  chipActive: 'bg-violet-600 text-white border-violet-600', chipInactive: 'bg-white text-slate-600 border-slate-200' },
  { key: 'local_businesses', label: 'Local Businesses',            shortLabel: 'Local',      icon: Store,       iconBg: 'bg-blue-50',     iconColor: 'text-blue-600',    labelColor: 'text-blue-700',    barColor: 'bg-blue-500',    chipActive: 'bg-blue-600 text-white border-blue-600',     chipInactive: 'bg-white text-slate-600 border-slate-200' },
  { key: 'mikvahs',          label: 'Mikvahs',                     shortLabel: 'Mikvahs',    icon: MapPin,      iconBg: 'bg-teal-50',     iconColor: 'text-teal-600',    labelColor: 'text-teal-700',    barColor: 'bg-teal-400',    chipActive: 'bg-teal-600 text-white border-teal-600',     chipInactive: 'bg-white text-slate-600 border-slate-200' },
  { key: 'eruv',             label: 'Eruv',                        shortLabel: 'Eruv',       icon: MapIcon,     iconBg: 'bg-indigo-50',   iconColor: 'text-indigo-600',  labelColor: 'text-indigo-700',  barColor: 'bg-indigo-500',  chipActive: 'bg-indigo-600 text-white border-indigo-600', chipInactive: 'bg-white text-slate-600 border-slate-200' },
  { key: 'vacation_rentals', label: 'Vacation Rentals',            shortLabel: 'Rentals',    icon: HomeIcon,    iconBg: 'bg-lime-50',     iconColor: 'text-lime-700',    labelColor: 'text-lime-700',    barColor: 'bg-lime-400',    chipActive: 'bg-lime-600 text-white border-lime-600',     chipInactive: 'bg-white text-slate-600 border-slate-200' },
];

const LEGACY_CATEGORY_ALIASES = {
  kosher_food: 'food_dining',
  food: 'food_dining',
  restaurants: 'food_dining',
  restaurant: 'food_dining',
  food_meals: 'food_dining',
  services: 'local_businesses',
  retail: 'local_businesses',
  judaica: 'local_businesses',
  professional: 'local_businesses',
  health_wellness: 'health',
  home_services: 'home_improvement',
  transportation: 'car_services',
  car_service: 'car_services',
  cars: 'car_services',
  chesed: 'chessed',
  mikvah: 'mikvahs',
};

function normalizeCategoryKey(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\//g, ' ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return LEGACY_CATEGORY_ALIASES[normalized] || normalized || 'local_businesses';
}

function businessCategoryKey(value) {
  const key = normalizeCategoryKey(value);
  return BUSINESS_CATEGORIES.some((cat) => cat.key === key) ? key : 'local_businesses';
}

function businessCategory(value) {
  return BUSINESS_CATEGORIES.find((cat) => cat.key === businessCategoryKey(value)) || BUSINESS_CATEGORIES[0];
}

const LISTING_TYPES = [
  { key: 'all', label: 'All' },
  { key: 'physical', label: 'Physical' },
  { key: 'online', label: 'Online' },
  { key: 'service_area', label: 'Service Area' },
];

const emptyBusinessForm = {
  name: '',
  category: 'local_businesses',
  listing_type: 'physical',
  description: '',
  address: '',
  city: '',
  neighborhood: '',
  service_area_text: '',
  website: '',
  phone: '',
  email: '',
  instagram_url: '',
  location_lat: '',
  location_lng: '',
  hide_exact_address: false,
  jewish_owned_claim: false,
  serves_jewish_community: false,
  kosher_claim: '',
  kosher_certifying_agency: '',
  kosher_certification_expires_at: '',
  kosher_certification_no_expiration: false,
};

const emptyClaimForm = {
  claimant_name: '',
  claimant_email: '',
  role_at_business: '',
  proof_method: 'business_email',
  proof_notes: '',
  jewish_owned_claim: false,
  serves_jewish_community_claim: false,
  kosher_claim: '',
  kosher_certifying_agency: '',
  kosher_certification_expires_at: '',
  kosher_certification_no_expiration: false,
};

function MapModuleFallback({ label = 'Loading map...' }) {
  return (
    <div className="flex min-h-[520px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center gap-2 rounded-full bg-slate-50 px-4 py-3 text-sm font-black text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        {label}
      </div>
    </div>
  );
}

function readMapFilterState() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(MAP_FILTER_STORAGE) || '{}');
    return {
      hiddenCommunityIds: new Set(saved.hiddenCommunityIds || []),
      hiddenPosterIds: new Set(saved.hiddenPosterIds || []),
    };
  } catch {
    return { hiddenCommunityIds: new Set(), hiddenPosterIds: new Set() };
  }
}

function resolvePostLocation(post) {
  if (post.location_lat && post.location_lng) {
    return { lat: post.location_lat, lng: post.location_lng, label: post.location_text || post.city || 'Five Towns' };
  }

  const text = `${post.location_text || ''} ${post.city || ''}`.toLowerCase();
  const match = Object.entries(COMMUNITY_LOCATION_FALLBACKS).find(([key]) => text.includes(key));
  return match?.[1] || COMMUNITY_LOCATION_FALLBACKS['five towns'];
}

function cleanUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

function directionsUrl(business) {
  const query = business.address || `${business.location_lat},${business.location_lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function badgeLabel(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function TrustBadges({ business, showDisclaimer = false }) {
  const badges = [];
  if (business.verification_status === 'verified_owner' || business.is_claimed) {
    badges.push({ label: 'Verified Owner', icon: BadgeCheck, className: 'bg-blue-50 text-blue-700 border-blue-100' });
  }
  if (business.jewish_owned_status === 'verified') {
    badges.push({ label: 'Verified Jewish-Owned', icon: ShieldCheck, className: 'bg-indigo-50 text-indigo-700 border-indigo-100' });
  }
  if (business.kosher_status === 'certified') {
    const agency = String(business.kosher_certifying_agency || '').trim();
    const expiresAt = business.kosher_certification_expires_at
      ? new Date(`${business.kosher_certification_expires_at}T00:00:00`)
      : null;
    const expiryLabel = expiresAt && !Number.isNaN(expiresAt.getTime())
      ? `, through ${expiresAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
      : business.kosher_certification_no_expiration
        ? ', no expiration provided'
        : '';
    badges.push({
      label: agency ? `Kosher — per ${agency}${expiryLabel}` : 'Kosher (agency not on file)',
      icon: ShieldCheck,
      className: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    });
  }
  if (business.listing_type === 'online') {
    badges.push({ label: 'Online', icon: Globe2, className: 'bg-slate-50 text-slate-700 border-slate-200' });
  }
  if (business.listing_type === 'service_area') {
    badges.push({ label: 'Service Area', icon: LockKeyhole, className: 'bg-slate-50 text-slate-700 border-slate-200' });
  }

  if (badges.length === 0) return null;

  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-1.5">
        {badges.map(({ label, icon: Icon, className }) => (
          <span key={label} className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-black ${className}`}>
            <Icon className="h-3 w-3" />
            {label}
          </span>
        ))}
      </div>
      {showDisclaimer && business.kosher_status === 'certified' && (
        <p className="mt-1.5 text-[10px] font-medium text-slate-400">
          Kosher status is self-reported by the business and reviewed by JUnited staff for plausibility only. JUnited is not a kashrus authority and does not independently verify certifications — contact the listed agency directly to confirm.
        </p>
      )}
    </div>
  );
}

function VerifiedBusinessChip({ business, onView }) {
  const cat = businessCategory(business.category);
  const CatIcon = cat.icon;
  return (
    <button
      type="button"
      onClick={() => onView(business)}
      className="flex w-[92px] shrink-0 flex-col items-center gap-2 rounded-[22px] border border-slate-200 bg-white p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${cat.iconBg}`}>
        {business.logo_url
          ? <img src={business.logo_url} alt="" className="h-full w-full rounded-2xl object-cover" />
          : <CatIcon className={`h-5 w-5 ${cat.iconColor}`} />}
      </div>
      <p className="line-clamp-2 text-[10px] font-black leading-tight text-slate-900">{business.name}</p>
      <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-black text-blue-700">
        <BadgeCheck className="h-2.5 w-2.5" />
        Verified
      </span>
    </button>
  );
}

function BusinessCard({ business, onView, onClaim }) {
  const isPhysical = business.listing_type === 'physical';
  const hasDirections = isPhysical && (business.address || (business.location_lat && business.location_lng)) && !business.hide_exact_address;
  const cat = businessCategory(business.category);
  const CatIcon = cat.icon;
  const isVerifiedOwner = business.verification_status === 'verified_owner' || business.is_claimed;

  return (
    <article className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className={`h-1.5 ${cat.barColor}`} />
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${cat.iconBg}`}>
            {business.logo_url
              ? <img src={business.logo_url} alt="" className="h-full w-full rounded-2xl object-cover" />
              : <CatIcon className={`h-6 w-6 ${cat.iconColor}`} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-base font-black text-slate-950">{business.name}</h3>
                <p className={`mt-0.5 text-[11px] font-black uppercase tracking-wider ${cat.labelColor}`}>{cat.label}</p>
              </div>
              {isVerifiedOwner && (
                <span className="shrink-0 rounded-full bg-blue-50 p-1.5 ring-1 ring-blue-100">
                  <BadgeCheck className="h-3.5 w-3.5 text-blue-600" />
                </span>
              )}
            </div>
          </div>
        </div>

        <TrustBadges business={business} />

        <p className="mt-3 line-clamp-2 text-sm font-semibold leading-6 text-slate-600">
          {business.description || 'A community-submitted Jewish business listing.'}
        </p>

        <div className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-slate-500">
          {business.listing_type === 'online' ? (
            <><Globe2 className="h-3.5 w-3.5 text-blue-500" />Online business</>
          ) : business.listing_type === 'service_area' ? (
            <><LockKeyhole className="h-3.5 w-3.5 text-slate-400" />{business.service_area_text || business.neighborhood || 'Service-area business'}</>
          ) : (
            <><MapPin className="h-3.5 w-3.5 text-blue-500" />{business.hide_exact_address ? (business.neighborhood || business.city || 'Location private') : (business.address || business.neighborhood || business.city || 'Location pending')}</>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => onView(business)} className="motion-press inline-flex h-9 items-center justify-center rounded-full bg-slate-950 px-4 text-xs font-black text-white">
            View Details
          </button>
          {business.website && (
            <a href={cleanUrl(business.website)} target="_blank" rel="noreferrer" className="motion-press inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-slate-700">
              <ExternalLink className="h-3.5 w-3.5" />Website
            </a>
          )}
          {hasDirections && (
            <a href={directionsUrl(business)} target="_blank" rel="noreferrer" className="motion-press inline-flex h-9 items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-4 text-xs font-black text-blue-700">
              <Navigation className="h-3.5 w-3.5" />Directions
            </a>
          )}
          {business.claim_status !== 'claimed' && (
            <button type="button" onClick={() => onClaim(business)} className="motion-press inline-flex h-9 items-center rounded-full border border-slate-200 px-3 text-xs font-black text-slate-500">
              Claim
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function SubmitBusinessModal({ open, onClose, currentUser }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyBusinessForm);

  useEffect(() => {
    if (!open) return;
    setForm(emptyBusinessForm);
  }, [open]);

  const mutation = useMutation({
    mutationFn: async () => {
      const name = form.name.trim();
      if (!name) throw new Error('Business name is required.');
      if (form.listing_type === 'online' && !form.website.trim()) throw new Error('Online businesses need a website or public link.');
      if (form.listing_type === 'service_area' && !form.service_area_text.trim()) throw new Error('Service-area businesses need a service area.');
      if (form.kosher_claim.trim() && !form.kosher_certifying_agency.trim()) throw new Error('Name the certifying agency for your kosher claim.');
      if (form.kosher_claim.trim() && !form.kosher_certification_no_expiration && !form.kosher_certification_expires_at) {
        throw new Error('Add a kosher certification expiration date, or mark that no expiration was provided.');
      }

      return createBusinessListing({
        name,
        category: form.category,
        listing_type: form.listing_type,
        status: 'pending',
        submitted_by: currentUser?.id,
        submitted_by_name: currentUser?.display_name || currentUser?.full_name || currentUser?.email || 'JUnited member',
        description: form.description.trim() || null,
        address: form.listing_type === 'physical' ? form.address.trim() || null : null,
        city: form.city.trim() || null,
        neighborhood: form.neighborhood.trim() || null,
        service_area_text: form.listing_type === 'service_area' ? form.service_area_text.trim() : null,
        website: cleanUrl(form.website.trim()) || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        instagram_url: cleanUrl(form.instagram_url.trim()) || null,
        location_lat: form.location_lat ? Number(form.location_lat) : null,
        location_lng: form.location_lng ? Number(form.location_lng) : null,
        hide_exact_address: form.listing_type !== 'physical' || form.hide_exact_address,
        jewish_owned_status: form.jewish_owned_claim ? 'pending' : 'none',
        serves_jewish_community: Boolean(form.serves_jewish_community),
        kosher_status: form.kosher_claim.trim() ? 'pending' : 'none',
        kosher_certification: form.kosher_claim.trim() || null,
        kosher_certifying_agency: form.kosher_claim.trim() ? form.kosher_certifying_agency.trim() || null : null,
        kosher_certification_expires_at: form.kosher_claim.trim() && !form.kosher_certification_no_expiration ? form.kosher_certification_expires_at || null : null,
        kosher_certification_no_expiration: form.kosher_claim.trim() ? Boolean(form.kosher_certification_no_expiration) : false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-directory-published'] });
      toast.success('Business submitted for admin review');
      onClose();
    },
    onError: (error) => toast.error(error.message || 'Could not submit business'),
  });

  if (!open) return null;

  return (
    <ModalShell title="Submit a Business" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-2xl bg-blue-50 p-3">
          <p className="text-sm font-black text-blue-950">Review-first directory</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-blue-800">
            New listings stay pending until an admin approves them. Jewish-owned and kosher claims are not shown as verified unless reviewed.
          </p>
        </div>

        <Field label="Business name" required>
          <input className="app-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Example: Cohen Family Catering" />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Category">
            <select className="app-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {BUSINESS_CATEGORIES.filter((cat) => cat.key !== 'all').map((cat) => <option key={cat.key} value={cat.key}>{cat.label}</option>)}
            </select>
          </Field>
          <Field label="Business type">
            <select className="app-input" value={form.listing_type} onChange={(e) => setForm({ ...form, listing_type: e.target.value })}>
              <option value="physical">Physical location</option>
              <option value="online">Online-only</option>
              <option value="service_area">Service area / private address</option>
            </select>
          </Field>
        </div>

        <Field label="Description">
          <textarea className="app-input min-h-[90px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What does this business offer the community?" />
        </Field>

        {form.listing_type === 'physical' && (
          <>
            <Field label="Public address">
              <input className="app-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Central Ave" />
            </Field>
            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-700">
              <input type="checkbox" checked={form.hide_exact_address} onChange={(e) => setForm({ ...form, hide_exact_address: e.target.checked })} />
              Hide exact address from public listing
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Latitude optional">
                <input className="app-input" value={form.location_lat} onChange={(e) => setForm({ ...form, location_lat: e.target.value })} placeholder="40.6249" />
              </Field>
              <Field label="Longitude optional">
                <input className="app-input" value={form.location_lng} onChange={(e) => setForm({ ...form, location_lng: e.target.value })} placeholder="-73.7178" />
              </Field>
            </div>
          </>
        )}

        {form.listing_type === 'service_area' && (
          <Field label="Service area" required>
            <input className="app-input" value={form.service_area_text} onChange={(e) => setForm({ ...form, service_area_text: e.target.value })} placeholder="Five Towns, Queens, and Nassau County" />
          </Field>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="City / area">
            <input className="app-input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Cedarhurst" />
          </Field>
          <Field label="Neighborhood">
            <input className="app-input" value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} placeholder="Five Towns" />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Website">
            <input className="app-input" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="business.com" />
          </Field>
          <Field label="Instagram / social">
            <input className="app-input" value={form.instagram_url} onChange={(e) => setForm({ ...form, instagram_url: e.target.value })} placeholder="instagram.com/business" />
          </Field>
          <Field label="Phone">
            <input className="app-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Optional" />
          </Field>
          <Field label="Public email">
            <input className="app-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Optional" />
          </Field>
        </div>

        <div className="grid gap-2">
          <ToggleRow checked={form.jewish_owned_claim} onChange={(value) => setForm({ ...form, jewish_owned_claim: value })} title="This business is Jewish-owned" body="This will be held for admin review before any verified badge appears." />
          <ToggleRow checked={form.serves_jewish_community} onChange={(value) => setForm({ ...form, serves_jewish_community: value })} title="This business serves the Jewish community" body="Use this for businesses that provide community-focused services." />
        </div>

        <Field label="Kosher claim or certification info">
          <input className="app-input" value={form.kosher_claim} onChange={(e) => setForm({ ...form, kosher_claim: e.target.value })} placeholder="Optional, reviewed before any badge appears" />
        </Field>
        {form.kosher_claim.trim() && (
          <>
            <Field label="Certifying agency" required>
              <input className="app-input" value={form.kosher_certifying_agency} onChange={(e) => setForm({ ...form, kosher_certifying_agency: e.target.value })} placeholder="Example: OU, Star-K, a local vaad" />
              <p className="mt-1 text-[11px] font-semibold text-slate-400">A certified badge can't be shown without naming the agency. JUnited does not verify kashrus claims independently.</p>
            </Field>
            <Field label="Certification expiration" required>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  type="date"
                  className="app-input"
                  value={form.kosher_certification_expires_at}
                  disabled={form.kosher_certification_no_expiration}
                  onChange={(e) => setForm({ ...form, kosher_certification_expires_at: e.target.value })}
                />
                <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-bold text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.kosher_certification_no_expiration}
                    onChange={(e) => setForm({
                      ...form,
                      kosher_certification_no_expiration: e.target.checked,
                      kosher_certification_expires_at: e.target.checked ? '' : form.kosher_certification_expires_at,
                    })}
                  />
                  No expiration provided
                </label>
              </div>
            </Field>
          </>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-11 rounded-full border border-slate-200 bg-white px-5 text-sm font-black text-slate-700">Cancel</button>
          <button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending} className="h-11 rounded-full bg-slate-950 px-5 text-sm font-black text-white disabled:opacity-60">
            {mutation.isPending ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function ClaimBusinessModal({ business, onClose, currentUser }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    ...emptyClaimForm,
    claimant_name: currentUser?.display_name || currentUser?.full_name || '',
    claimant_email: currentUser?.email || '',
  });

  useEffect(() => {
    if (!business) return;
    setForm({
      ...emptyClaimForm,
      claimant_name: currentUser?.display_name || currentUser?.full_name || '',
      claimant_email: currentUser?.email || '',
    });
  }, [business, currentUser]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!business?.id) throw new Error('Choose a business to claim.');
      if (!form.claimant_name.trim()) throw new Error('Your name is required.');
      if (!form.claimant_email.trim()) throw new Error('Your email is required.');
      if (form.kosher_claim.trim() && !form.kosher_certifying_agency.trim()) throw new Error('Name the certifying agency for your kosher claim.');
      if (form.kosher_claim.trim() && !form.kosher_certification_no_expiration && !form.kosher_certification_expires_at) {
        throw new Error('Add a kosher certification expiration date, or mark that no expiration was provided.');
      }

      return createBusinessClaimRequest({
        business_id: business.id,
        business_name: business.name,
        requester_id: currentUser?.id,
        requester_name: currentUser?.display_name || currentUser?.full_name || currentUser?.email || 'JUnited member',
        requester_email: currentUser?.email || null,
        claimant_name: form.claimant_name.trim(),
        claimant_email: form.claimant_email.trim(),
        role_at_business: form.role_at_business.trim() || null,
        proof_method: form.proof_method,
        proof_notes: form.proof_notes.trim() || null,
        jewish_owned_claim: Boolean(form.jewish_owned_claim),
        serves_jewish_community_claim: Boolean(form.serves_jewish_community_claim),
        kosher_claim: form.kosher_claim.trim() || null,
        kosher_certifying_agency_claim: form.kosher_claim.trim() ? form.kosher_certifying_agency.trim() || null : null,
        kosher_certification_expires_at_claim: form.kosher_claim.trim() && !form.kosher_certification_no_expiration ? form.kosher_certification_expires_at || null : null,
        kosher_certification_no_expiration_claim: form.kosher_claim.trim() ? Boolean(form.kosher_certification_no_expiration) : false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-directory-published'] });
      toast.success('Claim request sent for admin review');
      onClose();
    },
    onError: (error) => toast.error(error.message || 'Could not submit claim request'),
  });

  if (!business) return null;

  return (
    <ModalShell title={`Claim ${business.name}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-2xl bg-amber-50 p-3">
          <p className="text-sm font-black text-amber-950">Manual verification</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-amber-800">
            An admin will review your role and proof before you can manage this listing or receive trust badges.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Your name" required>
            <input className="app-input" value={form.claimant_name} onChange={(e) => setForm({ ...form, claimant_name: e.target.value })} />
          </Field>
          <Field label="Your email" required>
            <input className="app-input" value={form.claimant_email} onChange={(e) => setForm({ ...form, claimant_email: e.target.value })} />
          </Field>
        </div>
        <Field label="Your role at the business">
          <input className="app-input" value={form.role_at_business} onChange={(e) => setForm({ ...form, role_at_business: e.target.value })} placeholder="Owner, manager, employee..." />
        </Field>
        <Field label="Proof method">
          <select className="app-input" value={form.proof_method} onChange={(e) => setForm({ ...form, proof_method: e.target.value })}>
            <option value="business_email">Business domain email</option>
            <option value="website">Website or public page</option>
            <option value="document">Document or license</option>
            <option value="manual">Manual admin review</option>
          </select>
        </Field>
        <Field label="Proof details">
          <textarea className="app-input min-h-[100px]" value={form.proof_notes} onChange={(e) => setForm({ ...form, proof_notes: e.target.value })} placeholder="Tell admins how to verify that you manage this business." />
        </Field>
        <div className="grid gap-2">
          <ToggleRow checked={form.jewish_owned_claim} onChange={(value) => setForm({ ...form, jewish_owned_claim: value })} title="Request Jewish-owned verification" body="Only admins can approve this badge." />
          <ToggleRow checked={form.serves_jewish_community_claim} onChange={(value) => setForm({ ...form, serves_jewish_community_claim: value })} title="This business serves the Jewish community" body="This helps describe why it belongs in the directory." />
        </div>
        <Field label="Kosher certification or claim">
          <input className="app-input" value={form.kosher_claim} onChange={(e) => setForm({ ...form, kosher_claim: e.target.value })} placeholder="Optional, reviewed by admins" />
        </Field>
        {form.kosher_claim.trim() && (
          <>
            <Field label="Certifying agency" required>
              <input className="app-input" value={form.kosher_certifying_agency} onChange={(e) => setForm({ ...form, kosher_certifying_agency: e.target.value })} placeholder="Example: OU, Star-K, a local vaad" />
              <p className="mt-1 text-[11px] font-semibold text-slate-400">A certified badge can't be shown without naming the agency. JUnited does not verify kashrus claims independently.</p>
            </Field>
            <Field label="Certification expiration" required>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  type="date"
                  className="app-input"
                  value={form.kosher_certification_expires_at}
                  disabled={form.kosher_certification_no_expiration}
                  onChange={(e) => setForm({ ...form, kosher_certification_expires_at: e.target.value })}
                />
                <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-bold text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.kosher_certification_no_expiration}
                    onChange={(e) => setForm({
                      ...form,
                      kosher_certification_no_expiration: e.target.checked,
                      kosher_certification_expires_at: e.target.checked ? '' : form.kosher_certification_expires_at,
                    })}
                  />
                  No expiration provided
                </label>
              </div>
            </Field>
          </>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-11 rounded-full border border-slate-200 bg-white px-5 text-sm font-black text-slate-700">Cancel</button>
          <button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending} className="h-11 rounded-full bg-slate-950 px-5 text-sm font-black text-white disabled:opacity-60">
            {mutation.isPending ? 'Sending...' : 'Send Claim'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function BusinessDetailModal({ business, onClose, onClaim }) {
  useEffect(() => {
    if (!business?.id || !supabase) return;
    supabase.rpc('increment_business_listing_view', { p_listing_id: business.id }).catch(() => {});
  }, [business?.id]);

  if (!business) return null;
  const hasDirections = business.listing_type === 'physical' && (business.address || (business.location_lat && business.location_lng)) && !business.hide_exact_address;

  return (
    <ModalShell title={business.name} onClose={onClose}>
      <div className="space-y-4">
        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm">
              <Store className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-blue-700">{businessCategory(business.category).label}</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">{business.name}</h2>
              <TrustBadges business={business} showDisclaimer />
            </div>
          </div>
        </div>
        <p className="text-sm font-semibold leading-6 text-slate-600">
          {business.description || 'This listing is waiting for more details from a verified manager.'}
        </p>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-600">
          {business.listing_type === 'online' ? 'Online business' : business.listing_type === 'service_area' ? business.service_area_text || 'Service-area business' : business.hide_exact_address ? business.neighborhood || business.city || 'Location private' : business.address || business.neighborhood || business.city || 'Location pending'}
        </div>
        <div className="flex flex-wrap gap-2">
          {business.website && (
            <a href={cleanUrl(business.website)} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full bg-slate-950 px-4 text-xs font-black text-white">
              <ExternalLink className="h-4 w-4" />
              Website
            </a>
          )}
          {hasDirections && (
            <a href={directionsUrl(business)} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 text-xs font-black text-blue-700">
              <Navigation className="h-4 w-4" />
              Directions
            </a>
          )}
          {business.claim_status !== 'claimed' && (
            <button type="button" onClick={() => onClaim(business)} className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-slate-700">
              Claim this business
            </button>
          )}
        </div>
      </div>
    </ModalShell>
  );
}

function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm">
      <div className="max-h-[92dvh] w-full max-w-xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-lg font-black text-slate-950">{title}</h2>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[calc(92dvh-64px)] overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, required = false, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
        {label}{required ? ' *' : ''}
      </span>
      {children}
    </label>
  );
}

function ToggleRow({ checked, onChange, title, body }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1" />
      <span>
        <span className="block text-sm font-black text-slate-900">{title}</span>
        <span className="mt-0.5 block text-xs font-semibold leading-5 text-slate-500">{body}</span>
      </span>
    </label>
  );
}

function BusinessOwnerDashboard({ open, onClose, currentUser, ownerListings = [], managerRows = [], claimRequests = [], reviews = [] }) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState({
    description: '',
    phone: '',
    email: '',
    website: '',
    instagram_url: '',
    logo_url: '',
    cover_url: '',
    hours: '',
  });

  const selectedBusiness = useMemo(
    () => ownerListings.find((business) => business.id === selectedId) || ownerListings[0] || null,
    [ownerListings, selectedId]
  );
  const selectedManager = useMemo(
    () => managerRows.find((row) => row.business_id === selectedBusiness?.id),
    [managerRows, selectedBusiness?.id]
  );
  const canEditSelected = ['owner', 'admin'].includes(selectedManager?.role);
  const selectedReviews = useMemo(
    () => reviews.filter((review) => review.business_id === selectedBusiness?.id),
    [reviews, selectedBusiness?.id]
  );
  const averageRating = selectedReviews.length
    ? (selectedReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / selectedReviews.length).toFixed(1)
    : null;

  useEffect(() => {
    if (!open) return;
    if (!selectedId && ownerListings[0]?.id) setSelectedId(ownerListings[0].id);
  }, [open, ownerListings, selectedId]);

  useEffect(() => {
    if (!selectedBusiness) return;
    setForm({
      description: selectedBusiness.description || '',
      phone: selectedBusiness.phone || '',
      email: selectedBusiness.email || '',
      website: selectedBusiness.website || '',
      instagram_url: selectedBusiness.instagram_url || '',
      logo_url: selectedBusiness.logo_url || '',
      cover_url: selectedBusiness.cover_url || '',
      hours: selectedBusiness.business_hours?.summary || selectedBusiness.business_hours?.text || '',
    });
  }, [selectedBusiness]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBusiness?.id) throw new Error('Choose a business first.');
      if (!canEditSelected) throw new Error('Only business owners and admins can edit this listing.');
      if (!supabase) throw new Error('Supabase is not configured.');
      const { data, error } = await supabase.rpc('update_business_owner_profile', {
        p_listing_id: selectedBusiness.id,
        p_description: form.description.trim() || null,
        p_phone: form.phone.trim() || null,
        p_email: form.email.trim() || null,
        p_website: cleanUrl(form.website.trim()) || null,
        p_instagram_url: cleanUrl(form.instagram_url.trim()) || null,
        p_logo_url: form.logo_url.trim() || null,
        p_cover_url: form.cover_url.trim() || null,
        p_business_hours: { summary: form.hours.trim() },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-directory-published'] });
      queryClient.invalidateQueries({ queryKey: ['business-owner-listings', currentUser?.id] });
      toast.success('Business listing updated.');
    },
    onError: (error) => toast.error(error.message || 'Could not update listing.'),
  });

  if (!open) return null;

  return (
    <ModalShell title="Business Owner Tools" onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-blue-50 p-3">
            <p className="text-xl font-black text-blue-700">{ownerListings.length}</p>
            <p className="text-[10px] font-black uppercase text-blue-700">Managed</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xl font-black text-slate-950">
              {ownerListings.reduce((sum, business) => sum + Number(business.view_count || 0), 0)}
            </p>
            <p className="text-[10px] font-black uppercase text-slate-500">Views</p>
          </div>
          <div className="rounded-2xl bg-amber-50 p-3">
            <p className="text-xl font-black text-amber-700">
              {claimRequests.filter((claim) => ['pending', 'under_review', 'more_info_requested'].includes(claim.status)).length}
            </p>
            <p className="text-[10px] font-black uppercase text-amber-700">Open Claims</p>
          </div>
        </div>

        {claimRequests.length > 0 && (
          <section className="rounded-[22px] border border-slate-200 bg-white p-3">
            <p className="text-sm font-black text-slate-950">Claim status</p>
            <div className="mt-2 space-y-2">
              {claimRequests.map((claim) => (
                <div key={claim.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-black text-slate-900">{claim.business_name || 'Business claim'}</p>
                    <p className="text-[11px] font-semibold text-slate-500">{claim.review_note || 'Admin review status'}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black text-slate-600">
                    {badgeLabel(claim.status)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {ownerListings.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
            <Store className="mx-auto h-9 w-9 text-slate-300" />
            <p className="mt-2 text-sm font-black text-slate-900">No approved business yet</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              Once a claim is approved, owner tools for that listing will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-[220px_1fr]">
            <section className="space-y-2">
              {ownerListings.map((business) => {
                const manager = managerRows.find((row) => row.business_id === business.id);
                const selected = selectedBusiness?.id === business.id;
                return (
                  <button
                    key={business.id}
                    type="button"
                    onClick={() => setSelectedId(business.id)}
                    className={`w-full rounded-2xl border p-3 text-left transition ${
                      selected ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <p className="truncate text-[13px] font-black text-slate-950">{business.name}</p>
                    <p className="mt-1 text-[11px] font-black uppercase text-slate-500">{badgeLabel(manager?.role || 'member')}</p>
                    <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-black text-slate-500">
                      <BarChart3 className="h-3 w-3" />
                      {Number(business.view_count || 0)} views
                    </p>
                  </button>
                );
              })}
            </section>

            <section className="rounded-[22px] border border-slate-200 bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-blue-700">Editing</p>
                  <h3 className="text-lg font-black text-slate-950">{selectedBusiness?.name}</h3>
                  <p className="text-xs font-semibold text-slate-500">
                    {canEditSelected ? 'Owner/admin access confirmed.' : 'You can view this listing, but editing is limited to owners and admins.'}
                  </p>
                </div>
                <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-700">
                  {badgeLabel(selectedBusiness?.claim_status || 'claimed')}
                </span>
              </div>

              <div className="mt-4 grid gap-3">
                <Field label="Description">
                  <textarea disabled={!canEditSelected} className="app-input min-h-[90px] disabled:bg-slate-50" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </Field>
                <Field label="Hours">
                  <textarea disabled={!canEditSelected} className="app-input min-h-[72px] disabled:bg-slate-50" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} placeholder="Sun-Thu 9-5, Friday by appointment" />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Phone">
                    <input disabled={!canEditSelected} className="app-input disabled:bg-slate-50" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </Field>
                  <Field label="Public email">
                    <input disabled={!canEditSelected} className="app-input disabled:bg-slate-50" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </Field>
                  <Field label="Website">
                    <input disabled={!canEditSelected} className="app-input disabled:bg-slate-50" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
                  </Field>
                  <Field label="Instagram / social">
                    <input disabled={!canEditSelected} className="app-input disabled:bg-slate-50" value={form.instagram_url} onChange={(e) => setForm({ ...form, instagram_url: e.target.value })} />
                  </Field>
                  <Field label="Logo image URL">
                    <input disabled={!canEditSelected} className="app-input disabled:bg-slate-50" value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} />
                  </Field>
                  <Field label="Cover image URL">
                    <input disabled={!canEditSelected} className="app-input disabled:bg-slate-50" value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} />
                  </Field>
                </div>
                <button
                  type="button"
                  onClick={() => saveMutation.mutate()}
                  disabled={!canEditSelected || saveMutation.isPending}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-black text-white disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2 text-sm font-black text-slate-950">
                    <Star className="h-4 w-4 text-amber-500" />
                    Reviews
                  </p>
                  <span className="text-xs font-black text-slate-500">
                    {averageRating ? `${averageRating} avg` : 'No rating yet'}
                  </span>
                </div>
                {selectedReviews.length === 0 ? (
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                    Reviews are production-backed, but this business does not have published reviews yet.
                  </p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {selectedReviews.slice(0, 4).map((review) => (
                      <div key={review.id} className="rounded-2xl bg-white p-3">
                        <p className="text-[12px] font-black text-slate-900">{review.rating}/5 · {review.reviewer_name || 'Community member'}</p>
                        {review.body && <p className="mt-1 text-[12px] font-semibold leading-5 text-slate-600">{review.body}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

function BusinessDirectoryExperience({ userLocation, locationStatus, currentUser }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [type, setType] = useState('all');
  const [mode, setMode] = useState('list');
  const [showSubmit, setShowSubmit] = useState(false);
  const [showOwnerTools, setShowOwnerTools] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [claimBusiness, setClaimBusiness] = useState(null);

  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ['business-directory-published'],
    queryFn: () => filterBusinessListing({ status: 'published' }, '-created_date', 200),
    staleTime: 120000,
  });

  const { data: managerRows = [] } = useQuery({
    queryKey: ['business-manager-rows', currentUser?.id],
    queryFn: () => filterBusinessManager({ user_id: currentUser.id }, '-created_date', 100),
    enabled: Boolean(currentUser?.id),
    staleTime: 120000,
  });

  const ownerManagerRows = useMemo(
    () => managerRows.filter((row) => ['owner', 'admin'].includes(row.role)),
    [managerRows]
  );
  const ownerBusinessIds = useMemo(
    () => new Set(ownerManagerRows.map((row) => row.business_id)),
    [ownerManagerRows]
  );

  const { data: ownerReadableListings = [] } = useQuery({
    queryKey: ['business-owner-listings', currentUser?.id],
    queryFn: () => listBusinessListing('-updated_date', 300),
    enabled: Boolean(currentUser?.id && ownerManagerRows.length),
    staleTime: 120000,
  });

  const ownerListings = useMemo(
    () => ownerReadableListings.filter((business) => ownerBusinessIds.has(business.id)),
    [ownerBusinessIds, ownerReadableListings]
  );

  const { data: claimRequests = [] } = useQuery({
    queryKey: ['business-claim-status', currentUser?.id],
    queryFn: () => filterBusinessClaimRequest({ requester_id: currentUser.id }, '-created_date', 100),
    enabled: Boolean(currentUser?.id),
    staleTime: 120000,
  });

  const { data: allBusinessReviews = [] } = useQuery({
    queryKey: ['business-owner-reviews', currentUser?.id],
    queryFn: () => listBusinessReview('-created_date', 300),
    enabled: Boolean(currentUser?.id && ownerManagerRows.length),
    staleTime: 120000,
  });

  const ownerReviews = useMemo(
    () => allBusinessReviews.filter((review) => ownerBusinessIds.has(review.business_id)),
    [allBusinessReviews, ownerBusinessIds]
  );

  const filteredBusinesses = useMemo(() => businesses.filter((business) => {
    const q = search.trim().toLowerCase();
    const normalizedCategory = businessCategory(business.category);
    const haystack = `${business.name || ''} ${business.description || ''} ${business.category || ''} ${normalizedCategory.label || ''} ${business.neighborhood || ''} ${business.city || ''}`.toLowerCase();
    if (q && !haystack.includes(q)) return false;
    if (category !== 'all' && businessCategoryKey(business.category) !== category) return false;
    if (type !== 'all' && business.listing_type !== type) return false;
    return true;
  }), [businesses, category, search, type]);

  const mapBusinesses = useMemo(() => filteredBusinesses.filter((business) => (
    business.listing_type === 'physical'
    && business.location_lat
    && business.location_lng
    && !business.hide_exact_address
  )), [filteredBusinesses]);

  const onlineCount = businesses.filter((b) => b.listing_type === 'online').length;
  const verifiedCount = businesses.filter((b) => b.jewish_owned_status === 'verified' || b.verification_status === 'verified_owner').length;
  const verifiedBusinesses = useMemo(
    () => businesses.filter((b) => b.verification_status === 'verified_owner' || b.is_claimed || b.jewish_owned_status === 'verified'),
    [businesses]
  );

  return (
    <>
      {/* Hero */}
      <section className="overflow-hidden rounded-[30px] bg-slate-950 p-5 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 ring-1 ring-blue-400/30">
            <Store className="h-5 w-5 text-blue-300" />
          </div>
          <p className="text-[11px] font-black uppercase tracking-widest text-blue-300">JUnited Directory</p>
        </div>
        <h1 className="mt-3 text-[27px] font-black leading-tight tracking-tight text-white">
          Support Jewish<br />Business
        </h1>
        <p className="mt-2 text-[13px] font-semibold leading-5 text-slate-400">
          <em className="not-italic text-slate-300">Kol Yisrael arevim zeh lazeh</em> — Five Towns food, services, chessed, mikvahs, eruv info, rentals, and trusted local businesses in one place.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white/8 p-3 ring-1 ring-white/10">
            <p className="text-xl font-black text-white">{businesses.length}</p>
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Listed</p>
          </div>
          <div className="rounded-2xl bg-white/8 p-3 ring-1 ring-white/10">
            <p className="text-xl font-black text-white">{verifiedCount}</p>
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Verified</p>
          </div>
          <div className="rounded-2xl bg-white/8 p-3 ring-1 ring-white/10">
            <p className="text-xl font-black text-white">{onlineCount}</p>
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Online</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => setShowSubmit(true)} className="motion-press inline-flex h-10 items-center gap-2 rounded-full bg-white px-5 text-sm font-black text-slate-950">
            <Plus className="h-3.5 w-3.5" />
            List a Business
          </button>
          {(ownerManagerRows.length > 0 || claimRequests.length > 0) && (
            <button type="button" onClick={() => setShowOwnerTools(true)} className="motion-press inline-flex h-10 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 text-sm font-black text-white">
              <Edit3 className="h-3.5 w-3.5" />
              Owner Tools
            </button>
          )}
        </div>
      </section>

      {locationStatus === 'denied' && (
        <section className="mt-3 rounded-[22px] border border-amber-200 bg-amber-50 p-3">
          <p className="text-[13px] font-black text-amber-900">Location is off</p>
          <p className="mt-1 text-[12px] font-semibold leading-5 text-amber-800">
            Turn on location access to see distances and directions for nearby businesses.
          </p>
        </section>
      )}

      {/* Category grid */}
      <section className="mt-3">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {BUSINESS_CATEGORIES.map((cat) => {
            const CatIcon = cat.icon;
            const isActive = category === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setCategory(cat.key)}
                className={`motion-press flex flex-col items-center gap-2 rounded-[20px] border p-3 text-center transition ${isActive ? `${cat.chipActive} border-transparent` : cat.chipInactive}`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isActive ? 'bg-white/20' : cat.iconBg}`}>
                  <CatIcon className={`h-5 w-5 ${isActive ? 'text-current opacity-90' : cat.iconColor}`} />
                </div>
                <span className="text-[10px] font-black leading-tight">{cat.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Verified strip */}
      {verifiedBusinesses.length > 0 && (
        <section className="mt-4">
          <div className="mb-2 flex items-center gap-1.5">
            <BadgeCheck className="h-4 w-4 text-blue-600" />
            <p className="text-[13px] font-black text-slate-900">Verified Jewish-Owned</p>
            <span className="ml-auto text-[11px] font-black text-slate-400">{verifiedBusinesses.length}</span>
          </div>
          <div className="mobile-scroll-x flex gap-2 pb-1">
            {verifiedBusinesses.map((business) => (
              <VerifiedBusinessChip key={business.id} business={business} onView={setSelectedBusiness} />
            ))}
          </div>
        </section>
      )}

      {/* Search + filter toolbar */}
      <section className="mt-3 rounded-[26px] border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search businesses, services, neighborhoods"
            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="shrink-0 text-slate-400">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {LISTING_TYPES.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setType(item.key)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-black ${type === item.key ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex w-fit shrink-0 rounded-full border border-slate-200 bg-slate-50 p-1">
            <button type="button" onClick={() => setMode('list')} className={`inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[11px] font-black ${mode === 'list' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>
              <List className="h-3 w-3" />
              List
            </button>
            <button type="button" onClick={() => setMode('map')} className={`inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[11px] font-black ${mode === 'map' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>
              <MapIcon className="h-3 w-3" />
              Map
            </button>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="mt-3">
        {isLoading ? (
          <div className="flex justify-center rounded-[26px] border border-slate-200 bg-white py-12">
            <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
          </div>
        ) : mode === 'map' ? (
          <Suspense fallback={<MapModuleFallback label="Loading business map..." />}>
            <BusinessMap businesses={mapBusinesses} userLocation={userLocation} />
          </Suspense>
        ) : filteredBusinesses.length === 0 ? (
          <div className="rounded-[26px] border border-dashed border-slate-200 bg-white p-6 text-center">
            <Store className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-base font-black text-slate-900">No approved listings match this view</p>
            <p className="mx-auto mt-1 max-w-sm text-sm font-semibold leading-6 text-slate-500">
              Switch categories or submit a local business so it can be reviewed for the directory.
            </p>
            <button type="button" onClick={() => setShowSubmit(true)} className="mt-4 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white">List a Business</button>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {filteredBusinesses.map((business) => (
              <BusinessCard key={business.id} business={business} onView={setSelectedBusiness} onClaim={setClaimBusiness} />
            ))}
          </div>
        )}
      </section>

      <SubmitBusinessModal open={showSubmit} onClose={() => setShowSubmit(false)} currentUser={currentUser} />
      <BusinessOwnerDashboard
        open={showOwnerTools}
        onClose={() => setShowOwnerTools(false)}
        currentUser={currentUser}
        ownerListings={ownerListings}
        managerRows={ownerManagerRows}
        claimRequests={claimRequests}
        reviews={ownerReviews}
      />
      <ClaimBusinessModal business={claimBusiness} onClose={() => setClaimBusiness(null)} currentUser={currentUser} />
      <BusinessDetailModal business={selectedBusiness} onClose={() => setSelectedBusiness(null)} onClaim={(business) => { setSelectedBusiness(null); setClaimBusiness(business); }} />
    </>
  );
}

function CommunityMapExperience({ userLocation, locationStatus, searchParams }) {
  const { user: currentUser } = useAuth();
  const [selectedCommunityIds, setSelectedCommunityIds] = useState(() => new Set());
  const [{ hiddenCommunityIds, hiddenPosterIds }, setMapFilterState] = useState(readMapFilterState);
  const [showMapFilters, setShowMapFilters] = useState(false);
  const categoryParam = searchParams.get('category') || 'kosher_food';
  const placeParam = searchParams.get('place') || '';

  const { data: requests = [] } = useQuery({
    queryKey: ['mitzvah-requests-map'],
    queryFn: () => listMitzvahRequest('-created_date', 100),
    staleTime: 120000,
  });

  const highlightedRequestId = searchParams.get('requestId');
  const highlightedRequest = useMemo(
    () => requests.find((request) => request.id === highlightedRequestId),
    [highlightedRequestId, requests]
  );

  const { data: memberships = [] } = useQuery({
    queryKey: ['map-community-memberships', currentUser?.id],
    queryFn: () => filterUserCommunity({ user_id: currentUser.id }, '-created_date', 100),
    enabled: COMMUNITIES_ENABLED && Boolean(currentUser?.id),
    staleTime: 120000,
  });

  const { data: communities = [] } = useQuery({
    queryKey: ['map-communities-directory'],
    queryFn: () => listCommunity('-follower_count', 200),
    enabled: COMMUNITIES_ENABLED,
    staleTime: 300000,
  });

  const { data: communityPosts = [] } = useQuery({
    queryKey: postKeys.map(),
    queryFn: () => listUnifiedPost('-created_date', 180),
    enabled: COMMUNITIES_ENABLED,
    staleTime: 120000,
  });

  const joinedCommunityIds = useMemo(() => new Set(memberships.map((m) => m.community_id)), [memberships]);
  const joinedCommunities = useMemo(() => communities.filter((c) => joinedCommunityIds.has(c.id)), [communities, joinedCommunityIds]);
  const communityById = useMemo(() => new Map(communities.map((c) => [c.id, c])), [communities]);

  const visibleCommunityIds = useMemo(() => {
    if (selectedCommunityIds.size > 0) return selectedCommunityIds;
    return new Set(joinedCommunities.map((c) => c.id));
  }, [joinedCommunities, selectedCommunityIds]);

  const communityPoints = useMemo(() => (
    communityPosts
      .filter((post) => post.community_id && joinedCommunityIds.has(post.community_id))
      .filter((post) => visibleCommunityIds.has(post.community_id))
      .filter((post) => !hiddenCommunityIds.has(post.community_id))
      .filter((post) => !hiddenPosterIds.has(post.user_id))
      .slice(0, 80)
      .map((post) => {
        const community = communityById.get(post.community_id);
        const location = resolvePostLocation(post);
        return {
          id: `community-post-${post.id}`,
          title: post.title || post.body?.slice(0, 70) || 'Community update',
          description: post.body || post.prompt_text || 'Shared by a community member.',
          location_text: post.location_text || location.label,
          location_lat: location.lat,
          location_lng: location.lng,
          communityId: post.community_id,
          communityName: post.community_name || community?.name || 'Joined community',
          posterId: post.user_id || null,
          posterName: post.user_name || 'Community member',
          type: 'community_post',
        };
      })
  ), [communityById, communityPosts, hiddenCommunityIds, hiddenPosterIds, joinedCommunityIds, visibleCommunityIds]);

  const mapPosters = useMemo(() => {
    const unique = new Map();
    communityPosts
      .filter((post) => post.community_id && joinedCommunityIds.has(post.community_id))
      .filter((post) => visibleCommunityIds.has(post.community_id))
      .filter((post) => !hiddenCommunityIds.has(post.community_id))
      .forEach((post) => {
        if (post.user_id && !unique.has(post.user_id)) unique.set(post.user_id, post.user_name || 'Community member');
      });
    return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
  }, [communityPosts, hiddenCommunityIds, joinedCommunityIds, visibleCommunityIds]);

  const persistFilterState = (next) => {
    setMapFilterState(next);
    window.localStorage.setItem(MAP_FILTER_STORAGE, JSON.stringify({
      hiddenCommunityIds: Array.from(next.hiddenCommunityIds),
      hiddenPosterIds: Array.from(next.hiddenPosterIds),
    }));
  };

  const toggleSelectedCommunity = (communityId) => {
    setSelectedCommunityIds((current) => {
      const next = new Set(current);
      if (next.has(communityId)) next.delete(communityId);
      else next.add(communityId);
      return next;
    });
  };

  const toggleHiddenCommunity = (communityId) => {
    const next = new Set(hiddenCommunityIds);
    if (next.has(communityId)) next.delete(communityId);
    else next.add(communityId);
    persistFilterState({ hiddenCommunityIds: next, hiddenPosterIds });
  };

  const toggleHiddenPoster = (posterId) => {
    const next = new Set(hiddenPosterIds);
    if (next.has(posterId)) next.delete(posterId);
    else next.add(posterId);
    persistFilterState({ hiddenCommunityIds, hiddenPosterIds: next });
  };

  return (
    <>
      {locationStatus === 'denied' && (
        <section className="mb-3 rounded-[22px] border border-amber-200 bg-amber-50 p-3">
          <p className="text-[13px] font-black text-amber-900">Location is off</p>
          <p className="mt-1 text-[12px] font-semibold leading-5 text-amber-800">
            Turn on location access and tap Near me to see distances and open exact directions.
          </p>
        </section>
      )}

      {highlightedRequest && (
        <section className="mb-3 rounded-[22px] border border-blue-200 bg-blue-50 p-3">
          <p className="text-[11px] font-black uppercase tracking-wide text-blue-700">Opened from Mitzvah Circle</p>
          <p className="mt-1 text-[15px] font-black text-slate-950">{highlightedRequest.title}</p>
          <p className="mt-1 text-[12px] font-semibold text-slate-600">
            {highlightedRequest.location_label || highlightedRequest.locationLabel || highlightedRequest.neighborhood || 'Five Towns'}
          </p>
        </section>
      )}

      {COMMUNITIES_ENABLED && <section className="surface-panel-soft mb-3 rounded-[24px] p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-black text-slate-950">
              <UsersRound className="h-4 w-4 text-blue-600" />
              My communities
            </p>
            <p className="mt-1 text-[12px] font-medium leading-5 text-slate-500">
              Tap to filter posts on the map.
            </p>
          </div>
          {communityPoints.length > 0 && (
            <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700">
              {communityPoints.length} posts
            </span>
          )}
        </div>

        <div className="mobile-scroll-x mt-3 flex gap-2 pb-1">
          {joinedCommunities.length > 0 ? joinedCommunities.map((community) => {
            const active = selectedCommunityIds.size === 0 || selectedCommunityIds.has(community.id);
            return (
              <button
                key={`map-community-${community.id}`}
                type="button"
                onClick={() => toggleSelectedCommunity(community.id)}
                className={`motion-press shrink-0 rounded-full border px-3 py-2 text-[12px] font-black transition ${active ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-600'}`}
              >
                {community.name}
              </button>
            );
          }) : (
            <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[12px] font-black text-slate-500">
              Join communities to map their posts.
            </span>
          )}
        </div>

        {(joinedCommunities.length > 0 || mapPosters.length > 0) && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowMapFilters(v => !v)}
              className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
            >
              <EyeOff className="h-3 w-3" />
              {showMapFilters ? 'Hide filters' : 'Filter / block from map'}
            </button>
            {showMapFilters && (
              <div className="mt-2 grid gap-2 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                  <p className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wide text-slate-500">
                    <EyeOff className="h-3.5 w-3.5" />
                    Block communities from map
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {joinedCommunities.map((community) => {
                      const blocked = hiddenCommunityIds.has(community.id);
                      return (
                        <button
                          key={`hide-community-${community.id}`}
                          type="button"
                          onClick={() => toggleHiddenCommunity(community.id)}
                          className={`motion-press rounded-full border px-2.5 py-1.5 text-[11px] font-black ${blocked ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
                        >
                          {blocked ? `Hidden: ${community.name}` : community.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                  <p className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wide text-slate-500">
                    <EyeOff className="h-3.5 w-3.5" />
                    Block people from map
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {mapPosters.length > 0 ? mapPosters.map((poster) => {
                      const blocked = hiddenPosterIds.has(poster.id);
                      return (
                        <button
                          key={`hide-poster-${poster.id}`}
                          type="button"
                          onClick={() => toggleHiddenPoster(poster.id)}
                          className={`motion-press rounded-full border px-2.5 py-1.5 text-[11px] font-black ${blocked ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
                        >
                          {blocked ? `Hidden: ${poster.name}` : poster.name}
                        </button>
                      );
                    }) : (
                      <span className="text-[12px] font-bold text-slate-400">Posters appear here when their map posts load.</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>}

      <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
        <Suspense fallback={<MapModuleFallback label="Loading community map..." />}>
          <MitzvahMap
            requests={requests}
            userLocation={userLocation}
            communityPoints={COMMUNITIES_ENABLED ? communityPoints : []}
            includeStaticPoints
            initialPrimaryFilter={categoryParam}
            highlightedPlace={placeParam}
            mapHeight="clamp(520px, 68dvh, 760px)"
          />
        </Suspense>
      </div>
    </>
  );
}

export default function MapPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const hasMapDeepLink = Boolean(searchParams.get('category') || searchParams.get('requestId') || searchParams.get('place'));
  const [activeView, setActiveView] = useState('businesses');
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle');

  const requestUserLocation = (rememberPrompt = false) => {
    if (!navigator.geolocation) {
      setLocationStatus('unavailable');
      return;
    }
    setLocationStatus('requesting');
    if (rememberPrompt) {
      window.sessionStorage.setItem(MAP_LOCATION_PROMPT_KEY, '1');
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        setUserLocation({ lat, lng });
        setLocationStatus('allowed');
      },
      () => setLocationStatus('denied'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.sessionStorage.getItem(MAP_LOCATION_PROMPT_KEY)) return;
    requestUserLocation(true);
  }, []);

  useEffect(() => {
    if (hasMapDeepLink) setActiveView('community');
  }, [hasMapDeepLink]);

  const handleUseMyLocation = () => requestUserLocation(true);
  const isDeepLinkedMap = searchParams.toString().length > 0;
  const switchView = (view) => {
    setActiveView(view);
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
  };

  return (
    <main className="app-page min-h-screen mobile-safe-bottom">
      <div className="sticky top-0 z-[60]">
        <DestinationHeader
          sticky={false}
          veil={false}
          showBack={isDeepLinkedMap}
          backTo="/Feed"
          icon={Store}
          title={activeView === 'businesses' ? 'Our Businesses' : 'Five Towns Map'}
          help={<PageHelp text="Discover trusted Jewish-owned businesses, kosher spots, and local services near you or online." />}
          actions={(
            <button
              onClick={handleUseMyLocation}
              className="motion-press inline-flex h-9 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-black text-blue-700 shadow-sm transition hover:bg-blue-100"
            >
              <Navigation className="h-3.5 w-3.5" />
              {locationStatus === 'requesting' ? 'Locating...' : userLocation ? 'Using location' : 'Near me'}
            </button>
          )}
        />

        {/* View toggle — grouped in the same sticky wrapper as the header so it stays anchored without guessing the header's height */}
        <div className="mobile-page-wide px-3 pb-2 pt-1 sm:px-4">
        <div className="glass-toolbar grid grid-cols-2 gap-1.5 rounded-2xl p-1">
          <button
            type="button"
            onClick={() => switchView('businesses')}
            className={`flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-black transition ${activeView === 'businesses' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}
          >
            <Store className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Businesses</span>
          </button>
          <button
            type="button"
            onClick={() => switchView('community')}
            className={`flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-black transition ${activeView === 'community' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{COMMUNITIES_ENABLED ? 'Community Map' : 'Local Map'}</span>
          </button>
        </div>
        </div>
      </div>

      <div className="mobile-page-wide px-3 pt-1 sm:px-4">

        <LiveNowRail
          className="mb-3"
          title="Activity map"
          subtitle="Live needs, minyanim, and trusted places around the Five Towns"
          items={buildMapLiveNowItems()}
          onItemClick={(item) => navigate(item.href || '/Map')}
        />

        {activeView === 'businesses' ? (
          <BusinessDirectoryExperience
            currentUser={currentUser}
            userLocation={userLocation}
            locationStatus={locationStatus}
          />
        ) : (
          <CommunityMapExperience
            userLocation={userLocation}
            locationStatus={locationStatus}
            searchParams={searchParams}
          />
        )}
      </div>
    </main>
  );
}
