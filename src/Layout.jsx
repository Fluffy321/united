import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, User, HandHeart, Newspaper, Users, MessageCircle, Loader2, Calendar } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Toaster } from 'sonner';
import SwipeableTabs from '@/components/common/SwipeableTabs';
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
  const hideNav = ['Settings', 'ShulPage'].includes(currentPageName);
  const hideBottomPadding = false;
  const navContainerRef = useRef(null);
  const navItemRefs = useRef({});
  const [pillStyle, setPillStyle] = useState({ left: 0, opacity: 0 });
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setCurrentUser(u)).catch(() => {});
  }, []);

  const { data: unreadMessages = 0 } = useQuery({
    queryKey: ['unread-messages', currentUser?.id],
    queryFn: async () => {
      const convs = await base44.entities.Conversation.list('-updated_date', 30);
      const userConvs = convs.filter(c => c.participant_ids?.includes(currentUser.id));
      return userConvs.reduce((sum, c) => sum + (c.unread_count?.[currentUser.id] || 0), 0);
    },
    enabled: !!currentUser,
    refetchInterval: 120000,
    staleTime: 60000,
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
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body { font-family: 'Inter', system-ui, sans-serif; background: #F0F6FF; -webkit-font-smoothing: antialiased; }
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
          @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
          .skeleton { background: linear-gradient(90deg, #F2F4F7 25%, #E9EBF0 50%, #F2F4F7 75%); background-size: 800px 100%; animation: shimmer 1.4s infinite linear; border-radius: 8px; }
          .tab-fade-in { animation: tabFade 160ms ease both; }
          @keyframes tabFade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>

      <Toaster position="top-center" richColors />

      {/* Main Content */}
      <main className={!hideBottomPadding ? 'h-screen' : 'h-screen'}>
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
        <nav className="fixed bottom-0 left-0 right-0 bg-white z-50" style={{ boxShadow: '0 -1px 0 #E8ECF4, 0 -4px 16px rgba(15,23,42,0.06)' }}>
          <div className="max-w-2xl mx-auto px-4" ref={navContainerRef}>
            {/* Sliding pill highlight */}
            <div
              style={{
                position: 'absolute',
                top: '6px',
                left: pillStyle.left,
                width: '40px',
                height: '28px',
                transform: 'translateX(-50%)',
                background: 'rgba(37,99,235,0.08)',
                borderRadius: '12px',
                opacity: pillStyle.opacity,
                transition: 'left 180ms ease, opacity 120ms ease',
                pointerEvents: 'none',
              }}
            />
            <div className="flex items-center justify-center gap-2 px-2">
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

                    className="flex flex-col items-center justify-center py-2.5 px-3 transition-all relative"
                  >
                    <div className="relative">
                      <Icon className={`w-5 h-5 relative z-10 transition-all duration-150 ${
                        isActive
                          ? 'stroke-[2.5px] text-[#2563EB]'
                          : 'stroke-[1.75px] text-[#6B7280]'
                      }`} />
                      {item.page === 'Messages' && unreadMessages > 0 && (
                        <span className="absolute -top-1 -right-2 min-w-[14px] h-3.5 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                          {unreadMessages > 9 ? '9+' : unreadMessages}
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] mt-1 relative z-10 transition-all duration-150 ${
                      isActive ? 'font-bold text-[#2563EB]' : 'font-medium text-[#6B7280]'
                    }`}>
                      {item.name}
                    </span>
                  </button>
                );
              })}


            </div>
          </div>

          {/* Safe area for iOS */}
          <div className="h-safe-area-inset-bottom bg-white" />
        </nav>
      )}
    </div>
  );
}