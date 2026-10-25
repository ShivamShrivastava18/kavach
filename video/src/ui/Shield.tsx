import { interpolate, useCurrentFrame } from "remotion";
import { T } from "../theme";

/** The app's shield mark, drawn on over the first 40 frames. */
export const Shield: React.FC<{ size?: number; delay?: number }> = ({ size = 160, delay = 0 }) => {
  const frame = useCurrentFrame() - delay;
  const draw = interpolate(frame, [0, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tick = interpolate(frame, [30, 52], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const L = 120;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ display: "block" }}>
      <path
        d="M16 4l9 3.4v7.6c0 5.6-3.7 10.1-9 12-5.3-1.9-9-6.4-9-12V7.4L16 4z"
        fill="none"
        stroke={T.accent}
        strokeWidth={1.6}
        strokeLinejoin="round"
        strokeDasharray={L}
        strokeDashoffset={L * (1 - draw)}
      />
      <path
        d="M11.2 16.4l3.2 3.2 6.6-7"
        fill="none"
        stroke={T.accent}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={20}
        strokeDashoffset={20 * (1 - tick)}
      />
    </svg>
  );
};
