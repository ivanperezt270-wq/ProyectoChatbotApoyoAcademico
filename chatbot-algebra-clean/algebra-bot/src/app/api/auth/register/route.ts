import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { createSession, hashPassword } from "@/server/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email || "").trim().toLowerCase();
  const name = String(body?.name || "").trim();
  const password = String(body?.password || "");

  if (!email || !name || password.length < 6) {
    return NextResponse.json(
      { error: "Datos inválidos (password mínimo 6 caracteres)" },
      { status: 400 }
    );
  }

  const exists = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email) as
    | { id: number }
    | undefined;

  if (exists) {
    return NextResponse.json({ error: "Ese email ya existe" }, { status: 409 });
  }

  const password_hash = await hashPassword(password);
  const now = Date.now();

  const info = db
    .prepare(
      `INSERT INTO users (email, name, password_hash, created_at)
       VALUES (?, ?, ?, ?)`
    )
    .run(email, name, password_hash, now);

  const userId = Number(info.lastInsertRowid);
  createSession(userId);

  return NextResponse.json({ ok: true, user: { id: userId, email, name } });
}
