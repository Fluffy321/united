import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const FEATURED_SHULS = [
  'Young Israel of Woodmere',
  'Young Israel of Lawrence Cedarhurst',
  'Congregation Bnei Sholom',
  'Beis Medrash of Woodmere',
  'Kehilas Bais Yehuda',
  'Sephardic Congregation of Cedarhurst',
  'Chabad of the Five Towns',
  'Aish Kodesh Woodmere',
  'Bais Tefila of Woodmere'
];

const SAMPLE_POSTS = [
  {
    title: 'Shabbat Schedule',
    body: 'Candlelighting: 5:45 PM\nServices: 6:00 PM\nKiddush following services.',
    type: 'announcement'
  },
  {
    title: 'New Daf Yomi Shiur',
    body: 'Starting this week - Daily Daf Yomi class at 7:30 AM followed by breakfast. All levels welcome!',
    type: 'general'
  },
  {
    title: 'Community Volunteer Opportunity',
    body: 'We need volunteers for our upcoming meal train for a family in our community. Please reach out if interested.',
    type: 'general'
  },
  {
    title: 'Holiday Services',
    body: 'Purim services will be held on Thursday evening at 7:00 PM and Friday morning at 10:00 AM.',
    type: 'announcement'
  },
  {
    title: 'Upcoming Lecture',
    body: 'Rabbi will be giving a special lecture on "Living with Purpose" - Thursday at 8:00 PM in the main hall.',
    type: 'event'
  },
  {
    title: 'Shul Maintenance Request',
    body: 'Help needed to organize our library and classrooms. If you have a few hours available, please sign up.',
    type: 'general'
  },
  {
    title: 'Weekly Newsletter',
    body: 'This week\'s Torah portion focuses on the laws of Shabbat. Check your email for detailed insights.',
    type: 'announcement'
  },
  {
    title: 'Community BBQ',
    body: 'Join us for a family-friendly BBQ after services this Saturday. Bring your family and a side dish!',
    type: 'event'
  }
];

const SAMPLE_EVENTS = [
  {
    title: 'Shabbat Services',
    body: 'Weekly Shabbat morning services',
    event_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    event_time: '9:00 AM',
    location_text: 'Main Sanctuary'
  },
  {
    title: 'Daf Yomi Shiur',
    body: 'Daily Talmud study session',
    event_date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    event_time: '7:30 AM',
    location_text: 'Study Hall'
  },
  {
    title: 'Community Lunch',
    body: 'Monthly community gathering with lunch',
    event_date: new Date(Date.now() + 259200000).toISOString().split('T')[0],
    event_time: '12:00 PM',
    location_text: 'Fellowship Hall'
  },
  {
    title: 'Rabbi\'s Class',
    body: 'Weekly discussion on Jewish philosophy',
    event_date: new Date(Date.now() + 345600000).toISOString().split('T')[0],
    event_time: '8:00 PM',
    location_text: 'Main Sanctuary'
  }
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all communities
    const allCommunities = await base44.asServiceRole.entities.Community.list('', 3000);
    
    // Filter for featured shuls
    const shulsToSeed = allCommunities.filter(c => 
      FEATURED_SHULS.some(name => c.name?.toLowerCase().includes(name.toLowerCase()))
    );

    let postsCreated = 0;
    let eventsCreated = 0;

    // Seed content for each shul
    for (const shul of shulsToSeed) {
      // Seed posts and announcements
      for (const post of SAMPLE_POSTS) {
        try {
          await base44.asServiceRole.entities.CommunityPost.create({
            community_id: shul.id,
            author_user_id: user.id,
            author_name: 'Shul Admin',
            body: post.body,
            title: post.title,
            type: post.type,
            is_official: true,
            is_seeded: true
          });
          postsCreated++;
        } catch (e) {
          console.log(`Failed to create post for ${shul.name}:`, e.message);
        }
      }

      // Seed events
      for (const event of SAMPLE_EVENTS) {
        try {
          await base44.asServiceRole.entities.CommunityPost.create({
            community_id: shul.id,
            author_user_id: user.id,
            author_name: 'Shul Admin',
            body: event.body,
            title: event.title,
            type: 'event',
            event_date: event.event_date,
            event_time: event.event_time,
            location_text: event.location_text,
            is_official: true,
            is_seeded: true
          });
          eventsCreated++;
        } catch (e) {
          console.log(`Failed to create event for ${shul.name}:`, e.message);
        }
      }
    }

    return Response.json({
      success: true,
      message: `Seeded ${shulsToSeed.length} shuls`,
      postsCreated,
      eventsCreated,
      shulsSeeded: shulsToSeed.map(s => s.name)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});