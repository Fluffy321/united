/**
 * iOS App Store Readiness — static task catalog.
 * Each task has a stable `id` used as the FK in ios_app_store_readiness_progress.
 *
 * taskType: 'ai' | 'manual' | 'mixed'
 *   ai     — Claude can generate the deliverable; has copyPrompt
 *   manual — must be done by a human in Xcode / App Store Connect / etc.
 *   mixed  — some AI assistance available but human must finish
 */

export const TASK_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
  NA: 'na',
};

export const TASK_TYPE = {
  AI: 'ai',
  MANUAL: 'manual',
  MIXED: 'mixed',
};

export const READINESS_STATE = {
  NOT_READY: 'not_ready',
  GETTING_CLOSE: 'getting_close',
  READY: 'ready',
};

export function computeReadiness(progressMap, tasks) {
  const required = tasks.filter(t => t.required);
  const done = required.filter(t => {
    const s = progressMap[t.id]?.status;
    return s === TASK_STATUS.DONE || s === TASK_STATUS.NA;
  });
  const pct = required.length === 0 ? 0 : (done.length / required.length) * 100;
  let state;
  if (pct < 40) state = READINESS_STATE.NOT_READY;
  else if (pct < 85) state = READINESS_STATE.GETTING_CLOSE;
  else state = READINESS_STATE.READY;
  return { done: done.length, total: required.length, pct, state };
}

// Snapshot of how many *required* tasks this catalog held on 2026-07-01, before
// an AI-completion pass started removing finished entries below. There is no
// live per-task progress store wired up (see AdminiOSReadiness.jsx), so instead
// of tracking "done" status separately, finished tasks are deleted from
// IOS_READINESS_CATEGORIES outright. That means the *current* required count
// already tells us how much work remains — comparing it against this frozen
// baseline is what turns "tasks removed" into a real percentage.
// If you add brand-new required tasks later, bump this number up by the same
// amount so completed-work percentage doesn't retroactively drop.
export const ORIGINAL_REQUIRED_TASK_COUNT = 38;

export function computeCatalogReadiness(tasks) {
  const remainingRequired = tasks.filter(t => t.required).length;
  const doneRequired = Math.max(0, ORIGINAL_REQUIRED_TASK_COUNT - remainingRequired);
  const pct = ORIGINAL_REQUIRED_TASK_COUNT === 0 ? 100 : (doneRequired / ORIGINAL_REQUIRED_TASK_COUNT) * 100;
  let state;
  if (pct < 40) state = READINESS_STATE.NOT_READY;
  else if (pct < 85) state = READINESS_STATE.GETTING_CLOSE;
  else state = READINESS_STATE.READY;
  return { done: doneRequired, total: ORIGINAL_REQUIRED_TASK_COUNT, remaining: remainingRequired, pct, state };
}

// ─── Task catalog ──────────────────────────────────────────────────────────────

export const IOS_READINESS_CATEGORIES = [

  // ── 1. iOS Build & Technical Setup ──────────────────────────────────────────
  {
    id: 'ios-build-setup',
    label: 'iOS Build & Technical Setup',
    description: 'Xcode, Capacitor, signing, and the core pipeline needed before anything else can ship.',
    tasks: [
      {
        id: 'setup-capacitor',
        title: 'Set up Capacitor for iOS packaging',
        description: 'JUnited is currently a web-only PWA. Capacitor wraps it into a native iOS app without rewriting the frontend.',
        whyItMatters: 'Without a native wrapper you cannot submit to the App Store. Capacitor is the lowest-friction path for a React/Vite app.',
        required: true,
        taskType: TASK_TYPE.MANUAL,
        manualSteps: [
          'Run: npm install @capacitor/core @capacitor/cli @capacitor/ios',
          'Run: npx cap init "JUnited" com.junited.app --web-dir dist',
          'Run: npx cap add ios — this creates the ios/ folder',
          'Build the web app: npm run build',
          'Run: npx cap copy ios — copies dist/ into the iOS project',
          'Open Xcode: npx cap open ios',
          'Set the Team in Signing & Capabilities to your Apple Developer account',
          'Set the Deployment Target to iOS 16.0 or later',
          'Verify the app runs in the iOS Simulator before continuing',
        ],
        completionCriteria: 'App launches in iOS Simulator without errors.',
      },
      {
        id: 'xcode-setup',
        title: 'Install Xcode 26 with iOS 26 SDK',
        description: 'Apple requires apps submitted after April 28, 2026 to be built with the iOS 26 SDK in Xcode 26.',
        whyItMatters: 'Submissions built against older SDKs are rejected automatically after the deadline.',
        required: true,
        taskType: TASK_TYPE.MANUAL,
        manualSteps: [
          'Open the Mac App Store and search for "Xcode"',
          'Install or update Xcode to version 26 or later',
          'After install, open Xcode → Settings → Locations → verify Command Line Tools points to Xcode 26',
          'Run: xcode-select -p and confirm the path shows Xcode 26',
          'Run: xcrun simctl list runtimes and confirm iOS 26 simulator appears',
        ],
        completionCriteria: 'xcode-select shows Xcode 26 path; iOS 26 simulator exists.',
      },
      {
        id: 'apple-developer-account',
        title: 'Enroll in Apple Developer Program ($99/year)',
        description: 'Required to distribute on the App Store, access TestFlight, and use distribution certificates.',
        whyItMatters: 'You cannot publish or beta-test on real devices without an active membership.',
        required: true,
        taskType: TASK_TYPE.MANUAL,
        manualSteps: [
          'Go to developer.apple.com',
          'Click "Account" → sign in with your Apple ID',
          'Click "Join the Apple Developer Program"',
          'Choose Individual or Organization (Organization requires a D-U-N-S number)',
          'Complete payment ($99 USD/year)',
          'Wait for enrollment confirmation email (can take up to 48 hours for Organization)',
        ],
        completionCriteria: 'developer.apple.com/account shows an active membership.',
      },
      {
        id: 'app-bundle-id',
        title: 'Register App ID / Bundle Identifier',
        description: 'The bundle ID (e.g. com.junited.app) is the permanent unique identifier for your app.',
        whyItMatters: 'Must be registered before creating provisioning profiles or an App Store Connect record.',
        required: true,
        taskType: TASK_TYPE.MANUAL,
        manualSteps: [
          'Go to developer.apple.com → Certificates, IDs & Profiles → Identifiers',
          'Click + to register a new App ID',
          'Select "App IDs" and continue',
          'Choose "App" as the type',
          'Description: JUnited',
          'Bundle ID: com.junited.app (Explicit, not Wildcard)',
          'Enable capabilities: Push Notifications, Sign In with Apple',
          'Click Register',
        ],
        completionCriteria: 'com.junited.app appears in Certificates, IDs & Profiles.',
      },
      {
        id: 'signing-certificates',
        title: 'Create Distribution & Development certificates',
        description: 'Code signing certificates prove the build came from you.',
        whyItMatters: 'Without a valid distribution certificate, Xcode cannot produce an IPA for TestFlight or App Store.',
        required: true,
        taskType: TASK_TYPE.MANUAL,
        manualSteps: [
          'In Xcode → Settings → Accounts → select your Apple ID → Manage Certificates',
          'Click + → Apple Development (for testing on device)',
          'Click + → Apple Distribution (for TestFlight and App Store)',
          'Alternatively use automatic signing: in Xcode project → Signing & Capabilities → check "Automatically manage signing"',
          'Select your Team from the dropdown',
          'Xcode will create and download certificates automatically',
        ],
        completionCriteria: 'Xcode shows "Signing Certificate: Apple Distribution" in the target settings.',
      },
      {
        id: 'app-icons',
        title: 'Generate app icons (all required sizes)',
        description: 'iOS requires a single 1024×1024 icon for App Store Connect plus icons for various device sizes. Concept brief + required sizes + LaunchScreen-adjacent brand color drafted at internal/app-store/ios-native-prep/launch-screen-and-icon-brief.md — the 1024×1024 artwork itself still needs a human designer/tool.',
        whyItMatters: 'Missing or wrong-size icons cause build validation failure.',
        required: true,
        taskType: TASK_TYPE.MIXED,
        copyPrompt: `You are helping prepare the JUnited iOS app icon set.

JUnited is a Jewish community platform. The current logo/brand uses [describe your current logo here].

Please:
1. Describe an app icon concept that would work well at small sizes (looks good at 60×60px)
2. List all icon sizes required for a modern iOS app (just the sizes, in px)
3. Recommend a free or low-cost tool for generating all sizes from a single 1024×1024 source image

Note: The actual icon design must be done in a design tool (Figma, Canva, Sketch, etc.) or by a designer.`,
        manualSteps: [
          'Design or commission a 1024×1024 pixel PNG icon (no alpha/transparency)',
          'Use a tool like appicon.co or MakeAppIcon to generate all required sizes',
          'In Xcode → Assets.xcassets → AppIcon → drag in all generated images',
          'Or use a single 1024×1024 in Assets.xcassets and check "Single Size" if using Xcode 14+',
          'Build the app in Xcode and verify no "missing icon" warnings',
        ],
        completionCriteria: 'Xcode build succeeds with no icon-related warnings.',
      },
      {
        id: 'launch-screen',
        title: 'Create launch screen / splash screen',
        description: 'The launch screen appears instantly while the app loads — it must match your app\'s look. Ready-to-paste LaunchScreen.storyboard XML (matches the app\'s #F6F8FB background) drafted at internal/app-store/ios-native-prep/launch-screen-and-icon-brief.md — blocked on the ios/ project existing (see setup-capacitor).',
        whyItMatters: 'Apple requires a launch screen; a blank or missing one looks unpolished and may trigger rejection.',
        required: true,
        taskType: TASK_TYPE.MIXED,
        copyPrompt: `You are helping configure the iOS launch screen for JUnited.

JUnited is a Jewish community platform built with Capacitor (React/Vite wrapped in a native shell).

Please write the LaunchScreen.storyboard XML configuration that shows:
- A white or off-white background (#F6F8FB)
- The app name "JUnited" centered in bold, dark text
- Optionally a simple star of David or community icon centered above the text

The storyboard should use UIKit's safe areas and work on all modern iPhone sizes including iPhone 16 Pro Max.`,
        manualSteps: [
          'In Xcode, open ios/App/App/LaunchScreen.storyboard',
          'Drag a UIImageView or UILabel onto the canvas',
          'Set background color to your brand color (#F6F8FB or white)',
          'Add centered logo image or app name label',
          'Set constraints to center horizontally and vertically',
          'Test in multiple simulator sizes',
        ],
        completionCriteria: 'Launch screen appears correctly on iPhone SE, iPhone 16, and iPhone 16 Pro Max simulators.',
      },
      {
        id: 'info-plist',
        title: 'Apply Info.plist keys to Capacitor iOS project',
        description: 'Usage description strings and required keys have been generated. They need to be merged into ios/App/App/Info.plist after Capacitor is initialized.',
        whyItMatters: 'Apps that access camera, location, contacts, etc. without a usage description string crash on launch or are rejected.',
        required: true,
        taskType: TASK_TYPE.MANUAL,
        manualSteps: [
          'Ensure `npx cap add ios` has been run (see setup-capacitor task)',
          'Open internal/ios-info-plist-additions.xml — this file contains all required keys',
          'Merge all <key> / <string> pairs into ios/App/App/Info.plist inside the root <dict>',
          'Keys to add: NSCameraUsageDescription, NSPhotoLibraryUsageDescription, NSPhotoLibraryAddUsageDescription, ITSAppUsesNonExemptEncryption (false), UIBackgroundModes (remote-notification)',
          'In Xcode, open Info.plist and confirm all keys appear without warnings',
          'Run `npx cap sync ios` and rebuild to verify no signing or plist errors',
        ],
        completionCriteria: 'All required NSUsageDescription keys present in ios/App/App/Info.plist; Xcode build succeeds with no plist warnings.',
      },
      {
        id: 'testflight-setup',
        title: 'Set up TestFlight for beta testing',
        description: 'TestFlight lets you distribute the app to testers before submitting to the App Store.',
        whyItMatters: 'Required for real-device testing and catching bugs before Apple Review. Strongly recommended before any App Store submission.',
        required: true,
        taskType: TASK_TYPE.MANUAL,
        manualSteps: [
          'In Xcode → Product → Archive to build a release IPA',
          'In the Archives organizer → Distribute App → App Store Connect',
          'Upload to App Store Connect (select "Upload" not "Export")',
          'Go to appstoreconnect.apple.com → your app → TestFlight tab',
          'Wait for "Processing" to complete (5–30 minutes)',
          'Under Internal Testing, add your Apple ID as an internal tester',
          'Install TestFlight on your iPhone, open the invitation email, and install the build',
          'Test all major flows on a real device before proceeding to App Store submission',
        ],
        completionCriteria: 'App installs and runs on a real iPhone via TestFlight.',
      },
    ],
  },

  // ── 2. Authentication ────────────────────────────────────────────────────────
  {
    id: 'authentication',
    label: 'Authentication',
    description: 'Apple requires Sign in with Apple whenever another third-party authentication method (like Google) is offered.',
    tasks: [
      {
        id: 'sign-in-with-apple',
        title: 'Wire up native Sign in with Apple on iOS (Guideline 4.8)',
        description: 'The "Continue with Apple" button exists in Login.jsx and calls supabase.auth.signInWithOAuth — this works for web. On the native iOS app, Apple requires the native modal (not a browser redirect), which needs the @capacitor/sign-in-with-apple plugin.',
        whyItMatters: 'REQUIRED. Apple rejects apps that offer a third-party login (Google) without also offering Sign in with Apple. The web OAuth redirect will not satisfy Apple reviewers testing on device.',
        required: true,
        taskType: TASK_TYPE.AI,
        copyPrompt: `You are wiring up native Sign in with Apple for JUnited on iOS (Capacitor + React + Supabase).

Current state:
- Login.jsx already has a "Continue with Apple" button that calls supabase.auth.signInWithOAuth({ provider: 'apple' })
- This works as a web OAuth redirect but on native iOS it opens a browser instead of the native Apple modal
- Supabase Apple provider is NOT yet configured in the dashboard
- The Xcode "Sign In with Apple" capability is NOT yet added

Goals:
1. Install @capacitor/sign-in-with-apple: npm install @capacitor/sign-in-with-apple
2. In Login.jsx, detect when running in a native Capacitor context (Capacitor.isNativePlatform())
   - Native: use SignInWithApple.authorize() → exchange the identityToken with Supabase via supabase.auth.signInWithIdToken({ provider: 'apple', token })
   - Web: keep the existing supabase.auth.signInWithOAuth({ provider: 'apple' }) call
3. Handle the Supabase session and profile bootstrap the same as Google (full_name from user_metadata)
4. The button already follows Apple HIG styling — do not change its appearance

Manual steps also required (not AI):
- Enable "Sign In with Apple" capability in Xcode → target → Signing & Capabilities → + → Sign In with Apple
- Enable Apple provider in Supabase Dashboard → Authentication → Providers → Apple
- Create a Services ID (com.junited.app.service) and Key at developer.apple.com, enter in Supabase

Please write only the Login.jsx changes for the native/web branch. Explain the Supabase and Xcode manual steps separately.`,
        completionCriteria: 'Native Apple Sign-In modal appears on iOS device/simulator. Session is created in Supabase. Google and Apple sign-in both work.',
      },
      {
        id: 'apple-provider-supabase',
        title: 'Configure Apple provider in Supabase Dashboard',
        description: 'Supabase needs an Apple Services ID and private key to handle Apple OAuth.',
        whyItMatters: 'Without backend configuration, the Apple Sign-In button will fail even if the frontend code is correct.',
        required: true,
        taskType: TASK_TYPE.MANUAL,
        manualSteps: [
          'Go to developer.apple.com → Certificates, IDs & Profiles → Keys → + to create a key',
          'Name it "JUnited Supabase Auth", enable "Sign In with Apple", click Configure',
          'Download the .p8 private key file (you can only download it once)',
          'Go to developer.apple.com → Identifiers → create a new Services ID (not App ID)',
          'Services ID: com.junited.app.service (or similar), Description: JUnited Web Auth',
          'Configure the Services ID: enable Sign In with Apple, set domains and Return URLs to your Supabase project URL',
          'In Supabase Dashboard → Authentication → Providers → Apple → enable it',
          'Enter: Client ID = your Services ID, Team ID (from developer.apple.com Account), Key ID, Private Key (.p8 file contents)',
          'Save and test',
        ],
        completionCriteria: 'Apple shows as enabled in Supabase Dashboard; test sign-in completes without error.',
      },
    ],
  },

  // ── 3. Content Safety & Moderation ──────────────────────────────────────────
  {
    id: 'content-safety',
    label: 'Content Safety & Moderation',
    description: 'Apple Guideline 1.2 requires UGC apps to have reporting, blocking, moderation, and a contact method for content issues. Reporting and blocking are fully implemented in the codebase.',
    tasks: [
      {
        id: 'moderation-contact-info',
        title: 'Add content moderation contact info to App Store listing',
        description: 'App Store Connect requires contact information specifically for content issues. ReportModal and user blocking are already implemented; this is the App Store Connect metadata step.',
        whyItMatters: 'REQUIRED. Apple reviewers check this. Reporting (Feed, PostDetail, Profile) and blocking (user_blocks table, Feed/Messages/Profile/PostDetail) are already working — just need the public-facing contact entry.',
        required: true,
        taskType: TASK_TYPE.MANUAL,
        manualSteps: [
          'Go to appstoreconnect.apple.com → your app → App Information',
          'Find the "Support URL" field — enter https://www.junited.us/support (see support-url task)',
          'In the privacy policy and app description, include an email address for reporting content (e.g. support@junited.us)',
          'Optionally create a dedicated page at junited.us/report that explains how to report content and includes a contact email',
        ],
        completionCriteria: 'Support URL is set in App Store Connect. Contact email for content issues is publicly listed.',
      },
    ],
  },

  // ── 5. Privacy & Data ────────────────────────────────────────────────────────
  {
    id: 'privacy-data',
    label: 'Privacy & Data',
    description: 'Privacy Manifests are required since May 2024. App Privacy labels must be accurate. COPPA and data handling must be documented.',
    tasks: [
      {
        id: 'privacy-manifest',
        title: 'Create PrivacyInfo.xcprivacy (required since May 2024)',
        description: 'Apple requires a privacy manifest file that declares all APIs the app uses that can access user data. Complete PrivacyInfo.xcprivacy drafted at internal/app-store/ios-native-prep/PrivacyInfo.xcprivacy, ready to drop into ios/App/App/ once the Capacitor project exists (see setup-capacitor).',
        whyItMatters: 'REQUIRED. Without this file, App Store submission is rejected. This is one of the most-missed requirements.',
        required: true,
        taskType: TASK_TYPE.AI,
        copyPrompt: `You are writing the PrivacyInfo.xcprivacy file for JUnited, an iOS app built with Capacitor + React.

JUnited uses the following APIs and capabilities:
- Push notifications (APNs)
- Camera access (profile photo upload)
- Photo library access (profile photo upload)
- Network requests to Supabase (uwbmfmtvjcnuuekiyogu.supabase.co)
- Network requests to Google OAuth
- localStorage / IndexedDB (via the web view — used for React Query cache and user session)
- User-Agent string access (for the app_feedback table)
- Screen dimensions / viewport (for the app_feedback table)

Third-party SDKs that may have their own required reasons:
- Capacitor core
- Any analytics or crash reporting (list if present)

Please write the complete PrivacyInfo.xcprivacy XML file for this app.
For each API category, include the correct NSPrivacyAccessedAPIType and NSPrivacyAccessedAPITypeReasons.
Reference Apple's required reasons API documentation.

Also explain where to place this file in an Xcode/Capacitor project.`,
        completionCriteria: 'PrivacyInfo.xcprivacy exists in the Xcode project. Build validation passes.',
      },
      {
        id: 'app-privacy-labels',
        title: 'Complete App Privacy labels in App Store Connect',
        description: 'The "App Privacy" section on your App Store listing must accurately reflect all data your app collects. Note: package.json includes @sentry/react (error tracking) and posthog-js (product analytics) — see internal/app-store/third-party-sdk-privacy.md for what that means for these labels (both collect linked, non-tracking analytics data; neither is used for third-party advertising).',
        whyItMatters: 'REQUIRED. False or missing privacy labels can lead to rejection and App Store removal.',
        required: true,
        taskType: TASK_TYPE.MANUAL,
        manualSteps: [
          'Go to appstoreconnect.apple.com → your app → App Privacy',
          'Click "Get Started" or "Edit"',
          'For each data type Apple lists, honestly answer whether JUnited collects it',
          'JUnited collects: Name, Email Address, Photos/Videos (profile upload), User ID, Coarse Location (optional), Messages (if DMs exist)',
          'For each collected type, specify: used for app functionality, linked to identity, and whether used for tracking',
          'JUnited does NOT sell data — confirm this',
          'Save and submit',
        ],
        completionCriteria: 'App Privacy section is complete in App Store Connect. No data types are missing.',
      },
      {
        id: 'third-party-sdk-privacy',
        title: 'Document required reasons for all third-party SDKs',
        description: 'Every third-party SDK in your app that accesses required-reason APIs must include a privacy manifest. Full audit done — internal/app-store/third-party-sdk-privacy.md: no action needed today (Sentry/PostHog are used via their web SDKs only, which run in the WebView and touch zero native APIs); re-audit if a native plugin is added later.',
        whyItMatters: 'If a dependency accesses user data without a declared reason, Apple rejects the build.',
        required: true,
        taskType: TASK_TYPE.AI,
        copyPrompt: `You are auditing the third-party SDK privacy requirements for JUnited (iOS app built with Capacitor + React).

The app's package.json dependencies include the typical React/Vite stack plus:
- @supabase/supabase-js
- @tanstack/react-query
- react-router-dom
- lucide-react
- date-fns
- sonner (toast notifications)
- @capacitor/core, @capacitor/ios, @capacitor/push-notifications
- Various Radix UI components

Please:
1. List which of these SDKs are known to access "required reason APIs" per Apple's policy
2. For any that do, explain what privacy manifest or NSPrivacyAccessedAPITypeReasons entry is needed
3. Explain how to check if a CocoaPod or npm package includes its own PrivacyInfo.xcprivacy
4. Flag any SDKs that are known to NOT include a privacy manifest (requiring a workaround)`,
        completionCriteria: 'All third-party SDKs either have their own privacy manifest or are covered by the app\'s manifest.',
      },
      {
        id: 'coppa-compliance',
        title: 'COPPA compliance review',
        description: 'If the app allows users under 13, COPPA (Children\'s Online Privacy Protection Act) applies. Analysis done — internal/app-store/coppa-and-export-compliance.md: TermsOfService.jsx and PrivacyPolicy.jsx already state a 13+ minimum age and cover COPPA; MinorSafetyPolicy.jsx exists for the 13-17 band. Remaining step is manual: submit the age-rating questionnaire (12+ or 15+ recommended) in App Store Connect.',
        whyItMatters: 'The age rating questionnaire will ask about this. Incorrect answers can cause rejection or legal liability.',
        required: true,
        taskType: TASK_TYPE.MIXED,
        copyPrompt: `You are helping assess COPPA compliance for JUnited, a Jewish community platform.

JUnited is a social platform for Jewish communities with features including posts, messaging, and community events.

Questions to address:
1. Is JUnited directed at children under 13? (likely no, but explain the criteria)
2. Does the app need to implement age gates?
3. What should the age rating be in App Store Connect (Apple's 5-tier system as of Jan 31, 2026)?
4. What, if any, content in JUnited could trigger a higher age rating (UGC, messaging, religious content)?

Please recommend:
- The appropriate App Store age rating tier
- Whether an age gate is needed
- Any changes to the onboarding or registration flow to document user age`,
        manualSteps: [
          'Decide: does JUnited allow users under 13? If yes, significant COPPA changes are needed',
          'Recommended: add a minimum age statement to Terms of Service ("You must be 13 or older")',
          'During App Store Connect setup, answer the age rating questionnaire honestly',
          'The 5-tier age rating system: 4+, 9+, 12+, 15+, 17+',
          'For a social app with UGC and messaging, expect 12+ or 15+',
        ],
        completionCriteria: 'Age rating determined. ToS updated with minimum age. App Store age rating matches content.',
      },
    ],
  },

  // ── 6. App Store Metadata ────────────────────────────────────────────────────
  {
    id: 'app-store-metadata',
    label: 'App Store Metadata',
    description: 'Everything visible on your App Store listing: name, description, keywords, and screenshots.',
    tasks: [
      {
        id: 'app-name-subtitle',
        title: 'Finalize app name and subtitle',
        description: 'App name is max 30 characters. Subtitle is max 30 characters and appears below the name on the store listing. Recommendations ready to paste — internal/app-store/app-store-listing.md.',
        whyItMatters: 'Name and subtitle are the first thing users see. They also affect App Store search ranking.',
        required: true,
        taskType: TASK_TYPE.AI,
        copyPrompt: `You are writing the App Store name and subtitle for JUnited.

JUnited is a platform for Jewish communities: share updates, organize Mitzvot (good deeds), find local events, discover communities, and connect with Jewish neighbors.

Current app name: "JUnited" (7 characters — room for more)

Please suggest:
1. Three options for a full App Store app name (max 30 chars) — could be "JUnited" or a longer version
2. Three subtitle options (max 30 chars) that highlight the key value proposition
3. Which combination you'd recommend and why

The audience is English-speaking Jewish communities, primarily in the US.`,
        completionCriteria: 'App name and subtitle entered in App Store Connect.',
      },
      {
        id: 'app-store-description',
        title: 'Write App Store description',
        description: 'The full description is 4000 characters max and appears on your App Store listing. The first 3 lines are visible without tapping "more". Full description + promotional text drafted and ready to paste — internal/app-store/app-store-listing.md.',
        whyItMatters: 'Good descriptions drive downloads. The first paragraph is critical — it\'s shown before the "more" fold.',
        required: true,
        taskType: TASK_TYPE.AI,
        copyPrompt: `You are writing the App Store description for JUnited.

JUnited is a platform for Jewish communities with features including:
- Community Feed: posts, reactions, comments within your community
- Mitzvah Circle: request and fulfill Mitzvot (good deeds / acts of kindness)
- Communities: join multiple Jewish communities (synagogues, schools, organizations)
- Events: see and RSVP to community events
- Map: discover nearby Jewish communities
- Direct Messages between members
- Chesed requests (community help requests)

Target audience: Jewish individuals and families in the US who want to stay connected with their local Jewish community.

Please write a complete App Store description (max 4000 characters):
- First paragraph: compelling hook that explains the core value (visible without tapping "more")
- Feature highlights section using bullet points or short paragraphs
- Call to action at the end
- Tone: warm, welcoming, community-focused — not corporate

Also write a shorter "promotional text" version (max 170 characters) for the top of the listing.`,
        completionCriteria: 'Description entered in App Store Connect. Under 4000 characters.',
      },
      {
        id: 'keywords',
        title: 'Research and select App Store keywords',
        description: 'Keywords field is 100 characters total, comma-separated. Do not repeat words from your app name. 99-char keyword string with reasoning drafted and ready to paste — internal/app-store/app-store-listing.md.',
        whyItMatters: 'Keywords determine which searches your app appears in. Good keyword research directly impacts organic downloads.',
        required: true,
        taskType: TASK_TYPE.AI,
        copyPrompt: `You are researching App Store keywords for JUnited.

JUnited is a Jewish community platform (iOS app) with features: community feed, Mitzvah/chesed tracking, community events, map of Jewish communities, messaging.

Rules for App Store keywords:
- Max 100 characters total (including commas)
- Do not repeat words that appear in the app name or subtitle
- Separate with commas (no spaces after commas)
- Use singular forms (Apple searches match plurals automatically)
- Don't use competitor names or trademarked terms

Please suggest the optimal 100-character keyword string for JUnited.
Also explain your reasoning for the top 5 keyword choices.`,
        completionCriteria: 'Keywords entered in App Store Connect. Under 100 characters.',
      },
      {
        id: 'screenshots-required',
        title: 'Create required screenshots (6.9" and 6.5" iPhone)',
        description: 'Apple requires screenshots for 6.9" display (iPhone 16 Pro Max) — minimum size 1290×2796. The 6.5" screenshots (iPhone 14 Plus) are also required.',
        whyItMatters: 'REQUIRED. Without screenshots for required device sizes, you cannot submit to the App Store.',
        required: true,
        taskType: TASK_TYPE.MANUAL,
        manualSteps: [
          'Take screenshots on a real device or in the iOS Simulator (6.9" = iPhone 16 Pro Max)',
          'In Xcode Simulator: Device → iPhone 16 Pro Max, then File → Take Screenshot',
          'Capture your best 5-10 screens: Feed, Mitzvah Circle, Communities, Events, Profile',
          'Optionally add marketing text overlay using Canva, Figma, or ScreenshotCreator',
          'Required sizes: 6.9" = 1320×2868 or 1290×2796, 6.5" = 1284×2778 or 1242×2688',
          'In App Store Connect → your app → Screenshots tab → upload for each device class',
          'Order screenshots to tell a story (most compelling first)',
        ],
        completionCriteria: 'At least 3 screenshots uploaded for 6.9" and 6.5" iPhone in App Store Connect.',
      },
      {
        id: 'screenshots-ipad',
        title: 'Create iPad screenshots (12.9" iPad Pro)',
        description: 'If the app supports iPad (even in scaled mode), App Store Connect may require iPad screenshots.',
        whyItMatters: 'Recommended. If you declare iPad support, screenshots are required.',
        required: false,
        taskType: TASK_TYPE.MANUAL,
        manualSteps: [
          'In Xcode Simulator: select iPad Pro (12.9-inch) simulator',
          'Test that the app is usable on iPad (even in 2x scaled iPhone mode)',
          'Take screenshots: File → Take Screenshot or Cmd+S',
          'Upload to App Store Connect under iPad screenshots section',
        ],
        completionCriteria: 'iPad screenshots uploaded or iPad support explicitly disabled.',
      },
      {
        id: 'support-url',
        title: 'Create a help/contact page and set support URL',
        description: '/SupportJUnited is a donations page, not a help page. App Store Connect needs a real support URL with a contact email and FAQ. This page does not exist yet.',
        whyItMatters: 'REQUIRED. Submissions without a support URL are rejected. The support URL must actually help users with problems, not redirect them to donations.',
        required: true,
        taskType: TASK_TYPE.AI,
        copyPrompt: `You are creating a public support/help page for JUnited at the route /support.

JUnited is a Jewish community platform (React/Vite). The existing /SupportJUnited route is a donations page — it is NOT suitable as a support URL.

Goals:
1. Create src/pages/Support.jsx — a simple static page with:
   - "Get Help" heading
   - Contact email: support@junited.us
   - Link to community guidelines: /guidelines
   - Two or three common FAQ items (how to join a community, how to report content, how to delete your account)
   - Link to privacy policy: /privacy
2. Add the route to App.jsx (no auth required — it must be publicly accessible)
3. The page should use the same design language as TermsOfService.jsx (prose-style, no LayoutWrapper needed)

Do NOT modify the existing /SupportJUnited donations page.

Update internal/iosReadiness.js: change this item to reflect completion after the page is live.`,
        completionCriteria: 'https://www.junited.us/support loads a public help page with a contact email. URL set in App Store Connect.',
      },
    ],
  },

  // ── 7. Legal & Compliance ────────────────────────────────────────────────────
  {
    id: 'legal-compliance',
    label: 'Legal & Compliance',
    description: 'Terms, privacy policy, age rating, EU DSA, and export compliance — all required before submission.',
    tasks: [
      {
        id: 'tos-privacy-urls',
        title: 'Set Terms of Service and Privacy Policy URLs in App Store Connect',
        description: 'Both pages already exist in the app (/terms → TermsOfService.jsx, /privacy → PrivacyPolicy.jsx). The remaining step is entering the public URLs in App Store Connect.',
        whyItMatters: 'REQUIRED. Apple will reject apps without a privacy policy URL. The pages exist — this is purely an App Store Connect data entry step.',
        required: true,
        taskType: TASK_TYPE.MANUAL,
        manualSteps: [
          'Verify Terms of Service loads at https://www.junited.us/terms',
          'Verify Privacy Policy loads at https://www.junited.us/privacy',
          'In App Store Connect → App Information → Privacy Policy URL: https://www.junited.us/privacy',
          'In App Store Connect → App Information → License Agreement: can link to /terms or use Apple\'s standard EULA',
        ],
        completionCriteria: 'Privacy Policy URL set in App Store Connect. Both pages load correctly at their public URLs.',
      },
      {
        id: 'age-rating',
        title: 'Complete 5-tier age rating questionnaire (new as of Jan 31, 2026)',
        description: 'Apple moved to a 5-tier age rating system on January 31, 2026. You must complete a detailed questionnaire.',
        whyItMatters: 'REQUIRED. Age rating determines which users can download the app. Wrong rating can cause rejection.',
        required: true,
        taskType: TASK_TYPE.MANUAL,
        manualSteps: [
          'Go to App Store Connect → your app → App Review Information → Age Rating',
          'Answer all questions honestly about content: violence, sexual content, profanity, substance use, gambling, etc.',
          'For JUnited (social UGC platform): expect 12+ or 15+ due to user-generated content',
          'If UGC is unrestricted, select the "Unrestricted Web Access" option which may set the rating to 17+',
          'Consider whether to restrict UGC visibility to authenticated users only (which allows a lower rating)',
          'Submit the questionnaire — rating is assigned automatically based on your answers',
        ],
        completionCriteria: 'Age rating questionnaire submitted. Rating assigned in App Store Connect.',
      },
      {
        id: 'eu-dsa-trader-status',
        title: 'EU DSA Trader / Non-Trader status declaration (required since Feb 17, 2025)',
        description: 'The EU Digital Services Act requires App Store sellers to declare their trader status.',
        whyItMatters: 'REQUIRED for all App Store submissions since February 17, 2025. Missing this blocks approval.',
        required: true,
        taskType: TASK_TYPE.MANUAL,
        manualSteps: [
          'Go to appstoreconnect.apple.com → Agreements, Tax, and Banking',
          'Look for "EU Digital Services Act" or "Trader Status" section',
          'If JUnited is a nonprofit or individual (not a commercial seller): select "Non-Trader"',
          'If it is a business selling goods/services: select "Trader" and provide business details',
          'For most community apps with no commercial transactions: Non-Trader is correct',
          'Save and confirm',
        ],
        completionCriteria: 'EU DSA trader status is set in App Store Connect.',
      },
      {
        id: 'export-compliance',
        title: 'Export compliance / encryption declaration',
        description: 'ITSAppUsesNonExemptEncryption = false is already in internal/ios-info-plist-additions.xml (and analyzed further in internal/app-store/coppa-and-export-compliance.md) — it just needs to be merged into the Xcode project once it exists. This skips the annual questionnaire automatically.',
        whyItMatters: 'REQUIRED. Using HTTPS counts as encryption under US export law. The Info.plist key is already generated; apply it when Capacitor is set up.',
        required: true,
        taskType: TASK_TYPE.MANUAL,
        manualSteps: [
          'Confirm ITSAppUsesNonExemptEncryption = false is present in ios/App/App/Info.plist (it is in the ios-info-plist-additions.xml deliverable)',
          'This key tells Apple the app uses only standard HTTPS/TLS (OS-provided, exempt from export controls)',
          'No ERN (Encryption Registration Number) is needed for standard HTTPS-only apps',
          'No annual questionnaire in App Store Connect is required once the key is in Info.plist',
        ],
        completionCriteria: 'ITSAppUsesNonExemptEncryption = false is in ios/App/App/Info.plist and Xcode build succeeds.',
      },
    ],
  },

  // ── 8. iOS UI & Accessibility ────────────────────────────────────────────────
  {
    id: 'ios-ui-accessibility',
    label: 'iOS UI & Accessibility',
    description: 'The app must handle iOS-specific UI requirements: safe areas, status bar, and basic accessibility.',
    tasks: [
      {
        id: 'status-bar-config',
        title: 'Configure iOS status bar style',
        description: 'The status bar (clock, battery, signal) needs the right style to be readable over the app\'s header.',
        whyItMatters: 'White text on white background (or black on black) makes the status bar unreadable.',
        required: true,
        taskType: TASK_TYPE.MIXED,
        copyPrompt: `You are configuring the iOS status bar for JUnited using Capacitor.

JUnited's header background is white (#FFFFFF) or very light (bg-white/95 backdrop-blur).

Please write:
1. The Capacitor StatusBar plugin configuration (install command + capacitor.config.ts changes)
2. The code to set StatusBar style to "Dark" (dark text on light background) for the app header
3. How to dynamically change the status bar style if the app has dark-mode pages
4. Whether Info.plist needs UIStatusBarStyle set

Reference: @capacitor/status-bar plugin`,
        manualSteps: [
          'Run: npm install @capacitor/status-bar',
          'In App.tsx or index.ts, import and configure StatusBar',
          'Run: npx cap sync ios',
          'Test on device — status bar text should be clearly readable',
        ],
        completionCriteria: 'Status bar is readable (correct text color) on all pages.',
      },
      {
        id: 'voiceover-basics',
        title: 'Basic VoiceOver accessibility audit',
        description: 'VoiceOver is the iOS screen reader. Apps with major accessibility gaps may be rejected or given lower ratings. Partial progress: the 5 main bottom-nav buttons in Layout.jsx were missing aria-label and have been fixed (2026-07-01). A full app-wide pass (forms, remaining icon-only buttons across less-trafficked pages) has not been done — do not mark this shipped until that broader pass happens.',
        whyItMatters: 'Recommended. Apple values accessibility. Severe issues (e.g. all images without alt text) can cause rejection.',
        required: false,
        taskType: TASK_TYPE.MIXED,
        copyPrompt: `You are performing a VoiceOver accessibility audit of JUnited.

JUnited uses React with Tailwind CSS. Key accessibility concerns for Capacitor WebView apps:

Please audit these specific areas of the codebase:
1. Do all <img> tags have meaningful alt text or aria-label?
2. Do all icon-only buttons have aria-label attributes?
3. Do form inputs have associated <label> elements or aria-label?
4. Is the reading order (DOM order) logical for VoiceOver navigation?
5. Are loading states announced to screen readers?

For each issue found, provide the specific fix.
Reference files to check: src/pages/Feed.jsx, src/Layout.jsx, src/components/common/`,
        manualSteps: [
          'On iPhone: Settings → Accessibility → VoiceOver → turn on',
          'Navigate through the app using only VoiceOver (swipe right to move forward)',
          'Every UI element should be announced with a useful description',
          'Buttons without labels will be announced as "button" with no context — fix these',
          'Turn VoiceOver off: triple-click the side button',
        ],
        completionCriteria: 'All interactive elements have accessible labels. No completely inaccessible screens.',
      },
    ],
  },

  // ── 9. Performance & Testing ─────────────────────────────────────────────────
  {
    id: 'performance-testing',
    label: 'Performance & Testing',
    description: 'Apps must be stable, performant, and tested on real devices before App Store submission.',
    tasks: [
      {
        id: 'push-notifications',
        title: 'Implement push notifications for community updates',
        description: 'Push notifications require APNs setup in Xcode, the @capacitor/push-notifications plugin, and a server-side sender.',
        whyItMatters: 'REQUIRED if the app promises notifications. Broken notification permission prompts cause rejection.',
        required: true,
        taskType: TASK_TYPE.AI,
        copyPrompt: `You are implementing push notifications for JUnited on iOS using Capacitor.

JUnited uses Supabase for the backend. We want to send push notifications for:
- New posts in communities the user is a member of
- Replies to user's comments
- New Mitzvah requests in the user's community
- Daily Mitzvah reminder (if enabled in notification settings)

The user's notification preferences are stored in profiles.notification_settings (jsonb).

Please:
1. Write the Capacitor push notification setup (npm install @capacitor/push-notifications, Info.plist keys, capacitor.config changes)
2. Show how to request notification permission on first launch (after onboarding)
3. Show how to store the APNs device token in Supabase (suggest a device_tokens table schema)
4. Explain how to send push notifications from a Supabase Edge Function using the Apple APNs API or a service like OneSignal
5. Show how to handle foreground vs background notifications

Start with the simplest viable approach (e.g. OneSignal free tier) rather than building from scratch.`,
        completionCriteria: 'Push notifications work on TestFlight. Device token is stored. At least one notification type sends successfully.',
      },
      {
        id: 'crash-free-testing',
        title: 'Achieve crash-free TestFlight run',
        description: 'Test the app on real devices via TestFlight and resolve all crashes before App Store submission.',
        whyItMatters: 'REQUIRED. Apple rejects apps with obvious crashes. A stable TestFlight run is the best predictor of approval.',
        required: true,
        taskType: TASK_TYPE.MANUAL,
        manualSteps: [
          'Archive and upload to TestFlight (see TestFlight setup task)',
          'Install on at least 2 real iPhones (different iOS versions if possible)',
          'Go through every screen and feature: Login, Feed, Mitzvah, Communities, Events, Map, Settings',
          'Try edge cases: no internet connection, empty states, very long names, special characters',
          'Check Xcode Organizer → Crashes for any crash reports',
          'Fix all crashes before submitting to App Review',
          'Run on iPhone SE (smallest screen) to catch layout issues',
        ],
        completionCriteria: 'App runs for 30+ minutes on real device with zero crashes.',
      },
      {
        id: 'memory-performance',
        title: 'Memory and performance profiling',
        description: 'Heavy JavaScript in a WebView can cause jank and memory warnings on older iPhones.',
        whyItMatters: 'Recommended. Performance issues cause 1-star reviews. Apple may reject apps that crash due to memory pressure.',
        required: false,
        taskType: TASK_TYPE.MANUAL,
        manualSteps: [
          'In Xcode: Product → Profile → choose "Leaks" or "Allocations" instrument',
          'Run the app and navigate through all main tabs for 5 minutes',
          'Check for memory growth that doesn\'t decrease (memory leak)',
          'Acceptable: < 200MB memory footprint during normal use',
          'Check for GPU usage spikes during animations',
          'Test on iPhone 12 (older device) to catch performance issues',
        ],
        completionCriteria: 'Memory stays below 200MB during normal use. No visible frame drops or jank.',
      },
    ],
  },

  // ── 10. App Review Preparation ───────────────────────────────────────────────
  {
    id: 'app-review-prep',
    label: 'App Review Preparation',
    description: 'The final steps before submitting to Apple\'s human review team.',
    tasks: [
      {
        id: 'demo-account',
        title: 'Create a demo account for App Review team',
        description: 'Apple reviewers need a test account with realistic content to evaluate the app.',
        whyItMatters: 'REQUIRED. Apps that require login and don\'t provide demo credentials are rejected immediately.',
        required: true,
        taskType: TASK_TYPE.MANUAL,
        manualSteps: [
          'Create an account in the production app with: email appreviewer@junited.us, password (store securely)',
          'Join 2-3 communities and become a member',
          'Create several posts in the Feed (at least 5 realistic posts)',
          'Create or join a Mitzvah request',
          'RSVP to at least one event',
          'Complete the profile with a name, bio, and profile photo',
          'In App Store Connect → App Review Information → enter the demo account credentials',
          'Add a note: "This is a pre-populated demo account. All features are available without needing to join a community first."',
        ],
        completionCriteria: 'Demo account created with realistic content. Credentials entered in App Store Connect.',
      },
      {
        id: 'review-notes',
        title: 'Write App Review notes',
        description: 'Review notes tell Apple reviewers what the app does and how to test it. Max 4000 characters. Full draft ready to paste — internal/app-store/review-notes.md (fill in the demo account password once that task is done).',
        whyItMatters: 'REQUIRED. Missing notes lead to "we couldn\'t evaluate your app" rejections. Good notes speed up review.',
        required: true,
        taskType: TASK_TYPE.AI,
        copyPrompt: `You are writing App Store Connect App Review notes for JUnited.

JUnited is a Jewish community platform with these features:
- Community Feed: posts and reactions within communities
- Mitzvah Circle: request and fulfill good deeds
- Communities: join and browse Jewish communities
- Events: RSVP to community events
- Map: discover nearby Jewish communities
- Direct Messages (if available)
- User Settings with account deletion option

The demo account is: appreviewer@junited.us / [PASSWORD]
This account is pre-joined to the "Demo Community" with existing posts and events.

Please write complete App Review notes that:
1. Briefly describe what JUnited is (1-2 sentences)
2. List the main flows for reviewers to test
3. Explain the community-based structure (you must join a community to see content)
4. Note that Sign in with Apple and Google Sign-In are both available on the login screen
5. Note where to find the account deletion option (Settings → Account → Delete Account)
6. Note that content moderation/reporting is available via the ⋯ menu on any post

Keep it under 4000 characters. Use numbered steps for the testing flow.`,
        completionCriteria: 'Review notes written and entered in App Store Connect.',
      },
      {
        id: 'app-store-connect-record',
        title: 'Create App Store Connect app record',
        description: 'The app must be registered in App Store Connect before uploading a build.',
        whyItMatters: 'REQUIRED. Nothing can be submitted without an app record.',
        required: true,
        taskType: TASK_TYPE.MANUAL,
        manualSteps: [
          'Go to appstoreconnect.apple.com → My Apps → + → New App',
          'Platform: iOS',
          'Name: JUnited (or your chosen App Store name)',
          'Primary Language: English (U.S.)',
          'Bundle ID: select com.junited.app from the dropdown (must match your registered App ID)',
          'SKU: junited-ios-001 (internal identifier, not shown to users)',
          'User Access: Full Access',
          'Click Create',
        ],
        completionCriteria: 'App record exists in App Store Connect with the correct bundle ID.',
      },
      {
        id: 'final-guidelines-review',
        title: 'Self-review against Apple Review Guidelines',
        description: 'Walk through the App Review Guidelines yourself before submitting. Catch issues before Apple does.',
        whyItMatters: 'REQUIRED. Helps avoid unnecessary rejection cycles (each cycle takes ~24-48 hours).',
        required: true,
        taskType: TASK_TYPE.MANUAL,
        manualSteps: [
          'Read developer.apple.com/app-store/review/guidelines/ — focus on sections 1 (Safety), 2 (Performance), 4 (Design), 5 (Legal)',
          'Guideline 1.2 (UGC): verify reporting, blocking, and moderation are in place',
          'Guideline 2.1 (App Completeness): verify no placeholder content, broken links, or "coming soon" sections',
          'Guideline 4.2 (Minimum Functionality): verify the app is not just a web wrapper with no native value',
          'Guideline 4.8 (Sign in with Apple): verify Sign in with Apple button is present and working',
          'Guideline 5.1.1(v) (Account Deletion): verify in-app account deletion works',
          'Make a checklist of anything that looks risky and fix it before submitting',
        ],
        completionCriteria: 'Self-review complete. All obvious guideline violations resolved.',
      },
    ],
  },
];

export const ALL_TASKS = IOS_READINESS_CATEGORIES.flatMap(cat => cat.tasks);
