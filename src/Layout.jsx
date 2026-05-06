import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, User, Users, MessageCircle, Loader2 } from 'lucide-react';
import { MitzvahIcon } from '@/components/common/JIcons';
import { createPageUrl } from '@/utils';
import { Toaster } from 'sonner';
import SwipeableTabs from '@/components/common/SwipeableTabs';
import PWAInstallPrompt from '@/components/common/PWAInstallPrompt';
import CookieConsentBanner from '@/components/common/CookieConsentBanner';
import { dataService } from '@/services';
import { useQuery } from '@tanstack/react-query';

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

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isChatOpen = currentPageName === 'Messages' && new URLSearchParams(location.search).get('chat') === '1';
  const hideNav = ['Settings', 'ShulPage'].includes(currentPageName) || isChatOpen;
  const [currentUser, setCurrentUser] = useState(null);

  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    dataService.auth.me().then(u => setCurrentUser(u)).catch(() => {});
  }, []);

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
        <div className="mx-auto max-w-2xl px-3 pt-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-semibold leading-5 text-amber-900">
            Safety note: some tools are still demo-only while Supabase is being finished. Payment, AI, account deletion, and Chesed verification screens are labeled and will not process money or permanently save demo records yet.
          </div>
        </div>
        {isSwipeable ? (
          <SwipeableTabs
            tabs={['Feed', 'Mitzvah', 'Communities', 'Messages', 'Profile']}
            activeIndex={currentIndex}
            onIndexChange={handleTabChange}
          >
            <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#0F5ED7]" /></div>}>
              <Feed />
            </Suspense>
            <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#0F5ED7]" /></div>}>
              <MitzvahCircle isActive={currentIndex === 1} />
            </Suspense>
            <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#0F5ED7]" /></div>}>
              <Communities />
            </Suspense>
            <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#0F5ED7]" /></div>}>
              <Messages />
            </Suspense>
            <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#0F5ED7]" /></div>}>
              <Profile />
            </Suspense>
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
                    className={`relative flex min-h-[58px] min-w-[54px] flex-1 flex-col items-center justify-center rounded-xl py-[7px] touch-manipulation transition-all duration-150 ${
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
