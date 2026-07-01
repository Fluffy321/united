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
 * The `prompt` field keeps implementation-ready tasks easy to hand to an AI agent.
 * Any entry that an AI agent could implement MUST include a `prompt`.
 * A missing prompt means the item is not ready to be picked up as an implementation task.
 *
 * Required format:
 *   prompt: `You are implementing X for JUnited.
 *
 *   Context: <relevant files, migrations, existing code>
 *
 *   Goals:
 *   1. ...
 *   N. Update internal/roadmap.js: change this item's status to 'shipped'.`
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

  // ── Growth & Activation ─────────────────────────────────────────────────

  {
    id: 'first-run-discovery-activation',
    category: 'Growth & Monetization',
    status: STATUS.SHIPPED,
    priority: PRIORITY.HIGH,
    title: 'First-Run Discovery & Activation Sprint',
    description: 'Make the first 3 minutes of JUnited feel personal and community-centered. New users with 0 joined communities are redirected to Communities Discover after onboarding. Feed shows a "Join your first community" banner for users with no communities. Communities Discover and empty search state include a "Don\'t see your shul?" card with a native share/copy invite for admins. Messages icon added persistently to the Feed header.',
    shippedNote: 'Shipped 2026-05-22. OnboardingFlow.jsx: passes _joinedCount in onComplete callback. App.jsx: after onboarding, navigates to /Communities if _joinedCount === 0. Feed.jsx: communitiesFetched flag tracks query resolution; zero-state banner (Users icon + "Join your first community" CTA → /Communities) shown when communityGroups.length === 0 and backend is live; MessageCircle icon added to Feed DestinationHeader actions. Communities.jsx: MissingCommunityCard component ("Don\'t see your shul?") renders in search empty-state and at the bottom of every Discover results list; uses navigator.share with clipboard fallback; pre-fills share message with search query if present.',
  },

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
    id: 'auth-onboarding-mobile-redesign',
    category: 'Auth & Identity',
    status: STATUS.SHIPPED,
    priority: PRIORITY.HIGH,
    title: 'Auth/Onboarding Screen — Mobile-First Two-Screen Redesign',
    shippedNote: 'Shipped 2026-05-20. Login.jsx fully rewritten from a side-by-side desktop split panel to a two-screen mobile-first flow. Screen 1 (Welcome): JUnited logo, "Built for Jewish community life" badge, h1 headline, 4-feature 2×2 grid (communities, chesed, trusted sharing, local discovery), dark trust card, "Get Started" + "Already have an account?" CTAs — no sign-in form visible. Screen 2 (Sign In/Sign Up): back button, compact logo, "Secure access" label, Google OAuth button, email/password form, create-account toggle. If ?from_url is present (ProtectedRoute redirect), welcome screen is skipped and mode initialises to signin directly. All existing auth logic preserved (Google OAuth, email/password, signup, timeout wrapper, open-redirect protection, PKCE callback loading screen). No side-by-side panels at any screen size. Build + lint clean.',
    description: 'Replace the side-by-side desktop split-panel login page with a warm, mobile-first two-screen auth flow tailored to JUnited identity.',
    why: 'The original login page was a generic SaaS split-panel that felt disconnected from the Jewish community product. The new flow surfaces JUnited value props first and puts sign-in a single tap away.',
  },

  {
    id: 'auth-welcome-cta-intent',
    category: 'Auth & Identity',
    status: STATUS.SHIPPED,
    priority: PRIORITY.MEDIUM,
    title: 'Login Welcome — "Get Started" Should Default to Sign Up',
    shippedNote: 'Shipped 2026-05-20. Single-line fix in Login.jsx: "Get Started" onClick changed from setMode(\'signin\') to setMode(\'signup\'). "Already have an account? Sign in" remains setMode(\'signin\'). Verified with Playwright in unauthenticated context: Get Started → Create account screen (Display name field visible, h2 "Create account"); Sign in CTA → Sign in screen (no Display name field, h2 "Sign in"); Back → Welcome; ?from_url → Sign in directly (welcome skipped). Lint + build clean.',
    description: 'The "Get Started" CTA on the welcome screen currently opens the sign-in form (mode="signin"). New users must then find the "Need an account?" toggle at the bottom. "Get Started" should open the create-account form directly (mode="signup") while "Already have an account? Sign in" opens the sign-in form.',
    why: 'Friction point for new user acquisition: when a new user clicks "Get Started" they land on the sign-in form, not a create-account form. The intent signals are clear — "Get Started" = new user, "Sign in" = returning user.',
    prompt: `You are improving the JUnited login welcome screen CTAs.

Context: src/pages/Login.jsx
  - Line ~268: "Get Started" button calls setMode('signin') — should call setMode('signup')
  - Line ~276: "Already have an account? Sign in" button calls setMode('signin') — correct
  - Screen 2 (mode === 'signin' || mode === 'signup') already handles both modes:
    - mode === 'signup' shows h2 "Create account" with name field shown
    - mode === 'signin' shows h2 "Sign in" with no name field

Goals:
1. Change "Get Started" button onClick to setMode('signup') instead of setMode('signin').
2. Verify Screen 2 h2 heading and form fields change correctly for signup mode.
3. Verify "Already have an account?" toggle on Screen 2 still switches to signin.
4. Run npm run lint && npm run build.
5. Update internal/roadmap.js: change this item's status to 'shipped'.`,
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
7. Update internal/roadmap.js: change this item's status to 'shipped'.`,
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
6. Update internal/roadmap.js: change this item's status to 'shipped'.`,
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
    id: 'community-announcements-official-updates',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.HIGH,
    title: 'Community Announcements / Official Updates',
    description: 'Official manager-created announcement posts for important community updates.',
    shippedNote: 'Shipped 2026-05-18. Reuses the existing posts table with announcement post_kind/type. Admin Center Content tab can create official announcements and optionally feature them. Database trigger prevents non-managers from forging announcement/official/local-update posts.',
  },

  {
    id: 'community-featured-content',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.HIGH,
    title: 'Pinned / Featured Community Content',
    description: 'A featured Start Here section using pinned posts plus clean event/resource previews.',
    shippedNote: 'Shipped 2026-05-18. Reuses posts.is_pinned/pinned_at/pinned_by guarded by trigger. Featured section appears in both active community detail systems and stays intentionally compact.',
  },

  {
    id: 'community-event-rsvp-foundation',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.HIGH,
    title: 'Community Event RSVP Foundation',
    description: 'Going / Maybe / Not Going RSVPs with attendee counts and admin visibility.',
    shippedNote: 'Shipped 2026-05-18. Reuses community_event_rsvps table and CommunityEventRSVP mapping. RSVP controls, counts, and admin attendee summary were polished. Attendance/check-in remains future work.',
  },

  {
    id: 'community-member-directory-role-labels',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.HIGH,
    title: 'Community Member Directory + Role Labels',
    description: 'Professional member directory with Owner/Admin/Moderator/Member labels and leadership section.',
    shippedNote: 'Shipped 2026-05-18. Built from existing community_memberships/UserCommunity data and shared across CommunityHubDetail and CommunityDetailView. Custom community titles intentionally deferred.',
  },

  {
    id: 'community-welcome-onboarding-hub',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.HIGH,
    title: 'Community Welcome / Onboarding Hub',
    description: 'A stronger community landing experience that surfaces welcome/about, featured content, key contacts, upcoming events, resources, and next actions.',
    shippedNote: 'Shipped 2026-05-18. Added shared CommunityWelcomeHub and CommunityFeaturedSection used by both active community detail systems. Admins can set a welcome message from Community Admin Center settings.',
  },

  {
    id: 'community-detail-dashboard-redesign',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.HIGH,
    title: 'Community Detail — Joined Dashboard vs Visitor Landing',
    description: 'Community pages now behave like mini-apps: joined members see a compact dashboard (no repeated description, admin quick actions, latest announcement, stats grid), while non-members see a full landing page with description and join CTA.',
    shippedNote: 'Shipped 2026-05-19. CommunityWelcomeHub is now membership-state-aware. CommunityHubDetail hides description block for joined users and compacts the cover. CommunityDetailView RoutedCommunityHome splits visitor/member layouts. CommunityAdminQuickActions added for community managers. Pill-style tab navigation in both detail systems.',
  },

  {
    id: 'community-detail-feed-first-redesign',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.HIGH,
    title: 'Community Detail Part 2 — Feed-First Home + Smart Strips',
    description: 'Joined-member home is now feed-first: CommunityImportantStrip surfaces the single most timely item (pinned announcement, urgent chesed need, next event, or resource), SinceLastVisitDigest shows new-since-last-visit counts inline, and TypeAwareComposer adapts to community type (chesed dual-button, message, official, or standard post mode). HomeFeedSection and CompactEmptyState replace the old slice-limited post list.',
    shippedNote: 'Shipped 2026-05-19. CommunityImportantStrip and SinceLastVisitDigest exported from CommunityOperatingSystem.jsx. TypeAwareComposer, HomeFeedSection, CompactEmptyState added to CommunityDetailView.jsx. RoutedCommunityHome rewritten to feed-first joined layout. RoutedPostsList and RoutedOpenNeedsTab updated to use CompactEmptyState.',
  },

  {
    id: 'community-app-shell-bottom-nav',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.HIGH,
    title: 'Community App Shell — Bottom Tab Navigation + Branded AppBar',
    description: 'Each community now feels like its own dedicated app: a slim branded AppBar (community type icon, name, admin gear, share) replaces the in-cover back button, and a fixed bottom tab bar with accent-colored active states replaces the scrollable top pill tabs. Overflow tabs surface in a full-height bottom sheet. Community accent color is injected as a CSS variable on mount for consistent theming across all tab icons and active states.',
    shippedNote: 'Shipped 2026-05-19. CommunityAppBar, CommunityBottomNav, and CommunityMoreSheet added as inline components in CommunityDetailView.jsx. TAB_ICON_MAP maps all tab keys to lucide icons. accentHex resolved from community branding settings → featured_accent_color → typeConfig.accentHex. CSS variable --community-accent injected via useEffect with cleanup on unmount. inAppShell prop added to CommunityHero to suppress duplicate sticky header and in-cover nav buttons. accentHex added to all 8 community type configs in communityTypes.js.',
  },

  {
    id: 'community-member-home-feed-first',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.HIGH,
    title: 'Community Member Home — Feed-First Layout + Compact Right Now Banner',
    description: 'Joined-member home now surfaces posts immediately without scrolling. A single compact RightNowBanner row (≈44px) replaces the two-card digest + important strip stack — it shows new-content count when there is activity since last visit, otherwise surfaces the single most important item (announcement → event → chesed need → resource). The composer collapses to a one-line pill by default in all modes, expanding on tap. Section order changed to: rightNow → composer → feed → adminTools → personalization.',
    shippedNote: 'Shipped 2026-05-19. RightNowBanner component added inline in CommunityDetailView.jsx. Default homeSections order changed from [digest, importantNow, adminTools, personalization, composer, feed] to [rightNow, composer, feed, adminTools, personalization]. digest and importantNow kept in sectionMap for backwards compatibility with customized layouts. TypeAwareComposer default post mode now has collapsed pill state matching existing message-mode pattern. Fixed latent bug: Heart was used in AboutTab but not imported. Superseded by community-home-launchpad (2026-05-22).',
  },

  {
    id: 'community-home-launchpad',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.HIGH,
    title: 'Community Home — App-Style Launchpad / Mini-App Front Door',
    description: 'Opening a community now feels like entering that community\'s own mini-app inside JUnited. The default Home tab is an app-style launchpad with a 2-column navigation grid, a compact Right Now banner, an admin tools row (for admins), and a 2-post recent activity preview with a "View all" link. The feed-first layout is removed from Home; the full feed is accessed via the Posts tab. Navigation cards are type-aware and capability-gated: each shows an icon, title, short description, and live count where applicable (upcoming events, members, resources, open needs). Layout setting hiddenSections still respected. Composer moved exclusively to Posts tab.',
    shippedNote: 'Shipped 2026-05-22. CommunityDetailView.jsx: added LAUNCHPAD_TAB_DESC constant, LaunchpadNavCard component (2-col grid card with icon + title + desc + count chip), CommunityHomeLaunchpad component (RightNow banner → nav grid → admin row → recent preview → personalization hub). RoutedCommunityHome now accepts visibleTabs prop and renders CommunityHomeLaunchpad instead of the sectionMap/orderedSections feed-first stack. visibleTabs passed from parent at the JSX call site. Posts tab retains full feed + composer via RoutedPostsTab unchanged. Refined 2026-05-22: getFeaturedTab/getCardData helpers pick community\'s primary section as a full-width FeaturedLaunchpadCard with real data previews (next event title+date, latest post snippet, open need count, resource count). Remaining tabs rendered as SecondaryLaunchpadCard 2-col grid with live stat/preview. CommunityHero: cover height 120→72px in appShell, removed duplicate Admin/Settings buttons, shortened invite copy. Swipe disabled on Home tab.',
  },

  {
    id: 'community-visitor-landing',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.HIGH,
    title: 'Community Visitor Landing — Full-Screen Join Page',
    description: 'Non-members now see a dedicated landing page instead of a raw feed. Shows community description and member count, a full-width Join CTA, the featured section (pinned post / next event / top resource), and up to 2 preview posts followed by a locked-gate card ("X more posts — join to read") with a second Join CTA. Removed CommunityWelcomeHub from the visitor path.',
    shippedNote: 'Shipped 2026-05-19. VisitorLanding component added inline in CommunityDetailView.jsx. RoutedCommunityHome !isFollowing branch now renders VisitorLanding. onFollow prop added to RoutedCommunityHome and wired to handleFollow from parent. CommunityWelcomeHub no longer imported by CommunityDetailView (still exported from CommunityOperatingSystem for any future use).',
  },

  {
    id: 'community-creation-experience-v2',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.HIGH,
    title: 'Community Creation — Experiential Flow v2',
    description: '5-step visual launch experience replacing the flat settings wizard. Includes archetype selection, live preview, smart first-post pre-fill, and premium teaser for advanced layout.',
    shippedNote: 'Shipped 2026-05-19. CreateCommunityFlow.jsx — Step 1: name with identity preview; Step 2: 8 archetype cards with tab previews; Step 3: description + vibe; Step 4: privacy + posting mode + premium teaser; Step 5: review + editable first post + launch. Live mini preview togglable from header. Smart first-post copy per archetype. Settings object stored on community record. Migration 20260519210000_community_settings_jsonb.sql adds settings JSONB, community_type, and posting_mode columns. CreateCommunityModal defaults to new flow via useNewFlow state.',
  },

  {
    id: 'community-live-preview-builder',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.MEDIUM,
    title: 'Community Live Preview Builder',
    description: 'Full real-time side-by-side preview during community creation showing exactly how the community will look, including nav tabs, home sections, and composer style.',
    shippedNote: 'Shipped 2026-05-19. CommunityLivePreview.jsx: new standalone component (248px phone shell with status bar, 92px branded cover with gradient+name overlay, action bar, nav tabs, step-aware content area). PREVIEW_SAMPLES provides archetype-specific content per type (8 archetypes): type-colored important strip, composer placeholder, 2 sample feed cards with badges/likes/replies. Step awareness: step 0 shows placeholder; step 1+ reveals strip+feed; step 2+ adds description card; step 3+ adds privacy+posting mode badges; step 4+ swaps feed for the typed first post draft. CreateCommunityFlow.jsx: desktop (lg+) renders side-by-side with dark gradient preview panel on right (max-w-[860px]); mobile retains "Preview" button in header that opens a full-screen dark overlay sheet (z-[110]) with the same CommunityLivePreview. Updated 2026-05-19 (premium preview correction): Step 4 passive teaser replaced with interactive "Advanced Community Layout" section. When expanded: tab arrangement (3 archetype-specific presets per all 8 types, shown as clickable rows with mini tab pills), home emphasis (2–3 relevant options per archetype), composer style (3 modes). Premium state (premiumPreviewEnabled + premiumPreviewLayout) lives separately from creation payload — free users can explore but choices do not save unless they upgrade. CommunityLivePreview accepts premiumPreview prop: when active, overrides nav tabs in phone shell, shows home emphasis indicator (violet card), overrides composer prompt, adds violet ✦ Premium badge to phone corner, changes step caption to "✦ Premium Preview · Upgrade to publish this layout". Payload on launch unchanged for free users.',
  },

  {
    id: 'community-creation-upgrade-in-flow',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.MEDIUM,
    title: 'In-Creation Premium Upgrade CTA',
    description: 'Let admins complete a community premium checkout directly from Step 4 of CreateCommunityFlow when they activate the Premium Layout Preview, so their chosen tab/emphasis/composer layout saves immediately on launch.',
    shippedNote: 'Shipped 2026-05-19. Step 4 amber notice replaced with real Monthly ($9.99/mo) / Annual ($7.99/mo) plan selection buttons. Selecting a plan sets premiumUpgradeRequested + premiumInterval, shows green confirmation with "Change" link to deselect. StepLaunch shows a violet premium indicator card when upgrade is committed. On submit: community is created first (free tier), layout + communityId saved to localStorage key community_premium_layout_pending, createCommunityPlanCheckout edge function called, user redirected to Stripe checkout. On return from Stripe at /Communities?community=ID&billing=success: layout merged into communities.settings.layout, queries invalidated, success toast shown, URL cleaned. ?billing=cancel clears localStorage and shows info toast. Graceful degradation: if checkout throws (Stripe not configured), localStorage cleared and normal free-tier launch completes with info toast.',
    why: 'Step 4 now shows an interactive premium preview with a "Upgrade to publish this layout" notice, but tapping it does nothing — the layout choices are discarded on free-tier launch. Completing checkout in-flow turns the preview from an aspiration into an immediate action.',
    prompt: `You are wiring up the in-creation premium upgrade CTA for JUnited community creation.

Context:
- src/components/communities/CreateCommunityFlow.jsx: Step 4 (StepShape) has premiumPreviewEnabled state and shows "Upgrade to publish this layout" amber notice when premium preview is active. The notice currently has no interaction.
- src/components/communities/CreateCommunityModal.jsx: calls onCreate(payload) after CreateCommunityFlow submits. Has access to currentUser prop.
- supabase/migrations/*_community_plan_subscriptions.sql: community premium billing table (plan_key='community_premium').
- src/services/paymentsService.js or equivalent: createCommunityPlanCheckout Edge Function exists from premium-community-plans sprint.
- communities.settings.layout: the JSONB path where premium layout is saved post-creation (used by CommunityAdminCenter Layout tab).

Goals:
1. In CreateCommunityFlow, wire the "Upgrade to publish this layout" amber notice to call onRequestUpgrade() if provided.
2. CreateCommunityModal passes onRequestUpgrade to CreateCommunityFlow; when called, it opens the community plan checkout (using createCommunityPlanCheckout edge function or the Admin Center billing flow, whichever exists).
3. On successful upgrade (webhook completes or user returns from checkout), the premiumPreviewLayout choices should be committed to community.settings.layout via Supabase update.
4. If checkout is not yet wired (Stripe prices not set up), show a graceful fallback: "Upgrade available after launch in Admin Center → Billing."
5. Update internal/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'advanced-community-layout-premium',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.HIGH,
    title: 'Advanced Community Layout (Premium)',
    description: 'Let premium community admins customize: primary tab order, home section visibility/order, feed blend behavior, composer mode. Free communities get curated presets.',
    shippedNote: 'Shipped 2026-05-19. CommunityAdminCenter.jsx: new Layout tab (LayoutGrid icon) between Appeals and Settings. Free tier: 4 preset cards (Balanced ⚖️, Social 💬, Announcements 📢, Action 🤝) — all selectable, no lock. Premium tier: nav tab up/down reorder with primary/overflow chip labels, home section visibility toggles + reorder (composer and feed required, others optional), composer mode selector (conversational/standard post/official update/help requests). Right-side live preview shows nav pills + ordered section stack. Sticky save button writes communities.settings.layout JSONB. getCommunityNavConfig() in communityTypes.js reads savedLayout.primaryTabs to override type defaults. RoutedCommunityHome in CommunityDetailView.jsx reads layoutSettings.homeSections (section order), layoutSettings.hiddenSections (visibility), and layoutSettings.composerMode — renders via sectionMap+orderedSections pattern. useSwipeableTabs hook rewritten with setPointerCapture, directional abort in onPointerMove, and touch-action:pan-y for clean mobile swipe.',
  },

  {
    id: 'community-creation-cover-upload',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.LOW,
    title: 'Cover Photo Upload in Creation Flow',
    shippedNote: 'Cover upload added to Step 3 (Make it yours) in CreateCommunityFlow. Dashed upload target, live preview in both desktop and mobile CommunityLivePreview, processImage pipeline, upload to community-images bucket at launch time, cover_url persisted on community record.',
    description: 'Let admins upload a custom cover photo during step 2 ("Make it yours") of the new CreateCommunityFlow, replacing the type-gradient placeholder. Preview updates live.',
    why: 'The legacy CreateCommunityForm (still in CreateCommunityModal.jsx) had cover upload, but it was never ported to the new 5-step CreateCommunityFlow. The live preview now shows the gradient — uploading a real cover would make the preview much more personal and the community feel owned immediately.',
    prompt: `You are adding cover photo upload to the JUnited community creation flow.

Context:
- src/components/communities/CreateCommunityFlow.jsx: the 5-step creation flow; step 2 is StepMakeItYours
- src/components/communities/CommunityLivePreview.jsx: the live preview component; renders a cover using typeConfig.coverPattern; if a coverPreviewUrl is passed it should render that instead
- src/components/communities/CreateCommunityModal.jsx: the legacy CreateCommunityForm path has cover upload logic (fileRef, coverImage, coverPreview via FileReader + Supabase storage upload on submit) — reference this for the upload pattern
- supabase storage: community cover images are stored in the 'communities' bucket under 'covers/'

Goals:
1. Add a coverFile and coverPreviewUrl to CreateCommunityFlow form state
2. In StepMakeItYours, add an optional "Add cover photo" tap target (dashed border, image preview if set, click to replace) — same visual style as the legacy form
3. Pass coverPreviewUrl into CommunityLivePreview and render it as the cover background image when present (fall back to gradient if null)
4. On submit (onCreate payload), include coverFile so CreateCommunityModal.handleCreateFromFlow can upload it to Supabase storage and set cover_url on the community
5. Update internal/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'community-creation-cover-crop',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.LOW,
    title: 'Cover Photo Crop/Aspect-Ratio Control in Creation Flow',
    shippedNote: 'CoverCropSheet.jsx: full-screen dark portal (z-[120]), canvas-based drag-to-reposition at 3:1 ratio, 1200×400px JPEG output. Zero new dependencies. Opens on file selection; outputs cropped Blob → File → objectURL. Raw URL revoked after crop. Existing cover preserved on cancel.',
    description: 'After uploading a cover during community creation, let the user crop or reposition it to a standard 16:9 or 3:1 aspect ratio before it is saved.',
    why: 'Tall portrait photos and square avatars upload fine but look bad as 128px-tall community covers — the subject gets cropped unpredictably by object-cover. A simple crop step would eliminate the most common visual failure after the cover upload feature ships.',
    prompt: `You are adding a cover-crop step to the JUnited community creation flow.

Context:
- src/components/communities/CreateCommunityFlow.jsx — StepMakeItYours renders the cover upload button; after selection the image is previewed via URL.createObjectURL in a 120px-tall div
- src/components/communities/CommunityLivePreview.jsx — receives coverUrl prop and renders it as object-cover in a 92px-tall div
- src/components/communities/CreateCommunityModal.jsx — handleCreateFromFlow receives coverFile, processes it via processImage(coverFile, 1400), then uploads to community-images bucket
- The crop UI should appear in a modal/sheet immediately after the user picks a file (before setting coverFile state), produce a cropped Blob, and replace the raw file before it is stored in state

Goals:
1. After file selection in handleCoverChange, open a lightweight crop modal (react-image-crop or a canvas-based crop) showing the uploaded photo with a draggable 3:1 crop region
2. On confirm, use canvas to produce a cropped Blob; set that as coverFile and generate a new objectURL for coverPreviewUrl
3. On cancel, clear the selection (no change to state)
4. Skip the crop step on files already within the 3:1 ratio tolerance (±10%)
5. Update internal/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'community-premium-live-pricing',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.LOW,
    title: 'Show Live Premium Plan Prices in Create Community Flow',
    description: 'Fetch the actual monthly and annual pricing for the community Premium plan from a lightweight endpoint so users see real prices before committing to an interval in Step 4.',
    why: 'Current fix removed wrong hardcoded prices ($9.99/$7.99) and replaced with interval labels only. Actual amounts live in Stripe server-side. Users should see the real prices to make an informed choice — but we cannot safely hardcode them client-side where they will drift.',
    prompt: `You are adding live pricing display to the JUnited community creation flow.

Context:
- src/lib/communityPlanPricing.js — shared interval config; no dollar amounts (intentionally, because they were hardcoded incorrectly before)
- src/components/communities/CreateCommunityFlow.jsx — Step 4 StepShape renders COMMUNITY_PREMIUM_INTERVALS from communityPlanPricing.js; shows "Billed monthly" / "Billed annually · best value" without prices
- supabase/functions/create-community-plan-checkout/index.ts — uses STRIPE_PRICE_COMMUNITY_PREMIUM_MONTHLY / STRIPE_PRICE_COMMUNITY_PREMIUM_ANNUAL env vars to look up Stripe price IDs
- src/services/paymentsService.js — paymentsService.createCommunityPlanCheckout({ communityId, interval }) triggers checkout

Goals:
1. Add a new Supabase Edge Function 'get-community-plan-pricing' that:
   - Reads STRIPE_PRICE_COMMUNITY_PREMIUM_MONTHLY and STRIPE_PRICE_COMMUNITY_PREMIUM_ANNUAL env vars
   - Calls stripe.prices.retrieve(priceId) for each
   - Returns { monthly: { amount: number, currency: string }, annual: { amount: number, currency: string } }
   - Is publicly accessible (no auth required — price display is not sensitive)
2. In CreateCommunityFlow.jsx: add a usePlanPricing() hook that calls this function via supabase.functions.invoke, returns { monthly, annual } or null
3. In StepShape's upgrade CTA: if pricing loaded, display the amount alongside the interval label (e.g., "$12 / mo" or "$99 / yr"); if null/loading, fall back to the current sublabel text
4. Update src/lib/communityPlanPricing.js with a formatPlanPrice(amountCents, currency) helper
5. Update internal/roadmap.js: change this item's status to 'shipped'.`,
    shippedNote: 'Shipped 2026-05-19. New Edge Function get-community-plan-pricing reads STRIPE_PRICE_COMMUNITY_PREMIUM_MONTHLY/ANNUAL env vars, calls stripe.prices.retrieve() for each, returns { monthly, annual: { amount, currency } } with 1-hour Cache-Control. formatPlanPrice(amountCents, currency) helper added to communityPlanPricing.js. usePlanPricing() hook in CreateCommunityFlow.jsx calls the function on mount and returns pricing or null. StepShape receives planPricing prop; interval buttons show "$12 / mo" / "$99 / yr" when loaded, fall back to sublabel text when null/loading.',
  },

  {
    id: 'community-mini-app-post-launch-panel',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.MEDIUM,
    title: 'Community Post-Launch Admin Panel',
    description: 'After creating a community, show a dismissible "Next steps" admin setup panel with guided actions: invite members, add first event, customize layout, share welcome post.',
    why: 'New community admins often get stuck after creation. A non-intrusive "what to do next" strip makes the community feel less empty and increases first-30-day engagement.',
    shippedNote: 'Shipped 2026-05-19. CommunityPostLaunchPanel.jsx: new component; type-aware action list for all 8 archetypes (neighborhood/shul/chesed/parents/learning/events/marketplace/general), 3–4 actions each. Completion detection: invite → members.length > 1, events/resources/openNeeds/posts → length checks on already-fetched data, announcements/discussions/questions → post type filter. Progress bar tracks completed/total count. Dismiss: localStorage key post_launch_dismissed_{communityId}, persists across refreshes. Shown in RoutedCommunityHome when isCreator && !dismissed && community < 14 days old. Placed as first card above all orderedSections. Action buttons: tab-navigation actions call onTabChange(tab); invite copies link via navigator.share → navigator.clipboard fallback + toast. X button and "Skip for now" footer link both dismiss. No DB migration — localStorage is sufficient for MVP.',
    prompt: `You are implementing a post-launch admin panel for newly created JUnited communities.

Context:
- After community creation, the user is navigated to the community detail page (CommunityDetailView.jsx)
- communities table: created_date column exists; settings JSONB column has 'archetype' key
- CommunityAdminQuickActions in CommunityOperatingSystem.jsx: current admin quick-action grid
- CommunityDetailView.jsx: RoutedCommunityHome renders the joined member home

Goals:
1. Add a communities column: first_visit_complete boolean default false
2. In RoutedCommunityHome, if user is admin AND community is new (created_date < 7 days ago) AND first_visit_complete is false: show a CommunityAdminNextSteps strip ABOVE the composer
3. CommunityAdminNextSteps should show 4 compact action rows:
   - Invite members (link to Admin Center members tab)
   - Add first event (opens CreateCommunityEventModal)
   - Customize layout (opens Admin Center layout tab)
   - Share community link (copies invite link)
4. A dismiss button marks first_visit_complete = true via a supabase update
5. Update internal/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'community-member-invite-system',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.HIGH,
    title: 'Community Member Invite System',
    description: 'First-class tokenized invite links for communities: personal invite URL (/join?code=CODE), usage tracking, revoke/regenerate, and reusable CommunityInviteModal wired into the post-launch panel, community header, and Admin Center members tab.',
    why: 'Raw URL sharing gives no tracking, no personalization, no revoke. Tokenized links let admins see who used their invite, reset compromised links, and give members a personal stake in growing the community.',
    shippedNote: 'Shipped 2026-05-19. invite_links table created with RLS (public SELECT for acceptance page, authenticated INSERT for admins/moderators, authenticated UPDATE for uses_count increment + revoke). CommunityInviteModal.jsx: portal-rendered bottom sheet, loads or creates an active link per user+community, copy + native share buttons, usage stats, regenerate flow. Wired into: CommunityHero (replaced InviteLinkButton strip with clickable invite row → modal), CommunityPostLaunchPanel (invite action opens modal instead of raw clipboard copy; currentUser prop added), CommunityAdminCenter MembersTab (Invite Members button above search). JoinByCommunityCode.jsx acceptance page already implemented and required no changes.',
  },

  {
    id: 'community-invite-email',
    category: 'Community',
    status: STATUS.DEFERRED,
    priority: PRIORITY.MEDIUM,
    title: 'Community Email Invitations',
    description: 'Allow community admins to send email invitations directly from the invite modal, delivering a personalized invite link to the recipient\'s inbox.',
    why: 'Resend is not yet wired to any Edge Functions for community-specific transactional emails. Deferred until community sizes and engagement metrics justify the investment.',
    prompt: `You are implementing email invitations for JUnited communities.

Context:
- invite_links table: community_id, inviter_id, inviter_name, code, is_active, expires_at, max_uses, uses_count (supabase/migrations/20260519220000_invite_links.sql)
- CommunityInviteModal.jsx: src/components/communities/CommunityInviteModal.jsx — the invite sheet where the email input would live
- JoinByCommunityCode.jsx: src/pages/JoinByCommunityCode.jsx — the acceptance page at /join?code=CODE
- Resend is the email provider (configured in Supabase Edge Functions per CLAUDE.md)
- No Edge Function currently sends community-specific transactional email

Goals:
1. Create a Supabase Edge Function send-community-invite that accepts { email, inviteCode, communityName, inviterName } and sends a branded invite email via Resend
2. Add an email input section to CommunityInviteModal below the link copy buttons (collapsed by default, expanded with "Send by email" toggle)
3. On send: call the Edge Function, show success/error toast, track that the email was sent (optional: store in invite_links a sent_to_emails text[] column)
4. Apply the schema change as a migration in supabase/migrations/
5. Run npm run lint && npm run build
6. Update internal/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'community-invite-link-controls',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.LOW,
    title: 'Invite Link Expiry & Use-Limit Controls',
    shippedNote: 'Shipped 2026-05-20. CommunityInviteModal gains "Advanced options" disclosure (ChevronDown toggle) below the stats row with a date picker for expires_at and number input for max_uses (both nullable). createNewLink() inserts these values when set. Stats line shows "Used X/Y times" when max_uses is set and "expires Jun 1" with short-date format. Advanced options reset when modal opens. Hint copy tells user limits apply to the next generated link.',
    description: 'Let admins set an expiry date or maximum use count when generating an invite link, giving them control over access windows for events, beta cohorts, etc.',
    why: 'The invite_links table already has expires_at and max_uses columns, but CommunityInviteModal has no UI for them. The acceptance page (JoinByCommunityCode.jsx) already enforces both checks.',
    prompt: `You are adding expiry and use-limit controls to the JUnited community invite modal.

Context:
- invite_links table columns: expires_at timestamptz, max_uses integer (both nullable — null means unlimited)
- CommunityInviteModal.jsx: src/components/communities/CommunityInviteModal.jsx — createNewLink() calls supabase.from('invite_links').insert(...)
- JoinByCommunityCode.jsx: src/pages/JoinByCommunityCode.jsx — already enforces expires_at and max_uses on the acceptance side

Goals:
1. Add an optional "Advanced options" disclosure below the stats/regenerate row in CommunityInviteModal
2. Inside: a date picker for expires_at (clear = no expiry) and a number input for max_uses (empty = unlimited)
3. Wire these values into createNewLink() as part of the insert payload
4. When a link has expires_at or max_uses set, show them clearly in the stats line (e.g. "Used 2/10 times · expires Jun 1")
5. Run npm run lint && npm run build
6. Update internal/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'community-detail-swipeable-tabs',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.MEDIUM,
    title: 'Community Detail — Swipeable Tab Navigation',
    description: 'Horizontal swipe gestures on the community detail content area advance or retreat through the visible tab list. Active pill auto-scrolls into view after swipe.',
    shippedNote: 'Shipped 2026-05-19. useSwipeableTabs hook in src/hooks/useSwipeableTabs.js detects touch/pen horizontal swipes (48px threshold, 1.5× direction ratio, ignores nested horizontal scrollers). Wired into CommunityHubDetail.jsx and CommunityDetailView.jsx content areas. Tab button refs auto-scroll active pill on change in both detail systems.',
  },

  {
    id: 'community-personalization-home',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.MEDIUM,
    title: 'Community Home Personalization — For You Module',
    description: 'Surfaces personally relevant signals on the joined-member community home: upcoming events the user has RSVPed for, and active chesed commitments the user is volunteering for.',
    why: 'Current dashboard shows community-level activity. Member-level signals ("you RSVPed for this event", "you are helping with this chesed need") answer what matters to this specific user right now.',
    shippedNote: 'CommunityPersonalizationHub component with two targeted queries: community_event_rsvps (cross-referenced with already-fetched events array) and mitzvah_requests claimed_by_user_id (chesed communities only). Dynamic title: "For you" / "Your upcoming events" / "Your commitments". Hidden entirely when no personal activity. Placed after CommunityWelcomeHub in both HubDetail and DetailView. RSVP event rows open the specific event directly: tapping a row switches to the Events tab and scrolls + highlights the matching EventCard (ring-2 ring-blue-300) via highlightEventId state threaded through HomeTab/RoutedCommunityHome → CommunityPersonalizationHub → onOpenEvent.',
  },

  {
    id: 'community-home-section-ordering',
    category: 'Community',
    status: STATUS.PLANNED,
    priority: PRIORITY.LOW,
    title: 'Community Home Section Reordering',
    description: 'Let members pin a section or reorder community home sections (e.g. always show Events first). Requires a community_member_preferences table.',
    why: 'Some members always want Events; others live in Posts. User-controlled ordering is a natural follow-up to the data-driven For You module.',
    prompt: `You are implementing Community Home Section Reordering for JUnited.

Context:
- Community home joined mode: CommunityHubDetail.jsx HomeTab and CommunityDetailView.jsx RoutedCommunityHome.
- Sections currently rendered in order: AdminQuickActions (if admin), CommunityWelcomeHub (with digest), CommunityPersonalizationHub (For You), CommunityFeaturedSection, posts/chesed/composer.
- No per-user preferences table exists yet.

Goals:
1. Add community_member_preferences table (user_id, community_id, home_section_order text[], created_at, updated_at) with RLS.
2. Add a gear/customize icon to the joined-member CommunityWelcomeHub identity row.
3. Build a compact bottom-sheet where members can tap sections to reorder or pin one.
4. Persist via upsert to community_member_preferences.
5. Apply stored order in HomeTab / RoutedCommunityHome for joined members.
6. Run npm run lint && npm run build.
7. Update internal/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'community-hero-compact-nav-overflow',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.HIGH,
    title: 'Community Hero Compaction + Nav Overflow (More button)',
    description: 'Shrink the community hero from ~430px to ~180px by reducing cover height (200→120px), removing the member avatar strip and stats ribbon, and simplifying the identity row to a 60px compact layout. Add composerMode, primaryTabs, moreTabs, homeEmphasis fields to all 8 community type configs. Add getCommunityNavConfig() to compute primary/overflow tabs. Replace the scrolling flat tab bar with a fixed-slot primary nav + More dropdown that shows overflow tabs.',
    shippedNote: 'Shipped 2026-05-19. communityTypes.js extended with 4 new fields per type and getCommunityNavConfig(). CommunityHero.jsx rewritten: 120px static cover, compact 48px logo, single-row CTA (Join/Joined+Settings/Admin), no avatar strip, no stats ribbon, sticky threshold lowered to scrollY>100. CommunityDetailView.jsx nav bar now renders navConfig.primary tabs + More button with positioned dropdown; showMore state auto-closes on tab select.',
  },

  {
    id: 'community-mini-app-identity-pass',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.HIGH,
    title: 'Community Mini-App Identity Pass',
    description: 'Second experiential pass making each community feel owned and app-like, not templated. Community name integrated into cover (no more white block under gradient). Admin tools collapsed to compact toolbar and moved after content. More nav always labeled "More" with dot indicator. Feed posts capped with "Read more" expand for rhythm. Type-specific empty states for events/resources/needs/discussions. ImportantRightNow strip uses community-type accent colors.',
    shippedNote: 'Shipped 2026-05-19. CommunityHero.jsx: name+type overlaid at cover bottom (128px cover, thin 44px action bar), no floating avatar, no separate identity row. CommunityAdminQuickActions redesigned as compact single-row chip bar, moved after ImportantRightNow strip. More button always shows "More" label + dot when overflow tab active. CommunityPostPreview adds collapsed/expanded state with "Read more" for announcements and long posts. TAB_EMPTY_COPY + getTabEmptyState() adds type+tab-specific empty state copy for events/resources/openNeeds/discussions/questions tabs. CommunityEventsTab and CommunityResourceLibrary accept typeConfig prop and render type-specific empty states. CommunityImportantStrip uses typeConfig-aware accent colors for announcements (shul→indigo, neighborhood→cyan, parents→orange, events→rose, default→amber).',
  },

  {
    id: 'community-activity-digest-module',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.MEDIUM,
    title: 'Community Activity Digest on Home',
    description: '"What changed since you were last here" module on the community home for joined members: new announcements, new events, new posts since last visit.',
    why: 'The current home shows static data. A "since your last visit" signal immediately answers "what matters now" without users needing to scan every tab.',
    shippedNote: 'community_last_visits table with RLS; debounced 4s upsert on open; "X new since your last visit" pill in CommunityWelcomeHub joined mode clicking into announcements or posts.',
  },

  {
    id: 'community-activity-digest-breakdown',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.MEDIUM,
    title: 'Community Activity Digest — Categorized Breakdown',
    description: 'Upgrades the single "X new" pill into a compact "Since your last visit" module with separate tappable rows for new announcements, new posts, and new events.',
    why: 'Knowing that something changed is not enough — members need to know what changed to choose where to go. Separate rows with direct tab navigation reduce friction from "something new" to actual engagement.',
    shippedNote: 'Replaced single pill with blue-tinted digest block containing up to 3 rows (announcements → amber Megaphone, posts → blue MessageCircle, events → emerald CalendarDays), each with ChevronRight and direct tab navigation. Only rows with count > 0 render. Module is hidden when nothing is new.',
  },

  {
    id: 'community-list-new-activity-indicator',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.LOW,
    title: 'New-Activity Dot on Community List Cards',
    description: 'Show a subtle indicator on community cards in the Communities list when there are posts or events newer than the user\'s last visit, so users know which communities have new content before opening them.',
    why: 'The digest pill inside the community is useful once you\'re already in. A list-level signal closes the loop so members know where to go next without opening every community.',
    shippedNote: 'get_communities_with_new_activity() RPC (migration 20260519100000) batches the check; Communities.jsx queries it once per session; small blue dot renders at avatar top-right in CommunityHubCard when hasNewActivity=true. Only joined communities with a visit record and newer posts/events show the dot.',
  },

  {
    id: 'community-discover-mini-app-redesign',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.HIGH,
    title: 'Communities Discover — Mini-App Entry Points',
    description: 'Redesign the Discover tab from a generic flat directory into type-aware mini-app entry points: grouped by community type, cards showing cover/banner, type chip, activity signals, feature pills, and a join button.',
    why: 'The old Discover experience was a keyword-bucketed flat list with no type identity, no activity context, and no sense of what each community offered. Communities are distinct mini-apps — the directory should sell them that way.',
    shippedNote: 'Shipped 2026-05-19. DiscoverCommunityCard.jsx: 72px type-aware banner (cover_url or coverPattern gradient), dark gradient overlay, type chip (bottom-left, badgeClass), privacy badge (bottom-right), member count, join button (type accent gradient → "Joined" with check), 2-line description, feature pills from primaryTabs (up to 3, mapped to human labels), activity signal ("X posts today" / "X+ posts" green dot). Communities.jsx: curatedDiscoverSections useMemo replaced with typeKey grouping using DISCOVER_SECTION_ORDER and DISCOVER_SECTION_SUBTITLES; DiscoverSection component renders section header (type chip + subtitle + count badge) + responsive 2-col grid; DiscoverEmptyState handles filter-mismatch and zero-data cases with contextual CTAs.',
  },

  {
    id: 'community-discover-type-filter',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.LOW,
    title: 'Discover — Type Filter Chips',
    description: 'A horizontally scrollable row of community-type filter chips above the Discover section list (e.g. "All", "Neighborhood", "Shul", "Learning") so users can narrow to a specific mini-app type without scrolling through all groups.',
    why: 'After the Discover redesign ships type-grouped sections, the natural next friction is "I only want to see X type" — a single-tap filter resolves this without adding a search interaction.',
    shippedNote: 'Already implemented in SearchBar component. COMMUNITY_FILTERS (All + each COMMUNITY_TYPE_OPTIONS key/label) renders as a horizontal scroll chip row. typeFilter state wires to filteredCommunities useMemo (community.typeKey === typeFilter), which propagates to discoverCommunities, curatedDiscoverSections, and forYouCommunities (returns [] when filter active). Active chip = bg-slate-950 text-white, inactive = border bg-white. No separate discoverTypeFilter state needed — the existing global typeFilter achieves the same result composably with text search.',
    prompt: `You are adding type filter chips to the JUnited Communities Discover tab.

Context:
- src/pages/Communities.jsx: the Discover tab renders curatedDiscoverSections (typeKey-grouped useMemo) and DiscoverSection components. The search input is already wired via discoverSearch state.
- src/lib/communityTypes.js: COMMUNITY_TYPE_CONFIG has key/label/icon/badgeClass for all 8 types + general.
- DISCOVER_SECTION_ORDER constant in Communities.jsx defines the display order of types.

Goals:
1. Add a horizontally scrollable chip row below the search input and above the sections list. Chips: "All" (default) plus one chip per type key in DISCOVER_SECTION_ORDER that has at least one community.
2. Add discoverTypeFilter state (null = all). Selecting a chip sets the filter; selecting again or "All" clears it.
3. Filter curatedDiscoverSections to only include the matching type when a filter is active.
4. Chip styling: inactive = typeConfig.softClass; active = typeConfig.badgeClass + ring-2 + text-white.
5. Do not remove the text search — type filter and text search should compose (both active at once narrows further).
6. Run npm run lint && npm run build.
7. Update internal/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'community-discover-personalized-section',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.MEDIUM,
    title: 'Discover — Personalized "For You" Section',
    description: 'Surface a "Recommended for you" section at the top of Discover showing communities that match the user\'s existing memberships (same type) or neighborhood, prioritized by activity and member count.',
    why: 'The current Discover shows every type section with equal priority. Users with existing memberships have revealed preferences — a personalized top strip would dramatically improve join rates for relevant communities.',
    shippedNote: 'Shipped 2026-05-19. forYouCommunities useMemo: pure client-side scoring from data already in scope (no new queries). Filter: discoverCommunities (unjoinable) where typeKey appears in allJoinedCommunities frequency map. Score: +3 typeKey match (base, required to appear), +2 memberCount>50, +1 postsToday>0. Sort descending, take top 4. ForYouSection renders with violet/indigo gradient pill header + Sparkles icon, "Based on the kinds of communities you\'ve joined" subtitle, count badge, existing DiscoverCommunityCard grid. Section hidden when: query/typeFilter active (explicit search intent), allJoinedCommunities=0, or fewer than 2 results. Communities also appear in type-grouped sections below (no deduplication — reinforces). Positioned after CommunityPulseDock, before type sections.',
    prompt: `You are adding a personalized "For You" section to the JUnited Communities Discover tab.

Context:
- src/pages/Communities.jsx: Discover tab, curatedDiscoverSections groups by typeKey. joinedCommunities list is already available in the component.
- src/lib/communityTypes.js: getCommunityTypeKey(community) normalizes type from any community shape.
- discoverCommunities (React Query) is the full list of unjoinable/joinable communities.

Goals:
1. Compute a recommendedCommunities list: for each community in discoverCommunities that the user has NOT joined, score it by: +3 if its typeKey matches any joined community typeKey, +2 if membership > 50, +1 if postsToday > 0. Take the top 4 by score (minimum score > 0 to show the section at all).
2. If recommendedCommunities.length >= 2, render a "For you" section ABOVE all type sections, using the same DiscoverSection layout but with a star icon and no type chip — just a purple/indigo gradient header and subtitle "Based on your communities".
3. Communities that already appear in "For you" still appear in their type section (they are not deduplicated — both placements reinforce discovery).
4. Hide the For You section entirely if the user has no joined communities or no unjoinable matches with score > 0.
5. Run npm run lint && npm run build.
6. Update internal/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'community-discover-location-boost',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.LOW,
    title: 'Discover "For You" — Location Signal Boost',
    description: 'Upgrade the "For you" scoring with a neighborhood/location signal: if the user\'s profile includes a location, boost discoverable communities in the same area.',
    why: 'The current "For you" uses typeKey overlap only. Users whose profiles include location data (neighborhood, city) can get meaningfully better personalization by surfacing hyperlocal communities — especially neighborhood and shul types.',
    shippedNote: 'Shipped 2026-05-19. forYouResult useMemo: locationTerms derived from currentUser.cityPreset and currentUser.locationLabel (both normalized by toAppRow() from profiles.city and profiles.location_label — no extra query). For each type-matched community: +2 if community.location includes any locationTerm (case-insensitive substring). locationBoostUsed flag: true when at least one of the top-4 results has a location match. ForYouSection subtitle switches to "Based on the communities you\'ve joined and what\'s near you" only when locationBoostUsed=true; falls back to type-only copy otherwise. Edge cases: no location terms → score unaffected, subtitle unchanged; no location-matching communities → type-only ranking, type-only copy.',
    prompt: `You are adding a location boost to the "For you" personalization scoring in JUnited Communities Discover.

Context:
- src/pages/Communities.jsx: forYouCommunities useMemo uses typeFreq scoring (+3 type, +2 memberCount>50, +1 postsToday>0). allJoinedCommunities and discoverCommunities are already in scope.
- User profile: currentUser comes from useAuth(). Profile location may be in currentUser.location or currentUser.city or a separate profiles query.
- Community location: communities have a 'location' string field from the DB.
- src/lib/communityTypes.js: getCommunityTypeKey(community) derives typeKey.

Goals:
1. Determine the canonical field(s) for user location — check profiles table and currentUser shape (run Supabase MCP list_tables or inspect existing profile queries).
2. If location data is available without a new query: add +2 to the forYouCommunities score when a community's location string includes the user's city/neighborhood (case-insensitive substring match).
3. If location requires a new query: add a lightweight useQuery for the user's profile location only when allJoinedCommunities.length > 0 (avoids wasted fetch for new users).
4. Update the ForYouSection subtitle to "Based on your communities and neighborhood" when a location boost is in effect; keep the current copy when it is not.
5. Run npm run lint && npm run build.
6. Update internal/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'community-custom-branding',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.LOW,
    title: 'Custom Community Branding',
    description: 'Let Premium communities set a custom accent color, cover pattern, and visual theme for their community pages.',
    why: 'Community identity and distinctiveness increase retention. Branding is a natural Premium upsell without requiring costly design tooling.',
    shippedNote: 'BrandingTab added to Admin Center (Premium-gated, with live preview). Branding persisted to communities.settings.branding JSONB. CommunityHero and DiscoverCommunityCard both read accentColor and coverStyle. Non-premium admins see controls and a live preview but are redirected to Billing to save.',
  },

  {
    id: 'community-custom-key-contacts',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.MEDIUM,
    title: 'Custom Community Titles & Key Contacts',
    description: 'Allow communities to label leadership contacts with titles like Rabbi, President, Organizer, or Volunteer Coordinator.',
    why: 'Phase 1 derives leadership from owner/admin/moderator roles. Custom titles need a dedicated data model and privacy review.',
    shippedNote: 'Shipped 2026-05-20. Added contact_title + contact_order columns to community_memberships via security-definer RPC set_member_contact_title (managers only). Admin Center Members tab: inline title editor + removal. CommunityMemberDirectory and CommunityWelcomeHub prefer key contacts over role-based leadership when titles are set. Incognito/hidden members excluded.',
    prompt: `You are implementing Custom Community Titles & Key Contacts for JUnited.

Context:
- Phase 1 member directory is shipped in src/components/communities/CommunityOperatingSystem.jsx.
- Membership data comes from community_memberships/UserCommunity.
- Community Admin Center is src/components/communities/CommunityAdminCenter.jsx.

Goals:
1. Audit community_memberships and profiles fields.
2. Choose a safe data model: either community_key_contacts table or community_memberships contact_title/contact_visibility columns.
3. Create a migration with RLS so community managers can edit titles and members can only read visible contact records.
4. Add Admin Center UI to assign/edit/remove contact titles.
5. Update CommunityMemberDirectory and CommunityWelcomeHub to show custom key contacts without exposing private data.
6. Run npm run lint && npm run typecheck && npm run build.
7. Update internal/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'community-key-contacts-reorder',
    category: 'Community',
    status: STATUS.PLANNED,
    priority: PRIORITY.LOW,
    title: 'Key Contacts Display Order',
    description: 'Let community managers drag-to-reorder key contacts and set their contact_order so they appear in a deliberate sequence.',
    why: 'contact_order column already exists in community_memberships but is always set to 0 — ordering is not yet editable. Natural follow-up to custom titles.',
    prompt: `You are implementing Key Contacts Display Order for JUnited.

Context:
- community_memberships.contact_order (SMALLINT) was added in migration 20260520024702_community_key_contacts.sql.
- set_member_contact_title RPC accepts p_order parameter but the Admin Center UI always passes 0.
- Admin Center Members tab is in src/components/communities/CommunityAdminCenter.jsx (MembersTab).
- Key contacts are rendered in CommunityMemberDirectory and CommunityWelcomeHub in src/components/communities/CommunityOperatingSystem.jsx.

Goals:
1. Add a "Key Contacts" sub-section to the Admin Center Members tab listing only members with a contact_title.
2. Show drag handles (or up/down buttons for mobile) to reorder; persist order by calling set_member_contact_title RPC with the new p_order value.
3. Reflect updated order in CommunityMemberDirectory and CommunityWelcomeHub immediately via query invalidation.
4. Run npm run lint && npm run build.
5. Update internal/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'community-scheduled-announcements-digests',
    category: 'Community',
    status: STATUS.PLANNED,
    priority: PRIORITY.MEDIUM,
    title: 'Scheduled Posts, Announcements & Community Digest',
    description: 'Schedule announcements/posts and generate weekly or monthly community digest summaries.',
    why: 'Phase 1 ships manual announcements only. Scheduling and digests need background jobs, notification/email choices, and admin controls.',
    prompt: `You are implementing Scheduled Posts, Announcements & Community Digest for JUnited.

Context:
- Announcements reuse the posts table with post_kind/type announcement.
- Admin creation lives in CommunityAdminCenter Content tab.
- Notifications service exists in src/services/notificationsService.js.

Goals:
1. Add scheduled_at, published_at, and publishing_status fields or a community_scheduled_posts table.
2. Create RLS so only community managers can schedule or edit scheduled content.
3. Add Admin Center scheduling UI for announcements and posts.
4. Add a Supabase Edge Function/cron process that publishes due scheduled posts safely.
5. Design a digest generator that summarizes recent announcements/events/resources without sending emails until the email provider is configured.
6. Add clear failure/retry states.
7. Run npm run lint && npm run typecheck && npm run build.
8. Update internal/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'community-notification-targeting-reminders',
    category: 'Community',
    status: STATUS.PLANNED,
    priority: PRIORITY.MEDIUM,
    title: 'Announcement Notifications, Event Reminders & Attendance',
    description: 'Targeted announcement notifications, RSVP reminders, and future check-in/attendance tracking.',
    why: 'Phase 1 deliberately avoided notification overbuild and did not add check-in columns. Build when notification preferences and event operations are mature.',
    prompt: `You are implementing Announcement Notifications, Event Reminders & Attendance for JUnited.

Context:
- community_event_rsvps table is live.
- EventTicketSection and EventAttendeesAdmin are the RSVP UI.
- Notifications service is src/services/notificationsService.js.

Goals:
1. Add notification preference checks for community announcement and event reminder types.
2. Add optional announcement notification targeting in CommunityAdminCenter.
3. Add event reminder scheduling for users with Going/Maybe RSVPs.
4. Add attendance/check-in fields or a separate community_event_attendance table with RLS.
5. Add admin check-in UI without exposing private attendee data to normal members.
6. Run npm run lint && npm run typecheck && npm run build.
7. Update internal/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'advanced-community-analytics-dashboard',
    category: 'Community',
    status: STATUS.PLANNED,
    priority: PRIORITY.MEDIUM,
    title: 'Advanced Community Analytics Dashboard',
    description: 'Community-level growth, engagement, announcement reach, RSVP trends, resource usage, and moderation health.',
    why: 'Basic admin overview exists. Advanced analytics fit Premium/Pro positioning and need clean event tracking.',
    prompt: `You are implementing Advanced Community Analytics Dashboard for JUnited.

Context:
- Community Admin Center has overview/analytics tabs.
- Posts, memberships, events, RSVPs, resources, reports, and plan fields are production-backed.

Goals:
1. Audit current analytics queries in CommunityAdminCenter and AdminAnalyticsDashboard.
2. Define community metrics: member growth, active members, posts, announcements, RSVP conversion, resource usage, moderation load.
3. Add any missing indexes or summary views with security_invoker where appropriate.
4. Build a polished analytics tab for community managers with 7d/30d/90d ranges.
5. Gate advanced metrics by Premium/Pro plan as appropriate.
6. Run npm run lint && npm run typecheck && npm run build.
7. Update internal/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'community-resource-library-2',
    category: 'Community',
    status: STATUS.PLANNED,
    priority: PRIORITY.MEDIUM,
    title: 'Resource Library 2.0',
    description: 'Folders, pinning controls, improved previews, versioning, permissions, and stronger resource discovery.',
    why: 'Phase 1 previews existing resources only. Larger communities need a more durable knowledge base.',
    prompt: `You are implementing Resource Library 2.0 for JUnited.

Context:
- CommunityResourceLibrary.jsx is live.
- community_resources table and community-resources storage bucket are production-backed.

Goals:
1. Audit community_resources schema, upload paths, RLS, and current free/premium resource limits.
2. Add folders/categories, pinned controls, and improved preview metadata if missing.
3. Add manager controls for resource ordering and featured resources.
4. Preserve Free limit of 10 resources and Premium unlimited behavior.
5. Improve empty states and search/filter behavior.
6. Run npm run lint && npm run typecheck && npm run build.
7. Update internal/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'community-forms-signups-volunteer-coordination',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.MEDIUM,
    shippedNote: 'Shipped 2026-05-20. Tables: community_forms, community_form_fields, community_form_submissions + allow_forms on communities. Security-definer submit_community_form RPC with membership + deadline + duplicate guards. Admin Center: Forms tab with form builder (8 field types, due date, max cap, re-submit toggle), submissions viewer, CSV export, open/close toggle. Member-facing CommunityFormsTab with inline submission UI and duplicate-submit detection. Gated by allow_forms via Settings → Modules.',
    title: 'Community Forms, Signups & Volunteer Coordination',
    description: 'Lightweight forms, signup sheets, volunteer slots, and admin export for community operations.',
    why: 'High-value for shuls, schools, nonprofits, and chesed groups, but should be built as a real operating tool instead of ad hoc post comments.',
    prompt: `You are implementing Community Forms, Signups & Volunteer Coordination for JUnited.

Context:
- Communities have posts, events, resources, memberships, and admin roles.
- Mitzvah Circle has request/offer flows that may inform volunteer coordination.

Goals:
1. Audit existing event RSVP, Mitzvah request, and resource patterns.
2. Design tables for community_forms, community_form_fields, community_form_submissions, and optional volunteer_slots.
3. Add RLS: managers create/manage forms; eligible members submit; submissions are private to managers and submitter.
4. Build Admin Center form creation/listing UI.
5. Add member-facing form/signup cards inside community pages.
6. Add CSV export if privacy-safe.
7. Run npm run lint && npm run typecheck && npm run build.
8. Update internal/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'community-volunteer-slots',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.LOW,
    title: 'Community Volunteer Slots',
    shippedNote: 'Shipped 2026-05-20. Migration 20260520200328_community_volunteer_slots.sql adds community_volunteer_slots (form_id, label, start/end_time, capacity, claimed_count) and community_volunteer_claims (slot_id, submitter_id, community_id) with RLS. claimed_count maintained by trigger. claim_volunteer_slot() RPC with FOR UPDATE lock prevents double-claiming. CreateFormPanel shows slot builder for volunteer-type forms. SubmissionsPanel shows Slot Signups summary, per-submission claimed slot labels, and CSV column. CommunityFormsTab FormCard shows slots with claim buttons, remaining capacity, and allows re-expansion for volunteer forms.',
    description: 'Named time-slots with capacity limits that managers attach to forms or events so volunteers can claim specific shifts.',
    why: 'The forms system ships without slot coordination. Volunteer slot management (e.g. pick a shift, track who signed up for each slot) is a natural extension but was deferred to keep the initial forms feature shippable.',
    prompt: `You are implementing Community Volunteer Slots for JUnited.

Context:
- community_forms and community_form_submissions are live (migration 20260520025433_community_forms.sql).
- CommunityFormsTab.jsx is the member-facing forms UI.
- AdminFormsTab in CommunityAdminCenter.jsx manages forms.

Goals:
1. Add a community_volunteer_slots table (form_id, label, start_time, end_time, capacity, created_at).
2. Add a community_volunteer_claims table (slot_id, submitter_id, community_id, claimed_at) with RLS.
3. Update CreateFormPanel in CommunityAdminCenter to allow attaching named slots to volunteer-type forms.
4. Update CommunityFormsTab to display slots with remaining capacity and a claim button.
5. Add slot summary to SubmissionsPanel CSV export.
6. Run npm run lint && npm run build.
7. Update internal/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'community-notification-preferences',
    category: 'Community',
    status: STATUS.PLANNED,
    priority: PRIORITY.MEDIUM,
    title: 'Community Notification Preferences',
    description: 'Per-community notification controls for announcements, events, replies, resources, and reminders.',
    why: 'Push notifications and notification preferences exist at the app level, but communities need member-level controls before targeted alerts scale.',
    prompt: `You are implementing Community Notification Preferences for JUnited.

Context:
- Push notifications and notification_preferences are production-backed.
- Community announcements and RSVPs are live.

Goals:
1. Audit existing notification_preferences schema and Settings UI.
2. Create or extend tables for per-community preferences by user_id/community_id.
3. Add RLS so users manage only their own preferences.
4. Add a compact preferences surface inside community detail/about or member settings.
5. Update notificationsService.js to respect per-community settings for announcement/event types.
6. Run npm run lint && npm run typecheck && npm run build.
7. Update internal/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'community-recognition-badges',
    category: 'Community',
    status: STATUS.PLANNED,
    priority: PRIORITY.LOW,
    title: 'Community Recognition & Badges',
    description: 'Community-specific recognition for volunteers, helpful members, organizers, and milestone contributors.',
    why: 'Useful for community health and chesed culture, but should come after core operating tools and privacy rules are stable.',
    prompt: `You are implementing Community Recognition & Badges for JUnited.

Context:
- Profiles already show badges/impact concepts.
- Communities have memberships, roles, posts, events, and RSVP data.

Goals:
1. Audit existing profile badge and impact components.
2. Design community_badges and community_member_badges tables with RLS.
3. Let managers award/remove badges, with optional reason text.
4. Show badges tastefully in CommunityMemberDirectory and profile/community sections.
5. Avoid gamifying sensitive support communities unless explicitly enabled.
6. Run npm run lint && npm run typecheck && npm run build.
7. Update internal/roadmap.js: change this item's status to 'shipped'.`,
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
    shippedNote: 'Shipped. /Events queries community_events for user\'s followed communities. /MyEvents shows going RSVPs + created events. /CommunityCalendar redirects to /Events; the old CommunityCalendar page file was removed during the canonical-route cleanup. EventTicketSection reused for RSVP. Routes live in App.jsx.',
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
8. Update internal/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'community-groups',
    category: 'Community',
    status: STATUS.SHIPPED,
    priority: PRIORITY.MEDIUM,
    title: 'Community Groups & Sub-Groups',
    description: 'Private groups within communities, with posts, chat, resources, and member management.',
    shippedNote: 'Shipped 2026-05-17, then consolidated 2026-05-18. Migration 20260517221000_community_groups.sql creates community_groups, group_members, group_posts, group_join_requests with RLS. CommunityGroup, GroupMember, GroupPost, GroupJoinRequest remain wired in base44Client.js for sub-groups inside Communities. Standalone /Groups and /groups/:groupId now redirect to /Communities so Communities stays the canonical social layer. CommunityGroupsTab.jsx is the intended discovery surface.',
    prompt: `You are implementing Community Groups for JUnited.

Context: The standalone Groups page was removed after Communities became the canonical
        social layer. CommunityGroupPage.jsx remains available inside Communities.

Goals:
1. Create migrations: community_groups, group_members, group_posts tables with RLS.
2. Wire GroupMember, GroupPost entities in base44Client.js SUPABASE_ENTITY_TABLES.
3. Keep /Groups as a redirect to /Communities unless groups are intentionally promoted again.
4. Connect CommunityGroupPage.jsx to real DB data.
5. Add join/leave group flows with role management (owner, member).
6. Groups should be discoverable from the community detail page.
7. Update internal/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'group-join-request-admin-ui',
    category: 'Community',
    status: STATUS.SHIPPED,
    shippedNote: 'Shipped 2026-05-20. Dedicated Requests tab added to CommunityGroupPage.jsx, visible only to owners/admins (role derived from group_members). Approve inserts into group_members + increments member_count; Deny updates status to denied. Badge count on tab. Error handling on all actions.',
    priority: PRIORITY.MEDIUM,
    title: 'Group Join Request Approval UI',
    description: 'Admin UI for private group owners/admins to approve or deny pending join requests.',
    why: 'group_join_requests table and DB flow are live but group admins have no UI surface to approve or deny pending requests. Private groups are unusable without this.',
    prompt: `You are implementing the Group Join Request Approval UI for JUnited.

Context: The group_join_requests table exists (migration 20260517221000_community_groups.sql).
        Pending requests should be created from the Communities sub-group surface when is_private is true.
        CommunityGroupPage.jsx is at src/components/communities/CommunityGroupPage.jsx.
        The old standalone GroupPage.jsx file was removed during canonical-route cleanup.
        group_members.role can be 'owner', 'admin', or 'member'.

Goals:
1. In CommunityGroupPage.jsx, add a "Requests" tab visible only to admins/owners (role check against membership).
2. On the Requests tab, query group_join_requests where group_id = current group and status = 'pending'.
3. Show each requester's user_name and joined date, with Approve and Deny buttons.
4. Approve: insert into group_members (role: 'member'), update group_join_requests status to 'approved', increment member_count via incrementCounter.
5. Deny: update group_join_requests status to 'denied'.
6. Invalidate relevant queries after each action.
7. Update internal/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'group-extended-tabs',
    category: 'Community',
    status: STATUS.DEFERRED,
    priority: PRIORITY.LOW,
    title: 'Group Events, Discussion & Resources Tabs',
    description: 'Re-enable Events, Forum, and Resources tabs in CommunityGroupPage once their backing tables and entity mappings are built.',
    why: 'Deferred during Community Groups MVP — these three tabs were removed because GroupEvent, GroupDiscussion, DiscussionLike, DiscussionComment, and GroupResource entities have no DB tables or entity mappings yet. Build after group adoption is confirmed.',
    prompt: `You are re-enabling the Events, Discussion, and Resources tabs in the Group detail page for JUnited.

Context: CommunityGroupPage.jsx is at src/components/communities/CommunityGroupPage.jsx.
        The three tabs were removed during Community Groups MVP (2026-05-17) because their
        backing entities (GroupEvent, GroupDiscussion, DiscussionLike, DiscussionComment,
        GroupResource, RSVP) have no migrations or entity mappings yet.
        Entity mappings live in src/api/base44Client.js SUPABASE_ENTITY_TABLES.
        Migrations go in supabase/migrations/ as timestamped .sql files.

Goals:
1. Create migrations for group_events, group_discussions, discussion_likes, discussion_comments, group_resources tables with RLS (members can read; admins can post).
2. Add entity mappings in base44Client.js.
3. Restore the Events, Forum, and Resources tab definitions in CommunityGroupPage TABS array.
4. Restore the tab content blocks (GroupEventsTab, GroupDiscussionTab, GroupResourcesTab) in CommunityGroupPage JSX.
5. Verify GroupEventsTab.jsx, GroupDiscussionTab.jsx, GroupResourcesTab.jsx at src/components/groups/ work with real data.
6. Update internal/roadmap.js: change this item's status to 'shipped'.`,
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
5. Update internal/roadmap.js: change this item's status to 'shipped'.`,
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
7. Update internal/roadmap.js: change this item's status to 'shipped'.`,
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
6. Update internal/roadmap.js: change this item's status to 'shipped'.`,
  },

  // ── Chesed & Mitzvah ─────────────────────────────────────────────────────

  {
    id: 'meal-trains',
    category: 'Chesed & Mitzvah',
    status: STATUS.SHIPPED,
    priority: PRIORITY.HIGH,
    title: 'Meal Train Requests',
    description: 'Coordinate meal deliveries for families in need, with slot sign-ups and notifications.',
    shippedNote: 'Shipped 2026-06-22. Migration supabase/migrations/20260622223000_meal_trains.sql adds meal_train_requests + meal_slots with RLS, plus atomic claim_meal_slot()/release_meal_slot() SECURITY DEFINER RPCs (FOR UPDATE lock, mirrors claim_volunteer_slot). MealTrainRequest/MealSlot mapped in base44Client.js SUPABASE_ENTITY_TABLES (removed from the unmapped-entities list). New src/components/mitzvah/MealTrainsSection.jsx: create-train modal (family name, date range, meal type, dietary notes, address with optional hide-exact-address), one slot per day, claim/release UI, local-demo-mode fallback when no Supabase backend. Wired into src/pages/MitzvahCircle.jsx as a new "Meal Trains" tab (added to workflowTabs and VALID_VIEWS — the latter matters, the tab silently bounced back to Browse without it). Notification to the train creator on claim via notificationsService.create() (type "meal_train_claimed", links to /MitzvahCircle). Reachable today: any signed-in user → /MitzvahCircle → "Meal Trains" tab. NOT shipped in this pass: map-pin display on MitzvahMap (goal from the original prompt) — meal_train_requests only stores a free-text delivery_address, not lat/lng, so there is no coordinate to plot without adding geocoding. Tracked separately below as meal-train-map-pins.',
  },

  {
    id: 'meal-train-map-pins',
    category: 'Chesed & Mitzvah',
    status: STATUS.DEFERRED,
    priority: PRIORITY.LOW,
    title: 'Show Meal Trains on the Mitzvah Map',
    description: 'Plot open meal trains as pins on MitzvahMap with a distinct icon, as originally scoped for meal-trains.',
    why: 'Deferred out of the meal-trains build (shipped 2026-06-22) because meal_train_requests only stores a free-text delivery_address — there is no lat/lng to plot, and adding a geocoding step was out of scope for that pass.',
    prompt: `You are adding map pins for meal trains to JUnited's Mitzvah Map.

Context:
- meal_train_requests (supabase/migrations/20260622223000_meal_trains.sql) has delivery_address (free text) and hide_exact_address, but no location_lat/location_lng columns.
- src/components/mitzvah/MitzvahMap.jsx renders pins from a flat "requests" prop (each item needs type, location_lat, location_lng — see getRequestPinType() and PIN_TYPES) plus a separate communityPoints prop. It does not fetch its own data.
- src/components/mitzvah/MealTrainsSection.jsx already lists open meal trains via the MealTrainRequest entity (src/api/base44Client.js).

Goals:
1. Add location_lat/location_lng (nullable) columns to meal_train_requests via a new migration, and a geocode step (reuse whatever geocoding approach AdminBusinessImport.jsx / the Google Places import tool uses, or a simple address-to-coordinates call) when a train is created with a delivery_address and hide_exact_address = false.
2. Add a 'meal_train' entry to PIN_TYPES in MitzvahMap.jsx with a distinct color/short label.
3. In src/pages/MitzvahCircle.jsx, fetch open meal trains with coordinates and merge them into the points passed to MitzvahMap (as their own array, or appended into requestPoints with isRequest: false so clicking doesn't trigger the offer flow).
4. Respect hide_exact_address: if true, jitter the plotted point or only show a neighborhood-level pin rather than the exact address.
5. Update internal/roadmap.js: change this item's status to 'shipped'.`,
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
7. Update internal/roadmap.js: change this item's status to 'shipped'.`,
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
6. Update internal/roadmap.js: change this item's status to 'shipped'.`,
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
7. Update internal/roadmap.js: change this item's status to 'shipped'.`,
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
8. Update internal/roadmap.js: change this item's status to 'shipped'.`,
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

        Unwired scaffolding already exists from an earlier pass at src/components/shul/ — RideBoard.jsx,
        VolunteerBoard.jsx, MinyanStatusWidget.jsx, WeeklyScheduleWidget.jsx, CreateShulPostModal.jsx,
        AdminBroadcastModal.jsx, MediaTab.jsx — none currently imported by any page. They reference
        Shul, ShulPost, ShulSchedule, RideRequest, MinyanAttendance, VolunteerOpportunity, and
        VolunteerSignup entities, none of which have SUPABASE_ENTITY_TABLES mappings or migrations yet
        (base44Client.js documents them in its "Required DB tables" comment). Reuse these components
        instead of rebuilding from scratch — read each one before writing new UI.

Goals:
1. Create shuls migration (name, address, rabbi_name, phone, website, logo_url, schedule_json, minyan_times_json) plus tables for the other unmapped entities above as needed.
2. Wire Shul, ShulPost, ShulSchedule, RideRequest, MinyanAttendance, VolunteerOpportunity, VolunteerSignup entities in base44Client.js.
3. Connect ShulPage.jsx (/ShulPage) to real data, wiring in the existing src/components/shul/ components.
4. Add shul search to the Search page.
5. Link shul pages to corresponding community pages if they exist.
6. Re-add /ShulPage route to App.jsx.
7. Update internal/roadmap.js: change this item's status to 'shipped'.`,
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
8. Update internal/roadmap.js: change this item's status to 'shipped'.`,
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
5. Update internal/roadmap.js: change this item's status to 'shipped'.`,
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
6. Update internal/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'siddur-nusach-tefillin-source',
    category: 'Jewish Life',
    status: STATUS.BLOCKED,
    priority: PRIORITY.MEDIUM,
    title: 'Siddur — Verify Per-Nusach Tefillin Brachos Source',
    description: 'SiddurPage.jsx previously hardcoded the Sefaria ref for "Tefillin Brachos" to the Ashkenaz text even under the Nusach Sefard and Edot HaMizrach tabs, so Sephardic/Mizrahi users would have seen Ashkenazi-rite blessing text silently mislabeled as their own nusach. Fixed 2026-06-26 by removing the item from the Sefard and Edot HaMizrach "Weekday Basics" sections rather than shipping an unverified ref guess.',
    why: 'Content-accuracy audit requested by the user found this mislabeling. This sandbox cannot reach sefaria.org to confirm the correct per-nusach ref strings (network policy blocks the domain), so a real fix needs someone with live Sefaria access to find the correct Siddur Sefard / Siddur Edot HaMizrach refs for the Tefillin section and re-add the item with the right source — until then it is correctly omitted rather than wrong.',
    needs: ['Live access to sefaria.org to look up the exact ref strings (e.g. via the Sefaria API table-of-contents for "Siddur Sefard" and "Siddur Edot HaMizrach") for their Tefillin/preparatory-prayers sections.'],
    prompt: `You are restoring the Tefillin Brachos item to the Nusach Sefard and Edot HaMizrach siddur sections in JUnited, with a correctly sourced Sefaria reference.

Context: src/components/jewish/SiddurPage.jsx
  - SEFARD_SECTIONS 'basics' section and EDOT_MIZRACH_SECTIONS 'basics' section each have a comment where a 'tefillin-brachos' prayer() entry used to be (it was removed because it incorrectly hardcoded the Ashkenaz ref 'Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Tefillin').
  - The ASHKENAZ_SECTIONS version of this item is still correct for the Ashkenaz tab and should not change.
  - Prayers are fetched live from Sefaria's text API (SEFARIA_TEXTS_URL) using the 'ref' string — the ref must exactly match a real Sefaria text node or the fetch throws and the UI shows a "Could not load" error.

Goals:
1. Look up Sefaria's table of contents for "Siddur Sefard" and "Siddur Edot HaMizrach" (e.g. https://www.sefaria.org/api/v2/raw/index/Siddur%20Sefard) to find the exact node title for their Tefillin / preparatory-prayers blessing section.
2. Add back a prayer('tefillin-brachos', 'Tefillin Brachos', '<verified Sefaria ref>', { english: false, sourceLinks: [CHABAD_SOURCES.tefillin] }) entry to SEFARD_SECTIONS basics and a separate one with the Edot HaMizrach ref to EDOT_MIZRACH_SECTIONS basics. Drop the lineIndexes filter unless the verified ref's line layout matches the Ashkenaz one.
3. Manually load the Siddur page with each nusach selected and confirm the Tefillin Brachos item renders real Hebrew text (not a load error) and that it is genuinely the Sefard/Edot HaMizrach nusach wording, not Ashkenaz text reused under a different ref.
4. Update internal/roadmap.js: change this item's status to 'shipped'.`,
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
7. Update internal/roadmap.js: change this item's status to 'shipped'.`,
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
6. Update internal/roadmap.js: change this item's status to 'shipped'.`,
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
7. Update internal/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'business-admin-verification',
    category: 'Businesses & Map',
    status: STATUS.SHIPPED,
    priority: PRIORITY.HIGH,
    title: 'Admin Business Verification Workflow',
    description: 'Admin UI to grant/revoke verified_owner and verified Jewish-owned status on business listings. The Verified strip on the Businesses page and trust badges on business cards depend on these fields being set.',
    shippedNote: 'Shipped 2026-06-22, two complementary paths merged from parallel work. (1) src/pages/AdminModerationQueue.jsx "Businesses" tab — the pre-existing review UI/RPCs (approve/reject_business_listing_submission, approve/reject_business_claim_request from supabase/migrations/20260517034050_business_owner_tools.sql + 20260516011532_business_directory_mvp.sql) now has a notifyBusinessOwner() helper wired into the onSuccess handler of all four mutations, so owners get an in-app notification ("business_verification", linking to /Map) on publish/reject/claim-approve/claim-reject. (2) New dedicated src/pages/AdminBusinessVerification.jsx page (route /AdminBusinessVerification, linked from Settings → Admin Tools) lists businesses with pending verification/jewish-owned/kosher status and lets admins verify owner, verify Jewish-owned, mark kosher certified, or reject — backed by SECURITY DEFINER RPC admin_verify_business(p_business_id, p_verification_status, p_jewish_owned_status, p_kosher_status, p_review_note) in migration 20260622213239_admin_business_verification.sql, which validates is_admin(), enforces the real check-constraint enum values, inserts a business_verified/business_rejected notification (verified_owner_id, falling back to submitted_by), and invalidates business-directory-published so the Map verified strip refreshes. Reachable today via either admin → /AdminModerationQueue → "Businesses" tab, or admin → /AdminBusinessVerification.',
  },

  {
    id: 'kosher-certifying-agency-disclosure',
    category: 'Businesses & Map',
    status: STATUS.SHIPPED,
    priority: PRIORITY.HIGH,
    title: 'Kosher Badge Requires a Named Certifying Agency',
    description: 'The "Kosher Certified" trust badge previously could be set by an admin or via a free-text claim with no real kashrus agency named anywhere — a legal/authenticity risk, since JUnited is not a kashrus authority and the badge read as an unqualified guarantee. Businesses and claimants now must name the certifying agency, and the badge discloses it (e.g. "Kosher — per OU") with a self-reported/not-independently-verified disclaimer.',
    shippedNote: 'Shipped 2026-06-26. Migration 20260626140000_kosher_certifying_agency.sql adds business_listings.kosher_certifying_agency and business_claim_requests.kosher_certifying_agency_claim, plus a check constraint that blocks kosher_status = \'certified\' without a non-empty agency name. admin_verify_business RPC gained p_kosher_certifying_agency and now raises an exception if certified is requested with no agency on file. approve_business_claim_request RPC now requires v_claim.kosher_certifying_agency_claim before p_verify_kosher can set certified. UI: src/pages/Map.jsx SubmitBusinessModal and ClaimBusinessModal both gained a required "Certifying agency" field that appears once a kosher claim is entered, and TrustBadges renders "Kosher — per [Agency]" (or "Kosher (agency not on file)" for any pre-existing row without one) plus a showDisclaimer paragraph in BusinessDetailModal explaining JUnited does not verify kashrus claims independently. src/pages/AdminBusinessVerification.jsx now shows the submitted claim text and an editable required agency field, and disables the "Kosher certified" button until it is filled in. src/pages/AdminModerationQueue.jsx Businesses tab now only shows "Approve + Kosher" when the claim has a named agency. Reachable today via Map → Submit a Business / Claim a Business (agency field appears under the kosher claim field), Map business detail card (disclaimer + agency-disclosing badge), and admin → /AdminBusinessVerification or /AdminModerationQueue → Businesses tab.',
  },

  {
    id: 'kosher-certification-expiration-tracking',
    category: 'Businesses & Map',
    status: STATUS.PLANNED,
    priority: PRIORITY.MEDIUM,
    title: 'Kosher Certification Expiration / Renewal Tracking',
    description: 'Real kashrus certifications lapse or get revoked. Right now once a business is marked kosher_status = "certified" with an agency name (see kosher-certifying-agency-disclosure), there is no expiration date and no periodic re-confirmation, so a badge could keep showing long after a certification ended.',
    why: 'Surfaced as a follow-up while fixing the unqualified "Kosher Certified" badge. Out of scope for that fix (which only required naming the agency), but a real risk for a badge that is meant to be trustworthy over time.',
    prompt: `You are adding kosher-certification expiration tracking for JUnited.

Context: business_listings.kosher_certifying_agency and the 'certified' kosher_status path are defined in supabase/migrations/20260626140000_kosher_certifying_agency.sql. Admin review UI is src/pages/AdminBusinessVerification.jsx and src/pages/AdminModerationQueue.jsx (Businesses tab). Public badge is TrustBadges in src/pages/Map.jsx.

Goals:
1. Add a migration with business_listings.kosher_certification_expires_at (date, nullable) and require admins to set it (or explicitly mark "no expiration provided") when setting kosher_status = 'certified', mirroring the agency-name requirement pattern already in admin_verify_business.
2. Add a scheduled job (Supabase cron, see supabase/migrations/20260625000000_daily_refresh_cron.sql for the existing cron pattern) that flips kosher_status from 'certified' to 'pending' once kosher_certification_expires_at has passed, and notifies the owner to renew.
3. Surface the expiration date (or "no expiration on file") in the TrustBadges disclaimer and in the admin review UI.
4. Update internal/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'map-listing-endorsement-framing-review',
    category: 'Businesses & Map',
    status: STATUS.PLANNED,
    priority: PRIORITY.MEDIUM,
    title: 'Review "Featured" / Directory Framing for Real-World Businesses & Shuls',
    description: 'src/pages/Communities.jsx hardcodes a FEATURED_SHULS list of real synagogue names (Young Israel Woodmere, Chabad of Woodmere, Beth Shalom, Shaaray Tefila), and src/components/mitzvah/MitzvahMap.jsx hardcodes real kosher businesses with addresses/source_url (e.g. Gourmet Glatt Cedarhurst). The factual citation itself (Yelp-style directory entries pointing at public sources) is fine, but the word "Featured" implies an endorsement or partnership that does not exist, and none of these real-world organizations have opted in or been asked.',
    why: 'Surfaced during the legal/authenticity audit that produced kosher-certifying-agency-disclosure. Lower severity than the kosher badge (no certification claim is being made), but the same root issue — making a claim about a real third party without their involvement — so it is worth a deliberate decision rather than leaving the copy as-is by default.',
    prompt: `You are reviewing "Featured" framing for real-world organizations on JUnited.

Context: const FEATURED_SHULS in src/pages/Communities.jsx (near the top of the file) lists real synagogue names with no opt-in mechanism. src/components/mitzvah/MitzvahMap.jsx has hardcoded real business listings (e.g. 'shop-gourmet-glatt-cedarhurst') with source_url citations.

Goals:
1. Decide and document (in this roadmap entry's why field) whether "Featured" implies endorsement that requires consent, vs. is read as neutral directory placement like Yelp/Google Maps.
2. If consent is required: replace FEATURED_SHULS with data driven from real opted-in/claimed community or business records (e.g. communities.featured_on_directory boolean set by an admin only after the organization is contacted), rather than a static hardcoded array.
3. If neutral directory framing is acceptable: rename "Featured" to non-endorsing language (e.g. "Nearby" or "In the directory") in both files, and ensure every hardcoded factual entry keeps its source_url citation.
4. Update internal/roadmap.js: change this item's status to 'shipped' once a decision is implemented.`,
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
6. Update internal/roadmap.js: change this item's status to 'shipped'.`,
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
    status: STATUS.SHIPPED,
    shippedNote: 'posts_feed_view Postgres view joins posts + profiles + communities. PostFeedView entity in SUPABASE_ENTITY_TABLES. useFeedData.js queries PostFeedView. toAppRow prefers profile_display_name, profile_avatar_url, community_name_fresh. Feed card components render avatar_url img when present.',
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
6. Update internal/roadmap.js: change this item's status to 'shipped'.`,
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
7. Update internal/roadmap.js: change this item's status to 'shipped'.`,
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
7. Update internal/roadmap.js: change this item's status to 'shipped'.`,
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
8. Update internal/roadmap.js: change this item's status to 'shipped'.`,
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
8. Update internal/roadmap.js: change this item's status to 'shipped'.`,
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
8. Update internal/roadmap.js: change this item's status to 'shipped' if the basic version works.`,
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
    status: STATUS.SHIPPED,
    priority: PRIORITY.MEDIUM,
    title: 'Community Store / Paid Community Transactions',
    description: 'Digital storefront for communities to sell merchandise, tickets, and fundraise using Stripe Connect, not direct JUnited donation checkout.',
    shippedNote: `Partially shipped 2026-05-20. Data infrastructure: community_listings table (existing, migration 020_community_feature_backbone.sql) + community_orders table (migration 20260520030000_community_orders.sql) with buyer_id, listing_id, amount_cents, currency, status, stripe_checkout_session_id, stripe_payment_intent_id, destination_connected_account_id, application_fee_amount; RLS: managers read all orders, buyers read own orders. CommunityStoreTab.jsx migrated from dataService bridge to direct Supabase queries + Supabase Storage image uploads. Admin Store tab added to CommunityAdminCenter: full listing CRUD (create/edit/toggle active/delete), "Checkout coming soon" notice. Member-facing buy button remains disabled ("Coming Soon") — payment processing requires stripe-connect-payout-foundation (STATUS.PLANNED). Checkout flow must use destination charges (transfer_data.destination + application_fee_amount) once that foundation ships.`,
    why: 'Payment processing remains deferred until the Stripe Connect payout foundation is built. The old PaymentModal must not be used for marketplace payments because funds need to route to connected recipients with an application fee.',
    prompt: `You are wiring Stripe Connect checkout into the Community Store for JUnited.

Context:
  - community_listings and community_orders tables are live (migration 20260520030000_community_orders.sql).
  - CommunityStoreTab.jsx uses direct Supabase queries. The buy button is disabled showing "Coming Soon".
  - The stripe-connect-payout-foundation feature must be shipped first (it creates connected accounts + the checkout Edge Function).
  - Do NOT use the old PaymentModal or create-checkout-session Edge Function for this flow.
  - Payments must use destination charges: transfer_data.destination = connected_account_id, application_fee_amount = platform fee.

Goals:
1. Implement the Stripe Connect checkout Edge Function (or extend the platform one) for community listings.
2. On buy click in CommunityStoreTab.jsx, call the Edge Function with listing_id; receive checkoutUrl, redirect to Stripe.
3. On webhook checkout.session.completed (listing branch), insert a row into community_orders with status = 'paid'.
4. Increment community_listings.orders_count via a trigger or RPC.
5. Show buyers their order history (basic) in CommunityStoreTab.
6. Show order counts and recent orders in the Admin Store tab.
7. Run npm run lint && npm run build.
8. Update internal/roadmap.js: change community-store shippedNote to reflect full checkout live.`,
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
8. Update internal/roadmap.js: change this item's status to 'shipped'.`,
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
4. Update internal/roadmap.js: change this item's status to 'shipped'.`,
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
6. Update internal/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'premium-community-plans',
    category: 'Growth & Monetization',
    status: STATUS.SHIPPED,
    priority: PRIORITY.HIGH,
    title: 'Premium Community Plans',
    description: 'SaaS-style paid community subscriptions for community owners/admins. Free communities remain useful, while Premium unlocks advanced admin, automation, branding, events/resources/listings, and growth tools.',
    why: 'This is the primary subscription model for JUnited. The existing recurring supporter subscription is secondary and should not be used to determine community feature access.',
    shippedNote: 'Shipped 2026-05-17. Added community_plan_subscriptions plus community plan state fields, owner/admin-only Stripe Checkout and Billing Portal Edge Functions, webhook sync for community-scoped subscriptions, Community Admin Center Billing UI, and separate Premium Communities analytics. Revised 2026-05-17: Free communities include posts, members, basic admin tools, limited Events (3 upcoming published) and limited Resources (10 total). Premium unlocks unlimited events/resources, group chat, marketplace/listings, stronger admin controls, and basic analytics.',
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
9. Update internal/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'community-pro-plan',
    category: 'Growth & Monetization',
    status: STATUS.PLANNED,
    priority: PRIORITY.MEDIUM,
    title: 'Community Pro Plan',
    description: 'Future higher-tier community plan for larger shuls, schools, organizations, and high-activity groups that need deeper analytics, automation, exports, advanced communications, and stronger customization.',
    why: 'Free should drive adoption and Premium should run a complete community hub. Pro should become the future tier for serious institutions with heavier admin, reporting, workflow, and monetization needs.',
    prompt: `You are designing and implementing the future Community Pro Plan for JUnited.

Context:
  - Current community plans are Free and Premium.
  - Free includes posts, members, basic admin tools, limited Events, and limited Resources.
  - Premium includes unlimited Events/Resources, Group Chat, Marketplace/Listings, billing controls, and basic community analytics.
  - Existing plan state lives on communities.plan_key / plan_status and community_plan_subscriptions.
  - Existing community admin UI lives in CommunityAdminCenter.jsx.
  - Existing admin analytics lives in AdminAnalyticsDashboard.jsx.

Goals:
1. Audit the shipped Free/Premium plan model and identify which capabilities are truly production-backed.
2. Design Community Pro as a higher tier for larger shuls, schools, organizations, and high-activity communities.
3. Evaluate and implement only production-backed Pro features. Candidate Pro features include:
   - advanced community analytics,
   - engagement and growth dashboards,
   - scheduled posts and announcements,
   - automations/workflows,
   - advanced moderation and audit history,
   - multiple subgroup chats or advanced communication tools,
   - CSV/data exports,
   - stronger customization and branding,
   - higher storage/resource limits if caps exist,
   - lower future JUnited transaction fees for in-app payments,
   - community admin AI/growth tools if a secure AI backend exists.
4. Add or update Stripe Billing price IDs and checkout/webhook handling for the Pro tier without breaking existing Premium subscriptions.
5. Update community entitlement helpers so Free, Premium, and Pro checks are centralized.
6. Update CommunityAdminCenter billing copy and plan comparison UI.
7. Add analytics that separately tracks Premium vs Pro communities.
8. Run npm run lint, npm run typecheck, npm run build, and npm run check-prompts.
9. Update internal/roadmap.js: change this item's status to 'shipped'.`,
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
8. Update internal/roadmap.js: change this item's status to 'shipped'.`,
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
8. Update internal/roadmap.js: change this item's status to 'shipped'.`,
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
8. Update internal/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'in-app-payment-retention-trust-layer',
    category: 'Growth & Monetization',
    status: STATUS.SHIPPED,
    priority: PRIORITY.MEDIUM,
    title: 'In-App Payment Trust & Retention Layer',
    description: 'UX and policy system that makes in-app payments easier and more useful than Zelle/Venmo without pretending off-platform payment can be fully prevented.',
    why: 'JUnited can encourage in-app payment through convenience, records, status, receipts, admin visibility, and safer workflows, but should not overpromise enforcement.',
    shippedNote: 'Phase 1 (active payment surfaces): (1) PaymentTrustBenefits.jsx shared component — compact icon-row block: receipt saved, easier refunds/disputes/support, no payment-handle exchange, optional community-record row for admin contexts. (2) PaymentModal — trust block shown above pay CTA for all active checkout flows (donations, event registration, community membership). (3) EventTicketSection paid path — dev "Demo only" note replaced with PaymentTrustBenefits so trust framing is in place when paid ticket checkout goes live. (4) ThankYou page — receipt-saved confirmation row + transaction history link shown after confirmed payment. (5) ReportModal — "off_platform_payment_pressure" reason added (priority: high) so users can report messages pressuring off-platform payment. Deferred pending connect-platform-payments-application-fees: per-card payment status badges on event/listing/mitzvah items, chat payment guidance with transaction context, admin community transaction revenue summaries.',
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
8. Update internal/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'premium-analytics',
    category: 'Growth & Monetization',
    status: STATUS.PLANNED,
    priority: PRIORITY.LOW,
    title: 'Group Premium Analytics',
    description: 'Analytics dashboard for community group admins: member growth, post engagement, and trend data.',
    why: 'Community Groups are now live — this is the natural next step for group admin tooling.',
    prompt: `You are implementing Premium Group Analytics for JUnited.

Context: GroupAnalyticsDashboard.jsx exists in src/components/groups/. Community Groups must
        be live first (internal/roadmap.js id: 'community-groups').

Goals:
1. Connect GroupAnalyticsDashboard.jsx to real Supabase data.
2. Track post counts, member growth, and reaction totals from posts/reactions tables.
3. Add time-range filters (7d, 30d, 90d).
4. Gate analytics behind group admin role (group_members.role = 'admin').
5. Re-add GroupAnalyticsDashboard to CommunityGroupPage.jsx.
6. Update internal/roadmap.js: change this item's status to 'shipped'.`,
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
7. Update internal/roadmap.js: change this item's status to 'shipped'.`,
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
7. Update internal/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'ios-app-store-readiness',
    category: 'Admin & Platform',
    status: STATUS.SHIPPED,
    priority: PRIORITY.HIGH,
    title: 'iOS App Store Readiness Admin Tool',
    description: 'Structured admin tool at /AdminiOSReadiness for tracking iOS App Store submission progress. Static catalog of ~55 required and optional tasks across 10 categories (build setup, auth, account management, privacy, metadata, legal, UI, performance, app review). Persistent per-task status/notes via ios_app_store_readiness_progress table. AI copy prompts for AI-executable tasks, numbered manual steps for human tasks. Overall readiness score with progress bar.',
    shippedNote: 'Shipped. Config: internal/iosReadiness.js. Page: removed AdminiOSReadiness page. Migration: 20260516175045_ios_app_store_readiness_progress.sql. Admin display route removed.',
  },

  {
    id: 'ux-accessibility-audit',
    category: 'Admin & Platform',
    status: STATUS.SHIPPED,
    priority: PRIORITY.MEDIUM,
    title: 'Accessibility Audit & Remediation',
    shippedNote: 'Shipped 2026-05-20. Added :focus-visible outline (2px blue #2563EB) to src/index.css. Fixed j-text-meta contrast from #64748B (~4.25:1) to #475569 (~5.74:1). Enhanced prefers-reduced-motion block to explicitly disable named animation classes (.chesed-cta-pulse, .reaction-pop, .nav-active-pill, .nav-icon-active, .motion-page-enter, .motion-soft-in, .tab-fade-in, .skeleton, .splash-progress-bar) with animation: none and will-change: auto. Leaflet zoom controls bumped from 38px to 44px. Added aria-label to icon-only buttons in ChatView (back, more-options), NewMessageComposer (cancel, clear-search), MessageRequestsTab (accept, decline). Added aria-hidden + sr-only unread text to ConversationList blue dot. Sonner Toaster already ships with built-in aria-live regions.',
    description: 'WCAG 2.1 AA review across all pages: color contrast, focus states, touch targets, screen reader labels, motion preferences, and keyboard navigation.',
    why: 'Discovered during 2026-05-17 UX pass — JUnited has strong visual design but focus states, aria labels on icon buttons, and color-only signals need review before App Store launch.',
    prompt: `You are performing an accessibility audit and remediation for JUnited.

Context: The app is a mobile-first React 18 app. Stack: Tailwind CSS, shadcn/ui, Lucide icons.
        Known gaps from 2026-05-17 UX audit:
        - Icon-only buttons (search, share, back arrow) may lack aria-label
        - Some color-only unread indicators (blue dot) have no text alternative
        - Focus-visible ring may not be visible on all interactive elements
        - Touch targets should be min 44×44px per Apple HIG
        - src/index.css has @media (prefers-reduced-motion) not consistently applied

Goals:
1. Audit all icon-only buttons (Lucide icons with no visible text) and add aria-label if missing.
2. Verify focus-visible outlines are visible on all interactive elements — add :focus-visible CSS if any are missing.
3. Audit minimum touch target sizes — any button < 44px height that is not inside a larger touch target.
4. Add aria-live region for toast notifications so screen readers announce them.
5. Check color-contrast ratios on: j-text-meta (slate-500 on white), notification unread dot, chip labels.
6. Verify prefers-reduced-motion disables appFadeSlide, navPillIn, reactionPop, chesedPulse animations.
7. Update internal/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'ux-design-audit-primitives',
    category: 'Admin & Platform',
    status: STATUS.SHIPPED,
    priority: PRIORITY.MEDIUM,
    title: 'Frontend Design Audit & CSS Primitives',
    shippedNote: 'Shipped 2026-05-20. Audited all major pages with Playwright screenshots (feed, communities, messages, profile). Top inconsistency: active tab pills / filter chips were using bg-slate-950/bg-slate-800 (black) instead of bg-blue-600 (primary blue). Fixed in Messages.jsx (Inbox/Requests tabs + All/Unread/Communities/Requests filter chips) and Communities.jsx (DiscoverEmptyState "Clear filters" CTA). Added new CSS primitives to src/index.css: .app-tab-pill/.app-tab-pill-active (blue), .app-tab-pill-dark (intentional dark/segment-control), .app-section-label, .app-empty-state family (.app-empty-state-icon, .app-empty-state-title, .app-empty-state-body), .app-ghost-button/.app-ghost-button-muted. Created STYLE_GUIDE.md documenting the full design language: colors, typography, buttons, cards, spacing, motion, and "what NOT to do" rules.',
    description: 'Audit entire frontend for visual inconsistency. Define and extend shared CSS primitives. Create STYLE_GUIDE.md. Fix the most visible color-consistency issues.',
    why: 'Discovered during May 2026 feature sprint — multiple pages used black (slate-950) for active/primary UI elements while the design system primary is blue. Style guide prevents the same drift from re-occurring.',
    prompt: `You are performing a frontend design audit and creating a unified design system for JUnited.

Context: src/index.css has a working set of primitives (.app-button-primary, .app-card, .app-chip, etc.).
        Many pages bypass these in favor of one-off Tailwind. The biggest inconsistencies are in
        active tab/chip colors (some pages use slate-950/black, the design system uses blue-600),
        empty state layouts (each page invents its own), and section label typography.

Goals:
1. Capture before screenshots with Playwright MCP of: Feed, Communities, Messages, Profile.
2. Audit buttons, cards, headers, modals, tabs, empty states, form inputs across all major pages.
3. Add missing CSS primitives to src/index.css: .app-tab-pill/.app-tab-pill-active, .app-section-label, .app-empty-state family, .app-ghost-button.
4. Fix Messages.jsx: active tab pills and filter chips should use border-blue-600 bg-blue-600, not bg-slate-950/bg-slate-800.
5. Fix Communities.jsx DiscoverEmptyState: "Clear filters" button should use bg-blue-600, not bg-slate-950.
6. Create STYLE_GUIDE.md at the repo root documenting colors, typography, buttons, cards, spacing, motion.
7. Run npm run lint && npm run build.
8. Update internal/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'ux-design-primitive-adoption',
    category: 'Admin & Platform',
    status: STATUS.SHIPPED,
    priority: PRIORITY.MEDIUM,
    title: 'Design Primitive Adoption — Top Screens',
    shippedNote: 'Shipped 2026-05-20. Replaced one-off inline styling with CSS primitives across 4 screens: (1) Messages.jsx: all 3 pill tab/filter instances (Inbox/Requests tabs + All/Unread/Communities/Requests filter row) converted from 40-char inline Tailwind strings to .app-tab-pill + .app-tab-pill-active. (2) Communities.jsx: 3 empty states → .app-empty-state family; 2 section labels → .app-section-label; CommunitySection empty state CTA fixed from bg-slate-950 → bg-blue-600. (3) CommunityDetailView.jsx: 2 empty states (HomeFeed empty + CompactEmptyState component) → .app-empty-state family; 1 section label (Community posts header) → .app-section-label. (4) Notifications.jsx: date group labels (Today, Yesterday, May 17…) → .app-section-label. Verified with Playwright screenshots — no regressions. Lint + build clean.',
    description: 'Apply new CSS design primitives to the highest-traffic screens: replace repeated one-off tab-pill, empty-state, section-label patterns with the shared classes defined in index.css.',
    why: 'STYLE_GUIDE.md and the CSS primitives existed but 0% of component code used them. This sprint drove adoption on the top 4 screens.',
    prompt: `You are applying JUnited CSS design primitives to real component code.

Context: src/index.css defines these primitives (added 2026-05-20):
  .app-tab-pill / .app-tab-pill-active / .app-tab-pill-dark
  .app-section-label
  .app-empty-state / .app-empty-state-icon / .app-empty-state-title / .app-empty-state-body
  .app-ghost-button / .app-ghost-button-muted
STYLE_GUIDE.md at the repo root documents when and how to use each.

Goals:
1. Search all .jsx files for one-off pill-tab class strings (rounded-xl border px-3 with active/inactive ternary) → replace with app-tab-pill + app-tab-pill-active.
2. Search for empty state divs (rounded-2xl border border-dashed) → replace with app-empty-state family.
3. Search for section labels (text-[11px] font-black uppercase tracking-wide text-slate-400) → replace with app-section-label.
4. Use Playwright MCP to verify no visual regression.
5. Run npm run lint && npm run build.
6. Update internal/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'ux-communities-discover-polish',
    category: 'Admin & Platform',
    status: STATUS.SHIPPED,
    priority: PRIORITY.MEDIUM,
    title: 'Communities Discover — Reference-Based UI Polish',
    shippedNote: 'Shipped 2026-05-20. Four targeted changes to Communities Discover: (1) DiscoverSection headers upgraded from tiny 11px badge-pill-only to icon square badge + text-[15px] font-black h2 title + lighter 12px subtitle — eliminates the most generic-looking pattern on the page. (2) ForYouSection matching header upgrade + surface-panel-soft wrapper to visually distinguish personalized recommendations from generic type sections. (3) DiscoverCommunityCard banner height 72px → 92px — cover gradients now have enough real estate to read as visual identity rather than a decorative sliver. (4) ActiveInStrip community initials badges: bg-slate-950 (black) → bg-blue-600 — removes the single most jarring color inconsistency on the mobile Discover view. Verified with Playwright before/after screenshots on 390px mobile viewport. Lint + build clean.',
    description: 'Targeted visual polish of the Communities Discover page: section header hierarchy, card cover presence, For You premium treatment, and color consistency in the active spaces strip.',
    why: 'Discover is the highest-traffic landing surface for new communities. The old design had section headings rendered entirely as 11px pill badges, flat uniform section rhythm, shallow 72px card covers, and a black initial badge that clashed with the blue design system.',
    prompt: `You are polishing the Communities Discover screen for JUnited.

Context:
  src/pages/Communities.jsx — DiscoverSection, ForYouSection, ActiveInStrip, Hero, SearchBar, ViewSwitch
  src/components/communities/DiscoverCommunityCard.jsx — card component used in all Discover sections
  src/lib/communityTypes.js — typeConfig: badgeClass (bg-X-50 text-X-700), icon, label, accent, coverPattern

Goals:
1. Use Playwright MCP to capture before screenshots at 390px mobile viewport.
2. Upgrade DiscoverSection header from inline pill to: icon square (h-9 w-9 rounded-xl badgeClass) + h2 (text-[15px] font-black) + subtitle (text-[12px] font-medium text-slate-400).
3. Upgrade ForYouSection with matching header + surface-panel-soft rounded-[20px] p-4 wrapper.
4. Increase DiscoverCommunityCard banner from h-[72px] to h-[92px].
5. Fix ActiveInStrip initials badge: bg-slate-950 → bg-blue-600.
6. Use Playwright MCP to verify after screenshots — confirm section headers, card height, and color.
7. Run npm run lint && npm run build.
8. Update internal/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'ux-community-detail-polish',
    category: 'Admin & Platform',
    status: STATUS.SHIPPED,
    priority: PRIORITY.MEDIUM,
    title: 'Community Detail — Reference-Based UI Polish',
    shippedNote: 'Shipped 2026-05-20. Four targeted changes: (1) CommunityHero.jsx: cover height in app shell 96px→120px — community header now reads as a branded identity space rather than a card thumbnail. (2) CommunityHero.jsx: action bar logo 30px→36px with rounded-xl, member count upgraded to font-bold text-slate-600 — stronger visual anchor. (3) CommunityHero.jsx: removed redundant border-b from invite strip wrapper — eliminated the double horizontal-rule chrome between action bar and page content. (4) CommunityDetailView.jsx HomeFeedSection: added "LATEST" app-section-label above the post feed — creates clear rhythm between composer and posts. (5) CommunityOperatingSystem.jsx CommunityPostPreview: badge padding tightened from px-2.5 py-1 to px-2 py-0.5 — post card metadata row is no longer dominated by heavy pill badges. Verified with Playwright screenshots on two community types (Neighborhood + Events). All tabs, More menu, and swipe navigation confirmed working. Lint + build clean.',
    description: 'Targeted polish of the Community Detail screen to reduce generic/AI-generated feel: hero cover height, action bar identity, section rhythm, and post card badge weight.',
    why: 'Community Detail is the highest-engagement surface in the app but felt like a card expanded to full screen rather than a branded mini-app. Priority fixes: cover too thin, no section headers in home feed, heavy post card badges.',
    prompt: `You are polishing the Community Detail screen for JUnited.

Context:
  src/components/communities/CommunityDetailView.jsx — main detail container, HomeFeedSection, RoutedCommunityHome
  src/components/communities/CommunityHero.jsx — cover, action bar, invite strip
  src/components/communities/CommunityOperatingSystem.jsx — CommunityPostPreview, CommunityAdminQuickActions

Goals:
1. Use Playwright MCP to capture before screenshots of at least 2 community types at 390px mobile.
2. Increase CommunityHero inAppShell cover height (96 → 120px).
3. Upgrade action bar: logo 30px → 36px, rounded-xl, member count font-bold.
4. Remove redundant border-b from invite strip wrapper.
5. Add app-section-label "Latest" before HomeFeedSection post list.
6. Tighten CommunityPostPreview badge padding: px-2.5 py-1 → px-2 py-0.5.
7. Verify all tabs and More menu still work via Playwright.
8. Run npm run lint && npm run build.
9. Update internal/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'ux-feed-post-card-polish',
    category: 'Admin & Platform',
    status: STATUS.SHIPPED,
    priority: PRIORITY.MEDIUM,
    title: 'Feed Post Card — Reference-Based UI Polish',
    shippedNote: 'Shipped 2026-05-20. Five targeted changes to UnifiedPostCard.jsx default feed post branch: (1) Body leading-snug → leading-relaxed — multi-line post bodies now breathe and scan faster. (2) Content pb-0.5 → pb-2 — added breathing room between content and footer divider. (3) Username font-semibold → font-bold in all three header branches (community, anonymous, user) — poster identity reads with more confidence. (4) Footer mt-1 py-1.5 → py-2 (no margin-top) — action row no longer feels tacked on. (5) Inline recent-comment strip: added bg-slate-50 rounded-xl px-2.5 py-1.5 to inner div — preview now reads as a comment bubble rather than raw text. Lint + build clean.',
    description: 'Targeted polish of UnifiedPostCard (default feed post branch) and the community-feed post preview.',
    why: 'The post card is the single highest-density surface in the app. Small improvements to leading, spacing, and font weight compound across every feed scroll.',
    prompt: `You are polishing the feed post card for JUnited.

Context:
  src/components/feed/UnifiedPostCard.jsx — default post branch starting ~line 709
  src/components/communities/CommunityOperatingSystem.jsx — CommunityPostPreview

Goals:
1. Capture Playwright before screenshots of Feed, community home feed, community Posts tab.
2. Audit body leading, content padding, header font weight, footer spacing, comment preview strip.
3. Implement the top 3-5 targeted fixes — no redesign, no new features.
4. Capture after screenshots and confirm visual improvement.
5. Run npm run lint && npm run build.
6. Update internal/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'ux-design-token-system',
    category: 'Admin & Platform',
    status: STATUS.DEFERRED,
    priority: PRIORITY.LOW,
    title: 'Full Design Token System',
    description: 'Replace all hardcoded color/size values with CSS variables. Standardize card radius, spacing scale, and typography to eliminate the ~50+ hardcoded values scattered across component files. Note: the design primitive adoption sprint (2026-05-20) already replaced pill tabs, section labels, and empty states in Messages, Communities, CommunityDetailView, and Notifications with the new CSS class primitives. Remaining work is deeper token replacement (hex values → CSS vars).',
    why: 'Low priority until the design language is fully stable. Foundations built: STYLE_GUIDE.md defines the full visual language; .app-tab-pill, .app-section-label, .app-empty-state family, and .app-ghost-button primitives are defined in index.css and adopted across the top 4 screens. Remaining gap is replacing hardcoded hex values like text-[#94a3b8] with tokens. Tackle post-v1 launch when the design is locked.',
    prompt: `You are implementing a full design token system for JUnited.

Context: src/index.css has a solid token foundation (--j-navy, --j-gold, --j-olive, j-chip classes, j-card,
        .j-text-* typography scale). The gap is that many component files bypass these tokens and use
        Tailwind utility classes with hardcoded values. Examples:
        - text-[#94a3b8] → should be text-slate-400 or var(--c-muted)
        - text-[#0F1C2E] → should be text-slate-900 or var(--j-navy)
        - rounded-2xl (16px) on cards → should be rounded-[20px] (the j-card standard)
        - bg-[#f1f5f9] on inputs/chips → should be bg-slate-100

Goals:
1. Audit all .jsx files for hardcoded hex values — compile a list and map each to the nearest token.
2. Add CSS variable aliases for any missing semantic gaps (e.g., --c-input-bg, --c-page-bg).
3. Replace hardcoded values in GroupCard, CommunityGroupsTab, CreateGroupModal, Groups page.
4. Document the complete token reference in a comment block at the top of index.css.
5. Run npm run build to verify no visual regressions.
6. Update internal/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'page-level-error-boundaries',
    category: 'Infrastructure',
    status: STATUS.PLANNED,
    priority: PRIORITY.LOW,
    title: 'Add Page-Level Error Boundaries',
    description: 'Currently only one global AppErrorBoundary catches all React errors. Adding per-page boundaries means a single page crash doesn\'t wipe the whole shell — the nav stays intact and only the failing page shows an error card.',
    why: 'Surfaced during 2026-06-16 codebase audit. The global boundary already uses captureError → Sentry, so errors are tracked, but the UX fallback is coarse.',
    prompt: `You are adding page-level error boundaries to JUnited.

Context:
- Global error boundary: src/components/common/AppErrorBoundary.jsx (class component, already uses captureError)
- App routing: src/App.jsx — all pages are lazy-loaded with <Suspense> wrappers
- AppErrorBoundary accepts an \`inline\` prop that renders a compact card instead of full-page error

Goals:
1. Wrap each <Route element={<Page />}> in App.jsx with <AppErrorBoundary inline> so page crashes are caught at the page level, not the app level.
2. Verify the shell (bottom nav, header) remains visible when an error card is shown.
3. Test: temporarily throw in Feed.jsx, confirm error card appears inside the page area, nav still works.
4. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'typescript-migration',
    category: 'Infrastructure',
    status: STATUS.DEFERRED,
    priority: PRIORITY.LOW,
    title: 'TypeScript Migration',
    description: 'The project uses jsconfig.json (JavaScript with path aliases) rather than TypeScript. Full TS would catch type errors at lint time and improve IDE refactoring support.',
    why: 'Deferred post-audit (2026-06-16). Migration cost is high relative to current bug rate. Revisit once the team has capacity for a large, careful migration sprint.',
    prompt: `You are migrating JUnited from JavaScript to TypeScript.

Context:
- Project uses jsconfig.json, Vite, React 18, Tailwind. No existing .ts/.tsx files.
- Source root: src/. Key files: src/api/, src/services/, src/lib/, src/components/, src/pages/.
- Supabase client: src/api/supabaseClient.js. Entity service: src/api/base44Client.js.

Goals:
1. Rename jsconfig.json → tsconfig.json and add strict TypeScript config.
2. Update vite.config.js to handle .tsx files.
3. Migrate incrementally: start with src/lib/ and src/services/ (lowest risk), then components, then pages.
4. Generate Supabase types with: npx supabase gen types typescript --linked > src/types/supabase.ts
5. Run npm run build after each file batch to confirm no regressions.
6. Update src/config/roadmap.js: change this item's status to 'shipped'.`,
  },

  {
    id: 'jewish-calendar',
    category: 'Jewish Hub',
    status: STATUS.SHIPPED,
    priority: PRIORITY.HIGH,
    title: 'Full Interactive Jewish Calendar',
    description: 'Month + list view calendar with Hebrew dates, holidays, parsha, Shabbos/zmanim, JUnited community events, event creation, RSVP, and day-detail bottom sheet.',
    shippedNote: 'Shipped 2026-06-24. JewishCalendarPage.jsx (full rewrite at /JewishHub/calendar), CalendarDaySheet.jsx (day detail with zmanim + Shabbos times + events), CalendarEventDetailSheet.jsx (RSVP: going/maybe/not going + attendee list + share), CreateCalendarEventModal.jsx (event type picker: shiur/shul/chesed/youth/business/shabbos_meal/fundraiser/memorial/general, date/time/location/description/community/visibility). Month grid shows Hebrew day numbers, holiday chips (amber), Shabbos tint (indigo), event emoji dots, mitzvah dot. List view groups events by date with Hebrew annotation. Filters: All / My Communities / Going / Jewish Dates / Local Events. Wired into JewishContentHub as first HUB_ENTRY and first DAILY_ANCHOR tile.',
  },

  {
    id: 'daily-feed-refresh',
    category: 'Feed',
    status: STATUS.SHIPPED,
    priority: PRIORITY.HIGH,
    title: 'Daily Auto-Refresh: Feed + Daily Content',
    description: 'Automated daily refresh so "Today in the Five Towns" always has fresh content and "Talk to the Five Towns" hub always shows "Updated today."',
    shippedNote: 'Shipped 2026-06-25. supabase/functions/daily-refresh/index.ts: Edge Function (CRON_SECRET-gated) that upserts today\'s daily_content row (52 rotating mitzvahs + Torah thoughts keyed by day-of-year) and inserts a daily_greeting post so the hub timestamp always reflects today. supabase/migrations/20260625000000_daily_refresh_cron.sql: pg_cron schedules daily-refresh at 12:00 UTC (8 AM ET) and seed-daily-content at 12:05 UTC as SQL fallback seeding 30 days ahead. src/pages/Feed.jsx: daily_greeting excluded from visible feed cards, FiveTownsConversationHub receives raw posts and prefers greeting post timestamp for "Updated" label.',
  },

  {
    id: 'admin-seed-hardening',
    category: 'Admin & Platform',
    status: STATUS.SHIPPED,
    priority: PRIORITY.HIGH,
    title: 'Admin Seed Control: Harden or Remove',
    description: 'AdminSeedControl.jsx must be hardened with a production safety check or removed before public launch.',
    shippedNote: 'Shipped 2026-06-22. Chose harden-and-keep over removal. src/pages/AdminSeedControl.jsx now splits into a thin wrapper that checks import.meta.env.PROD and renders a "Not available in production" card, and a SeedControlTool component holding the actual tool (split this way, rather than an early return before hooks, to stay compliant with react-hooks/rules-of-hooks). Still behind AdminRoute in dev/staging as before.',
  },

  {
    id: 'orphaned-feature-scaffolding-cleanup',
    category: 'Infrastructure',
    status: STATUS.PLANNED,
    priority: PRIORITY.LOW,
    title: 'Decide Fate of Orphaned Component Scaffolding',
    description: 'A 2026-06-29 self-check found ~20 entities referenced via dataService.entities.<Name> with no SUPABASE_ENTITY_TABLES mapping. Almost all trace back to components that are never imported by any page or parent component, so they are not reachable by real users and pose no current production risk — but they are dead weight and a few duplicate functionality already shipped elsewhere.',
    why: 'Not a live bug (createUnmappedEntityApi in base44Client.js already falls back to localStorage in dev and throws a clear error in prod, so nothing silently breaks), but the roadmap had no record of this scaffolding existing, and CLAUDE.md requires tracking known gaps surfaced during an audit. Two buckets: (1) src/components/shul/* (RideBoard, VolunteerBoard, MinyanStatusWidget, WeeklyScheduleWidget, CreateShulPostModal, AdminBroadcastModal, MediaTab) — already folded into the shul-directory prompt as reusable scaffolding, build it out there. (2) Components superseded or never wired in: src/components/chalkboard/CreateChalkboardModal.jsx + EventCard.jsx + EventRSVPSection.jsx + SavedEventsSection.jsx (legacy RSVP/EventAttendee entities, superseded by the shipped events-system which uses CommunityEvent/CommunityEventRSVP instead), src/components/feed/CommunityAlertBanner.jsx (CommunityAlert), src/components/feed/WeeklyImpactCard.jsx (WeeklyStats), src/components/communities/NewsletterSubscribeBox.jsx + src/components/groups/NewsletterHistoryModal.jsx + GroupAnalyticsDashboard.jsx (NewsletterSubscriber/NewsletterLog — newsletter-system above already covers building this out), and src/components/groups/GroupDiscussionTab.jsx + GroupResourcesTab.jsx + src/components/communities/CommunityDiscussionsTab.jsx (already covered by the group-events-discussion-resources entry above). Also overlaps Check 8 dead-component findings: src/components/communities/CommunityHubDetail.jsx, DiscoverCommunityCard.jsx, ColorfulCommunityCard.jsx, RichCommunityCard.jsx are unused and should be deleted in the same pass.',
    prompt: `You are cleaning up orphaned/unwired component scaffolding in JUnited surfaced by the 2026-06-29 self-check.

Context: These files exist but are imported nowhere outside themselves (verified via grep for their import statements):
  - src/components/chalkboard/CreateChalkboardModal.jsx
  - src/components/feed/EventCard.jsx, src/components/events/EventRSVPSection.jsx, src/components/profile/SavedEventsSection.jsx (use legacy RSVP/EventAttendee entities — superseded by CommunityEvent/CommunityEventRSVP, see events-system entry)
  - src/components/feed/CommunityAlertBanner.jsx
  - src/components/feed/WeeklyImpactCard.jsx
  - src/components/communities/NewsletterSubscribeBox.jsx, src/components/groups/NewsletterHistoryModal.jsx, src/components/groups/GroupAnalyticsDashboard.jsx
  - src/components/communities/CommunityHubDetail.jsx, DiscoverCommunityCard.jsx, ColorfulCommunityCard.jsx, RichCommunityCard.jsx (dead duplicates of CommunityDetailView.jsx / CommunityCard.jsx)
  None of these are imported by any page or by App.jsx.

Goals:
1. For each file, confirm via grep that it truly has zero importers (re-check, things may have changed).
2. For the legacy chalkboard/RSVP files and the dead community-card duplicates: delete the files (they are superseded by shipped functionality).
3. For CommunityAlertBanner, WeeklyImpactCard, NewsletterSubscribeBox/NewsletterHistoryModal/GroupAnalyticsDashboard: these look like real unfinished features rather than dead code — either wire them into a real page with proper entity mappings + migrations, or delete them if there's no near-term plan to ship them. Use judgment per-component; don't leave a half-wired state.
4. Run npm run lint && npm run build after deletions to confirm nothing else imports the removed files.
5. Update internal/roadmap.js: change this item's status to 'shipped' (if cleaned up) or 'dropped' (if decided not worth doing) with a why.`,
  },

];
