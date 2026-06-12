// DEFERRED: no backing table — do not use in beta
import React, { useState } from 'react';
import { Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { dataService } from '@/services';
import { toast } from 'sonner';

export default function NewsletterSubscribeBox({ community }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubscribe = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error('Please enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      // Check if already subscribed
      const existing = await dataService.entities.NewsletterSubscriber.filter({
        email: trimmed,
        community_id: community.id
      });
      if (existing.length > 0) {
        toast.info("You're already subscribed!");
        setDone(true);
        return;
      }
      await dataService.entities.NewsletterSubscriber.create({
        email: trimmed,
        community_id: community.id,
        community_name: community.name,
        source: 'community_page',
      });
      setDone(true);
      toast.success("You're subscribed!");
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-1.5">
        <Mail className="w-4 h-4 text-blue-600" />
        <h3 className="text-[14px] font-bold text-slate-900">Stay in the loop</h3>
      </div>
      <p className="text-[12px] text-slate-500 mb-4">
        Get updates from {community.name} straight to your inbox.
      </p>

      {done ? (
        <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span className="text-[13px] font-semibold">You're subscribed!</span>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubscribe()}
            placeholder="your@email.com"
            className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-[13px] font-bold hover:bg-blue-700 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1.5"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Subscribe'}
          </button>
        </div>
      )}
    </div>
  );
}
