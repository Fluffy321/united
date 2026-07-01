# JUnited App Icon Set

Generated 2026-07-01 by `scripts/generate-app-icons.cjs` (no design tool was available in this
environment, so the script hand-rolls both the raster — a supersampled six-pointed star / Magen
David on the brand blue `#2563EB` background — and the PNG encoder using only Node's built-in
`zlib`). All files are 8-bit RGB with **no alpha channel**, matching Apple's "no transparency"
requirement for app icons.

This is real, usable placeholder artwork — not a mockup — but it's a first pass. Swap it for a
professionally designed mark whenever one exists; regenerate sizes the same way if the design
changes (edit `scripts/generate-app-icons.cjs` and rerun `node scripts/generate-app-icons.cjs`).

## Drop-in mapping

Once `setup-capacitor` has run (`npx cap add ios`), Xcode creates
`ios/App/App/Assets.xcassets/AppIcon.appiconset/`. Drag these files in, or since this project
targets Xcode 14+, the simplest path is: **only `icon-1024.png` is required** — in
Assets.xcassets → AppIcon, enable "Single Size" and drop in just the 1024 image; Xcode/App Store
Connect derive the rest at build/submission time.

If you need the full explicit set instead (older Xcode, or non-"Single Size" mode):

| File | Purpose |
|---|---|
| `icon-1024.png` | App Store Connect marketing icon |
| `icon-180.png` | iPhone Home Screen @3x (60pt) |
| `icon-167.png` | iPad Pro Home Screen @2x (83.5pt) |
| `icon-152.png` | iPad Home Screen @2x (76pt) |
| `icon-120.png` | iPhone Home Screen @2x (60pt) |
| `icon-87.png` | iPhone Settings @3x (29pt) |
| `icon-80.png` | Spotlight @2x (40pt) |
| `icon-60.png` | iPhone Notification @3x (20pt) |
| `icon-58.png` | Settings @2x (29pt) |
| `icon-40.png` | Spotlight @1x (40pt) / Notification @2x (20pt) |
| `icon-29.png` | Settings @1x (29pt) |
| `icon-20.png` | Notification @1x (20pt) |

## What's still blocked

Actually placing these in Xcode and confirming "no icon-related warnings" on build requires the
`ios/` project to exist (`setup-capacitor`, manual) — can't be verified until then.
