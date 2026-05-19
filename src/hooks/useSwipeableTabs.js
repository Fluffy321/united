import { useCallback, useRef } from 'react';

const HORIZ_THRESHOLD = 48;
const DIRECTION_RATIO = 1.5;
// Once the gesture has moved this many px vertically and is more vertical than horizontal, abort.
const ABORT_VERT_THRESHOLD = 10;

/**
 * Walks up the DOM from `target` to (but not including) `container`,
 * returning true if any element is a horizontally-scrollable container
 * with actual overflow content.
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
 * Returns pointer-event handlers + `style` that detect left/right swipes
 * on a content area and advance or retreat through a list of tabs.
 *
 * Usage:
 *   const swipeHandlers = useSwipeableTabs({ tabs, activeTab, onTabChange });
 *   <div {...swipeHandlers}>{tab content}</div>
 *
 * Key behaviours:
 * - setPointerCapture ensures pointerup/pointermove fire even when the finger
 *   travels outside the element boundary (the main source of "lost swipes").
 * - Directional lock: if the gesture moves 10+ px vertically before it qualifies
 *   as horizontal, it is aborted so vertical scrolling is never hijacked.
 * - touch-action: pan-y tells the browser to own vertical scrolling natively,
 *   preventing scroll jank while still delivering horizontal pointer events.
 * - Only responds to touch/pen (not mouse) to preserve desktop drag interactions.
 */
export function useSwipeableTabs({ tabs, activeTab, onTabChange, disabled = false }) {
  const touchId = useRef(null);
  const startX = useRef(null);
  const startY = useRef(null);
  const aborted = useRef(false);

  const onPointerDown = useCallback(
    (e) => {
      if (disabled) return;
      if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
      if (touchId.current !== null) return;
      if (isInsideHorizScroller(e.target, e.currentTarget)) return;
      touchId.current = e.pointerId;
      startX.current = e.clientX;
      startY.current = e.clientY;
      aborted.current = false;
      // Capture so pointermove / pointerup / pointercancel are delivered even
      // if the finger exits the element — this was the primary source of
      // "swipe gets lost mid-gesture" jank.
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    },
    [disabled],
  );

  const onPointerMove = useCallback(
    (e) => {
      if (touchId.current !== e.pointerId) return;
      if (aborted.current || startX.current === null) return;
      const dx = Math.abs(e.clientX - startX.current);
      const dy = Math.abs(e.clientY - startY.current);
      // If the gesture is clearly vertical, abort the swipe so the browser
      // can handle vertical scrolling without interference.
      if (dy > ABORT_VERT_THRESHOLD && dy > dx) {
        aborted.current = true;
      }
    },
    [],
  );

  const onPointerUp = useCallback(
    (e) => {
      if (touchId.current !== e.pointerId) return;
      touchId.current = null;
      const sx = startX.current;
      const sy = startY.current;
      const wasAborted = aborted.current;
      startX.current = null;
      startY.current = null;
      aborted.current = false;
      if (sx === null || wasAborted) return;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
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
      aborted.current = false;
    }
  }, []);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    style: { touchAction: 'pan-y' },
  };
}
