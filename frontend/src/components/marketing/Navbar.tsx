"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LOGIN_ROUTE,
  SIGNUP_ROUTE,
  PRODUCT_ROUTE,
  HOW_IT_WORKS_ROUTE,
} from "@/lib/routes";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-300 ${
        scrolled
          ? "border-b border-white/[0.08] bg-[color:var(--bg)]/80 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">
        <Link
          href="/"
          className="font-display text-lg font-semibold tracking-tight text-white"
        >
          Omnix
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link
            href={PRODUCT_ROUTE}
            className="text-sm text-white/70 transition-colors hover:text-white"
          >
            Product
          </Link>
          <Link
            href={HOW_IT_WORKS_ROUTE}
            className="text-sm text-white/70 transition-colors hover:text-white"
          >
            How it works
          </Link>
        </div>

        <div className="flex items-center gap-5">
          <Link
            href={LOGIN_ROUTE}
            className="text-sm text-white/70 transition-colors hover:text-white"
          >
            Log in
          </Link>
          <Link
            href={SIGNUP_ROUTE}
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
          >
            Get started
          </Link>
        </div>
      </nav>
    </header>
  );
}
