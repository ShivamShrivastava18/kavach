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
