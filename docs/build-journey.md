# Kavach build journey

Timestamps are IST (UTC+5:30). This log is pasted into the Notion build-in-public page.

## 23 Oct 2026

- 22:30 Ideation. Rejected: visa photo prep, creator asset QA, civic reporting (lane already taken by three public entries). Picked Kavach: proof of derivation plus filled complaints for AI-morphed photos, riding the 20 Feb 2026 IT Rules 2-hour removal duty.
- 22:50 Design written, builder-reviewed. Decisions: no database (Cloudinary raw JSON), Gemma only sees blurred derivatives because the Gemini free tier may train on inputs, two-phase check so Vercel's function timeout is never hit.
- 23:10 Scaffold on Next 16 (create-next-app gave 16, plan said 15, accepted). vitest needed `@types/node@24`.
- 23:15 Fingerprints: own pHash (32x32 DCT, 8x8 low band, median threshold) and dHash (9x8), both 64-bit. Tests on a synthetic scene: resize and tint stay above 0.9, crop above 0.6, a different scene below 0.6.
- 23:20 Match calibration on the vector portraits (scripts/dev/calib.ts). Mirror and tint are free (1.00). Caption 0.92, JPEG q30 0.91, 256 px 0.92, 3 degree rotation 0.84, crop 90% 0.79, crop 80% 0.76. The full-image hash is what crops hurt, so the face terms were reweighted from 0.40/0.35/0.25 to 0.25/0.45/0.30 (full, face pHash, face dHash). After reweighting, crop 90 plus mirror plus tint plus caption scores 0.81, derived.
- 23:20 Caveat recorded: two different flat vector portraits score 0.80 against each other because they share a template. Real photographs differ far more. A higher-resolution face hash is on the list for tomorrow if time allows.
- 23:25 Bug: sharp applies only the last `.resize()` in a chain, so the "pixelated" face in the seed exhibit was pasted sharp. Split into two pipelines. Lesson: look at every generated image.
- 23:25 Seed exhibit is crop 90%, mirror, pink tint, caption. Scores 0.82, derived, mirrored detected.
- 23:40 Routes done. Next 16 with cacheComponents rejects `export const runtime`, and later rejected `use(params)` in a client page; dropped cacheComponents from the config, nothing needed it.
- 23:50 Gemma wiring. Gemma on the Gemini API has no system role, so the rules go in the user turn. Parser tolerates fences and prose. If the chosen provider has no key the template text is used with a visible "Template text" badge, not an error.

## 24 Oct 2026

- 00:00 Interface. Tailwind v4 refused `@apply btn` inside another class and silently dropped the whole stylesheet; the page rendered unstyled white. Custom classes cannot be applied, so the shared button rules are one selector list instead.
- 00:05 Verified in the browser at 1280 and 375 px: home, vault with Priya's two portraits, case page with the pixelated, stamped exhibit beside the matched photo, template drafts with copy and download. Production build clean.
- 00:10 README written. Push to GitHub. Vercel deploy waits on `vercel login` and the `.env` keys.
- 09:30 Fresh-context review of the whole branch (Opus). Two real bugs on the never-run live path: the Cloudinary `g_face` crop is a fixed 512 px window while calibration used a padded face box, so the face terms (0.75 of the score) would diverge between a 2048 px vault photo and a 1080 px screenshot; and `e_pixelate_faces,e_blur` in one URL component is invalid (one effect per component). Fixed: face prints always come from the local calibrated crop using Cloudinary's face box; effects are chained with `/`.
- 09:40 Also from the review: client re-encodes to JPEG under 4 MB and refuses otherwise; server runs `sharp().metadata()` before storing anything; every fetch in the UI tolerates non-JSON errors (Vercel 413, 504); Gemma calls get a 20 s per-call timeout and 48 s budget; moderation uses `aws_rek:explicit_nudity:0.6` and only "Explicit Nudity" labels count, never a bare rejection; model output must still carry case id, SHA prefix and name or the template is used; exhibits can never be served unblurred regardless of token; the unblurred seed exhibit moved out of `public/`.
- 09:45 Lesson: a flat-colour test image makes pHash bits noise-dominated (JPEG round trip flips 20 of 64 bits). On a gradient image the same round trip flips 0. Test images need texture.
- 10:00 Tomorrow's list, done early while waiting on keys: evidence bundle (zip of evidence.json, stamped blurred exhibit, both drafts; never the original), police-only original link via `private_download_url` with a 10-minute expiry behind a confirm, `docs/legal-sources.md` with Rule 3(2)(b) and BNS 77/351/356 verified against sources, `docs/judging-evidence.md`, and `scripts/smoke.ts` which runs the whole flow against any URL. Smoke against the production build in demo mode: 9 of 9 checks pass in 0.2 s.

## 24 Oct 2026, evening: real photos

- 21:50 Keys in. Cloudinary round trip passes (private upload, pHash, blurred derivative, JSON store). Vercel project linked.
- 22:00 The question we had not asked: how does this behave on a real person's photo? Wrote `scripts/morph-bench.ts`: takes a real portrait (free-licence Pexels), makes the edits a harasser makes (recompress, thumbnail, mirror, crop to face, tilt, filters, caption, screenshot of a chat, face pasted onto another body, all at once) and runs each through the live check, plus other people's portraits as negative controls.
- 22:10 First live run was humbling. All reposts and filters caught, but a different person scored 0.637 ("likely") and the face-on-another-body morph was missed at 0.570.
- 22:25 Cause one: the padded face crop was clamped at the image edge, so a face near the border was framed differently from the same face with margin. Fix: extend the image with replicated edge pixels before cropping (two sharp pipelines, since sharp runs extract before extend). Cause two: my body-swap variant cut the chin off; a real morph keeps the face. Fixed the variant.
- 22:40 Cause three, the real one: 64-bit hashes of two different faces agree on 70 to 75 percent of bits, because every face is a bright oval with dark hair at 32x32. Compared 8x8, 12x12 and 16x16 DCT bands offline against recorded Cloudinary face boxes: 16x16 (256 bits) puts different people at 0.55 to 0.61 (random is 0.50) and the same face after any edit at 0.83 or more. Made 256-bit the default, let the face hashes carry the score with the full-frame hash only able to raise it, moved "likely" to 0.70.
- 22:55 Live rerun: 12 of 12 edits derived (lowest: cropped to the face 0.830), 5 of 5 different people none (highest 0.605). Demo seed regenerated: 0.903 derived.
- 23:05 Gemma 4 live: the 26b model thinks for 400 to 2200 tokens before answering, which is 25 to 60 s on our prompt, past the API's own deadline (504). The image path also returns an opaque 500 now and then (same JPEG passed once, failed the next). The 31b model timed out on "OK".
- 23:30 Redesigned the model's job. It no longer rewrites two complaints; it writes the plain-language description, a first-person narrative and a severity, and the complaints are templated around the narrative. Hashes, dates and section numbers can no longer be lost. Two lanes race (image, text-only), first valid answer wins.
- 23:45 Still too slow. Probed the thinking controls: a thinking budget and "low" are rejected for Gemma, `thinkingLevel: minimal` is accepted and brings the answer back in 4 s with zero thought tokens. Pinned it with a test.
- 23:55 First real Gemma draft through the live path. Then a quota surprise: the benchmark had spent the Rekognition add-on's 50 free moderation operations for the month and every check started failing. Now the exhibit is stored unmoderated when the quota is gone, the case says "not screened for explicit content", and the evidence bundle records it.
- 00:10 Found an order bug on the way: validation ran before the name and URL were restored, so every honest answer that kept the placeholders was rejected. Restore first, validate second.
- 00:25 Deployed. Production: https://kavach-flame-gamma.vercel.app (the project's other aliases sit behind Vercel's deployment protection; kavach.vercel.app belongs to someone else). End-to-end smoke against production, 11 of 11 in 18 s, including a real Gemma 4 draft. The smoke now deletes its own shield so production does not fill with test profiles.

## 25 Oct 2026, morning: the demo video

- 08:30 New Cloudinary account with a fresh moderation quota; key verified, pushed to Vercel, production redeployed and smoke-tested. The first redeploy failed because the app's typecheck picked up the new `video/` folder; excluded it.
- 08:40 GitHub push protection caught `.env` in the unpushed commits (it was never in `.gitignore`). Rewrote those commits to drop it, ignored it, pushed. Nothing with keys ever reached GitHub.
- 08:50 Demo video, built in `video/` with Remotion. Playwright records the real production flow (create shield, register photo, drop the morph, verdict, Gemma draft, portal complaint, evidence bundle) with an injected cursor; eight scenes, the app's own fonts and colour tokens, captions burned in, light sound design from licensed Mixkit effects.
- 09:00 Narration: ElevenLabs was the plan, but the free tier had 32 of 10,000 characters left. Added Gemini TTS as the fallback in `video/tts/tts.mjs` (same free key as the complaint drafts, voice Kore). Lessons: the TTS models read any style instruction aloud and reject system instructions with a 500, so only the narration text goes in; the free tier allows 3 requests a minute and 10 a day per model, so the script waits on 429s and walks to a sibling model when a daily cap hits.
- 09:15 Final render: `video/out/kavach-demo.mp4`, 1920x1080, 30 fps, 144 s. Transcribed two clips back with Gemini to confirm only the script is spoken.
