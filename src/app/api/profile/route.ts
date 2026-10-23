import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { fail } from "@/lib/api";
import { isDemoMode } from "@/lib/env";
import { hashPin, SESSION_COOKIE, signSession } from "@/lib/session";
import { getProfile, newId, saveProfile } from "@/lib/store";
import { DEMO_PROFILE_ID } from "@/lib/demo/seed";
import type { Profile } from "@/lib/types";


type Body = { name?: string; pin?: string; mode?: "create" | "open"; id?: string };

function withSession(res: NextResponse, profileId: string): NextResponse {
  res.cookies.set(SESSION_COOKIE, signSession(profileId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;
  if (isDemoMode()) {
    const p = await getProfile(DEMO_PROFILE_ID);
    return withSession(NextResponse.json({ id: DEMO_PROFILE_ID, name: p?.name ?? "Priya", demo: true }), DEMO_PROFILE_ID);
  }
  const pin = (body.pin ?? "").trim();
  if (!/^\d{4,6}$/.test(pin)) return fail(400, "PIN must be 4 to 6 digits.");

  if (body.mode === "open") {
    const id = (body.id ?? "").trim().toLowerCase();
    if (!id) return fail(400, "Enter your shield id.");
    const p = await getProfile(id);
    if (!p || hashPin(pin, p.salt) !== p.pinHash) return fail(401, "That shield id and PIN do not match.");
    return withSession(NextResponse.json({ id: p.id, name: p.name }), p.id);
  }

  const name = (body.name ?? "").trim();
  if (name.length < 2 || name.length > 60) return fail(400, "Enter your name, 2 to 60 characters.");
  const salt = randomBytes(8).toString("hex");
  const profile: Profile = {
    id: newId(),
    name,
    salt,
    pinHash: hashPin(pin, salt),
    createdAt: new Date().toISOString(),
    vault: [],
  };
  await saveProfile(profile);
  return withSession(NextResponse.json({ id: profile.id, name: profile.name }), profile.id);
}

export async function GET() {
  const { currentProfile } = await import("@/lib/api");
  const p = await currentProfile();
  if (!p) return fail(401, "No shield open.");
  return NextResponse.json({ id: p.id, name: p.name, demo: isDemoMode(), photos: p.vault.length });
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
