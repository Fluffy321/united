import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { COMMUNITIES_ENABLED } from '@/config/features';

const ROOT_ROUTES = ['/', '/Feed', '/Profile', '/MitzvahCircle', ...(COMMUNITIES_ENABLED ? ['/Communities'] : [])];

export function useNavigationStack() {
  const location = useLocation();
  const navigate = useNavigate();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    const isRoot = ROOT_ROUTES.includes(location.pathname);
    setCanGoBack(!isRoot && window.history.length > 1);
  }, [location.pathname]);

  const goBack = () => {
    if (canGoBack) {
      navigate(-1);
    }
  };

  return { canGoBack, goBack };
}
