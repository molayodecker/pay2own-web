"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice, type Phone } from "@/lib/catalog";
import { CatalogImage } from "@/components/catalog-image";
import { AdminHeader } from "@/components/admin-header";

const inputClass =
  "h-13 w-full rounded-input border-2 border-ploy-input-border bg-white px-4 text-base focus:border-ploy-text-primary focus:outline-none";

export function AdminPhones() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [phones, setPhones] = useState<Phone[]>([]);
  const [editing, setEditing] = useState<Phone | null>(null);
  const [adding, setAdding] = useState(false);
  const [pendingImage, setPendingImage] = useState("");
  const [confirmId, setConfirmId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [imeiText, setImeiText] = useState("");
  const [reservedImeis, setReservedImeis] = useState<string[]>([]);

  useEffect(() => {
    if (sessionStorage.getItem("pay2own-admin") !== "1") {
      router.replace("/admin/login");
      return;
    }
    let ignore = false;
    fetch("/api/catalog", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) {
          router.replace("/admin/login");
          return;
        }
        const body = (await response.json().catch(() => ({}))) as { phones?: Phone[]; error?: string };
        if (ignore) return;
        if (!response.ok || !body.phones) {
          setError(body.error || "The phone list is unavailable.");
          setReady(true);
          return;
        }
        setPhones(body.phones);
        setReady(true);
      })
      .catch(() => {
        if (!ignore) {
          setError("The phone list is unavailable.");
          setReady(true);
        }
      });
    return () => {
      ignore = true;
    };
  }, [router]);

  async function openEditor(phone: Phone | null) {
    setEditing(phone);
    setAdding(phone === null);
    setPendingImage(phone?.image || "");
    setConfirmId("");
    setImeiText("");
    setReservedImeis([]);
    setError("");
    if (!phone) return;
    const response = await fetch(`/api/catalog/${phone.id}`, { cache: "no-store" });
    const body = (await response.json().catch(() => ({}))) as Phone & { error?: string };
    if (!response.ok) {
      setError(body.error || "The phone could not be opened.");
      return;
    }
    setEditing(body);
    setImeiText((body.imeis || []).join("\n"));
    setReservedImeis(body.reservedImeis || []);
  }

  function onPhoto(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPendingImage(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "").trim();
    const short = String(data.get("short") || "").trim();
    if (!name || !short) return;
    const priceText = String(data.get("price") || "").trim();
    const price = priceText === "" ? null : Number(priceText.replace(/,/g, ""));
    const imeis = imeiText.split(/\s+/).map((value) => value.trim()).filter(Boolean);
    const next: Phone = {
      id: String(data.get("id") || "") || `row_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
      name,
      short,
      description: String(data.get("description") || "").trim(),
      image: pendingImage || "/assets/icon.svg",
      price: price != null && Number.isFinite(price) ? price : null,
      inStock: false,
      available: 0,
      imeis,
    };
    const creating = !phones.some((phone) => phone.id === next.id);
    setSaving(true);
    setError("");
    const response = await fetch(creating ? "/api/catalog" : `/api/catalog/${next.id}`, {
      method: creating ? "POST" : "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(next),
    });
    const saved = (await response.json().catch(() => ({}))) as Phone & { error?: string };
    setSaving(false);
    if (!response.ok || !saved.id) {
      setError(saved.error || "The phone could not be saved.");
      return;
    }
    setPhones((current) => (creating ? [...current, saved] : current.map((phone) => (phone.id === saved.id ? saved : phone))));
    setEditing(null);
    setAdding(false);
  }

  async function removePhone(phone: Phone) {
    if (confirmId !== phone.id) {
      setConfirmId(phone.id);
      return;
    }
    setError("");
    const response = await fetch(`/api/catalog/${phone.id}`, { method: "DELETE" });
    if (response.status !== 204) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      setError(body.error || "The phone could not be removed.");
      return;
    }
    setPhones((current) => current.filter((item) => item.id !== phone.id));
    setConfirmId("");
  }

  if (!ready) return null;
  const editorOpen = adding || editing;

  return (
    <div className="min-h-screen bg-ploy-background-secondary text-ploy-text-primary">
      <AdminHeader section="phones" />
      <main className="mx-auto w-full max-w-3xl px-5 pt-28 pb-16 sm:px-8">
        {editorOpen ? (
          <section>
            <button type="button" onClick={() => { setEditing(null); setAdding(false); }} className="text-sm font-semibold text-ploy-text-secondary underline decoration-ploy-accent-primary decoration-2 underline-offset-4">Back to phones</button>
            <h1 className="mt-4 font-heading text-4xl font-extrabold tracking-tight">{editing ? "Edit phone" : "Add a phone"}</h1>
            {error ? <p className="mt-4 text-sm font-semibold text-[#d12626]">{error}</p> : null}
            <form key={editing?.id || "new"} onSubmit={onSave} className="mt-8 grid gap-5 rounded-3xl bg-white p-6 sm:p-8">
              <input type="hidden" name="id" value={editing?.id || ""} />
              <div>
                <label htmlFor="phone-name" className="mb-2 block text-sm font-semibold">Name</label>
                <input id="phone-name" name="name" required defaultValue={editing?.name || ""} className={inputClass} />
              </div>
              <div>
                <label htmlFor="phone-short" className="mb-2 block text-sm font-semibold">Short name</label>
                <input id="phone-short" name="short" required defaultValue={editing?.short || ""} className={inputClass} />
              </div>
              <div>
                <label htmlFor="phone-description" className="mb-2 block text-sm font-semibold">Description</label>
                <textarea id="phone-description" name="description" rows={3} defaultValue={editing?.description || ""} className="w-full rounded-input border-2 border-ploy-input-border bg-white px-4 py-3 text-base focus:border-ploy-text-primary focus:outline-none" />
              </div>
              <div>
                <label htmlFor="phone-price" className="mb-2 block text-sm font-semibold">Price (GHS, optional)</label>
                <input id="phone-price" name="price" inputMode="decimal" placeholder="Leave blank if the office confirms it" defaultValue={editing?.price ?? ""} className={inputClass} />
              </div>
              <div>
                <label htmlFor="phone-image" className="mb-2 block text-sm font-semibold">Photo</label>
                <input id="phone-image" name="image" type="file" accept="image/*" onChange={(event) => onPhoto(event.target.files?.[0])} className="block w-full text-sm" />
                {pendingImage ? <CatalogImage src={pendingImage} alt="" width={160} height={200} className="mt-4 h-28 w-auto object-contain" /> : null}
              </div>
              <div>
                <label htmlFor="phone-imeis" className="mb-2 block text-sm font-semibold">IMEIs</label>
                <textarea id="phone-imeis" name="imeis" rows={5} value={imeiText} onChange={(event) => setImeiText(event.target.value)} placeholder="One 15-digit IMEI per line" className="w-full rounded-input border-2 border-ploy-input-border bg-white px-4 py-3 text-base focus:border-ploy-text-primary focus:outline-none" />
                <p className="mt-2 text-sm text-ploy-text-secondary">{imeiText.split(/\s+/).filter((value) => value.trim()).length} available. Each line is one handset.</p>
                {reservedImeis.length ? <p className="mt-2 text-sm text-ploy-text-secondary">Held for an open order: {reservedImeis.join(", ")}</p> : null}
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <button type="submit" disabled={saving} className="inline-flex h-12 items-center rounded-full bg-ploy-background-inverse px-6 text-sm font-bold text-white disabled:opacity-60">{saving ? "Saving…" : "Save phone"}</button>
                <button type="button" onClick={() => { setEditing(null); setAdding(false); }} className="inline-flex h-12 items-center rounded-full border border-ploy-border-primary px-6 text-sm font-semibold">Cancel</button>
              </div>
            </form>
          </section>
        ) : (
          <section>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="font-heading text-4xl font-extrabold tracking-tight">Phones</h1>
                <p className="mt-2 text-sm text-ploy-text-secondary sm:text-base">{phones.length} {phones.length === 1 ? "phone" : "phones"} on the site. Saved in Pay2Own.</p>
                {error ? <p className="mt-3 text-sm font-semibold text-[#d12626]">{error}</p> : null}
              </div>
              <button type="button" onClick={() => openEditor(null)} className="inline-flex h-12 items-center gap-2 rounded-full bg-ploy-background-inverse px-5 text-sm font-bold text-white hover:bg-ploy-neutral-inverse-700">
                <span aria-hidden="true" className="text-lg leading-none">+</span>
                Add a phone
              </button>
            </div>
            <div className="mt-8 grid gap-4">
              {phones.length === 0 ? <p className="rounded-3xl bg-white px-5 py-8 text-ploy-text-secondary">No phones on the site yet.</p> : null}
              {phones.map((phone) => (
                <article key={phone.id} className="flex flex-wrap items-center gap-4 rounded-3xl bg-white px-4 py-4 sm:flex-nowrap sm:px-5">
                  <CatalogImage src={phone.image} alt="" width={96} height={128} className="h-16 w-12 shrink-0 object-contain" />
                  <div className="min-w-[10rem] flex-1">
                    <p className="font-heading text-base font-extrabold tracking-tight">{phone.name}</p>
                    <p className="text-sm text-ploy-text-secondary">{phone.price == null ? "No price set" : formatPrice(phone.price)}</p>
                    <p className="text-sm font-semibold">{phone.available === 1 ? "1 in stock" : `${phone.available || 0} in stock`}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => openEditor(phone)} className="inline-flex h-10 items-center rounded-full border border-ploy-border-primary bg-white px-4 text-sm font-semibold hover:border-ploy-text-primary">Edit</button>
                    <button
                      type="button"
                      onClick={() => removePhone(phone)}
                      className="inline-flex h-10 items-center rounded-full border border-[#f3b4b4] bg-white px-4 text-sm font-semibold text-[#d12626] hover:bg-[#fff5f5]"
                    >
                      {confirmId === phone.id ? "Confirm remove" : "Remove"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
