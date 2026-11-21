import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-figtree",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Pay2Own by Instaclean",
    template: "%s",
  },
  description:
    "Instaclean professionals can order a phone online, then sign a clear payment plan and collect it at the Instaclean office in Accra.",
  icons: {
    icon: "/assets/favicon.png",
    apple: "/assets/favicon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#2EA8DF",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GH" className={figtree.variable} data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
