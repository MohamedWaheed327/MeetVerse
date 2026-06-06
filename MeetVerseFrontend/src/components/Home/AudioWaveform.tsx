import React, { useMemo } from "react";

interface AudioWaveformProps {
  isActive: boolean;
}

export default function AudioWaveform({ isActive }: AudioWaveformProps) {
  const bars = useMemo(() => {
    const numBars = 22; // 22 bars
    const heights = ["h-10", "h-7", "h-4"];
    return Array.from({ length: numBars }).map((_, i) => {
      // Create a nice alternating pattern for heights so it's not totally random
      const heightIndex = (i * 7 + 13) % 3; // pseudo-random stable distribution
      const baseHeight = heights[heightIndex];
      const durationMs = 800 + ((i * 57) % 600); // 800ms to 1400ms
      const delayMs = (i * 80) % 1800; // staggered delay

      return {
        id: i,
        className: `w-1.5 rounded-t-sm bg-gradient-to-t from-cyan-400 to-blue-500 ${baseHeight} transition-transform duration-300`,
        style: isActive
          ? {
              animationName: "wave",
              animationTimingFunction: "ease-in-out",
              animationIterationCount: "infinite",
              animationDirection: "alternate",
              animationDuration: "var(--speed)",
              animationDelay: `${delayMs}ms`,
              transformOrigin: "bottom",
              "--base-speed": `${durationMs}ms`,
              "--speed": `var(--base-speed)`,
            }
          : {
              transform: "scaleY(0.15)",
              transformOrigin: "bottom",
            },
      } as React.CSSProperties & { className: string; id: number };
    });
  }, [isActive]);

  return (
    <div className="flex items-end gap-0.5 h-12 w-full justify-center group-hover-speed-up">
      {bars.map((bar) => (
        <div key={bar.id} className={bar.className} style={bar.style as React.CSSProperties} />
      ))}
    </div>
  );
}
