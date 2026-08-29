"use client";

import { useEffect, useRef } from "react";

export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    navRef.current = document.getElementById("main-navbar");
    function onScroll() {
      if (navRef.current) {
        navRef.current.classList.toggle("scrolled", window.scrollY > 40);
      }
      if (barRef.current) {
        const max = document.body.scrollHeight - window.innerHeight;
        const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
        barRef.current.style.width = Math.min(pct, 100) + "%";
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return <div id="scroll-progress" ref={barRef} />;
}
