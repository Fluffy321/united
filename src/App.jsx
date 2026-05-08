import { lazy, Suspense, useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import ThemeProvider from '@/components/theme/ThemeProvider'
import PageTransition from '@/components/common/PageTransition'
import AppErrorBoundary from '@/components/common/AppErrorBoundary'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import AdminRoute from '@/components/AdminRoute';
import ProtectedRoute from '@/components/ProtectedRoute';
import OnboardingFlow, { hasCompletedOnboarding } from '@/components/onboarding/OnboardingFlow';

// Route-level code splitting: each page loads only when first navigated to.
const PublicProfile        = lazy(() => import('@/pages/PublicProfile'));
const Events               = lazy(() => import('@/pages/Events'));
const AdminAnalyticsDashboard = lazy(() => import('@/pages/AdminAnalyticsDashboard'));
const UserSettings         = lazy(() => import('@/pages/UserSettings'));
const ThankYou             = lazy(() => import('@/pages/ThankYou'));
const PostDetail           = lazy(() => import('@/pages/PostDetail'));
const CommunityPage        = lazy(() => import('@/pages/CommunityPage'));
const CommunityCalendar    = lazy(() => import('@/pages/CommunityCalendar'));
const JoinByCommunityCode  = lazy(() => import('@/pages/JoinByCommunityCode'));
const MinorSafetyPolicy    = lazy(() => import('@/pages/MinorSafetyPolicy'));
const BusinessDirectory    = lazy(() => import('@/pages/BusinessDirectory'));
const BusinessListingPage  = lazy(() => import('@/pages/BusinessListing'));
const CreateBusinessListing = lazy(() => import('@/pages/CreateBusinessListing'));
const SupportJUnited       = lazy(() => import('@/pages/SupportJUnited'));
const TermsOfService       = lazy(() => import('@/pages/TermsOfService'));
const PrivacyPolicy        = lazy(() => import('@/pages/PrivacyPolicy'));
const CommunityGuidelines  = lazy(() => import('@/pages/CommunityGuidelines'));
const DMCAPolicy           = lazy(() => import('@/pages/DMCAPolicy'));
const PrivacyRights        = lazy(() => import('@/pages/PrivacyRights'));
const YahrzeitManager      = lazy(() => import('@/pages/YahrzeitManager'));
const SearchPage           = lazy(() => import('@/pages/Search'));
const RefuahList           = lazy(() => import('@/pages/RefuahList'));
const Login                = lazy(() => import('@/pages/Login'));

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const ADMIN_PAGE_KEYS = new Set(['AdminModerationQueue', 'AdminSeedControl']);

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const PageFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-[#F6F8FB]">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
  </div>
);

const AuthenticatedApp = () => {
  const location = useLocation();
  const { user, checkAppState } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    setShowOnboarding(Boolean(user?.id && !hasCompletedOnboarding(user) && location.pathname !== '/login'));
  }, [user, location.pathname]);

  return (
    <>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminRoute />}>
              {[...ADMIN_PAGE_KEYS].map((key) => {
                const Page = Pages[key];
                return (
                  <Route
                    key={key}
                    path={`/${key}`}
                    element={<PageTransition><LayoutWrapper currentPageName={key}><Page /></LayoutWrapper></PageTransition>}
                  />
                );
              })}
              <Route path="/AdminAnalyticsDashboard" element={<PageTransition><AdminAnalyticsDashboard /></PageTransition>} />
            </Route>
            <Route path="/" element={<PageTransition><LayoutWrapper currentPageName={mainPageKey}><MainPage /></LayoutWrapper></PageTransition>} />
            {Object.entries(Pages)
              .filter(([path]) => !ADMIN_PAGE_KEYS.has(path))
              .map(([path, Page]) => (
                <Route
                  key={path}
                  path={`/${path}`}
                  element={<PageTransition><LayoutWrapper currentPageName={path}><Page /></LayoutWrapper></PageTransition>}
                />
              ))}
            <Route path="/PublicProfile" element={<PageTransition><PublicProfile /></PageTransition>} />
            <Route path="/PostDetail" element={<PageTransition><PostDetail /></PageTransition>} />
            <Route path="/ThankYou" element={<PageTransition><ThankYou /></PageTransition>} />
            <Route path="/CommunityMap" element={<Navigate to="/Communities" replace />} />
            <Route path="/Events" element={<PageTransition><Events /></PageTransition>} />
            <Route path="/UserSettings" element={<PageTransition><UserSettings /></PageTransition>} />
            <Route path="/community/:communityId" element={<PageTransition><LayoutWrapper currentPageName="CommunityDetail"><CommunityPage /></LayoutWrapper></PageTransition>} />
            <Route path="/communities/:communityId" element={<PageTransition><LayoutWrapper currentPageName="CommunityDetail"><CommunityPage /></LayoutWrapper></PageTransition>} />
            <Route path="/CommunityCalendar" element={<PageTransition><CommunityCalendar /></PageTransition>} />
            <Route path="/DiscoverCommunitiesFeed" element={<Navigate to="/Communities" replace />} />
            <Route path="/MitzvahMap" element={<Navigate to="/MitzvahCircle?tab=map" replace />} />
            <Route path="/join" element={<PageTransition><JoinByCommunityCode /></PageTransition>} />
            <Route path="/MinorSafetyPolicy" element={<PageTransition><MinorSafetyPolicy /></PageTransition>} />
            <Route path="/BusinessDirectory" element={<PageTransition><BusinessDirectory /></PageTransition>} />
            <Route path="/BusinessListing" element={<PageTransition><BusinessListingPage /></PageTransition>} />
            <Route path="/CreateBusinessListing" element={<PageTransition><CreateBusinessListing /></PageTransition>} />
            <Route path="/SupportJUnited" element={<PageTransition><SupportJUnited /></PageTransition>} />
            <Route path="/terms" element={<PageTransition><TermsOfService /></PageTransition>} />
            <Route path="/privacy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
            <Route path="/guidelines" element={<PageTransition><CommunityGuidelines /></PageTransition>} />
            <Route path="/dmca" element={<PageTransition><DMCAPolicy /></PageTransition>} />
            <Route path="/privacy-rights" element={<PageTransition><PrivacyRights /></PageTransition>} />
            <Route path="/yahrzeits" element={<PageTransition><YahrzeitManager /></PageTransition>} />
            <Route path="/tehillim" element={<PageTransition><RefuahList /></PageTransition>} />
            <Route path="/search" element={<PageTransition><SearchPage /></PageTransition>} />
          </Route>
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Suspense>
      {showOnboarding && (
        <OnboardingFlow
          user={user}
          onComplete={async () => {
            setShowOnboarding(false);
            await checkAppState();
          }}
        />
      )}
    </>
  );
};


function App() {
  return (
    <AppErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClientInstance}>
            <Router>
              <NavigationTracker />
              <AuthenticatedApp />
            </Router>
          </QueryClientProvider>
        </AuthProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  )
}

export default App
