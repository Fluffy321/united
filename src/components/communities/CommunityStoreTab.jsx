import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Plus, ShoppingBag, Repeat, Wrench, X, DollarSign,
  Loader2, ImageIcon, CheckCircle, Trash2, Package
} from 'lucide-react';
import { toast } from 'sonner';

const TYPE_CONFIG = {
  subscription: { label: 'Subscription', icon: Repeat,     color: 'from-violet-500 to-purple-600', badge: 'bg-violet-100 text-violet-700' },
  product:      { label: 'Product',      icon: ShoppingBag, color: 'from-blue-500 to-indigo-600',   badge: 'bg-blue-100 text-blue-700'   },
  service:      { label: 'Service',      icon: Wrench,      color: 'from-teal-500 to-emerald-600',  badge: 'bg-teal-100 text-teal-700'   },
};

const PERIOD_LABELS = { one_time: '', monthly: '/mo', yearly: '/yr' };

// ── Create / Edit listing modal ──────────────────────────────────────────────
function ListingModal({ communityId, currentUser, listing, onClose, onSaved }) {
  const [form, setForm] = useState({
    type: listing?.type || 'subscription',
    title: listing?.title || '',
    description: listing?.description || '',
    price: listing?.price != null ? String(listing.price) : '',
    billing_period: listing?.billing_period || 'one_time',
    perks: listing?.perks?.join('\n') || '',
    image_url: listing?.image_url || '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isEdit = !!listing?.id;

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(f => ({ ...f, image_url: file_url }));
    } catch { toast.error('Upload failed'); }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.price) { toast.error('Title and price are required'); return; }
    setSaving(true);
    const payload = {
      community_id: communityId,
      type: form.type,
      title: form.title.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price),
      billing_period: form.billing_period,
      perks: form.perks ? form.perks.split('\n').map(p => p.trim()).filter(Boolean) : [],
      image_url: form.image_url,
      is_active: true,
      seller_id: currentUser?.id,
      seller_name: currentUser?.full_name,
    };
    try {
      const saved = isEdit
        ? await base44.entities.CommunityListing.update(listing.id, payload)
        : await base44.entities.CommunityListing.create(payload);
      toast.success(isEdit ? 'Listing updated!' : 'Listing created!');
      onSaved(saved);
    } catch { toast.error('Failed to save listing'); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-slate-900">{isEdit ? 'Edit Listing' : 'New Listing'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        {/* Type */}
        <div>
          <p className="text-[12px] font-semibold text-slate-500 mb-2">Type</p>
          <div className="flex gap-2">
            {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
              const Icon = cfg.icon;
              return (
                <button
                  key={key}
                  onClick={() => setForm(f => ({ ...f, type: key }))}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-2xl border text-[11px] font-bold transition-all ${
                    form.type === key ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Title */}
        <div>
          <p className="text-[12px] font-semibold text-slate-500 mb-1">Title *</p>
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Premium Member, Shabbos Box, Torah Class"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[14px] outline-none focus:border-blue-400"
          />
        </div>

        {/* Description */}
        <div>
          <p className="text-[12px] font-semibold text-slate-500 mb-1">Description</p>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={2}
            placeholder="What does this include?"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-blue-400 resize-none"
          />
        </div>

        {/* Price + billing */}
        <div className="flex gap-3">
          <div className="flex-1">
            <p className="text-[12px] font-semibold text-slate-500 mb-1">Price (USD) *</p>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="number" min="0" step="0.01"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="0.00"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-[14px] outline-none focus:border-blue-400"
              />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-[12px] font-semibold text-slate-500 mb-1">Billing</p>
            <select
              value={form.billing_period}
              onChange={e => setForm(f => ({ ...f, billing_period: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[14px] outline-none focus:border-blue-400 bg-white"
            >
              <option value="one_time">One-time</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>

        {/* Perks (subscriptions & services) */}
        {(form.type === 'subscription' || form.type === 'service') && (
          <div>
            <p className="text-[12px] font-semibold text-slate-500 mb-1">Perks / Includes (one per line)</p>
            <textarea
              value={form.perks}
              onChange={e => setForm(f => ({ ...f, perks: e.target.value }))}
              rows={3}
              placeholder={"Exclusive content\nPriority seating\nMonthly Q&A session"}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-blue-400 resize-none"
            />
          </div>
        )}

        {/* Image */}
        <div>
          <p className="text-[12px] font-semibold text-slate-500 mb-1">Image (optional)</p>
          {form.image_url ? (
            <div className="relative">
              <img src={form.image_url} alt="" className="w-full h-28 object-cover rounded-xl" />
              <button
                onClick={() => setForm(f => ({ ...f, image_url: '' }))}
                className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow"
              >
                <X className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl h-20 cursor-pointer hover:border-blue-300 transition-colors">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <ImageIcon className="w-4 h-4 text-slate-400" />}
              <span className="text-[12px] text-slate-400">{uploading ? 'Uploading…' : 'Upload image'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-2xl font-bold text-white text-[14px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Listing'}
        </button>
      </div>
    </div>
  );
}

// ── Individual listing card ──────────────────────────────────────────────────
function ListingCard({ listing, isAdmin, currentUser, onDelete }) {
  const [buying, setBuying] = useState(false);
  const cfg = TYPE_CONFIG[listing.type] || TYPE_CONFIG.product;
  const Icon = cfg.icon;
  const suffix = PERIOD_LABELS[listing.billing_period] || '';

  const handleBuy = async () => {
    toast.info('Store checkout is coming soon. No money was processed.');
  };

  const handleDelete = async () => {
    if (!confirm('Delete this listing?')) return;
    await base44.entities.CommunityListing.delete(listing.id);
    onDelete(listing.id);
    toast.success('Listing deleted');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {listing.image_url && (
        <img src={listing.image_url} alt={listing.title} className="w-full h-32 object-cover" />
      )}
      {!listing.image_url && (
        <div className={`h-2 bg-gradient-to-r ${cfg.color}`} />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold rounded-full px-2 py-0.5 mb-1 ${cfg.badge}`}>
              <Icon className="w-3 h-3" />{cfg.label}
            </span>
            <p className="text-[14px] font-bold text-slate-900 leading-snug">{listing.title}</p>
          </div>
          {isAdmin && (
            <button onClick={handleDelete} className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {listing.description && (
          <p className="text-[12px] text-slate-500 mb-3 line-clamp-2">{listing.description}</p>
        )}

        {listing.perks?.length > 0 && (
          <ul className="space-y-1 mb-3">
            {listing.perks.slice(0, 4).map((perk, i) => (
              <li key={i} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                {perk}
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-between gap-3 mt-2">
          <div>
            <span className="text-[18px] font-black text-slate-900">
              {listing.price === 0 ? 'Free' : `$${listing.price}${suffix}`}
            </span>
            {listing.orders_count > 0 && (
              <span className="ml-2 text-[10px] text-slate-400">{listing.orders_count} orders</span>
            )}
          </div>
          {listing.price > 0 && (
            <button
              onClick={handleBuy}
              disabled
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-bold text-white transition-all bg-slate-300 cursor-not-allowed"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Coming Soon
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Donation section ─────────────────────────────────────────────────────────
function DonationSection({ community }) {
  const PRESETS = [18, 36, 54, 100, 180];
  const [amount, setAmount] = useState('');
  const [custom, setCustom] = useState('');
  const [loading, setLoading] = useState(false);

  const selected = custom ? parseFloat(custom) : parseFloat(amount);

  const handleDonate = async () => {
    toast.info('Community donations are coming soon. No money was processed.');
  };

  return (
    <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">❤️</span>
        <p className="text-[15px] font-bold text-slate-900">Support {community.name}</p>
      </div>
      <p className="text-[12px] text-slate-500 mb-2">Your donation directly supports this community.</p>
      <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-semibold text-amber-800">
        Demo only: donation checkout is not live yet.
      </p>
      <div className="flex flex-wrap gap-2 mb-3">
        {PRESETS.map(a => (
          <button
            key={a}
            onClick={() => { setAmount(String(a)); setCustom(''); }}
            className={`px-4 py-2 rounded-full text-[13px] font-bold border transition-all active:scale-95 ${
              amount === String(a) && !custom ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            ${a}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="number" min="1" placeholder="Custom"
            value={custom}
            onChange={e => { setCustom(e.target.value); setAmount(''); }}
            className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-[14px] outline-none focus:border-rose-300 bg-white"
          />
        </div>
        <button
          onClick={handleDonate}
          disabled
          className="px-5 py-2.5 rounded-xl font-bold text-white text-[13px] bg-slate-300 cursor-not-allowed transition-all flex items-center gap-1.5"
        >
          ❤️
          Soon
        </button>
      </div>
    </div>
  );
}

// ── Main tab ─────────────────────────────────────────────────────────────────
export default function CommunityStoreTab({ communityId, community, currentUser, isAdmin }) {
  const [showCreate, setShowCreate] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['community-listings', communityId],
    queryFn: () => base44.entities.CommunityListing.filter({ community_id: communityId, is_active: true }, 'created_date', 100),
    enabled: !!communityId,
  });

  const filtered = activeFilter === 'all' ? listings : listings.filter(l => l.type === activeFilter);

  const handleSaved = (saved) => {
    queryClient.setQueryData(['community-listings', communityId], prev =>
      prev?.find(l => l.id === saved.id)
        ? prev.map(l => l.id === saved.id ? saved : l)
        : [saved, ...(prev || [])]
    );
    setShowCreate(false);
  };

  const handleDelete = (id) => {
    queryClient.setQueryData(['community-listings', communityId], prev => (prev || []).filter(l => l.id !== id));
  };

  return (
    <div className="py-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-500" /> Community Store
          </h2>
          <p className="text-[12px] text-slate-500 mt-0.5">Support {community?.name} with a membership, purchase, or donation</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-blue-600 text-white rounded-full px-3 py-2 text-[12px] font-bold hover:bg-blue-700 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        )}
      </div>

      {/* Donation section always visible */}
      <DonationSection community={community} />

      {/* Filter pills */}
      {listings.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {[
            { key: 'all', label: 'All' },
            { key: 'subscription', label: '🔁 Subscriptions' },
            { key: 'product', label: '📦 Products' },
            { key: 'service', label: '🛠️ Services' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${
                activeFilter === f.key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Listings grid */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-100 p-10 text-center">
          <div className="text-4xl mb-3">🏪</div>
          <p className="text-[14px] font-bold text-slate-800">
            {listings.length === 0 ? 'No listings yet' : 'No listings in this category'}
          </p>
          <p className="text-[12px] text-slate-400 mt-1">
            {isAdmin && listings.length === 0
              ? 'Add a subscription, product, or service offering for your community.'
              : 'Check back soon!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(l => (
            <ListingCard
              key={l.id}
              listing={l}
              isAdmin={isAdmin}
              currentUser={currentUser}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {isAdmin && listings.length === 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5">
          <p className="text-[13px] font-bold text-blue-800 mb-1">💡 Monetize your community</p>
          <ul className="text-[12px] text-blue-700 space-y-1 mb-3">
            <li>🔁 <strong>Subscriptions</strong> — Offer premium tiers with exclusive perks</li>
            <li>📦 <strong>Products</strong> — Sell merchandise, digital downloads, or Shabbos boxes</li>
            <li>🛠️ <strong>Services</strong> — List tutoring, catering, or other community services</li>
          </ul>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-blue-600 text-white rounded-full px-4 py-2 text-[12px] font-bold active:scale-95 transition-all"
          >
            + Create your first listing
          </button>
        </div>
      )}

      {showCreate && (
        <ListingModal
          communityId={communityId}
          currentUser={currentUser}
          onClose={() => setShowCreate(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
