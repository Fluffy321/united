# Base44 migration status

This app is being moved away from Base44 and toward Supabase.

## Already changed

- The React frontend no longer installs `@base44/sdk`.
- The React frontend no longer installs `@base44/vite-plugin`.
- `src/api/base44Client.js` now uses Supabase when `VITE_SUPABASE_ENABLED=true`.
- Login now uses Supabase email/password auth.
- Profiles, communities, posts, conversations, and messages have Supabase table mappings.
- Supabase setup SQL lives in `supabase/migrations`.

## Still left

- The `base44/functions` folder still contains old Base44 server functions.
- Those functions are not the normal React frontend.
- They should be rebuilt later as Supabase Edge Functions, Vercel Functions, or normal API routes.

## Why the old folder is still here

It is safer to keep the old functions as reference until each one is replaced.
After a replacement exists and is tested, that old function can be deleted.

## Old functions still to replace

- `acceptOffer`
- `archiveExpiredRefuah`
- `autoBumpRequests`
- `autoFillCommunityLogos`
- `autoModerateNew`
- `checkCommunityEligibility`
- `clearSeededPosts`
- `create-checkout`
- `createFeaturedCheckout`
- `createRideRequest`
- `deleteUserAccount`
- `exportChesedReport`
- `fetchArticle`
- `fetchRSSFeeds`
- `getCommunityHealthInsights`
- `getCommunityImpact`
- `getHeadlines`
- `getOpenRideRequests`
- `markFulfilled`
- `migrateChalkboardPosts`
- `migrateUserAvatars`
- `moderateContent`
- `moderationAction`
- `notifyCommunityMembers`
- `notifyNearbyUsers`
- `notifyNewHelpRequest`
- `notifyOnAnnouncement`
- `notifyOnCommentReply`
- `notifyOnLike`
- `notifyOnMention`
- `notifyOnNewCommunityEvent`
- `notifyOnNewMessage`
- `notifyOnPostInteraction`
- `offerHelp`
- `pruneNonFiveTownsCommunities`
- `pruneNonNYCommunities`
- `pruneToMainTenShuls`
- `reseedFeaturedCommunities`
- `resetWeeklyHelps`
- `searchCities`
- `seedCasualMessages`
- `seedCommunitiesDirectory`
- `seedCommunityContent`
- `seedFeaturedCommunities`
- `seedFeedPosts`
- `seedFiveTownsCommunities`
- `seedLaunchContent`
- `seedLightCommunities`
- `seedShulContent`
- `seedShulHubs`
- `seedYoungIsrael`
- `sendCompletionReminder`
- `sendGroupNewsletter`
- `sendMitzvahNotification`
- `sendNotificationOnComment`
- `sendWeeklyCommunityDigest`
- `sendWeeklyCommunityImpact`
- `sendWeeklyShulSummary`
- `sendYahrzeitReminders`
- `spreadPostTimestamps`
- `universalSearch`
- `updateHelperBadge`
- `upsertCoreTenShuls`
- `wix-payments-webhook`
