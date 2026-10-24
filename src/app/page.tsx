import Link from "next/link";
import { ShieldMark } from "@/components/ShieldMark";

const BEATS = [
  { n: "01", title: "She registers", body: "Her real photos go into a private vault. Each one is fingerprinted the moment it lands. Nobody else can open it." },
  { n: "02", title: "Someone morphs", body: "A stranger sends a version of her that was never taken. She drops it in. Kavach proves it was made from her own photo and blurs it before she has to look." },
  { n: "03", title: "She files", body: "Two complaints are written for her, with the hashes, the dates and the law. The platform has 2 hours. She has what she needs to make that count." },
];

export default function Home() {
  return (
    <div className="pt-6 md:pt-16">
      <section className="grid grid-cols-1 gap-10 md:grid-cols-[3fr_2fr] md:gap-16">
        <div>
          <p className="rise label" style={{ ["--i" as string]: 0 }}>
            A photo shield for women
          </p>
          <h1 className="rise mt-4 max-w-[14ch] text-4xl font-semibold tracking-tighter leading-[1.02] md:text-6xl" style={{ ["--i" as string]: 1 }}>
            They can morph the photo. They can&apos;t hide where it came from.
          </h1>
          <p className="rise mt-6 max-w-[58ch] text-base leading-relaxed text-muted md:text-lg" style={{ ["--i" as string]: 2 }}>
            Kavach proves a manipulated image was made from your own photo, blurs it, and writes the complaint a platform must act on within 2 hours of receiving it.
          </p>
          <div className="rise mt-8 flex flex-wrap items-center gap-3" style={{ ["--i" as string]: 3 }}>
            <Link href="/vault" className="btn-accent">
              Raise your shield
            </Link>
            <Link href="/check" className="btn-ghost">
              I already have the image
            </Link>
          </div>
        </div>
        <div className="rise relative hidden md:block" style={{ ["--i" as string]: 2 }}>
          <div className="absolute -right-6 top-6 h-64 w-64 rounded-full border border-line" />
          <div className="absolute right-10 top-24 h-40 w-40 rounded-full border border-accent/30" />
          <ShieldMark className="absolute right-24 top-32 h-24 w-24 text-accent" />
        </div>
      </section>

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
