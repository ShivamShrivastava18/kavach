// Generates one narration mp3 per scene with ElevenLabs and writes public/vo/durations.json.
//   node tts/tts.mjs            (all scenes)
//   node tts/tts.mjs 03-vault   (one scene)
// The SDK reads ELEVENLABS_API_KEY from the environment; the repo's .env.local (git-ignored) is loaded first.
// Optional: ELEVENLABS_VOICE_ID (default Sarah, soft), ELEVENLABS_MODEL (default eleven_v4).
import { config } from "dotenv";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { execFileSync } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
config({ path: path.resolve(root, "..", ".env.local") });
config({ path: path.resolve(root, ".env") });

const scenes = JSON.parse(readFileSync(path.join(root, "script", "scenes.json"), "utf8")).scenes;
const outDir = path.join(root, "public", "vo");
mkdirSync(outDir, { recursive: true });

if (!process.env.ELEVENLABS_API_KEY) {
  console.error("ELEVENLABS_API_KEY is not set. Run `npx -y @elevenlabs/cli@latest onboard init` in the repo root.");
  process.exit(1);
}
const client = new ElevenLabsClient();
const voiceId = process.env.ELEVENLABS_VOICE_ID ?? "EXAVITQu4vr4xnSDxMaL"; // Sarah: soft, clear
const modelId = process.env.ELEVENLABS_MODEL ?? "eleven_v4";
const only = process.argv[2];

function seconds(file) {
  return parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString().trim());
}

async function synth(scene) {
  const file = path.join(outDir, `${scene.id}.mp3`);
  const audio = await client.textToSpeech.convert(voiceId, {
    text: scene.narration,
    modelId,
    outputFormat: "mp3_44100_128",
    // eleven_v4 accepts only stability and similarity_boost.
    voiceSettings: { stability: 0.6, similarityBoost: 0.75 },
  });
  await pipeline(Readable.fromWeb(audio), createWriteStream(file));
  return file;
}

const durFile = path.join(outDir, "durations.json");
const durations = existsSync(durFile) ? JSON.parse(readFileSync(durFile, "utf8")) : {};
for (const scene of scenes) {
  if (only && scene.id !== only) continue;
  const file = await synth(scene);
  durations[scene.id] = seconds(file);
  console.log(scene.id.padEnd(14), `${durations[scene.id].toFixed(1)}s`);
}
writeFileSync(durFile, JSON.stringify(durations, null, 2));
console.log("wrote public/vo/durations.json");
