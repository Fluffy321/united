# JUnited Design System — Style Guide

This document is the single source of truth for JUnited's visual language.
Primitives are defined in `src/index.css`; this guide explains when and how to use them.

---

## Brand Colors

| Name | Value | Usage |
|---|---|---|
| Primary blue | `#2563EB` | CTAs, active tabs, focus rings, icons |
| Navy | `#0F172A` | Dark segment controls, logo wordmark |
| Gold | `#D4A017` | Accents, premium badges |
| Olive | `#5A7A3A` | Secondary brand accent |
| Slate-950 | `#020617` | Reserved: intentional dark surfaces only |

### Color rules
- **Product workflow CTAs use `bg-blue-600`** (Tailwind) or `#2563EB` — not `bg-slate-950`.
- A branded acquisition surface may use `.app-button-ink` only when an approved screen-specific design spec calls for the JUnited ink treatment.
- `bg-slate-950` is reserved for **dark segment controls** (ViewSwitch on Communities) and is intentionally "black pill" style. Do not use it for regular buttons or tabs.
- Active filter chips and tab pills use **blue** to match the primary color.
- Destructive/danger actions use `bg-red-600` / `text-red-600`.
- Success states use `text-emerald-600` / `bg-emerald-50`.

---

## Typography Scale

| Token | Size | Weight | Use |
|---|---|---|---|
| Page title | `text-[20px]` | `font-black` (900) | Top-level headings |
| Section header | `text-[16px]` | `font-black` | In-page section titles |
| Card title | `text-[14px]` | `font-black` | Card primary label |
| Body | `text-[13px]` | `font-semibold` | Standard body copy |
| Meta / secondary | `text-[12px]` | `font-semibold` | Timestamps, subtitles, status |
| Caption | `text-[11px]` | `font-semibold` | Section labels, tooltips |
| Micro | `text-[10px]` | `font-bold` | Badges, chips, counts |

- Always use **Tailwind weight utilities** (`font-semibold`, `font-bold`, `font-black`). Avoid numeric weights like `font-[700]`.
- Line height: use `leading-snug` for titles, `leading-relaxed` or `leading-5` for multi-line body.

---

## Buttons

### Primary action — `.app-button-primary`
```html
<button class="app-button-primary">Save changes</button>
```
- Blue gradient, 44px min-height, 14px border-radius.
- Use for the single primary CTA per screen/modal.

### Branded acquisition action — `.app-button-ink`
```html
<button class="app-button-ink">Get started</button>
```
- Ink treatment reserved for approved login, welcome, and acquisition surfaces.
- Do not use it for in-app workflow actions, forms, filters, or routine modal confirmation.

### Secondary action — `.app-button-secondary`
```html
<button class="app-button-secondary">Cancel</button>
```
- White background, slate border, 44px min-height.
- Use for secondary/cancellation actions alongside a primary.

### Icon button — `.app-icon-button`
```html
<button class="app-icon-button" aria-label="Close"><X /></button>
```
- 44×44px touch target, rounded-[14px], white/border style.
- Always provide `aria-label` for icon-only buttons.

### Ghost button — `.app-ghost-button` / `.app-ghost-button-muted`
```html
<button class="app-ghost-button">View all</button>
<button class="app-ghost-button app-ghost-button-muted">New link</button>
```
- Borderless text links for low-priority actions.
- `app-ghost-button` = blue; `app-ghost-button-muted` = slate-400.

### Inline Tailwind CTAs (acceptable alternative)
When a button needs custom sizing/shape not covered by primitives:
```html
<!-- CORRECT: use bg-blue-600 for primary inline buttons -->
<button class="motion-press inline-flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-black text-white">
  Create community
</button>

<!-- WRONG: bg-slate-950 for primary CTAs -->
<button class="inline-flex h-10 rounded-xl bg-slate-950 ...">
```

---

## Tab Pills

### `.app-tab-pill` + `.app-tab-pill-active`
```jsx
<button className={`app-tab-pill ${active ? 'app-tab-pill-active' : ''}`}>
  Inbox
</button>
```
- Active state: blue background (`#2563EB`).
- Use for horizontal scrollable filter rows and inbox-style tab switchers.

### Dark segment control (ViewSwitch only) — `.app-tab-pill-dark`
```jsx
// Communities page ViewSwitch — intentional dark/iOS style
<button className={`app-tab-pill ${active ? 'app-tab-pill-dark' : ''}`}>
  Discover
</button>
```
- Active state: navy/black background.
- Only use this variant for top-level view-switching controls, not for filter rows.

---

## Cards

### Standard card — `.app-card`
White, border, `box-shadow`, 16px border-radius. Default for content cards.

### Soft card — `.app-card-soft`
Slight blue-tinted background, softer border. For highlight/featured cards.

### Hover variant — `.app-card-hover`
Adds lift shadow and border-color transition on hover. Use for interactive cards.

### Mobile card — `.mobile-card`
Full-width card optimized for mobile (no extra padding).

### Tailwind shorthand
When inline Tailwind classes are used instead of primitives, follow this pattern:
```html
<div class="rounded-2xl border border-slate-100 bg-white shadow-sm">
```
- `rounded-2xl` (16px) for most cards.
- `rounded-3xl` (24px) for modals and bottom sheets.
- `shadow-sm` as the base shadow; `shadow-md` on hover.

---

## Section Labels

### `.app-section-label`
```html
<p class="app-section-label mb-3">Unread</p>
```
- 11px, 900 weight, uppercase, `letter-spacing: 0.06em`, slate-400.
- Use above grouped content sections, filter group headers.

---

## Empty States

### `.app-empty-state` family
```html
<div class="app-empty-state">
  <div class="app-empty-state-icon"><ClipboardList /></div>
  <p class="app-empty-state-title">No forms yet</p>
  <p class="app-empty-state-body">Forms published by admins will appear here.</p>
</div>
```
- Dashed border, centered layout.
- Icon: blue-tinted square (`app-empty-state-icon`), 14px radius.
- Optional CTA below `app-empty-state-body` using `app-button-primary` or `bg-blue-600`.

---

## Chips / Badges

### Filter chips — `.app-chip` + `.app-chip-active`
```jsx
<button className={`app-chip ${active ? 'app-chip-active' : ''}`}>
  Chesed
</button>
```
- Active state: blue border + blue-tinted background. **Not black.**

### Type badges (community, form type, etc.)
Use inline Tailwind with type-specific colors:
```html
<span class="inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide bg-emerald-50 text-emerald-700 border-emerald-100">
  Signup
</span>
```

---

## Form Inputs

### `.app-input`
```html
<input class="app-input" type="text" placeholder="Search…" />
```
- White bg, slate border, 12px radius, 44px height.
- Focus: `border-blue-400` (blue, not purple or green).
- Error: add `border-red-400` with an explicit error message below.

---

## Spacing Rhythm

| Context | Value |
|---|---|
| Card internal padding | `px-4 py-3.5` |
| Modal/sheet padding | `px-5 pt-4 pb-10` |
| Section gap | `space-y-3` |
| Between metadata items | `gap-2` or `gap-3` |
| Icon + label gap | `gap-1.5` |

---

## Shadows

| Level | Tailwind | Use |
|---|---|---|
| Subtle | `shadow-sm` | Default cards, chips |
| Elevated | `shadow-md` | Hover state, drawers |
| Heavy | `shadow-2xl` | Modals, bottom sheets |

---

## Motion / Animation

- Tap feedback: `active:scale-95` or `active:scale-[0.98]` on all tappable cards and buttons.
- Hover lift: `hover:shadow-md hover:border-slate-200`.
- Page transitions: `.motion-page-enter` / `.motion-soft-in` (defined in `src/index.css`).
- CSS class: `motion-press` for a quick scale-down press effect.
- All animations respect `prefers-reduced-motion` via the `@media (prefers-reduced-motion: reduce)` block in `src/index.css`.

---

## Icons

- Library: **Lucide React** — import only what you use.
- Standard sizes: `h-4 w-4` (small), `h-5 w-5` (medium), `h-6 w-6` (large).
- Icon color: inherit from text by default; use `text-slate-400` for decorative icons.
- Icon-only buttons MUST have `aria-label`.

---

## Bottom Sheets / Modals

- Always render via `createPortal(content, document.body)`.
- Outer overlay: `fixed inset-0 z-[60] flex items-end justify-center`.
- Backdrop: `absolute inset-0 bg-black/50 backdrop-blur-sm`.
- Sheet: `relative z-10 w-full max-w-lg bg-white rounded-t-3xl px-5 pt-4 pb-10 shadow-2xl`.
- Drag handle: `w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5`.

---

## What NOT to do

| Don't | Do instead |
|---|---|
| `bg-slate-950` on product workflow CTAs | `bg-blue-600`; use `.app-button-ink` only for an approved acquisition screen |
| `bg-slate-800` on active filter chips | `bg-blue-600` + `app-tab-pill-active` |
| Random `bottom-[Xpx]` on floating buttons | Use `FloatingActionsContext` |
| Hardcode `font-[900]` | Use `font-black` |
| Create a one-off empty state layout | Use `.app-empty-state` family |
| `z-[50]` on modals that need to stack | Use `z-[60]` for modals, `z-[70]` for toasts |
