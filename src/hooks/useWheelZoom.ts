import { RefObject, useEffect, useRef } from "react";

/**
 * Attaches a non-passive wheel listener so the page never scrolls while the
 * cursor is over the canvas. React's onWheel is passive, so preventDefault()
 * there is silently ignored.
 */
export function useWheelZoom(
  ref: RefObject<HTMLElement>,
  onZoom: (factor: number, event: WheelEvent) => void,
  enabled: boolean = true
) {
  const handlerRef = useRef(onZoom);
  handlerRef.current = onZoom;

  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      // Always block page scroll / browser pinch-zoom over the canvas
      e.preventDefault();
      if (!enabledRef.current) return;

      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const factor = Math.exp(-dy * 0.0015);
      handlerRef.current(factor, e);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  });
}
