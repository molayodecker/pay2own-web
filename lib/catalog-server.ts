import { pay2ownApi } from "@/lib/orders";
import type { Phone } from "@/lib/catalog";

export async function listCatalog(): Promise<{ phones?: Phone[]; error?: string; status: number }> {
  const { base } = pay2ownApi();
  if (!base) return { status: 503, error: "The phone list is not connected to Pay2Own yet." };
  return readCatalog(await call(base, "/api/catalog/phones", { method: "GET" }));
}

export async function saveCatalog(phone: Phone, creating: boolean): Promise<{ phone?: Phone; error?: string; status: number }> {
  const { base, token } = pay2ownApi();
  if (!base || !token) return { status: 503, error: "The phone list is not connected to Pay2Own yet." };
  const path = creating ? "/api/catalog/phones" : `/api/catalog/phones/${encodeURIComponent(phone.id)}`;
  const response = await call(base, path, {
    method: creating ? "POST" : "PUT",
    headers: { "content-type": "application/json", "x-pay2own-token": token },
    body: JSON.stringify(phone),
  });
  const body = (await response?.json().catch(() => ({}))) as Partial<Phone> & { error?: string };
  if (!response || !response.ok || !body.id) {
    return { status: response?.status || 503, error: body.error || "The phone list is unavailable." };
  }
  return { status: response.status, phone: body as Phone };
}

export async function getCatalog(id: string): Promise<{ phone?: Phone; error?: string; status: number }> {
  const { base, token } = pay2ownApi();
  if (!base || !token) return { status: 503, error: "The phone list is not connected to Pay2Own yet." };
  const response = await call(base, `/api/catalog/phones/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: { "x-pay2own-token": token },
  });
  const body = (await response?.json().catch(() => ({}))) as Partial<Phone> & { error?: string };
  if (!response || !response.ok || !body.id) {
    return { status: response?.status || 503, error: body.error || "The phone list is unavailable." };
  }
  return { status: 200, phone: body as Phone };
}

export async function deleteCatalog(id: string): Promise<{ error?: string; status: number }> {
  const { base, token } = pay2ownApi();
  if (!base || !token) return { status: 503, error: "The phone list is not connected to Pay2Own yet." };
  const response = await call(base, `/api/catalog/phones/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { "x-pay2own-token": token },
  });
  if (!response) return { status: 503, error: "The phone list is unavailable." };
  if (response.status === 204) return { status: 204 };
  const body = (await response.json().catch(() => ({}))) as { error?: string };
  return { status: response.status, error: body.error || "The phone list is unavailable." };
}

async function readCatalog(response: Response | null) {
  if (!response) return { status: 503, error: "The phone list is unavailable." };
  const body = (await response.json().catch(() => ({}))) as { phones?: Phone[]; error?: string };
  if (!response.ok || !body.phones) return { status: response.status, error: body.error || "The phone list is unavailable." };
  return { status: 200, phones: body.phones };
}

async function call(base: string, path: string, init: RequestInit): Promise<Response | null> {
  try {
    return await fetch(`${base}${path}`, { ...init, cache: "no-store" });
  } catch {
    return null;
  }
}
