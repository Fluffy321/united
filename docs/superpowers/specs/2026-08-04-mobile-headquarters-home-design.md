# JUnited Mobile Headquarters: Home and Daily Brief Design

**Status:** Approved interactive design, pending written-spec review  
**Date:** 2026-08-04  
**Scope:** Mobile Home, personalized Daily Brief, category sections, posting entry, compact post cards, and engagement preferences

## Product thesis

JUnited Home is the mobile front door to a Jewish community headquarters. It must answer three questions quickly:

1. What matters to me today?
2. What can I contribute?
3. What are people in my community doing and discussing?

The Home experience is not a collection of independent widgets. Its permanent order is:

1. Compact personalized Daily Brief preview.
2. Five visible posting intentions.
3. Authentic community posts under **From your community**.

The expanded Daily Brief is a category launchpad, not a second feed. It opens the full set of community categories and routes each category into a focused section.

## Goals

- Make JUnited useful before a community has high posting volume.
- Give every member a Daily Brief tailored to what they want to see.
- Keep all community categories accessible even when they are not in the top-three preview.
- Make posting understandable without exposing a large generic form.
- Compress cards and spacing for phones without shrinking tap targets.
- Preserve dignity and privacy around helping activity.
- Reuse JUnited's existing Supabase, React Query, routing, post, and moderation contracts.

## Non-goals

- Rebuilding Messages, Communities, Directory, Help, or Profile in this implementation cycle.
- Launching a second city or changing market data architecture.
- Introducing an opaque machine-learning ranking service.
- Adding organization-specific headquarters for shuls, schools, or nonprofits.
- Creating public mitzvah scores or public helping leaderboards.
- Replacing existing post persistence, moderation, reporting, blocking, or detail routes.

## Approved mobile Home

### Header

The mobile header remains compact and contains:

- JUnited identity.
- Current city/community label.
- Search.
- Notifications.

It must not contain additional promotional actions. All controls need a minimum interactive area of 44 by 44 CSS pixels.

### Daily Brief preview

Home shows a balanced preview of exactly three ranked items. The preview includes:

- `Your Daily Brief` label.
- Current Gregorian and/or Hebrew date in a compact secondary position.
- A short personalized greeting.
- Three ranked rows containing a title and one concise context line.
- One full-width **Open Brief** action.

The preview must not show:

- A **Why these three?** control.
- An engagement slider.
- Disclosure panels for events, conversations, maps, or mitzvah tracking.
- Duplicate prompts already available elsewhere on Home.

If fewer than three real items are available, show the real items and fill remaining positions with useful, sourced evergreen Jewish or local reference content. Do not fabricate activity, urgency, people, or counts.

### Five visible posting intentions

Directly below the Brief, Home shows five compact, touch-sized actions:

- Ask
- Share
- Need
- Offer
- Plan

All five remain visible on mobile. Each opens the shared composer with the selected intention already applied.

The buttons may be visually compact, but each must have a minimum height of 44 CSS pixels. Icons supplement text and never replace the label.

### From your community

Authentic community posts begin immediately after the posting actions under the heading **From your community**.

This is the new home for the current “Across your community” concept. It must not appear inside the expanded Daily Brief.

The section uses the existing feed query, pagination, cached-data fallback, block handling, moderation actions, and post-detail navigation.

## Personalization model

### Member control first

Members choose starting interests. Initial categories are:

1. Local Updates
2. Helping
3. Jewish Times
4. Events
5. Kosher Food
6. Minyanim
7. Parents & Schools
8. Torah & Learning
9. Marketplace
10. Jobs & Business
11. Sports & Social
12. Shabbos Plans

All categories remain accessible inside the expanded Brief. Selected interests affect ranking and ordering; they do not create access restrictions.

### Explainable ranking

The first implementation uses deterministic weighting rather than a new AI service:

- 60% explicit category preferences.
- 25% useful behavior signals.
- 15% urgency, trust, freshness, and local relevance.

The first implementation uses these useful behavior signals:

- Saving a post.
- Replying to a post.
- Joining an event or community.
- Opening a category.
- Explicitly requesting more or less of a category.

The ranking system must never inspect:

- Direct-message contents.
- Private help conversations.
- Private helping history.
- Sensitive profile fields unrelated to content preferences.

Verified emergency or safety information overrides category preferences and reaches everyone in the affected city.

The current `feedRetentionService.scorePost` logic will be extended through focused, testable helpers instead of embedding more ranking rules in `Feed.jsx`.

## Engagement level

Members can permanently adjust how involved they want JUnited to be:

- **Quiet:** Essential summaries and critical alerts.
- **Balanced:** Daily overview with selective opportunities and notifications.
- **Active:** More updates, contribution prompts, events, and help opportunities.
- **All-in:** All relevant activity plus real-time community invitations.

The engagement control belongs in Settings, not at the top of the Daily Brief. Settings must state that it can be changed at any time.

Engagement level changes:

- Notification frequency.
- Digest frequency.
- Number of proactive contribution prompts.
- Amount of content promoted to Home.
- Real-time invitation eligibility.

Engagement level must not change:

- Privacy defaults.
- Community membership.
- Category access.
- Blocking or moderation behavior.
- Emergency-alert eligibility.

The value is persisted with the member's feed preferences. The implementation extends existing preference entities and services instead of introducing a new table.

## Expanded Daily Brief

### Category launchpad

**Open Brief** navigates to or reveals a focused Daily Brief view containing:

- Compact back navigation.
- Daily Brief title and date.
- Brief settings entry.
- A short explanation that categories contain updates, actions, conversations, and useful links.
- A two-column mobile grid of all twelve categories.

The four or more categories explicitly selected by the member appear first and use a restrained selected treatment. The member's ordering must be deterministic and stable between visits.

The launchpad must not contain:

- The engagement slider.
- An “Across your community” feed.
- Repeated previews for every category beneath the grid.
- A second generic composer.

### Category sections

Selecting a category opens a focused section. Every section follows the same shell:

- Category header and short purpose statement.
- Updates tab.
- Discussion tab.
- Directory tab when relevant.
- Current verified or community-sourced items.
- Category-specific useful actions.
- Honest empty, error, and loading states.

The initial category-section implementation supports all twelve routes/configurations through shared primitives. It must not create twelve separate large page components.

Suggested configuration shape:

```js
{
  id: 'local',
  label: 'Local Updates',
  icon: MapPin,
  description: 'Roads, alerts, openings',
  tabs: ['updates', 'discuss', 'directory'],
  supportedPostTypes: ['feed'],
  supportedSubtypes: ['local_update'],
  actions: ['submit_update', 'open_map'],
}
```

Category definitions must live in one source-of-truth module shared by preference controls, the Brief launchpad, ranking classification, and category-section routing.

### Navigation contract

Recommended route contracts:

- `/Feed` — Home and community feed.
- `/Feed?brief=1` — expanded Daily Brief launchpad.
- `/Feed?brief=1&category=local` — selected Brief category.
- `/Settings?section=notifications` or the existing equivalent — engagement level and notification controls.

Route state must be recoverable through browser refresh and back navigation. The expanded Brief and selected category use URL state rather than modal-only state.

## Composer behavior

The five Home actions open the existing unified post composer with a selected intention. The existing post persistence and moderation contracts remain authoritative.

The selected intention changes the short prompt and relevant fields:

| Intention | Primary prompt | Conditional context |
|---|---|---|
| Ask | What do you want to know? | Optional topic and location |
| Share | What should people know? | Optional source and location |
| Need | What would make this easier? | Time, location, urgency, privacy |
| Offer | What can people contact you about? | Availability, location, private response |
| Plan | What are you organizing? | Date, time, location, capacity |

The author must see the audience and privacy state before publishing.

Ordinary Ask, Share, and Plan posts default to the selected city/community. Need and Offer flows default to public discovery with private coordination after a response, unless the author explicitly chooses another supported visibility.

## Compact structured post card

Home uses the existing `UnifiedPostCard` compact variant as the implementation base. The approved mobile anatomy is:

1. Author identity, neighborhood/community, and relative time.
2. Visible intention label.
3. Short title and concise body.
4. One-line contextual metadata such as location, date, or urgency.
5. Helpful, Reply, and Save actions.
6. Inline reply expansion when appropriate.

Mobile constraints:

- 12-pixel outer page gutter at narrow phone widths.
- Approximately 10–12 pixels of internal card padding.
- Minimum 44-pixel action hit areas.
- No forced media header.
- No decorative gradient per post type.
- Context truncates safely rather than causing horizontal overflow.

“Helpful” acknowledges useful content. It does not award or expose public mitzvah points.

## Component boundaries

Implementation keeps `Feed.jsx` orchestration-focused and splits new behavior into bounded units:

- `DailyBriefPreview` — three ranked Home items and Open Brief action.
- `BriefCategoryLaunchpad` — all category tiles and preference ordering.
- `BriefCategorySection` — shared category detail shell.
- `BriefCategoryTabs` — Updates, Discuss, and Directory state.
- `FeedIntentionRail` — five visible posting actions.
- `EngagementLevelSetting` — persistent Settings control.
- `briefCategories` — single category configuration source.
- `briefRanking` — pure classification and ranking helpers.

Existing `FiveTownsBrief` is refactored into these units. It must not grow into another large conditional component.

## Data flow

1. Feed queries existing posts, communities, published brief data, current-user preferences, and Jewish-time data.
2. Pure ranking helpers classify candidate items by the shared category configuration.
3. Ranking combines explicit interests, allowed behavior signals, urgency, trust, freshness, and locality.
4. Home receives the top three results.
5. Open Brief receives the full category configuration and category-scoped query results.
6. Engagement preferences affect promotion and notification policy but never category visibility.
7. Mutations invalidate existing feed and preference query-key families.

No component issues ad hoc Supabase queries when an existing service or entity abstraction owns the domain.

## Loading, empty, and error behavior

### Home preview

- Loading: three compact skeleton rows inside the Brief shell.
- Error with cached data: show cached items and a quiet stale-data message.
- Error without data: show sourced Jewish/local reference content and a retry action.
- Empty real activity: show honest reference content, never invented posts.

### Category launchpad

- Category configuration is local and renders immediately.
- Per-category activity counts load progressively without blocking the grid.
- A failed count must not remove or disable a category.

### Category section

- Loading: category header remains visible with content skeletons below.
- Empty: explain what belongs in the category and present one useful action.
- Error: state what failed and provide retry; do not replace it with fake content.
- Permission failure: explain whether membership or authentication is required.

## Accessibility

- All icon-only controls require accessible names.
- Category tiles are native buttons or links with visible labels.
- Selected category and tab state use `aria-current`, `aria-selected`, or equivalent semantics.
- Expanded Brief and category route changes move focus to the new page heading.
- The five posting actions retain visible text at every supported mobile width.
- Minimum interactive target is 44 by 44 CSS pixels.
- Reduced-motion preferences are respected.
- Color is never the only signal for selected interests, urgency, or post intention.

## Responsive behavior

- Primary design width: 390 CSS pixels.
- Supported minimum: 320 CSS pixels without horizontal scrolling.
- Tablet/desktop: center the mobile content column initially; the existing planned desktop-shell project owns the eventual multi-column transformation.
- Category grid uses two columns on normal phone widths and collapses to one column below the breakpoint required for readable labels.
- Bottom navigation must not cover the final card action or category tile.

## Analytics

Reuse the current feed-engagement event infrastructure for non-sensitive events:

- Brief opened.
- Category opened.
- Category preference changed.
- Home intention selected.
- Engagement level changed.
- Brief item opened.

Do not record private message contents, help details, draft body text, or sensitive form values in analytics metadata.

## Testing and verification

### Unit tests

- Category classification for all supported post types and subtypes.
- Deterministic top-three ranking.
- Explicit preferences outweigh low-value passive behavior.
- Verified urgent notices can override preferences.
- Private signals never enter ranking inputs.
- Engagement level does not change available categories.
- Preference-driven category ordering is stable.

### Component tests

- Home renders exactly three Brief preview items.
- Home does not render **Why these three?**.
- Open Brief exposes all twelve categories.
- Category selection restores from URL state.
- Five posting actions open the correct composer intention.
- Compact cards preserve required metadata and actions.
- Empty, loading, cached-error, hard-error, and permission states render correctly.

### Integration checks

- Post creation still persists and refreshes Home.
- Back navigation returns from category section to launchpad, then Home.
- Preference and engagement-level changes survive refresh and sign-in.
- Blocking, reporting, moderation, deletion, and saved-post behavior remain intact.
- Feed queries and route parameters remain compatible with current detail links.

### Manual viewport checks

- 320 pixels.
- 390 pixels.
- 768 pixels.
- 1024 pixels.
- 1440 pixels.

At every width, verify no overlap, clipped labels, hidden focus rings, obstructed final content, or accidental horizontal scrolling.

## Delivery sequence

1. Add category configuration and pure ranking helpers with tests.
2. Add persisted interests and engagement level through existing preference services.
3. Replace the current large Brief presentation with the compact preview.
4. Add five-action intention rail using the existing composer.
5. Add expanded Brief route state and category launchpad.
6. Add shared category-section shell and initial category mappings.
7. Compact and verify the existing `UnifiedPostCard` variant.
8. Move engagement control to Settings.
9. Remove superseded Feed modules only after equivalent flows are verified.
10. Run repository-wide JUnited self-check and end-to-end browser verification.

## Acceptance criteria

- A signed-in member sees a personalized three-item Brief preview on Home.
- Home contains no **Why these three?** control or engagement slider.
- Five visible intention actions appear directly under the preview.
- Real community posts begin immediately after the actions.
- Open Brief exposes all twelve categories without a repeated feed underneath.
- Every category opens through a shared focused-section experience.
- Engagement level remains permanently adjustable in Settings.
- Personalization uses explicit preferences and allowed behavior signals only.
- Private help and message content never affect ranking or analytics.
- Compact post cards remain readable and touch-friendly at 320 pixels.
- Existing post creation, reactions, replies, saving, moderation, and deep links remain functional.
