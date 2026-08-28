# Five Towns Home Dashboard and Directory Design

## Goal

Make the approved **Everything Jewish in the Five Towns** dashboard the permanent JUnited Home screen. The dashboard should let an iPhone user reach most of JUnited from one visually simple page, while the Jewish directory provides broad, accurate, sourced local coverage.

## Home screen

`/Feed` remains the authenticated Home route, but its primary interface becomes the approved large dashboard rather than the smaller priority-feed layout.

The Home dashboard includes:

- A Five Towns location header and universal Jewish search.
- A useful local summary using real information only.
- A grouped Jewish directory.
- Personalized places and recommendations.
- Local updates, people and groups, Jewish life, opportunities, and relevant help.
- Clear access to Explore, publishing, Inbox, and Me.

The existing feed remains available as content inside the dashboard experience. It does not control the Home layout, and invented posts, conversations, people, attendance numbers, or urgency are never used as filler.

## Directory structure

The directory uses eight user-facing groups with more specific categories inside each group:

1. **Jewish life** — shuls, minyanim, mikvahs, eruvs, Torah learning.
2. **Food** — restaurants, groceries, bakeries, catering.
3. **Family** — schools, camps, childcare, tutors.
4. **Shopping** — Judaica, clothing, gifts, florists.
5. **Health** — doctors, dentists, therapists, pharmacies.
6. **Services** — lawyers, accountants, real estate, home services, car services.
7. **Community** — chesed organizations, simcha services, funeral resources.
8. **Things to do** — attractions, activities, gyms, recreation.

The first screen shows the eight groups without overwhelming the user. Opening a group shows its subcategories, listing count, filters, and results. Users can also search across names, descriptions, addresses, towns, and categories.

## Listing details

Each listing may include:

- Public name and description.
- Group and specific category.
- Address, town, phone, website, and public hours when available.
- Google Maps, Apple Maps, and Waze navigation for physical locations.
- Source link and a visible verification label.
- Kosher certifier and certification source for food listings.
- Last-checked date.
- A correction-report action.

Missing information stays visibly unavailable. JUnited does not invent hours, certification, ownership, popularity, reviews, or activity.

## Accuracy and kosher rules

- A restaurant, caterer, bakery, or grocery is labeled kosher only when a current public certifier or the business's current certification information supports that claim.
- The listing shows the certifier when known. A vague `kosher` badge without a source is not allowed.
- If certification cannot be confirmed, the listing is not presented as verified kosher.
- Closed, moved, renamed, or certification-changed businesses must be corrected or removed.
- Non-food listings are described as businesses or institutions that publicly serve local Jewish life. JUnited does not guess an owner's religion or label a business Jewish-owned without an explicit source.
- Official business, organization, school, shul, municipal, and certifier sources take priority over aggregator directories.
- Community directories may be used to discover candidates, but material facts are checked against stronger sources when available.

## Data behavior

The production dashboard reads directory data through one normalized directory model instead of embedding the prototype's records directly in the Home component. Existing JUnited business listings remain usable and are normalized into the expanded category system.

The interface handles four states clearly:

- Loading: compact skeleton cards.
- Results: real sourced listings.
- No results: a clear message plus a way to suggest a missing listing.
- Data unavailable: a retry action without fake fallback content.

## Navigation and personalization

- Directory groups and listings open real screens, not filler `See all` states.
- Search opens unified results across directory listings and other available JUnited content.
- Personalized recommendations change ordering, not availability. Users can still browse every category.
- `More like this`, `Less like this`, saved items, and hidden subjects influence future ordering.
- Random help requests, rides, meals, or unrelated needs do not appear unless they match the user's preferences or are genuinely urgent and locally relevant.

## iPhone requirements

- Design for a 390-pixel-wide iPhone viewport first.
- No sideways page scrolling.
- Tap targets are at least 44 pixels where practical.
- The main directory groups remain understandable without tiny text.
- Horizontal rails may scroll, but primary navigation and search remain obvious.
- The bottom navigation stays visible without covering the final listing content.

## Scope of this build

This build will:

- Replace the current Home composition with the approved large dashboard.
- Add the grouped directory taxonomy and real category screens.
- Normalize the existing Five Towns listing set into the new structure.
- Expand the dataset using researched, sourced Five Towns listings.
- Add certification/source/last-checked presentation.
- Connect physical listings to Google Maps, Apple Maps, and Waze.
- Preserve existing publishing, messages, profile, communities, help, and map capabilities through the dashboard.
- Verify the complete flow in iPhone view and push the completed work to the existing GitHub branch.

This build will not invent community activity, claim complete coverage of every local business, or automate unattended certification decisions. Accuracy takes priority over displaying a larger number.

## Success criteria

- JUnited opens to the approved large Five Towns dashboard.
- A user can reach the majority of JUnited's useful areas from Home.
- Every visible directory result has a real name, category, and source.
- Every kosher claim has a current supporting source.
- Each physical listing with a public address can open Google Maps, Apple Maps, and Waze.
- All directory groups open populated, usable result screens or an honest empty state.
- The main flow works at iPhone dimensions without horizontal overflow or blocked navigation.
- Existing app tests and the JUnited self-check pass before the branch is pushed.
