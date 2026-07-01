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

## App icon — generated 2026-07-01

**Update:** the actual artwork now exists — see `internal/app-store/ios-native-prep/app-icons/`.
No image-generation tool or library was available in this environment, so `scripts/generate-app-icons.cjs`
hand-rolls both the raster (a supersampled six-pointed star / Magen David, in white, on the brand
blue `#2563EB` background — the primary button/accent color used throughout the app) and the PNG
encoder itself using only Node's built-in `zlib`. All 12 required sizes are pre-generated (8-bit
RGB, no alpha channel) — see that folder's README for the exact drop-in mapping.

This is real, presentable placeholder artwork, not a mockup — it reads clearly down to 40×40px.
Treat it as a first pass: swap in a professionally designed mark whenever one exists (regenerate
sizes the same way by editing and rerunning the script), and reconsider whether Magen David is the
right icon-level mark for the brand vs. a wordmark-adjacent monogram.

**What's still blocked:** actually dropping these into Xcode's asset catalog and confirming "no
icon-related warnings" on build requires the `ios/` project to exist (`setup-capacitor`, manual).
