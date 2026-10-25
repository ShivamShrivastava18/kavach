import { AbsoluteFill, Easing, Freeze, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { T } from "../theme";
import { Sfx } from "../ui/Sfx";

export type Clip = { start: number; end: number; focus: [number, number] };

const MIN_RATE = 0.75;

/**
 * A recorded clip inside a framed window. Plays at 1x when it fits the narration, down to 0.75x when it
 * does not, and freezes on its last frame for the remainder while the camera keeps pushing in slowly.
 */
export const Footage: React.FC<{ clip: Clip; frames: number; id: string }> = ({ clip, frames, id }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const clipSeconds = clip.end - clip.start;
  const sceneSeconds = frames / fps;
  const rate = Math.max(MIN_RATE, Math.min(1, clipSeconds / sceneSeconds));
  const playFrames = Math.min(frames, Math.round((clipSeconds / rate) * fps));
  const lastSourceFrame = Math.round(clip.end * fps) - 1;

  const ease = { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) } as const;
  const scale = interpolate(frame, [0, frames], [1.0, 1.09], { ...ease, easing: Easing.linear });
  const fadeIn = interpolate(frame, [0, 12], [0, 1], ease);
  const fadeOut = interpolate(frame, [frames - 12, frames], [1, 0], ease);
  const [fx, fy] = clip.focus;

  const video = (
    <OffthreadVideo
      src={staticFile("footage.mp4")}
      startFrom={Math.round(clip.start * fps)}
      endAt={Math.round(clip.end * fps)}
      playbackRate={rate}
      muted
      style={{ width: 1920, height: 1080, display: "block" }}
    />
  );

  return (
    <AbsoluteFill style={{ background: T.bg, opacity: fadeIn * fadeOut }}>
      <Sfx name="swoosh-quick" at={0} volume={0.22} />
      {id === "05-verdict" && <Sfx name="sparkle" at={Math.round(1.6 * fps)} volume={0.3} />}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          transform: `scale(${scale})`,
          transformOrigin: `${fx * 100}% ${fy * 100}%`,
        }}
      >
        <Sequence from={0} durationInFrames={playFrames} layout="none">
          {video}
        </Sequence>
        {playFrames < frames && (
          <Sequence from={playFrames} durationInFrames={frames - playFrames} layout="none">
            <Freeze frame={0}>
              <OffthreadVideo src={staticFile("footage.mp4")} startFrom={lastSourceFrame} muted style={{ width: 1920, height: 1080, display: "block" }} />
            </Freeze>
          </Sequence>
        )}
      </div>
      {/* a thin vignette so the UI edges do not read as a hard crop while zoomed */}
      <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 220px rgba(12,12,14,0.9)", pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
