import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Plus, Loader2, Trash2, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { HEBREW_MONTHS } from '@/lib/hebrewDate';

const RELATIONSHIPS = ['Father', 'Mother', 'Grandfather', 'Grandmother', 'Husband', 'Wife', 'Son', 'Daughter', 'Brother', 'Sister', 'Other'];
const DEMO_USER = { id: 'local-demo', full_name: 'Local demo' };
const DEMO_YAHRZEITS = [
  {
    id: 'demo-yahrzeit-1',
    deceased_name: 'Aharon ben Shlomo',
    relationship: 'Grandfather',
    hebrew_month: 1,
    hebrew_day: 12,
    share_with_community: true,
    virtual_candle_count: 4,
  },
  {
    id: 'demo-yahrzeit-2',
    deceased_name: 'Miriam bat Rachel',
    relationship: 'Mother',
    hebrew_month: 7,
    hebrew_day: 3,
    share_with_community: false,
    virtual_candle_count: 11,
  },
];

function AddYahrzeitForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ deceased_name: '', relationship: '', hebrew_month: 7, hebrew_day: 1, share_with_community: false });
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const handleSave = async () => {
    if (!form.deceased_name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (!appParams.hasBackendConfig) {
        onSave({
          id: `local-yahrzeit-${Date.now()}`,
          ...form,
          user_id: user?.id || DEMO_USER.id,
          user_name: user?.full_name || DEMO_USER.full_name,
          virtual_candle_count: 0,
        });
        toast.success('Yahrzeit saved locally for this demo session');
        return;
      }
      await base44.entities.Yahrzeit.create({
        ...form,
        user_id: user.id,
        user_name: user.full_name,
      });
      toast.success('Yahrzeit saved');
      onSave();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
      <h3 className="font-bold text-slate-900">Add a Yahrzeit</h3>

      <div>
        <label className="block text-[12px] font-semibold text-slate-600 mb-1">Name of Deceased (Hebrew name preferred)</label>
        <input value={form.deceased_name} onChange={e => setForm(f => ({ ...f, deceased_name: e.target.value }))}
          placeholder="e.g. Aharon ben Shlomo" className="input-base w-full" />
      </div>

      <div>
        <label className="block text-[12px] font-semibold text-slate-600 mb-1">Your Relationship</label>
        <select value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))}
          className="input-base w-full bg-white">
          <option value="">Select relationship</option>
          {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[12px] font-semibold text-slate-600 mb-1">Hebrew Month</label>
          <select value={form.hebrew_month} onChange={e => setForm(f => ({ ...f, hebrew_month: +e.target.value }))}
            className="input-base w-full bg-white">
            {HEBREW_MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-slate-600 mb-1">Hebrew Day</label>
          <select value={form.hebrew_day} onChange={e => setForm(f => ({ ...f, hebrew_day: +e.target.value }))}
            className="input-base w-full bg-white">
            {Array.from({ length: 30 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={form.share_with_community} onChange={e => setForm(f => ({ ...f, share_with_community: e.target.checked }))}
          className="w-4 h-4 accent-blue-600" />
        <span className="text-[13px] text-slate-700">Share with my community on the yahrzeit day</span>
      </label>

      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
        <button onClick={handleSave} disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white text-[13px] font-semibold hover:bg-blue-700 disabled:opacity-50 active:scale-95 transition-all">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          {saving ? 'Saving...' : 'Save Yahrzeit'}
        </button>
      </div>
    </div>
  );
}

function YahrzeitCard({ yahrzeit, onDelete, onLightCandle, candleLit }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-slate-900">{yahrzeit.deceased_name}</p>
          {yahrzeit.relationship && <p className="text-[13px] text-slate-500 capitalize">{yahrzeit.relationship}</p>}
          <p className="text-[12px] text-slate-400 mt-1">
            {HEBREW_MONTHS[yahrzeit.hebrew_month]} {yahrzeit.hebrew_day}
          </p>
          {yahrzeit.share_with_community && (
            <div className="flex items-center gap-1 mt-1 text-[11px] text-blue-600 font-semibold">
              <Users className="w-3 h-3" /> Shared with community
            </div>
          )}
        </div>
        <button onClick={() => onDelete(yahrzeit.id)} className="p-1.5 rounded-full hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Virtual candle */}
      <div className="mt-3 flex items-center gap-3">
        <button onClick={() => onLightCandle(yahrzeit)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all active:scale-95 border ${
            candleLit ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-amber-300 hover:text-amber-700'
          }`}>
          🕯️ {candleLit ? 'Candle lit' : 'Light a candle'}
          {yahrzeit.virtual_candle_count > 0 && (
            <span className="ml-1 bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5 text-[10px] font-bold">{yahrzeit.virtual_candle_count}</span>
          )}
        </button>
      </div>
    </div>
  );
}

export default function YahrzeitManager() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [localYahrzeits, setLocalYahrzeits] = useState(DEMO_YAHRZEITS);
  const [localLitCandles, setLocalLitCandles] = useState(new Set());
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!appParams.hasBackendConfig) {
      setUser(DEMO_USER);
      return;
    }
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: yahrzeits = [], isLoading } = useQuery({
    queryKey: ['yahrzeits', user?.id],
    queryFn: () => appParams.hasBackendConfig ? base44.entities.Yahrzeit.filter({ user_id: user.id }, 'hebrew_month') : localYahrzeits,
    enabled: !!user && appParams.hasBackendConfig,
  });

  const { data: litByMe = [] } = useQuery({
    queryKey: ['candles-lit', user?.id],
    queryFn: () => base44.entities.YahrzeitCandle.filter({ user_id: user.id }),
    enabled: !!user && appParams.hasBackendConfig,
  });

  const litSet = new Set(litByMe.map(c => c.yahrzeit_id));

  const handleLightCandle = async (yahrzeit) => {
    if (!user) { base44.auth.redirectToLogin(window.location.href); return; }
    if (litSet.has(yahrzeit.id)) return; // already lit
    if (!appParams.hasBackendConfig) {
      setLocalLitCandles(prev => new Set(prev).add(yahrzeit.id));
      setLocalYahrzeits(items => items.map(item => item.id === yahrzeit.id ? { ...item, virtual_candle_count: (item.virtual_candle_count || 0) + 1 } : item));
      toast.success('Candle lit locally for this demo session');
      return;
    }
    try {
      await base44.entities.YahrzeitCandle.create({ yahrzeit_id: yahrzeit.id, user_id: user.id, user_name: user.full_name });
      await base44.entities.Yahrzeit.update(yahrzeit.id, { virtual_candle_count: (yahrzeit.virtual_candle_count || 0) + 1 });
      queryClient.invalidateQueries({ queryKey: ['candles-lit'] });
      queryClient.invalidateQueries({ queryKey: ['yahrzeits'] });
      toast.success('Candle lit 🕯️');
    } catch { toast.error('Failed to light candle'); }
  };

  const handleDelete = async (id) => {
    if (!appParams.hasBackendConfig) {
      setLocalYahrzeits(items => items.filter(item => item.id !== id));
      toast.success('Removed locally');
      return;
    }
    await base44.entities.Yahrzeit.delete(id);
    queryClient.invalidateQueries({ queryKey: ['yahrzeits'] });
    toast.success('Removed');
  };

  const displayedYahrzeits = appParams.hasBackendConfig ? yahrzeits : localYahrzeits;
  const displayedLitSet = appParams.hasBackendConfig ? litSet : localLitCandles;

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-2xl mb-2">🕯️</p>
          <p className="font-bold text-slate-900 mb-1">Sign in to manage Yahrzeits</p>
          <button onClick={() => base44.auth.redirectToLogin(window.location.href)} className="mt-3 px-5 py-2 rounded-full bg-blue-600 text-white font-semibold text-[14px]">Sign in</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="p-2 rounded-full hover:bg-slate-100 transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">🕯️ Yahrzeit Reminders</h1>
            <p className="text-[13px] text-slate-500">You'll receive reminders 3 days before, 1 day before, and on the yahrzeit</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : (
          <div className="space-y-3">
            {displayedYahrzeits.map(y => (
              <YahrzeitCard key={y.id} yahrzeit={y} onDelete={handleDelete} onLightCandle={handleLightCandle} candleLit={displayedLitSet.has(y.id)} />
            ))}

            {!showForm && (
              <button onClick={() => setShowForm(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 transition-colors font-semibold text-[14px]">
                <Plus className="w-4 h-4" /> Add a Yahrzeit
              </button>
            )}

            {showForm && (
              <AddYahrzeitForm onSave={(created) => {
                if (created) setLocalYahrzeits(items => [created, ...items]);
                setShowForm(false);
                queryClient.invalidateQueries({ queryKey: ['yahrzeits'] });
              }} onCancel={() => setShowForm(false)} />
            )}

            {displayedYahrzeits.length === 0 && !showForm && (
              <div className="text-center py-12 text-slate-400">
                <p className="text-4xl mb-3">🕯️</p>
                <p className="font-semibold text-slate-600">No yahrzeits added yet</p>
                <p className="text-[13px] mt-1">Add yahrzeits to receive annual reminders</p>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`.input-base { padding: 10px 12px; border-radius: 12px; border: 1px solid #E2E8F0; background: #F8FAFC; font-size: 14px; outline: none; transition: border-color 0.15s; } .input-base:focus { border-color: #93C5FD; background: white; }`}</style>
    </div>
  );
}
