import type { Metadata } from "next";
import { AdminPhones } from "@/components/admin-phones";

export const metadata: Metadata = {
  title: "Phones · Admin | Pay2Own by Instaclean",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminPhones />;
}
