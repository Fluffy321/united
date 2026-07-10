# JUnited Master Plan — Production / Addictive / Profitable / Marketable

Created 2026-07-01 from the full-app review (architecture, backend/security, features/UX, roadmap audits).
This is the standing goal prompt. Paste the block below into any Claude Code / agent session to continue the mission, or work through it phase by phase. Keep this file updated as items ship — check items off and note the commit.

Status legend: [ ] open · [x] done · [~] in progress

Already completed before this plan:
- [x] Content RLS security hardening (posts/comments/reactions, invite codes, posts_feed_view, refuah) — migration `20260701204247`, commit `2d4ad35`

---

## THE PROMPT

```
You are the founding team of JUnited (junited.us) rolled into one: a seed-stage investor doing diligence, a senior product designer, a head engineer, and a demanding daily user. The repo is at ~/united (React 18 + Vite + Tailwind + Supabase, production live, CLAUDE.md governs workflow — read it first and follow its roadmap rules for everything you do).

MISSION: Take JUnited from "feature-complete beta" to a high-production, addictive, profitable, marketable product. Work in priority order below. For every change: verify the real user path (per CLAUDE.md), run lint + build, update internal/roadmap.js, and run the junited-self-check skill. Check internal/master-plan.md for current item status and mark items done there as you ship them.

PHASE 1 — TRUST & CORRECTNESS (a user who hits one broken thing never returns)
1. Fix or pull Marketplace: src/pages/Marketplace.jsx stores listings in useState([]) and silently discards them. Wire it to postsService.createMarketplaceListing + a real query with React Query, or remove it from nav/routes/Landing until Stripe Connect ships. No silent data loss in production.
2. Remove or honestly label the fake AI DM agent pinned in Messages (canned replies from src/lib/aiAgent). Scripted bots destroy trust.
3. Honesty pass: Landing.jsx must only market what works. Fix dead links (PrivacyRights.jsx → /UserSettings, FriendsHub.jsx invite URL → /InviteJoin).
4. Ship the two safety follow-ups already in the roadmap: hide deleted accounts from member lists/search, and retroactively hide messages after a block.
5. Execute low-severity-rls-followups and orphaned-feature-scaffolding-cleanup roadmap entries (delete ~5,000 lines of verified dead code incl. CommunityHubDetail.jsx).

PHASE 2 — PRODUCTION POLISH (designer hat: the app must feel like one product, not twelve)
6. One post-card system: consolidate FeedPostCard / ThreadChainItem / HeartbeatPostCard / UnifiedPostCard into a single base card. One radius scale, one padding rhythm.
7. Enforce STYLE_GUIDE.md: purge all bg-slate-950 CTAs (~12 in Feed.jsx), adopt .app-empty-state everywhere, add DestinationHeader to Communities. Add a grep-based CI check so violations can't return.
8. Migrate Communities.jsx and Settings.jsx to React Query; split CommunityAdminCenter.jsx (3,733 lines) and CommunityDetailView.jsx (2,814) into per-tab modules.
9. Kill the guaranteed 1.5s splash delay for returning users. Speed is the strongest retention feature.

PHASE 3 — ADDICTIVE (user hat: give me a reason to open it every day)
10. Unify streaks onto the backend UserStreak (kill the localStorage split-brain), then make streaks visible: streak on profile, streak-at-risk push notification in the evening.
11. Make group chat real-time (Supabase Realtime, not 8s polling), add typing indicators and read receipts to DMs.
12. Daily hook: the Five Towns Brief is the anchor — add one tappable daily action (today's mitzvah, one-tap chesed offer) that feeds the streak. Ship the planned event reminders + per-community digests.
13. Recognition loops: leaderboards/badges for chesed (already planned in roadmap), weekly "your impact" recap notification.

PHASE 4 — PROFITABLE (investor hat: revenue paths already designed, not live)
14. Ship stripe-connect-payout-foundation then connect-platform-payments-application-fees (both HIGH in roadmap). This unblocks 4 stubbed checkouts: community store, paid event tickets, featured community, verified upgrade — instant revenue surface.
15. Ship Community Pro Plan + Verified Community badge (planned entries). Price against shul/org budgets, not consumer.
16. Wire AdminAnalyticsDashboard MRR/ARR to real conversion funnels: track signup → first community join → first post → first payment.

PHASE 5 — MARKETABLE (growth hat)
17. iOS: initialize Capacitor (the single blocker for the whole App Store track — internal/iosReadiness.js), plan the APNs push bridge (web-push won't work in the wrapper).
18. Ship the desktop responsive shell (planned) so shared links don't land desktop users on a phone layout.
19. Invite loops: make community invite links (now RPC-backed) shareable with OG preview cards; referral credit for inviters.
20. SEO/shareability: public OG metadata for communities and the Landing page; App Store listing assets are already drafted in internal/app-store/.

RULES: Never mark anything shipped without walking the real UI path. Small commits, lint+build before each. Update internal/roadmap.js with prompt fields for anything deferred. Verify RLS changes against the live DB (pg_policies) — it has drifted from migration files before. When a decision needs the owner (pricing, feature removal), stop and ask instead of guessing.

Start with the first unchecked item in internal/master-plan.md. Report progress after each item.
```

---

## Progress tracker

### Phase 1 — Trust & Correctness
- [x] 1. Marketplace: fix persistence or pull from production — fixed (chose fix over pull). Migration `20260701210331` + Marketplace.jsx rewrite: React Query, photo upload, ?listing= deep links, real Save/Message, mark-as-sold. Also fixed the Feed composer's silent marketplace-field drop and the dead universalSearch marketplace filter.
- [x] 2. Fake AI DM agent: remove or label — removed (InvokeLLM is a stub; every reply was one canned sentence). All AI branches stripped from Messages/ConversationList/ChatView/UserSearchPanel/MessagesDrawer; aiAgent.js and AIChatBubble.jsx deleted. Real assistant stays tracked as ai-community-assistant (exploring).
- [x] 3. Landing honesty pass + dead links — Landing.jsx audited: markets only live features, no fake claims. PrivacyRights → /Settings; FriendsHub invite → /welcome.
- [x] 4. Hide deleted accounts; retroactive block enforcement — deleted-accounts half shipped (migration 20260701230000 + people-picker filters). Block half shipped: blocked DMs hidden from Messages list, deep links rejected, createMessage() enforces two-directional blocks; MessagesDrawer + pending message requests filtered too.
- [x] 5. Low-severity RLS follow-ups + dead-code purge — migration `20260701223223` (group_members scoping, chesed completions auth-only, error_logs recreated hardened after discovering the live table had been dropped, storage owner DELETE; + fixed two live bugs: group-admin edits and join-request approval both broken by policy typos). 37 dead files / ~7,000 lines deleted, deps pruned.

### Phase 2 — Production Polish
- [x] 6. Single post-card system — dead duplicates all purged (ThreadChainItem + HeartbeatPostCard in the Feed refactor; FeedPost.jsx, PostCard.jsx, PostBox.jsx on 2026-07-01, zero importers). 2026-07-06: FeedPostCard merged into UnifiedPostCard as `variant="compact"` behind a hook-free dispatcher (also moves the prompt/poll short-circuits above all hooks, eliminating the 9 rules-of-hooks eslint suppressions); FeedPostCard.jsx deleted. Bonus fixes: missing `useNavigate` in the marketplace "View listing" button (was a ReferenceError on tap) and a committed merge-conflict block in FriendsHub.jsx (resolved to the /welcome invite URL per item #3).
- [x] 7. Style-guide enforcement + CI grep check — Feed.jsx's last bg-slate-950 CTA → bg-blue-600; Communities got DestinationHeader earlier 2026-07-01; scripts/check-style.mjs ratchet check added and wired into prebuild (count can drop, never grow; baseline 128 — many uses are legit segment controls). 2026-07-06: .app-empty-state adoption sweep done across the main user surfaces — Marketplace no-listings, Communities rooms + no-results, community Feed/Events/Groups/Announcements tabs, MyCommunitiesTab (also normalized its off-palette #0F5ED7 button to bg-blue-600). Inline one-liner empties (e.g. "No replies yet") intentionally left per style guide; admin pages left as-is.
- [x] 8. React Query migration + giant-file splits — converged from two parallel 2026-07-06 sessions (merge resolved in favor of the fuller communities/admin/ split; the interim admin-center/ split was deleted). Migrated to React Query: PostDetail, Search, PublicProfile (unified-post, user-post-likes, blocked-ids, universal-search, public-profile, is-friend), Settings.jsx (['active-subscription', uid]; BlockedUsersCard on ['user-blocks', uid], unblock invalidates Messages' block/conversation keys), Communities.jsx (['communities-list'], ['community-groups-list'], ['user-community-ids', uid], ['user-group-ids', uid]; join/leave as useMutation with optimistic cache updates + rollback; localStorage fallback via placeholderData). CommunityAdminCenter.jsx split 3,733 → 134 lines into 13 modules under communities/admin/ (AppealSubmitModal re-export contract preserved; CommunityDetailView imports it from admin/AppealSubmitModal). 2026-07-07: AdminAnalyticsDashboard migrated (single ['admin-analytics'] query wrapping the 13-source fetch + pure derivation) and JoinByCommunityCode migrated (['invite-lookup', code, uid] query; join stays an imperative handler; the loading/preview/joining/joined/error/expired machine is now derived from query state + local joinStatus). All page-level React Query migrations are done. CommunityDetailView.jsx split note corrected 2026-07-08: it was already split down to 604 lines (delegates into components/communities/detail/ and admin/) as part of the CommunityAdminCenter work above — no further action needed there. 2026-07-08: MitzvahCircle.jsx split 2,050 → 599 lines across 8 incremental commits into 15 modules under components/mitzvah/circle/ (shared.js constants/helpers, StatusPill/EmptyState/Metric, RequestCard, CreateRequestModal/CreateCarpoolModal, QuickViewSheet, hero/workflow-tabs-bar/filter-bar, BrowseTab/MineTab/CompletedTab); also fixed a real Check-6 hazard by unifying the previously-duplicated VALID_VIEWS/workflowTabs arrays into a single WORKFLOW_TABS source of truth. 2026-07-08: MitzvahMap.jsx split 1,803 → 233 lines across 6 commits into 6 modules under components/mitzvah/map/ (staticPoints.js — the ~140-entry Five Towns directory, 71% of the original file; shared.js constants/helpers; MapController; SelectedPointCard; MitzvahMapFilterBar). Along the way, caught and fixed two dropped-import bugs from an earlier split step (COMMUNITIES_ENABLED, divIcon) that ESLint's no-undef (not enabled in this repo) let through silently — verified clean with a one-off `eslint --rule no-undef:error` pass across the whole mitzvah/ directory. All giant-file splits for item 8 are now complete.
- [x] 9. Remove 1.5s splash delay for returning users — SPLASH_SEEN_KEY now persisted in localStorage (with sessionStorage fallback for private mode), so the branded splash + 1.5s minimum only ever runs on a device's first visit.

### Phase 3 — Addictive
- [x] 10. Unified backend streaks + streak-at-risk push — `streakService` now owns `user_streaks` reads/writes; DailyMitzvahTracker, MyMitzvahLogTab, Profile, and FiveTownsBrief all use the backend streak instead of separate local counters. Added `supabase/functions/streak-at-risk` plus migration `20260708210000_streak_at_risk_cron.sql` to run an evening CRON_SECRET-gated web push/in-app notification for active streaks that have not met today's goal. Real UI path verified in demo mode: `/Profile` shows the 3-day backend streak in the header and streak card; `/Feed` → Five Towns Daily Brief → Daily Mitzvah shows the same 3-day backend streak.
- [x] 11. Realtime group chat, typing indicators, read receipts — realtime half done 2026-07-09: discovered no migration had ever added the chat tables to the supabase_realtime publication (delivery silently depended on a dashboard toggle; DMs have no polling fallback at all). Migration `20260709073000_enable_realtime_chat_tables.sql` makes `messages` + `community_group_chats` publication membership explicit (applied to prod). GroupChatSection now appends realtime rows straight into the React Query cache (same created_at→created_date normalization ChatView uses) instead of a full refetch per event; the 8s poll is relaxed to a 30s self-heal fallback. Typing indicators shipped same day: ChatView joins an ephemeral broadcast channel per DM (`typing-<conversationId>`), throttles outgoing signals to one per 1.5s, and shows a three-dot bubble that self-clears after 3s; DMs only (community chats excluded to avoid noise), no schema needed. Read receipts completed the item: migration `20260709080000` adds `conversations` to the realtime publication; ChatView tracks the live unread_count via a row-UPDATE subscription and shows "Seen" under the sender's last message when the recipient's counter hits 0. Two related bugs fixed en route: messages arriving while a chat is open are now marked read immediately (the inbox badge used to stay lit for a conversation you were looking at), and consecutive sends now increment the recipient's unread counter from the live value instead of recomputing 0+1 from the stale prop (badge used to stick at 1).
- [x] 12. Daily tappable action + event reminders/digests — shipped 2026-07-09. (a) DailyTapMitzvah card on the Five Towns Brief's Daily Mitzvah slide: one curated suggestion per day (deterministic by day-of-year so the whole community sees the same one), single-tap "I did this" creates a MitzvahLog + advances the backend streak + awards points, sharing DailyMitzvahTracker's query keys/flow. (b) Event reminders: `supabase/functions/event-reminders` (deployed, CRON_SECRET-gated, verified 401 unauthenticated) + cron migration `20260709090000` (13:30 UTC daily) — notifies going/maybe/interested RSVPs the morning of the event via web push + in-app notification, with per-(user,event) dedupe so retries can't double-send and notification-preference checks. (c) Per-community digests: the in-app digest module already shipped earlier (community-activity-digest-module + breakdown); scheduled/email digests remain deliberately gated on the email provider under community-scheduled-announcements-digests.
- [x] 13. Leaderboards, badges, weekly impact recap — shipped 2026-07-09. (a) ImpactLeaderboard on the Help page browse view: top 5 helpers by mitzvah_points (publicly readable by design since migration 019, which even ships a total_points desc index), medals for top 3, "(you)" highlight; streak badges intentionally NOT shown there because user_streaks RLS is own-rows-only. (b) Badges: streak badge_level (starter→elite) already ships from item 10 and displays in DailyMitzvahTracker. (c) Weekly impact recap: `supabase/functions/weekly-impact` (deployed, CRON_SECRET-gated, verified 401 unauthenticated) + cron `20260709210000` (Sunday 23:00 UTC) — per-user recap (mitzvot logged, streak, points) via push + in-app notification, mitzvah-preference checks, ISO-week dedupe so retries can't double-send.

### Phase 4 — Profitable
- [ ] 14. Stripe Connect foundation + application fees (unblocks 4 checkouts)
- [ ] 15. Community Pro Plan + Verified badge
- [x] 16. Conversion funnel analytics — shipped 2026-07-09. AdminAnalyticsDashboard's funnel tab now leads with a true per-user conversion funnel (signup → first community join → first post → first payment), counting DISTINCT users per stage with %-of-signups and %-of-previous-step conversion rates, CSV-exportable. The pre-existing row-count metrics were kept below, honestly relabeled as activation signals (they can exceed signups). subscriptions select now includes user_id to make the Paid stage computable.

### Phase 5 — Marketable
- [ ] 17. Capacitor init + APNs push bridge plan
- [ ] 18. Desktop responsive shell
- [ ] 19. Invite loops with OG previews + referral credit
- [ ] 20. Public OG metadata / SEO
