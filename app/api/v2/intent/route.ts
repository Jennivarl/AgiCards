import { NextResponse } from "next/server";
import { parseIntent } from "@/lib/v2/venice";

// Prompt bar -> structured, validated permission intent.
export async function POST(request: Request) {
  let prompt: string;
  try {
    const body = (await request.json()) as { prompt?: string };
    prompt = body.prompt ?? "";
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const result = await parseIntent(prompt);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
