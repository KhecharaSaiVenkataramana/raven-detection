"use client";

import { useRef, useState } from "react";

export default function ZoomImage({ src, alt }: { src: string; alt: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lensStyle, setLensStyle] = useState<React.CSSProperties>({ display: "none" });
  const [imgStyle, setImgStyle] = useState<React.CSSProperties>({});

  function onMouseMove(e: React.MouseEvent) {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setLensStyle({
      display: "block",
      left: x - 45,
      top: y - 45,
    });
    setImgStyle({
      transformOrigin: `${(x / rect.width) * 100}% ${(y / rect.height) * 100}%`,
      transform: "scale(2.5)",
    });
  }

  function onMouseLeave() {
    setLensStyle({ display: "none" });
    setImgStyle({ transform: "scale(1)" });
  }

  return (
    <div
      ref={containerRef}
      className="zoom-container"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="zoom-image" style={imgStyle} />
      <div className="zoom-lens" style={lensStyle} />
    </div>
  );
}
