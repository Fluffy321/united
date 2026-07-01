import React, { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';

// Weekly challenges — rotate by ISO week number so everyone sees the same one
const CHALLENGES = [
  'Say thank you to a store worker or cashier today — and mean it.',
  'Call or text someone you haven\'t spoken to in a few months.',
  'Let someone go ahead of you in line, without being asked.',
  'Leave a note of encouragement for a neighbor.',
  'Pick up litter you walk past, even if it\'s not yours.',
  'Offer a ride to someone who might need one this Shabbos.',
  'Donate something to a local tzedakah or clothing drive.',
  'Compliment someone on something specific — not just "you look nice."',
  'Check in on an elderly neighbor or family member.',
  'Pay for someone\'s coffee or food anonymously.',
  'Volunteer one hour for a local organization this week.',
  'Write a positive review for a Five Towns business you love.',
  'Bring flowers or a small treat to someone who is going through a hard time.',
  'Teach a child one thing from this week\'s parsha.',
  'Make Shabbos plans for a guest who doesn\'t have a place.',
  'Share a job lead or business connection with someone who needs it.',
  'Say Tehillim for someone who is ill and tell them you did.',
  'Leave a generous tip and write a kind word on the receipt.',
  'Offer to babysit for a family that needs a break.',
  'Drop off a meal to a family that recently had a baby or surgery.',
  'Give tzedakah before davening — even a small amount, every day this week.',
  'Introduce two people who should know each other.',
  'Ask a store owner "how\'s business?" and actually listen.',
  'Send a hand-written thank you note — old school, real paper.',
  'Post something on the Five Towns feed that helps a neighbor.',
  'Make a shiva call — or call someone who is mourning.',
  'Offer to help set up or clean up at your shul this Shabbos.',
  'Buy from a local Five Towns business instead of online.',
  'Stop and really listen to someone who needs to talk.',
  'Smile at strangers today. All of them.',
  'Learn one halacha about respecting your parents or teachers.',
  'Do a mitzvah you have been procrastinating on for weeks.',
  'Give an unexpected, unprompted compliment to your spouse or parent.',
  'Collect canned goods and donate them to a local food pantry.',
  'Set aside time this week to learn with someone else.',
  'Volunteer to drive someone to a medical appointment.',
  'Say the morning brachos slowly — really think about what each one means.',
  'Forgive someone — even if they haven\'t asked. Especially then.',
  'Leave a book you loved where someone else will find it.',
  'Do one act of chesed that no one will ever know about.',
  'Help a neighbor with yard work, a package, or a heavy bag.',
  'Be fully present with your family at dinner — no phone.',
  'Make a financial donation to Darchei Torah or a local yeshiva.',
  'Invite someone who might be lonely to join your Shabbos table.',
  'Write down three things you are grateful for tonight, before you sleep.',
  'Be the first to say sorry after a disagreement.',
  'Drop off treats at a local fire station or police precinct.',
  'Ask someone "how are you really doing?" — and wait for the real answer.',
  'Attend a shiur this week — even online — that you wouldn\'t normally.',
  'Help someone who is new to the Five Towns feel at home.',
  'Give a stranger directions, carry a bag, or hold a door — look for the moment.',
  'Recycle. Be a shomer of the world Hashem created.',
];

function getISOWeek(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export default function ChesedChallenge() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const weekKey = useMemo(() => getISOWeek(), []);

  // Get this week's challenge text (same for everyone)
  const weekNum = parseInt(weekKey.split('-W')[1], 10);
  const challenge = CHALLENGES[(weekNum - 1) % CHALLENGES.length];

  // Count how many community members completed it this week
  const { data: countData } = useQuery({
    queryKey: ['chesed-challenge-count', weekKey],
    queryFn: async () => {
      const { count } = await supabase
        .from('chesed_challenge_completions')
        .select('id', { count: 'exact', head: true })
        .eq('week_key', weekKey);
      return count || 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Has current user completed it?
  const { data: myCompletion } = useQuery({
    queryKey: ['chesed-challenge-mine', weekKey, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('chesed_challenge_completions')
        .select('id')
        .eq('week_key', weekKey)
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: Boolean(user),
    staleTime: 5 * 60 * 1000,
  });

  const completed = Boolean(myCompletion);
  const count = countData || 0;
  // Progress toward a community goal of 50
  const GOAL = 50;
  const pct = Math.min(100, Math.round((count / GOAL) * 100));

  const { mutate: toggleComplete, isPending } = useMutation({
    mutationFn: async () => {
      if (!user) return;
      if (completed) {
        await supabase
          .from('chesed_challenge_completions')
          .delete()
          .eq('week_key', weekKey)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('chesed_challenge_completions')
          .insert({ user_id: user.id, week_key: weekKey, challenge });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chesed-challenge-count', weekKey] });
      qc.invalidateQueries({ queryKey: ['chesed-challenge-mine', weekKey, user?.id] });
    },
  });

  return (
    <section className="mb-3 overflow-hidden rounded-[24px] border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="px-4 pt-4 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Heart className="h-4 w-4 text-rose-500 shrink-0" />
          <p className="text-[10px] font-black uppercase tracking-wide text-rose-600">This Week's Challenge</p>
        </div>
        <h2 className="text-[17px] font-black text-slate-950">Community Chesed</h2>

        <div className="mt-3 rounded-[18px] border border-rose-100 bg-white px-4 py-3">
          <p className="text-[14px] font-bold leading-[1.6] text-slate-800">{challenge}</p>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] font-black text-slate-500">
              {count} {count === 1 ? 'neighbor' : 'neighbors'} completed this week
            </p>
            <p className="text-[11px] font-black text-rose-600">Goal: {GOAL}</p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-rose-100">
            <div
              className="h-full rounded-full bg-rose-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Action button */}
        {user ? (
          <button
            type="button"
            onClick={() => toggleComplete()}
            disabled={isPending}
            className={`motion-press mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-[14px] font-black transition disabled:opacity-60 ${
              completed
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-950 text-white'
            }`}
          >
            {completed ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                I did it this week ✓
              </>
            ) : (
              <>
                <Heart className="h-4 w-4" />
                Mark as completed
              </>
            )}
          </button>
        ) : (
          <p className="mt-3 text-center text-[12px] font-semibold text-slate-400">Sign in to mark this completed</p>
        )}
      </div>
    </section>
  );
}
