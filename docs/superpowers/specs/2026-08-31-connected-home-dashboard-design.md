# Connected Five Towns Home Dashboard Design

## Goal

Turn the existing Five Towns Home into one calm, connected dashboard without replacing the real systems already built. A member should understand the page without studying it and move through one natural story:

`Today → Find something → Worth knowing nearby → Useful nearby → People and plans`

This design extends the existing Five Towns Home, directory, daily-information, personalization, and community-led Home specifications. Their sourcing, honesty, route, accessibility, and iPhone rules remain authoritative unless this document makes the presentation more specific.

## Locked direction

The approved visual direction is **Connected Dashboard**. The page is not a command center, an editorial news feed, or a collection of unrelated feature cards.

JUnited Home should feel like one place that answers five questions in order:

1. What matters in Five Towns today?
2. How do I find anything Jewish?
3. What nearby place is worth knowing about?
4. What can I do based on what I need right now?
5. What are real people and groups doing?

The directory gives a new or occasional user immediate value. Real circles and real events give members a reason to return.

## Permanent Home order

`/Feed` remains the authenticated Home route. Its order is locked as:

1. Compact JUnited and Five Towns header.
2. Universal Jewish search with one quiet `Tune` action.
3. `Your day in Five Towns` daily overview.
4. `Find something` directory launchpad.
5. `Worth knowing nearby` real place rail.
6. `Useful nearby` intent-based rail.
7. `People and plans`, containing real joined-circle activity and real local events.
8. Existing bottom navigation.

Nothing below `People and plans` may repeat the directory, daily information, Help, Jewish life, opportunities, local updates, or another discovery grid.

## One shared section language

Every major Home section uses the same small system:

- a short uppercase eyebrow describing the section's role;
- one plain-language title;
- at most one small right-side action;
- consistent space before and after the section;
- the same horizontal page edge;
- predictable card corners, borders, and tap feedback.

The approved labels are:

| Eyebrow | Title | Action |
| --- | --- | --- |
| Your day in Five Towns | Today at a glance | Source or details only when useful |
| Everything Jewish | Find something | All listings |
| Close to you | Worth knowing nearby | See all |
| Pick a mood | Useful nearby | Everything |
| Your community | People and plans | See all |

Different colors communicate purpose. Blue is the JUnited/navigation color; amber supports food and Jewish-time utility; green supports calm/outdoor/helpful places; violet supports circles; orange supports plans and events. Color is not added only for decoration.

## Header and search

Keep the compact JUnited/Five Towns identity and existing calendar, message, notification, and profile actions. Do not add a hero slogan or large welcome block above the useful content.

The search row says **Find anything Jewish nearby**. Tapping the main search area opens the complete in-dashboard directory. A separate `Tune` action opens the existing preference controls at `/Settings?section=notifications`; it does not interfere with the search tap target.

Both controls expose at least a 44-pixel interactive height and clear accessible labels.

## Your day in Five Towns

The current weather, Jewish times, sunrise/sunset, and sourced traffic systems remain. They are visually combined into one dark, compact daily overview instead of reading as several unrelated white cards.

- The section presents the current weather, the most relevant Shabbat time, sunset, and current road state at a glance.
- A real active traffic incident may expand into one compact alert row.
- Loading, unavailable, and verified-empty traffic states remain honest.
- Official source links and screen-reader details remain available.
- The design must not claim roads are clear unless the real traffic response is a verified empty result.

The daily panel stays useful in one glance and should not dominate the first screen.

## Find something

Keep every real directory group and every listing searchable. On Home, present the four most useful launch groups first:

- Jewish life
- Food
- Family
- Things to do

The remaining groups remain immediately reachable through `All listings` and the complete directory. This is a Home shortcut decision, not removal of categories.

Each shortcut uses a clear icon, short label, and a truthful destination. Remove visible listing counts from the Home shortcuts unless a count directly helps the choice; counts remain available inside the directory.

## Worth knowing nearby

This section keeps the approved photo-led real-place rail. It uses actual Five Towns listings and the existing photo fallback rules.

- Show a small number of strong, varied places rather than a long dump of listings.
- Each card opens the real in-dashboard listing detail.
- Prefer photo-backed, verified, currently useful listings.
- Do not use invented reviews, popularity, urgency, or open/closed claims.
- Avoid showing several nearly identical restaurants or businesses in a row.

Directly beneath the rail, show one quiet explanation such as `Shown because you like food and local plans` only when it can be supported by saved preferences or real behavior signals. The adjacent overflow control offers `More like this`, `Less like this`, and `Hide this subject`. If no real personalization reason exists, omit the explanation instead of inventing one.

Hidden subjects remain searchable and available in the directory; they simply stop occupying Home.

## Useful nearby

Keep the intent-based section the user already approved. It answers a need rather than repeating directory categories. Examples include:

- Go out tonight
- Get the kids out
- Need a calm hour
- Make a full afternoon
- Guests are visiting

Each option opens a real filtered collection of existing listings. A card shows a truthful matching count only when the count is calculated from the current directory data. It does not pretend that a plan, reservation, or event exists.

The rail stays compact and swipeable. It is the final directory-focused section on Home.

## People and plans

Replace the feeling of two unrelated bottom sections with one shared **People and plans** section. Inside it are two distinct, equally understandable doors:

1. **From your circles** — real posts or honest quiet states from communities the member joined.
2. **Happening tonight** or **Coming up** — real event records using the existing Five Towns time-zone logic.

The shared section heading provides the visual connection. The two content types do not get merged into one fake feed.

- When both have content, show compact previews for both without forcing a long vertical scroll.
- When one side is empty, let the real side use the space and show one small honest action for the empty side.
- When both are empty, show one compact row offering `Browse communities` and `Add event`—not two large empty boxes.
- Circle cards still open their registered community destination.
- Event cards still open the existing event detail/replies sheet.
- `See all` reaches Communities or Upcoming Events through the existing working controls.

No fake people, messages, attendance, reactions, plans, or activity may appear.

## Personalization behavior

Personalization should work quietly rather than making the page feel complicated.

- Keep one visible `Tune` control near search.
- Use saved interests, engagement level, joined communities, and explicit `More like this` or `Less like this` signals when available.
- Do not interrupt returning users with repeated setup questions.
- Do not allow one category, a random ride, or a meal request to take over Home unless the member chose that interest or the item is a genuinely relevant alert.
- Preference changes must remain reversible.
- Personalization changes Home ranking and selection, never the availability of search results.

## Component boundaries

Preserve the current data flow and real queries. Refactor presentation into a small shared visual system instead of adding another parallel Home implementation.

- `FiveTownsHomeDashboard` remains the Home composition root.
- Add or extend a shared `HomeSectionHeading` component for eyebrow, title, and one action.
- `FiveTownsDailyPanel` owns the compact daily overview and sourced traffic states.
- `FeaturedPlaceCard` remains the real-place presentation.
- `UsefulNearbyCard` remains the intent-card presentation.
- Add a `HomePeopleAndPlans` wrapper around the existing `HomeCircleActivity` and `HomeTonight` behavior.
- Keep `buildCircleActivity` and `buildHomeEventWindow` pure and unchanged unless the shared empty-state layout requires a small derived display state.

Do not duplicate the Home dashboard, directory data, event selection rules, or community queries.

## iPhone and accessibility requirements

- Primary target: 390 by 844 CSS pixels.
- The first viewport should expose the identity, search, and useful daily overview without tiny text.
- No horizontal page overflow.
- Internal rails may scroll horizontally, snap cleanly, and hide decorative scrollbars.
- All interactive controls are at least 44 by 44 CSS pixels, including compact text actions and overflow controls.
- Sticky header and bottom navigation respect iPhone safe areas.
- Heading order and landmarks remain meaningful to screen readers.
- Color is never the only way a purpose or state is communicated.
- Text does not shrink below the existing readable mobile scale.
- Empty states collapse; they do not leave blank vertical space.

## Tests and verification

Automated coverage must prove:

- the locked section order is preserved;
- the new shared eyebrow/title/action language renders consistently;
- Home exposes only the four approved directory shortcuts while the full directory retains all groups;
- search and `Tune` reach their real destinations;
- real place, circle, and event callbacks still work;
- personalization explanations appear only with a real reason;
- hidden subjects stay searchable but disappear from Home selection;
- the combined People and plans section handles both-content, one-content, and all-empty states compactly;
- no fabricated activity, reviews, road status, counts, or personalization reasons appear;
- the page has no horizontal overflow at 390 pixels;
- primary tap targets meet the 44-pixel requirement.

Before push, run focused Home tests, the complete test suite, lint, typecheck, production build, JUnited self-check, and browser verification at 390 by 844. Click through search, Tune, all four directory shortcuts, one place, one Useful nearby choice, one real circle, one real event, and the bottom navigation.

## Success criteria

- The current real systems remain intact.
- The page reads as one dashboard rather than stacked features.
- A first-time user can find Jewish places immediately.
- A returning member can see real people and plans without being bothered by irrelevant activity.
- Every visible item is real, sourced, or honestly empty.
- The Home screen stays visually calm, compact, fluid, and unmistakably designed for iPhone.
- The approved story remains clear from top to bottom: Today, Find, Nearby, People and plans.
