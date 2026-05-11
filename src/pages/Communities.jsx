import React, { useMemo, useState } from 'react';
import {
  BadgeCheck,
  CalendarDays,
  Compass,
  EyeOff,
  HeartHandshake,
  Lock,
  MessageCircle,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import PageHelp from '@/components/common/PageHelp';
import { useNavigate } from 'react-router-dom';
import CommunityHubCard from '@/components/communities/CommunityHubCard';
import CommunityHubDetail from '@/components/communities/CommunityHubDetail';
import CreateCommunityForm from '@/components/communities/CreateCommunityForm';

const categories = [
  'All',
  'Official',
  'Local',
  'Support',
  'Learning',
  'Lifestyle',
  'Sports',
  'Creative',
  'Business',
  'Parents',
  'Values',
];

const communityTypes = {
  official: {
    label: 'Official / Daily',
    description: 'Platform-run hubs for trusted updates, Torah, local news, and chesed coordination.',
    icon: BadgeCheck,
    tone: 'blue',
  },
  support: {
    label: 'Private / Support',
    description: 'Sensitive identity spaces with hidden membership, anonymous joining, and safer posting defaults.',
    icon: EyeOff,
    tone: 'violet',
  },
  lifestyle: {
    label: 'Lifestyle & Interests',
    description: 'Social communities around hobbies, learning styles, goals, and Jewish life.',
    icon: Sparkles,
    tone: 'emerald',
  },
  user: {
    label: 'User-Created',
    description: 'Member-led spaces with simple admin controls and customizable privacy.',
    icon: Users,
    tone: 'amber',
  },
};

const initialCommunities = [
  {
    id: 'daily-torah',
    name: 'Daily Torah',
    communityType: 'official',
    category: 'Official',
    privacy: 'Public',
    privacyLabel: 'Public',
    location: 'JUnited daily',
    featured: true,
    joined: true,
    verified: true,
    trending: true,
    memberCount: 1820,
    activityScore: 96,
    engagement: '312 learned today',
    recentActivity: 'New 3-minute parsha thought posted 8 minutes ago',
    identityTags: ['Torah every day', 'Short shiurim', 'Parsha'],
    recommendationReason: 'You interact with learning and mitzvah posts.',
    description: 'A steady daily Torah hub with short divrei Torah, Daf notes, halacha prompts, and discussion that fits into real life.',
    rules: ['Cite sources when possible.', 'Keep debate respectful.', 'Ask practical halacha to your rav.'],
    roles: [{ name: 'JUnited Torah Desk', role: 'Admin' }, { name: 'Rabbi Adler', role: 'Moderator' }],
    posts: [
      { id: 'torah-1', type: 'Learning post', author: 'JUnited Torah Desk', title: 'Today in one idea', body: 'Small choices repeated daily become the atmosphere of a Jewish home.', time: '8m ago', likes: 84, comments: 19, pinned: true, liked: true },
      { id: 'torah-2', type: 'Question', author: 'Avi Rosen', title: 'What helped you stay consistent?', body: 'Trying to build a realistic 10-minute seder. What actually worked for you?', time: '51m ago', likes: 22, comments: 31, pinned: false, liked: false },
    ],
    events: ['Night seder check-in - Tonight 9:15 PM', 'Parsha huddle - Friday 12:30 PM'],
    announcements: ['Daily prompt refreshes every morning.', 'Source sheet added weekly.'],
    resources: ['Daf Yomi links', '10-minute seder ideas', 'Weekly source sheet'],
  },
  {
    id: 'jewish-updates-news',
    name: 'Jewish Updates / News',
    communityType: 'official',
    category: 'Official',
    privacy: 'Public',
    privacyLabel: 'Public',
    location: 'Local and Jewish world',
    featured: true,
    joined: true,
    verified: true,
    trending: true,
    memberCount: 2415,
    activityScore: 94,
    engagement: 'Fresh brief every day',
    recentActivity: 'Five Towns brief updated 14 minutes ago',
    identityTags: ['News', 'Local brief', 'Verified updates'],
    recommendationReason: 'Official updates keep the whole app anchored.',
    description: 'A clean, moderated Jewish news stream for local updates, useful alerts, school/shul notices, and community context.',
    rules: ['No rumors.', 'Use verified sources.', 'Keep comments useful and calm.'],
    roles: [{ name: 'JUnited Updates', role: 'Admin' }, { name: 'Local Moderator', role: 'Moderator' }],
    posts: [
      { id: 'news-1', type: 'Announcement', author: 'JUnited Updates', title: 'Five Towns morning brief', body: 'Traffic, school reminders, community events, and helpful local notes in one place.', time: '14m ago', likes: 65, comments: 12, pinned: true, liked: false },
      { id: 'news-2', type: 'Question', author: 'Community member', title: 'What should be in tomorrow morning brief?', body: 'Drop verified local updates you want included.', time: '2h ago', likes: 18, comments: 16, pinned: false, liked: false },
    ],
    events: ['Weekly local briefing - Sunday 9:00 AM'],
    announcements: ['Official items are labeled and moderated.'],
    resources: ['Local alert guidelines', 'Submit a verified update'],
  },
  {
    id: 'five-towns-local',
    name: 'Five Towns Local',
    communityType: 'official',
    category: 'Local',
    privacy: 'Public',
    privacyLabel: 'Public',
    location: 'Lawrence, Cedarhurst, Woodmere, Hewlett, Inwood',
    featured: true,
    joined: true,
    verified: true,
    trending: true,
    memberCount: 3180,
    activityScore: 98,
    engagement: '89 local replies today',
    recentActivity: 'Lost item returned and two carpools matched today',
    identityTags: ['Five Towns', 'Local life', 'Neighbors'],
    recommendationReason: 'Your local Jewish hub.',
    description: 'The everyday digital center for the Five Towns: local questions, events, store updates, carpools, lost and found, and neighborhood help.',
    rules: ['Keep posts local and practical.', 'No lashon hara.', 'Use categories so neighbors can find things fast.'],
    roles: [{ name: 'Five Towns Desk', role: 'Admin' }, { name: 'Cedarhurst Mod', role: 'Moderator' }],
    posts: [
      { id: 'local-1', type: 'Announcement', author: 'Five Towns Desk', title: 'Today around town', body: 'Central Ave traffic note, two community events, and a reminder to check the map filters before errands.', time: '22m ago', likes: 74, comments: 28, pinned: true, liked: true },
      { id: 'local-2', type: 'Question', author: 'Miriam Cohen', title: 'Best place for a quick weekday lunch?', body: 'Need something near Woodmere with seating and easy parking.', time: '1h ago', likes: 11, comments: 24, pinned: false, liked: false },
    ],
    events: ['Community cleanup - Sunday 11:00 AM', 'New families coffee - Wednesday 8:15 PM'],
    announcements: ['Map filters now include restaurants, shops, shuls, and schools.'],
    resources: ['Five Towns map', 'Local emergency numbers', 'Eruv status'],
  },
  {
    id: 'chesed-mitzvah-updates',
    name: 'Chesed / Mitzvah Updates',
    communityType: 'official',
    category: 'Official',
    privacy: 'Community-only',
    privacyLabel: 'Community-only',
    location: 'Five Towns',
    featured: true,
    joined: true,
    verified: true,
    memberCount: 1368,
    activityScore: 91,
    engagement: '17 mitzvahs covered this week',
    recentActivity: 'Two ride offers and a meal slot opened today',
    identityTags: ['Chesed', 'Mitzvahs', 'Volunteer'],
    recommendationReason: 'You use the Mitzvah tracker and map.',
    description: 'A trusted chesed stream for meals, rides, hospital visits, urgent help, mitzvah opportunities, and follow-up gratitude.',
    rules: ['Protect family privacy.', 'Only share confirmed needs.', 'Mark requests complete when covered.'],
    roles: [{ name: 'Chesed Desk', role: 'Admin' }, { name: 'Rachel Bloom', role: 'Moderator' }],
    posts: [
      { id: 'chesed-1', type: 'Chesed request', author: 'Chesed Desk', title: 'Two dinner slots left', body: 'Thursday and Sunday dinners still need coverage. Dairy or pareve works.', time: '35m ago', likes: 43, comments: 9, pinned: true, liked: false },
      { id: 'chesed-2', type: 'Announcement', author: 'Rachel Bloom', title: 'Ride team note', body: 'Please include pickup window, town, and whether a car seat is needed.', time: '3h ago', likes: 20, comments: 4, pinned: false, liked: false },
    ],
    events: ['Volunteer orientation - Tuesday 8:00 PM'],
    announcements: ['New meal train template added.'],
    resources: ['Meal train checklist', 'Bikur cholim guide', 'Emergency contacts'],
  },
  {
    id: 'divorced-teens-support',
    name: 'Divorced Teens',
    communityType: 'support',
    category: 'Support',
    privacy: 'Private / Anonymous',
    privacyLabel: 'Private / Anonymous',
    location: 'Private space',
    featured: false,
    joined: false,
    memberCount: 128,
    activityScore: 77,
    engagement: 'Moderator active today',
    recentActivity: 'Anonymous check-in thread active',
    supportsIncognito: true,
    supportsAnonymousPosting: true,
    hideMembershipDefault: true,
    identityTags: ['Safe space', 'Anonymous option', 'Teen support'],
    recommendationReason: 'Support spaces can be joined quietly.',
    description: 'A moderated support space for teens navigating divorce at home, with anonymous joining and posting options.',
    rules: ['No screenshots or forwarding.', 'Share from your own experience.', 'Reach out to a trusted adult in urgent situations.'],
    roles: [{ name: 'Support Moderator', role: 'Admin' }, { name: 'Teen Mentor', role: 'Moderator' }],
    posts: [
      { id: 'support-1', type: 'Check-in', author: 'Anonymous member', title: 'What helped this week?', body: 'A quiet thread to share one thing that made the week easier.', time: '47m ago', likes: 18, comments: 14, pinned: true, liked: false },
    ],
    events: ['Private moderator Q&A - Wednesday'],
    announcements: ['Membership is hidden by default.'],
    resources: ['Privacy guide', 'Trusted adult checklist', 'Crisis support contacts'],
  },
  {
    id: 'mental-health-support',
    name: 'Mental Health Support',
    communityType: 'support',
    category: 'Support',
    privacy: 'Private / Anonymous',
    privacyLabel: 'Private / Anonymous',
    location: 'Private space',
    featured: false,
    joined: false,
    memberCount: 214,
    activityScore: 83,
    engagement: '36 supportive replies this week',
    recentActivity: 'New coping-skills thread posted today',
    supportsIncognito: true,
    supportsAnonymousPosting: true,
    hideMembershipDefault: true,
    identityTags: ['Support', 'Anonymous posting', 'Moderated'],
    recommendationReason: 'Private spaces are designed for safety first.',
    description: 'A calm, moderated community for encouragement, coping strategies, and finding help without public exposure.',
    rules: ['No diagnosis threads.', 'No shaming.', 'Share resources respectfully and encourage real support.'],
    roles: [{ name: 'Wellness Moderator', role: 'Admin' }, { name: 'Community Mentor', role: 'Moderator' }],
    posts: [
      { id: 'mental-1', type: 'Check-in', author: 'Anonymous member', title: 'Sunday reset thread', body: 'What is one small thing you can do today that your future self will appreciate?', time: '1h ago', likes: 25, comments: 22, pinned: true, liked: true },
    ],
    events: ['Private wellness circle - Thursday'],
    announcements: ['Anonymous posting is available in every thread.'],
    resources: ['Support resources', 'How to ask for help', 'Privacy expectations'],
  },
  {
    id: 'school-pressure-space',
    name: 'Struggling in School',
    communityType: 'support',
    category: 'Support',
    privacy: 'Private / Anonymous',
    privacyLabel: 'Private / Anonymous',
    location: 'Private space',
    joined: false,
    memberCount: 169,
    activityScore: 71,
    engagement: 'Study buddy thread active',
    recentActivity: 'Anonymous advice thread active',
    supportsIncognito: true,
    supportsAnonymousPosting: true,
    hideMembershipDefault: true,
    identityTags: ['School', 'Support', 'Anonymous'],
    recommendationReason: 'For people who need help without feeling exposed.',
    description: 'A private place for school pressure, homework struggles, motivation, and finding support from people who understand.',
    rules: ['Do not name teachers or classmates.', 'No cheating help.', 'Ask for support early.'],
    roles: [{ name: 'School Support Mod', role: 'Admin' }],
    posts: [
      { id: 'school-1', type: 'Question', author: 'Anonymous student', title: 'How do you restart after falling behind?', body: 'Looking for real advice that does not feel overwhelming.', time: '2h ago', likes: 16, comments: 18, pinned: true, liked: false },
    ],
    events: [],
    announcements: ['Membership is never shown on profile unless you choose.'],
    resources: ['Study reset plan', 'How to ask for help', 'Tutor/gemach leads'],
  },
  {
    id: 'jewish-sports-teens',
    name: 'Teens Who Play Sports',
    communityType: 'lifestyle',
    category: 'Sports',
    privacy: 'Public',
    privacyLabel: 'Public',
    location: 'Five Towns gyms and courts',
    featured: true,
    joined: false,
    trending: true,
    memberCount: 386,
    activityScore: 89,
    engagement: '3 pickup games planned',
    recentActivity: 'Basketball run filled 6 spots today',
    identityTags: ['Sports', 'Teen life', 'Pickup games'],
    recommendationReason: 'Trending near you with strong teen activity.',
    description: 'Pickup basketball, gym runs, leagues, training partners, and chill sports talk for local Jewish teens.',
    rules: ['Post time and skill level clearly.', 'Keep games inclusive.', 'Show up if you claim a spot.'],
    roles: [{ name: 'Josh Miller', role: 'Admin' }, { name: 'Ari Stein', role: 'Moderator' }],
    posts: [
      { id: 'sports-1', type: 'Event', author: 'Josh Miller', title: 'Sunday morning basketball?', body: 'Looking for 8 more after Shacharis. Low-pressure run.', time: '29m ago', likes: 21, comments: 17, pinned: true, liked: false },
      { id: 'sports-2', type: 'Question', author: 'Ari Stein', title: 'Best indoor court this winter?', body: 'Drop courts that are actually available after school hours.', time: '3h ago', likes: 10, comments: 12, pinned: false, liked: false },
    ],
    events: ['Sunday basketball - 9:30 AM', 'Thursday pickleball ladder - 8:15 PM'],
    announcements: ['Indoor gym list updated.'],
    resources: ['Court signup sheet', 'Local gym list', 'Beginner rules'],
  },
  {
    id: 'gym-fitness',
    name: 'Gym / Fitness',
    communityType: 'lifestyle',
    category: 'Lifestyle',
    privacy: 'Public',
    privacyLabel: 'Public',
    location: 'Five Towns',
    joined: false,
    memberCount: 312,
    activityScore: 81,
    engagement: '14 check-ins today',
    recentActivity: 'Morning walk group added a route',
    identityTags: ['Fitness', 'Healthy habits', 'Accountability'],
    recommendationReason: 'Good fit for habit-building and streaks.',
    description: 'Workout accountability, walking groups, fitness tips, gym partners, and healthy Jewish routines.',
    rules: ['No body shaming.', 'No unsafe advice.', 'Encourage realistic goals.'],
    roles: [{ name: 'Naomi Adler', role: 'Admin' }],
    posts: [
      { id: 'fitness-1', type: 'Question', author: 'Naomi Adler', title: 'Who is in for a 20-minute walk streak?', body: 'Comment your town and preferred time. We can match small groups.', time: '1h ago', likes: 19, comments: 26, pinned: true, liked: false },
    ],
    events: ['Woodmere walk - Monday 7:30 AM'],
    announcements: ['Weekly accountability thread opens Sunday.'],
    resources: ['Beginner plan', 'Local gyms', 'Walking routes'],
  },
  {
    id: 'learning-gemara',
    name: 'Learning Gemara',
    communityType: 'lifestyle',
    category: 'Learning',
    privacy: 'Community-only',
    privacyLabel: 'Community-only',
    location: 'Online and local batei midrash',
    joined: false,
    memberCount: 448,
    activityScore: 85,
    engagement: '58 chavrusa posts this month',
    recentActivity: 'New chavrusa request posted',
    identityTags: ['Gemara', 'Chavrusa', 'Learning goals'],
    recommendationReason: 'Matches daily learning behavior.',
    description: 'Find chavrusas, ask learning questions, share review systems, and build a consistent Gemara rhythm.',
    rules: ['Be patient with beginners.', 'Cite the daf or sugya.', 'Keep questions respectful.'],
    roles: [{ name: 'Eli Bar', role: 'Admin' }, { name: 'Rabbi Adler', role: 'Moderator' }],
    posts: [
      { id: 'gemara-1', type: 'Question', author: 'Eli Bar', title: 'Night seder partner?', body: 'Looking for 20 minutes after 9:15 PM, three nights a week.', time: '42m ago', likes: 14, comments: 9, pinned: true, liked: true },
    ],
    events: ['Daf review - Sunday 7:45 AM'],
    announcements: ['Chavrusa matching thread refreshed weekly.'],
    resources: ['Review tracker', 'Beginner sugyos', 'Shiur links'],
  },
  {
    id: 'music-creative',
    name: 'Music / Creative',
    communityType: 'lifestyle',
    category: 'Creative',
    privacy: 'Public',
    privacyLabel: 'Public',
    location: 'Five Towns and online',
    joined: false,
    memberCount: 235,
    activityScore: 73,
    engagement: '12 projects shared this week',
    recentActivity: 'Open mic idea gaining interest',
    identityTags: ['Music', 'Art', 'Creative people'],
    recommendationReason: 'A social place for creative identity.',
    description: 'A Jewish creative space for music, writing, design, photography, video, and people making things together.',
    rules: ['Share constructive feedback.', 'Credit collaborators.', 'Keep content appropriate.'],
    roles: [{ name: 'Shira Feld', role: 'Admin' }],
    posts: [
      { id: 'creative-1', type: 'Question', author: 'Shira Feld', title: 'Would people come to a small open mic?', body: 'Thinking acoustic, chill, maybe Motzei Shabbos once a month.', time: '2h ago', likes: 28, comments: 20, pinned: true, liked: false },
    ],
    events: ['Creative jam planning - next week'],
    announcements: ['Showcase thread opens Friday.'],
    resources: ['Local studios', 'Collaboration board', 'Event ideas'],
  },
  {
    id: 'business-hustle',
    name: 'Business / Hustle',
    communityType: 'lifestyle',
    category: 'Business',
    privacy: 'Community-only',
    privacyLabel: 'Community-only',
    location: 'Five Towns and NYC',
    joined: false,
    trending: true,
    memberCount: 527,
    activityScore: 88,
    engagement: '27 intros this month',
    recentActivity: 'New internship lead posted today',
    identityTags: ['Business', 'Networking', 'Opportunities'],
    recommendationReason: 'Popular near you and high engagement.',
    description: 'A professional Jewish network for side hustles, internships, hiring, business questions, mentors, and local opportunities.',
    rules: ['No spam pitching.', 'Be clear about paid work.', 'Give before asking.'],
    roles: [{ name: 'Daniel Price', role: 'Admin' }, { name: 'Maya Rosen', role: 'Moderator' }],
    posts: [
      { id: 'business-1', type: 'Announcement', author: 'Daniel Price', title: 'Internship lead thread', body: 'Drop serious leads with field, hours, and whether it is paid.', time: '31m ago', likes: 34, comments: 23, pinned: true, liked: false },
    ],
    events: ['Coffee networking - Tuesday 8:30 PM'],
    announcements: ['Mentor intros open twice a month.'],
    resources: ['Resume review thread', 'Local business directory', 'Mentor board'],
  },
  {
    id: 'modern-orthodox-home-builders',
    name: 'Modern Orthodox Home Builders',
    communityType: 'user',
    category: 'Values',
    privacy: 'Private',
    privacyLabel: 'Private',
    location: 'Online and Five Towns',
    joined: true,
    memberCount: 302,
    activityScore: 74,
    engagement: 'Monthly roundtable active',
    recentActivity: 'New discussion on kids and screens',
    identityTags: ['Values', 'Home life', 'Parenting'],
    recommendationReason: 'This is part of your identity stack.',
    description: 'Thoughtful discussion for families trying to build committed, warm, Torah-centered homes in modern life.',
    rules: ['Assume sincerity.', 'No judging other families.', 'Practical halacha goes to your rav.'],
    roles: [{ name: 'Rabbi Adler', role: 'Admin' }, { name: 'Maya Rosen', role: 'Moderator' }, { name: 'You', role: 'Member' }],
    posts: [
      { id: 'values-1', type: 'Question', author: 'Maya Rosen', title: 'Phones at the Shabbos table?', body: 'What boundaries have actually worked in your home?', time: '55m ago', likes: 33, comments: 21, pinned: false, liked: false },
      { id: 'values-2', type: 'Learning post', author: 'Rabbi Adler', title: 'Small rituals that shape a home', body: 'A short source-based note on consistency, warmth, and shared responsibility.', time: '2h ago', likes: 48, comments: 6, pinned: true, liked: true },
    ],
    events: ['Parent values roundtable - Tuesday 8:30 PM'],
    announcements: ['Monthly topic: technology and kedusha.'],
    resources: ['Family discussion guide', 'Recommended shiurim', 'Shabbos table prompts'],
  },
  {
    id: 'young-parents-five-towns',
    name: 'Young Parents Five Towns',
    communityType: 'user',
    category: 'Parents',
    privacy: 'Public',
    privacyLabel: 'Public',
    location: 'Cedarhurst and Woodmere',
    joined: true,
    memberCount: 344,
    activityScore: 79,
    engagement: 'Park meetup thread active',
    recentActivity: 'Playdate and babysitter threads active',
    identityTags: ['Parents', 'Playdates', 'Local family life'],
    recommendationReason: 'You joined this circle.',
    description: 'Playdates, Shabbos hosting, babysitting leads, parent questions, and new family introductions.',
    rules: ['No medical advice threads.', 'Keep babysitter info respectful.', 'Use first names only for children.'],
    roles: [{ name: 'Naomi Adler', role: 'Admin' }, { name: 'You', role: 'Member' }],
    posts: [
      { id: 'parents-1', type: 'Question', author: 'Naomi Adler', title: 'Sunday park meetup?', body: 'Thinking 10:30 AM at Andrew J. Parise Park if weather holds.', time: '1h ago', likes: 23, comments: 16, pinned: false, liked: false },
    ],
    events: ['Park meetup - Sunday 10:30 AM', 'New families meal train - next month'],
    announcements: ['Winter indoor play list updated.'],
    resources: ['Babysitter leads', 'Park list', 'Parent resource doc'],
  },
];

const communityExperience = {
  'daily-torah': {
    dailyPrompt: 'What is one line of Torah you want to carry into today?',
    quickActions: ['Share a 3-minute thought', 'Ask for a source', 'Find a chavrusa', 'Post a daily win'],
    extraPosts: [
      { id: 'torah-3', type: 'Prompt', author: 'Daily Torah', title: 'One line, one action', body: 'Reply with one idea from today and one tiny action you can do because of it.', time: 'Today', likes: 39, comments: 27, pinned: false, liked: false },
      { id: 'torah-4', type: 'Match', author: 'Chavrusa Bot', title: '10-minute learning partners', body: 'Comment morning, lunch, or night and the topic you want. We will match people with similar schedules.', time: 'Yesterday', likes: 31, comments: 42, pinned: false, liked: false },
    ],
  },
  'jewish-updates-news': {
    dailyPrompt: 'What verified local update should be in the next Five Towns brief?',
    quickActions: ['Submit verified update', 'Ask what changed', 'Save to daily brief', 'Report rumor'],
    extraPosts: [
      { id: 'news-3', type: 'Prompt', author: 'JUnited Updates', title: 'Build tomorrow morning brief', body: 'Drop school reminders, road closures, shul updates, or community events with a source or clear details.', time: 'Today', likes: 44, comments: 36, pinned: false, liked: false },
      { id: 'news-4', type: 'Announcement', author: 'JUnited Updates', title: 'Rumor check thread', body: 'If something is spreading in chats and you are unsure, post the claim here for moderator review.', time: 'Yesterday', likes: 29, comments: 18, pinned: false, liked: false },
    ],
  },
  'five-towns-local': {
    dailyPrompt: 'What does someone in the Five Towns need to know today?',
    quickActions: ['Ask a local question', 'Post lost & found', 'Share an event', 'Recommend a place'],
    extraPosts: [
      { id: 'local-3', type: 'Prompt', author: 'Five Towns Desk', title: 'Today’s local exchange', body: 'One thread for errands, restaurant questions, traffic notes, store hours, and quick neighbor help.', time: 'Today', likes: 58, comments: 64, pinned: false, liked: false },
      { id: 'local-4', type: 'Question', author: 'Yoni Green', title: 'Which shops should be added to the map next?', body: 'Drop Jewish businesses, Judaica shops, bakeries, wellness, and services with town and category.', time: 'Yesterday', likes: 33, comments: 45, pinned: false, liked: false },
    ],
  },
  'chesed-mitzvah-updates': {
    dailyPrompt: 'Can you cover one mitzvah need today, even something small?',
    quickActions: ['Offer a ride', 'Cover a meal', 'Post a need', 'Log a mitzvah'],
    extraPosts: [
      { id: 'chesed-3', type: 'Prompt', author: 'Chesed Desk', title: 'Two-mitzvah challenge', body: 'Pick one private mitzvah and one community mitzvah. Reply when done with how it affected you.', time: 'Today', likes: 51, comments: 22, pinned: false, liked: false },
      { id: 'chesed-4', type: 'Match', author: 'Ride Team', title: 'After-school ride matching', body: 'Comment town, pickup window, and whether you can offer or need a seat. No addresses in public replies.', time: 'Yesterday', likes: 21, comments: 19, pinned: false, liked: false },
    ],
  },
  'divorced-teens-support': {
    dailyPrompt: 'What is one thing you wish people understood without you having to explain it?',
    quickActions: ['Post anonymously', 'Ask for advice', 'Quiet check-in', 'Message moderator'],
    extraPosts: [
      { id: 'support-2', type: 'Prompt', author: 'Anonymous moderator', title: 'No-pressure check-in', body: 'Use one word for how home feels this week. You can say more only if you want.', time: 'Today', likes: 24, comments: 17, pinned: false, liked: false },
      { id: 'support-3', type: 'Question', author: 'Anonymous member', title: 'How do you handle split weekends?', body: 'Looking for practical advice on not feeling guilty or pulled in both directions.', time: 'Yesterday', likes: 19, comments: 13, pinned: false, liked: false },
    ],
  },
  'mental-health-support': {
    dailyPrompt: 'What is one small next step that feels doable, not perfect?',
    quickActions: ['Anonymous check-in', 'Share coping idea', 'Ask for support', 'Save resource'],
    extraPosts: [
      { id: 'mental-2', type: 'Prompt', author: 'Wellness Moderator', title: 'Tiny next step thread', body: 'Name one small action for today: text someone, take a walk, drink water, breathe, ask for help.', time: 'Today', likes: 41, comments: 29, pinned: false, liked: false },
      { id: 'mental-3', type: 'Resource', author: 'Community Mentor', title: 'What to say when you need help', body: 'A few scripts people can use when they do not know how to start the conversation.', time: 'Yesterday', likes: 35, comments: 11, pinned: false, liked: false },
    ],
  },
  'school-pressure-space': {
    dailyPrompt: 'What is the smallest assignment, email, or step you can finish today?',
    quickActions: ['Ask study help', 'Find tutor lead', 'Post anonymous question', 'Start reset plan'],
    extraPosts: [
      { id: 'school-2', type: 'Prompt', author: 'School Support Mod', title: 'Back-on-track sprint', body: 'Post one task you can finish in 20 minutes. Come back and reply done.', time: 'Today', likes: 22, comments: 25, pinned: false, liked: false },
      { id: 'school-3', type: 'Question', author: 'Anonymous student', title: 'How do I email a teacher after missing work?', body: 'Can someone help write a respectful message that does not sound like an excuse?', time: 'Yesterday', likes: 18, comments: 20, pinned: false, liked: false },
    ],
  },
  'jewish-sports-teens': {
    dailyPrompt: 'Who is playing this week, where, and what skill level?',
    quickActions: ['Plan pickup game', 'Find gym partner', 'Reserve spot', 'Post score recap'],
    extraPosts: [
      { id: 'sports-3', type: 'Plan', author: 'Ari Stein', title: 'Motzei Shabbos pickup board', body: 'Comment basketball, pickleball, or soccer plus time. We will split by skill level if enough people join.', time: 'Today', likes: 27, comments: 32, pinned: false, liked: false },
      { id: 'sports-4', type: 'Question', author: 'Dovid L.', title: 'Any beginners want a low-pressure run?', body: 'Not trying to get cooked by varsity guys. Looking for people who just want to play.', time: 'Yesterday', likes: 24, comments: 21, pinned: false, liked: false },
    ],
  },
  'gym-fitness': {
    dailyPrompt: 'What movement can you actually commit to today?',
    quickActions: ['Join walk streak', 'Find workout buddy', 'Log habit', 'Share route'],
    extraPosts: [
      { id: 'fitness-2', type: 'Prompt', author: 'Naomi Adler', title: 'Sunday accountability board', body: 'Post your realistic goal for the week. Keep it small enough that you can really do it.', time: 'Today', likes: 33, comments: 39, pinned: false, liked: false },
      { id: 'fitness-3', type: 'Plan', author: 'Ben Torah', title: 'Early morning walking group', body: 'Cedarhurst route, 25 minutes, no pressure pace. Who wants in twice a week?', time: 'Yesterday', likes: 18, comments: 15, pinned: false, liked: false },
    ],
  },
  'learning-gemara': {
    dailyPrompt: 'What sugya, daf, or learning block are you trying to stay consistent with?',
    quickActions: ['Find chavrusa', 'Ask a sugya question', 'Share review tip', 'Join night seder'],
    extraPosts: [
      { id: 'gemara-2', type: 'Match', author: 'Chavrusa Board', title: 'This week’s chavrusa matching', body: 'Reply with topic, level, and time window. Beginners welcome, consistency matters more than speed.', time: 'Today', likes: 37, comments: 33, pinned: false, liked: false },
      { id: 'gemara-3', type: 'Question', author: 'Moshe Klein', title: 'How do you review without falling behind?', body: 'Looking for a system that works when you only have a few nights a week.', time: 'Yesterday', likes: 16, comments: 12, pinned: false, liked: false },
    ],
  },
  'music-creative': {
    dailyPrompt: 'What are you making, practicing, writing, filming, or dreaming up?',
    quickActions: ['Share project', 'Find collaborator', 'Ask feedback', 'Plan meetup'],
    extraPosts: [
      { id: 'creative-2', type: 'Prompt', author: 'Creative Board', title: 'Share one unfinished thing', body: 'Post a rough idea, lyric, photo, beat, design, or concept. Feedback should be kind and useful.', time: 'Today', likes: 31, comments: 26, pinned: false, liked: false },
      { id: 'creative-3', type: 'Match', author: 'Shira Feld', title: 'Who wants to collaborate?', body: 'Musicians, editors, photographers, designers, writers: drop what you do and what you want to build.', time: 'Yesterday', likes: 22, comments: 28, pinned: false, liked: false },
    ],
  },
  'business-hustle': {
    dailyPrompt: 'What intro, lead, advice, or opportunity would help you move this week?',
    quickActions: ['Post opportunity', 'Ask mentor advice', 'Offer intro', 'Review resume'],
    extraPosts: [
      { id: 'business-2', type: 'Prompt', author: 'Daniel Price', title: 'Give one, ask one', body: 'Offer one helpful intro, tip, lead, or resource. Then ask for one thing you need.', time: 'Today', likes: 42, comments: 35, pinned: false, liked: false },
      { id: 'business-3', type: 'Question', author: 'Maya Rosen', title: 'Teen-friendly summer jobs?', body: 'Looking for real leads that are appropriate, local, and clear about hours/pay.', time: 'Yesterday', likes: 26, comments: 24, pinned: false, liked: false },
    ],
  },
  'modern-orthodox-home-builders': {
    dailyPrompt: 'What small ritual makes your home feel more grounded Jewishly?',
    quickActions: ['Ask values question', 'Share table prompt', 'Save source', 'Plan discussion'],
    extraPosts: [
      { id: 'values-3', type: 'Prompt', author: 'Rabbi Adler', title: 'One practice that actually works', body: 'Share a home practice that is simple, repeatable, and makes the week feel more intentional.', time: 'Today', likes: 40, comments: 18, pinned: false, liked: false },
      { id: 'values-4', type: 'Question', author: 'Maya Rosen', title: 'How do you talk about phone limits without a fight?', body: 'Looking for language that keeps dignity and still sets real boundaries.', time: 'Yesterday', likes: 29, comments: 20, pinned: false, liked: false },
    ],
  },
  'young-parents-five-towns': {
    dailyPrompt: 'What practical parent question would save another family time today?',
    quickActions: ['Ask parent question', 'Plan playdate', 'Share babysitter lead', 'Post carpool'],
    extraPosts: [
      { id: 'parents-2', type: 'Prompt', author: 'Naomi Adler', title: 'Parent practical thread', body: 'Babysitters, rainy day ideas, carpools, Shabbos plans, school supplies, picky eaters: ask here.', time: 'Today', likes: 30, comments: 41, pinned: false, liked: false },
      { id: 'parents-3', type: 'Plan', author: 'Leah Weiss', title: 'After-school carpool matching', body: 'Comment town, school area, days, and whether you need or can offer a seat. No exact addresses.', time: 'Yesterday', likes: 18, comments: 23, pinned: false, liked: false },
    ],
  },
};

const smartCommunities = initialCommunities.map((community) => {
  const experience = communityExperience[community.id] || {};
  return {
    ...community,
    dailyPrompt: experience.dailyPrompt || `What should people in ${community.name} talk about today?`,
    quickActions: experience.quickActions || ['Start discussion', 'Ask question', 'Plan meetup', 'Share resource'],
    posts: [...(community.posts || []), ...(experience.extraPosts || [])],
  };
});

function buildCommunity(data) {
  const timestamp = Date.now();
  return {
    ...data,
    id: `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${timestamp}`,
    communityType: data.communityType || 'user',
    privacyLabel: data.privacy,
    featured: false,
    joined: true,
    verified: false,
    trending: false,
    memberCount: 1,
    activityScore: 12,
    engagement: 'New community',
    recentActivity: 'Created just now',
    dailyPrompt: 'What should new members introduce, ask, or plan first?',
    quickActions: ['Start welcome thread', 'Ask a question', 'Plan first meetup', 'Add resource'],
    identityTags: data.identityTags || [data.category, data.privacy, 'New circle'],
    recommendationReason: 'You created this community.',
    roles: [{ name: 'You', role: 'Admin' }],
    posts: [
      {
        id: `post-${timestamp}`,
        type: 'Announcement',
        author: 'You',
        title: 'Welcome to the community',
        body: 'This space is ready for a focused feed, introductions, resources, events, and real discussion.',
        time: 'Just now',
        likes: 0,
        comments: 0,
        pinned: true,
        liked: false,
      },
    ],
    events: [],
    announcements: ['Community created. Add your first real announcement when ready.'],
    resources: ['Community guidelines', 'Admin checklist', 'Member welcome post'],
  };
}

export default function Communities() {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState(smartCommunities);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedCommunityId, setSelectedCommunityId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const selectedCommunity = useMemo(
    () => communities.find((community) => community.id === selectedCommunityId),
    [communities, selectedCommunityId]
  );

  const filteredCommunities = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    return communities.filter((community) => {
      const haystack = [
        community.name,
        community.description,
        community.location,
        community.category,
        community.communityType,
        ...(community.identityTags || []),
      ].join(' ').toLowerCase();
      const matchesQuery = !cleanQuery || haystack.includes(cleanQuery);
      const matchesCategory = category === 'All' || community.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [category, communities, query]);

  const officialCommunities = filteredCommunities.filter((community) => community.communityType === 'official');
  const supportCommunities = filteredCommunities.filter((community) => community.communityType === 'support');
  const lifestyleCommunities = filteredCommunities.filter((community) => community.communityType === 'lifestyle');
  const yourCommunities = filteredCommunities.filter((community) => community.joined);
  const popularNearYou = filteredCommunities
    .filter((community) => !community.joined && community.activityScore >= 80)
    .sort((a, b) => b.activityScore - a.activityScore);
  const forYou = filteredCommunities
    .filter((community) => community.featured || community.trending || community.joined)
    .sort((a, b) => Number(b.joined) - Number(a.joined) || b.activityScore - a.activityScore)
    .slice(0, 6);

  const joinedCount = communities.filter((community) => community.joined).length;
  const hiddenCount = communities.filter((community) => community.joined && community.hideMembership).length;
  const totalMembers = communities.reduce((sum, community) => sum + community.memberCount, 0);
  const activeThreads = communities.reduce((sum, community) => sum + community.posts.length, 0);

  const toggleJoin = (communityId, options = {}) => {
    setCommunities((current) =>
      current.map((community) => {
        if (community.id !== communityId) return community;
        const joined = !community.joined;
        const shouldHideMembership = joined
          ? Boolean(options.incognito || community.hideMembershipDefault)
          : false;
        return {
          ...community,
          joined,
          hideMembership: shouldHideMembership,
          joinedIncognito: joined ? Boolean(options.incognito) : false,
          memberCount: Math.max(0, community.memberCount + (joined ? 1 : -1)),
          recentActivity: joined
            ? shouldHideMembership ? 'You joined privately just now' : 'You joined just now'
            : 'You left this community',
        };
      })
    );
  };

  const updatePrivacy = (communityId, patch) => {
    setCommunities((current) =>
      current.map((community) => (
        community.id === communityId ? { ...community, ...patch } : community
      ))
    );
  };

  const toggleLikePost = (communityId, postId) => {
    setCommunities((current) =>
      current.map((community) => {
        if (community.id !== communityId) return community;
        return {
          ...community,
          posts: community.posts.map((post) => {
            if (post.id !== postId) return post;
            return {
              ...post,
              liked: !post.liked,
              likes: Math.max(0, post.likes + (post.liked ? -1 : 1)),
            };
          }),
        };
      })
    );
  };

  const createCommunity = (community) => {
    const newCommunity = buildCommunity(community);
    setCommunities((current) => [newCommunity, ...current]);
    setSelectedCommunityId(newCommunity.id);
    setShowCreate(false);
  };

  if (selectedCommunity) {
    return (
      <CommunityHubDetail
        community={selectedCommunity}
        onBack={() => setSelectedCommunityId(null)}
        onToggleJoin={(options) => toggleJoin(selectedCommunity.id, options)}
        onToggleLike={(postId) => toggleLikePost(selectedCommunity.id, postId)}
        onUpdatePrivacy={(patch) => updatePrivacy(selectedCommunity.id, patch)}
      />
    );
  }

  return (
    <main className="app-page mobile-safe-bottom">
      <section className="mobile-page-wide px-3 pt-3 sm:px-4 sm:pt-4">
        <div className="app-card mb-4 overflow-hidden">
          <div className="grid gap-0 lg:grid-cols-[1fr_340px]">
            <div className="relative overflow-hidden p-4 sm:p-6">
              <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-[56px] bg-blue-50" />
              <button
                onClick={() => navigate('/Messages')}
                className="motion-press absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
                aria-label="Messages"
              >
                <MessageCircle className="h-[18px] w-[18px]" strokeWidth={1.8} />
              </button>
              <div className="relative">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-blue-700">
                  <Compass className="h-3.5 w-3.5" />
                  Identity network
                </div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-2xl font-black tracking-normal text-slate-950 sm:text-3xl">Communities</h1>
                  <PageHelp text="Communities are identity spaces: official hubs, private support circles, lifestyle groups, and member-created networks." />
                </div>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
                  Find your people, follow the daily Jewish pulse, join support spaces privately, and build the circles that make JUnited feel like home.
                </p>
              </div>

              <div className="relative mt-4 flex flex-wrap gap-2">
                <PulsePill icon={ShieldCheck} label={`${joinedCount} active in your identity stack`} />
                <PulsePill icon={MessageCircle} label={`${activeThreads} live threads`} />
                <PulsePill icon={Lock} label={`${hiddenCount} hidden from profile`} />
              </div>
            </div>

            <div className="border-t border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 lg:border-l lg:border-t-0">
              <div className="grid grid-cols-2 gap-2">
                <MetricCard label="Members" value={totalMembers.toLocaleString()} tone="blue" />
                <MetricCard label="Official hubs" value={communities.filter((c) => c.communityType === 'official').length} tone="emerald" />
                <MetricCard label="Private spaces" value={communities.filter((c) => c.communityType === 'support').length} tone="violet" />
                <MetricCard label="Lifestyle circles" value={communities.filter((c) => c.communityType === 'lifestyle').length} tone="amber" />
              </div>
              <button onClick={() => setShowCreate(true)} className="app-button-primary mt-3 h-11 w-full">
                <Plus className="h-4 w-4" />
                Create Community
              </button>
            </div>
          </div>
        </div>

        <IdentityStrip communities={communities} />

        <div className="app-card mb-5 p-3">
          <div className="flex flex-col gap-3">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search identity, topic, privacy, or neighborhood"
                className="app-input pl-10 pr-3 text-sm"
              />
            </label>
            <div className="mobile-scroll-x flex items-center gap-2 pb-1">
              {categories.map((item) => (
                <button
                  key={item}
                  onClick={() => setCategory(item)}
                  className={`motion-press h-10 shrink-0 rounded-xl border px-3 text-sm font-semibold transition ${
                    category === item
                      ? 'border-slate-950 bg-slate-950 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {item}
                  {item !== 'All' && (
                    <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] ${category === item ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {communities.filter((community) => community.category === item).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredCommunities.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <Users className="mx-auto mb-3 h-8 w-8 text-slate-400" />
            <h2 className="text-lg font-bold text-slate-900">No communities found</h2>
            <p className="mt-1 text-sm text-slate-500">Try another search, switch categories, or create a new identity circle.</p>
          </div>
        ) : (
          <div className="motion-stagger space-y-7">
            {forYou.length > 0 && (
              <CommunitySection
                title="For You"
                subtitle="Recommended from your local activity, joined circles, and high-signal hubs."
                communities={forYou}
                onOpen={setSelectedCommunityId}
                onToggleJoin={toggleJoin}
                featured
              />
            )}

            {officialCommunities.length > 0 && (
              <CommunitySection
                title="Official / Daily"
                subtitle="Trusted platform-owned hubs that should feel alive every day."
                communities={officialCommunities}
                onOpen={setSelectedCommunityId}
                onToggleJoin={toggleJoin}
              />
            )}

            {popularNearYou.length > 0 && (
              <CommunitySection
                title="Popular Near You"
                subtitle="High-activity Five Towns circles people are joining now."
                communities={popularNearYou}
                onOpen={setSelectedCommunityId}
                onToggleJoin={toggleJoin}
              />
            )}

            {supportCommunities.length > 0 && (
              <CommunitySection
                title="Private / Support Spaces"
                subtitle="Sensitive communities with incognito join, hidden membership, and anonymous posting options."
                communities={supportCommunities}
                onOpen={setSelectedCommunityId}
                onToggleJoin={toggleJoin}
                privacyFirst
              />
            )}

            {lifestyleCommunities.length > 0 && (
              <CommunitySection
                title="Lifestyle & Interests"
                subtitle="The social layer: hobbies, goals, creativity, learning, business, and real-world meetups."
                communities={lifestyleCommunities}
                onOpen={setSelectedCommunityId}
                onToggleJoin={toggleJoin}
              />
            )}

            {yourCommunities.length > 0 && (
              <CommunitySection
                title="Your Communities"
                subtitle="Your profile identity stack: what you are active in and what represents you."
                communities={yourCommunities}
                onOpen={setSelectedCommunityId}
                onToggleJoin={toggleJoin}
              />
            )}
          </div>
        )}
      </section>

      {showCreate && (
        <CreateCommunityForm
          categories={categories.filter((item) => !['All', 'Official', 'Support'].includes(item))}
          communityTypes={communityTypes}
          onCreate={createCommunity}
          onClose={() => setShowCreate(false)}
        />
      )}
    </main>
  );
}

function IdentityStrip({ communities }) {
  const visibleTags = communities
    .filter((community) => community.joined && !community.hideMembership)
    .flatMap((community) => community.identityTags?.slice(0, 2) || [community.category])
    .slice(0, 8);

  return (
    <section className="app-card mb-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-slate-950">Active in...</h2>
          <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">
            These tags can become profile badges so people understand your Jewish life, interests, and local circles.
          </p>
        </div>
        <span className="hidden rounded-full bg-slate-950 px-3 py-1 text-[11px] font-black text-white sm:inline-flex">
          Profile tags
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {visibleTags.map((tag, index) => (
          <span key={`${tag}-${index}`} className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
            {tag}
          </span>
        ))}
        <span className="rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700">
          Private spaces stay hidden
        </span>
      </div>
    </section>
  );
}

function CommunitySection({ title, subtitle, communities, onOpen, onToggleJoin, featured = false, privacyFirst = false }) {
  const Icon = privacyFirst ? EyeOff : title === 'Popular Near You' ? TrendingUp : Compass;
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-950">
            <Icon className="h-5 w-5 text-blue-600" />
            {title}
          </h2>
          <p className="text-sm leading-6 text-slate-500">{subtitle}</p>
        </div>
        <div className="hidden items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-500 ring-1 ring-slate-200 sm:flex">
          <Compass className="h-3.5 w-3.5" />
          {communities.length}
        </div>
      </div>

      <div className="motion-stagger grid gap-3 sm:grid-cols-2">
        {communities.map((community) => (
          <CommunityHubCard
            key={community.id}
            community={community}
            featured={featured || community.featured}
            onOpen={() => onOpen(community.id)}
            onToggleJoin={(options) => onToggleJoin(community.id, options)}
          />
        ))}
      </div>
    </section>
  );
}

function PulsePill({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800 shadow-sm">
      <Icon className="h-3.5 w-3.5 text-blue-600" />
      {label}
    </span>
  );
}

function MetricCard({ label, value, tone }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    violet: 'bg-violet-50 text-violet-700',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <p className={`inline-flex rounded-full px-2 py-1 text-[11px] font-black ${tones[tone]}`}>{label}</p>
      <p className="mt-2 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}
