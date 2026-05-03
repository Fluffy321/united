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
]);

export default function PageTransition({ children }) {
  const location = useLocation();

  if (bottomNavPaths.has(location.pathname)) {
    return <>{children}</>;
  }

  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
