/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminModerationQueue from './pages/AdminModerationQueue';
import AdminSeedControl from './pages/AdminSeedControl';
import Communities from './pages/Communities';
import CommunityUpdates from './pages/CommunityUpdates';
import Feed from './pages/Feed';
import Messages from './pages/Messages';
import MitzvahCircle from './pages/MitzvahCircle';
import News from './pages/News';
import Organization from './pages/Organization';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import ShulPage from './pages/ShulPage';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminModerationQueue": AdminModerationQueue,
    "AdminSeedControl": AdminSeedControl,
    "Communities": Communities,
    "CommunityUpdates": CommunityUpdates,
    "Feed": Feed,
    "Messages": Messages,
    "MitzvahCircle": MitzvahCircle,
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