# Kavach: Hacktober HackDays 2026

Built by team yearners during Hacktober HackDays (SheBuilds Delhi, powered by MLH). Theme: Women Empowerment, Tech for Good.

## 1. Project Overview

- Project name: Kavach (Hindi for armour; "a photo shield for women")
- Team name: yearners
- Track / theme: Women Empowerment (Tech for Good)
- One-line pitch: Proves a morphed image was made from her own photo, blurs it so she never has to look at it, and writes the complaint a platform must act on within 2 hours.
- Repository: https://github.com/ShivamShrivastava18/kavach
- Live demo: https://kavach-flame-gamma.vercel.app
- Demo video: https://youtu.be/p4adFXAz8tk
- Presentation / slides: the demo video doubles as the pitch; the README carries the technical write-up.

## 2. Team Members and Roles

- Shivam Shrivastava: Backend and execution, ideation. Cloudinary integration, fingerprinting and matching, Gemma 4 drafting pipeline, deployment, testing, demo video. GitHub: ShivamShrivastava18.
- Paavas: UI/UX and frontend, ideation. Product flow, visual design, the vault, check and case pages, responsive layout, copy.

## 3. Problem Statement

- The problem: A woman's photo is taken from her own profile, morphed into something she never posed for, and shared. Within hours it is on several platforms. She has to prove it is fake, find the right complaint channel, cite the right law, and look at the image again and again while doing it.
- Who is affected: Women in India whose photos are public anywhere: students, creators, professionals. Morphed and deepfaked imagery is overwhelmingly aimed at women.
- Why it matters: Since 20 February 2026, Rule 3(2)(b) of India's IT Rules obliges platforms to remove non-consensual morphed or intimate imagery within 2 hours of a complaint. The duty exists; the burden of producing a credible complaint on the day still falls on the victim.
- Existing solutions and their gaps: Reverse image search finds copies but does not prove derivation from a specific original. Platform report buttons produce no evidence record and no cross-platform complaint. Hash-matching takedown services (StopNCII-style) cover intimate images already in circulation, not morphs of ordinary photos, and give the victim no document to file with police.

## 4. Proposed Solution

- Overview: Kavach lets a woman register the photos she actually posts, privately, fingerprinted on upload. When a morph appears she drops it in once. Kavach proves it was derived from a registered photo, shows it back only blurred and stamped, and produces two complaints and an evidence bundle.
- Unique value: Derivation proof rather than detection. Kavach never claims an image is "AI-generated"; it measures that the suspect image was made from her photo, with the method and score on record, and the legal text is templated so it never depends on a model.
- Key features:
  - Private vault on Cloudinary: perceptual hash and face box on upload, plus two 256-bit fingerprints of the face crop.
  - Check: fingerprint, compare against every registered photo including a mirrored pass, verdict with score and methods.
  - Blurred, pixelated, stamped exhibit (case id, SHA-256, time). The original is never served.
  - Gemma 4 writes her plain-language account and a severity; the platform complaint and the cybercrime.gov.in report are templated around it.
  - Evidence bundle (evidence.json, stamped exhibit, both complaints) and a 10-minute police-only link to the original.
  - Explicit-content screening via Amazon Rekognition switches the complaint to the intimate-imagery sections.
- Out of scope (for now): Face recognition or identity matching (a deepfake generated from a photo that was never registered will not match, and the verdict says so). Filing complaints automatically. Mobile app.

## 5. Tech Stack and Architecture

- Frontend: Next.js 16 (App Router), React 19, TypeScript, Tailwind v4. Chosen for speed of iteration and server routes in the same codebase.
- Backend: Next.js route handlers on Vercel. No separate server.
- Database: None. Profiles and cases are private raw JSON assets on Cloudinary, read through signed private download URLs.
- APIs / services: Cloudinary (private uploads, pHash, face detection, quality analysis, Rekognition moderation, signed derivatives), Google GenAI SDK for Gemma 4 (gemma-4-26b-a4b-it, free tier).
- Hosting / deployment: Vercel.
- Tools: sharp (image processing), vitest (59 tests), Playwright (screen recording), Remotion (demo video), GitHub.
- Architecture overview: Browser uploads go to Next.js route handlers, which store the file as a private Cloudinary asset and read back the pHash and face box from the upload response. The handler crops the face locally with sharp (20 percent padding, edge replication), computes 256-bit pHash and dHash, and stores the prints in the profile JSON. A check uploads the suspect privately, computes the same prints, scores against every registered photo (face hashes carry the score; the full-image hash can only raise it; a mirrored pass runs too) and writes a case JSON. The exhibit is only ever served through a signed Cloudinary transformation that pixelates faces, blurs, and overlays the evidence stamp. Drafting sends the blurred exhibit and redacted evidence to Gemma 4; the narrative comes back and is inserted into templated complaints.
- Data flow: photo -> private asset + prints in profile.json -> suspect -> private asset + prints -> score -> case.json -> blurred derivative (signed URL via server proxy) -> Gemma narrative -> templated complaints -> zip bundle.

## 6. Feature Tracker

- Private vault with fingerprinting (Shivam, High): Done
- Check and verdict with mirrored pass (Shivam, High): Done
- Blurred stamped exhibit via Cloudinary transformations (Shivam, High): Done
- Gemma 4 narrative with templated complaints (Shivam, High): Done
- Vault, check and case pages, responsive (Paavas, High): Done
- Evidence bundle and police-only original link (Shivam, Medium): Done
- Explicit-content screening (Shivam, Medium): Done, degrades gracefully when the add-on quota is spent
- Real-portrait benchmark and calibration (Shivam, Medium): Done
- Demo mode without keys (Shivam, Low): Done
- Demo video (Shivam, Low): Done

## 7. Progress Tracker (7 days)

- Day 1, 19 Oct: Team formation, theme choice (Women Empowerment), first brainstorm. Done
- Day 2, 20 Oct: Problem validation and research: IT Rules amendment, cybercrime.gov.in flow, how morphs spread. Done
- Day 3, 21 Oct: Scope and plan: derivation proof, blur-first, two complaints. Design direction. Done
- Day 4, 22 Oct: UI/UX: flows and screens for vault, check and case. Done
- Day 5, 23 Oct: Build: scaffold, Cloudinary private uploads, fingerprints, matching, pages, demo mode. Done
- Day 6, 24 Oct: Build and calibrate: real-portrait benchmark, 256-bit hashes, Gemma 4 drafting, evidence bundle, deploy. Done
- Day 7, 25 Oct: Deliver: moderation quota fix, demo video, documentation, submission. Done

## 8. Daily Log

### Day 1 (19 Oct)
- Goals for today: Form the team, pick a theme, list problems worth a week.
- What we completed: Chose Women Empowerment. Shortlisted three problems; morphed-image takedowns won because the law had just changed and the victim's burden is concrete.
- Blockers / challenges: Avoiding a generic "deepfake detector" that cannot be proven right.
- Learnings: Detection claims are fragile; derivation from a known original is provable.
- Plan for tomorrow: Validate the legal duty and the complaint channels.

### Day 2 (20 Oct)
- Goals for today: Verify the 2-hour rule, map the complaint process.
- What we completed: Confirmed Rule 3(2)(b) of the IT Rules (amendment notified 10 Feb 2026, in force 20 Feb 2026), IT Act 66E/67/67A and BNS 77/351/356. Read the cybercrime.gov.in category structure and helpline 1930.
- Blockers / challenges: Section numbers differ between IPC and BNS; every citation needed a source.
- Learnings: Templating the legal text, rather than generating it, is the only way to keep it correct.
- Plan for tomorrow: Lock scope.

### Day 3 (21 Oct)
- Goals for today: Scope, plan, visual direction.
- What we completed: Three steps (register, check, file), blur-first rule, two complaints. Dark, calm visual direction with one amber accent. Decided Cloudinary is the entire backend: private assets, hashing, face boxes, moderation, derivatives, and JSON storage.
- Blockers / challenges: Whether to use a database at all. Decided no: raw JSON on Cloudinary keeps the stack to free tiers.
- Learnings: Fewer moving parts means more time for calibration.
- Plan for tomorrow: Screens.

### Day 4 (22 Oct)
- Goals for today: UI/UX for every screen.
- What we completed: Vault (create shield, register photos), check (drop, platform, link), case (verdict, blurred exhibit, drafts, bundle). Copy written in plain language, no hype.
- Blockers / challenges: Showing a blurred exhibit without ever rendering the original on the client.
- Learnings: Serve images only through a server proxy with short-lived signed tokens.
- Plan for tomorrow: Build.

### Day 5 (23 Oct)
- Goals for today: Working end to end in demo mode.
- What we completed: Next.js scaffold, Cloudinary private uploads with pHash, faces and quality analysis, own pHash and dHash, matching with a mirrored pass, session cookies with hashed PIN, all three pages, demo mode with generated vector portraits, 47 tests.
- Blockers / challenges: Tailwind v4 silently dropped the stylesheet when a class used @apply inside another class; sharp applies only the last resize in a chain.
- Learnings: Test images need texture: a flat-colour image makes hash bits noise-dominated.
- Plan for tomorrow: Live keys, real photos, Gemma.

### Day 6 (24 Oct)
- Goals for today: Run on live keys and prove it on real photos.
- What we completed: Live Cloudinary path, deploy to Vercel. Wrote a real-portrait benchmark (recompress, thumbnail, mirror, crop, tilt, filters, caption, chat screenshot, face pasted onto another body, five other people as controls). First run was humbling: a stranger scored "likely" and the body-swap was missed. Fixed three causes: the padded face crop was clamped at image edges (now edge-replicated), the body-swap test cut the chin off, and 64-bit hashes of different faces agree on 70 to 75 percent of bits. Moved to 256-bit hashes, let the face hashes carry the score, moved "likely" to 0.70. Result: 12 of 12 edits derived, 5 of 5 strangers none. Gemma 4 wired in.
- Blockers / challenges: Gemma 4 thinks for 25 to 60 seconds on our prompt, past the API's deadline, and its image path returns opaque 500s now and then.
- Learnings: Give the model only what a model should write (the narrative), template the rest, race image and text-only lanes, set thinkingLevel to minimal (4 seconds).
- Plan for tomorrow: Video, docs, submit.

### Day 7 (25 Oct, Submission Day)
- Goals for today: Demo video, documentation, submission.
- What we completed: New Cloudinary account with a fresh moderation quota (the benchmark had spent the first one; the app now degrades gracefully and says "not screened for explicit content"). GitHub push protection caught a tracked .env before it was ever pushed; fixed. Demo video: Playwright recorded the production flow, Remotion composition in the app's own fonts and colours, narration via Gemini TTS after the ElevenLabs free tier ran out. Notion documentation and Unstop submission.
- Blockers / challenges: Free-tier limits everywhere: 10 TTS requests a day per model, 3 a minute; TTS models read style instructions aloud.
- Learnings: Ship with a fallback for every external call and show the user which path was taken.
- Final reflections: Seven days took a vague worry ("morphs are easy") to a tool with a provable claim, a legal basis, and a live URL. The calibration day mattered more than any feature.

## 9. Challenges and Solutions

- Different faces hash alike at 64 bits (Day 6): compared 8x8, 12x12 and 16x16 DCT bands offline against recorded face boxes; 256-bit hashes put strangers at 0.55 to 0.61 and the same face after any edit at 0.83 or more. Lesson: calibrate on real data before trusting thresholds.
- Face crop clamped at image edges (Day 6): extend the image with replicated edge pixels before cropping, in two sharp pipelines. Lesson: the same face must be framed identically regardless of where it sits.
- Gemma 4 too slow and flaky with images (Day 6): narrative-only output, racing lanes, thinkingLevel minimal, template fallback with a visible badge. Lesson: keep the model's job small and verifiable.
- Moderation add-on quota spent (Day 7): store unmoderated, mark the case as not screened, record it in the evidence bundle. Lesson: a quota must never block a victim.
- Secrets nearly committed (Day 7): .env was never in .gitignore; GitHub push protection caught it, history rewritten before anything was pushed. Lesson: check tracked files before the first push.

## 10. Testing and Setup Notes

- How to run locally:
  1. git clone https://github.com/ShivamShrivastava18/kavach and cd kavach
  2. npm install
  3. Copy .env.example to .env and set CLOUDINARY_URL, GEMINI_API_KEY, SESSION_SECRET (optional: CLOUDINARY_MODERATION=1 with the Rekognition add-on enabled). Without keys the app runs in demo mode.
  4. npm run dev, then open http://localhost:3000
- Testing approach: 59 vitest unit tests (fingerprints, matching, templates, redaction, parsing, validation, moderation, Gemma retry policy); end-to-end smoke script against local or production (scripts/smoke.ts); real-portrait benchmark (scripts/morph-bench.ts); Playwright screenshots at desktop and phone widths; a fresh-context code review before the first deploy.
- Known issues: No face recognition, so a morph made from an unregistered photo reads as "no match". PIN attempts are not rate limited. A page reload while a draft is in progress starts a second Gemma call.
- Test accounts / sample data: Demo mode seeds the profile "Priya Sharma" with generated vector portraits; no real person's photo is used anywhere.

## 11. Final Submission Checklist

- Project name, pitch, and team details are filled in: yes
- Problem statement and solution are clearly explained: yes
- Repository is public and has a clear README: yes
- Code is clean, commented, and contains no secrets or API keys: yes (push protection verified)
- Live demo link works: yes, smoke-tested against production
- Demo video is recorded and the link is accessible: yes
- Presentation / pitch deck is ready: the demo video serves as the pitch
- Daily log is updated: yes, 7 days
- Screenshots or GIFs of the project are added below: see section 12
- Notion page is shared with the organizers: yes
- Submission form is filled before the deadline: yes

## 12. Screenshots and Demo Media

- Demo video: https://youtu.be/p4adFXAz8tk
- Home, vault, check and case pages: screenshots in the repository README.

## 13. Future Scope

- Face-identity matching (a face embedding model) so a deepfake generated from an unregistered photo still finds her vault.
- Direct filing: pre-filled cybercrime.gov.in submission and platform grievance e-mails with the bundle attached.
- Multiple complainants per case, a case timeline, and a takedown-confirmation tracker against the 2-hour clock.
- Hindi and regional-language complaints.
- A browser extension that checks an image where it is seen.

## 14. Resources and References

- IT (Intermediary Guidelines and Digital Media Ethics Code) Amendment Rules, 2026 (MeitY gazette, 10 Feb 2026): legal basis for the 2-hour duty.
- Cloudinary documentation (private assets, pHash, face detection, moderation add-ons, transformations): the backend.
- Gemini API documentation (Gemma 4 models, thinking config): the drafting model.
- pHash / dHash literature (DCT perceptual hashing): the fingerprints.
- Remotion and Playwright documentation: the demo video.

## 15. Acknowledgments

SheBuilds Delhi, MLH and PW IOI for Hacktober HackDays; Cloudinary for the free tier and the add-ons; the Mixkit library for the sound effects in the demo video.

Built during Hacktober Hack Days.
