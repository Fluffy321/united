import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BookOpenText, Home, Store, MessageSquarePlus, User, Users } from 'lucide-react';
import { MitzvahIcon } from '@/components/common/JIcons';
import { createPageUrl } from '@/utils';
import { Toaster } from 'sonner';
import SwipeableTabs from '@/components/common/SwipeableTabs';
import PWAInstallPrompt from '@/components/common/PWAInstallPrompt';
import CookieConsentBanner from '@/components/common/CookieConsentBanner';
import OfflineBanner from '@/components/common/OfflineBanner';
import { mitzvahReminderService } from '@/services';
import { useAuth } from '@/lib/AuthContext';
import AppErrorBoundary from '@/components/common/AppErrorBoundary';
import FeedbackModal from '@/components/feedback/FeedbackModal';
import { FloatingActionsProvider, useFloatingActions } from '@/components/layout/FloatingActionsContext';
import { COMMUNITIES_ENABLED } from '@/config/features';

// Lazy load main pages
const Feed = lazy(() => import('@/pages/Feed'));
const Communities = lazy(() => import('@/pages/Communities'));
const MitzvahCircle = lazy(() => import('@/pages/MitzvahCircle'));
const Profile = lazy(() => import('@/pages/Profile'));

const navItems = [
  { key: 'Feed',        name: 'Home',        icon: Home,      page: 'Feed' },
  { key: 'Mitzvah',    name: 'Help',     icon: null,      page: 'MitzvahCircle', to: '/MitzvahCircle', isMitzvah: true },
  COMMUNITIES_ENABLED
    ? { key: 'Communities', name: 'Communities', icon: Users, page: 'Communities' }
    : { key: 'JewishHub', name: 'Resources', icon: BookOpenText, page: 'JewishHub', to: '/JewishHub' },
  { key: 'Map',        name: 'Directory',  icon: Store,     page: 'Map',          to: '/Map' },
  { key: 'Profile',    name: 'Me',     icon: User,      page: 'Profile', isProfile: true },
];

/* colorStyles removed — now uses direct active/inactive logic per item */

function InlinePageSkeleton() {
  return (
    <div className="mobile-page px-3 py-4 motion-page-enter">
      <div className="app-card p-4">
        <div className="skeleton h-5 w-28 rounded-full" />
        <div className="skeleton mt-4 h-8 w-2/3 rounded-xl" />
        <div className="skeleton mt-3 h-4 w-full rounded" />
      </div>
      <div className="mt-3 space-y-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="app-card p-4">
            <div className="flex items-center gap-3">
              <div className="skeleton h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3 w-32 rounded" />
                <div className="skeleton h-3 w-20 rounded" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="skeleton h-3 w-full rounded" />
              <div className="skeleton h-3 w-5/6 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Layout(props) {
  return (
    <FloatingActionsProvider>
      <LayoutContent {...props} />
    </FloatingActionsProvider>
  );
}

function LayoutContent({ children, currentPageName }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isChatOpen = currentPageName === 'Messages' && new URLSearchParams(location.search).get('chat') === '1';
  const isCommunityOpen = currentPageName === 'Communities' && Boolean(new URLSearchParams(location.search).get('community'));
  const hideNav = ['Settings', 'ShulPage', 'JewishHub', 'CommunityDetail'].includes(currentPageName) || isChatOpen || isCommunityOpen;
  const { user: currentUser } = useAuth();
  const { actions: floatingActions } = useFloatingActions();

  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    const enabled = Boolean(currentUser)
      && currentUser?.notification_settings?.mitzvahDailyReminders !== false
      && currentUser?.app_settings?.quietMode !== true;
    mitzvahReminderService.start({ enabled });
    return () => mitzvahReminderService.stop();
  }, [currentUser?.notification_settings?.mitzvahDailyReminders, currentUser?.app_settings?.quietMode]);

  const activeNavKey = currentPageName === 'MitzvahCircle' ? 'Mitzvah' : currentPageName;
  const swipeablePages = COMMUNITIES_ENABLED ? ['Feed', 'MitzvahCircle', 'Communities'] : ['Feed', 'MitzvahCircle'];
  const currentIndex = swipeablePages.indexOf(currentPageName);
  const isSwipeable = currentIndex !== -1;
  const swipeLabels = COMMUNITIES_ENABLED ? ['Home', 'Help', 'Communities'] : ['Home', 'Help'];

  const handleTabChange = (newIndex) => {
    if (newIndex >= 0 && newIndex < swipeablePages.length) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      navigate(createPageUrl(swipeablePages[newIndex]));
    }
  };

  return (
    <div className="app-page">
      <Toaster position="top-center" richColors />
      <OfflineBanner />
      <PWAInstallPrompt />
      <CookieConsentBanner />

      {/* Main Content */}
      <main className="min-h-screen overflow-visible">
        {isSwipeable ? (
          <SwipeableTabs
            tabs={swipeLabels}
            activeIndex={currentIndex}
            onIndexChange={handleTabChange}
          >
            <AppErrorBoundary inline resetKey={`${location.key}:feed:${currentIndex}`} fallbackMessage="Feed could not load.">
              <Suspense fallback={<InlinePageSkeleton />}>
                <Feed isActive={currentIndex === 0} />
              </Suspense>
            </AppErrorBoundary>
            <AppErrorBoundary inline resetKey={`${location.key}:mitzvah:${currentIndex}`} fallbackMessage="Mitzvah Circle could not load.">
              <Suspense fallback={<InlinePageSkeleton />}>
                <MitzvahCircle isActive={currentIndex === 1} />
              </Suspense>
            </AppErrorBoundary>
            {COMMUNITIES_ENABLED && (
              <AppErrorBoundary inline resetKey={`${location.key}:communities:${currentIndex}`} fallbackMessage="Communities could not load.">
                <Suspense fallback={<InlinePageSkeleton />}>
                  <Communities />
                </Suspense>
              </AppErrorBoundary>
            )}
          </SwipeableTabs>
        ) : (
          children
        )}
      </main>

      {!hideNav && currentUser && (
        <div className="app-fixed-layer">
          <div className="app-fixed-frame">
            <div className="app-floating-stack">
              {/* Feedback shares the floating stack so it never overlaps page content */}
              <button
                onClick={() => setShowFeedback(true)}
                aria-label="Send feedback"
                className="app-floating-action flex h-10 w-10 items-center justify-center self-end rounded-full border border-slate-200 bg-white shadow-md transition-all duration-200 hover:bg-slate-50 active:scale-95"
                title="Send feedback"
              >
                <MessageSquarePlus className="h-4 w-4 text-slate-600" />
              </button>
              {floatingActions.map((action) => (
                <React.Fragment key={action.id}>
                  {action.render?.()}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      <FeedbackModal open={showFeedback} onClose={() => setShowFeedback(false)} />

      {/* Bottom Navigation */}
      {!hideNav && (
        <nav className="app-bottom-nav pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4">
          <div className="glass-toolbar mobile-page pointer-events-auto relative overflow-hidden rounded-[28px] px-2 py-1.5">
            <div className="flex items-center justify-around px-1 py-1.5">
              {navItems.map((item) => {
                const isActive = activeNavKey === item.key;
                const Icon = item.icon;
                const showAvatar = item.isProfile && currentUser?.avatar_url;

                return (
                  <button
                    key={item.key}
                    aria-label={item.name}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => {
                      const pageIndex = swipeablePages.indexOf(item.page);
                      if (item.page !== currentPageName) {
                        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
                      }
                      if (item.to) {
                        navigate(item.to);
                      } else if (pageIndex !== -1) {
                        handleTabChange(pageIndex);
                      } else {
                        navigate(createPageUrl(item.page));
                      }
                    }}
                    className={`motion-press relative flex min-h-[58px] min-w-[54px] flex-1 flex-col items-center justify-center rounded-[20px] py-[7px] touch-manipulation ${
                      isActive ? 'bg-white shadow-[0_12px_24px_rgba(37,99,235,0.14)] ring-1 ring-blue-100' : 'text-slate-500 hover:bg-white/70 active:bg-slate-100/60'
                    }`}
                  >
                    {isActive && (
                      <span
                        className={`nav-active-pill absolute inset-1 rounded-[16px] ${item.isMitzvah ? 'nav-active-pill-mitzvah' : ''}`}
                      />
                    )}

                    {/* Profile avatar: skip mix-blend-mode to avoid inverting the photo */}
                    {showAvatar ? (
                      <div className="relative z-10 flex flex-col items-center gap-0.5">
                        <img
                          src={currentUser.avatar_url}
                          alt=""
                          className={`h-[22px] w-[22px] rounded-full object-cover shadow-sm transition-all ${
                            isActive ? 'ring-2 ring-blue-600' : 'ring-1 ring-black/20'
                          }`}
                        />
                        <span className={`text-[10px] ${isActive ? 'font-bold text-blue-600' : 'font-semibold text-black/55'}`}>
                          {item.name}
                        </span>
                      </div>
                    ) : isActive ? (
                      /* Active: explicit blue, no blend mode */
                      <div className={`relative z-10 flex flex-col items-center gap-0.5 nav-icon-active`}>
                        {item.isMitzvah ? (
                          <MitzvahIcon size={20} strokeWidth={2.2} className="text-blue-600" />
                        ) : (
                          <Icon className="h-[21px] w-[21px] text-blue-600" strokeWidth={2.4} />
                        )}
                        <span className="text-[10px] font-bold text-blue-600">{item.name}</span>
                      </div>
                    ) : (
                      /* Inactive: slate-500 on glass surface.
                         Glass is 70% white + 24px blur — reliably light enough that
                         medium-dark text stays readable without blend-mode tricks. */
                      <div className="relative z-10 flex flex-col items-center gap-0.5">
                        {item.isMitzvah ? (
                          <MitzvahIcon size={20} strokeWidth={1.8} className="text-slate-500" />
                        ) : (
                          <Icon className="h-[21px] w-[21px] text-slate-500" strokeWidth={1.8} />
                        )}
                        <span className="text-[10px] font-medium text-slate-500">{item.name}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
