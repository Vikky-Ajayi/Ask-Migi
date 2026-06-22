import { useState, useEffect, useRef } from "react";
import thumbnailSrc from "@assets/Thumbnail_1782094899328.png";

type Phase = "enter" | "hold" | "exit";

export function Preloader({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<Phase>("enter");
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    // tiny defer so CSS transition triggers from "enter"
    const t0 = setTimeout(() => setPhase("hold"), 80);
    const t1 = setTimeout(() => setPhase("exit"), 2200);
    const t2 = setTimeout(onComplete, 2750);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [onComplete]);

  // drive a smooth progress bar with rAF during "hold" phase
  useEffect(() => {
    if (phase !== "hold") return;
    const DURATION = 1800; // ms to fill bar
    startRef.current = null;
    const tick = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const pct = Math.min(elapsed / DURATION, 1);
      // ease-in-out cubic
      const eased = pct < 0.5 ? 4 * pct * pct * pct : 1 - Math.pow(-2 * pct + 2, 3) / 2;
      setProgress(eased * 100);
      if (pct < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [phase]);

  const isEntering = phase === "enter";
  const isExiting = phase === "exit";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        opacity: isExiting ? 0 : 1,
        transition: isExiting ? "opacity 0.55s ease" : "none",
        pointerEvents: isExiting ? "none" : "all",
        overflow: "hidden",
      }}
    >
      {/* scan-line shimmer effect */}
      {phase === "hold" && (
        <div className="preloader-scanline" />
      )}

      {/* Logo + progress wrapper */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          transform: isEntering
            ? "scale(0.88) translateY(12px)"
            : isExiting
            ? "scale(1.06) translateY(-8px)"
            : "scale(1) translateY(0px)",
          opacity: isEntering ? 0 : 1,
          transition: isEntering
            ? "transform 0.75s cubic-bezier(0.34,1.4,0.64,1), opacity 0.6s ease"
            : isExiting
            ? "transform 0.55s ease-in, opacity 0.55s ease"
            : "none",
          willChange: "transform, opacity",
        }}
      >
        {/* Logo image — thumbnail is 16:9 black+logo, displays as centered logo on black */}
        <img
          src={thumbnailSrc}
          alt="Ask Migi"
          style={{
            display: "block",
            width: "min(520px, 80vw)",
            height: "auto",
            userSelect: "none",
            pointerEvents: "none",
          }}
        />

        {/* Progress bar */}
        <div
          style={{
            marginTop: "8px",
            width: "min(200px, 38vw)",
            height: "2px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "1px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "#ffffff",
              borderRadius: "1px",
              boxShadow: "0 0 6px 1px rgba(255,255,255,0.5)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
