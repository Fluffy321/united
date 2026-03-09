import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const CASUAL_MESSAGES = [
  // Food & Restaurants
  "Anyone know a good kosher sushi place around here?",
  "Traffic on Rockaway Turnpike is crazy right now.",
  "Best place to get coffee in Cedarhurst?",
  "Where's the best burger place in the Five Towns?",
  "Best pizza place in the area?",
  "Best bagels in the Five Towns?",
  "Best place for kosher ice cream nearby?",
  "Where can I get good shawarma nearby?",
  "Where can I get good falafel?",
  "Where's the best place for kosher Chinese?",
  "Best place for kosher breakfast?",
  "Best place for kosher steak?",
  "Best place for late night food?",
  "Best place for kosher tacos?",
  "Best place to get takeout for Shabbat?",
  "Best bakery in the Five Towns?",
  "Best place to buy kosher wine?",
  "Best place to buy kosher pastries?",
  "Anyone know where to buy good cheesecake?",
  "Anyone know where to buy good knishes?",
  "Where can I buy kosher sushi platters?",
  "Anyone know where to get good rugelach?",
  "Best place to buy challah Friday morning?",
  "Does anyone know if Gourmet Glatt has fresh challah today?",
  "Is the kosher Dunkin open late?",
  "Best place to get smoothies around here?",
  
  // Services & Help
  "Looking for a babysitter recommendation for Thursday nights.",
  "Anyone know a good math tutor for 11th grade?",
  "Looking for someone who does house cleaning.",
  "Anyone know a good mechanic locally?",
  "Looking for someone who teaches guitar lessons.",
  "Looking for a good pediatrician.",
  "Does anyone know a good SAT tutor?",
  "Looking for someone who can fix a washing machine.",
  "Does anyone know a good plumber?",
  "Looking for a photographer for a small event.",
  "Does anyone know a good dentist in the area?",
  "Does anyone know a good dermatologist?",
  "Anyone know a good dog walker?",
  "Looking for someone to shovel snow this winter.",
  "Looking for a local electrician.",
  "Looking for someone who teaches piano lessons.",
  "Anyone know a good therapist?",
  "Looking for someone who can help with yard work.",
  "Looking for someone to walk my dog.",
  "Anyone know a good locksmith?",
  "Looking for someone who can help move a couch.",
  "Anyone know a good orthodontist?",
  "Looking for someone who can clean gutters.",
  "Looking for someone who repairs laptops.",
  "Anyone know a good handyman?",
  "Looking for someone who does alterations.",
  "Anyone know a good tailor?",
  "Looking for recommendations for a driving instructor.",
  "Looking for someone who can help with college applications.",
  "Looking for someone to tutor chemistry.",
  "Looking for someone who teaches swimming lessons.",
  "Anyone know a good chiropractor?",
  "Looking for someone who installs security cameras.",
  "Looking for someone to build a website.",
  "Looking for recommendations for a moving company.",
  
  // Activities & Sports
  "Where do people play pickup basketball around here?",
  "Where do people usually go running around here?",
  "Anyone know if there's pickup soccer tonight?",
  "Is the Woodmere park basketball court open tonight?",
  "Is the gym at the JCC crowded tonight?",
  "Is the gym is open tomorrow morning?",
  "Anyone know if the gym has open basketball tonight?",
  "Does anyone know if the basketball league starts soon?",
  "Anyone know if there's pickup volleyball tonight?",
  "Any good gyms besides the JCC?",
  
  // Events & Community
  "Does anyone know when the next community blood drive is?",
  "Does anyone know when the next town meeting is?",
  "Is there a minyan tonight at Young Israel?",
  "Anyone have recommendations for a summer camp?",
  "Looking for a photographer for a small event.",
  
  // Shopping & Items
  "Anyone selling Purim costumes for kids?",
  "Anyone selling furniture?",
  "Anyone selling a used bike?",
  "Anyone selling tickets for the game tonight?",
  "Anyone selling a used couch?",
  "Anyone selling concert tickets?",
  
  // Lost & Found
  "Lost my AirPods somewhere near Central Ave.",
  
  // Traffic & Transportation
  "Is the Woodmere LIRR running on schedule tonight?",
  "Looking for a ride to JFK tomorrow morning.",
  "Does anyone know if the train is delayed?",
  "Anyone know a good car wash nearby?",
  "Anyone know a good car dealership nearby?",
  
  // Local Info
  "Is the weather supposed to rain tomorrow?",
  "Looking for a good place to study around here.",
  "Anyone know if the park in Woodmere is open late?",
  "Does anyone know if the pool is open today?",
  "Anyone know if the library is open tonight?",
  "Does anyone know when the farmers market opens?",
  "Best place to buy flowers locally?",
  "Looking for a good place to print flyers?",
  "Anyone know a good accountant?",
  
  // Additional variety
  "Anyone know a good barber?",
  "Does anyone have a ladder I can borrow?",
  "Looking for a good place to study around Five Towns.",
  "Need recommendations for birthday party venues.",
  "Where can I find good vegan kosher options?",
  "Anyone know good tutoring centers nearby?",
  "Is parking always this crazy on Lawrence Avenue?",
  "Best place for getting dry cleaning in Cedarhurst?",
  "Anyone know if the kosher market is having a sale this week?",
  "Looking for someone to watch my kids this Saturday.",
  "Does anyone use a good landscaper?",
  "Where's a good place to get a haircut around here?",
  "Anyone know good contractors for home renovation?",
  "Is there anywhere to get good organic produce locally?",
  "Looking for recommendations for a good realtor.",
  "Anyone know if they're building anything new in the area?",
  "Where can I find a good yoga class?",
  "Anyone recommend a good insurance agent?",
  "Looking for someone who does bookkeeping.",
  "Does anyone know a good photographer for portraits?",
  "Anyone know where to get good curtains or blinds?",
  "Is there a good pool contractor around?",
  "Looking for recommendations for an HVAC company.",
  "Anyone know a good place for office supplies?",
  "Where can I get good appliances at a decent price?",
  "Anyone recommend a good veterinarian?",
  "Looking for a good car rental place.",
  "Does anyone know a good jeweler in town?",
  "Looking for recommendations for party catering.",
  "Anyone know where to get good wine for Shabbat?",
  "Is there a good library nearby for kids?",
  "Looking for someone who can tutor Spanish.",
  "Anyone know a good place for printing business cards?",
  "Where's a good place to get a massage?",
  "Anyone know if there's a kosher grocery delivery service?",
  "Looking for recommendations for an investment advisor.",
  "Anyone know where to get good furniture locally?",
  "Does anyone use a good cleaning service?",
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