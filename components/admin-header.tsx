"use client";

import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";

const quiet =
  "inline-flex h-10 items-center rounded-full border border-white/35 px-4 text-sm font-semibold text-white hover:bg-white/10";
const current =
  "inline-flex h-10 items-center rounded-full bg-white px-4 text-sm font-semibold text-ploy-text-primary";

export function AdminHeader({ section }: { section: "phones" | "orders" }) {
  const router = useRouter();

  async function signOut() {
    sessionStorage.removeItem("pay2own-admin");
    await fetch("/api/admin/session", { method: "DELETE" });
    router.push("/admin/login");
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-ploy-background-inverse text-white">
      <div className="mx-auto flex h-18 w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <Logo imageClassName="h-8 w-auto" />
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white/90">Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <a href="/admin/orders" className={section === "orders" ? current : quiet}>Orders</a>
          <a href="/admin" className={section === "phones" ? current : quiet}>Phones</a>
          <a href="/" className={`${quiet} hidden sm:inline-flex`}>View site</a>
          <button
            type="button"
            onClick={() => void signOut()}
            className="inline-flex h-10 items-center rounded-full bg-ploy-button-primary-background px-4 text-sm font-bold text-ploy-button-primary-text hover:bg-ploy-accent-primary-300"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
