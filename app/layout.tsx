import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vance Medical Foods — Medical Foods for Gastrointestinal Health",
  description:
    "Vance Medical Foods Ltd develops medical foods for the dietary management of gastrointestinal conditions. Makers of EPAVANCE and the forthcoming BVANCE butyrate capsule. Part of the SLA Pharma group.",
  metadataBase: new URL("https://www.vancemedical.co.uk"),
  openGraph: {
    title: "Vance Medical Foods — Medical Foods for Gastrointestinal Health",
    description:
      "Specialist medical foods for the dietary management of gastrointestinal conditions.",
    url: "https://www.vancemedical.co.uk",
    siteName: "Vance Medical Foods",
    type: "website",
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
