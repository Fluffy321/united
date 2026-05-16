/**
 * JUnited Product Roadmap — single source of truth.
 *
 * MAINTENANCE RULE
 * ----------------
 * This file must be updated whenever a task:
 *   - ships a feature listed here → change status to 'shipped', add shippedNote
 *   - defers a feature → change status to 'deferred', fill in 'why'
 *   - removes a not-yet-built feature from scope → change status to 'dropped'
 *   - introduces a meaningful new future idea → add a new entry here
 *   - changes product direction on any item here
 *
 * The final report for any such task must explicitly state whether this file
 * was updated and what changed.
 *
 * See also: CLAUDE.md at the project root.
 */

export const STATUS = {
  PLANNED:   'planned',    // Committed to building; not started
  DEFERRED:  'deferred',   // Good idea but intentionally postponed
  EXPLORING: 'exploring',  // Worth investigating; no commitment yet
  BLOCKED:   'blocked',    // Ready to build but needs a dependency first
  SHIPPED:   'shipped',    // Done and live in production
  DROPPED:   'dropped',    // No longer pursuing
};

export const PRIORITY = {
  HIGH:   'high',
  MEDIUM: 'medium',
  LOW:    'low',
};

export const CATEGORY_ORDER = [
  'Auth & Identity',
  'Community',
  'Messaging',
  'Chesed & Mitzvah',
  'Jewish Life',
  'Businesses & Map',
  'Automation & AI',
  'Growth & Monetization',
  'Admin & Platform',
];

// ─── Roadmap entries ──────────────────────────────────────────────────────────

export const ROADMAP = [

  // ── Auth & Identity ──────────────────────────────────────────────────────

  {
    id: 'google-signin',
    category: 'Auth & Identity',
    status: STATUS.SHIPPED,
    priority: PRIORITY.HIGH,
    title: 'Google Sign-In',
    description: 'OAuth sign-in via Google using Supabase auth provider.',
    shippedNote: 'Shipped. Login.jsx + Supabase OAuth. Profile bootstrap uses Google user_metadata.',
  },

  {
    id: 'username-uniqueness',
    category: 'Auth & Identity',
    status: STATUS.SHIPPED,
    priority: PRIORITY.HIGH,
    title: 'Username Uniqueness Enforcement',
    description: 'DB-level unique constraint on usernames with real-time availability check in onboarding and settings.',
    shippedNote: 'Shipped. Migration 20260515235129. RPC check_username_available. OnboardingFlow + Settings UI updated.',
  },

  {
    id: 'apple-signin',
    category: 'Auth & Identity',
    status: STATUS.PLANNED,
    priority: PRIORITY.HIGH,
    title: 'Apple Sign-In',
    description: 'Sign in with Apple ID. Required for App Store compliance when a native iOS app is released.',
    why: 'Not needed for the web beta. Prioritize before any native iOS release.',
    prompt: `You are implementing Apple Sign-In for JUnited.

Context: Google OAuth is already working via Supabase (Login.jsx). Follow the same pattern.

Goals:
1. Enable Apple provider in Supabase Authentication → Providers.
2. Add a "Continue with Apple" button in Login.jsx, styled similarly to the Google button.
3. Call supabase.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: getAuthRedirectUrl() } }).
4. Ensure new Apple OAuth users go through OnboardingFlow (onboarding_complete: false).
5. Bootstrap profile from user_metadata (full_name, email) if present.
6. Test: sign in fresh, verify onboarding fires, verify profile is created in profiles table.
7. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'push-notifications',
    category: 'Auth & Identity',
    status: STATUS.PLANNED,
    priority: PRIORITY.MEDIUM,
    title: 'Push Notifications',
    description: 'Browser and mobile push notifications for messages, mitzvah updates, and community activity.',
    why: 'Deferred pending user base growth. Service worker exists in /public.',
    prompt: `You are implementing Push Notifications for JUnited.

Context: A service worker already exists at /public/sw.js. Supabase is the backend.

Goals:
1. Add Notification.requestPermission() call in onboarding (Notifications step) and Settings.
2. Store push subscription endpoint in a push_subscriptions table (user_id, endpoint, keys).
3. Create a Supabase Edge Function push-notify that accepts { user_id, title, body } and sends via Web Push.
4. Trigger notifications for: new messages, mitzvah request updates, community @mentions.
5. Respect notification_preferences from the profiles table.
6. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

  // ── Community ─────────────────────────────────────────────────────────────

  {
    id: 'community-admin-center',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.HIGH,
    title: 'Community Admin Center v2',
    description: 'Full admin center for community owners: moderation, members, modules, analytics, settings.',
    shippedNote: 'Shipped. CommunityAdminCenter.jsx covers overview, content, members, moderation, appeals, modules, settings.',
  },

  {
    id: 'community-group-chat',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.HIGH,
    title: 'Community Group Chat',
    description: 'Real-time group chat tab within communities, toggled per-community by admins.',
    shippedNote: 'Shipped. GroupChatSection.jsx wired into CommunityDetailView. allow_group_chat toggle in Admin Center.',
  },

  {
    id: 'community-resource-library',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.MEDIUM,
    title: 'Community Resource Library',
    description: 'Resource library tab for sharing files and links within a community.',
    shippedNote: 'Shipped. CommunityResourceLibrary.jsx wired into CommunityDetailView. allow_resources toggle in Admin Center.',
  },

  {
    id: 'community-events-tab',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.MEDIUM,
    title: 'Community Events Tab',
    description: 'Events tab within community pages, with admin controls to create events.',
    shippedNote: 'Shipped. CommunityEventsTab.jsx wired into CommunityDetailView. allow_member_events toggle in Admin Center.',
  },

  {
    id: 'poll-voting',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.MEDIUM,
    title: 'Poll Voting',
    description: 'Polls within posts, with real vote tracking and prevention of duplicate votes.',
    shippedNote: 'Shipped. Migration 20260515031648_poll_votes.sql. poll_votes table with unique constraint.',
  },

  {
    id: 'community-scoped-reports',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.HIGH,
    title: 'Community-Scoped Reports & Moderation Queue',
    description: 'Members can report posts/users within a community. Admins review via moderation queue.',
    shippedNote: 'Shipped. Migration 20260515031655. AdminModerationQueue.jsx is live. Community appeals system built.',
  },

  {
    id: 'events-system',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.MEDIUM,
    title: 'Standalone Events System',
    description: 'Full events pages: event listings, RSVP, calendar view, MyEvents, and ticket support. (Community-level events tab is already shipped.)',
    shippedNote: 'Shipped. /Events queries community_events for user\'s followed communities. /MyEvents shows going RSVPs + created events. /CommunityCalendar redirects to /Events. EventTicketSection reused for RSVP. Routes live in App.jsx.',
    prompt: `You are implementing the standalone Events System for JUnited.

Context: Community-level events (CommunityEventsTab.jsx) are already live. These are the
standalone cross-community events pages which are currently redirecting to Feed.

Goals:
1. Re-add Events page (/Events) to App.jsx — it already exists as src/pages/Events.jsx.
2. Re-add MyEvents (/MyEvents) and CommunityCalendar (/CommunityCalendar) routes.
3. Wire community_event_rsvps table: ensure CommunityEvent and CommunityEventRSVP entities exist in base44Client.js.
4. Connect Events.jsx to real DB data (filter by upcoming start_date, communities the user follows).
5. Connect MyEvents.jsx to events the user has RSVP'd to.
6. Add RSVP create/cancel flow in CommunityEventsTab and Events pages.
7. Add EventSummaryButton AI feature (optional — gate behind AI being live).
8. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'community-groups',
    category: 'Community',
    status: STATUS.PLANNED,
    priority: PRIORITY.MEDIUM,
    title: 'Community Groups & Sub-Groups',
    description: 'Private groups within communities, with posts, chat, resources, and member management.',
    why: 'Good idea but not needed for initial community growth. Build after communities reach meaningful membership.',
    prompt: `You are implementing Community Groups for JUnited.

Context: The Groups page exists at src/pages/Groups.jsx but is disabled (redirects to Communities).
        CommunityGroupPage.jsx exists but is not routed.

Goals:
1. Create migrations: community_groups, group_members, group_posts tables with RLS.
2. Wire GroupMember, GroupPost entities in base44Client.js SUPABASE_ENTITY_TABLES.
3. Re-add /Groups route to App.jsx and pages.config.js.
4. Connect CommunityGroupPage.jsx to real DB data.
5. Add join/leave group flows with role management (owner, member).
6. Groups should be discoverable from the community detail page.
7. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'saved-posts',
    category: 'Community',
    status: STATUS.DEFERRED,
    priority: PRIORITY.MEDIUM,
    title: 'Saved Posts / Bookmarks',
    description: 'Users can save posts to revisit them. Accessible from their profile.',
    why: 'SavedPostsSection.jsx is built and queries bookmarks table. Not exposed in Profile.jsx UI. Deferred to keep profile simple for beta.',
    prompt: `You are enabling Saved Posts / Bookmarks in JUnited.

Context: SavedPostsSection.jsx (src/components/profile/SavedPostsSection.jsx) already exists and
        queries a bookmarks table. It just needs to be exposed in the Profile page.

Goals:
1. Add a "Saved" tab or section to Profile.jsx that renders <SavedPostsSection userId={user.id} />.
2. Verify the bookmarks table exists in Supabase (check migrations — if not, create it).
3. Add a "Save" button to post cards (UnifiedPostCard or similar) that inserts/removes a bookmark row.
4. Ensure RLS: users can only read/write their own bookmarks.
5. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'newsletter-system',
    category: 'Community',
    status: STATUS.DEFERRED,
    priority: PRIORITY.LOW,
    title: 'Newsletter System',
    description: 'Community newsletter subscriptions, admin composer, and email distribution.',
    why: 'Resend is the email provider. Defer until community sizes justify curated newsletters.',
    prompt: `You are implementing the Newsletter System for JUnited.

Context: NewsletterComposer.jsx exists in src/components/groups/. newsletter_subscribers and
        newsletter_logs tables may exist in migrations. The email provider is Resend.

Goals:
1. Verify newsletter_subscribers and newsletter_logs tables exist; create migrations if not.
2. Wire NewsletterSubscriber, NewsletterLog entities in base44Client.js.
3. Create a subscribe/unsubscribe flow in community detail pages.
4. Wire NewsletterComposer.jsx behind the community admin center.
5. Create a Supabase Edge Function send-newsletter that calls Resend API.
6. Add double-opt-in email confirmation.
7. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'community-updates-page',
    category: 'Community',
    status: STATUS.DROPPED,
    priority: PRIORITY.LOW,
    title: 'Dedicated Community Updates Page',
    description: 'A standalone page showing curated updates from followed communities.',
    why: 'The concept is absorbed by the main Feed (which filters by followed communities) and the Communities page. A separate page adds navigation complexity without enough added value.',
  },

  // ── Messaging ─────────────────────────────────────────────────────────────

  {
    id: 'message-requests',
    category: 'Messaging',
    status: STATUS.DEFERRED,
    priority: PRIORITY.MEDIUM,
    title: 'Message Requests',
    description: 'Inbox for message requests from users you do not follow, with accept/decline.',
    why: 'MessageRequestsTab.jsx is built and queries MessageRequest entity. Not wired into Messages.jsx UI. Deferred to keep messaging simple for beta.',
    prompt: `You are enabling Message Requests in JUnited.

Context: MessageRequestsTab.jsx (src/components/messages/MessageRequestsTab.jsx) is fully built.
        It uses dataService.entities.MessageRequest. It just needs to be wired into Messages.jsx.

Goals:
1. Verify message_requests table and MessageRequest entity exist in base44Client.js.
2. Add a "Requests" tab to Messages.jsx that renders <MessageRequestsTab currentUser={currentUser} onAccepted={...} />.
3. When a message is sent to a non-follower, create a MessageRequest row instead of a direct conversation.
4. Handle accept: convert the request into a real conversation.
5. Handle decline: mark the request as declined (do not surface again).
6. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

  // ── Chesed & Mitzvah ─────────────────────────────────────────────────────

  {
    id: 'meal-trains',
    category: 'Chesed & Mitzvah',
    status: STATUS.PLANNED,
    priority: PRIORITY.HIGH,
    title: 'Meal Train Requests',
    description: 'Coordinate meal deliveries for families in need, with slot sign-ups and notifications.',
    why: 'High community value for the Five Towns demographic. Build after core Mitzvah Circle stabilizes.',
    prompt: `You are implementing Meal Train Requests for JUnited.

Goals:
1. Create migrations: meal_train_requests (family, period, meals_needed, community_id, created_by) and
   meal_slots (train_id, date, claimed_by, notes) with RLS.
2. Wire MealTrainRequest, MealSlot entities in base44Client.js.
3. Create a MealTrains section inside MitzvahCircle as a new tab or card type.
4. Add claim-slot flow: user picks a date, system marks slot as taken.
5. Send notification to train creator when a slot is claimed.
6. Show meal trains on the MitzvahMap with a distinct icon.
7. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'ride-requests',
    category: 'Chesed & Mitzvah',
    status: STATUS.PLANNED,
    priority: PRIORITY.MEDIUM,
    title: 'Ride Requests & Carpool Board',
    description: 'Community carpool coordination — request a ride, offer a ride, match within the community.',
    why: 'CarpoolBoard.jsx exists as a stub. Build after Meal Trains to establish the chesed request pattern.',
    prompt: `You are implementing Ride Requests for JUnited.

Context: src/components/mitzvah/CarpoolBoard.jsx exists as a stub.

Goals:
1. Create ride_requests migration (from_location, to_location, date, seats_available, created_by, community_id) with RLS.
2. Wire RideRequest entity in base44Client.js.
3. Connect CarpoolBoard.jsx to real data.
4. Add a Carpool tab to MitzvahCircle (src/pages/MitzvahCircle.jsx).
5. Add create-ride-offer and request-ride flows within the carpool board.
6. Show ride requests on MitzvahMap.
7. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'chesed-hours',
    category: 'Chesed & Mitzvah',
    status: STATUS.PLANNED,
    priority: PRIORITY.MEDIUM,
    title: 'Chesed Hours & Verification',
    description: 'Track, verify, and log chesed hours for school submissions and community programs.',
    why: 'High value for schools and youth programs. Depends on Mitzvah completion verification workflow being stable.',
    prompt: `You are implementing Chesed Hours & Verification for JUnited.

Context: chesed_hours_logs, verification_requests, and mitzvah_completions tables may already
        exist in migrations. The old ChesedHoursDashboard was removed from MitzvahCircle during MVP cut.

Goals:
1. Verify or create chesed_hours_logs, verification_requests, mitzvah_completions migrations.
2. Wire ChesedLog, VerificationRequest, MitzvahCompletion entities in base44Client.js.
3. Re-add a "My Log" tab to MitzvahCircle with a rebuilt ChesedHoursDashboard.
4. When a mitzvah request is marked verified/complete, auto-create a ChesedLog entry.
5. Add CSV export of verified hours (for school submissions).
6. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

  // ── Jewish Life ───────────────────────────────────────────────────────────

  {
    id: 'yahrzeit-refuah',
    category: 'Jewish Life',
    status: STATUS.PLANNED,
    priority: PRIORITY.MEDIUM,
    title: 'Yahrzeit Manager & Tehillim Lists',
    description: 'Track yahrzeits with Hebrew calendar reminders, and maintain community refuah/tehillim lists.',
    why: 'High resonance with the target community. Routes exist (/yahrzeits, /tehillim) but redirect.',
    prompt: `You are implementing Yahrzeit and Tehillim features for JUnited.

Context: YahrzeitManager.jsx and RefuahList.jsx exist as page files. Routes currently redirect to Feed.

Goals:
1. Create yahrzeits migration (name, hebrew_name, hebrew_date, gregorian_date, relationship, user_id) with RLS.
2. Create refuah_requests migration (name, hebrew_name, condition, community_id, submitted_by) with RLS.
3. Wire Yahrzeit, RefuahRequest entities in base44Client.js.
4. Connect YahrzeitManager.jsx to real data; add add/edit/delete yahrzeit flow.
5. Connect RefuahList.jsx to real data; add submit refuah request flow.
6. Re-add /yahrzeits and /tehillim routes to App.jsx.
7. Add Hebrew calendar date display using a lightweight library or conversion utility.
8. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'shul-directory',
    category: 'Jewish Life',
    status: STATUS.DEFERRED,
    priority: PRIORITY.LOW,
    title: 'Shul Directory',
    description: 'Browse and search shul profiles with schedules, minyan times, and contact info.',
    why: 'The community system already lets shuls create their own community pages. A separate shul directory is redundant until there is demand for structured minyan data.',
    prompt: `You are implementing the Shul Directory for JUnited.

Context: ShulPage.jsx exists. The communities system already serves as an informal shul directory.
        Only build this if you want structured minyan time data separate from community posts.

Goals:
1. Create shuls migration (name, address, rabbi_name, phone, website, logo_url, schedule_json, minyan_times_json).
2. Wire Shul entity in base44Client.js.
3. Connect ShulPage.jsx (/ShulPage) to real data.
4. Add shul search to the Search page.
5. Link shul pages to corresponding community pages if they exist.
6. Re-add /ShulPage route to App.jsx.
7. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

  // ── Businesses & Map ──────────────────────────────────────────────────────

  {
    id: 'business-directory-mvp',
    category: 'Businesses & Map',
    status: STATUS.SHIPPED,
    priority: PRIORITY.HIGH,
    title: 'Business Directory MVP',
    description: 'Business listings integrated into the Map page, with search, filtering, claim requests, and business manager roles.',
    shippedNote: 'Shipped. Migration 20260516011532_business_directory_mvp.sql. BusinessMap component live in Map.jsx. business_listings, business_claim_requests, business_managers tables.',
  },

  {
    id: 'business-reviews',
    category: 'Businesses & Map',
    status: STATUS.DEFERRED,
    priority: PRIORITY.MEDIUM,
    title: 'Business Reviews & Ratings',
    description: 'Verified community members can leave reviews and ratings on business listings.',
    why: 'Deferred until the business directory has real usage. Reviews require moderation, which adds operational overhead before the product is validated.',
    prompt: `You are implementing Business Reviews & Ratings for JUnited.

Context: business_listings table is live. Business detail UI is in Map.jsx.

Goals:
1. Create business_reviews migration (business_id, reviewer_id, rating 1-5, body, status, created_at) with RLS.
2. Ensure only verified community members (profile.is_verified or membership) can review.
3. Wire BusinessReview entity in base44Client.js.
4. Add review form and review list to business detail panel in Map.jsx.
5. Add average rating display on business cards.
6. Add admin moderation for flagged reviews.
7. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'business-owner-tools',
    category: 'Businesses & Map',
    status: STATUS.PLANNED,
    priority: PRIORITY.LOW,
    title: 'Business Owner Analytics & Richer Editing',
    description: 'Dashboard for claimed business owners: view traffic, update hours, manage photos, respond to reviews.',
    why: 'Build after claim workflow has real usage in beta.',
    prompt: `You are implementing Business Owner Tools for JUnited.

Context: business_listings and business_managers tables are live. Claim flow exists in Map.jsx.

Goals:
1. Add a business owner dashboard accessible from the Map page when the user is a business_manager.
2. Show: listing views (requires a simple view_count column or a views table), claim status, reviews.
3. Allow owners to edit: hours, description, photos, contact info.
4. Show pending/approved claim request status.
5. Gate behind business_managers.role IN ('owner', 'admin').
6. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'business-promotions',
    category: 'Businesses & Map',
    status: STATUS.PLANNED,
    priority: PRIORITY.LOW,
    title: 'Business Promotions & Deals',
    description: 'Claimed businesses can post time-limited deals visible on the map and in the community feed.',
    why: 'Monetization opportunity. Defer until businesses are claimed and engaged.',
    prompt: `You are implementing Business Promotions for JUnited.

Goals:
1. Create business_promotions migration (business_id, title, description, discount, valid_from, valid_to, image_url).
2. Wire BusinessPromotion entity in base44Client.js.
3. Add promotion creation UI to the business owner dashboard.
4. Show active promotions as highlighted pins on BusinessMap.
5. Surface active promotions in the community Feed for communities near the business.
6. Optional: gate paid promotion features behind Stripe integration.
7. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'organization-pages',
    category: 'Businesses & Map',
    status: STATUS.DEFERRED,
    priority: PRIORITY.LOW,
    title: 'Organization Pages',
    description: 'Dedicated pages for Jewish organizations with member management and event listings.',
    why: 'The community system largely covers this. Build if there is demand for structured organizational profiles separate from community pages.',
    prompt: `You are implementing Organization Pages for JUnited.

Context: Organization.jsx exists as a page file. Route currently redirects to Feed.

Goals:
1. Create organizations migration (name, type, description, address, website, logo_url, contacts_json).
2. Wire Organization entity in base44Client.js.
3. Connect Organization.jsx to real data.
4. Link organizations to communities and business listings.
5. Re-add /Organization route to App.jsx.
6. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

  // ── Automation & AI ───────────────────────────────────────────────────────

  {
    id: 'five-towns-automation',
    category: 'Automation & AI',
    status: STATUS.SHIPPED,
    priority: PRIORITY.HIGH,
    title: 'Five Towns Local Updates Automation',
    description: 'Automated pipeline ingesting local updates from monitored sources and publishing to the local_updates feed.',
    shippedNote: 'Shipped. Migration 20260515180122_local_updates_automation.sql + cron job. Cron secret verified in 20260515184322.',
  },

  {
    id: 'mta-transit-ingestion',
    category: 'Automation & AI',
    status: STATUS.PLANNED,
    priority: PRIORITY.LOW,
    title: 'MTA / 511NY Transit Data Ingestion',
    description: 'Ingest real MTA and 511NY service alerts for the Five Towns area into the local updates feed.',
    why: 'High local value but requires API key agreements and parsing logic. Build after the local updates pipeline proves useful.',
    prompt: `You are implementing MTA / 511NY transit data ingestion for JUnited.

Context: The local_updates automation pipeline is already live (migration 20260515180122).
        New sources can be added as additional Edge Function triggers or cron jobs.

Goals:
1. Register for 511NY API access at 511ny.org/developers.
2. Create a Supabase Edge Function fetch-transit-alerts that calls the 511NY API.
3. Filter for Long Island / Five Towns service alerts (LIRR, relevant bus routes).
4. Insert new alerts into local_updates table with source='511ny'.
5. Schedule the function via pg_cron (every 15 minutes).
6. Deduplicate by external alert ID to avoid duplicate posts.
7. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'private-publishers',
    category: 'Automation & AI',
    status: STATUS.PLANNED,
    priority: PRIORITY.LOW,
    title: 'Private Publisher Integrations',
    description: 'Ingest content from local Five Towns news publishers (Five Towns Jewish Times, etc.) with permission.',
    why: 'Requires publisher agreements. Do not scrape without permission. Build after editorial relationships are established.',
    prompt: `You are implementing Private Publisher Integrations for JUnited.

Context: The local_updates automation pipeline is live. Publisher content requires written permission.

Goals:
1. Obtain written permission from publisher (Five Towns Jewish Times or similar) before proceeding.
2. Agree on content format: RSS feed, webhook, or direct submission API.
3. Create an Edge Function fetch-publisher-<name> that ingests from the agreed endpoint.
4. Insert content into local_updates or posts table with source='publisher:<name>' and a canonical URL.
5. Respect publisher's content license — link back, do not reproduce full articles without permission.
6. Schedule or webhook-trigger the function.
7. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'news-aggregation',
    category: 'Automation & AI',
    status: STATUS.DEFERRED,
    priority: PRIORITY.LOW,
    title: 'Jewish News Aggregation',
    description: 'Aggregate Jewish community news from public RSS feeds into a news section.',
    why: 'Local updates automation already covers the Five Towns angle. National Jewish news aggregation is lower priority and risks content/curation issues.',
    prompt: `You are implementing Jewish News Aggregation for JUnited.

Context: News.jsx exists as a page file. Route currently redirects to Feed.
        Local updates automation is already live — this is for broader national Jewish news.

Goals:
1. Create news_items and news_sources migrations.
2. Wire NewsItem, NewsSource entities in base44Client.js.
3. Create an Edge Function fetch-jewish-news that reads public RSS feeds (Jewish Press, Aish, etc.).
4. Insert new items into news_items; deduplicate by URL.
5. Schedule via pg_cron (every 2 hours).
6. Connect News.jsx (/News) to real data; re-add route to App.jsx.
7. Add admin interface for managing news sources.
8. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'ai-assistant',
    category: 'Automation & AI',
    status: STATUS.EXPLORING,
    priority: PRIORITY.LOW,
    title: 'AI Community Assistant',
    description: 'In-app AI chat to help users navigate the community, find resources, or get help with requests.',
    why: 'High potential but needs careful design: privacy (never pass private messages), cost (rate limiting), and quality (community-specific context). Exploring the right scope before committing.',
    prompt: `You are implementing the AI Community Assistant for JUnited.

Context: AIChatBubble.jsx exists in src/components/common/. src/lib/aiAgent.js has stubs.
        dataService.integrations.Core.InvokeLLM is a stub. Privacy is critical.

Goals:
1. Create a Supabase Edge Function ai-chat that accepts { message, community_id, user_id } and
   calls Anthropic Claude API (claude-sonnet-4-6 or later).
2. NEVER pass private message contents, personal reflections, or health data to the AI.
3. Give the AI community context: community name, type, and recent public post titles only.
4. Create ai_chat_messages table (user_id, community_id, role, content, created_at) with RLS.
5. Wire AIChatBubble.jsx to the real Edge Function.
6. Add rate limiting: max 20 AI requests per user per day.
7. Re-add AIChatBubble to the Feed page.
8. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'ai-community-setup',
    category: 'Automation & AI',
    status: STATUS.EXPLORING,
    priority: PRIORITY.LOW,
    title: 'AI Community Setup Wizard',
    description: 'AI-assisted flow for creating a new community: suggests name, type, description, and initial settings based on a few prompts.',
    why: 'Could dramatically lower the barrier to community creation. No implementation started. Exploring whether it meaningfully improves creation rates.',
  },

  // ── Growth & Monetization ─────────────────────────────────────────────────

  {
    id: 'payments',
    category: 'Growth & Monetization',
    status: STATUS.PLANNED,
    priority: PRIORITY.HIGH,
    title: 'Payments & Checkout (Stripe)',
    description: 'In-app payments for paid tasks, donations, premium community features, and the community store.',
    why: 'Needs Stripe account setup and STRIPE_SECRET_KEY in production Edge Function env. Blocker for Community Store and Verified Community.',
    prompt: `You are implementing Stripe Payments for JUnited.

Context: paymentsService.js, PaymentModal.jsx, SupportJUnited.jsx, and ThankYou.jsx exist
        as files. The current create-checkout call is a stub. Routes redirect to Feed.

Goals:
1. Set up Stripe account; add STRIPE_SECRET_KEY to Supabase Edge Function secrets.
2. Add VITE_STRIPE_PUBLISHABLE_KEY to .env.local / production env.
3. Create a Supabase Edge Function create-checkout-session that calls Stripe.
4. Wire paymentsService.createCheckout() to the real Edge Function.
5. Connect PaymentModal.jsx to real checkout.
6. Create a Stripe webhook handler Edge Function for payment completion events.
7. Re-add /SupportJUnited and /ThankYou routes.
8. Create transactions table (user_id, amount, stripe_session_id, purpose, status) with RLS.
9. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'community-store',
    category: 'Growth & Monetization',
    status: STATUS.BLOCKED,
    priority: PRIORITY.MEDIUM,
    title: 'Community Store',
    description: 'Digital storefront for communities to sell merchandise, tickets, and fundraise.',
    why: 'CommunityStoreTab.jsx exists but is deferred. Blocked on Stripe Payments being live first.',
    needs: 'payments',
    prompt: `You are implementing the Community Store for JUnited.

Context: CommunityStoreTab.jsx exists. CommunityDetailView already has a 'listings' tab that
        renders it when allow_member_listings is enabled. Stripe must be live first.

Goals:
1. Verify community_listings table migration exists; create if not.
2. Wire CommunityListing entity in base44Client.js.
3. Connect CommunityStoreTab.jsx to real data (list, create, purchase).
4. Integrate with Stripe for product purchases (create-checkout-session).
5. Add admin UI in CommunityAdminCenter for managing store items.
6. Track orders in a community_orders table.
7. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'verified-community',
    category: 'Growth & Monetization',
    status: STATUS.PLANNED,
    priority: PRIORITY.MEDIUM,
    title: 'Verified Community & Featured Badge',
    description: 'Premium verified badge for institutional communities (shuls, schools, orgs), and featured placement in discovery.',
    why: 'Revenue opportunity and trust signal. Design the verification criteria before building.',
    prompt: `You are implementing Verified Community upgrades for JUnited.

Context: FeaturedEligibilityChecker.jsx and VerifiedCommunityUpgrade.jsx exist.
        AdminToolsPanel.jsx is the integration point.

Goals:
1. Create verified_community_requests and featured_community_slots migrations.
2. Wire FeaturedCommunitySlot, FeaturedEligibilityLog entities in base44Client.js.
3. Add verification request flow in Community Admin Center.
4. Add admin approval UI in AdminModerationQueue or a new AdminVerificationQueue page.
5. Show verified badge on community cards and detail pages.
6. Show featured communities prominently in Communities discovery.
7. Optional: gate premium verification behind Stripe.
8. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'premium-analytics',
    category: 'Growth & Monetization',
    status: STATUS.BLOCKED,
    priority: PRIORITY.LOW,
    title: 'Group Premium Analytics',
    description: 'Analytics dashboard for community group admins: member growth, post engagement, and trend data.',
    why: 'Blocked on Community Groups being live first.',
    needs: 'community-groups',
    prompt: `You are implementing Premium Group Analytics for JUnited.

Context: GroupAnalyticsDashboard.jsx exists in src/components/groups/. Community Groups must
        be live first (src/config/roadmap.js id: 'community-groups').

Goals:
1. Connect GroupAnalyticsDashboard.jsx to real Supabase data.
2. Track post counts, member growth, and reaction totals from posts/reactions tables.
3. Add time-range filters (7d, 30d, 90d).
4. Gate analytics behind group admin role (group_members.role = 'admin').
5. Re-add GroupAnalyticsDashboard to CommunityGroupPage.jsx.
6. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

  // ── Admin & Platform ──────────────────────────────────────────────────────

  {
    id: 'admin-seed-hardening',
    category: 'Admin & Platform',
    status: STATUS.PLANNED,
    priority: PRIORITY.HIGH,
    title: 'Admin Seed Control: Harden or Remove',
    description: 'AdminSeedControl.jsx must be hardened with a production safety check or removed before public launch.',
    why: 'Currently behind AdminRoute but still accessible in production. Seeding demo communities in production is a data integrity risk.',
    prompt: `You are hardening or removing Admin Seed Control for JUnited.

Context: AdminSeedControl.jsx is at src/pages/AdminSeedControl.jsx. It is behind AdminRoute
        in App.jsx. It should not be accessible in production without a hard guard.

Decision required from the product owner: remove entirely, or keep with a production guard.

If hardening (keeping):
1. Add a production guard at the top of AdminSeedControl.jsx:
   if (import.meta.env.PROD) return <div>Not available in production.</div>;
2. Verify seedCommunitiesDirectory Edge Function does not exist in production.

If removing:
1. Delete src/pages/AdminSeedControl.jsx.
2. Remove AdminSeedControl from pages.config.js and App.jsx.
3. Remove ADMIN_PAGE_KEYS reference in App.jsx.

After completing either path:
1. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

];
