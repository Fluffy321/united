import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Upload } from 'lucide-react';
import { dataService } from '@/services';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';

const CATEGORIES = [
  { key: 'restaurant', label: '🍽 Restaurant / Cafe' },
  { key: 'grocery', label: '🛒 Grocery / Supermarket' },
  { key: 'bakery', label: '🥐 Bakery' },
  { key: 'caterer', label: '🍴 Caterer' },
  { key: 'mikvah', label: '💧 Mikvah' },
  { key: 'judaica', label: '📖 Judaica Store' },
  { key: 'tutor', label: '📚 Tutor / Education' },
  { key: 'synagogue_supply', label: '✡ Synagogue Supply' },
  { key: 'other', label: '📦 Other' },
];

export default function CreateBusinessListing() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [form, setForm] = useState({
    name: '', category: 'restaurant', tagline: '', description: '',
    address: '', city: '', phone: '', website: '', email: '',
    hours: '', kosher_cert: '', logo_url: '',
  });

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const { file_url } = await dataService.integrations.Core.UploadFile({ file });
      set('logo_url', file_url);
    } catch { toast.error('Upload failed'); }
    setLogoUploading(false);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error('Business name is required'); return; }
    if (!form.category) { toast.error('Please select a category'); return; }
    setSubmitting(true);
    try {
      const listing = await dataService.entities.BusinessListing.create({
        ...form,
        owner_id: currentUser.id,
        owner_name: currentUser.full_name,
        owner_email: currentUser.email,
        is_active: true,
        plan: 'free',
        rating_avg: 0,
        review_count: 0,
      });
      toast.success('Business listed! You can upgrade to Premium for priority placement.');
      navigate(`/BusinessListing?id=${listing.id}`);
    } catch (e) {
      toast.error('Could not submit listing: ' + e.message);
    }
    setSubmitting(false);
  };

  if (!currentUser) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <div className="sticky top-0 z-20 bg-white border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <span className="font-bold text-slate-900">List Your Business</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Free callout */}
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-[13px] text-green-800 font-medium">
          ✅ Basic listing is <strong>free</strong>. Upgrade to Premium ($29/mo) for priority placement, photo gallery, and a verified badge.
        </div>

        <Section label="Business Name *">
          <input value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="e.g. Moshe's Falafel" className={inputCls} />
        </Section>

        <Section label="Category *">
          <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls}>
            {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </Section>

        <Section label="Tagline">
          <input value={form.tagline} onChange={e => set('tagline', e.target.value)}
            placeholder="One-line description shown in listings" className={inputCls} />
        </Section>

        <Section label="Description">
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="Tell people about your business..." className={`${inputCls} resize-none`} rows={3} />
        </Section>

        <Section label="Logo">
          <div className="flex items-center gap-3">
            {form.logo_url && <img src={form.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover" />}
            <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white cursor-pointer text-[13px] text-slate-700 font-medium hover:bg-slate-50">
              {logoUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {logoUploading ? 'Uploading…' : 'Upload Logo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </label>
          </div>
        </Section>

        <Section label="Address">
          <input value={form.address} onChange={e => set('address', e.target.value)}
            placeholder="Street address" className={inputCls} />
        </Section>

        <Section label="City / Neighborhood">
          <input value={form.city} onChange={e => set('city', e.target.value)}
            placeholder="e.g. Cedarhurst, NY" className={inputCls} />
        </Section>

        <Section label="Phone">
          <input value={form.phone} onChange={e => set('phone', e.target.value)}
            placeholder="(516) 555-1234" className={inputCls} />
        </Section>

        <Section label="Website">
          <input value={form.website} onChange={e => set('website', e.target.value)}
            placeholder="https://yourbusiness.com" className={inputCls} />
        </Section>

        <Section label="Hours">
          <input value={form.hours} onChange={e => set('hours', e.target.value)}
            placeholder="e.g. Mon–Thu 11am–9pm, Fri 11am–2pm" className={inputCls} />
        </Section>

        <Section label="Kosher Certification">
          <input value={form.kosher_cert} onChange={e => set('kosher_cert', e.target.value)}
            placeholder="e.g. OU, Star-K, CRC, Kehillah" className={inputCls} />
        </Section>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-[15px] flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-60"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {submitting ? 'Submitting…' : 'Submit Free Listing'}
        </button>
      </div>
    </div>
  );
}

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20";

function Section({ label, children }) {
  return (
    <div>
      <label className="block text-[12px] font-bold text-slate-600 mb-1.5">{label}</label>
      {children}
    </div>
  );
}