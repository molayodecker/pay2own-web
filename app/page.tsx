import type { Metadata } from "next";
import { HomePage } from "@/components/home-page";

export const metadata: Metadata = {
  title: "Phones on a payment plan for Instaclean pros | Pay2Own by Instaclean",
  description:
    "Instaclean professionals can order a phone online, then sign a clear payment plan and collect it at the Instaclean office in Accra.",
};

export default function Page() {
  return <HomePage />;
}
