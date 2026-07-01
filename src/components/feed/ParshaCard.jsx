import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScrollText, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { getParsha } from '@/lib/hebrewDate';

// Divrei Torah keyed by parsha name (cleaned, no "Parashat" prefix).
// Each entry has multiple divrei Torah so the card rotates day-to-day.
// Practical takeaway is always the last sentence.
const DIVREI_TORAH = {
  'Pinchas': [
    {
      rabbi: 'R\' Moshe Feinstein zt"l',
      text: 'Pinchas acted with zeal not for personal honor, but purely for the sake of Heaven — and Hashem responded by granting him a covenant of peace. The lesson: true peace is not the absence of conflict but the presence of principle. Today, ask yourself: is there something you have been avoiding saying because it might create friction?',
    },
    {
      rabbi: 'Sfas Emes',
      text: 'The daughters of Tzlofchad came forward with a claim that was legally correct and spiritually courageous — they loved the Land at a time when others feared it. Hashem rewarded them not just with an inheritance but with halacha l\'doros. When you stand up for something true and just, you write yourself into the Torah\'s story.',
    },
    {
      rabbi: 'R\' Avigdor Miller zt"l',
      text: 'The korbanot of Musaf listed in this parsha — consistent, precise, day after day — teach that greatness is built in the daily repetition of small acts. A person who davens the same Shmoneh Esrei with a little more kavanah each day is doing something more heroic than they realize. Pick one word in Shmoneh Esrei today and mean it.',
    },
  ],
  'Matot': [
    {
      rabbi: 'R\' Shamshon Raphael Hirsch zt"l',
      text: 'The laws of nedarim that open Matot establish that a Jew\'s word is sacred — our speech creates binding reality. The Torah devotes an entire opening section to vows precisely because language is the tool of the soul. Before you say "I\'ll try," "maybe," or "I\'ll think about it" today — decide first whether you mean it.',
    },
    {
      rabbi: 'Netziv (Ha\'amek Davar)',
      text: 'The war against Midian was commanded as Moshe\'s final mission before his death, and he carried it out without delay. The Netziv observes that leaders who know their time is limited often accomplish the most, because they stop postponing. What have you been putting off that you know matters?',
    },
  ],
  'Masei': [
    {
      rabbi: 'R\' Yitzchak Hutner zt"l',
      text: 'The Torah records every stop on Israel\'s 42-year journey in the desert — even the obscure ones, the ones that seemed like nothing. This teaches that no station in life is wasted; every place we pass through is part of a deliberate itinerary. Look back at a "wasted" chapter of your life and ask: what did it give me that I could not have gotten elsewhere?',
    },
    {
      rabbi: 'Kli Yakar',
      text: 'The arei miklat, cities of refuge, were placed on both sides of the Jordan so that no one would have too far to travel in a moment of crisis. The Torah designs its mercy to be geographically accessible. Chesed that is theoretically available but practically unreachable is not real chesed — proximity is part of the mitzvah.',
    },
  ],
  'Devarim': [
    {
      rabbi: 'R\' Soloveitchik zt"l (The Rav)',
      text: 'Moshe\'s final speeches begin with veiled rebuke — he names the places of sin without stating them explicitly, to protect the dignity of his people even as he corrects them. The Rav taught: you can speak truth and still protect someone\'s honor. The next time you need to tell someone something difficult, ask how Moshe would have said it.',
    },
    {
      rabbi: 'Alshich HaKadosh',
      text: 'Devarim opens on Rosh Chodesh Av, the beginning of the saddest month in the Jewish calendar, because Moshe wanted to comfort Israel in their lowest moment. He chose this moment to review the entire Torah — teaching that the greatest act of chesed in a dark time is to reconnect people to their source of meaning.',
    },
  ],
  "Va'etchanan": [
    {
      rabbi: 'R\' Chaim of Volozhin zt"l',
      text: 'Moshe prayed 515 prayers to enter the Land — and Hashem said no. Yet Moshe accepted the decree and immediately shifted to preparing the next generation. The highest form of emunah is not the prayer that gets answered but the pivot that follows a "no." How quickly do you recover when the answer is not what you hoped?',
    },
    {
      rabbi: 'Beis HaLevi',
      text: 'The Shema in this parsha commands love of Hashem "with all your might" — which Chazal interpret as: with every measure He deals out to you, including the difficult ones. The person who can bless Hashem after a loss has reached a level that most people spend a lifetime approaching. Begin with gratitude for one thing that cost you something.',
    },
  ],
  'Eikev': [
    {
      rabbi: 'Chofetz Chaim zt"l',
      text: '"Eikev" literally means "heel" — the mitzvos that people trample underfoot with their heel, treating as minor. The Torah says: if you observe even those, incredible blessing follows. The most important mitzvah you\'re doing is probably the one you\'ve started taking for granted.',
    },
    {
      rabbi: 'R\' Moshe Cordovero (Ramak)',
      text: 'Moshe reminds Israel: "You shall eat and be satisfied and bless Hashem." Birkat Hamazon is not simply a post-meal ritual — it is the practice of pausing to notice abundance before it becomes invisible. One of the most radical acts available to you today is to eat a meal slowly and notice that you are full.',
    },
  ],
  "Re'eh": [
    {
      rabbi: 'R\' Tzaddok HaKohen of Lublin zt"l',
      text: '"See — I place before you today blessing and curse." The word "see" is singular but the verbs are plural — Moshe is saying: each individual must see this choice, but the choices ripple out to the entire community. The decision you make about who you will be today is never only about you.',
    },
    {
      rabbi: 'Ramban',
      text: 'The laws of tzedakah in Re\'eh end with "you shall surely open your hand" — doubled language in Hebrew indicating: open it once and open it again. The Ramban notes this teaches that even if you gave yesterday, today is a new obligation. Chesed is not a transaction; it is a posture you return to every morning.',
    },
  ],
  'Shoftim': [
    {
      rabbi: 'R\' Chaim Shmuelevitz zt"l (Mir Rosh Yeshiva)',
      text: '"Justice, justice shall you pursue" — the repetition is deliberate. Not only must the outcome be just, but the process of pursuing it must be just as well. Ends do not justify means in halacha or in character. Today: check whether the way you are going after something good is itself good.',
    },
    {
      rabbi: 'Sefer HaChinuch',
      text: 'The king may not accumulate excessive horses, wives, or gold — not because these are inherently wrong, but because abundance creates distance from Hashem. The Torah\'s principle: whatever takes your attention away from what matters is a risk, regardless of whether it is permitted. What is taking your attention right now?',
    },
  ],
  'Ki Teitzei': [
    {
      rabbi: 'R\' Yisrael Salanter zt"l',
      text: 'Ki Teitzei contains more mitzvos than any other parsha — 74. R\' Yisrael noted that most of them concern how we treat other people, not ritual between man and God. The Torah\'s implicit message: you cannot claim to love Hashem if you are careless with the people He created. One interpersonal mitzvah done carefully today is worth more than many performed by rote.',
    },
    {
      rabbi: 'Kli Yakar',
      text: 'The mitzvah of shiluach hakan — sending away the mother bird — requires compassion even for animals, and the Torah promises long life as its reward. If we are obligated to spare the feelings of a bird, how much more careful must we be with the feelings of a person standing in front of us.',
    },
  ],
  'Ki Tavo': [
    {
      rabbi: 'R\' Elimelech of Lizhensk zt"l',
      text: 'Bikurim, the first fruits, required a physical journey to Yerushalayim and a personal declaration of gratitude before a kohen. Hashem wants not just the gift but the journey and the words — gratitude is incomplete until it is spoken aloud. Think of something you are grateful for today and say it out loud to someone.',
    },
    {
      rabbi: 'Vilna Gaon',
      text: 'The Tochacha\'s most chilling line: "Because you did not serve Hashem your God with joy." The punishment is not for abandoning mitzvos entirely but for performing them joylessly. The Gaon taught: simcha in avodah is not optional — it is the very thing being evaluated. What would it look like to do one mitzvah today with actual joy?',
    },
  ],
  'Nitzavim': [
    {
      rabbi: 'R\' Levi Yitzchak of Berditchev zt"l',
      text: '"You are all standing today" — the entire nation, from leaders to woodchoppers, entering the covenant together. The Berditchever said: Hashem sees the woodchopper\'s sincerity as fully as the scholar\'s erudition. The most valuable thing you bring to the High Holidays is not your knowledge but your genuine desire to return.',
    },
    {
      rabbi: 'Sfas Emes',
      text: '"It is not in heaven" and "not across the sea" — the Torah is not inaccessible or foreign. The Sfas Emes: teshuva is not far away because you are never as far from Hashem as you think. Every person, regardless of where they have been, is standing in the same place today — in front of the same open gate.',
    },
  ],
  'Vayelech': [
    {
      rabbi: 'R\' Pinchas of Koritz zt"l',
      text: 'Moshe writes the Torah on the last day of his life and gives it to the Levites and elders — not to himself, not to a successor, but to the entire people. The Koretzer: the Torah does not belong to the rabbi or the teacher; it belongs to whoever holds it with love. Open a sefer today — even for five minutes — and it is yours.',
    },
  ],
  'Haazinu': [
    {
      rabbi: 'R\' Yitzchak Arama (Akedat Yitzchak)',
      text: 'Haazinu is a song — the entire parsha is poetry, because poetry reaches the heart when prose cannot. The Akedat Yitzchak: Hashem chose to transmit this final warning as music because music bypasses the mind and speaks directly to the soul. Find one piece of Jewish music today that moves you and let it do its work.',
    },
  ],
  'Bereshit': [
    {
      rabbi: 'R\' Chaim of Volozhin zt"l',
      text: 'The Torah begins with creation to establish that Hashem owns the world and can give it to whomever He chooses. But Rashi notes: it begins with the letter Beis, which is closed on three sides and open only forward. The lesson: don\'t look backward wondering why the world began as it did — face forward and build from where you are.',
    },
  ],
  'Noach': [
    {
      rabbi: 'R\' Yehudah Aryeh Leib Alter zt"l (Sfas Emes)',
      text: 'Noach is called righteous "in his generation" — a qualification that cuts both ways. He was righteous relative to his time, but perhaps not in absolute terms. The question the Torah is asking us: are you content to be good by the standards of the room you\'re in, or by a higher standard? The bar you choose defines your trajectory.',
    },
  ],
};

const FALLBACK_DVAR = {
  rabbi: 'Five Towns Community Rabbis',
  text: 'Every parsha carries a unique message for its moment. This week, open the text itself — read even one verse slowly — and ask: what is this saying to me, not in general, but specifically, right now? The Torah has been answering that question for every generation. It will answer it for yours too.',
};

function cleanParshaName(raw) {
  return raw?.replace(/^Parashat\s+/i, '').replace(/^Parsha\s+/i, '').trim() || '';
}

function getDayIndex() {
  // Rotate through divrei Torah by day of week (0=Sun ... 6=Sat)
  return new Date().getDay();
}

export default function ParshaCard() {
  const { data: parshaData, isLoading } = useQuery({
    queryKey: ['parsha-card', new Date().toDateString()],
    queryFn: getParsha,
    staleTime: 6 * 60 * 60 * 1000,
  });

  const parshaName = cleanParshaName(parshaData?.name || parshaData?.parsha || '');
  const divrei = DIVREI_TORAH[parshaName] || [];
  const dayIdx = getDayIndex();
  const [idx, setIdx] = useState(dayIdx % Math.max(divrei.length, 1));

  const dvar = divrei.length > 0 ? divrei[idx % divrei.length] : FALLBACK_DVAR;
  const canCycle = divrei.length > 1;

  if (isLoading) return null;

  return (
    <section className="mb-3 overflow-hidden rounded-[24px] border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <ScrollText className="h-4 w-4 text-amber-700 shrink-0" />
              <p className="text-[10px] font-black uppercase tracking-wide text-amber-700">
                Parshas {parshaName || 'HaShavua'}
              </p>
            </div>
            <h2 className="mt-1 text-[17px] font-black text-slate-950">Dvar Torah</h2>
          </div>
          {canCycle && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setIdx(i => (i - 1 + divrei.length) % divrei.length)}
                className="motion-press flex h-7 w-7 items-center justify-center rounded-full border border-amber-200 bg-white text-amber-700"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="text-[10px] font-black text-amber-600">{idx + 1}/{divrei.length}</span>
              <button
                type="button"
                onClick={() => setIdx(i => (i + 1) % divrei.length)}
                className="motion-press flex h-7 w-7 items-center justify-center rounded-full border border-amber-200 bg-white text-amber-700"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="mt-3 rounded-[18px] border border-amber-100 bg-white px-4 py-3">
          <p className="text-[13px] font-bold leading-[1.6] text-slate-800">{dvar.text}</p>
        </div>

        <div className="mt-2.5 flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          <p className="text-[11px] font-black text-amber-700">{dvar.rabbi}</p>
        </div>
      </div>
    </section>
  );
}
