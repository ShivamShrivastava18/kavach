import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { T } from "../theme";
import { Shield } from "../ui/Shield";
import { Sfx } from "../ui/Sfx";

const ease = { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) } as const;

/** Lines rise in one after another, each on its own delay. */
const Lines: React.FC<{ lines: { text: string; style?: React.CSSProperties }[]; delay?: number; gap?: number }> = ({ lines, delay = 0, gap = 9 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {lines.map((l, i) => {
        const s = spring({ frame: frame - delay - i * gap, fps, config: { damping: 200, stiffness: 120, mass: 0.9 } });
        const o = interpolate(frame - delay - i * gap, [0, 14], [0, 1], ease);
        return (
          <div key={i} style={{ opacity: o, transform: `translateY(${(1 - s) * 26}px)`, ...l.style }}>
            {l.text}
          </div>
        );
      })}
    </div>
  );
};

const H: React.CSSProperties = { fontFamily: T.sans, fontWeight: 600, fontSize: 92, lineHeight: 1.02, letterSpacing: "-0.035em", color: T.fg };
const Sub: React.CSSProperties = { fontFamily: T.sans, fontWeight: 400, fontSize: 34, lineHeight: 1.4, color: T.muted, maxWidth: 980, marginTop: 36 };
const Eyebrow: React.CSSProperties = { fontFamily: T.mono, fontSize: 20, letterSpacing: "0.16em", textTransform: "uppercase", color: T.accent, marginBottom: 34 };

const Frame: React.FC<{ children: React.ReactNode; fadeOut: number }> = ({ children, fadeOut }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [fadeOut - 14, fadeOut], [1, 0], ease);
  return (
    <AbsoluteFill style={{ background: T.bg, opacity: o }}>
      <div style={{ position: "absolute", left: 160, right: 160, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>{children}</div>
    </AbsoluteFill>
  );
};

export const Card: React.FC<{ id: string; frames: number }> = ({ id, frames }) => {
  const frame = useCurrentFrame();
  switch (id) {
    case "01-hook":
      return (
        <Frame fadeOut={frames}>
          <Sfx name="sub-bass-knock" at={4} volume={0.45} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", alignItems: "center", gap: 80 }}>
            <div>
              <Lines lines={[{ text: "A photo shield for women", style: Eyebrow }]} delay={6} />
              <Lines delay={14} lines={[{ text: "Kavach", style: { ...H, fontSize: 190, letterSpacing: "-0.05em" } }]} />
              <Lines
                delay={2 * 30}
                gap={2 * 30}
                lines={[
                  { text: "Her photo, morphed and posted. She finds out from a friend.", style: Sub },
                  { text: "Within an hour it is on three platforms.", style: { ...Sub, marginTop: 6 } },
                ]}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ width: 360, height: 360, borderRadius: 999, border: `1px solid ${T.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Shield size={200} delay={20} />
              </div>
            </div>
          </div>
        </Frame>
      );
    case "02-law": {
      const n = interpolate(frame, [20, 60], [0, 2], { ...ease, easing: Easing.out(Easing.quad) });
      return (
        <Frame fadeOut={frames}>
          <Sfx name="transition-soft" at={2} volume={0.35} />
          <Lines lines={[{ text: "IT Rules 2021, Rule 3(2)(b), in force 20 February 2026", style: Eyebrow }]} delay={4} />
          <div style={{ display: "flex", alignItems: "baseline", gap: 48 }}>
            <div style={{ ...H, fontSize: 300, fontFamily: T.mono, fontWeight: 500, letterSpacing: "-0.06em", color: T.accent }}>{Math.round(n)}</div>
            <Lines delay={24} lines={[{ text: "hours for a platform", style: H }, { text: "to take it down.", style: H }]} />
          </div>
          <Lines
            delay={4 * 30}
            gap={6 * 30}
            lines={[
              { text: "Once it receives a complaint about a non-consensual morphed or intimate image.", style: Sub },
              { text: "The hard part is proving, that day, that the image was made from her photo, and writing the complaint.", style: { ...Sub, marginTop: 8 } },
            ]}
          />
        </Frame>
      );
    }
    case "07-stack":
      return (
        <Frame fadeOut={frames}>
          <Sfx name="transition-soft" at={2} volume={0.35} />
          <Lines lines={[{ text: "What it runs on", style: Eyebrow }]} delay={4} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 80, rowGap: 36 }}>
            {[
              ["Cloudinary", "Private storage, face boxes, pHash, moderation. Every blurred exhibit is a signed transformation; originals never leave."],
              ["Gemma 4", "gemma-4-26b-a4b-it on the free tier, thinking set to minimal. Sees only the blurred exhibit and redacted evidence."],
              ["Own fingerprints", "256-bit pHash and dHash of the face crop, mirror pass, calibrated on real portraits. MIT, in the repo."],
              ["Next.js on Vercel", "No database. Profiles and cases are private JSON on Cloudinary. Runs on nothing but free tiers."],
            ].map(([t, d], i) => (
              <div key={t} style={{ borderTop: `1px solid ${T.line}`, paddingTop: 22 }}>
                <Lines delay={10 + i * 4.5 * 30} gap={5} lines={[{ text: t, style: { ...H, fontSize: 48 } }, { text: d, style: { ...Sub, fontSize: 26, marginTop: 12, maxWidth: 700 } }]} />
              </div>
            ))}
          </div>
        </Frame>
      );
    case "08-close":
      return (
        <Frame fadeOut={frames + 1000}>
          <Sfx name="impact-cine" at={10} volume={0.5} />
          <Sfx name="sparkle" at={40} volume={0.25} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <Shield size={140} delay={6} />
            <Lines delay={14} gap={8} lines={[{ text: "They can morph the photo. They can't hide where it came from.", style: { ...Sub, marginTop: 20, color: T.fg } }, { text: "Kavach", style: { ...H, fontSize: 150, marginTop: 10 } }]} />
            <Lines
              delay={46}
              gap={7}
              lines={[
                { text: "kavach-flame-gamma.vercel.app", style: { ...Sub, fontFamily: T.mono, color: T.fg, marginTop: 28 } },
                { text: "github.com/ShivamShrivastava18/kavach", style: { ...Sub, fontFamily: T.mono, fontSize: 24, marginTop: 10 } },
                { text: "MIT  ·  SheBuilds HackDays 2026  ·  Cloudinary + Gemma 4", style: { ...Sub, fontFamily: T.mono, fontSize: 24, marginTop: 4 } },
              ]}
            />
          </div>
        </Frame>
      );
    default:
      return <Frame fadeOut={frames}>{id}</Frame>;
  }
};
