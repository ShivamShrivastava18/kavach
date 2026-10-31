"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import type { CaseView } from "@/lib/caseview";
import type { Drafts } from "@/lib/types";
import { ComplaintTabs, type ComplaintTab } from "@/components/ComplaintTabs";
import { GuideStrip } from "@/components/GuideStrip";
import { ScoreGauge } from "@/components/ScoreGauge";

const VERDICT_LINE: Record<string, (d?: string) => string> = {
  derived: (d) => `Made from your photo uploaded ${d ?? "on record"}.`,
  likely: (d) => `Likely made from your photo uploaded ${d ?? "on record"}.`,
  none: () => "No registered photo matched.",
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
  const [tab, setTab] = useState<ComplaintTab>("platform");

  function openTab(t: ComplaintTab) {
    setTab(t);
    document.getElementById("complaints")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

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
        {c.explicit && <span className="chip border-danger text-danger">flagged explicit</span>}
        {c.moderated === false && <span className="chip" title="The moderation add-on's monthly quota is spent; explicit-content flagging was skipped for this case.">not screened for explicit content</span>}
        <span className="chip">{c.platform}</span>
      </div>

      <div className="rise mt-6" style={{ ["--i" as string]: 2 }}>
        <ScoreGauge score={c.match.score} parts={c.match.parts} mirrored={c.match.mirrored} />
      </div>

      <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-[3fr_2fr]">
        <figure className="rise" style={{ ["--i" as string]: 2 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.exhibitBlur} alt="The reported image, blurred and stamped" className="w-full rounded-2xl border border-line" />
          <figcaption className="mt-2 text-xs text-muted">
            The reported image, blurred and stamped. You never see the original. SHA-256 <span className="font-mono">{c.exhibitSha256.slice(0, 16)}</span>
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

      <section className="mt-12">
        <p className="label">What was done</p>
        {drafts ? (
          <p className="mt-3 max-w-[70ch] text-base leading-relaxed">{drafts.description}</p>
        ) : draftError ? (
          <p className="mt-3 text-sm text-danger">{draftError}</p>
        ) : (
          <div className="mt-3 flex max-w-[70ch] flex-col gap-2">
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-5/6 rounded" />
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
      </section>

      <section className="mt-12">
        <p className="label">Do these three things</p>
        <ol className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            {
              n: "01",
              title: "Send it to the platform",
              why: "They host it. By law they must remove it within 2 hours of receiving your complaint.",
              action: <button onClick={() => openTab("platform")} className="btn-accent px-4 py-2">Open platform complaint</button>,
            },
            {
              n: "02",
              title: "File on cybercrime.gov.in",
              why: "Removal is the platform's job. Finding who did it is the police's. This report starts that record.",
              action: <button onClick={() => openTab("portal")} className="btn-ghost px-4 py-2">Open portal report</button>,
            },
            {
              n: "03",
              title: "Keep the evidence",
              why: "Hashes, timestamps, the stamped exhibit and both drafts in one file. Attach it to whatever you file.",
              action: (
                <a href={`/api/case/${c.id}/bundle`} className="btn-ghost px-4 py-2">
                  Download evidence bundle
                </a>
              ),
            },
          ].map((s, i) => (
            <li key={s.n} className="rise flex flex-col justify-between gap-4 rounded-2xl border border-line p-5" style={{ ["--i" as string]: i + 3 }}>
              <div>
                <span className="font-mono text-xs text-accent">{s.n}</span>
                <h2 className="mt-2 text-lg font-semibold tracking-tight">{s.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.why}</p>
              </div>
              <div>{s.action}</div>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs text-muted">
          Money or threats involved? Call <span className="text-fg">1930</span>, the national cyber crime helpline.{" "}
          <button onClick={releaseOriginal} className="underline decoration-line underline-offset-4 hover:text-fg">
            Release the original for police
          </button>{" "}
          creates a 10-minute link; nothing else ever serves it.
          {originalMsg && <span className="ml-2 text-fg">{originalMsg}</span>}
        </p>
      </section>

      <section id="complaints" className="mt-12 scroll-mt-6">
        <p className="label">Your complaints, written</p>
        <div className="mt-3">
          <ComplaintTabs drafts={drafts} caseId={c.id} tab={tab} onTab={setTab} />
        </div>
        <Link href="/vault" className="mt-6 inline-block text-sm text-muted underline decoration-line underline-offset-4 hover:text-fg">
          Back to the vault
        </Link>
      </section>
    </div>
  );
}
