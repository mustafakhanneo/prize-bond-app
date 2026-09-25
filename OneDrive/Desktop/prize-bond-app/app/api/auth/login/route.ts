import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/turso";
import { verifyPassword, signToken, setAuthCookie, clearAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const result = await turso.execute({
      sql: "SELECT id, email, password_hash FROM users WHERE email = ?",
      args: [email],
    });

    const row = result.rows[0];
    if (!row) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const passwordHash = String(row.password_hash);
    const isValid = await verifyPassword(password, passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const userId = String(row.id);
    const token = signToken({ userId, email });
    await setAuthCookie(token);

    return NextResponse.json({ id: userId, email });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

export async function DELETE() {
  await clearAuthCookie();
  return NextResponse.json({ success: true });
}
