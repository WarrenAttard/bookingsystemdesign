import { useEffect } from "react";

const INTERACTIVE =
  "input, textarea, select, button, a, [role='button'], [role='slider'], [contenteditable='true'], [data-no-drag-scroll], [data-appt-card]";

function scrollableAncestor(el: Element | null): HTMLElement | null {
  let node: Element | null = el;
  while (node && node !== document.body && node !== document.documentElement) {
    const s = getComputedStyle(node);
    const canX =
      /(auto|scroll)/.test(s.overflowX) && node.scrollWidth > node.clientWidth + 1;
    const canY =
      /(auto|scroll)/.test(s.overflowY) && node.scrollHeight > node.clientHeight + 1;
    if (canX || canY) return node as HTMLElement;
    node = node.parentElement;
  }
  const doc = document.scrollingElement as HTMLElement | null;
  if (doc && doc.scrollHeight > doc.clientHeight + 1) return doc;
  return null;
}

/** Enables click-and-drag panning on any scrollable region (scrollbars are hidden). */
export function useDragScroll() {
  useEffect(() => {
    let target: HTMLElement | null = null;
    let startX = 0;
    let startY = 0;
    let sl = 0;
    let st = 0;
    let active = false;
    let pointerId = -1;

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || e.pointerType === "touch") return;
      const el = e.target as Element | null;
      if (!el || el.closest(INTERACTIVE)) return;
      const sc = scrollableAncestor(el);
      if (!sc) return;
      target = sc;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      sl = sc.scrollLeft;
      st = sc.scrollTop;
      active = false;
    };

    const onMove = (e: PointerEvent) => {
      if (!target || e.pointerId !== pointerId) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!active) {
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
        active = true;
        document.body.classList.add("is-drag-scrolling");
      }
      target.scrollLeft = sl - dx;
      target.scrollTop = st - dy;
      e.preventDefault();
    };

    const end = () => {
      if (active) {
        const blockClick = (ev: MouseEvent) => {
          ev.stopPropagation();
          ev.preventDefault();
        };
        window.addEventListener("click", blockClick, { capture: true, once: true });
        setTimeout(() => window.removeEventListener("click", blockClick, true), 60);
      }
      document.body.classList.remove("is-drag-scrolling");
      target = null;
      active = false;
      pointerId = -1;
    };

    window.addEventListener("pointerdown", onDown, true);
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, []);
}
