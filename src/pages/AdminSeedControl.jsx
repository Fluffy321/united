import React, { useState } from 'react';
import { dataService } from '@/services';
import { Button } from '@/components/ui/button';
import { Loader2, Play, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSeedControl() {
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
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#0F5ED7]"
              min={1} max={2000}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Sample posts per community</label>
            <input
              type="number"
              value={volumePosts}
              onChange={e => setVolumePosts(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#0F5ED7]"
              min={0} max={6}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Events per community</label>
            <input
              type="number"
              value={volumeEvents}
              onChange={e => setVolumeEvents(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#0F5ED7]"
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
          className="w-full bg-[#0F5ED7] hover:bg-[#0D4EB8] text-white rounded-xl h-11 font-semibold flex items-center gap-2"
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