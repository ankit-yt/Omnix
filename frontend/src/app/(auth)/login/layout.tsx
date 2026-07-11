"use client";

import React, { useEffect, useState } from "react";

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div className="relative h-screen ">
      {/* Animated background layer */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/login.png')",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "scale(1)" : "scale(1.15)",
          transitionProperty: "opacity, transform",
          transitionDuration: "1400ms",
          transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
      
      <div
        className="absolute inset-0 bg-black/20"
        style={{
          opacity: mounted ? 1 : 0,
          transition: "opacity 1400ms ease-out",
        }}
      />

      <div className="relative h-full overflow-auto">{children}</div>
    </div>
  );
}