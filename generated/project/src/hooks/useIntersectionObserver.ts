import { useState, useEffect, RefObject } from 'react';

interface IntersectionOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver(
  elementRef: RefObject<Element>,
  { threshold = 0, root = null, rootMargin = '0px', freezeOnceVisible = false }: IntersectionOptions = {}
): boolean {
  const [entry, setEntry] = useState<IntersectionObserverEntry>();
  const [isFrozen, setIsFrozen] = useState<boolean>(false);

  const element = elementRef?.current;
  const isVisible = !!entry?.isIntersecting;

  useEffect(() => {
    if (!element || isFrozen) return;

    const observer = new IntersectionObserver(
      ([observerEntry]) => {
        setEntry(observerEntry);
        if (observerEntry.isIntersecting && freezeOnceVisible) {
          setIsFrozen(true);
        }
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [element, threshold, root, rootMargin, freezeOnceVisible, isFrozen]);

  return isVisible;
}