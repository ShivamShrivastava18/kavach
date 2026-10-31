import { Hero } from "@/components/Hero";

const BEATS = [
  { n: "01", title: "She registers", body: "Her real photos go into a private vault. Each one is fingerprinted the moment it lands. Nobody else can open it." },
  { n: "02", title: "Someone morphs", body: "A stranger sends a version of her that was never taken. She drops it in. Kavach proves it was made from her own photo and blurs it before she has to look." },
  { n: "03", title: "She files", body: "Two complaints are written for her, with the hashes, the dates and the law. The platform has 2 hours. She has what she needs to make that count." },
];

// A/B, 31 Oct 2026: the proof-first headline won against the story headline with a judge persona
// (five-second clarity 4 vs 3); the subhead keeps the precise legal line. See docs/build-journey.md.
const HERO = {
  eyebrow: "Kavach, a photo shield for women",
  title: "Register your photo. Prove the morph. File the complaint.",
  body: "Kavach proves a morphed image was made from your own photo, blurs it, and writes the complaint a platform must act on within 2 hours.",
};

export default function Home() {
  const h = HERO;
  return (
    <div className="pt-6 md:pt-16">
      <Hero eyebrow={h.eyebrow} title={h.title} body={h.body} />

      <section className="mt-24 grid grid-cols-1 gap-0 border-t border-line md:grid-cols-3 md:divide-x md:divide-line">
        {BEATS.map((b, i) => (
          <div key={b.n} className="rise border-b border-line py-8 md:border-b-0 md:px-8 md:first:pl-0" style={{ ["--i" as string]: 4 + i }}>
            <span className="font-mono text-xs text-accent">{b.n}</span>
            <h2 className="mt-3 text-xl font-semibold tracking-tight">{b.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{b.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-24 grid grid-cols-1 gap-10 md:grid-cols-[1fr_1fr] md:gap-16">
        <div>
          <p className="font-mono text-5xl tracking-tighter md:text-7xl">80,000</p>
          <p className="mt-3 max-w-[40ch] text-sm text-muted">
            cyber crime complaints involving women in India by 2026, up from about 50,000 in 2024.
          </p>
        </div>
        <div>
          <p className="font-mono text-5xl tracking-tighter md:text-7xl">62%</p>
          <p className="mt-3 max-w-[40ch] text-sm text-muted">of deepfake abuse cases involving women go unreported. The law changed on 20 Feb 2026. The filing did not get easier.</p>
        </div>
      </section>
    </div>
  );
}
