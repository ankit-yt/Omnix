"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ConnectorLine } from "@/components/ui/ConnectorLine";
import { useGsapContext, prefersReducedMotion } from "@/lib/motion/useGsapContext";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const NODES = [
  { id: "n1", label: "Handbook.pdf", x: 90, y: 60, scatterX: -140, scatterY: -80 },
  { id: "n2", label: "api-docs.md", x: 240, y: 40, scatterX: 20, scatterY: -140 },
  { id: "n3", label: "pricing-2024.csv", x: 360, y: 100, scatterX: 180, scatterY: -60 },
  { id: "n4", label: "support-macros.json", x: 60, y: 200, scatterX: -180, scatterY: 40 },
  { id: "n5", label: "brand-guidelines.pdf", x: 380, y: 220, scatterX: 190, scatterY: 80 },
  { id: "n6", label: "onboarding.md", x: 200, y: 260, scatterX: 10, scatterY: 180 },
];

const LINES = [
  "M90,60 C150,90 190,110 200,140",
  "M240,40 C220,90 210,110 200,140",
  "M360,100 C300,110 230,120 200,140",
  "M60,200 C110,180 160,160 200,140",
  "M380,220 C310,190 240,160 200,140",
  "M200,260 C200,220 200,180 200,140",
];

export function KnowledgeExperience() {
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const lineRefs = useRef<(SVGPathElement | null)[]>([]);

  const scope = useGsapContext<HTMLElement>(({ scope }) => {
    if (prefersReducedMotion()) return;

    const nodes = Object.values(nodeRefs.current).filter(Boolean) as HTMLDivElement[];
    gsap.set(
      nodes,
      {
        x: (i) => NODES[i].scatterX,
        y: (i) => NODES[i].scatterY,
        opacity: 0.4,
      }
    );

    lineRefs.current.forEach((path) => {
      if (!path) return;
      const length = path.getTotalLength();
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: scope.current,
        start: "top 70%",
        end: "top 20%",
        scrub: 0.6,
      },
    });

    tl.to(nodes, {
      x: 0,
      y: 0,
      opacity: 1,
      duration: 1,
      ease: "power2.out",
      stagger: 0.06,
    }).to(
      lineRefs.current,
      {
        strokeDashoffset: 0,
        duration: 0.8,
        ease: "power1.inOut",
        stagger: 0.05,
      },
      "-=0.5"
    );
  }, []);

  return (
    <section
      ref={scope}
      className="relative overflow-hidden bg-[color:var(--bg)] py-32"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-2 lg:px-10">
        <SectionHeading
          eyebrow="The knowledge"
          title="Everything you know, in one place that thinks."
          description="Documents, files, and crawled pages stop being a scattered archive. Omnix chunks and indexes them into a single structured knowledge base your team — and your AI — can actually use."
        />

        <div className="relative mx-auto aspect-square w-full max-w-[460px]">
          <svg viewBox="0 0 440 320" className="absolute inset-0 h-full w-full text-[color:var(--accent)]/50">
            {LINES.map((d, i) => (
              <ConnectorLine
                key={d}
                d={d}
                ref={(el) => {
                  lineRefs.current[i] = el;
                }}
              />
            ))}
          </svg>

          <div
            className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              left: 200,
              top: 140,
              background: "var(--accent)",
              boxShadow: "0 0 24px 6px rgba(139,124,246,0.5)",
            }}
          />

          {NODES.map((n) => (
            <div
              key={n.id}
              ref={(el) => {
                nodeRefs.current[n.id] = el;
              }}
              className="absolute w-max -translate-x-1/2 -translate-y-1/2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[0.7rem] text-white/75 backdrop-blur-sm"
              style={{ left: n.x, top: n.y }}
            >
              {n.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
