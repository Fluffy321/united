# JUnited Release Plan — Beta vs Post-Beta

Generated 2026-06-22 from `internal/roadmap.js` (40 non-shipped, non-dropped entries).
Two tracks: **Beta** (must do before/during the current beta) and **Post-Beta** (everything else, ordered by importance for the *next* release once beta is stable).

This file is a planning snapshot, not a renderer — `internal/roadmap.js` stays the single source of truth for status. Update this file by re-running the same categorization pass if priorities shift.

---

## Beta track (1 item)

| # | Item | Why it's pre-beta, not post |
|---|---|---|
| 1 | **Page-Level Error Boundaries** (`page-level-error-boundaries`) | Only one global error boundary exists today — one page crashing takes down the whole app, nav included. This isn't hypothetical: the June 21 "feed crash" needed five same-night emergency commits to recover from. Per-page boundaries contain a crash to one page. Protects beta users right now. |

Everything else is gated behind a feature that's off for beta (Communities), tied explicitly to a later milestone (payments, native iOS, post-v1 polish) in its own roadmap notes, or a feature addition to something that already works without it.

---

## Post-beta track (39 items, ordered by importance for the next release)

### Tier 1 — High priority, foundational

1. **Stripe Connect Payout Foundation** (`stripe-connect-payout-foundation`) — recipient onboarding/payouts. Everything monetization-related depends on this shipping first.
2. **Stripe Connect In-App Payments & Application Fees** (`connect-platform-payments-application-fees`) — depends on #1; unlocks paid events, listings, and platform fees.
3. **Apple Sign-In** (`apple-signin`) — not needed for the web beta, but blocks any native iOS release, so it should be queued early in post-beta planning.

### Tier 2 — Medium priority

4. **Mitzvah Reimbursements & Contributions** (`mitzvah-payments-reimbursements`) — payments-adjacent; sequence right after Stripe Connect (#1/#2) are stable.
5. **Verified Community & Featured Badge** (`verified-community`) — trust signal + revenue, needs Communities re-enabled first.
6. **Community Pro Plan** (`community-pro-plan`) — top-tier monetization plan, needs Communities re-enabled first.
7. **Scheduled Posts, Announcements & Community Digest** (`community-scheduled-announcements-digests`)
8. **Announcement Notifications, Event Reminders & Attendance** (`community-notification-targeting-reminders`)
9. **Community Notification Preferences** (`community-notification-preferences`) — natural prerequisite for #8 at scale.
10. **Advanced Community Analytics Dashboard** (`advanced-community-analytics-dashboard`)
11. **Resource Library 2.0** (`community-resource-library-2`)
12. **Community Email Invitations** (`community-invite-email`) — needs Resend wired to Edge Functions for community email.
13. **Business Reviews & Ratings** (`business-reviews`) — wait for real directory usage/moderation capacity.
14. **Ride Requests & Carpool Board** (`ride-requests`) — explicitly scoped as the next chesed feature after Meal Trains.
15. **Chesed Hours & Verification** (`chesed-hours`) — needs the Mitzvah completion-verification workflow to be stable first.
16. **Recurring Mitzvah Needs & Saved Filters** (`mitzvah-recurring-needs`)
17. **Yahrzeit Manager & Tehillim Lists** (`yahrzeit-refuah`) — high resonance with the community; routes already reserved.
18. **Desktop Responsive App Shell** (`desktop-responsive-shell`) — explicitly "useful after the mobile beta is stable."

### Tier 3 — Low priority / exploratory

19. **Community Home Section Reordering** (`community-home-section-ordering`)
20. **Key Contacts Display Order** (`community-key-contacts-reorder`)
21. **Community Recognition & Badges** (`community-recognition-badges`)
22. **Group Events, Discussion & Resources Tabs** (`group-extended-tabs`) — re-enable once group adoption is confirmed.
23. **Newsletter System** (`newsletter-system`)
24. **Show Meal Trains on the Mitzvah Map** (`meal-train-map-pins`) — polish left over from the Meal Trains build (shipped 2026-06-22); needs a geocoding step first.
25. **Shul Directory** (`shul-directory`) — redundant with community pages until there's real demand.
26. **User-Selectable Candle-Lighting Offset** (`candle-lighting-minhag-offset`) — current 18-min default is correct, just not configurable per minhag.
27. **Sync Candle-Lighting Location to Profile** (`candle-lighting-location-sync`) — localStorage is intentionally sufficient for now (privacy).
28. **Business Promotions & Deals** (`business-promotions`) — wait until businesses are claimed/engaged.
29. **Organization Pages** (`organization-pages`) — largely redundant with community pages.
30. **Feed Post Author Enrichment via JOIN** (`feed-author-enrichment`) — cosmetic staleness fix, explicitly low priority during beta.
31. **MTA / 511NY Transit Data Ingestion** (`mta-transit-ingestion`) — needs external API agreements.
32. **Private Publisher Integrations** (`private-publishers`) — needs publisher agreements; no scraping without permission.
33. **Jewish News Aggregation** (`news-aggregation`) — local updates already cover the Five Towns angle.
34. **Group Premium Analytics** (`premium-analytics`) — natural follow-up now that Community Groups are live, but not urgent.
35. **AI-Assisted Feedback Triage** (`ai-feedback-triage`) — current free rule-based triage is explicitly "sufficient for beta."
36. **Full Design Token System** (`ux-design-token-system`) — explicitly "tackle post-v1 launch."
37. **TypeScript Migration** (`typescript-migration`) — explicitly deferred until there's capacity for a large, careful sprint.
38. **AI Community Assistant** (`ai-assistant`) — still in "exploring," scope not yet defined.
39. **AI Community Setup Wizard** (`ai-community-setup`) — still in "exploring," scope not yet defined.

---

## Notes on the ordering logic

- Items already blocked by `COMMUNITIES_ENABLED = false` (most of the Community-category items) are ordered as if Communities gets re-enabled post-beta — they're not ranked as if Communities stays off forever.
- Payments (Tier 1, #1–#2) lead post-beta because nearly every monetization item downstream (Pro Plan, Verified Community, reimbursements, business promotions) depends on Stripe Connect existing first.
- Items explicitly self-deferred in their own roadmap `why` field (AI features, design tokens, TypeScript, desktop shell, feedback triage) are kept in Tier 3 regardless of their nominal priority label, since the roadmap authors already said these should wait.
