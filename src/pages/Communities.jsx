import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Loader2,
  MessageCircle,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react';
import PageHelp from '@/components/common/PageHelp';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { dataService, incrementCounter } from '@/services';
import { toast } from 'sonner';
import CommunityHubCard from '@/components/communities/CommunityHubCard';
import CommunityHubDetail from '@/components/communities/CommunityHubDetail';
import CreateCommunityForm from '@/components/communities/CreateCommunityForm';
import MessagesDrawer from '@/components/communities/MessagesDrawer';
import { COMMUNITY_TYPE_OPTIONS, getCommunityTypeConfig, getCommunityTypeKey } from '@/lib/communityTypes';

const COMMUNITY_FILTERS = [{ key: 'all', label: 'All' }, ...COMMUNITY_TYPE_OPTIONS.map(({ key, label }) => ({ key, label }))];
const CREATE_CATEGORIES = COMMUNITY_TYPE_OPTIONS.map(({ label }) => label);

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
    growth: '+84 this week',
    engagement: '312 learned today',
    identityTags: ['Torah every day', 'Parsha', 'Short shiurim'],
    recommendationReason: 'Matches your learning and reflection activity.',
    description: 'A trusted daily Torah hub with short divrei Torah, halacha prompts, chavrusa energy, and discussion that fits real life.',
    dailyPrompt: 'What is one line of Torah you want to carry into today?',
    quickActions: ['Share a 3-minute thought', 'Ask for a source', 'Find a chavrusa'],
    announcements: ['Daily prompt refreshes each morning.', 'Weekly source sheet lands before Shabbos.', 'Short reflections are boosted in the official feed.'],
    resources: ['Parsha in 3 minutes', 'Daf recap board', '10-minute learning streak'],
    updates: ['Morning Torah drop posted', 'Night seder prompt scheduled', 'New chavrusa matches waiting'],
    posts: [
      { id: 'torah-1', type: 'Pinned', title: 'Today in one idea', author: 'JUnited Torah Desk', body: 'Small choices repeated daily become the atmosphere of a Jewish home.', meta: '8m ago · 19 replies' },
      { id: 'torah-2', type: 'Hot discussion', title: 'What helps you stay consistent?', author: 'Avi Rosen', body: 'Trying to build a realistic 10-minute seder. What actually worked for you?', meta: '51m ago · 31 replies' },
      { id: 'torah-3', type: 'Daily prompt', title: 'One line, one action', author: 'JUnited Torah Desk', body: 'Reply with one idea from today and one tiny action you can do because of it.', meta: 'Today · 27 replies' },
      { id: 'torah-4', type: 'Match', title: 'Beginner-friendly chavrusa thread', author: 'Learning Desk', body: 'Drop topic, level, and available times. Consistency matters more than speed.', meta: 'Today · 22 replies' },
      { id: 'torah-5', type: 'Recurring column', title: 'Before the day gets noisy', author: 'JUnited Torah Desk', body: 'A 90-second morning thought: where can you replace autopilot with intention today?', meta: 'Today · 18 replies' },
      { id: 'torah-6', type: 'Interactive prompt', title: 'Finish the sentence: Torah changes my day when...', author: 'Daily Torah', body: 'Keep it short. The best replies become tomorrow’s reflection reel.', meta: 'Today · 34 replies' },
      { id: 'torah-7', type: 'Mini challenge', title: 'Learn, reflect, share', author: 'Learning Desk', body: 'Learn one idea, write one sentence on how it hits your life, then invite one friend into the thread.', meta: 'Today · 21 replies' },
      { id: 'torah-8', type: 'Question', title: 'Which topic would make you open this community every day?', author: 'JUnited Torah Desk', body: 'Halacha, parsha, middos, relationships, history, or practical Jewish living?', meta: 'Yesterday · 42 replies' },
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
    name: 'Teens Who Play Sports',
    category: 'Sports',
    communityType: 'lifestyle',
    privacy: 'Public',
    location: 'Five Towns courts and gyms',
    follower_count: 386,
    trending: true,
    postsToday: 11,
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
  return {
    ...c,
    typeKey,
    category,
    communityType: c.communityType || (category === 'Support' ? 'support' : 'user'),
    privacy: c.privacy || 'Public',
    memberCount: c.follower_count || c.memberCount || 0,
    joined: joinedIds.has(c.id) || Boolean(c.joined),
    joinedIncognito: Boolean(membership?.incognito || membership?.hide_membership || c.joinedIncognito),
    hideMembership: Boolean(membership?.hide_membership || c.hideMembership),
    postsToday: c.postsToday || c.posts_this_week || 0,
    growth: c.growth || '',
    engagement: c.engagement || '',
    dailyPrompt: c.dailyPrompt || '',
    quickActions: c.quickActions || typeConfig.prompts,
    posts: c.posts || [],
    identityTags: c.identityTags || [typeConfig.label, c.privacy || 'Public'],
  };
}

export default function Communities() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCommunityId, setSelectedCommunityId] = useState(null);

  useEffect(() => {
    if (selectedCommunityId) window.scrollTo({ top: 0, behavior: 'instant' });
  }, [selectedCommunityId]);

  const [showCreate, setShowCreate] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [joiningId, setJoiningId] = useState(null);
  const [optimisticJoins, setOptimisticJoins] = useState(new Set());
  const [optimisticLeaves, setOptimisticLeaves] = useState(new Set());
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [view, setView] = useState('discover');

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

  const communities = useMemo(() => {
    const effectiveJoined = new Set([...joinedIds, ...optimisticJoins]);
    optimisticLeaves.forEach((id) => effectiveJoined.delete(id));
    const backendCommunities = rawCommunities.map((community) => adaptCommunity(community, effectiveJoined, membershipsByCommunity));
    const backendIds = new Set(backendCommunities.map((community) => community.id));
    const seeds = EXPERIENCE_SEEDS
      .filter((seed) => !backendIds.has(seed.id))
      .map((seed) => adaptCommunity(seed, effectiveJoined, membershipsByCommunity));
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

  const yourCommunities = filteredCommunities.filter((community) => community.joined);
  const discoverCommunities = filteredCommunities.filter((community) => !community.joined);
  const discoverGroups = COMMUNITY_TYPE_OPTIONS
    .map((type) => ({
      ...type,
      communities: discoverCommunities.filter((community) => community.typeKey === type.key),
    }))
    .filter((group) => group.communities.length > 0);

  const joinedCount = communities.filter((community) => community.joined).length;

  const visibleIdentityTags = useMemo(() => {
    const tagSet = new Set();
    yourCommunities
      .filter((c) => !c.hideMembershipDefault && !c.joinedIncognito)
      .forEach((c) => (c.identityTags || []).forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).slice(0, 12);
  }, [yourCommunities]);

  const handleJoin = async (communityId, options = {}) => {
    const community = communities.find((item) => item.id === communityId);
    if (!community) return;

    const isSeedCommunity = communityId.startsWith('seed-');
    if (!currentUser || isSeedCommunity) {
      toast.success(options.incognito ? 'Previewed as a private join' : community.joined ? 'Preview left' : 'Preview joined');
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
          role: 'Member',
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

  const createCommunity = async (formData) => {
    if (!currentUser) return;
    try {
      const created = await dataService.entities.Community.create({
        name: formData.name,
        description: formData.description,
        type: getCommunityTypeKey({ category: formData.category }),
        category: formData.category,
        communityType: formData.communityType,
        privacy: formData.privacy,
        location: formData.location || 'Local community',
        follower_count: 1,
        supportsIncognito: formData.supportsIncognito,
        supportsAnonymousPosting: formData.supportsAnonymousPosting,
        hideMembershipDefault: formData.hideMembershipDefault,
      });
      await dataService.entities.UserCommunity.create({
        user_id: currentUser.id,
        community_id: created.id,
        role: 'Admin',
      });
      queryClient.invalidateQueries({ queryKey: ['communities-list'] });
      queryClient.invalidateQueries({ queryKey: ['communities-memberships', currentUser?.id] });
      setSelectedCommunityId(created.id);
      setShowCreate(false);
      toast.success('Community created!');
    } catch {
      toast.error('Failed to create community');
    }
  };

  if (selectedCommunity) {
    return (
      <CommunityHubDetail
        community={selectedCommunity}
        currentUser={currentUser}
        onBack={() => setSelectedCommunityId(null)}
        onToggleJoin={(options) => handleJoin(selectedCommunity.id, options)}
        joiningId={joiningId}
      />
    );
  }

  return (
    <main className="app-page mobile-safe-bottom">
      <div className="mobile-page-wide px-3 pb-6 pt-3 sm:px-4 sm:pt-4">
        <Hero
          joinedCount={joinedCount}
          onCreate={() => setShowCreate(true)}
          onMessages={() => setShowMessages(true)}
        />

        <IdentityStrip
          tags={visibleIdentityTags}
          communities={yourCommunities}
          onOpen={setSelectedCommunityId}
        />

        <ViewSwitch view={view} onChange={setView} joinedCount={joinedCount} />

        <SearchBar
          query={query}
          onQueryChange={setQuery}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
        />

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
                subtitle="Your joined spaces, kept in one easy place."
                icon={Sparkles}
                communities={yourCommunities}
                emptyTitle="No joined communities yet"
                emptyBody="Switch to Discover and join a community that fits how you want to connect."
                onOpen={setSelectedCommunityId}
                onJoin={handleJoin}
                joiningId={joiningId}
              />
            ) : (
              discoverGroups.length > 0 ? (
                discoverGroups.map((group) => (
                  <CommunitySection
                    key={group.key}
                    title={group.pluralLabel || group.label}
                    subtitle={group.tagline}
                    icon={group.icon}
                    communities={group.communities}
                    onOpen={setSelectedCommunityId}
                    onJoin={handleJoin}
                    joiningId={joiningId}
                  />
                ))
              ) : (
                <CommunitySection
                  title="Discover"
                  subtitle="No new communities match this view right now."
                  icon={Search}
                  communities={[]}
                  emptyTitle="Nothing new to discover here"
                  emptyBody="Try another type filter, or switch to My Communities to open the spaces you already joined."
                  onOpen={setSelectedCommunityId}
                  onJoin={handleJoin}
                  joiningId={joiningId}
                />
              )
            )}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateCommunityForm
          categories={CREATE_CATEGORIES}
          onCreate={createCommunity}
          onClose={() => setShowCreate(false)}
        />
      )}

      <MessagesDrawer
        currentUser={currentUser}
        open={showMessages}
        onClose={() => setShowMessages(false)}
      />
    </main>
  );
}

function Hero({ joinedCount, onCreate, onMessages }) {
  return (
    <section className="surface-panel mb-4 overflow-hidden rounded-[24px]">
      <div className="grid gap-0 sm:grid-cols-[1fr_auto]">
        <div className="relative p-4">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-blue-700">
            <Sparkles className="h-3.5 w-3.5" />
            Community hub
          </div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">Communities</h1>
            <PageHelp text="Communities define what you care about, where you belong, and who you connect with." />
          </div>
          <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
            Discover focused Jewish spaces for chesed, shuls, learning, parents, neighborhoods, events, and everyday connection.
          </p>
          <HeroPill label={`${joinedCount} joined`} />
        </div>
        <div className="border-t border-slate-200 bg-slate-50/80 p-4 sm:border-l sm:border-t-0 sm:w-64">
          <div className="grid gap-2">
            <button onClick={onCreate} className="motion-press inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-white">
              <Plus className="h-4 w-4" />
              Create Community
            </button>
            <button onClick={onMessages} className="motion-press inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700">
              <MessageCircle className="h-4 w-4" />
              Community Messages
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroPill({ label }) {
  return <span className="mt-3 inline-flex rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700">{label}</span>;
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

function IdentityStrip({ tags, communities = [], onOpen }) {
  return (
    <section className="surface-panel-soft mb-4 rounded-[24px] p-4">
      <h2 className="text-base font-black text-slate-950">Active in...</h2>
      <p className="mt-1 text-sm font-semibold text-slate-500">Jump back into every community you joined, then keep your visible identity tags underneath.</p>
      <div className="mobile-scroll-x mt-3 flex gap-2 pb-1">
        {communities.length > 0 ? communities.map((community) => (
          <button
            key={`active-community-${community.id}`}
            type="button"
            onClick={() => onOpen?.(community.id)}
            className="motion-press flex min-w-[180px] shrink-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-[12px] font-black text-white">
              {(community.name || '?').split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-black text-slate-950">{community.name}</span>
              <span className="block truncate text-[11px] font-bold text-slate-500">{community.category || community.communityType || 'Community'}</span>
            </span>
          </button>
        )) : (
          <span className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs font-black text-slate-500">
            Join communities and they will live here for fast access.
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {tags.length > 0 ? tags.map((tag, index) => (
          <span key={`${tag}-${index}`} className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">{tag}</span>
        )) : (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-500">Join visible communities to build your identity stack</span>
        )}
        <span className="rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700">Private spaces stay hidden</span>
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

function CommunitySection({ title, subtitle, icon: Icon, communities, emptyTitle, emptyBody, onOpen, onJoin, joiningId }) {
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
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {communities.map((community) => (
          <CommunityHubCard
            key={community.id}
            community={community}
            loading={joiningId === community.id}
            onOpen={() => onOpen(community.id)}
            onToggleJoin={(options) => onJoin(community.id, options)}
          />
          ))}
        </div>
      )}
    </section>
  );
}
