# Launch Screen & App Icon — Prep Notes

Covers iosReadiness tasks `launch-screen` and `app-icons`. Both are `taskType: mixed` — the
config/code below is ready to use once `setup-capacitor` exists, but the actual 1024×1024
icon artwork still needs a human designer/tool (no design-generation capability here).

## Launch screen — ready-to-use LaunchScreen.storyboard

Replace the contents of `ios/App/App/Base.lproj/LaunchScreen.storyboard` with:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0" toolsVersion="23504" targetRuntime="iOS.CocoaTouch" propertyAccessControl="none" useAutolayout="YES" launchScreen="YES" useTraitCollections="YES" useSafeAreas="YES" colorMatched="YES">
    <device id="retina6_12" orientation="portrait" appearance="light"/>
    <dependencies>
        <deployment identifier="iOS"/>
        <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="23507"/>
    </dependencies>
    <scenes>
        <scene sceneID="EHf-IW-A2E">
            <objects>
                <viewController id="01J-lp-oVM" sceneMemberID="viewController">
                    <view key="view" contentMode="scaleToFill" id="Ze5-6b-2t3">
                        <rect key="frame" x="0.0" y="0.0" width="414" height="896"/>
                        <autoresizingMask key="autoresizingMask" flexibleMaxX="YES" flexibleMaxY="YES"/>
                        <subviews>
                            <label opaque="NO" userInteractionEnabled="NO" contentMode="left" horizontalHuggingPriority="251" verticalHuggingPriority="251" text="JUnited" textAlignment="center" lineBreakMode="tailTruncation" baselineAdjustment="alignBaselines" adjustsFontSizeToFit="NO" translatesAutoresizingMaskIntoConstraints="NO" id="lbl-junited">
                                <fontDescription key="fontDescription" type="boldSystem" pointSize="34"/>
                                <color key="textColor" red="0.06" green="0.09" blue="0.16" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>
                                <nil key="highlightedColor"/>
                            </label>
                        </subviews>
                        <viewLayoutGuide key="safeArea" id="6Tk-OE-BBY"/>
                        <color key="backgroundColor" red="0.965" green="0.973" blue="0.984" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>
                        <constraints>
                            <constraint firstItem="lbl-junited" firstAttribute="centerX" secondItem="Ze5-6b-2t3" secondAttribute="centerX" id="ctr-x"/>
                            <constraint firstItem="lbl-junited" firstAttribute="centerY" secondItem="Ze5-6b-2t3" secondAttribute="centerY" id="ctr-y"/>
                        </constraints>
                    </view>
                </viewController>
                <placeholder placeholderIdentifier="IBFirstResponder" id="iYj-Kq-Ea1" userLabel="First Responder" sceneMemberID="firstResponder"/>
            </objects>
            <point key="canvasLocation" x="53" y="375"/>
        </scene>
    </scenes>
</document>
```

- Background: `#F6F8FB` (matches the web app's `bg-[#F6F8FB]` used across pages, e.g. `AdminiOSReadiness.jsx`), so the transition from launch screen to first paint is seamless.
- "JUnited" wordmark, bold, centered — no logo image needed unless a mark exists at 1024×1024 already; a text-only launch screen is fully compliant with Apple guidelines and avoids needing a second asset.
- Uses Auto Layout + safe area guide, so it centers correctly on iPhone SE through iPhone 16 Pro Max without per-device sizing.

## App icon — concept brief (design work itself needs a human/design tool)

**Concept:** Simple, high-contrast mark that reads at 60×60px — avoid fine detail or small text.
Given the brand is "JUnited," a strong option is a rounded/six-pointed star motif (Star of David,
simplified to clean geometric lines) on the brand blue background (`#2563EB`, matching the primary
button/accent color used throughout the app), with no wordmark on the icon itself (App Store already
shows the app name below the icon).

**Required sizes (generate all from one 1024×1024 source, no alpha channel):**
- 1024×1024 (App Store Connect marketing icon)
- 180×180 (iPhone @3x, Home Screen)
- 120×120 (iPhone @2x, Home Screen)
- 167×167 (iPad Pro @2x)
- 152×152 (iPad @2x)
- 87×87, 80×80, 58×58, 60×60, 40×40, 29×29, 20×20 (Settings, Spotlight, Notification icons at various scales)

**Recommended free tool:** [appicon.co](https://appicon.co) or Xcode's own "Single Size" asset catalog
mode (Xcode 14+) — upload one 1024×1024 PNG and it outputs (or Xcode auto-generates) every required size.

**Action needed from a human:** design or commission the actual 1024×1024 artwork (Figma/Canva/a
designer), then run it through the sizing tool and drop the set into
`ios/App/App/Assets.xcassets/AppIcon.appiconset/` in Xcode.
