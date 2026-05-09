import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, User, Users, MessageCircle } from 'lucide-react';
import { MitzvahIcon } from '@/components/common/JIcons';
import { createPageUrl } from '@/utils';
import { Toaster } from 'sonner';
import SwipeableTabs from '@/components/common/SwipeableTabs';
import PWAInstallPrompt from '@/components/common/PWAInstallPrompt';
import CookieConsentBanner from '@/components/common/CookieConsentBanner';
import { dataService } from '@/services';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import AppErrorBoundary from '@/components/common/AppErrorBoundary';

// Lazy load main pages
const Feed = lazy(() => import('@/pages/Feed'));
const Communities = lazy(() => import('@/pages/Communities'));
const MitzvahCircle = lazy(() => import('@/pages/MitzvahCircle'));
const Messages = lazy(() => import('@/pages/Messages'));
const Profile = lazy(() => import('@/pages/Profile'));

const navItems = [
  { name: 'Feed', icon: Home, page: 'Feed' },
  { name: 'Mitzvah', icon: null, page: 'MitzvahCircle', isMitzvah: true },
  { name: 'Communities', icon: Users, page: 'Communities' },
  { name: 'Messages', icon: MessageCircle, page: 'Messages', showBadge: true },
  { name: 'Profile', icon: User, page: 'Profile' },
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

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isChatOpen = currentPageName === 'Messages' && new URLSearchParams(location.search).get('chat') === '1';
  const hideNav = ['Settings', 'ShulPage'].includes(currentPageName) || isChatOpen;
  const { user: currentUser } = useAuth();

  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    let scrollTimeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const currentScrollY = window.scrollY;
        setIsScrollingDown(currentScrollY > lastScrollY);
        setLastScrollY(currentScrollY);
      }, 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [lastScrollY]);

  const { data: unreadMessages = 0 } = useQuery({
    queryKey: ['unread-messages', currentUser?.id],
    queryFn: async () => {
      try {
        const convs = await dataService.entities.Conversation.list('-updated_date', 30);
        const userConvs = convs.filter(c => c.participant_ids?.includes(currentUser.id));
        return userConvs.reduce((sum, c) => sum + (c.unread_count?.[currentUser.id] || 0), 0);
      } catch (e) {
        return 0;
      }
    },
    enabled: !!currentUser,
    refetchInterval: 60000,
    staleTime: 30000,
    retry: 0,
    refetchOnWindowFocus: false
  });

  const swipeablePages = ['Feed', 'MitzvahCircle', 'Communities', 'Messages', 'Profile'];
  const currentIndex = swipeablePages.indexOf(currentPageName);
  const isSwipeable = currentIndex !== -1;

  const handleTabChange = (newIndex) => {
    if (newIndex >= 0 && newIndex < swipeablePages.length) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      navigate(createPageUrl(swipeablePages[newIndex]));
    }
  };

  return (
    <div className="app-page">
      <Toaster position="top-center" richColors />
      <PWAInstallPrompt />
      <CookieConsentBanner />

      {/* Main Content */}
      <main className="min-h-screen overflow-visible">
        {isSwipeable ? (
          <SwipeableTabs
            tabs={['Feed', 'Mitzvah', 'Communities', 'Messages', 'Profile']}
            activeIndex={currentIndex}
            onIndexChange={handleTabChange}
          >
            <AppErrorBoundary inline fallbackMessage="Feed could not load.">
              <Suspense fallback={<InlinePageSkeleton />}>
                <Feed />
              </Suspense>
            </AppErrorBoundary>
            <AppErrorBoundary inline fallbackMessage="Mitzvah Circle could not load.">
              <Suspense fallback={<InlinePageSkeleton />}>
                <MitzvahCircle isActive={currentIndex === 1} />
              </Suspense>
            </AppErrorBoundary>
            <AppErrorBoundary inline fallbackMessage="Communities could not load.">
              <Suspense fallback={<InlinePageSkeleton />}>
                <Communities />
              </Suspense>
            </AppErrorBoundary>
            <AppErrorBoundary inline fallbackMessage="Messages could not load.">
              <Suspense fallback={<InlinePageSkeleton />}>
                <Messages />
              </Suspense>
            </AppErrorBoundary>
            <AppErrorBoundary inline fallbackMessage="Profile could not load.">
              <Suspense fallback={<InlinePageSkeleton />}>
                <Profile />
              </Suspense>
            </AppErrorBoundary>
          </SwipeableTabs>
        ) : (
          children
        )}
      </main>

      {/* Bottom Navigation */}
      {!hideNav && (
        <nav className="app-bottom-nav fixed inset-x-0 bottom-0 z-50 px-3">
          <div
            className="mobile-page relative overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-[0_12px_30px_rgba(15,23,42,0.14)] backdrop-blur-xl"
          >
            {/* Active highlight now rendered per-button */}
            <div className="flex items-center justify-around px-1 py-1.5">
              {navItems.map((item) => {
                const isActive = currentPageName === item.page;
                const Icon = item.icon;
                const showBadge = item.showBadge && unreadMessages > 0;
                return (
                  <button
                    key={item.page}
                    onClick={() => {
                      const pageIndex = swipeablePages.indexOf(item.page);
                      if (item.page !== currentPageName) {
                        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
                      }
                      if (pageIndex !== -1) {
                        handleTabChange(pageIndex);
                      } else {
                        navigate(createPageUrl(item.page));
                      }
                    }}
                    className={`motion-press relative flex min-h-[58px] min-w-[54px] flex-1 flex-col items-center justify-center rounded-xl py-[7px] touch-manipulation transition-all duration-150 ${
                      isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-400 active:bg-slate-100'
                    }`}
                  >
                    {/* Active dot above icon */}
                    {isActive && (
                      <span
                        className="absolute left-1/2 top-1.5 h-1 w-1 -translate-x-1/2 rounded-full bg-blue-600"
                      />
                    )}
                    <div className="relative z-10">
                      {item.isMitzvah ? (
                        <MitzvahIcon
                          size={20}
                          strokeWidth={isActive ? 2.2 : 1.8}
                          className={`transition-all duration-150 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}
                        />
                      ) : (
                        <Icon
                          className={`h-[21px] w-[21px] transition-all duration-150 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}
                          strokeWidth={isActive ? 2.4 : 1.8}
                        />
                      )}
                      {showBadge && (
                        <span className="absolute -top-1 -right-2 min-w-[14px] h-3.5 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                          {unreadMessages > 9 ? '9+' : unreadMessages}
                        </span>
                      )}
                    </div>
                    <span
                      className={`relative z-10 mt-1 text-[10px] transition-all duration-150 ${
                        isActive ? 'font-bold text-blue-600' : 'font-normal text-slate-400'
                      }`}
                    >
                      {item.name}
                    </span>
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
