import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CalendarDays,
  HeartHandshake,
  Loader2,
  MapPinned,
  MessageCircle,
  Plus,
  Search,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { dataService, incrementCounter } from '@/services';
import { storageService } from '@/services/storageService';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { appParams } from '@/lib/app-params';
import CommunityHubCard from '@/components/communities/CommunityHubCard';
import DiscoverCommunityCard from '@/components/communities/DiscoverCommunityCard';
import CommunityDetailView from '@/components/communities/CommunityDetailView';
import CommunityAdminCenter from '@/components/communities/CommunityAdminCenter';
import CreateCommunityModal from '@/components/communities/CreateCommunityModal';
import MessagesDrawer from '@/components/communities/MessagesDrawer';
import DestinationHeader from '@/components/layout/DestinationHeader';
import { COMMUNITY_TYPE_CONFIG, COMMUNITY_TYPE_OPTIONS, getCommunityTypeConfig, getCommunityTypeKey } from '@/lib/communityTypes';

const COMMUNITY_FILTERS = [{ key: 'all', label: 'All' }, ...COMMUNITY_TYPE_OPTIONS.map(({ key, label }) => ({ key, label }))];
const MANAGEMENT_ROLES = new Set(['owner', 'admin', 'moderator']);

// Ordered by community prevalence in the Five Towns context
const DISCOVER_SECTION_ORDER = ['neighborhood', 'shul', 'chesed', 'learning', 'events', 'parents', 'marketplace', 'general'];
const DISCOVER_SECTION_SUBTITLES = {
  neighborhood: 'Local updates, neighbor questions, and what\'s happening near you.',
  shul: 'Your shul\'s events, announcements, and community shiurim in one place.',
  chesed: 'Open needs, volunteer opportunities, and concrete mitzvah acts.',
  learning: 'Torah discussions, shiurim, chavrusa connections, and study resources.',
  events: 'Upcoming events, social plans, and community gatherings.',
  parents: 'School questions, camp talk, recommendations, and parenting support.',
  marketplace: 'Buy, sell, and share within the community marketplace.',
  general: 'Community spaces open to everyone.',
};

const EXPERIENCE_SEEDS = [
  {
    id: 'seed-daily-torah',
    name: 'Daily Torah',
    category: 'Official',
    communityType: 'official',
    privacy: 'Public',
    location: 'JUnited Daily',
    verified: true,
    trending: true,
    follower_count: 1820,
    postsToday: 12,
    activeNow: 38,
    friendsInCommunity: 7,
    valueHook: 'Start your day with verified, source-backed Torah people can actually discuss.',
    growth: '+84 this week',
    engagement: '312 learned today',
    identityTags: ['Torah every day', 'Parsha', 'Short shiurim'],
    recommendationReason: 'Matches your learning and reflection activity.',
    description: 'A trusted daily Torah hub with short sourced posts, parsha prompts, chavrusa energy, and discussion that fits real life.',
    dailyPrompt: 'What is one sourced Torah line you want to carry into today?',
    quickActions: ['Share a sourced thought', 'Ask for the source', 'Find a chavrusa'],
    announcements: ['Three source-backed Torah drops are scheduled daily.', 'Friday noon parsha posts are pulled from the weekly parsha calendar.', 'Official posts show a source link so people can verify.'],
    resources: ['Sefaria source links', 'Friday parsha prompts', '10-minute learning streak'],
    updates: ['Morning source-backed Torah drop', 'Afternoon reflection prompt', 'Friday parsha table questions'],
    posts: [
      { id: 'torah-1', type: 'announcement', title: 'Verified Torah posts are loading', author: 'JUnited Torah Desk', source_name: 'Sefaria', source_ref: 'Pirkei Avot 1:2', source_url: 'https://www.sefaria.org/Pirkei_Avot.1.2', is_official: true, body: 'Daily Torah is wired for source-backed posts from Sefaria. Pirkei Avot 1:2 teaches that the world stands on Torah, avodah, and acts of chesed.\n\nReflect: Which one of those three can you strengthen today?', meta: 'Official · source-backed' },
      { id: 'torah-2', type: 'announcement', title: 'Friday parsha posts', author: 'JUnited Torah Desk', source_name: 'Hebcal', source_ref: 'Weekly parsha calendar', source_url: 'https://www.hebcal.com/home/developer-apis', is_official: true, body: 'Every Friday at noon, the app is set up to publish parsha-based prompts from the verified weekly parsha calendar.\n\nQuestion: What is one parsha idea that belongs at your Shabbos table?', meta: 'Official · Friday noon' },
      { id: 'torah-3', type: 'question', title: 'Ask for the source', author: 'JUnited Torah Desk', source_name: 'Sefaria', source_ref: 'Daily verified source links', source_url: 'https://www.sefaria.org', is_official: true, body: 'If a Torah post hits you, open the source and add one sentence in your own words. This keeps the community real, not copied-and-pasted inspiration.', meta: 'Official · discussion' },
    ],
  },
  {
    id: 'seed-jewish-news',
    name: 'Jewish News / Updates',
    category: 'Official',
    communityType: 'official',
    privacy: 'Public',
    location: 'Local + Jewish world',
    verified: true,
    trending: true,
    follower_count: 2415,
    postsToday: 18,
    activeNow: 52,
    friendsInCommunity: 9,
    valueHook: 'Know what matters today without digging through noisy chats.',
    growth: '+126 this week',
    engagement: 'Fresh brief every day',
    identityTags: ['Verified updates', 'Local brief', 'Useful news'],
    recommendationReason: 'Official context for what matters today.',
    description: 'Moderated Jewish updates, local alerts, event notes, and high-signal information without chat-thread chaos.',
    dailyPrompt: 'What verified local update should be in tomorrow’s brief?',
    quickActions: ['Submit verified update', 'Ask what changed', 'Save for later'],
    announcements: ['Morning and evening briefs stay pinned.', 'Local alerts are reviewed before boost.', 'Rumor-check threads keep noise down.'],
    resources: ['Submit a verified update', 'Public alert checklist', 'Event digest archive'],
    updates: ['Morning brief refreshed', 'Two local event notices added', 'Rumor review queue cleared'],
    posts: [
      { id: 'news-1', type: 'Pinned', title: 'Five Towns morning brief', author: 'JUnited Updates', body: 'Traffic, school reminders, local events, and useful neighborhood notes in one place.', meta: '14m ago · 12 replies' },
      { id: 'news-2', type: 'Prompt', title: 'Build tomorrow’s brief', author: 'JUnited Updates', body: 'Drop verified notices, deadlines, closures, and public community updates.', meta: '2h ago · 16 replies' },
      { id: 'news-3', type: 'Update', title: 'What changed since yesterday?', author: 'JUnited Updates', body: 'A clean delta of notable school, shul, traffic, and community changes.', meta: 'Today · 8 replies' },
      { id: 'news-4', type: 'Review', title: 'Rumor check thread', author: 'Moderator Desk', body: 'If something is circulating in chats and you are unsure, post the claim here for review.', meta: 'Today · 14 replies' },
      { id: 'news-5', type: 'Evening brief', title: 'What mattered today in one scroll', author: 'JUnited Updates', body: 'The 5 items worth knowing tonight, with links, context, and what affects local Jewish families.', meta: 'Today · 11 replies' },
      { id: 'news-6', type: 'Community ask', title: 'What should we track more closely this week?', author: 'Updates Desk', body: 'School notices, traffic, politics that affect the community, shul calendars, or local business changes?', meta: 'Today · 23 replies' },
      { id: 'news-7', type: 'Explainer', title: 'Why this update matters', author: 'JUnited Updates', body: 'A short explainer thread for news that deserves context, not just reposting.', meta: 'Yesterday · 17 replies' },
      { id: 'news-8', type: 'Poll', title: 'Morning brief or evening wrap first?', author: 'JUnited Updates', body: 'Vote on what would make this community part of your daily routine.', meta: 'Yesterday · 39 votes' },
    ],
  },
  {
    id: 'seed-five-towns-local',
    name: 'Five Towns Local',
    category: 'Local',
    communityType: 'official',
    privacy: 'Public',
    location: 'Lawrence, Cedarhurst, Woodmere, Hewlett, Inwood',
    verified: true,
    trending: true,
    follower_count: 3180,
    postsToday: 27,
    activeNow: 89,
    friendsInCommunity: 14,
    valueHook: 'See what is happening tonight, what changed today, and what locals are asking.',
    growth: '+208 this week',
    engagement: '89 local replies today',
    identityTags: ['Five Towns', 'Neighbors', 'Local life'],
    recommendationReason: 'Your real-world Jewish hub.',
    description: 'The daily digital town square for local questions, store updates, carpools, lost and found, events, and practical help.',
    dailyPrompt: 'What does someone in the Five Towns need to know today?',
    quickActions: ['Ask local question', 'Post lost & found', 'Share an event'],
    announcements: ['Town pulse updates refresh throughout the day.', 'Map recommendations now cross-link from local threads.', 'Urgent posts can be escalated to official updates.'],
    resources: ['Five Towns map', 'Lost & found desk', 'Local event board'],
    updates: ['Two carpools matched', 'One lost item returned', 'Restaurant map suggestions received'],
    posts: [
      { id: 'local-1', type: 'Pinned', title: 'Today around town', author: 'Five Towns Desk', body: 'Central Ave traffic note, event roundup, and reminders from the local map.', meta: '22m ago · 28 replies' },
      { id: 'local-2', type: 'Hot discussion', title: 'Which shops should go on the map next?', author: 'Miriam Cohen', body: 'Drop restaurants, services, Judaica, bakeries, or wellness spots that matter locally.', meta: '1h ago · 24 replies' },
      { id: 'local-3', type: 'Question', title: 'Best quick weekday lunch near Woodmere?', author: 'Community member', body: 'Need something reliable, sit-down optional, good for a short break.', meta: 'Today · 19 replies' },
      { id: 'local-4', type: 'Community pulse', title: 'Weekend plans board', author: 'Five Towns Desk', body: 'Events, shiurim, sports, helping opportunities, and family ideas in one thread.', meta: 'Today · 21 replies' },
      { id: 'local-5', type: 'Interactive board', title: 'Ask the Five Towns anything practical', author: 'Five Towns Desk', body: 'Parking, stores, shuls, classes, carpool, programs, errands. One thread for useful local answers.', meta: 'Today · 46 replies' },
      { id: 'local-6', type: 'Hot list', title: 'Most recommended places this week', author: 'Local Pulse', body: 'Restaurants, bakeries, Judaica, services, and quiet gems people keep recommending.', meta: 'Today · 28 replies' },
      { id: 'local-7', type: 'Plan', title: 'Sunday family idea swap', author: 'Five Towns Desk', body: 'Share one low-friction idea for kids, teens, or visiting relatives.', meta: 'Yesterday · 31 replies' },
      { id: 'local-8', type: 'Question', title: 'What does this app still need to replace local WhatsApp chaos?', author: 'Community member', body: 'Events? verified updates? school notices? lost and found? Better search?', meta: 'Yesterday · 37 replies' },
    ],
  },
  {
    id: 'seed-chesed-updates',
    name: 'Chesed / Mitzvah Updates',
    category: 'Support',
    communityType: 'official',
    privacy: 'Community-only',
    location: 'Five Towns',
    verified: true,
    follower_count: 1368,
    postsToday: 15,
    activeNow: 31,
    friendsInCommunity: 6,
    valueHook: 'Find a mitzvah you can actually complete today.',
    growth: '+63 this week',
    engagement: '17 mitzvahs covered',
    identityTags: ['Chesed', 'Mitzvahs', 'Volunteer'],
    recommendationReason: 'Connects directly to Mitzvah Circle.',
    description: 'Meals, rides, bikur cholim, urgent errands, mitzvah opportunities, and follow-through gratitude.',
    dailyPrompt: 'Can you cover one mitzvah need today, even something small?',
    quickActions: ['Offer a ride', 'Cover a meal', 'Post a mitzvah need'],
    announcements: ['Completed needs should be marked closed.', 'Reflections from mitzvah tracking can be shared here.', 'Urgent needs are reviewed before amplification.'],
    resources: ['Meal train checklist', 'Ride matching guide', 'Bikur cholim starter pack'],
    updates: ['Meal train almost covered', 'Ride team needs two more volunteers', 'Reflection thread open'],
    posts: [
      { id: 'chesed-1', type: 'Pinned', title: 'Two dinner slots left', author: 'Chesed Desk', body: 'Thursday and Sunday dinners still need coverage. Dairy or pareve works.', meta: '35m ago · 9 replies' },
      { id: 'chesed-2', type: 'Prompt', title: 'Two-mitzvah challenge', author: 'Chesed Desk', body: 'Pick one private mitzvah and one community mitzvah. Share how it affected you.', meta: 'Today · 22 replies' },
      { id: 'chesed-3', type: 'Match', title: 'After-school ride matching', author: 'Ride Team', body: 'Comment town, pickup window, and whether you can offer or need a seat. No exact addresses here.', meta: 'Today · 17 replies' },
      { id: 'chesed-4', type: 'Reflection', title: 'How did helping someone affect you?', author: 'Mitzvah Tracker', body: 'Short reflections from real mitzvah actions help inspire the next person.', meta: 'Today · 13 replies' },
      { id: 'chesed-5', type: 'Urgent board', title: 'Small favors that matter today', author: 'Chesed Desk', body: 'Pickups, pharmacy runs, meal handoffs, short visits, and quick check-ins. Take one if you can.', meta: 'Today · 26 replies' },
      { id: 'chesed-6', type: 'Volunteer pulse', title: 'Where can you reliably help once a week?', author: 'Volunteer Desk', body: 'Meals, rides, phone calls, errands, hospital visits, or school support?', meta: 'Today · 19 replies' },
      { id: 'chesed-7', type: 'Impact story', title: 'A ride offer became a whole support chain', author: 'Chesed Desk', body: 'A short story on why tiny offers belong in the app, followed by an invite to post one small thing you can do.', meta: 'Yesterday · 24 replies' },
      { id: 'chesed-8', type: 'Prompt', title: 'What kind of help is hardest to ask for?', author: 'Mitzvah Tracker', body: 'Answer gently. The goal is to design better support, not expose anyone.', meta: 'Yesterday · 33 replies' },
    ],
  },
  {
    id: 'seed-divorced-teens',
    name: 'Divorced Teens',
    category: 'Support',
    communityType: 'support',
    privacy: 'Private / Anonymous',
    supportsIncognito: true,
    supportsAnonymousPosting: true,
    hideMembershipDefault: true,
    location: 'Private space',
    follower_count: 128,
    postsToday: 6,
    activeNow: 5,
    friendsInCommunity: 0,
    valueHook: 'Get real support anonymously, without showing up on your profile.',
    growth: '+11 this week',
    engagement: 'Moderator active today',
    identityTags: ['Safe space', 'Anonymous option', 'Teen support'],
    recommendationReason: 'Quiet spaces can be joined privately.',
    description: 'A moderated support community for teens navigating divorce at home, with no public exposure.',
    dailyPrompt: 'What is one thing you wish people understood without you having to explain it?',
    quickActions: ['Post anonymously', 'Ask for advice', 'Quiet check-in'],
    announcements: ['Membership stays hidden by default.', 'Posts are designed for moderation-first support.', 'No screenshots or forwarding expectations are reinforced.'],
    resources: ['Privacy guide', 'Trusted adult checklist', 'How to ask for support'],
    updates: ['Moderator check-in thread open', 'New anonymous reflection prompt posted', 'Support resource refreshed'],
    posts: [
      { id: 'support-1', type: 'Prompt', title: 'No-pressure check-in', author: 'Anonymous moderator', body: 'Use one word for how home feels this week. Say more only if you want.', meta: 'Today · 17 replies' },
      { id: 'support-2', type: 'Question', title: 'How do you handle split weekends?', author: 'Anonymous member', body: 'Looking for practical advice on not feeling pulled in both directions.', meta: 'Yesterday · 13 replies' },
      { id: 'support-3', type: 'Resource', title: 'What helps when plans change suddenly?', author: 'Support Moderator', body: 'A gentle thread of coping tools and scripts from people who understand.', meta: 'Today · 11 replies' },
    ],
  },
  {
    id: 'seed-mental-health',
    name: 'Mental Health Support',
    category: 'Support',
    communityType: 'support',
    privacy: 'Private / Anonymous',
    supportsIncognito: true,
    supportsAnonymousPosting: true,
    hideMembershipDefault: true,
    location: 'Private space',
    follower_count: 214,
    postsToday: 9,
    activeNow: 8,
    friendsInCommunity: 0,
    valueHook: 'A quiet place to check in when you do not want the whole world watching.',
    growth: '+19 this week',
    engagement: '36 supportive replies',
    identityTags: ['Support', 'Anonymous posting', 'Moderated'],
    recommendationReason: 'Designed for safety first.',
    description: 'A calm, moderated community for encouragement, coping strategies, and finding help without public exposure.',
    dailyPrompt: 'What is one small next step that feels doable, not perfect?',
    quickActions: ['Anonymous check-in', 'Share coping idea', 'Ask for support'],
    announcements: ['Anonymous posting is available.', 'Advice threads stay supportive, not diagnostic.', 'Escalation language points users toward real help when needed.'],
    resources: ['Support resource list', 'Grounding ideas', 'How to message a trusted person'],
    updates: ['Daily reset thread refreshed', 'Resource card updated', 'Moderator office hour planned'],
    posts: [
      { id: 'mental-1', type: 'Pinned', title: 'Tiny next step thread', author: 'Wellness Moderator', body: 'Name one small action for today: breathe, text someone, take a walk, ask for help.', meta: 'Today · 29 replies' },
      { id: 'mental-2', type: 'Resource', title: 'What to say when you need help', author: 'Community Mentor', body: 'Simple scripts for starting a hard conversation.', meta: 'Yesterday · 11 replies' },
      { id: 'mental-3', type: 'Check-in', title: 'What felt heavier than usual this week?', author: 'Anonymous member', body: 'A slow thread for being honest without needing to perform.', meta: 'Today · 18 replies' },
    ],
  },
  {
    id: 'seed-school-struggles',
    name: 'Struggling in School',
    category: 'Support',
    communityType: 'support',
    privacy: 'Private / Anonymous',
    supportsIncognito: true,
    supportsAnonymousPosting: true,
    hideMembershipDefault: true,
    location: 'Private space',
    follower_count: 169,
    postsToday: 7,
    activeNow: 7,
    friendsInCommunity: 0,
    valueHook: 'Ask for school help without feeling embarrassed.',
    growth: '+15 this week',
    engagement: 'Study support active',
    identityTags: ['School', 'Support', 'Anonymous'],
    recommendationReason: 'Help without embarrassment.',
    description: 'A private place for school pressure, catching up, motivation, and asking for help without exposure.',
    dailyPrompt: 'What is the smallest assignment or next step you can finish today?',
    quickActions: ['Ask study help', 'Post anonymously', 'Start reset sprint'],
    announcements: ['No public student lists.', 'Support threads focus on progress, not shame.', 'Useful tutor/gemach leads can be shared carefully.'],
    resources: ['20-minute reset plan', 'Teacher email scripts', 'Study buddy board'],
    updates: ['Reset sprint open', 'Study buddy requests active', 'Tutor resource refreshed'],
    posts: [
      { id: 'school-1', type: 'Prompt', title: 'Back-on-track sprint', author: 'Support Mod', body: 'Post one task you can finish in 20 minutes. Come back and reply done.', meta: 'Today · 25 replies' },
      { id: 'school-2', type: 'Question', title: 'How do I email a teacher after missing work?', author: 'Anonymous student', body: 'Can someone help write a respectful message?', meta: 'Yesterday · 20 replies' },
      { id: 'school-3', type: 'Match', title: 'Need a study buddy for tests?', author: 'Support Desk', body: 'Drop subject and schedule. Keep details general until matched privately.', meta: 'Today · 16 replies' },
    ],
  },
  {
    id: 'seed-sports',
    name: 'Sports',
    category: 'Sports',
    communityType: 'lifestyle',
    privacy: 'Public',
    location: 'Five Towns courts and gyms',
    follower_count: 386,
    trending: true,
    postsToday: 11,
    activeNow: 21,
    friendsInCommunity: 5,
    valueHook: 'Find games this week instantly.',
    growth: '+44 this week',
    engagement: '3 pickup games planned',
    identityTags: ['Sports', 'Teen life', 'Pickup games'],
    recommendationReason: 'Fast-moving and social near you.',
    description: 'Pickup basketball, flag football, gym runs, training partners, and sports talk for Jewish teens.',
    dailyPrompt: 'Who is playing this week, where, and at what level?',
    quickActions: ['Plan pickup game', 'Reserve a spot', 'Find gym partner'],
    announcements: ['Pickup boards refresh weekly.', 'Skill level helps avoid mismatched games.', 'Sports meetups can be promoted to Events later.'],
    resources: ['Court board', 'Pickup etiquette', 'Beginner run thread'],
    updates: ['Motzei Shabbos board open', 'Two beginner games proposed', 'Flag football poll trending'],
    posts: [
      { id: 'sports-1', type: 'Plan', title: 'Motzei Shabbos pickup board', author: 'Ari Stein', body: 'Comment basketball, football, or soccer plus time and skill level.', meta: 'Today · 32 replies' },
      { id: 'sports-2', type: 'Question', title: 'Any beginners want a low-pressure run?', author: 'Dovid L.', body: 'Looking for people who want to play without varsity intensity.', meta: 'Yesterday · 21 replies' },
      { id: 'sports-3', type: 'Poll', title: 'Which sport needs its own weekly ladder?', author: 'Sports Desk', body: 'Basketball, football, soccer, pickleball, or running group?', meta: 'Today · 26 votes' },
    ],
  },
  {
    id: 'seed-fitness',
    name: 'Gym / Fitness',
    category: 'Lifestyle',
    communityType: 'lifestyle',
    privacy: 'Public',
    location: 'Five Towns',
    follower_count: 312,
    postsToday: 8,
    activeNow: 14,
    friendsInCommunity: 4,
    valueHook: 'Find someone to walk, lift, or stay accountable with today.',
    growth: '+27 this week',
    engagement: '14 check-ins today',
    identityTags: ['Fitness', 'Healthy habits', 'Accountability'],
    recommendationReason: 'Built for habit loops.',
    description: 'Workout accountability, walking groups, gym partners, and healthy routines that feel social.',
    dailyPrompt: 'What movement can you actually commit to today?',
    quickActions: ['Join walk streak', 'Find workout buddy', 'Share route'],
    announcements: ['Weekly accountability stays pinned.', 'Walking and gym threads are separated for clarity.', 'Healthy habits are celebrated, not shamed.'],
    resources: ['Walking routes', 'Accountability board', 'Beginner training ideas'],
    updates: ['Morning walk thread active', 'Four accountability goals posted', 'Route suggestions added'],
    posts: [
      { id: 'fitness-1', type: 'Prompt', title: 'Sunday accountability board', author: 'Naomi Adler', body: 'Post one realistic goal for the week, small enough to keep.', meta: 'Today · 39 replies' },
      { id: 'fitness-2', type: 'Plan', title: 'Early morning walking group', author: 'Ben Torah', body: 'Cedarhurst route, 25 minutes, no-pressure pace.', meta: 'Yesterday · 15 replies' },
      { id: 'fitness-3', type: 'Check-in', title: 'Who actually moved today?', author: 'Fitness Desk', body: 'A quick honest check-in. Five minutes still counts.', meta: 'Today · 24 replies' },
    ],
  },
  {
    id: 'seed-gemara',
    name: 'Learning Gemara',
    category: 'Learning',
    communityType: 'lifestyle',
    privacy: 'Community-only',
    location: 'Online and local batei midrash',
    follower_count: 448,
    postsToday: 10,
    activeNow: 18,
    friendsInCommunity: 6,
    valueHook: 'Find a chavrusa, ask a real question, and stay consistent.',
    growth: '+36 this week',
    engagement: '58 chavrusa posts this month',
    identityTags: ['Gemara', 'Chavrusa', 'Learning goals'],
    recommendationReason: 'High fit for learning behavior.',
    description: 'Find chavrusas, ask sugya questions, share review systems, and build consistency.',
    dailyPrompt: 'What daf, sugya, or learning block are you trying to stay consistent with?',
    quickActions: ['Find chavrusa', 'Ask sugya question', 'Join night seder'],
    announcements: ['Chavrusa matching refreshes weekly.', 'Questions welcome at every level.', 'Review threads are separated from new learning.'],
    resources: ['Chavrusa board', 'Review tracker', 'Beginner sugya list'],
    updates: ['Night seder board refreshed', 'Three new chavrusa requests', 'Review tips thread active'],
    posts: [
      { id: 'gemara-1', type: 'Match', title: 'This week’s chavrusa matching', author: 'Chavrusa Board', body: 'Reply with topic, level, and time window. Beginners welcome.', meta: 'Today · 33 replies' },
      { id: 'gemara-2', type: 'Question', title: 'How do you review without falling behind?', author: 'Moshe Klein', body: 'Looking for a system when you only have a few nights a week.', meta: 'Yesterday · 12 replies' },
      { id: 'gemara-3', type: 'Prompt', title: 'One Gemara goal for this week', author: 'Learning Desk', body: 'Write it down publicly enough to make it real, gently enough to be doable.', meta: 'Today · 18 replies' },
    ],
  },
  {
    id: 'seed-creative',
    name: 'Music / Creative',
    category: 'Creative',
    communityType: 'lifestyle',
    privacy: 'Public',
    location: 'Five Towns and online',
    follower_count: 235,
    postsToday: 5,
    activeNow: 12,
    friendsInCommunity: 3,
    valueHook: 'Share what you are making and find people who want to build with you.',
    growth: '+22 this week',
    engagement: '12 projects shared',
    identityTags: ['Music', 'Creative', 'Collaborators'],
    recommendationReason: 'A place to make things together.',
    description: 'Music, writing, design, photography, video, and Jewish creators sharing work and building together.',
    dailyPrompt: 'What are you making, practicing, writing, filming, or dreaming up?',
    quickActions: ['Share project', 'Find collaborator', 'Ask feedback'],
    announcements: ['Showcase threads open Fridays.', 'Feedback should be specific and kind.', 'Collaborator requests stay visible.'],
    resources: ['Collaboration board', 'Project showcase', 'Open mic ideas'],
    updates: ['Two collaboration asks posted', 'Open mic thread growing', 'Friday showcase queued'],
    posts: [
      { id: 'creative-1', type: 'Prompt', title: 'Share one unfinished thing', author: 'Creative Board', body: 'A lyric, photo, design, idea, or sketch. Feedback should be kind and useful.', meta: 'Today · 26 replies' },
      { id: 'creative-2', type: 'Match', title: 'Who wants to collaborate?', author: 'Shira Feld', body: 'Editors, musicians, photographers, and writers: say what you do.', meta: 'Yesterday · 28 replies' },
      { id: 'creative-3', type: 'Event idea', title: 'Should we do a community open mic?', author: 'Creative Desk', body: 'Low-pressure, Motzei Shabbos, local venue. Who would come or help?', meta: 'Today · 19 replies' },
    ],
  },
  {
    id: 'seed-business',
    name: 'Business / Hustle',
    category: 'Business',
    communityType: 'lifestyle',
    privacy: 'Community-only',
    location: 'Five Towns and NYC',
    follower_count: 527,
    trending: true,
    postsToday: 13,
    activeNow: 26,
    friendsInCommunity: 8,
    valueHook: 'Get intros, leads, jobs, and smart advice from people nearby.',
    growth: '+58 this week',
    engagement: '27 intros this month',
    identityTags: ['Business', 'Networking', 'Opportunities'],
    recommendationReason: 'Popular near you with strong engagement.',
    description: 'A Jewish professional network for side hustles, jobs, internships, mentors, and local opportunities.',
    dailyPrompt: 'What intro, lead, advice, or opportunity would help you move this week?',
    quickActions: ['Post opportunity', 'Ask mentor advice', 'Offer intro'],
    announcements: ['Give-before-ask keeps threads useful.', 'Internship leads should include pay and time when known.', 'Mentor threads refresh twice monthly.'],
    resources: ['Intro board', 'Resume review thread', 'Local opportunity desk'],
    updates: ['Three leads posted today', 'Mentor asks receiving replies', 'Resume review queue open'],
    posts: [
      { id: 'business-1', type: 'Pinned', title: 'Give one, ask one', author: 'Daniel Price', body: 'Offer one helpful intro, tip, or lead, then ask for one thing you need.', meta: 'Today · 35 replies' },
      { id: 'business-2', type: 'Question', title: 'Teen-friendly summer jobs?', author: 'Maya Rosen', body: 'Looking for real local leads with clear hours and pay.', meta: 'Yesterday · 24 replies' },
      { id: 'business-3', type: 'Prompt', title: 'What are you building?', author: 'Business Desk', body: 'Share the project, customer, or opportunity you are trying to understand better.', meta: 'Today · 17 replies' },
    ],
  },
  {
    id: 'seed-gaming',
    name: 'Gaming',
    category: 'Gaming',
    communityType: 'lifestyle',
    privacy: 'Public',
    location: 'Online + local',
    follower_count: 274,
    postsToday: 9,
    activeNow: 19,
    friendsInCommunity: 4,
    valueHook: 'Find a squad tonight without spamming a group chat.',
    growth: '+33 this week',
    engagement: 'Two squads formed today',
    identityTags: ['Gaming', 'Friends', 'Low-pressure'],
    recommendationReason: 'Good casual retention community.',
    description: 'Find teammates, compare games, schedule casual sessions, and make social time easier.',
    dailyPrompt: 'What are you playing this week, and who wants in?',
    quickActions: ['Find squad', 'Start poll', 'Plan game night'],
    announcements: ['Squad matching stays casual by default.', 'Game nights can spin into events.', 'Use platform tags to match players faster.'],
    resources: ['Squad board', 'Game night poll', 'Beginner-friendly picks'],
    updates: ['Two squads formed', 'Motzei Shabbos poll live', 'Party game thread active'],
    posts: [
      { id: 'gaming-1', type: 'Prompt', title: 'Game night board', author: 'Gaming Desk', body: 'Reply with game, platform, and whether you want competitive or relaxed.', meta: 'Today · 30 replies' },
      { id: 'gaming-2', type: 'Question', title: 'Best group game for Motzei Shabbos?', author: 'Eli B.', body: 'Looking for something fun that works with a bunch of people.', meta: 'Yesterday · 18 replies' },
      { id: 'gaming-3', type: 'Poll', title: 'Competitive or chill lobby tonight?', author: 'Gaming Desk', body: 'Vote so matching does not mix totally different moods.', meta: 'Today · 23 votes' },
    ],
  },
];

function adaptCommunity(c, joinedIds, membershipsByCommunity) {
  const typeKey = getCommunityTypeKey(c);
  const typeConfig = getCommunityTypeConfig(c);
  const category = c.category || typeConfig.label;
  const membership = membershipsByCommunity.get(c.id);
  const settings = c.settings && typeof c.settings === 'object' ? c.settings : {};
  const rulesFromSettings = Array.isArray(settings.rules) ? settings.rules.join('\n') : settings.rules;
  const memberCount = c.follower_count || c.memberCount || 0;
  const postsToday = c.postsToday || c.posts_this_week || c.post_count || 0;
  return {
    ...c,
    typeKey,
    category,
    communityType: c.communityType || settings.communityType || (category === 'Support' ? 'support' : 'user'),
    privacy: c.privacy || 'Public',
    memberCount,
    joined: joinedIds.has(c.id) || Boolean(c.joined),
    joinedIncognito: Boolean(membership?.incognito || membership?.hide_membership || c.joinedIncognito),
    hideMembershipDefault: Boolean(c.hideMembershipDefault || settings.hideMembershipDefault),
    hideMembership: Boolean(membership?.hide_membership || c.hideMembership || settings.hideMembershipDefault),
    postsToday,
    activeNow: c.activeNow || c.active_now || 0,
    friendsInCommunity: c.friendsInCommunity || c.friends_in_community || 0,
    valueHook: c.valueHook || c.featured_tagline || typeConfig.tagline,
    socialProof: c.socialProof || null,
    growth: c.growth || '',
    engagement: c.engagement || '',
    dailyPrompt: c.dailyPrompt || '',
    quickActions: c.quickActions || typeConfig.prompts,
    posts: c.posts || [],
    identityTags: c.identityTags || settings.identityTags || [typeConfig.label, c.privacy || 'Public'],
    rules: c.rules || rulesFromSettings || '',
  };
}

function getManagementRole(community, currentUser, membershipsByCommunity) {
  if (!currentUser?.id || !community?.id) return null;
  if (community.created_by_user_id === currentUser.id) return 'Owner';

  const membership = membershipsByCommunity.get(community.id);
  const role = String(membership?.role || '').toLowerCase();
  if (!MANAGEMENT_ROLES.has(role)) return null;

  if (role === 'owner') return 'Owner';
  if (role === 'admin') return 'Admin';
  return 'Moderator';
}

export default function Communities() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const searchBarRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCommunityId = searchParams.get('community');
  const selectedTab = searchParams.get('tab') || 'home';
  const [selectedCommunityId, setSelectedCommunityIdState] = useState(urlCommunityId);

  const setSelectedCommunityId = (communityId, tab = 'home') => {
    setSelectedCommunityIdState(communityId);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (communityId) {
        next.set('community', communityId);
        next.set('tab', tab);
      } else {
        next.delete('community');
        next.delete('tab');
      }
      return next;
    }, { replace: false });
  };

  useEffect(() => {
    if (selectedCommunityId) window.scrollTo({ top: 0, behavior: 'instant' });
  }, [selectedCommunityId]);

  useEffect(() => {
    setSelectedCommunityIdState(urlCommunityId);
    setInitialComposePrompt('');
  }, [urlCommunityId]);

  // Handle post-Stripe-redirect billing result
  useEffect(() => {
    const billing = searchParams.get('billing');
    if (!billing) return;

    const pending = storageService.getJson('community_premium_layout_pending');

    if (billing === 'success' && pending?.communityId && pending?.layout) {
      const { communityId, layout } = pending;
      storageService.removeItem('community_premium_layout_pending');

      (async () => {
        try {
          const { data: existing, error: fetchErr } = await supabase
            .from('communities')
            .select('settings')
            .eq('id', communityId)
            .single();
          if (fetchErr) throw fetchErr;

          const mergedSettings = {
            ...(existing?.settings || {}),
            layout: {
              ...(existing?.settings?.layout || {}),
              ...layout,
            },
          };

          const { error: updateErr } = await supabase
            .from('communities')
            .update({ settings: mergedSettings })
            .eq('id', communityId);
          if (updateErr) throw updateErr;

          await queryClient.invalidateQueries({ queryKey: ['communities-list'] });
          toast.success('Premium layout applied to your community! ✦');
        } catch {
          toast.error('Could not apply layout — set it manually in Admin Center → Layout.');
        }

        setSearchParams((p) => {
          const next = new URLSearchParams(p);
          next.delete('billing');
          return next;
        }, { replace: true });
      })();
    } else if (billing === 'cancel') {
      storageService.removeItem('community_premium_layout_pending');
      toast.info('Upgrade cancelled — your community launched on the free tier.');
      setSearchParams((p) => {
        const next = new URLSearchParams(p);
        next.delete('billing');
        return next;
      }, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [showCreate, setShowCreate] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [adminShortcutCommunity, setAdminShortcutCommunity] = useState(null);
  const [joiningId, setJoiningId] = useState(null);
  const [optimisticJoins, setOptimisticJoins] = useState(new Set());
  const [optimisticLeaves, setOptimisticLeaves] = useState(new Set());
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [view, setView] = useState('discover');
  const [initialComposePrompt, setInitialComposePrompt] = useState('');

  const { data: rawCommunities = [], isLoading } = useQuery({
    queryKey: ['communities-list'],
    queryFn: () => dataService.entities.Community.list('-follower_count', 100),
    staleTime: 60000,
  });

  const { data: memberships = [] } = useQuery({
    queryKey: ['communities-memberships', currentUser?.id],
    queryFn: () => dataService.entities.UserCommunity.filter({ user_id: currentUser.id }),
    enabled: !!currentUser,
    staleTime: 60000,
  });

  const membershipsByCommunity = useMemo(
    () => new Map(memberships.map((membership) => [membership.community_id, membership])),
    [memberships]
  );
  const joinedIds = useMemo(() => new Set(memberships.map((m) => m.community_id)), [memberships]);

  const { data: rawNewActivityIds = [] } = useQuery({
    queryKey: ['communities-new-activity', currentUser?.id],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_communities_with_new_activity');
      return data || [];
    },
    enabled: !!currentUser,
    staleTime: 60000,
  });
  const newActivityIds = useMemo(() => new Set(rawNewActivityIds), [rawNewActivityIds]);

  const communities = useMemo(() => {
    const effectiveJoined = new Set([...joinedIds, ...optimisticJoins]);
    optimisticLeaves.forEach((id) => effectiveJoined.delete(id));
    const backendCommunities = rawCommunities.map((community) => adaptCommunity(community, effectiveJoined, membershipsByCommunity));
    const backendIds = new Set(backendCommunities.map((community) => community.id));
    const seeds = appParams.hasBackendConfig ? [] : EXPERIENCE_SEEDS
      .filter((seed) => !backendIds.has(seed.id))
      .map((seed) => adaptCommunity({ ...seed, isDemo: true }, effectiveJoined, membershipsByCommunity));
    return [...seeds, ...backendCommunities];
  }, [joinedIds, membershipsByCommunity, rawCommunities, optimisticJoins, optimisticLeaves]);

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
        community.typeKey,
        community.communityType,
        ...(community.identityTags || []),
      ].join(' ').toLowerCase();
      const matchesQuery = !cleanQuery || haystack.includes(cleanQuery);
      const matchesType = typeFilter === 'all' || community.typeKey === typeFilter;
      return matchesQuery && matchesType;
    });
  }, [typeFilter, communities, query]);

  const classifiedCommunities = useMemo(
    () => filteredCommunities.map((community) => ({
      ...community,
      managementRole: getManagementRole(community, currentUser, membershipsByCommunity),
    })),
    [currentUser, filteredCommunities, membershipsByCommunity]
  );
  const managedCommunities = classifiedCommunities.filter((community) => community.managementRole);
  const joinedCommunities = classifiedCommunities.filter((community) => community.joined && !community.managementRole);
  const discoverCommunities = classifiedCommunities.filter((community) => !community.joined && !community.managementRole);
  const yourCommunities = [...managedCommunities, ...joinedCommunities];
  const curatedDiscoverSections = useMemo(() => {
    // Group by typeKey so each section is genuinely type-aware
    const byType = {};
    for (const community of discoverCommunities) {
      const key = community.typeKey || 'general';
      if (!byType[key]) byType[key] = [];
      byType[key].push(community);
    }

    return DISCOVER_SECTION_ORDER
      .filter((key) => (byType[key] || []).length > 0)
      .map((key) => {
        const tc = COMMUNITY_TYPE_CONFIG[key] || COMMUNITY_TYPE_CONFIG.general;
        return {
          key,
          typeConfig: tc,
          subtitle: DISCOVER_SECTION_SUBTITLES[key] || tc.tagline,
          communities: byType[key],
        };
      });
  }, [discoverCommunities]);

  const joinedCount = communities.filter((community) => community.joined).length;
  const communityPulse = useMemo(() => {
    const findById = (id) => communities.find((community) => community.id === id);
    const local = findById('seed-five-towns-local');
    const updates = findById('seed-jewish-news');
    const chesed = findById('seed-chesed-updates');
    const support = findById('seed-mental-health');

    return [
      local && {
        key: 'local',
        icon: MapPinned,
        title: 'Five Towns right now',
        eyebrow: 'Local pulse',
        copy: 'Open the town square for tonight plans, useful asks, and what locals are talking about.',
        stat: `${local.postsToday || 0} posts today`,
        tone: 'blue',
        community: local,
        prompt: local.dailyPrompt,
      },
      updates && {
        key: 'updates',
        icon: CalendarDays,
        title: 'What changed today',
        eyebrow: 'Daily brief',
        copy: 'Check the official update stream before it gets buried in chats and forwarded screenshots.',
        stat: updates.engagement || `${updates.postsToday || 0} fresh updates`,
        tone: 'amber',
        community: updates,
        prompt: updates.dailyPrompt,
      },
      chesed && {
        key: 'chesed',
        icon: HeartHandshake,
        title: 'Do one useful thing',
        eyebrow: 'Chesed board',
        copy: 'Jump into needs, rides, meals, and mitzvah offers that are concrete enough to act on.',
        stat: chesed.engagement || `${chesed.postsToday || 0} active threads`,
        tone: 'emerald',
        community: chesed,
        prompt: chesed.dailyPrompt,
      },
      support && {
        key: 'support',
        icon: ShieldCheck,
        title: 'Private spaces matter',
        eyebrow: 'Trust layer',
        copy: 'Sensitive communities stay quiet, useful, and anonymous when someone needs a safer place.',
        stat: support.engagement || 'Anonymous posting available',
        tone: 'violet',
        community: support,
        prompt: support.dailyPrompt,
      },
    ].filter(Boolean);
  }, [communities]);

  const allJoinedCommunities = useMemo(
    () => communities.filter((c) => c.joined),
    [communities]
  );

  const forYouResult = useMemo(() => {
    const empty = { communities: [], locationBoostUsed: false };
    // Hide when user is actively searching or filtering — explicit intent takes priority
    if (query.trim() || typeFilter !== 'all') return empty;
    // No basis for personalization without joined communities
    if (allJoinedCommunities.length === 0) return empty;

    // Build type frequency from the user's joined set
    const typeFreq = {};
    for (const c of allJoinedCommunities) {
      const key = c.typeKey || 'general';
      typeFreq[key] = (typeFreq[key] || 0) + 1;
    }

    // Location terms from the auth context — no extra query needed
    const locationTerms = [
      currentUser?.cityPreset,
      currentUser?.locationLabel,
    ].filter(Boolean).map((s) => s.toLowerCase());

    // Score each unjoinable community — primary filter is typeKey overlap
    const communities = discoverCommunities
      .filter((c) => typeFreq[c.typeKey || 'general'])
      .map((c) => {
        let score = 3; // base: type match (required — minimum to appear)
        if ((c.memberCount || c.follower_count || 0) > 50) score += 2;
        if ((c.postsToday || 0) > 0) score += 1;
        if (locationTerms.length > 0) {
          const communityLoc = (c.location || '').toLowerCase();
          if (locationTerms.some((term) => communityLoc.includes(term))) score += 2;
        }
        return { ...c, _forYouScore: score };
      })
      .sort((a, b) => b._forYouScore - a._forYouScore)
      .slice(0, 4);

    // Subtitle changes only if location actually lifted at least one result
    const locationBoostUsed = locationTerms.length > 0 && communities.some((c) => {
      const loc = (c.location || '').toLowerCase();
      return locationTerms.some((term) => loc.includes(term));
    });

    return { communities, locationBoostUsed };
  }, [allJoinedCommunities, discoverCommunities, query, typeFilter, currentUser]);

  const forYouCommunities = forYouResult.communities;

  const handleJoin = async (communityId, options = {}) => {
    const community = communities.find((item) => item.id === communityId);
    if (!community) return;

    const isSeedCommunity = communityId.startsWith('seed-');
    if (!currentUser || isSeedCommunity) {
      toast.success(options.incognito ? 'Previewed as a private join' : community.joined ? 'Preview left' : 'Preview joined');
      return;
    }

    if (community.created_by_user_id === currentUser.id && community.joined) {
      toast.info('Community owners manage their community instead of leaving it.');
      return;
    }

    const isJoined = joinedIds.has(communityId);
    setJoiningId(communityId);

    // Optimistic flip — UI responds instantly
    if (isJoined) {
      setOptimisticLeaves((prev) => new Set([...prev, communityId]));
      setOptimisticJoins((prev) => { const s = new Set(prev); s.delete(communityId); return s; });
    } else {
      setOptimisticJoins((prev) => new Set([...prev, communityId]));
      setOptimisticLeaves((prev) => { const s = new Set(prev); s.delete(communityId); return s; });
    }

    try {
      if (isJoined) {
        const records = await dataService.entities.UserCommunity.filter({
          user_id: currentUser.id,
          community_id: communityId,
        });
        if (records[0]) await dataService.entities.UserCommunity.delete(records[0].id);
        await incrementCounter('communities', 'follower_count', communityId, -1);
        toast.success('Left community');
      } else {
        await dataService.entities.UserCommunity.create({
          user_id: currentUser.id,
          community_id: communityId,
          role: 'member',
          incognito: Boolean(options.incognito),
          hide_membership: Boolean(options.incognito),
        });
        await incrementCounter('communities', 'follower_count', communityId, 1);
        toast.success(options.incognito ? 'Joined privately' : 'Joined!');
      }
      queryClient.invalidateQueries({ queryKey: ['communities-list'] });
      queryClient.invalidateQueries({ queryKey: ['communities-memberships', currentUser?.id] });
    } catch {
      // Roll back optimistic update on failure
      if (isJoined) {
        setOptimisticLeaves((prev) => { const s = new Set(prev); s.delete(communityId); return s; });
      } else {
        setOptimisticJoins((prev) => { const s = new Set(prev); s.delete(communityId); return s; });
      }
      toast.error('Something went wrong');
    }
    setJoiningId(null);
  };

  const handleCommunityCreated = (community) => {
    queryClient.invalidateQueries({ queryKey: ['communities-list'] });
    queryClient.invalidateQueries({ queryKey: ['communities-memberships', currentUser?.id] });
    setSelectedCommunityId(community.id);
  };

  if (selectedCommunity) {
    return (
      <CommunityDetailView
        communityId={selectedCommunity.id}
        currentUser={currentUser}
        fallbackCommunity={selectedCommunity}
        onBack={() => {
          setSelectedCommunityId(null);
          setInitialComposePrompt('');
        }}
      />
    );
  }

  const openCommunity = (communityId) => {
    setInitialComposePrompt('');
    setSelectedCommunityId(communityId);
  };

  const openCommunityWithPrompt = (community, prompt) => {
    setInitialComposePrompt(prompt || community.dailyPrompt || '');
    setSelectedCommunityId(community.id, 'posts');
  };

  return (
    <main className="app-page mobile-safe-bottom">
      <DestinationHeader
        icon={Users}
        title="Communities"
        className="bg-gradient-to-b from-[rgba(239,246,255,0.97)] to-[rgba(248,250,252,0.96)]"
        actions={(
          <>
            <button
              onClick={() => navigate('/Marketplace')}
              className="app-icon-button surface-tile-hover touch-manipulation"
              aria-label="Open marketplace"
            >
              <ShoppingBag className="h-[18px] w-[18px] text-slate-500" />
            </button>
            <button
              onClick={() => searchBarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="app-icon-button surface-tile-hover touch-manipulation"
              aria-label="Search communities"
            >
              <Search className="h-[18px] w-[18px] text-slate-500" />
            </button>
            <button
              onClick={() => setShowMessages(true)}
              className="app-icon-button surface-tile-hover touch-manipulation"
              aria-label="Community messages"
            >
              <MessageCircle className="h-[18px] w-[18px] text-slate-500" />
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="app-icon-button surface-tile-hover touch-manipulation"
              aria-label="Create community"
            >
              <Plus className="h-[18px] w-[18px] text-slate-500" />
            </button>
          </>
        )}
      />

      <div className="mobile-page-wide px-3 pb-6 pt-2 sm:px-4 sm:pt-3">
        <Hero joinedCount={joinedCount} />

        <ActiveInStrip communities={allJoinedCommunities} onOpen={openCommunity} />

        <ViewSwitch view={view} onChange={setView} joinedCount={joinedCount} />

        <div ref={searchBarRef}>
          <SearchBar
            query={query}
            onQueryChange={setQuery}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : filteredCommunities.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <p className="text-sm font-semibold text-slate-600">No communities found</p>
            <p className="mt-1 text-[13px] text-slate-400">Try a different search or category.</p>
          </div>
        ) : (
          <div className="space-y-7">
            {view === 'mine' ? (
              <CommunitySection
                title="My Communities"
                subtitle="Separate the spaces you run from the spaces you simply belong to."
                icon={Sparkles}
                communities={[]}
              >
                <div className="space-y-6">
                  <CommunitySection
                    title="Communities You Manage"
                    subtitle="Owner, admin, and moderator spaces that may need your attention."
                    icon={ShieldCheck}
                    communities={managedCommunities}
                    emptyTitle="You’re not managing any communities yet."
                    emptyBody="Create one when you’re ready to build a space around a local need, topic, or group."
                    emptyActionLabel="Create Community"
                    onEmptyAction={() => setShowCreate(true)}
                    onOpen={openCommunity}
                    onTryPrompt={openCommunityWithPrompt}
                    onJoin={handleJoin}
                    onManage={(community) => setAdminShortcutCommunity(community)}
                    joiningId={joiningId}
                    newActivityIds={newActivityIds}
                  />
                  <CommunitySection
                    title="Communities You Joined"
                    subtitle="The communities where you’re a regular member."
                    icon={Users}
                    communities={joinedCommunities}
                    emptyTitle="You haven’t joined any member communities yet."
                    emptyBody="Discover groups that match your interests, neighborhood, or daily Jewish life."
                    emptyActionLabel="Browse Discover"
                    onEmptyAction={() => setView('discover')}
                    onOpen={openCommunity}
                    onTryPrompt={openCommunityWithPrompt}
                    onJoin={handleJoin}
                    joiningId={joiningId}
                    newActivityIds={newActivityIds}
                  />
                </div>
              </CommunitySection>
            ) : (
              <div className="space-y-8">
                {communityPulse.length > 0 && (
                  <CommunityPulseDock
                    items={communityPulse}
                    onOpen={openCommunity}
                    onTryPrompt={openCommunityWithPrompt}
                  />
                )}
                {forYouCommunities.length >= 1 && (
                  <ForYouSection
                    communities={forYouCommunities}
                    onOpen={openCommunity}
                    onJoin={handleJoin}
                    joiningId={joiningId}
                    locationBoostUsed={forYouResult.locationBoostUsed}
                  />
                )}
                {curatedDiscoverSections.length > 0 ? (
                  curatedDiscoverSections.map((section) => (
                    <DiscoverSection
                      key={section.key}
                      section={section}
                      onOpen={openCommunity}
                      onJoin={handleJoin}
                      joiningId={joiningId}
                    />
                  ))
                ) : (
                  <DiscoverEmptyState
                    hasFilters={query.trim().length > 0 || typeFilter !== 'all'}
                    onClear={() => { setQuery(''); setTypeFilter('all'); }}
                    onCreateCommunity={() => setShowCreate(true)}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateCommunityModal
          open={showCreate}
          onOpenChange={(v) => { if (!v) setShowCreate(false); }}
          currentUser={currentUser}
          onCreated={handleCommunityCreated}
        />
      )}

      <MessagesDrawer
        currentUser={currentUser}
        open={showMessages}
        onClose={() => setShowMessages(false)}
      />

      {adminShortcutCommunity && (
        <CommunityAdminCenter
          community={adminShortcutCommunity}
          currentUser={currentUser}
          open={Boolean(adminShortcutCommunity)}
          onClose={() => setAdminShortcutCommunity(null)}
          onCommunityUpdated={() => {
            queryClient.invalidateQueries({ queryKey: ['communities-list'] });
            queryClient.invalidateQueries({ queryKey: ['communities-memberships', currentUser?.id] });
          }}
          onDeleted={() => {
            setAdminShortcutCommunity(null);
            queryClient.invalidateQueries({ queryKey: ['communities-list'] });
            queryClient.invalidateQueries({ queryKey: ['communities-memberships', currentUser?.id] });
          }}
        />
      )}
    </main>
  );
}

function Hero({ joinedCount }) {
  return (
    <div className="mb-3 flex items-center gap-3 pt-0.5">
      <p className="flex-1 text-[13px] font-semibold leading-5 text-slate-500">
        Your neighborhood, shul, chesed, and learning — in one place.
      </p>
      {joinedCount > 0 && (
        <span className="shrink-0 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700">
          {joinedCount} joined
        </span>
      )}
    </div>
  );
}

function CommunityPulseDock({ items, onOpen, onTryPrompt }) {
  if (!items.length) return null;
  const toneMap = {
    blue: 'border-blue-100 bg-blue-50 text-blue-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-800',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-800',
    violet: 'border-violet-100 bg-violet-50 text-violet-800',
  };

  return (
    <section className="surface-panel-soft mb-4 rounded-[24px] p-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-slate-950">Today in your community world</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            These are the loops that should make Communities useful enough to reopen, not just join once.
          </p>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-500">
          Five Towns focused
        </span>
      </div>
      <div className="grid gap-3 lg:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.key} className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm">
              <button
                type="button"
                onClick={() => onOpen?.(item.community.id)}
                className="motion-press w-full text-left"
              >
                <div className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-black ${toneMap[item.tone] || toneMap.blue}`}>
                  <Icon className="h-3.5 w-3.5" />
                  {item.eyebrow}
                </div>
                <h3 className="mt-3 text-[15px] font-black leading-5 text-slate-950">{item.title}</h3>
                <p className="mt-1.5 line-clamp-3 text-[12px] font-semibold leading-5 text-slate-500">{item.copy}</p>
                <p className="mt-3 text-[11px] font-black uppercase tracking-wide text-slate-400">{item.stat}</p>
              </button>
              <button
                type="button"
                onClick={() => onTryPrompt?.(item.community, item.prompt)}
                className="motion-press mt-3 w-full rounded-xl bg-slate-950 px-3 py-2 text-left text-[11px] font-black text-white"
              >
                Open with prompt
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ViewSwitch({ view, onChange, joinedCount }) {
  return (
    <section className="surface-panel-soft mb-4 rounded-[20px] p-2">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onChange('discover')}
          className={`motion-press h-11 rounded-2xl text-sm font-black transition ${
            view === 'discover' ? 'bg-slate-950 text-white' : 'bg-white text-slate-600'
          }`}
        >
          Discover
        </button>
        <button
          onClick={() => onChange('mine')}
          className={`motion-press h-11 rounded-2xl text-sm font-black transition ${
            view === 'mine' ? 'bg-slate-950 text-white' : 'bg-white text-slate-600'
          }`}
        >
          My Communities ({joinedCount})
        </button>
      </div>
    </section>
  );
}

function ActiveInStrip({ communities = [], onOpen }) {
  if (!communities.length) return null;
  return (
    <section className="mb-3">
      <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-400">Your spaces</p>
      <div className="mobile-scroll-x flex gap-2 pb-1">
        {communities.map((community) => (
          <button
            key={community.id}
            type="button"
            onClick={() => onOpen?.(community.id)}
            className="motion-press flex min-w-[148px] shrink-0 items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-[11px] font-black text-white">
              {(community.name || '?').split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[12px] font-black text-slate-950">{community.name}</span>
              <span className="block truncate text-[10px] font-semibold text-slate-400">{community.category || 'Community'}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function SearchBar({ query, onQueryChange, typeFilter, onTypeFilterChange }) {
  const [inputValue, setInputValue] = useState(query);
  const debounceRef = useRef(null);

  const handleSearch = (value) => {
    setInputValue(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onQueryChange(value), 250);
  };

  return (
    <section className="surface-panel-soft mb-5 rounded-[24px] p-3">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={inputValue}
          onChange={(event) => handleSearch(event.target.value)}
          placeholder="Search communities, topics, or neighborhoods"
          className="app-input pl-10 pr-3 text-sm"
        />
      </label>
      <div className="mobile-scroll-x mt-3 flex gap-2 pb-1">
        {COMMUNITY_FILTERS.map((item) => (
          <button
            key={item.key}
            onClick={() => onTypeFilterChange(item.key)}
            className={`motion-press h-9 shrink-0 rounded-full px-3.5 text-[12px] font-black transition ${
              typeFilter === item.key ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </section>
  );
}

function CommunitySection({
  title,
  subtitle,
  icon: Icon,
  communities = [],
  emptyTitle,
  emptyBody,
  emptyActionLabel,
  onEmptyAction,
  onOpen,
  onTryPrompt,
  onJoin,
  onManage,
  joiningId,
  newActivityIds,
  children,
}) {
  if (children) {
    return (
      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
              <Icon className="h-5 w-5 text-blue-600" />
              {title}
            </h2>
            <p className="text-sm leading-6 text-slate-500">{subtitle}</p>
          </div>
        </div>
        {children}
      </section>
    );
  }

  if (!communities.length && !emptyTitle) return null;
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
            <Icon className="h-5 w-5 text-blue-600" />
            {title}
          </h2>
          <p className="text-sm leading-6 text-slate-500">{subtitle}</p>
        </div>
        <span className="hidden rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-500 sm:inline-flex">
          {communities.length}
        </span>
      </div>
      {communities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="text-sm font-black text-slate-800">{emptyTitle}</p>
          <p className="mt-1 text-[13px] font-semibold text-slate-500">{emptyBody}</p>
          {emptyActionLabel && onEmptyAction && (
            <button
              type="button"
              onClick={onEmptyAction}
              className="motion-press mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-black text-white"
            >
              {emptyActionLabel}
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {communities.map((community) => (
            <CommunityHubCard
              key={community.id}
              community={community}
              loading={joiningId === community.id}
              onOpen={() => onOpen(community.id)}
              onTryPrompt={(prompt) => onTryPrompt?.(community, prompt)}
              onToggleJoin={(options) => onJoin(community.id, options)}
              managementRole={community.managementRole}
              onManage={community.managementRole ? () => onManage?.(community) : undefined}
              hasNewActivity={newActivityIds?.has(community.id) ?? false}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function DiscoverSection({ section, onOpen, onJoin, joiningId }) {
  const { typeConfig, subtitle, communities } = section;
  const Icon = typeConfig.icon;

  return (
    <section>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className={`mb-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black ${typeConfig.badgeClass}`}>
            <Icon className="h-3 w-3" />
            {typeConfig.label}
          </div>
          <p className="text-[13px] font-semibold leading-5 text-slate-500">{subtitle}</p>
        </div>
        <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-black text-slate-400">
          {communities.length}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {communities.map((community) => (
          <DiscoverCommunityCard
            key={community.id}
            community={community}
            onOpen={() => onOpen(community.id)}
            onToggleJoin={(options) => onJoin(community.id, options)}
            loading={joiningId === community.id}
          />
        ))}
      </div>
    </section>
  );
}

function ForYouSection({ communities, onOpen, onJoin, joiningId, locationBoostUsed }) {
  const subtitle = locationBoostUsed
    ? "Based on the communities you've joined and what's near you"
    : "Based on the kinds of communities you've joined";
  return (
    <section>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 px-2.5 py-1 text-[11px] font-black text-violet-700">
            <Sparkles className="h-3 w-3" />
            For you
          </div>
          <p className="text-[13px] font-semibold leading-5 text-slate-500">{subtitle}</p>
        </div>
        <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-black text-slate-400">
          {communities.length}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {communities.map((community) => (
          <DiscoverCommunityCard
            key={community.id}
            community={community}
            onOpen={() => onOpen(community.id)}
            onToggleJoin={(options) => onJoin(community.id, options)}
            loading={joiningId === community.id}
          />
        ))}
      </div>
    </section>
  );
}

function DiscoverEmptyState({ hasFilters, onClear, onCreateCommunity }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
      {hasFilters ? (
        <>
          <p className="text-[15px] font-black text-slate-800">No communities match this filter</p>
          <p className="mt-1 text-[13px] font-semibold text-slate-500">Try clearing the search or choosing a different type.</p>
          <button
            type="button"
            onClick={onClear}
            className="motion-press mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-black text-white"
          >
            Clear filters
          </button>
        </>
      ) : (
        <>
          <p className="text-[15px] font-black text-slate-800">No communities to discover yet</p>
          <p className="mt-1 text-[13px] font-semibold text-slate-500">Be the first — create a community space for your neighborhood, shul, or group.</p>
          <button
            type="button"
            onClick={onCreateCommunity}
            className="motion-press mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-black text-white"
          >
            Create a community
          </button>
        </>
      )}
    </div>
  );
}
