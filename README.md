# Kavach

Live: https://kavach-flame-gamma.vercel.app · Demo video: https://youtu.be/p4adFXAz8tk

**A photo shield for women.** Kavach proves a morphed image was made from your own photo, blurs it so you never have to look at it clear, and writes the two complaints that get it taken down: one for the platform, citing the 2-hour removal duty under the IT Rules as amended on 10 Feb 2026, and one for the National Cyber Crime Reporting Portal.

Built in one night for SheBuilds Hacktoberfest HackDays 2026. Cloudinary does the heavy lifting. Gemma 4 writes the complaints. The fingerprinting is open source and lives in this repo.

## Try it in 60 seconds

On the home page, **See it in 60 seconds** opens a throwaway sample shield: two generated portraits registered, a sample morph checked, proven, blurred, and the complaint written by Gemma 4. Nothing of yours is uploaded. From there, **Try it on your own photo** lets you register a real photo, and **Simulate six edits** asks Kavach to make the edits a harasser makes (mirror, crop to the face, colour filter, abusive caption, screenshot of a chat, WhatsApp recompression) through Cloudinary transformations and run each one through the normal check. Every edit becomes a real case. **Delete this sample** removes the shield and every asset and record it owns.

What Kavach never does: serve an original, recognise a face, or keep anything you deleted.

## The 20-second demo

1. **Priya registers** her real photos in a private vault. Each is fingerprinted the moment it lands.
2. A stranger sends her a morphed version. **She drops it into Kavach.**
3. Kavach says **"Made from your photo uploaded 12 Oct 2026, similarity 82%"**, shows the exhibit blurred and stamped with case id, hash and time, and hands her two filled complaints with copy and download.

Demo mode (no keys) runs the whole flow on a seeded profile. Live mode takes your own photos.

## What Kavach does not do

It does not detect AI. Detectors are wrong often enough that a platform can ignore them. Kavach answers one narrow question with evidence: was this image made from a photo you registered? The verdict names its methods and its score, and every draft tells you to verify section numbers before filing.

## Architecture

```
browser ──multipart──▶ /api/vault, /api/check  (Next.js route handlers, Node)
                           │
                           ├─▶ Cloudinary upload  type=private, phash, faces, quality_analysis, colors, moderation=aws_rek
                           ├─▶ Cloudinary g_face crop ──▶ sharp ──▶ Kavach pHash + dHash (src/lib/fingerprint.ts)
                           ├─▶ match: Cloudinary pHash + face pHash + face dHash, run twice (mirror pass)  (src/lib/match.ts)
                           └─▶ case record ──▶ Cloudinary raw JSON (private)      no database

browser ◀── /api/img?t=<signed, 10 min> ◀── Cloudinary e_pixelate_faces,e_blur + l_text evidence stamp
browser ──▶ /api/case/:id/draft ──▶ Gemma 4 (Gemini API) ◀── blurred exhibit + blurred match + structured evidence
                                   name and post URL replaced by placeholders before the call, restored after
```

Two-phase check: upload and match return at once; the Gemma draft runs in a second request so a slow model never blocks the verdict.

## Cloudinary, feature by feature

| Feature | What it does in Kavach |
|---|---|
| `type: private` uploads in per-shield folders | Vault photos and exhibits never get a public URL |
| `phash: true` on upload | First of three fingerprints, straight from Cloudinary |
| `faces: true` and `c_crop,g_face` | Cloudinary finds the face; Kavach fingerprints the face crop so crops and captions elsewhere do not hide the match |
| `quality_analysis`, `colors` | Stored as evidence, used to warn on weak uploads |
| `moderation: aws_rek` | Flags explicit content, which switches the complaint to the intimate-imagery sections (67A) |
| `e_pixelate_faces` + `e_blur` | The exhibit is only ever delivered blurred, to the victim and to the model |
| `l_text` overlay | Burns case id, SHA-256 prefix and timestamp into the blurred exhibit |
| Signed delivery URLs, `private_download_url` | Short-lived access to derivatives; victim-only download of the original for police |
| Raw JSON assets | Profiles and cases live as private raw files beside the evidence |

## Gemma 4

Gemma 4 (`gemma-4-26b-a4b-it` on the Gemini API free tier) receives the blurred, stamped exhibit and the structured evidence as JSON. It never sees an unblurred face. Because the free tier may use inputs for training, the victim's name and the post link are replaced with `[VICTIM_NAME]` and `[POST_URL]` before the call and restored after. It writes what only a model can write: a plain-language description for the victim, a first-person narrative for the complaint body, and a severity. The legal complaints are templated around that narrative, so hashes, dates and section numbers never depend on the model. Two lanes run in parallel, one with the image and one text-only, and the first valid answer wins (the image path returns an opaque 500 now and then); thinking is set to minimal, which turned a 25 to 60 second answer into 4 seconds. Any failure falls back to the template text with a visible badge. `gemma-4-31b-it` was tried and dropped: it timed out on a one-word prompt.

`LLM_PROVIDER=gemma|claude|demo` switches providers. Claude (`claude-haiku-5-5`) is wired as a fallback only.

## Running it

```bash
npm install
cp .env.example .env     # fill in CLOUDINARY_URL, GEMINI_API_KEY, SESSION_SECRET
npm run dev
```

In the Cloudinary console, enable the **Amazon Rekognition AI Moderation** add-on (free tier, 50 operations a month) and set `CLOUDINARY_MODERATION=1`. Without it, or once the monthly quota is spent, the exhibit is stored unmoderated, the case shows "not screened for explicit content", and the complaint uses the non-explicit sections.

Demo mode: leave `CLOUDINARY_URL` empty or set `DEMO_MODE=1`. You get Priya's seeded shield, her two portraits, the morphed exhibit and a precomputed case. Uploads are disabled. The seed images are generated vector art (`scripts/make-seed.ts`) and depict no real person.

```bash
npm test                 # 47 unit tests: fingerprints, matching, session, redaction, templates, parser
npx tsx scripts/cld-smoke.ts   # round-trips an image and a JSON record through your Cloudinary account
npx tsx scripts/dev/calib.ts   # prints match scores for common morph transformations
npx tsx scripts/smoke.ts http://localhost:3000   # end-to-end flow against a running Kavach (LIVE=1 to upload for real)
```

## How the match is scored

Three hashes: Cloudinary's 64-bit pHash on the full image, and Kavach's own 256-bit pHash (32x32 DCT, 16x16 low band) and dHash (17x16) on the face crop, cut from Cloudinary's face box with 20% padding and edge replication so a face at the border is framed like one with margin. With a face on both sides the face score is `0.6 × face pHash + 0.4 × face dHash`, and the final score is `max(face, 0.5 × face + 0.5 × full)`: the full-image hash can corroborate but never penalise, because a morph moves the face into a new frame on purpose. Without a face it falls back to full-image pHash and dHash. Every comparison runs twice, once against the mirrored suspect. Bands: 80 and above is "made from your photo", 70 to 79 "likely", below 70 "no match".

Calibrated on real portraits (`scripts/morph-bench.ts`, free-licence Pexels photos, 24 Oct 2026), through the live Cloudinary path:

| Edit of the registered photo | Score | Verdict |
| --- | --- | --- |
| Exact file | 1.000 | derived |
| WhatsApp-style recompression (q20) | 0.964 | derived |
| 400 px thumbnail | 0.977 | derived |
| Mirrored | 0.964 | derived |
| Cropped to the face | 0.830 | derived |
| 3 degree tilt | 0.852 | derived |
| Warm colour filter | 0.960 | derived |
| Sepia | 0.980 | derived |
| Abusive caption added | 0.998 | derived |
| Screenshot of a chat containing it | 0.837 | derived |
| Face pasted onto another photo | 0.850 | derived |
| Mirror + crop + recompress + filter | 0.930 | derived |
| Five different people (controls) | 0.553 to 0.605 | none |

What it does not do: it does not recognise a face. A deepfake generated from a photo that was never registered will not match, and the verdict says so ("no registered photo matched"). The complaint then rests on identity and consent, which the drafts state plainly.

## Repo map

- `src/lib/fingerprint.ts` pHash, dHash, Hamming distance, mirror, face crop
- `src/lib/match.ts` weighted scoring, mirror pass, verdict bands
- `src/lib/cloudinary.ts` private uploads, signed derivatives, raw JSON store, expiring downloads
- `src/lib/llm/` Gemma, Claude and demo providers, prompt, tolerant parser
- `src/lib/templates.ts` the two complaint templates and their legal references
- `src/app/api/` profile, vault, check, case, draft, bundle, original, image proxy
- `docs/judging-evidence.md` criteria to evidence; `docs/legal-sources.md` every legal reference with its source
- `docs/superpowers/specs/` the design; `docs/superpowers/plans/` the build plan; `docs/build-journey.md` the log

## Licence

MIT. See `LICENSE`.
