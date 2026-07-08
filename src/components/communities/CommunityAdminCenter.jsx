import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, LayoutDashboard, BarChart2, Users, Settings,
  ShieldCheck,
  ShieldAlert, Gavel, Activity,
  Pin, CreditCard,
  LayoutGrid, Palette,
  ClipboardList,
  ShoppingBag,
} from 'lucide-react';
import AdminFormsTab from './admin/AdminFormsTab';
import StoreAdminTab from './admin/StoreAdminTab';
import OverviewTab from './admin/OverviewTab';
import BillingTab from './admin/BillingTab';
import AnalyticsTab from './admin/AnalyticsTab';
import ContentTab from './admin/ContentTab';
import MembersTab from './admin/MembersTab';
import ModerationTab from './admin/ModerationTab';
import LocalUpdatesTab from './admin/LocalUpdatesTab';
import AppealsTab from './admin/AppealsTab';
import LayoutTab from './admin/LayoutTab';
import BrandingTab from './admin/BrandingTab';
import SettingsTab from './admin/SettingsTab';

export { default as AppealSubmitModal } from './admin/AppealSubmitModal';

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'overview',    label: 'Overview',    Icon: LayoutDashboard },
  { key: 'billing',     label: 'Billing',     Icon: CreditCard },
  { key: 'analytics',   label: 'Analytics',   Icon: BarChart2 },
  { key: 'content',     label: 'Content',     Icon: Pin },
  { key: 'members',     label: 'Members',     Icon: Users },
  { key: 'forms',       label: 'Forms',       Icon: ClipboardList },
  { key: 'store',       label: 'Store',       Icon: ShoppingBag },
  { key: 'localUpdates', label: 'Updates',    Icon: Activity },
  { key: 'moderation',  label: 'Moderation',  Icon: ShieldAlert },
  { key: 'appeals',     label: 'Appeals',     Icon: Gavel },
  { key: 'layout',      label: 'Layout',      Icon: LayoutGrid },
  { key: 'branding',    label: 'Branding',    Icon: Palette },
  { key: 'settings',    label: 'Settings',    Icon: Settings },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function CommunityAdminCenter({
  community,
  currentUser,
  open,
  onClose,
  onCommunityUpdated,
  onDeleted,
  initialTab = 'overview',
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const communityId = community?.id;

  useEffect(() => {
    if (open) setActiveTab(initialTab);
  }, [open, initialTab]);

  if (!open || typeof document === 'undefined') return null;

  const tabProps = { communityId, community, currentUser, onNavigateTo: setActiveTab, onCommunityUpdated, onDeleted };

  return createPortal(
    <div className="fixed inset-0 z-[110] flex flex-col bg-[#F8FAFB]">
      {/* Header */}
      <header className="shrink-0 bg-white border-b border-slate-100 px-4 pt-4 pb-0">
        <div className="flex items-center gap-3 mb-3">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 flex-shrink-0"
            aria-label="Close admin center"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-blue-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin Center
            </p>
            <h1 className="text-[17px] font-black text-slate-950 leading-tight truncate">{community?.name}</h1>
          </div>
        </div>

        {/* Tab bar */}
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex min-w-max gap-1 pb-0">
            {TABS.map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-semibold whitespace-nowrap transition-colors relative ${
                  activeTab === key ? 'text-[#2563EB]' : 'text-slate-500'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                {activeTab === key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Tab content */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'overview'   && <OverviewTab   {...tabProps} />}
        {activeTab === 'billing'    && <BillingTab    {...tabProps} />}
        {activeTab === 'analytics'  && <AnalyticsTab  {...tabProps} />}
        {activeTab === 'content'    && <ContentTab    {...tabProps} />}
        {activeTab === 'members'    && <MembersTab    {...tabProps} />}
        {activeTab === 'forms'      && <AdminFormsTab {...tabProps} />}
        {activeTab === 'store'      && <StoreAdminTab {...tabProps} />}
        {activeTab === 'localUpdates' && <LocalUpdatesTab {...tabProps} />}
        {activeTab === 'moderation' && <ModerationTab {...tabProps} />}
        {activeTab === 'appeals'    && <AppealsTab    {...tabProps} />}
        {activeTab === 'layout'     && <LayoutTab     {...tabProps} onCommunityUpdated={onCommunityUpdated} />}
        {activeTab === 'branding'   && <BrandingTab   {...tabProps} onCommunityUpdated={onCommunityUpdated} />}
        {activeTab === 'settings'   && (
          <SettingsTab {...tabProps} onCommunityUpdated={onCommunityUpdated} onClose={onClose} onDeleted={onDeleted} />
        )}
      </main>
    </div>,
    document.body
  );
}
