import { NextRequest, NextResponse } from "next/server";
import { adminCookieMatches, adminCookieName } from "@/lib/admin-session";
import { listCatalog, saveCatalog } from "@/lib/catalog-server";
import type { Phone } from "@/lib/catalog";

export async function GET() {
  const result = await listCatalog();
  if (result.error || !result.phones) {
    return NextResponse.json({ error: result.error || "The phone list is unavailable." }, { status: result.status });
  }
  return NextResponse.json({ phones: result.phones });
}

export async function POST(request: NextRequest) {
  if (!adminCookieMatches(request.cookies.get(adminCookieName())?.value)) {
    return NextResponse.json({ error: "Sign in to change the phone list." }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as Partial<Phone>;
  const result = await saveCatalog(phoneFrom(body), true);
  if (result.error || !result.phone) {
    return NextResponse.json({ error: result.error || "The phone list is unavailable." }, { status: result.status });
  }
  return NextResponse.json(result.phone, { status: 201 });
}

function phoneFrom(body: Partial<Phone>): Phone {
  const price = body.price == null ? null : Number(body.price);
  return {
    id: String(body.id || ""),
    name: String(body.name || ""),
    short: String(body.short || ""),
    description: String(body.description || ""),
    image: String(body.image || ""),
    price: price != null && Number.isFinite(price) ? price : null,
    inStock: false,
    available: 0,
    imeis: Array.isArray(body.imeis) ? body.imeis.map(String) : [],
  };
}
