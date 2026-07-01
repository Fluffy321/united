import { supabaseBackend, incrementCounter, togglePostLike, loadUserPostLikes, batchFetchByIds, checkRateLimit, RateLimitError } from '@/services/supabaseRepository';
export { incrementCounter, togglePostLike, loadUserPostLikes, batchFetchByIds, checkRateLimit, RateLimitError };

// Thin compatibility layer.
// UI code should import this service instead of importing the backend bridge directly.
const auth = {
  me: (...args) => supabaseBackend.auth.me(...args),
  updateMe: (...args) => supabaseBackend.auth.updateMe(...args),
  signInWithPassword: (...args) => supabaseBackend.auth.signInWithPassword(...args),
  signIn: (...args) => supabaseBackend.auth.signInWithPassword(...args),
  signin: (...args) => supabaseBackend.auth.signInWithPassword(...args),
  login: (...args) => supabaseBackend.auth.signInWithPassword(...args),
  signUp: (...args) => {
    const signUp = supabaseBackend.auth.signUp || supabaseBackend.auth.signup;
    if (typeof signUp !== 'function') {
      throw new Error('Sign up is not connected yet. Please refresh the page and try again.');
    }
    return signUp.apply(supabaseBackend.auth, args);
  },
  signup: (...args) => auth.signUp(...args),
  logout: (...args) => supabaseBackend.auth.logout(...args),
  redirectToLogin: (...args) => supabaseBackend.auth.redirectToLogin(...args),
};

export const dataService = {
  auth,
  functions: supabaseBackend.functions,
  integrations: supabaseBackend.integrations,
  appLogs: supabaseBackend.appLogs,
};

export default dataService;
