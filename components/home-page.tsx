"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { defaultPhones, formatPrice, type Phone } from "@/lib/catalog";
import { CatalogImage } from "@/components/catalog-image";
import { Logo } from "@/components/logo";

const visits = ["As soon as possible", "Later this week", "Next week"];
const primaryButton =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-button bg-ploy-button-primary-background font-button text-ploy-button-primary-text typography-button transition-colors duration-200 hover:bg-ploy-accent-primary-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ploy-text-primary";
const navLink =
  "text-[0.95rem] font-semibold text-white/85 underline decoration-transparent decoration-2 underline-offset-8 transition-colors hover:text-white hover:decoration-ploy-accent-primary";
const footerLink =
  "text-white/85 underline decoration-transparent decoration-2 underline-offset-4 transition-colors hover:text-white hover:decoration-ploy-accent-primary";

type Errors = Partial<Record<"name" | "phone" | "model" | "consent", string>>;
type Toast = { id: number; title: string; description: string };

function fieldClass(invalid: boolean) {
  return `h-13 w-full rounded-input border-2 bg-ploy-input-background px-4 text-base text-ploy-text-primary transition-colors placeholder:text-ploy-neutral-primary-700 focus:outline-none ${invalid ? "border-destructive" : "border-ploy-input-border focus:border-ploy-text-primary"}`;
}

export function HomePage() {
  const [phones, setPhones] = useState<Phone[]>(defaultPhones);
  const [catalogError, setCatalogError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [visit, setVisit] = useState(visits[0]);
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState("");
  const [sent, setSent] = useState<{ code: string; first: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let ignore = false;
    fetch("/api/catalog", { cache: "no-store" })
      .then(async (response) => {
        const body = (await response.json().catch(() => ({}))) as { phones?: Phone[] };
        if (ignore) return;
        if (!response.ok || !body.phones) {
          setCatalogError("The phone list is unavailable. Call +233 54 441 5766.");
          return;
        }
        setPhones(body.phones);
        setCatalogError("");
      })
      .catch(() => {
        if (!ignore) setCatalogError("The phone list is unavailable. Call +233 54 441 5766.");
      });
    return () => {
      ignore = true;
    };
  }, []);

  const selected = phones.find((item) => item.id === selectedId) ?? null;

  function choose(id: string) {
    setSelectedId(id);
    setErrors((current) => ({ ...current, model: undefined }));
  }

  function showToast(title: string, description: string) {
    const id = Date.now();
    setToasts((current) => [...current, { id, title, description }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 6000);
  }

  function validate() {
    const next: Errors = {};
    if (!name.trim()) next.name = "Enter your full name as it appears on your ID.";
    const digits = phone.replace(/\D/g, "");
    if (!digits) next.phone = "Enter a phone number we can call or WhatsApp.";
    else if (digits.length < 9 || digits.length > 15) {
      next.phone = "Check the number. Use 9 to 15 digits, for example 024 123 4567.";
    }
    if (!selected) next.model = "Choose the phone you want.";
    else if ((selected.available || 0) <= 0) next.model = `The ${selected.short} is out of stock. Choose another phone.`;
    if (!consent) next.consent = "Tick the box so we can call you about your order.";
    return next;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (honeypot) {
      setSent({ code: "P2O-LOCAL", first: name.trim().split(" ")[0] || "you" });
      return;
    }
    const next = validate();
    setErrors(next);
    const first = (Object.keys(next) as (keyof Errors)[]).find((key) => next[key]);
    if (first) {
      setStatus("Please fix the highlighted fields.");
      document.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setSending(true);
    setStatus("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          workerId: workerId.trim(),
          phoneModel: selected?.name,
          catalogPhoneId: selected?.id,
          visit,
          companyWebsite: honeypot,
        }),
      });
      const body = (await response.json().catch(() => ({}))) as { reference?: string; error?: string };
      if (!response.ok || !body.reference) {
        setStatus(body.error || "We couldn't send your slip. Call +233 54 441 5766.");
        return;
      }
      const code = body.reference;
      const chosenId = selected?.id;
      setPhones((current) => current.map((item) => {
        if (item.id !== chosenId) return item;
        const available = Math.max(0, (item.available || 0) - 1);
        return { ...item, available, inStock: available > 0 };
      }));
      setSent({ code, first: name.trim().split(" ")[0] || "you" });
      showToast("Order slip sent", `Your reference is ${code}. We'll call you to set your visit.`);
    } catch {
      setStatus("We couldn't send your slip. Call +233 54 441 5766.");
    } finally {
      setSending(false);
    }
  }

  function resetSlip() {
    setName("");
    setPhone("");
    setWorkerId("");
    setVisit(visits[0]);
    setConsent(false);
    setHoneypot("");
    setSelectedId("");
    setErrors({});
    setStatus("");
    setSent(null);
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 bg-ploy-background-inverse text-white">
        <div className="mx-auto flex h-18 w-full max-w-7xl items-center justify-between gap-6 px-5 sm:px-8 lg:px-10">
          <Logo byline />
          <nav aria-label="Main" className="hidden items-center gap-8 lg:flex">
            <a href="/#phones" className={navLink}>Phones</a>
            <a href="/#how-it-works" className={navLink}>How it works</a>
            <a href="/#visit" className={navLink}>Visit the office</a>
            <a href="/#questions" className={navLink}>Questions</a>
          </nav>
          <div className="flex items-center gap-2">
            <a className={`${primaryButton} hidden h-12 px-6 text-base sm:inline-flex`} href="/#order">Order a phone</a>
            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((open) => !open)}
              className="grid size-12 place-items-center rounded-full text-white hover:bg-white/10 lg:hidden"
            >
              {menuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6" aria-hidden="true"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6" aria-hidden="true"><path d="M4 5h16" /><path d="M4 12h16" /><path d="M4 19h16" /></svg>
              )}
            </button>
          </div>
        </div>
      </header>
      {menuOpen ? (
        <div id="mobile-menu" className="fixed inset-x-0 top-18 bottom-0 z-40 overflow-y-auto overscroll-contain bg-ploy-background-inverse text-white lg:hidden">
          <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col gap-2 px-5 pt-6 pb-10 sm:px-8 lg:px-10">
            {[
              ["/phones", "Phones"],
              ["/how-it-works", "How it works"],
              ["/visit", "Visit the office"],
              ["/questions", "Questions"],
            ].map(([href, label]) => (
              <a key={href} href={`/#${href.slice(1)}`} onClick={() => setMenuOpen(false)} className="border-b border-white/10 py-5 font-heading text-3xl font-extrabold tracking-tight">
                {label}
              </a>
            ))}
            <a className={`${primaryButton} mt-8 h-14 px-8 text-lg`} href="/#order" onClick={() => setMenuOpen(false)}>Order a phone</a>
            <a href="tel:+233544415766" className="mt-6 text-white/80 underline decoration-ploy-accent-primary decoration-2 underline-offset-4">Call Instaclean on +233 54 441 5766</a>
          </div>
        </div>
      ) : null}

      <main>
        <section className="relative overflow-hidden bg-ploy-background-accent-secondary pt-18 text-ploy-text-primary">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-5 pt-16 pb-10 text-center sm:px-8 md:pt-24 md:pb-12 lg:px-10">
            <h1 className="hero-in max-w-[13ch] text-balance font-heading text-5xl text-ploy-neutral-inverse typography-heading sm:text-6xl lg:text-8xl">Own your next phone, bit by bit</h1>
            <p className="hero-in mt-6 max-w-xl text-lg leading-relaxed font-body font-medium text-ploy-neutral-inverse typography-body md:text-xl [--hero-at:0.12s]">For Instaclean professionals. Order online, then sign your plan at our office.</p>
            <div className="hero-in mt-9 flex flex-wrap items-center justify-center gap-3 [--hero-at:0.24s]">
              <a className={`${primaryButton} h-14 px-8 text-lg`} href="#order">Order a phone</a>
              <a className="inline-flex h-14 items-center justify-center gap-2 rounded-button border-2 border-ploy-neutral-inverse/40 px-8 text-lg font-button whitespace-nowrap text-ploy-text-primary typography-button transition-colors duration-200 hover:border-ploy-neutral-inverse hover:bg-ploy-text-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ploy-text-primary" href="#how-it-works">How it works</a>
            </div>
          </div>
          <div className="relative h-[46vh] min-h-[300px] w-full overflow-hidden md:h-[62vh] md:max-h-[720px]">
            <Image src="/assets/photos/woman-bed-phone.jpg" alt="Woman smiling at a phone while lying on a bed" fill priority sizes="100vw" className="hero-settle photo-hero object-cover" />
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-ploy-background-accent-secondary to-transparent" />
          </div>
        </section>

        <section id="phones" className="bg-ploy-background-secondary text-ploy-text-primary">
          <div className="mx-auto w-full max-w-7xl px-5 py-24 sm:px-8 md:py-32 lg:px-10">
            <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
              <h2 className="text-balance font-heading text-4xl typography-heading md:text-5xl lg:col-span-7 lg:text-6xl">Pick the phone you want</h2>
              <p className="text-base leading-relaxed font-body text-ploy-text-secondary typography-body md:text-lg lg:col-span-5">Choose one and it goes straight onto your order slip. We set up your payments with you at the office, before you sign anything.</p>
              {catalogError ? <p className="text-sm font-semibold text-[#d12626] lg:col-span-12">{catalogError}</p> : null}
            </div>
            <ul className="mt-14 grid gap-y-16 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-3 lg:gap-x-10">
              {phones.map((item) => {
                const out = (item.available || 0) <= 0;
                const chosen = selectedId === item.id && !out;
                return (
                  <li key={item.id} className="flex flex-col">
                    <div className="relative mx-auto aspect-[3/4] w-full max-w-[13rem] sm:max-w-[16rem]">
                      <CatalogImage src={item.image} alt={`${item.name}, back view`} width={1536} height={2048} className={`h-full w-full object-contain drop-shadow-[0_28px_30px_rgba(15,26,92,0.22)] ${out ? "opacity-45" : ""}`} />
                    </div>
                    <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2">
                      <h3 className="text-balance font-heading text-xl tracking-tight typography-heading md:text-2xl">{item.name}</h3>
                      {out ? (
                        <span className="rounded-full bg-white px-3 py-0.5 text-xs font-semibold text-ploy-text-secondary">Out of stock</span>
                      ) : chosen ? (
                        <span className="rounded-full bg-ploy-background-inverse px-3 py-1 text-xs font-semibold text-white">On your slip</span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-base leading-relaxed font-body text-ploy-text-secondary typography-body md:text-lg">{item.description}</p>
                    <div className="mt-4 flex-1">
                      {item.price == null ? (
                        <p className="text-sm leading-relaxed font-body font-semibold typography-body">Price confirmed at the office</p>
                      ) : (
                        <>
                          <p className={`font-heading text-3xl font-extrabold tracking-tight ${out ? "text-ploy-text-secondary" : ""}`}>{formatPrice(item.price)}</p>
                          <p className="mt-1 text-sm leading-relaxed font-body text-ploy-text-secondary typography-body">Payment plan agreed at the office</p>
                        </>
                      )}
                      <p className="mt-2 text-sm font-semibold">{out ? "0 in stock" : item.available === 1 ? "1 in stock" : `${item.available} in stock`}</p>
                    </div>
                    <button
                      type="button"
                      disabled={out}
                      aria-pressed={chosen}
                      onClick={() => choose(item.id)}
                      className={`mt-5 inline-flex h-12 items-center justify-center self-start rounded-button border-2 px-6 font-button typography-button transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ploy-text-primary ${out ? "cursor-not-allowed border-ploy-text-primary/10 text-ploy-text-secondary" : chosen ? "border-ploy-background-inverse bg-ploy-background-inverse text-white" : "border-ploy-text-primary/25 text-ploy-text-primary hover:border-ploy-text-primary"}`}
                    >
                      {out ? "Out of stock" : chosen ? "Chosen" : `Choose ${item.short}`}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section id="how-it-works" className="overflow-hidden bg-ploy-background-inverse text-white">
          <div className="grid lg:grid-cols-12">
            <div className="relative lg:col-span-6">
              <div className="relative h-[320px] overflow-hidden sm:h-[440px] lg:h-full lg:min-h-[640px] lg:rounded-r-[2.5rem]">
                <Image src="/assets/photos/woman-blue-phone.jpg" alt="Woman smiling down at a blue phone outdoors" fill sizes="(min-width: 1024px) 50vw, 100vw" className="photo-friends object-cover" />
              </div>
            </div>
            <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:col-span-6 lg:mx-0 lg:max-w-none lg:py-28 lg:pr-10 lg:pl-16 xl:pl-20">
              <h2 className="max-w-[14ch] text-balance font-heading text-4xl text-white typography-heading md:text-5xl lg:text-6xl">Order here, finish at our office</h2>
              <p className="mt-5 max-w-md text-base leading-relaxed font-body text-ploy-text-inverse-secondary typography-body md:text-lg">Nothing is signed online. You see the full plan in person, with someone from Instaclean who can answer your questions.</p>
              <ol className="mt-12 space-y-10">
                {[
                  ["Order online", "Choose a phone and fill in the order slip below. It takes a couple of minutes and costs nothing."],
                  ["Visit the office", "We call to set a day. At the office we confirm the price, go through the plan line by line and set up your phone."],
                  ["Pay over time", "You leave with the phone and pay in parts on the dates in your plan. Once the last payment is in, it's fully yours."],
                ].map(([title, copy]) => (
                  <li key={title} className="max-w-md">
                    <h3 className="inline-block border-b-4 border-ploy-accent-primary pb-1 text-balance font-heading text-xl tracking-tight text-white typography-heading md:text-2xl">{title}</h3>
                    <p className="mt-3 text-base leading-relaxed font-body text-ploy-text-inverse-secondary typography-body md:text-lg">{copy}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section id="order" className="bg-ploy-background-accent-secondary text-ploy-text-primary">
          <div className="mx-auto w-full max-w-7xl px-5 py-24 sm:px-8 md:py-32 lg:px-10">
            <div className="max-w-2xl">
              <h2 className="text-balance font-heading text-4xl text-ploy-neutral-inverse typography-heading md:text-5xl lg:text-6xl">Fill in your order slip</h2>
              <p className="mt-5 text-base leading-relaxed font-body font-medium text-ploy-neutral-inverse typography-body md:text-lg">Send it and we&apos;ll call you to set a day for your office visit. Sending a slip is free and doesn&apos;t commit you to a plan.</p>
            </div>
            <div className="mt-14 grid items-start gap-8 lg:grid-cols-12 lg:gap-10">
              <div className="rounded-card bg-white p-6 shadow-[0_30px_70px_-40px_rgba(15,26,92,0.55)] md:p-10 lg:col-span-7">
                {sent ? (
                  <div role="status" aria-live="polite" className="py-4">
                    <h3 className="text-balance font-heading text-3xl typography-heading md:text-4xl">Your slip is in</h3>
                    <p className="mt-4 max-w-lg text-base leading-relaxed font-body text-ploy-text-secondary typography-body md:text-lg">
                      We&apos;ll call {sent.first} soon to set your visit. Keep your reference, {sent.code}, and show the slip at the office.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                      <button type="button" onClick={() => window.print()} className="inline-flex h-12 items-center justify-center rounded-button bg-ploy-button-secondary-background px-6 text-base font-button text-ploy-button-secondary-text typography-button hover:bg-ploy-neutral-primary-900">Save or print the slip</button>
                      <button type="button" onClick={resetSlip} className="inline-flex h-12 items-center justify-center rounded-button border-2 border-ploy-text-primary/25 px-6 text-base font-button text-ploy-text-primary typography-button hover:border-ploy-text-primary">Start a new slip</button>
                    </div>
                  </div>
                ) : (
                  <form noValidate aria-label="Pay2Own order slip" className="relative" onSubmit={onSubmit}>
                    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                      <label htmlFor="website">Website</label>
                      <input id="website" name="company_website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(event) => setHoneypot(event.target.value)} />
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label htmlFor="name" className="mb-2 block text-sm font-semibold text-ploy-text-primary">Full name</label>
                        <input id="name" name="name" autoComplete="name" value={name} aria-invalid={Boolean(errors.name)} onChange={(event) => { setName(event.target.value); setErrors((current) => ({ ...current, name: undefined })); }} className={fieldClass(Boolean(errors.name))} />
                        <p className="field-error mt-2 text-sm font-semibold text-destructive">{errors.name}</p>
                      </div>
                      <div>
                        <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-ploy-text-primary">Phone or WhatsApp</label>
                        <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="024 123 4567" value={phone} aria-invalid={Boolean(errors.phone)} onChange={(event) => { setPhone(event.target.value); setErrors((current) => ({ ...current, phone: undefined })); }} className={fieldClass(Boolean(errors.phone))} />
                        <p className="field-error mt-2 text-sm font-semibold text-destructive">{errors.phone}</p>
                      </div>
                      <div>
                        <label htmlFor="instaclean_id" className="mb-2 block text-sm font-semibold text-ploy-text-primary">Instaclean worker ID (optional)</label>
                        <input id="instaclean_id" name="instaclean_id" autoComplete="off" value={workerId} onChange={(event) => setWorkerId(event.target.value)} className={fieldClass(false)} />
                      </div>
                      <div>
                        <label htmlFor="model" className="mb-2 block text-sm font-semibold text-ploy-text-primary">Phone</label>
                        <select id="model" name="model" value={selectedId} aria-invalid={Boolean(errors.model)} onChange={(event) => choose(event.target.value)} className={`${fieldClass(Boolean(errors.model))} cursor-pointer pr-10`}>
                          <option value="" disabled>Choose a phone</option>
                          {phones.map((item) => (
                            <option key={item.id} value={item.id} disabled={(item.available || 0) <= 0}>{(item.available || 0) > 0 ? item.name : `${item.name} (out of stock)`}</option>
                          ))}
                        </select>
                        <p className="field-error mt-2 text-sm font-semibold text-destructive">{errors.model}</p>
                      </div>
                      <div>
                        <label htmlFor="visit" className="mb-2 block text-sm font-semibold text-ploy-text-primary">When can you visit?</label>
                        <select id="visit" name="visit" value={visit} onChange={(event) => setVisit(event.target.value)} className={`${fieldClass(false)} cursor-pointer pr-10`}>
                          {visits.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label htmlFor="consent" className="flex cursor-pointer items-start gap-3">
                          <input id="consent" name="consent" type="checkbox" checked={consent} aria-invalid={Boolean(errors.consent)} onChange={(event) => { setConsent(event.target.checked); setErrors((current) => ({ ...current, consent: undefined })); }} className="mt-1 size-5 shrink-0 cursor-pointer accent-ploy-neutral-inverse" />
                          <span className="leading-relaxed">Instaclean may call or WhatsApp me about this order. I understand this is a request, not a signed payment plan.</span>
                        </label>
                        <p className="field-error mt-2 text-sm font-semibold text-destructive">{errors.consent}</p>
                      </div>
                    </div>
                    <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                      <button type="submit" disabled={sending} className={`${primaryButton} h-14 px-8 text-lg disabled:cursor-wait disabled:opacity-70`}>{sending ? "Sending…" : "Send my order slip"}</button>
                      <p role="status" aria-live="polite" className="text-sm font-semibold">{status}</p>
                    </div>
                  </form>
                )}
              </div>
              <aside aria-label="Your order slip" className="overflow-hidden rounded-card bg-white shadow-[0_30px_70px_-40px_rgba(15,26,92,0.55)] lg:sticky lg:top-26 lg:col-span-5">
                <div className="flex items-center justify-between gap-4 bg-ploy-background-inverse px-6 py-4 text-white">
                  <span className="flex items-center gap-3 font-heading text-lg font-extrabold">
                    <img src="/assets/icon.svg" alt="" width={120} height={120} className="size-8" />
                    Order slip
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${sent ? "bg-ploy-accent-primary text-ploy-text-primary" : "bg-white/15 text-white"}`}>{sent ? "Sent" : "Draft"}</span>
                </div>
                <div className="grid grid-cols-[7rem_1fr] items-center gap-5 px-6 pt-6 sm:grid-cols-[8rem_1fr]">
                  <div className="aspect-[3/4] w-full">
                    {selected ? (
                      <CatalogImage src={selected.image} alt={selected.name} width={1536} height={2048} className="slip-drop h-full w-full object-contain drop-shadow-[0_16px_18px_rgba(15,26,92,0.25)]" />
                    ) : (
                      <div className="grid h-full w-full place-items-center rounded-2xl border-2 border-dashed border-ploy-input-border p-3 text-center text-sm text-ploy-text-secondary">Choose a phone</div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm leading-relaxed font-body text-ploy-text-secondary typography-body">Phone</p>
                    <p className="font-heading text-2xl font-extrabold tracking-tight">{selected?.name ?? "Not chosen yet"}</p>
                    <p className="mt-1 text-sm leading-relaxed font-body font-semibold typography-body">Price confirmed at the office</p>
                  </div>
                </div>
                <dl className="mt-6 border-t-2 border-dashed border-ploy-border-primary px-6 py-6">
                  <div className="flex items-baseline justify-between gap-4 py-2"><dt className="text-sm text-ploy-text-secondary">Name</dt><dd className="text-right font-semibold">{name.trim() || "Your name"}</dd></div>
                  <div className="flex items-baseline justify-between gap-4 py-2"><dt className="text-sm text-ploy-text-secondary">Visit</dt><dd className="text-right font-semibold">{visit}</dd></div>
                  <div className="flex items-baseline justify-between gap-4 py-2"><dt className="text-sm text-ploy-text-secondary">Reference</dt><dd className="text-right font-semibold">{sent?.code ?? "Given when you send"}</dd></div>
                </dl>
                <div className="bg-ploy-background-secondary px-6 py-5">
                  <p className="text-sm leading-relaxed font-body typography-body"><span className="font-semibold">Bring to the office:</span> this slip, your Ghana Card and your Instaclean worker ID.</p>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section id="visit" className="bg-white text-ploy-text-primary">
          <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-24 sm:px-8 md:py-32 lg:grid-cols-12 lg:gap-10 lg:px-10">
            <div className="lg:col-span-5">
              <h2 className="max-w-[12ch] text-balance font-heading text-4xl typography-heading md:text-5xl lg:text-6xl">Visit the Instaclean office</h2>
              <p className="mt-5 max-w-md text-base leading-relaxed font-body text-ploy-text-secondary typography-body md:text-lg">This is where your plan is agreed. Take your time, read every line and ask anything before you sign.</p>
            </div>
            <dl className="lg:col-span-7">
              <div className="grid gap-2 border-t-2 border-ploy-border-primary py-7 sm:grid-cols-[11rem_1fr] sm:gap-8"><dt className="font-heading text-lg font-extrabold">Where</dt><dd className="text-lg leading-relaxed">Instaclean office, Accra (full address coming soon)</dd></div>
              <div className="grid gap-2 border-t-2 border-ploy-border-primary py-7 sm:grid-cols-[11rem_1fr] sm:gap-8"><dt className="font-heading text-lg font-extrabold">When</dt><dd className="text-lg leading-relaxed">Opening hours coming soon</dd></div>
              <div className="grid gap-2 border-t-2 border-ploy-border-primary py-7 sm:grid-cols-[11rem_1fr] sm:gap-8"><dt className="font-heading text-lg font-extrabold">What to bring</dt><dd className="text-lg leading-relaxed">Your order slip, your Ghana Card and your Instaclean worker ID.</dd></div>
              <div className="grid gap-2 border-t-2 border-ploy-border-primary py-7 sm:grid-cols-[11rem_1fr] sm:gap-8">
                <dt className="font-heading text-lg font-extrabold">Questions first?</dt>
                <dd className="text-lg leading-relaxed">Call <a href="tel:+233544415766" className="underline decoration-ploy-accent-primary decoration-2 underline-offset-4 hover:decoration-ploy-text-primary">+233 54 441 5766</a> or email <a href="mailto:info@tryinstaclean.com" className="underline decoration-ploy-accent-primary decoration-2 underline-offset-4 hover:decoration-ploy-text-primary">info@tryinstaclean.com</a>.</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="overflow-hidden bg-ploy-background-secondary text-ploy-text-primary">
          <div className="grid lg:grid-cols-12">
            <div className="order-2 mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:order-1 lg:col-span-7 lg:mr-0 lg:max-w-none lg:py-28 lg:pr-16 lg:pl-10">
              <div className="lg:ml-auto lg:max-w-2xl">
                <h2 className="max-w-[14ch] text-balance font-heading text-4xl typography-heading md:text-5xl lg:text-6xl">A plan you can read and keep up with</h2>
                <dl className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2">
                  {[
                    ["The full cost, up front", "Your plan shows the total you'll pay and every payment date before you sign."],
                    ["Sized to what you earn", "We'd rather agree a smaller plan you can manage than a bigger one that strains you."],
                    ["Made for Instaclean pros", "Pay2Own is open to professionals working with Instaclean. New to us? Apply to join first."],
                    ["Yours once it's paid", "When the last payment is in, the phone is fully yours. Nothing more to pay."],
                  ].map(([title, copy]) => (
                    <div key={title}><dt className="font-heading text-xl font-extrabold tracking-tight">{title}</dt><dd className="mt-2 text-lg leading-relaxed text-ploy-text-secondary">{copy}</dd></div>
                  ))}
                </dl>
                <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-4">
                  <a className={`${primaryButton} h-14 px-8 text-lg`} href="#order">Order a phone</a>
                  <a href="https://www.tryinstaclean.com/" className="font-semibold underline decoration-ploy-accent-primary decoration-2 underline-offset-4 hover:decoration-ploy-text-primary">Not with Instaclean yet? Apply to join</a>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2 lg:col-span-5">
              <div className="relative h-[420px] overflow-hidden sm:h-[520px] lg:h-full lg:min-h-[720px] lg:rounded-l-[2.5rem]">
                <Image src="/assets/photos/woman-doorway.jpg" alt="Woman in a yellow patterned dress smiling at her phone in a doorway" fill sizes="(min-width: 1024px) 42vw, 100vw" className="photo-doorway object-cover" />
              </div>
            </div>
          </div>
        </section>

        <section id="questions" className="bg-white text-ploy-text-primary">
          <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-24 sm:px-8 md:py-32 lg:grid-cols-12 lg:gap-10 lg:px-10">
            <div className="lg:col-span-4">
              <h2 className="max-w-[10ch] text-balance font-heading text-4xl typography-heading md:text-5xl lg:text-6xl">Questions before you order</h2>
              <p className="mt-5 text-base leading-relaxed font-body text-ploy-text-secondary typography-body md:text-lg">Still unsure? Call <a href="tel:+233544415766" className="font-semibold text-ploy-text-primary underline decoration-ploy-accent-primary decoration-2 underline-offset-4 hover:decoration-ploy-text-primary">+233 54 441 5766</a>.</p>
            </div>
            <dl className="grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:col-span-8">
              {[
                ["Who can order a phone?", "Professionals working with Instaclean. If you're not with Instaclean yet, apply to join first, then come back to order."],
                ["Does sending a slip commit me to anything?", "No. A slip is a request. You only agree to a plan when you sign it at the office."],
                ["How much will I pay?", "It depends on the phone. We confirm the price and your payments at the office, and your plan shows the full cost and every payment date before you sign."],
                ["Do I pay anything on this website?", "No. Nothing is paid online, and no one will ask you for money to send a slip. If someone does, call us on +233 54 441 5766."],
                ["What do I bring to the office?", "Your order slip or reference, your Ghana Card and your Instaclean worker ID."],
                ["Can I ask for a phone that isn't listed?", "Yes. Tell us what you're after when we call, and we'll say what's available."],
              ].map(([title, copy]) => (
                <div key={title}><dt className="font-heading text-xl font-extrabold tracking-tight">{title}</dt><dd className="mt-3 text-lg leading-relaxed text-ploy-text-secondary">{copy}</dd></div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      <footer className="bg-ploy-background-inverse text-white">
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-12 md:py-20 lg:px-10">
          <div className="md:col-span-5">
            <Logo byline />
            <p className="mt-6 max-w-sm text-base leading-relaxed font-body text-ploy-text-inverse-secondary typography-body md:text-lg">Phones on a payment plan for Instaclean professionals. Order here, then finish at our office in Accra.</p>
          </div>
          <nav aria-label="Footer" className="md:col-span-3">
            <p className="font-heading text-lg font-extrabold">Pay2Own</p>
            <ul className="mt-4 space-y-3">
              <li><a href="/#phones" className={footerLink}>Phones</a></li>
              <li><a href="/#how-it-works" className={footerLink}>How it works</a></li>
              <li><a href="/#visit" className={footerLink}>Visit the office</a></li>
              <li><a href="/#questions" className={footerLink}>Questions</a></li>
              <li><a href="/#order" className={footerLink}>Order a phone</a></li>
            </ul>
          </nav>
          <div className="md:col-span-4">
            <p className="font-heading text-lg font-extrabold">Talk to Instaclean</p>
            <ul className="mt-4 space-y-3">
              <li><a href="tel:+233544415766" className={footerLink}>+233 54 441 5766</a></li>
              <li><a href="mailto:info@tryinstaclean.com" className={footerLink}>info@tryinstaclean.com</a></li>
              <li><a href="https://www.tryinstaclean.com/" className={footerLink}>tryinstaclean.com</a></li>
            </ul>
          </div>
        </div>
        <div className="mx-auto w-full max-w-7xl border-t border-white/10 px-5 py-6 sm:px-8 lg:px-10">
          <p className="text-sm leading-relaxed font-body text-ploy-text-inverse-secondary typography-body">© 2026 Instaclean. Pay2Own is an Instaclean programme in Accra, Ghana.</p>
        </div>
      </footer>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-3 p-4 sm:items-end sm:p-6">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast-card pointer-events-auto w-full max-w-sm rounded-card bg-white p-4 text-ploy-text-primary shadow-[0_24px_50px_-28px_rgba(15,26,92,0.7)]">
            <p className="font-heading text-base font-extrabold">{toast.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-ploy-text-secondary">{toast.description}</p>
          </div>
        ))}
      </div>
    </>
  );
}
