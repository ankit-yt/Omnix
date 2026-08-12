"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Link from "next/link";
import { SIGNUP_ROUTE } from "@/lib/routes";
import { prefersReducedMotion } from "@/lib/motion/useGsapContext";

const FRAGMENTS = [
  { label: "Refund policy.pdf", kind: "doc", x: "8%", y: "22%", delay: 0 },
  { label: "“What's our uptime SLA?”", kind: "chat", x: "78%", y: "16%", delay: 0.15 },
  { label: "Source · onboarding-guide.md", kind: "cite", x: "4%", y: "68%", delay: 0.3 },
  { label: "Q3-pricing.xlsx", kind: "doc", x: "84%", y: "62%", delay: 0.45 },
  { label: "“Summarize the security review”", kind: "chat", x: "70%", y: "82%", delay: 0.6 },
];

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const auraRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const fragmentsRef = useRef<HTMLDivElement>(null);

  // Idle breathing + slow arc rotation.
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.to(".hero-ring", {
        rotate: 360,
        duration: 60,
        ease: "none",
        repeat: -1,
        transformOrigin: "50% 50%",
      });
      gsap.to(".hero-ring--reverse", {
        rotate: -360,
        duration: 90,
        ease: "none",
        repeat: -1,
        transformOrigin: "50% 50%",
      });
      gsap.to(coreRef.current, {
        scale: 1.04,
        opacity: 0.92,
        duration: 3.4,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
      gsap.fromTo(
        ".hero-fragment",
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          stagger: 0.12,
          delay: 0.4,
        }
      );
      gsap.fromTo(
        [".hero-eyebrow", ".hero-title", ".hero-sub", ".hero-cta"],
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.08 }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Lightweight cursor-reactive tilt — throttled via quickTo, transform only.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const el = auraRef.current;
    if (!el) return;

    const xTo = gsap.quickTo(el, "rotationY", { duration: 0.6, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "rotationX", { duration: 0.6, ease: "power3.out" });

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const { innerWidth, innerHeight } = window;
        const nx = (e.clientX / innerWidth - 0.5) * 2;
        const ny = (e.clientY / innerHeight - 0.5) * 2;
        xTo(nx * 6);
        yTo(-ny * 6);
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[100svh] items-center overflow-hidden bg-[color:var(--bg)]"
    >
      {/* ambient background — plain CSS gradients, no canvas */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 38%, rgba(139,124,246,0.14), transparent 70%), linear-gradient(180deg, #08090b 0%, #0a0b0e 60%, #08090b 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage:
            "radial-gradient(60% 60% at 50% 45%, black, transparent 75%)",
        }}
      />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-16 px-6 pt-24 lg:grid-cols-2 lg:px-10">
        <div className="max-w-xl">
          <span className="hero-eyebrow font-mono text-[0.7rem] uppercase tracking-[0.3em] text-[color:var(--accent)]">
            Omnix
          </span>
          <h1 className="hero-title mt-6 font-display text-[clamp(2.75rem,6vw,4.75rem)] font-medium leading-[1.02] tracking-tight text-white">
            Your organization,
            <br />
            answering itself.
          </h1>
          <p className="hero-sub mt-6 max-w-md text-lg leading-relaxed text-white/60">
            Omnix turns scattered documents, files, and pages into a single
            intelligence — a white-label AI copilot for your dashboard, and a
            widget for every website you own.
          </p>
          <div className="hero-cta mt-10 flex items-center gap-4">
            <Link
              href={SIGNUP_ROUTE}
              className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
            >
              Get started
            </Link>
            <span className="text-sm text-white/40">
              No credit card required
            </span>
          </div>
        </div>

        {/* Signature element: the 2D "intelligence aperture" */}
        <div
          className="relative mx-auto aspect-square w-full max-w-[440px]"
          style={{ perspective: "900px" }}
        >
          <div
            ref={auraRef}
            className="relative h-full w-full"
            style={{ transformStyle: "preserve-3d" }}
          >
            <svg
              viewBox="0 0 400 400"
              className="hero-ring absolute inset-0 h-full w-full text-[color:var(--accent)]/30"
            >
              <circle cx="200" cy="200" r="176" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="1 10" />
            </svg>
            <svg
              viewBox="0 0 400 400"
              className="hero-ring hero-ring--reverse absolute inset-0 h-full w-full text-white/10"
            >
              <circle cx="200" cy="200" r="142" fill="none" stroke="currentColor" strokeWidth="1" />
              <circle cx="200" cy="200" r="142" fill="none" stroke="var(--accent)" strokeOpacity="0.5" strokeWidth="2" strokeDasharray="40 480" />
            </svg>

            <div
              ref={coreRef}
              className="absolute left-1/2 top-1/2 h-[180px] w-[180px] -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 40% 35%, rgba(255,255,255,0.9), rgba(139,124,246,0.55) 45%, rgba(139,124,246,0.05) 72%)",
                boxShadow: "0 0 80px 10px rgba(139,124,246,0.25)",
              }}
            />
          </div>

          {/* floating knowledge fragments — DOM count capped at 5 */}
          <div ref={fragmentsRef} className="absolute inset-0">
            {FRAGMENTS.map((f) => (
              <div
                key={f.label}
                className="hero-fragment absolute w-max max-w-[180px] rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-[0.65rem] text-white/70 backdrop-blur-sm"
                style={{ left: f.x, top: f.y }}
              >
                {f.kind === "cite" && (
                  <span className="mr-1 text-[color:var(--accent)]">#</span>
                )}
                {f.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 text-[0.65rem] uppercase tracking-[0.3em] text-white/25"
      >
        Scroll
      </div>
    </section>
  );
}
