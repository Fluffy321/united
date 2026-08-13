# Me Personal Dashboard Design

## Goal

Replace the owner-facing Profile layout with a calm, useful personal Jewish community dashboard while preserving the existing public member profile for other people.

## Product boundary

The bottom-navigation **Me** destination is the signed-in member's private dashboard. It is not a second Home feed and it is not primarily a public social profile.

- **Home** owns general local and community information.
- **Me** owns information and actions tied directly to the signed-in member.
- Opening another person's profile continues to use the existing member-profile experience and relationship actions.

## Approved iPhone hierarchy

At 390 × 844, Me appears in this order:

1. Shared header labeled **Me**, with settings access.
2. **Your JUnited today**, a calm two-column summary.
3. **Personal alerts**, using real account notifications.
4. **Your places**, four shortcuts for Communities, Saved, Help activity, and Plans.
5. A compact identity row with Edit access.
6. Existing progress tools lower on the page under one disclosure.

The bottom navigation remains unchanged and the **Me** item remains active.

## Your JUnited today

The summary combines two different personal signals without letting either dominate the page.

### Next Jewish time

- Use the member's saved candle/zmanim location from `useShabbatLocation`.
- Fetch today's real zmanim through the existing Hebcal-backed `getZmanim` function.
- Show the next still-upcoming available time from sunrise, Shema, mincha gedola, and sunset.
- If all listed times have passed, show the next available Shabbat candle-lighting time from `getShabbatTimes`.
- Show the saved location label.
- While loading, show a compact loading state. If the service fails, say **Times unavailable** and link to Jewish Hub instead of inventing a time.

### Next plan

- Derive the next actionable personal item from existing unread notifications that already have a working destination route.
- Prefer help/mitzvah responses, verification requests, direct messages, and community activity in that order.
- Display the notification title/body and open its real route.
- If no actionable notification exists, say **Nothing planned yet** with an action to find events in Search.
- Do not infer an event RSVP, ride, commitment, or deadline that JUnited does not store.

## Personal alerts

- Query the existing notification service for the signed-in member.
- Show at most three notifications, unread first and then most recent.
- Use the existing notification route resolver so every row opens a real destination.
- Time-sensitive help and verification types receive an orange marker within the row; they do not replace the top summary.
- Other unread notifications receive the normal blue unread marker.
- **See all** opens the existing Notifications screen.
- Empty state: **You're caught up. Personal alerts will appear here.**
- Error state: **Alerts couldn't load** with a retry action.

## Your places

The four shortcuts use existing routes and honest counts:

- **My communities** → `/Communities`, with joined-community count.
- **Saved** → expands or scrolls to the existing saved-posts section on Me; count is queried from existing bookmarks.
- **Help activity** → `/MitzvahCircle`, using the existing activity count already loaded for the owner.
- **Plans** → `/Search?type=event`, labeled as events and reminders; it does not claim a plan count unless real data exists.

All four controls have at least a 44-pixel touch target and an accessible name.

## Compact identity and private tools

The full social-profile hero is removed from the owner's Me dashboard. A compact row shows avatar, display name, username, and location, with **Edit** opening Settings.

Friends, posts, and community counts are not repeated as large dashboard statistics. The existing owner tools remain reachable under a disclosure below the main dashboard:

- interests and feed preferences;
- impact/get-started path;
- badges;
- mitzvah journey;
- saved posts.

The disclosure is closed by default. Saved can open it and move focus to saved posts.

## Other member profiles

When `Profile` receives another member's ID, preserve the existing member profile:

- member identity and bio;
- friends, communities, posts, and impact;
- add/remove/accept friend;
- message, share, report, and block;
- communities and recent posts;
- no private alerts, bookmarks, preferences, or owner activity.

## Data and trust

- No database schema, migration, RLS, or Supabase policy changes.
- No fake alerts, dates, times, plans, activity, counts, or community membership.
- Existing service errors remain non-destructive and retryable.
- This pass uses only the current authenticated user's private data on Me.

## Visual direction

- Existing JUnited blue remains the active accent.
- The main summary uses a pale blue-white surface, with the personal-plan half using navy for clear contrast.
- Alerts and shortcuts use quiet white surfaces and restrained category color.
- Inter remains the product font.
- The page avoids a decorative cover, oversized statistics, gradients without meaning, and emoji as product icons. Production uses the existing Lucide icon vocabulary.

## Mobile and accessibility

- Design and verify at 390 × 844 first, then 768, 1024, and 1440.
- No horizontal page overflow.
- Content remains reachable above the fixed bottom navigation.
- Interactive controls have visible focus, accessible names, and minimum 44-pixel touch targets.
- Loading, empty, error, unread, and urgent states are not communicated by color alone.

## Testing

Automated tests will lock:

- owner Me versus other-member Profile branching;
- dashboard hierarchy;
- real Jewish-time selection and fallback behavior;
- notification priority and route behavior;
- honest no-plan, empty-alert, and error states;
- existing relationship actions for other members;
- Saved opening the private tools disclosure;
- iPhone touch and overflow contracts.

Browser verification will exercise settings, alerts, all four shortcuts, identity Edit, private-tools disclosure, another member's profile, and responsive widths.

## Out of scope

- Creating a new calendar/RSVP system;
- push-notification changes;
- new profile fields;
- redesigning Notifications, Search, Settings, Mitzvah Circle, or public member profiles;
- changing the bottom navigation;
- changing Home ranking or content.
