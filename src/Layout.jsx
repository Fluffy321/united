import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, MapPinned, User, Users } from 'lucide-react';
import { MitzvahIcon } from '@/components/common/JIcons';
import { createPageUrl } from '@/utils';
import { Toaster } from 'sonner';
import SwipeableTabs from '@/components/common/SwipeableTabs';
import PWAInstallPrompt from '@/components/common/PWAInstallPrompt';
import CookieConsentBanner from '@/components/common/CookieConsentBanner';
import { mitzvahReminderService } from '@/services';
import { useAuth } from '@/lib/AuthContext';
import AppErrorBoundary from '@/components/common/AppErrorBoundary';

// Lazy load main pages
const Feed = lazy(() => import('@/pages/Feed'));
const Communities = lazy(() => import('@/pages/Communities'));
const MitzvahCircle = lazy(() => import('@/pages/MitzvahCircle'));
const Profile = lazy(() => import('@/pages/Profile'));

const navItems = [
  { key: 'Feed',        name: 'Feed',        icon: Home,      page: 'Feed' },
  { key: 'Mitzvah',    name: 'Mitzvah',     icon: null,      page: 'MitzvahCircle', to: '/MitzvahCircle', isMitzvah: true },
  { key: 'Communities',name: 'Communities', icon: Users,     page: 'Communities' },
  { key: 'Map',        name: 'Map',         icon: MapPinned, page: 'MitzvahCircle', to: '/MitzvahCircle?tab=map', isMap: true },
  { key: 'Profile',    name: 'Profile',     icon: User,      page: 'Profile', isProfile: true },
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
    const enabled = Boolean(currentUser)
      && currentUser?.notification_settings?.mitzvahDailyReminders !== false
      && currentUser?.app_settings?.quietMode !== true;
    mitzvahReminderService.start({ enabled });
    return () => mitzvahReminderService.stop();
  }, [currentUser?.notification_settings?.mitzvahDailyReminders, currentUser?.app_settings?.quietMode]);

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

  const search = new URLSearchParams(location.search);
  const isMapTab = currentPageName === 'MitzvahCircle' && search.get('tab') === 'map';
  const activeNavKey = isMapTab ? 'Map' : currentPageName === 'MitzvahCircle' ? 'Mitzvah' : currentPageName;
  const swipeablePages = ['Feed', 'MitzvahCircle', 'Communities'];
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
            tabs={['Feed', 'Mitzvah', 'Communities']}
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
          </SwipeableTabs>
        ) : (
          children
        )}
      </main>

      {/* Bottom Navigation */}
      {!hideNav && (
        <>
          <nav className="app-bottom-nav fixed inset-x-0 bottom-0 z-50 px-3">
            {/* Warm cream background with warm border — community feel */}
            <div className="mobile-page relative overflow-hidden rounded-2xl border border-[#E8E2D6] bg-[#FFFDF8]/96 shadow-[0_-1px_0_rgba(15,23,42,0.06),0_8px_32px_rgba(15,23,42,0.12)] backdrop-blur-xl">
              <div className="flex items-center justify-around px-1 py-1.5">
                {navItems.map((item) => {
                const isActive = activeNavKey === item.key;
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
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
                    className={`motion-press relative flex min-h-[58px] min-w-[54px] flex-1 flex-col items-center justify-center rounded-xl py-[7px] touch-manipulation ${
                      isActive ? '' : 'text-slate-400 active:bg-slate-100/60'
                    }`}
                  >
                    {isActive && (
                      <span
                        className={`nav-active-pill absolute inset-1 rounded-[10px] ${item.isMitzvah ? 'nav-active-pill-mitzvah' : ''}`}
                      />
                    )}

                    <div className={`relative z-10 ${isActive ? 'nav-icon-active' : ''}`}>
                      {item.isMitzvah ? (
                        <MitzvahIcon
                          size={20}
                          strokeWidth={isActive ? 2.2 : 1.8}
                          className={isActive ? 'text-blue-600' : 'text-slate-400'}
                        />
                      ) : item.isProfile && currentUser?.avatar_url ? (
                        <img
                          src={currentUser.avatar_url}
                          alt=""
                          className={`h-[22px] w-[22px] rounded-full object-cover ${isActive ? 'ring-2 ring-blue-600' : 'ring-1 ring-slate-300'}`}
                        />
                      ) : (
                        <Icon
                          className={`h-[21px] w-[21px] ${isActive ? 'text-blue-600' : 'text-slate-400'}`}
                          strokeWidth={isActive ? 2.4 : 1.8}
                        />
                      )}
                    </div>

                    <span
                      className={`relative z-10 mt-1 text-[10px] ${
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
        </>
      )}
    </div>
  );
}

