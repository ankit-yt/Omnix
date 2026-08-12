"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";

const LAYERS = [
  { label: "One workspace", width: "34%" },
  { label: "One organization, many teams", width: "62%" },
  { label: "Every team, every source, one intelligence", width: "100%" },
];

export function ScaleSection() {
  return (
    <section className="relative overflow-hidden bg-[color:var(--bg)] py-32">
      <div className="mx-auto max-w-5xl px-6 lg:px-10">
        <SectionHeading
          eyebrow="Scale"
          align="center"
          title="Grows with the organization, not around it."
          description="Omnix doesn't ask you to restructure how you work. It expands quietly underneath — from a single workspace to every team you have."
          className="mx-auto mb-16"
        />

        <div className="mx-auto flex max-w-lg flex-col gap-4">
          {LAYERS.map((layer, i) => (
            <motion.div
              key={layer.label}
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ delay: i * 0.12, duration: 0.6, ease: "easeOut" }}
            >
              <div className="h-9 flex-1 overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.02]">
                <motion.div
                  className="h-full rounded-lg"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(139,124,246,0.35), rgba(139,124,246,0.08))",
                  }}
                  initial={{ width: 0 }}
                  whileInView={{ width: layer.width }}
                  viewport={{ once: true, margin: "-10%" }}
                  transition={{ delay: i * 0.12 + 0.1, duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <span className="w-48 shrink-0 font-mono text-xs text-white/50">
                {layer.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
