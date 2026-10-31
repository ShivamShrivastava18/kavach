# Finale flow: guided demo, morph simulator, branding

Date: 31 Oct 2026 (finale day). Judges may click through the live site on their own devices and/or watch a live demo.

## Problem

Production runs in live mode, so a judge landing cold must create a shield with a PIN, register a photo, then find or make a morph of that photo before anything happens. Four decisions and two uploads before the first result, and nobody carries a morph of their own face. A live demo has the same risk in a different form.

## Goals

1. First result in under 60 seconds with one click, on production, no uploads.
2. A judge can prove the matching on their own photo without bringing a morph.
3. Every screen says what Kavach never does (originals never served, no face recognition, delete everything in one click).
4. The brand reads as Indian and serious: the mark, the Hindi word कवच, amber on dark, no hype.

## Non-goals

No new services, no database, no redesign of the palette, no face recognition.

## Design

### Guided demo ("See it in 60 seconds")

`POST /api/demo/start` (live mode): creates a sample shield (name "Priya Sharma", flag `sample: true`, random PIN never shown), registers the two sample portraits from `/demo/`, runs a check with the sample morph (platform Instagram), sets the session cookie and returns `{ caseId }`. The home button posts and navigates to the case. In demo mode (no keys) it returns the seeded demo case as today.

`GET /api/profile` returns `sample: true` for such shields. A guide strip at the top of vault, check and case pages then shows the three steps with the current one lit, a "Try it on your own photo" link to the vault, and "Delete this sample" (deletes the shield, its assets stay private until then and are removed with it).

### Morph simulator ("What a harasser would do")

`POST /api/vault/simulate { publicId }`: for the registered photo, Kavach derives five edits through Cloudinary transformations on the private asset and runs each through the normal check (no moderation call, cases flagged `simulated: <kind>`):

| kind | transformation | what it models |
| --- | --- | --- |
| mirror | `a_hflip` | flipped to dodge reverse search |
| crop | `c_crop,g_face,w_0.7,h_0.7` | cropped to the face |
| filter | `e_saturation:60/e_hue:15` | colour filter |
| caption | `l_text` band at the bottom | abusive caption |
| frame | `c_lpad` into a light frame | screenshot of a chat |
| recompress | `q_15` | reposted through WhatsApp |

Returns `[{ kind, caseId, verdict, score }]`. The vault shows the results as a row of verdict chips, each linking to its case. Simulated cases show a "simulated: mirror" chip on the case page.

### Check pipeline refactor

The body of `POST /api/check` moves to `runCheck(profile, buf, opts)` in `src/lib/check.ts` so the guided demo and the simulator reuse it. Behaviour of `/api/check` is unchanged.

### UI and branding

- Shell: brand lockup "Kavach" with "कवच" in the accent beside it; footer carries the three trust lines.
- Home: hero keeps the headline; primary CTA "See it in 60 seconds" (guided demo), secondary "Raise your shield"; a trust row under the CTAs; the three beats stay; stats stay.
- Vault: trust line in the header; "Simulate a morph" on each fingerprinted photo; results panel.
- Check: hint linking to the simulator when the user has no morph at hand.
- Case: "simulated" chip when applicable; "Back to vault".

### A/B on the hero

Two variants behind `?hero=b` (A: story headline; B: proof-first "Watch Kavach catch a morph in 60 seconds" with the sample verdict preview). Screenshots at 1280 and 375 px go to a fresh reviewer with the judge persona ("lands cold, must know what to click in five seconds"). The winner ships; the loser is removed.

## Verification

Unit tests for the simulator transformation table and the sample-shield builder. `scripts/smoke.ts` gains the guided demo and one simulation on production. Playwright screenshots of every screen at desktop and phone widths before deploy.
