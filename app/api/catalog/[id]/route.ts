import { NextRequest, NextResponse } from "next/server";
import { adminCookieMatches, adminCookieName } from "@/lib/admin-session";
import { deleteCatalog, getCatalog, saveCatalog } from "@/lib/catalog-server";
import type { Phone } from "@/lib/catalog";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
  const denied = guard(request);
  if (denied) return denied;
  const { id } = await context.params;
  const result = await getCatalog(id);
  if (result.error || !result.phone) {
    return NextResponse.json({ error: result.error || "The phone list is unavailable." }, { status: result.status });
  }
  return NextResponse.json(result.phone);
}

export async function PUT(request: NextRequest, context: Context) {
  const denied = guard(request);
  if (denied) return denied;
  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as Partial<Phone>;
  const result = await saveCatalog(
    {
      id,
      name: String(body.name || ""),
      short: String(body.short || ""),
      description: String(body.description || ""),
      image: String(body.image || ""),
      price: body.price == null || !Number.isFinite(Number(body.price)) ? null : Number(body.price),
      inStock: false,
      available: 0,
      imeis: Array.isArray(body.imeis) ? body.imeis.map(String) : [],
    },
    false,
  );
  if (result.error || !result.phone) {
    return NextResponse.json({ error: result.error || "The phone list is unavailable." }, { status: result.status });
  }
  return NextResponse.json(result.phone);
}

export async function DELETE(request: NextRequest, context: Context) {
  const denied = guard(request);
  if (denied) return denied;
  const { id } = await context.params;
  const result = await deleteCatalog(id);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return new NextResponse(null, { status: 204 });
}

function guard(request: NextRequest) {
  if (!adminCookieMatches(request.cookies.get(adminCookieName())?.value)) {
    return NextResponse.json({ error: "Sign in to change the phone list." }, { status: 401 });
  }
  return null;
}
