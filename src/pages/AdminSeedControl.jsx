import React, { useState } from 'react';
import { dataService } from '@/services';
import { Button } from '@/components/ui/button';
import { Loader2, Play, CheckCircle2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

// Production guard — seeding demo communities/posts directly against the
// production database is a data-integrity risk. This tool is dev/staging only.
// See internal/roadmap.js: 'admin-seed-hardening'.
function ProductionBlocked() {
  return (
    <div className="min-h-screen bg-[#F8FAFB] p-6">
      <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
        <ShieldAlert className="mx-auto h-10 w-10 text-red-500" />
        <h1 className="mt-3 text-lg font-black text-slate-900">Not available in production</h1>
        <p className="mt-2 text-sm text-slate-500">
          Seed Control can create or clear demo communities and posts directly in the database.
          It's disabled in production to protect real user data. Run it from a local or staging
          environment instead.
        </p>
      </div>
    </div>
  );
}

export default function AdminSeedControl() {
  if (import.meta.env.PROD) return <ProductionBlocked />;
  return <SeedControlTool />;
}

// Split into its own component so the PROD early-return above never sits
// between AdminSeedControl's render and any hook calls (react-hooks/rules-of-hooks).
function SeedControlTool() {
  const [volumeCommunities, setVolumeCommunities] = useState(200);
  const [volumePosts, setVolumePosts] = useState(3);
  const [volumeEvents, setVolumeEvents] = useState(2);
  const [clearSeeded, setClearSeeded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleRun = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await dataService.functions.invoke('seedCommunitiesDirectory', {
        volumeCommunities,
        volumePostsPerCommunity: volumePosts,
        volumeEventsPerCommunity: volumeEvents,
        clearSeeded,
      });
      setResult(res.data);
      toast.success(`Seeded ${res.data.communities_created} communities!`);
    } catch (e) {
      toast.error(e.message || 'Seed failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFB] p-6">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Communities Seed Control</h1>
        <p className="text-sm text-slate-500 mb-8">Admin panel to seed the communities directory with demo data.</p>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5 mb-6">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Communities to create</label>
            <input
              type="number"
              value={volumeCommunities}
              onChange={e => setVolumeCommunities(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-600"
              min={1} max={2000}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Sample posts per community</label>
            <input
              type="number"
              value={volumePosts}
              onChange={e => setVolumePosts(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-600"
              min={0} max={6}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Events per community</label>
            <input
              type="number"
              value={volumeEvents}
              onChange={e => setVolumeEvents(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-600"
              min={0} max={4}
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="clearSeeded"
              checked={clearSeeded}
              onChange={e => setClearSeeded(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="clearSeeded" className="text-sm text-slate-700">
              Clear existing seeded communities first
              <span className="block text-xs text-red-500">⚠️ This will delete all auto-generated listings</span>
            </label>
          </div>
        </div>

        <Button
          onClick={handleRun}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-[#0D4EB8] text-white rounded-xl h-11 font-semibold flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
          {loading ? 'Seeding...' : 'Run Seed Now'}
        </Button>

        {result && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-800">Seed completed!</span>
            </div>
            <div className="text-sm text-green-700 space-y-1">
              <p>✅ {result.communities_created} communities created</p>
              <p>📝 {result.posts_created} sample posts created</p>
              <p>📅 {result.events_created} events created</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}