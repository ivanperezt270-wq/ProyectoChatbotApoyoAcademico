import { NextResponse } from "next/server";
import { clearSession } from "@/server/auth";

export async function POST() {
  clearSession();
  return NextResponse.json({ ok: true });
}
