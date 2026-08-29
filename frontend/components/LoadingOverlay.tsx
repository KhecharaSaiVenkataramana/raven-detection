"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const MESSAGES = [
  "Initialising detection model...",
  "Loading aerial imagery...",
  "Running inference engine...",
  "Processing oriented bounding boxes...",
  "Analysing object density...",
  "Saving results...",
  "Almost done...",
];

interface Ctx {
  show: () => void;
  hide: () => void;
}
const LoadingOverlayContext = createContext<Ctx | null>(null);

export function useLoadingOverlay() {
  const ctx = useContext(LoadingOverlayContext);
  if (!ctx) throw new Error("useLoadingOverlay must be used inside LoadingOverlayProvider");
  return ctx;
}

export default function LoadingOverlayProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const show = useCallback(() => {
    setMsgIndex(0);
    setActive(true);
    timerRef.current = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 2000);
  }, []);

  const hide = useCallback(() => {
    setActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  return (
    <LoadingOverlayContext.Provider value={{ show, hide }}>
      {children}
      <div id="loading-overlay" className={active ? "active" : ""}>
        <div className="orbit-ring">
          <div className="orbit-path" />
          <div className="scan-line" />
          <div>
            <div className="signal-ring" />
            <div className="signal-ring" />
            <div className="signal-ring" />
          </div>
          <div className="orbit-planet" />
          <div className="satellite-dot" />
        </div>
        <div className="loading-title">RAVEN Scanning</div>
        <div className="loading-dots">
          <span /><span /><span />
        </div>
        <div className="loading-status">{MESSAGES[msgIndex]}</div>
      </div>
    </LoadingOverlayContext.Provider>
  );
}
