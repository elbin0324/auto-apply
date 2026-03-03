import { useRef, useEffect } from "react";

/**
 * Adds the `page-enter` CSS class on mount to trigger a fade+slide entrance animation.
 * Attach the returned ref to the page's root element.
 */
export function usePageEnter<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Force reflow so the animation always plays on mount
    void el.offsetHeight;
    el.classList.add("page-enter");
  }, []);

  return ref;
}
