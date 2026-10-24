const ROWS: [string, string][] = [
  ["Private uploads", "Every photo and every exhibit is a Cloudinary private asset in a per-shield folder. Nothing has a public URL."],
  ["pHash on upload", "Cloudinary returns a 64-bit perceptual hash the moment an image lands. It is the first of three fingerprints."],
  ["Face detection and g_face crops", "Cloudinary finds the face; Kavach fingerprints the face crop with its own open-source pHash and dHash, so crops, borders and captions elsewhere in the frame do not hide the match."],
  ["Mirror pass", "Every comparison is run twice, once against the mirrored suspect. Flipping a photo is the cheapest disguise there is."],
  ["Pixelate faces and blur", "The exhibit is only ever delivered through e_pixelate_faces and e_blur. You never see it clear, and neither does the model that drafts your complaint."],
  ["Evidence stamp", "A Cloudinary text overlay burns the case id, SHA-256 prefix and timestamp into the blurred exhibit, so the attachment carries its own provenance."],
  ["Moderation", "Amazon Rekognition moderation through Cloudinary flags explicit content, which switches the complaint to the intimate-imagery sections."],
  ["Signed, expiring access", "Image links are signed by Kavach and die after ten minutes. Case records live as private raw JSON beside the evidence."],
];

export default function AboutPage() {
  return (
    <div className="pt-6 md:pt-16">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-[2fr_3fr]">
        <div>
          <p className="label">How it works</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tighter md:text-5xl">Proof, not guesswork.</h1>
          <p className="mt-4 max-w-[46ch] text-muted">
            Kavach does not try to detect AI. Detectors are wrong often enough that a platform can ignore them. Instead it answers one narrow question with evidence: was this image made from a photo you registered?
          </p>
        </div>
        <dl className="divide-y divide-line border-t border-line">
          {ROWS.map(([t, d], i) => (
            <div key={t} className="rise grid grid-cols-1 gap-2 py-5 md:grid-cols-[1fr_2fr] md:gap-8" style={{ ["--i" as string]: i }}>
              <dt className="text-sm font-medium">{t}</dt>
              <dd className="text-sm leading-relaxed text-muted">{d}</dd>
            </div>
          ))}
        </dl>
      </div>

      <section className="mt-20 grid grid-cols-1 gap-10 md:grid-cols-[2fr_3fr]">
        <div>
          <p className="label">The verdict</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Three bands, one honest number.</h2>
        </div>
        <div className="divide-y divide-line border-t border-line text-sm">
          <div className="grid grid-cols-[6rem_1fr] gap-4 py-4">
            <span className="font-mono text-accent">80 to 100</span>
            <span>Made from your photo. The complaint cites the registered photo date and the similarity.</span>
          </div>
          <div className="grid grid-cols-[6rem_1fr] gap-4 py-4">
            <span className="font-mono">60 to 79</span>
            <span className="text-muted">Likely derived. The complaint says so, no stronger.</span>
          </div>
          <div className="grid grid-cols-[6rem_1fr] gap-4 py-4">
            <span className="font-mono text-muted">below 60</span>
            <span className="text-muted">No match. The complaint rests on identity and consent, and tells you to add the original if you have it.</span>
          </div>
        </div>
      </section>

      <section className="mt-20 grid grid-cols-1 gap-10 md:grid-cols-[2fr_3fr]">
        <div>
          <p className="label">The drafting</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Gemma 4 writes it. It never sees your face.</h2>
        </div>
        <p className="max-w-[60ch] text-sm leading-relaxed text-muted">
          Gemma 4 receives the blurred, stamped exhibit, a blurred thumbnail of the matched photo, and the structured evidence. Your name and the post link are replaced with placeholders before the call and restored after. It rewrites two template complaints, one for the platform&apos;s grievance officer citing the 2-hour removal duty under the IT Rules as amended on 10 Feb 2026, and one incident report for cybercrime.gov.in. Every draft ends by asking you to verify the section numbers before filing.
        </p>
      </section>

      <section className="mt-20 border-t border-line pt-8 text-xs text-muted">
        <p>Sources: complaint and under-reporting figures from Digit (2026); 2-hour removal duty from the IT (Intermediary Guidelines) Amendment Rules notified 10 Feb 2026, in force 20 Feb 2026. Seed portraits are generated vector art and depict no real person.</p>
      </section>
    </div>
  );
}
