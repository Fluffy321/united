import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const FloatingActionsContext = createContext(null);

export function FloatingActionsProvider({ children }) {
  const [actions, setActions] = useState({});

  const registerFloatingAction = useCallback((id, action) => {
    if (!id || !action) return () => {};

    setActions((current) => ({
      ...current,
      [id]: {
        id,
        order: 0,
        ...action,
      },
    }));

    return () => {
      setActions((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    };
  }, []);

  const value = useMemo(() => ({
    actions: Object.values(actions).sort((a, b) => (b.order ?? 0) - (a.order ?? 0)),
    registerFloatingAction,
  }), [actions, registerFloatingAction]);

  return (
    <FloatingActionsContext.Provider value={value}>
      {children}
    </FloatingActionsContext.Provider>
  );
}

export function useFloatingActions() {
  const context = useContext(FloatingActionsContext);
  if (!context) {
    return {
      actions: [],
      registerFloatingAction: () => () => {},
    };
  }
  return context;
}
