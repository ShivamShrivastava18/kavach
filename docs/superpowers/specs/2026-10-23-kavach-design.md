# Kavach: design

Date: 2026-10-23. Event: SheBuilds Hacktoberfest HackDays 2026. Online submission closes 25 Oct 2026. Finale 31 Oct 2026 at PW IOI, Noida.

## Intent

A woman registers her real photos in a private vault. When a morphed image of her appears, she drops it into Kavach. Kavach proves it was derived from one of her registered photos, never shows her the fake unblurred, and hands her two filled complaints: one for the platform, citing the 2-hour removal duty under the February 2026 IT Rules amendment, and one for the national cyber crime portal. It also packages an evidence bundle (hashes, timestamps, match scores, blurred exhibit) she can attach to either.

The law already forces platforms to act within 2 hours. Victims still have to prove the fake came from their photo and file the complaint correctly. Kavach does both, in one gesture.

## Why this, why now

- SheBuilds is a women-in-tech community. AI morphing is a fast-growing harm aimed mostly at women aged 18 to 30. Complaints involving women rose from roughly 50,000 in 2024 to nearly 80,000 in 2026, and about 62% of deepfake abuse cases involving women go unreported.
- Since 20 Feb 2026, platforms must remove non-consensual deepfakes within 2 hours of a complaint.
- Cloudinary is mandatory for the hackathon. Here it does the real work: private storage, perceptual hashing, face crops, blur, moderation, overlays and expiring links.
- MLH side prizes: Best Use of Gemma 4 (Gemma reads the exhibit and drafts the complaints) and Best Open-Source AI Project (MIT repo, open-source fingerprinting).
- Other public entries for this event are civic snap-and-report apps. This lane is empty.

## Goals

1. The 20-second demo: register profile photo, drop morphed image, see "made from your photo uploaded 12 Oct, similarity 0.91", see it blurred, download the filled complaints. Works end to end on the deployed URL.
2. Cloudinary used by name in at least seven places that each do visible work.
3. Gemma 4 visibly reads the (blurred) exhibit and writes the complaints.
4. Runs in demo mode with no API keys, with a seeded profile and a seeded exhibit.
5. Repo is public, MIT, with a judging-criteria-to-evidence file and a build journey log ready to paste into Notion.

## Non-goals

- Deepfake or AI-generation detection. Kavach proves derivation from the victim's own photo. The UI says so plainly.
- Real user accounts, password reset, email. A profile is a name plus a PIN, held in a cookie.
- Sending the complaint anywhere. Kavach fills it; the victim files it.
- Video. Images only tonight.
- Content credentials (C2PA). Cloudinary's implementation is beta and support-gated. Out.

## Anti-goals

- Ever rendering the suspect image unblurred, anywhere, including logs and LLM calls.
- Any image leaving Cloudinary private storage except as a blurred, signed, short-lived derivative or a victim-triggered expiring download.
- Generating or editing faces. No generative features touch a person's image.
- Overclaiming. Match scores are shown as similarity evidence with their method named, never as "proof it is fake".

## Constraints

- Build tonight, deploy tonight. One builder, roughly six hours.
- Money: under 25 USD total. Cloudinary free plan, Vercel hobby, Google AI Studio free tier. Claude API credits exist but are the fallback provider only.
- Google's free tier may use submitted content for training. Therefore Gemma receives only the blurred, pixelated derivative plus structured evidence, never the original fake or the vault photos.
- Cloudinary free plan Admin API limit is about 500 requests per hour. Fine for a demo, so avoid polling loops.
- No team details or registration handled here.

## Product

### Voice and look

Kavach means shield. The voice is a calm, fierce guardian: short sentences, second person, no exclamation marks. Dark interface, one accent colour, large type. Verdicts land like a gavel: one line, then evidence beneath. The home page tells the story in three beats (she registers, someone morphs, she files) and ends with the two numbers above, cited.

### Pages

- `/` Story, the two numbers, one button: "Raise your shield".
- `/vault` Create or open a profile (name plus 4 to 6 digit PIN). Upload one or more real photos. Each shows a thumbnail, upload date, and "fingerprinted" badge. Photos can be removed.
- `/check` Drop a suspect image. Choose the platform it appeared on (Instagram, X, WhatsApp, Telegram, Facebook, Other) and optionally paste the post URL. Submit.
- `/case/[id]` The verdict. Top: one line ("Made from your photo uploaded 12 Oct 2026"), similarity score, method names. Middle: the blurred exhibit with the evidence stamp, next to the matched vault photo. Below: Gemma's plain-language description of what was altered, then two complaint drafts in tabs (Platform, Cyber Crime Portal), each with copy and download. Bottom: evidence bundle download (JSON plus the stamped exhibit), and a "what happens next" strip: 2-hour platform duty, portal link, helpline 1930.
- `/about` How matching works, what Kavach does not claim, data handling, sources.

### Flow

1. Register: each vault photo uploads to Cloudinary as `type: private` under `kavach/<profileId>/vault/`, requesting `phash`, `faces`, `colors`, `quality_analysis`. Server stores the returned pHash, face boxes, SHA-256 of the bytes, and timestamp.
2. Server also fetches the face crop (Cloudinary `c_crop,g_face` derivative via signed URL) and computes an open-source dHash and pHash of it locally.
3. Check: the suspect uploads to Cloudinary as `type: private` under `kavach/<profileId>/exhibits/`, requesting `phash`, `faces`, `moderation: aws_rek`. Same local fingerprints on its face crop.
4. Match: compare suspect fingerprints against every vault photo. Hamming distance on Cloudinary pHash (full image), local pHash and dHash (face crop). Weighted similarity, best vault photo wins. Thresholds: similarity at or above 0.80 is "Made from your photo"; 0.60 to 0.80 is "Likely related, review"; below is "No match in your vault".
5. Blur: the exhibit is only ever delivered through a signed transformation `e_pixelate_faces,e_blur:600` with a text overlay stamp (case id, SHA-256 prefix, UTC timestamp). URLs are signed and carry an expiry; the server proxies them so the client never receives a bare Cloudinary URL.
6. Describe and draft: Gemma 4 gets the blurred stamped exhibit, the matched vault thumbnail (also blurred), the evidence JSON and the platform name. It returns a short description of the manipulation and two complaint drafts filled with case facts.
7. Case: all case data is stored as a JSON raw asset in Cloudinary under `kavach/<profileId>/cases/<caseId>.json`. The case page reads it back.
8. Export: evidence bundle built server-side: `evidence.json`, stamped blurred exhibit, both complaint drafts as text. The original exhibit is available to the victim only through a Cloudinary `private_download_url` that expires in 10 minutes, behind a confirm click, for attaching to a police complaint.

### Cloudinary features, each with its visible job

| Feature | Job in Kavach |
|---|---|
| `type: private` uploads in per-profile folders | Vault and exhibits are never publicly addressable |
| `phash` on upload | Fingerprint of every photo, basis of the match |
| `faces` on upload and `g_face` crop | Face-region fingerprint, robust to crops and borders |
| `quality_analysis`, `colors` | Shown in evidence, used to warn on low-quality uploads |
| `moderation: aws_rek` | Flags explicit content, which switches the complaint to the intimate-imagery template and the stronger legal citations |
| `e_pixelate_faces` + `e_blur` | The exhibit is only ever seen blurred |
| Text overlay `l_text` | Evidence stamp burned into the exhibit |
| Signed URLs with expiry and `private_download_url` | Short-lived access, victim-only download of the original |
| Raw JSON assets | Case records live beside the evidence, no extra database |

Stretch, if time remains: Cloudinary's duplicate-detection moderation (`moderation: duplicate:<threshold>`) as a second, named matcher.

### Gemma 4 and the provider switch

- Default: `gemma-4-26b-a4b-it` through the Gemini API, free tier. Fallback id `gemma-4-31b-it`.
- `LLM_PROVIDER=gemma|claude|demo`. Claude uses `claude-haiku-5-5` for cost. Demo returns canned text.
- Gemma's prompt gets only blurred derivatives and structured evidence. The system prompt forbids speculation about identity and demands the complaint cite the case facts it was given.
- Outputs are JSON: `description`, `platform_complaint`, `portal_complaint`, `severity`. Parsed and validated; on failure the demo text is used and a banner says so.

### Complaint templates

Two templates with placeholders filled by code before Gemma polishes the prose: victim name, platform, post URL, date first seen, case id, SHA-256 of exhibit, matched vault photo date, similarity and method, moderation result. Legal references: IT Rules 2021 as amended 10 Feb 2026 (2-hour removal of non-consensual deepfake or intimate imagery), IT Act sections 66E, 67 and 67A, and the relevant Bharatiya Nyaya Sanhita provisions for criminal intimidation and voyeurism. Every draft carries a line: "Verify section numbers with the portal or a lawyer before filing." The builder verifies the exact section numbers against a current source and records the source in `docs/legal-sources.md`.

### Demo mode

`DEMO_MODE=1` or missing keys: a seeded profile "Priya" with two vault photos, a seeded exhibit that is a cropped, mirrored, re-coloured derivative of vault photo one, precomputed fingerprints, canned Gemma output. The seed images are synthetic faces or illustrations with a recorded licence; never a real person's photo. Demo mode still runs the real matching code against the seed fingerprints.

### Repo deliverables

- `README.md` with the 20-second demo, architecture diagram, Cloudinary feature table, setup, demo mode.
- `docs/judging-evidence.md` mapping the five likely criteria (real-world problem and impact, Cloudinary use, technical depth, design and UX, completeness and quality) to concrete places in the repo and demo.
- `docs/build-journey.md`, a timestamped log of decisions and bugs, written as we go, for pasting into Notion.
- `docs/legal-sources.md`.
- `LICENSE` MIT.
- Tests for the fingerprint and match code and for the template filler. The rest is covered by a smoke script that runs the demo flow against a local server.

## How it gets made (builder's calls, already made)

- Next.js 15, App Router, TypeScript strict, Tailwind. Deployed on Vercel. Same shape as the team's last winning entry.
- `cloudinary` Node SDK v2 server-side only. Client uploads go through our API route, never direct, so the private type and parameters are enforced server-side.
- `sharp` for local fingerprints on face crops. Fingerprint code is our own, about a hundred lines, MIT.
- No database. Profiles, vault index and cases are JSON raw assets in Cloudinary. Profile PIN is hashed with a server salt and stored in the profile JSON. Session is a signed cookie carrying the profile id.
- Google Generative AI SDK for Gemma, Anthropic SDK for the fallback.
- Vercel function limits: 4.5 MB request body, so uploads are capped at 4 MB client-side with a clear message. Images are downscaled client-side to a maximum 2048 px edge before upload.

## Left to the builder

- Exact weights and thresholds for the similarity score. Calibrate on the seed exhibit and a few self-made derivatives (crop, mirror, recolour, text overlay, light face edit). Record the calibration in the journey log.
- Exact visual design within the voice above.
- Whether to proxy blurred images through an API route or hand the client short-lived signed Cloudinary URLs. Either is acceptable as long as no unblurred URL is ever sent.
- How the complaint drafts are downloaded (plain text is fine, PDF is a stretch).
- Whether `aws_rek` moderation needs add-on registration in the Cloudinary console. If so, document it in setup and degrade gracefully when the add-on is not registered.

## Open risks

- Gemma free-tier rate limits at demo time. Mitigation: provider switch and demo mode.
- Face-crop fingerprints may be weak on heavy face swaps. Mitigation: full-image pHash still catches crops, borders, recolours and overlays, which are the common morphing cases. The verdict text names the method so the limit is honest.
- Cloudinary Admin API hourly limit. Mitigation: reads are per-request, no polling.

## Decisions after builder review

1. **Deployed URL runs live keys.** Demo mode is a fallback, not a second product: it is the seeded Priya profile and seeded exhibit with uploads disabled and a banner saying so. It is triggered by `DEMO_MODE=1` or missing Cloudinary keys. No local storage or local blur path.
2. **Tonight is the vertical slice, 24 Oct is polish.** Tonight, in this order: register, check, verdict, blurred stamped exhibit, template-filled complaints via Gemma, demo mode, deploy, README. Tomorrow: moderation, evidence bundle zip, original download, tests, smoke script, judging-evidence, legal-sources verification, journey log cleanup. If tonight runs long, anything after "deploy" slips to tomorrow, nothing before it does.
3. **No-match and likely-related still produce a case.** The exhibit is still blurred and stamped, Gemma is still called, both complaints are still drafted. The derivation paragraph is replaced by "no registered photo matched; the complaint rests on identity and consent" for no-match, and softened to "likely derived" for the middle band. Case page has one layout with the verdict line and evidence block varying.
4. **Gemma 4 image input is confirmed** on the Gemini API for `gemma-4-31b-it` and `gemma-4-26b-a4b-it`. If an image call fails at runtime, retry with structured evidence only and show a "text-only analysis" badge; Claude stays the fallback, never the default.
5. **Two-phase check.** Upload and match return immediately; the Gemma draft runs in a second request so Vercel's function timeout is never hit. The case page shows the verdict first and the drafts fill in.
6. **Victim name and post URL are substituted with placeholders** before anything reaches Gemma, then restored in the final draft.
