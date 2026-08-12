import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  tone?: "default" | "accent";
}

/**
 * The one recurring "glass" surface in the system — used sparingly, per the
 * brief. Thin border, soft translucency, no full-viewport blur.
 */
export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  function GlassPanel({ children, tone = "default", className, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={clsx(
          "relative rounded-2xl border backdrop-blur-md",
          tone === "default" &&
            "border-white/[0.08] bg-white/[0.03] shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset]",
          tone === "accent" &&
            "border-[color:var(--accent)]/25 bg-[color:var(--accent)]/[0.06]",
          className
        )}
        {...rest}
      >
        {children}
      </div>
    );
  }
);
