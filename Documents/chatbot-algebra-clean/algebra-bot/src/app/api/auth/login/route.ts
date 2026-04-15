import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { createSession, verifyPassword } from "@/server/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");

  if (!email || !password) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const user = db
    .prepare(`SELECT id, email, name, password_hash FROM users WHERE email = ?`)
    .get(email) as
    | { id: number; email: string; name: string; password_hash: string }
    | undefined;

  if (!user) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  createSession(user.id);

  return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
}
