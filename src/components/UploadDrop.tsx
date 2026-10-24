"use client";

import { useCallback, useRef, useState } from "react";

type Props = {
  label: string;
  hint: string;
  disabled?: boolean;
  busy?: boolean;
  onFile: (file: File) => void;
};

export function UploadDrop({ label, hint, disabled, busy, onFile }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const pick = useCallback(
    (files: FileList | null) => {
      const f = files?.[0];
      if (f) onFile(f);
    },
    [onFile],
  );

  return (
    <button
      type="button"
      disabled={disabled || busy}
      onClick={() => input.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (!disabled) pick(e.dataTransfer.files);
      }}
      className={`group flex w-full flex-col items-start gap-2 rounded-2xl border border-dashed px-6 py-10 text-left transition-colors ${
        over ? "border-accent bg-accent/5" : "border-line hover:border-muted"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <span className="flex items-center gap-3 text-base font-medium">
        <span className={`h-2 w-2 rounded-full ${busy ? "breathe bg-accent" : "bg-muted group-hover:bg-accent"}`} />
        {busy ? "Working" : label}
      </span>
      <span className="text-sm text-muted">{hint}</span>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files)} />
    </button>
  );
}
