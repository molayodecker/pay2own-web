import { createHmac, timingSafeEqual } from "node:crypto";
import { pay2ownApi } from "@/lib/orders";

const cookieName = "pay2own_admin";

export function adminCookieName() {
  return cookieName;
}

export function adminSessionValue() {
  const secret = pay2ownApi().token;
  if (!secret) return "";
  return createHmac("sha256", secret).update("pay2own-admin").digest("hex");
}

export function adminCookieMatches(value: string | undefined) {
  const expected = adminSessionValue();
  if (!expected || !value) return false;
  const left = Buffer.from(value);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}
