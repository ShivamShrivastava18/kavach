import Link from "next/link";
import { ShieldMark } from "./ShieldMark";
import { TRUST } from "./trust";
export { TRUST };

export function Shell({ demo, children }: { demo: boolean; children: React.ReactNode }) {
  return (
    <>
      {demo && (
        <div className="border-b border-line bg-raised px-4 py-2 text-center text-xs text-muted">
          Demo mode. You are looking at Priya&apos;s seeded shield. Uploads are off. Run it with your own keys to use it for real.
        </div>
      )}
      <header className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 py-5 md:px-8">
        <Link href="/" className="flex items-baseline gap-2.5 text-base font-semibold tracking-tight">
          <ShieldMark className="h-6 w-6 self-center text-accent" />
          <span>Kavach</span>
          <span className="text-sm font-normal text-accent" lang="hi" aria-label="Kavach in Hindi">
            कवच
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm text-muted">
          <Link className="rounded-full px-3 py-1.5 hover:text-fg" href="/vault">
            Vault
          </Link>
          <Link className="rounded-full px-3 py-1.5 hover:text-fg" href="/check">
            Check
          </Link>
          <Link className="rounded-full px-3 py-1.5 hover:text-fg" href="/about">
            <span className="sm:hidden">About</span>
            <span className="hidden sm:inline">How it works</span>
          </Link>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 pb-24 md:px-8">{children}</main>
      <footer className="mx-auto w-full max-w-[1200px] border-t border-line px-4 py-6 text-xs text-muted md:px-8">
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {TRUST.map((t) => (
            <li key={t} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
              {t}
            </li>
          ))}
        </ul>
        <p className="mt-4">Kavach does not detect AI. It proves derivation from your own photo and prepares the complaint. Built for SheBuilds HackDays 2026 with Cloudinary and Gemma 4. Open source, MIT.</p>
      </footer>
    </>
  );
}
