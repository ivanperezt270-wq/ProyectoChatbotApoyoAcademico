import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/server/auth";

export async function GET() {
  const user = getUserFromRequest();
  return NextResponse.json({ user });
}
