import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, User, HandHeart, Newspaper, Users, MessageCircle, Loader2, Calendar } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Toaster } from 'sonner';
import SwipeableTabs from '@/components/common/SwipeableTabs';
import AIChatBubble from '@/components/common/AIChatBubble';
import PWAInstallPrompt from '@/components/common/PWAInstallPrompt';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

// Lazy load main pages
const Feed = lazy(() => import('@/pages/Feed'));
const Communities = lazy(() => import('@/pages/Communities'));
const MitzvahCircle = lazy(() => import('@/pages/MitzvahCircle'));
const Profile = lazy(() => import('@/pages/Profile'));

const navItems = [
  { name: 'Feed', icon: Home, page: 'Feed', color: 'blue' },
  { name: 'Mitzvah', icon: HandHeart, page: 'MitzvahCircle', color: 'purple' },
  { name: 'Communities', icon: Users, page: 'Communities', color: 'teal' },
  { name: 'Messages', icon: MessageCircle, page: 'Messages', color: 'blue' },
  { name: 'Profile', icon: User, page: 'Profile', color: 'slate' },
];

const colorStyles = {
        blue: {
          active: 'text-[#0F5ED7]',
          inactive: 'text-slate-400'
        },
        cyan: {
          active: 'text-[#0F5ED7]',
          inactive: 'text-slate-400'
        },
        orange: {
          active: 'text-[#0F5ED7]',
          inactive: 'text-slate-400'
        },
        purple: {
          active: 'text-[#0F5ED7]',
          inactive: 'text-slate-400'
        },
        teal: {
          active: 'text-[#0F5ED7]',
          inactive: 'text-slate-400'
        },
        slate: {
          active: 'text-[#0F5ED7]',
          inactive: 'text-slate-400'
        }
      };

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isChatOpen = currentPageName === 'Messages' && new URLSearchParams(location.search).get('chat') === '1';
  const hideNav = ['Settings', 'ShulPage'].includes(currentPageName) || isChatOpen;
  const hideBottomPadding = false;
  const navContainerRef = useRef(null);
  const navItemRefs = useRef({});
  const [pillStyle, setPillStyle] = useState({ left: 0, opacity: 0 });
  const [currentUser, setCurrentUser] = useState(null);

  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    base44.auth.me().then(u => setCurrentUser(u)).catch(() => {});
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
        const convs = await base44.entities.Conversation.list('-updated_date', 30);
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

  useEffect(() => {
    const recalculate = () => {
      const activeItem = navItemRefs.current[currentPageName];
      const container = navContainerRef.current;
      if (!activeItem || !container) return;
      const itemRect = activeItem.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const left = itemRect.left - containerRect.left + itemRect.width / 2;
      setPillStyle({ left, opacity: 1 });
    };

    recalculate();
    window.addEventListener('resize', recalculate);
    return () => window.removeEventListener('resize', recalculate);
  }, [currentPageName]);
  
  const swipeablePages = ['Feed', 'MitzvahCircle', 'Communities', 'Profile'];
  const currentIndex = swipeablePages.indexOf(currentPageName);
  const isSwipeable = currentIndex !== -1;

  const handleTabChange = (newIndex) => {
    if (newIndex >= 0 && newIndex < swipeablePages.length) {
      navigate(createPageUrl(swipeablePages[newIndex]));
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#F8FAFC' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', system-ui, sans-serif; background: #F8FAFC; -webkit-font-smoothing: antialiased; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
        .skeleton { background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%); background-size: 800px 100%; animation: shimmer 1.4s infinite linear; border-radius: 8px; }
        .tab-fade-in { animation: tabFade 160ms ease both; }
        @keyframes tabFade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <Toaster position="top-center" richColors />
      <PWAInstallPrompt />

      {/* Main Content */}
      <main className="min-h-screen overflow-visible">
        {isSwipeable ? (
          <SwipeableTabs 
            tabs={['Feed', 'Mitzvah', 'Communities', 'Profile']}
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
              <Profile />
            </Suspense>
          </SwipeableTabs>
        ) : (
          children
        )}
      </main>

      {/* Bottom Navigation */}
      {!hideNav && (
        <nav
          className="fixed bottom-0 left-0 right-0 bg-white z-50"
          style={{ boxShadow: '0 -1px 0 #E2E8F0', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="max-w-2xl mx-auto" ref={navContainerRef} style={{ position: 'relative' }}>
            {/* Sliding pill highlight */}
            <div
              style={{
                position: 'absolute',
                top: '5px',
                left: pillStyle.left,
                width: '36px',
                height: '24px',
                transform: 'translateX(-50%)',
                background: 'rgba(37,99,235,0.10)',
                borderRadius: '10px',
                opacity: pillStyle.opacity,
                transition: 'left 180ms ease, opacity 120ms ease',
                pointerEvents: 'none',
              }}
            />
            <div className="flex items-center justify-around px-1">
              {navItems.map((item) => {
                const isActive = currentPageName === item.page;
                const Icon = item.icon;
                return (
                  <button
                    key={item.page}
                    ref={el => { navItemRefs.current[item.page] = el; }}
                    onClick={() => {
                      const pageIndex = swipeablePages.indexOf(item.page);
                      if (pageIndex !== -1) {
                        handleTabChange(pageIndex);
                      } else {
                        navigate(createPageUrl(item.page));
                      }
                    }}
                    className="flex flex-col items-center justify-center transition-all relative touch-manipulation"
                    style={{ WebkitTapHighlightColor: 'transparent', minHeight: '48px', minWidth: '52px', paddingTop: 8, paddingBottom: 6 }}
                  >
                    <div className="relative">
                      <Icon
                        style={{ width: 20, height: 20 }}
                        className={`relative z-10 transition-all duration-150 ${
                          isActive ? 'text-[#2563EB]' : 'text-[#94A3B8]'
                        }`}
                        strokeWidth={isActive ? 2.4 : 1.8}
                      />
                      {item.page === 'Messages' && unreadMessages > 0 && (
                        <span className="absolute -top-1 -right-2 min-w-[14px] h-3.5 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                          {unreadMessages > 9 ? '9+' : unreadMessages}
                        </span>
                      )}
                    </div>
                    <span
                      className="relative z-10 transition-all duration-150"
                      style={{
                        fontSize: 10,
                        marginTop: 3,
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? '#2563EB' : '#94A3B8',
                        letterSpacing: '0.01em',
                      }}
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