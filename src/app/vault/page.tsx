"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { UploadDrop } from "@/components/UploadDrop";
import { downscale } from "@/lib/client/downscale";

type Me = { id: string; name: string; demo: boolean; photos: number };
type Photo = { publicId: string; uploadedAt: string; sha256: string; faces: number; quality?: number; thumb: string };

export default function VaultPage() {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [mode, setMode] = useState<"create" | "open">("create");
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch("/api/profile");
    if (!r.ok) {
      setMe(null);
      return;
    }
    const m = (await r.json()) as Me;
    setMe(m);
    const v = await fetch("/api/vault");
    if (v.ok) setPhotos(((await v.json()) as { photos: Photo[] }).photos);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const r = await fetch("/api/profile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode, name, id, pin }),
    });
    setBusy(false);
    if (!r.ok) {
      setError(((await r.json()) as { error: string }).error);
      return;
    }
    await load();
  }

  async function upload(file: File) {
    setError(null);
    setNotice(null);
    setBusy(true);
    const blob = await downscale(file);
    const fd = new FormData();
    fd.append("file", blob, file.name);
    const r = await fetch("/api/vault", { method: "POST", body: fd });
    setBusy(false);
    const body = (await r.json()) as { photo?: Photo; warning?: string; error?: string };
    if (!r.ok) {
      setError(body.error ?? "Upload failed.");
      return;
    }
    if (body.photo) setPhotos((p) => [...p, body.photo!]);
    if (body.warning) setNotice(body.warning);
  }

  async function remove(publicId: string) {
    const r = await fetch(`/api/vault?publicId=${encodeURIComponent(publicId)}`, { method: "DELETE" });
    if (r.ok) setPhotos((p) => p.filter((x) => x.publicId !== publicId));
  }

  async function close() {
    await fetch("/api/profile", { method: "DELETE" });
    setMe(null);
    setPhotos([]);
  }

  if (me === undefined) {
    return (
      <div className="pt-10">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="skeleton mt-6 h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (me === null) {
    return (
      <div className="grid grid-cols-1 gap-10 pt-6 md:grid-cols-[2fr_3fr] md:pt-16">
        <div>
          <p className="label">Your vault</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tighter md:text-5xl">Open your shield.</h1>
          <p className="mt-4 max-w-[48ch] text-muted">
            A shield is a name and a PIN. Your photos are stored privately and fingerprinted. Keep the shield id you are given; it is how you come back.
          </p>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-5">
          <div className="flex gap-1 rounded-full border border-line p-1 text-sm">
            {(["create", "open"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 rounded-full px-4 py-2 transition-colors ${mode === m ? "bg-fg text-bg" : "text-muted hover:text-fg"}`}
              >
                {m === "create" ? "New shield" : "I have a shield id"}
              </button>
            ))}
          </div>
          {mode === "create" ? (
            <div className="flex flex-col gap-2">
              <label className="label" htmlFor="name">
                Your name
              </label>
              <input id="name" className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="As it should appear on the complaint" autoComplete="name" />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="label" htmlFor="sid">
                Shield id
              </label>
              <input id="sid" className="field font-mono" value={id} onChange={(e) => setId(e.target.value)} placeholder="12 characters" autoComplete="off" />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label className="label" htmlFor="pin">
              PIN
            </label>
            <input id="pin" className="field font-mono" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="4 to 6 digits" inputMode="numeric" type="password" autoComplete="off" />
            <span className="text-xs text-muted">Choose something you will remember. There is no reset.</span>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button className="btn-accent self-start" disabled={busy}>
            {mode === "create" ? "Create shield" : "Open shield"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="pt-6 md:pt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Vault</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tighter md:text-5xl">{me.name}&apos;s shield</h1>
          <p className="mt-2 font-mono text-xs text-muted">
            shield id <span className="text-fg">{me.id}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/check" className="btn-accent">
            Check an image
          </Link>
          <button onClick={close} className="btn-ghost">
            Close
          </button>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-[2fr_3fr]">
        <div>
          <UploadDrop
            label="Add a real photo"
            hint={me.demo ? "Uploads are off in demo mode." : "JPG, PNG or WebP up to 4 MB. Faces are detected and fingerprinted on upload."}
            disabled={me.demo}
            busy={busy}
            onFile={upload}
          />
          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
          {notice && <p className="mt-3 text-sm text-accent">{notice}</p>}
          <p className="mt-4 text-xs text-muted">
            Stored as a Cloudinary private asset. Fingerprinted with Cloudinary pHash plus Kavach&apos;s own face hashes.
          </p>
        </div>
        <div>
          {photos.length === 0 ? (
            <div className="rounded-2xl border border-line px-6 py-12 text-center text-sm text-muted">No photos yet. Add the ones most likely to be taken from your profiles.</div>
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {photos.map((p, i) => (
                <li key={p.publicId} className="rise group relative" style={{ ["--i" as string]: i }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.thumb} alt="" className="aspect-square w-full rounded-xl object-cover" />
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-mono text-[11px] text-muted">{p.uploadedAt.slice(0, 10)}</span>
                    <span className="chip">{p.faces ? "fingerprinted" : "no face"}</span>
                  </div>
                  {!me.demo && (
                    <button onClick={() => remove(p.publicId)} className="absolute right-2 top-2 rounded-full bg-bg/80 px-2 py-1 text-xs text-muted opacity-0 transition-opacity group-hover:opacity-100">
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
