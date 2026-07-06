import { createPortal } from 'react-dom';
import { Home } from 'lucide-react';
import { getCommunityTabLabel } from '@/lib/communityTypes';
import { TAB_ICON_MAP } from './shared';

export default function CommunityNavDrawer({ community, visibleTabs, activeTab, tabsWithCounts, onTabChange, onClose, accentHex, isAdmin, onManage }) {
  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        opacity: 1,
        pointerEvents: 'all',
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(2px)',
        }}
        onClick={onClose}
      />

      {/* Drawer panel — slides in from right */}
      <div
        style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: '72%', maxWidth: 320,
          background: '#fff',
          display: 'flex', flexDirection: 'column',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.18)',
          animation: 'communityDrawerIn .28s cubic-bezier(.32,.72,0,1) both',
        }}
      >
        <style>{`
          @keyframes communityDrawerIn {
            from { transform: translateX(102%); }
            to { transform: translateX(0); }
          }
          @keyframes communityDrawerOut {
            from { transform: translateX(0); }
            to { transform: translateX(102%); }
          }
        `}</style>

        {/* Drawer header */}
        <div style={{ padding: '52px 20px 16px', borderBottom: '1px solid #f1f5f9' }}>
          {community.logo_url ? (
            <img
              src={community.logo_url}
              alt=""
              style={{ width: 42, height: 42, borderRadius: 12, objectFit: 'cover', marginBottom: 10 }}
            />
          ) : (
            <div
              style={{
                width: 42, height: 42, borderRadius: 12, background: accentHex,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 10,
              }}
            >
              {(community.name || '?')[0].toUpperCase()}
            </div>
          )}
          <p style={{ fontSize: 16, fontWeight: 900, color: '#0d0d0b', letterSpacing: '-0.02em', marginBottom: 2 }}>
            {community.name}
          </p>
          <p style={{ fontSize: 12, color: '#8c8884', fontWeight: 500 }}>
            {community.type}{community.follower_count ? ` · ${community.follower_count.toLocaleString()} members` : ''}
          </p>
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {visibleTabs.map((tabKey) => {
            const TabIcon = TAB_ICON_MAP[tabKey] || Home;
            const isActive = activeTab === tabKey;
            const tabInfo = tabsWithCounts.find((t) => t.key === tabKey);
            return (
              <button
                key={tabKey}
                onClick={() => onTabChange(tabKey)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '13px 20px', width: '100%', textAlign: 'left',
                  background: isActive ? '#f9f8f6' : 'transparent',
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'background 0.1s',
                }}
              >
                <div
                  style={{
                    width: 36, height: 36, borderRadius: 11, flexShrink: 0,
                    background: isActive ? `${accentHex}22` : '#f4f4f2',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <TabIcon style={{ width: 18, height: 18, color: isActive ? accentHex : '#6b7280' }} />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#0d0d0b' }}>{getCommunityTabLabel(tabKey)}</p>
                  {tabInfo?.count > 0 && (
                    <p style={{ fontSize: 12, color: '#8c8884', marginTop: 1 }}>
                      {tabInfo.count} {tabKey === 'events' ? 'upcoming' : tabKey === 'announcements' ? 'updates' : ''}
                    </p>
                  )}
                </div>
              </button>
            );
          })}

          <div style={{ height: 1, background: '#ece9e4', margin: '6px 20px' }} />

          {isAdmin && (
            <button
              onClick={onManage}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '13px 20px', width: '100%', textAlign: 'left',
                background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <div
                style={{
                  width: 36, height: 36, borderRadius: 11, flexShrink: 0,
                  background: '#f4f4f2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}
              >
                ⚙️
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#0d0d0b' }}>Admin Center</p>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
