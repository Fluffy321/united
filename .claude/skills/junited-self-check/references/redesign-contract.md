# JUnited redesign contract

Use this reference for self-checks involving navigation, visible UI, responsive behavior, accessibility, or redesign work. Repository rules and current code remain authoritative; this contract defines the approved direction where legacy implementations are inconsistent.

## Product architecture

- Keep five primary destinations: Home, Help, Communities, Directory, and Me/You.
- Canonical authenticated routes are `/Feed`, `/MitzvahCircle`, `/Communities`, `/Map`, and `/Profile`.
- Search, notifications, share links, and cards must open their intended detail surface with matching query-parameter names.
- Legacy aliases may redirect only when they are explicitly registered and are not presented as active user actions.
- Admin, legal, chat, and consumer experiences may use distinct shells; do not inherit consumer bottom navigation where it harms the task.

## Page responsibilities

- Home: local context, one clear composer, relevant feed, and secondary utilities without competing hero systems.
- Help: clear Need Help / Can Help modes, categories, active requests, and recoverable request flows.
- Communities: My / Discover hierarchy, restrained filtering, one action per card, and detail tabs for overview, posts, events, members, resources, and chat as supported.
- Directory: canonical List / Map switch with search, categories, distance, and consistent place details.
- Profile: identity and recent contribution first; communities and impact next; badges and saved content remain secondary.
- Messages: one primary inbox/request hierarchy and a dedicated chat shell.

## Visual direction

- Aim for a modern community utility: restrained, trustworthy, and locally specific rather than ornamental or template-like.
- Use navy and blue for the functional core. Reserve gold for distinction and olive/green for help or success semantics.
- Use semantic variables and shared primitives. Avoid adding raw colors, arbitrary radii, decorative gradients, heavy glass, or shadows when an existing token works.
- Use Inter for application UI, Fraunces selectively for editorial/display moments, and Noto Serif Hebrew for Hebrew content.
- Use Lucide/JUnited vectors for product actions. Emoji is acceptable as content or category flavor when it has a text label.

## Responsive behavior

- Mobile content must clear the fixed bottom navigation and safe area.
- Floating actions register through `FloatingActionsContext`; never guess a bottom offset.
- Sticky elements share a wrapper or measured contract; never guess another header's height.
- Desktop must become intentional as the roadmap ships: editorial Feed width, wider Communities/Profile/Messages regions, full-width Map, and desktop navigation at the planned breakpoint.

## Accessibility and states

- Target WCAG 2.2 AA and a 44×44px ergonomic target for primary touch controls.
- Name icon-only controls, preserve keyboard focus, avoid color-only meaning, and respect reduced motion.
- Every async surface needs honest loading, empty, error, and success behavior as applicable.
- Never expose internal AI/developer copy, dead-end silent redirects, fake engagement, fake automation, or launch-placeholder legal text to users.

## Verification rule

Build, lint, and tests prove code integrity—not visual correctness. Visible UI changes require route tracing and responsive runtime evidence. If that evidence is unavailable, report WARN and state the missing verification rather than claiming PASS.
