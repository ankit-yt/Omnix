"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import gsap from "gsap";

/**
 * Runs `setup` inside a gsap.context() scoped to `scope`, and reverts it
 * (killing every tween/ScrollTrigger created inside) on unmount or when
 * `deps` change. Safe under React StrictMode's double-invoke in dev.
 */
export function useGsapContext<T extends HTMLElement>(
  setup: (context: { scope: RefObject<T> }) => void,
  deps: React.DependencyList = []
): RefObject<T> {
  const scope = useRef<T>(null!);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      setup({ scope });
    }, scope);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return scope;
}

/** Respects the user's reduced-motion preference. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
