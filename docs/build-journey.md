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
