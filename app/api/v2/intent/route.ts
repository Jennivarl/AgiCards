import { NextResponse } from "next/server";
import { understandIntent } from "@/lib/v2/intentAI";

// Prompt bar -> structured, validated permission intent.
// Understanding runs on the 0G Compute brain (with a deterministic fallback).
// `source` tells the UI whether 0G ("0g-compute") or the fallback answered.
export async function POST(request: Request) {
  let prompt: string;
  try {
    const body = (await request.json()) as { prompt?: string };
    prompt = body.prompt ?? "";
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const result = await understandIntent(prompt);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
