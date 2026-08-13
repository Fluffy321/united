# JUnited Mobile Home: Priority Stack Redesign

**Status:** Approved and implemented on `codex/mobile-home-brief`; pending merge and production deployment
**Date:** 2026-08-10  
**Scope:** Mobile Home priority stack, explainable ranking, contribution entry, live category deck, and focused category openings

## Decision

JUnited Home will use the **Priority Stack** direction selected from the clickable iPhone comparison.

The Home page is not starting over. It is a new mobile presentation layer over JUnited's existing authentication, Supabase data, post composer, post detail routes, Help system, Communities, map, events, marketplace, minyan tools, messages, search, notifications, and profile.

This specification supersedes the Home ordering, three-item Daily Brief treatment, and category-launch presentation in `2026-08-04-mobile-headquarters-home-design.md`. Privacy, composer, moderation, category configuration, engagement, and existing-route requirements from that specification remain authoritative unless this document explicitly changes them.

## Product job

Home must answer these questions in order:

1. What actually needs my attention now?
2. Why is JUnited showing it to me?
3. What can I do about it?
4. What else is happening across my community?

The visual order is:

1. Compact JUnited header.
2. Personalized Community Pulse with three real priority items.
3. One contribution entry.
4. Live category deck for everything else.
5. Authentic chronological community posts.
6. Mobile bottom navigation.

## Approved visual reference

The selected direction is represented by the clickable mobile artifact:

`.superpowers/brainstorm/99820-1786039879/content/priority-phone-mode-v1.html`

The artifact is a visual reference, not production code or a data contract. Production implementation must use the repository's React, Tailwind, routing, Supabase, query, privacy, moderation, and accessibility patterns.

## Mobile contract

- Mobile is the primary layout and is verified at a 390 by 844 CSS-pixel viewport.
- Interactive controls have at least a 44 by 44 CSS-pixel target or an equivalent accessible hit area.
- Priority information fits within the first phone viewport together with the contribution entry and the beginning of the category deck.
- The page may scroll vertically. The category deck may scroll horizontally.
- Desktop can widen the content shell but must not introduce a separate information hierarchy.

## Community Pulse

### Purpose

The Community Pulse contains actual ranked items, not category summaries pretending to be priorities.

It shows up to three items. Each item contains:

- Rank position.
- Category.
- One concise reason chip or pair of chips.
- Specific headline.
- Short context line.
- Tap action to the existing detail or category destination.

The first item becomes a visually dominant card only when it clears a defined urgency-and-actionability threshold, such as an unfilled need ending soon or a verified alert affecting the member. Items two and three remain compact. When nothing clears that threshold, all available priorities use the calm compact treatment. Visual size must reflect real importance rather than manufacture drama.

Example reason chips include:

- `Ends in 2h`
- `0.8 mi`
- `Affects you`
- `Verified`
- `Yours`
- `4 new`

The interface includes a **How priority works** control. It explains ranking inputs in plain language without exposing an arbitrary numeric score.

### Honest minimum

Home must never invent activity, urgency, replies, attendees, seats, distances, or trusted status.

If three real priority items do not exist:

- Show the real priority items that do exist.
- Use sourced Jewish-time or verified local reference information only when it is genuinely timely.
- Do not pad the stack with fake examples or empty placeholders.
- If there are no priorities, replace the stack with a useful calm state and continue directly to contribution and categories.

## Explainable priority model

The first implementation is deterministic and testable. It ranks individual candidate items using these signal groups:

1. **Urgency and expiration**
   - Deadline proximity.
   - Event or minyan start proximity.
   - Unfilled time-sensitive help request.
   - Verified safety or route alert.

2. **Personal relevance**
   - Created by or replied to the member.
   - Unread replies to the member's content.
   - Explicitly followed category or joined community.
   - Saved location, city, or community match.
   - Explicit more/less preference.

3. **Actionability and impact**
   - The member can respond, help, attend, claim a seat, or change plans.
   - The request is still open.
   - The member's engagement level permits proactive opportunities.

4. **Proximity**
   - General neighborhood or city relevance.
   - Distance when a safe and permitted location is available.
   - No private address is used or displayed before an accepted private response.

5. **Trust and freshness**
   - Verified source or trusted community context.
   - Recency.
   - Unread state.
   - Duplicate, stale, filled, blocked, reported, or expired items are suppressed.

Emergency and safety information can override ordinary preference ordering for affected members.

The scorer returns both an ordering value and public explanation reasons. The UI renders only reasons that are true for the item.

The ranking system must not inspect direct-message contents, private help coordination, precise private addresses, or sensitive unrelated profile data.

## Engagement level

The member's adjustable engagement setting remains:

- Quiet
- Balanced
- Active
- All-in

Engagement changes the number and frequency of optional actions JUnited promotes. It does not change emergency-alert eligibility, privacy defaults, community access, blocking, or moderation.

The Community Pulse shows the current level as a compact entry to Settings. It does not place the full slider on Home.

## Contribution entry

Home has one primary contribution entry directly below the Community Pulse:

**Share with your community**  
`Ask, offer, request help, or post an update`

Tapping it opens the existing unified composer. The member then selects or confirms the supported post type. Existing audience, visibility, privacy, validation, moderation, and persistence behavior remain authoritative.

The Home page must not repeat separate grids and prompt sections for Ask, Need, Plan, Business, Mitzvah, and starter questions. Those repeated entry points currently make the page feel longer without adding capability.

## Live category deck

### Purpose

The deck answers **What else is happening?** after the priority stack. Categories are useful destinations, not priorities by themselves.

The deck uses two stacked rows that scroll horizontally. A card contains:

- Category label and category-specific restrained color.
- Real count or state when available.
- The category's best current item.
- One useful context line such as time, distance, attendees, price, replies, or neighborhood.

The initial configured categories remain the shared categories from `briefCategories.js`. The visible order is personalized and can change when a category contains a highly relevant current item.

Cards with no useful live item use a specific action such as **Ask about kosher food** or **Post a local update**. They never show a dead zero-count card.

### Card ranking

Individual items are ranked first. Each category card uses its highest eligible item. Category ordering then uses that item's score plus explicit category preference.

An item already displayed in the top priority stack is not repeated as the leading item in the category deck. The category can display its next eligible item or a specific useful action.

## Full category opening

Tapping a category opens a focused category destination using recoverable URL state, not a modal-only dead end.

The shared category shell includes:

- Back navigation.
- Category identity and purpose.
- Honest real counts.
- Privacy or trust treatment when relevant.
- Three shared sections: current items, discussion/offers when supported, and an explanation or directory surface when supported.
- Category-specific primary actions.
- Loading, empty, error, and stale-data states.

The Helping reference shows:

- Open needs ordered by urgency and proximity.
- Available offers.
- Filled activity for closure and trust.
- Private coordination language.
- **Ask for help** and **Offer help** actions.

All categories use shared primitives and configuration. The implementation must not create twelve unrelated large page components.

## Existing JUnited features preserved

The redesign connects to and preserves:

- Authenticated accounts and production routing.
- City and community context.
- Jewish calendar and zmanim data.
- Unified post composer and supported post types.
- Post details, replies, reactions, saves, reports, and blocks.
- Help needs and offers.
- Communities and rooms.
- Map and directory data.
- Events, marketplace, rides, and minyan tools.
- Messages, search, notifications, and profile.

The redesign must remove or hide production-only mistakes encountered during review, including a member-visible **Reseed** control and duplicate **Join room** actions, in their owning surfaces rather than hiding them through Home CSS.

## Data and state flow

1. Existing queries load the member, preferences, communities, posts, events, help needs, and supported local data.
2. Focused adapters normalize eligible data into priority candidates.
3. A pure ranking module filters ineligible items, scores candidates, and produces explanation reasons.
4. Home renders the top three unique items.
5. The category deck groups remaining eligible items and selects one lead item per category.
6. Taps use existing destinations, composer contracts, or recoverable category URL state.
7. Query errors retain cached content when safe and label it as stale; otherwise the relevant section shows a useful retry state.

Ranking logic must not be embedded directly in `Feed.jsx`.

## Accessibility and privacy

- Reason chips supplement accessible text and are not color-only.
- Every priority and category card has a specific accessible name.
- Horizontal decks support touch, keyboard navigation, and reduced motion.
- Focus remains visible.
- Private helping details do not appear on Home.
- Exact addresses and contact information remain hidden until the existing authorized private response flow permits access.
- Quiet and empty states do not shame members or imply a dead community.

## Verification

Automated verification covers:

- Deterministic ranking and tie-breaking.
- Correct explanation reasons.
- Expired, filled, blocked, reported, and duplicate suppression.
- Emergency override behavior.
- Engagement-level effects.
- No duplication between priority stack and category leads.
- Honest fewer-than-three and empty states.
- Composer and navigation contracts.
- Category URL restoration through reload and back navigation.
- Accessibility names and keyboard operation.

Browser verification covers:

- 390 by 844 mobile rendering.
- Priority details and **How priority works**.
- Contribution entry into the real composer without publishing.
- Horizontal category deck behavior.
- Helping category open, back, tabs, and private response entry.
- Loading, error, empty, and stale-data states.
- No console errors.

The repository-wide JUnited self-check runs after implementation and before completion is claimed.

## Success criteria

- A member can identify the top useful item and why it matters within five seconds.
- Every displayed priority has at least one true, visible reason.
- Home shows no fabricated activity.
- One contribution entry replaces repeated posting surfaces.
- Category cards contain real utility rather than generic labels.
- Existing data, privacy, composer, moderation, and routes continue working.
- The first phone viewport feels like a working app even when community volume is low.

## Out of scope

- Machine-learning ranking or a new AI recommendation service.
- Multi-city launch mechanics.
- Organization-specific shul or school headquarters.
- Rebuilding all destination pages in this cycle.
- Public mitzvah leaderboards.
- New public exposure of private help activity.
