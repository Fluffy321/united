import { base44, incrementCounter, togglePostLike, loadUserPostLikes, batchFetchByIds, checkRateLimit, RateLimitError } from '@/api/base44Client';
export { incrementCounter, togglePostLike, loadUserPostLikes, batchFetchByIds, checkRateLimit, RateLimitError };

// Thin compatibility layer.
// UI code should import this service instead of importing the backend bridge directly.
const auth = {
  me: (...args) => base44.auth.me(...args),
  updateMe: (...args) => base44.auth.updateMe(...args),
  signInWithPassword: (...args) => base44.auth.signInWithPassword(...args),
  signIn: (...args) => base44.auth.signInWithPassword(...args),
  signin: (...args) => base44.auth.signInWithPassword(...args),
  login: (...args) => base44.auth.signInWithPassword(...args),
  signUp: (...args) => {
    const signUp = base44.auth.signUp || base44.auth.signup;
    if (typeof signUp !== 'function') {
      throw new Error('Sign up is not connected yet. Please refresh the page and try again.');
    }
    return signUp.apply(base44.auth, args);
  },
  signup: (...args) => auth.signUp(...args),
  logout: (...args) => base44.auth.logout(...args),
  redirectToLogin: (...args) => base44.auth.redirectToLogin(...args),
};

export const dataService = {
  auth,
  entities: base44.entities,
  functions: base44.functions,
  integrations: base44.integrations,
  appLogs: base44.appLogs,
};

export default dataService;
