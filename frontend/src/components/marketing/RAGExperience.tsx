"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { ConnectorLine } from "@/components/ui/ConnectorLine";
import { useGsapContext, prefersReducedMotion } from "@/lib/motion/useGsapContext";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const SOURCES = [
  { id: "s1", label: "handbook.pdf · §4.2", x: 40, y: 40 },
  { id: "s2", label: "api-docs.md · auth", x: 320, y: 30 },
  { id: "s3", label: "support-macros.json", x: 30, y: 200 },
  { id: "s4", label: "onboarding.md · intro", x: 330, y: 210 },
];

export function RAGExperience() {
  const sourceRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const lineRefs = useRef<(SVGPathElement | null)[]>([]);
  const answerRef = useRef<HTMLDivElement>(null);
  const questionRef = useRef<HTMLDivElement>(null);

  const scope = useGsapContext<HTMLElement>(({ scope }) => {
    if (prefersReducedMotion()) return;

    const sources = Object.values(sourceRefs.current).filter(Boolean) as HTMLDivElement[];
    gsap.set(sources, { opacity: 0.35, scale: 0.96 });
    gsap.set(answerRef.current, { opacity: 0, y: 12 });
    gsap.set(questionRef.current, { opacity: 0, y: 10 });

    lineRefs.current.forEach((path) => {
      if (!path) return;
      const length = path.getTotalLength();
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: scope.current,
        start: "top 65%",
        end: "bottom 55%",
        scrub: 0.6,
      },
    });

    tl.to(questionRef.current, { opacity: 1, y: 0, duration: 0.6 })
      .to(sources, { opacity: 1, scale: 1, duration: 0.5, stagger: 0.08 }, ">-0.1")
      .to(
        lineRefs.current,
        { strokeDashoffset: 0, duration: 0.6, stagger: 0.06, ease: "power1.inOut" },
        "<"
      )
      .to(answerRef.current, { opacity: 1, y: 0, duration: 0.7 }, ">-0.1");
  }, []);

  return (
    <section ref={scope} className="relative overflow-hidden bg-[color:var(--bg)] py-32">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-2 lg:px-10">
        <SectionHeading
          eyebrow="The RAG engine"
          title="Every answer, traced back to its source."
          description="A question retrieves the exact knowledge that matters, pulls it into context, and composes an answer — with the sources shown, never hidden."
        />

        <div className="relative mx-auto aspect-square w-full max-w-[480px]">
          <svg viewBox="0 0 400 280" className="absolute inset-0 h-full w-full text-[color:var(--accent)]/60">
            <ConnectorLine d="M40,60 C120,110 160,140 200,140" ref={(el) => (lineRefs.current[0] = el)} />
            <ConnectorLine d="M320,50 C260,110 220,140 200,140" ref={(el) => (lineRefs.current[1] = el)} />
            <ConnectorLine d="M30,215 C110,180 160,160 200,140" ref={(el) => (lineRefs.current[2] = el)} />
            <ConnectorLine d="M330,225 C260,185 220,160 200,140" ref={(el) => (lineRefs.current[3] = el)} />
          </svg>

          {SOURCES.map((s) => (
            <div
              key={s.id}
              ref={(el) => {
                sourceRefs.current[s.id] = el;
              }}
              className="absolute w-max -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[color:var(--accent)]/30 bg-[color:var(--accent)]/[0.08] px-3 py-1.5 font-mono text-[0.68rem] text-white/80"
              style={{ left: s.x, top: s.y }}
            >
              {s.label}
            </div>
          ))}

          <div className="absolute left-1/2 top-1/2 flex w-[min(88%,340px)] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4">
            <div
              ref={questionRef}
              className="font-mono text-xs text-white/60"
            >
              “What's included in the enterprise plan?”
            </div>
            <GlassPanel ref={answerRef} className="w-full px-5 py-4">
              <p className="text-sm leading-relaxed text-white/85">
                The enterprise plan includes unlimited seats, dedicated
                storage, and priority support.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 font-mono text-[0.65rem] text-[color:var(--accent)]">
                <span>#pricing-2024.csv</span>
                <span>#handbook.pdf</span>
              </div>
            </GlassPanel>
          </div>
        </div>
      </div>
    </section>
  );
}
