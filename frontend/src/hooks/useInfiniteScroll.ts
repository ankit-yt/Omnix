// hooks/useInfiniteScroll.ts
import { useEffect, useRef } from "react";

interface UseInfiniteScrollOptions {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  root?: Element | null;
  rootMargin?: string;
  threshold?: number;
}

export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading,
  root = null,
  rootMargin = "100px",
  threshold = 0,
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // keep latest callbacks/flags in refs so the observer doesn't need to be
  // torn down and rebuilt every time hasMore/isLoading changes
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  const hasMoreRef = useRef(hasMore);
  hasMoreRef.current = hasMore;

  const isLoadingRef = useRef(isLoading);
  isLoadingRef.current = isLoading;

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMoreRef.current && !isLoadingRef.current) {
          onLoadMoreRef.current();
        }
      },
      { root, rootMargin, threshold }
    );

    observerRef.current.observe(node);

    return () => observerRef.current?.disconnect();

  }, [root, rootMargin, threshold]);

  return sentinelRef;
}