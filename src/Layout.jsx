import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Clipboard, MessageCircle, User } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Toaster } from 'sonner';

const navItems = [
  { name: 'Feed', icon: Home, page: 'Feed' },
  { name: 'Chalkboard', icon: Clipboard, page: 'Chalkboard' },
  { name: 'Messages', icon: MessageCircle, page: 'Messages' },
  { name: 'Profile', icon: User, page: 'Profile' }
];

export default function Layout({ children, currentPageName }) {
  const hideNav = ['Settings'].includes(currentPageName);
  const hideBottomPadding = ['Messages'].includes(currentPageName);

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
          <div className="max-w-2xl mx-auto px-4">
            <div className="flex items-center justify-around py-2">
              {navItems.map(item => {
                const isActive = currentPageName === item.page;
                const Icon = item.icon;
                
                return (
                  <Link 
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all ${
                      isActive 
                        ? 'text-indigo-600' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                    <span className={`text-xs mt-1 ${isActive ? 'font-semibold' : 'font-medium'}`}>
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