import type { ReactNode } from "react";
import clsx from "clsx";

interface SectionHeadingProps {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
}

/**
 * Eyebrow + headline pairing used to open each cinematic section.
 * The eyebrow is a plain-language label for what the section demonstrates
 * (not a numbered marker — this isn't a literal step sequence).
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={clsx(
        "section-heading",
        align === "center" && "items-center text-center mx-auto",
        className
      )}
    >
      <span className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-[color:var(--accent)]">
        {eyebrow}
      </span>
      <h2 className="mt-4 font-display text-[clamp(2rem,4.5vw,3.75rem)] font-medium leading-[1.05] tracking-tight text-white">
        {title}
      </h2>
      {description && (
        <p className="mt-5 max-w-xl text-balance text-[1.0625rem] leading-relaxed text-white/60">
          {description}
        </p>
      )}
    </div>
  );
}
