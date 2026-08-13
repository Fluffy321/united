# Directory iPhone-First Design

## Goal

Make JUnited's existing Directory immediately useful and understandable on an iPhone without replacing the business directory, community map, or any of their working actions.

## Current problem

The bottom navigation says **Directory**, but `/Map` opens the Community Map first. A user looking for a restaurant, service, shul, school, or local business must understand the map controls before reaching business search.

The Businesses view then starts with a large promotional hero, three zero-count statistics when the directory is empty, a large submission button, and fourteen category tiles before search. On a phone, the primary job—finding something—arrives too late.

## Chosen direction

Directory opens to **Businesses** by default. **Community Map** remains the second top-level view and keeps its current features.

The first iPhone screen will contain, in this order:

1. The shared Directory header and the Businesses / Community Map switch.
2. A direct search field for businesses, services, and neighborhoods.
3. A compact horizontal category rail with large-enough tap targets.
4. Business results, or an honest empty state when there are no approved listings.

The large dark “Support Jewish Business” hero and the Listed / Verified / Online statistics are removed. JUnited must not make an empty directory feel busier than it is.

## Business actions

All existing business behavior remains available:

- search and category filtering;
- physical, online, and service-area filters;
- list and map result modes;
- listing details, website, directions, and trust badges;
- business submission;
- claim requests;
- owner tools and admin-reviewed verification.

“List a Business” becomes a smaller secondary action near the search/results area. If the directory is empty, the empty state can also offer it as the clear next action.

## Community Map

The Community Map remains reachable from the top switch. Its community filters, post pins, mitzvah data, map controls, privacy filters, and location behavior stay unchanged in this pass.

## Mobile behavior

- Design and verify at 390 × 844 first.
- No horizontal page overflow.
- Horizontally scrolling category pills may overflow within their own rail.
- Every new interactive control has a minimum 44-pixel touch height.
- Active view and filter buttons expose pressed state.
- The bottom navigation remains visible and content is not hidden behind it.

## Empty, loading, and error states

- While business listings load, keep the existing loading state.
- When there are zero approved listings, show one concise, honest explanation and a single “List a Business” action.
- When filters produce no matches but listings exist, explain that the current filters have no matches and provide a clear reset path.
- Location denial stays non-blocking; search and list browsing continue to work.

## Testing

Automated coverage will lock:

- Businesses as the default `/Map` view;
- search before categories and results in source hierarchy;
- removal of the oversized hero and zero-count stat block;
- compact, accessible category controls;
- preserved Business / Community Map switching;
- honest distinction between an empty directory and filtered no-results.

Browser verification will cover 390 × 844 first, then 768, 1024, and 1440 widths, plus search, category filtering, view switching, submission opening, and Community Map return.

## Out of scope

- Adding fake or seed business listings;
- changing database tables, verification policy, or Supabase permissions;
- rebuilding the map;
- redesigning business detail and owner-management modals;
- adding new organization, shul, or school subsystems.
