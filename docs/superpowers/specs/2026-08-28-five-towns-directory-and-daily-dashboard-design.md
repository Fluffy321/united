# Five Towns Daily Dashboard and Directory Expansion

**Date:** August 28, 2026  
**Status:** Approved for implementation  
**Scope:** JUnited authenticated Home (`/Feed`) and the Five Towns directory

## Goal

Keep the existing Five Towns community dashboard as JUnited's Home screen while making it more useful every day. The page should answer two questions quickly:

1. What do I need to know in the Five Towns today?
2. Where can I find the Jewish or local place I need?

The page remains Five Towns community-centered. It is not redesigned as a restaurant app, review app, or generic discovery feed.

## Approved Home structure

The mobile Home screen uses this order:

1. Existing JUnited header, Five Towns location, account controls, and global search
2. Compact `Five Towns today` utility panel
3. Existing eight-group Jewish directory grid
4. Photo-led `Places worth knowing` rail
5. Photo-led `Useful nearby` section organized around real-life needs
6. Existing JUnited bottom navigation

The previous large blue dashboard introduction is removed. It used too much of the first iPhone viewport and repeated information already communicated by the page.

## Five Towns today

The first content block is a compact two-column utility grid. It shows:

- Current Five Towns weather and conditions
- Candle-lighting and Shabbat-ending times when relevant
- Today's sunrise and sunset
- Local traffic, crash, closure, school, and road alerts

The panel must use live, attributed sources. The initial source plan is:

- Weather: the production weather provider selected during implementation
- Jewish calendar and Shabbat timing: Hebcal for ZIP 11598 or equivalent Five Towns coordinates
- Sunrise and sunset: the same location-aware time provider, with consistent timezone handling
- Road incidents: official 511NY or an equivalent official New York transportation feed
- Village and school notices: official local feeds when a stable source is available

Behavior rules:

- Show the source and last refresh time in the expanded view.
- Never invent an incident or local alert.
- If no verified incident exists, show a short calm state such as `No major nearby incidents`.
- If a provider is unavailable, show `Live information unavailable` with a retry action. Do not show stale data as current.
- Shabbat timing follows the user's selected Five Towns location and chosen end-time convention. The default ZIP is 11598 until personal location settings are available.
- The alert row expands only when real information needs attention.

## Directory expansion

The complete sourced directory remains the foundation. It continues to include all eight groups:

- Jewish life
- Food
- Family
- Shopping
- Health
- Services
- Community
- Things to do

The first enrichment pass focuses on approximately 35 high-confidence featured places across restaurants, shops, parks, recreation, family activities, and essential community destinations. The full directory remains searchable even when a listing is not yet featured.

Each enriched listing may include:

- Official photo URL
- Photo source URL and source label
- Short `Why go` note
- Useful tags such as `Kids`, `Free`, `Date night`, `Quiet`, `Late`, or `Indoor`
- Address, town, phone, website, and source
- Google Maps, Apple Maps, and Waze links
- Verified kosher badge only when supported by a current certification source
- Last-checked date

## Photo policy

Photos must come from an official business, organization, village, county, or other clearly authorized public source. Store both the image URL and the page that authorizes or publishes it.

If a safe official photo is unavailable:

- Keep the listing in search and category results.
- Use a polished category visual or icon.
- Do not use a random search-engine photo, scraped customer photo, or uncredited social-media image.

Broken remote images fall back to the category visual without breaking the card layout.

## Why go notes

`Why go` is JUnited editorial guidance, not a customer review. It must be specific, friendly, and based on verified public facts.

Good examples:

- `A calm local walk with benches and a reflection pool.`
- `A dairy sit-down option for pizza, pasta, and a relaxed dinner.`
- `Playgrounds, courts, walking paths, fishing, and a seasonal spray area.`

Rules:

- Never invent star ratings, popularity, quotes, or customer experiences.
- Do not claim food quality, service quality, or atmosphere unless the official source supports that description.
- Label the content `Why go`, never `Review`.
- Real member reviews are a later system with identity, moderation, reporting, and abuse controls.

## Useful nearby

`Useful nearby` is organized around what a person needs, not only business taxonomy. The initial cards are:

- Get the kids out
- Need a calm hour
- Make a full afternoon
- Go out tonight
- Guests are visiting

Later additions may include:

- Open late
- Rainy-day plan
- Quick errand
- Simcha preparation
- New to the Five Towns
- Walkable from Central Avenue
- Accessible options

Each card uses an official photo and opens a filtered result set or a specific sourced place. These cards are navigation shortcuts, not separate duplicate databases.

## Personalization

The approved dashboard personalization remains in place. Interest controls and `More like this` or `Less like this` signals may reorder featured places and useful-nearby cards. They do not hide the full directory or prevent users from searching any category.

Local urgency can temporarily raise a verified alert above personalized content. Random rides, meals, or community posts must not interrupt people who did not ask to see them.

## Data model additions

The normalized directory listing gains optional fields:

- `imageUrl`
- `imageSourceUrl`
- `imageSourceLabel`
- `whyGo`
- `tags`
- `featured`
- `lastChecked`

Daily utility data is separate from directory records. It uses provider adapters with a shared normalized shape for weather, Jewish times, solar times, and alerts. Provider failures are isolated so one broken feed does not remove the other daily information.

## Interaction and iPhone behavior

- The design target is a 390 × 844 iPhone viewport.
- Daily utility cards are large enough to tap and open details.
- Photo rails swipe horizontally with visible next-card affordance.
- Directory groups remain compact enough to see all eight without excessive scrolling.
- Listing details open as a true full-screen mobile layer.
- Bottom navigation never covers listing actions.
- Images reserve their space before loading to prevent layout jumps.
- Reduced-motion preferences are respected.

## Trust, corrections, and freshness

- Every enriched listing exposes its public source.
- `Report a correction` opens JUnited feedback with the listing attached.
- Kosher status is never inferred from wording or category.
- Date-sensitive facts show their last-checked date.
- Live information includes a refresh timestamp.
- Expired or unavailable establishments are hidden from featured areas while remaining in an internal review queue.

## Error and empty states

- Photo unavailable: show the category visual.
- No featured results for a preference: show broader Five Towns choices.
- No verified alerts: show the calm no-alert state.
- Alert provider unavailable: show a small unavailable state and retry control.
- Directory source unavailable: keep the last verified local directory snapshot and label its checked date.

## Testing

Implementation must include:

- Directory normalization tests for photos, sources, tags, and `Why go`
- Tests that reject kosher verification without a supported source
- Tests for broken-image fallback
- Tests for each daily provider adapter and failure state
- Tests proving alerts are not fabricated when a provider returns no incidents
- Tests for timezones and Friday/Saturday Shabbat behavior
- Feed contract tests confirming the approved order and removal of the large blue introduction
- iPhone interaction checks at 390 × 844
- Responsive overflow checks at tablet and desktop widths
- Full lint, unit test, typecheck, build, style, and JUnited self-check gates

## Out of scope for this pass

- Unmoderated member reviews
- User-uploaded business photos
- Paid placement or sponsored rankings
- Claims that the directory contains every Five Towns business
- Automatic public posting from unverified feeds

## Approved visual direction

The final approved visual companion screen is `five-towns-daily-utility-v6.html`. It keeps the existing clean white and blue JUnited dashboard theme, replaces the large blue introduction with the compact daily utility panel, and adds official photography as the main visual signature below the directory grid.
