/**
 * pages.config.js - Page routing configuration
 *
 * Layout is imported eagerly — it's the navigation shell present on every page.
 * All pages are lazy-loaded so they split into separate chunks and only download
 * when first navigated to. This keeps the main bundle lean.
 *
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls the authenticated app fallback/legacy redirect page.
 * The public marketing homepage lives in src/pages/Landing.jsx and is served at /.
 * The value must match a key in the PAGES object exactly.
 *
 * ACTIVE APP PAGES: Feed, Communities, Map, Marketplace, Messages,
 * MitzvahCircle, Profile, Settings.
 *
 * Old standalone feature pages are intentionally excluded from this registry.
 * App.jsx keeps those URLs alive as redirects so beta users do not hit 404s.
 */
import { lazy } from 'react';
import __Layout from './Layout.jsx';
import { COMMUNITIES_ENABLED } from '@/config/features';

const Communities          = lazy(() => import('./pages/Communities'));
const Feed                 = lazy(() => import('./pages/Feed'));
const Map                  = lazy(() => import('./pages/Map'));
const Marketplace          = lazy(() => import('./pages/Marketplace'));
const Messages             = lazy(() => import('./pages/Messages'));
const MitzvahCircle        = lazy(() => import('./pages/MitzvahCircle'));
const Profile              = lazy(() => import('./pages/Profile'));
const Settings             = lazy(() => import('./pages/Settings'));

export const PAGES = {
  Feed,
  Map,
  Marketplace,
  Messages,
  MitzvahCircle,
  Profile,
  Settings,
  ...(COMMUNITIES_ENABLED ? { Communities } : {}),
};

export const pagesConfig = {
  mainPage: 'Feed',
  Pages: PAGES,
  Layout: __Layout,
};
