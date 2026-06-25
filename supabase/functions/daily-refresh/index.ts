/**
 * daily-refresh — runs every morning via pg_cron at 12:00 UTC (8 AM ET)
 *
 * 1. Upserts today's daily_content row (mitzvah + Torah thought)
 * 2. Inserts a "Good morning Five Towns!" post into the feed so the
 *    "Talk to the Five Towns" hub always shows "Updated today"
 *
 * Authorization: CRON_SECRET header required (set as a Supabase secret).
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CRON_SECRET       = Deno.env.get('CRON_SECRET') ?? '';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ── Content library ──────────────────────────────────────────────────────────
// 52 pairs so the rotation covers a full year of weekly variation.

const MITZVAHS: string[] = [
  "Call or message someone who may appreciate being remembered today.",
  "Give tzedakah, even a small amount, before your next errand.",
  "Offer practical help to a neighbor, friend, or family member.",
  "Share a warm greeting with someone you usually pass quickly.",
  "Prepare one thing early that will make Shabbos calmer for someone else.",
  "Thank a teacher, volunteer, parent, or local helper for what they do.",
  "Choose one small act of chesed and do it quietly, without recognition.",
  "Check in on an elderly neighbor or relative with a quick visit or call.",
  "Pay a compliment that is specific and genuinely meant.",
  "Hold the door, wait an extra moment, let someone go first.",
  "Buy a coffee or lunch for someone who might need it today.",
  "Write a thank-you note to someone who has helped you in the past year.",
  "Let a misunderstanding pass without the need to be right.",
  "Donate a bag of non-perishables to a local food pantry.",
  "Offer your parking spot, seat, or place in line to someone.",
  "Volunteer ten minutes of help with no expectation of return.",
  "Invite someone who might be eating alone to join your table.",
  "Ask a store employee, janitor, or security guard how their day is going.",
  "Make a shiva call, send a meal, or reach out to a mourner.",
  "Pass along a useful referral — a doctor, handyman, or job lead.",
  "Remember a birthday or anniversary and send a brief message.",
  "Return an item you borrowed that you have been meaning to give back.",
  "Smile at three strangers today as if they are old friends.",
  "Say a kind word to someone who looks like they are having a hard day.",
  "Bring flowers, cookies, or a small treat to someone for no occasion.",
  "Forgive silently someone who has not apologized to you.",
  "Help carry something heavy for a person who is struggling.",
  "Offer to watch someone's children for an hour so they can rest.",
  "Drop off a warm meal for a new mother, sick neighbor, or overworked family.",
  "Choose words of encouragement over words of criticism in one conversation.",
  "Learn one halacha today and share it with your family at dinner.",
  "Put your phone away during a full conversation with your child.",
  "Give a larger tip than usual to someone who serves you today.",
  "Attend a shiur — in person or online — even for fifteen minutes.",
  "Organize a drawer or corner of your home before Shabbos.",
  "Say Modeh Ani this morning before your feet hit the floor.",
  "Read one chapter of a Jewish book you have been meaning to start.",
  "Make Kiddush Hashem by staying calm in a frustrating situation.",
  "Reconnect with a friend you have not spoken to in months.",
  "Find one thing to be genuinely grateful for and write it down.",
  "Ask your child or grandchild what they learned in school this week.",
  "Support a local kosher business instead of ordering from outside.",
  "Daven with a minyan if you have not done so recently.",
  "Share a Torah insight you heard with someone who would appreciate it.",
  "Set aside five minutes for quiet reflection before the day gets busy.",
  "Help a teenager or student prepare for a test or school project.",
  "Reach out to a baal teshuvah or new community member to make them feel welcome.",
  "Do one thing today that is l'shem shamayim — purely for the sake of heaven.",
  "Leave a generous review for a local Jewish business or synagogue.",
  "Prepare your Shabbos clothes and candlesticks the night before.",
  "Make sure every member of your household feels seen and heard today.",
  "End the day by asking: what did I give today, not just what did I receive?",
];

const TORAH_THOUGHTS: string[] = [
  "A day becomes holy when ordinary moments are used for kindness.",
  "Torah asks us to notice the person in front of us, not only the task ahead.",
  "Small mitzvahs done consistently can shape the whole atmosphere of a home.",
  "Peace in a community begins with patient words and generous assumptions.",
  "Preparing for Shabbos is also preparing space for gratitude.",
  "Jewish strength is often built through steady, unseen acts of care.",
  "Every person can add light to the place where they live.",
  "The Chofetz Chaim taught: guard your words as carefully as your money.",
  "Bitachon is not passive — it is the courage to act while trusting the outcome.",
  "A house filled with Torah study is never empty, even when quiet.",
  "Middos are not ornaments — they are the foundation of avodas Hashem.",
  "The Tanya teaches that every Jewish soul contains a spark of the Divine.",
  "Rav Yisrael Salanter said: it is easier to learn the whole Shas than to fix one character trait.",
  "Shabbos is not an interruption to the week — it is the purpose of the week.",
  "Emunah grows strongest in the moments when it is hardest to hold onto.",
  "The Rambam writes: great wisdom begins with knowing what you do not know.",
  "A community that cares for its poor and its sick reflects the image of Hashem.",
  "Torah study is called 'life' because it gives direction to every hour.",
  "Gratitude expressed aloud makes the blessing more real for both people.",
  "Reb Nachman taught: the world was created for my sake — and so was everyone else's world.",
  "Silence at the right moment is itself a form of wisdom.",
  "A person who gives anonymously walks more closely with the Shechina.",
  "The mitzvah of honoring parents extends beyond their lifetime.",
  "Rav Moshe Feinstein taught that America can be a makom Torah — if we choose it.",
  "The Vilna Gaon learned Torah as if each moment might be his last — and lived accordingly.",
  "Chesed is how we imitate Hashem; He clothed Adam, so we clothe the poor.",
  "The Haggadah reminds us: each person must see themselves as having left Egypt.",
  "Kiddush Hashem happens in the ordinary — at work, at the register, on the road.",
  "Every Jewish home is a small Beis Hamikdash when filled with shalom.",
  "Rav Kook wrote that love of the Jewish people is the vessel for all spiritual growth.",
  "The gates of prayer are never closed — even after midnight.",
  "Words of Torah spoken at a Shabbos table protect the home through the week.",
  "Teshuva is not a moment of shame — it is a return to who you truly are.",
  "The Ben Ish Chai taught: a good day begins the evening before.",
  "To judge another favorably is itself an act of kindness to your own soul.",
  "Pirkei Avos: who is rich? One who is satisfied with his portion.",
  "A teacher who plants ideas in students reaches generations they will never meet.",
  "Rav Dessler wrote: giving creates love — give first, and love will follow.",
  "The Shema is not just a declaration — it is a daily realignment of the self.",
  "When one candle lights another, the first is not diminished.",
  "Joy is not a reward for doing the mitzvahs well — it is part of doing them.",
  "Moshe Rabbeinu was the humblest person — and still the greatest leader.",
  "The Maharal taught that the Jewish people are connected to Hashem as form to matter.",
  "Emes — truth — is the seal of Hashem. Make it the seal of your words as well.",
  "Davening in the morning is not preparation for the day — it is the first act of the day.",
  "A home where guests are welcomed is wider on the inside than the outside.",
  "To live in the Five Towns is to be part of a centuries-long chain of Jewish life in America.",
  "Rav Soloveitchik taught: suffering can be transformed when it is given meaning.",
  "The Netziv saw in every Jew a sefer Torah — approach each one with that reverence.",
  "Shabbos candles illuminate not just the room but the week ahead.",
  "When you help one Jew, you help the whole people.",
  "The last word of Tanach is 'v'ya'al' — and let him go up. The invitation is always open.",
];

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Day-of-year (0-based) so each calendar date always gets the same content */
function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff  = date.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
}

function etDate(): Date {
  // Return current time as a Date, but adjusted so getFullYear/Month/Date
  // reflect the America/New_York wall clock (handles DST automatically).
  const now = new Date();
  const etStr = now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  return new Date(etStr + 'T00:00:00');
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ── Morning greeting messages (rotate weekly) ───────────────────────────────

const GREETINGS = [
  "Good morning, Five Towns! 🌅 What's on your mind this week?",
  "Good morning! 🌞 What's happening in the neighborhood today?",
  "Boker tov, Five Towns! ✡️ Share what's going on — questions, updates, events.",
  "Good morning! ☀️ A new day in the Five Towns. What do you need, or what can you offer?",
  "Rise and shine, Five Towns! 🏡 The thread is open — jump in.",
  "Good morning! 🌻 What's the Five Towns buzz today?",
  "Good morning and shalom! 🕍 Drop your updates, questions, and plans below.",
];

// ── Auth check ───────────────────────────────────────────────────────────────

function isAuthorized(req: Request): boolean {
  const secret = req.headers.get('x-cron-secret') ?? req.headers.get('x-internal-secret');
  return Boolean(CRON_SECRET && secret === CRON_SECRET);
}

// ── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret, x-internal-secret',
      },
    });
  }

  if (!isAuthorized(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const today  = etDate();
  const doy    = dayOfYear(today);
  const len    = MITZVAHS.length; // 52

  const mitzvah_text = MITZVAHS[doy % len];
  const torah_text   = TORAH_THOUGHTS[doy % len];
  const date         = dateKey(today);

  const results: Record<string, unknown> = {};

  // ── 1. Upsert today's daily_content ─────────────────────────────────────
  const { error: dcErr } = await supabase
    .from('daily_content')
    .upsert({ date, mitzvah_text, torah_text }, { onConflict: 'date' });

  results.daily_content = dcErr ? { error: dcErr.message } : { ok: true, date };

  // ── 2. Insert a daily "Good morning" post so the feed shows updated today ─
  const greeting = GREETINGS[doy % GREETINGS.length];

  // Only post if there is no system post for today already
  const { data: existing } = await supabase
    .from('posts')
    .select('id')
    .eq('type', 'daily_greeting')
    .gte('created_at', date + 'T00:00:00Z')
    .lte('created_at', date + 'T23:59:59Z')
    .limit(1);

  if (!existing?.length) {
    const { error: postErr } = await supabase.from('posts').insert({
      type:       'daily_greeting',
      title:      greeting,
      body:       greeting,
      content:    greeting,
      user_id:    null,           // system post — no author
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    results.daily_post = postErr ? { error: postErr.message } : { ok: true, greeting };
  } else {
    results.daily_post = { skipped: 'already posted today' };
  }

  return new Response(JSON.stringify({ ok: true, date, results }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
