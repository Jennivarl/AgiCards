import { NextResponse } from "next/server";
import { ogStorage } from "@/lib/adapters/storage";

export async function GET() {
  return NextResponse.json(ogStorage.status());
}

export async function POST(request: Request) {
  const body = await request.json();
  const object = await ogStorage.store(body.type ?? "receipt", body.payload ?? body);

  return NextResponse.json(object);
}
