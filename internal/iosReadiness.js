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
        description: 'iOS requires a single 1024×1024 icon for App Store Connect plus icons for various device sizes.',
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
        description: 'The launch screen appears instantly while the app loads — it must match your app\'s look.',
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
        title: 'Configure required Info.plist keys',
        description: 'Info.plist must include usage description strings for any device capabilities the app accesses.',
        whyItMatters: 'Apps that access camera, location, contacts, etc. without a usage description string crash on launch or are rejected.',
        required: true,
        taskType: TASK_TYPE.AI,
        copyPrompt: `You are writing Info.plist usage description strings for the JUnited iOS app.

JUnited is a Jewish community platform. The app:
- Requests push notification permission (for community updates and Mitzvah reminders)
- May access the camera for profile photo uploads
- May access the photo library for profile photo uploads
- Does NOT use location, contacts, microphone, Bluetooth, or other sensitive APIs

Please write the required Info.plist XML keys and values for each capability JUnited needs.
Include the NSPhotoLibraryUsageDescription, NSCameraUsageDescription, and any others needed.
The descriptions should be user-friendly and explain the concrete benefit to the user.

Also list any Info.plist keys required specifically for Capacitor iOS apps.`,
        completionCriteria: 'All required NSUsageDescription keys present; app passes App Store validation.',
        deliverableNote: 'Keys generated and saved to internal/ios-info-plist-additions.xml. Merge into ios/App/App/Info.plist after running `npx cap add ios`. Covers: NSCameraUsageDescription, NSPhotoLibraryUsageDescription, NSPhotoLibraryAddUsageDescription, ITSAppUsesNonExemptEncryption, UIBackgroundModes (remote-notification).',
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
        title: 'Implement Sign in with Apple (Guideline 4.8)',
        description: 'Because JUnited offers Google Sign-In, Apple Guideline 4.8 requires Sign in with Apple as an option.',
        whyItMatters: 'REQUIRED. Without this, your app will be rejected. Apple will not grant exceptions for social apps.',
        required: true,
        taskType: TASK_TYPE.AI,
        copyPrompt: `You are implementing Sign in with Apple for JUnited, a React/Vite app using Supabase Auth and wrapped with Capacitor for iOS.

Current state:
- Google Sign-In is implemented in src/pages/Login.jsx using supabase.auth.signInWithOAuth({ provider: 'google' })
- Auth state is in src/lib/AuthContext.jsx
- After login, users land on OnboardingFlow if onboarding_complete is false
- getAuthRedirectUrl() in src/api/supabaseClient.js returns the correct redirect URL

Goals:
1. Add a "Sign in with Apple" button to src/pages/Login.jsx (below the Google button)
2. Call supabase.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: getAuthRedirectUrl() } })
3. On native iOS (via Capacitor), use the native Apple Sign-In flow via @capacitor-community/apple-sign-in
4. Handle the Supabase callback and profile bootstrap the same as Google (full_name from user_metadata)
5. Show the Apple logo (use the lucide-react Apple icon or an SVG)
6. The button must follow Apple's Human Interface Guidelines for Sign in with Apple styling

Note: You also need to:
- Enable "Sign In with Apple" capability in Xcode (Signing & Capabilities tab)
- Enable Apple provider in Supabase Dashboard → Authentication → Providers → Apple
- Configure Apple Services ID and private key in Supabase

Please write the complete updated Login.jsx and explain the Supabase configuration steps.`,
        completionCriteria: 'Sign in with Apple button works on web and native iOS, creating a valid Supabase session.',
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

  // ── 3. In-App Account Management ────────────────────────────────────────────
  {
    id: 'account-management',
    label: 'In-App Account Management',
    description: 'Apple Guideline 5.1.1(v) requires apps with accounts to allow users to delete their account from within the app.',
    tasks: [
      {
        id: 'in-app-account-deletion',
        title: 'In-app account deletion (Guideline 5.1.1(v))',
        description: 'Users must be able to permanently delete their account directly within the app — not just via email request.',
        whyItMatters: 'REQUIRED. This is one of the most common rejection reasons. The current email-based flow is not sufficient for App Store compliance.',
        required: true,
        taskType: TASK_TYPE.AI,
        copyPrompt: `You are implementing in-app account deletion for JUnited, a Jewish community platform using React + Supabase.

Current state:
- Settings page is at src/pages/UserSettings.jsx
- Auth context is at src/lib/AuthContext.jsx (useAuth() hook, user object, supabase client)
- User profile is in public.profiles table (id references auth.users)
- Users have created posts, comments, community memberships, and possibly community events

Goals:
1. Add a "Delete My Account" section to UserSettings.jsx (bottom of page, in a danger zone)
2. Show a confirmation dialog (two-step: first button opens modal, modal requires typing "DELETE" to confirm)
3. On confirmation, call a Supabase Edge Function (or RPC) that:
   a. Soft-deletes or anonymizes all user content (posts, comments) — do not hard-delete content that others have responded to
   b. Removes the user from all community_memberships
   c. Deletes profile data (name, avatar, bio)
   d. Calls supabase.auth.admin.deleteUser(userId) to delete the auth record
4. After deletion, call supabase.auth.signOut() and redirect to /login
5. The entire flow must complete within the app — no emails, no support tickets

Please also write the SQL RPC or Edge Function that handles the server-side deletion logic.
Include proper error handling for each step.`,
        completionCriteria: 'User can delete their account from within the app in under 3 taps. Auth session is invalidated. Data is anonymized.',
      },
      {
        id: 'data-deletion-backend',
        title: 'Supabase Edge Function / RPC for account deletion',
        description: 'The backend logic to safely anonymize user data when an account is deleted.',
        whyItMatters: 'Client-side deletion can be interrupted or bypassed. Server-side ensures data is actually cleaned up.',
        required: true,
        taskType: TASK_TYPE.AI,
        copyPrompt: `You are writing the server-side account deletion handler for JUnited.

Database schema (relevant tables):
- public.profiles (id uuid PK → auth.users)
- public.posts (user_id uuid → auth.users, body text, ...)
- public.post_comments (user_id uuid → auth.users)
- public.community_memberships (user_id, community_id, role, status)
- public.community_events (created_by uuid → auth.users)
- public.community_event_rsvps (user_id uuid → auth.users)
- public.reactions (user_id uuid → auth.users)
- public.app_feedback (user_id uuid → auth.users, submitter_name text)
- public.mitzvah_requests (user_id uuid → auth.users)

Please write a Supabase PostgreSQL RPC function called delete_my_account() that:
1. Verifies auth.uid() matches the account being deleted (security check)
2. Anonymizes posts: set body to '[deleted]', set user_id to NULL
3. Anonymizes comments: same pattern
4. Deletes community_memberships for this user
5. Deletes event RSVPs for this user
6. Deletes reactions for this user
7. Anonymizes app_feedback: set user_id to NULL, set submitter_name to 'Anonymous'
8. Deletes the profile row
9. Does NOT delete the auth.users row (auth deletion happens separately via admin API)

Also write the migration SQL to create this function.
The function must use SECURITY DEFINER so it can delete across tables.`,
        completionCriteria: 'RPC exists in Supabase; calling it anonymizes all user data correctly.',
      },
    ],
  },

  // ── 4. Content Safety & Moderation ──────────────────────────────────────────
  {
    id: 'content-safety',
    label: 'Content Safety & Moderation',
    description: 'Apple Guideline 1.2 requires UGC apps to have reporting, blocking, moderation, and a contact method for content issues.',
    tasks: [
      {
        id: 'verify-report-flow',
        title: 'Verify content reporting flow is complete',
        description: 'JUnited has a ReportModal — verify it covers posts, comments, and profiles and actually sends data to a moderation queue.',
        whyItMatters: 'REQUIRED. Apple tests this. A broken or incomplete reporting flow is a rejection reason.',
        required: true,
        taskType: TASK_TYPE.MIXED,
        copyPrompt: `You are auditing and completing the content reporting system for JUnited.

Current state: A ReportModal component exists. Please:
1. Search the codebase for ReportModal and identify which content types can be reported (posts, comments, profiles, communities)
2. Verify the report goes into a DB table that admins can review
3. Identify any content types that are missing a report button
4. List what needs to be added or fixed to make the reporting system complete for Apple App Store review

The report flow needs to let users:
- Report offensive, illegal, or harassing content
- Report specific users
- Get a confirmation that the report was received`,
        manualSteps: [
          'Open the app and find a post — verify there is a "Report" option in the menu',
          'Submit a test report and check in the Supabase dashboard that it appears in the reports table',
          'Open a user profile — verify there is a "Report" or "Block" option',
          'Go to AdminModerationQueue (admin only) and verify the report appears there',
          'Document which content types are covered and which are missing',
        ],
        completionCriteria: 'Posts, comments, and user profiles can all be reported. Reports appear in admin queue.',
      },
      {
        id: 'verify-block-flow',
        title: 'Verify user blocking flow is complete',
        description: 'Users must be able to block other users, which should hide the blocked user\'s content.',
        whyItMatters: 'REQUIRED per Apple Guideline 1.2. Blocking must actually prevent the blocked user\'s content from appearing.',
        required: true,
        taskType: TASK_TYPE.MIXED,
        copyPrompt: `You are auditing the user blocking system for JUnited.

Please:
1. Search the codebase for any block-related code (block_user, blocked_users, BlockButton, etc.)
2. Check if there is a blocked_users table in Supabase migrations
3. Verify that blocking a user prevents their posts from appearing in the Feed and Community feeds
4. Verify that blocked users cannot send messages to the user who blocked them (if messaging exists)
5. Verify that the block can be undone (un-block)

Report what exists and what is missing. If blocking is incomplete, outline the minimal changes needed.`,
        manualSteps: [
          'Open another user\'s profile in the app',
          'Look for a "Block" option (usually in a ⋯ menu)',
          'Block the user and verify their posts disappear from the feed',
          'Go to Settings or Profile → verify there is a "Blocked Users" list',
          'Un-block the user and verify their posts reappear',
        ],
        completionCriteria: 'Block/unblock works. Blocked users\' content is hidden. Blocked users list is accessible.',
      },
      {
        id: 'moderation-contact-info',
        title: 'Add content moderation contact info to App Store listing',
        description: 'App Store Connect requires you to provide contact information specifically for content issues.',
        whyItMatters: 'REQUIRED. Apple reviewers check this. Use the same email as your support contact or a dedicated abuse@junited.us.',
        required: true,
        taskType: TASK_TYPE.MANUAL,
        manualSteps: [
          'Go to appstoreconnect.apple.com → your app → App Information',
          'Find the "Support URL" field — enter https://www.junited.us/guidelines or a contact page',
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
        description: 'Apple requires a privacy manifest file that declares all APIs the app uses that can access user data.',
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
        description: 'The "App Privacy" section on your App Store listing must accurately reflect all data your app collects.',
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
        description: 'Every third-party SDK in your app that accesses required-reason APIs must include a privacy manifest.',
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
        description: 'If the app allows users under 13, COPPA (Children\'s Online Privacy Protection Act) applies.',
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
        description: 'App name is max 30 characters. Subtitle is max 30 characters and appears below the name on the store listing.',
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
        description: 'The full description is 4000 characters max and appears on your App Store listing. The first 3 lines are visible without tapping "more".',
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
        description: 'Keywords field is 100 characters total, comma-separated. Do not repeat words from your app name.',
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
        title: 'Set up support URL and marketing URL',
        description: 'App Store Connect requires a support URL. Users who have problems with the app are directed here.',
        whyItMatters: 'REQUIRED. Submissions without a support URL are rejected.',
        required: true,
        taskType: TASK_TYPE.MANUAL,
        manualSteps: [
          'Create a support page at junited.us/support or use an existing contact page',
          'The page should have: contact email, FAQ, link to community guidelines',
          'In App Store Connect → App Information → Support URL: enter the URL',
          'Marketing URL (optional): enter https://www.junited.us',
        ],
        completionCriteria: 'Support URL is live and set in App Store Connect.',
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
        description: 'Both URLs must be live public web pages, not PDFs.',
        whyItMatters: 'REQUIRED. Apple will reject apps without a privacy policy URL.',
        required: true,
        taskType: TASK_TYPE.MANUAL,
        manualSteps: [
          'Verify Terms of Service is live at https://www.junited.us/terms',
          'Verify Privacy Policy is live at https://www.junited.us/privacy',
          'In App Store Connect → App Information → Privacy Policy URL: https://www.junited.us/privacy',
          'In App Store Connect → App Information → License Agreement: can link to terms or use Apple\'s standard',
        ],
        completionCriteria: 'Privacy Policy URL set in App Store Connect. Both pages load correctly.',
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
        description: 'Apps that use encryption (HTTPS, TLS) must complete an export compliance questionnaire.',
        whyItMatters: 'REQUIRED. Using HTTPS counts as encryption under US export law. Must answer the questionnaire correctly.',
        required: true,
        taskType: TASK_TYPE.MIXED,
        copyPrompt: `You are helping complete the encryption export compliance declaration for JUnited (iOS app).

JUnited uses:
- HTTPS/TLS for all API calls (Supabase, Google OAuth, Resend)
- WebCrypto API (via browser) for session tokens
- No custom or proprietary encryption algorithms
- No VPN or end-to-end encryption of messages

For Apple's export compliance questionnaire, should JUnited select:
(A) "Yes, this app uses encryption" — and qualify for the standard exemption
(B) "No, this app does not use encryption"

Please explain:
1. The correct answer for JUnited
2. What ECCN exemption applies (likely EAR99 or 5D992.c)
3. Whether JUnited needs an encryption registration number (ERN)
4. What to add to Info.plist to automate the response for future builds`,
        manualSteps: [
          'During App Store Connect submission, you\'ll be asked about encryption',
          'Answer: "Yes, my app uses encryption" (HTTPS counts)',
          'Select: "My app qualifies for the standard encryption exemptions"',
          'This exemption applies because JUnited uses only standard HTTPS/TLS (not custom encryption)',
          'Add to Info.plist: ITSAppUsesNonExemptEncryption = NO (to skip the questionnaire automatically)',
        ],
        completionCriteria: 'ITSAppUsesNonExemptEncryption = NO in Info.plist, or questionnaire completed in App Store Connect.',
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
        id: 'safe-area-handling',
        title: 'Verify safe area insets (notch, Dynamic Island, home indicator)',
        description: 'Content must not be hidden behind the notch, Dynamic Island, or home indicator bar.',
        whyItMatters: 'REQUIRED. Apps that render content under system chrome are rejected or given poor reviews.',
        required: true,
        taskType: TASK_TYPE.MIXED,
        copyPrompt: `You are auditing safe area handling for JUnited on iOS.

JUnited is a React/Vite PWA wrapped with Capacitor. The UI uses a fixed bottom navigation bar.

Current patterns in Layout.jsx:
- Bottom nav uses: class="fixed inset-x-0 bottom-0 z-50"
- Content uses: class="min-h-screen"

Please:
1. Explain what CSS env(safe-area-inset-bottom) is and why it matters for iPhone with home indicator
2. Show the Capacitor configuration needed to handle safe areas correctly
3. Write the Tailwind CSS / inline style changes needed so the bottom nav clears the home indicator
4. Check if the app header clears the status bar (top safe area)
5. Recommend whether to use viewport-fit=cover in the Capacitor config

The fix should work on iPhone SE (no notch), iPhone 12-14 (notch), and iPhone 15-16 (Dynamic Island).`,
        manualSteps: [
          'Test the app on iPhone 16 Pro Max simulator (Dynamic Island)',
          'Check: is the top header hidden behind the Dynamic Island or status bar?',
          'Check: is the bottom nav bar hidden behind the home indicator?',
          'If yes, add env(safe-area-inset-bottom) padding to the nav bar',
          'In capacitor.config.ts, set: iosScheme: "https", overrideUserAgent: optional',
          'Add to index.html: <meta name="viewport" content="viewport-fit=cover">',
        ],
        completionCriteria: 'App content is fully visible and not hidden by system chrome on all modern iPhone sizes.',
      },
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
        id: 'pull-to-refresh',
        title: 'Implement native pull-to-refresh (recommended)',
        description: 'iOS users expect pull-to-refresh on scrollable content like the Feed.',
        whyItMatters: 'Recommended. Not implementing it is not a rejection reason, but significantly degrades the native feel.',
        required: false,
        taskType: TASK_TYPE.AI,
        copyPrompt: `You are implementing pull-to-refresh for the JUnited Feed page on iOS.

JUnited uses React + Capacitor. The Feed is a scrollable list of posts loaded via TanStack Query.

The Feed page is at src/pages/Feed.jsx. It uses:
- useQuery with queryKey ['posts', ...filters]
- refetch() to reload data

Please:
1. Install and configure @capacitor/haptics for haptic feedback on refresh
2. Add pull-to-refresh to the Feed using either:
   a. @capacitor/push-notifications (wrong — don't use this)
   b. A CSS-based pull-to-refresh implementation that works in WKWebView
   c. The PullToRefresh component pattern for Capacitor WebView apps
3. Show how to call refetch() when the user pulls down far enough
4. Ensure it doesn't conflict with the existing scroll behavior in Layout.jsx`,
        completionCriteria: 'Pull-to-refresh works on the Feed. Haptic feedback on trigger.',
      },
      {
        id: 'voiceover-basics',
        title: 'Basic VoiceOver accessibility audit',
        description: 'VoiceOver is the iOS screen reader. Apps with major accessibility gaps may be rejected or given lower ratings.',
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
        id: 'network-offline',
        title: 'Test and handle offline / poor network behavior',
        description: 'iOS users expect graceful degradation when there\'s no internet connection.',
        whyItMatters: 'Apps that crash or show blank screens offline get 1-star reviews and may be flagged in App Review.',
        required: true,
        taskType: TASK_TYPE.MIXED,
        copyPrompt: `You are adding offline/poor network handling to JUnited.

JUnited uses TanStack Query for data fetching. Currently, if there's no internet:
- Queries fail silently or show loading spinners forever
- Users don't know if the app is broken or just loading

Please:
1. Add a global "No Internet Connection" banner using react-router-dom and the browser's navigator.onLine API
2. Configure TanStack Query's retry and staleTime settings to be offline-friendly (serve cached data)
3. For the Feed page specifically, show cached posts when offline with a "Showing cached results" notice
4. Show user-friendly error messages (not "Network error" — something like "Can't load posts — check your connection")

The banner should auto-dismiss when connectivity is restored.`,
        manualSteps: [
          'In iOS Simulator: Hardware → Network Condition → 100% packet loss',
          'Open the app and navigate to the Feed',
          'Verify a helpful message appears — not a blank screen or infinite spinner',
          'Restore network and verify the app recovers automatically',
        ],
        completionCriteria: 'Offline state shows a helpful message. App recovers when connectivity returns.',
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
        description: 'Review notes tell Apple reviewers what the app does and how to test it. Max 4000 characters.',
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
