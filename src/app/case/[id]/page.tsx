"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import type { CaseView } from "@/lib/caseview";
import type { Drafts } from "@/lib/types";
import { ComplaintTabs } from "@/components/ComplaintTabs";
import { GuideStrip } from "@/components/GuideStrip";

const VERDICT_LINE: Record<string, (d?: string) => string> = {
  derived: (d) => `Made from your photo uploaded ${d ?? "on record"}.`,
  likely: (d) => `Likely made from your photo uploaded ${d ?? "on record"}.`,
  none: () => "No registered photo matched.",
};

const METHOD_LABEL: Record<string, string> = {
  "cloudinary-phash": "Cloudinary pHash",
  "face-phash": "face pHash",
  "face-dhash": "face dHash",
  "full-phash": "full-image pHash",
  "full-dhash": "full-image dHash",
};

function fmtDate(iso?: string) {
  if (!iso) return undefined;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<{ case: CaseView; victimName: string; sample?: boolean } | null | undefined>(undefined);
  const [drafts, setDrafts] = useState<Drafts | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [originalMsg, setOriginalMsg] = useState<string | null>(null);

  async function releaseOriginal() {
    if (!window.confirm("This opens a 10-minute link to the unblurred original, for attaching to a police complaint only. Continue?")) return;
    const r = await fetch(`/api/case/${id}/original`, { method: "POST" }).catch(() => null);
    const body = (await r?.json().catch(() => ({}))) as { url?: string; error?: string } | undefined;
    if (!r || !r.ok || !body?.url) {
      setOriginalMsg(body?.error ?? "Could not create the link.");
      return;
    }
    window.open(body.url, "_blank", "noopener");
    setOriginalMsg("Link opened in a new tab. It expires in 10 minutes.");
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await fetch(`/api/case/${id}`);
      if (!r.ok) {
        if (!cancelled) setData(null);
        return;
      }
      const d = (await r.json()) as { case: CaseView; victimName: string; sample?: boolean };
      if (cancelled) return;
      setData(d);
      if (d.case.drafts) {
        setDrafts(d.case.drafts);
        return;
      }
      const dr = await fetch(`/api/case/${id}/draft`, { method: "POST" }).catch(() => null);
      if (cancelled) return;
      const body = (await dr?.json().catch(() => ({}))) as { drafts?: Drafts; error?: string } | undefined;
      if (!dr || !dr.ok || !body?.drafts) {
        setDraftError(body?.error ?? "Drafting timed out. Reload the page to try again.");
        return;
      }
      setDrafts(body.drafts);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (data === undefined)
    return (
      <div className="pt-10">
        <div className="skeleton h-12 w-3/4 rounded" />
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="skeleton aspect-square rounded-2xl" />
          <div className="skeleton aspect-square rounded-2xl" />
        </div>
      </div>
    );
  if (data === null)
    return (
      <div className="pt-16">
        <h1 className="text-3xl font-semibold tracking-tighter">No such case.</h1>
        <Link href="/vault" className="btn-ghost mt-6">
          Back to vault
        </Link>
      </div>
    );

  const c = data.case;
  const verdict = c.match.verdict;
  const score = Math.round(c.match.score * 100);
  const matchedDate = fmtDate(c.matchedPhoto?.uploadedAt);

  return (
    <div className="pt-6 md:pt-12">
      {data.sample && <GuideStrip step={drafts ? "complaint" : "case"} caseId={c.id} />}
      <p className="label">
        Case <span className="font-mono normal-case tracking-normal text-fg">{c.id}</span>
        {c.simulated && <span className="ml-3 chip normal-case tracking-normal">simulated: {c.simulated}</span>}
      </p>
      <h1
        className={`rise mt-3 max-w-[18ch] text-3xl font-semibold tracking-tighter leading-[1.05] md:text-5xl ${verdict === "none" ? "text-muted" : ""}`}
        style={{ ["--i" as string]: 0 }}
      >
        {VERDICT_LINE[verdict](matchedDate)}
      </h1>
      <div className="rise mt-5 flex flex-wrap items-center gap-2" style={{ ["--i" as string]: 1 }}>
        <span className={`chip ${verdict === "derived" ? "border-accent text-accent" : ""}`}>similarity {score}%</span>
        {c.match.mirrored && <span className="chip">mirrored</span>}
        {c.match.methods.map((m) => (
          <span key={m} className="chip">
            {METHOD_LABEL[m] ?? m}
          </span>
        ))}
        {c.explicit && <span className="chip border-danger text-danger">flagged explicit</span>}
        {c.moderated === false && <span className="chip" title="The moderation add-on's monthly quota is spent; explicit-content flagging was skipped for this case.">not screened for explicit content</span>}
        <span className="chip">{c.platform}</span>
      </div>

      <section className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-[3fr_2fr]">
        <figure className="rise" style={{ ["--i" as string]: 2 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.exhibitBlur} alt="The reported image, blurred and stamped" className="w-full rounded-2xl border border-line" />
          <figcaption className="mt-2 text-xs text-muted">
            The exhibit. Delivered only through Cloudinary pixelate-faces and blur with the evidence stamp burned in. Original SHA-256 <span className="font-mono">{c.exhibitSha256.slice(0, 16)}</span>
          </figcaption>
        </figure>
        <figure className="rise" style={{ ["--i" as string]: 3 }}>
          {c.matchedThumb && verdict !== "none" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.matchedThumb} alt="Your matched vault photo" className="w-full rounded-2xl border border-line object-cover" />
          ) : (
            <div className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">
              Nothing in your vault matched. Add the original photo and check again.
            </div>
          )}
          <figcaption className="mt-2 text-xs text-muted">{verdict !== "none" ? `Your registered photo, ${matchedDate}.` : "No match."}</figcaption>
        </figure>
      </section>

      <section className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-[2fr_3fr]">
        <div>
          <p className="label">What was done</p>
          {drafts ? (
            <p className="mt-3 text-base leading-relaxed">{drafts.description}</p>
          ) : draftError ? (
            <p className="mt-3 text-sm text-danger">{draftError}</p>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-5/6 rounded" />
              <div className="skeleton h-4 w-2/3 rounded" />
            </div>
          )}
          {drafts && (
            <p className="mt-3 flex flex-wrap gap-2">
              <span className={`chip ${drafts.fallback ? "border-danger text-danger" : ""}`}>
                {drafts.fallback ? "Fallback text" : drafts.provider === "demo" ? "Template text" : `Drafted by ${drafts.provider.startsWith("gemma") ? "Gemma 4" : drafts.provider}`}
              </span>
              {drafts.textOnly && <span className="chip">text-only analysis</span>}
              <span className="chip">severity {drafts.severity}</span>
            </p>
          )}
          <div className="mt-8 border-t border-line pt-6">
            <p className="label">What happens next</p>
            <ol className="mt-3 flex flex-col gap-3 text-sm text-muted">
              <li>
                <span className="text-fg">Send the platform complaint.</span> Under the IT Rules as amended in Feb 2026 they must remove it within 2 hours.
              </li>
              <li>
                <span className="text-fg">File on the portal.</span>{" "}
                <a className="underline decoration-line underline-offset-4 hover:text-fg" href="https://cybercrime.gov.in" target="_blank" rel="noreferrer">
                  cybercrime.gov.in
                </a>
                , category women and children.
              </li>
              <li>
                <span className="text-fg">Call 1930</span> if money or threats are involved.
              </li>
            </ol>
            <div className="mt-6 flex flex-wrap gap-2">
              <a href={`/api/case/${c.id}/bundle`} className="btn-ghost px-4 py-2">
                Download evidence bundle
              </a>
              <button onClick={releaseOriginal} className="btn-ghost px-4 py-2 text-muted">
                Release original for police
              </button>
            </div>
            {originalMsg && <p className="mt-2 text-xs text-muted">{originalMsg}</p>}
            <p className="mt-2 text-xs text-muted">The bundle holds the evidence record, the stamped blurred exhibit and both drafts. The original stays in private storage.</p>
            <Link href="/vault" className="mt-6 inline-block text-sm text-muted underline decoration-line underline-offset-4 hover:text-fg">
              Back to the vault
            </Link>
          </div>
        </div>
        <div>
          <p className="label">Complaints, filled</p>
          <div className="mt-3">
            <ComplaintTabs drafts={drafts} caseId={c.id} />
          </div>
        </div>
      </section>
    </div>
  );
}
