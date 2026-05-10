import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, LogOut, MapPinned, MessageCircle, Settings as SettingsIcon, User, Users, X } from 'lucide-react';
import { MitzvahIcon } from '@/components/common/JIcons';
import { createPageUrl } from '@/utils';
import { Toaster } from 'sonner';
import SwipeableTabs from '@/components/common/SwipeableTabs';
import PWAInstallPrompt from '@/components/common/PWAInstallPrompt';
import CookieConsentBanner from '@/components/common/CookieConsentBanner';
import { dataService, mitzvahReminderService } from '@/services';
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
  { key: 'Feed', name: 'Feed', icon: Home, page: 'Feed' },
  { key: 'Mitzvah', name: 'Mitzvah', icon: null, page: 'MitzvahCircle', to: '/MitzvahCircle', isMitzvah: true },
  { key: 'Map', name: 'Map', icon: MapPinned, page: 'MitzvahCircle', to: '/MitzvahCircle?tab=map', isMap: true },
  { key: 'Communities', name: 'Communities', icon: Users, page: 'Communities' },
  { key: 'Messages', name: 'Messages', icon: MessageCircle, page: 'Messages', showBadge: true },
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
  const { user: currentUser, logout } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

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

  const search = new URLSearchParams(location.search);
  const isMapTab = currentPageName === 'MitzvahCircle' && search.get('tab') === 'map';
  const activeNavKey = isMapTab ? 'Map' : currentPageName === 'MitzvahCircle' ? 'Mitzvah' : currentPageName;
  const swipeablePages = ['Feed', 'MitzvahCircle', 'Communities', 'Messages'];
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
            tabs={['Feed', 'Mitzvah', 'Communities', 'Messages']}
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
          </SwipeableTabs>
        ) : (
          children
        )}
      </main>

      {/* Bottom Navigation */}
      {!hideNav && (
        <>
          {profileMenuOpen && (
            <div className="fixed inset-0 z-[70] bg-slate-950/20 backdrop-blur-[2px]" onClick={() => setProfileMenuOpen(false)}>
              <div
                className="absolute bottom-[92px] right-3 w-[min(320px,calc(100vw-24px))] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl motion-soft-in"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-start gap-3 border-b border-slate-100 p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    {currentUser?.avatar_url ? (
                      <img src={currentUser.avatar_url} alt="" className="h-11 w-11 rounded-2xl object-cover" />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-black text-slate-950">{currentUser?.display_name || currentUser?.full_name || 'Profile'}</p>
                    <p className="truncate text-[12px] font-semibold text-slate-400">{currentUser?.email || 'Manage your JUnited account'}</p>
                  </div>
                  <button onClick={() => setProfileMenuOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-1 p-2">
                  <ProfileMenuButton icon={User} label="View Profile" onClick={() => { setProfileMenuOpen(false); navigate(createPageUrl('Profile')); }} />
                  <ProfileMenuButton icon={SettingsIcon} label="Settings" onClick={() => { setProfileMenuOpen(false); navigate(createPageUrl('Settings')); }} />
                  <ProfileMenuButton icon={LogOut} label="Log Out" tone="danger" onClick={() => { setProfileMenuOpen(false); logout?.(); }} />
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => setProfileMenuOpen(true)}
            className="motion-press fixed bottom-[88px] right-4 z-[55] flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-100 bg-white text-blue-700 shadow-lg"
            aria-label="Open profile menu"
          >
            {currentUser?.avatar_url ? (
              <img src={currentUser.avatar_url} alt="" className="h-10 w-10 rounded-[14px] object-cover" />
            ) : (
              <User className="h-5 w-5" />
            )}
          </button>

          <nav className="app-bottom-nav fixed inset-x-0 bottom-0 z-50 px-3">
            {/* Warm cream background with warm border — community feel */}
            <div className="mobile-page relative overflow-hidden rounded-2xl border border-[#E8E2D6] bg-[#FFFDF8]/96 shadow-[0_-1px_0_rgba(15,23,42,0.06),0_8px_32px_rgba(15,23,42,0.12)] backdrop-blur-xl">
              <div className="flex items-center justify-around px-1 py-1.5">
                {navItems.map((item) => {
                const isActive = activeNavKey === item.key;
                const Icon = item.icon;
                const showBadge = item.showBadge && unreadMessages > 0;
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
                    {/* Spring-animated pill — mounts on activation, springs in via CSS */}
                    {isActive && (
                      <span
                        className={`nav-active-pill absolute inset-1 rounded-[10px] ${item.isMitzvah ? 'nav-active-pill-mitzvah' : ''}`}
                      />
                    )}

                    {/* Icon — pops up when active */}
                    <div className={`relative z-10 ${isActive ? 'nav-icon-active' : ''}`}>
                      {item.isMitzvah ? (
                        <MitzvahIcon
                          size={20}
                          strokeWidth={isActive ? 2.2 : 1.8}
                          className={isActive ? 'text-blue-600' : 'text-slate-400'}
                        />
                      ) : (
                        <Icon
                          className={`h-[21px] w-[21px] ${isActive ? 'text-blue-600' : 'text-slate-400'}`}
                          strokeWidth={isActive ? 2.4 : 1.8}
                        />
                      )}
                      {showBadge && (
                        <span className="absolute -top-1 -right-2 min-w-[14px] h-3.5 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                          {unreadMessages > 9 ? '9+' : unreadMessages}
                        </span>
                      )}
                    </div>

                    {/* Label */}
                    <span
                      className={`relative z-10 mt-1 text-[10px] ${
                        isActive
                          ? 'font-bold text-blue-600'
                          : 'font-normal text-slate-400'
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

function ProfileMenuButton({ icon: Icon, label, onClick, tone = 'default' }) {
  const danger = tone === 'danger';
  return (
    <button
      onClick={onClick}
      className={`flex h-11 items-center gap-3 rounded-2xl px-3 text-left text-[13px] font-black transition ${
        danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
