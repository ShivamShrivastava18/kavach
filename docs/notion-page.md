> **Status: Shipped and submitted.** Live at https://kavach-flame-gamma.vercel.app · Demo video https://youtu.be/p4adFXAz8tk · Repo https://github.com/ShivamShrivastava18/kavach · Finale 31 Oct 2026, PW IOI Noida · Team yearners (Shivam Shrivastava, Paavas) · Theme: Women Empowerment

## 1. Project Overview

| Field | Details |
| --- | --- |
| Project name | Kavach (Hindi for armour; a photo shield for women) |
| Team name | yearners |
| Track / theme | Women Empowerment (Tech for Good) |
| One-line pitch | Proves a morphed image was made from her own photo, blurs it so she never has to look at it, and writes the complaint a platform must act on within 2 hours. |
| Repository | https://github.com/ShivamShrivastava18/kavach |
| Live demo | https://kavach-flame-gamma.vercel.app |
| Demo video | https://youtu.be/p4adFXAz8tk |
| Presentation | The demo video is the pitch; the README carries the technical write-up. |

## 2. Team Members and Roles

| Name | Role | Responsibilities | Contact |
| --- | --- | --- | --- |
| Shivam Shrivastava | Backend, execution, ideation | Cloudinary integration, fingerprinting and matching, Gemma 4 drafting, deployment, testing, demo video | github.com/ShivamShrivastava18 |
| Paavas | UI/UX, frontend, ideation | Product flow, visual design, vault, check and case pages, responsive layout, copy | via Unstop team |

## 3. Problem Statement

| | |
| --- | --- |
| The problem | A woman's photo is taken from her profile, morphed, and shared. Within hours it is on several platforms. She must prove it is fake, find the right channel, cite the right law, and look at the image again and again to do it. |
| Who is affected | Women in India whose photos are public anywhere: students, creators, professionals. |
| Why it matters | Since 20 Feb 2026, Rule 3(2)(b) of the IT Rules obliges platforms to remove non-consensual morphed or intimate imagery within 2 hours of a complaint. The duty exists; the burden of producing a credible complaint still falls on the victim. |
| Existing gaps | Reverse image search finds copies but does not prove derivation. Platform report buttons leave no evidence record. Hash-matching takedown services cover intimate images already circulating, not morphs of ordinary photos, and give her nothing to file with police. |

## 4. Proposed Solution

| | |
| --- | --- |
| Overview | Register the photos she posts, privately, fingerprinted on upload. When a morph appears, drop it in once: Kavach proves derivation, shows it back only blurred and stamped, and produces two complaints and an evidence bundle. |
| Unique value | Derivation proof, not "AI detection". Kavach never claims an image is AI-generated; it measures that the suspect image was made from her photo, and the legal text is templated so it never depends on a model. |
| Out of scope | Face recognition or identity matching; filing complaints automatically; mobile app. |

**Key features**

| Feature | What it does |
| --- | --- |
| Private vault | Cloudinary private asset per photo; pHash and face box on upload; two 256-bit fingerprints of the face crop |
| Check | Fingerprint the suspect, compare with every registered photo including a mirrored pass; verdict with score and methods |
| Blurred exhibit | Pixelated faces, blur, evidence stamp (case id, SHA-256, time). The original is never served |
| Gemma 4 drafts | Plain-language account and severity; platform complaint and cybercrime.gov.in report templated around it |
| Evidence bundle | evidence.json, stamped exhibit, both complaints; 10-minute police-only link to the original |
| Explicit screening | Amazon Rekognition via Cloudinary switches the complaint to the intimate-imagery sections |
| Guided demo | One click opens a sample shield, registers two portraits, checks a morph, lands on the case |
| Morph simulator | Kavach makes six harasser edits of a registered photo and checks each one |

## 5. Tech Stack and Architecture

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind v4 | Server routes and UI in one codebase |
| Backend | Next.js route handlers on Vercel | No separate server |
| Storage | Cloudinary only: private images, raw JSON records | No database; free tier |
| Media | Cloudinary pHash, face detection, quality analysis, Rekognition moderation, signed transformations | The entire evidence pipeline |
| Model | Gemma 4 (gemma-4-26b-a4b-it) via Google GenAI SDK, free tier | Thinking set to minimal: 4 s answers |
| Image processing | sharp | Face crops, hashing, EXIF |
| Testing | vitest (64 tests), end-to-end smoke against production, real-portrait benchmark, Playwright | |
| Video | Playwright recording, Remotion, Gemini TTS | |

**Data flow:** photo → private asset + prints in profile.json → suspect → private asset + prints → score → case.json → blurred derivative via server proxy → Gemma narrative → templated complaints → zip bundle.

## 6. Feature Tracker

| Feature | Owner | Priority | Status |
| --- | --- | --- | --- |
| Private vault with fingerprinting | Shivam | High | Done |
| Check and verdict with mirrored pass | Shivam | High | Done |
| Blurred stamped exhibit | Shivam | High | Done |
| Gemma 4 narrative, templated complaints | Shivam | High | Done |
| Vault, check, case pages, responsive | Paavas | High | Done |
| Evidence bundle, police-only original link | Shivam | Medium | Done |
| Explicit-content screening with graceful quota fallback | Shivam | Medium | Done |
| Real-portrait benchmark and calibration | Shivam | Medium | Done |
| Demo mode without keys | Shivam | Low | Done |
| Demo video | Shivam | Low | Done |
| Guided demo and morph simulator (finale) | Shivam, Paavas | High | Done |
| Score gauge, scan animation, action cards (finale) | Paavas, Shivam | Medium | Done |

## 7. Progress Tracker

| Day | Date | Phase | Focus | Status |
| --- | --- | --- | --- | --- |
| 1 | 19 Oct | Ideate | Team, theme, problem shortlist | Done |
| 2 | 20 Oct | Ideate | Legal research: IT Rules, IT Act, BNS, cybercrime.gov.in | Done |
| 3 | 21 Oct | Ideate | Scope, plan, visual direction, Cloudinary as the backend | Done |
| 4 | 22 Oct | Build | UI/UX: flows and screens | Done |
| 5 | 23 Oct | Build | Scaffold, uploads, fingerprints, matching, pages, demo mode | Done |
| 6 | 24 Oct | Build | Live keys, real-portrait calibration, Gemma 4, deploy | Done |
| 7 | 25 Oct | Deliver | Moderation quota fix, demo video, docs, submission | Done |
| Finale | 31 Oct | Deliver | Guided demo, simulator, gauge and scan, judges' path | Done |

## 8. Daily Log

| Day | Goals | Completed | Blockers | Learnings | Next |
| --- | --- | --- | --- | --- | --- |
| 1 (19 Oct) | Form the team, pick a theme | Chose Women Empowerment; morphed-image takedowns won the shortlist because the law had just changed | Avoiding a generic "deepfake detector" | Detection claims are fragile; derivation from a known original is provable | Validate the legal duty |
| 2 (20 Oct) | Verify the 2-hour rule, map complaint channels | Confirmed Rule 3(2)(b) (notified 10 Feb, in force 20 Feb 2026), IT Act 66E/67/67A, BNS 77/351/356; portal categories; helpline 1930 | IPC vs BNS section numbers | Template the legal text, never generate it | Lock scope |
| 3 (21 Oct) | Scope, plan, visual direction | Register, check, file; blur-first rule; two complaints; dark with one amber accent; Cloudinary as the whole backend | Database or not | No database keeps everything on free tiers | Screens |
| 4 (22 Oct) | UI/UX for every screen | Vault, check, case; plain copy | Showing a blurred exhibit without the original ever reaching the client | Serve images only through a server proxy with signed short-lived tokens | Build |
| 5 (23 Oct) | Working end to end in demo mode | Scaffold, private uploads with pHash and faces, own hashes, mirrored pass, PIN sessions, all pages, demo seed, 47 tests | Tailwind v4 dropped the stylesheet on nested @apply; sharp keeps only the last resize | Test images need texture | Live keys, real photos, Gemma |
| 6 (24 Oct) | Prove it on real photos | Real-portrait benchmark; first run let a stranger through at "likely"; fixed edge-clamped crops, moved to 256-bit hashes, face-first score; 12/12 edits caught, 5/5 strangers none; Gemma 4 wired | Gemma thinks 25 to 60 s; image path 500s | Model writes only the narrative; race image and text lanes; thinking minimal | Video, docs, submit |
| 7 (25 Oct) | Video, docs, submission | New Cloudinary account; .env caught by push protection before any push; Playwright footage, Remotion, Gemini TTS narration; Notion and Unstop | Free-tier limits everywhere | Ship a fallback for every external call and show which path ran | Finale prep |
| Finale (31 Oct) | The judge's path | Guided demo (one click to a solved case), six-edit simulator, real purge, score gauge, X-ray scan, three action cards, complaint explainers; A/B on the hero with a judge persona | Stage morph (a full Gemini re-render) scores "likely" | Edits are caught; full regenerations are "likely" at best, and Kavach says so | Present |

## 9. Challenges and Solutions

| Challenge | Day | Solution | Lesson |
| --- | --- | --- | --- |
| Different faces hash alike at 64 bits | 6 | Compared 8x8, 12x12, 16x16 DCT bands offline; 256-bit puts strangers at 0.55 to 0.61 and real edits at 0.83+ | Calibrate on real data before trusting thresholds |
| Face crop clamped at image edges | 6 | Extend with replicated edge pixels before cropping | Frame the same face identically wherever it sits |
| Gemma 4 slow and flaky with images | 6 | Narrative-only output, racing lanes, thinkingLevel minimal, template fallback with a badge | Keep the model's job small and verifiable |
| Moderation quota spent | 7 | Store unmoderated, mark the case, record it in the bundle | A quota must never block a victim |
| Secrets nearly committed | 7 | Push protection caught it; history rewritten before any push | Check tracked files before the first push |
| Judges land cold on production | Finale | Guided demo, simulator, guide strip, delete-in-one-click | Make the first result one click away |

## 10. Testing and Setup Notes

| | |
| --- | --- |
| Run locally | `git clone https://github.com/ShivamShrivastava18/kavach`, `npm install`, copy `.env.example` to `.env` (CLOUDINARY_URL, GEMINI_API_KEY, SESSION_SECRET; optional CLOUDINARY_MODERATION=1), `npm run dev`. Without keys the app runs in demo mode. |
| Testing | 64 vitest unit tests; `scripts/smoke.ts` end to end against local or production (includes the guided demo and the simulator); `scripts/morph-bench.ts` on real portraits; Playwright screenshots at desktop and phone widths; fresh-context code review before the first deploy |
| Known issues | No face recognition (a morph from an unregistered photo reads "no match"); PIN attempts not rate limited; reload during drafting starts a second Gemma call |
| Sample data | Demo seeds "Priya Sharma" with generated vector portraits; no real person's photo anywhere |

## 11. Final Submission Checklist

- [x] Project name, pitch and team details filled in
- [x] Problem statement and solution clearly explained
- [x] Repository public with a clear README
- [x] No secrets or API keys in the code (push protection verified)
- [x] Live demo link works, smoke-tested against production
- [x] Demo video recorded and accessible
- [x] Pitch ready (the demo video)
- [x] Daily log updated
- [x] Screenshots and demo media added (section 12)
- [x] Notion page shared with the organizers
- [x] Submission form filled before the deadline

## 12. Screenshots and Demo Media

Demo video: https://youtu.be/p4adFXAz8tk · Live: https://kavach-flame-gamma.vercel.app

**Home: one click to a solved case**

![Home: one click to a solved case](https://raw.githubusercontent.com/ShivamShrivastava18/kavach/main/docs/screenshots/01-home.png)

**The scan while the sample shield is built**

![The scan while the sample shield is built](https://raw.githubusercontent.com/ShivamShrivastava18/kavach/main/docs/screenshots/02-home-scanning.png)

**The verdict: dial, band marks, one bar per fingerprint**

![The verdict: dial, band marks, one bar per fingerprint](https://raw.githubusercontent.com/ShivamShrivastava18/kavach/main/docs/screenshots/03-case-verdict.png)

**Three things to do, and why each exists**

![Three things to do, and why each exists](https://raw.githubusercontent.com/ShivamShrivastava18/kavach/main/docs/screenshots/04-case-actions-complaints.png)

**What a harasser would do: six edits, six caught**

![What a harasser would do: six edits, six caught](https://raw.githubusercontent.com/ShivamShrivastava18/kavach/main/docs/screenshots/06-vault-simulator-results.png)

**Checking: she never sees the morph unblurred**

![Checking: she never sees the morph unblurred](https://raw.githubusercontent.com/ShivamShrivastava18/kavach/main/docs/screenshots/07-check-scanning.png)

**Phone**

![Phone](https://raw.githubusercontent.com/ShivamShrivastava18/kavach/main/docs/screenshots/08-home-phone.png)

## 13. Future Scope

| Idea | Why |
| --- | --- |
| Face-identity matching (embeddings) | Catch a deepfake generated from an unregistered photo |
| Direct filing | Pre-filled cybercrime.gov.in submission and grievance e-mails with the bundle attached |
| Takedown tracker | Case timeline against the 2-hour clock |
| Hindi and regional-language complaints | Reach beyond English-speaking users |
| Browser extension | Check an image where it is seen |

## 14. Resources and References

| Resource | Used for |
| --- | --- |
| IT (Intermediary Guidelines) Amendment Rules, 2026, MeitY gazette 10 Feb 2026 | The 2-hour duty |
| Cloudinary docs: private assets, pHash, face detection, moderation add-ons, transformations | The backend |
| Gemini API docs: Gemma 4 models, thinking config | The drafting model |
| DCT perceptual hashing literature | The fingerprints |
| Remotion and Playwright docs | The demo video |

## 15. Acknowledgments

SheBuilds Delhi, MLH and PW IOI for Hacktober HackDays; Cloudinary for the free tier and add-ons; Mixkit for the sound effects in the demo video.
