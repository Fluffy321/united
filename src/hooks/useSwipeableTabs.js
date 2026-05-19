import { useCallback, useRef } from 'react';

// Minimum horizontal distance (px) to register as a deliberate swipe.
const HORIZ_THRESHOLD = 48;

// Swipe must be at least this many times wider than it is tall.
// Prevents diagonal-scroll gestures from accidentally changing tabs.
const DIRECTION_RATIO = 1.5;

/**
 * Walks up the DOM from `target` to (but not including) `container`,
 * returning true if any element is a horizontally-scrollable container
 * with actual overflow content. Used to avoid intercepting swipes on
 * nested horizontal lists (stats ribbons, carousels, etc.).
 */
function isInsideHorizScroller(target, container) {
  let el = target;
  while (el && el !== container) {
    const { overflowX } = window.getComputedStyle(el);
    if ((overflowX === 'scroll' || overflowX === 'auto') && el.scrollWidth > el.clientWidth) {
      return true;
    }
    el = el.parentElement;
  }
  return false;
}

/**
 * Returns pointer-event handlers that detect left/right swipes
 * on a content area and advance or retreat through a list of tabs.
 *
 * Usage:
 *   const swipeHandlers = useSwipeableTabs({ tabs, activeTab, onTabChange });
 *   <div {...swipeHandlers}>{tab content}</div>
 *
 * - Only responds to touch/pen input (not mouse) to avoid interfering
 *   with desktop drag interactions.
 * - Ignores gestures that start inside a horizontally-scrollable child.
 * - Ignores gestures that are more vertical than horizontal.
 * - Does not wrap at the edges.
 */
export function useSwipeableTabs({ tabs, activeTab, onTabChange, disabled = false }) {
  const touchId = useRef(null);
  const startX = useRef(null);
  const startY = useRef(null);

  const onPointerDown = useCallback(
    (e) => {
      if (disabled) return;
      if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
      if (touchId.current !== null) return;
      if (isInsideHorizScroller(e.target, e.currentTarget)) return;
      touchId.current = e.pointerId;
      startX.current = e.clientX;
      startY.current = e.clientY;
    },
    [disabled],
  );

  const onPointerUp = useCallback(
    (e) => {
      if (touchId.current !== e.pointerId) return;
      touchId.current = null;
      if (startX.current === null) return;
      const dx = e.clientX - startX.current;
      const dy = e.clientY - startY.current;
      startX.current = null;
      startY.current = null;
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);
      if (adx < HORIZ_THRESHOLD || adx < ady * DIRECTION_RATIO) return;
      const idx = tabs.indexOf(activeTab);
      if (dx < 0 && idx < tabs.length - 1) {
        onTabChange(tabs[idx + 1]);
      } else if (dx > 0 && idx > 0) {
        onTabChange(tabs[idx - 1]);
      }
    },
    [tabs, activeTab, onTabChange],
  );

  const onPointerCancel = useCallback((e) => {
    if (touchId.current === e.pointerId) {
      touchId.current = null;
      startX.current = null;
      startY.current = null;
    }
  }, []);

  return { onPointerDown, onPointerUp, onPointerCancel };
}
