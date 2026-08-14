# Help Swipe Rails Design

## Goal

Make Help immediately useful on iPhone by replacing the large empty `Post a need` box with two compact horizontal rails of real public posts:

1. **Help needed** — members asking the community for help.
2. **Help offered** — members publicly offering help they can provide.

Private replies to a specific need remain private and never appear in the public offer rail.

## Mobile layout

The Browse view keeps its existing header, search, workflow tabs, and category filter. Under those controls, it renders the two rails in this order:

- `Help needed` with a small `Post a need` button.
- `Help offered` with a small `Offer help` button.

Each rail scrolls horizontally with touch momentum and scroll snapping. On a 390px iPhone, one complete card plus part of the next card is visible so swiping is obvious. Cards stay short and show only the information needed to decide whether to open them: category, title, timing or urgency, neighborhood, and one clear action.

The page no longer renders the old full-width request-card stack in Browse. Full request details and workflow actions remain available through the existing quick-view sheet when a compact card is opened.

## Public-post model

Both rails reuse the existing `mitzvah_requests` entity. A new public field, `direction`, distinguishes:

- `need` — the existing default for requests.
- `offer` — a public offer of help.

A backwards-compatible migration adds `direction text not null default 'need'` with a check constraint. Existing rows become needs automatically. This is separate from `mitzvah_offers`, which continues to represent private responses to a specific request.

The existing request form gains a mode:

- Need mode uses the current wording and posts `direction: 'need'`.
- Offer mode uses friendly wording such as `What can you help with?` and posts `direction: 'offer'`.

The same categories, neighborhood, timing, expiration, and optional map visibility apply to both modes. The primary action reads `Post need` or `Post offer`.

## Interactions

- Tapping a Need card opens the existing quick-view sheet. Eligible members can privately offer to help from there.
- Tapping an Offer card opens the same sheet in read-only/public-offer language, without showing `I can help` against someone who is already offering.
- The poster retains the existing owner controls.
- Category filtering applies to both rails.
- Search applies to both rails.
- Carpool `ride_direction: offering` rows appear under Help offered; `needed` rows appear under Help needed.

## Empty, loading, and trust states

- Loading uses compact rail skeletons, not a blank page.
- Each empty rail shows one short inline card inside that rail: `No public needs right now` or `No public offers yet`, plus the row's posting button.
- No sample activity, fake counts, or fabricated urgency is used in production.
- Private responder names, notes, and offer records never feed the public offer rail.
- Backend errors preserve the shell and existing retry behavior.

## Verification

- Unit-test request normalization and need/offer splitting.
- Contract-test both posting modes and both rail actions.
- Verify the Browse screen at 390, 768, 1024, and 1440px, with iPhone behavior as the priority.
- Verify horizontal scrolling, card opening, need creation, offer creation, and private-response protection.
- Run the complete JUnited self-check before publishing.
