# Profile iPhone Focus Design

## Goal

Make JUnited's existing Profile feel like a useful member identity on an iPhone: who the person is, what they share, and where they participate should be clear before badges, streaks, or onboarding prompts.

## Current problem

The current Profile begins with a large decorative cover, then four tall statistic cards, then several separate progress and onboarding panels. Recent posts and communities—the strongest evidence that this is a real community member—arrive too far down the page.

## Chosen direction

The first iPhone screen will contain, in order:

1. The shared Profile header.
2. One compact member card with avatar, display name, username, bio, location, member details, and the existing profile actions.
3. One compact row for Friends, Communities, Posts, and Impact.
4. Recent posts.
5. Active communities.
6. A collapsed **Your progress** section on the owner's profile.

The decorative purple-and-gold cover is removed. JUnited's blue remains the active accent, with slate text and white surfaces so the member's actual information carries the page.

## Your progress

No existing owner tools are deleted. The following existing sections move into one disclosure titled **Your progress**:

- streak and daily mitzvah suggestion;
- interests;
- impact or the existing get-started path;
- badges;
- mitzvah journey;
- saved posts.

The disclosure starts closed so returning users reach their activity quickly. It exposes its expanded state to assistive technology and remains keyboard and touch usable.

## Other member profiles

Other-member behavior stays intact: add/remove/accept friend, message, share, report, and block. Private owner-only progress and saved content remain hidden. Recent posts and communities still follow the member identity.

## Empty, loading, and error states

- Keep the existing profile loading and retry behavior.
- An empty recent-posts section says that nothing has been shared and only offers “Write your first post” on the owner's own profile.
- Do not invite a viewer to write a post on another person's empty profile.
- Hide empty communities as the current implementation does.
- Do not invent activity, impact, badges, posts, or community membership.

## Mobile behavior

- Design and verify at 390 × 844 first.
- No horizontal page overflow.
- New primary controls have a minimum 44-pixel touch height.
- The bottom navigation remains visible and content is not hidden behind it.
- The identity block should fit substantially above the fold without a decorative cover consuming space.

## Testing

Automated coverage will lock the compact hierarchy, removal of the cover, posts before communities before progress, owner-only progress disclosure, preserved relationship actions, and correct empty-post action.

Browser verification will cover 390 × 844 first, then 768, 1024, and 1440 widths. It will check Profile load, settings/share, stats scrolling, progress disclosure, post action, and page overflow.

## Out of scope

- Database, Supabase policy, or schema changes;
- new profile fields or social features;
- redesigning Settings, Friends Hub, reporting, or messaging;
- adding fake profile activity;
- changing the bottom navigation.
