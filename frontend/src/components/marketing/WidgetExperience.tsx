"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Globe } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function WidgetExperience() {
  const [open, setOpen] = useState(true);

  return (
    <section className="relative overflow-hidden bg-[color:var(--bg)] py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading
          eyebrow="The widget"
          align="center"
          title="Your intelligence, embedded anywhere."
          description="One script tag puts Omnix on any website — themed to match, ready to answer."
          className="mx-auto mb-16"
        />

        <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border border-white/[0.08] bg-[color:var(--panel)] shadow-[0_40px_120px_-40px_rgba(0,0,0,0.7)]">
          {/* browser chrome */}
          <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <div className="ml-3 flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1 font-mono text-[0.65rem] text-white/40">
              <Globe size={11} /> yourcompany.com
            </div>
          </div>

          <div className="relative h-[380px] bg-[radial-gradient(60%_60%_at_30%_20%,rgba(139,124,246,0.08),transparent_70%)] p-8">
            <div className="h-3 w-32 rounded bg-white/10" />
            <div className="mt-4 h-2 w-64 rounded bg-white/[0.06]" />
            <div className="mt-2 h-2 w-52 rounded bg-white/[0.06]" />
            <div className="mt-8 h-24 w-full max-w-sm rounded-lg border border-white/[0.06] bg-white/[0.03]" />

            {/* FAB */}
            <button
              onClick={() => setOpen((v) => !v)}
              className="absolute bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
              style={{
                background:
                  "radial-gradient(circle at 35% 30%, #a599ff, var(--accent))",
              }}
              aria-label={open ? "Close chat" : "Open chat"}
            >
              {open ? <X size={20} /> : <MessageCircle size={20} />}
            </button>

            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 16 }}
                  transition={{ type: "spring", stiffness: 320, damping: 26 }}
                  className="absolute bottom-24 right-6 w-[280px] overflow-hidden rounded-2xl border border-white/10 bg-[color:var(--bg-elevated)]/95 backdrop-blur-md"
                >
                  <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
                    <div className="h-2 w-2 rounded-full bg-[color:var(--accent)]" />
                    <span className="font-mono text-[0.65rem] uppercase tracking-widest text-white/40">
                      Ask us anything
                    </span>
                  </div>
                  <div className="space-y-2 p-4">
                    <div className="w-max max-w-[85%] rounded-lg rounded-tl-sm bg-white/[0.05] px-3 py-2 text-xs text-white/70">
                      Hi — what can I help you find today?
                    </div>
                    <div className="ml-auto w-max max-w-[85%] rounded-lg rounded-tr-sm bg-[color:var(--accent)]/20 px-3 py-2 text-xs text-white/85">
                      Do you integrate with Slack?
                    </div>
                    <div className="w-max max-w-[85%] rounded-lg rounded-tl-sm bg-white/[0.05] px-3 py-2 text-xs text-white/70">
                      Yes — Slack is available on every plan.
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
