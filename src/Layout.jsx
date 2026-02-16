import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Clipboard, MessageCircle, User, HandHeart, Newspaper, Users } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Toaster } from 'sonner';

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
  const hideNav = ['Settings', 'ShulPage'].includes(currentPageName);
  const hideBottomPadding = ['Messages'].includes(currentPageName);
  const wideNav = navItems.length > 4;

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
        {children}
      </main>

      {/* Bottom Navigation */}
      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-50" style={{ boxShadow: '0 -2px 8px rgba(0,0,0,0.04)' }}>
          <div className="max-w-2xl mx-auto px-4">
            <div className="flex items-center justify-around py-3 gap-2">
              {navItems.map(item => {
                const isActive = currentPageName === item.page;
                const Icon = item.icon;
                const styles = colorStyles[item.color];

                return (
                  <Link 
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className={`flex flex-col items-center py-2 px-4 rounded-lg transition-all ${
                      isActive 
                        ? styles.active + ' font-bold'
                        : styles.inactive + ' font-medium hover:text-slate-600'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
                    <span className="text-[11px] mt-1.5">
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