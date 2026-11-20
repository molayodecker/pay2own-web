import { NextRequest, NextResponse } from "next/server";
import { adminCookieMatches, adminCookieName } from "@/lib/admin-session";
import { cancelOrder } from "@/lib/orders";

type Context = { params: Promise<{ reference: string }> };

export async function POST(request: NextRequest, context: Context) {
  if (!adminCookieMatches(request.cookies.get(adminCookieName())?.value)) {
    return NextResponse.json({ error: "Sign in to change an order." }, { status: 401 });
  }
  const { reference } = await context.params;
  const result = await cancelOrder(reference);
  if (result.error || !result.order) {
    return NextResponse.json({ error: result.error || "The order could not be cancelled." }, { status: result.status });
  }
  return NextResponse.json(result.order);
}
