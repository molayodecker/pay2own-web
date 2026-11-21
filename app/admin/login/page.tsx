import type { Metadata } from "next";
import { AdminLogin } from "@/components/admin-login";

export const metadata: Metadata = {
  title: "Admin sign in · Pay2Own | Pay2Own by Instaclean",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminLogin />;
}
