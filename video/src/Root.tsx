import { Composition } from "remotion";
import timing from "./timing.json";
import { Demo } from "./Demo";

export const Root: React.FC = () => (
  <Composition
    id="KavachDemo"
    component={Demo}
    durationInFrames={timing.totalFrames}
    fps={timing.fps}
    width={timing.width}
    height={timing.height}
  />
);
