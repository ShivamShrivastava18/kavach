// Builds src/timing.json from script/scenes.json, public/vo/durations.json (if present) and footage/clips.json.
// Scene length = narration length + tail, or minSeconds when no narration file exists yet.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = JSON.parse(readFileSync(path.join(root, "script", "scenes.json"), "utf8"));
const durFile = path.join(root, "public", "vo", "durations.json");
const durations = existsSync(durFile) ? JSON.parse(readFileSync(durFile, "utf8")) : {};
const clips = JSON.parse(readFileSync(path.join(root, "footage", "clips.json"), "utf8"));
const TAIL = 0.7;
const fps = script.fps;

let from = 0;
const scenes = script.scenes.map((s) => {
  const vo = durations[s.id];
  const seconds = vo ? Math.max(s.minSeconds, vo + TAIL) : s.minSeconds;
  const frames = Math.round(seconds * fps);
  const clip = s.kind === "footage" ? clips[s.clip] : undefined;
  const out = { ...s, from, frames, seconds, hasVo: Boolean(vo), voSeconds: vo ?? null, clip };
  from += frames;
  return out;
});
const timing = { fps, width: script.width, height: script.height, totalFrames: from, scenes };
writeFileSync(path.join(root, "src", "timing.json"), JSON.stringify(timing, null, 2));
console.log(`${scenes.length} scenes, ${(from / fps).toFixed(1)}s total, narration files: ${Object.keys(durations).length}`);
for (const s of scenes) console.log(`  ${s.id.padEnd(14)} ${s.seconds.toFixed(1).padStart(5)}s ${s.hasVo ? "vo" : "--"} ${s.clip ? `clip ${s.clip.start}-${s.clip.end}s` : ""}`);
