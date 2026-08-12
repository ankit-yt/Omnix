"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassPanel } from "@/components/ui/GlassPanel";

const VIEWPORT = { once: true, margin: "-15%" } as const;

export function ConversationExperience() {
  return (
    <section className="relative overflow-hidden bg-[color:var(--bg)] py-32">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-2 lg:px-10">
        <SectionHeading
          eyebrow="The conversation"
          title="A copilot that knows your organization by heart."
          description="Every reply reads like it came from your most knowledgeable teammate — grounded, cited, and ready to keep going."
        />

        <GlassPanel className="mx-auto w-full max-w-md p-5">
          <div className="flex items-center gap-2 border-b border-white/[0.06] pb-4">
            <div className="h-2 w-2 rounded-full bg-[color:var(--accent)]" />
            <span className="font-mono text-[0.7rem] uppercase tracking-widest text-white/40">
              Omnix Copilot
            </span>
          </div>

          <motion.div
            className="ml-auto mt-5 w-max max-w-[85%] rounded-xl rounded-tr-sm bg-white/[0.06] px-4 py-2 text-sm text-white/85"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT}
            transition={{ duration: 0.5 }}
          >
            How do we handle refunds after 30 days?
          </motion.div>

          <motion.div
            className="mt-3 flex items-center gap-1.5 font-mono text-[0.65rem] text-white/35"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={VIEWPORT}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <span className="h-1 w-1 animate-pulse rounded-full bg-[color:var(--accent)]" />
            retrieving knowledge…
          </motion.div>

          <motion.div
            className="mt-3 max-w-[92%] rounded-xl rounded-tl-sm border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-white/85"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT}
            transition={{ delay: 0.55, duration: 0.5 }}
          >
            After 30 days, refunds are handled on a{" "}
            <span className="text-[color:var(--accent)]">case-by-case</span>{" "}
            basis by the support team, with store credit offered as the
            default remedy.
            <div className="mt-3 flex flex-wrap gap-2 font-mono text-[0.65rem] text-white/40">
              <span className="rounded-full border border-white/10 px-2 py-0.5">
                #refund-policy.pdf
              </span>
              <span className="rounded-full border border-white/10 px-2 py-0.5">
                #support-macros.json
              </span>
            </div>
          </motion.div>
        </GlassPanel>
      </div>
    </section>
  );
}
