# Info.plist Additions for JUnited iOS

Merge these keys into `ios/App/App/Info.plist` once the Capacitor iOS project exists
(see `setup-capacitor`, manual). Covers iosReadiness task `info-plist`.

```xml
<!-- Camera access — profile photo upload -->
<key>NSCameraUsageDescription</key>
<string>JUnited uses your camera so you can take a profile photo to help your community recognize you.</string>

<!-- Photo library access — profile photo upload -->
<key>NSPhotoLibraryUsageDescription</key>
<string>JUnited accesses your photo library so you can choose a profile photo from your existing pictures.</string>

<!-- Adding a photo to the library (e.g. saving a shared flyer/image) — only include if that flow exists -->
<key>NSPhotoLibraryAddUsageDescription</key>
<string>JUnited can save images you choose to share, like event flyers, to your photo library.</string>

<!-- Export-compliance auto-answer — see coppa-and-export-compliance.md for why this is correct -->
<key>ITSAppUsesNonExemptEncryption</key>
<false/>

<!-- Capacitor-required: allow full-bleed layout so safe-area CSS (already implemented) can render under the status bar/notch correctly -->
<key>UIViewControllerBasedStatusBarAppearance</key>
<true/>
```

**Capacitor-specific keys already handled elsewhere:**
- `viewport-fit=cover` is already set in `index.html` — no Info.plist equivalent needed, this is a web-layer setting.
- Push notification capability itself is enabled via the Xcode "Signing & Capabilities" tab (Push Notifications capability), not an Info.plist string — no usage-description string is required for push notifications on iOS (unlike camera/photos).

**Do NOT add** location, contacts, microphone, Bluetooth, or health usage-description keys — JUnited's Map feature uses manually-entered or IP-approximate location data, not `CoreLocation`, so no `NSLocationWhenInUseUsageDescription` is needed unless that changes.
