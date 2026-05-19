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

const seedListings = [
  {
    id: 'mk-1',
    section: 'sale',
    title: 'White crib + mattress, excellent condition',
    price: '$120',
    category: 'Baby / Kids gear',
    condition: 'Very good',
    neighborhood: 'Woodmere',
    delivery: 'Pickup',
    seller: 'Rachel S.',
    sellerInitials: 'RS',
    communities: ['Five Towns Local', 'Young Israel Woodmere'],
    posted: '12 min ago',
    urgency: 'soon',
    urgencyLabel: 'Need gone by Friday',
    reason: 'Upgrading',
    interested: 3,
    photoTone: 'from-sky-200 via-white to-blue-100',
    trust: 'From your community',
    details: 'Disassembled and ready near Broadway. Clean home, easy porch pickup.',
  },
  {
    id: 'mk-2',
    section: 'free',
    title: 'Extra challah rolls and kugel for Shabbos',
    price: 'Free',
    category: 'Food / Shabbos extras',
    condition: 'Fresh',
    neighborhood: 'Cedarhurst',
    delivery: 'Pickup today',
    seller: 'Leah K.',
    sellerInitials: 'LK',
    communities: ['Chesed / Mitzvah Updates', 'Five Towns Local'],
    posted: '20 min ago',
    urgency: 'shabbos',
    urgencyLabel: 'Before Shabbos',
    reason: 'Extra item',
    interested: 6,
    photoTone: 'from-amber-200 via-white to-orange-100',
    trust: 'Chesed ready',
    details: 'Good for a family that could use a little extra. Message for address.',
  },
  {
    id: 'mk-3',
    section: 'looking',
    title: 'Looking for a used Gemara Bava Kama',
    price: 'Wanted',
    category: 'Judaica',
    condition: 'Any usable condition',
    neighborhood: 'Lawrence',
    delivery: 'Pickup or meet',
    seller: 'Avi R.',
    sellerInitials: 'AR',
    communities: ['Daily Torah', 'Learning Gemara'],
    posted: '34 min ago',
    urgency: 'normal',
    urgencyLabel: 'Needed this week',
    reason: 'School / learning',
    interested: 2,
    photoTone: 'from-violet-200 via-white to-indigo-100',
    trust: 'Learning circle',
    details: 'Need for a night seder chavrusa. Fine with notes in the margins.',
  },
  {
    id: 'mk-4',
    section: 'urgent',
    title: 'Dining room table, seats 8',
    price: '$75',
    category: 'Furniture',
    condition: 'Good',
    neighborhood: 'Inwood',
    delivery: 'Pickup only',
    seller: 'Mordy B.',
    sellerInitials: 'MB',
    communities: ['Five Towns Local'],
    posted: '1 hr ago',
    urgency: 'urgent',
    urgencyLabel: 'Need gone ASAP',
    reason: 'Moving',
    interested: 8,
    photoTone: 'from-rose-200 via-white to-red-100',
    trust: 'Verified neighbor',
    details: 'Apartment move. First person who can pick up gets priority.',
  },
  {
    id: 'mk-5',
    section: 'sale',
    title: 'Boys Shabbos suits, sizes 8-10',
    price: '$25 each',
    category: 'Clothing',
    condition: 'Gently used',
    neighborhood: 'Hewlett',
    delivery: 'Pickup',
    seller: 'Sara M.',
    sellerInitials: 'SM',
    communities: ['Five Towns Moms', 'Five Towns Local'],
    posted: '2 hrs ago',
    urgency: 'normal',
    urgencyLabel: 'Flexible',
    reason: 'Kids outgrew',
    interested: 4,
    photoTone: 'from-cyan-200 via-white to-teal-100',
    trust: 'Friends in common',
    details: 'Navy and charcoal. Happy to send measurements before pickup.',
  },
  {
    id: 'mk-6',
    section: 'sale',
    title: 'Basement sublet near Central Ave',
    price: '$1,350/mo',
    category: 'Apartments / sublets',
    condition: 'Available soon',
    neighborhood: 'Cedarhurst',
    delivery: 'Tour by appointment',
    seller: 'Dovid P.',
    sellerInitials: 'DP',
    communities: ['Five Towns Local', 'Business / Hustle'],
    posted: 'Today',
    urgency: 'soon',
    urgencyLabel: 'Available before Yom Tov',
    reason: 'Pre-Yom Tov deal',
    interested: 11,
    photoTone: 'from-emerald-200 via-white to-lime-100',
    trust: 'Local listing',
    details: 'Quiet block. Good for one person. Utilities partly included.',
  },
  {
    id: 'mk-7',
    section: 'free',
    title: 'Box of children’s Jewish books',
    price: 'Free',
    category: 'Books / school supplies',
    condition: 'Good',
    neighborhood: 'Lawrence',
    delivery: 'Porch pickup',
    seller: 'Naomi W.',
    sellerInitials: 'NW',
    communities: ['Five Towns Local', 'Daily Torah'],
    posted: 'Today',
    urgency: 'free',
    urgencyLabel: 'Free / donation',
    reason: 'Extra item',
    interested: 5,
    photoTone: 'from-indigo-200 via-white to-sky-100',
    trust: 'From your community',
    details: 'Picture books, parsha stories, and a few early readers. Prefer one family takes all.',
  },
  {
    id: 'mk-8',
    section: 'sale',
    title: 'Double stroller, folds easily',
    price: '$90',
    category: 'Baby / Kids gear',
    condition: 'Used',
    neighborhood: 'Inwood',
    delivery: 'Pickup',
    seller: 'Esti F.',
    sellerInitials: 'EF',
    communities: ['Five Towns Moms', 'Five Towns Local'],
    posted: 'Today',
    urgency: 'normal',
    urgencyLabel: 'Flexible',
    reason: 'Kids outgrew',
    interested: 7,
    photoTone: 'from-pink-200 via-white to-rose-100',
    trust: 'Friends in common',
    details: 'City Mini style stroller. Some wear, but wheels and fold work well.',
  },
  {
    id: 'mk-9',
    section: 'looking',
    title: 'Looking for folding chairs for simcha',
    price: 'Wanted',
    category: 'Furniture',
    condition: 'Borrow or buy',
    neighborhood: 'Woodmere',
    delivery: 'Can pick up',
    seller: 'Yossi T.',
    sellerInitials: 'YT',
    communities: ['Five Towns Local', 'Young Israel Woodmere'],
    posted: 'Today',
    urgency: 'soon',
    urgencyLabel: 'Needed by Thursday',
    reason: 'Event',
    interested: 3,
    photoTone: 'from-slate-200 via-white to-blue-100',
    trust: 'Verified neighbor',
    details: 'Need 12-18 chairs for a small vort. Happy to return right after.',
  },
  {
    id: 'mk-10',
    section: 'sale',
    title: 'Silver kiddush cup set',
    price: '$55',
    category: 'Judaica',
    condition: 'Very good',
    neighborhood: 'Cedarhurst',
    delivery: 'Pickup or meet',
    seller: 'Tali B.',
    sellerInitials: 'TB',
    communities: ['Daily Torah', 'Five Towns Local'],
    posted: 'Yesterday',
    urgency: 'normal',
    urgencyLabel: 'Flexible',
    reason: 'Upgrading',
    interested: 4,
    photoTone: 'from-violet-200 via-white to-fuchsia-100',
    trust: 'Learning circle',
    details: 'Nice set for a new apartment or chosson/kallah gift. Light polish needed.',
  },
  {
    id: 'mk-11',
    section: 'urgent',
    title: 'Queen bed frame, must go tonight',
    price: '$40',
    category: 'Furniture',
    condition: 'Good',
    neighborhood: 'Hewlett',
    delivery: 'Pickup only',
    seller: 'Daniel G.',
    sellerInitials: 'DG',
    communities: ['Five Towns Local'],
    posted: '18 min ago',
    urgency: 'urgent',
    urgencyLabel: 'Need gone tonight',
    reason: 'Need gone ASAP',
    interested: 9,
    photoTone: 'from-red-200 via-white to-orange-100',
    trust: 'Local listing',
    details: 'Moving tomorrow morning. Disassembled and ready by the door.',
  },
  {
    id: 'mk-12',
    section: 'sale',
    title: 'iPad 9th gen for school',
    price: '$160',
    category: 'Electronics',
    condition: 'Very good',
    neighborhood: 'Lawrence',
    delivery: 'Meet locally',
    seller: 'Shimon L.',
    sellerInitials: 'SL',
    communities: ['School Struggles', 'Five Towns Local'],
    posted: 'Yesterday',
    urgency: 'normal',
    urgencyLabel: 'Flexible',
    reason: 'Upgrading',
    interested: 6,
    photoTone: 'from-blue-200 via-white to-cyan-100',
    trust: 'From your community',
    details: 'Case included. Good for school apps and notes. Factory reset before pickup.',
  },
  {
    id: 'mk-13',
    section: 'free',
    title: 'Shabbos leftovers packed for pickup',
    price: 'Free',
    category: 'Food / Shabbos extras',
    condition: 'Fresh',
    neighborhood: 'Woodmere',
    delivery: 'Pickup today',
    seller: 'Miriam A.',
    sellerInitials: 'MA',
    communities: ['Chesed / Mitzvah Updates', 'Five Towns Local'],
    posted: '30 min ago',
    urgency: 'shabbos',
    urgencyLabel: 'Pick up today',
    reason: 'Extra item',
    interested: 12,
    photoTone: 'from-amber-200 via-white to-yellow-100',
    trust: 'Chesed ready',
    details: 'Chicken, sides, and challah packed separately. Best for a family who can use it.',
  },
  {
    id: 'mk-14',
    section: 'sale',
    title: 'Math and Hebrew school workbooks',
    price: '$15 bundle',
    category: 'Books / school supplies',
    condition: 'Like new',
    neighborhood: 'Cedarhurst',
    delivery: 'Porch pickup',
    seller: 'Rivky C.',
    sellerInitials: 'RC',
    communities: ['Five Towns Local'],
    posted: 'Yesterday',
    urgency: 'normal',
    urgencyLabel: 'Flexible',
    reason: 'School supplies',
    interested: 2,
    photoTone: 'from-lime-200 via-white to-emerald-100',
    trust: 'Local parent',
    details: 'Mostly unused pages. Good for extra practice or homeschool review.',
  },
  {
    id: 'mk-15',
    section: 'looking',
    title: 'Looking for teen babysitter Sunday',
    price: '$18/hr',
    category: 'Services',
    condition: 'Needed',
    neighborhood: 'Inwood',
    delivery: 'Come to home',
    seller: 'Chani R.',
    sellerInitials: 'CR',
    communities: ['Five Towns Local', 'Sports'],
    posted: 'Today',
    urgency: 'soon',
    urgencyLabel: 'Needed Sunday',
    reason: 'Service request',
    interested: 5,
    photoTone: 'from-emerald-200 via-white to-teal-100',
    trust: 'From your community',
    details: 'Two kids, 2-5pm. Prefer someone with local references.',
  },
  {
    id: 'mk-16',
    section: 'sale',
    title: 'Women’s sheitel stand and supplies',
    price: '$20',
    category: 'Miscellaneous',
    condition: 'Good',
    neighborhood: 'Hewlett',
    delivery: 'Pickup',
    seller: 'Devorah N.',
    sellerInitials: 'DN',
    communities: ['Five Towns Local'],
    posted: '2 days ago',
    urgency: 'normal',
    urgencyLabel: 'Flexible',
    reason: 'Extra item',
    interested: 1,
    photoTone: 'from-purple-200 via-white to-pink-100',
    trust: 'Local listing',
    details: 'Stand, travel bag, and a few unopened supplies.',
  },
  {
    id: 'mk-17',
    section: 'urgent',
    title: 'Pre-Yom Tov freezer cleanout',
    price: 'Free',
    category: 'Food / Shabbos extras',
    condition: 'Frozen',
    neighborhood: 'Lawrence',
    delivery: 'Pickup tonight',
    seller: 'Goldie H.',
    sellerInitials: 'GH',
    communities: ['Chesed / Mitzvah Updates'],
    posted: '45 min ago',
    urgency: 'urgent',
    urgencyLabel: 'Pickup tonight',
    reason: 'Before Shabbos/Yom Tov',
    interested: 10,
    photoTone: 'from-orange-200 via-white to-amber-100',
    trust: 'Chesed ready',
    details: 'Soups and kugels labeled. Please only take if your family can use them.',
  },
  {
    id: 'mk-18',
    section: 'sale',
    title: 'Black hat, size 7 1/8',
    price: '$35',
    category: 'Clothing',
    condition: 'Good',
    neighborhood: 'Woodmere',
    delivery: 'Pickup or meet',
    seller: 'Moshe K.',
    sellerInitials: 'MK',
    communities: ['Daily Torah', 'Five Towns Local'],
    posted: '2 days ago',
    urgency: 'normal',
    urgencyLabel: 'Flexible',
    reason: 'Upgrading',
    interested: 3,
    photoTone: 'from-slate-300 via-white to-slate-100',
    trust: 'From your community',
    details: 'Good backup hat. Box included.',
  },
];

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
  const [listings, setListings] = useState(seedListings);

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
      <section className="mobile-page px-3 pt-3">
        <div className="rounded-[28px] border border-blue-100 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-blue-700">
                <ShoppingBag className="h-3.5 w-3.5" />
                Trusted local marketplace
              </div>
              <h1 className="mt-3 text-[28px] font-black leading-8 text-slate-950">Marketplace</h1>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                Buy, sell, request, and give away useful things through people connected to your Jewish community.
              </p>
            </div>
            <button
              onClick={() => setShowPost(true)}
              className="motion-press flex h-12 shrink-0 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white"
            >
              <ShoppingBag className="h-4 w-4" />
              Post
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              ['18', 'new today'],
              ['7', 'free items'],
              ['5', 'urgent'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl bg-slate-50 px-3 py-2">
                <p className="text-lg font-black text-slate-950">{value}</p>
                <p className="text-[11px] font-bold text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>

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
            <button className="motion-press ml-auto inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[12px] font-black text-slate-500 ring-1 ring-slate-200">
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
            <h2 className="mt-3 text-base font-black text-slate-900">Nothing matches yet</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Try a different category or post what you are looking for.</p>
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
