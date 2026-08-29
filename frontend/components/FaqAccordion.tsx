"use client";

import { useState } from "react";

export interface FaqItem {
  q: string;
  a: string;
}

export default function FaqAccordion({ items, singleOpen = false }: { items: FaqItem[]; singleOpen?: boolean }) {
  const [open, setOpen] = useState<Set<number>>(new Set());

  function toggle(i: number) {
    setOpen((prev) => {
      if (singleOpen) {
        return prev.has(i) ? new Set() : new Set([i]);
      }
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <div>
      {items.map((item, i) => (
        <div key={item.q} className={`faq-item${open.has(i) ? " open" : ""}`}>
          <div className="faq-q" onClick={() => toggle(i)}>
            <span>{item.q}</span>
            <span className="faq-plus">+</span>
          </div>
          <div className="faq-a">{item.a}</div>
        </div>
      ))}
    </div>
  );
}
