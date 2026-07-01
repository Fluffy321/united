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
- [ ] 1. Marketplace: fix persistence or pull from production
- [ ] 2. Fake AI DM agent: remove or label
- [ ] 3. Landing honesty pass + dead links
- [ ] 4. Hide deleted accounts; retroactive block enforcement
- [ ] 5. Low-severity RLS follow-ups + dead-code purge

### Phase 2 — Production Polish
- [ ] 6. Single post-card system
- [ ] 7. Style-guide enforcement + CI grep check
- [ ] 8. React Query migration + giant-file splits
- [ ] 9. Remove 1.5s splash delay for returning users

### Phase 3 — Addictive
- [ ] 10. Unified backend streaks + streak-at-risk push
- [ ] 11. Realtime group chat, typing indicators, read receipts
- [ ] 12. Daily tappable action + event reminders/digests
- [ ] 13. Leaderboards, badges, weekly impact recap

### Phase 4 — Profitable
- [ ] 14. Stripe Connect foundation + application fees (unblocks 4 checkouts)
- [ ] 15. Community Pro Plan + Verified badge
- [ ] 16. Conversion funnel analytics

### Phase 5 — Marketable
- [ ] 17. Capacitor init + APNs push bridge plan
- [ ] 18. Desktop responsive shell
- [ ] 19. Invite loops with OG previews + referral credit
- [ ] 20. Public OG metadata / SEO
