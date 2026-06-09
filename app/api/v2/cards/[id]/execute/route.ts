import { NextResponse } from "next/server";
import type { Address } from "viem";
import { executeCardCall } from "@/lib/v2/execute";
import type { TargetKey } from "@/lib/v2/intent";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { skill?: TargetKey; target?: string; amountUsd?: number; note?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.skill || !body.target || !body.amountUsd) {
    return NextResponse.json(
      { ok: false, error: "Missing skill, target, or amountUsd." },
      { status: 400 }
    );
  }

  try {
    const execution = await executeCardCall(id, {
      skill: body.skill,
      target: body.target as Address,
      amountUsd: body.amountUsd,
      note: body.note
    });
    return NextResponse.json({ ok: true, execution });
  } catch (e) {
    const error = e instanceof Error ? e.message : "Execution failed.";
    return NextResponse.json({ ok: false, error }, { status: 400 });
  }
}
