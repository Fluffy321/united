import React, { useState } from 'react';
import { toast } from 'sonner';
import { Crown, Loader2, Save } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { getCommunityTypeConfig } from '@/lib/communityTypes';
import { isCommunityPremium } from '@/lib/communityPlans';

// ─── Branding constants ───────────────────────────────────────────────────────

const ACCENT_COLORS = [
  { key: 'blue',    value: '#2563EB', label: 'Blue' },
  { key: 'violet',  value: '#7C3AED', label: 'Violet' },
  { key: 'emerald', value: '#059669', label: 'Emerald' },
  { key: 'rose',    value: '#E11D48', label: 'Rose' },
  { key: 'amber',   value: '#D97706', label: 'Amber' },
  { key: 'teal',    value: '#0D9488', label: 'Teal' },
  { key: 'indigo',  value: '#4F46E5', label: 'Indigo' },
  { key: 'slate',   value: '#475569', label: 'Slate' },
];

const COVER_STYLES = [
  { key: 'default',  label: 'Default',  gradient: null },
  { key: 'midnight', label: 'Midnight', gradient: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' },
  { key: 'sunrise',  label: 'Sunrise',  gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' },
  { key: 'forest',   label: 'Forest',   gradient: 'linear-gradient(135deg, #065f46 0%, #34d399 100%)' },
  { key: 'twilight', label: 'Twilight', gradient: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #db2777 100%)' },
];

// ─── Branding tab ─────────────────────────────────────────────────────────────

export default function BrandingTab({ community, communityId, onCommunityUpdated, onNavigateTo }) {
  const isPremium = isCommunityPremium(community);
  const typeConfig = getCommunityTypeConfig(community || {});
  const TypeIcon = typeConfig.icon;

  const existingBranding = (community?.settings && typeof community.settings === 'object')
    ? (community.settings.branding || {})
    : {};

  const [localBranding, setLocalBranding] = useState(() => ({
    accentColor: existingBranding.accentColor || '',
    coverStyle: existingBranding.coverStyle || 'default',
  }));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const update = (patch) => {
    setLocalBranding((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const newSettings = { ...(community?.settings || {}), branding: localBranding };
      const { data, error } = await supabase
        .from('communities')
        .update({ settings: newSettings })
        .eq('id', communityId)
        .select()
        .single();
      if (error) throw error;
      onCommunityUpdated?.(data);
      setDirty(false);
      toast.success('Branding saved');
    } catch {
      toast.error('Could not save branding');
    } finally {
      setSaving(false);
    }
  };

  const previewCoverStyleObj = COVER_STYLES.find((s) => s.key === localBranding.coverStyle) || COVER_STYLES[0];
  const previewGradient = localBranding.accentColor
    ? `linear-gradient(135deg, ${localBranding.accentColor}CC 0%, ${localBranding.accentColor}88 100%)`
    : (previewCoverStyleObj.gradient || typeConfig.coverPattern);

  return (
    <div className="pb-28">
      <div className="px-4 pt-5 pb-3">
        <h2 className="text-[17px] font-black text-slate-950">Community Branding</h2>
        <p className="text-[13px] font-semibold text-slate-500 mt-0.5 leading-5">
          Customise how your community looks across JUnited.
        </p>
        {!isPremium && (
          <div className="mt-3 flex items-start gap-2 rounded-2xl bg-amber-50 border border-amber-200 px-3 py-2.5">
            <Crown className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-[12px] font-bold text-amber-800 leading-5">
              Branding customisation requires Community Premium. Preview changes below, then upgrade to save.
            </p>
          </div>
        )}
      </div>

      {/* Live preview */}
      <section className="px-4 pb-5">
        <p className="text-[11px] font-black uppercase tracking-wide text-slate-500 mb-3">Preview</p>
        <div className="overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-sm">
          <div className="relative h-[56px]" style={{ background: previewGradient }}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
            <div className="absolute bottom-2 left-2.5">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black backdrop-blur-sm ${typeConfig.badgeClass} bg-white/80`}>
                <TypeIcon className="h-2.5 w-2.5" />
                {typeConfig.label}
              </span>
            </div>
          </div>
          <div className="px-3 py-2.5 flex items-center justify-between gap-2">
            <div>
              <p className="text-[13px] font-black text-slate-950 truncate">{community?.name || 'Your Community'}</p>
              <p className="text-[11px] font-semibold text-slate-400">Preview of Discover card</p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold text-white"
              style={{ background: localBranding.accentColor || '#2563EB' }}
            >
              Join
            </button>
          </div>
        </div>
      </section>

      {/* Accent colour palette */}
      <section className="px-4 pb-5">
        <p className="text-[11px] font-black uppercase tracking-wide text-slate-500 mb-3">Accent colour</p>
        <div className="flex flex-wrap gap-2.5 mb-2">
          <button
            type="button"
            onClick={() => update({ accentColor: '' })}
            title="Default (type colour)"
            className={`h-9 w-9 rounded-full border-2 transition-all flex items-center justify-center ${
              !localBranding.accentColor ? 'border-slate-950 scale-110' : 'border-slate-200 hover:border-slate-400'
            }`}
            style={{ background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)' }}
          >
            {!localBranding.accentColor && <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />}
          </button>
          {ACCENT_COLORS.map(({ key, value, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => update({ accentColor: value })}
              title={label}
              className={`h-9 w-9 rounded-full border-2 transition-all ${
                localBranding.accentColor === value ? 'border-slate-950 scale-110' : 'border-transparent hover:scale-105'
              }`}
              style={{ background: value }}
            />
          ))}
        </div>
        <p className="text-[11px] font-semibold text-slate-400">
          Drives the cover gradient and join button colour. Select default to use your community type's colour.
        </p>
      </section>

      {/* Cover style */}
      <section className="px-4 pb-5">
        <p className="text-[11px] font-black uppercase tracking-wide text-slate-500 mb-1">Cover style</p>
        <p className="text-[11px] font-semibold text-slate-400 mb-3">
          Applied when no cover photo is set. Overridden by an accent colour above.
        </p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {COVER_STYLES.map((style) => (
            <button
              key={style.key}
              type="button"
              onClick={() => update({ coverStyle: style.key })}
              className={`overflow-hidden rounded-xl border-2 transition-all active:scale-[0.97] ${
                localBranding.coverStyle === style.key
                  ? 'border-slate-950 shadow-md'
                  : 'border-slate-200 hover:border-slate-400'
              }`}
            >
              <div className="h-10 w-full" style={{ background: style.gradient || typeConfig.coverPattern }} />
              <p className="py-1 bg-white text-center text-[10px] font-black text-slate-600">{style.label}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Save / upgrade footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-slate-100 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        {isPremium ? (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !dirty}
            className="w-full h-12 rounded-2xl bg-[#2563EB] text-white font-black text-[15px] flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-all"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving…' : dirty ? 'Save Branding' : 'Branding Saved'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onNavigateTo?.('billing')}
            className="w-full h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white font-black text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <Crown className="h-4 w-4" />
            Upgrade to Community Premium
          </button>
        )}
      </div>
    </div>
  );
}
