"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminHeader } from "@/components/admin-header";
import type { OrderSlip } from "@/lib/orders";

function channelLabel(value: string | null) {
  if (value === "whatsapp") return "WhatsApp";
  if (value === "sms") return "SMS";
  if (value === "failed") return "Not sent";
  return "Waiting";
}

function when(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GH", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function AdminOrders() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [orders, setOrders] = useState<OrderSlip[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [cancelling, setCancelling] = useState("");

  async function cancel(reference: string) {
    setCancelling(reference);
    setError("");
    const response = await fetch(`/api/orders/${reference}/cancel`, { method: "POST" });
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    setCancelling("");
    if (!response.ok) {
      setError(body.error || "The order could not be cancelled.");
      return;
    }
    await load();
  }

  async function load() {
    setLoading(true);
    const response = await fetch("/api/orders", { cache: "no-store" });
    const body = (await response.json().catch(() => ({}))) as { orders?: OrderSlip[]; error?: string };
    if (response.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (!response.ok) {
      setError(body.error || "The order queue is unavailable.");
      setOrders([]);
    } else {
      setError("");
      setOrders(body.orders || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (sessionStorage.getItem("pay2own-admin") !== "1") {
      router.replace("/admin/login");
      return;
    }
    setReady(true);
    void load();
  }, [router]);

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-ploy-background-secondary text-ploy-text-primary">
      <AdminHeader section="orders" />
      <main className="mx-auto w-full max-w-5xl px-5 pt-28 pb-16 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-4xl font-extrabold tracking-tight">Order queue</h1>
            <p className="mt-2 max-w-xl text-base text-ploy-text-secondary">Slips are stored in Pay2Own. Mithril is only asked whether the worker already has an account. The worker and Instaclean support are messaged from Pay2Own, by WhatsApp or by SMS.</p>
          </div>
          <button type="button" onClick={() => void load()} className="inline-flex h-10 items-center rounded-full border-2 border-ploy-text-primary/20 px-4 text-sm font-semibold hover:border-ploy-text-primary">Refresh</button>
        </div>
        {error ? <p role="alert" className="mt-8 rounded-card bg-white px-5 py-4 text-sm font-semibold text-destructive">{error}</p> : null}
        {loading && !error ? <p className="mt-8 text-sm font-semibold text-ploy-text-secondary">Loading slips…</p> : null}
        {!loading && !error && orders.length === 0 ? <p className="mt-8 rounded-card bg-white px-5 py-8 text-base text-ploy-text-secondary">No order slips yet.</p> : null}
        <ul className="mt-8 grid gap-4">
          {orders.map((order) => (
            <li key={order.reference} className="rounded-card bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="font-heading text-2xl font-extrabold tracking-tight">{order.reference}</h2>
                <p className="text-sm text-ploy-text-secondary">{when(order.createdAt)}</p>
              </div>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <div><dt className="text-sm text-ploy-text-secondary">Name</dt><dd className="font-semibold">{order.name}</dd></div>
                <div><dt className="text-sm text-ploy-text-secondary">Phone</dt><dd className="font-semibold">{order.phone}</dd></div>
                <div><dt className="text-sm text-ploy-text-secondary">Handset</dt><dd className="font-semibold">{order.phoneModel}{order.imei ? ` · ${order.imei}` : ""}</dd></div>
                <div><dt className="text-sm text-ploy-text-secondary">Status</dt><dd className="font-semibold">{order.status === "cancelled" ? "Cancelled" : "Open"}</dd></div>
                <div><dt className="text-sm text-ploy-text-secondary">Visit</dt><dd className="font-semibold">{order.visit}</dd></div>
                <div><dt className="text-sm text-ploy-text-secondary">Worker ID</dt><dd className="font-semibold">{order.workerId || "Not given"}</dd></div>
                <div><dt className="text-sm text-ploy-text-secondary">Mithril account</dt><dd className="font-semibold">{order.mithrilAccount == null ? "Not checked" : order.mithrilAccount ? "Yes" : "No"}</dd></div>
                <div><dt className="text-sm text-ploy-text-secondary">Messages</dt><dd className="font-semibold">Worker {channelLabel(order.workerChannel)} · Support {channelLabel(order.supportChannel)}</dd></div>
              </dl>
              {order.status === "cancelled" ? null : (
                <button type="button" onClick={() => void cancel(order.reference)} disabled={cancelling === order.reference} className="mt-5 inline-flex h-10 items-center rounded-full border border-[#f3b4b4] px-4 text-sm font-semibold text-[#d12626] hover:bg-[#fff5f5] disabled:opacity-60">
                  {cancelling === order.reference ? "Cancelling…" : "Cancel order"}
                </button>
              )}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
