import React, { useEffect } from 'react';

export default function ThemeProvider({ children }) {
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.dataset.theme = 'light';
  }, []);

  return <>{children}</>;
}
