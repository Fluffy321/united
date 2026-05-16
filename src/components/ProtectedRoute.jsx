import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-[#F6F8FB]">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
  </div>
);

const getLoginReturnPath = (location) => {
  return `${location.pathname}${location.search || ''}`;
};

export default function ProtectedRoute({ fallback = <DefaultFallback /> }) {
  const { isAuthenticated, isLoadingAuth, authError } = useAuth();
  const location = useLocation();

  if (isLoadingAuth) return fallback;

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    const fromUrl = getLoginReturnPath(location);
    return <Navigate to={`/login?from_url=${encodeURIComponent(fromUrl)}`} replace />;
  }

  if (!isAuthenticated) {
    const fromUrl = getLoginReturnPath(location);
    return <Navigate to={`/login?from_url=${encodeURIComponent(fromUrl)}`} replace />;
  }

  return <Outlet />;
}
