import { forwardRef } from "react";

interface ConnectorLineProps {
  d: string;
  className?: string;
  strokeWidth?: number;
}

/**
 * A single animatable connection path. Draw it in with
 * `strokeDasharray`/`strokeDashoffset` via GSAP — see KnowledgeExperience
 * and RAGExperience for usage. Kept deliberately simple: one path per line,
 * no filters, no heavy masks.
 */
export const ConnectorLine = forwardRef<SVGPathElement, ConnectorLineProps>(
  function ConnectorLine({ d, className, strokeWidth = 1 }, ref) {
    return (
      <path
        ref={ref}
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        className={className}
      />
    );
  }
);
