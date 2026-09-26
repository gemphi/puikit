import { useEffect, useState } from 'react';

/**
 * The element overlays portal into, or `null` until the client has mounted.
 *
 * `createPortal` needs a real DOM node, which does not exist during server
 * rendering. Returning `null` on the first pass lets an overlay render nothing
 * on the server and mount into `document.body` on the client — so a library
 * consumer can server-render a page containing a Modal, Drawer or Toast
 * without the render throwing.
 */
export function usePortalTarget(): HTMLElement | null {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Runs only in the browser, after hydration.
    setTarget(document.body);
  }, []);

  return target;
}
