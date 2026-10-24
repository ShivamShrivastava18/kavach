# Kavach

**A photo shield for women.** Kavach proves a morphed image was made from your own photo, blurs it so you never have to look at it clear, and writes the two complaints that get it taken down: one for the platform, citing the 2-hour removal duty under the IT Rules as amended on 10 Feb 2026, and one for the National Cyber Crime Reporting Portal.

Built in one night for SheBuilds Hacktoberfest HackDays 2026. Cloudinary does the heavy lifting. Gemma 4 writes the complaints. The fingerprinting is open source and lives in this repo.

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

Gemma 4 (`gemma-4-26b-a4b-it`, falling back to `gemma-4-31b-it`) receives the blurred, stamped exhibit, a blurred thumbnail of the matched vault photo, and the structured evidence as JSON. It never sees an unblurred face. Because the Gemini free tier may use inputs for training, the victim's name and the post link are replaced with `[VICTIM_NAME]` and `[POST_URL]` before the call and restored after. It rewrites two template complaints and returns JSON; a tolerant parser handles fences and prose, and any failure falls back to the template text with a visible badge.

`LLM_PROVIDER=gemma|claude|demo` switches providers. Claude (`claude-haiku-5-5`) is wired as a fallback only.

## Running it

```bash
npm install
cp .env.example .env     # fill in CLOUDINARY_URL, GEMINI_API_KEY, SESSION_SECRET
npm run dev
```

In the Cloudinary console, enable the **Amazon Rekognition AI Moderation** add-on (free tier) and set `CLOUDINARY_MODERATION=1`. Without it, moderation is skipped and the complaint uses the non-explicit sections.

Demo mode: leave `CLOUDINARY_URL` empty or set `DEMO_MODE=1`. You get Priya's seeded shield, her two portraits, the morphed exhibit and a precomputed case. Uploads are disabled. The seed images are generated vector art (`scripts/make-seed.ts`) and depict no real person.

```bash
npm test                 # 48 unit tests: fingerprints, matching, session, redaction, templates, parser
npx tsx scripts/cld-smoke.ts   # round-trips an image and a JSON record through your Cloudinary account
npx tsx scripts/dev/calib.ts   # prints match scores for common morph transformations
```

## How the match is scored

Three 64-bit hashes: Cloudinary pHash on the full image, Kavach pHash and dHash on the face crop. With a face on both sides the score is `0.25 × full + 0.45 × face pHash + 0.30 × face dHash`; without a face it falls back to full-image pHash and dHash. Every comparison runs twice, once against the mirrored suspect. Calibration on the seed portraits: mirror and tint cost nothing, caption 0.92, JPEG q30 0.91, 256 px downscale 0.92, 90% crop with mirror, tint and caption 0.81. Bands: 80 and above is "made from your photo", 60 to 79 "likely", below 60 "no match".

## Repo map

- `src/lib/fingerprint.ts` pHash, dHash, Hamming distance, mirror, face crop
- `src/lib/match.ts` weighted scoring, mirror pass, verdict bands
- `src/lib/cloudinary.ts` private uploads, signed derivatives, raw JSON store, expiring downloads
- `src/lib/llm/` Gemma, Claude and demo providers, prompt, tolerant parser
- `src/lib/templates.ts` the two complaint templates and their legal references
- `src/app/api/` profile, vault, check, case, draft, image proxy
- `docs/superpowers/specs/` the design; `docs/superpowers/plans/` the build plan; `docs/build-journey.md` the log

## Licence

MIT. See `LICENSE`.
