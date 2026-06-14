import { lazy, Suspense, useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import ThemeProvider from '@/components/theme/ThemeProvider'
import PageTransition from '@/components/common/PageTransition'
import AppErrorBoundary from '@/components/common/AppErrorBoundary'
import AppSplashScreen from '@/components/common/AppSplashScreen'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import AdminRoute from '@/components/AdminRoute';
import ProtectedRoute from '@/components/ProtectedRoute';
import OnboardingFlow, { hasCompletedOnboarding } from '@/components/onboarding/OnboardingFlow';
import { getSupabaseConfigStatus } from '@/api/supabaseClient';

const supabaseStatus = getSupabaseConfigStatus();
const PROD_CONFIG_MISSING = import.meta.env.PROD && !supabaseStatus.shouldUseSupabase;

function ConfigVar({ name, present }) {
  return (
    <div className={`flex items-center gap-2 py-0.5 ${present ? 'text-green-700' : 'text-red-600 font-semibold'}`}>
      <span className="w-3 text-center select-none">{present ? '✓' : '✗'}</span>
      <span>{name}</span>
      {!present && <span className="text-red-400 font-normal">(missing or not set to correct value)</span>}
    </div>
  );
}

function ProductionConfigError() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg border border-red-200 overflow-hidden">
        <div className="bg-red-600 px-6 py-4">
          <h1 className="text-white font-extrabold text-lg">Production Configuration Error</h1>
          <p className="text-red-100 text-sm mt-0.5">This app cannot start without a Supabase backend.</p>
        </div>
        <div className="px-6 py-5 space-y-5">
          <p className="text-sm text-slate-700 leading-relaxed">
            Required environment variables are missing or disabled. Without them the app would
            silently run in demo mode — all user data would be stored only in the browser and lost
            on refresh. Set the variables below in your deployment environment and redeploy.
          </p>
          <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3 font-mono text-xs space-y-1">
            <ConfigVar name="VITE_SUPABASE_URL" present={supabaseStatus.hasUrl} />
            <ConfigVar name="VITE_SUPABASE_ANON_KEY" present={supabaseStatus.hasAnonKey} />
            <ConfigVar
              name="VITE_SUPABASE_ENABLED=true"
              present={supabaseStatus.isSupabaseEnabled}
            />
          </div>
          <p className="text-xs text-slate-400">
            See <span className="font-mono">env.example</span> in the repository root for the full
            list of required variables and how to configure them.
          </p>
        </div>
      </div>
    </div>
  );
}

// Route-level code splitting — only MVP pages are eagerly imported here.
const PublicProfile           = lazy(() => import('@/pages/PublicProfile'));
const AdminAnalyticsDashboard = lazy(() => import('@/pages/AdminAnalyticsDashboard'));
const AdminModerationQueue    = lazy(() => import('@/pages/AdminModerationQueue'));
const AdminSeedControl        = lazy(() => import('@/pages/AdminSeedControl'));
const PostDetail              = lazy(() => import('@/pages/PostDetail'));
const CommunityPage           = lazy(() => import('@/pages/CommunityPage'));
const JoinByCommunityCode     = lazy(() => import('@/pages/JoinByCommunityCode'));
const MinorSafetyPolicy       = lazy(() => import('@/pages/MinorSafetyPolicy'));
const TermsOfService          = lazy(() => import('@/pages/TermsOfService'));
const PrivacyPolicy           = lazy(() => import('@/pages/PrivacyPolicy'));
const CommunityGuidelines     = lazy(() => import('@/pages/CommunityGuidelines'));
const DMCAPolicy              = lazy(() => import('@/pages/DMCAPolicy'));
const PrivacyRights           = lazy(() => import('@/pages/PrivacyRights'));
const SearchPage              = lazy(() => import('@/pages/Search'));
const Landing                 = lazy(() => import('@/pages/Landing'));
const Login                   = lazy(() => import('@/pages/Login'));
const JewishHub               = lazy(() => import('@/pages/JewishHub'));
const AdminFeedbackInbox      = lazy(() => import('@/pages/AdminFeedbackInbox'));
const ThankYou                = lazy(() => import('@/pages/ThankYou'));

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const mainPagePath = `/${mainPageKey || 'Feed'}`;

const ADMIN_PAGE_KEYS = new Set(['AdminModerationQueue', 'AdminSeedControl']);
const ROUTER_FUTURE_FLAGS = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};
const SPLASH_MIN_VISIBLE_MS = 720;
const SPLASH_MAX_WAIT_MS = 4500;
const LEGACY_FEED_ROUTES = [
  '/BusinessDirectory',
  '/BusinessListing',
  '/CommunityCalendar',
  '/CommunityDiscover',
  '/CommunitiesDiscover',
  '/CommunityUpdates',
  '/CreateBusinessListing',
  '/DiscoverCommunitiesFeed',
  '/Events',
  '/Groups',
  '/groups/:groupId',
  '/InviteJoin',
  '/MitzvahMap',
  '/MyEvents',
  '/News',
  '/Notifications',
  '/Organization',
  '/ShulPage',
  '/SupportJUnited',
  '/tehillim',
  '/UserSettings',
  '/yahrzeits',
];

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const PageFallback = () => (
  <div className="fixed inset-0 bg-[#F6F8FB] px-4 pt-5">
    <div className="mx-auto w-full max-w-2xl space-y-3 motion-page-enter">
      <div className="app-card p-4">
        <div className="skeleton h-5 w-32 rounded-full" />
        <div className="skeleton mt-4 h-8 w-3/4 rounded-xl" />
        <div className="skeleton mt-3 h-4 w-full rounded" />
        <div className="skeleton mt-2 h-4 w-5/6 rounded" />
      </div>
      {[0, 1, 2].map((item) => (
        <div key={item} className="app-card p-4">
          <div className="flex items-center gap-3">
            <div className="skeleton h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3 w-28 rounded" />
              <div className="skeleton h-3 w-20 rounded" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-4/5 rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const AuthenticatedApp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, checkAppState } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    setShowOnboarding(Boolean(user?.id && !hasCompletedOnboarding(user) && location.pathname !== '/login'));
  }, [user, location.pathname]);

  return (
    <>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
          <Route path="/welcome" element={<PageTransition><Landing /></PageTransition>} />
          <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
          <Route element={<ProtectedRoute />}>
            {/* Admin-only routes */}
            <Route element={<AdminRoute />}>
              <Route path="/AdminModerationQueue" element={<PageTransition><LayoutWrapper currentPageName="AdminModerationQueue"><AdminModerationQueue /></LayoutWrapper></PageTransition>} />
              <Route path="/AdminSeedControl" element={<PageTransition><LayoutWrapper currentPageName="AdminSeedControl"><AdminSeedControl /></LayoutWrapper></PageTransition>} />
              <Route path="/AdminAnalyticsDashboard" element={<PageTransition><AdminAnalyticsDashboard /></PageTransition>} />
              <Route path="/AdminFeedbackInbox" element={<PageTransition><AdminFeedbackInbox /></PageTransition>} />
            </Route>

            {/* Main app routes */}
            {Object.entries(Pages)
              .filter(([path]) => !ADMIN_PAGE_KEYS.has(path))
              .map(([path, Page]) => (
                <Route
                  key={path}
                  path={`/${path}`}
                  element={<PageTransition><LayoutWrapper currentPageName={path}><Page /></LayoutWrapper></PageTransition>}
                />
              ))}

            {/* MVP utility routes */}
            <Route path="/PublicProfile" element={<PageTransition><PublicProfile /></PageTransition>} />
            <Route path="/PostDetail" element={<PageTransition><PostDetail /></PageTransition>} />
            <Route path="/Discover" element={<Navigate to="/Communities" replace />} />
            <Route path="/discover" element={<Navigate to="/Communities" replace />} />
            <Route path="/community/:communityId" element={<PageTransition><LayoutWrapper currentPageName="CommunityDetail"><CommunityPage /></LayoutWrapper></PageTransition>} />
            <Route path="/communities/:communityId" element={<PageTransition><LayoutWrapper currentPageName="CommunityDetail"><CommunityPage /></LayoutWrapper></PageTransition>} />
            <Route path="/join" element={<PageTransition><JoinByCommunityCode /></PageTransition>} />
            <Route path="/search" element={<PageTransition><SearchPage /></PageTransition>} />
            <Route path="/Search" element={<Navigate to="/search" replace />} />
            <Route path="/JewishHub/*" element={<PageTransition><LayoutWrapper currentPageName="JewishHub"><JewishHub /></LayoutWrapper></PageTransition>} />

            {/* Legal & policy pages */}
            <Route path="/MinorSafetyPolicy" element={<PageTransition><MinorSafetyPolicy /></PageTransition>} />
            <Route path="/terms" element={<PageTransition><TermsOfService /></PageTransition>} />
            <Route path="/privacy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
            <Route path="/guidelines" element={<PageTransition><CommunityGuidelines /></PageTransition>} />
            <Route path="/dmca" element={<PageTransition><DMCAPolicy /></PageTransition>} />
            <Route path="/privacy-rights" element={<PageTransition><PrivacyRights /></PageTransition>} />

            <Route path="/CommunityMap" element={<Navigate to="/Map" replace />} />

            {/* Legacy redirects — old feature pages now resolve into the core app. */}
            {LEGACY_FEED_ROUTES.map((path) => (
              <Route key={path} path={path} element={<Navigate to={mainPagePath} replace />} />
            ))}
            <Route path="/ThankYou" element={<PageTransition><ThankYou /></PageTransition>} />
          </Route>
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Suspense>
      {showOnboarding && (
        <OnboardingFlow
          user={user}
          onComplete={async (result) => {
            setShowOnboarding(false);
            await checkAppState();
            if (!(result?._joinedCount > 0)) {
              navigate('/Communities');
            }
          }}
        />
      )}
    </>
  );
};

const InitialAppGate = ({ children }) => {
  const { isLoadingAuth } = useAuth();
  const [minimumElapsed, setMinimumElapsed] = useState(false);
  const [forceReady, setForceReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const minimumTimer = window.setTimeout(() => setMinimumElapsed(true), SPLASH_MIN_VISIBLE_MS);
    const maxTimer = window.setTimeout(() => setForceReady(true), SPLASH_MAX_WAIT_MS);

    return () => {
      window.clearTimeout(minimumTimer);
      window.clearTimeout(maxTimer);
    };
  }, []);

  useEffect(() => {
    if (!showSplash || !minimumElapsed || (isLoadingAuth && !forceReady)) return undefined;

    setIsExiting(true);
    const exitTimer = window.setTimeout(() => setShowSplash(false), 320);
    return () => window.clearTimeout(exitTimer);
  }, [forceReady, isLoadingAuth, minimumElapsed, showSplash]);

  return (
    <>
      {children}
      {showSplash && <AppSplashScreen exiting={isExiting} />}
    </>
  );
};


function App() {
  if (PROD_CONFIG_MISSING) return <ProductionConfigError />;

  return (
    <AppErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClientInstance}>
            <InitialAppGate>
              <Router future={ROUTER_FUTURE_FLAGS}>
                <NavigationTracker />
                <AuthenticatedApp />
              </Router>
            </InitialAppGate>
          </QueryClientProvider>
        </AuthProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  )
}

export default App
