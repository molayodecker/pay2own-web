import { NextResponse } from "next/server";
import { adminCookieName, adminSessionValue } from "@/lib/admin-session";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
    name?: string;
    mode?: string;
  };
  const email = String(body.email || "").trim();
  const password = String(body.password || "");
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Enter your email address." }, { status: 422 });
  }
  if (password.length < 10) {
    return NextResponse.json({ error: "Use a password with at least 10 characters." }, { status: 422 });
  }
  if (body.mode === "signup" && !String(body.name || "").trim()) {
    return NextResponse.json({ error: "Enter your name." }, { status: 422 });
  }
  const response = NextResponse.json({ ok: true });
  const session = adminSessionValue();
  if (session) {
    response.cookies.set(adminCookieName(), session, { ...cookieOptions, maxAge: 60 * 60 * 12 });
  }
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookieName(), "", { ...cookieOptions, maxAge: 0 });
  return response;
}
