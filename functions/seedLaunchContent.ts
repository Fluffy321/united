import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Sample users with avatars (using UI Avatars API for realistic photos)
    const sampleUsers = [
      { name: 'Sarah L.', age: '18+', avatar: 'https://i.pravatar.cc/150?img=1' },
      { name: 'David K.', age: '18+', avatar: 'https://i.pravatar.cc/150?img=12' },
      { name: 'Miriam G.', age: '18+', avatar: 'https://i.pravatar.cc/150?img=5' },
      { name: 'Eli R.', age: '18+', avatar: 'https://i.pravatar.cc/150?img=13' },
      { name: 'Rachel B.', age: '18+', avatar: 'https://i.pravatar.cc/150?img=9' },
      { name: 'Yosef M.', age: '18+', avatar: 'https://i.pravatar.cc/150?img=14' },
      { name: 'Leah S.', age: '18+', avatar: 'https://i.pravatar.cc/150?img=10' },
      { name: 'Moshe A.', age: '18+', avatar: 'https://i.pravatar.cc/150?img=15' },
      { name: 'Chana W.', age: '13-17', avatar: 'https://i.pravatar.cc/150?img=16' },
      { name: 'Ari F.', age: '13-17', avatar: 'https://i.pravatar.cc/150?img=33' }
    ];

    // Generate timestamps for last 7 days
    const now = Date.now();
    const getRandomDate = (daysAgo) => {
      const start = now - (daysAgo * 24 * 60 * 60 * 1000);
      const end = now - ((daysAgo - 1) * 24 * 60 * 60 * 1000);
      return new Date(start + Math.random() * (end - start)).toISOString();
    };

    // Five Towns locations
    const locations = [
      { label: 'Cedarhurst', lat: 40.6223, lng: -73.7159 },
      { label: 'Lawrence', lat: 40.6151, lng: -73.7296 },
      { label: 'Woodmere', lat: 40.6323, lng: -73.7129 },
      { label: 'Hewlett', lat: 40.6434, lng: -73.6951 },
      { label: 'Inwood', lat: 40.6226, lng: -73.7465 }
    ];

    const getRandomUser = () => sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
    const getRandomLocation = () => locations[Math.floor(Math.random() * locations.length)];

    // 15 Mitzvah Requests
    const mitzvahRequests = [
      { title: 'Need ride to YIHE for Shabbos', description: 'Looking for a ride to Young Israel of Hewlett for Friday night services. Can leave around 6:15pm.', category: 'Errand', day: 6 },
      { title: 'Help with groceries from Seasons', description: 'Elderly neighbor needs someone to pick up a few items from Seasons and drop them off. Should take 20 minutes.', category: 'Errand', day: 5 },
      { title: 'Lost wallet near LIRR station', description: 'Brown leather wallet lost near Lawrence LIRR station yesterday. Has ID and credit cards. Reward if found!', category: 'Lost & Found', day: 4 },
      { title: 'Minyan needs one more for Mincha', description: 'Young Israel of Lawrence needs one more for mincha at 1:45pm today. Come help us make a minyan!', category: 'Quick Favor', day: 1 },
      { title: 'Tutoring for 10th grade algebra', description: 'Looking for someone to help my son with algebra 2-3 times a week. Willing to pay or trade for other help.', category: 'Tutoring', day: 5 },
      { title: 'Need help setting up Shabbos timers', description: 'New to the area and need help programming lights and AC for Shabbos. Would really appreciate the help!', category: 'Shabbat Help', day: 3 },
      { title: 'Lost keys near Central Avenue', description: 'Set of house keys with blue keychain lost somewhere on Central Ave. Please contact if found!', category: 'Lost & Found', day: 2 },
      { title: 'Ride to JFK airport Sunday morning', description: 'Need a ride to JFK this Sunday at 8am. Happy to chip in for gas. Flying to Israel!', category: 'Errand', day: 4 },
      { title: 'Help moving boxes to storage', description: 'Need help moving 10-15 boxes from basement to storage unit in Cedarhurst. Shouldn\'t take more than an hour.', category: 'Quick Favor', day: 6 },
      { title: 'Hebrew tutor for bar mitzvah prep', description: 'Looking for someone to help my son practice his parsha for his bar mitzvah in 3 months.', category: 'Tutoring', day: 7 },
      { title: 'Cholent pot for Shabbos', description: 'My crockpot broke! Does anyone have an extra cholent pot I can borrow for this Shabbos?', category: 'Shabbat Help', day: 2 },
      { title: 'Jump start needed in Woodmere', description: 'Car battery died in Woodmere parking lot. Need someone with jumper cables. Will only take 5 minutes!', category: 'Quick Favor', day: 1 },
      { title: 'Found iPhone near The Bagel Shop', description: 'Found an iPhone 13 near The Bagel Shop in Cedarhurst. Contact to identify and claim.', category: 'Lost & Found', day: 3 },
      { title: 'Need 2 more for women\'s megillah reading', description: 'Planning a women\'s megillah reading on Purim. Need at least 2 more people to commit. Who\'s in?', category: 'Shabbat Help', day: 5 },
      { title: 'Tech help for elderly parent', description: 'My mom needs help setting up her new iPad and email. Looking for patient person to help, will pay.', category: 'Quick Favor', day: 4 }
    ];

    const createdRequests = [];
    for (const req of mitzvahRequests) {
      const author = getRandomUser();
      const loc = getRandomLocation();
      const created = await base44.asServiceRole.entities.MitzvahRequest.create({
        title: req.title,
        description: req.description,
        category: req.category,
        status: 'Open',
        created_by_user_id: `seed_${author.name.replace(/\s/g, '')}`,
        created_by_name: author.name,
        location_label: loc.label,
        location_lat: loc.lat + (Math.random() - 0.5) * 0.01,
        location_lng: loc.lng + (Math.random() - 0.5) * 0.01,
        is_anonymous: false,
        created_date: getRandomDate(req.day)
      });
      createdRequests.push(created);
    }

    // 10 Community Posts
    const communityPosts = [
      { body: 'Just moved to the Five Towns! Any recommendations for a good pediatrician in the area?', day: 6 },
      { body: 'PSA: Seasons is having a sale on chicken this week - $2.99/lb!', day: 5 },
      { body: 'Does anyone know what time candlelighting is this Friday? My Jewish calendar app isn\'t working.', day: 4 },
      { body: 'Looking for carpool to TAG from Woodmere. My son is in 8th grade. Anyone interested?', day: 5 },
      { body: 'The new pizza shop on Central Ave is amazing! Highly recommend the Margherita slice.', day: 3 },
      { body: 'Can someone explain the parking rules on Shabbos near the shuls? I\'m still confused.', day: 2 },
      { body: 'Found the best babysitter! DM me if you need contact info. She\'s reliable and great with kids.', day: 4 },
      { body: 'Who else is planning to go to the Chizuk Mission this year? Would love to coordinate travel!', day: 6 },
      { body: 'Reminder: There\'s a learning program starting at the White Shul next week. All levels welcome!', day: 1 },
      { body: 'Best place for Shabbos flowers in the Five Towns? The shop I used to go to closed.', day: 3 }
    ];

    for (const post of communityPosts) {
      const author = getRandomUser();
      await base44.asServiceRole.entities.UnifiedPost.create({
        user_id: `seed_${author.name.replace(/\s/g, '')}`,
        user_name: author.name,
        user_age_range: author.age,
        avatar_url: author.avatar,
        avatar_type: 'photo',
        type: 'feed',
        board: 'feed',
        body: post.body,
        city: 'Five Towns',
        likes_count: Math.floor(Math.random() * 15) + 3,
        comments_count: Math.floor(Math.random() * 8),
        is_seeded: true,
        created_date: getRandomDate(post.day)
      });
    }

    // 10 Events
    const events = [
      { title: 'Community Torah Learning', body: 'Join us for a shiur on this week\'s parsha with Rabbi Cohen. Coffee and pastries provided!', date: '2026-02-20', time: '8:00 PM', day: 4 },
      { title: 'Purim Costume Swap', body: 'Bring gently used Purim costumes to trade! Kids and adults welcome. Great way to save money and help the environment.', date: '2026-02-22', time: '10:00 AM', day: 5 },
      { title: 'Singles Shabbaton Registration', body: 'Registration is now open for the Five Towns singles Shabbaton. Ages 25-35. Sign up by next week!', date: '2026-03-07', time: 'All Day', day: 6 },
      { title: 'Mishloach Manos Packaging Party', body: 'Help pack mishloach manos for community members in need. Pizza and drinks provided. Bring the kids!', date: '2026-02-25', time: '7:00 PM', day: 3 },
      { title: 'Women\'s Tehillim Group', body: 'Weekly Tehillim gathering at the Sternberg residence. All women welcome. Light refreshments served.', date: '2026-02-18', time: '9:30 AM', day: 2 },
      { title: 'Basketball Pickup Game', body: 'Sunday morning basketball at the JCC. All skill levels welcome. Bring a friend!', date: '2026-02-16', time: '10:00 AM', day: 1 },
      { title: 'Hebrew School Parent Meeting', body: 'Important meeting for all Hebrew school parents at Darchei Torah. Discussion on curriculum changes.', date: '2026-02-19', time: '7:30 PM', day: 3 },
      { title: 'Shabbatons Committee Meeting', body: 'Planning meeting for upcoming shabbatons. Looking for volunteers to help organize. Your input matters!', date: '2026-02-17', time: '8:00 PM', day: 2 },
      { title: 'Gemach Volunteer Training', body: 'New volunteers needed for the local gemach. Training session this Thursday evening. All ages welcome!', date: '2026-02-20', time: '6:30 PM', day: 4 },
      { title: 'Five Towns 5K Run', body: 'Annual 5K run/walk to benefit local chesed organizations. Register now! T-shirts for all participants.', date: '2026-03-15', time: '8:00 AM', day: 7 }
    ];

    for (const event of events) {
      const author = getRandomUser();
      await base44.asServiceRole.entities.UnifiedPost.create({
        user_id: `seed_${author.name.replace(/\s/g, '')}`,
        user_name: author.name,
        user_age_range: author.age,
        avatar_url: author.avatar,
        avatar_type: 'photo',
        type: 'event',
        board: 'events',
        title: event.title,
        body: event.body,
        event_date: event.date,
        event_time: event.time,
        city: 'Five Towns',
        likes_count: Math.floor(Math.random() * 20) + 5,
        comments_count: Math.floor(Math.random() * 12),
        is_seeded: true,
        created_date: getRandomDate(event.day)
      });
    }

    // 5 Completed Mitzvah Highlights (as completed requests)
    const completedMitzvahs = [
      { title: 'Delivered groceries to Mrs. Schwartz', description: 'Picked up groceries from Supersol and delivered to elderly neighbor. She was so grateful!', category: 'Errand', day: 7 },
      { title: 'Tutored for math test', description: 'Helped 9th grader prepare for algebra test. He passed with an 85!', category: 'Tutoring', day: 6 },
      { title: 'Drove someone to doctor appointment', description: 'Gave neighbor a ride to their appointment in Manhattan. Traffic was bad but we made it!', category: 'Errand', day: 5 },
      { title: 'Set up Shabbos clock for new family', description: 'Helped family who just moved here set up all their Shabbos timers and clocks.', category: 'Shabbat Help', day: 4 },
      { title: 'Returned lost wallet', description: 'Found wallet and tracked down the owner through their ID. They were so relieved!', category: 'Lost & Found', day: 3 }
    ];

    for (const mitzvah of completedMitzvahs) {
      const requester = getRandomUser();
      const helper = getRandomUser();
      const loc = getRandomLocation();
      
      await base44.asServiceRole.entities.MitzvahRequest.create({
        title: mitzvah.title,
        description: mitzvah.description,
        category: mitzvah.category,
        status: 'Completed',
        created_by_user_id: `seed_${requester.name.replace(/\s/g, '')}`,
        created_by_name: requester.name,
        claimed_by_user_id: `seed_${helper.name.replace(/\s/g, '')}`,
        claimed_by_name: helper.name,
        location_label: loc.label,
        location_lat: loc.lat + (Math.random() - 0.5) * 0.01,
        location_lng: loc.lng + (Math.random() - 0.5) * 0.01,
        completed_at: getRandomDate(mitzvah.day),
        is_anonymous: false,
        created_date: getRandomDate(mitzvah.day + 1)
      });

      // Award points
      await base44.asServiceRole.entities.MitzvahAction.create({
        user_id: `seed_${helper.name.replace(/\s/g, '')}`,
        user_name: helper.name,
        request_id: 'seed_completed',
        request_title: mitzvah.title,
        points_awarded: 10,
        created_date: getRandomDate(mitzvah.day)
      });
    }

    return Response.json({ 
      success: true,
      created: {
        mitzvah_requests: 15,
        community_posts: 10,
        events: 10,
        completed_mitzvahs: 5,
        total: 40
      }
    });
  } catch (error) {
    console.error('Seed error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});