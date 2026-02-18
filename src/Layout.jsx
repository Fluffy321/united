import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Clipboard, MessageCircle, User, HandHeart, Newspaper, Users, Loader2 } from 'lucide-react';
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
    <div className="min-h-screen bg-white">
      <style>{`
        :root {
          --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
          --primary-blue: #0F5ED7;
          --accent-blue: #E6F0FF;
          --card-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          --text-body: #5F6B7A;
        }

        body {
          font-family: var(--font-sans);
          -webkit-font-smoothing: antialiased;
          background-color: #F8FAFB;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .primary-btn {
          background-color: var(--primary-blue);
          color: white;
          font-weight: 600;
          border-radius: 16px;
        }

        .primary-btn:hover {
          background-color: #0D4EB8;
        }

        .card-modern {
          background: white;
          border: none;
          border-bottom: 1px solid #F0F1F3;
          border-radius: 0;
          box-shadow: none;
        }

        .section-spacing {
          margin-bottom: 32px;
        }
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
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-50" style={{ boxShadow: '0 -1px 3px rgba(0,0,0,0.03)' }}>
          <div className="max-w-2xl mx-auto px-4">
            <div className="flex items-center justify-around gap-2">
              {navItems.map((item, idx) => {
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
                    className="flex flex-col items-center py-3 px-3 transition-all relative"
                  >
                    <Icon className={`w-6 h-6 ${
                      isActive 
                        ? 'stroke-[2.5px] text-[#0F5ED7]' 
                        : 'stroke-[2px] text-slate-400'
                    }`} />
                    <span className={`text-[10px] mt-1.5 ${
                      isActive ? 'font-bold text-[#0F5ED7]' : 'font-medium text-slate-500'
                    }`}>
                      {item.name}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#0F5ED7] rounded-full"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
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