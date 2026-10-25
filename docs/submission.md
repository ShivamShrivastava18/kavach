# Unstop submission: Kavach

Copy from here into the form fields. Theme: Women Empowerment (Tech for Good).

## Title

Kavach: a photo shield for women

## One line

Proves a morphed image was made from her own photo, blurs it so she never has to look at it, and writes the complaint a platform must act on within 2 hours.

## Problem

Morphed and deepfaked images of women travel across platforms in hours. Since 20 February 2026, Rule 3(2)(b) of India's IT Rules gives platforms 2 hours to remove non-consensual morphed or intimate imagery once they receive a complaint. The law exists. The hard part, on the day it happens, is proving the image was made from her photo and writing a complaint that cites the right duty and sections, while being forced to look at the image again and again.

## What Kavach does

1. She registers the photos she actually posts. Each is uploaded privately to Cloudinary, which returns a perceptual hash and the face box on upload. Kavach adds two 256-bit fingerprints of its own on the face crop.
2. When a morph appears, she drops it in once. Kavach stores it privately, fingerprints it, compares it against every registered photo (including a mirrored pass) and serves it back only blurred, pixelated and stamped with the case id, SHA-256 and time. She never sees it unblurred again.
3. The verdict says whether it was made from her photo, with the score and methods. Calibrated on real portraits: cropping, mirroring, filters, a screenshot of a chat, the face pasted onto another body all still match; five different people do not.
4. Gemma 4 writes her plain-language account from the blurred exhibit and redacted evidence; the legal complaints (platform grievance officer and cybercrime.gov.in) are templated around it, so hashes, dates and section numbers never depend on a model. An evidence bundle and a police-only link to the original complete the case.

## How Cloudinary is used

Cloudinary is the entire backend. Private-type uploads, pHash, face detection and quality analysis on upload, Amazon Rekognition moderation to flag explicit content (which switches the complaint to the intimate-imagery sections), signed on-the-fly transformations for every blurred, pixelated, stamped derivative, raw JSON assets as the only data store (no database), and time-limited private download URLs for releasing an original to the police.

## How Gemma 4 is used

gemma-4-26b-a4b-it on the Gemini API free tier, thinking set to minimal (4 s instead of 60). It sees only the blurred exhibit and structured evidence; name and link are redacted before the call and restored after. Image and text-only lanes race; any failure falls back to templates with a visible badge.

## Tech stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, sharp, Cloudinary Node SDK, Google GenAI SDK (Gemma 4), Vercel. Own open-source fingerprinting (32x32 DCT pHash with a 16x16 band, 17x16 dHash). 59 tests, end-to-end smoke against production, real-portrait benchmark script. MIT.

## Links

- Live: https://kavach-flame-gamma.vercel.app
- Repository: https://github.com/ShivamShrivastava18/kavach
- Demo video: https://youtu.be/p4adFXAz8tk
- Notion documentation: https://app.notion.com/p/Kavach-Hacktober-HackDays-2026-404efe91518a808db9f9dc024b22139b
- Build journey (for Notion): docs/build-journey.md in the repository

## Sensitive-data note

No real person's photo is used in the demo. The registered and morphed images are generated vector portraits. Originals are never served; exhibits are only ever delivered blurred.
