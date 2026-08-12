import Link from "next/link";
import { LOGIN_ROUTE, SIGNUP_ROUTE, PRODUCT_ROUTE, HOW_IT_WORKS_ROUTE } from "@/lib/routes";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[color:var(--bg)] px-6 py-12 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 md:flex-row md:items-center">
        <span className="font-display text-base font-semibold tracking-tight text-white">
          Omnix
        </span>

        <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/50">
          <Link href={PRODUCT_ROUTE} className="hover:text-white">Product</Link>
          <Link href={HOW_IT_WORKS_ROUTE} className="hover:text-white">How it works</Link>
          <Link href={LOGIN_ROUTE} className="hover:text-white">Log in</Link>
          <Link href={SIGNUP_ROUTE} className="hover:text-white">Sign up</Link>
          <Link href="#" className="hover:text-white">Privacy</Link>
          <Link href="#" className="hover:text-white">Terms</Link>
        </nav>

        <span className="text-xs text-white/30">
          © {new Date().getFullYear()} Omnix. All rights reserved.
        </span>
      </div>
    </footer>
  );
}
