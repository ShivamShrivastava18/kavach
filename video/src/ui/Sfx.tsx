import { Audio, Sequence, staticFile } from "remotion";

/** One-shot sound effect at a frame offset inside the current sequence. */
export const Sfx: React.FC<{ name: string; at?: number; volume?: number }> = ({ name, at = 0, volume = 0.5 }) => (
  <Sequence from={at} layout="none">
    <Audio src={staticFile(`sfx/${name}.mp3`)} volume={volume} />
  </Sequence>
);
