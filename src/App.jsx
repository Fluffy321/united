import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import ThemeProvider from '@/components/theme/ThemeProvider'
import PageTransition from '@/components/common/PageTransition'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import PublicProfile from '@/pages/PublicProfile';
import Events from '@/pages/Events';
import CommunityMap from '@/pages/CommunityMap';
import AdminAnalyticsDashboard from '@/pages/AdminAnalyticsDashboard';
import UserSettings from '@/pages/UserSettings';
import ThankYou from '@/pages/ThankYou';
import PostDetail from '@/pages/PostDetail';
import CommunityPage from '@/pages/CommunityPage';
import CommunityCalendar from '@/pages/CommunityCalendar';
import DiscoverCommunitiesFeed from '@/pages/DiscoverCommunitiesFeed';
import JoinByCommunityCode from '@/pages/JoinByCommunityCode';
import MinorSafetyPolicy from '@/pages/MinorSafetyPolicy';
import BusinessDirectory from '@/pages/BusinessDirectory';
import BusinessListingPage from '@/pages/BusinessListing';
import CreateBusinessListing from '@/pages/CreateBusinessListing';
import SupportJUnited from '@/pages/SupportJUnited';
import TermsOfService from '@/pages/TermsOfService';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import CommunityGuidelines from '@/pages/CommunityGuidelines';
import DMCAPolicy from '@/pages/DMCAPolicy';
import PrivacyRights from '@/pages/PrivacyRights';
import YahrzeitManager from '@/pages/YahrzeitManager';
import SearchPage from '@/pages/Search';
import RefuahList from '@/pages/RefuahList';
import Login from '@/pages/Login';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const location = useLocation();
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#F6F8FB]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
    if (location.pathname !== '/login') {
      const fromUrl = `${location.pathname}${location.search || ''}`;
      return <Navigate to={`/login?from_url=${encodeURIComponent(fromUrl)}`} replace />;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<PageTransition><LayoutWrapper currentPageName={mainPageKey}><MainPage /></LayoutWrapper></PageTransition>} />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={<PageTransition><LayoutWrapper currentPageName={path}><Page /></LayoutWrapper></PageTransition>}
        />
      ))}
      <Route path="/PublicProfile" element={<PageTransition><PublicProfile /></PageTransition>} />
      <Route path="/PostDetail" element={<PageTransition><PostDetail /></PageTransition>} />
      <Route path="/ThankYou" element={<PageTransition><ThankYou /></PageTransition>} />
      <Route path="/CommunityMap" element={<PageTransition><CommunityMap /></PageTransition>} />
      <Route path="/Events" element={<PageTransition><Events /></PageTransition>} />
      <Route path="/AdminAnalyticsDashboard" element={<PageTransition><AdminAnalyticsDashboard /></PageTransition>} />
      <Route path="/UserSettings" element={<PageTransition><UserSettings /></PageTransition>} />
      <Route path="/community/:communityId" element={<PageTransition><LayoutWrapper currentPageName="CommunityDetail"><CommunityPage /></LayoutWrapper></PageTransition>} />
      <Route path="/communities/:communityId" element={<PageTransition><LayoutWrapper currentPageName="CommunityDetail"><CommunityPage /></LayoutWrapper></PageTransition>} />
      <Route path="/CommunityCalendar" element={<PageTransition><CommunityCalendar /></PageTransition>} />
      <Route path="/DiscoverCommunitiesFeed" element={<PageTransition><DiscoverCommunitiesFeed /></PageTransition>} />
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
      <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <NavigationTracker />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
