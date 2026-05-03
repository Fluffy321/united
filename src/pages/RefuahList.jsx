import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Plus, RefreshCw, Loader2, HeartHandshake } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const DEMO_REFUAH_REQUESTS = [
  {
    id: 'demo-refuah-1',
    patient_name: 'Chana bat Sarah',
    relationship: 'community member',
    author_id: 'demo-user',
    author_name: 'Local demo',
    expires_at: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    davening_count: 18,
  },
  {
    id: 'demo-refuah-2',
    patient_name: 'Moshe ben Leah',
    relationship: 'friend',
    author_id: 'demo-user-2',
    author_name: 'Local demo',
    expires_at: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(),
    davening_count: 7,
  },
];

function AddRefuahForm({ onSave, onCancel, communityId }) {
  const [form, setForm] = useState({ patient_name: '', relationship: '' });
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const handleSave = async () => {
    if (!form.patient_name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    if (!appParams.hasBackendConfig) {
      onSave({
        id: `local-refuah-${Date.now()}`,
        ...form,
        author_id: user?.id || 'local-demo',
        author_name: user?.full_name || 'Local demo',
        community_id: communityId || undefined,
        expires_at: expires.toISOString(),
        davening_count: 0,
      });
      toast.success('Added locally for this demo session');
      setSaving(false);
      return;
    }
    try {
      await base44.entities.RefuahRequest.create({
        ...form,
        author_id: user.id,
        author_name: user.full_name,
        community_id: communityId || undefined,
        expires_at: expires.toISOString(),
      });
      toast.success('Added to Tehillim list 🙏');
      onSave();
    } catch { toast.error('Failed to add'); }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
      <h3 className="font-bold text-slate-900">Add a Refuah Shleima Request</h3>
      <div>
        <label className="block text-[12px] font-semibold text-slate-600 mb-1">Name for Tehillim (Hebrew name preferred)</label>
        <input value={form.patient_name} onChange={e => setForm(f => ({ ...f, patient_name: e.target.value }))}
          placeholder="e.g. Chana bat Sarah" className="input-base w-full" />
      </div>
      <div>
        <label className="block text-[12px] font-semibold text-slate-600 mb-1">Relationship (optional)</label>
        <input value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))}
          placeholder="e.g. my mother, a friend" className="input-base w-full" />
      </div>
      <p className="text-[11px] text-slate-400">⏳ This request will auto-archive after 30 days. You can renew it anytime.</p>
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
        <button onClick={handleSave} disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white text-[13px] font-semibold hover:bg-blue-700 disabled:opacity-50 active:scale-95 transition-all">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          {saving ? 'Adding...' : 'Add to List'}
        </button>
      </div>
    </div>
  );
}

function RefuahCard({ request, currentUser, onDaven, onRenew, isDavening }) {
  const isOwn = currentUser?.id === request.author_id;
  const expiresAt = new Date(request.expires_at);
  const daysLeft = Math.max(0, Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-slate-900 text-[15px]">רפואה שלמה ל{request.patient_name}</p>
          <p className="text-[13px] text-slate-600 mt-0.5">Refuah Shleima for <span className="font-semibold">{request.patient_name}</span></p>
          {request.relationship && <p className="text-[12px] text-slate-400 mt-0.5">Posted by {request.author_name} · {request.relationship}</p>}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        {/* Daven button */}
        <button onClick={() => onDaven(request)}
          disabled={isDavening}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all active:scale-95 border ${
            isDavening ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-700'
          }`}>
          🙏 {isDavening ? "I'm davening" : "I'll daven for them"}
          {request.davening_count > 0 && (
            <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${isDavening ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'}`}>
              {request.davening_count}
            </span>
          )}
        </button>

        {/* Renew button for own requests */}
        {isOwn && daysLeft < 7 && (
          <button onClick={() => onRenew(request)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-semibold border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 active:scale-95 transition-all">
            <RefreshCw className="w-3 h-3" /> Renew ({daysLeft}d left)
          </button>
        )}
      </div>
    </div>
  );
}

export default function RefuahList({ communityId }) {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [localRequests, setLocalRequests] = useState(DEMO_REFUAH_REQUESTS);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!appParams.hasBackendConfig) {
      setUser({ id: 'local-demo', full_name: 'Local demo' });
      return;
    }
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['refuah-requests', communityId],
    queryFn: async () => {
      if (!appParams.hasBackendConfig) return localRequests;
      const filter = { is_active: true };
      if (communityId) filter.community_id = communityId;
      return base44.entities.RefuahRequest.filter(filter, '-created_date', 100);
    },
    enabled: appParams.hasBackendConfig,
  });

  const { data: myDavenings = [] } = useQuery({
    queryKey: ['my-davenings', user?.id],
    queryFn: () => base44.entities.RefuahDavening.filter({ user_id: user.id }),
    enabled: !!user && appParams.hasBackendConfig,
  });

  const daveningSet = new Set(myDavenings.map(d => d.request_id));

  const handleDaven = async (request) => {
    if (!user) { base44.auth.redirectToLogin(window.location.href); return; }
    if (daveningSet.has(request.id)) return;
    if (!appParams.hasBackendConfig) {
      setLocalRequests(items => items.map(item => item.id === request.id ? { ...item, davening_count: (item.davening_count || 0) + 1 } : item));
      toast.success('Marked locally for this demo session');
      return;
    }
    await base44.entities.RefuahDavening.create({ request_id: request.id, user_id: user.id });
    await base44.entities.RefuahRequest.update(request.id, { davening_count: (request.davening_count || 0) + 1 });
    queryClient.invalidateQueries({ queryKey: ['my-davenings'] });
    queryClient.invalidateQueries({ queryKey: ['refuah-requests'] });
    toast.success('May they have a refuah shleima 🙏');
  };

  const handleRenew = async (request) => {
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    if (!appParams.hasBackendConfig) {
      setLocalRequests(items => items.map(item => item.id === request.id ? { ...item, expires_at: expires.toISOString(), renewed_at: new Date().toISOString() } : item));
      toast.success('Renewed locally for this demo session');
      return;
    }
    await base44.entities.RefuahRequest.update(request.id, { expires_at: expires.toISOString(), renewed_at: new Date().toISOString() });
    queryClient.invalidateQueries({ queryKey: ['refuah-requests'] });
    toast.success('Renewed for 30 more days');
  };

  const displayedRequests = appParams.hasBackendConfig ? requests : localRequests;
  const activeRequests = displayedRequests.filter(r => new Date(r.expires_at) > new Date());

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-2">
          <Link to="/" className="p-2 rounded-full hover:bg-slate-100 transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <HeartHandshake className="w-6 h-6 text-violet-600" /> Tehillim / Refuah List
            </h1>
          </div>
        </div>
        <p className="text-[13px] text-slate-500 mb-6 ml-12">Say Tehillim for these names. Requests auto-archive after 30 days.</p>

        {/* Aggregate header */}
        {activeRequests.length > 0 && (
          <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 mb-4 text-center">
            <p className="text-[13px] text-violet-700 font-semibold">
              🙏 {activeRequests.length} name{activeRequests.length !== 1 ? 's' : ''} on the list for Tehillim
            </p>
            <p className="text-[11px] text-violet-500 mt-0.5">Tap "I'll daven for them" to add your name privately</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-violet-600" /></div>
        ) : (
          <div className="space-y-3">
            {activeRequests.map(r => (
              <RefuahCard key={r.id} request={r} currentUser={user} onDaven={handleDaven} onRenew={handleRenew} isDavening={daveningSet.has(r.id)} />
            ))}

            {!showForm && (
              <button onClick={() => { if (!user) { base44.auth.redirectToLogin(window.location.href); return; } setShowForm(true); }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-violet-300 hover:text-violet-600 transition-colors font-semibold text-[14px]">
                <Plus className="w-4 h-4" /> Add a name to the Tehillim list
              </button>
            )}

            {showForm && (
              <AddRefuahForm communityId={communityId}
                onSave={(created) => {
                  if (created) setLocalRequests(items => [created, ...items]);
                  setShowForm(false);
                  queryClient.invalidateQueries({ queryKey: ['refuah-requests'] });
                }}
                onCancel={() => setShowForm(false)} />
            )}

            {activeRequests.length === 0 && !showForm && (
              <div className="text-center py-12 text-slate-400">
                <p className="text-4xl mb-3">🙏</p>
                <p className="font-semibold text-slate-600">No active Tehillim requests</p>
                <p className="text-[13px] mt-1">Be the first to add a name</p>
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`.input-base { padding: 10px 12px; border-radius: 12px; border: 1px solid #E2E8F0; background: #F8FAFC; font-size: 14px; outline: none; } .input-base:focus { border-color: #C4B5FD; background: white; }`}</style>
    </div>
  );
}
