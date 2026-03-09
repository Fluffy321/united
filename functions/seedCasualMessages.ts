import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const CASUAL_MESSAGES = [
  "Anyone know a good kosher sushi place around here?",
  "Traffic on Rockaway Turnpike is crazy right now.",
  "Best place to get coffee in Cedarhurst?",
  "Does anyone know if Gourmet Glatt has fresh challah today?",
  "Looking for a babysitter recommendation for Thursday nights.",
  "Where do people play pickup basketball around here?",
  "Anyone selling Purim costumes for kids?",
  "Lost my AirPods somewhere near Central Ave.",
  "Any good gyms besides the JCC?",
  "Is the Woodmere LIRR running on schedule tonight?",
  "Does anyone know a good math tutor for 11th grade?",
  "Where's the best burger place in the Five Towns?",
  "Anyone know where I can buy mishloach manos baskets?",
  "Is the weather supposed to rain tomorrow?",
  "Looking for a good place to study around here.",
  "Anyone know a good mechanic locally?",
  "Best pizza place in the area?",
  "Is there a minyan tonight at Young Israel?",
  "Does anyone have a ladder I can borrow?",
  "Looking for a ride to JFK tomorrow morning.",
  "Anyone know if the park in Woodmere is open late?",
  "Best place for kosher ice cream nearby?",
  "Anyone selling furniture?",
  "Where do people usually go running around here?",
  "Anyone know a good dentist in the area?",
  "Is the kosher Dunkin open late?",
  "Looking for someone who does house cleaning.",
  "Does anyone know when the next community blood drive is?",
  "Best bagels in the Five Towns?",
  "Anyone know a good barber?",
  "Is the gym at the JCC crowded tonight?",
  "Looking for someone who teaches guitar lessons.",
  "Anyone have recommendations for a summer camp?",
  "Where can I get good shawarma nearby?",
  "Does anyone know when the next town meeting is?",
  "Looking for a good pediatrician.",
  "Anyone selling a used bike?",
  "Where can I buy kosher sushi platters?",
  "Does anyone know a good SAT tutor?",
  "Best bakery in the Five Towns?",
  "Looking for someone who can fix a washing machine.",
  "Anyone know if there's pickup soccer tonight?",
  "Where can I get good falafel?",
  "Looking for recommendations for a driving instructor.",
  "Anyone know a good car wash nearby?",
  "Is the Woodmere park basketball court open tonight?",
  "Looking for a photographer for a small event.",
  "Does anyone know a good plumber?",
  "Anyone selling tickets for the game tonight?",
  "Where's the best place for kosher Chinese?",
  "Looking for someone who teaches piano lessons.",
  "Does anyone know a good dermatologist?",
  "Best place to get smoothies around here?",
  "Anyone know a good dog walker?",
  "Looking for someone to shovel snow this winter.",
  "Does anyone know if the train is delayed?",
  "Anyone selling a used couch?",
  "Looking for a local electrician.",
  "Does anyone know when the farmers market opens?",
  "Best place to buy flowers locally?",
  "Anyone know a good accountant?",
  "Looking for recommendations for a moving company.",
  "Anyone know where to get good kosher sushi burritos?",
  "Does anyone know if the gym is open tomorrow morning?",
  "Looking for someone who can help with college applications.",
  "Anyone know a good car dealership nearby?",
  "Best place for kosher breakfast?",
  "Does anyone know if the basketball league starts soon?",
  "Looking for someone to tutor chemistry.",
  "Anyone know a good place to print flyers?",
  "Looking for someone who does alterations.",
  "Anyone know where to buy good rugelach?",
  "Best place to get takeout for Shabbat?",
  "Anyone know a good chiropractor?",
  "Looking for someone who installs security cameras.",
  "Anyone know if the library is open tonight?",
  "Best place for kosher steak?",
  "Anyone know a good babysitter?",
  "Looking for someone to fix my phone screen.",
  "Does anyone know if the pool is open today?",
  "Best place to buy kosher wine?",
  "Anyone know a good tailor?",
  "Looking for someone to build a website.",
  "Anyone know if the gym has open basketball tonight?",
  "Best place for late night food?",
  "Anyone selling concert tickets?",
  "Looking for someone who teaches swimming lessons.",
  "Anyone know a good therapist?",
  "Looking for someone who can help with yard work.",
  "Best place for kosher tacos?",
  "Anyone know where to buy good cheesecake?",
  "Looking for someone to walk my dog.",
  "Anyone know a good locksmith?",
  "Looking for someone who can help move a couch.",
  "Anyone know a good orthodontist?",
  "Looking for someone who can clean gutters.",
  "Best place to buy challah Friday morning?",
  "Anyone know where to get good knishes?",
  "Looking for someone who repairs laptops.",
  "Anyone know a good handyman?",
  "Best place to buy kosher pastries?",
  "Anyone know if there's pickup volleyball tonight?",
];

const LOCAL_NAMES = [
  'Sarah', 'Rachel', 'Miriam', 'Leah', 'Hannah',
  'David', 'Michael', 'Joshua', 'Ethan', 'Aaron',
  'Yael', 'Talia', 'Naomi', 'Ruth', 'Noa',
  'Jacob', 'Benjamin', 'Isaac', 'Levi', 'Dan',
];

const LAST_NAMES = [
  'Cohen', 'Levy', 'Shapiro', 'Friedman', 'Goldstein',
  'Kaufman', 'Hoffman', 'Blumstein', 'Rosenberg', 'Feldman',
  'Mendelsohn', 'Finerman', 'Hochberg', 'Stark', 'Scharf',
];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomUser() {
  return `${getRandomElement(LOCAL_NAMES)} ${getRandomElement(LAST_NAMES)}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Create casual messages as UnifiedPost entities
    const postsToCreate = CASUAL_MESSAGES.map(msg => ({
      user_id: `seed_user_${Math.random().toString(36).substr(2, 9)}`,
      user_name: generateRandomUser(),
      user_age_range: Math.random() > 0.5 ? '18+' : '13-17',
      type: 'feed',
      board: 'feed',
      body: msg,
      city: 'Five Towns',
      likes_count: Math.floor(Math.random() * 15),
      comments_count: Math.floor(Math.random() * 8),
      is_seeded: true,
    }));

    // Batch create (up to 100 at a time to avoid overwhelming the API)
    const batchSize = 50;
    let created = 0;
    for (let i = 0; i < postsToCreate.length; i += batchSize) {
      const batch = postsToCreate.slice(i, i + batchSize);
      await base44.asServiceRole.entities.UnifiedPost.bulkCreate(batch);
      created += batch.length;
    }

    return Response.json({ 
      success: true, 
      message: `Created ${created} casual feed messages`,
      count: created 
    });
  } catch (error) {
    console.error('seedCasualMessages error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});