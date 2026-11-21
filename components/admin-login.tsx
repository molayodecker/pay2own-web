"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";

const inputClass =
  "h-13 w-full rounded-input border-2 border-ploy-input-border bg-ploy-input-background px-4 text-base text-ploy-text-primary transition-colors placeholder:text-ploy-neutral-primary-700 focus:border-ploy-text-primary focus:outline-none";

export function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Enter your email address.");
      return;
    }
    if (password.length < 10) {
      setError("Use a password with at least 10 characters.");
      return;
    }
    const response = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setError(body.error || "Sign in didn't go through. Try again.");
      return;
    }
    sessionStorage.setItem("pay2own-admin", "1");
    router.push("/admin");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-ploy-background-inverse px-5 py-16">
      <div className="w-full max-w-md">
        <Logo className="mx-auto mb-8" imageClassName="h-9 w-auto" />
        <div className="rounded-card bg-white p-7 text-ploy-text-primary md:p-9">
          <h1 className="text-balance font-heading text-2xl typography-heading md:text-3xl">
            Admin sign in
          </h1>
          <p className="mt-2 text-base leading-relaxed font-body text-ploy-text-secondary typography-body md:text-lg">
            Sign in with an approved Pay2Own administrator account.
          </p>
          <form noValidate onSubmit={onSubmit} className="mt-7 grid gap-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-ploy-text-primary">
                Email
              </label>
              <input id="email" name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-ploy-text-primary">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClass}
              />
            </div>
            {error ? (
              <p role="alert" className="text-sm font-semibold text-destructive">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-button bg-ploy-button-secondary-background px-6 text-base font-button whitespace-nowrap text-ploy-button-secondary-text typography-button transition-colors duration-200 hover:bg-ploy-neutral-primary-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ploy-text-primary"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
