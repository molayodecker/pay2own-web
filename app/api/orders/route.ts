import { NextRequest, NextResponse } from "next/server";
import { adminCookieMatches, adminCookieName } from "@/lib/admin-session";
import { listOrders, pay2ownApi, submitOrder, type OrderInput } from "@/lib/orders";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Partial<OrderInput>;
  const result = await submitOrder({
    name: String(body.name || ""),
    phone: String(body.phone || ""),
    workerId: String(body.workerId || ""),
    catalogPhoneId: String(body.catalogPhoneId || ""),
    phoneModel: String(body.phoneModel || ""),
    visit: String(body.visit || ""),
    companyWebsite: String(body.companyWebsite || ""),
  });
  if (result.error || !result.order) {
    console.error("pay2own order submit failed", result.status);
    return NextResponse.json({ error: result.error || "We couldn't send your slip." }, { status: result.status });
  }
  return NextResponse.json(result.order, { status: 201 });
}

export async function GET(request: NextRequest) {
  const { token } = pay2ownApi();
  if (!token) {
    return NextResponse.json({ error: "The order queue is not connected to Pay2Own yet." }, { status: 503 });
  }
  if (!adminCookieMatches(request.cookies.get(adminCookieName())?.value)) {
    return NextResponse.json({ error: "Sign in to see the order queue." }, { status: 401 });
  }
  const result = await listOrders();
  if (result.error || !result.orders) {
    console.error("pay2own order list failed", result.status);
    return NextResponse.json({ error: result.error || "The order queue is unavailable." }, { status: result.status });
  }
  return NextResponse.json({ orders: result.orders });
}
