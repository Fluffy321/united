import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Clipboard, MessageCircle, User, HandHeart, Newspaper, Users } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Toaster } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [direction, setDirection] = useState(0);
  const hideNav = ['Settings', 'ShulPage', 'Messages'].includes(currentPageName);
  const hideBottomPadding = ['Messages'].includes(currentPageName);
  
  const swipeablePages = ['Feed', 'CommunityUpdates', 'Communities', 'MitzvahCircle', 'Profile'];
  const currentIndex = swipeablePages.indexOf(currentPageName);
  const isSwipeable = currentIndex !== -1;

  const handleSwipe = (newDirection) => {
    if (!isSwipeable) return;
    
    const newIndex = currentIndex + newDirection;
    if (newIndex >= 0 && newIndex < swipeablePages.length) {
      setDirection(newDirection);
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
          --card-shadow: 0 2px 8px rgba(15, 94, 215, 0.08);
        }

        body {
          font-family: var(--font-sans);
          -webkit-font-smoothing: antialiased;
          background-color: #FFFFFF;
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
        }

        .primary-btn:hover {
          background-color: #0D4EB8;
        }

        .card-modern {
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          box-shadow: var(--card-shadow);
        }
      `}</style>

      <Toaster position="top-center" richColors />

      {/* Main Content */}
      <main className={!hideBottomPadding ? 'pb-20' : ''}>
        {isSwipeable ? (
          <motion.div
            key={currentPageName}
            custom={direction}
            initial={{ x: direction > 0 ? '100%' : '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction > 0 ? '-100%' : '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = Math.abs(offset.x) * velocity.x;
              if (swipe > 10000) {
                handleSwipe(offset.x > 0 ? -1 : 1);
              } else if (Math.abs(offset.x) > 100) {
                handleSwipe(offset.x > 0 ? -1 : 1);
              }
            }}
            style={{ touchAction: 'pan-y' }}
          >
            {children}
          </motion.div>
        ) : (
          children
        )}
      </main>

      {/* Bottom Navigation */}
      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-50" style={{ boxShadow: '0 -1px 3px rgba(0,0,0,0.03)' }}>
          <div className="max-w-2xl mx-auto px-4">
            <div className="flex items-center justify-around gap-2">
              {navItems.map(item => {
                const isActive = currentPageName === item.page;
                const Icon = item.icon;

                return (
                  <Link 
                    key={item.page}
                    to={createPageUrl(item.page)}
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
                  </Link>
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