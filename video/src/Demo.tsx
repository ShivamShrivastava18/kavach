import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import timing from "./timing.json";
import { ensureFonts } from "./fonts";
import { Card } from "./scenes/Card";
import { Footage, type Clip } from "./scenes/Footage";
import { Caption } from "./ui/Caption";
import { T } from "./theme";

export const Demo: React.FC = () => {
  ensureFonts();
  return (
    <AbsoluteFill style={{ background: T.bg, fontFamily: T.sans }}>
      {timing.scenes.map((s) => (
        <Sequence key={s.id} from={s.from} durationInFrames={s.frames} name={s.id}>
          {s.kind === "footage" && s.clip ? <Footage clip={s.clip as Clip} frames={s.frames} id={s.id} /> : <Card id={s.id} frames={s.frames} />}
          <Caption text={s.caption} duration={s.frames} />
          {s.hasVo && <Audio src={staticFile(`vo/${s.id}.mp3`)} volume={1} />}
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
