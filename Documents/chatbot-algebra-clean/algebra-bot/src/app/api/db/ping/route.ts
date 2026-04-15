import { NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET() {
  const row = db.prepare("SELECT 1 as ok").get();
  return NextResponse.json({ ok: true, row });
}
