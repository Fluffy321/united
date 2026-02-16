import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ ok: false, error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Check if already seeded
    const existing = await base44.asServiceRole.entities.Shul.filter({ name: 'Young Israel of Woodmere', verified: true });
    if (existing.length > 0) {
      return Response.json({ 
        ok: true, 
        success: true,
        alreadySeeded: true, 
        shulId: existing[0].id,
        message: 'Young Israel of Woodmere already exists' 
      });
    }

    // Create the shul
    const shul = await base44.asServiceRole.entities.Shul.create({
      name: 'Young Israel of Woodmere',
      address: '1025 Broadway, Woodmere, NY 11598',
      town: 'Woodmere',
      approxLat: 40.6323,
      approxLng: -73.7129,
      description: 'A warm and welcoming Modern Orthodox congregation serving the Woodmere community.',
      verified: true,
      member_count: 0
    });

    console.log('Shul created:', shul.id);

    // Get some users to be admins and members
    const allUsers = await base44.asServiceRole.entities.User.list();
    const adminUsers = allUsers.filter(u => u.role === 'admin').slice(0, 2);
    const regularUsers = allUsers.filter(u => u.role !== 'admin').slice(0, 8);

    // Create admin memberships
    for (const adminUser of adminUsers) {
      await base44.asServiceRole.entities.ShulMember.create({
        shul_id: shul.id,
        shul_name: shul.name,
        user_id: adminUser.id,
        user_name: adminUser.display_name,
        role: 'admin',
        notifications_enabled: true
      });
    }

    // Create regular memberships
    for (const regUser of regularUsers) {
      await base44.asServiceRole.entities.ShulMember.create({
        shul_id: shul.id,
        shul_name: shul.name,
        user_id: regUser.id,
        user_name: regUser.display_name,
        role: 'member',
        notifications_enabled: true
      });
    }

    const adminId = adminUsers[0]?.id || user.id;
    const adminName = adminUsers[0]?.display_name || user.display_name;

    // Seed 8 announcements
    const announcements = [
      { title: 'Shacharis Minyan Times Updated', content: 'New winter schedule: Shacharis at 6:30am, 7:15am, and 8:00am daily. Mincha/Maariv at sunset.' },
      { title: 'Rabbi Willig Shiur This Shabbos', content: 'Join us after Kiddush for Rabbi Willig\'s weekly shiur on Hilchos Shabbos.' },
      { title: 'Youth Oneg Shabbos Program', content: 'Our youth program continues this Shabbos! Groups for ages 3-5, 6-8, and 9-12. Begins after Kiddush.' },
      { title: 'Sisterhood Book Club Meeting', content: 'Next Tuesday at 8pm in the social hall. This month: "People of the Book" by Geraldine Brooks.' },
      { title: 'Kiddush Sponsorship Available', content: 'We have openings for Kiddush sponsorships for the next two months. Contact the office to reserve.' },
      { title: 'Building Maintenance Notice', content: 'The parking lot will be repaved this week. Please use street parking Tuesday-Wednesday.' },
      { title: 'New Security Protocols', content: 'For everyone\'s safety, all doors will remain locked during davening. Please use the main entrance.' },
      { title: 'Daily Daf Yomi Shiur', content: 'Join Rabbi Cohen for Daf Yomi every morning at 5:45am. Coffee and bagels provided!' }
    ];

    for (const ann of announcements) {
      await base44.asServiceRole.entities.ShulPost.create({
        shul_id: shul.id,
        shul_name: shul.name,
        user_id: adminId,
        user_name: adminName,
        type: 'announcement',
        title: ann.title,
        content: ann.content,
        is_pinned: announcements.indexOf(ann) < 2
      });
    }

    // Seed 5 events
    const today = new Date();
    const events = [
      { title: 'Scholar in Residence Shabbaton', content: 'Rabbi Dr. Abraham Twerski will be our scholar in residence. Friday night oneg, Shabbos day shiur, and Shalosh Seudos address.', date: new Date(today.getTime() + 10*24*60*60*1000), time: 'All Shabbos' },
      { title: 'Community Purim Seudah', content: 'Join us for a festive Purim seudah with live music, games for kids, and delicious food!', date: new Date(today.getTime() + 30*24*60*60*1000), time: '2:00 PM' },
      { title: 'Youth Department Bowling Night', content: 'Families welcome! $15 per person includes shoes and 2 games. Pizza will be served.', date: new Date(today.getTime() + 5*24*60*60*1000), time: '7:00 PM' },
      { title: 'Bikur Cholim Baking Workshop', content: 'Learn to bake challah and cookies for hospital patients. All baked goods will be delivered to local medical centers.', date: new Date(today.getTime() + 12*24*60*60*1000), time: '10:00 AM' },
      { title: 'Men\'s Club Breakfast and Learn', content: 'Monthly breakfast with guest speaker Rabbi Yisroel Reisman. Topic: "Finding Meaning in Tefillah"', date: new Date(today.getTime() + 7*24*60*60*1000), time: '8:30 AM' }
    ];

    for (const evt of events) {
      await base44.asServiceRole.entities.ShulPost.create({
        shul_id: shul.id,
        shul_name: shul.name,
        user_id: adminId,
        user_name: adminName,
        type: 'event',
        title: evt.title,
        content: evt.content,
        event_date: evt.date.toISOString().split('T')[0],
        event_time: evt.time
      });
    }

    // Seed 6 discussions
    const discussions = [
      { title: 'Anyone driving to Brooklyn Sunday morning?', content: 'I need a ride to Boro Park around 10am. Happy to share gas money!' },
      { title: 'Babysitter recommendation needed', content: 'Looking for a responsible babysitter for Shabbos afternoons. Any suggestions?' },
      { title: 'Lost tallis bag in shul', content: 'Dark blue velvet bag with initials Y.G. Was in the back left section. Please let me know if found!' },
      { title: 'Carpool to Camp Morasha?', content: 'Is anyone else sending to Camp Morasha this summer? Maybe we can coordinate carpools for visiting day.' },
      { title: 'Recommendations for caterer?', content: 'Planning a bar mitzvah and looking for a good kosher caterer. Who have you used and loved?' },
      { title: 'Seforim for sale', content: 'Moving and downsizing my library. Mostly English seforim on halacha and machshava. Great condition!' }
    ];

    for (const disc of discussions) {
      const randomUser = regularUsers[Math.floor(Math.random() * regularUsers.length)];
      await base44.asServiceRole.entities.ShulPost.create({
        shul_id: shul.id,
        shul_name: shul.name,
        user_id: randomUser.id,
        user_name: randomUser.display_name,
        type: 'discussion',
        title: disc.title,
        content: disc.content
      });
    }

    // Seed 5 mitzvah requests tied to this shul
    const mitzvahs = [
      { title: 'Need minyan for shiva house', description: 'Family sitting shiva on Oak Street needs help making minyanim. Evening mincha/maariv at 7pm.', category: 'Other' },
      { title: 'Meals for family with new baby', description: 'Young family just welcomed twins! Looking for volunteers to provide meals for the next two weeks.', category: 'Shabbat Help' },
      { title: 'Ride to doctor appointment', description: 'Elderly congregant needs transportation to medical appointment in Manhattan next Tuesday at 2pm.', category: 'Errand' },
      { title: 'Help setting up for Kiddush', description: 'Need 3-4 people to help set up tables and chairs for this week\'s Kiddush. Should take about 30 minutes.', category: 'Quick Favor' },
      { title: 'English tutor needed', description: 'High school student needs help with English literature homework. 1-2 hours per week.', category: 'Tutoring' }
    ];

    for (const mitz of mitzvahs) {
      await base44.asServiceRole.entities.MitzvahRequest.create({
        title: mitz.title,
        description: mitz.description,
        category: mitz.category,
        status: 'open',
        created_by_user_id: regularUsers[Math.floor(Math.random() * regularUsers.length)].id,
        created_by_name: regularUsers[Math.floor(Math.random() * regularUsers.length)].display_name,
        locationLabel: 'Woodmere',
        approxLat: 40.6323,
        approxLng: -73.7129,
        is_anonymous: false
      });
    }

    // Update member count
    await base44.asServiceRole.entities.Shul.update(shul.id, {
      member_count: adminUsers.length + regularUsers.length
    });

    return Response.json({
      ok: true,
      success: true,
      message: 'Young Israel of Woodmere seeded successfully',
      shulId: shul.id,
      stats: {
        announcements: 8,
        events: 5,
        discussions: 6,
        mitzvahs: 5,
        members: adminUsers.length + regularUsers.length
      }
    });
  } catch (error) {
    console.error('Seed error:', error);
    console.error('Stack:', error.stack);
    return Response.json({ 
      ok: false,
      success: false,
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});