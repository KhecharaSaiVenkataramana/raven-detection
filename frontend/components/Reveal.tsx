"use client";

import { useEffect, useRef } from "react";

export default function Reveal({
  children,
  delay,
  className = "",
}: {
  children: React.ReactNode;
  delay?: 1 | 2 | 3 | 4;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const delayClass = delay ? ` reveal-delay-${delay}` : "";
  return (
    <div ref={ref} className={`reveal${delayClass} ${className}`}>
      {children}
    </div>
  );
}
