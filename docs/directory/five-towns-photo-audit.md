# Five Towns Directory Photo Audit

Checked: 2026-08-30

## Result

All 138 current Five Towns directory listings now have one consistent visual path:

1. a reviewed official/source-owned photo when JUnited has one;
2. an authenticated, short-lived Google Places photo lookup by protected listing ID;
3. a polished category-colored fallback when neither provider has a trustworthy image.

The complete audited listing inventory is the exact 138-record catalog in
`supabase/functions/_shared/fiveTownsDirectoryPhotoCatalog.json`. The synchronization
test prevents a new directory listing from shipping without joining this path.

## Reviewed official photos

Five records currently use static official/source-linked images:

| Listing | Source |
| --- | --- |
| Cork & Slice | Five Towns Vaad listing |
| Anju Modern Asian | Five Towns Vaad listing |
| Grant Park | Nassau County Parks |
| North Woodmere Park | Nassau County Parks |
| Cedarhurst Memorial Plaza | Village of Cedarhurst |

Every static image requires an HTTPS image URL, HTTPS source page, and visible source label. No review-site, social-media, search-result, copied Google media, or AI-generated images were admitted.

## Runtime coverage

The other 133 listings are eligible for the protected Google Places resolver. The function:

- accepts known listing IDs only, eight at a time;
- searches with the server-owned name and street address;
- requires the same street number, Five Towns locality, and a confident name match;
- returns only a short-lived display URL, Google Maps source, and author attribution;
- never returns or stores the API key, provider request URL, or Google photo resource name;
- returns `empty` for no trustworthy match and `unavailable` for provider problems.

Google coverage is intentionally not described as guaranteed: some real places do not have a usable Places photo. Those cards stay useful through the existing category artwork instead of showing a broken image or an incorrect business.

## Operations

Production needs the server-only `GOOGLE_PLACES_API_KEY` secret with Places API (New) enabled and API restrictions applied. Deploy `directory-photos` with normal authenticated JWT verification. The app continues to work safely if the secret or provider is unavailable.

Official photos can be added later only after confirming the place identity, image ownership/source page, and stable direct image URL. Official images always outrank Google at render time.
