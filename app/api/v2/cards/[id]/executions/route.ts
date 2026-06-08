import { NextResponse } from "next/server";
import { listExecutions } from "@/lib/v2/executionStore";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json({ ok: true, executions: listExecutions(id) });
}
