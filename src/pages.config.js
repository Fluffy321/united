/**
 * pages.config.js - Page routing configuration
 *
 * Layout is imported eagerly — it's the navigation shell present on every page.
 * All pages are lazy-loaded so they split into separate chunks and only download
 * when first navigated to. This keeps the main bundle lean.
 *
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * The value must match a key in the PAGES object exactly.
 */
import { lazy } from 'react';
import __Layout from './Layout.jsx';

const AdminModerationQueue = lazy(() => import('./pages/AdminModerationQueue'));
const Notifications        = lazy(() => import('./pages/Notifications'));
const AdminSeedControl     = lazy(() => import('./pages/AdminSeedControl'));
const Communities          = lazy(() => import('./pages/Communities'));
const CommunityUpdates     = lazy(() => import('./pages/CommunityUpdates'));
const Feed                 = lazy(() => import('./pages/Feed'));
const Groups               = lazy(() => import('./pages/Groups'));
const InviteJoin           = lazy(() => import('./pages/InviteJoin'));
const Messages             = lazy(() => import('./pages/Messages'));
const MitzvahCircle        = lazy(() => import('./pages/MitzvahCircle'));
const MyEvents             = lazy(() => import('./pages/MyEvents'));
const News                 = lazy(() => import('./pages/News'));
const Organization         = lazy(() => import('./pages/Organization'));
const Profile              = lazy(() => import('./pages/Profile'));
const Settings             = lazy(() => import('./pages/Settings'));
const ShulPage             = lazy(() => import('./pages/ShulPage'));

export const PAGES = {
    "AdminModerationQueue": AdminModerationQueue,
    "Notifications": Notifications,
    "AdminSeedControl": AdminSeedControl,
    "Communities": Communities,
    "CommunityUpdates": CommunityUpdates,
    "Feed": Feed,
    "Groups": Groups,
    "InviteJoin": InviteJoin,
    "Messages": Messages,
    "MitzvahCircle": MitzvahCircle,
    "MyEvents": MyEvents,
    "News": News,
    "Organization": Organization,
    "Profile": Profile,
    "Settings": Settings,
    "ShulPage": ShulPage,
}

export const pagesConfig = {
    mainPage: "Feed",
    Pages: PAGES,
    Layout: __Layout,
};
