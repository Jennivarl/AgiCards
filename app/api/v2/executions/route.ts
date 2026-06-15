import { NextResponse } from "next/server";
import { listAllExecutions } from "@/lib/v2/executionStore";

// All executions across every card — powers the dashboard activity feed and the
// Activity page. Per-card history stays at /api/v2/cards/[id]/executions.
export async function GET() {
  return NextResponse.json({ ok: true, executions: await listAllExecutions() });
}
