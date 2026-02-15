import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Clipboard, MessageCircle, User, HandHeart, Newspaper } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Toaster } from 'sonner';

const navItems = [
  { name: 'Feed', icon: Home, page: 'Feed', color: 'blue' },
  { name: 'Updates', icon: Newspaper, page: 'CommunityUpdates', color: 'cyan' },
  { name: 'Chalkboard', icon: Clipboard, page: 'Chalkboard', color: 'orange' },
  { name: 'Mitzvah', icon: HandHeart, page: 'MitzvahCircle', color: 'purple' },
  { name: 'Profile', icon: User, page: 'Profile', color: 'slate' }
];

const colorStyles = {
  blue: {
    active: 'bg-blue-600 text-white',
    inactive: 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
  },
  cyan: {
    active: 'bg-cyan-600 text-white',
    inactive: 'text-slate-400 hover:text-cyan-600 hover:bg-cyan-50'
  },
  orange: {
    active: 'bg-orange-500 text-white',
    inactive: 'text-slate-400 hover:text-orange-500 hover:bg-orange-50'
  },
  purple: {
    active: 'bg-purple-600 text-white',
    inactive: 'text-slate-400 hover:text-purple-600 hover:bg-purple-50'
  },
  teal: {
    active: 'bg-teal-600 text-white',
    inactive: 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'
  },
  slate: {
    active: 'bg-slate-700 text-white',
    inactive: 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
  }
};

export default function Layout({ children, currentPageName }) {
  const hideNav = ['Settings'].includes(currentPageName);
  const hideBottomPadding = ['Messages'].includes(currentPageName);
  const wideNav = navItems.length > 4;

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        :root {
          --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
        }
        
        body {
          font-family: var(--font-sans);
          -webkit-font-smoothing: antialiased;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <Toaster position="top-center" richColors />

      {/* Main Content */}
      <main className={!hideBottomPadding ? 'pb-20' : ''}>
        {children}
      </main>

      {/* Bottom Navigation */}
      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
          <div className="max-w-2xl mx-auto px-3">
            <div className="flex items-center justify-around py-2.5 gap-1">
              {navItems.map(item => {
                const isActive = currentPageName === item.page;
                const Icon = item.icon;
                const styles = colorStyles[item.color];

                return (
                  <Link 
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className={`flex flex-col items-center py-2.5 px-3 rounded-xl transition-all ${
                      isActive 
                        ? styles.active
                        : styles.inactive
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
                    <span className={`text-[11px] mt-1 ${isActive ? 'font-bold' : 'font-semibold'}`}>
                      {item.name}
                    </span>
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