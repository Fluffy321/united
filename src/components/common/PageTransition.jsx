import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const bottomNavPaths = new Set([
  '/',
  '/Feed',
  '/MitzvahCircle',
  '/Communities',
  '/Messages',
  '/Profile',
  '/Map',
]);

export default function PageTransition({ children }) {
  const location = useLocation();

  if (bottomNavPaths.has(location.pathname)) {
    return <>{children}</>;
  }

  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      style={{ willChange: 'opacity, transform' }}
    >
      {children}
    </motion.div>
  );
}
