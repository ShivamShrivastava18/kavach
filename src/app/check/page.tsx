"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UploadDrop } from "@/components/UploadDrop";
import { GuideStrip } from "@/components/GuideStrip";
import { downscale } from "@/lib/client/downscale";

const PLATFORMS = ["Instagram", "X", "WhatsApp", "Telegram", "Facebook", "Snapchat", "Other"];

export default function CheckPage() {
  const router = useRouter();
  const [me, setMe] = useState<{ name: string; demo: boolean; photos: number; sample?: boolean } | null | undefined>(undefined);
  const [platform, setPlatform] = useState("Instagram");
  const [postUrl, setPostUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/profile").then(async (r) => setMe(r.ok ? await r.json() : null));
  }, []);

  async function run() {
    setError(null);
    setBusy(true);
    const fd = new FormData();
    if (file) {
      try {
        fd.append("file", await downscale(file), file.name.replace(/\.[^.]+$/, "") + ".jpg");
      } catch (e) {
        setBusy(false);
        setError((e as Error).message);
        return;
      }
    }
    fd.append("platform", platform);
    fd.append("postUrl", postUrl);
    const r = await fetch("/api/check", { method: "POST", body: fd }).catch(() => null);
    const body = (await r?.json().catch(() => ({}))) as { caseId?: string; error?: string } | undefined;
    if (!r || !r.ok || !body?.caseId) {
      setBusy(false);
      setError(body?.error ?? (r?.status === 413 ? "That image is too large to send." : "Check failed. Try again."));
      return;
    }
    router.push(`/case/${body.caseId}`);
  }

  if (me === undefined) return <div className="skeleton mt-10 h-40 rounded-2xl" />;
  if (me === null)
    return (
      <div className="pt-16">
        <h1 className="text-3xl font-semibold tracking-tighter">Open your shield first.</h1>
        <p className="mt-3 text-muted">Kavach compares the image against the photos in your vault.</p>
        <Link href="/vault" className="btn-accent mt-6">
          Go to vault
        </Link>
      </div>
    );

  return (
    <div className="pt-6 md:pt-12">
      {me.sample && <GuideStrip step="case" />}
    <div className="grid grid-cols-1 gap-10 md:grid-cols-[2fr_3fr]">
      <div>
        <p className="label">Check an image</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tighter md:text-5xl">Drop it here. You will not have to look at it.</h1>
        <p className="mt-4 max-w-[46ch] text-muted">
          The image goes straight into private storage. Kavach blurs it, fingerprints it, and compares it with your {me.photos} registered photo{me.photos === 1 ? "" : "s"}.
        </p>
        {me.demo && <p className="mt-4 text-sm text-accent">Demo mode: pressing Check opens Priya&apos;s seeded case.</p>}
        {!me.demo && (
          <p className="mt-4 text-sm text-muted">
            No morph at hand?{" "}
            <Link href="/vault" className="underline decoration-line underline-offset-4 hover:text-fg">
              Let Kavach make the usual edits of your photo
            </Link>{" "}
            and check each one.
          </p>
        )}
      </div>
      <div className="flex flex-col gap-5">
        <UploadDrop
          label={file ? file.name : "Drop the image"}
          hint={me.demo ? "Uploads are off in demo mode. Press Check." : "Screenshot or saved image, up to 4 MB."}
          disabled={me.demo}
          busy={busy}
          onFile={setFile}
        />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="label" htmlFor="platform">
              Where it appeared
            </label>
            <select id="platform" className="field" value={platform} onChange={(e) => setPlatform(e.target.value)}>
              {PLATFORMS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="label" htmlFor="url">
              Post link, if you have it
            </label>
            <input id="url" className="field" value={postUrl} onChange={(e) => setPostUrl(e.target.value)} placeholder="https://" inputMode="url" />
          </div>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button className="btn-accent self-start" disabled={busy || (!file && !me.demo)} onClick={run}>
          {busy ? "Comparing" : "Check"}
        </button>
      </div>
    </div>
    </div>
  );
}
