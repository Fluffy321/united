import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Copy, Check, Sparkles } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

const FUTURE_FEATURES = [
  {
    id: 'events-system',
    category: 'Community',
    title: 'Events System',
    description: 'Full event creation, RSVP, calendar, and ticket system for community events.',
    prompt: `You are implementing the Events System for JUnited.

Goals:
1. Create a full events listing page (/Events) with RSVP support.
2. Wire community_event_rsvps table to CommunityEventRSVP entity.
3. Add EventTicketSection component (currently stubbed).
4. Connect CommunityCalendar page (/CommunityCalendar) to real DB events.
5. Create MyEvents page (/MyEvents) for tracking events the user RSVP'd to.
6. Allow event cancellation: update CommunityEventRSVP status to 'cancelled'.
7. Add EventSummaryButton AI feature using dataService.integrations.Core.InvokeLLM.
8. Update pages.config.js to re-add Events, MyEvents.
9. Update App.jsx to re-add /Events and /CommunityCalendar routes.
10. Ensure all routes are protected and entities are Supabase-backed.

Required migrations: community_events, community_event_rsvps tables.
Current files: src/pages/Events.jsx, src/pages/MyEvents.jsx, src/pages/CommunityCalendar.jsx,
  src/components/communities/EventTicketSection.jsx,
  src/components/events/EventSummaryButton.jsx.`,
  },
  {
    id: 'groups',
    category: 'Community',
    title: 'Community Groups & Sub-Groups',
    description: 'Private groups within communities, with chat, resources, and analytics.',
    prompt: `You are implementing Community Groups for JUnited.

Goals:
1. Re-add Groups page (/Groups) to pages.config.js and App.jsx.
2. Wire GroupMember → group_members table.
3. Wire GroupDiscussion → group_discussions table.
4. Wire GroupResource → group_resources table.
5. Connect CommunityGroupPage to real DB data.
6. Remove GroupAnalyticsDashboard stub or connect it to real data.
7. Add join/leave group flows.
8. Add GroupPost → group_posts entity.
9. Ensure RLS policies: members can read, admins can manage.

Required migrations: community_groups, group_members, group_discussions, group_resources, group_posts.
Current files: src/pages/Groups.jsx, src/components/communities/CommunityGroupPage.jsx,
  src/components/groups/GroupAnalyticsDashboard.jsx.`,
  },
  {
    id: 'shul-directory',
    category: 'Directory',
    title: 'Shul Directory',
    description: 'Browse, search, and view shul profiles with schedules and minyan times.',
    prompt: `You are implementing the Shul Directory for JUnited.

Goals:
1. Create the shuls table migration with fields: name, address, rabbi_name, phone, website, logo_url, schedule, minyan_times.
2. Wire Shul → shuls entity in base44Client.js SUPABASE_ENTITY_TABLES.
3. Connect ShulPage (/ShulPage) to real shuls data.
4. Add ShulMember → shul_members for following/joining shuls.
5. Re-add ShulPage to pages.config.js and App.jsx routes.
6. Add shul search to the main Search page.
7. Add MinyanAttendance → minyan_attendances for tracking attendance.

Required migrations: shuls, shul_members, minyan_attendances tables.
Current files: src/pages/ShulPage.jsx.`,
  },
  {
    id: 'business-directory',
    category: 'Directory',
    title: 'Business Directory & Reviews',
    description: 'Jewish business listings, reviews, and claim-your-listing flow.',
    prompt: `You are implementing the Business Directory for JUnited.

Goals:
1. Create business_listings and business_reviews table migrations.
2. Wire BusinessListing → business_listings in SUPABASE_ENTITY_TABLES.
3. Wire BusinessReview → business_reviews in SUPABASE_ENTITY_TABLES.
4. Connect BusinessDirectory page (/BusinessDirectory) to real data.
5. Connect BusinessListing detail page (/BusinessListing?id=...) to real data.
6. Connect CreateBusinessListing page to real Supabase insert.
7. Add ClaimRequest → claim_requests entity for business claiming.
8. Re-add all three pages to App.jsx routes and remove from FutureFeatures.

Required migrations: business_listings, business_reviews tables.
Current files: src/pages/BusinessDirectory.jsx, src/pages/BusinessListing.jsx,
  src/pages/CreateBusinessListing.jsx.`,
  },
  {
    id: 'yahrzeit-refuah',
    category: 'Jewish Life',
    title: 'Yahrzeit Manager & Tehillim Lists',
    description: 'Track yahrzeits with Hebrew calendar reminders, and manage refuah/tehillim lists.',
    prompt: `You are implementing Yahrzeit and Tehillim features for JUnited.

Goals:
1. Create yahrzeits table migration with fields: name, hebrew_name, date, relationship, reminders.
2. Wire Yahrzeit → yahrzeits and YahrzeitCandle → yahrzeit_candles in SUPABASE_ENTITY_TABLES.
3. Connect YahrzeitManager page (/yahrzeits) to real data.
4. Create refuah_requests table with fields: name, hebrew_name, condition, community_id, submitted_by.
5. Wire RefuahRequest → refuah_requests and RefuahDavening → refuah_davenings.
6. Connect RefuahList page (/tehillim) to real data.
7. Re-add /yahrzeits and /tehillim routes to App.jsx.
8. Add Hebrew calendar date conversion utility.

Required migrations: yahrzeits, yahrzeit_candles, refuah_requests, refuah_davenings.
Current files: src/pages/YahrzeitManager.jsx, src/pages/RefuahList.jsx.`,
  },
  {
    id: 'news-aggregation',
    category: 'Content',
    title: 'News Aggregation',
    description: 'Jewish community news aggregated from trusted sources.',
    prompt: `You are implementing the News Aggregation feature for JUnited.

Goals:
1. Create news_items and news_sources table migrations.
2. Wire NewsItem → news_items and NewsSource → news_sources in SUPABASE_ENTITY_TABLES.
3. Connect News page (/News) to real Supabase data.
4. Add admin interface for managing news sources.
5. Optional: add Edge Function to periodically fetch RSS feeds into news_items.
6. Re-add News to pages.config.js and App.jsx routes.

Required migrations: news_items, news_sources tables.
Current files: src/pages/News.jsx.`,
  },
  {
    id: 'newsletter-system',
    category: 'Content',
    title: 'Newsletter System',
    description: 'Community newsletter subscriptions and distribution.',
    prompt: `You are implementing the Newsletter System for JUnited.

Goals:
1. Wire NewsletterSubscriber → newsletter_subscribers in SUPABASE_ENTITY_TABLES.
2. Wire NewsletterLog → newsletter_logs in SUPABASE_ENTITY_TABLES.
3. Create subscribe/unsubscribe UI in community and profile pages.
4. Add admin panel for sending newsletters (via Edge Function + email service).
5. Integrate with an email provider (Resend, SendGrid, or Postmark).
6. Add double-opt-in confirmation flow.

Required: newsletter_subscribers, newsletter_logs tables (already in migrations).
Current files: base44/entities/NewsletterSubscriber.jsonc, NewsletterLog.jsonc.`,
  },
  {
    id: 'meal-trains',
    category: 'Chesed',
    title: 'Meal Train Requests',
    description: 'Coordinate meal delivery for families in need.',
    prompt: `You are implementing Meal Train Requests for JUnited.

Goals:
1. Create meal_train_requests and meal_slots table migrations.
2. Wire MealTrainRequest → meal_train_requests and MealSlot → meal_slots.
3. Create a MealTrains page showing active meal trains.
4. Add sign-up flow for meal delivery slots.
5. Integrate with MitzvahCircle as a special request category.
6. Send notifications when a slot is taken or a train is complete.
7. Add /meal-trains route to App.jsx.

Required migrations: meal_train_requests, meal_slots tables.`,
  },
  {
    id: 'ride-requests',
    category: 'Chesed',
    title: 'Ride Requests & Carpool Board',
    description: 'Coordinate rides and carpools within the community.',
    prompt: `You are implementing Ride Requests and the Carpool Board for JUnited.

Goals:
1. Create ride_requests table migration.
2. Wire RideRequest → ride_requests in SUPABASE_ENTITY_TABLES.
3. Re-add the Carpool tab to MitzvahCircle (src/pages/MitzvahCircle.jsx).
4. Connect CarpoolBoard component (src/components/mitzvah/CarpoolBoard.jsx) to real DB data.
5. Add create-ride-offer and request-ride flows.
6. Ensure ride requests appear on the mitzvah map.

Required migrations: ride_requests table.
Current files: src/components/mitzvah/CarpoolBoard.jsx.`,
  },
  {
    id: 'chesed-hours',
    category: 'Gamification',
    title: 'Chesed Hours & Verification',
    description: 'Track, verify, and log chesed hours for schools and community programs.',
    prompt: `You are implementing the Chesed Hours verification system for JUnited.

Goals:
1. Re-add the 'My Log' tab to MitzvahCircle with ChesedHoursDashboard.
2. Connect ChesedHoursDashboard to real chesed_hours_logs table via dataService.entities.ChesedLog.
3. When a mitzvah request is verified, automatically create a ChesedLog entry.
4. Add CSV export of verified hours (for school submissions).
5. Add VerificationRequest flow: requester confirms completion → chesed hours are logged.
6. Wire VerificationRequest → verification_requests entity.
7. Connect MitzvahCompletion → mitzvah_completions entity.

Required: chesed_hours_logs, verification_requests, mitzvah_completions tables (already exist).
Current files: The old ChesedHoursDashboard was removed from MitzvahCircle.jsx during MVP cut.
  Restore it from git history and connect to real data.`,
  },
  {
    id: 'payments',
    category: 'Monetization',
    title: 'Payments & Checkout',
    description: 'In-app payments for paid tasks, community premium features, and donations.',
    prompt: `You are implementing Payments for JUnited.

Goals:
1. Set up Stripe integration: VITE_STRIPE_PUBLISHABLE_KEY env var.
2. Create a Supabase Edge Function for create-checkout-session.
3. Connect paymentsService.createCheckout() to the real Edge Function.
4. Remove the 'paymentLive: false' stub in base44Client.js functions.invoke('create-checkout').
5. Add PaymentModal component for in-app checkout.
6. Handle webhook for payment completion (mark task as paid, update status).
7. Add SupportJUnited page back (/SupportJUnited) for donations.
8. Add Transaction → transactions entity mapping.

Required env vars: VITE_STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY (server-side Edge Function).
Current files: src/services/paymentsService.js, src/components/payments/PaymentModal.jsx,
  src/pages/SupportJUnited.jsx, src/pages/ThankYou.jsx.`,
  },
  {
    id: 'community-store',
    category: 'Monetization',
    title: 'Community Store',
    description: 'Digital storefront for communities to sell merchandise and fundraise.',
    prompt: `You are implementing the Community Store for JUnited.

Goals:
1. Re-add CommunityStoreTab to CommunityDetailView.jsx.
2. Wire CommunityListing → community_listings in SUPABASE_ENTITY_TABLES.
3. Integrate with Stripe for product purchases.
4. Add admin UI for communities to manage their store items.
5. Track orders and fulfillment.

Required: community_listings table, Stripe integration (see Payments task).
Current files: src/components/communities/CommunityStoreTab.jsx.`,
  },
  {
    id: 'verified-community-upgrade',
    category: 'Monetization',
    title: 'Verified Community & Featured Eligibility',
    description: 'Premium verified badge and featured placement for community organizations.',
    prompt: `You are implementing Verified Community upgrades for JUnited.

Goals:
1. Re-add VerifiedCommunityUpgrade to AdminToolsPanel.jsx.
2. Re-add FeaturedEligibilityChecker to AdminToolsPanel.jsx.
3. Wire FeaturedCommunitySlot → featured_community_slots entity.
4. Wire FeaturedEligibilityLog → featured_eligibility_logs entity.
5. Connect to Stripe for premium community upgrades.
6. Admin interface to approve/reject verification requests.

Required: featured_community_slots, featured_eligibility_logs tables.
Current files: src/components/communities/AdminToolsPanel.jsx,
  src/components/communities/FeaturedEligibilityChecker.jsx,
  src/components/monetization/VerifiedCommunityUpgrade.jsx.`,
  },
  {
    id: 'premium-analytics',
    category: 'Monetization',
    title: 'Group Premium Analytics',
    description: 'Analytics dashboard for community group admins.',
    prompt: `You are implementing Premium Group Analytics for JUnited.

Goals:
1. Re-add GroupAnalyticsDashboard to CommunityGroupPage.jsx.
2. Connect dashboard to real post engagement data from Supabase.
3. Track: post views, reactions, comment counts, member growth.
4. Add time-range filters (7d, 30d, 90d).
5. Gate behind premium community status.

Required: Access to posts, reactions, comments tables.
Current files: src/components/groups/GroupAnalyticsDashboard.jsx,
  src/components/communities/CommunityGroupPage.jsx.`,
  },
  {
    id: 'organization-pages',
    category: 'Directory',
    title: 'Organization Pages',
    description: 'Dedicated pages for Jewish organizations with member management.',
    prompt: `You are implementing Organization Pages for JUnited.

Goals:
1. Create organizations table migration.
2. Wire Organization → organizations in SUPABASE_ENTITY_TABLES.
3. Connect Organization page (/Organization) to real data.
4. Add organization member management.
5. Link organizations to communities.
6. Re-add Organization to pages.config.js and App.jsx routes.

Required migrations: organizations table.
Current files: src/pages/Organization.jsx.`,
  },
  {
    id: 'ai-assistant',
    category: 'AI',
    title: 'AI Community Assistant',
    description: 'In-app AI chat for community questions and help requests.',
    prompt: `You are implementing the AI Community Assistant for JUnited.

Goals:
1. Wire dataService.integrations.Core.InvokeLLM to a real Claude/OpenAI API call.
2. Create a Supabase Edge Function for AI chat (keep private message contents off Claude).
3. Re-add AIChatBubble to Feed page (currently removed).
4. Store AI conversation history in a new ai_chat_messages table (not in user_messages).
5. Never pass private message contents, reflections, or personal text to the AI.
6. Add rate limiting for AI calls.
7. Remove 'AI features are not connected yet' stub from InvokeLLM.

Required: ANTHROPIC_API_KEY or OPENAI_API_KEY env var (Edge Function), new ai_chat_messages table.
Current files: src/components/common/AIChatBubble.jsx, src/lib/aiAgent.js.`,
  },
  {
    id: 'community-updates',
    category: 'Community',
    title: 'Community Updates Feed',
    description: 'Curated updates and announcements from communities the user follows.',
    prompt: `You are implementing the Community Updates feed for JUnited.

Goals:
1. Re-add CommunityUpdates page to pages.config.js and App.jsx.
2. Connect CommunityUpdates to real posts filtered by communities the user follows.
3. Add community follow/unfollow using community_memberships table.
4. Surface only posts from followed communities in this view.
5. Add notification when a followed community posts an update.

Required: community_memberships table (already exists).
Current files: src/pages/CommunityUpdates.jsx.`,
  },
  {
    id: 'admin-seed-control',
    category: 'Admin',
    title: 'Admin Seed Control (Production Remove)',
    description: 'Admin panel for seeding demo communities. Must be removed or hardened before public launch.',
    prompt: `You are hardening or removing the Admin Seed Control panel for JUnited production.

Goals:
1. Decide: remove AdminSeedControl entirely, or keep it behind a hard-coded admin check.
2. If keeping: verify it is protected by AdminRoute in App.jsx (currently it is).
3. Verify the seedCommunitiesDirectory Edge Function does not exist in production.
4. Add a production safety check: if import.meta.env.PROD, throw an error or hide the UI.
5. If removing: delete src/pages/AdminSeedControl.jsx and remove from pages.config.js and App.jsx.
6. Remove AdminSeedControl from the FutureFeatures list once this is resolved.

Current files: src/pages/AdminSeedControl.jsx (admin-only, protected by AdminRoute).`,
  },
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Prompt copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-[12px] font-bold text-blue-700 transition hover:bg-blue-100 active:scale-95"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied!' : 'Copy Prompt'}
    </button>
  );
}

const CATEGORIES_ORDER = ['Community', 'Directory', 'Jewish Life', 'Content', 'Chesed', 'Gamification', 'Monetization', 'AI', 'Admin'];

export default function FutureFeatures() {
  const grouped = CATEGORIES_ORDER.reduce((acc, cat) => {
    const items = FUTURE_FEATURES.filter((f) => f.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-slate-50 mobile-safe-bottom">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mobile-page-wide flex min-w-0 items-center gap-3 px-4 py-3">
          <Link
            to={createPageUrl('Profile')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-wide text-amber-600">Admin Only</p>
            <h1 className="truncate text-xl font-bold text-slate-950">Future Features</h1>
          </div>
          <div className="ml-auto">
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-black text-amber-800">
              {FUTURE_FEATURES.length} tasks
            </span>
          </div>
        </div>
      </header>

      <div className="mobile-page-wide px-4 py-4 space-y-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-black text-amber-900">Non-MVP features — admin view only</p>
              <p className="mt-1 text-[13px] text-amber-800 leading-relaxed">
                These features were intentionally excluded from the private beta to keep the MVP
                focused and trustworthy. Each card has a ready-to-use Claude Code prompt to
                implement it. Copy the prompt and paste it into Claude Code to begin.
              </p>
            </div>
          </div>
        </div>

        {Object.entries(grouped).map(([category, features]) => (
          <section key={category}>
            <h2 className="mb-3 text-[11px] font-black uppercase tracking-wider text-slate-500">
              {category}
            </h2>
            <div className="space-y-3">
              {features.map((feature) => (
                <div
                  key={feature.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-600">
                          {feature.category}
                        </span>
                      </div>
                      <h3 className="font-black text-slate-950">{feature.title}</h3>
                      <p className="mt-1 text-[13px] text-slate-500">{feature.description}</p>
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <CopyButton text={feature.prompt} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
