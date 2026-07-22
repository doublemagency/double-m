import type { Metadata } from "next";
import { Manrope, Lora } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});
const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: "Double M Agency | Trusted Recruitment in Kenya",
    template: "%s | Double M Agency",
  },
  description:
    "Careful, human recruitment for homes, farms and businesses. Find genuine opportunities or request screened staff through Double M Agency.",
  icons: {
    icon: "/brand/logo.jpeg",
    shortcut: "/brand/logo.jpeg",
    apple: "/brand/logo.jpeg",
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Double M Agency",
    description: "Right people. Real opportunity.",
    type: "website",
    locale: "en_KE",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${manrope.variable} ${lora.variable}`}>
      <body>{children}</body>
    </html>
  );
}
