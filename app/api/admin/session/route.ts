import { NextResponse } from "next/server";
import { scryptSync, timingSafeEqual } from "node:crypto";
import { adminCookieName, adminSessionValue } from "@/lib/admin-session";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

function authenticate(email: string, password: string) {
  const allowed = (process.env.PAY2OWN_ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const configuredHash = process.env.PAY2OWN_ADMIN_PASSWORD_HASH || "";
  const [salt, hex, ...extra] = configuredHash.split(":");
  if (!salt || !/^[a-f0-9]{128}$/i.test(hex || "") || extra.length || !allowed.length) return false;

  // Validate the password even when the email is unknown, to avoid user enumeration by timing.
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(hex, "hex");
  const matched = timingSafeEqual(actual, expected);
  return matched && allowed.includes(email.toLowerCase());
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
    mode?: string;
  };
  const email = String(body.email || "").trim();
  const password = String(body.password || "");
  if (body.mode === "signup") {
    return NextResponse.json({ error: "Admin registration is invitation-only." }, { status: 403 });
  }
  if (!process.env.PAY2OWN_ADMIN_EMAILS || !process.env.PAY2OWN_ADMIN_PASSWORD_HASH || !adminSessionValue()) {
    return NextResponse.json({ error: "Admin sign-in has not been configured." }, { status: 503 });
  }
  if (!/^\S+@\S+\.\S+$/.test(email) || !authenticate(email, password)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookieName(), adminSessionValue(), {
    ...cookieOptions,
    maxAge: 60 * 60 * 12,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookieName(), "", { ...cookieOptions, maxAge: 0 });
  return response;
}
