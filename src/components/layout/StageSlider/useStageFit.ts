import { useLayoutEffect, useRef, useState, type RefObject } from 'react';

/** The nearest ancestor that scrolls up and down: the height a page shows at once. */
const scrollerOf = (el: HTMLElement) => {
  for (let p = el.parentElement; p; p = p.parentElement) { const o = getComputedStyle(p).overflowY; if (o === 'auto' || o === 'scroll') return p; }
  return null;
};

/**
 * What the stage measures of itself, so no page has to pass sizes: `width`, all of it; `free`, that less the arrows' room; `cap`, the
 * widest the centre may be and still show whole in the height its page shows at once (its own height for its width,
 * with the progress row under it); `room`, that width in centre widths. The cap is for a slide that keeps its shape
 * (a picture): a slide of words and rows only grows taller as it narrows, so once the centre is seen at two widths
 * with two different shapes the cap is let go and the slide keeps the width the row gives it.
 */
export const useStageFit = (on: boolean, root: RefObject<HTMLElement | null>, stage: RefObject<HTMLElement | null>, key: unknown) => {
  const [fit, setFit] = useState({ free: 0, cap: 0, room: 0, width: 0 });
  const last = useRef({ w: 0, h: 0, flows: false });
  useLayoutEffect(() => {
    const el = stage.current; const r = root.current;
    if (!on || !el || !r || typeof ResizeObserver === 'undefined') return;
    const measure = () => {
      const c = el.querySelector<HTMLElement>('[data-offset="0"]'); if (!c || !c.offsetWidth) return;
      const cs = getComputedStyle(el); const width = el.clientWidth; const free = width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const sc = scrollerOf(r); const shows = sc ? sc.clientHeight : window.innerHeight;
      const foot = r.lastElementChild && r.lastElementChild !== el ? (r.lastElementChild as HTMLElement).offsetHeight + parseFloat(getComputedStyle(r).rowGap || '0') : 0;
      // Seen at two widths, a slide that keeps its shape keeps its height for its width; one of words and rows does not.
      const was = last.current; const shape = c.offsetHeight / c.offsetWidth;
      if (was.w && Math.abs(c.offsetWidth - was.w) > 1 && Math.abs(shape - was.h / was.w) > 0.15 * (was.h / was.w)) was.flows = true;
      was.w = c.offsetWidth; was.h = c.offsetHeight;
      const cap = was.flows ? 0 : Math.max(160, (shows - foot - 16) * c.offsetWidth / c.offsetHeight);
      const room = free / c.offsetWidth;
      setFit((f) => (Math.abs(f.free - free) < 1 && Math.abs(f.cap - cap) < 1 && Math.abs(f.room - room) < 0.01 && Math.abs(f.width - width) < 1 ? f : { free, cap, room, width }));
    };
    const ro = new ResizeObserver(measure); ro.observe(el);
    const c = el.querySelector<HTMLElement>('[data-offset="0"]'); if (c) ro.observe(c);
    window.addEventListener('resize', measure); measure();
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, [on, key]);
  return fit;
};
