"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";

const NODES = [
  { label: "Knowledge", x: 50, y: 12 },
  { label: "Conversations", x: 88, y: 38 },
  { label: "Widgets", x: 82, y: 82 },
  { label: "Organizations", x: 18, y: 82 },
  { label: "Usage & plans", x: 12, y: 38 },
];

export function EcosystemExperience() {
  const center = { x: 50, y: 48 };

  return (
    <section className="relative overflow-hidden bg-[color:var(--bg)] py-32">
      <div className="mx-auto max-w-5xl px-6 lg:px-10">
        <SectionHeading
          eyebrow="The ecosystem"
          align="center"
          title="Not a feature list. A system."
          description="Knowledge, conversations, widgets, organizations, and plans aren't separate products bolted together — they're one connected platform."
          className="mx-auto mb-16"
        />

        <div className="relative mx-auto aspect-[4/3] w-full max-w-2xl">
          <svg viewBox="0 0 100 96" className="absolute inset-0 h-full w-full text-white/10">
            {NODES.map((n) => (
              <line
                key={n.label}
                x1={center.x}
                y1={center.y}
                x2={n.x}
                y2={n.y}
                stroke="currentColor"
                strokeWidth="0.3"
              />
            ))}
          </svg>

          <motion.div
            className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              left: `${center.x}%`,
              top: `${center.y}%`,
              background: "var(--accent)",
              boxShadow: "0 0 30px 8px rgba(139,124,246,0.4)",
            }}
            initial={{ scale: 0.6, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          />
          <span
            className="absolute -translate-x-1/2 translate-y-4 font-mono text-[0.6rem] uppercase tracking-widest text-white/40"
            style={{ left: `${center.x}%`, top: `${center.y}%` }}
          >
            Omnix
          </span>

          {NODES.map((n, i) => (
            <motion.div
              key={n.label}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[0.68rem] text-white/70"
              style={{ left: `${n.x}%`, top: `${n.y}%` }}
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * i, duration: 0.5 }}
            >
              {n.label}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
