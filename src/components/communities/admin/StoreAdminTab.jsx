import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  DollarSign,
  Eye,
  FilePlus,
  Image,
  Loader2,
  Package,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { deleteCommunityListing } from '@/services/entityServices';

// ── Store Admin Tab ───────────────────────────────────────────────────────────

async function uploadListingImageAdmin(file) {
  const ext = file.name.split('.').pop();
  const path = `listing-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('community-images').upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('community-images').getPublicUrl(path);
  return data.publicUrl;
}

const STORE_TYPE_CONFIG = {
  subscription: { label: 'Subscription', color: 'bg-violet-100 text-violet-700' },
  product:      { label: 'Product',      color: 'bg-blue-100 text-blue-700'   },
  service:      { label: 'Service',      color: 'bg-teal-100 text-teal-700'   },
};

function StoreListingForm({ communityId, currentUser, listing, onClose, onSaved }) {
  const [form, setForm] = useState({
    type:           listing?.type           || 'product',
    title:          listing?.title          || '',
    description:    listing?.description    || '',
    price:          listing?.price != null  ? String(listing.price) : '',
    billing_period: listing?.billing_period || 'one_time',
    perks:          listing?.perks?.join('\n') || '',
    image_url:      listing?.image_url      || '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isEdit = !!listing?.id;

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadListingImageAdmin(file);
      setForm(f => ({ ...f, image_url: url }));
    } catch { toast.error('Upload failed'); }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    const payload = {
      community_id:   communityId,
      type:           form.type,
      title:          form.title.trim(),
      description:    form.description.trim(),
      price:          form.price ? parseFloat(form.price) : null,
      billing_period: form.billing_period,
      perks:          form.perks ? form.perks.split('\n').map(p => p.trim()).filter(Boolean) : [],
      image_url:      form.image_url || null,
      is_active:      true,
      seller_id:      currentUser?.id,
      seller_name:    currentUser?.full_name,
    };
    try {
      let saved;
      if (isEdit) {
        const { data, error } = await supabase
          .from('community_listings')
          .update(payload)
          .eq('id', listing.id)
          .select()
          .single();
        if (error) throw error;
        saved = data;
      } else {
        const { data, error } = await supabase
          .from('community_listings')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        saved = data;
      }
      toast.success(isEdit ? 'Listing updated!' : 'Listing created!');
      onSaved(saved);
    } catch (err) { toast.error(err.message || 'Failed to save listing'); }
    setSaving(false);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-black text-slate-800">{isEdit ? 'Edit Listing' : 'New Listing'}</p>
        <button onClick={onClose}><X className="w-4 h-4 text-slate-400" /></button>
      </div>

      {/* Type */}
      <div className="flex gap-2">
        {Object.entries(STORE_TYPE_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setForm(f => ({ ...f, type: key }))}
            className={`flex-1 py-2 rounded-xl border text-[11px] font-bold transition-all ${
              form.type === key ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500'
            }`}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      <input
        value={form.title}
        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        placeholder="Title *"
        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[13px] outline-none focus:border-blue-400 bg-white"
      />

      <textarea
        value={form.description}
        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        rows={2}
        placeholder="Description (optional)"
        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] outline-none focus:border-blue-400 resize-none bg-white"
      />

      <div className="flex gap-2">
        <div className="relative flex-1">
          <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="number" min="0" step="0.01"
            value={form.price}
            onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
            placeholder="Price"
            className="w-full pl-7 pr-2 py-2 border border-slate-200 rounded-xl text-[13px] outline-none focus:border-blue-400 bg-white"
          />
        </div>
        <select
          value={form.billing_period}
          onChange={e => setForm(f => ({ ...f, billing_period: e.target.value }))}
          className="flex-1 border border-slate-200 rounded-xl px-2 py-2 text-[12px] outline-none focus:border-blue-400 bg-white"
        >
          <option value="one_time">One-time</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      {(form.type === 'subscription' || form.type === 'service') && (
        <textarea
          value={form.perks}
          onChange={e => setForm(f => ({ ...f, perks: e.target.value }))}
          rows={2}
          placeholder="Perks (one per line)"
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] outline-none focus:border-blue-400 resize-none bg-white"
        />
      )}

      <div>
        {form.image_url ? (
          <div className="relative">
            <img src={form.image_url} alt="" className="w-full h-20 object-cover rounded-xl" />
            <button
              onClick={() => setForm(f => ({ ...f, image_url: '' }))}
              className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow"
            >
              <X className="w-3 h-3 text-slate-500" />
            </button>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl h-12 cursor-pointer hover:border-blue-300 transition-colors bg-white">
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" /> : <Image className="w-3.5 h-3.5 text-slate-400" />}
            <span className="text-[11px] text-slate-400">{uploading ? 'Uploading…' : 'Add image'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2.5 rounded-xl font-bold text-white text-[13px] bg-slate-950 disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
        {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Listing'}
      </button>
    </div>
  );
}

export default function StoreAdminTab({ community, communityId, currentUser }) {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['admin-community-listings', communityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_listings')
        .select('*')
        .eq('community_id', communityId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!communityId,
  });

  const toggleActive = async (listing) => {
    const { error } = await supabase
      .from('community_listings')
      .update({ is_active: !listing.is_active, status: listing.is_active ? 'removed' : 'available' })
      .eq('id', listing.id);
    if (error) { toast.error('Could not update listing'); return; }
    qc.setQueryData(['admin-community-listings', communityId], prev =>
      (prev || []).map(l => l.id === listing.id ? { ...l, is_active: !l.is_active } : l)
    );
    qc.invalidateQueries({ queryKey: ['community-listings', communityId] });
    toast.success(listing.is_active ? 'Listing hidden' : 'Listing made active');
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this listing?')) return;
    try {
      await deleteCommunityListing(id);
    } catch { toast.error('Could not delete listing'); return; }
    qc.setQueryData(['admin-community-listings', communityId], prev => (prev || []).filter(l => l.id !== id));
    qc.invalidateQueries({ queryKey: ['community-listings', communityId] });
    toast.success('Listing deleted');
  };

  const handleSaved = (saved) => {
    qc.setQueryData(['admin-community-listings', communityId], prev =>
      prev?.find(l => l.id === saved.id)
        ? prev.map(l => l.id === saved.id ? saved : l)
        : [saved, ...(prev || [])]
    );
    qc.invalidateQueries({ queryKey: ['community-listings', communityId] });
    setShowCreate(false);
    setEditingId(null);
  };

  const enabled = Boolean(community?.allow_member_listings);

  return (
    <div className="space-y-4 pb-8">
      {/* Module status notice */}
      {!enabled && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-[12px] font-semibold text-amber-800">
          The <strong>Marketplace</strong> module is currently off. Enable it in Settings → Modules for members to see the Store tab.
        </div>
      )}

      {/* Checkout coming soon notice */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-[12px] font-semibold text-slate-600">
        <strong>Checkout coming soon.</strong> Listing management is live. Payment processing via Stripe Connect will be enabled once the platform payment foundation ships.
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-[14px] font-black text-slate-900 flex items-center gap-2">
            <Package className="h-4 w-4 text-blue-500" /> Listings
          </p>
          <p className="text-[12px] font-semibold text-slate-400">{listings.length} total</p>
        </div>
        {!showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-slate-950 text-white rounded-full px-3 py-1.5 text-[12px] font-bold active:scale-95 transition-all"
          >
            <FilePlus className="h-3.5 w-3.5" /> New Listing
          </button>
        )}
      </div>

      {showCreate && (
        <StoreListingForm
          communityId={communityId}
          currentUser={currentUser}
          onClose={() => setShowCreate(false)}
          onSaved={handleSaved}
        />
      )}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        </div>
      ) : listings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center">
          <ShoppingBag className="mx-auto h-8 w-8 text-slate-300 mb-2" />
          <p className="text-[13px] font-black text-slate-700">No listings yet</p>
          <p className="text-[12px] font-semibold text-slate-400 mt-0.5">Create your first product, service, or subscription.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {listings.map((listing) => {
            const typeCfg = STORE_TYPE_CONFIG[listing.type] || STORE_TYPE_CONFIG.product;
            const isEditing = editingId === listing.id;
            return (
              <div key={listing.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                {isEditing ? (
                  <div className="p-4">
                    <StoreListingForm
                      communityId={communityId}
                      currentUser={currentUser}
                      listing={listing}
                      onClose={() => setEditingId(null)}
                      onSaved={handleSaved}
                    />
                  </div>
                ) : (
                  <div className="flex items-start gap-3 px-4 py-3">
                    {listing.image_url ? (
                      <img src={listing.image_url} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <ShoppingBag className="h-4 w-4 text-slate-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[13px] font-black text-slate-900 truncate">{listing.title}</p>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${typeCfg.color}`}>
                          {typeCfg.label}
                        </span>
                        {!listing.is_active && (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide bg-slate-100 text-slate-500">
                            Hidden
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-[12px] font-bold text-slate-700">
                          {listing.price == null || listing.price === 0
                            ? 'Free'
                            : `$${listing.price}${listing.billing_period === 'monthly' ? '/mo' : listing.billing_period === 'yearly' ? '/yr' : ''}`}
                        </span>
                        {listing.orders_count > 0 && (
                          <span className="text-[11px] text-slate-400">{listing.orders_count} orders</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleActive(listing)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                          listing.is_active
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {listing.is_active ? 'Active' : 'Hidden'}
                      </button>
                      <button
                        onClick={() => setEditingId(listing.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(listing.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

