// components/ui/AuroraTransition.tsx

"use client";

export function AuroraTransition({ active }: { active: boolean }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-700
      ${active ? "opacity-100" : "opacity-0"}`}
    >
      <div className="aurora aurora-1" />
      <div className="aurora aurora-2" />
      <div className="aurora aurora-3" />
    </div>
  );
}