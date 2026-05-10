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
 *
 * NON-MVP PAGES: Groups, News, Organization, ShulPage, MyEvents, CommunityUpdates,
 * AdminSeedControl (admin-only), Events, BusinessDirectory, BusinessListing,
 * SupportJUnited, YahrzeitManager, RefuahList are intentionally excluded.
 * See FutureFeatures page (admin-only) for the full list and task prompts.
 */
import { lazy } from 'react';
import __Layout from './Layout.jsx';

const AdminModerationQueue = lazy(() => import('./pages/AdminModerationQueue'));
const AdminSeedControl     = lazy(() => import('./pages/AdminSeedControl'));
const Notifications        = lazy(() => import('./pages/Notifications'));
const Communities          = lazy(() => import('./pages/Communities'));
const Feed                 = lazy(() => import('./pages/Feed'));
const InviteJoin           = lazy(() => import('./pages/InviteJoin'));
const Messages             = lazy(() => import('./pages/Messages'));
const MitzvahCircle        = lazy(() => import('./pages/MitzvahCircle'));
const Profile              = lazy(() => import('./pages/Profile'));
const Settings             = lazy(() => import('./pages/Settings'));

export const PAGES = {
  AdminModerationQueue,
  AdminSeedControl,
  Notifications,
  Communities,
  Feed,
  InviteJoin,
  Messages,
  MitzvahCircle,
  Profile,
  Settings,
};

export const pagesConfig = {
  mainPage: 'Feed',
  Pages: PAGES,
  Layout: __Layout,
};
