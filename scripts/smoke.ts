// End-to-end smoke test against a running Kavach, local or deployed.
// Usage: npx tsx scripts/smoke.ts http://localhost:3000   (demo or live)
//        LIVE=1 npx tsx scripts/smoke.ts https://kavach.vercel.app   (creates a real shield, uploads the seed portrait, checks the seed exhibit)
import { readFileSync } from "node:fs";

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const live = process.env.LIVE === "1";
let cookie = "";

async function call(path: string, init: RequestInit = {}) {
  const r = await fetch(base + path, { ...init, headers: { ...(init.headers ?? {}), cookie }, redirect: "manual" });
  const set = r.headers.get("set-cookie");
  if (set) cookie = set.split(";")[0];
  return r;
}

function ok(cond: unknown, msg: string) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
  console.log("ok  ", msg);
}

async function main() {
  const t0 = Date.now();
  const home = await call("/");
  ok(home.status === 200, "home renders");

  const prof = await call("/api/profile", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mode: "create", name: "Smoke Tester", pin: "4321" }),
  });
  const profBody = (await prof.json()) as { id?: string; demo?: boolean; error?: string };
  ok(prof.ok && profBody.id, `profile opened (${profBody.demo ? "demo" : "live"}) ${profBody.id}`);

  let caseId: string;
  if (live && !profBody.demo) {
    const fd = new FormData();
    fd.append("file", new File([readFileSync("public/demo/priya-1.png")], "priya-1.png", { type: "image/png" }));
    const up = await call("/api/vault", { method: "POST", body: fd });
    const upBody = (await up.json()) as { photo?: { faces: number; cldPhash?: string }; error?: string };
    ok(up.ok && upBody.photo, `vault upload faces=${upBody.photo?.faces} cldPhash=${upBody.photo?.cldPhash ?? "none"} ${upBody.error ?? ""}`);

    const fd2 = new FormData();
    fd2.append("file", new File([readFileSync("scripts/seed-out/exhibit.png")], "exhibit.png", { type: "image/png" }));
    fd2.append("platform", "Instagram");
    fd2.append("postUrl", "https://instagram.com/p/smoke");
    const chk = await call("/api/check", { method: "POST", body: fd2 });
    const chkBody = (await chk.json()) as { caseId?: string; verdict?: string; score?: number; error?: string };
    ok(chk.ok && chkBody.caseId, `check verdict=${chkBody.verdict} score=${chkBody.score?.toFixed(3)} ${chkBody.error ?? ""}`);
    caseId = chkBody.caseId!;
  } else {
    const chk = await call("/api/check", { method: "POST", body: new FormData() });
    const chkBody = (await chk.json()) as { caseId?: string; verdict?: string };
    ok(chk.ok && chkBody.caseId, `demo check verdict=${chkBody.verdict}`);
    caseId = chkBody.caseId!;
  }

  const cs = await call(`/api/case/${caseId}`);
  const csBody = (await cs.json()) as { case?: { exhibitBlur: string; match: { verdict: string } } };
  ok(cs.ok && csBody.case, `case loads, verdict ${csBody.case?.match.verdict}`);

  const img = await call(csBody.case!.exhibitBlur);
  ok(img.status === 200 || img.status === 307, `blurred exhibit delivered (${img.status}, ${img.headers.get("content-type")})`);

  const dr = await call(`/api/case/${caseId}/draft`, { method: "POST" });
  const drBody = (await dr.json()) as { drafts?: { provider: string; fallback: boolean; platform: string; description: string; textOnly?: boolean } };
  ok(dr.ok && drBody.drafts, `drafts provider=${drBody.drafts?.provider} fallback=${drBody.drafts?.fallback}${drBody.drafts?.textOnly ? " text-only" : ""}`);
  console.log("     description:", drBody.drafts?.description.slice(0, 220));
  ok(drBody.drafts?.platform.includes("2 hours"), "platform draft cites the 2-hour duty");

  const bundle = await call(`/api/case/${caseId}/bundle`);
  ok(bundle.status === 200 && bundle.headers.get("content-type") === "application/zip", "evidence bundle zips");

  const other = await fetch(`${base}/api/case/${caseId}`);
  ok(other.status === 401, "case refused without session");

  if (live && !profBody.demo) {
    const del = await call("/api/profile", { method: "DELETE" });
    ok(del.ok, "smoke shield deleted");
  }

  console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

main().catch((e) => {
  console.error("SMOKE FAILED", e);
  process.exit(1);
});
