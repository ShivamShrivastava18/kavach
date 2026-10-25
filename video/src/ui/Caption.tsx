import { interpolate, useCurrentFrame } from "remotion";
import { T } from "../theme";

/** Narration caption strip at the bottom: mono, uppercase, led by an amber square. Burned in for muted viewers. */
export const Caption: React.FC<{ text: string; duration: number; bottom?: number }> = ({ text, duration, bottom = 64 }) => {
  const frame = useCurrentFrame();
  const inT = interpolate(frame, [6, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const outT = interpolate(frame, [duration - 12, duration - 2], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 0,
        fontFamily: T.mono,
        fontSize: 22,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: T.muted,
        opacity: inT * outT,
        transform: `translateY(${(1 - inT) * 8}px)`,
      }}
    >
      <span style={{ width: 7, height: 7, background: T.accent, display: "inline-block", marginRight: 14 }} />
      <span style={{ background: "rgba(12,12,14,0.92)", padding: "10px 18px", borderRadius: 6, boxShadow: "0 0 0 1px rgba(38,38,44,0.9)" }}>{text}</span>
    </div>
  );
};
