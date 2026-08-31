# Community-Led Five Towns Home Bottom Design

## Goal

Finish the approved Five Towns dashboard as a production-quality iPhone Home screen. Keep the current Home from the header through **Useful nearby**, then replace the repetitive lower half with two focused sections that answer:

1. What are people in my circles talking about?
2. What can I actually do tonight?

This design extends `2026-08-28-five-towns-home-directory-design.md`. Its sourcing, directory, personalization, route, and iPhone rules remain authoritative.

## Permanent Home order

`/Feed` remains the authenticated Home route. Its closed-dashboard order is:

1. JUnited and Five Towns header.
2. Universal Jewish search.
3. Five Towns today: weather, Jewish times, sunrise/sunset, and sourced traffic.
4. Jewish directory groups.
5. Nearby worth knowing.
6. Useful nearby.
7. From your circles.
8. Happening tonight.
9. Existing bottom navigation.

The Home page ends with current activity. It does not repeat Jewish life, opportunities, Help, the complete directory, or another city-update section below Useful nearby.

## From your circles

The section uses only communities the signed-in member joined and posts returned by the real feed query.

### With recent activity

- Show at most three compact cards in a horizontal, touch-friendly rail.
- Each card shows the circle name, the real post author when available, a short real post preview, and a truthful relative time.
- Do not show invented member counts, unread counts, reactions, or conversation activity.
- Tapping a card opens the real community route: `/Communities?community=<encoded-community-id>`.
- `All circles` opens `/Communities`.

### Joined circles without recent activity

- Show the member's real joined circles as compact cards.
- Use honest copy such as `No new posts` instead of implying activity.
- Cards still open the real community route.

### No joined circles

- Show one compact action row inviting the member to browse communities.
- Do not reserve a large empty rail or fabricate example circles.

## Happening tonight

Events come from real `UnifiedPost` records where `type === 'event'` and `event_date` is present.

- Interpret calendar dates in the Five Towns time zone, `America/New_York`.
- `Tonight` means an event dated today that has not already ended. When no end time exists, an event remains eligible through the end of its calendar date.
- Show at most three events, ordered by event time.
- Each card shows the real title or body fallback, time when present, location when present, and community/source when present.
- Tapping an event opens the existing event detail/replies sheet.
- `See all` opens the existing upcoming-events sheet.
- `Add event` opens the real publisher with the event publishing type selected.

If no real event remains tonight, the same compact section changes its heading to **Coming up** and shows up to three real events in the next seven days. If there are no upcoming events, show one compact honest row with `No events posted yet` and an `Add event` action. Never insert sample events.

## Data and component boundaries

Create a pure Home activity model responsible for:

- selecting joined-circle activity from real posts;
- matching posts to joined circles;
- selecting tonight's events in the Five Towns time zone;
- selecting the seven-day fallback;
- producing stable empty states.

The model does not fetch. `Feed.jsx` owns the existing feed and joined-community queries and adds one focused event query using the existing `filterUnifiedPost` service. `FiveTownsHomeDashboard` receives prepared real posts, communities, events, loading/error state, and callbacks.

The visual sections live in focused components rather than growing the dashboard file further:

- `HomeCircleActivity`
- `HomeTonight`

## Navigation contract

- Search and directory groups continue opening the in-dashboard `FiveTownsDirectory` experience.
- A circle opens `/Communities?community=<id>`.
- All circles opens `/Communities`.
- An event opens the existing event detail/replies sheet.
- All events opens the existing `UpcomingEventsSheet`.
- Add event opens `/Publish?type=event`.
- Existing Home, Help, Communities, Directory, and Me bottom tabs remain unchanged.

No Home control may use `/Directory` or `/communities/<id>` because those are not registered JUnited routes.

## Loading, errors, and honesty

- Circle activity may use a compact skeleton while real communities or posts load.
- An event query failure shows one retryable row and does not block the rest of Home.
- Real cached event data may remain visible during a refresh.
- Successful empty results use the compact empty states above.
- No fake people, groups, messages, events, attendance, popularity, urgency, or live labels are allowed.

## iPhone and visual requirements

- Primary target: 390 by 844 CSS pixels.
- No horizontal page overflow.
- Rails scroll horizontally inside the page and use snap alignment.
- Cards expose at least a 44-pixel interactive height.
- Text remains readable without shrinking below the dashboard's existing mobile scale.
- The lower half removes more vertical space than it adds.
- The final event card or empty row has enough safe-area padding to remain above the bottom navigation.
- Motion is limited to existing tap-scale feedback and native rail scrolling.

## Tests and production verification

Automated coverage must prove:

- joined-circle posts are selected without leaking posts from unjoined communities;
- the real community URL uses the registered query-parameter route;
- tonight and seven-day fallback selection respect the Five Towns time zone;
- passed events are excluded;
- no-event and no-circle states are honest and compact;
- the six repetitive lower sections are absent from Home;
- circle, event, all-events, and add-event callbacks reach their real destinations;
- no fabricated activity copy appears;
- the final page has no horizontal overflow at 390 pixels.

Before push, run the focused Home tests, the complete test suite, lint, typecheck, production build, JUnited self-check, and browser verification at 390 by 844. Verify `/Feed`, one real directory group, one joined circle, event details, Upcoming Events, and event publishing.

## Success criteria

- Everything through Useful nearby remains visually and functionally intact.
- The lower Home is shorter, clearer, and contains no repeated directory or tool sections.
- A member can reach a real joined-circle conversation from Home.
- Tonight's real events are visible at the bottom when available.
- The page provides a truthful upcoming or empty fallback when tonight is quiet.
- Every visible action opens a registered production route or an existing working sheet.
- The result passes production tests and iPhone browser verification before being pushed to PR #17.
