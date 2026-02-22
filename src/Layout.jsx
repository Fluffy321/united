import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, User, HandHeart, Newspaper, Users, Loader2 } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Toaster } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import SwipeableTabs from '@/components/common/SwipeableTabs';

// Lazy load main pages
const Feed = lazy(() => import('@/pages/Feed'));
const CommunityUpdates = lazy(() => import('@/pages/CommunityUpdates'));
const Communities = lazy(() => import('@/pages/Communities'));
const MitzvahCircle = lazy(() => import('@/pages/MitzvahCircle'));
const Profile = lazy(() => import('@/pages/Profile'));

const navItems = [
  { name: 'Feed', icon: Home, page: 'Feed', color: 'blue' },
  { name: 'Updates', icon: Newspaper, page: 'CommunityUpdates', color: 'cyan' },
  { name: 'Communities', icon: Users, page: 'Communities', color: 'teal' },
  { name: 'Mitzvah', icon: HandHeart, page: 'MitzvahCircle', color: 'purple' },
  { name: 'Profile', icon: User, page: 'Profile', color: 'slate' }
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
  const hideNav = ['Settings', 'ShulPage', 'Messages'].includes(currentPageName);
  const hideBottomPadding = ['Messages'].includes(currentPageName);
  
  const swipeablePages = ['Feed', 'CommunityUpdates', 'Communities', 'MitzvahCircle', 'Profile'];
  const currentIndex = swipeablePages.indexOf(currentPageName);
  const isSwipeable = currentIndex !== -1;

  const handleTabChange = (newIndex) => {
    if (newIndex >= 0 && newIndex < swipeablePages.length) {
      navigate(createPageUrl(swipeablePages[newIndex]));
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body { font-family: 'Inter', system-ui, sans-serif; background: #F5F7FB; -webkit-font-smoothing: antialiased; }
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
            tabs={['Feed', 'Updates', 'Communities', 'Mitzvah', 'Profile']}
            activeIndex={currentIndex}
            onIndexChange={handleTabChange}
          >
            <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#0F5ED7]" /></div>}>
              <Feed />
            </Suspense>
            <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#0F5ED7]" /></div>}>
              <CommunityUpdates />
            </Suspense>
            <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#0F5ED7]" /></div>}>
              <Communities />
            </Suspense>
            <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#0F5ED7]" /></div>}>
              <MitzvahCircle isActive={currentIndex === 3} />
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
          <div className="max-w-2xl mx-auto px-4">
            <div className="flex items-center justify-around">
              {navItems.map((item) => {
                      const isActive = currentPageName === item.page;
                      const Icon = item.icon;

                      return (
                        <button 
                          key={item.page}
                          onClick={() => {
                            const pageIndex = swipeablePages.indexOf(item.page);
                            if (pageIndex !== -1) {
                              handleTabChange(pageIndex);
                            } else {
                              navigate(createPageUrl(item.page));
                            }
                          }}
                          className="flex flex-col items-center py-2.5 px-4 transition-all relative flex-1"
                        >
                          {isActive && (
                            <motion.div
                              layoutId="navPill"
                              className="absolute top-1.5 left-1/2 -translate-x-1/2 w-10 h-7 bg-[#0F1C2E]/[0.06] rounded-xl"
                              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                            />
                          )}
                          <Icon className={`w-5 h-5 relative z-10 transition-all duration-150 ${
                            isActive 
                              ? 'stroke-[2.5px] text-[#0F1C2E]' 
                              : 'stroke-[1.75px] text-slate-400'
                          }`} />
                          <span className={`text-[10px] mt-1 relative z-10 transition-all duration-150 ${
                            isActive ? 'font-700 font-bold text-[#0F1C2E]' : 'font-medium text-slate-400'
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