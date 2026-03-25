import { Toaster } from "@/components/ui/toaster"
import { AnimatePresence, motion } from 'framer-motion';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import PublicProfile from '@/pages/PublicProfile';
import Events from '@/pages/Events';
import CommunityMap from '@/pages/CommunityMap';
import ThankYou from '@/pages/ThankYou';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.15, ease: 'easeOut' }}
    style={{ minHeight: '100%' }}
  >
    {children}
  </motion.div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
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
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<PageTransition><LayoutWrapper currentPageName={mainPageKey}><MainPage /></LayoutWrapper></PageTransition>} />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <PageTransition>
              <LayoutWrapper currentPageName={path}><Page /></LayoutWrapper>
            </PageTransition>
          }
        />
      ))}
      <Route path="/PublicProfile" element={<PageTransition><PublicProfile /></PageTransition>} />
      <Route path="/ThankYou" element={<PageTransition><ThankYou /></PageTransition>} />
      <Route path="/CommunityMap" element={<PageTransition><CommunityMap /></PageTransition>} />
      <Route path="/Events" element={<PageTransition><Events /></PageTransition>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App