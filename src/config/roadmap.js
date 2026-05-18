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
 * PROMPT FIELD — REQUIRED FOR AI-IMPLEMENTABLE ITEMS
 * ---------------------------------------------------
 * The `prompt` field powers the "Copy Prompt" button in /FutureFeatures.
 * Any entry that an AI agent could implement MUST include a `prompt`.
 * A missing prompt means the Copy Prompt button silently disappears.
 *
 * Required format:
 *   prompt: `You are implementing X for JUnited.
 *
 *   Context: <relevant files, migrations, existing code>
 *
 *   Goals:
 *   1. ...
 *   N. Update src/config/roadmap.js: change this item's status to 'shipped'.`
 *
 * Omit ONLY if the item is genuinely manual-only (e.g., "set up billing account").
 * If omitting, add a comment in the entry explaining why.
 *
 * Run `npm run check-prompts` to verify all applicable entries have prompts.
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
    status: STATUS.SHIPPED,
    priority: PRIORITY.MEDIUM,
    title: 'Push Notifications',
    description: 'Browser and mobile push notifications for messages, mitzvah updates, and community activity.',
    shippedNote: 'Shipped. push_subscriptions table, src/lib/pushSubscription.js client helpers, supabase/functions/push-notify Edge Function (web-push@3 + VAPID), toggle in Settings Notifications section, push subscribe on onboarding completion. Respects notification_preferences and notifications_enabled per user.',
  },

  {
    id: 'notification-system-improvements',
    category: 'Auth & Identity',
    status: STATUS.SHIPPED,
    priority: PRIORITY.MEDIUM,
    title: 'Notifications System — Round 2',
    description: 'Actor enrichment, realtime updates, new notification types (likes, comments, mentions), swipe-to-mark-read, and deep-link reliability.',
    shippedNote: 'Shipped. (1) actor_display_name + actor_avatar_url columns on notifications table (migration 20260516205535); (2) new notify methods: notifyPostLiked, notifyPostCommented, notifyUserMentioned; (3) CommentsSheet dead Edge Function calls replaced with direct notificationsService calls; (4) ReactionBar fires notifyPostLiked on new like; (5) Notifications page has realtime subscription via dataService.entities.Notification.subscribe; (6) SwipeableNotifCard with vertical-intent detection for right-swipe-to-mark-read; (7) actor avatar badge on type icon; (8) getNotificationRoute() shared deep-link helper in src/lib/notificationRoute.js; (9) NotificationCenter uses navigate() instead of window.location.href.',
  },

  {
    id: 'notification-aggregation',
    category: 'Auth & Identity',
    status: STATUS.SHIPPED,
    priority: PRIORITY.LOW,
    title: 'Notification Aggregation',
    description: 'Group multiple similar notifications (e.g. "5 people liked your post") instead of one row per event.',
    shippedNote: 'Shipped. Migration 20260517025900 adds aggregate_key and aggregate_count columns plus a SECURITY DEFINER RPC (upsert_aggregated_notification) for atomic upsert. Client calls RPC instead of plain INSERT for post_liked, post_commented, comment_reply, community_activity. Body is pluralized in SQL ("Alice and 3 others liked your post"). listForUser now sorts by updated_at so aggregated rows bubble to top. Count badge shown in both Notifications.jsx and NotificationCenter.jsx.',
    prompt: `You are implementing Notification Aggregation for JUnited.

Context:
- Notifications table: supabase/migrations/005_notifications_system.sql
  Columns include: id, user_id, actor_id, actor_display_name, actor_avatar_url, type, title, body, post_id, conversation_id, data, is_read, created_at
- Notification service: src/services/notificationsService.js — buildNotification(), create(), and individual notify* methods
- Notification UI: src/pages/Notifications.jsx (full-page inbox) and src/components/notifications/NotificationCenter.jsx (sheet)
- Active notification types that benefit most from aggregation: post_liked, post_commented, comment_reply, community_activity

Goals:
1. Add aggregation support to the notifications table:
   - Add a migration with columns: aggregate_key text (nullable), aggregate_count int default 1
   - aggregate_key format: "{type}:{target_id}" e.g. "post_liked:post-uuid"
2. Update notificationsService.js buildNotification() and create() to:
   - Compute aggregate_key for aggregatable types (post_liked, post_commented, community_activity)
   - Before inserting, check for an existing unread notification with the same (user_id, aggregate_key)
   - If found: UPDATE that row — increment aggregate_count, update actor_display_name to "X and N others", update body, set updated_at
   - If not found: INSERT as normal
3. Update src/pages/Notifications.jsx NotifCard body rendering to handle plural actor text:
   - "Alice liked your post" (count=1) → "Alice and 4 others liked your post" (count=5)
4. Update src/components/notifications/NotificationCenter.jsx similarly.
5. Ensure mark-as-read still works correctly on aggregated rows (marks the single row).
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
    status: STATUS.SHIPPED,
    priority: PRIORITY.MEDIUM,
    title: 'Saved Posts / Bookmarks',
    description: 'Users can save posts to revisit them. Accessible from their profile.',
    shippedNote: 'Shipped. Migration 20260517030617_bookmarks.sql creates the bookmarks table with unique (user_id, post_id) constraint and RLS (users manage only their own). Bookmark entity added to SUPABASE_ENTITY_TABLES. BookmarkButton.jsx with optimistic toggle added to standard feed, help, listing, and compact card variants in UnifiedPostCard. SavedPostsSection.jsx rewritten with direct Supabase query, remove-bookmark button, clickable cards (→ PostDetail), defensive date parsing, and correct section header. Section added to Profile.jsx (own profile only).',
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
    status: STATUS.SHIPPED,
    priority: PRIORITY.MEDIUM,
    title: 'Message Requests',
    description: 'Inbox for message requests from users you do not follow, with accept/decline.',
    shippedNote: 'Migration created (20260517033459_message_requests.sql), MessageRequest entity mapped in base44Client.js, Inbox/Requests tab switcher added to Messages.jsx with red badge for pending count. Accept converts request to real conversation and switches to Inbox.',
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

  {
    id: 'mitzvah-recurring-needs',
    category: 'Chesed & Mitzvah',
    status: STATUS.PLANNED,
    priority: PRIORITY.MEDIUM,
    title: 'Recurring Mitzvah Needs & Saved Filters',
    description: 'Support repeat chesed needs, saved mitzvah searches, and alerts for categories a user wants to help with.',
    why: 'The Mitzvah Circle redesign clarified the MVP browse taxonomy, but recurring rides, weekly visits, meal slots, and saved category alerts need real backend support before they should appear as live features.',
    prompt: `You are implementing recurring mitzvah needs and saved filters for JUnited.

Context: MitzvahCircle currently groups existing mitzvah_requests categories into UI browse groups only.

Goals:
1. Audit the existing mitzvah_requests, mitzvah_offers, notifications, and user privacy/RLS patterns.
2. Create migrations for recurring_mitzvah_requests and saved_mitzvah_filters with RLS.
3. Add entity mappings in base44Client.js and service helpers in the existing mitzvah service layer.
4. Add optional recurrence controls to the create-request flow without making the default form heavier.
5. Add saved filter alerts only after notification preferences are production-backed.
6. Verify recurring requests do not create duplicate spam and can be paused by the creator.
7. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
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

  {
    id: 'candle-lighting-minhag-offset',
    category: 'Jewish Life',
    status: STATUS.PLANNED,
    priority: PRIORITY.LOW,
    title: 'User-Selectable Candle-Lighting Offset',
    description: 'Let users choose their community\'s candle-lighting offset (e.g., 18 min standard Ashkenazi, 15 min Sephardic, 30 min, 40 min Jerusalem-area). Currently hardcoded to 18 minutes.',
    why: 'Shipped 2026-05-17: candle-lighting times now use actual GPS/saved location via Hebcal API. The offset is correctly set to 18 min but is not user-configurable. Different communities use different offsets and one-size-fits-all is not fully accurate for all minhagim.',
    prompt: `You are implementing user-selectable candle-lighting offset for JUnited.

Context:
  - src/lib/hebrewDate.js — CANDLE_LIGHTING_MINUTES constant (currently 18) is the \`b\` parameter passed to the Hebcal /shabbat API endpoint
  - src/lib/shabbatLocation.js — stores candle location preference; add offset here too (STORAGE_KEY: 'junited_candle_location')
  - src/hooks/useShabbatLocation.js — exposes setManualCity/requestGPS; add setOffset(minutes)
  - src/pages/Settings.jsx — Candle-lighting location card (added 2026-05-17); add offset picker here
  - src/services/shabbatReminderService.js — reads stored location including offset for getShabbatTimes call

Goals:
1. Add an \`offset\` field to the stored candle location object in shabbatLocation.js (default 18).
2. Add a getStoredCandleOffset() helper that reads the offset from the stored location (fallback: 18).
3. Update getShabbatTimes() in hebrewDate.js to accept an optional \`offsetMinutes\` param (default: CANDLE_LIGHTING_MINUTES).
4. Update shabbatReminderService.js to pass the stored offset to getShabbatTimes().
5. Update useShabbatLocation.js hook to expose setOffset(minutes) and return current offset.
6. Add an offset picker in the Settings Candle-lighting location card: chips for 15 / 18 / 20 / 30 / 40 min with a label explaining what each represents.
7. Update the countdown widget (DailyRetentionPrompt chip in Feed.jsx) to show the offset if it differs from the default.
8. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'candle-lighting-yom-tov',
    category: 'Jewish Life',
    status: STATUS.SHIPPED,
    priority: PRIORITY.MEDIUM,
    title: 'Yom Tov & Holiday Candle-Lighting Times',
    description: 'Extend the candle-lighting feature to show Yom Tov candle-lighting times for major holidays (Rosh Hashana, Yom Kippur, Sukkot, Pesach, Shavuot). The Hebcal API already returns holiday events — this just needs to be surfaced in the UI.',
    shippedNote: 'Shipped 2026-05-17: getShabbatTimes() updated to return allCandles, allHavdalah, and majorHolidays arrays. useShabbosCountdown() now iterates all events, shows "Shavuot", "Rosh Hashana", etc. instead of "Candle lighting" during holiday weeks, and handles two-day Yom Tov (2 candles, 1 havdalah). Yom Kippur covered by general Yom Tov logic.',
    why: 'Hebcal /shabbat returns candles+havdalah for both Shabbat and Yom Tov. Live API audit on Erev Shavuot 5786 confirmed two candle items and one final havdalah.',
    prompt: `You are implementing Yom Tov candle-lighting times for JUnited.

Context:
  - src/lib/hebrewDate.js — getShabbatTimes() calls the Hebcal /shabbat endpoint which also returns holiday items
  - The Hebcal /shabbat endpoint returns category:'candles' items for both Shabbat and Yom Tov
  - src/hooks/useShabbatLocation.js — location and offset management
  - src/pages/Feed.jsx — useShabbosCountdown() drives the DailyRetentionPrompt chip

Goals:
1. Audit: verify that getShabbatTimes() already returns Yom Tov candle-lighting items from Hebcal (it may already handle this — check the API response for a holiday week).
2. If Yom Tov items are already in the response, update useShabbosCountdown() to handle multiple candles/havdalah items in the same week (e.g., two-day Yom Tov).
3. Update the countdown chip label to reflect Yom Tov (e.g., "Rosh Hashana" instead of "Candle lighting") using the candleTitle from the API.
4. Handle the Yom Kippur case (no actual candles but still a candle-lighting time).
5. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'candle-lighting-location-sync',
    category: 'Jewish Life',
    status: STATUS.DEFERRED,
    priority: PRIORITY.LOW,
    title: 'Sync Candle-Lighting Location to User Profile',
    description: 'Currently the candle-lighting location preference is stored in localStorage only (device-specific). Syncing it to the user profile in Supabase would make it available across devices.',
    why: 'Deferred 2026-05-17: localStorage is correct for privacy (location is sensitive) and sufficient for most single-device use. Cross-device sync adds a migration and raises data-residency considerations. Revisit once the feature has real usage.',
    prompt: `You are syncing the candle-lighting location preference to the Supabase user profile for JUnited.

Context:
  - src/lib/shabbatLocation.js — STORAGE_KEY 'junited_candle_location', setCandleLocation(), getStoredCandleLocation()
  - src/hooks/useShabbatLocation.js — reads/writes localStorage via shabbatLocation.js helpers
  - supabase/migrations/ — schema changes go here as timestamped SQL files
  - src/api/supabaseClient.js — for direct Supabase queries

Goals:
1. Create a migration adding a candle_location JSONB column (nullable) to the profiles table.
2. Update setCandleLocation() / getStoredCandleLocation() to also read/write to the profiles table when the user is authenticated.
3. On login, hydrate localStorage from the profile's candle_location if localStorage is empty.
4. On change, write to both localStorage and the profiles table (optimistically, with silent error handling).
5. Keep localStorage as the authoritative read source for speed; Supabase as the sync layer.
6. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
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
    status: STATUS.SHIPPED,
    priority: PRIORITY.LOW,
    title: 'Business Owner Analytics & Richer Editing',
    description: 'Dashboard for claimed business owners: view traffic, update hours, manage photos, respond to reviews.',
    shippedNote: 'Shipped. Migration 20260517034050_business_owner_tools.sql adds view_count, business_hours, business_reviews, and owner/admin role support. Map.jsx exposes Owner Tools for approved business managers.',
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
    shippedNote: 'Shipped. Migration 20260515180122_local_updates_automation.sql + cron job. Cron secret verified in 20260515184322. Community post identity fix (migration 20260517034309) added community name denormalization to publish_local_update_item so feed cards show community as author.',
  },

  {
    id: 'feed-author-enrichment',
    category: 'Automation & AI',
    status: STATUS.DEFERRED,
    priority: PRIORITY.LOW,
    title: 'Feed Post Author Enrichment via JOIN',
    description: 'Replace author denormalization with a Supabase view (posts + profiles + communities JOIN) so feed cards always reflect current author/community name even after renames.',
    why: 'Current approach writes author_name at publish time — stale if community is later renamed. Low priority while community renames are rare and the app is in beta. Build when data quality at scale becomes a concern.',
    prompt: `You are implementing feed post author enrichment via JOIN for JUnited.

Context:
- Posts table stores author_name (denormalized at write time) and community_id (UUID only).
- Feed query: dataService.entities.UnifiedPost.list() → supabase.from('posts').select('*').
- There is no posts_feed_view or join-based enrichment yet.

Goals:
1. Create a Postgres view posts_feed_view that joins posts + profiles (on user_id) + communities (on community_id).
   Include: all post columns, display_name as profile_display_name, avatar_url as profile_avatar_url,
            communities.name as community_name_fresh, communities.logo_url as community_logo_fresh.
2. Add 'PostFeedView' entity to SUPABASE_ENTITY_TABLES pointing at posts_feed_view (read-only).
3. Update the Feed.jsx query to use PostFeedView instead of UnifiedPost.
4. Update toAppRow to prefer community_name_fresh and profile_display_name when present.
5. Ensure writes still go to posts (not the view) — view is read-only.
6. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
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
    prompt: `You are implementing the AI Community Setup Wizard for JUnited.

Context: Community creation currently uses a manual form. Find it by searching for
        "CreateCommunity" or the community creation modal/page in src/. This task adds an
        optional AI-assisted path that suggests name, description, type, and tags from a
        short natural-language description. This is EXPLORING-status — ship a basic version
        and measure before committing to full build.

Goals:
1. Add an "AI Setup" toggle/button to the existing community creation form.
2. When enabled, show a 2-step wizard:
   Step 1: Free-text input — "Describe your community in a sentence or two."
   Step 2: AI-generated suggestions for name, type, description, privacy setting, and 3 tags.
3. Create a Supabase Edge Function \`ai-community-suggest\` that:
   - Accepts { userDescription: string } in the request body (require auth header)
   - Calls Anthropic API (claude-haiku-4-5-20251001 for cost efficiency)
   - Returns { name, communityType, description, privacySetting, suggestedTags: string[] }
   - Validates and sanitizes the AI response before returning
4. Allow the user to accept, edit individual fields, or regenerate suggestions.
5. Add a boolean \`ai_assisted\` column to the communities table (nullable, default false)
   via a new timestamped migration — set it to true when the wizard is used.
6. Keep the standard manual path fully intact; AI wizard is purely opt-in.
7. Run npm run lint && npm run typecheck && npm run build.
8. Update src/config/roadmap.js: change this item's status to 'shipped' if the basic version works.`,
  },

  // ── Growth & Monetization ─────────────────────────────────────────────────

  {
    id: 'payments',
    category: 'Growth & Monetization',
    status: STATUS.SHIPPED,
    priority: PRIORITY.HIGH,
    title: 'Payments & Checkout (Stripe)',
    description: 'One-time support/donation payments via Stripe Checkout. SupportJUnited page with 3 tiers, PaymentModal for generic donation flows, transactions table with RLS, webhook handler.',
    shippedNote: `Code complete 2026-05-17. Two Edge Functions deployed: create-checkout-session (validates amounts server-side, creates Stripe session, inserts pending transaction) and stripe-webhook (verifies signature, marks transaction completed). ThankYou page shows processing vs confirmed state driven by webhook, not browser redirect. In-app entry points added 2026-05-17: (1) Settings → App section — polished card with heart icon, description, and chevron; (2) Feed header — subtle rose heart icon button in the top-right utility cluster alongside Search and Notifications. SupportJUnited page redesigned 2026-05-17: chai-based pricing ($18/$36/$72), mission-driven copy, no fake perks, custom amount option (min $5, server-validated). LIVE requires manual Stripe dashboard setup: add STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET to Supabase Edge Function secrets and register the webhook endpoint.`,
  },

  {
    id: 'community-store',
    category: 'Growth & Monetization',
    status: STATUS.DEFERRED,
    priority: PRIORITY.MEDIUM,
    title: 'Community Store / Paid Community Transactions',
    description: 'Digital storefront for communities to sell merchandise, tickets, and fundraise using Stripe Connect, not direct JUnited donation checkout.',
    why: 'Deferred until the Stripe Connect payout foundation is built. The old PaymentModal can collect money for JUnited only; it must not be used for marketplace/community recipient payments because funds need to route to connected recipients with an application fee.',
    prompt: `You are implementing the Community Store for JUnited.

Context: CommunityStoreTab.jsx exists. CommunityDetailView already has a 'listings' tab that
        renders it when allow_member_listings is enabled. Do not use the old PaymentModal for this.
        This must use the Stripe Connect platform payment foundation once it is shipped.

Goals:
1. Verify community_listings table migration exists; create if not.
2. Wire CommunityListing entity in base44Client.js.
3. Add a community_orders table with buyer_id, community_id, listing_id, amount_cents,
   currency, status, stripe_checkout_session_id, stripe_payment_intent_id,
   destination_connected_account_id, application_fee_amount, created_at, updated_at.
4. Connect CommunityStoreTab.jsx to real data (list, create, purchase).
5. Integrate purchases through the Stripe Connect payment function, using destination charges
   with transfer_data.destination and application_fee_amount.
6. Add admin UI in CommunityAdminCenter for managing store items and viewing orders.
7. Run npm run lint && npm run typecheck && npm run build.
8. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'stripe-subscriptions',
    category: 'Growth & Monetization',
    status: STATUS.SHIPPED,
    priority: PRIORITY.LOW,
    title: 'Recurring Supporter Subscriptions (Secondary)',
    description: 'Optional monthly/annual supporter tiers for users who want to support JUnited directly. This is not the primary SaaS monetization model; Premium Communities are primary.',
    shippedNote: `Code complete 2026-05-17. New: (1) migration 20260517200000_subscriptions — adds stripe_customer_id to profiles + subscriptions table with full lifecycle columns; (2) create-subscription-session Edge Function — auth required, creates/retrieves Stripe Customer, resolves Price IDs from STRIPE_PRICE_{TIER}_{MONTHLY|ANNUAL} secrets, returns checkoutUrl; (3) create-portal-session Edge Function — opens Stripe Customer Portal, returns portalUrl; (4) stripe-webhook extended — handles checkout.session.completed (subscription branch), invoice.paid, invoice.payment_failed, customer.subscription.updated, customer.subscription.deleted; (5) SupportJUnited.jsx — One-time / Monthly / Annual segmented toggle, annual savings shown (2 months free, exact math), custom amount hidden for recurring modes; (6) paymentsService.js — createSubscriptionCheckout, createPortalSession, getActiveSubscription; (7) Settings → Account — "Manage Subscription" row with tier/interval/cancel status, opens portal. Product correction 2026-05-17: this should remain optional "Support JUnited" funding, not the main subscription model. Future premium community billing must use a separate community-scoped subscription model instead of reusing this user-supporter table blindly. LIVE requires: create 6 Stripe Prices (supporter/builder/champion × monthly/annual), add price IDs as Supabase Edge Function secrets (STRIPE_PRICE_SUPPORTER_MONTHLY etc.), configure Stripe Customer Portal in dashboard, add checkout.session.completed + invoice.paid + invoice.payment_failed + customer.subscription.updated + customer.subscription.deleted to the stripe-webhook endpoint in Stripe dashboard.`,
    prompt: `You are implementing Recurring Supporter Subscriptions (Stripe) for JUnited.

Context: One-time payments are live. Key files:
  - supabase/functions/create-checkout-session/index.ts — one-time Stripe Checkout
  - supabase/functions/stripe-webhook/index.ts — webhook handler (marks transactions completed)
  - supabase/migrations/20260517191230_transactions.sql — transactions table schema
  - src/services/paymentsService.js — frontend service (thin wrapper over supabase.functions.invoke)
  - src/pages/SupportJUnited.jsx — support page with $18/$36/$72 tiers + custom amount

Prerequisites (manual setup required before this prompt):
  - Create monthly and annual Stripe Prices in the Stripe dashboard for each tier.
  - Add the Price IDs as Supabase Edge Function secrets (e.g. STRIPE_PRICE_SUPPORTER_MONTHLY).

Goals:
1. Create a timestamped migration adding a \`subscriptions\` table:
   user_id, stripe_subscription_id, stripe_customer_id, tier, status (active/canceled/past_due),
   current_period_end, created_at, updated_at.
2. Create a Supabase Edge Function \`create-subscription-session\` that:
   - Authenticates the user via Bearer token
   - Creates or retrieves a Stripe Customer for the user (store customer ID in profiles or new table)
   - Creates a Stripe Checkout session with mode: 'subscription' using the requested Price ID
   - Returns { checkoutUrl }
3. Extend \`stripe-webhook\` (or create \`stripe-subscription-webhook\`) to handle:
   - checkout.session.completed (subscription mode) → upsert subscriptions row
   - customer.subscription.updated → update status and current_period_end
   - customer.subscription.deleted → set status to 'canceled'
4. Update SupportJUnited.jsx to add a Monthly/Annual billing toggle above the tier cards.
   Monthly = current tiers; Annual = ~17% discount (2 months free). Show savings clearly.
5. Add a "Manage Subscription" row in Settings → Account section that links to the Stripe
   Customer Portal (create a \`create-portal-session\` Edge Function that returns { portalUrl }).
6. Update paymentsService.js to expose createSubscriptionCheckout({ tier, interval }).
7. Run npm run lint && npm run typecheck && npm run build.
8. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'subscription-status-ui',
    category: 'Growth & Monetization',
    status: STATUS.SHIPPED,
    priority: PRIORITY.LOW,
    title: 'Subscription Status on Support Page',
    description: 'When a logged-in user already has an active subscription, SupportJUnited should show their current tier/interval and a link to manage it — not the full tier picker again.',
    why: 'Without this, a subscriber who revisits the page may accidentally start a second checkout. A personalized "You\'re supporting at the Builder level — manage or upgrade" state is both safer and more delightful.',
    shippedNote: 'Shipped 2026-05-17. SupportJUnited fetches getActiveSubscription() on mount for logged-in users, shows a skeleton while loading, then renders a subscriber card (tier/interval, renewal/cancels date, past_due warning) with "Manage or cancel" (opens portal) and "Upgrade or switch tier" (reveals tier picker pre-set to current interval). In upgrade mode, the CTA opens the portal for plan switching rather than creating a duplicate subscription.',
    prompt: `You are adding a subscription-aware state to SupportJUnited for JUnited.

Context:
  - src/pages/SupportJUnited.jsx — the support page (billingMode toggle, tier cards, CTA)
  - src/services/paymentsService.js — exposes getActiveSubscription() and createPortalSession()
  - The getActiveSubscription() call returns { tier, interval, status, current_period_end, cancel_at_period_end } or null.

Goals:
1. At the top of SupportJUnited, call paymentsService.getActiveSubscription() (show a loading skeleton while fetching).
2. If the user has an active/trialing subscription, replace the tier picker + CTA with a "You're already supporting JUnited" card:
   - Show their current tier and interval (e.g. "Community Builder · Monthly")
   - Show the next renewal date formatted as "Renews {date}" or "Cancels {date}" if cancel_at_period_end is true
   - A "Manage or cancel" button that calls paymentsService.createPortalSession() and redirects to the portal URL
   - A "Upgrade tier" link/button that dismisses the card and shows the tier picker so they can switch plans
3. If no subscription (or user not logged in), show the existing UI unchanged.
4. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'subscription-admin-metrics',
    category: 'Growth & Monetization',
    status: STATUS.SHIPPED,
    priority: PRIORITY.LOW,
    title: 'Supporter Subscription Metrics in Admin Dashboard',
    description: 'Supporter-only subscription analytics in AdminAnalyticsDashboard. Premium community subscription analytics should be tracked separately once built.',
    shippedNote: 'Shipped 2026-05-17. Added "Supporters" tab to AdminAnalyticsDashboard. KPI row: Active Subscribers, MRR ($X/mo with ARR sub-label), Annual Plan count (% of active), Past Due. Tier breakdown table (Supporter/Community Builder/Champion with subscriber count + MRR/mo). Monthly vs Annual split with CSS progress bars and MRR contribution per interval. New subscriptions per week (8-week BarChart, rose color). All data from a direct supabase.from("subscriptions") query in the existing loadData() Promise.all — gracefully returns [] if table not yet migrated so other tabs stay functional. MRR formula: monthly=$18/$36/$72, annual=$15/$30/$60 (annual ÷ 12). Product correction 2026-05-17: these are supporter metrics only, not the future Premium Communities SaaS metrics.',
    prompt: `You are adding subscription metrics to AdminAnalyticsDashboard for JUnited.

Context:
  - src/pages/AdminAnalyticsDashboard.jsx — the admin analytics page
  - supabase/migrations/20260517200000_subscriptions.sql — subscriptions table schema
  - Monthly amounts: supporter=$18, builder=$36, champion=$72. Annual amounts: 180/360/720 (stored in subscriptions table as interval column).
  - Query the subscriptions table (service role or admin RLS policy already allows admin reads).

Goals:
1. Add a "Supporters" section/tab in AdminAnalyticsDashboard.
2. Show: total active subscribers, MRR (sum of monthly equivalents), breakdown by tier, breakdown by interval (monthly vs annual), and count of past_due subscriptions.
3. MRR formula: for each active/trialing row, annualAmount/12 if interval='annual', else monthlyAmount.
4. Show a simple time series of new subscriptions per week (last 8 weeks) as a bar chart or sparkline.
5. All data comes from a direct Supabase query (admin role); no new Edge Function needed.
6. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'premium-community-plans',
    category: 'Growth & Monetization',
    status: STATUS.SHIPPED,
    priority: PRIORITY.HIGH,
    title: 'Premium Community Plans',
    description: 'SaaS-style paid community subscriptions for community owners/admins. Free communities remain useful, while Premium unlocks advanced admin, automation, branding, events/resources/listings, and growth tools.',
    why: 'This is the primary subscription model for JUnited. The existing recurring supporter subscription is secondary and should not be used to determine community feature access.',
    shippedNote: 'Shipped 2026-05-17. Added community_plan_subscriptions plus community plan state fields, owner/admin-only Stripe Checkout and Billing Portal Edge Functions, webhook sync for community-scoped subscriptions, Community Admin Center Billing UI, Premium gating for Events/Resources/Marketplace/Group Chat, and separate Premium Communities analytics.',
    prompt: `You are implementing Premium Community Plans for JUnited.

Context:
  - Existing supporter subscriptions live in supabase/migrations/20260517200000_subscriptions.sql
    and are user-level optional support subscriptions. Do not reuse that table blindly for
    community feature gating.
  - Community settings live on communities and CommunityAdminCenter.jsx.
  - Community templates live in src/lib/communityTypes.js.
  - Stripe Edge Functions currently exist for supporter checkout:
    create-subscription-session, create-portal-session, stripe-webhook.

Goals:
1. Create a migration for community_plan_subscriptions:
   id, community_id, purchaser_user_id, stripe_customer_id, stripe_subscription_id,
   stripe_price_id, plan_key ('community_premium'), billing_interval ('monthly'|'annual'),
   status ('active'|'trialing'|'past_due'|'canceled'|'incomplete'), current_period_start,
   current_period_end, cancel_at_period_end, canceled_at, created_at, updated_at.
2. Add community premium state fields or a derived view:
   communities.plan_key default 'free', communities.plan_status default 'free',
   communities.plan_current_period_end nullable. Keep these synchronized from webhooks.
3. Create create-community-plan-checkout Edge Function:
   - Auth required.
   - Verify the user is owner/admin of the community.
   - Create/reuse a Stripe Customer for the purchaser.
   - Create a Stripe Checkout Session mode='subscription' using configured Premium Community Price IDs.
   - Include community_id and purchaser_user_id in metadata.
4. Extend stripe-webhook to handle community plan subscription events separately from supporter subscriptions.
5. Add CommunityAdminCenter billing UI:
   - Free plan summary.
   - Upgrade to Premium CTA.
   - Current plan status, renewal/cancel date, payment issue state.
   - Manage billing portal button.
6. Gate Premium-only community features in UI from community plan state, not from currentUser.subscription_status.
7. Add admin analytics for Premium Communities separately from Supporters.
8. Run npm run lint && npm run typecheck && npm run build.
9. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'stripe-connect-payout-foundation',
    category: 'Growth & Monetization',
    status: STATUS.PLANNED,
    priority: PRIORITY.HIGH,
    title: 'Stripe Connect Payout Foundation',
    description: 'Recipient onboarding and payout setup for users, communities, and businesses that receive money through JUnited. The user-facing language should be "Set up payouts" or "Connect bank account," not "create a Stripe account."',
    why: 'Required before JUnited can safely process in-app payments to community/business/user recipients and take platform fees.',
    prompt: `You are implementing the Stripe Connect payout foundation for JUnited.

Context:
  - Current Stripe checkout functions route money only to JUnited.
  - Business listings use business_listings/business_managers.
  - Communities use communities/community_memberships.
  - Individual users are profiles.
  - Use current Stripe Connect best practice: Accounts v2 where supported, explicit account
    responsibilities, and Stripe-hosted or embedded onboarding. Do not expose secret keys
    in the frontend.

Goals:
1. Create tables:
   - connected_payout_accounts:
     id, owner_type ('user'|'community'|'business'), owner_id, created_by,
     stripe_connected_account_id, onboarding_status, payouts_enabled,
     charges_enabled, requirements_currently_due jsonb, default_currency,
     country, created_at, updated_at.
   - connected_payout_account_members:
     id, payout_account_id, user_id, role ('owner'|'admin'), created_at.
2. Add RLS:
   - Owners/admins can read their payout account.
   - Only server/RPC can insert/update Stripe account IDs and verification status.
3. Create Edge Function create-connect-onboarding-session:
   - Auth required.
   - Verify the requester can manage the target user/community/business.
   - Create or retrieve the Stripe connected account.
   - Return either a Stripe-hosted onboarding URL or embedded Account Session client secret.
4. Use UI language:
   - "Set up payouts"
   - "Connect bank account"
   - "Finish payout setup"
   Avoid "you need your own Stripe account" in normal user-facing copy.
5. Add lightweight payout setup UI in:
   - business owner dashboard,
   - Community Admin Center billing/payments area,
   - future user payout settings for Mitzvah reimbursement flows.
6. Store and refresh payout status from Stripe account requirements through a webhook or server refresh function.
7. Run npm run lint && npm run typecheck && npm run build.
8. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'connect-platform-payments-application-fees',
    category: 'Growth & Monetization',
    status: STATUS.PLANNED,
    priority: PRIORITY.HIGH,
    title: 'Stripe Connect In-App Payments & Application Fees',
    description: 'JUnited marketplace-style payments where a payer pays in-app, the recipient receives funds through Connect payouts, and JUnited takes an application/platform fee.',
    why: 'This is the foundation for event payments, paid listings/services, business transactions, and approved payment flows inside communities.',
    needs: 'stripe-connect-payout-foundation',
    prompt: `You are implementing Stripe Connect in-app payments and application fees for JUnited.

Context:
  - Existing create-checkout-session routes payments to JUnited only.
  - Stripe Connect payout foundation must already exist.
  - Community events, community listings, and business listings are production-backed.

Goals:
1. Create platform_payments table:
   id, payer_user_id, recipient_owner_type ('user'|'community'|'business'),
   recipient_owner_id, connected_payout_account_id, amount_cents, currency,
   application_fee_amount_cents, fee_basis_points, payment_type
   ('event_ticket'|'community_listing'|'business_payment'|'mitzvah_reimbursement'|'contribution'),
   related_entity_type, related_entity_id, status
   ('pending'|'requires_action'|'paid'|'failed'|'refunded'|'canceled'),
   stripe_checkout_session_id, stripe_payment_intent_id, stripe_transfer_id,
   created_at, updated_at, completed_at.
2. Create create-connect-checkout-session Edge Function:
   - Auth required.
   - Validate the related entity and amount server-side.
   - Verify the recipient has payouts enabled.
   - Create a Checkout Session with mode='payment'.
   - Use Connect destination charges with transfer_data.destination and application_fee_amount
     for single-recipient payments.
   - Store a pending platform_payments row.
3. Extend stripe-webhook for platform payment completion/failure/refund events.
4. Add application fee configuration in code or a platform_settings table:
   - Start with a simple percentage plus optional minimum fee.
   - Keep fees transparent in checkout summaries.
5. Replace any old PaymentModal usage for community/business recipient payments with the Connect flow.
6. Add receipt/record UI so users see payment status inside JUnited.
7. Run npm run lint && npm run typecheck && npm run build.
8. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'mitzvah-payments-reimbursements',
    category: 'Growth & Monetization',
    status: STATUS.DEFERRED,
    priority: PRIORITY.MEDIUM,
    title: 'Mitzvah Reimbursements & Contributions',
    description: 'Careful in-app payment flows for reimbursements, voluntary contributions, or community fundraising tied to Mitzvah requests.',
    why: 'Potentially valuable, but product-sensitive. Mitzvah Circle should not become a gig marketplace by accident. Build only after Connect payouts and platform payments are stable.',
    needs: ['stripe-connect-payout-foundation', 'connect-platform-payments-application-fees'],
    prompt: `You are implementing Mitzvah reimbursement and contribution payments for JUnited.

Context:
  - Mitzvah requests are managed through mitzvahService and MitzvahCircle.jsx.
  - Stripe Connect payout foundation and platform_payments must already be shipped.
  - This feature must preserve the chesed/community-help tone and avoid turning Mitzvah Circle
    into a generic labor marketplace.

Goals:
1. Audit Mitzvah request types and identify only payment-appropriate flows:
   - reimburse groceries/medicine/errands,
   - contribute to a verified community need,
   - optional thank-you contribution where appropriate.
2. Add fields to mitzvah_requests only if needed:
   reimbursement_allowed boolean, requested_amount_cents nullable,
   payment_recipient_owner_type, payment_recipient_owner_id.
3. Add UI language that says "Reimburse" or "Contribute" instead of "Pay for help"
   except in explicitly paid-service contexts.
4. Use platform_payments with payment_type='mitzvah_reimbursement' or 'contribution'.
5. Add completion states tied to payment records where helpful:
   requested, paid, reimbursed, completed.
6. Add guardrails:
   - clear disclosure of optionality,
   - no pressure language,
   - report/moderation path for abuse.
7. Run npm run lint && npm run typecheck && npm run build.
8. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'in-app-payment-retention-trust-layer',
    category: 'Growth & Monetization',
    status: STATUS.PLANNED,
    priority: PRIORITY.MEDIUM,
    title: 'In-App Payment Trust & Retention Layer',
    description: 'UX and policy system that makes in-app payments easier and more useful than Zelle/Venmo without pretending off-platform payment can be fully prevented.',
    why: 'JUnited can encourage in-app payment through convenience, records, status, receipts, admin visibility, and safer workflows, but should not overpromise enforcement.',
    needs: 'connect-platform-payments-application-fees',
    prompt: `You are implementing the in-app payment trust and retention layer for JUnited.

Context:
  - platform_payments must already be shipped.
  - Existing UI includes comments, messages, community events, listings, and Mitzvah flows.

Goals:
1. Add clear in-app payment benefits in payment-eligible contexts:
   - receipt stored in JUnited,
   - payment-linked completion state,
   - admin/community record,
   - easier refund/dispute/support path,
   - no need to exchange payment handles.
2. Add payment_status displays on eligible event/listing/mitzvah cards where a user is involved.
3. Add light policy copy discouraging payment handles in transaction contexts when an in-app
   payment option exists. Do not over-block ordinary conversation.
4. Add moderation/report signal for suspicious payment-handle pressure.
5. Add admin/community transaction summaries where relevant.
6. Run npm run lint && npm run typecheck && npm run build.
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
    id: 'in-app-feedback',
    category: 'Admin & Platform',
    status: STATUS.SHIPPED,
    priority: PRIORITY.HIGH,
    title: 'In-App Feedback System',
    description: 'Global floating Feedback button visible throughout the authenticated app opens a polished bottom-sheet form. Submissions captured in app_feedback table with rich page context. Admin Feedback Inbox at /AdminFeedbackInbox for reviewing, triaging, and noting submissions. Includes Spam/Junk bucket, rule-based junk signal detection, deterministic triage summary, Copy Fix Prompt, and status/type/urgency filters.',
    shippedNote: 'Shipped. FeedbackModal in Layout.jsx. Migration 20260516170012_app_feedback.sql (schema) + 20260516195749_feedback_inbox_junk.sql (is_junk column). AdminFeedbackInbox: Inbox/Junk tabs, 6 client-side junk heuristics (advisory only, never auto-move), triage summary from structured fields, Copy Fix Prompt for Claude Code/Codex, status/type/urgency filters. Floating button now uses the shared responsive floating-actions stack so it does not collide with Feed create-post controls.',
  },

  {
    id: 'desktop-responsive-shell',
    category: 'Admin & Platform',
    status: STATUS.PLANNED,
    priority: PRIORITY.MEDIUM,
    title: 'Desktop Responsive App Shell',
    description: 'Evolve the current mobile-first shell into a more intentional wide-screen experience, potentially with a desktop side navigation, wider content regions for dense pages, and page-specific responsive layouts.',
    why: 'The shared floating-actions layer stabilizes mobile and desktop positioning, but the broader desktop experience is still mostly a widened mobile frame. This is useful after the mobile beta is stable.',
    prompt: `You are implementing the Desktop Responsive App Shell for JUnited.

Context: The app is mobile-first. Key layout files:
  - src/Layout.jsx — app shell, bottom nav (fixed, z-50), floating actions stack
  - src/index.css — layout utilities: mobile-page (max-w-2xl), mobile-page-wide, app-fixed-layer,
                    app-floating-stack, glass-toolbar, --app-bottom-nav-height CSS variable
  - tailwind.config.js — breakpoints (sm: 640px, md: 768px, lg: 1024px, xl: 1280px)

Goals:
1. At ≥1024px (lg breakpoint), replace the fixed bottom nav with a left sidebar nav:
   - Width: 72px collapsed (icon-only) or 220px expanded
   - Same 5 nav items, same active-state logic
   - Remove bottom padding (mobile-safe-bottom) on desktop — no bottom nav means no offset needed
2. Widen key content regions with responsive max-widths:
   - Feed → max-w-2xl (unchanged, feels editorial)
   - Communities → max-w-4xl with optional 2-column grid for community cards
   - Map → full-width (already works)
   - Messages → max-w-3xl sidebar+thread layout
   - Profile → max-w-3xl
3. Move floating action buttons (Create Post, Feedback) to bottom-right on desktop using the
   existing FloatingActionsContext — update --app-floating-bottom and --app-floating-gutter
   CSS variables at the lg breakpoint.
4. Ensure Settings, Community detail, and chat pages remain clean at 1280px.
5. All changes must be purely additive via Tailwind responsive prefixes (lg:, xl:).
   Mobile layout must be completely unaffected.
6. Run npm run lint && npm run typecheck && npm run build.
7. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'hide-on-scroll-header-extension',
    category: 'Admin & Platform',
    status: STATUS.SHIPPED,
    priority: PRIORITY.LOW,
    title: 'Primary Destination Header Consistency',
    description: 'Universal app-shell header consistency across major JUnited pages. Feed, Mitzvah Circle, Communities, Map, and Profile use the same persistent glass-toolbar header primitive, while page interiors remain specialized.',
    shippedNote: 'Updated 2026-05-17 after UX architecture review. The earlier hide-on-scroll approach made Feed/Communities behave differently from Map and felt arbitrary. Replaced it with a persistent DestinationHeader shared by all five primary destinations; removed the unused useHideOnScroll hook. Map now sits on the same app-page background so the header reads as glass, and Mitzvah/Profile keep their hero-led interiors below the shared top shell.',
  },

  {
    id: 'mitzvah-circle-glass-header',
    category: 'Admin & Platform',
    status: STATUS.DROPPED,
    priority: PRIORITY.LOW,
    title: 'MitzvahCircle Glass-Toolbar Header',
    description: 'Apply the same glass-toolbar sticky header pattern to MitzvahCircle that was applied to Communities (2026-05-17). Currently the h1 title and Post Request button are buried inside a scrollable card in the content area.',
    why: 'Dropped 2026-05-17 after the broader page-shell review. Mitzvah Circle should remain mission/hero-led, not gain a duplicate utility header. Its future polish should focus on hero/card rhythm and sticky activity controls inside the shared shell.',
  },

  {
    id: 'map-window-scroll-redesign',
    category: 'Admin & Platform',
    status: STATUS.DROPPED,
    priority: PRIORITY.LOW,
    title: 'Map Page Window-Scroll Architecture Redesign',
    description: 'Map currently uses flex h-dvh with an overflow-y-auto inner container. This prevents hide-on-scroll from working on the Map header. A future redesign to use window scroll would enable hide-on-scroll consistency with Feed/Communities, but requires a significant layout change.',
    why: 'Dropped 2026-05-17 after the broader page-shell review. Map should keep its internal scroll/fixed-height map architecture; Feed and Communities now match Map with persistent headers instead of forcing Map into hide-on-scroll.',
  },

  {
    id: 'ai-feedback-triage',
    category: 'Admin & Platform',
    status: STATUS.PLANNED,
    priority: PRIORITY.LOW,
    title: 'AI-Assisted Feedback Triage (Future)',
    description: 'Connect the Feedback Inbox to an LLM to auto-summarize free-text feedback, suggest priority, detect duplicate themes, and draft responses. The current free rule-based system is the foundation — a paid AI layer would read the same app_feedback table and write AI-generated summaries to an admin-only field.',
    why: 'Free rule-based triage is live and sufficient for beta. AI adds value only once feedback volume is high enough to warrant the cost.',
    needs: ['Paid AI inference budget (Anthropic or OpenAI)', 'ANTHROPIC_API_KEY or OPENAI_API_KEY added to Supabase Edge Function secrets'],
    prompt: `You are implementing AI-Assisted Feedback Triage for JUnited.

Context: Key files:
  - src/pages/AdminFeedbackInbox.jsx — the admin feedback inbox UI
  - supabase/migrations/20260516170012_app_feedback.sql — app_feedback table schema
    (columns: id, user_id, page_context, category, message, urgency, status, is_junk, created_at)
  - supabase/migrations/20260516195749_feedback_inbox_junk.sql — is_junk column
  The current triage is rule-based client-side heuristics in AdminFeedbackInbox.jsx.

Prerequisites (must be done manually before running this prompt):
  - Add ANTHROPIC_API_KEY to Supabase Edge Function secrets (preferred) OR OPENAI_API_KEY.
  - Confirm billing is active for the chosen provider.

Goals:
1. Create a timestamped migration adding \`ai_summary text\` (nullable) to app_feedback.
2. Create a Supabase Edge Function \`triage-feedback\` (no JWT required — triggered server-side):
   - Accepts { feedbackId: string } in the request body
   - Reads the feedback row from app_feedback using the service role
   - Calls Anthropic API (claude-haiku-4-5-20251001) with the message, category, urgency, page_context
   - Generates a 1–2 sentence plain-English summary and a suggested priority (low/medium/high/urgent)
   - Updates app_feedback SET ai_summary = '...' WHERE id = feedbackId
3. Wire the Edge Function to trigger on new app_feedback INSERT via a Supabase Database Webhook
   pointing to the triage-feedback function URL.
4. In AdminFeedbackInbox.jsx, show ai_summary below the message if present:
   - Style it as a subtle italic note prefixed with "AI:" in slate-400
   - Only show to admins (the page is already admin-gated)
5. Add a "Re-triage" button per feedback row to manually re-trigger triage for a submission.
6. Run npm run lint && npm run typecheck && npm run build.
7. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'ios-app-store-readiness',
    category: 'Admin & Platform',
    status: STATUS.SHIPPED,
    priority: PRIORITY.HIGH,
    title: 'iOS App Store Readiness Admin Tool',
    description: 'Structured admin tool at /AdminiOSReadiness for tracking iOS App Store submission progress. Static catalog of ~55 required and optional tasks across 10 categories (build setup, auth, account management, privacy, metadata, legal, UI, performance, app review). Persistent per-task status/notes via ios_app_store_readiness_progress table. AI copy prompts for AI-executable tasks, numbered manual steps for human tasks. Overall readiness score with progress bar.',
    shippedNote: 'Shipped. Config: src/config/iosReadiness.js. Page: src/pages/AdminiOSReadiness.jsx. Migration: 20260516175045_ios_app_store_readiness_progress.sql. Route: /AdminiOSReadiness under AdminRoute.',
  },

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
