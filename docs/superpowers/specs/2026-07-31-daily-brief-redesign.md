# Daily Brief Redesign

## Product decision

The Daily Brief is JUnited's daily local habit anchor. Its first job is to answer “What matters today?” quickly and truthfully. “Today's mitzvah” and “Explore today” remain available as secondary, progressively disclosed paths rather than equal carousel slides.

The brief uses a hybrid publishing model: real feed activity can populate the brief automatically, while a published editor brief can pin or replace the three lead updates. The UI never invents needs, events, counts, urgency, or community activity when production data is absent.

## Information architecture

- The summary is always visible; there is no collapsed teaser state.
- The header identifies the current local network, English date, Hebrew date, and the most useful available Jewish-time signal.
- The body shows at most three real items. Editor-published items are labeled “Editor pick”; feed-derived items are labeled by their actual community or type and are never called verified.
- A real urgent chesed post becomes the prominent action. If none exists, the action invites the member to share a useful local update.
- Two secondary controls disclose “Today's mitzvah” and “Explore today.” Only one detail section is open at a time.
- “Explore today” contains only real events, real active conversations, and navigation to the map. Empty sections explain what is absent and provide a useful next action.

## Visual direction

The chosen direction is a quiet morning briefing, not a dashboard. The card sits naturally on the feed's pearl background and uses JUnited navy, paper white, mist blue, olive, and a restrained dawn accent:

- Ink: `#0F1C2E`
- Paper: `#FFFFFF`
- Pearl: `#F0EEE8`
- Dawn mist: `#EAF0F8`
- Chesed olive: `#556B2F`
- Morning amber: `#C98B2E`

Fraunces is reserved for the date/brief thesis; Inter carries controls and content. The signature element is a subtle time-of-day horizon line behind the header—one atmospheric gesture tied to the daily nature of the feature. No dark carousel gradients, dots, fake progress bars, emoji dashboards, or decorative statistics remain.

## Responsive and accessibility behavior

- The component is optimized for the existing 430px feed width and scales cleanly to wider desktop previews.
- Interactive rows are buttons with visible labels, keyboard focus, and at least 44px tap targets.
- Disclosure controls expose `aria-expanded` and `aria-controls`.
- Motion is limited to the existing interface transitions and respects the app's reduced-motion behavior.

## Data and trust rules

- Curated updates come only from `brief.topLocalUpdates`.
- Feed-derived updates come only from supplied posts and retain their real IDs and metadata.
- Urgency is derived only from a future `expires_at` within two hours or an explicit urgent flag.
- Counts render only when greater than zero; no minimum or fabricated values are applied.
- Jewish date and time data may render only after the existing date/time helpers return valid values.
- Copy uses the selected `networkLabel`; the UI is ready for more than the Five Towns.

## Verification

- Pure selection helpers have focused tests covering curated precedence, truthful feed fallback, urgent-need selection, and honest empty output.
- Static markup tests prove the default summary, market-neutral network label, two disclosure doors, and absence of legacy carousel/fabricated copy.
- Full tests, lint, typecheck, build, style, Jewish Hub, prompt checks, and the JUnited self-check run before release.
- The release is pushed to `origin/main`, allowed to deploy through Vercel, and verified on `https://www.junited.us/Feed` in the real signed-in flow when the existing browser session permits it.
