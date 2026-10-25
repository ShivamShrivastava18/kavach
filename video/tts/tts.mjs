// Generates one narration mp3 per scene with ElevenLabs and writes public/vo/durations.json.
//   node tts/tts.mjs            (all scenes)
//   node tts/tts.mjs 03-vault   (one scene)
// The SDK reads ELEVENLABS_API_KEY from the environment; the repo's .env.local (git-ignored) is loaded first.
// Optional: ELEVENLABS_VOICE_ID (default Sarah, soft), ELEVENLABS_MODEL (default eleven_v4).
import { config } from "dotenv";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { GoogleGenAI } from "@google/genai";
import { execFileSync } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
config({ path: path.resolve(root, "..", ".env.local"), override: true });
config({ path: path.resolve(root, "..", ".env") }); // GEMINI_API_KEY for the fallback

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
// Fallback when the ElevenLabs quota is spent: Gemini TTS on the free tier (same key as the complaint drafts).
const provider = process.env.TTS_PROVIDER ?? "elevenlabs";
// Daily caps are per model on the free tier (10 a day each), so walk down this list when one is spent.
const GEMINI_TTS_MODELS = (process.env.GEMINI_TTS_MODEL ?? "gemini-3.8-flash-tts,gemini-3.8-flash-lite-tts,gemini-2.5-flash-preview-tts,gemini-3.1-flash-tts-preview").split(",");
let geminiModel = GEMINI_TTS_MODELS[0];
const geminiVoice = process.env.GEMINI_TTS_VOICE ?? "Kore";
const only = process.argv.slice(2).find((a) => !a.startsWith("--"));

function seconds(file) {
  return parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString().trim());
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Free tier: 3 requests a minute per model. Wait out a 429 and try again, up to four times. */
async function withRetry(fn, label) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (e) {
      const msg = String(e?.message ?? e);
      if (attempt < 4 && /"code":500|INTERNAL/.test(msg)) {
        console.warn(`${label}: server error, retrying in 5s (attempt ${attempt})`);
        await sleep(5000);
        continue;
      }
      if (attempt >= 4 || !/429|RESOURCE_EXHAUSTED/.test(msg)) throw e;
      const daily = /per day/i.test(msg);
      if (daily) {
        const next = GEMINI_TTS_MODELS[GEMINI_TTS_MODELS.indexOf(geminiModel) + 1];
        if (!next) throw e;
        console.warn(`${label}: daily cap on ${geminiModel}, switching to ${next}`);
        geminiModel = next;
        continue;
      }
      const secs = Number(/retry in (\d+)/i.exec(msg)?.[1] ?? 60) + 3;
      console.warn(`${label}: rate limited, waiting ${secs}s (attempt ${attempt})`);
      await sleep(secs * 1000);
    }
  }
}

async function synthGemini(scene, file) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const r = await withRetry(() => ai.models.generateContent({
    model: geminiModel,
    // Only the narration goes in the content: anything else in there gets read aloud.
    contents: [{ role: "user", parts: [{ text: scene.narration }] }],
    // No style instruction anywhere: the TTS models read it aloud (in the prompt) or fail (as a system instruction).
    config: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: geminiVoice } } } },
  }), scene.id);
  const data = r.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData;
  if (!data?.data) throw new Error(`gemini tts returned no audio for ${scene.id}`);
  const rate = /rate=(\d+)/.exec(data.mimeType ?? "")?.[1] ?? "24000";
  const pcm = path.join(outDir, `${scene.id}.pcm`);
  writeFileSync(pcm, Buffer.from(data.data, "base64"));
  execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "s16le", "-ar", rate, "-ac", "1", "-i", pcm, "-codec:a", "libmp3lame", "-b:a", "128k", file]);
  execFileSync("rm", ["-f", pcm]);
  return "gemini:" + geminiModel;
}

function isQuota(e) {
  return e?.statusCode === 401 && /quota_exceeded/.test(JSON.stringify(e.body ?? ""));
}

async function synth(scene) {
  const file = path.join(outDir, `${scene.id}.mp3`);
  if (provider === "gemini") return { file, spokenBy: await synthGemini(scene, file) };
  try {
    await synthEleven(scene, file);
    return { file, spokenBy: "elevenlabs:" + modelId };
  } catch (e) {
    if (!isQuota(e) || !process.env.GEMINI_API_KEY) throw e;
    console.warn(`${scene.id}: ElevenLabs quota exhausted, using Gemini TTS`);
    return { file, spokenBy: await synthGemini(scene, file) };
  }
}

async function synthEleven(scene, file) {
  const audio = await client.textToSpeech.convert(voiceId, {
    text: scene.narration,
    modelId,
    outputFormat: "mp3_44100_128",
    // eleven_v4 accepts only stability and similarity_boost.
    voiceSettings: { stability: 0.6, similarityBoost: 0.75 },
  });
  await pipeline(Readable.fromWeb(audio), createWriteStream(file));
}

const durFile = path.join(outDir, "durations.json");
const durations = existsSync(durFile) ? JSON.parse(readFileSync(durFile, "utf8")) : {};
const force = process.argv.includes("--force");
for (const scene of scenes) {
  if (only && scene.id !== only) continue;
  const existing = path.join(outDir, `${scene.id}.mp3`);
  if (!force && !only && existsSync(existing) && durations[`${scene.id}:provider`]) {
    console.log(scene.id.padEnd(14), `${durations[scene.id].toFixed(1)}s`, durations[`${scene.id}:provider`], "(kept)");
    continue;
  }
  const { file, spokenBy } = await synth(scene);
  durations[scene.id] = seconds(file);
  durations[`${scene.id}:provider`] = spokenBy;
  console.log(scene.id.padEnd(14), `${durations[scene.id].toFixed(1)}s`, spokenBy);
}
writeFileSync(durFile, JSON.stringify(durations, null, 2));
console.log("wrote public/vo/durations.json");
