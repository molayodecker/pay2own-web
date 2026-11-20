import type { Metadata } from "next";
import { AdminOrders } from "@/components/admin-orders";

export const metadata: Metadata = {
  title: "Orders · Admin | Pay2Own by Instaclean",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminOrders />;
}
