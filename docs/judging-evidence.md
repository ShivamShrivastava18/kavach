# Judging criteria to evidence

The official rubric was not published. This maps the five headings one competitor's evaluator guide used to concrete places in this repo and the demo.

## 1. Real-world problem and social impact

- The problem: AI-morphed photos used to harass and blackmail women. Complaints involving women rose from about 50,000 (2024) to nearly 80,000 (2026); about 62% of deepfake abuse cases involving women go unreported. Home page and About page carry the numbers with sources.
- The gap Kavach fills: since 20 Feb 2026 platforms must remove such content within 2 hours of a complaint (Rule 3(2)(b)), but the victim still has to prove the fake and file correctly. Kavach does both in one gesture. `docs/legal-sources.md` records every reference.
- Designed for the victim: she never sees the fake unblurred (`src/app/api/img/route.ts` refuses to serve exhibits any other way); her name and the post link never reach the model (`src/lib/llm/index.ts`); the drafts tell her what to do next and to verify section numbers.

## 2. Use of Cloudinary

Nine features, each doing visible work. Table in `README.md`. Code in `src/lib/cloudinary.ts`, `src/app/api/vault/route.ts`, `src/app/api/check/route.ts`, `src/app/api/img/route.ts`.

- `type: private` uploads in per-shield folders
- `phash: true` perceptual hash returned on upload, the first of three fingerprints
- `faces: true` face coordinates, used to crop the face region for the other two fingerprints
- `quality_analysis` and `colors`
- `moderation: aws_rek:explicit_nudity:0.6`, which switches the complaint to the 67A template (`src/lib/moderation.ts`)
- `e_pixelate_faces` and `e_blur` chained, the only way an exhibit is ever delivered
- `l_text` overlay burning case id, SHA-256 prefix and timestamp into the exhibit
- signed delivery URLs for private derivatives and `private_download_url` with a 10-minute expiry for the police-only original (`src/app/api/case/[id]/original/route.ts`)
- raw JSON assets as the whole data store (`src/lib/store.ts`)

The demo names the features on screen: the case page shows method chips ("Cloudinary pHash", "face pHash", "face dHash") and the exhibit caption says how it was delivered.

## 3. Technical depth

- Own perceptual hashing: 32x32 DCT pHash and 9x8 dHash, 64-bit, MIT (`src/lib/fingerprint.ts`), with tests on resize, tint, crop, mirror and a different image.
- Match engine with a mirror pass and face-weighted scoring, calibrated and documented (`src/lib/match.ts`, `scripts/dev/calib.ts`, journey log). Calibration table in the README.
- Gemma 4 through the Gemini API with image input, model fallback, text-only retry, per-call timeout and total budget (`src/lib/llm/gemma.ts`); tolerant JSON parser (`src/lib/llm/parse.ts`); output validation that refuses drafts that lost the case id, hash or name (`src/lib/llm/validate.ts`).
- Two-phase check so the verdict never waits on the model.
- Privacy by construction: signed image tokens with 10-minute expiry (`src/lib/imgtoken.ts`), redaction before the model call, EXIF orientation normalised before hashing.
- 47 unit tests (`npm test`), a Cloudinary round-trip script (`scripts/cld-smoke.ts`) and an end-to-end smoke script against any URL (`scripts/smoke.ts`).

## 4. Design and user experience

- One gesture: drop the image, get the verdict. The verdict line is the largest text on the page.
- The exhibit is blurred and stamped before the victim sees it; her own matched photo sits beside it so the claim is checkable at a glance.
- Drafts appear in tabs with Copy, Download and an evidence bundle. The provider badge is honest: "Drafted by Gemma 4", "Template text" or "Fallback text".
- Calm voice, no exclamation marks, second person. Works at 375 px.
- Loading skeletons, empty vault state, inline errors for bad uploads, oversize files and storage outages.

## 5. Completeness and quality

- Deployed URL runs on live keys; demo mode runs with none and is labelled.
- Design doc, implementation plan, ledger of every ruling, and a dated build journey (`docs/`).
- A fresh-context code review was run on the whole branch before submission; its findings and fixes are in `docs/build-journey.md` (24 Oct).
- MIT licence; seed images are generated vector art with a recorded licence.

## MLH side prizes

- Best Use of Gemma 4: Gemma reads the blurred exhibit and the evidence and writes both complaints. `src/lib/llm/gemma.ts`, `src/lib/llm/prompt.ts`.
- Best Open-Source AI Project: MIT repo; the fingerprinting and matching that produce the proof are original open-source code with tests.
