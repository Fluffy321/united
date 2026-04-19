import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import ThemeProvider from '@/components/theme/ThemeProvider'
import PageTransition from '@/components/common/PageTransition'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
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

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#F0F6FF]">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
    // auth_required and other errors: allow access as guest
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