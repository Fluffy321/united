# Hybrid Directory Photo Coverage Design

**Date:** 2026-08-30  
**Status:** Approved design  
**Scope:** Five Towns Home dashboard and complete Jewish directory

## Goal

Give every one of the 138 current Five Towns directory listings a useful visual treatment without inventing imagery, exposing provider credentials, or implying that JUnited owns third-party photography.

The directory currently has five traceable listing photos. This project expands coverage with a hybrid system:

1. use a stable, traceable official-source photo when one has been reviewed;
2. otherwise request a current Google Places photo at runtime;
3. if neither source is available, keep the existing polished category fallback.

## Product rules

- Never generate an AI image for a real business, shul, school, organization, or place.
- Never use an untraceable search-result image, copied review-platform image, or unattributed social image.
- Keep the complete directory searchable even when a listing has no photo.
- A photo is visual context, not proof that a listing is kosher, Jewish-owned, recommended, partnered, open, or currently operating.
- Existing kosher certification and factual source labels remain separate from photo attribution.
- Broken or unavailable photos must fall back immediately without leaving blank space or a broken-image icon.

## Source priority

### 1. Reviewed official-source photo

The existing enrichment record may store:

- `image_url`
- `image_source_url`
- `image_source_label`

An official photo is displayed only when both the image and publisher page use HTTP(S). The publisher page remains visible as the photo source. High-confidence municipal, county, school, shul, organization, certifier, and business-owned sources may be used. Third-party directories are not treated as permission to copy their photography.

### 2. Google Places photo fallback

When no reviewed official photo exists, the client may request a Google photo for that listing through a protected Supabase Edge Function. The browser never receives `GOOGLE_PLACES_API_KEY`.

The function:

1. accepts a small batch of directory listing IDs;
2. looks up the server-owned listing name and address rather than trusting arbitrary client search text;
3. uses Places API (New) with narrow field masks;
4. requires a strong name/address match before returning a photo;
5. returns only the current media URL, Google Maps source URL, and required author attribution;
6. reports `ready`, `empty`, or `unavailable` honestly.

Google photo resource names are not written into the static directory dataset or persisted as durable application records. The client keeps results only in a short React Query session cache. Requests are lazy and limited to cards entering or approaching the viewport.

### 3. Category fallback

If the official photo fails, Google cannot match the place confidently, the API is unavailable, or attribution is incomplete, the current category artwork remains. The fallback preserves card size, contrast, and tap behavior.

## Data contract

Directory listings keep the existing official-photo fields and add no required provider fields. Runtime photo responses use this normalized shape:

```ts
type DirectoryPhoto = {
  listingId: string;
  status: 'ready' | 'empty' | 'unavailable';
  imageUrl?: string;
  sourceUrl?: string;
  sourceLabel?: string;
  authorName?: string;
  authorUri?: string;
};
```

The UI chooses the first valid source in this order:

1. reviewed official photo;
2. ready Google Places response;
3. category fallback.

## Interface behavior

- Featured rails, listing cards, and category results share one photo component so source priority and failures behave consistently.
- Images use a consistent crop and reserved aspect ratio to prevent layout jumping.
- Full directory rows stay compact on iPhone; photos support scanning but do not overpower names, addresses, map actions, or sources.
- Google thumbnails link to the corresponding Google Maps place. Required author attribution is available on the photo/detail surface and is clearly associated with that photo.
- Official images keep the existing `Official photo · <source>` link.
- Photos load lazily. The first visible rail receives priority; off-screen directory rows do not trigger a 138-image burst.

## Components and boundaries

- `fiveTownsDirectory` remains the authoritative normalized listing catalog.
- A focused photo resolver chooses official, Google, or fallback data without changing directory filtering.
- A protected Edge Function owns Google matching, credentials, provider requests, and response normalization.
- One shared presentation component owns image loading, attribution, failure fallback, and accessible labels.
- Existing directory cards consume the shared component; they do not implement provider logic themselves.

## Security and provider controls

- Store `GOOGLE_PLACES_API_KEY` only as a Supabase secret.
- Keep authentication enabled on the photo function.
- Allow only known listing IDs and cap batch size.
- Do not accept arbitrary URLs, provider resource names, or user-written queries.
- Apply short server and client caching that respects Google Places rules.
- Do not log credentials, media URLs containing credentials, or full provider responses.
- Return neutral errors to the browser and retain category artwork during outages.

## Testing

Automated tests cover:

- official photo wins over Google;
- Google is requested only when the official photo is absent or failed;
- strong name/address matching rejects the wrong place;
- Google responses retain required attribution and Maps source access;
- unknown listing IDs and oversized batches are rejected;
- missing keys, provider failures, empty results, and malformed responses return honest states;
- no Google secret or durable photo resource name appears in browser code or static listing data;
- shared cards fall back cleanly after an image error.

Browser verification covers:

- Home featured rail and complete directory at 390 × 844;
- horizontal rails and listing results without page-level sideways scrolling;
- official, Google, loading, empty, and failed-photo states;
- tap targets, attribution access, detail opening, and existing Google/Apple/Waze actions;
- responsive smoke checks at 768, 1024, and 1440 pixels.

## Delivery sequence

1. Audit all 138 records and add high-confidence official photos first.
2. Build and test the protected Google fallback function.
3. Add the shared photo resolver and presentation component.
4. Connect featured rails and complete listing cards.
5. Verify iPhone behavior and provider failure states.
6. Push the branch through the existing PR.

The first release may retain category artwork for a small number of places when neither source can be matched safely. That is considered correct behavior, not fake completeness.
