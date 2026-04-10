import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

function weekNumber() {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now - jan1) / 86400000 + jan1.getDay() + 1) / 7);
}

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function randomFrom(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}
function randomInt(min, max, rng) {
  return Math.floor(rng() * (max - min + 1)) + min;
}
function generateTimestamp(rng) {
  const hoursBack = Math.pow(rng(), 1.6) * 108; // max ~4.5 days, weighted recent
  return new Date(Date.now() - hoursBack * 3600000).toISOString();
}

const SEED_AUTHORS = [
  { name: 'Devorah K.', id: 'seed_001' },
  { name: 'Moshe F.', id: 'seed_002' },
  { name: 'Rivka G.', id: 'seed_003' },
  { name: 'Yossi S.', id: 'seed_004' },
  { name: 'Chana B.', id: 'seed_005' },
  { name: 'Ari L.', id: 'seed_006' },
  { name: 'Miriam C.', id: 'seed_007' },
  { name: 'Tzvi W.', id: 'seed_008' },
  { name: 'Esther B.', id: 'seed_009' },
  { name: 'Noam S.', id: 'seed_010' },
  { name: 'Leah R.', id: 'seed_011' },
  { name: 'Benny K.', id: 'seed_012' },
  { name: 'Tova M.', id: 'seed_013' },
  { name: 'Akiva S.', id: 'seed_014' },
  { name: 'Faigy A.', id: 'seed_015' },
  { name: 'Yehuda G.', id: 'seed_016' },
  { name: 'Nechama L.', id: 'seed_017' },
  { name: 'Pinny B.', id: 'seed_018' },
  { name: 'Sara W.', id: 'seed_019' },
  { name: 'Dov H.', id: 'seed_020' },
  { name: 'Raizy E.', id: 'seed_021' },
  { name: 'Yanky P.', id: 'seed_022' },
];

const LOCATIONS = [
  'Lawrence', 'Woodmere', 'Cedarhurst', 'Hewlett', 'Inwood', 'Far Rockaway', 'Five Towns'
];

const FOOD_IMAGES = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
  'https://images.unsplash.com/photo-1551183053-bf91798d792a?w=800',
  'https://images.unsplash.com/photo-1600628421055-4d30de868b8f?w=800',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
  'https://images.unsplash.com/photo-1607877361964-d8a3064e68c3?w=800',
  'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
];

// ── POOL with distribution: 30% Q, 20% help, 15% shabbat, 10% parenting, 10% events, 10% food, 5% torah ──

const POOL = {
  // 30% — prompts/questions (post_subtype: question)
  question: [
    { body: 'Honest question — does anyone actually enjoy the week between Rosh Hashana and Yom Kippur? Asking for spiritual growth reasons 😅 {location}' },
    { body: 'Hot take: the best part of Shabbos is the nap. Change my mind. {location} what do you all think?' },
    { body: 'Anyone else feel like Pesach cleaning gets worse every year or is that just me? How do you actually manage it without losing your mind? {location}' },
    { body: 'Where do you guys go for Shabbos lunch when you\'re not hosting and not invited anywhere? Is that even a thing? Asking for a very real reason. {location}' },
    { body: 'At what age did you start letting your kids walk to shul alone? Genuinely curious what people do in {location}.' },
    { body: 'Real talk — how many challahs do you make for Shabbos? We have 4 kids and I still can\'t figure out the right amount. {location}' },
    { body: 'Anyone have a good system for getting kids to help clean for Shabbos without it becoming a whole thing? {location} parents I need your wisdom' },
    { body: 'Which do you prefer: a big kiddush with the whole shul, or a small intimate Shabbos lunch at home? No wrong answer. {location}' },
    { body: 'Looking for the best way to explain Yom Kippur fasting to a 5-year-old. What worked for your kids? {location}' },
    { body: 'Serious question: is there a polite way to let a neighbor know their dog barks all night? Asking from {location} with love ❤️' },
    { body: 'What\'s everyone doing for Chol Hamoed? Looking for ideas that aren\'t just the same three places every year. {location} fam' },
    { body: 'Does anyone else\'s husband think "I put the kids to bed" is the same as doing bedtime? Asking for a friend in {location} 😭' },
    { body: 'Best kosher restaurant you\'ve been to outside of the Five Towns? Planning a trip and want recommendations. {location}' },
    { body: 'Is it normal that my kids refuse to eat anything other than chicken nuggets and pasta? Send help and recipes. {location}' },
    { body: 'Who\'s your go-to for dvar Torah material? I want something interesting for the Shabbos table this week. {location}' },
    { body: 'Anyone tried the new place in Cedarhurst? Curious what people think before I drag my family there. {location}' },
    { body: 'What\'s a good chesed project to do with kids ages 7–12? Looking for something hands-on. {location}' },
    { body: 'How do you balance learning and working full time? Feel like I never have enough time for everything. {location}' },
    { body: 'Is anyone else doing Daf Yomi? Just started and looking for chavrusa partners in {location}' },
    { body: 'Shabbos morning davening: early minyan before the kids wake up, or family davening together? What does your house do? {location}' },
    { body: 'Where is everyone for Shabbos this week? Staying local or going away? {location} crowd — let\'s hear it 👇' },
    { body: 'Anyone know good cholent spots in the Five Towns? Like if you\'re not making your own and want takeout Friday — who has the best? {location}' },
    { body: 'Best pizza place right now? Need something tonight and can\'t decide. {location} — go.' },
    { body: 'Is anyone else dealing with camp logistics chaos or just us 😅 Between forms, deposits, and medical stuff I feel like I need a full-time coordinator. {location}' },
    { body: 'Who\'s going to the shiur tonight? Just want to know if I\'ll know anyone there. {location}' },
    { body: 'Anyone driving to Brooklyn tonight around 8? Would love to split the drive if someone\'s heading that way from {location}.' },
    { body: 'Looking for a math tutor for 9th grade in {location} — any recommendations? Needs to be patient and good with someone who gets anxious around tests.' },
    { body: 'Need a ride to JFK tomorrow morning (early 😭) — leaving from {location} around 5am. Happy to Venmo for gas or split an Uber. Please help lol' },
    { body: 'Does anyone know a good cleaning lady available in Woodmere? Looking for weekly or bi-weekly. {location} — any honest recommendations appreciated 🙏' },
    { body: 'Any babysitters available for Motzei Shabbos in {location}? Two kids, ages 5 and 9. Great kids, easy night. Happy to pay well.' },
    { body: 'Still looking for 2 spots for Shabbos lunch if anyone has room 🙏 {location} area — we\'re happy to bring a dish! Just don\'t want to be alone this week.' },
    { body: 'Tried a new challah recipe this week and it was honestly unreal. Fluffy, golden, perfect crust. {location} bakers — I\'ll share the recipe if anyone wants it 🍞' },
    { body: 'Who\'s around for Seudah Shlishit this week? {location} — thinking of putting something together if there\'s enough interest. Casual, low-key, good vibes.' },
    { body: 'Anyone hosting extra guests this week and need help with logistics — rides, meals, anything? Happy to pitch in. {location} community is always so generous 🤍' },
    { body: 'Any recommendations for after school activities for younger kids in {location}? Looking for something fun and enriching — sports, arts, anything. My 7-year-old is bored and I need ideas 😅' },
    { body: 'Bus was late again today… anyone else dealing with this in {location}? Third time this week. Trying to figure out if it\'s just our route or a wider issue.' },
    { body: 'Best tutor for Regents math in {location}? Looking for someone patient and results-oriented. My kid is smart but needs a confidence boost. Any honest recs appreciated 🙏' },
    { body: 'Anyone else completely overwhelmed with camp forms right now? The medical forms, the permission slips, the deposits… {location} parents — how do you stay on top of all this?? 😭' },
  ],

  // 20% — help/useful posts
  help: [
    { title: 'Ride to JFK early Thursday?', body: 'Anyone driving to JFK from {location} this Thursday before 6am? Happy to split the Uber cost or contribute for gas. Appreciate any help!' },
    { title: 'Babysitter needed this Shabbos', body: 'Last minute — does anyone know a responsible babysitter available in {location} this Shabbos afternoon? 2 kids, ages 4 and 7. Happy to compensate well.' },
    { title: 'Borrowing a folding table for Yom Tov', body: 'Does anyone in {location} have a folding table we can borrow for Yom Tov? We have extra guests coming and our table isn\'t quite big enough. Will return after Shabbos.' },
    { title: 'Recommendation: pediatric dentist in the area?', body: 'New to the area and looking for a good pediatric dentist in or near {location}. Kids are 5 and 8. Any recommendations greatly appreciated!' },
    { title: 'Kosher meat order — splitting with neighbors?', body: 'Ordering from a wholesale butcher this week. Anyone in {location} want to split an order? Minimum is higher than I need. Happy to coordinate.' },
    { title: 'Need help setting up sukkah', body: 'Anyone available to help put up a sukkah in {location} this week? Happy to return the favor or just bring homemade cookies as payment 🍪' },
    { title: 'Can anyone watch my dog over Yom Tov?', body: 'Traveling for Yom Tov and need someone reliable to watch our friendly, chill labrador for 3 days. He\'s no trouble. {location} area. Happy to compensate.' },
    { title: 'Looking for a chavrusa — mornings', body: 'New to {location} and looking for someone to learn with before work. Daf Yomi or parasha, flexible. Prefer in person but Zoom works too.' },
    { title: 'Anyone have extra Pesach dishes?', body: 'Setting up a separate Pesach kitchen for the first time and a bit short on dishes and pots. Anyone in {location} have extras they\'re not using? Happy to borrow or buy.' },
    { title: 'Best kosher grocery delivery to {location}?', body: 'Has anyone found a reliable kosher grocery delivery service that actually comes to {location}? Getting tired of making the run every week.' },
    { title: 'Need a handyman rec', body: 'Looking for a trustworthy frum handyman in {location} for some home repairs — nothing major. Who do you use?' },
    { title: 'Meal train for a family in need', body: 'A wonderful family in {location} just had a baby and could use some support. If you\'d like to contribute a meal, please reach out and I\'ll coordinate.' },
  ],

  // 15% — Shabbat/Yom Tov
  shabbat: [
    { body: 'Shabbos table is set, candles are lit, soup is on. Wishing everyone in {location} a beautiful and peaceful Shabbat Shalom ✨🕯️' },
    { body: 'Challah just came out of the oven and the house smells INCREDIBLE. Good Shabbos from {location}! 🍞' },
    { body: 'Spent all Thursday night cooking and now I have no idea what I made. Shabbos preparation is a mystery. Wishing everyone in {location} a restful Shabbos 😅' },
    { body: 'Having guests for Shabbos for the first time in our new home in {location}! Excited and terrified in equal measure. Davening it all comes together 🙏' },
    { body: 'Havdalah just ended and I\'m already looking forward to next Shabbos. Something about that feeling... {location} have a wonderful week!' },
    { body: 'Shabbos afternoon nap is a legitimate mitzvah and nobody can convince me otherwise 😴 {location}' },
    { body: 'Something about walking to shul on a quiet Shabbos morning in {location} — the streets, the neighbors, the smell of cholent from every house — I wouldn\'t trade this life.' },
    { body: 'Pre-Shabbos chaos is SO real but the moment the candles are lit everything just... shifts. The whole house gets quiet. Worth every crazy Friday. {location} 🕯️' },
    { body: 'Tip: making cholent Wednesday night instead of Friday means it\'s actually ready by Shabbos morning. Changed my life. {location} crowd — try it.' },
    { body: 'My kids asked why we light Shabbos candles. Answered them for 20 minutes. We were late to shul. Still worth it. {location}' },
    { body: 'Yom Tov cooking is in full swing. I\'ve made 4 kugels and I\'m not even done. Send help and a larger kitchen. {location} 🍲' },
    { body: 'Shabbos devar Torah from the rav today in {location} was one of the best I\'ve heard. He connected the parasha to something so current — the whole shul was riveted.' },
  ],

  // 10% — parenting/school
  parenting: [
    { body: 'My 6-year-old came home and taught ME a vort from the parasha. I had genuinely nothing to add. The teachers in {location} schools are doing something right.' },
    { body: 'Camp registration stress has officially begun. How do {location} families decide between local and overnight? This is genuinely the hardest parenting decision every year.' },
    { body: 'Funniest thing from my 5-year-old at the Shabbos table: "Abba, if Hashem made everything, who made Hashem?" I had no answer. {location} parenting is wild 😂' },
    { body: 'Is anyone else\'s kid suddenly refusing to eat anything they liked two weeks ago? Third kid and I still don\'t understand this. {location} parents — please tell me it passes.' },
    { body: 'Looking for a good math tutor for a 7th grader in {location}. She\'s smart but needs a bit of extra support this semester. Patient and encouraging is more important than anything.' },
    { body: 'My daughter finished her first full chapter book in Hebrew this week. I may have cried a little. The schools here in {location} are genuinely great.' },
    { body: 'Parenting win today: both kids actually did their homework before dinner. Logging this as a miracle. {location}' },
    { body: 'Does anyone know of a moms\' group in {location} for parents of kids with learning differences? Looking for community and shared experiences, not just professional referrals.' },
    { body: 'How do you handle screen time with young kids on chol hamoed without feeling guilty about it? Asking genuinely. {location}' },
    { body: 'My son\'s school is doing a chesed fair next week and he won\'t stop talking about it. The educators in {location} are planting really beautiful seeds.' },
  ],

  // 10% — events
  events: [
    { title: 'Women\'s Shiur — This Thursday Night', body: 'A new women\'s shiur is starting this Thursday at 8pm in {location}! Going through Pirkei Avos together. Warm, casual, all levels welcome. Please share!' },
    { title: 'Melave Malka This Saturday Night', body: 'Join us Saturday night after Shabbos for a community melave malka in {location}! Hot food, live music, and a chance to carry the Shabbos energy a little longer. All welcome.' },
    { title: 'Speed Friending Event — Meet Your Neighbors', body: 'New to {location} or just want to meet more people? Join our "speed friending" event! Structured, fun, and a genuinely great way to make real connections. Limited spots.' },
    { title: "Community Volunteer Morning", body: 'Join us this Sunday morning at the local food pantry in {location}. Great for families, teens, anyone. No experience needed — just show up and help. 9am–noon.' },
    { title: 'Father & Son Learning Breakfast', body: 'Special Sunday morning father-son learning event at the shul in {location}! All ages welcome. Breakfast included, great energy, meaningful time together. Starts 9am.' },
    { title: "Lag B'Omer Bonfire", body: "Community bonfire for Lag B'Omer in {location}! Bring the kids, bring s'mores, bring your neighbors. Starts at nightfall. One of the best nights of the year 🔥" },
    { title: 'Jewish Book Club — First Meeting', body: 'Launching a monthly Jewish book club in {location}! First book TBD by vote. Open to anyone who enjoys reading and good conversation. First meeting next Tuesday evening.' },
    { title: 'Community Trivia Night', body: 'Jewish trivia night at the {location} shul! Teams of 4, real prizes, lots of laughs. All ages welcome. Bring your competitive side 😄 Register by Wednesday.' },
    { title: "Kids' Havdalah Party", body: 'Community kids havdalah party this Motzei Shabbos in {location}! Songs, crafts, snacks, and ruach. Ages 3–10. So much fun last year — come join us!' },
    { title: 'Cooking Class — Shabbos Classics', body: 'Local {location} chef is teaching a Shabbos cooking class next Sunday! Challah, cholent, and kugel. Hands-on, fun, and you eat everything you make. Limited spots — sign up soon.' },
    { title: 'Purim Party This Saturday Night', body: 'Purim party this Saturday night — should be packed!! Costume contest, live music, the whole thing. {location} — come ready to celebrate 🎉👻 Who\'s coming??' },
    { title: 'Shiur Tonight at 8pm', body: 'Reminder: shiur tonight at 8pm in Cedarhurst. Great topic this week — really relevant to what\'s going on right now. All are welcome, no prior knowledge needed. See you there 📚 {location}' },
    { title: 'Young Professionals Event Next Week', body: 'Young professionals event next week — who\'s going? Great lineup this year, should be a really solid crowd. {location} — drop a comment if you\'re planning to be there so we can coordinate 🙋‍♂️' },
    { title: 'Community BBQ This Sunday!', body: 'Community BBQ this Sunday — {location}! Bring the family, bring your appetite. Burgers, dogs, the works. One of the best events of the year. Don\'t miss it 🔥🍔' },
  ],

  // 10% — food/photos
  food: [
    { body: 'Made my grandmother\'s brisket recipe for the first time in years. Turned out exactly right. Some things taste like home. {location} ❤️', hasImage: true },
    { body: 'Best kosher pizza in the Five Towns — I need an honest ranking from the {location} community. Drop your top 3 in the comments. Let\'s settle this.', hasImage: false },
    { body: 'Homemade rugelach this week. Took 3 hours to make. Gone in 15 minutes. Would do it again in a heartbeat. {location} 🍪', hasImage: true },
    { body: 'New kosher spot opened in {location} and the shakshouka is genuinely incredible. Also the salads. Also the desserts. Just go.', hasImage: false },
    { body: 'My butternut squash soup is officially Shabbos-ready. Secret: a little ginger and an apple. Total game changer. {location} 🍲', hasImage: true },
    { body: 'Who has a cholent recipe they swear by? I\'ve been making the same one for 6 years and want to try something new. {location} — drop your secrets in the comments.' },
    { body: 'Hosting 14 people for Shabbos this week. Cooking timeline has been planned since Monday. Send me good vibes. {location} 😅' },
    { body: 'First time making gefilte fish from scratch. My mother is thrilled. My husband doesn\'t understand why I didn\'t just buy it. He has a point. {location}', hasImage: true },
    { body: 'The kosher food scene in {location} is genuinely underrated. So many good options now. We\'re lucky to live here.' },
    { body: 'Shabbos table from last night 🔥 {location}', hasImage: true },
    { body: 'Made this kugel — came out insane. {location} 😍', hasImage: true },
    { body: 'New sushi spot opened in {location} — anyone try it yet? Heard it\'s really good but want to hear from locals first.' },
    { body: 'Made a big pot of chicken soup Tuesday and it\'s been slowly disappearing all week. My family eats like it\'s Shabbos every night. {location}', hasImage: true },
  ],

  // 5% — Torah/thoughts
  torah: [
    { body: 'Heard an incredible vort this Shabbos connecting the parasha to something happening right now. Would love to share it — anyone want to hear it? Drop a comment.' },
    { body: 'Starting a new masechta this week after a siyum. Something about turning back to daf alef always feels like a new beginning. Learning in {location} 📖' },
    { body: 'My rav\'s shiur Thursday was one of the best of the year — spoke about kavod habriot in practical life. If you were there you know what I mean. {location}' },
    { body: 'Even 15 minutes of learning in the morning before work changes the whole day for me. Trying to keep the streak going. {location}' },
    { body: 'Question for the learning crowd: any good sefarim on the halachos of speech — shmirat halashon — that are readable and not too dense? Asking from {location}' },
    { body: 'My 6-year-old asked me why we say Shema at night. I gave her a real answer and she actually listened. Those parenting moments hit different. {location} 🙏' },
    { body: 'Nice vort I heard this week — really stuck with me. Anyone want to hear it? Drop a comment and I\'ll share. {location}' },
    { body: 'Anyone going to the Daf Yomi siyum tonight in {location}? Would love to go together if anyone\'s heading that way.' },
    { body: 'Good shiur recommendations? Looking for something weekly, engaging, not too long. {location} or online both work. What are you listening to?' },
  ],
};

// Per-type comment pools — realistic, varied, casual
const COMMENT_POOLS = {
  question: [
    ['Same 😂', 'I might — DM me', 'Following this', 'Lmk if you find one', 'Asked my wife this exact thing last week'],
    ['Same honestly', 'This is us every year 😭', 'We just hire someone at this point lol', 'Following for answers'],
    ['Try the Cohen family, they usually host', 'DM me, I think I know someone', 'We have room! Reach out 🙏', 'Sending you a DM'],
    ['I went last week, it was great', 'Heard it was packed — go early', 'It\'s so good, definitely worth it', 'Already been twice this month 😄'],
    ['Same 😂', 'This every Friday without fail', 'Why is this me every single week', 'Shabbos panic is a lifestyle at this point'],
    ['Following this', 'Need this answer too', 'Commenting so I see the replies', 'Please tag me when you find out'],
    ['Gotta be Eden Wok', 'Mazur\'s honestly', 'Anywhere with garlic knots wins', 'This is the most important question asked today'],
    ['We do early minyan — game changer', 'Same! Kids don\'t even know you\'re gone 😂', 'We tried but my husband fell back asleep...', 'Early minyan crew rise up'],
    ['Same 😂', 'Yes!! Every single time', 'The answer is always yes', 'I hired someone this year. No regrets.'],
    ['Lmk if you find one', 'Looking for the same thing tbh', 'DM me if you find a good one', 'Following 👀'],
  ],
  help: [
    ['Can help! Sending you a DM', 'I have one you can borrow — DM me', 'We\'re driving that way — reach out'],
    ['I know someone great — I\'ll send their number', 'DM me, happy to help coordinate', 'Sending you a contact now'],
    ['Done! What do they like to eat?', 'We can do Thursday — just DM me', 'Happy to help — DM\'ing you now', 'Count us in 🙏'],
    ['Lmk if you still need this', 'I might have one — let me check', 'DM me', 'Try asking on the community WhatsApp'],
  ],
  shabbat: [
    ['Shabbat Shalom!! 🕯️', 'Good Shabbos from {location}! 🍞', 'Love this ❤️', 'This is the content I\'m here for'],
    ['The pre-Shabbos panic is so real', 'Every single week 😭❤️', 'Somehow it always comes together. Magic of Shabbos.', 'Same every Friday lol'],
    ['Gorgeous!! What recipe?', 'Can I come over?? 😄', 'Good Shabbos!! ✨', 'Your house always smells amazing'],
    ['Same 😴', 'Shabbos nap is sacred', 'The most important mitzvah honestly', 'Not debating this'],
    ['I went last week, it was great', 'So beautiful 🕯️', 'This made me smile', 'The streets on Shabbos morning in this neighborhood... nothing like it'],
  ],
  parenting: [
    ['Same 😂', 'My son did the exact same thing!!', 'The teachers here are incredible', 'I had the same moment last week'],
    ['Following this', 'Need this answer too', 'Going through this right now 😭', 'Someone please answer lol'],
    ['We\'re in camp deposit hell right now', 'The forms never end', 'I made a spreadsheet and I\'m still lost 😅', 'Same. Every. Year.'],
    ['Mine went through this at 5. It passes. Sort of.', 'My middle child is in a "beige foods only" phase', 'Yes this is SO real', 'Send help and snacks'],
    ['So proud!! 📚', 'The schools here really are excellent', 'Best feeling ever', 'Made me tear up honestly'],
  ],
  events: [
    ['Going!! Can\'t wait 🙌', 'I might — DM me', 'We\'ll be there!', 'Already signed up! Anyone want to go together?'],
    ['How do we RSVP?', 'Is there registration?', 'Sharing this with my group — so needed', 'Lmk if you still have spots'],
    ['Came last year — do NOT miss this', 'Last year was incredible', 'We\'re in!! Who else is coming?', 'So glad this is back 🙌'],
    ['Following this', 'I went last week, it was great', 'This sounds so fun', 'Sending to my wife now'],
  ],
  food: [
    ['This looks AMAZING', 'Recipe please!! 🙏', 'I can smell this through the screen', 'Okay I need this'],
    ['Same 😂', 'Your family is so lucky', 'From scratch is SO worth it', 'My husband says the same thing every year lol'],
    ['Gotta be [Place] 😂', 'Controversial but I prefer Cedarhurst', 'All of them are good honestly', 'This is the Five Towns question of our time'],
    ['I need this recipe', 'Can confirm — I\'ve eaten at her house 😄', 'The ginger tip is a game changer', 'Saving this comment'],
    ['Following this', 'Lmk how it is!', 'I heard mixed things — curious to try', 'We went last week, it was great'],
  ],
  torah: [
    ['Would love to hear it! Please share', 'Yes share it!!', 'Can you post the vort here?', 'Drop it in the comments 🙏'],
    ['The rav is incredible', 'That shiur was so good', 'If anyone missed it — worth asking for the recording', 'I went last week, it was great'],
    ['Been doing morning learning for 3 months — it really does change the day', 'Even 10 minutes makes a difference', 'This inspired me to try it this week', 'Same — it\'s been a game changer'],
    ['Mazel tov on the siyum!! 🎉', 'That feeling of starting alef again is unmatched', 'Which masechta are you starting?', 'I might — DM me about chavrusas'],
    ['Following this', 'I might join — lmk', 'Same, looking for a chavrusa too', 'DM me!'],
  ],
};

function getCommentPool(type) {
  if (type === 'question') return COMMENT_POOLS.question;
  if (type === 'help') return COMMENT_POOLS.help;
  if (type === 'shabbat') return COMMENT_POOLS.shabbat;
  if (type === 'parenting') return COMMENT_POOLS.parenting;
  if (type === 'events') return COMMENT_POOLS.events;
  if (type === 'food') return COMMENT_POOLS.food;
  if (type === 'torah') return COMMENT_POOLS.torah;
  return COMMENT_POOLS.question;
}

// Distribution: 30% Q, 20% help, 15% shabbat, 10% parenting, 10% events, 10% food, 5% torah
const TYPE_WEIGHTS = [
  ['question',  30],
  ['help',      20],
  ['shabbat',   15],
  ['parenting', 10],
  ['events',    10],
  ['food',      10],
  ['torah',      5],
];

function pickType(rng) {
  const total = TYPE_WEIGHTS.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [type, w] of TYPE_WEIGHTS) {
    r -= w;
    if (r <= 0) return type;
  }
  return 'question';
}

function generatePost(week, postIndex) {
  const rng = seededRandom(week * 1000 + postIndex + 91);
  const type = pickType(rng);
  const templates = POOL[type] || POOL.question;
  const template = templates[Math.floor(rng() * templates.length)];
  const location = randomFrom(LOCATIONS, rng);
  const author = randomFrom(SEED_AUTHORS, rng);

  const title = (template.title || '').replace(/\{location\}/g, location);
  const body = template.body.replace(/\{location\}/g, location);

  const boardMap = { question: 'feed', help: 'help', shabbat: 'feed', parenting: 'feed', events: 'events', food: 'feed', torah: 'feed' };
  const typeMap = { question: 'feed', help: 'help', shabbat: 'feed', parenting: 'feed', events: 'event', food: 'feed', torah: 'feed' };

  const commentCount = randomInt(2, 6, rng);

  const post = {
    user_id: author.id,
    user_name: author.name,
    type: typeMap[type] || 'feed',
    board: boardMap[type] || 'feed',
    title: title || undefined,
    body,
    location_text: location,
    city: 'Five Towns',
    is_seeded: true,
    likes_count: randomInt(3, 32, rng),
    comments_count: commentCount,
    created_date: generateTimestamp(rng),
    post_subtype: type === 'question' ? 'question' : undefined,
    _type: type, // internal, stripped before save
    _comment_count: commentCount,
  };

  if ((type === 'food' && template.hasImage !== false) || (type === 'shabbat' && rng() > 0.55)) {
    post.image_url = randomFrom(FOOD_IMAGES, rng);
    post.likes_count = randomInt(10, 40, rng);
  }

  if (type === 'events') {
    const future = new Date(Date.now() + randomInt(2, 18, rng) * 86400000);
    post.event_date = future.toISOString().split('T')[0];
    post.event_time = `${randomInt(17, 21, rng)}:00`;
  }

  return post;
}

function generateComments(postId, type, count, weekSeed, postIndex) {
  const pool = getCommentPool(type);
  const rng = seededRandom(weekSeed * 7777 + postIndex + 333);
  const set = pool[Math.floor(rng() * pool.length)];
  const comments = [];
  const pickedCount = Math.min(count, set.length);
  for (let i = 0; i < pickedCount; i++) {
    const author = randomFrom(SEED_AUTHORS, rng);
    const body = set[i].replace(/\{location\}/g, randomFrom(LOCATIONS, rng)).replace(/\{name\}/g, randomFrom(SEED_AUTHORS, rng).name);
    const minsBack = randomInt(5, 200, rng);
    comments.push({
      post_id: postId,
      author_id: author.id,
      author_name: author.name,
      body,
      created_date: new Date(Date.now() - minsBack * 60000).toISOString(),
    });
  }
  return comments;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
  } catch {
    // scheduler — ok
  }

  try {
    const week = weekNumber();
    console.log(`seedFeedPosts: week=${week}`);

    const allPosts = await base44.asServiceRole.entities.UnifiedPost.list('-created_date', 300);
    const realPosts = allPosts.filter(p => !p.is_seeded);
    const seededPosts = allPosts.filter(p => p.is_seeded);

    let targetSeeded = 80;
    if (realPosts.length >= 200) targetSeeded = 15;
    else if (realPosts.length >= 100) targetSeeded = 30;
    else if (realPosts.length >= 50) targetSeeded = 50;
    else if (realPosts.length >= 20) targetSeeded = 65;

    // Remove old seeded posts (>5 days)
    const cutoff = Date.now() - 5 * 86400000;
    const oldSeeded = seededPosts.filter(p => new Date(p.created_date).getTime() < cutoff);
    for (const post of oldSeeded.slice(0, 80)) {
      await base44.asServiceRole.entities.UnifiedPost.delete(post.id);
    }

    const recentSeeded = seededPosts.filter(p => new Date(p.created_date).getTime() >= cutoff);
    const toCreate = Math.max(0, targetSeeded - recentSeeded.length);

    if (toCreate === 0) {
      return Response.json({ ok: true, message: 'Feed is fresh', created: 0, week });
    }

    // Generate posts
    const postDrafts = [];
    for (let i = 0; postDrafts.length < toCreate && i < toCreate * 3; i++) {
      const post = generatePost(week, i);
      postDrafts.push(post);
    }

    // Bulk-create posts first
    const cleanPosts = postDrafts.map(({ _type, _comment_count, ...rest }) => rest);
    const createdPosts = [];
    for (let i = 0; i < cleanPosts.length; i += 10) {
      const batch = cleanPosts.slice(i, i + 10);
      const results = await base44.asServiceRole.entities.UnifiedPost.bulkCreate(batch);
      // bulkCreate returns array of created records with IDs
      if (Array.isArray(results)) createdPosts.push(...results);
    }
    const created = createdPosts.length;

    // Build comment batch across all posts
    const allComments = [];
    for (let i = 0; i < createdPosts.length; i++) {
      const savedPost = createdPosts[i];
      const draft = postDrafts[i];
      if (!savedPost?.id) continue;
      const comments = generateComments(savedPost.id, draft._type, draft._comment_count, week, i);
      allComments.push(...comments);
    }

    let commentCount = 0;
    for (let i = 0; i < allComments.length; i += 20) {
      const batch = allComments.slice(i, i + 20);
      await base44.asServiceRole.entities.Comment.bulkCreate(batch);
      commentCount += batch.length;
    }

    console.log(`seedFeedPosts done: posts=${created}, comments=${commentCount}, week=${week}`);
    return Response.json({ ok: true, created, commentCount, week, realPosts: realPosts.length });
  } catch (error) {
    console.error('seedFeedPosts error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});