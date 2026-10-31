import { NextResponse } from "next/server";
import { currentProfile, fail } from "@/lib/api";
import { caseView } from "@/lib/caseview";
import { getCase } from "@/lib/store";


export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const profile = await currentProfile();
  if (!profile) return fail(401, "No shield open.");
  const { id } = await ctx.params;
  const c = await getCase(profile.id, id);
  if (!c) return fail(404, "No such case.");
  return NextResponse.json({ case: caseView(c), victimName: profile.name, sample: Boolean(profile.sample) });
}
