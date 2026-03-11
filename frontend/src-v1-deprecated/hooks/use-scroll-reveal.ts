import { useEffect, useRef } from "react";

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.06, rootMargin: "0px 0px -40px 0px" },
    );

    // Observe all children with data-r attribute, and the element itself
    const targets = el.querySelectorAll("[data-r]");
    targets.forEach((target) => observer.observe(target));
    if (el.hasAttribute("data-r")) observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return ref;
}
