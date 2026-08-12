"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { SIGNUP_ROUTE } from "@/lib/routes";

export function FinalCTA() {
  return (
    <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-[color:var(--bg)] px-6 py-32 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(40% 40% at 50% 50%, rgba(139,124,246,0.12), transparent 70%)",
        }}
      />
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-20%" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <span className="font-display text-lg font-semibold tracking-tight text-white/60">
          Omnix
        </span>
        <h2 className="mt-6 max-w-2xl font-display text-[clamp(2rem,5vw,3.5rem)] font-medium leading-[1.05] tracking-tight text-white">
          Give your organization a mind of its own.
        </h2>
        <Link
          href={SIGNUP_ROUTE}
          className="mt-10 rounded-full bg-white px-7 py-3.5 text-sm font-medium text-black transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
        >
          Get started
        </Link>
      </motion.div>
    </section>
  );
}
