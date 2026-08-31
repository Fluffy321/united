# Living Five Towns Directory and Traffic

## Locked direction

The existing Five Towns dashboard remains JUnited Home. Nothing on the approved dashboard is removed or reordered. The directory opens from its existing search, category, and “see all” actions and receives the brighter “Living directory” treatment selected as option 1.

## Directory experience

- Keep all current sourced listings, photos, map links, corrections, filters, and listing details.
- Add friendly intent shortcuts such as Dinner tonight, Kids, Coffee, and Shabbat shopping. Each shortcut is a real filter, not a separate fake content source.
- Replace uniform white category boxes with distinct tinted cards, clear icons, and examples of what each section contains.
- Add a horizontal “Good starting points” rail populated only from existing featured listings with real photos and sources.
- On category pages, show photo-backed shortcuts first, followed by the complete searchable and town-filtered listing results.
- Describe counts as “sourced places” or “listings,” not “verified options,” unless a listing has an explicit current verification source.
- Never invent reviews, ratings, popularity, operating hours, open-now claims, or community activity.

## Live traffic

The current client already understands 511NY traffic, but it cannot show live incidents until a 511NY developer key is configured.

For production, the key must be stored as the Supabase secret `NY511_API_KEY`, not exposed through a `VITE_` browser variable. A Supabase Edge Function will request 511NY events, limit them to relevant crashes, closures, and roadwork near the Five Towns, return a short cache header, and expose only the fields the dashboard needs.

The Home panel will show one of four honest states:

1. Loading: checking nearby traffic.
2. Incidents: the leading nearby incident plus the number of additional results.
3. Verified empty: 511NY responded successfully and no relevant nearby incident was found.
4. Unavailable: the key, service, or request is unavailable, with a direct link to 511NY.

## Mobile and behavior

- Optimize for a 390-pixel iPhone viewport and safe-area spacing.
- Horizontal rails use touch scrolling and snap naturally.
- Tap targets remain at least 44 pixels where practical.
- Search, category cards, shortcuts, filters, listings, photos, source links, corrections, and Google/Apple/Waze navigation must all work.
- Empty or failed data states stay useful and never imitate live data.

## Acceptance

- `/Feed` still opens the approved Five Towns dashboard.
- Opening the directory shows the selected option-1 visual direction.
- Every intent shortcut produces matching real listings.
- Every category can be opened and filtered by town and subcategory.
- Listing detail and map actions still work.
- Traffic works when `NY511_API_KEY` is present and stays honest when it is absent.
- Existing automated checks pass, and the complete flow is verified in iPhone view.
