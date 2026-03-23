import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Check if already seeded (idempotent check)
    const existingRequests = await base44.asServiceRole.entities.MitzvahRequest.filter({
      status: 'open'
    }, '-created_date', 50);
    
    const requestsWithCoords = existingRequests.filter(r => r.approxLat && r.approxLng);
    if (requestsWithCoords.length >= 10) {
      return Response.json({ seeded: false, message: 'Already seeded (>= 10 open requests with coordinates)' });
    }

    // Five Towns locations with realistic coordinates
    const locations = [
      { label: 'Lawrence', lat: 40.6157, lng: -73.7296 },
      { label: 'Cedarhurst', lat: 40.6223, lng: -73.7246 },
      { label: 'Woodmere', lat: 40.6323, lng: -73.7129 },
      { label: 'Hewlett', lat: 40.6434, lng: -73.6946 },
      { label: 'Inwood', lat: 40.6229, lng: -73.7501 }
    ];

    // Generate timestamps for last 7 days
    const now = Date.now();
    const getRandomDate = (daysAgo) => {
      const start = now - (daysAgo * 24 * 60 * 60 * 1000);
      const end = now - ((daysAgo - 1) * 24 * 60 * 60 * 1000);
      return new Date(start + Math.random() * (end - start)).toISOString();
    };

    const getRandomLocation = () => {
      const loc = locations[Math.floor(Math.random() * locations.length)];
      return {
        label: loc.label,
        lat: loc.lat + (Math.random() - 0.5) * 0.01,
        lng: loc.lng + (Math.random() - 0.5) * 0.01
      };
    };

    // 15 Mitzvah Requests (spread across 7 days)
    const mitzvahRequests = [
      { title: 'Need ride to shul Friday night', description: 'Looking for a ride to Young Israel of Hewlett for Friday night services around 6:30pm.', category: 'Errand', day: 1 },
      { title: 'Help with Seasons grocery pickup', description: 'Elderly neighbor needs someone to pick up a few items from Seasons. Should take 20 minutes.', category: 'Errand', day: 1 },
      { title: 'Lost brown wallet near LIRR', description: 'Brown leather wallet lost near Lawrence LIRR station. Has ID and cards. Reward if found!', category: 'Lost & Found', day: 2 },
      { title: 'Minyan needs one more for Mincha', description: 'Young Israel of Lawrence needs one more for mincha at 1:45pm. Help us make a minyan!', category: 'Quick Favor', day: 2 },
      { title: 'Algebra tutoring needed', description: 'Looking for someone to help my 10th grader with algebra 2x a week. Can pay or trade help.', category: 'Tutoring', day: 3 },
      { title: 'Help setting up Shabbos timers', description: 'New to the area, need help programming lights and AC for Shabbos. Really appreciate it!', category: 'Shabbat Help', day: 3 },
      { title: 'Lost keys near Central Avenue', description: 'House keys with blue keychain lost on Central Ave between bagel shop and bank.', category: 'Lost & Found', day: 4 },
      { title: 'Ride to JFK Sunday morning 8am', description: 'Need a ride to JFK this Sunday at 8am. Happy to pay gas. Flying to Israel for simcha!', category: 'Errand', day: 4 },
      { title: 'Moving boxes to storage', description: 'Need help moving 10-15 boxes from basement to storage unit. Hour max. Pizza included!', category: 'Quick Favor', day: 5 },
      { title: 'Bar mitzvah Hebrew tutor', description: 'Looking for patient person to help my son practice his parsha. Bar mitzvah in 3 months.', category: 'Tutoring', day: 5 },
      { title: 'Borrow cholent pot for Shabbos?', description: 'My crockpot broke! Does anyone have an extra I can borrow just for this Shabbos?', category: 'Shabbat Help', day: 6 },
      { title: 'Jump start needed in Woodmere', description: 'Car battery died in parking lot near Gourmet Glatt. Need jumper cables, 5 min max!', category: 'Quick Favor', day: 6 },
      { title: 'Found iPhone 13 near bagel shop', description: 'Found iPhone 13 near The Bagel Shop in Cedarhurst yesterday. Contact to identify.', category: 'Lost & Found', day: 7 },
      { title: 'Tech help for my mom\'s iPad', description: 'My mom needs help setting up her new iPad and email. Looking for patient person, will pay.', category: 'Quick Favor', day: 7 },
      { title: 'Carpool to TAG needed', description: 'Looking for carpool from Woodmere to TAG for my 8th grader. Can alternate driving weeks.', category: 'Errand', day: 7 }
    ];

    const createdRequests = [];
    for (const req of mitzvahRequests) {
      const loc = getRandomLocation();
      const created = await base44.asServiceRole.entities.MitzvahRequest.create({
        title: req.title,
        description: req.description,
        category: req.category,
        status: 'open',
        created_by_user_id: 'seed_user_' + Math.random().toString(36).substr(2, 9),
        created_by_name: 'Community Member',
        locationLabel: loc.label,
        approxLat: loc.lat,
        approxLng: loc.lng,
        is_anonymous: false,
        created_date: getRandomDate(req.day)
      });
      createdRequests.push(created);
    }

    // 10 Community Posts
    const communityPosts = [
      { body: 'Just moved to Five Towns! Any pediatrician recommendations?', day: 1 },
      { body: 'PSA: Seasons has chicken on sale - $2.99/lb this week!', day: 2 },
      { body: 'The new pizza place on Central Ave is amazing. Try the Margherita!', day: 3 },
      { body: 'Looking for reliable babysitter in Cedarhurst area. DM me!', day: 4 },
      { body: 'Reminder: Learning program starts at White Shul next week. All levels!', day: 5 },
      { body: 'Best place for Shabbos flowers? My usual shop closed.', day: 5 },
      { body: 'Does anyone know candlelighting time this Friday? App not working.', day: 6 },
      { body: 'Can someone explain Shabbos parking near the shuls? Still confused.', day: 6 },
      { body: 'Who\'s going to the Chizuk Mission? Let\'s coordinate travel!', day: 7 },
      { body: 'Found the best local dry cleaner - fast and affordable. DM for details.', day: 7 }
    ];

    for (const post of communityPosts) {
      await base44.asServiceRole.entities.UnifiedPost.create({
        user_id: 'seed_user_' + Math.random().toString(36).substr(2, 9),
        user_name: 'Local Resident',
        user_age_range: '18+',
        avatar_url: 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 50),
        avatar_type: 'photo',
        type: 'feed',
        board: 'feed',
        body: post.body,
        city: 'Five Towns',
        likes_count: Math.floor(Math.random() * 12) + 2,
        comments_count: Math.floor(Math.random() * 6),
        is_seeded: true,
        created_date: getRandomDate(post.day)
      });
    }

    // 10 Events
    const events = [
      { title: 'Community Shiur with Rabbi Cohen', body: 'Weekly parsha shiur. Coffee and pastries provided!', date: '2026-02-20', time: '8:00 PM', day: 2 },
      { title: 'Purim Costume Swap', body: 'Bring gently used costumes to trade! Kids and adults welcome.', date: '2026-02-22', time: '10:00 AM', day: 3 },
      { title: 'Singles Shabbaton Sign Up', body: 'Registration open for Five Towns singles Shabbaton (ages 25-35).', date: '2026-03-07', time: 'All Day', day: 4 },
      { title: 'Mishloach Manos Packing', body: 'Help pack for community members in need. Pizza provided!', date: '2026-02-25', time: '7:00 PM', day: 4 },
      { title: 'Women\'s Tehillim Group', body: 'Weekly gathering. All women welcome. Light refreshments.', date: '2026-02-18', time: '9:30 AM', day: 5 },
      { title: 'Sunday Basketball at JCC', body: 'Pickup game, all skill levels. Bring a friend!', date: '2026-02-23', time: '10:00 AM', day: 5 },
      { title: 'Hebrew School Parent Meeting', body: 'Important curriculum discussion at Darchei Torah.', date: '2026-02-19', time: '7:30 PM', day: 6 },
      { title: 'Gemach Volunteer Training', body: 'New volunteers needed! Training this Thursday. All ages welcome!', date: '2026-02-20', time: '6:30 PM', day: 6 },
      { title: 'Five Towns 5K Run for Chesed', body: 'Annual run/walk benefiting local organizations. Register now!', date: '2026-03-15', time: '8:00 AM', day: 7 },
      { title: 'Shabbatons Planning Meeting', body: 'Help organize upcoming events. Your input matters!', date: '2026-02-17', time: '8:00 PM', day: 7 }
    ];

    for (const event of events) {
      await base44.asServiceRole.entities.UnifiedPost.create({
        user_id: 'seed_user_' + Math.random().toString(36).substr(2, 9),
        user_name: 'Event Organizer',
        user_age_range: '18+',
        avatar_url: 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 50),
        avatar_type: 'photo',
        type: 'event',
        board: 'events',
        title: event.title,
        body: event.body,
        event_date: event.date,
        event_time: event.time,
        city: 'Five Towns',
        likes_count: Math.floor(Math.random() * 18) + 4,
        comments_count: Math.floor(Math.random() * 10),
        is_seeded: true,
        created_date: getRandomDate(event.day)
      });
    }

    // 5 Completed Mitzvahs
    for (let i = 0; i < 5; i++) {
      const loc = getRandomLocation();
      await base44.asServiceRole.entities.MitzvahRequest.create({
        title: ['Delivered groceries', 'Gave ride to appointment', 'Tutored for test', 'Set up timers', 'Returned lost item'][i],
        description: 'This mitzvah was completed successfully!',
        category: ['Errand', 'Errand', 'Tutoring', 'Shabbat Help', 'Lost & Found'][i],
        status: 'completed',
        created_by_user_id: 'seed_user_' + Math.random().toString(36).substr(2, 9),
        created_by_name: 'Requester',
        claimed_by_user_id: 'seed_user_' + Math.random().toString(36).substr(2, 9),
        claimed_by_name: 'Helper',
        locationLabel: loc.label,
        approxLat: loc.lat,
        approxLng: loc.lng,
        completed_at: getRandomDate(i + 3),
        is_anonymous: false,
        created_date: getRandomDate(i + 4)
      });
    }

    return Response.json({ 
      seeded: true,
      success: true,
      message: 'Seeded 40 items successfully',
      created: {
        mitzvah_requests: 15,
        community_posts: 10,
        events: 10,
        completed_mitzvahs: 5
      }
    });
  } catch (error) {
    console.error('Seed error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});